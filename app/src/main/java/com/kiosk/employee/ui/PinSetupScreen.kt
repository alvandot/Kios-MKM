package com.kiosk.employee.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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

/** First run: admin wajib membuat PIN sebelum kiosk bisa dipakai. */
@Composable
fun PinSetupScreen(pinManager: PinManager, onDone: () -> Unit) {
    val scope = rememberCoroutineScope()
    PinFormScreen(
        firstTitle = "Buat PIN Admin",
        confirmTitle = "Konfirmasi PIN",
        subtitle = "PIN 6 digit untuk membuka menu admin dan keluar dari mode kiosk",
        onPinConfirmed = { pin ->
            scope.launch {
                pinManager.setPin(pin)
                onDone()
            }
        },
    )
}

/** Ganti PIN admin dari menu admin. */
@Composable
fun ChangePinScreen(pinManager: PinManager, onDone: () -> Unit) {
    val scope = rememberCoroutineScope()
    PinFormScreen(
        firstTitle = "Ganti PIN Admin",
        confirmTitle = "Konfirmasi PIN Baru",
        subtitle = "Masukkan PIN baru 6 digit, lalu ulangi untuk konfirmasi",
        onPinConfirmed = { pin ->
            scope.launch {
                pinManager.setPin(pin)
                onDone()
            }
        },
    )
}

@Composable
private fun PinFormScreen(
    firstTitle: String,
    confirmTitle: String,
    subtitle: String,
    onPinConfirmed: (String) -> Unit,
) {
    var stage by remember { mutableIntStateOf(1) }
    var firstPin by remember { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }

    fun submit() {
        if (pin.length != PinManager.PIN_LENGTH) return
        if (stage == 1) {
            firstPin = pin
            pin = ""
            error = null
            stage = 2
        } else if (pin == firstPin) {
            onPinConfirmed(pin)
        } else {
            error = "PIN tidak cocok. Ulangi dari awal."
            stage = 1
            firstPin = ""
            pin = ""
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
        Text(
            text = if (stage == 1) firstTitle else confirmTitle,
            style = MaterialTheme.typography.titleLarge,
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(modifier = Modifier.height(28.dp))
        PinDots(pin = pin)
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
                if (pin.length < PinManager.PIN_LENGTH) {
                    pin += digit
                    error = null
                    if (pin.length == PinManager.PIN_LENGTH) submit()
                }
            },
            onBackspace = {
                if (pin.isNotEmpty()) pin = pin.dropLast(1)
            },
        )
    }
}
