package com.dontstop.qalarun.ui.components

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.dontstop.qalarun.ui.UiError

/** A problem, said once to a screen reader when it appears. */
@Composable
fun ErrorText(error: UiError, modifier: Modifier = Modifier) {
    Text(
        text = stringResource(error.message),
        color = MaterialTheme.colorScheme.error,
        style = MaterialTheme.typography.bodyMedium,
        modifier = modifier.semantics { liveRegion = LiveRegionMode.Polite },
    )
}
