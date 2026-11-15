package com.dontstop.qalarun.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBars
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.dontstop.qalarun.R
import com.dontstop.qalarun.data.auth.SessionState
import com.dontstop.qalarun.ui.components.PrimaryButton
import com.dontstop.qalarun.ui.components.SecondaryButton
import com.dontstop.qalarun.ui.theme.Dimens
import com.dontstop.qalarun.ui.theme.NumberStyle

/**
 * The Profile tab until its own stage: who is signed in, and the way out, so
 * the sign-in flow can be gone through from both ends.
 */
@Composable
fun AccountStub(session: SessionState, onSignIn: () -> Unit, onSignOut: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .windowInsetsPadding(WindowInsets.statusBars)
            .padding(horizontal = Dimens.ScreenPadding, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(
            text = stringResource(R.string.tab_profile),
            style = MaterialTheme.typography.headlineSmall,
            color = MaterialTheme.colorScheme.onBackground,
            modifier = Modifier.semantics { heading() },
        )
        if (session is SessionState.SignedIn) {
            Text(
                text = session.player.displayName,
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                text = "DS-${session.player.playerId}",
                style = NumberStyle.Small,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            SecondaryButton(stringResource(R.string.action_sign_out), onClick = onSignOut)
        } else {
            Text(
                text = stringResource(R.string.guest_prompt),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            PrimaryButton(stringResource(R.string.action_sign_in), onClick = onSignIn)
        }
    }
}
