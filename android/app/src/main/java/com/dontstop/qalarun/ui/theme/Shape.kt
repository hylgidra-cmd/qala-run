package com.dontstop.qalarun.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

/** Corners run from 14 dp (fields, chips) to 28 dp (sheets), as in the design. */
val DontStopShapes = Shapes(
    extraSmall = RoundedCornerShape(10.dp),
    small = RoundedCornerShape(14.dp),
    medium = RoundedCornerShape(16.dp),
    large = RoundedCornerShape(24.dp),
    extraLarge = RoundedCornerShape(28.dp),
)

object Dimens {
    /** Smallest thing a thumb is asked to hit. */
    val MinTouch = 48.dp

    /** Controls used while running, with a moving hand and no attention to spare. */
    val RunTouch = 64.dp

    val ScreenPadding = 20.dp
}
