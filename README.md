# Kiosk Employee — Android

Aplikasi kiosk lock-down untuk karyawan. Antarmuka React Native 0.88 + TypeScript, seluruh
kebijakan sistem (Device Owner, lock task, allowlist aplikasi, PIN admin) dijalankan oleh
native module Kotlin `KioskPolicyModule`.

**Hanya Android yang didukung** (SDK 26+). Dukungan iOS sudah dihapus dari repo ini.

## Prasyarat

- Node.js >= 22.11
- JDK 17
- Android SDK (compileSdk 37) + platform-tools (`adb`)

## Menjalankan

```sh
npm install
npm start          # Metro, biarkan berjalan
npm run android    # build + install ke emulator/perangkat
```

## Build APK

Gunakan wrapper di dalam `android/`, bukan `gradlew` di root (yang masih Gradle lama):

```sh
cd android && ./gradlew assembleDebug
# hasil: android/app/build/outputs/apk/debug/app-debug.apk
```

Gradle 9.4.1 dibutuhkan oleh RN 0.88; wrapper sudah menunjuk versi yang benar.

## Cara Install di Perangkat

Didukung: **handheld scanner Sunmi V2 Pro** dan **tablet Samsung** (layout responsif
menyesuaikan otomatis — layar sempit < 480dp memakai 2 kolom, tablet ≥ 720dp memakai
4 kolom). Perangkat apa pun dengan Android 8.0 (API 26) atau lebih baru bisa dipakai.

### 1. Ambil APK

- **Paling mudah** — unduh dari CI: buka tab [Actions](https://github.com/alvandot/Kios-MKM/actions),
  pilih run terbaru yang lulus, lalu unduh artifact **`app-debug-apk`**.
- **Atau build sendiri** — lihat bagian *Build APK* di atas.

> APK debug memuat JavaScript di dalamnya, jadi tidak butuh Metro untuk berjalan.

### 2. Siapkan perangkat

1. Aktifkan **Developer Options**: ketuk *Build Number* 7 kali di *Settings → About*.
2. Aktifkan **USB Debugging** di *Settings → Developer Options*.
3. Sambungkan perangkat ke PC dengan kabel USB, lalu pastikan terdeteksi:

```sh
adb devices        # harus muncul status "device"
```

### 3. Install aplikasi

```sh
adb install -r app-debug.apk
```

### 4. Jadikan Device Owner + tetapkan PIN admin

> ⚠️ **Perangkat harus dalam keadaan bersih** — tidak punya akun Google/user lain dan
> belum punya Device Owner. Kalau perangkat sudah dipakai, lakukan factory reset dulu
> (*Settings → System → Reset*). Provisioning hanya perlu dilakukan **sekali**.

```sh
# 1. Jadikan Device Owner
adb shell dpm set-device-owner com.kiosk.employee/.KioskDeviceAdminReceiver

# 2. Tetapkan PIN admin 6 digit (ganti 112233 dengan PIN Anda)
adb shell am broadcast -a com.kiosk.employee.action.SET_ADMIN_PIN \
  -n com.kiosk.employee/.kiosk.ProvisioningReceiver --es pin 112233
```

Buka aplikasi Kiosk Employee — banner harus menampilkan **"Device Owner aktif"**.

### 5. Setup pertama

1. **5 tap cepat di pojok kanan atas** dashboard → layar PIN → masukkan PIN admin.
2. Di **Umum → Aplikasi dashboard**, centang aplikasi yang boleh tampil untuk karyawan.
3. Di tab **Keamanan**, aktifkan **Lock Mode** — perangkat terkunci: karyawan hanya bisa
   membuka aplikasi yang dipilih, Home selalu kembali ke dashboard.
4. Keluar dari mode admin dengan kembali ke dashboard; gerbang 5-tap + PIN dibutuhkan
   lagi untuk masuk pengaturan.

### Masalah umum

| Gejala | Penyebab & solusi |
|---|---|
| `dpm set-device-owner` gagal / diam | Perangkat belum bersih (ada akun Google). Factory reset dulu, lalu ulangi. |
| Banner "Device Owner belum aktif" | Cek `adb shell dumpsys device_policy` — kalau owner ada, buka ulang aplikasi. |
| Aplikasi lain tidak muncul di daftar | Aplikasi pihak ketiga butuh `<queries>` di manifest — sudah disertakan; pastikan APK versi terbaru. |
| Toggle Lock Mode tidak bereaksi | Device Owner belum aktif (lihat baris di atas). |
| Lupa PIN admin | Reset PIN lewat ADB dengan perintah `SET_ADMIN_PIN` pada langkah 4. |

## Provisioning (detail)

Perangkat harus dalam keadaan bersih (tanpa akun, tanpa Device Owner lain) sebelum
provisioning. Aplikasi harus terpasang lebih dulu.

```sh
# 1. Jadikan Device Owner
adb shell dpm set-device-owner com.kiosk.employee/.KioskDeviceAdminReceiver

# 2. Tetapkan PIN admin 6 digit (butuh android.permission.DUMP — hanya lewat ADB)
adb shell am broadcast -a com.kiosk.employee.action.SET_ADMIN_PIN \
  -n com.kiosk.employee/.kiosk.ProvisioningReceiver --es pin 112233
```

`ProvisioningReceiver` diproteksi `android:permission="android.permission.DUMP"`, jadi
hanya shell/root yang bisa mengirim broadcast ini — aplikasi pihak ketiga tidak dapat
mengganti PIN admin.

Untuk melepas Device Owner tanpa factory reset tidak dimungkinkan oleh Android; reset
perangkat lewat `adb shell am broadcast -a android.intent.action.FACTORY_RESET` atau wipe
emulator (`emulator -avd <nama> -wipe-data`).

## Alur aplikasi

- **Dashboard** — grid aplikasi yang diizinkan; hanya aplikasi terpilih yang bisa dibuka.
- **Gerbang admin** — 5 tap cepat di pojok kanan atas → layar PIN 6 digit.
- **Lock Mode** — tab Security/General: aktifkan lock task, pilih aplikasi dashboard, blokir
  power menu, izin notifikasi.
- Status bar tetap terlihat namun tidak bisa ditarik; tombol Recents dinonaktifkan, Back dan
  Home aktif, dan Home kembali ke dashboard.

PIN salah diberi jeda bertingkat (4 percobaan bebas, lalu 30/60/120 detik) yang disimpan di
DataStore sehingga tidak bisa diakali dengan force-stop.

## Debug

- Dev Menu: <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux); reload cepat: tekan <kbd>R</kbd> dua kali.
- Log native: `adb logcat -s KIOSKPIN ReactNativeJS`.
- Pemeriksaan kebijakan: `adb shell dpm dump com.kiosk.employee | grep -i flags`,
  `adb shell dumpsys activity activities | grep -i locktask`.

## Struktur

```
App.tsx                     orkestrasi navigasi + state kiosk
src/screens/                Dashboard, Lock Mode, PIN, Pilih Aplikasi
src/native/KioskPolicy.ts   bridge ke native module
src/theme/tokens.ts         design token glassmorphism (gelap + aksen merah MKM)
android/app/src/main/java/com/kiosk/employee/
  kiosk/KioskPolicyModule.kt      Device Owner, lock task, allowlist, PIN
  kiosk/PinManager.kt             hash PIN + penalti percobaan
  kiosk/ProvisioningReceiver.kt   broadcast SET_ADMIN_PIN lewat ADB
  KioskDeviceAdminReceiver.kt     komponen admin
```
