
# Panduan Aktivasi Google Authentication (FokusKarir)

Agar fitur "Masuk dengan Google" berfungsi, Anda perlu mengaktifkan penyedia Google di Firebase Console dan mengonfigurasi OAuth di Google Cloud Console.

### 1. Aktifkan Google di Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Pilih proyek **jejakkarir-11379**.
3. Klik menu **Build** > **Authentication** di sidebar kiri.
4. Klik tab **Sign-in method**.
5. Klik **Add new provider** dan pilih **Google**.
6. Aktifkan toggle **Enable**.
7. Isi **Project public-facing name** (contoh: FokusKarir).
8. Pilih **Project support email** (email Anda).
9. Klik **Save**.

### 2. Konfigurasi di Google Cloud Console (OAuth Screen)
Jika status verifikasi belum selesai, Anda mungkin perlu mengatur layar persetujuan OAuth:
1. Buka [Google Cloud Console](https://console.cloud.google.com/).
2. Pastikan proyek yang dipilih adalah **jejakkarir-11379**.
3. Buka menu **APIs & Services** > **OAuth consent screen**.
4. Pilih **User Type: External** dan klik **Create**.
5. Isi informasi aplikasi yang wajib:
   - **App name**: FokusKarir
   - **User support email**: Email Anda
   - **Developer contact info**: Email Anda
6. Klik **Save and Continue** sampai selesai.

### 3. Masukkan Domain Terorisasi (Authorized Domains)
1. Kembali ke **Firebase Console** > **Authentication** > **Settings**.
2. Pilih menu **Authorized domains** di sebelah kanan.
3. Pastikan domain tempat Anda men-deploy aplikasi (misal: `localhost`, `vercel.app`, atau domain kustom Anda) sudah terdaftar di sana.
4. Jika belum, klik **Add domain**.

### 4. Selesai
Tombol Google di aplikasi FokusKarir sekarang siap digunakan. Sistem akan secara otomatis membuat akun (pendaftaran) jika email Google tersebut belum terdaftar, atau masuk (login) jika sudah pernah digunakan.
