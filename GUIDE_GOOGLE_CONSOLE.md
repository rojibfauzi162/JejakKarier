
# Panduan Aktivasi Google Authentication (FokusKarir) - Domain Kustom

Agar fitur "Masuk dengan Google" berfungsi pada domain **fokuskarir.web.id**, Anda perlu melakukan konfigurasi berikut:

### 1. Masukkan Domain ke Firebase (Authorized Domains)
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Pilih proyek **jejakkarir-11379**.
3. Navigasi ke **Build** > **Authentication** > **Settings**.
4. Di bagian **Authorized domains**, klik **Add domain**.
5. Masukkan: `fokuskarir.web.id`.

### 2. Konfigurasi di Google Cloud Console (Credentials)
1. Buka [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Pastikan proyek yang dipilih adalah **jejakkarir-11379**.
3. Di bawah **OAuth 2.0 Client IDs**, klik ikon pensil (Edit) pada **Web client (auto-created by Google Service)**.
4. Pada bagian **Authorized JavaScript origins**, klik **ADD URI** dan masukkan:
   - `https://fokuskarir.web.id`
5. Pada bagian **Authorized redirect URIs**, klik **ADD URI** dan masukkan:
   - `https://fokuskarir.web.id/__/auth/handler`
   - *Catatan: URI default `https://jejakkarir-11379.firebaseapp.com/__/auth/handler` harus tetap ada.*
6. Klik **SAVE**.

### 3. Client ID for Web Application
Firebase mengelola Client ID ini secara otomatis. Jika Anda membutuhkannya untuk integrasi manual:
- **Client ID** dapat ditemukan di halaman edit Credentials di atas (sebelah kanan atas).
- **Client Secret** juga ada di halaman yang sama (namun Firebase sudah mengurusnya di sisi server).

### 4. Verifikasi Domain di Search Console (Opsional tapi Disarankan)
Jika Google meminta verifikasi kepemilikan domain untuk OAuth, Anda harus mendaftarkan domain tersebut di [Google Search Console](https://search.google.com/search-console).

### 5. Selesai
Setelah disimpan, perubahan ini mungkin memerlukan waktu 5-10 menit untuk propagasi global. Sekarang login Google akan berfungsi normal di domain utama Anda.
