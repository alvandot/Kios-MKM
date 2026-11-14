package com.kiosk.employee

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import com.kiosk.employee.kiosk.KioskManager

/**
 * Receiver device admin. Saat provisioning `dpm set-device-owner` dijalankan,
 * onEnabled terpanggil dan kita langsung mendaftarkan lock task packages + HOME
 * persisten agar kiosk aktif tanpa langkah manual tambahan.
 */
class KioskDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        KioskManager.applyDeviceOwnerSetup(context)
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return context.getString(R.string.admin_disable_warning)
    }
}
