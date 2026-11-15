package com.dontstop.qalarun.ui.auth

import android.app.Activity
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dontstop.qalarun.data.api.ApiResult
import com.dontstop.qalarun.data.auth.AuthRepository
import com.dontstop.qalarun.data.auth.GoogleSignIn
import com.dontstop.qalarun.data.auth.GoogleSignInResult
import com.dontstop.qalarun.ui.UiError
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WelcomeUiState(
    val signingIn: Boolean = false,
    val error: UiError? = null,
)

@HiltViewModel
class WelcomeViewModel @Inject constructor(
    private val auth: AuthRepository,
    private val google: GoogleSignIn,
) : ViewModel() {

    private val _state = MutableStateFlow(WelcomeUiState())
    val state: StateFlow<WelcomeUiState> = _state.asStateFlow()

    /**
     * Asks Google for an ID token and trades it for a session. On success the
     * session state changes and this screen is replaced, so there is nothing
     * to navigate to here.
     */
    fun signInWithGoogle(activity: Activity) {
        if (_state.value.signingIn) return
        _state.value = WelcomeUiState(signingIn = true)

        viewModelScope.launch {
            val error = when (val google = google.requestIdToken(activity)) {
                is GoogleSignInResult.Token -> when (val result = auth.signInWithGoogle(google.idToken)) {
                    is ApiResult.Success -> null
                    is ApiResult.Failure -> UiError.from(result.reason)
                }
                // Closing Google's sheet is a choice, not a failure.
                GoogleSignInResult.Cancelled -> null
                GoogleSignInResult.NotConfigured -> UiError.GoogleNotConfigured
                GoogleSignInResult.Failed -> UiError.GoogleFailed
            }
            _state.update { WelcomeUiState(signingIn = false, error = error) }
        }
    }

    fun browseAsGuest() = auth.browseAsGuest()
}
