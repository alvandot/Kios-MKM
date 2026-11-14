# Kiosk Karyawan — Aplikasi Android Kiosk Mode

Aplikasi Android untuk perangkat **kiosk karyawan**: perangkat terkunci penuh ke aplikasi ini
(karyawan tidak bisa pindah ke aplikasi lain), dan untuk **keluar dari mode kiosk** diperlukan
**key combination + PIN admin**.

Dibangun dengan **Kotlin + Jetpack Compose**, memakai pola resmi Google untuk kiosk:
**Device Owner + Lock Task Mode** (COSU — Corporate-Owned, Single-Use).

## Fitur

- 🔒 **Kiosk penuh** — setelah provisioning, tombol Home, Recents, Back ke luar app,
  notifikasi, dan status bar diblokir **oleh sistem** (bukan sekadar disembunyikan).
- ⏱️ **Auto-launch saat boot** — app terdaftar sebagai HOME persisten, langsung terbuka
  saat perangkat dinyalakan.
- 🚪 **Dua cara keluar kiosk** (khusus admin):
  1. Tahan **Volume Up + Volume Down** bersamaan selama **3 detik**;
  2. **Tap 5x** di pojok kanan atas layar.

  Keduanya membuka layar PIN. Kiosk baru bisa dikeluarkan setelah PIN 6 digit benar.
- 🔑 **PIN admin di-hash** dengan PBKDF2WithHmacSHA256 (100 ribu iterasi + salt acak),
  disimpan via DataStore — PIN asli tidak pernah tersimpan.
- 🧰 **Menu admin**: keluar/masuk mode kiosk, ganti PIN, hapus device owner.

## Persyaratan

- JDK 17
- Android SDK (compileSdk 35, minSdk 26 — Android 8.0+)
- Android Studio (opsional, tapi disarankan) atau cukup command line
- Perangkat Android 8.0+ untuk deployment (emulator bisa untuk uji coba)

## Build

### Lewat Android Studio
1. Buka folder proyek ini (`File → Open`).
2. Tunggu Gradle sync selesai.
3. `Build → Build Bundle(s)/APK(s) → Build APK(s)`.

### Lewat command line
```bash
./gradlew assembleDebug
# hasil: app/build/outputs/apk/debug/app-debug.apk
```

## Install & Provisioning (WAJIB untuk kiosk penuh)

Lock Task Mode penuh butuh aplikasi diangkat menjadi **device owner** — sekali saja, lewat ADB.

1. Install APK:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
2. Jadikan device owner:
   ```bash
   adb shell dpm set-device-owner com.kiosk.employee/.KioskDeviceAdminReceiver
   ```
   Output sukses: `Success: Device owner set to package ...`
3. Buka aplikasinya → buat **PIN admin 6 digit** → kiosk langsung aktif.

> **Syarat penting provisioning:**
> - Device owner hanya bisa diset pada perangkat yang **belum ada akun Google/user**
>   (perangkat baru / baru di-factory reset) dan **belum punya device owner lain**.
> - Jika gagal: hapus semua akun di Settings → Accounts, lalu ulangi; atau factory reset.
> - Untuk uji coba, **emulator baru tanpa akun Google** juga bisa.
> - Setelah sukses, app otomatis terdaftar sebagai HOME — tekan Home atau reboot,
>   kiosk langsung terbuka dan terkunci.

## Testing cepat tanpa provisioning

Tanpa device owner, app tetap jalan dalam **mode demo screen-pinning**:
- Saat masuk kiosk, muncul dialog sistem "Pin this app?" → konfirmasi.
- Keluar bisa dengan menahan tombol **Overview + Back** (fitur pinning standar Android,
  kelemahannya karyawan bisa tahu — itulah kenapa produksi wajib pakai device owner).
- Banner "Mode kiosk belum aktif" akan tampil di layar kiosk.

## Panduan Admin

| Aksi | Cara |
|---|---|
| Buka menu admin | Vol Up + Vol Down 3 detik **atau** 5-tap pojok kanan atas → masukkan PIN |
| Keluar mode kiosk | Menu Admin → **Keluar Mode Kiosk** |
| Masuk kiosk lagi | Menu Admin → **Masuk Kembali ke Mode Kiosk** |
| Ganti PIN | Menu Admin → **Ganti PIN Admin** |
| Lepas kiosk permanen | Menu Admin → **Hapus Device Owner** (konfirmasi; perangkat bebas lagi) |

Catatan: saat kiosk nonaktif, aplikasi ini tetap menjadi HOME perangkat, sehingga tombol
Home tetap membuka aplikasi ini. Untuk kebebasan penuh perangkat, gunakan **Hapus Device Owner**.

## Rekomendasi konfigurasi perangkat kiosk

- **Matikan screen lock** (Settings → Security → Screen lock → None) agar boot langsung
  masuk kiosk tanpa layar kunci.
- Nonaktifkan auto-rotate bila kiosk dipasang portrait/landscape tetap.
- Sambungkan charger permanen (app sudah menjaga layar tetap menyala).

## Struktur Kode

```
app/src/main/java/com/kiosk/employee/
├── MainActivity.kt                  # NavHost Compose + deteksi key combo Volume Up/Down
├── KioskDeviceAdminReceiver.kt      # Receiver device admin (provisioning entry point)
├── kiosk/KioskManager.kt            # Lock task, persistent HOME, status bar, clear owner
├── pin/PinManager.kt                # DataStore + hash PBKDF2, status kiosk
└── ui/
    ├── KioskScreen.kt               # Layar kiosk + zona 5-tap pojok kanan atas
    ├── PinSetupScreen.kt            # Setup PIN (first run) + Ganti PIN
    ├── PinEntryScreen.kt            # Gerbang PIN untuk keluar kiosk
    ├── AdminScreen.kt               # Menu admin
    ├── components/PinInput.kt       # Keypad + indikator titik PIN
    └── theme/Theme.kt               # Tema gelap Material 3
```

## Alur keamanan

1. Karyawan boot → kiosk terbuka & `startLockTask()` aktif → tidak ada jalan keluar
   selain key combination (sistem memblokir navigasi lain).
2. Key combination → layar PIN → salah = tetap terkunci, benar = menu admin.
3. Menu admin tetap dalam lock task sampai admin memilih **Keluar Mode Kiosk**.
4. PIN tidak disimpan dalam bentuk asli (hash + salt), tidak bisa dibaca dari file
   preferences.
