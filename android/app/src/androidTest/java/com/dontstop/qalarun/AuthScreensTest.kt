package com.dontstop.qalarun

import android.graphics.Bitmap
import androidx.annotation.StringRes
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.asAndroidBitmap
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsEnabled
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsNotSelected
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.captureToImage
import androidx.compose.ui.test.hasContentDescription
import androidx.compose.ui.test.hasSetTextAction
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.v2.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onRoot
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.compose.ui.test.performTextReplacement
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.dontstop.qalarun.model.City
import com.dontstop.qalarun.model.TerritoryColor
import com.dontstop.qalarun.ui.AppLanguage
import com.dontstop.qalarun.ui.UiError
import com.dontstop.qalarun.ui.auth.SetupScreen
import com.dontstop.qalarun.ui.auth.SetupUiState
import com.dontstop.qalarun.ui.auth.WelcomeScreen
import com.dontstop.qalarun.ui.auth.WelcomeUiState
import com.dontstop.qalarun.ui.theme.DontStopTheme
import java.io.File
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** The two sign-in screens on their own, driven by plain state. */
@RunWith(AndroidJUnit4::class)
class AuthScreensTest {

    @get:Rule
    val rule = createComposeRule()

    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    private fun text(@StringRes id: Int): String = context.getString(id)

    /** Saves what is on screen, so a change can be looked at as well as asserted. */
    private fun capture(name: String) {
        val folder = File(context.filesDir, "screens").apply { mkdirs() }
        File(folder, "$name.png").outputStream().use {
            rule.onRoot().captureToImage().asAndroidBitmap().compress(Bitmap.CompressFormat.PNG, 100, it)
        }
    }

    @Composable
    private fun Welcome(
        state: WelcomeUiState = WelcomeUiState(),
        night: Boolean = false,
        onLanguage: (AppLanguage) -> Unit = {},
        onGoogle: () -> Unit = {},
        onBrowse: () -> Unit = {},
    ) = DontStopTheme(night = night) {
        WelcomeScreen(state, AppLanguage.Uzbek, onLanguage, onGoogle, onBrowse)
    }

    @Test
    fun welcome_offers_six_languages_and_marks_the_current_one() {
        var chosen: AppLanguage? = null
        rule.setContent { Welcome(onLanguage = { chosen = it }) }

        AppLanguage.entries.forEach { rule.onNodeWithText(it.nativeName).performScrollTo().assertIsDisplayed() }
        rule.onNode(isSelectable() and androidx.compose.ui.test.hasText("O'zbekcha")).assertIsSelected()
        rule.onNode(isSelectable() and androidx.compose.ui.test.hasText("Русский")).assertIsNotSelected()

        rule.onNodeWithText("Qaraqalpaqsha").performClick()

        assertEquals(AppLanguage.Karakalpak, chosen)
        capture("welcome_day")
    }

    @Test
    fun welcome_actions_reach_their_handlers() {
        var google = 0
        var browse = 0
        rule.setContent { Welcome(onGoogle = { google++ }, onBrowse = { browse++ }) }

        rule.onNodeWithText(text(R.string.sign_in_google)).performScrollTo().performClick()
        rule.onNodeWithText(text(R.string.browse_map_first)).performScrollTo().performClick()

        assertEquals(1 to 1, google to browse)
    }

    @Test
    fun welcome_locks_its_actions_while_signing_in_and_shows_a_failure() {
        var state by mutableStateOf(WelcomeUiState(signingIn = true))
        rule.setContent { Welcome(state, night = true) }

        rule.onNodeWithText(text(R.string.signing_in)).performScrollTo().assertIsNotEnabled()
        rule.onNodeWithText(text(R.string.browse_map_first)).assertIsNotEnabled()

        state = WelcomeUiState(error = UiError.GoogleNotConfigured)

        rule.onNodeWithText(text(R.string.error_google_not_configured)).performScrollTo().assertIsDisplayed()
        rule.onNodeWithText(text(R.string.sign_in_google)).assertIsEnabled()
        capture("welcome_night_error")
    }

    @Composable
    private fun Setup(
        state: SetupUiState,
        night: Boolean = false,
        onNickname: (String) -> Unit = {},
        onColor: (TerritoryColor) -> Unit = {},
        onCity: (City) -> Unit = {},
        onSubmit: () -> Unit = {},
        onBack: () -> Unit = {},
    ) = DontStopTheme(night = night) {
        SetupScreen(state, onBack, onPickAvatar = {}, onNickname, onColor, onCity, onSubmit)
    }

    private val filled = SetupUiState(playerId = "48201937", nickname = "Shamol_07")

    @Test
    fun setup_shows_the_player_id_and_edits_the_profile() {
        var state by mutableStateOf(filled)
        var submitted = 0
        rule.setContent {
            Setup(
                state,
                onNickname = { state = state.copy(nickname = it) },
                onColor = { state = state.copy(color = it) },
                onCity = { state = state.copy(city = it) },
                onSubmit = { submitted++ },
            )
        }

        rule.onNodeWithText("DS-48201937").assertIsDisplayed()
        rule.onNodeWithContentDescription(text(R.string.color_mint)).assertIsSelected()

        rule.onNode(hasSetTextAction()).performTextReplacement("Bek_Run")
        rule.onNodeWithContentDescription(text(R.string.color_blue)).performScrollTo().performClick()
        rule.onNode(hasContentDescription(text(R.string.city_label), substring = true)).performScrollTo().performClick()
        rule.onNodeWithText("Toshkent").performClick()
        rule.onNodeWithText(text(R.string.start_game)).performScrollTo().performClick()

        assertEquals("Bek_Run", state.nickname)
        assertEquals(TerritoryColor.Blue, state.color)
        assertEquals(City.Tashkent, state.city)
        assertEquals(1, submitted)
        rule.onNodeWithContentDescription(text(R.string.color_blue)).assertIsSelected()
        capture("setup_day")
    }

    @Test
    fun setup_will_not_submit_a_name_that_is_too_short() {
        var submitted = 0
        rule.setContent { Setup(filled.copy(nickname = "a"), night = true, onSubmit = { submitted++ }) }

        rule.onNodeWithText(text(R.string.start_game)).performScrollTo().assertIsNotEnabled().performClick()

        assertEquals(0, submitted)
        capture("setup_night_invalid")
    }

    @Test
    fun setup_back_and_saving_states() {
        var back = 0
        var state by mutableStateOf(filled.copy(saving = true))
        rule.setContent { Setup(state, onBack = { back++ }) }

        rule.onNodeWithText(text(R.string.saving)).performScrollTo().assertIsNotEnabled()

        state = filled.copy(error = UiError.Offline)
        rule.onNodeWithText(text(R.string.error_offline)).performScrollTo().assertIsDisplayed()

        rule.onNodeWithContentDescription(text(R.string.action_back)).performScrollTo().performClick()
        assertEquals(1, back)
    }
}
