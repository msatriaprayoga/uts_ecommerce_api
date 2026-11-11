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

## Menyiapkan database
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
    *.entity.ts  dto/  *.service.ts  *.controller.ts  *.module.ts
```
