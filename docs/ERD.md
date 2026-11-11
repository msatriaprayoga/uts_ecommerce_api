# ERD – E-commerce Management System

```mermaid
erDiagram
    CATEGORIES ||--o{ PRODUCTS : "memiliki"
    CUSTOMERS  ||--o{ ORDERS : "membuat"
    ORDERS     ||--|{ ORDER_ITEMS : "berisi"
    PRODUCTS   ||--o{ ORDER_ITEMS : "muncul di"

    CATEGORIES {
        int id PK
        varchar name "UNIQUE"
        text description
        timestamp created_at
        timestamp updated_at
    }
    PRODUCTS {
        int id PK
        varchar name
        text description
        decimal price
        int stock
        int category_id FK
        timestamp created_at
        timestamp updated_at
    }
    CUSTOMERS {
        int id PK
        varchar full_name
        varchar email "UNIQUE"
        varchar phone
        text address
        timestamp created_at
        timestamp updated_at
    }
    ORDERS {
        int id PK
        int customer_id FK
        enum status "PENDING|PAID|SHIPPED|COMPLETED|CANCELLED"
        decimal total_amount
        text shipping_address
        text notes
        timestamp created_at
        timestamp updated_at
    }
    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price "harga saat transaksi"
        decimal subtotal
    }
```

## Relasi & aturan referensial

| Relasi | Tipe | Foreign Key | ON DELETE |
|---|---|---|---|
| Category → Products | 1 : N | `products.category_id` | RESTRICT |
| Customer → Orders | 1 : N | `orders.customer_id` | RESTRICT |
| Order → OrderItems | 1 : N | `order_items.order_id` | CASCADE |
| Product → OrderItems | 1 : N | `order_items.product_id` | RESTRICT |

`order_items` adalah tabel penghubung antara `orders` dan `products` (relasi many-to-many dengan atribut tambahan: `quantity`, `unit_price`, `subtotal`).
`unit_price` menyimpan harga produk **pada saat transaksi**, sehingga perubahan harga produk di kemudian hari tidak memengaruhi pesanan lama.
