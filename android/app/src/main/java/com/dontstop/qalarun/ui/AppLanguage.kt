package com.dontstop.qalarun.ui

import androidx.appcompat.app.AppCompatDelegate
import androidx.core.os.LocaleListCompat
import java.util.Locale

/** The six languages of the app, each under its own name, in the design's order. */
enum class AppLanguage(val tag: String, val nativeName: String) {
    Uzbek("uz", "O'zbekcha"),
    Karakalpak("kaa", "Qaraqalpaqsha"),
    Russian("ru", "Русский"),
    English("en", "English"),
    Kazakh("kk", "Қазақша"),
    Turkish("tr", "Türkçe"),
    ;

    companion object {
        /** Uzbek is what the default resources are written in. */
        val Default = Uzbek

        fun fromTag(tag: String?): AppLanguage? {
            val language = tag?.substringBefore('-')?.lowercase() ?: return null
            return entries.firstOrNull { it.tag == language }
        }

        /**
         * The language the app is showing: the one chosen here, else the
         * phone's if we have it, else Uzbek.
         */
        fun current(): AppLanguage =
            fromTag(AppCompatDelegate.getApplicationLocales()[0]?.toLanguageTag())
                ?: fromTag(Locale.getDefault().toLanguageTag())
                ?: Default

        /** Switches the whole app. AppCompat recreates the screen and remembers the choice. */
        fun select(language: AppLanguage) {
            AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags(language.tag))
        }
    }
}
