package com.dontstop.qalarun

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.isHeading
import androidx.compose.ui.test.isSelectable
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.espresso.Espresso
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class BottomBarNavigationTest {

    @get:Rule
    val rule = createAndroidComposeRule<MainActivity>()

    private fun tab(label: String) = rule.onNode(hasText(label) and isSelectable(), useUnmergedTree = false)

    private fun heading(title: String) = rule.onNode(hasText(title) and isHeading())

    @Test
    fun the_app_opens_on_the_map() {
        tab("Xarita").assertIsSelected()
        heading("Xarita").assertIsDisplayed()
    }

    @Test
    fun each_tab_opens_its_own_section() {
        for (label in listOf("Tarix", "Klan", "Reyting", "Profil", "Xarita")) {
            tab(label).performClick()

            tab(label).assertIsSelected()
            heading(label).assertIsDisplayed()
        }
    }

    @Test
    fun back_from_another_tab_returns_to_the_map() {
        tab("Profil").performClick()

        Espresso.pressBack()

        tab("Xarita").assertIsSelected()
        heading("Xarita").assertIsDisplayed()
    }
}
