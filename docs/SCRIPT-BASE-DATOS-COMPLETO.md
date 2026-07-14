# Script Completo de Base de Datos — ADRISU KIDS

> **Motor de base de datos:** PostgreSQL 15+
> **Proyecto:** Sistema Integral de Gestión ADRISU KIDS
> **Versión del script:** 1.0
> **Fecha:** Julio 2026

---

## 1. Creación de la Base de Datos

```sql
-- ============================================================
-- SECCIÓN 1: CREACIÓN DE LA BASE DE DATOS
-- ============================================================

-- Crear la base de datos
CREATE DATABASE adriskids
    WITH
    OWNER = adris
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- Seleccionar la base de datos
\c adriskids;

-- Habilitar extensión para generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 2. Definición de Tipos Enumerados

```sql
-- ============================================================
-- SECCIÓN 2: TIPOS ENUMERADOS
-- ============================================================

-- Roles de usuario del sistema
CREATE TYPE "UserRole" AS ENUM (
    'super_admin',
    'admin',
    'warehouse_manager',
    'warehouse_staff',
    'sales_manager',
    'sales_rep',
    'logistics_coordinator',
    'customer_service',
    'finance',
    'readonly'
);

-- Estados de un pedido
CREATE TYPE "OrderStatus" AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'in_transit',
    'delivered',
    'cancelled'
);

-- Estados de pago
CREATE TYPE "PaymentStatus" AS ENUM (
    'pending',
    'authorized',
    'captured',
    'partially_paid',
    'paid',
    'failed',
    'refunded',
    'voided'
);

-- Estados de envío
CREATE TYPE "ShipmentStatus" AS ENUM (
    'pending',
    'label_created',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'exception',
    'returned'
);

-- Estados de producto
CREATE TYPE "ProductStatus" AS ENUM (
    'draft',
    'active',
    'archived',
    'discontinued'
);

-- Estados de factura
CREATE TYPE "InvoiceStatus" AS ENUM (
    'draft',
    'issued',
    'sent',
    'paid',
    'overdue',
    'cancelled',
    'voided'
);

-- Acciones de auditoría
CREATE TYPE "AuditAction" AS ENUM (
    'create',
    'update',
    'delete',
    'login',
    'logout',
    'export',
    'import',
    'approve',
    'reject',
    'execute'
);

-- Estados de lista de picking
CREATE TYPE "PickListStatus" AS ENUM (
    'draft',
    'assigned',
    'in_progress',
    'completed',
    'cancelled'
);

-- Estados de devolución
CREATE TYPE "ReturnStatus" AS ENUM (
    'pending',
    'inspecting',
    'reconditioned',
    'damaged',
    'disposed',
    'refunded',
    'cancelled'
);

-- Estados de conteo cíclico
CREATE TYPE "CycleCountStatus" AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);

-- Estados de control de calidad
CREATE TYPE "QCStatus" AS ENUM (
    'pending',
    'in_progress',
    'passed',
    'failed',
    'quarantined'
);
```

---

## 3. Definición de Tablas (DDL)

```sql
-- ============================================================
-- SECCIÓN 3: DEFINICIÓN DE TABLAS (DDL)
-- ============================================================

-- ============================================================
-- 3.1 DOMINIO IAM (Identidad y Acceso)
-- ============================================================

-- Tabla de usuarios
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(50),
    avatar_url      VARCHAR(500),
    role            "UserRole" NOT NULL DEFAULT 'readonly',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    two_factor_secret   VARCHAR(255),
    two_factor_enabled  BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de sesiones
CREATE TABLE sessions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);

-- ============================================================
-- 3.2 DOMINIO CATÁLOGO
-- ============================================================

-- Tabla de categorías (auto-referenciada para subcategorías)
CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    image_url   VARCHAR(500),
    attributes  JSONB NOT NULL DEFAULT '[]',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Tabla de productos
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku             VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    model           VARCHAR(100),
    description     TEXT,
    short_description VARCHAR(500),
    brand           VARCHAR(100),
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    status          "ProductStatus" NOT NULL DEFAULT 'draft',
    tags            TEXT[] DEFAULT '{}',
    images          TEXT[] DEFAULT '{}',
    height          DECIMAL(10,2),
    width           DECIMAL(10,2),
    depth           DECIMAL(10,2),
    color           VARCHAR(100),
    materials       TEXT[] DEFAULT '{}',
    recommended_age VARCHAR(50),
    warranty_days   INTEGER,
    origin_country  VARCHAR(100),
    weight          DECIMAL(10,2),
    weight_unit     VARCHAR(10) DEFAULT 'kg',
    low_stock_alert INTEGER,
    price_config    JSONB,
    discount_popup  JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);

-- Tabla de variantes de producto
CREATE TABLE product_variants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku             VARCHAR(50) NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    attributes      JSONB NOT NULL DEFAULT '{}',
    price           DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    cost_price      DECIMAL(10,2),
    barcode         VARCHAR(100),
    image_url       VARCHAR(500),
    images          TEXT[] DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    stock           INTEGER NOT NULL DEFAULT 0,
    low_stock_alert INTEGER,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

-- ============================================================
-- 3.3 DOMINIO INVENTARIO / WMS
-- ============================================================

-- Tabla de almacenes
CREATE TABLE warehouses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    address     JSONB NOT NULL DEFAULT '{}',
    phone       VARCHAR(50),
    email       VARCHAR(255),
    manager_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_warehouses_code ON warehouses(code);

-- Tabla de ubicaciones dentro del almacén (auto-referenciada)
CREATE TABLE warehouse_locations (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id   UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    parent_id      UUID REFERENCES warehouse_locations(id) ON DELETE CASCADE,
    code           VARCHAR(50) NOT NULL,
    name           VARCHAR(255) NOT NULL,
    location_type  VARCHAR(50) NOT NULL DEFAULT 'shelf',
    capacity       INTEGER,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_warehouse_location UNIQUE (warehouse_id, code)
);

CREATE INDEX idx_warehouse_locations_warehouse_id ON warehouse_locations(warehouse_id);
CREATE INDEX idx_warehouse_locations_parent_id ON warehouse_locations(parent_id);

