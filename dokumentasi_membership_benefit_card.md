# Dokumentasi Membership Benefit Card (MBC)

Dokumen ini merangkum fitur aplikasi **Membership Benefit Card (MBC)** yang sudah dikembangkan, alur penggunaan, role pengguna, batasan teknis, diagram use case, flow aplikasi, dan catatan demo agar mudah dibaca dan dipresentasikan.

## Judul Fitur

**Multilingual Offline NFC Membership App with iOS Simulation Fallback**

## Ringkasan

Membership Benefit Card (MBC) adalah aplikasi operasional koperasi berbasis kartu anggota. Aplikasi mendukung registrasi kartu, isi saldo, check-in, check-out, pemotongan saldo, baca kartu anggota, mode simulasi lokal, NFC fisik di Android Chrome, bilingual ID/EN, dan fallback simulasi untuk iOS.

| Mode | Fungsi | Target Perangkat |
|---|---|---|
| Simulasi Lokal | Menyimpan data kartu di browser untuk demo dan pengujian | Semua browser, termasuk iPhone/iOS |
| NFC Fisik | Membaca/menulis data terenkripsi ke kartu NFC NDEF | Google Chrome Android dengan Web NFC |

## Role Pengguna

| Role | Nama UI | Hak Akses |
|---|---|---|
| Admin Koperasi | Admin Koperasi | Registrasi kartu, isi saldo, reset status kartu, melihat data terenkripsi |
| Petugas Gate | Petugas Pintu Masuk | Check-in anggota |
| Petugas Terminal | Petugas Pintu Keluar | Check-out anggota dan potong saldo |
| Anggota Koperasi | Kartu Anggota | Melihat isi kartu pribadi secara read-only |

## Fitur yang Sudah Dikembangkan

### Role-Based Access

- User memilih role saat login.
- Setiap role hanya melihat fitur sesuai PRD.
- Admin hanya melihat fitur registrasi, isi saldo, reset status, dan data terenkripsi.
- Petugas Pintu Masuk hanya melihat fitur check-in.
- Petugas Pintu Keluar hanya melihat fitur check-out dan pemotongan saldo.
- Anggota hanya melihat informasi kartu secara read-only.

### Registrasi Kartu

- Admin dapat mengisi ID anggota, nama, dan saldo awal.
- Data kartu disimpan dalam format terenkripsi.
- Pada mode simulasi, data disimpan di browser.
- Pada mode NFC fisik, data ditulis ke tag NFC NDEF.

### Isi Saldo

- Admin dapat mengisi saldo secara manual.
- Tersedia shortcut nominal cepat.
- Validasi nominal harus lebih dari 0.
- Transaksi isi saldo masuk ke log kartu.

### Check-In

- Petugas Pintu Masuk dapat melakukan check-in.
- Kartu harus sudah terdaftar.
- Status kartu harus keluar sebelum check-in.
- Check-in berulang akan ditolak.
- Tersedia mode simulasi waktu untuk menguji tarif check-out.

### Check-Out dan Pemotongan Saldo

- Petugas Pintu Keluar dapat melakukan check-out.
- Status kartu harus masuk sebelum check-out.
- Tarif dihitung otomatis.
- Saldo dipotong sesuai durasi kunjungan.
- Jika saldo tidak cukup, user mendapat pesan untuk isi saldo melalui Admin Koperasi.

### Tarif Benefit Anggota

| Kondisi | Hasil |
|---|---|
| Tarif dasar | Rp2.000 per jam |
| Pembulatan | Dibulatkan ke atas |
| 0ms | 1 jam |
| 59 menit | 1 jam |
| 60 menit | 1 jam |
| 61 menit | 2 jam |

### Log Transaksi

- Kartu menyimpan maksimal 5 transaksi terakhir.
- Log terbaru berada di atas.
- Jika lebih dari 5 transaksi, log lama dibuang.
- Jenis log meliputi REGISTER, TOPUP, CHECKIN, CHECKOUT, dan RESET.

### Enkripsi Data Kartu

- Data sensitif tidak disimpan dalam plaintext.
- Payload menggunakan AES encryption dan checksum.
- Data yang dilindungi meliputi ID anggota, nama, saldo, status kunjungan, dan riwayat transaksi.

### NFC Fisik

- Aplikasi menggunakan Web NFC API melalui `NDEFReader`.
- Saat kartu berhasil terbaca, user mendapat notifikasi.
- Jika serial kartu tersedia, serial ditampilkan di feedback.
- Operasi update NFC dilakukan dalam dua tahap: baca kartu dan siapkan perubahan, lalu tulis perubahan ke kartu yang sama.

### iOS Simulation Fallback

- iPhone/iOS belum mendukung Web NFC untuk aplikasi web/PWA.
- Aplikasi menampilkan pesan kompatibilitas yang jelas.
- User iPhone tetap bisa mencoba semua flow dengan mode simulasi lokal.
- Mode simulasi menjadi fallback resmi untuk demo menggunakan iPhone.

