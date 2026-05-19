# PRD — Membership Benefit Card (MBC)

## 1. Overview
Membership Benefit Card (MBC) adalah sistem kartu NFC offline-first untuk anggota koperasi desa. Seluruh data utama seperti identitas anggota, saldo, status kunjungan, dan riwayat transaksi disimpan langsung di kartu NFC tanpa ketergantungan terhadap koneksi internet maupun database terpusat.

Aplikasi dirancang sebagai single frontend application yang dapat berpindah mode operasional sesuai kebutuhan petugas maupun anggota koperasi.

Mode aplikasi terdiri dari:
- The Station (Admin Koperasi)
- The Gate (Entry Point)
- The Terminal (Exit Point)
- The Scout (Buku Saku Digital)

---

# 2. Product Objectives

## Business Objectives
- Memberikan pengalaman digital yang tetap berjalan di area dengan konektivitas terbatas.
- Mempermudah operasional koperasi desa melalui sistem kartu anggota NFC.
- Memberikan benefit eksklusif bagi anggota koperasi.
- Menjamin proses transaksi tetap cepat, aman, dan mandiri.

## Technical Objectives
- Mengintegrasikan NFC read/write secara langsung di frontend.
- Menjamin seluruh validasi transaksi berjalan secara offline.
- Mengelola state transaksi langsung pada memori kartu.
- Melindungi data sensitif agar tidak dapat dibaca aplikasi NFC umum.

---

# 3. User Roles

| Role | Deskripsi |
|---|---|
| Admin Koperasi | Registrasi anggota & top-up saldo |
| Petugas Gate | Melakukan check-in anggota |
| Petugas Terminal | Melakukan check-out & pemotongan saldo |
| Anggota Koperasi | Melihat isi kartu pribadi |

---

# 4. Product Scope

## In Scope
- Registrasi kartu NFC anggota
- Top-up saldo kartu
- Check-in/check-out anggota
- Perhitungan tarif otomatis
- Penyimpanan 5 transaksi terakhir
- Simulation mode untuk pengujian
- Data encryption / obfuscation
- Offline-first operation

## Out of Scope
- Sistem untuk guest/non-member
- Integrasi payment gateway
- Sinkronisasi cloud/server
- Sistem multi-device synchronization
- Hardware selain NFC

---

# 5. Functional Requirements

## 5.1 The Station (Admin Koperasi)

### Features
- Registrasi kartu anggota baru
- Input identitas anggota
- Top-up saldo anggota
- Reset status kartu
- Menulis data terenkripsi ke kartu

### Card Data
- Member ID
- Nama anggota
- Saldo
- Status kunjungan
- Timestamp check-in
- Transaction logs

### Validation
- Kartu valid & dapat ditulis
- Nominal top-up > 0
- Data terenkripsi sebelum write

---

## 5.2 The Gate (Entry Point)

### Features
- Tap kartu untuk check-in
- Menyimpan timestamp masuk
- Mengubah status kartu menjadi IN

### Validation
- Tidak boleh double tap-in
- Kartu harus sudah terdaftar
- Kartu dalam status OUT

### Simulation Mode
- Petugas dapat mengatur timestamp check-in ke masa lalu untuk kebutuhan testing perhitungan tarif.

---

## 5.3 The Terminal (Exit Point)

### Features
- Membaca timestamp check-in
- Menghitung durasi kunjungan
- Menghitung biaya otomatis
- Memotong saldo anggota
- Mengubah status menjadi OUT
- Menyimpan transaksi terbaru

### Tarif Benefit Anggota
- Rp2.000 per jam
- Pembulatan ke atas

### Example
- 1 jam 5 menit 1 detik = 2 jam
- Total biaya = Rp4.000

### Validation
- Tidak boleh double tap-out
- Saldo harus mencukupi
- Jika saldo tidak cukup → tampilkan instruksi top-up di The Station

---

## 5.4 The Scout (Buku Saku Digital)

### Features
- Membaca isi kartu anggota
- Menampilkan:
  - Saldo
  - Status kunjungan
  - Riwayat transaksi
  - Timestamp terakhir

### Constraints
- Read-only mode
- Tidak dapat memodifikasi data kartu

---

# 6. Non-Functional Requirements

## Offline First
- Seluruh fitur wajib berjalan tanpa internet.

## Performance
- NFC read/write maksimal < 2 detik.

## Security
- Data sensitif tidak boleh tersimpan dalam plaintext.
- Data yang wajib dilindungi:
  - Identitas anggota
  - Saldo

## Reliability
- State transaksi harus konsisten.
- Tidak boleh terjadi:
  - Double check-in
  - Double check-out

## Usability
- UI sederhana dan mudah digunakan.
- Maksimal 1–2 langkah untuk setiap transaksi.

---

# 7. Technical Constraints

| Category | Requirement |
|---|---|
| Member Benefit | Tarif khusus Rp2.000/jam dengan pembulatan ke atas |
| Sequential Loop | Tidak boleh double tap-in atau tap-out |
| Simulation Mode | Wajib tersedia di The Gate |
| Transaction Logs | Menyimpan 5 transaksi terakhir |
| Silent Shield | Data sensitif tidak dapat dibaca aplikasi NFC lain |

