
# Panduan Aktivasi Google Authentication (FokusKarir) - Domain Kustom

Agar fitur "Masuk dengan Google" berfungsi pada domain **fokuskarir.web.id** tanpa error 404, Anda perlu melakukan konfigurasi berikut:

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
   - `https://jejakkarir-11379.firebaseapp.com`
5. Pada bagian **Authorized redirect URIs**, pastikan URI berikut sudah ada:
   - `https://jejakkarir-11379.firebaseapp.com/__/auth/handler`
   - `https://jejakkarir-11379.web.app/__/auth/handler`
6. Klik **SAVE**.

### 3. Penting: Konfigurasi di Script (firebase.ts)
Jangan mengubah `authDomain` di dalam file `services/firebase.ts` menjadi domain kustom Anda. Tetap gunakan:
```typescript
authDomain: "jejakkarir-11379.firebaseapp.com"
```
**Mengapa?** Karena Firebase menyediakan skrip penangan login otomatis di domain `.firebaseapp.com`. Jika Anda mengubahnya ke domain kustom di script, Anda akan menemui error **404 NOT_FOUND** saat mencoba login karena domain kustom Anda tidak memiliki skrip penangan tersebut.

### 4. Selesai
Setelah disimpan, perubahan ini mungkin memerlukan waktu 5-10 menit untuk propagasi global. Sekarang login Google akan berfungsi normal di domain utama Anda meskipun popup login menggunakan domain bawaan Firebase sebagai perantara yang aman.
