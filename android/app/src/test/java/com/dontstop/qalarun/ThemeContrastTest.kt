package com.dontstop.qalarun

import androidx.compose.material3.ColorScheme
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.compositeOver
import androidx.compose.ui.graphics.luminance
import com.dontstop.qalarun.ui.theme.DayColorScheme
import com.dontstop.qalarun.ui.theme.DayExtraColors
import com.dontstop.qalarun.ui.theme.ExtraColors
import com.dontstop.qalarun.ui.theme.NightColorScheme
import com.dontstop.qalarun.ui.theme.NightExtraColors
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * The palette is read outdoors, in sunlight, mid-run. Every pairing the UI
 * puts text on must clear WCAG AA (4.5:1) in both looks.
 */
class ThemeContrastTest {

    private fun contrast(foreground: Color, background: Color, under: Color): Double {
        // Translucent container colours are judged as they appear on the surface below.
        val back = background.compositeOver(under)
        val front = foreground.compositeOver(back)
        val lighter = maxOf(front.luminance(), back.luminance())
        val darker = minOf(front.luminance(), back.luminance())
        return (lighter + 0.05) / (darker + 0.05)
    }

    private fun check(name: String, scheme: ColorScheme, extra: ExtraColors) {
        val pairs = listOf(
            Triple("onBackground/background", scheme.onBackground, scheme.background),
            Triple("onSurface/surface", scheme.onSurface, scheme.surface),
            Triple("onSurfaceVariant/background", scheme.onSurfaceVariant, scheme.background),
            Triple("onSurfaceVariant/surface", scheme.onSurfaceVariant, scheme.surface),
            Triple("onSurfaceVariant/surfaceVariant", scheme.onSurfaceVariant, scheme.surfaceVariant),
            Triple("onPrimary/primary", scheme.onPrimary, scheme.primary),
            Triple("onPrimaryContainer/primaryContainer", scheme.onPrimaryContainer, scheme.primaryContainer),
            Triple("onSecondaryContainer/secondaryContainer", scheme.onSecondaryContainer, scheme.secondaryContainer),
            Triple("tertiary/surface", scheme.tertiary, scheme.surface),
            Triple("onErrorContainer/errorContainer", scheme.onErrorContainer, scheme.errorContainer),
            Triple("inverseOnSurface/inverseSurface", scheme.inverseOnSurface, scheme.inverseSurface),
            Triple("inversePrimary/inverseSurface", scheme.inversePrimary, scheme.inverseSurface),
            Triple("navSelected/primaryContainer", extra.navSelected, scheme.primaryContainer),
        )
        val failures = pairs.mapNotNull { (label, foreground, background) ->
            val ratio = contrast(foreground, background, under = scheme.surface)
            if (ratio < 4.5) "$name $label = %.2f".format(ratio) else null
        }
        assertTrue("Below 4.5:1 -> $failures", failures.isEmpty())
    }

    @Test
    fun `day palette keeps text readable`() = check("day", DayColorScheme, DayExtraColors)

    @Test
    fun `night palette keeps text readable`() = check("night", NightColorScheme, NightExtraColors)
}
