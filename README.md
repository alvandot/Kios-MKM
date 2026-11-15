# Kiosk Karyawan — Aplikasi Android Kiosk Mode

Aplikasi Android **kiosk multi-aplikasi** untuk perangkat karyawan: aplikasi membuka dashboard
berisi aplikasi yang dipilih admin. Dalam Lock Task Mode, perangkat hanya dapat menjalankan
aplikasi kiosk dan aplikasi yang diizinkan. Akses menu admin dilindungi kombinasi tombol dan PIN.

Dibangun dengan **Kotlin + Jetpack Compose**, memakai pola resmi Google untuk kiosk:
**Device Owner + Lock Task Mode** (COSU — Corporate-Owned, Single-Use).

## Fitur

- 📱 **Dashboard multi-aplikasi** — saat dibuka atau perangkat menyala, aplikasi selalu
  menampilkan dashboard. Hanya aplikasi launcher yang dipilih admin yang ditampilkan.
- 🔒 **Kiosk multi-aplikasi** — setelah provisioning, hanya aplikasi kiosk dan aplikasi
  yang dipilih admin yang diizinkan berjalan dalam Lock Task Mode.
- ⏱️ **Auto-launch saat boot** — app terdaftar sebagai HOME persisten, langsung membuka
  dashboard saat perangkat dinyalakan.
- 🔐 **Akses admin tersembunyi**:
  1. Tahan **Volume Up + Volume Down** bersamaan selama **3 detik**; atau
  2. **Tap 5x** di pojok kanan atas dashboard.

  PIN admin **tidak bisa dibuat dari layar aplikasi**. PIN awal hanya dapat ditetapkan
  admin lewat provisioning ADB, sehingga karyawan tidak dapat mengklaim menu admin.
  Akses admin selalu meminta PIN; perangkat yang belum dikonfigurasi menampilkan
  layar "Perangkat belum dikonfigurasi admin".
- 🔑 **PIN admin di-hash** dengan PBKDF2WithHmacSHA256 (100 ribu iterasi + salt acak),
  disimpan via DataStore — PIN asli tidak pernah tersimpan.
- ⏳ **Jeda setelah PIN salah berulang** — 4 percobaan gratis, lalu input dijeda otomatis
  30 detik → 60 detik → 120 detik (maksimal). Jeda disimpan di disk sehingga menutup
  aplikasi atau me-restart perangkat tidak menghapusnya; di-reset setelah PIN benar
  atau PIN diganti.
- 🧰 **Menu admin**: pilih aplikasi dashboard, keluar/masuk mode kiosk, ganti PIN,
  dan hapus device owner.

## Persyaratan

- JDK 17
- Android SDK (compileSdk 35, minSdk 28 — Android 9.0+)
- Android Studio (opsional, tapi disarankan) atau cukup command line
- Perangkat Android 9.0+ untuk deployment (emulator bisa untuk uji coba)

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
3. Tetapkan **PIN admin 6 digit** lewat ADB (wajib, sebelum perangkat diserahkan):
   ```bash
   adb shell am broadcast -a com.kiosk.employee.action.SET_ADMIN_PIN --es pin 654321
   ```
   Perintah ini hanya diterima dari shell/root. Untuk mengganti PIN yang sudah ada,
   tambahkan `--ez force true`. Dashboard tetap menjadi layar awal; PIN tidak diminta
   saat aplikasi dibuka atau perangkat menyala.
4. Di Menu Admin pilih **Pilih Aplikasi Dashboard**, centang aplikasi yang boleh dipakai,
   lalu tekan **Simpan**. Dashboard hanya menampilkan pilihan tersebut.

