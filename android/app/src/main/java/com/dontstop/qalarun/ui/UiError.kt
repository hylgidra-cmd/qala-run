package com.dontstop.qalarun.ui

import androidx.annotation.StringRes
import com.dontstop.qalarun.R
import com.dontstop.qalarun.data.api.ApiFailure

/** A problem worded for the player. Server text is never shown as it is. */
enum class UiError(@param:StringRes val message: Int) {
    Offline(R.string.error_offline),
    GoogleNotConfigured(R.string.error_google_not_configured),
    GoogleFailed(R.string.error_google_failed),
    ServerUnavailable(R.string.error_server_unavailable),
    SessionExpired(R.string.error_session_expired),
    Avatar(R.string.error_avatar),
    Unexpected(R.string.error_unexpected),
    ;

    companion object {
        fun from(failure: ApiFailure): UiError = when (failure) {
            ApiFailure.Offline -> Offline
            ApiFailure.Unauthorized -> SessionExpired
            ApiFailure.Unavailable -> ServerUnavailable
            is ApiFailure.Rejected, ApiFailure.Unexpected -> Unexpected
        }
    }
}