---

# 8. Card Data Structure

## Suggested Structure
```json
{
  "memberId": "MBC001",
  "name": "Encrypted",
  "balance": "Encrypted",
  "visitStatus": "IN | OUT",
  "checkInTimestamp": 0,
  "logs": [
    {
      "type": "CHECKOUT",
      "amount": 4000,
      "timestamp": 123456789
    }
  ]
}
```

## Log Rules
- Maksimal 5 transaksi terakhir
- FIFO overwrite mechanism

---

# 9. Transaction Flow

## Check-In Flow
1. User tap kartu di The Gate
2. Sistem validasi status kartu = OUT
3. Simpan timestamp masuk
4. Ubah status → IN
5. Simpan transaction log

## Check-Out Flow
1. User tap kartu di The Terminal
2. Sistem validasi status kartu = IN
3. Hitung durasi kunjungan
4. Hitung tarif
5. Potong saldo
6. Ubah status → OUT
7. Simpan transaction log

---

# 10. Security Requirements

## Silent Shield
Data berikut tidak boleh dapat dibaca langsung:
- Nama anggota
- Identitas anggota
- Saldo

## Suggested Security Mechanism
- AES encryption
- Encoded payload
- Checksum/signature validation

---

# 11. UI Requirements

## General Requirements
- Responsive web app
- Single app with mode switcher
- Minimal interaction steps
- Menggunakan Signal UI system

## Main Screens
- Mode Selection
- The Station Dashboard
- The Gate Scanner
- The Terminal Scanner
- The Scout Viewer
- Success/Error States

---

# 12. Suggested Technical Stack

| Layer | Recommendation |
|---|---|
| Frontend | React / Next.js |
| NFC Integration | Web NFC API |
| State Management | Zustand / Redux |
| Styling | TailwindCSS |
| Encryption | CryptoJS / Web Crypto API |

---

# 13. Success Metrics

| Metric | Target |
|---|---|
| NFC read/write success | >95% |
| Transaction processing time | <2 detik |
| Offline availability | 100% |
| Double transaction issue | 0 kasus |
| App crash/error | 0 critical issue |

---

# 14. Deliverables

## Mandatory Deliverables
- Source code repository (GitHub/GitLab)
- Working frontend app
- Demo capture/video
- Technical documentation
- Non-technical documentation
- Assumptions documentation
- Presentation covering:
  - UI/UX Design
  - Software Design
  - Software Construction
  - Software Quality
  - Software Deployment
  - Software Security
- Data sensitif tidak boleh plaintext.
- Gunakan enkripsi/obfuscation untuk:
  - Identitas
  - Saldo

## Reliability
- State transaksi harus konsisten.
- Tidak boleh terjadi:
  - Double check-in
  - Double check-out

## Usability
- UI sederhana untuk operator desa.
- Flow maksimal 1–2 langkah per transaksi.

---

# 7. Card Data Structure

## Suggested Structure
```json
{
  "memberId": "MP001",
  "name": "Encrypted",
  "balance": "Encrypted",
  "visitStatus": "IN | OUT",
  "checkInTimestamp": 0,
  "logs": [
    {
      "type": "TOPUP",
      "amount": 50000,
      "timestamp": 123456789
    }
  ]
}
```

## Log Rules
- Maksimal 5 transaksi terakhir
- FIFO (oldest overwritten)

---

# 8. Transaction Flow

## Check-In
1. Tap kartu
2. Validasi status = OUT
3. Simpan waktu masuk
4. Ubah status → IN
5. Simpan log

## Check-Out
1. Tap kartu
2. Validasi status = IN
3. Hitung durasi
4. Hitung tarif
5. Potong saldo
6. Ubah status → OUT
7. Simpan log

---

# 9. Security Requirements

## Silent Shield
Data berikut tidak boleh terbaca langsung:
- Nama
- Identitas
- Saldo

## Suggested Methods
- AES encryption
- Encoded payload
- Checksum/signature validation

---

# 10. UI Requirements

## General
- Responsive web app
- Single app with mode switcher
- Minimal interaction steps

## Screens
- Mode Selection
- Station Dashboard
- Gate Scanner
- Terminal Scanner
- Scout Viewer
- Error & Success States

---

# 11. Technical Stack (Suggested)

| Layer | Recommendation |
|---|---|
| Frontend | React / Next.js |
| NFC API | Web NFC API |
| State | Zustand / Redux |
| Styling | TailwindCSS |
| Encryption | CryptoJS/Web Crypto API |

---

# 12. Success Metrics

| Metric | Target |
|---|---|
| NFC read/write success | >95% |
| Transaction duration | <2 detik |
| Offline availability | 100% |
| Double transaction issue | 0 kasus |

---

# 13. Deliverables

## Mandatory
- Source code repository
- Working frontend app
- Demo video/capture
- Technical documentation
- Non-technical documentation
- Presentation covering:
  - UI/UX Design
  - Software Design
  - Software Construction
  - Software Quality
  - Deployment
  - Security

