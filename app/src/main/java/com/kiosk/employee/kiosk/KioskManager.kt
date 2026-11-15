package com.kiosk.employee.kiosk

import android.app.Activity
import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.view.WindowManager
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.kiosk.employee.KioskDeviceAdminReceiver
import com.kiosk.employee.MainActivity

/**
 * Utilitas untuk mengatur mode kiosk.
 *
 * Mode kiosk utama memakai Lock Task Mode (butuh device owner): setelah
 * provisioning, perangkat hanya bisa berada di aplikasi ini — Home, Recents,
 * dan notifikasi diblokir oleh sistem, bukan sekadar disembunyikan.
 */
object KioskManager {

    fun isDeviceOwner(context: Context): Boolean {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        return dpm.isDeviceOwnerApp(context.packageName)
    }

    /**
     * Dipanggil saat device owner aktif (provisioning / boot pertama):
     * whitelist paket untuk lock task dan jadikan aplikasi ini HOME persisten
     * sehingga perangkat otomatis membuka kiosk saat boot.
     */
    fun applyDeviceOwnerSetup(context: Context, selectedPackages: Set<String> = emptySet()) {
        if (!isDeviceOwner(context)) return
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(context, KioskDeviceAdminReceiver::class.java)
        val installedPackages = KioskApps.installed(context).mapTo(mutableSetOf()) { it.packageName }
        val allowedPackages = selectedPackages.intersect(installedPackages) + context.packageName

        dpm.setLockTaskPackages(admin, allowedPackages.toTypedArray())
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            dpm.setLockTaskFeatures(
                admin,
                DevicePolicyManager.LOCK_TASK_FEATURE_HOME or
                    DevicePolicyManager.LOCK_TASK_FEATURE_GLOBAL_ACTIONS,
            )
        }

        val homeFilter = IntentFilter(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            addCategory(Intent.CATEGORY_DEFAULT)
        }
        dpm.addPersistentPreferredActivity(
            admin,
            homeFilter,
            ComponentName(context, MainActivity::class.java),
        )
    }

    fun enterKiosk(activity: Activity) {
        val dpm = activity.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(activity, KioskDeviceAdminReceiver::class.java)
        if (dpm.isDeviceOwnerApp(activity.packageName)) {
            try {
                dpm.setStatusBarDisabled(admin, true)
            } catch (_: Exception) {
                // Beberapa OEM menolak API ini; immersive mode tetap jalan.
            }
            try {
                activity.startLockTask()
            } catch (_: Exception) {
                // Sudah terkunci / belum siap; diulang pada perubahan state berikutnya.
            }
        } else {
            // Fallback tanpa provisioning: screen pinning biasa (user harus konfirmasi
            // sekali lewat dialog sistem, bisa keluar dengan tahan tombol overview+back).
            try {
                activity.startLockTask()
            } catch (_: Exception) {
                // User menolak dialog pinning.
            }
        }
        hideSystemBars(activity)
    }

    fun exitKiosk(activity: Activity) {
        val dpm = activity.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val admin = ComponentName(activity, KioskDeviceAdminReceiver::class.java)
        if (dpm.isDeviceOwnerApp(activity.packageName)) {
            try {
                dpm.setStatusBarDisabled(admin, false)
            } catch (_: Exception) {
                // Abaikan.
            }
        }
        // Selalu jalankan, termasuk pada mode demo screen-pinning (tanpa device owner),
        // supaya perangkat tidak tetap terkunci setelah admin keluar dari mode kiosk.
        try {
            activity.stopLockTask()
        } catch (_: Exception) {
            // Tidak sedang dalam lock task.
        }
        showSystemBars(activity)
    }

    fun isLockTaskActive(context: Context): Boolean {
        val am = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return am.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
    }

    @Suppress("DEPRECATION")
    fun clearDeviceOwner(context: Context) {
        if (!isDeviceOwner(context)) return
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        try {
            dpm.clearDeviceOwnerApp(context.packageName)
        } catch (_: Exception) {
            // Sudah bukan device owner.
        }
    }

    private fun hideSystemBars(activity: Activity) {
        WindowCompat.setDecorFitsSystemWindows(activity.window, false)
        val controller = WindowInsetsControllerCompat(activity.window, activity.window.decorView)
        controller.hide(WindowInsetsCompat.Type.systemBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }

    private fun showSystemBars(activity: Activity) {
        val controller = WindowInsetsControllerCompat(activity.window, activity.window.decorView)
        controller.show(WindowInsetsCompat.Type.systemBars())
    }
}
