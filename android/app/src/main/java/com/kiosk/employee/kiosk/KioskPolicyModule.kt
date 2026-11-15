package com.kiosk.employee.kiosk

import android.app.ActivityManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.UserManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.kiosk.employee.KioskDeviceAdminReceiver

/**
 * Jembatan React Native ke kebijakan kiosk Android: Device Owner, Lock Task Mode,
 * user restriction, dan PIN admin. Semua logika kebijakan ada di sini; JS hanya
 * memanggil fungsi-fungsi ini.
 */
class KioskPolicyModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val pinManager by lazy { PinManager(reactContext) }
    private val dpm: DevicePolicyManager
        get() = reactContext.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
    private val admin: ComponentName
        get() = ComponentName(reactContext, KioskDeviceAdminReceiver::class.java)

    override fun getName() = "KioskPolicy"

    // MARK: - Status

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isDeviceOwner(): Boolean = dpm.isDeviceOwnerApp(reactContext.packageName)

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun isKioskActive(): Boolean {
        val am = reactContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        return am.lockTaskModeState != ActivityManager.LOCK_TASK_MODE_NONE
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun hasAdminPin(): Boolean = pinManager.hasPin()

    // MARK: - Provisioning & kebijakan

    /** Terapkan fitur lock task + user restriction. Aman dipanggil berulang. */
    @ReactMethod
    fun setupDeviceOwner(promise: Promise) {
        try {
            applyLockTaskFeatures()
            applyKioskRestrictions()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SETUP_FAILED", e)
        }
    }

    /**
     * Flags system UI saat lock task dibaca dari preferensi sehingga halaman
     * Settings di JS benar-benar mengubah perilaku system UI.
     *
     * NOTIFICATIONS menentukan apakah panel notifikasi bisa ditarik; OVERVIEW
     * tidak pernah diikutkan supaya tombol Recents hilang.
     */
    private fun applyLockTaskFeatures() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) return
        val prefs = reactContext.getSharedPreferences("kiosk_policy", Context.MODE_PRIVATE)
        var flags = DevicePolicyManager.LOCK_TASK_FEATURE_HOME
        if (prefs.getBoolean(KEY_SYSTEM_INFO, true)) {
            flags = flags or DevicePolicyManager.LOCK_TASK_FEATURE_SYSTEM_INFO
        }
        if (prefs.getBoolean(KEY_ALLOW_NOTIFICATIONS, false)) {
            flags = flags or DevicePolicyManager.LOCK_TASK_FEATURE_NOTIFICATIONS
        }
        if (!prefs.getBoolean(KEY_BLOCK_POWER_MENU, true)) {
            flags = flags or DevicePolicyManager.LOCK_TASK_FEATURE_GLOBAL_ACTIONS
        }
        try {
            dpm.setLockTaskFeatures(admin, flags)
        } catch (_: Exception) {
            // Sebagian OEM menolak kombinasi ini; biarkan mode kiosk tetap berjalan.
        }
    }

    /** Konfigurasi fitur lock task dari halaman Settings (JS). */
    @ReactMethod
    fun setFeatureFlags(
        allowNotifications: Boolean,
        blockPowerMenu: Boolean,
        showSystemInfo: Boolean,
        promise: Promise,
    ) {
        try {
            reactContext.getSharedPreferences("kiosk_policy", Context.MODE_PRIVATE)
                .edit()
                .putBoolean(KEY_ALLOW_NOTIFICATIONS, allowNotifications)
                .putBoolean(KEY_BLOCK_POWER_MENU, blockPowerMenu)
                .putBoolean(KEY_SYSTEM_INFO, showSystemInfo)
                .apply()
            applyLockTaskFeatures()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("FLAGS_FAILED", e)
        }
    }

    @ReactMethod
    fun getFeatureFlags(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("kiosk_policy", Context.MODE_PRIVATE)
            val result = WritableNativeMap()
            result.putBoolean(KEY_ALLOW_NOTIFICATIONS, prefs.getBoolean(KEY_ALLOW_NOTIFICATIONS, false))
            result.putBoolean(KEY_BLOCK_POWER_MENU, prefs.getBoolean(KEY_BLOCK_POWER_MENU, true))
            result.putBoolean(KEY_SYSTEM_INFO, prefs.getBoolean(KEY_SYSTEM_INFO, true))
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("FLAGS_READ_FAILED", e)
        }
    }

    /** Kunci jalur konfigurasi yang bisa dipakai keluar dari kiosk. */
    private fun applyKioskRestrictions() {
        val restrictions = listOf(
            UserManager.DISALLOW_CONFIG_WIFI,
            UserManager.DISALLOW_CONFIG_BLUETOOTH,
            UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS,
            UserManager.DISALLOW_CONFIG_TETHERING,
            UserManager.DISALLOW_CONFIG_VPN,
            UserManager.DISALLOW_USER_SWITCH,
            UserManager.DISALLOW_ADD_USER,
            UserManager.DISALLOW_SAFE_BOOT,
            UserManager.DISALLOW_FACTORY_RESET,
            UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES,
        )
        for (restriction in restrictions) {
            try {
                dpm.addUserRestriction(admin, restriction)
            } catch (_: Exception) {
                // Lanjutkan; restriction lain tetap dipasang.
            }
        }
    }

    private fun clearKioskRestrictions() {
        val restrictions = listOf(
            UserManager.DISALLOW_CONFIG_WIFI,
            UserManager.DISALLOW_CONFIG_BLUETOOTH,
            UserManager.DISALLOW_CONFIG_MOBILE_NETWORKS,
            UserManager.DISALLOW_CONFIG_TETHERING,
            UserManager.DISALLOW_CONFIG_VPN,
            UserManager.DISALLOW_USER_SWITCH,
            UserManager.DISALLOW_ADD_USER,
            UserManager.DISALLOW_SAFE_BOOT,
            UserManager.DISALLOW_FACTORY_RESET,
            UserManager.DISALLOW_INSTALL_UNKNOWN_SOURCES,
        )
        for (restriction in restrictions) {
            try {
                dpm.clearUserRestriction(admin, restriction)
            } catch (_: Exception) {
            }
        }
    }

    // MARK: - Masuk / keluar kiosk

    /**
     * Masuk mode kiosk: whitelist paket terpilih + app ini, lalu startLockTask.
     * Fitur lock task diterapkan dua kali (sebelum & sesudah) karena
     * LockTaskController kadang menyimpan flag lama.
     */
    @ReactMethod
    fun enterKiosk(packages: ReadableArray, promise: Promise) {
        try {
            val allowed = mutableSetOf(reactContext.packageName)
            for (i in 0 until packages.size()) {
                allowed.add(packages.getString(i))
            }
            try {
                dpm.setLockTaskPackages(admin, allowed.toTypedArray())
            } catch (_: Exception) {
            }
            applyLockTaskFeatures()
            reactApplicationContext.currentActivity?.startLockTask()
            applyLockTaskFeatures()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ENTER_FAILED", e)
        }
    }

    /** Keluar kiosk. stopLockTask dipanggil tanpa syarat agar tidak ada yang terkunci. */
    @ReactMethod
    fun exitKiosk(promise: Promise) {
        try {
            reactApplicationContext.currentActivity?.stopLockTask()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("EXIT_FAILED", e)
        }
    }

    @ReactMethod
    fun clearDeviceOwner(promise: Promise) {
        try {
            clearKioskRestrictions()
            try {
                dpm.setLockTaskPackages(admin, emptyArray())
            } catch (_: Exception) {
            }
            dpm.clearDeviceOwnerApp(reactContext.packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CLEAR_FAILED", e)
        }
    }

    // MARK: - PIN admin

    @ReactMethod
    fun setAdminPin(pin: String, promise: Promise) {
        try {
            if (pin.length != PinManager.PIN_LENGTH) {
                promise.reject("BAD_PIN", "PIN harus ${PinManager.PIN_LENGTH} digit")
                return
            }
            pinManager.setPin(pin)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_PIN_FAILED", e)
        }
    }

    /** Kembalikan { ok, lockedUntilSeconds } — JS menampilkan hitungan mundur. */
    @ReactMethod
    fun verifyAdminPin(pin: String, promise: Promise) {
        try {
            val result = WritableNativeMap()
            if (pinManager.lockedUntilMillis() > System.currentTimeMillis()) {
                result.putBoolean("ok", false)
                result.putDouble("lockedUntilSeconds", lockedSecondsLeft())
                promise.resolve(result)
                return
            }
            val ok = pinManager.verifyPin(pin)
            if (!ok) {
                val until = pinManager.recordFailedAttempt()
                result.putDouble(
                    "lockedUntilSeconds",
                    ((until - System.currentTimeMillis()).coerceAtLeast(0L)) / 1000.0,
                )
            } else {
                result.putBoolean("ok", true)
                result.putDouble("lockedUntilSeconds", 0.0)
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("VERIFY_FAILED", e)
        }
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    fun lockedUntilSeconds(): Double = lockedSecondsLeft()

    private fun lockedSecondsLeft(): Double {
        val remaining = pinManager.lockedUntilMillis() - System.currentTimeMillis()
        return (remaining.coerceAtLeast(0L)) / 1000.0
    }

    // MARK: - Aplikasi dashboard

    /** Daftar app launcher yang terpasang: label, packageName, ikon base64 PNG. */
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
            val resolveInfos = pm.queryIntentActivities(intent, 0)
            val self = reactContext.packageName
            val array = WritableNativeArray()
            for (info in resolveInfos) {
                val pkg = info.activityInfo.packageName
                if (pkg == self) continue
                val item = WritableNativeMap()
                item.putString("label", info.loadLabel(pm).toString())
                item.putString("packageName", pkg)
                val drawable = info.loadIcon(pm)
                val bitmap = android.graphics.Bitmap.createBitmap(
                    drawable.intrinsicWidth.coerceAtLeast(1),
                    drawable.intrinsicHeight.coerceAtLeast(1),
                    android.graphics.Bitmap.Config.ARGB_8888,
                )
                val canvas = android.graphics.Canvas(bitmap)
                drawable.setBounds(0, 0, canvas.width, canvas.height)
                drawable.draw(canvas)
                val stream = java.io.ByteArrayOutputStream()
                bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, stream)
                item.putString("icon", android.util.Base64.encodeToString(stream.toByteArray(), android.util.Base64.NO_WRAP))
                array.pushMap(item)
            }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("APPS_FAILED", e)
        }
    }

    // MARK: - Pilihan aplikasi (persisten)

    @ReactMethod
    fun setSelectedPackages(packages: ReadableArray, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("kiosk_policy", Context.MODE_PRIVATE)
            prefs.edit().putStringSet(
                "selected_packages",
                (0 until packages.size()).map { packages.getString(it) }.toSet(),
            ).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_SELECTED_FAILED", e)
        }
    }

    @ReactMethod
    fun getSelectedPackages(promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("kiosk_policy", Context.MODE_PRIVATE)
            val array = WritableNativeArray()
            prefs.getStringSet("selected_packages", emptySet())?.forEach { array.pushString(it) }
            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("GET_SELECTED_FAILED", e)
        }
    }

    @ReactMethod
    fun launchApp(packageName: String, promise: Promise) {
        try {
            val pm = reactContext.packageManager
            val intent = pm.getLaunchIntentForPackage(packageName)
            if (intent == null) {
                promise.reject("NOT_FOUND", "Aplikasi tidak ditemukan")
                return
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("LAUNCH_FAILED", e)
        }
    }

    override fun getConstants(): Map<String, Any> = mapOf(
        "PIN_LENGTH" to PinManager.PIN_LENGTH,
    )

    private companion object {
        const val KEY_ALLOW_NOTIFICATIONS = "allow_notifications"
        const val KEY_BLOCK_POWER_MENU = "block_power_menu"
        const val KEY_SYSTEM_INFO = "show_system_info"
    }
}
