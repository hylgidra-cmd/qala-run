package com.dontstop.qalarun

import com.dontstop.qalarun.ui.navigation.TopLevelTab
import org.junit.Assert.assertEquals
import org.junit.Test

class TopLevelTabTest {

    @Test
    fun `the bar keeps the order of the design`() {
        // Back stacks are saved by position, so this order is a contract.
        assertEquals(
            listOf("Map", "History", "Clan", "Leaderboard", "Profile"),
            TopLevelTab.entries.map { it.name },
        )
    }

    @Test
    fun `every tab has its own root and label`() {
        assertEquals(5, TopLevelTab.entries.map { it.root }.toSet().size)
        assertEquals(5, TopLevelTab.entries.map { it.label }.toSet().size)
    }

    @Test
    fun `the app opens on the map`() {
        assertEquals(TopLevelTab.Map, TopLevelTab.Home)
    }
}
