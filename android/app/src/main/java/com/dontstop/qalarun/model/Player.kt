package com.dontstop.qalarun.model

import kotlinx.serialization.Serializable

/** The signed-in player as the rest of the app sees them. */
@Serializable
data class Player(
    val userId: String,
    /** The public 8-digit id a player reads out to a friend. */
    val playerId: String,
    val displayName: String,
    val colorHex: String,
    val cityId: String,
    val avatarData: String? = null,
)

/** A city the game is played in. Ids are the API's. */
enum class City(val id: String, val displayName: String) {
    Nukus("nukus", "Nukus"),
    Tashkent("tashkent", "Toshkent"),
    Almaty("almaty", "Almaty"),
    Istanbul("istanbul", "Istanbul"),
    ;

    companion object {
        val Default = Nukus

        fun fromId(id: String?): City = entries.firstOrNull { it.id == id?.lowercase() } ?: Default
    }
}

/** The twelve territory colours offered at setup, in the design's order. */
enum class TerritoryColor(val hex: String) {
    Mint("#13B585"),
    Blue("#2F6BFF"),
    Gold("#E8B464"),
    Orange("#FF5A1F"),
    Violet("#8B5CF6"),
    Pink("#EC4899"),
    Sky("#0EA5E9"),
    Lime("#84CC16"),
    Rose("#F43F5E"),
    Teal("#14B8A6"),
    Brown("#A16207"),
    Slate("#64748B"),
    ;

    companion object {
        val Default = Mint

        fun fromHex(hex: String?): TerritoryColor? =
            entries.firstOrNull { it.hex.equals(hex, ignoreCase = true) }
    }
}

/** What the API accepts as a display name (DisplayNameIn: 2 to 24 characters). */
object Nickname {
    const val MIN = 2
    const val MAX = 24

    fun isValid(value: String): Boolean = value.trim().length in MIN..MAX
}
