package com.dontstop.qalarun.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable

/**
 * The app's look. There is no dynamic (wallpaper) colour on purpose: territory
 * colours on the map have to read the same on every phone.
 */
@Composable
fun DontStopTheme(
    night: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    CompositionLocalProvider(
        LocalExtraColors provides if (night) NightExtraColors else DayExtraColors,
    ) {
        MaterialTheme(
            colorScheme = if (night) NightColorScheme else DayColorScheme,
            typography = DontStopTypography,
            shapes = DontStopShapes,
            content = content,
        )
    }
}

object DontStopTheme {
    val extraColors: ExtraColors
        @Composable
        @ReadOnlyComposable
        get() = LocalExtraColors.current
}
