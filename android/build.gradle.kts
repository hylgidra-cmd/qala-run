// Plugins are declared once here so every module resolves the same versions.
// AGP 9 has Kotlin built in: there is no org.jetbrains.kotlin.android plugin.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
}
