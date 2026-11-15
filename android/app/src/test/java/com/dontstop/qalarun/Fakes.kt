package com.dontstop.qalarun

import android.app.Activity
import com.dontstop.qalarun.data.api.AuthResponse
import com.dontstop.qalarun.data.api.DontStopApi
import com.dontstop.qalarun.data.api.GoogleAuthRequest
import com.dontstop.qalarun.data.api.MeResponse
import com.dontstop.qalarun.data.api.ProfileUpdate
import com.dontstop.qalarun.data.auth.GoogleSignIn
import com.dontstop.qalarun.data.auth.GoogleSignInResult
import com.dontstop.qalarun.data.session.SessionStore
import com.dontstop.qalarun.data.session.StoredSession
import java.io.IOException
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.ResponseBody.Companion.toResponseBody
import retrofit2.HttpException
import retrofit2.Response

fun httpError(code: Int, body: String = "{}"): HttpException =
    HttpException(Response.error<Any>(code, body.toResponseBody("application/json".toMediaType())))

/** The API as a script: each call does what the test set it to do. */
class FakeApi : DontStopApi {
    var onSignIn: (GoogleAuthRequest) -> AuthResponse = { error("signInWithGoogle not expected") }
    var onMe: () -> MeResponse = { error("me not expected") }
    var onUpdate: (ProfileUpdate) -> MeResponse = { error("updateProfile not expected") }

    val updates = mutableListOf<ProfileUpdate>()

    override suspend fun signInWithGoogle(body: GoogleAuthRequest) = onSignIn(body)

    override suspend fun me() = onMe()

    override suspend fun updateProfile(body: ProfileUpdate): MeResponse {
        updates += body
        return onUpdate(body)
    }

    companion object {
        fun auth(isNew: Boolean, name: String = "Runner") = AuthResponse(
            token = "jwt-1",
            userId = "u1",
            playerId = "48201937",
            displayName = name,
            colorHex = "#00ff88",
            city = "nukus",
            isNew = isNew,
        )

        fun me(name: String = "Runner", color: String = "#00ff88", city: String = "nukus") =
            MeResponse(userId = "u1", playerId = "48201937", displayName = name, colorHex = color, city = city)

        val offline: () -> Nothing = { throw IOException("no route to host") }
    }
}

class MemorySessionStore(var stored: StoredSession? = null) : SessionStore {
    override suspend fun read() = stored

    override suspend fun write(session: StoredSession) {
        stored = session
    }

    override suspend fun clear() {
        stored = null
    }
}

class FakeGoogleSignIn(var result: GoogleSignInResult) : GoogleSignIn {
    override val isConfigured = true

    override suspend fun requestIdToken(activity: Activity) = result
}
