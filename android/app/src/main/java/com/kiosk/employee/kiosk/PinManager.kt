package com.kiosk.employee.kiosk

import android.content.Context
import android.content.SharedPreferences
import java.security.SecureRandom
import java.security.MessageDigest

/**
 * Penyimpanan PIN admin: hash + salt, tidak pernah menyimpan PIN asli.
 * Penalti percobaan salah tersimpan persisten agar force-stop/restart
 * tidak bisa melewati masa dikunci.
 */
class PinManager(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("kiosk_pin", Context.MODE_PRIVATE)

    fun hasPin(): Boolean = prefs.getString(KEY_PIN_HASH, null) != null

    fun setPin(pin: String) {
        val salt = ByteArray(SALT_BYTES).also { SecureRandom().nextBytes(it) }
        prefs.edit()
            .putString(KEY_SALT, salt.toHex())
            .putString(KEY_PIN_HASH, hash(pin, salt))
            .remove(KEY_FAILED_ATTEMPTS)
            .remove(KEY_LOCKED_UNTIL)
            .apply()
    }

    /** Verifikasi PIN. Bila salah, penalti dicatat dan masa kunci diperpanjang. */
    fun verifyPin(pin: String): Boolean {
        val salt = prefs.getString(KEY_SALT, null)?.hexToBytes() ?: return false
        val ok = hash(pin, salt) == prefs.getString(KEY_PIN_HASH, null)
        if (ok) clearFailedAttempts()
        return ok
    }

    fun failedAttempts(): Int = prefs.getInt(KEY_FAILED_ATTEMPTS, 0)

    fun lockedUntilMillis(): Long = prefs.getLong(KEY_LOCKED_UNTIL, 0L)

    /** Catat kegagalan; kembalikan waktu (epoch ms) sampai input boleh dilanjutkan. */
    fun recordFailedAttempt(): Long {
        val attempts = failedAttempts() + 1
        val until = System.currentTimeMillis() + penaltyMillisFor(attempts)
        prefs.edit()
            .putInt(KEY_FAILED_ATTEMPTS, attempts)
            .putLong(KEY_LOCKED_UNTIL, until)
            .apply()
        return until
    }

    fun clearFailedAttempts() {
        prefs.edit().remove(KEY_FAILED_ATTEMPTS).remove(KEY_LOCKED_UNTIL).apply()
    }

    private fun hash(pin: String, salt: ByteArray): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(salt + pin.toByteArray(Charsets.UTF_8)).toHex()
    }

    private fun ByteArray.toHex() = joinToString("") { "%02x".format(it) }
    private fun String.hexToBytes() = chunked(2).map { it.toInt(16).toByte() }.toByteArray()

    companion object {
        const val PIN_LENGTH = 6
        private const val KEY_PIN_HASH = "pin_hash"
        private const val KEY_SALT = "pin_salt"
        private const val KEY_FAILED_ATTEMPTS = "failed_attempts"
        private const val KEY_LOCKED_UNTIL = "locked_until"
        private const val SALT_BYTES = 16
        private const val FREE_ATTEMPTS = 4

        /** 4 percobaan bebas; ke-5 → 30 dtk, ke-6 → 60 dtk, selanjutnya → 120 dtk. */
        fun penaltyMillisFor(failedAttempts: Int): Long {
            val over = failedAttempts - FREE_ATTEMPTS
            return when {
                over <= 0 -> 0L
                over == 1 -> 30_000L
                over == 2 -> 60_000L
                else -> 120_000L
            }
        }
    }
}
