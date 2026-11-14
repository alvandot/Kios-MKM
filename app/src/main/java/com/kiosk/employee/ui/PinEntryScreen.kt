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
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
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
import kotlinx.coroutines.launch

/** Gerbang keluar kiosk: PIN admin yang benar membuka menu admin. */
@Composable
fun PinEntryScreen(pinManager: PinManager, onSuccess: () -> Unit) {
    var pin by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var checking by remember { mutableStateOf(false) }
    var attempts by remember { mutableIntStateOf(0) }
    val scope = rememberCoroutineScope()

    fun submit() {
        if (checking || pin.length != PinManager.PIN_LENGTH) return
        checking = true
        val entered = pin
        scope.launch {
            val ok = pinManager.verifyPin(entered)
            checking = false
            if (ok) {
                onSuccess()
            } else {
                attempts += 1
                error = "PIN salah (percobaan ke-$attempts)"
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
        Spacer(modifier = Modifier.height(28.dp))
        PinKeypad(
            onDigit = { digit ->
                if (!checking && pin.length < PinManager.PIN_LENGTH) {
                    pin += digit
                    error = null
                    if (pin.length == PinManager.PIN_LENGTH) submit()
                }
            },
            onBackspace = {
                if (!checking && pin.isNotEmpty()) pin = pin.dropLast(1)
            },
        )
    }
}
