package com.dontstop.qalarun.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/*
 * The palette from the "Ranglar va shriftlar" board of the UI design, mapped
 * onto Material 3 roles so stock components pick the right colour by default.
 *
 * Day is the calm mint-on-paper look (A); night is the neon look (B). Every
 * container role is set explicitly: left alone, Material derives purple-tinted
 * surfaces that belong to neither.
 */

private val Ink = Color(0xFF10251F)
private val Paper = Color(0xFFF7F9F6)
private val Mint = Color(0xFF21D8A0)
private val DeepMint = Color(0xFF0B7A5A)
private val Gold = Color(0xFFE8B464)

private val Night = Color(0xFF07090F)
private val NightSurface = Color(0xFF0D1220)
private val NightRaised = Color(0xFF141C2E)
private val Frost = Color(0xFFE8F1FF)
private val Lime = Color(0xFFB6FF3B)
private val Cyan = Color(0xFF00F0FF)
private val Magenta = Color(0xFFFF2BD6)

val DayColorScheme: ColorScheme = lightColorScheme(
    background = Paper,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
    surfaceVariant = Color(0xFFEAF0EB),
    onSurfaceVariant = Color(0xFF5B6F68),
    surfaceContainerLowest = Color.White,
    surfaceContainerLow = Color.White,
    surfaceContainer = Color.White,
    surfaceContainerHigh = Color(0xFFEAF0EB),
    surfaceContainerHighest = Color(0xFFEAF0EB),
    surfaceTint = Color.Transparent,
    primary = Mint,
    onPrimary = Ink,
    primaryContainer = Color(0xFFDDF7EC),
    onPrimaryContainer = Ink,
    secondary = Gold,
    onSecondary = Ink,
    secondaryContainer = Color(0xFFFBEFD9),
    onSecondaryContainer = Color(0xFF8A5A12),
    tertiary = DeepMint,
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFEFFBF6),
    onTertiaryContainer = DeepMint,
    error = Color(0xFFC8372D),
    onError = Color.White,
    errorContainer = Color(0xFFFBE4E2),
    onErrorContainer = Color(0xFFA12A22),
    outline = Color(0xFF5B6F68),
    outlineVariant = Ink.copy(alpha = 0.10f),
    inverseSurface = Ink,
    inverseOnSurface = Paper,
    inversePrimary = Mint,
    scrim = Ink,
)

val NightColorScheme: ColorScheme = darkColorScheme(
    background = Night,
    onBackground = Frost,
    surface = NightSurface,
    onSurface = Frost,
    surfaceVariant = NightRaised,
    onSurfaceVariant = Color(0xFF8A97B4),
    surfaceContainerLowest = Night,
    surfaceContainerLow = NightSurface,
    surfaceContainer = NightSurface,
    surfaceContainerHigh = NightRaised,
    surfaceContainerHighest = NightRaised,
    surfaceTint = Color.Transparent,
    primary = Lime,
    onPrimary = Night,
    primaryContainer = Cyan.copy(alpha = 0.14f),
    onPrimaryContainer = Cyan,
    secondary = Magenta,
    onSecondary = Night,
    secondaryContainer = Magenta.copy(alpha = 0.16f),
    onSecondaryContainer = Color(0xFFFF6BE3),
    tertiary = Cyan,
    onTertiary = Night,
    tertiaryContainer = Cyan.copy(alpha = 0.08f),
    onTertiaryContainer = Cyan,
    error = Color(0xFFFF4D4D),
    onError = Night,
    errorContainer = Color(0xFFFF4D4D).copy(alpha = 0.16f),
    onErrorContainer = Color(0xFFFF8080),
    outline = Color(0xFF8A97B4),
    outlineVariant = Cyan.copy(alpha = 0.22f),
    inverseSurface = Frost,
    inverseOnSurface = Night,
    // The design puts lime on the frost banner here, which is 1.06:1 and
    // cannot be read. A deep cyan keeps the neon family and reaches 6:1.
    inversePrimary = Color(0xFF00606B),
    scrim = Color.Black,
)

/** Colours the design uses that have no Material role. */
@Immutable
data class ExtraColors(
    val isNight: Boolean,
    /** "GPS is good", "name is free": positive status that is not the brand colour. */
    val success: Color,
    /** The selected item of the bottom bar. Ink by day, cyan at night. */
    val navSelected: Color,
    /** Soft shadow under the main action by day, a neon glow at night. */
    val actionGlow: Color,
)

val DayExtraColors = ExtraColors(
    isNight = false,
    success = Color(0xFF13B585),
    navSelected = Ink,
    actionGlow = Mint.copy(alpha = 0.35f),
)

val NightExtraColors = ExtraColors(
    isNight = true,
    success = Lime,
    navSelected = Cyan,
    actionGlow = Lime.copy(alpha = 0.45f),
)

val LocalExtraColors = staticCompositionLocalOf { DayExtraColors }
