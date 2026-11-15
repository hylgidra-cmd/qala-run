package com.dontstop.qalarun

import com.dontstop.qalarun.data.auth.AuthRepository
import com.dontstop.qalarun.data.auth.GoogleSignInResult
import com.dontstop.qalarun.data.auth.SessionState
import com.dontstop.qalarun.model.City
import com.dontstop.qalarun.model.TerritoryColor
import com.dontstop.qalarun.ui.UiError
import com.dontstop.qalarun.ui.auth.SetupViewModel
import com.dontstop.qalarun.ui.auth.WelcomeUiState
import com.dontstop.qalarun.ui.auth.WelcomeViewModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ViewModelTest {

    private val api = FakeApi()
    private val store = MemorySessionStore()
    private val repository = AuthRepository(api, store)

    // Only handed through to the fake; unit tests get Android's stub classes.
    private val activity = android.app.Activity()

    @Before
    fun setMain() = Dispatchers.setMain(UnconfinedTestDispatcher())

    @After
    fun resetMain() = Dispatchers.resetMain()

    private fun welcome(result: GoogleSignInResult) = WelcomeViewModel(repository, FakeGoogleSignIn(result))

    @Test
    fun `a google token signs the player in`() = runTest {
        api.onSignIn = { FakeApi.auth(isNew = true) }
        val viewModel = welcome(GoogleSignInResult.Token("google-id-token"))

        viewModel.signInWithGoogle(activity)

        assertEquals(WelcomeUiState(), viewModel.state.value)
        assertTrue(repository.state.value is SessionState.NeedsSetup)
    }

    @Test
    fun `closing google's sheet is not an error`() = runTest {
        val viewModel = welcome(GoogleSignInResult.Cancelled)

        viewModel.signInWithGoogle(activity)

        assertEquals(WelcomeUiState(), viewModel.state.value)
    }

    @Test
    fun `each way sign-in can fail has its own message`() = runTest {
        val notConfigured = welcome(GoogleSignInResult.NotConfigured).apply { signInWithGoogle(activity) }
        val failed = welcome(GoogleSignInResult.Failed).apply { signInWithGoogle(activity) }
        api.onSignIn = { FakeApi.offline() }
        val offline = welcome(GoogleSignInResult.Token("t")).apply { signInWithGoogle(activity) }
        api.onSignIn = { throw httpError(503) }
        val switchedOff = welcome(GoogleSignInResult.Token("t")).apply { signInWithGoogle(activity) }

        assertEquals(UiError.GoogleNotConfigured, notConfigured.state.value.error)
        assertEquals(UiError.GoogleFailed, failed.state.value.error)
        assertEquals(UiError.Offline, offline.state.value.error)
        assertEquals(UiError.ServerUnavailable, switchedOff.state.value.error)
        assertFalse(offline.state.value.signingIn)
    }

    private suspend fun setup(googleName: String = "Runner"): SetupViewModel {
        api.onSignIn = { FakeApi.auth(isNew = true, name = googleName) }
        repository.signInWithGoogle("t")
        return SetupViewModel(repository)
    }

    @Test
    fun `setup starts from the account's own name and id`() = runTest {
        val state = setup("Azamat").state.value

        assertEquals("Azamat", state.nickname)
        assertEquals("48201937", state.playerId)
        // The server's default green is not one of the twelve, so the first is offered.
        assertEquals(TerritoryColor.Mint, state.color)
        assertEquals(City.Nukus, state.city)
        assertTrue(state.canSubmit)
    }

    @Test
    fun `a nickname has to be 2 to 24 characters`() = runTest {
        val viewModel = setup()

        viewModel.onNickname(" a ")
        assertFalse(viewModel.state.value.canSubmit)

        viewModel.onNickname("x".repeat(40))
        assertEquals(24, viewModel.state.value.nickname.length)
        assertTrue(viewModel.state.value.canSubmit)
    }

    @Test
    fun `submitting sends the choices and opens the game`() = runTest {
        val viewModel = setup()
        api.onUpdate = { FakeApi.me(name = "Shamol_07", color = "#2F6BFF", city = "almaty") }

        viewModel.onNickname("  Shamol_07 ")
        viewModel.onColor(TerritoryColor.Blue)
        viewModel.onCity(City.Almaty)
        viewModel.submit()

        val sent = api.updates.single()
        assertEquals("Shamol_07", sent.displayName)
        assertEquals("#2F6BFF", sent.colorHex)
        assertEquals("almaty", sent.city)
        assertNull(sent.avatarData)
        assertTrue(repository.state.value is SessionState.SignedIn)
    }

    @Test
    fun `a failed save shows why and can be retried`() = runTest {
        val viewModel = setup()
        api.onUpdate = { FakeApi.offline() }

        viewModel.submit()

        assertEquals(UiError.Offline, viewModel.state.value.error)
        assertTrue(viewModel.state.value.canSubmit)
        assertTrue(repository.state.value is SessionState.NeedsSetup)
    }

    @Test
    fun `an unreadable picture is reported and the old one kept`() = runTest {
        val viewModel = setup()
        viewModel.onAvatar("data:image/jpeg;base64,AAAA")

        viewModel.onAvatar(null)

        assertEquals(UiError.Avatar, viewModel.state.value.error)
        assertEquals("data:image/jpeg;base64,AAAA", viewModel.state.value.avatar)
    }

    @Test
    fun `backing out of setup drops the session`() = runTest {
        val viewModel = setup()

        viewModel.cancel()

        assertEquals(SessionState.SignedOut, repository.state.value)
        assertNull(store.stored)
    }
}
