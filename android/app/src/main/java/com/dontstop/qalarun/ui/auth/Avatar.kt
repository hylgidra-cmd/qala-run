package com.dontstop.qalarun.ui.auth

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.net.Uri
import android.os.Build
import android.util.Base64
import androidx.core.graphics.scale
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Profile pictures travel as a small JPEG data URL, the format the web app
 * already stores: at most 200 px on the long side.
 */
object Avatar {
    private const val MAX_SIDE = 200
    private const val PREFIX = "data:image/jpeg;base64,"

    /** The API refuses anything longer (DisplayNameIn.avatar_data). */
    const val MAX_LENGTH = 150_000

    /** Reads the picked image, shrinks it and encodes it; null if it cannot be read. */
    suspend fun fromUri(context: Context, uri: Uri): String? = withContext(Dispatchers.IO) {
        try {
            val bitmap = decodeScaled(context, uri) ?: return@withContext null
            val bytes = ByteArrayOutputStream().use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
                out.toByteArray()
            }
            (PREFIX + Base64.encodeToString(bytes, Base64.NO_WRAP)).takeIf { it.length <= MAX_LENGTH }
        } catch (_: Exception) {
            // A file that vanished, an unsupported format, a provider that
            // refuses: all the same to the player.
            null
        }
    }

    /** Turns a stored data URL back into a picture; null if it is not one of ours. */
    fun toBitmap(dataUrl: String?): Bitmap? {
        val encoded = dataUrl?.substringAfter("base64,", missingDelimiterValue = "")
        if (encoded.isNullOrEmpty()) return null
        return try {
            val bytes = Base64.decode(encoded, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        } catch (_: IllegalArgumentException) {
            null
        }
    }

    private fun decodeScaled(context: Context, uri: Uri): Bitmap? {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            // ImageDecoder applies the photo's rotation, which BitmapFactory ignores.
            val source = ImageDecoder.createSource(context.contentResolver, uri)
            return ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
                decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                val scale = MAX_SIDE.toFloat() / max(info.size.width, info.size.height)
                if (scale < 1f) {
                    decoder.setTargetSize(
                        max((info.size.width * scale).toInt(), 1),
                        max((info.size.height * scale).toInt(), 1),
                    )
                }
            }
        }

        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        context.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        val longSide = max(bounds.outWidth, bounds.outHeight)
        if (longSide <= 0) return null

        val options = BitmapFactory.Options().apply {
            inSampleSize = max(Integer.highestOneBit(longSide / MAX_SIDE), 1)
        }
        val sampled = context.contentResolver.openInputStream(uri)?.use {
            BitmapFactory.decodeStream(it, null, options)
        } ?: return null

        val scale = MAX_SIDE.toFloat() / max(sampled.width, sampled.height)
        if (scale >= 1f) return sampled
        return sampled.scale(
            max((sampled.width * scale).toInt(), 1),
            max((sampled.height * scale).toInt(), 1),
        )
    }
}