### Multi-Language UI

- Aplikasi mendukung Bahasa Indonesia dan English US.
- Tombol kanan atas digunakan sebagai language switcher.
- Preferensi bahasa tersimpan di localStorage.
- Indikator bendera berubah mengikuti bahasa aktif:
  - ID: bendera Indonesia
  - EN: bendera UK/Union Jack

### PWA dan Offline Shell

- Aplikasi memiliki manifest PWA.
- Aplikasi memiliki service worker untuk cache dasar.
- Offline cache bersifat tambahan.
- Flow transaksi tetap dirancang berjalan secara lokal.

## Use Case Diagram

```mermaid
flowchart LR
  Admin[Admin Koperasi]
  Gate[Petugas Pintu Masuk]
  Terminal[Petugas Pintu Keluar]
  Member[Anggota Koperasi]
  System((Membership Benefit Card App))

  Admin --> UC1[Registrasi kartu anggota]
  Admin --> UC2[Isi saldo]
  Admin --> UC3[Reset status kartu]
  Admin --> UC4[Lihat data terenkripsi]

  Gate --> UC5[Check-in anggota]
  Gate --> UC6[Atur simulasi waktu]

  Terminal --> UC7[Check-out anggota]
  Terminal --> UC8[Potong saldo otomatis]

  Member --> UC9[Lihat saldo]
  Member --> UC10[Lihat status kunjungan]
  Member --> UC11[Lihat riwayat transaksi]

  UC1 --> System
  UC2 --> System
  UC3 --> System
  UC4 --> System
  UC5 --> System
  UC6 --> System
  UC7 --> System
  UC8 --> System
  UC9 --> System
  UC10 --> System
  UC11 --> System
```

## Flow Aplikasi

### Flow Login Role

```mermaid
flowchart TD
  A[User membuka aplikasi] --> B{Sudah memilih role?}
  B -- Belum --> C[Pilih role]
  C --> D{Role yang dipilih}
  D -->|Admin| E[Tampilkan dashboard Admin Koperasi]
  D -->|Petugas Pintu Masuk| F[Tampilkan dashboard Check-in]
  D -->|Petugas Pintu Keluar| G[Tampilkan dashboard Check-out]
  D -->|Anggota| H[Tampilkan dashboard Kartu Anggota]
  B -- Sudah --> I[Tampilkan dashboard sesuai role]
```

### Flow Registrasi Kartu

```mermaid
flowchart TD
  A[Admin membuka menu Admin Koperasi] --> B[Input ID anggota, nama, dan saldo awal]
  B --> C{Mode kartu}
  C -->|Simulasi| D[Simpan data terenkripsi ke localStorage]
  C -->|NFC Fisik| E[Tempel kartu NFC]
  E --> F[Tulis data terenkripsi ke kartu NFC]
  D --> G[Tampilkan transaksi berhasil]
  F --> G
```

### Flow Check-In

```mermaid
flowchart TD
  A[Petugas Pintu Masuk membuka dashboard] --> B[Baca kartu]
  B --> C{Kartu terdaftar?}
  C -- Tidak --> D[Tampilkan error kartu belum terdaftar]
  C -- Ya --> E{Status kartu keluar?}
  E -- Tidak --> F[Tolak check-in berulang]
  E -- Ya --> G[Simpan waktu masuk]
  G --> H[Ubah status menjadi masuk]
  H --> I[Simpan log CHECKIN]
  I --> J[Tampilkan sukses]
```

### Flow Check-Out

```mermaid
flowchart TD
  A[Petugas Pintu Keluar membuka dashboard] --> B[Baca kartu]
  B --> C{Kartu sudah check-in?}
  C -- Tidak --> D[Tampilkan error]
  C -- Ya --> E[Hitung durasi kunjungan]
  E --> F[Hitung tarif pembulatan ke atas]
  F --> G{Saldo cukup?}
  G -- Tidak --> H[Arahkan isi saldo ke Admin Koperasi]
  G -- Ya --> I[Potong saldo]
  I --> J[Ubah status menjadi keluar]
  J --> K[Simpan log CHECKOUT]
  K --> L[Tampilkan sukses]
```

### Flow NFC Fisik

```mermaid
flowchart TD
  A[User memilih mode NFC Fisik] --> B{Browser mendukung Web NFC?}
  B -- Tidak --> C[Tampilkan compatibility notice]
  C --> D[Sarankan mode simulasi]
  B -- Ya --> E[User menekan aksi NFC]
  E --> F[Tempel kartu NFC]
  F --> G{Kartu terbaca?}
  G -- Tidak --> H[Timeout atau error kartu]
  G -- Ya --> I[Tampilkan notifikasi kartu terdeteksi]
  I --> J[Validasi payload kartu]
  J --> K{Payload valid?}
  K -- Tidak --> L[Tampilkan error payload]
  K -- Ya --> M[Proses transaksi]
```