---

# Addendum - Fitur Baru Aplikasi Membership Benefit Card

## Judul Fitur
**Multilingual Offline NFC Membership App with iOS Simulation Fallback**

## Ringkasan
Fitur baru ini menambahkan dukungan penggunaan aplikasi dalam dua bahasa, peningkatan pengalaman pengguna di perangkat mobile, notifikasi status NFC yang lebih jelas, serta fallback simulasi untuk perangkat yang belum mendukung Web NFC seperti iPhone/iOS.

Tujuannya adalah memastikan aplikasi tetap dapat didemokan dan digunakan untuk alur utama PRD meskipun perangkat user tidak mendukung NFC fisik melalui browser.

## Fitur Baru

### 1. Language Switcher ID/EN
- Aplikasi menyediakan tombol ganti bahasa di pojok kanan atas.
- Default bahasa adalah Bahasa Indonesia.
- User dapat mengganti bahasa ke English US.
- Preferensi bahasa disimpan di localStorage agar tetap sama setelah refresh.
- Label tombol mengikuti bahasa aktif:
  - `ID` untuk Bahasa Indonesia
  - `EN` untuk English US

### 2. Indikator Bendera Dinamis
- Tombol bahasa menampilkan indikator bendera sesuai bahasa aktif.
- Bahasa Indonesia menggunakan bendera Indonesia.
- English US menggunakan indikator bendera UK/Union Jack sesuai permintaan UI terbaru.

### 3. Copywriting Lebih Mudah Dipahami
- Istilah teknis yang kurang ramah user disederhanakan.
- Contoh perubahan:
  - `The Station` menjadi `Admin Koperasi`
  - `Gate` menjadi `Pintu Masuk`
  - `Terminal` menjadi `Pintu Keluar`
  - `Scout` menjadi `Kartu Anggota`
  - `Write encrypted card` menjadi `Simpan kartu simulasi`
  - `Tap out and charge` menjadi `Check-out dan potong saldo`

### 4. Device Compatibility Notice
- Aplikasi mendeteksi apakah Web NFC tersedia di browser.
- Jika user memakai iPhone/iOS, aplikasi menampilkan pesan bahwa iPhone belum mendukung Web NFC untuk aplikasi web.
- Jika user memakai browser yang tidak mendukung Web NFC, aplikasi memberi instruksi yang lebih jelas.
- Aplikasi tetap menawarkan mode simulasi agar flow PRD tetap bisa diuji.

### 5. NFC Detection Notification
- Saat kartu NFC berhasil terdeteksi oleh browser, aplikasi menampilkan notifikasi:
  - kartu terdeteksi
  - serial kartu jika tersedia
  - instruksi agar kartu tetap ditempel sampai proses selesai

### 6. Simulasi Lokal untuk iOS
- Karena iOS tidak mendukung Web NFC di browser, aplikasi menyediakan mode simulasi lokal.
- Mode simulasi dapat menjalankan alur:
  - registrasi kartu
  - isi saldo
  - check-in
  - check-out
  - baca kartu anggota
  - riwayat transaksi
- Mode ini menjadi fallback resmi untuk demo menggunakan iPhone.

### 7. PWA dan Offline Shell
- Aplikasi mendukung manifest PWA.
- Aplikasi menyediakan service worker untuk cache dasar.
- Offline cache bersifat tambahan; transaksi kartu tetap dirancang berjalan secara lokal.

### 8. Test Coverage
- Unit test `MembershipCardService`
- Boundary test tarif:
  - 0ms
  - 59 menit
  - 60 menit
  - 61 menit
  - invalid timestamp
- Role UI test untuk memastikan tiap role hanya melihat fitur sesuai PRD.
- NFC error test:
  - unsupported browser
  - timeout
  - kartu kosong
  - payload rusak
- Test maksimal 5 log transaksi.
- Test repository lokal, formatter, security codec, dan UI components.

## Acceptance Criteria

| Area | Acceptance Criteria |
|---|---|
| Bahasa | User dapat mengganti Bahasa Indonesia ke English US dari tombol kanan atas |
| Persistensi Bahasa | Bahasa terakhir tersimpan setelah refresh |
| Indikator Bahasa | Bendera berubah sesuai bahasa aktif |
| iOS Fallback | iPhone menampilkan pesan Web NFC tidak tersedia dan tetap bisa memakai simulasi |
| NFC Fisik | Android Chrome dapat memakai Web NFC jika browser dan tag mendukung |
| Notifikasi NFC | User mendapat feedback saat kartu NFC terdeteksi |
| Role Access | Tiap role hanya melihat fitur sesuai tanggung jawabnya |
| Testing | Semua unit/component test harus pass |

## Catatan Teknis
- Web NFC hanya tersedia pada browser yang mendukung `NDEFReader`, terutama Google Chrome di Android.
- iPhone/iOS tidak mendukung Web NFC untuk aplikasi web/PWA.
- Untuk demo iPhone, gunakan mode simulasi lokal.
- Untuk demo NFC fisik, gunakan Google Chrome Android dan kartu/tag NDEF yang dapat ditulis.
