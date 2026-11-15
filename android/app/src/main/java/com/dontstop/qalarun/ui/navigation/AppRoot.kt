package com.dontstop.qalarun.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.navigation3.rememberViewModelStoreNavEntryDecorator
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberDecoratedNavEntries
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.runtime.rememberSaveableStateHolderNavEntryDecorator
import androidx.navigation3.ui.NavDisplay
import com.dontstop.qalarun.R
import com.dontstop.qalarun.data.auth.SessionState
import com.dontstop.qalarun.ui.auth.AccountStub
import com.dontstop.qalarun.ui.components.BottomBar
import com.dontstop.qalarun.ui.components.PlaceholderScreen

/**
 * The shell: one back stack per bottom-bar tab, so switching tabs keeps each
 * section where the player left it, and the bar itself.
 *
 * Back pops the current section first, then returns to the map, and only from
 * the map's root leaves the app.
 */
@Composable
fun AppRoot(session: SessionState, onSignIn: () -> Unit, onSignOut: () -> Unit) {
    val tabs = TopLevelTab.entries
    val home = TopLevelTab.Home.ordinal
    var selected by rememberSaveable { mutableIntStateOf(home) }
    val stacks = tabs.map { rememberNavBackStack(it.root) }
    val current = stacks[selected]

    fun select(tab: TopLevelTab) {
        if (tab.ordinal == selected) {
            // Tapping the open tab again returns it to its first screen.
            while (current.size > 1) current.removeLastOrNull()
        } else {
            selected = tab.ordinal
        }
    }

    val provider = entryProvider<NavKey> {
        entry<MapKey> { PlaceholderScreen(stringResource(R.string.tab_map)) }
        entry<HistoryKey> { PlaceholderScreen(stringResource(R.string.tab_history)) }
        entry<ClanKey> { PlaceholderScreen(stringResource(R.string.tab_clan)) }
        entry<LeaderboardKey> { PlaceholderScreen(stringResource(R.string.tab_leaderboard)) }
        entry<ProfileKey> { AccountStub(session, onSignIn = onSignIn, onSignOut = onSignOut) }
    }

    val decorated = stacks.map { stack ->
        // Each stack needs its own decorators: the first keeps scroll and input
        // state of off-screen entries, the second scopes ViewModels to an entry.
        rememberDecoratedNavEntries(
            backStack = stack,
            entryDecorators = listOf(
                rememberSaveableStateHolderNavEntryDecorator<NavKey>(),
                rememberViewModelStoreNavEntryDecorator<NavKey>(),
            ),
            entryProvider = provider,
        )
    }
    // The map stays underneath every other tab, which is what makes Back from
    // another tab land on it.
    val shown = if (selected == home) decorated[home] else decorated[home] + decorated[selected]

    Column(Modifier.fillMaxSize()) {
        Box(Modifier.weight(1f)) {
            NavDisplay(
                entries = shown,
                onBack = {
                    if (current.size > 1) current.removeLastOrNull() else selected = home
                },
            )
        }
        BottomBar(selected = tabs[selected], onSelect = ::select)
    }
}
