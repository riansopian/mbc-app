# Membership Benefit Card

Next.js single frontend application untuk simulasi kartu NFC offline-first anggota koperasi desa, berdasarkan `prd_mermbership_benefit_card.md`.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Web NFC API untuk kartu NFC fisik
- localStorage sebagai fallback simulated NFC card memory

## Fitur

- The Station: registrasi kartu, top-up saldo, reset status.
- The Gate: check-in, validasi double tap-in, simulation timestamp.
- The Terminal: check-out, tarif Rp2.000 per jam dengan pembulatan ke atas, validasi saldo.
- The Scout: mode read-only untuk membaca kartu fisik/simulasi dan melihat saldo, status, dan 5 transaksi terakhir.
- Silent Shield: payload kartu disimpan dengan AES dan checksum.
- Offline shell: manifest + service worker untuk cache dasar halaman aplikasi.

## NFC Fisik

Implementasi kartu fisik ada di `src/lib/mbc/web-nfc.ts` melalui `WebNfcCardRepository`.

- Browser yang didukung: Chrome Android dengan NFC aktif.
- Context yang dibutuhkan: HTTPS atau `localhost`.
- Kartu yang digunakan harus mendukung NDEF write/read.
- Payload ditulis sebagai NDEF MIME record `application/vnd.mbc.card+json`.
- Untuk operasi mutasi seperti top-up, check-in, dan check-out, tahan kartu di area NFC sampai proses read dan write selesai.
- Untuk kartu yang mengekspos serial number, app akan menolak write jika kartu yang ditempel berbeda dari kartu yang baru dibaca.

## Prinsip SOLID

- Single Responsibility: UI berada di `src/components/mbc-app.tsx`; aturan bisnis di `src/lib/mbc/service.ts`; keamanan di `security.ts`; tarif di `tariff.ts`; persistence di `repository.ts`.
- Open/Closed: tarif dan codec dapat diganti dengan implementasi baru tanpa mengubah `MembershipCardService`.
- Liskov Substitution: service bergantung ke kontrak `CardRepository`, `CardCodec`, `Clock`, dan `TariffPolicy`.
- Interface Segregation: interface kecil dan spesifik untuk repository, codec, clock, dan tariff.
- Dependency Inversion: use-case service menerima dependency lewat constructor, bukan membuat langsung dependency concrete.

## Asumsi

- Jika Web NFC tidak tersedia, aplikasi otomatis tetap dapat diuji dengan `LocalNfcCardRepository`.
- Silent Shield memakai AES via `crypto-js` + checksum. Untuk produksi, gunakan manajemen key yang aman dan rotasi key.
- Tidak ada cloud sync atau database terpusat sesuai scope PRD.
- Role access masih sesi lokal/offline sesuai demo. Untuk produksi, autentikasi petugas perlu proses provisioning terpisah.

## Menjalankan

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Build

```bash
npm run build
```

## Test

```bash
npm run test
```
