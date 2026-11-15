package com.dontstop.qalarun

import androidx.annotation.StringRes
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performScrollTo
import androidx.test.espresso.Espresso
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** The real app from a fresh start: welcome, then the tabs as a guest. */
@RunWith(AndroidJUnit4::class)
class BottomBarNavigationTest {

    @get:Rule
    val rule = createAndroidComposeRule<MainActivity>()

    // Whatever language the test device is set to, the app's own words are used.
    private fun text(@StringRes id: Int): String = rule.activity.getString(id)

    private fun tab(@StringRes label: Int) = rule.onNode(hasText(text(label)) and isSelectable())

    private fun heading(@StringRes title: Int) = rule.onNode(hasText(text(title)) and isHeading())

    private fun shows(@StringRes id: Int): Boolean =
        rule.onAllNodes(hasText(text(id))).fetchSemanticsNodes().isNotEmpty()

    @Before
    fun enterAsGuest() {
        // The first launch in a process shows the welcome screen. Guest mode
        // then lasts as long as the process, so later tests start in the tabs.
        rule.waitUntil(5_000) { shows(R.string.browse_map_first) || shows(R.string.tab_history) }
        if (shows(R.string.browse_map_first)) {
            rule.onNodeWithText(text(R.string.browse_map_first)).performScrollTo().performClick()
        }
    }

    @Test
    fun a_guest_lands_on_the_map() {
        tab(R.string.tab_map).assertIsSelected()
        heading(R.string.tab_map).assertIsDisplayed()
    }

    @Test
    fun each_tab_opens_its_own_section() {
        val tabs = listOf(
            R.string.tab_history,
            R.string.tab_clan,
            R.string.tab_leaderboard,
            R.string.tab_profile,
            R.string.tab_map,
        )
        for (label in tabs) {
            tab(label).performClick()

            tab(label).assertIsSelected()
            heading(label).assertIsDisplayed()
        }
    }

    @Test
    fun back_from_another_tab_returns_to_the_map() {
        tab(R.string.tab_profile).performClick()

        Espresso.pressBack()

        tab(R.string.tab_map).assertIsSelected()
        heading(R.string.tab_map).assertIsDisplayed()
    }

    @Test
    fun a_guest_can_go_back_to_sign_in_from_the_profile_tab() {
        tab(R.string.tab_profile).performClick()
        rule.onNodeWithText(text(R.string.guest_prompt)).assertIsDisplayed()

        rule.onNodeWithText(text(R.string.action_sign_in)).performClick()

        rule.onNodeWithText(text(R.string.sign_in_google)).performScrollTo().assertIsDisplayed()
    }
}
