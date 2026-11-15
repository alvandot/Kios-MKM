package com.kiosk.employee.pin

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext

private val Context.kioskDataStore by preferencesDataStore(name = "kiosk_settings")

/**
 * Menyimpan PIN admin (6 digit) dalam bentuk hash PBKDF2WithHmacSHA256 + salt acak,
 * serta status kiosk (aktif/nonaktif) yang dipilih oleh admin.
 */
class PinManager(private val context: Context) {

    /** Status kiosk; default aktif sehingga perangkat baru langsung terkunci setelah setup PIN. */
    val kioskEnabledFlow: Flow<Boolean> = context.kioskDataStore.data
        .map { prefs -> prefs[KEY_KIOSK_ENABLED] ?: DEFAULT_KIOSK_ENABLED }

    suspend fun hasPin(): Boolean = context.kioskDataStore.data
        .map { prefs -> prefs[KEY_PIN_HASH] != null }
        .first()

    suspend fun setPin(pin: String) {
        val salt = ByteArray(SALT_LENGTH_BYTES).also { secureRandom.nextBytes(it) }
        val hash = withContext(Dispatchers.Default) { hashPin(pin, salt) }
        context.kioskDataStore.edit { prefs ->
            prefs[KEY_PIN_SALT] = salt.toHex()
            prefs[KEY_PIN_HASH] = hash
            // PIN baru selalu membatalkan penalti percobaan salah sebelumnya.
            prefs.remove(KEY_FAILED_ATTEMPTS)
            prefs.remove(KEY_LOCKED_UNTIL)
        }
    }

    suspend fun verifyPin(pin: String): Boolean {
        val prefs = context.kioskDataStore.data.first()
        val storedHash = prefs[KEY_PIN_HASH] ?: return false
        val saltHex = prefs[KEY_PIN_SALT] ?: return false
        val candidate = withContext(Dispatchers.Default) { hashPin(pin, saltHex.hexToBytes()) }
        // Perbandingan constant-time agar tidak bocor lewat timing.
        return MessageDigest.isEqual(candidate.toByteArray(), storedHash.toByteArray())
    }

    /** Waktu (epoch ms) sampai kapan input PIN dijeda; 0 berarti tidak dijeda. */
    suspend fun lockedUntilMillis(): Long = context.kioskDataStore.data
        .map { prefs -> prefs[KEY_LOCKED_UNTIL] ?: 0L }
        .first()

    /** Jumlah PIN salah berturut-turut yang tercatat. */
    suspend fun failedAttempts(): Int = context.kioskDataStore.data
        .map { prefs -> prefs[KEY_FAILED_ATTEMPTS] ?: 0 }
        .first()

    /**
     * Catat satu PIN salah dan kembalikan batas waktu jeda (epoch ms).
     * Nilai 0 berarti percobaan masih dalam batas toleransi.
     *
     * Disimpan di DataStore supaya menutup paksa aplikasi atau me-restart
     * perangkat tidak menghapus jeda.
     */
    suspend fun recordFailedAttempt(now: Long = System.currentTimeMillis()): Long {
        var lockedUntil = 0L
        context.kioskDataStore.edit { prefs ->
            val attempts = (prefs[KEY_FAILED_ATTEMPTS] ?: 0) + 1
            prefs[KEY_FAILED_ATTEMPTS] = attempts
            val delayMs = penaltyMillisFor(attempts)
            if (delayMs > 0L) {
                lockedUntil = now + delayMs
                prefs[KEY_LOCKED_UNTIL] = lockedUntil
            }
        }
        return lockedUntil
    }

    /** Reset penalti setelah PIN benar atau PIN diganti. */
    suspend fun clearFailedAttempts() {
        context.kioskDataStore.edit { prefs ->
            prefs.remove(KEY_FAILED_ATTEMPTS)
            prefs.remove(KEY_LOCKED_UNTIL)
        }
    }

    val selectedPackagesFlow: Flow<Set<String>> = context.kioskDataStore.data
        .map { prefs -> prefs[KEY_SELECTED_PACKAGES] ?: emptySet() }

    suspend fun selectedPackages(): Set<String> = selectedPackagesFlow.first()

    suspend fun setSelectedPackages(packages: Set<String>) {
        context.kioskDataStore.edit { prefs ->
            prefs[KEY_SELECTED_PACKAGES] = packages
        }
    }

    suspend fun setKioskEnabled(enabled: Boolean) {
        context.kioskDataStore.edit { prefs ->
            prefs[KEY_KIOSK_ENABLED] = enabled
        }
    }

    companion object {
        const val PIN_LENGTH = 6

        private val KEY_PIN_HASH = stringPreferencesKey("pin_hash")
        private val KEY_PIN_SALT = stringPreferencesKey("pin_salt")
        private val KEY_KIOSK_ENABLED = booleanPreferencesKey("kiosk_enabled")
        private val KEY_SELECTED_PACKAGES = stringSetPreferencesKey("selected_packages")
        private val KEY_FAILED_ATTEMPTS = intPreferencesKey("failed_attempts")
        private val KEY_LOCKED_UNTIL = longPreferencesKey("locked_until")
        private const val DEFAULT_KIOSK_ENABLED = true
        private const val PBKDF2_ITERATIONS = 100_000
        private const val SALT_LENGTH_BYTES = 16
        private const val KEY_LENGTH_BITS = 256

        /** Percobaan salah yang masih ditoleransi sebelum input mulai dijeda. */
        private const val FREE_ATTEMPTS = 4

        /** Jeda bertingkat (ms) untuk percobaan salah ke-5 dan seterusnya. */
        private val PENALTIES_MS = longArrayOf(30_000L, 60_000L, 120_000L)

        internal fun penaltyMillisFor(attempt: Int): Long {
            if (attempt <= FREE_ATTEMPTS) return 0L
            val index = (attempt - FREE_ATTEMPTS - 1).coerceAtMost(PENALTIES_MS.lastIndex)
            return PENALTIES_MS[index]
        }

        private val secureRandom = SecureRandom()

        private fun hashPin(pin: String, salt: ByteArray): String {
            val spec = PBEKeySpec(pin.toCharArray(), salt, PBKDF2_ITERATIONS, KEY_LENGTH_BITS)
            val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
            return factory.generateSecret(spec).encoded.toHex()
        }

        private fun ByteArray.toHex(): String =
            joinToString(separator = "") { byte -> "%02x".format(byte) }

        private fun String.hexToBytes(): ByteArray {
            check(length % 2 == 0) { "Panjang hex tidak valid" }
            return ByteArray(length / 2) { index ->
                substring(index * 2, index * 2 + 2).toInt(16).toByte()
            }
        }
    }
}
