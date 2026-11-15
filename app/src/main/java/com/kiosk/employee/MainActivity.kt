package com.kiosk.employee

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.kiosk.employee.kiosk.KioskApps
import com.kiosk.employee.kiosk.KioskManager
import com.kiosk.employee.kiosk.KioskAppInfo
import com.kiosk.employee.pin.PinManager
import com.kiosk.employee.ui.AdminLockedScreen
import com.kiosk.employee.ui.AdminScreen
import com.kiosk.employee.ui.AppSelectionScreen
import com.kiosk.employee.ui.ChangePinScreen
import com.kiosk.employee.ui.KioskScreen
import com.kiosk.employee.ui.PinEntryScreen
import com.kiosk.employee.ui.theme.KioskTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private val pinManager by lazy { PinManager(applicationContext) }
    private var navController: NavHostController? = null
    private var deviceOwner by mutableStateOf(false)
    private var installedApps by mutableStateOf<List<KioskAppInfo>>(emptyList())

    // State key combination Volume Up + Volume Down (ditahan bersamaan 3 detik).
    private val comboHandler = Handler(Looper.getMainLooper())
    private val comboKeys = mutableSetOf<Int>()
    private var comboRunnable: Runnable? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        deviceOwner = KioskManager.isDeviceOwner(this)
        refreshInstalledApps()

        setContent {
            KioskTheme {
                KioskApp(
                    pinManager = pinManager,
                    deviceOwner = deviceOwner,
                    installedApps = installedApps,
                    onRefreshInstalledApps = { refreshInstalledApps() },
                    onNavControllerReady = { navController = it },
                    onClearDeviceOwner = { clearDeviceOwner() },
                )
            }
        }
    }

    override fun onResume() {
        super.onResume()
        deviceOwner = KioskManager.isDeviceOwner(this)
        refreshInstalledApps()
    }

    private fun refreshInstalledApps() {
        installedApps = KioskApps.installed(this)
    }

    private fun clearDeviceOwner() {
        KioskManager.clearDeviceOwner(this)
        deviceOwner = KioskManager.isDeviceOwner(this)
        lifecycleScope.launch { pinManager.setKioskEnabled(false) }
    }

    // ---------------------------------------------------------------------
    // Key combination keluar kiosk: tahan Volume Up + Volume Down 3 detik.
    // Tombol volume dikonsumsi penuh supaya tidak mengubah volume di kiosk.
    // ---------------------------------------------------------------------

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (isVolumeKey(keyCode)) {
            if (event != null && event.repeatCount == 0) {
                comboKeys.add(keyCode)
                maybeArmCombo()
            }
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onKeyUp(keyCode: Int, event: KeyEvent?): Boolean {
        if (isVolumeKey(keyCode)) {
            comboKeys.remove(keyCode)
            if (comboKeys.size < 2) disarmCombo()
            return true
        }
        return super.onKeyUp(keyCode, event)
    }

    private fun isVolumeKey(keyCode: Int) =
        keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN

    private fun maybeArmCombo() {
        val bothPressed = comboKeys.contains(KeyEvent.KEYCODE_VOLUME_UP) &&
            comboKeys.contains(KeyEvent.KEYCODE_VOLUME_DOWN)
        if (comboRunnable == null && bothPressed) {
            val task = Runnable {
                comboRunnable = null
                comboKeys.clear()
                openAdminGate()
            }
            comboRunnable = task
            comboHandler.postDelayed(task, COMBO_HOLD_MS)
        }
    }

    private fun disarmCombo() {
        comboRunnable?.let { comboHandler.removeCallbacks(it) }
        comboRunnable = null
    }

    private fun openAdminGate() {
        val controller = navController ?: return
        lifecycleScope.launch { openAdminGate(controller, pinManager) }
    }

    override fun onDestroy() {
        super.onDestroy()
        disarmCombo()
    }

    private companion object {
        const val COMBO_HOLD_MS = 3_000L
    }
}

private object Routes {
    const val KIOSK = "kiosk"
    const val PIN_ENTRY = "pin_entry"
    const val ADMIN = "admin"
    const val CHANGE_PIN = "change_pin"
    const val APP_SELECTION = "app_selection"
    const val ADMIN_LOCKED = "admin_locked"
}

/**
 * Gerbang admin. Bila PIN belum ada, perangkat terkunci di layar informasi —
 * PIN awal hanya bisa ditetapkan lewat provisioning ADB (ProvisioningReceiver).
 */
