package com.dontstop.qalarun.ui.auth

import androidx.activity.compose.BackHandler
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts.PickVisualMedia
import androidx.annotation.StringRes
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
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
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.graphics.toColorInt
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.dontstop.qalarun.R
import com.dontstop.qalarun.model.City
import com.dontstop.qalarun.model.TerritoryColor
import com.dontstop.qalarun.ui.components.ErrorText
import com.dontstop.qalarun.ui.components.PrimaryButton
import com.dontstop.qalarun.ui.theme.Dimens
import com.dontstop.qalarun.ui.theme.DontStopIcons
import com.dontstop.qalarun.ui.theme.NumberStyle
import kotlinx.coroutines.launch

/** Screen 2 of the design: the name, colour and city everyone will see. */
@Composable
fun SetupRoute(viewModel: SetupViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // The system photo picker: it needs no storage permission, and the app
    // only ever sees the one picture the player chose.
    val picker = rememberLauncherForActivityResult(PickVisualMedia()) { uri ->
        if (uri != null) {
            scope.launch { viewModel.onAvatar(Avatar.fromUri(context, uri)) }
        }
    }

    BackHandler(onBack = viewModel::cancel)

    SetupScreen(
        state = state,
        onBack = viewModel::cancel,
        onPickAvatar = { picker.launch(PickVisualMediaRequest(PickVisualMedia.ImageOnly)) },
        onNickname = viewModel::onNickname,
        onColor = viewModel::onColor,
        onCity = viewModel::onCity,
        onSubmit = viewModel::submit,
    )
}

@Composable
fun SetupScreen(
    state: SetupUiState,
    onBack: () -> Unit,
    onPickAvatar: () -> Unit,
    onNickname: (String) -> Unit,
    onColor: (TerritoryColor) -> Unit,
    onCity: (City) -> Unit,
    onSubmit: () -> Unit,
) {
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
                .padding(start = 24.dp, end = 24.dp, top = 12.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(22.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BackButton(onBack)
                    Text(
                        text = stringResource(R.string.setup_step),
                        style = MaterialTheme.typography.labelLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = stringResource(R.string.setup_title),
                        style = MaterialTheme.typography.headlineMedium,
                        color = MaterialTheme.colorScheme.onBackground,
                        modifier = Modifier.semantics { heading() },
                    )
                    Text(
                        text = stringResource(R.string.setup_lead),
                        style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Identity(state.avatar, state.playerId, onPickAvatar)
                NicknameField(state.nickname, state.nicknameValid, onNickname)
                ColorPicker(state.color, onColor)
                CityPicker(state.city, onCity)
            }

            Column(
                modifier = Modifier.padding(top = 22.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                TrialNotice()
                state.error?.let { ErrorText(it) }
                PrimaryButton(
                    text = stringResource(if (state.saving) R.string.saving else R.string.start_game),
                    onClick = onSubmit,
                    enabled = state.canSubmit,
                )
            }
        }
    }
}

@Composable
private fun BackButton(onBack: () -> Unit) {
    val label = stringResource(R.string.action_back)

    Surface(
        onClick = onBack,
        shape = MaterialTheme.shapes.small,
        color = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface,
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        modifier = Modifier
            .size(Dimens.MinTouch)
            .semantics { contentDescription = label },
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(DontStopIcons.Back, contentDescription = null, modifier = Modifier.size(20.dp))
        }
    }
}

