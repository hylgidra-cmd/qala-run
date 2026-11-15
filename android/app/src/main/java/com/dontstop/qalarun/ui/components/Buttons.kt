package com.dontstop.qalarun.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.dontstop.qalarun.ui.theme.DontStopTheme

private val ActionShape = RoundedCornerShape(16.dp)

/** The one main action of a screen: mint by day, glowing lime at night. */
@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    icon: ImageVector? = null,
) {
    val glow = DontStopTheme.extraColors.actionGlow

    Button(
        onClick = onClick,
        enabled = enabled,
        shape = ActionShape,
        colors = ButtonDefaults.buttonColors(
            // A disabled main action keeps its colour, dimmed, so the screen
            // still shows where it will be.
            disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.45f),
            disabledContentColor = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.7f),
        ),
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp)
            .then(
                if (enabled) {
                    Modifier.shadow(12.dp, ActionShape, ambientColor = glow, spotColor = glow)
                } else {
                    Modifier
                },
            ),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (icon != null) {
                Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
            }
            Text(text, style = MaterialTheme.typography.titleMedium)
        }
    }
}

/** A quieter alternative next to the main action. */
@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    OutlinedButton(
        onClick = onClick,
        enabled = enabled,
        shape = ActionShape,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = MaterialTheme.colorScheme.onBackground,
        ),
        modifier = modifier
            .fillMaxWidth()
            .height(48.dp),
    ) {
        Text(text, style = MaterialTheme.typography.titleSmall)
    }
}
