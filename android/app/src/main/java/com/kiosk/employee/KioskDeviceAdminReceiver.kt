package com.kiosk.employee

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

/** Receiver device admin untuk provisioning Device Owner lewat ADB. */
class KioskDeviceAdminReceiver : DeviceAdminReceiver() {
    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
    }
}
