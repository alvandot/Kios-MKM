package com.kiosk.employee.kiosk

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.os.Build

/** A launchable app that can be shown on the employee dashboard. */
data class KioskAppInfo(
    val packageName: String,
    val label: String,
    val icon: Bitmap,
)

object KioskApps {

    private fun android.graphics.drawable.Drawable.toBitmap(): Bitmap {
        val bitmap = Bitmap.createBitmap(
            intrinsicWidth.coerceAtLeast(1),
            intrinsicHeight.coerceAtLeast(1),
            Bitmap.Config.ARGB_8888,
        )
        Canvas(bitmap).also { canvas -> setBounds(0, 0, canvas.width, canvas.height); draw(canvas) }
        return bitmap
    }

    fun installed(context: Context): List<KioskAppInfo> {
        val packageManager = context.packageManager
        val query = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val activities = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            packageManager.queryIntentActivities(
                query,
                PackageManager.ResolveInfoFlags.of(0),
            )
        } else {
            @Suppress("DEPRECATION")
            packageManager.queryIntentActivities(query, 0)
        }

        return activities
            .mapNotNull { info ->
                val packageName = info.activityInfo?.packageName ?: return@mapNotNull null
                if (packageName == context.packageName) return@mapNotNull null
                KioskAppInfo(
                    packageName = packageName,
                    label = info.loadLabel(packageManager).toString(),
                    icon = info.loadIcon(packageManager).toBitmap(),
                )
            }
            .distinctBy(KioskAppInfo::packageName)
            .sortedBy(KioskAppInfo::label)
    }

    fun launch(context: Context, packageName: String, lockTask: Boolean): Boolean {
        if (packageName == context.packageName) return false
        val intent = context.packageManager.getLaunchIntentForPackage(packageName) ?: return false
        if (lockTask && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            val options = android.app.ActivityOptions.makeBasic().apply {
                setLockTaskEnabled(true)
            }
            return try {
                context.startActivity(intent, options.toBundle())
                true
            } catch (_: Exception) {
                false
            }
        }
        return try {
            context.startActivity(intent)
            true
        } catch (_: Exception) {
            false
        }
    }
}
