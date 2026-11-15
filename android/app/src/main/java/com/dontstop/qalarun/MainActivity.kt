package com.dontstop.qalarun

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.dontstop.qalarun.ui.navigation.AppRoot
import com.dontstop.qalarun.ui.theme.DontStopTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // The map will draw under the status bar, as in the design.
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            DontStopTheme {
                AppRoot()
            }
        }
    }
}
