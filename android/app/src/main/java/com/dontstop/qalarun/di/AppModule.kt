package com.dontstop.qalarun.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.dontstop.qalarun.BuildConfig
import com.dontstop.qalarun.data.api.DontStopApi
import com.dontstop.qalarun.data.auth.AuthInterceptor
import com.dontstop.qalarun.data.auth.AuthRepository
import com.dontstop.qalarun.data.auth.CredentialManagerGoogleSignIn
import com.dontstop.qalarun.data.auth.GoogleSignIn
import com.dontstop.qalarun.data.session.DataStoreSessionStore
import com.dontstop.qalarun.data.session.SessionStore
import dagger.Binds
import dagger.Lazy
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import java.util.concurrent.TimeUnit
import javax.inject.Singleton
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory

private val Context.sessionDataStore by preferencesDataStore(name = "session")

/** How this app reads and writes the API's JSON. */
val ApiJson = Json {
    // The API grows fields; an older app must keep working when it does.
    ignoreUnknownKeys = true
    // Unset optional fields are left out, which is how PATCH me means "unchanged".
    explicitNulls = false
}

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun sessionDataStore(@ApplicationContext context: Context): DataStore<Preferences> =
        context.sessionDataStore

    @Provides
    @Singleton
    fun okHttpClient(auth: Lazy<AuthRepository>): OkHttpClient =
        OkHttpClient.Builder()
            // Lazy: the repository needs the API, which needs this client.
            .addInterceptor(AuthInterceptor { auth.get() })
            // The free host takes up to a minute to wake a sleeping API.
            .connectTimeout(20, TimeUnit.SECONDS)
            .readTimeout(60, TimeUnit.SECONDS)
            .build()

    @Provides
    @Singleton
    fun api(client: OkHttpClient): DontStopApi = createApi(BuildConfig.API_BASE_URL, client)
}

/** Builds the API client; also what the tests point at a local server. */
fun createApi(baseUrl: String, client: OkHttpClient): DontStopApi =
    Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(client)
        .addConverterFactory(ApiJson.asConverterFactory("application/json".toMediaType()))
        .build()
        .create(DontStopApi::class.java)

@Module
@InstallIn(SingletonComponent::class)
abstract class BindingsModule {
    @Binds
    abstract fun sessionStore(impl: DataStoreSessionStore): SessionStore

    @Binds
    abstract fun googleSignIn(impl: CredentialManagerGoogleSignIn): GoogleSignIn
}
