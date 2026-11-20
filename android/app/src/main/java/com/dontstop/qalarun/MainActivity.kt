package com.dontstop.qalarun

import android.os.Bundle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.dontstop.qalarun.data.auth.SessionState
import com.dontstop.qalarun.ui.SessionViewModel
import com.dontstop.qalarun.ui.auth.SetupRoute
import com.dontstop.qalarun.ui.auth.WelcomeRoute
import com.dontstop.qalarun.ui.navigation.AppRoot
import com.dontstop.qalarun.ui.theme.DontStopTheme
import dagger.hilt.android.AndroidEntryPoint

// AppCompatActivity rather than ComponentActivity: it is what applies the
// language chosen in the app on Android 8 to 12.
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // The map will draw under the status bar, as in the design.
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            DontStopTheme {
                val sessions: SessionViewModel = hiltViewModel()
                val session by sessions.state.collectAsStateWithLifecycle()

                when (val current = session) {
                    // Reading the stored session takes a moment; an empty
                    // background avoids flashing the welcome screen first.
                    SessionState.Loading -> Box(
                        Modifier
                            .fillMaxSize()
                            .background(MaterialTheme.colorScheme.background),
                    )
                    SessionState.SignedOut -> WelcomeRoute()
                    is SessionState.NeedsSetup -> SetupRoute()
                    SessionState.Guest, is SessionState.SignedIn -> AppRoot(
                        session = current,
                        onSignIn = sessions::leaveGuestMode,
                        onSignOut = sessions::signOut,
                    )
                }
            }
        }
    }
}
