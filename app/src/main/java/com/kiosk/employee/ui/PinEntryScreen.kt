package com.kiosk.employee.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.kiosk.employee.R
import com.kiosk.employee.pin.PinManager
import com.kiosk.employee.ui.components.PinDots
import com.kiosk.employee.ui.components.PinKeypad
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** Gerbang keluar kiosk: PIN admin yang benar membuka menu admin. */
@Composable
fun PinEntryScreen(pinManager: PinManager, onSuccess: () -> Unit) {
    var pin by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var checking by remember { mutableStateOf(false) }
    var lockedUntil by remember { mutableLongStateOf(0L) }
    var now by remember { mutableLongStateOf(System.currentTimeMillis()) }
    val scope = rememberCoroutineScope()

    // Muat penalti yang tersimpan (bertahan setelah app ditutup / perangkat restart).
    LaunchedEffect(Unit) {
        lockedUntil = pinManager.lockedUntilMillis()
        now = System.currentTimeMillis()
    }

    // Hitungan mundur selama input dijeda.
    LaunchedEffect(lockedUntil) {
        while (System.currentTimeMillis() < lockedUntil) {
            now = System.currentTimeMillis()
            delay(1_000)
        }
        now = System.currentTimeMillis()
    }

    val remainingSeconds = ((lockedUntil - now) / 1_000).coerceAtLeast(0L)
    val locked = remainingSeconds > 0L

    fun submit() {
        if (checking || locked || pin.length != PinManager.PIN_LENGTH) return
        checking = true
        val entered = pin
        scope.launch {
            val ok = pinManager.verifyPin(entered)
            checking = false
            if (ok) {
                pinManager.clearFailedAttempts()
                lockedUntil = 0L
                onSuccess()
            } else {
                lockedUntil = pinManager.recordFailedAttempt()
                now = System.currentTimeMillis()
                error = "PIN salah"
                pin = ""
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Icon(
            painter = painterResource(R.drawable.ic_launcher_foreground),
            contentDescription = null,
            tint = Color.Unspecified,
            modifier = Modifier.size(72.dp),
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(text = "Masukkan PIN Admin", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "PIN diperlukan untuk membuka menu admin",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(28.dp))
        PinDots(pin = pin)
        if (checking) {
            Spacer(modifier = Modifier.height(12.dp))
            CircularProgressIndicator(modifier = Modifier.size(28.dp))
        }
        error?.let { message ->
            Spacer(modifier = Modifier.height(10.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
            )
        }
        if (locked) {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = "Coba lagi dalam $remainingSeconds detik",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                textAlign = TextAlign.Center,
            )
        }
        Spacer(modifier = Modifier.height(28.dp))
        PinKeypad(
            onDigit = { digit ->
                if (!checking && !locked && pin.length < PinManager.PIN_LENGTH) {
                    pin += digit
                    error = null
                    if (pin.length == PinManager.PIN_LENGTH) submit()
                }
            },
            onBackspace = {
                if (!checking && !locked && pin.isNotEmpty()) pin = pin.dropLast(1)
            },
        )
    }
}
