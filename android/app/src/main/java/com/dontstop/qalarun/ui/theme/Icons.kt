package com.dontstop.qalarun.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.unit.dp

/**
 * The design's own line icons: 24 dp grid, 2 dp stroke, round joins. Drawn
 * from the same path data as the design file, so they match it exactly and
 * the app carries no icon library.
 */
object DontStopIcons {
    val Map = lineIcon("Map", "M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z", "M9 4v14M15 6v14")
    val History = lineIcon("History", circle(12f, 12f, 9f), "M12 7v5l3 2")
    val Clan = lineIcon("Clan", "M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3z")
    val Leaderboard = lineIcon("Leaderboard", "M4 20V12h4v8M10 20V6h4v14M16 20v-6h4v6")
    val Profile = lineIcon("Profile", circle(12f, 8f, 4f), "M4 21c1-4 4.5-6 8-6s7 2 8 6")
}

/** An SVG circle as path data, since a vector path has no circle primitive. */
private fun circle(cx: Float, cy: Float, r: Float): String =
    "M${cx - r} ${cy}a$r $r 0 1 0 ${2 * r} 0a$r $r 0 1 0 ${-2 * r} 0"

private fun lineIcon(name: String, vararg paths: String): ImageVector {
    val builder = ImageVector.Builder(
        name = name,
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f,
    )
    paths.forEach { data ->
        builder.addPath(
            pathData = addPathNodes(data),
            // Any opaque colour: Icon() replaces it with its tint.
            stroke = SolidColor(Color.Black),
            strokeLineWidth = 2f,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
        )
    }
    return builder.build()
}
