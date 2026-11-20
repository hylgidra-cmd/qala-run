package com.dontstop.qalarun.ui.auth

import androidx.activity.compose.LocalActivity
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.dontstop.qalarun.R
import com.dontstop.qalarun.ui.AppLanguage
import com.dontstop.qalarun.ui.components.ErrorText
import com.dontstop.qalarun.ui.components.PrimaryButton
import com.dontstop.qalarun.ui.components.SecondaryButton
import com.dontstop.qalarun.ui.theme.DontStopIcons
import com.dontstop.qalarun.ui.theme.NumberFamily

/** Screen 1 of the design: what the game is, the language, and the way in. */
@Composable
fun WelcomeRoute(viewModel: WelcomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val activity = LocalActivity.current

    WelcomeScreen(
        state = state,
        language = AppLanguage.current(),
        onLanguage = AppLanguage::select,
        onGoogle = { activity?.let(viewModel::signInWithGoogle) },
        onBrowse = viewModel::browseAsGuest,
    )
}

@Composable
fun WelcomeScreen(
    state: WelcomeUiState,
    language: AppLanguage,
    onLanguage: (AppLanguage) -> Unit,
    onGoogle: () -> Unit,
    onBrowse: () -> Unit,
) {
    // On a tall phone the actions sit at the bottom; on a short one, or with
    // large text, the whole screen scrolls instead of clipping.
    BoxWithConstraints(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .safeDrawingPadding(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .heightIn(min = maxHeight)
                .padding(start = 24.dp, end = 24.dp, top = 16.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
                Brand()
                LoopIllustration()
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = stringResource(R.string.welcome_headline),
                        style = MaterialTheme.typography.headlineLarge,
                        color = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.semantics { heading() },
                    )
                    Text(
                        text = stringResource(R.string.welcome_lead),
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                LanguagePicker(selected = language, onSelect = onLanguage)
            }

            Column(
                modifier = Modifier.padding(top = 24.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                state.error?.let { ErrorText(it) }
                PrimaryButton(
                    text = stringResource(
                        if (state.signingIn) R.string.signing_in else R.string.sign_in_google,
                    ),
                    onClick = onGoogle,
                    enabled = !state.signingIn,
                    icon = DontStopIcons.Account,
                )
                SecondaryButton(
                    text = stringResource(R.string.browse_map_first),
                    onClick = onBrowse,
                    enabled = !state.signingIn,
                )
                Text(
                    text = stringResource(R.string.welcome_terms),
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Normal),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp),
                )
            }
        }
    }
}

@Composable
private fun Brand() {
    val name = stringResource(R.string.app_name)

    Row(
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        // Read once as the app's name rather than as "DS" and then the name.
        modifier = Modifier.clearAndSetSemantics { contentDescription = name },
    ) {
        Box(
            modifier = Modifier
                .size(44.dp)
                .background(MaterialTheme.colorScheme.inverseSurface, RoundedCornerShape(14.dp)),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = "DS",
                // inversePrimary, not primary: at night lime on this pale
                // tile would be unreadable.
                color = MaterialTheme.colorScheme.inversePrimary,
                fontFamily = NumberFamily,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
            )
        }
        Text(
            text = name,
            style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold, fontSize = 20.sp),
            color = MaterialTheme.colorScheme.onBackground,
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun LanguagePicker(selected: AppLanguage, onSelect: (AppLanguage) -> Unit) {
    val label = stringResource(R.string.language_label)

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(
            text = label.uppercase(),
            style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.sp),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .selectableGroup()
                .semantics { contentDescription = label },
        ) {
            AppLanguage.entries.forEach { language ->
                LanguageChip(language, isSelected = language == selected, onClick = { onSelect(language) })
            }
        }
    }
}

@Composable
private fun LanguageChip(language: AppLanguage, isSelected: Boolean, onClick: () -> Unit) {
    val shape = RoundedCornerShape(12.dp)
    val ink = MaterialTheme.colorScheme.onBackground

    Surface(
        shape = shape,
        color = if (isSelected) ink else MaterialTheme.colorScheme.surface,
        contentColor = if (isSelected) MaterialTheme.colorScheme.background else ink,
        border = BorderStroke(1.dp, if (isSelected) ink else MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier
            // 48 dp to touch, as everywhere; the design's 40 dp chip was too small for a thumb.
            .heightIn(min = 48.dp)
            .selectable(selected = isSelected, role = Role.RadioButton, onClick = onClick),
    ) {
        Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(horizontal = 14.dp)) {
            Text(
                text = language.nativeName,
                style = MaterialTheme.typography.labelLarge.copy(
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal,
                ),
            )
        }
    }
}
