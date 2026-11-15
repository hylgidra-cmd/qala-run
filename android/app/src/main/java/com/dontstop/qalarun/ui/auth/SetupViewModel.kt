package com.dontstop.qalarun.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.dontstop.qalarun.data.api.ApiResult
import com.dontstop.qalarun.data.api.ProfileUpdate
import com.dontstop.qalarun.data.auth.AuthRepository
import com.dontstop.qalarun.data.auth.SessionState
import com.dontstop.qalarun.model.City
import com.dontstop.qalarun.model.Nickname
import com.dontstop.qalarun.model.TerritoryColor
import com.dontstop.qalarun.ui.UiError
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SetupUiState(
    val playerId: String = "",
    val nickname: String = "",
    val color: TerritoryColor = TerritoryColor.Default,
    val city: City = City.Default,
    /** A data URL, or null for no picture. */
    val avatar: String? = null,
    val saving: Boolean = false,
    val error: UiError? = null,
) {
    val nicknameValid: Boolean get() = Nickname.isValid(nickname)
    val canSubmit: Boolean get() = nicknameValid && !saving
}

@HiltViewModel
class SetupViewModel @Inject constructor(
    private val auth: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(initialState())
    val state: StateFlow<SetupUiState> = _state.asStateFlow()

    /** Starts from what the account already has: Google's name, the server's defaults. */
    private fun initialState(): SetupUiState {
        val player = (auth.state.value as? SessionState.NeedsSetup)?.player ?: return SetupUiState()
        return SetupUiState(
            playerId = player.playerId,
            nickname = player.displayName.take(Nickname.MAX),
            color = TerritoryColor.fromHex(player.colorHex) ?: TerritoryColor.Default,
            city = City.fromId(player.cityId),
            avatar = player.avatarData,
        )
    }

    fun onNickname(value: String) {
        // Longer input is cut rather than rejected: the field never holds a
        // name the server would refuse for length.
        _state.update { it.copy(nickname = value.take(Nickname.MAX), error = null) }
    }

    fun onColor(color: TerritoryColor) = _state.update { it.copy(color = color) }

    fun onCity(city: City) = _state.update { it.copy(city = city) }

    fun onAvatar(dataUrl: String?) {
        _state.update {
            if (dataUrl == null) it.copy(error = UiError.Avatar) else it.copy(avatar = dataUrl, error = null)
        }
    }

    fun submit() {
        val current = _state.value
        if (!current.canSubmit) return
        _state.update { it.copy(saving = true, error = null) }

        viewModelScope.launch {
            val result = auth.completeSetup(
                ProfileUpdate(
                    displayName = current.nickname.trim(),
                    colorHex = current.color.hex,
                    city = current.city.id,
                    avatarData = current.avatar,
                ),
            )
            _state.update {
                it.copy(
                    saving = false,
                    error = (result as? ApiResult.Failure)?.let { failure -> UiError.from(failure.reason) },
                )
            }
        }
    }

    /** Back from setup means "not this account": the session is dropped. */
    fun cancel() {
        viewModelScope.launch { auth.signOut() }
    }
}
