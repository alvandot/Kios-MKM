package com.kiosk.employee.ui.theme

import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color

private val DarkColors = darkColorScheme(
    primary = Color(0xFF00C2A8),
    onPrimary = Color(0xFF00322B),
    primaryContainer = Color(0xFF00514A),
    onPrimaryContainer = Color(0xFFB8F5EC),
    secondary = Color(0xFF8FD9D1),
    onSecondary = Color(0xFF00322B),
    background = Color(0xFF0A1128),
    onBackground = Color(0xFFE6ECF5),
    surface = Color(0xFF111C3E),
    onSurface = Color(0xFFE6ECF5),
    surfaceVariant = Color(0xFF1B2748),
    onSurfaceVariant = Color(0xFFB9C4DC),
    error = Color(0xFFFF6B6B),
    onError = Color(0xFF2B0A0A),
    errorContainer = Color(0xFF4A1220),
    onErrorContainer = Color(0xFFFFD9D9),
    outline = Color(0xFF3A4A73),
)

@Composable
fun KioskTheme(content: @Composable () -> Unit) {
    // Aplikasi kiosk selalu tampil gelap agar konsisten di layar publik.
    MaterialTheme(colorScheme = DarkColors) {
        // Teks tanpa warna eksplisit ikut warna onBackground (terang).
        CompositionLocalProvider(
            LocalContentColor provides DarkColors.onBackground,
            content = content,
        )
    }
}
