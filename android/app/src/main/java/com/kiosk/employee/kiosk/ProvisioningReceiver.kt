package com.kiosk.employee.kiosk

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

/**
 * Penerima broadcast provisioning PIN admin.
 *
 * Manifest memasang android:permission="android.permission.DUMP" pada receiver
 * ini, sehingga hanya shell/root (ADB) yang bisa mengiriminya — karyawan tidak
 * dapat mengklaim menu admin dengan broadcast palsu.
 */
class ProvisioningReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        android.util.Log.d("KIOSKPIN", "receive action=${intent.action} pin=${intent.getStringExtra(EXTRA_PIN)}")
        if (intent.action != ACTION_SET_ADMIN_PIN) return
        val pin = intent.getStringExtra(EXTRA_PIN) ?: return
        if (pin.length != PinManager.PIN_LENGTH || pin.any { !it.isDigit() }) {
            Toast.makeText(context, "PIN harus 6 digit angka", Toast.LENGTH_LONG).show()
            return
        }
        PinManager(context).setPin(pin)
        Toast.makeText(context, "PIN admin berhasil ditetapkan", Toast.LENGTH_LONG).show()
    }

    companion object {
        const val ACTION_SET_ADMIN_PIN = "com.kiosk.employee.action.SET_ADMIN_PIN"
        const val EXTRA_PIN = "pin"
    }
}
