package com.kiosk.employee.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/** Menu admin setelah PIN benar: keluar/masuk kiosk, ganti PIN, lepas device owner. */
@Composable
fun AdminScreen(
    kioskEnabled: Boolean,
    deviceOwner: Boolean,
    onExitKiosk: () -> Unit,
    onEnterKiosk: () -> Unit,
    onManageApps: () -> Unit,
    onChangePin: () -> Unit,
    onBackToKiosk: () -> Unit,
    onClearDeviceOwner: () -> Unit,
) {
    var showClearDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp, vertical = 32.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            text = "Menu Admin",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
        )
        Text(
            text = "Kelola mode kiosk perangkat ini",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(16.dp))

        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                StatusRow(
                    label = "Device Owner",
                    value = if (deviceOwner) "Aktif" else "Tidak aktif",
                    positive = deviceOwner,
                )
                StatusRow(
                    label = "Mode Kiosk",
                    value = if (kioskEnabled) "Aktif" else "Nonaktif",
                    positive = kioskEnabled,
                )
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Button(
            onClick = onExitKiosk,
            enabled = kioskEnabled,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.error,
                contentColor = MaterialTheme.colorScheme.onError,
            ),
        ) {
            Text(text = "Keluar Mode Kiosk")
        }
        Button(
            onClick = onEnterKiosk,
            enabled = !kioskEnabled,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(text = "Masuk Kembali ke Mode Kiosk")
        }
        OutlinedButton(onClick = onManageApps, modifier = Modifier.fillMaxWidth()) {
            Text(text = "Pilih Aplikasi Dashboard")
        }
        OutlinedButton(onClick = onChangePin, modifier = Modifier.fillMaxWidth()) {
            Text(text = "Ganti PIN Admin")
        }
        OutlinedButton(onClick = onBackToKiosk, modifier = Modifier.fillMaxWidth()) {
            Text(text = "Kembali ke Layar Kiosk")
        }

        Spacer(modifier = Modifier.height(32.dp))

        if (deviceOwner) {
            TextButton(
                onClick = { showClearDialog = true },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.textButtonColors(
                    contentColor = MaterialTheme.colorScheme.error,
                ),
            ) {
                Text(text = "Hapus Device Owner")
            }
        } else {
            Text(
                text = "Perangkat belum di-provisioning. Jalankan: adb shell dpm set-device-owner com.kiosk.employee/.KioskDeviceAdminReceiver",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }

        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "Kiosk Karyawan v1.0",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }

    if (showClearDialog) {
        AlertDialog(
            onDismissRequest = { showClearDialog = false },
            title = { Text(text = "Hapus Device Owner?") },
            text = {
                Text(
                    text = "Perangkat akan dilepas dari mode kiosk secara permanen. " +
                        "Untuk mengaktifkan kembali, provisioning ulang lewat ADB diperlukan.",
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    showClearDialog = false
                    onClearDeviceOwner()
                }) {
                    Text(
                        text = "Hapus",
                        color = MaterialTheme.colorScheme.error,
                    )
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearDialog = false }) {
                    Text(text = "Batal")
                }
            },
        )
    }
}

@Composable
private fun StatusRow(label: String, value: String, positive: Boolean) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = if (positive) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
        )
    }
}
