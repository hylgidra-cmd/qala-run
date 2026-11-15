package com.dontstop.qalarun

import com.dontstop.qalarun.data.api.ApiFailure
import com.dontstop.qalarun.data.api.ApiResult
import com.dontstop.qalarun.data.api.ProfileUpdate
import com.dontstop.qalarun.data.auth.AuthRepository
import com.dontstop.qalarun.data.auth.SessionState
import com.dontstop.qalarun.data.session.StoredSession
import com.dontstop.qalarun.model.Player
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthRepositoryTest {

    private val api = FakeApi()
    private val store = MemorySessionStore()
    private val repository = AuthRepository(api, store)

    private val player = Player("u1", "48201937", "Runner", "#00ff88", "nukus")

    @Test
    fun `nothing stored means signed out`() = runTest {
        repository.restore()

        assertEquals(SessionState.SignedOut, repository.state.value)
        assertNull(repository.token)
    }

    @Test
    fun `a new account goes to setup and the session is stored`() = runTest {
        api.onSignIn = { request ->
            assertEquals("google-id-token", request.idToken)
            FakeApi.auth(isNew = true)
        }

        val result = repository.signInWithGoogle("google-id-token")

        assertTrue(result is ApiResult.Success)
        assertEquals(SessionState.NeedsSetup(player), repository.state.value)
        assertEquals("jwt-1", repository.token)
        assertEquals(StoredSession("jwt-1", player, needsSetup = true), store.stored)
    }

    @Test
    fun `a returning account goes straight in`() = runTest {
        api.onSignIn = { FakeApi.auth(isNew = false) }

        repository.signInWithGoogle("t")

        assertEquals(SessionState.SignedIn(player), repository.state.value)
    }

    @Test
    fun `a refused sign-in leaves the player signed out`() = runTest {
        repository.restore()
        api.onSignIn = { throw httpError(503) }

        val result = repository.signInWithGoogle("t")

        assertEquals(ApiResult.Failure(ApiFailure.Unavailable), result)
        assertEquals(SessionState.SignedOut, repository.state.value)
        assertNull(store.stored)
    }

    @Test
    fun `setup that was interrupted resumes after a restart`() = runTest {
        store.stored = StoredSession("jwt-1", player, needsSetup = true)
        api.onMe = { FakeApi.me() }

        repository.restore()

        assertEquals(SessionState.NeedsSetup(player), repository.state.value)
    }

    @Test
    fun `finishing setup saves the profile and lets the player in`() = runTest {
        api.onSignIn = { FakeApi.auth(isNew = true) }
        api.onUpdate = { FakeApi.me(name = "Shamol_07", color = "#2F6BFF", city = "tashkent") }
        repository.signInWithGoogle("t")

        val update = ProfileUpdate(displayName = "Shamol_07", colorHex = "#2F6BFF", city = "tashkent")
        val result = repository.completeSetup(update)

        val saved = Player("u1", "48201937", "Shamol_07", "#2F6BFF", "tashkent")
        assertTrue(result is ApiResult.Success)
        assertEquals(listOf(update), api.updates)
        assertEquals(SessionState.SignedIn(saved), repository.state.value)
        assertEquals(StoredSession("jwt-1", saved, needsSetup = false), store.stored)
    }

    @Test
    fun `a failed save keeps the player on setup`() = runTest {
        api.onSignIn = { FakeApi.auth(isNew = true) }
        api.onUpdate = { FakeApi.offline() }
        repository.signInWithGoogle("t")

        val result = repository.completeSetup(ProfileUpdate(displayName = "Shamol_07"))

        assertEquals(ApiResult.Failure(ApiFailure.Offline), result)
        assertEquals(SessionState.NeedsSetup(player), repository.state.value)
    }

    @Test
    fun `an offline phone stays signed in on what it has`() = runTest {
        store.stored = StoredSession("jwt-1", player, needsSetup = false)
        api.onMe = { FakeApi.offline() }

        repository.restore()

        assertEquals(SessionState.SignedIn(player), repository.state.value)
        assertEquals("jwt-1", repository.token)
    }

    @Test
    fun `restore picks up a profile changed elsewhere`() = runTest {
        store.stored = StoredSession("jwt-1", player, needsSetup = false)
        api.onMe = { FakeApi.me(name = "Renamed on the web") }

        repository.restore()

        assertEquals(
            SessionState.SignedIn(player.copy(displayName = "Renamed on the web")),
            repository.state.value,
        )
    }

    @Test
    fun `a session the server rejects is dropped`() = runTest {
        store.stored = StoredSession("expired", player, needsSetup = false)
        api.onMe = { throw httpError(401) }

        repository.restore()

        assertEquals(SessionState.SignedOut, repository.state.value)
        assertNull(repository.token)
        assertNull(store.stored)
    }

    @Test
    fun `a guest can look around and then go back to sign in`() = runTest {
        repository.restore()

        repository.browseAsGuest()
        assertEquals(SessionState.Guest, repository.state.value)

        repository.leaveGuestMode()
        assertEquals(SessionState.SignedOut, repository.state.value)
    }

    @Test
    fun `signing out forgets everything`() = runTest {
        api.onSignIn = { FakeApi.auth(isNew = false) }
        repository.signInWithGoogle("t")

        repository.signOut()

        assertEquals(SessionState.SignedOut, repository.state.value)
        assertNull(repository.token)
        assertNull(store.stored)
    }
}