@Composable
private fun Identity(avatar: String?, playerId: String, onPickAvatar: () -> Unit) {
    val picture = remember(avatar) { Avatar.toBitmap(avatar)?.asImageBitmap() }
    val shape = RoundedCornerShape(28.dp)
    val dash = MaterialTheme.colorScheme.outline
    val label = stringResource(if (picture == null) R.string.avatar_pick else R.string.avatar_change)

    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(84.dp)
                .clip(shape)
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .drawBehind {
                    if (picture == null) {
                        drawRoundRect(
                            color = dash,
                            cornerRadius = CornerRadius(28.dp.toPx()),
                            style = Stroke(
                                width = 2.dp.toPx(),
                                pathEffect = PathEffect.dashPathEffect(floatArrayOf(6.dp.toPx(), 5.dp.toPx())),
                            ),
                        )
                    }
                }
                .clickable(role = Role.Button, onClickLabel = label, onClick = onPickAvatar)
                .semantics { contentDescription = label },
            contentAlignment = Alignment.Center,
        ) {
            if (picture == null) {
                Icon(
                    DontStopIcons.Camera,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(30.dp),
                )
            } else {
                Image(picture, contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize())
            }
        }
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = stringResource(R.string.player_id_label).uppercase(),
                style = MaterialTheme.typography.labelMedium.copy(letterSpacing = 1.sp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = "DS-$playerId",
                style = NumberStyle.Medium,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                text = stringResource(R.string.player_id_hint),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun NicknameField(value: String, valid: Boolean, onChange: (String) -> Unit) {
    val focus = LocalFocusManager.current

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedTextField(
            value = value,
            onValueChange = onChange,
            label = { Text(stringResource(R.string.nickname_label)) },
            singleLine = true,
            isError = value.isNotEmpty() && !valid,
            supportingText = { Text(stringResource(R.string.nickname_rule)) },
            textStyle = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold, fontSize = 17.sp),
            shape = MaterialTheme.shapes.small,
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Words,
                imeAction = ImeAction.Done,
            ),
            keyboardActions = KeyboardActions(onDone = { focus.clearFocus() }),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = MaterialTheme.colorScheme.surface,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                errorContainerColor = MaterialTheme.colorScheme.surface,
                focusedBorderColor = MaterialTheme.colorScheme.tertiary,
                focusedLabelColor = MaterialTheme.colorScheme.tertiary,
                cursorColor = MaterialTheme.colorScheme.tertiary,
                unfocusedBorderColor = MaterialTheme.colorScheme.outline,
            ),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@StringRes
private fun TerritoryColor.label(): Int = when (this) {
    TerritoryColor.Mint -> R.string.color_mint
    TerritoryColor.Blue -> R.string.color_blue
    TerritoryColor.Gold -> R.string.color_gold
    TerritoryColor.Orange -> R.string.color_orange
    TerritoryColor.Violet -> R.string.color_violet
    TerritoryColor.Pink -> R.string.color_pink
    TerritoryColor.Sky -> R.string.color_sky
    TerritoryColor.Lime -> R.string.color_lime
    TerritoryColor.Rose -> R.string.color_rose
    TerritoryColor.Teal -> R.string.color_teal
    TerritoryColor.Brown -> R.string.color_brown
    TerritoryColor.Slate -> R.string.color_slate
}

@Composable
private fun ColorPicker(selected: TerritoryColor, onSelect: (TerritoryColor) -> Unit) {
    val title = stringResource(R.string.territory_color_label)

    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onBackground)
        Column(
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier
                .selectableGroup()
                .semantics { contentDescription = title },
        ) {
            TerritoryColor.entries.chunked(6).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    row.forEach { color ->
                        ColorSwatch(
                            color = color,
                            isSelected = color == selected,
                            onClick = { onSelect(color) },
                            modifier = Modifier.weight(1f),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun ColorSwatch(
    color: TerritoryColor,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val name = stringResource(color.label())
    val outer = RoundedCornerShape(14.dp)

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .clip(outer)
            .selectable(selected = isSelected, role = Role.RadioButton, onClick = onClick)
            // The colour's name, since a swatch says nothing to a screen reader.
            .semantics { contentDescription = name }
            // Selection is a ring, not only a different shade, so it does not
            // depend on telling colours apart.
            .then(
                if (isSelected) {
                    Modifier
                        .border(2.dp, MaterialTheme.colorScheme.onBackground, outer)
                        .padding(5.dp)
                } else {
                    Modifier
                },
            )
            .background(Color(color.hex.toColorInt()), RoundedCornerShape(if (isSelected) 9.dp else 14.dp)),
    )
}

@Composable
private fun CityPicker(selected: City, onSelect: (City) -> Unit) {
    var open by remember { mutableStateOf(false) }
    val title = stringResource(R.string.city_label)

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onBackground)
        Box {
            Surface(
                onClick = { open = true },
                shape = MaterialTheme.shapes.small,
                color = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.onSurface,
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 52.dp)
                    .semantics { contentDescription = "$title: ${selected.displayName}" },
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(DontStopIcons.Pin, contentDescription = null, modifier = Modifier.size(20.dp))
                    Text(selected.displayName, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
                    Icon(DontStopIcons.ChevronDown, contentDescription = null, modifier = Modifier.size(18.dp))
                }
            }
            DropdownMenu(expanded = open, onDismissRequest = { open = false }) {
                City.entries.forEach { city ->
                    DropdownMenuItem(
                        text = { Text(city.displayName, style = MaterialTheme.typography.bodyLarge) },
                        onClick = {
                            onSelect(city)
                            open = false
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun TrialNotice() {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.shapes.small)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(10.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            DontStopIcons.Gift,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSecondaryContainer,
            modifier = Modifier.size(20.dp),
        )
        Text(
            text = stringResource(R.string.trial_notice),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
        )
    }
}
