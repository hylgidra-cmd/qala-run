package com.dontstop.qalarun.ui.auth

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.material3.MaterialTheme
import com.dontstop.qalarun.ui.theme.DontStopTheme

private data class Palette(
    val ground: Color,
    val block: Color,
    val park: Color,
    val rivalOne: Color,
    val rivalTwo: Color,
    val mine: Color,
    val route: Color,
)

private val Day = Palette(
    ground = Color(0xFFEEF2EC),
    block = Color(0xFFE1E7E0),
    park = Color(0xFFD3E9D6),
    rivalOne = Color(0xFFE8B464),
    rivalTwo = Color(0xFF6C8EF5),
    mine = Color(0xFF13B585),
    route = Color(0xFF10251F),
)

private val Night = Palette(
    ground = Color(0xFF0A0E18),
    block = Color(0xFF121A2A),
    park = Color(0xFF0F1F1E),
    rivalOne = Color(0xFFFF2BD6),
    rivalTwo = Color(0xFF8A5CFF),
    mine = Color(0xFF00F0FF),
    route = Color(0xFFB6FF3B),
)

private const val VIEW_W = 342f
private const val VIEW_H = 250f

/**
 * The game in one picture: city blocks, two rivals' ground, and a run that
 * closes a loop around its own. Drawn from the design's coordinates; it says
 * nothing a screen reader needs, so it carries no description.
 */
@Composable
fun LoopIllustration(modifier: Modifier = Modifier) {
    val palette = if (DontStopTheme.extraColors.isNight) Night else Day
    val dotRing = MaterialTheme.colorScheme.surface

    Canvas(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(VIEW_W / VIEW_H)
            .clip(MaterialTheme.shapes.large),
    ) {
        drawRect(palette.ground)
        scale(size.width / VIEW_W, pivot = Offset.Zero) {
            val columns = listOf(12f to 96f, 122f to 96f, 232f to 98f)
            val rows = listOf(14f to 70f, 98f to 66f, 178f to 60f)
            rows.forEachIndexed { rowIndex, (top, height) ->
                columns.forEachIndexed { columnIndex, (left, width) ->
                    val isPark = rowIndex == 1 && columnIndex == 2
                    block(left, top, width, height, if (isPark) palette.park else palette.block)
                }
            }
            territory(12f, 14f, 96f, 70f, palette.rivalOne)
            territory(232f, 178f, 98f, 60f, palette.rivalTwo)

            val captured = Path().apply {
                moveTo(115f, 91f); lineTo(225f, 91f); lineTo(225f, 171f)
                lineTo(330f, 171f); lineTo(330f, 238f); lineTo(115f, 238f); close()
            }
            drawPath(captured, palette.mine, alpha = 0.18f)

            val route = Path().apply {
                moveTo(115f, 238f); lineTo(115f, 91f); lineTo(225f, 91f)
                lineTo(225f, 171f); lineTo(330f, 171f)
            }
            drawPath(route, palette.route, style = Stroke(5f, cap = StrokeCap.Round, join = StrokeJoin.Round))

            drawCircle(dotRing, radius = 11f, center = Offset(330f, 171f))
            drawCircle(palette.route, radius = 8f, center = Offset(330f, 171f))
        }
    }
}

private fun DrawScope.block(left: Float, top: Float, width: Float, height: Float, color: Color) {
    drawRoundRect(color, Offset(left, top), Size(width, height), CornerRadius(4f))
}

private fun DrawScope.territory(left: Float, top: Float, width: Float, height: Float, color: Color) {
    drawRoundRect(color, Offset(left, top), Size(width, height), CornerRadius(4f), alpha = 0.3f)
    drawRoundRect(color, Offset(left, top), Size(width, height), CornerRadius(4f), style = Stroke(2f))
}