### Flow iOS Fallback

```mermaid
flowchart TD
  A[User membuka aplikasi di iPhone] --> B[Aplikasi cek Web NFC]
  B --> C[Web NFC tidak tersedia]
  C --> D[Tampilkan pesan iOS tidak mendukung NFC web]
  D --> E[Gunakan mode simulasi]
  E --> F[Demo registrasi, isi saldo, check-in, check-out, dan baca kartu]
```

## Arsitektur Singkat

```mermaid
flowchart LR
  UI[Next.js UI Components]
  Service[MembershipCardService]
  Tariff[MembershipBenefitTariff]
  Repo[CardRepository Interface]
  Local[LocalNfcCardRepository]
  NFC[WebNfcCardRepository]
  Codec[SilentShieldCodec]

  UI --> Service
  Service --> Tariff
  Service --> Repo
  Repo --> Local
  Repo --> NFC
  Local --> Codec
  NFC --> Codec
```

## Prinsip SOLID

| Prinsip | Implementasi |
|---|---|
| Single Responsibility | Service menangani aturan transaksi, repository menangani penyimpanan, codec menangani enkripsi |
| Open/Closed | Repository dapat diganti antara local simulation dan Web NFC tanpa mengubah service |
| Liskov Substitution | LocalNfcCardRepository dan WebNfcCardRepository memakai kontrak CardRepository yang sama |
| Interface Segregation | Kontrak domain dipisah melalui CardRepository, CardCodec, TariffPolicy, dan Clock |
| Dependency Inversion | MembershipCardService bergantung pada interface, bukan implementasi langsung |

## Gap yang Sudah Ditutup

| Gap Awal | Status Saat Ini |
|---|---|
| Role belum sesuai PRD | Sudah sesuai role dan fitur masing-masing |
| NFC fisik tidak jelas statusnya | Ada status kompatibilitas dan notifikasi deteksi NFC |
| iOS tidak bisa NFC | Ada fallback simulasi dan pesan khusus iOS |
| Switch NFC sulit dipakai di mobile | Diganti segmented control Simulasi/NFC Fisik |
| Hydration error di mobile | Sudah distabilkan |
| Bahasa UI campur teknis | Copywriting dibuat lebih mudah dipahami |
| Belum ada bilingual | Ada ID/EN switcher |
| Belum ada test lengkap | Ada 44 tests untuk domain, NFC, UI, dan role |

## Testing dan Quality

| Test Area | Coverage |
|---|---|
| MembershipCardService | Register, isi saldo, check-in, check-out, invalid state, max log |
| Tariff | 0ms, 59 menit, 60 menit, 61 menit, invalid timestamp |
| Security | AES payload, checksum, tampered payload |
| Repository | localStorage encrypted payload dan clear card |
| Web NFC | unsupported browser, timeout, kartu kosong, payload rusak, detected callback |
| Role UI | Setiap role hanya melihat fitur sesuai PRD |
| UI Components | Button, Card, Input, Label, Textarea, Alert, Badge, Table, Tabs, Switch, Tooltip |
| Language | Tombol kanan atas mengubah UI ke English US |

Status terakhir:

```text
13 test files passed
44 tests passed
lint passed
production build passed
```

## Cara Demo

### Demo di iPhone/iOS

1. Buka aplikasi dari link HTTPS.
2. Login sebagai Admin Koperasi.
3. Gunakan mode Simulasi.
4. Daftarkan kartu simulasi.
5. Isi saldo.
6. Logout dan masuk sebagai Petugas Pintu Masuk.
7. Lakukan check-in.
8. Logout dan masuk sebagai Petugas Pintu Keluar.
9. Lakukan check-out dan potong saldo.
10. Logout dan masuk sebagai Anggota Koperasi.
11. Baca kartu simulasi dan lihat saldo/log transaksi.

### Demo NFC Fisik di Android

1. Gunakan Google Chrome Android.
2. Pastikan NFC HP aktif.
3. Buka aplikasi dari link HTTPS.
4. Pilih mode NFC Fisik.
5. Gunakan kartu/tag NFC NDEF writable.
6. Jalankan alur registrasi, check-in, check-out, dan baca kartu.

## Catatan Batasan

- Web NFC tidak tersedia di iPhone/iOS, termasuk PWA.
- Chrome iOS tetap tidak dapat memakai Web NFC karena mengikuti pembatasan iOS.
- NFC fisik membutuhkan Android Chrome dan kartu/tag NDEF writable.
- Kartu e-money, kartu bank, atau kartu akses terenkripsi belum menjadi target implementasi.
- Mode simulasi adalah fallback resmi untuk demo di iPhone.

## Status Akhir

Aplikasi sudah memenuhi PRD utama dan addendum fitur baru. Seluruh gap utama yang ditemukan selama pengembangan sudah ditangani, dengan satu batasan platform yang tidak dapat dihindari: NFC fisik tidak dapat dijalankan dari browser iOS.
