# API Specification – E-commerce Management System

Base URL: `http://localhost:3000/api` · Format: JSON · Tanpa autentikasi.

## Format error

```json
{ "statusCode": 400, "message": ["price must be a positive number"], "error": "Bad Request" }
```

| Status | Arti |
|---|---|
| 200 OK | GET / PATCH berhasil |
| 201 Created | POST berhasil |
| 204 No Content | DELETE berhasil |
| 400 Bad Request | Validasi gagal, stok kurang, transisi status tidak valid, referensi (FK) tidak ada |
| 404 Not Found | Resource tidak ditemukan |
| 409 Conflict | Data duplikat (nama kategori/email) atau data masih direferensikan |

## Pagination
Endpoint list menerima `?page=1&limit=10` dan mengembalikan:
```json
{ "data": [ ... ], "meta": { "total": 25, "page": 1, "limit": 10, "totalPages": 3 } }
```

---

## Categories

| Method | Endpoint | Deskripsi | Sukses |
|---|---|---|---|
| POST | `/categories` | Tambah kategori | 201 |
| GET | `/categories` | Daftar kategori | 200 |
| GET | `/categories/:id` | Detail kategori + produknya | 200 |
| PATCH | `/categories/:id` | Ubah kategori | 200 |
| DELETE | `/categories/:id` | Hapus kategori (409 jika masih punya produk) | 204 |

Body POST/PATCH:
```json
{ "name": "Elektronik", "description": "Perangkat elektronik" }
```
`name`: wajib (POST), string, maks 100, unik. `description`: opsional.

## Products

| Method | Endpoint | Deskripsi | Sukses |
|---|---|---|---|
| POST | `/products` | Tambah produk | 201 |
| GET | `/products?categoryId=&search=&page=&limit=` | Daftar produk (filter kategori / cari nama) | 200 |
| GET | `/products/:id` | Detail produk + kategori | 200 |
| PATCH | `/products/:id` | Ubah produk | 200 |
| DELETE | `/products/:id` | Hapus produk (409 jika sudah ada di pesanan) | 204 |

Body POST (PATCH: semua field opsional):
```json
{ "name": "Laptop ABC", "description": "14 inci", "price": 8500000, "stock": 20, "categoryId": 1 }
```
`price` > 0 (maks 2 desimal), `stock` ≥ 0, `categoryId` harus ada (400 jika tidak).

## Customers

| Method | Endpoint | Deskripsi | Sukses |
|---|---|---|---|
| POST | `/customers` | Tambah pelanggan | 201 |
| GET | `/customers` | Daftar pelanggan | 200 |
| GET | `/customers/:id` | Detail pelanggan | 200 |
| GET | `/customers/:id/orders` | Daftar pesanan milik pelanggan | 200 |
| PATCH | `/customers/:id` | Ubah pelanggan | 200 |
| DELETE | `/customers/:id` | Hapus pelanggan (409 jika punya pesanan) | 204 |

Body POST:
```json
{ "fullName": "Budi Santoso", "email": "budi@example.com", "phone": "081234567890", "address": "Semarang" }
```
`email` valid & unik (409 jika duplikat). `phone` 8–15 digit.

## Orders

| Method | Endpoint | Deskripsi | Sukses |
|---|---|---|---|
| POST | `/orders` | Buat pesanan beserta item | 201 |
| GET | `/orders?status=&customerId=&page=&limit=` | Daftar pesanan | 200 |
| GET | `/orders/:id` | Detail pesanan + pelanggan + item + info produk | 200 |
| PATCH | `/orders/:id` | Ubah status / alamat / catatan | 200 |
| DELETE | `/orders/:id` | Hapus pesanan (hanya PENDING / CANCELLED) | 204 |

Body POST:
```json
{
  "customerId": 1,
  "shippingAddress": "Jl. Pandanaran No. 1, Semarang",
  "notes": "Kirim pagi hari",
  "items": [ { "productId": 1, "quantity": 2 }, { "productId": 2, "quantity": 1 } ]
}
```

Response detail (`GET /orders/:id`, ringkas):
```json
{
  "id": 1, "status": "PENDING", "totalAmount": 17150000,
  "shippingAddress": "...", "notes": "...",
  "customer": { "id": 1, "fullName": "Budi Santoso", "email": "budi@example.com" },
  "items": [
    { "id": 1, "productId": 1, "quantity": 2, "unitPrice": 8500000, "subtotal": 17000000,
      "product": { "id": 1, "name": "Laptop ABC", "price": 8500000 } }
  ]
}
```

Body PATCH (semua opsional, minimal satu):
```json
{ "status": "PAID" }
```

### Aturan bisnis pesanan
1. Pelanggan dan semua produk harus ada; `items` minimal 1; produk duplikat digabung.
2. Stok produk dicek dan **dikurangi** saat pesanan dibuat (dalam satu transaksi database). Stok kurang → 400 dan tidak ada data tersimpan.
3. `unitPrice` disalin dari harga produk saat transaksi; `subtotal = unitPrice × quantity`; `totalAmount` = jumlah subtotal.
4. Status awal `PENDING`. Transisi yang sah:
   `PENDING → PAID | CANCELLED`, `PAID → SHIPPED | CANCELLED`, `SHIPPED → COMPLETED`. Selain itu → 400.
5. Pembatalan (`CANCELLED`) **mengembalikan stok**.
6. `shippingAddress` hanya bisa diubah saat `PENDING`. Item pesanan tidak dapat diubah setelah dibuat (batalkan lalu buat ulang).
7. DELETE hanya untuk pesanan `PENDING` (stok dikembalikan) atau `CANCELLED`; status lain → 400.
