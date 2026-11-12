# E-commerce Management System – Backend API

Backend toko online dengan **NestJS + TypeScript + TypeORM + PostgreSQL** (Studi Kasus 2, UTS Framework Programming).

Entitas: `Categories`, `Products`, `Customers`, `Orders`, `OrderItems`.

## Prasyarat
- Node.js 18+ dan npm
- PostgreSQL 13+ (atau gunakan Docker, lihat bawah)

## Instalasi
```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
```

Edit `.env` sesuai database Anda:

| Variabel | Default | Keterangan |
|---|---|---|
| PORT | 3000 | Port aplikasi |
| DB_HOST | localhost | Host PostgreSQL |
| DB_PORT | 5432 | Port PostgreSQL |
| DB_USERNAME | postgres | User database |
| DB_PASSWORD | postgres | Password database |
| DB_NAME | ecommerce_db | Nama database (harus dibuat dulu) |
| DB_SYNCHRONIZE | true | Tabel dibuat otomatis dari entity |

## Membuat database
```sql
CREATE DATABASE ecommerce_db;
```
Atau dengan Docker:
```bash
docker run --name pg-ecommerce -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ecommerce_db -p 5432:5432 -d postgres:16
```

## Menjalankan
```bash
npm run start:dev      # development (auto reload)
npm run build && npm run start:prod   # production
```
API tersedia di `http://localhost:3000/api`.

## Pengujian dengan Postman
1. Import `postman/ecommerce-api.postman_collection.json`.
2. Pastikan variabel collection `baseUrl` = `http://localhost:3000/api`.
3. Jalankan folder secara berurutan (atau **Run collection**): skenario sukses disusul skenario error (validasi, 404, 409, stok kurang, transisi status tidak valid). ID otomatis disimpan ke variabel collection oleh test script.

## Flow bisnis utama: modul Orders
Modul `orders` adalah bagian inti dari sistem e-commerce karena menangani proses transaksi pelanggan dari awal hingga akhir.

### 1. Pembuatan pesanan
Saat pelanggan membuat pesanan:
- sistem mengecek apakah customer dengan ID yang dipilih benar-benar ada;
- produk yang dibeli akan digabungkan jika ada duplikasi `productId` pada satu request agar total kuantitas lebih akurat;
- setiap produk akan dicek ketersediaan stok secara transactional dengan lock database (`pessimistic_write`);
- jika stok tidak cukup, request langsung ditolak dengan pesan yang jelas;
- stok akan otomatis dikurangkan saat order berhasil dibuat;
- harga per item dan subtotal disimpan pada saat transaksi berlangsung, sehingga riwayat harga tetap konsisten walaupun harga produk berubah di masa depan.

### 2. Status pesanan
Status order mengikuti alur bisnis yang jelas:
- `PENDING` → `PAID` atau `CANCELLED`
- `PAID` → `SHIPPED` atau `CANCELLED`
- `SHIPPED` → `COMPLETED`
- `COMPLETED` dan `CANCELLED` bersifat final

Perubahan status hanya boleh dilakukan mengikuti aturan transisi yang valid. Misalnya, alamat pengiriman hanya bisa diubah saat status masih `PENDING`.

### 3. Pembatalan & penghapusan
- order dengan status `PENDING` atau `CANCELLED` dapat dihapus;
- jika order masih `PENDING`, stok yang sudah dipotong akan dikembalikan saat penghapusan atau pembatalan;
- order yang sudah masuk status lebih lanjut seperti `PAID`, `SHIPPED`, atau `COMPLETED` tidak bisa dihapus untuk menjaga integritas data transaksi.

### 4. Pencarian & paginasi
Endpoint list order mendukung filter berdasarkan:
- `status`
- `customerId`
- pagination (`page`, `limit`)

Hasilnya dikembalikan dalam format paginated response agar mudah digunakan di frontend.

## Dokumentasi
- [ERD](docs/ERD.md)
- [API Specification](docs/API-SPEC.md)

## Struktur
```
src/
  main.ts                 # bootstrap + ValidationPipe global + prefix /api
  app.module.ts           # konfigurasi TypeORM & modul
  common/                 # pagination, transformer decimal
  categories/ products/ customers/ orders/
    *.entity.ts  dto/  *.service.ts  *.controller.ts  *.module.ts'

```