private suspend fun openAdminGate(navController: NavHostController, pinManager: PinManager) {
    if (navController.currentDestination?.route != Routes.KIOSK) return
    val route = if (pinManager.hasPin()) Routes.PIN_ENTRY else Routes.ADMIN_LOCKED
    navController.navigate(route) { launchSingleTop = true }
}

private fun navigateClearing(navController: NavHostController, route: String) {
    navController.navigate(route) {
        popUpTo(navController.graph.findStartDestination().id) { inclusive = true }
        launchSingleTop = true
    }
}

@Composable
private fun KioskApp(
    pinManager: PinManager,
    deviceOwner: Boolean,
    installedApps: List<KioskAppInfo>,
    onRefreshInstalledApps: () -> Unit,
    onNavControllerReady: (NavHostController) -> Unit,
    onClearDeviceOwner: () -> Unit,
) {
    val context = LocalContext.current
    val activity = context as? ComponentActivity
    val navController = rememberNavController()
    val scope = rememberCoroutineScope()

    LaunchedEffect(navController) { onNavControllerReady(navController) }

    // null = belum ada emission dari DataStore (dipakai untuk menentukan route awal).
    val kioskEnabled: Boolean? by pinManager.kioskEnabledFlow.collectAsState(initial = null)
    val selectedPackagesValue: Set<String>? by pinManager.selectedPackagesFlow.collectAsState(initial = null)

    val enabled = kioskEnabled
    val selectedPackages = selectedPackagesValue
    if (enabled == null || selectedPackages == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }
    LaunchedEffect(enabled, selectedPackages, deviceOwner) {
        KioskManager.applyDeviceOwnerSetup(context, selectedPackages)
        if (activity != null) {
            if (enabled) KioskManager.enterKiosk(activity) else KioskManager.exitKiosk(activity)
        }
    }

    NavHost(navController = navController, startDestination = Routes.KIOSK) {
        composable(Routes.KIOSK) {
            BackHandler(enabled = true) {
                // Layar kiosk adalah tujuan akhir; back tidak boleh menutup app.
            }
            KioskScreen(
                apps = installedApps.filter { it.packageName in selectedPackages },
                onRequestAdmin = {
                    scope.launch {
                        openAdminGate(navController, pinManager)
                    }
                },
                onLaunchApp = { packageName ->
                    KioskApps.launch(context, packageName, deviceOwner && kioskEnabled == true)
                },
            )
        }

        composable(Routes.ADMIN_LOCKED) {
            AdminLockedScreen(
                onBack = { navigateClearing(navController, Routes.KIOSK) },
            )
        }

        composable(Routes.PIN_ENTRY) {
            PinEntryScreen(
                pinManager = pinManager,
                onSuccess = {
                    navController.navigate(Routes.ADMIN) {
                        popUpTo(Routes.PIN_ENTRY) { inclusive = true }
                        launchSingleTop = true
                    }
                },
            )
        }

        composable(Routes.ADMIN) {
            AdminScreen(
                kioskEnabled = kioskEnabled == true,
                deviceOwner = deviceOwner,
                onExitKiosk = {
                    scope.launch { pinManager.setKioskEnabled(false) }
                    navigateClearing(navController, Routes.KIOSK)
                },
                onEnterKiosk = {
                    scope.launch { pinManager.setKioskEnabled(true) }
                    navigateClearing(navController, Routes.KIOSK)
                },
                onManageApps = {
                    onRefreshInstalledApps()
                    navController.navigate(Routes.APP_SELECTION) { launchSingleTop = true }
                },
                onChangePin = {
                    navController.navigate(Routes.CHANGE_PIN) { launchSingleTop = true }
                },
                onBackToKiosk = { navigateClearing(navController, Routes.KIOSK) },
                onClearDeviceOwner = onClearDeviceOwner,
            )
        }

        composable(Routes.CHANGE_PIN) {
            ChangePinScreen(
                pinManager = pinManager,
                onDone = { navController.popBackStack() },
            )
        }

        composable(Routes.APP_SELECTION) {
            AppSelectionScreen(
                apps = installedApps,
                selectedPackages = selectedPackages,
                onSave = { packages ->
                    scope.launch {
                        val valid = packages.intersect(installedApps.map { it.packageName }.toSet())
                        pinManager.setSelectedPackages(valid)
                        KioskManager.applyDeviceOwnerSetup(context, valid)
                        navigateClearing(navController, Routes.ADMIN)
                    }
                },
                onCancel = { navController.popBackStack() },
            )
        }
    }
}