-- Tabla de inventario (stock por variante por almacén)
CREATE TABLE inventory (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variant_id        UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    warehouse_id      UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity          INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_point     INTEGER NOT NULL DEFAULT 10,
    reorder_quantity  INTEGER NOT NULL DEFAULT 50,
    last_counted_at   TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_inventory_variant_warehouse UNIQUE (variant_id, warehouse_id)
);

CREATE INDEX idx_inventory_variant_id ON inventory(variant_id);
CREATE INDEX idx_inventory_warehouse_id ON inventory(warehouse_id);

-- ============================================================
-- 3.4 DOMINIO LISTAS DE PRECIO
-- ============================================================

-- Tabla de listas de precio
CREATE TABLE price_lists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    currency    VARCHAR(10) NOT NULL DEFAULT 'PEN',
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    valid_from  TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de ítems de lista de precio
CREATE TABLE price_list_items (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
    variant_id   UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    price        DECIMAL(10,2) NOT NULL,
    min_quantity INTEGER NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_price_list_item UNIQUE (price_list_id, variant_id, min_quantity)
);

-- ============================================================
-- 3.5 DOMINIO VENTAS / CRM
-- ============================================================

-- Tabla de clientes
CREATE TABLE customers (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source           VARCHAR(50) NOT NULL DEFAULT 'store',
    customer_type    VARCHAR(50) NOT NULL DEFAULT 'individual',
    email            VARCHAR(255) UNIQUE,
    password         VARCHAR(255) NOT NULL DEFAULT '',
    phone            VARCHAR(50),
    full_name        VARCHAR(255) NOT NULL,
    company_name     VARCHAR(255),
    tax_id           VARCHAR(50),
    billing_address  JSONB NOT NULL DEFAULT '{}',
    shipping_address JSONB NOT NULL DEFAULT '{}',
    price_list_id    UUID REFERENCES price_lists(id) ON DELETE SET NULL,
    credit_limit     DECIMAL(12,2) NOT NULL DEFAULT 0,
    current_balance  DECIMAL(12,2) NOT NULL DEFAULT 0,
    tags             TEXT[] DEFAULT '{}',
    notes            TEXT,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_tax_id ON customers(tax_id);

-- Tabla de pedidos
CREATE TABLE orders (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number     VARCHAR(50) NOT NULL UNIQUE,
    source           VARCHAR(50) NOT NULL DEFAULT 'store',
    customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    placed_by        UUID REFERENCES users(id) ON DELETE SET NULL,
    status           "OrderStatus" NOT NULL DEFAULT 'pending',
    payment_status   "PaymentStatus" NOT NULL DEFAULT 'pending',
    payment_method   VARCHAR(50),
    currency         VARCHAR(10) NOT NULL DEFAULT 'PEN',
    subtotal         DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount       DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
    total            DECIMAL(12,2) NOT NULL DEFAULT 0,
    billing_address  JSONB NOT NULL DEFAULT '{}',
    shipping_address JSONB NOT NULL DEFAULT '{}',
    notes            TEXT,
    internal_notes   TEXT,
    placed_at        TIMESTAMPTZ,
    confirmed_at     TIMESTAMPTZ,
    shipped_at       TIMESTAMPTZ,
    delivered_at     TIMESTAMPTZ,
    cancelled_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Tabla de ítems del pedido
CREATE TABLE order_items (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    variant_id        UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    product_name      VARCHAR(255) NOT NULL,
    variant_name      VARCHAR(255) NOT NULL,
    sku               VARCHAR(50) NOT NULL,
    quantity          INTEGER NOT NULL,
    unit_price        DECIMAL(10,2) NOT NULL,
    discount_percent  DECIMAL(5,2) NOT NULL DEFAULT 0,
    discount_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
    total             DECIMAL(12,2) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- Tabla de historial de estados del pedido
CREATE TABLE order_status_history (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status     "OrderStatus",
    to_status       "OrderStatus" NOT NULL,
    changed_by      UUID,
    changed_by_type VARCHAR(50) NOT NULL DEFAULT 'user',
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order_id ON order_status_history(order_id);

-- ============================================================
-- 3.6 DOMINIO FACTURACIÓN
-- ============================================================

-- Tabla de facturas
CREATE TABLE invoices (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_id    UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status         "InvoiceStatus" NOT NULL DEFAULT 'draft',
    currency       VARCHAR(10) NOT NULL DEFAULT 'PEN',
    subtotal       DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount     DECIMAL(12,2) NOT NULL DEFAULT 0,
    total          DECIMAL(12,2) NOT NULL DEFAULT 0,
    amount_paid    DECIMAL(12,2) NOT NULL DEFAULT 0,
    due_date       TIMESTAMPTZ,
    paid_at        TIMESTAMPTZ,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);

-- Tabla de ítems de factura
CREATE TABLE invoice_items (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity    INTEGER NOT NULL,
    unit_price  DECIMAL(10,2) NOT NULL,
    total       DECIMAL(12,2) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ============================================================
-- 3.7 DOMINIO COMPRAS / PROVEEDORES
-- ============================================================

-- Tabla de proveedores
CREATE TABLE suppliers (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name           VARCHAR(255) NOT NULL,
    code           VARCHAR(50) NOT NULL UNIQUE,
    supplier_type  VARCHAR(50) NOT NULL DEFAULT 'local',
    contact_name   VARCHAR(255),
    email          VARCHAR(255),
    phone          VARCHAR(50),
    address        JSONB NOT NULL DEFAULT '{}',
    country        VARCHAR(100),
    currency       VARCHAR(10) NOT NULL DEFAULT 'PEN',
    payment_terms  VARCHAR(100),
    lead_time_days INTEGER NOT NULL DEFAULT 7,
    rating         INTEGER,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppliers_code ON suppliers(code);

-- Tabla de órdenes de compra
CREATE TABLE purchase_orders (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number     VARCHAR(50) NOT NULL UNIQUE,
    supplier_id   UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    warehouse_id  UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    ordered_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    status        VARCHAR(50) NOT NULL DEFAULT 'draft',
    currency      VARCHAR(10) NOT NULL DEFAULT 'PEN',
    subtotal      DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
    total         DECIMAL(12,2) NOT NULL DEFAULT 0,
    expected_date TIMESTAMPTZ,
    received_date TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);

-- Tabla de ítems de orden de compra
CREATE TABLE purchase_order_items (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    variant_id       UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    sku              VARCHAR(50) NOT NULL,
    quantity         INTEGER NOT NULL,
    received_quantity INTEGER NOT NULL DEFAULT 0,
    unit_price       DECIMAL(10,2) NOT NULL,
    total            DECIMAL(12,2) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_items_purchase_order_id ON purchase_order_items(purchase_order_id);

-- Tabla de recepciones de mercadería
CREATE TABLE goods_receipts (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number    VARCHAR(50) NOT NULL UNIQUE,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    warehouse_id      UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    received_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    supplier_id       UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    status            VARCHAR(50) NOT NULL DEFAULT 'pending',
    received_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goods_receipts_receipt_number ON goods_receipts(receipt_number);

-- Tabla de ítems de recepción
CREATE TABLE goods_receipt_items (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goods_receipt_id  UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    variant_id        UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    expected_quantity INTEGER NOT NULL,
    received_quantity INTEGER NOT NULL,
    condition         VARCHAR(50) NOT NULL DEFAULT 'good',
    notes             TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goods_receipt_items_goods_receipt_id ON goods_receipt_items(goods_receipt_id);

-- ============================================================
-- 3.8 DOMINIO LOGÍSTICA
-- ============================================================

-- Tabla de envíos
CREATE TABLE shipments (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_number    VARCHAR(50) NOT NULL UNIQUE,
    order_id           UUID REFERENCES orders(id) ON DELETE SET NULL,
    warehouse_id       UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    carrier            VARCHAR(100) NOT NULL,
    tracking_number    VARCHAR(100),
    status             "ShipmentStatus" NOT NULL DEFAULT 'pending',
    shipping_address   JSONB NOT NULL DEFAULT '{}',
    weight             DECIMAL(10,2),
    cost               DECIMAL(10,2),
    estimated_delivery TIMESTAMPTZ,
    actual_delivery    TIMESTAMPTZ,
    notes              TEXT,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_shipment_number ON shipments(shipment_number);
CREATE INDEX idx_shipments_order_id ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);

-- Tabla de eventos de envío
CREATE TABLE shipment_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    status      "ShipmentStatus" NOT NULL,
    location    VARCHAR(255),
    description TEXT,
    event_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipment_events_shipment_id ON shipment_events(shipment_id);

-- ============================================================
-- 3.9 DOMINIO AUDITORÍA, NOTIFICACIONES Y SINCRONIZACIÓN
-- ============================================================

-- Tabla de auditoría (inmutable)
CREATE TABLE audit_trail (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name        VARCHAR(100) NOT NULL,
    record_id         UUID NOT NULL,
    action            "AuditAction" NOT NULL,
    old_values        JSONB NOT NULL DEFAULT '{}',
    new_values        JSONB NOT NULL DEFAULT '{}',
    changed_fields    TEXT[] DEFAULT '{}',
    performed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_by_type VARCHAR(50) NOT NULL DEFAULT 'user',
    ip_address        VARCHAR(50),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_trail_table_name ON audit_trail(table_name);
CREATE INDEX idx_audit_trail_record_id ON audit_trail(record_id);
CREATE INDEX idx_audit_trail_performed_by ON audit_trail(performed_by);
CREATE INDEX idx_audit_trail_created_at ON audit_trail(created_at);

-- Tabla de cola de notificaciones
CREATE TABLE notification_queue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255),
    subject         VARCHAR(255),
    body            TEXT NOT NULL,
    channel         VARCHAR(50),
    type            VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_recipient_id ON notification_queue(recipient_id);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);

-- Tabla de eventos de sincronización
CREATE TABLE sync_events (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type    VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(100) NOT NULL,
    entity_id     UUID NOT NULL,
    payload       JSONB NOT NULL,
    status        VARCHAR(50) NOT NULL DEFAULT 'pending',
    retry_count   INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at     TIMESTAMPTZ
);

CREATE INDEX idx_sync_events_status_created ON sync_events(status, created_at);

-- ============================================================
-- 3.10 DOMINIO TIENDA VIRTUAL
-- ============================================================

-- Tabla de carritos de compra
CREATE TABLE carts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de ítems del carrito
CREATE TABLE cart_items (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_cart_item UNIQUE (cart_id, variant_id)
);

CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- Tabla de pagos
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    method          VARCHAR(50) NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'pending',
    amount          DECIMAL(12,2) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'PEN',
    transaction_id  VARCHAR(255),
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);

-- Tabla de reseñas
CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rating      INTEGER NOT NULL,
    title       VARCHAR(255),
    comment     TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_review UNIQUE (product_id, customer_id)
);

CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_customer_id ON reviews(customer_id);

-- Tabla de configuración general
CREATE TABLE settings (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key        VARCHAR(255) NOT NULL UNIQUE,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3.11 DOMINIO OFERTAS / PROMOCIONES
-- ============================================================

-- Tabla de ofertas
CREATE TABLE offers (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    type             VARCHAR(50) NOT NULL DEFAULT 'bundle',
    min_quantity     INTEGER NOT NULL DEFAULT 1,
    discount_percent INTEGER NOT NULL DEFAULT 0,
    fixed_price      DECIMAL(10,2),
    product_id       UUID REFERENCES products(id) ON DELETE CASCADE,
    sort_order       INTEGER NOT NULL DEFAULT 0,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3.12 DOMINIO LISTA DE DESEOS
-- ============================================================

CREATE TABLE wishlists (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    variant_id  UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_wishlist UNIQUE (customer_id, variant_id)
);

-- ============================================================
-- 3.13 DOMINIO NEWSLETTER
-- ============================================================

CREATE TABLE newsletter_subscribers (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email      VARCHAR(255) NOT NULL UNIQUE,
    name       VARCHAR(255),
    status     VARCHAR(50) NOT NULL DEFAULT 'active',
    source     VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3.14 DOMINIO CONFIGURACIÓN DE IMPUESTOS
-- ============================================================

CREATE TABLE tax_configs (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(100) NOT NULL,
    rate       DECIMAL(5,2) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3.15 DOMINIO CHECKOUTS ABANDONADOS
-- ============================================================

CREATE TABLE abandoned_checkouts (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id       VARCHAR(255),
    email            VARCHAR(255),
    phone            VARCHAR(50),
    name             VARCHAR(255),
    items            JSONB NOT NULL DEFAULT '[]',
    subtotal         DECIMAL(12,2) NOT NULL DEFAULT 0,
    total            DECIMAL(12,2) NOT NULL DEFAULT 0,
    shipping_address JSONB NOT NULL DEFAULT '{}',
    payment_method   VARCHAR(50),
    status           VARCHAR(50) NOT NULL DEFAULT 'abandoned',
    recovered_at     TIMESTAMPTZ,
    converted_at     TIMESTAMPTZ,
    order_id         UUID REFERENCES orders(id) ON DELETE SET NULL,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3.16 DOMINIO PRODUCTOS SUGERIDOS (UPSELL)
-- ============================================================

CREATE TABLE suggested_products (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id        UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    price             DECIMAL(10,2) NOT NULL,
    compare_at_price  DECIMAL(10,2),
    discount_percent  INTEGER NOT NULL DEFAULT 0,
    image_url         VARCHAR(500),
    type              VARCHAR(50) NOT NULL DEFAULT 'custom',
    linked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suggested_products_product_id ON suggested_products(product_id);
```

---

## 4. Inserción de Datos Iniciales (DML)

```sql
-- ============================================================
-- SECCIÓN 4: INSERCIÓN DE DATOS INICIALES (DML)
-- ============================================================

-- ============================================================
-- 4.1 USUARIOS DEL SISTEMA
-- ============================================================

-- Contraseña por defecto: "admin123" (hash bcrypt)
INSERT INTO users (id, email, password_hash, full_name, role, is_active) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'admin@adriskids.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Administrador General', 'super_admin', TRUE),
    ('a1000000-0000-0000-0000-000000000002', 'bodega@adriskids.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Jefe de Bodega',        'warehouse_manager', TRUE),
    ('a1000000-0000-0000-0000-000000000003', 'ventas@adriskids.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Gerente de Ventas',     'sales_manager', TRUE),
    ('a1000000-0000-0000-0000-000000000004', 'logistica@adriskids.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Coordinador Logística', 'logistics_coordinator', TRUE),
    ('a1000000-0000-0000-0000-000000000005', 'consulta@adriskids.com','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Servicio al Cliente',   'customer_service', TRUE);

-- ============================================================
-- 4.2 CATEGORÍAS DE PRODUCTOS
-- ============================================================

INSERT INTO categories (id, name, slug, description, sort_order, is_active) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'Muebles para Bebé',     'muebles-para-bebe',     'Camas, cunas, cambiadores y muebles para recién nacidos', 1, TRUE),
    ('c1000000-0000-0000-0000-000000000002', 'Accesorios para Bebé',   'accesorios-para-bebe',  'Accesorios complementarios para el cuidado del bebé',      2, TRUE),
    ('c1000000-0000-0000-0000-000000000003', 'Juguetes Educativos',    'juguetes-educativos',   'Juguetes que estimulan el desarrollo infantil',            3, TRUE),
    ('c1000000-0000-0000-0000-000000000004', 'Kit Bebé',               'kit-bebe',              'Kit completos de bienvenida para bebés',                   4, TRUE),
    ('c1000000-0000-0000-0000-000000000005', 'Ropa Infantil',          'ropa-infantil',         'Ropa y textiles para bebés y niños',                       5, TRUE);

-- Subcategorías
INSERT INTO categories (id, parent_id, name, slug, description, sort_order, is_active) VALUES
    ('c1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000001', 'Cunas Convertibles',   'cunas-convertibles',   'Cunas que se transforman en cama infantil',  1, TRUE),
    ('c1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000001', 'Cambiadores',           'cambiadores',           'Muebles para cambio de pañales',              2, TRUE),
    ('c1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000001', 'Cunas Portátiles',      'cunas-portatiles',      'Cunas plegables para viajes',                 3, TRUE);

-- ============================================================
-- 4.3 ALMACENES
-- ============================================================

INSERT INTO warehouses (id, name, code, description, address, phone, is_active) VALUES
    ('w1000000-0000-0000-0000-000000000001', 'Almacén Principal Lima',   'ALM-LIMA-01',  'Almacén central de distribución',   '{"department":"Lima","province":"Lima","district":"San Juan de Lurigancho","street":"Av. Industrial 123"}', '999111222', TRUE),
    ('w1000000-0000-0000-0000-000000000002', 'Almacén Secundario',       'ALM-LIMA-02',  'Almacén de respaldo y overstock',   '{"department":"Lima","province":"Lima","district":"Ate","street":"Av. Próceres 456"}',                       '999222333', TRUE),
    ('w1000000-0000-0000-0000-000000000003', 'Tienda Física Showroom',   'TIENDA-01',    'Punto de venta y exhibición',       '{"department":"Lima","province":"Lima","district":"Miraflores","street":"Av. Larco 789"}',                   '999333444', TRUE);

-- Ubicaciones del almacén principal
INSERT INTO warehouse_locations (id, warehouse_id, code, name, location_type, capacity, is_active) VALUES
    ('l1000000-0000-0000-0000-000000000001', 'w1000000-0000-0000-0000-000000000001', 'A-01', 'Estante A - Nivel 1', 'shelf', 50, TRUE),
    ('l1000000-0000-0000-0000-000000000002', 'w1000000-0000-0000-0000-000000000001', 'A-02', 'Estante A - Nivel 2', 'shelf', 50, TRUE),
    ('l1000000-0000-0000-0000-000000000003', 'w1000000-0000-0000-0000-000000000001', 'B-01', 'Estante B - Nivel 1', 'shelf', 40, TRUE),
    ('l1000000-0000-0000-0000-000000000004', 'w1000000-0000-0000-0000-000000000001', 'ZONA-FRIO', 'Zona de Temperatura Controlada', 'zone', 20, TRUE);

-- ============================================================
-- 4.4 PRODUCTOS
-- ============================================================

INSERT INTO products (id, sku, name, slug, model, description, short_description, brand, category_id, status, tags, height, width, depth, color, materials, recommended_age, warranty_days, origin_country, weight, weight_unit, low_stock_alert) VALUES
    ('p1000000-0000-0000-0000-000000000001', 'ADK-MUE-001', 'Cuna Convertible Premium 3 en 1', 'cuna-convertible-premium', 'CK-350', 'Cuna convertible de alta calidad que se transforma en cama infantil y junior. Fabricada en madera sólida de pino con acabado no tóxico.', 'Cuna 3 en 1 que crece con tu bebé', 'AdriSu Kids', 'c1000000-0000-0000-0000-000000000006', 'active', ARRAY['cuna','convertible','mueble','bebe'], 100, 65, 120, 'Blanco', ARRAY['Madera de Pino','MDF'], '0-36 meses', 365, 'Perú', 25.5, 'kg', 5),
    ('p1000000-0000-0000-0000-000000000002', 'ADK-MUE-002', 'Cambiador con Cajones', 'cambiador-con-cajones', 'CC-200', 'Cambiador实用 con 4 cajones amplios para organizar pañales y accesorios. Superficie antideslizante.', 'Cambiador funcional con almacenamiento', 'AdriSu Kids', 'c1000000-0000-0000-0000-000000000007', 'active', ARRAY['cambiador','mueble','accesorio'], 90, 50, 80, 'Natural', ARRAY['Madera','MDF'], '0-24 meses', 365, 'Perú', 18.0, 'kg', 8),
    ('p1000000-0000-0000-0000-000000000003', 'ADK-MUE-003', 'Cuna Portátil Plegable', 'cuna-portatil-plegable', 'CP-100', 'Cuna portátil ligera y fácil de armar. Ideal para viajes y visitas. Incluye bolsa de transporte.', 'Cuna plegable para viajes', 'AdriSu Kids', 'c1000000-0000-0000-0000-000000000008', 'active', ARRAY['cuna','portatil','plegable','viaje'], 75, 60, 130, 'Gris', ARRAY['Aluminio','Tela Oxford'], '0-24 meses', 180, 'China', 8.5, 'kg', 10),
    ('p1000000-0000-0000-0000-000000000004', 'ADK-ACC-001', 'Kit Bienvenida Bebé (12 piezas)', 'kit-bienvenida-bebe', 'KB-012', 'Kit completo que incluye: manta, toalla con capucha, baberos, calcetines, gorrito y guantes. Todo en_PRESENTACIÓN de regalo.', 'Kit de regalo para recién nacido', 'AdriSu Kids', 'c1000000-0000-0000-0000-000000000004', 'active', ARRAY['kit','regalo','bebe','bienvenida'], NULL, NULL, NULL, 'Blanco/Rosa', ARRAY['Algodón 100%'], '0-6 meses', 30, 'Perú', 0.8, 'kg', 15),
    ('p1000000-0000-0000-0000-000000000005', 'ADK-JUG-001', 'Set Montessori Torre de Anillos', 'set-montessori-torre-anillos', 'MT-005', 'Juego educativo de madera para desarrollo de motricidad fina. 5 anillos de colores y tamaños diferentes sobre base estable.', 'Juguete educativo Montessori', 'AdriSu Kids', 'c1000000-0000-0000-0000-000000000003', 'active', ARRAY['juguete','montessori','educativo','madera'], 18, 18, 25, 'Multicolor', ARRAY['Madera de Hayal','Pintura no tóxica'], '6-36 meses', 90, 'Perú', 0.6, 'kg', 20);

-- ============================================================
-- 4.5 VARIANTES DE PRODUCTOS
-- ============================================================

INSERT INTO product_variants (id, product_id, sku, name, attributes, price, compare_at_price, cost_price, stock, low_stock_alert, is_active) VALUES
    -- Cuna Convertible Premium (2 variantes)
    ('v1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'ADK-MUE-001-V1', 'Blanco Clásico', '{"Color":"Blanco","Acabado":"Lacado"}', 459.90, 529.90, 185.00, 25, 5, TRUE),
    ('v1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'ADK-MUE-001-V2', 'Natural / Gris', '{"Color":"Natural/Gris","Acabado":"Barniz"}', 479.90, 549.90, 195.00, 18, 5, TRUE),
    -- Cambiador con Cajones (1 variante)
    ('v1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000002', 'ADK-MUE-002-V1', 'Natural', '{"Color":"Natural","Acabado":"Barniz Mate"}', 289.90, 329.90, 110.00, 15, 8, TRUE),
    -- Cuna Portátil (2 variantes)
    ('v1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000003', 'ADK-MUE-003-V1', 'Gris', '{"Color":"Gris"}', 189.90, 229.90, 75.00, 30, 10, TRUE),
    ('v1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000003', 'ADK-MUE-003-V2', 'Azul', '{"Color":"Azul"}', 189.90, 229.90, 75.00, 22, 10, TRUE),
    -- Kit Bienvenida (3 variantes)
    ('v1000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000004', 'ADK-ACC-001-V1', 'Rosa', '{"Tema":"Rosa","Talla":"Única"}', 79.90, 99.90, 28.00, 50, 15, TRUE),
    ('v1000000-0000-0000-0000-000000000007', 'p1000000-0000-0000-0000-000000000004', 'ADK-ACC-001-V2', 'Azul', '{"Tema":"Azul","Talla":"Única"}', 79.90, 99.90, 28.00, 45, 15, TRUE),
    ('v1000000-0000-0000-0000-000000000008', 'p1000000-0000-0000-0000-000000000004', 'ADK-ACC-001-V3', 'Unisex (Blanco)', '{"Tema":"Unisex","Talla":"Única"}', 85.00, NULL, 30.00, 35, 15, TRUE),
    -- Torre de Anillos (1 variante)
    ('v1000000-0000-0000-0000-000000000009', 'p1000000-0000-0000-0000-000000000005', 'ADK-JUG-001-V1', 'Multicolor', '{"Colores":"5 colores","Material":"Madera"}', 49.90, 59.90, 15.00, 60, 20, TRUE);

-- ============================================================
-- 4.6 INVENTARIO (STOCK POR ALMACÉN)
-- ============================================================

INSERT INTO inventory (variant_id, warehouse_id, quantity, reserved_quantity, available_quantity, reorder_point, reorder_quantity) VALUES
    ('v1000000-0000-0000-0000-000000000001', 'w1000000-0000-0000-0000-000000000001', 25, 2, 23, 5, 50),
    ('v1000000-0000-0000-0000-000000000002', 'w1000000-0000-0000-0000-000000000001', 18, 0, 18, 5, 50),
    ('v1000000-0000-0000-0000-000000000003', 'w1000000-0000-0000-0000-000000000001', 15, 1, 14, 8, 40),
    ('v1000000-0000-0000-0000-000000000004', 'w1000000-0000-0000-0000-000000000001', 30, 3, 27, 10, 60),
    ('v1000000-0000-0000-0000-000000000005', 'w1000000-0000-0000-0000-000000000001', 22, 0, 22, 10, 60),
    ('v1000000-0000-0000-0000-000000000006', 'w1000000-0000-0000-0000-000000000001', 50, 5, 45, 15, 100),
    ('v1000000-0000-0000-0000-000000000007', 'w1000000-0000-0000-0000-000000000001', 45, 2, 43, 15, 100),
    ('v1000000-0000-0000-0000-000000000008', 'w1000000-0000-0000-0000-000000000001', 35, 0, 35, 15, 80),
    ('v1000000-0000-0000-0000-000000000009', 'w1000000-0000-0000-0000-000000000001', 60, 8, 52, 20, 120);

-- ============================================================
-- 4.7 CLIENTES DE PRUEBA
-- ============================================================

INSERT INTO customers (id, source, customer_type, email, full_name, phone, tax_id, billing_address, shipping_address, is_active) VALUES
    ('cu100000-0000-0000-0000-000000000001', 'store', 'individual', 'maria.garcia@email.com',  'María García López',    '999111222', NULL, '{"street":"Av. Los Olivos 123","district":"Los Olivos","city":"Lima"}', '{"street":"Av. Los Olivos 123","district":"Los Olivos","city":"Lima","reference":"Frente al parque"}', TRUE),
    ('cu100000-0000-0000-0000-000000000002', 'store', 'individual', 'carlos.mendoza@email.com','Carlos Mendoza Ruiz',   '999222333', NULL, '{"street":"Jr. Huancavelica 456","district":"Cercado","city":"Lima"}', '{"street":"Jr. Huancavelica 456","district":"Cercado","city":"Lima","reference":"Casa blanca 2 pisos"}', TRUE),
    ('cu100000-0000-0000-0000-000000000003', 'store', 'company',    'compras@bebystore.pe',   'Bebystore EIRL',        '999333444', '20543210987', '{"street":"Av. Industrial 789","district":"Ate","city":"Lima"}', '{"street":"Av. Industrial 789","district":"Ate","city":"Lima","reference":"Local esquinero"}', TRUE),
    ('cu100000-0000-0000-0000-000000000004', 'wms',   'individual', 'guest-temp@temp.com',    'Cliente WMS',           NULL,        NULL, '{}', '{}', TRUE);

-- ============================================================
-- 4.8 PROVEEDORES
-- ============================================================

INSERT INTO suppliers (id, name, code, supplier_type, contact_name, email, phone, country, currency, payment_terms, lead_time_days, rating, is_active) VALUES
    ('s1000000-0000-0000-0000-000000000001', 'Muebles El Naranjal',   'PROV-001', 'local',   'Roberto Sánchez',   'ventas@mueblesnaranjal.pe', '999444555', 'Perú',      'PEN', 'Contado / 30 días', 7,  4, TRUE),
    ('s1000000-0000-0000-0000-000000000002', 'BabyComfort International','PROV-002','international', 'Li Wei', 'export@babycomfort.cn', '86-138-0000-1234', 'China', 'USD', 'Transferencia / 60 días', 45, 3, TRUE),
    ('s1000000-0000-0000-0000-000000000003', 'Distribuidora Textil Lima','PROV-003','local', 'Ana Torres',  'pedidos@textillima.pe', '999555666', 'Perú', 'PEN', 'Contado / 15 días', 3, 5, TRUE);

-- ============================================================
-- 4.9 LISTA DE PRECIOS
-- ============================================================

INSERT INTO price_lists (id, name, code, description, currency, is_default, is_active) VALUES
    ('pl100000-0000-0000-0000-000000000001', 'Precio General',      'PRECIO-GEN',  'Lista de precios para el público general',        'PEN', TRUE,  TRUE),
    ('pl100000-0000-0000-0000-000000000002', 'Precio Mayorista',    'PRECIO-MAY',  'Lista de precios para distributors y tiendas',     'PEN', FALSE, TRUE),
    ('pl100000-0000-0000-0000-000000000003', 'Precio VIP',          'PRECIO-VIP',  'Lista de precios para clientes frecuentes VIP',    'PEN', FALSE, TRUE);

-- Asignar lista de precio general a clientes
UPDATE customers SET price_list_id = 'pl100000-0000-0000-0000-000000000001' WHERE price_list_id IS NULL;

-- ============================================================
-- 4.10 IMPUESTOS
-- ============================================================

INSERT INTO tax_configs (id, name, rate, is_default, is_active) VALUES
    ('t1000000-0000-0000-0000-000000000001', 'IGV (Impuesto General a las Ventas)', 18.00, TRUE,  TRUE),
    ('t1000000-0000-0000-0000-000000000002', 'ISC (Impuesto Selectivo al Consumo)',   0.00, FALSE, FALSE),
    ('t1000000-0000-0000-0000-000000000003', 'Exonerado',                              0.00, FALSE, FALSE);

-- ============================================================
-- 4.11 OFERTAS INICIALES
-- ============================================================

INSERT INTO offers (id, name, description, type, min_quantity, discount_percent, product_id, sort_order, is_active) VALUES
    ('of100000-0000-0000-0000-000000000001', 'Pack Familiar Bebé',        'Lleva 2 Kit Bienvenida y obtén 15% de descuento',           'bundle',     2, 15, 'p1000000-0000-0000-0000-000000000004', 1, TRUE),
    ('of100000-0000-0000-0000-000000000002', 'Descuento Cuna + Cambiador','Compra Cuna Convertible + Cambiador y ahorra S/ 50',        'crosssell',  1, 0,  'p1000000-0000-0000-0000-000000000001', 2, TRUE),
    ('of100000-0000-0000-0000-000000000003', 'Oferta Especial Juguetes',  '20% de descuento en juguetes educativos este mes',           'discount',   1, 20, 'p1000000-0000-0000-0000-000000000005', 3, TRUE);

-- ============================================================
-- 4.12 CONFIGURACIONES DEL SISTEMA
-- ============================================================

INSERT INTO settings (key, value) VALUES
    ('store_name',        '"ADRISU KIDS"'),
    ('store_email',       '"contacto@adriskids.com"'),
    ('store_phone',       '"+51 999 111 222"'),
    ('store_address',     '"Av. Industrial 123, San Juan de Lurigancho, Lima"'),
    ('currency',          '"PEN"'),
    ('currency_symbol',   '"S/"'),
    ('tax_included',      'true'),
    ('free_shipping_threshold', '150'),
    ('shipping_cost',     '10'),
    ('low_stock_threshold', '5'),
    ('order_prefix',      '"ADR-"'),
    ('shipment_prefix',   '"ENV-"'),
    ('invoice_prefix',    '"FAC-"'),
    ('satisfaction_survey_url', '"https://forms.adriskids.com/satisfaccion"'),
    ('whatsapp_phone',    '"+51999111222"'),
    ('telegram_bot_enabled', 'true'),
    ('email_notifications_enabled', 'true'),
    ('maintenance_mode',  'false');

-- ============================================================
-- 4.13 PEDIDOS DE EJEMPLO (para demostración)
-- ============================================================

-- Pedido 1: Confirmado
INSERT INTO orders (id, order_number, source, customer_id, status, payment_status, payment_method, currency, subtotal, discount_amount, tax_amount, shipping_amount, total, shipping_address, notes, placed_at, confirmed_at, created_at) VALUES
    ('o1000000-0000-0000-0000-000000000001', 'ADR-20260714-00001', 'store', 'cu100000-0000-0000-0000-000000000001', 'confirmed', 'paid', 'mercadopago', 'PEN', 459.90, 0, 0, 0, 459.90, '{"street":"Av. Los Olivos 123","district":"Los Olivos","city":"Lima","reference":"Frente al parque"}', 'Entregar en horario de mañana', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

INSERT INTO order_items (order_id, variant_id, product_name, variant_name, sku, quantity, unit_price, discount_percent, discount_amount, total) VALUES
    ('o1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 'Cuna Convertible Premium 3 en 1', 'Blanco Clásico', 'ADK-MUE-001-V1', 1, 459.90, 0, 0, 459.90);

INSERT INTO order_status_history (order_id, to_status, changed_by_type) VALUES
    ('o1000000-0000-0000-0000-000000000001', 'confirmed', 'user');

-- Pedido 2: Despachado
INSERT INTO orders (id, order_number, source, customer_id, status, payment_status, payment_method, currency, subtotal, discount_amount, tax_amount, shipping_amount, total, shipping_address, placed_at, confirmed_at, shipped_at, created_at) VALUES
    ('o1000000-0000-0000-0000-000000000002', 'ADR-20260713-00001', 'store', 'cu100000-0000-0000-0000-000000000002', 'shipped', 'paid', 'mercadopago', 'PEN', 169.80, 0, 0, 10, 179.80, '{"street":"Jr. Huancavelica 456","district":"Cercado","city":"Lima","reference":"Casa blanca 2 pisos"}', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '4 days');

INSERT INTO order_items (order_id, variant_id, product_name, variant_name, sku, quantity, unit_price, discount_percent, discount_amount, total) VALUES
    ('o1000000-0000-0000-0000-000000000002', 'v1000000-0000-0000-0000-000000000004', 'Cuna Portátil Plegable', 'Gris', 'ADK-MUE-003-V1', 1, 189.90, 0, 0, 189.90);

INSERT INTO order_status_history (order_id, to_status, changed_by_type) VALUES
    ('o1000000-0000-0000-0000-000000000002', 'confirmed', 'user'),
    ('o1000000-0000-0000-0000-000000000002', 'shipped', 'user');

-- Pedido 3: Pendiente de pago
INSERT INTO orders (id, order_number, source, customer_id, status, payment_status, currency, subtotal, discount_amount, tax_amount, shipping_amount, total, shipping_address, notes, placed_at, created_at) VALUES
    ('o1000000-0000-0000-0000-000000000003', 'ADR-20260714-00002', 'store', 'cu100000-0000-0000-0000-000000000003', 'pending', 'pending', 'PEN', 539.70, 0, 0, 0, 539.70, '{"street":"Av. Industrial 789","district":"Ate","city":"Lima","reference":"Local esquinero"}', 'Pedido corporativo — facturar con RUC', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour');

INSERT INTO order_items (order_id, variant_id, product_name, variant_name, sku, quantity, unit_price, discount_percent, discount_amount, total) VALUES
    ('o1000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000001', 'Cuna Convertible Premium 3 en 1', 'Blanco Clásico', 'ADK-MUE-001-V1', 1, 459.90, 0, 0, 459.90),
    ('o1000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000009', 'Set Montessori Torre de Anillos', 'Multicolor', 'ADK-JUG-001-V1', 1, 49.90, 0, 0, 49.90),
    ('o1000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000006', 'Kit Bienvenida Bebé (12 piezas)', 'Rosa', 'ADK-ACC-001-V1', 1, 29.90, 0, 0, 29.90);

INSERT INTO order_status_history (order_id, to_status, changed_by_type) VALUES
    ('o1000000-0000-0000-0000-000000000003', 'pending', 'system');

-- ============================================================
-- 4.14 ENVÍO DE EJEMPLO
-- ============================================================

INSERT INTO shipments (id, shipment_number, order_id, warehouse_id, carrier, tracking_number, status, shipping_address, weight, cost, estimated_delivery, created_at) VALUES
    ('sh100000-0000-0000-0000-000000000001', 'ENV-20260713-00001', 'o1000000-0000-0000-0000-000000000002', 'w1000000-0000-0000-0000-000000000001', 'Shalom', 'SHM-2026-78945', 'in_transit', '{"street":"Jr. Huancavelica 456","district":"Cercado","city":"Lima"}', 9.50, 15.00, NOW() + INTERVAL '3 days', NOW() - INTERVAL '1 day');

INSERT INTO shipment_events (shipment_id, status, location, description, event_time) VALUES
    ('sh100000-0000-0000-0000-000000000001', 'label_created',  'Lima - Centro de Distribución', 'Guía de envío generada',     NOW() - INTERVAL '1 day'),
    ('sh100000-0000-0000-0000-000000000001', 'picked_up',      'Lima - Almacén ADRISU KIDS',   'Recolectado por Shalom',     NOW() - INTERVAL '20 hours'),
    ('sh100000-0000-0000-0000-000000000001', 'in_transit',     'Lima - En tránsito',            'Paquete en ruta de entrega', NOW() - INTERVAL '4 hours');

-- ============================================================
-- 4.15 FACTURA DE EJEMPLO
-- ============================================================

INSERT INTO invoices (id, invoice_number, order_id, customer_id, status, currency, subtotal, tax_amount, total, amount_paid, due_date, paid_at, created_at) VALUES
    ('f1000000-0000-0000-0000-000000000001', 'FAC-20260713-00001', 'o1000000-0000-0000-0000-000000000002', 'cu100000-0000-0000-0000-000000000002', 'paid', 'PEN', 152.37, 27.43, 179.80, 179.80, NOW() + INTERVAL '30 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days');

INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total) VALUES
    ('f1000000-0000-0000-0000-000000000001', 'Cuna Portátil Plegable - Gris (ADK-MUE-003-V1)', 1, 189.90, 189.90);

-- ============================================================
-- 4.16 PRODUCTOS SUGERIDOS (UPSELL EN CHECKOUT)
-- ============================================================

INSERT INTO suggested_products (product_id, name, description, price, compare_at_price, discount_percent, type, linked_product_id, sort_order, is_active) VALUES
    ('p1000000-0000-0000-0000-000000000001', 'Cambiador con Cajones',  'Complementa tu cuna con un cambiador a juego',  289.90, 329.90, 0,  'existing', 'p1000000-0000-0000-0000-000000000002', 1, TRUE),
    ('p1000000-0000-0000-0000-000000000004', 'Kit Bienvenida Bebé',    'Regalo perfecto para la bienvenida del bebé',   79.90,  99.90,  10, 'existing', NULL, 2, TRUE),
    ('p1000000-0000-0000-0000-000000000005', 'Torre de Anillos Montessori', 'Juguete educativo que estimula el desarrollo', 49.90, 59.90, 0, 'existing', NULL, 3, TRUE);

-- ============================================================
-- 4.17 NOTIFICACIONES INICIALES
-- ============================================================

INSERT INTO notification_queue (recipient_id, recipient_email, subject, body, channel, type, is_read, status) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'admin@adriskids.com',   'Bienvenido al Sistema',          'Su cuenta ha sido creada exitosamente. Bienvenido al panel de administración de ADRISU KIDS.', 'email', 'info', TRUE, 'sent'),
    ('a1000000-0000-0000-0000-000000000001', 'admin@adriskids.com',   'Nuevo Pedido ADR-20260714-00001','Se ha registrado un nuevo pedido por S/ 459.90 de María García López.', 'telegram', 'order', FALSE, 'sent'),
    ('a1000000-0000-0000-0000-000000000001', 'admin@adriskids.com',   'Alerta: Stock Bajo',             'La variante "Set Montessori Torre de Anillos - Multicolor" tiene stock bajo (8 unidades restantes).', 'telegram', 'stock', FALSE, 'sent');

-- ============================================================
-- 4.18 REGISTROS DE AUDITORÍA INICIALES
-- ============================================================

INSERT INTO audit_trail (table_name, record_id, action, new_values, changed_fields, performed_by, performed_by_type, ip_address, created_at) VALUES
    ('users',       'a1000000-0000-0000-0000-000000000001', 'create', '{"email":"admin@adriskids.com","role":"super_admin"}', ARRAY['email','role'], NULL, 'system', '127.0.0.1', NOW() - INTERVAL '30 days'),
    ('products',    'p1000000-0000-0000-0000-000000000001', 'create', '{"sku":"ADK-MUE-001","name":"Cuna Convertible Premium 3 en 1"}', ARRAY['sku','name'], 'a1000000-0000-0000-0000-000000000001', 'user', '192.168.1.100', NOW() - INTERVAL '25 days'),
    ('orders',      'o1000000-0000-0000-0000-000000000001', 'create', '{"order_number":"ADR-20260714-00001","total":459.90}', ARRAY['order_number','total'], NULL, 'system', '0.0.0.0', NOW() - INTERVAL '2 days'),
    ('orders',      'o1000000-0000-0000-0000-000000000002', 'update', '{"status":"shipped"}', ARRAY['status'], 'a1000000-0000-0000-0000-000000000004', 'user', '192.168.1.105', NOW() - INTERVAL '1 day');
```

---

## 5. Resumen de la Base de Datos

| Dominio | Tablas | Registros iniciales |
|---------|--------|-------------------|
| **IAM** (Identidad y Acceso) | `users`, `sessions` | 5 usuarios con roles definidos |
| **Catálogo** | `categories`, `products`, `product_variants` | 8 categorías, 5 productos, 9 variantes |
| **Inventario / WMS** | `inventory`, `warehouses`, `warehouse_locations` | 3 almacenes, 4 ubicaciones, 9 registros de stock |
| **Listas de Precio** | `price_lists`, `price_list_items` | 3 listas de precios (General, Mayorista, VIP) |
| **Ventas / CRM** | `customers`, `orders`, `order_items`, `order_status_history`, `payments`, `reviews`, `cart`, `cart_items`, `wishlists` | 4 clientes, 3 pedidos de ejemplo, 1 pago |
| **Facturación** | `invoices`, `invoice_items` | 1 factura de ejemplo |
| **Compras / Proveedores** | `suppliers`, `purchase_orders`, `purchase_order_items`, `goods_receipts`, `goods_receipt_items` | 3 proveedores |
| **Logística** | `shipments`, `shipment_events` | 1 envío con 3 eventos de seguimiento |
| **Auditoría / Notificaciones** | `audit_trail`, `notification_queue`, `sync_events` | 4 registros de auditoría, 3 notificaciones |
| **Tienda Virtual** | `settings`, `offers`, `suggested_products`, `abandoned_checkouts`, `newsletter_subscribers`, `tax_configs` | 18 configuraciones, 3 ofertas, 3 productos sugeridos, 3 impuestos |
| **TOTAL** | **42 tablas** | **~80+ registros iniciales** |

---

> **Nota:** Este script es la fuente de verdad del modelo de datos. Todas las relaciones, restricciones de integridad referencial y constraintes únicos están definidos directamente en PostgreSQL para garantizar la consistencia de los datos en todo el ciclo de vida del sistema.