> **Kenapa PIN lewat ADB?** Kalau PIN pertama bisa dibuat dari layar aplikasi, siapa pun
> yang lebih dulu membuka akses admin tersembunyi dapat mengklaim menu admin — termasuk
> **Hapus Device Owner**. Karena itu pembuatan PIN di dalam aplikasi dihapus; perangkat
> yang sudah di-provisioning tetapi belum punya PIN hanya menampilkan instruksi.

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
- Di **Menu Admin**, status **Device Owner** akan tampil sebagai **Tidak aktif**.
- PIN admin untuk mode demo juga diset lewat ADB dengan perintah yang sama seperti di atas.

## Panduan Admin

| Aksi | Cara |
|---|---|
| Buka akses admin | Vol Up + Vol Down 3 detik **atau** 5-tap pojok kanan atas dashboard |
| Tetapkan PIN admin | Saat provisioning: `adb shell am broadcast -a com.kiosk.employee.action.SET_ADMIN_PIN --es pin <6 digit>` |
| Reset PIN yang lupa | Perintah yang sama dengan tambahan `--ez force true` |
| Buka Menu Admin | Akses admin tersembunyi → masukkan PIN |
| PIN salah berulang | Input dijeda otomatis (4 gratis, lalu 30s → 60s → 120s) |
| Pilih app untuk dashboard | Menu Admin → **Pilih Aplikasi Dashboard** → centang pilihan → **Simpan** |
| Keluar mode Lock Task | Menu Admin → **Keluar Mode Kiosk** |
| Masuk Lock Task lagi | Menu Admin → **Masuk Kembali ke Mode Kiosk** |
| Ganti PIN | Menu Admin → **Ganti PIN Admin** |
| Lepas kiosk permanen | Menu Admin → **Hapus Device Owner** (konfirmasi; perangkat bebas lagi) |

Catatan: aplikasi ini tetap menjadi HOME perangkat, sehingga tombol Home kembali ke dashboard.
Untuk kebebasan penuh perangkat, gunakan **Hapus Device Owner**. Hanya app terpilih yang
masuk allowlist Lock Task; aplikasi lain tetap tidak dapat dibuka saat kiosk aktif.

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
├── ProvisioningReceiver.kt          # Set/reset PIN admin dari ADB (hanya shell/root)
├── kiosk/
│   ├── KioskApps.kt                 # Query aplikasi launcher & peluncuran dalam Lock Task
│   └── KioskManager.kt              # Lock task, allowlist paket, persistent HOME, clear owner
├── pin/PinManager.kt                # DataStore + hash PBKDF2, status kiosk & pilihan app
└── ui/
    ├── KioskScreen.kt               # Dashboard aplikasi + zona 5-tap pojok kanan atas
    ├── AppSelectionScreen.kt        # Pemilihan aplikasi dashboard oleh admin
    ├── AdminLockedScreen.kt         # Info saat PIN belum ditetapkan lewat provisioning
    ├── ChangePinScreen.kt           # Ganti PIN admin (2 tahap: PIN baru + konfirmasi)
    ├── PinEntryScreen.kt            # Gerbang PIN untuk membuka Menu Admin
    ├── AdminScreen.kt               # Menu admin
    ├── components/PinInput.kt       # Keypad + indikator titik PIN
    └── theme/Theme.kt               # Tema gelap Material 3
```

## Alur keamanan

1. Karyawan boot → kiosk terbuka & `startLockTask()` aktif → tidak ada jalan keluar
   selain key combination (sistem memblokir navigasi lain).
2. Key combination → layar PIN → salah = tetap terkunci, benar = menu admin.
   Setelah 4 kali salah, input dijeda 30 detik lalu bertambah (60/120 detik).
3. Menu admin tetap dalam lock task sampai admin memilih **Keluar Mode Kiosk**.
4. **Keluar Mode Kiosk selalu memanggil `stopLockTask()`** — termasuk pada mode demo
   screen-pinning tanpa device owner, sehingga perangkat tidak tetap terkunci setelah
   admin keluar.
5. PIN tidak disimpan dalam bentuk asli (hash + salt), tidak bisa dibaca dari file
   preferences.
