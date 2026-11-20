package com.dontstop.qalarun

import com.dontstop.qalarun.data.api.ApiFailure
import com.dontstop.qalarun.data.api.ApiResult
import com.dontstop.qalarun.data.api.GoogleAuthRequest
import com.dontstop.qalarun.data.api.ProfileUpdate
import com.dontstop.qalarun.data.api.apiCall
import com.dontstop.qalarun.data.api.detailOf
import com.dontstop.qalarun.data.auth.AuthInterceptor
import com.dontstop.qalarun.data.auth.TokenSource
import com.dontstop.qalarun.di.createApi
import kotlinx.coroutines.test.runTest
import okhttp3.OkHttpClient
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** The real HTTP stack against a local server: paths, JSON and failures. */
class ApiClientTest {

    private val server = MockWebServer()
    private var token: String? = null
    private val tokens = object : TokenSource {
        override val token: String? get() = this@ApiClientTest.token
    }
    private val api = createApi(
        server.url("/api/v1/").toString(),
        OkHttpClient.Builder().addInterceptor(AuthInterceptor { tokens }).build(),
    )

    @After
    fun stop() = server.shutdown()

    private fun json(body: String, code: Int = 200) =
        MockResponse().setResponseCode(code).setHeader("Content-Type", "application/json").setBody(body)

    @Test
    fun `sign-in sends only the id token and reads the new-account flag`() = runTest {
        server.enqueue(
            json(
                """{"token":"jwt","user_id":"u1","player_id":"48201937","display_name":"Runner",
                   "email":"runner@gmail.com","color_hex":"#00ff88","city":"nukus",
                   "avatar_data":null,"is_new":true,"added_later":1}""",
            ),
        )

        val auth = api.signInWithGoogle(GoogleAuthRequest("google-id-token"))

        val request = server.takeRequest()
        assertEquals("/api/v1/auth/google", request.path)
        assertEquals("""{"id_token":"google-id-token"}""", request.body.readUtf8())
        assertNull(request.getHeader("Authorization"))
        assertTrue(auth.isNew)
        assertEquals("48201937", auth.playerId)
    }

    @Test
    fun `an older server without the flag means a returning player`() = runTest {
        server.enqueue(
            json("""{"token":"jwt","user_id":"u1","player_id":"1","display_name":"R","color_hex":"#00ff88"}"""),
        )

        assertEquals(false, api.signInWithGoogle(GoogleAuthRequest("t")).isNew)
    }

    @Test
    fun `calls carry the session token once there is one`() = runTest {
        token = "jwt-1"
        server.enqueue(json("""{"user_id":"u1","player_id":"1","display_name":"R"}"""))

        api.me()

        assertEquals("Bearer jwt-1", server.takeRequest().getHeader("Authorization"))
    }

    @Test
    fun `a profile update leaves out what is not being changed`() = runTest {
        server.enqueue(json("""{"user_id":"u1","player_id":"1","display_name":"Shamol"}"""))

        api.updateProfile(ProfileUpdate(displayName = "Shamol", city = "nukus"))

        val request = server.takeRequest()
        assertEquals("PATCH", request.method)
        assertEquals("""{"display_name":"Shamol","city":"nukus"}""", request.body.readUtf8())
    }

    @Test
    fun `failures are told apart`() = runTest {
        server.enqueue(json("""{"detail":"Noto'g'ri token"}""", 401))
        server.enqueue(json("""{"detail":"Google orqali kirish sozlanmagan"}""", 503))
        server.enqueue(MockResponse().setResponseCode(502).setBody("<!doctype html>"))
        server.enqueue(json("""{"detail":[{"msg":"String should have at least 2 characters"}]}""", 422))
        server.enqueue(json("""{"oops":true}""", 500))
        server.enqueue(json("""<html>not json</html>"""))

        val results = List(6) { apiCall { api.me() } }.map { (it as ApiResult.Failure).reason }

        assertEquals(
            listOf(
                ApiFailure.Unauthorized,
                ApiFailure.Unavailable,
                ApiFailure.Offline,
                ApiFailure.Rejected(422, "String should have at least 2 characters"),
                ApiFailure.Unexpected,
                ApiFailure.Unexpected,
            ),
            results,
        )
    }

    @Test
    fun `a server that cannot be reached is offline`() = runTest {
        server.shutdown()

        assertEquals(ApiResult.Failure(ApiFailure.Offline), apiCall { api.me() })
    }

    @Test
    fun `the reason is read from either shape FastAPI uses`() {
        assertEquals("Bu username band", detailOf("""{"detail":"Bu username band"}"""))
        assertEquals("too short", detailOf("""{"detail":[{"msg":"too short","type":"x"}]}"""))
        assertNull(detailOf("<!doctype html>"))
        assertNull(detailOf(""))
        assertNull(detailOf("""{"detail":{"nested":1}}"""))
    }
}
