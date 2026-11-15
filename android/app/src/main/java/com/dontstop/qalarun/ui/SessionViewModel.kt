package com.dontstop.qalarun.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dontstop.qalarun.data.auth.AuthRepository
import com.dontstop.qalarun.data.auth.SessionState
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

/** Decides which part of the app is on screen: welcome, setup or the game. */
@HiltViewModel
class SessionViewModel @Inject constructor(
    private val auth: AuthRepository,
) : ViewModel() {

    val state: StateFlow<SessionState> = auth.state

    init {
        if (auth.state.value == SessionState.Loading) {
            viewModelScope.launch { auth.restore() }
        }
    }

    fun signOut() {
        viewModelScope.launch { auth.signOut() }
    }

    fun leaveGuestMode() = auth.leaveGuestMode()
}
