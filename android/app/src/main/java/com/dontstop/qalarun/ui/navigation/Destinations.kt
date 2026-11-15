package com.dontstop.qalarun.ui.navigation

import androidx.annotation.StringRes
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation3.runtime.NavKey
import com.dontstop.qalarun.R
import com.dontstop.qalarun.ui.theme.DontStopIcons
import kotlinx.serialization.Serializable

@Serializable
data object MapKey : NavKey

@Serializable
data object HistoryKey : NavKey

@Serializable
data object ClanKey : NavKey

@Serializable
data object LeaderboardKey : NavKey

@Serializable
data object ProfileKey : NavKey

/**
 * The five sections of the bottom bar, in the order they are drawn. Each owns
 * a back stack, and those stacks are saved by position: reordering this enum
 * changes which saved stack a tab gets after an update.
 */
enum class TopLevelTab(
    val root: NavKey,
    @param:StringRes val label: Int,
    val icon: ImageVector,
) {
    Map(MapKey, R.string.tab_map, DontStopIcons.Map),
    History(HistoryKey, R.string.tab_history, DontStopIcons.History),
    Clan(ClanKey, R.string.tab_clan, DontStopIcons.Clan),
    Leaderboard(LeaderboardKey, R.string.tab_leaderboard, DontStopIcons.Leaderboard),
    Profile(ProfileKey, R.string.tab_profile, DontStopIcons.Profile),
    ;

    companion object {
        /** Where the app opens, and where Back from any other tab leads. */
        val Home = Map
    }
}
