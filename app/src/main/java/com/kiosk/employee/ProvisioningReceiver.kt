package com.kiosk.employee

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.kiosk.employee.kiosk.KioskManager
import com.kiosk.employee.pin.PinManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Menetapkan PIN admin dari provisioning ADB.
 *
 * PIN awal tidak boleh dibuat dari layar aplikasi: siapa pun yang membuka akses admin
 * tersembunyi bisa mengklaim PIN pertama. Karena itu receiver ini diproteksi permission
 * `android.permission.DUMP`, yang hanya dipegang shell/root (ADB) — bukan aplikasi biasa.
 *
 * Pemakaian (broadcast harus eksplisit ke komponen receiver):
 *   adb shell am broadcast -n com.kiosk.employee/.ProvisioningReceiver \
 *       -a com.kiosk.employee.action.SET_ADMIN_PIN --es pin 654321
 *   adb shell am broadcast -n com.kiosk.employee/.ProvisioningReceiver \
 *       -a com.kiosk.employee.action.SET_ADMIN_PIN --es pin 654321 --ez force true
 */
class ProvisioningReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_SET_ADMIN_PIN) return

        val pin = intent.getStringExtra(EXTRA_PIN)
        if (pin == null || !PIN_REGEX.matches(pin)) {
            Log.w(TAG, "SET_ADMIN_PIN ditolak: PIN harus tepat ${PinManager.PIN_LENGTH} digit")
            return
        }

        val force = intent.getBooleanExtra(EXTRA_FORCE, false)
        val appContext = context.applicationContext
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val pinManager = PinManager(appContext)
                if (pinManager.hasPin() && !force) {
                    Log.w(TAG, "PIN sudah ada; pakai --ez force true untuk menggantinya")
                    return@launch
                }
                pinManager.setPin(pin)
                pinManager.setKioskEnabled(true)
                KioskManager.applyDeviceOwnerSetup(appContext, pinManager.selectedPackages())
                Log.i(TAG, "PIN admin berhasil diset dari provisioning")
            } catch (t: Throwable) {
                Log.e(TAG, "Gagal menetapkan PIN admin", t)
            } finally {
                pending.finish()
            }
        }
    }

    companion object {
        const val ACTION_SET_ADMIN_PIN = "com.kiosk.employee.action.SET_ADMIN_PIN"
        const val EXTRA_PIN = "pin"
        const val EXTRA_FORCE = "force"

        private const val TAG = "ProvisioningReceiver"
        private val PIN_REGEX = Regex("^\\d{${PinManager.PIN_LENGTH}}$")
    }
}