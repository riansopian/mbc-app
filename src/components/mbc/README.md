# MBC Component Boundaries

Folder ini sengaja dipisah berdasarkan tanggung jawab agar perubahan tetap mengikuti prinsip SOLID.

- `app/`: composition root dan controller hook untuk menyambungkan state, service, dan view.
- `adapters/`: adapter yang menjembatani UI dengan storage atau device capability, seperti simulated card dan Web NFC.
- `i18n/`: teks UI dan callback copy untuk Bahasa Indonesia dan English US.
- `logic/`: helper non-visual untuk role, routing, error, dan status NFC.
- `shared/`: komponen presentasional kecil yang dipakai ulang oleh beberapa view.
- `views/`: panel dan layout fitur yang terlihat oleh user.

Aturan dependensi:

- `logic/` tidak boleh mengimpor `views/`, `shared/`, atau `app/`.
- `shared/` boleh memakai `logic/` dan design-system UI, tetapi tidak boleh menyimpan state workflow.
- `views/` boleh memakai `shared/`, `logic/`, dan service type, tetapi tidak membuat repository sendiri.
- `app/` menjadi orchestration layer; logic bisnis kartu tetap berada di `src/lib/mbc`.
- `adapters/` mengisolasi detail storage/device agar controller tidak bergantung pada implementasi konkret.
