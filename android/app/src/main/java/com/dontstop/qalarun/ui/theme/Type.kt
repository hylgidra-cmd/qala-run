package com.dontstop.qalarun.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontVariation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.dontstop.qalarun.R

/** Outfit is one variable file; each weight the design uses is cut from it. */
private fun outfit(weight: FontWeight) = Font(
    resId = R.font.outfit,
    weight = weight,
    variationSettings = FontVariation.Settings(FontVariation.weight(weight.weight)),
)

/** Words: headings, labels, body. */
val TextFamily = FontFamily(
    outfit(FontWeight.Normal),
    outfit(FontWeight.Medium),
    outfit(FontWeight.SemiBold),
    outfit(FontWeight.Bold),
    outfit(FontWeight.ExtraBold),
)

/** Numbers: distance, time, area, player ids. Its digits share one width. */
val NumberFamily = FontFamily(
    Font(R.font.chakra_petch_medium, FontWeight.Medium),
    Font(R.font.chakra_petch_bold, FontWeight.Bold),
)

private fun text(size: Int, weight: FontWeight, lineHeight: Float = 1.35f) = TextStyle(
    fontFamily = TextFamily,
    fontWeight = weight,
    fontSize = size.sp,
    lineHeight = (size * lineHeight).sp,
)

val DontStopTypography = Typography(
    displayLarge = text(40, FontWeight.ExtraBold, 1.1f),
    displayMedium = text(36, FontWeight.ExtraBold, 1.1f),
    displaySmall = text(34, FontWeight.ExtraBold, 1.1f),
    headlineLarge = text(34, FontWeight.ExtraBold, 1.1f).copy(letterSpacing = (-0.01).em),
    headlineMedium = text(28, FontWeight.ExtraBold, 1.15f),
    headlineSmall = text(26, FontWeight.ExtraBold, 1.15f),
    titleLarge = text(22, FontWeight.ExtraBold, 1.2f),
    titleMedium = text(18, FontWeight.Bold, 1.25f),
    titleSmall = text(15, FontWeight.Bold, 1.3f),
    bodyLarge = text(16, FontWeight.Normal, 1.5f),
    bodyMedium = text(14, FontWeight.Normal, 1.5f),
    bodySmall = text(13, FontWeight.Normal, 1.4f),
    labelLarge = text(14, FontWeight.SemiBold, 1.3f),
    labelMedium = text(12, FontWeight.SemiBold, 1.3f),
    labelSmall = text(11, FontWeight.SemiBold, 1.3f),
)

private fun number(size: Int, lineHeight: Float = 1.1f) = TextStyle(
    fontFamily = NumberFamily,
    fontWeight = FontWeight.Bold,
    fontSize = size.sp,
    lineHeight = (size * lineHeight).sp,
)

/** Sizes for figures, named by where the design uses them. */
object NumberStyle {
    /** The live distance on the run screen. */
    val Hero = number(64, 0.95f).copy(letterSpacing = (-0.02).em)

    /** The area won on the result screen. */
    val Display = number(56, 1f)
    val Large = number(30)
    val Medium = number(22)
    val Small = number(14, 1.3f).copy(fontWeight = FontWeight.Medium)
}
