package com.kiosk.employee

import android.content.Intent
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "KioskEmployee"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * App ini adalah HOME handler (singleTask). Setiap kali tombol Home ditekan,
   * onNewIntent dipanggil — kirim event ke JS supaya navigasi kembali ke dashboard.
   */
  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    Log.d("KioskHome", "onNewIntent: emit kioskHomePressed")
    (application as? MainApplication)
        ?.reactHost
        ?.currentReactContext
        ?.emitDeviceEvent("kioskHomePressed", null)
  }
}
