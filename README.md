# AI Dispatch

Web app pemantau agen AI coding — operator sebagai dispatcher, agen sebagai hero di peta kota wireframe (rasa *Dispatch* / AdHoc Studio).

## Status

Desain + mockup UI (v3). Belum ada backend / data live.

| File | Isi |
|------|-----|
| [`design-style.md`](./design-style.md) | Spec visual & interaksi |
| [`mockup.html`](./mockup.html) | Mockup satu layar (buka di browser) |

## Jalankan mockup

```bash
# dari folder ini
python -m http.server 8765 --bind 127.0.0.1
# lalu buka http://127.0.0.1:8765/mockup.html
```

Atau buka `mockup.html` langsung di browser (beberapa browser membatasi `file://` untuk audio).

## Yang ada di mockup

- Peta kota wireframe (grid jalan + laut + gedung kerja)
- Roster hero, radio log, detail + radar
- Incoming call tiga jenis: **izin** (Y/N/R), **pilih opsi**, **tanya terbuka**
- Mode serius, SFX, musik (opsional)

## Bukan ini

Ini **bukan** kelanjutan tema “AI Colony Monitor”. Konsep koloni diganti total oleh AI Dispatch.
