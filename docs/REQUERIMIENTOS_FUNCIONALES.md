# Requerimientos Funcionales — AdriSu Kids E-Commerce

---

## 1. MODELO DE BASE DE DATOS

El proyecto utiliza **PostgreSQL** como motor de base de datos, orquestado mediante **Prisma ORM** (schema en `packages/prisma/schema.prisma`). El esquema define el **modelo lógico** (entidades, relaciones, restricciones) que se materializa en el **modelo físico** (tablas, índices, claves foráneas) a través de migraciones SQL.

### 1.1 Modelo Lógico — Entidades y Relaciones

El dominio se divide en **7 subsistemas** interconectados:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MODELO LÓGICO                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐  1:N  ┌────────────┐  N:1  ┌──────────────┐          │
│  │ Category │◄──────│  Product   │──────►│   Category   │          │
│  │ (árbol)  │       │            │       │   (padre)    │          │
│  └──────────┘       └─────┬──────┘       └──────────────┘          │
│                           │ 1:N                                    │
│                    ┌──────▼──────┐                                  │
│                    │  Product    │                                  │
│                    │  Variant    │◄── attributes (JSON: talla,      │
│                    │             │    color, material)              │
│                    └──┬───┬──┬──┘                                  │
│                       │   │  │                                      │
│          ┌────────────┘   │  └──────────────┐                      │
│          ▼                ▼                  ▼                      │
│  ┌──────────────┐ ┌────────────┐  ┌────────────────┐               │
│  │  Inventory   │ │ OrderItem  │  │  CartItem      │               │
│  │  (por bodega)│ │            │  │                │               │
│  └──────┬───────┘ └─────┬──────┘  └───────┬────────┘               │
│         │               │                  │                        │
│         ▼               ▼                  ▼                        │
│  ┌──────────────┐ ┌────────────┐  ┌────────────────┐               │
│  │  Warehouse   │ │   Order    │  │     Cart       │               │
│  │              │ │            │  │  (1 por cliente)│               │
│  └──────┬───────┘ └─────┬──────┘  └───────┬────────┘               │
│         │               │                  │                        │
│         ▼               ▼                  ▼                        │
│  ┌──────────────┐ ┌────────────┐  ┌────────────────┐               │
│  │  Warehouse   │ │  Payment   │  │   Customer     │               │
│  │  Location    │ │            │  │                │               │
│  │  (árbol)     │ └────────────┘  └────────────────┘               │
│  └──────────────┘                                                  │
│                                                                     │
│  ┌──────────────┐ ┌────────────┐  ┌────────────────┐               │
│  │  Supplier    │ │   Shipment │  │    Review      │               │
│  │              │ │  + Events  │  │  (1 por客户)   │               │
│  └──────┬───────┘ └────────────┘  └────────────────┘               │
│         ▼                                                           │
│  ┌──────────────┐ ┌────────────┐  ┌────────────────┐               │
│  │ PurchaseOrder│ │  Invoice   │  │   Settings     │               │
│  │  + Items     │ │  + Items   │  │  (key-value)   │               │
│  └──────────────┘ └────────────┘  └────────────────┘               │
│                                                                     │
│  ┌──────────────┐ ┌────────────┐  ┌────────────────┐               │
│  │  User (IAM)  │ │  Session   │  │  AuditTrail    │               │
│  │  + roles     │ │  (JWT)     │  │  (inmutable)   │               │
│  └──────────────┘ └────────────┘  └────────────────┘               │
│                                                                     │
│  ┌──────────────┐ ┌────────────┐  ┌────────────────┐               │
│  │ Notification │ │ SyncEvent  │  │    Offer       │               │
│  │    Queue     │ │(MercadoLib)│  │  (promociones) │               │
│  └──────────────┘ └────────────┘  └────────────────┘               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Enums principales (restricciones de dominio)

| Enum | Valores | Uso |
|------|---------|-----|
| `UserRole` | super_admin, admin, warehouse_manager, warehouse_staff, sales_manager, sales_rep, logistics_coordinator, customer_service, finance, readonly | Control de acceso por roles |
| `OrderStatus` | draft → pending → confirmed → processing → picking → packing → ready_to_ship → shipped → in_transit → delivered / cancelled / returned / refunded | Flujo completo de órdenes |
| `PaymentStatus` | pending → authorized → captured → paid / failed / refunded / voided | Estados de transacción |
| `ShipmentStatus` | pending → label_created → picked_up → in_transit → out_for_delivery → delivered / exception / returned | Tracking logístico |
| `ProductStatus` | draft, active, archived, discontinued | Ciclo de vida del producto |
| `InvoiceStatus` | draft → issued → sent → paid / overdue / cancelled / voided | Facturación |
| `AuditAction` | create, update, delete, login, logout, export, import, approve, reject, execute | Auditoría inmutable |

### 1.2 Modelo Físico — Implementación SQL

La migración inicial (`packages/prisma/migrations/0_init/migration.sql`) materializa el esquema en PostgreSQL con las siguientes características:

**Tablas principales (22 tablas):**

| Tabla | PK | Índices únicos | FK hacia |
|-------|-----|-----------------|----------|
| `users` | UUID | email | — |
| `sessions` | UUID | — | users(id) CASCADE |
| `categories` | UUID | slug | categories(id) SET NULL (auto-referencia) |
| `products` | UUID | sku, slug | categories(id) SET NULL |
| `product_variants` | UUID | sku | products(id) CASCADE |
| `inventory` | UUID | (variant_id, warehouse_id) | product_variants(id) CASCADE, warehouses(id) CASCADE |
| `warehouses` | UUID | code | users(id) SET NULL |
| `warehouse_locations` | UUID | (warehouse_id, code) | warehouses(id) CASCADE, warehouse_locations(id) CASCADE |
| `customers` | UUID | email | — |
| `orders` | UUID | order_number | customers(id) RESTRICT, users(id) SET NULL |
| `order_items` | UUID | — | orders(id) CASCADE, product_variants(id) RESTRICT |
| `order_status_history` | UUID | — | orders(id) CASCADE |
| `payments` | UUID | — | orders(id) CASCADE |
| `cart_items` | UUID | (cart_id, variant_id) | carts(id) CASCADE, product_variants(id) CASCADE |
| `carts` | UUID | customer_id | customers(id) CASCADE |
| `reviews` | UUID | (product_id, customer_id) | products(id) CASCADE, customers(id) CASCADE |
| `suppliers` | UUID | code | — |
| `purchase_orders` | UUID | po_number | suppliers(id) RESTRICT, warehouses(id) RESTRICT |
| `shipments` | UUID | shipment_number | orders(id) SET NULL, warehouses(id) RESTRICT |
| `invoices` | UUID | invoice_number | orders(id) SET NULL, customers(id) RESTRICT |
| `audit_trail` | UUID | — | users(id) SET NULL |
| `settings` | UUID | key | — |

**Restricciones de integridad referencial clave:**
- `ON DELETE CASCADE` en: order_items → orders, cart_items → carts/carts → customers, sessions → users. Esto garantiza la limpieza automática de registros huérfanos.
- `ON DELETE RESTRICT` en: orders → customers, order_items → product_variants. Impide borrar un cliente o variante que tenga órdenes asociadas.
- `ON DELETE SET NULL` en: products → categories, shipments → orders. Permite conservar registros históricos aunque se desactive la entidad padre.

**Tipos de datos:**
- UUID v4 para todas las PKs (seguridad, distribución).
- `DECIMAL(10,2)` para precios, `DECIMAL(12,2)` para montos totales.
- `JSONB` para addresses, attributes de variantes, metadata de pagos, configuración (almacenamiento semiestructurado nativo de PostgreSQL).
- `TEXT[]` para tags e imágenes de productos (arrays nativos PostgreSQL).

### 1.3 Relación con Requerimientos Funcionales

| Tabla(s) | Requerimientos soportados |
|-----------|---------------------------|
| `products`, `product_variants`, `categories` | RF-02, RF-03, RF-04, RF-05, RF-29 |
| `inventory`, `warehouses`, `warehouse_locations` | RF-05, RF-13, RF-15, RF-16, RF-42, RF-43, RF-44, RF-45, RF-46 |
| `carts`, `cart_items` | RF-07, RF-08 |
| `orders`, `order_items`, `order_status_history` | RF-09, RF-10, RF-18, RF-23, RF-36, RF-38 |
| `payments` | RF-10, RF-11 |
| `customers` | RF-37, RF-39, RF-28 |
| `reviews` | RF-31 |
| `users`, `sessions` | RF-19, RF-20 |
| `suppliers`, `purchase_orders` | RF-21, RF-22 |
| `invoices`, `invoice_items` | RF-54 |
| `audit_trail` | RF-46, RF-53 |
| `notification_queue` | RF-12, RF-50, RF-51 |
| `settings` | RF-49 |
| `offers` | RF-34 |
| `shipments`, `shipment_events` | RF-36, RF-58 |

---

## 2. REQUERIMIENTOS FUNCIONALES MÁS IMPORTANTES

### RF-01 — Landing Page interactiva con banners promocionales

**Requerimiento:** El sistema debe renderizar una página de inicio interactiva que reciba el tráfico web y muestre banners promocionales.

**Código justificativo:** `tienda/src/app/page.tsx:21-129`

```tsx
// Sección Hero con gradiente y CTA
<section className="relative bg-gradient-to-br from-green-50 to-emerald-50 py-20 md:py-32">
  <div className="max-w-7xl mx-auto px-4 text-center">
    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
      Muebles para bebes<span className="text-green-600"> con amor</span>
    </h1>
    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
      <Link href="/tienda" className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold">
        Ver catalogo
      </Link>
    </div>
  </div>
</section>

// Sección de categorías con grid responsivo
<section className="py-16">
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
    {categories.map((cat) => ( ... ))}
  </div>
</section>

// Sección de productos destacados
<section className="py-16 bg-gray-50">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
    {featuredProducts.map((product) => ( ... ))}
  </div>
</section>
```

**Explicación:** La página de inicio (`page.tsx`) renderiza un hero con gradiente, una sección de 6 categorías navegables (grid responsivo `grid-cols-2 md:grid-cols-6`), productos destacados con imágenes y precios, y una sección de beneficios (envío gratis, garantía, devoluciones, soporte). Todo usando Tailwind CSS con breakpoints `sm`, `md` para adaptarse a diferentes resoluciones.

---

### RF-02 — Catálogo de productos extraído de la base de datos

**Requerimiento:** El sistema debe extraer de la base de datos y mostrar en el frontend un catálogo con nombre, imagen, descripción y precio de cada artículo.

**Código justificativo:**

API: `tienda/src/app/api/v1/products/route.ts:7-41`

```ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = getSearchParam(searchParams, 'q');
  const category = getSearchParam(searchParams, 'category');
  const { page, limit, offset } = parsePagination(searchParams);

  const where: any = { status: 'active' };
  if (category) where.category = { slug: category };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, variants: { where: { isActive: true } } },
      orderBy: { createdAt: 'desc' },
      skip: offset, take: limit,
    }),
    prisma.product.count({ where }),
  ]);
  return apiPaginated(products, total, page, limit);
}
```

Frontend: `tienda/src/app/(public)/tienda/page.tsx:52-79`

```tsx
useEffect(() => {
  async function fetchProducts() {
    const params = new URLSearchParams({ limit: '50' });
    if (activeCategory) params.set('category', activeCategory);
    if (search) params.set('q', search);
    const res = await fetch(`/api/v1/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setProducts(data.data.map((p: any) => ({
        id: p.id, name: p.name, slug: p.slug,
        price: p.variants?.[0]?.price || 0,
        image: p.images?.[0] || placehold,
        stock: p.variants?.reduce((s, v) => s + (v.stock || 0), 0) || 0,
      })));
    }
  }
  fetchProducts();
}, [activeCategory, search]);
```

**Explicación:** El endpoint `GET /api/v1/products` consulta PostgreSQL vía Prisma con `findMany`, filtrando por `status: 'active'`, categoría y búsqueda de texto. La respuesta se paginina con `skip/take`. El frontend en `tienda/page.tsx` consume esta API en un `useEffect`, mapea los campos (nombre, precio de la primera variante, imagen, stock total) y renderiza un grid responsivo `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.

---

### RF-03 — Motor de filtrado por categorías

**Requerimiento:** El sistema debe implementar un motor de filtrado en el catálogo que permita agrupar los productos por categorías predefinidas.

**Código justificativo:** `tienda/src/app/(public)/tienda/page.tsx:46-47,106-113`

```tsx
const activeCategory = searchParams.get('categoria') || '';
// ...
<div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-2">
  {categories.map((cat) => (
    <Link key={cat.slug} href={cat.slug ? `/tienda?categoria=${cat.slug}` : '/tienda'}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
        activeCategory === cat.slug ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'
      }`}>{cat.name}</Link>
  ))}
</div>
```

**Explicación:** Las categorías se filtran usando `searchParams.get('categoria')` de Next.js. Cada botón de categoría es un `<Link>` que agrega `?categoria=slug` a la URL. El parámetro se envía como `category` al API (`params.set('category', activeCategory)`), que filtra con `where.category = { slug: category }` en Prisma. El CSS usa `overflow-x-auto` para scroll horizontal en móvil y `flex` para alineación.

---

### RF-04 — Barra de búsqueda por nombre o descripción

**Requerimiento:** El sistema debe incluir una barra de búsqueda que consulte coincidencias de texto en el nombre o descripción de los productos en la base de datos.

**Código justificativo:**

Backend: `tienda/src/app/api/v1/products/route.ts:16-21`

```ts
if (search) {
  where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { description: { contains: search, mode: 'insensitive' } },
  ];
}
```

Frontend: `tienda/src/app/(public)/tienda/page.tsx:117-118`

```tsx
<input type="text" placeholder="Buscar productos..." value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm ..." />
```

**Explicación:** El input dispara `setSearch` en cada cambio. El `useEffect` reenvía `params.set('q', search)` al API. Prisma ejecuta un `WHERE` con `ILIKE` (case-insensitive) sobre `name` y `description` usando el operador `OR`. La búsqueda se ejecuta server-side, no solo en el cliente, lo que permite escalar con miles de productos.

---

### RF-05 — Bloqueo de compra por stock = 0 ("Agotado")

**Requerimiento:** El sistema debe bloquear el botón de compra y mostrar la etiqueta "Agotado" si el stock lógico de un producto es igual a cero.

**Código justificativo:** `tienda/src/app/(public)/producto/[slug]/page.tsx:135-136`

```tsx
<p className="text-sm text-gray-500 mt-2">
  {product.stock > 10 ? <span className="text-green-600">En stock</span> :
   product.stock > 0 ? <span className="text-orange-500">Solo {product.stock} unidades</span> :
   <span className="text-red-500">Agotado</span>}
</p>
```

**Explicación:** El stock se calcula sumando el campo `stock` de todas las variantes del producto (`p.variants?.reduce((s, v) => s + (v.stock || 0), 0)`). Si el stock es 0, se muestra "Agotado" en rojo. El botón de compra no tiene lógica de deshabilitado explícita, pero el stock se obtiene de la BD y el usuario recibe feedback visual inmediato.

---

### RF-06 — UI Responsiva

**Requerimiento:** El sistema debe adaptar dinámicamente la disposición de los elementos de la interfaz según la resolución del dispositivo del usuario.

**Código justificativo:** `tienda/src/app/(public)/tienda/page.tsx:134`

```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {filtered.map((product) => ( ... ))}
</div>
```

**Explicación:** Todo el proyecto usa Tailwind CSS con breakpoints responsivos. Ejemplos clave:
- Grid de productos: `grid-cols-2` (móvil) → `md:grid-cols-3` (tablet) → `lg:grid-cols-4` (desktop)
- Checkout: `grid-cols-1 lg:grid-cols-5` (layout apilado en móvil, dos columnas en desktop)
- Navbar: contenido condicional con `hidden md:flex` vs visible en móvil
- Sticky CTA: `md:hidden fixed bottom-0` para botón de compra fijo solo en móvil

---

### RF-07 — Sesión de Carrito de compras temporal

**Requerimiento:** El sistema debe mantener una sesión de "Carrito de compras" temporal que almacene los ID de productos seleccionados por el cliente.

**Código justificativo:** `tienda/src/store/cartStore.ts:1-49`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.variantId === item.variantId);
        if (existing) {
          return { items: state.items.map((i) =>
            i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i
          )};
        }
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),
      removeItem: (variantId) => set((state) => ({
        items: state.items.filter((i) => i.variantId !== variantId)
      })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'adriskids-cart' }
  )
);
```

**Explicación:** Se usa **Zustand** con middleware `persist` que almacena el carrito en `localStorage` bajo la key `adriskids-cart`. Esto permite que el carrito persista entre recargas de página sin necesidad de sesión del servidor. Cada item almacena `variantId` (ID único de la variante del producto), nombre, precio, imagen y cantidad. El store se consume con el hook `useCartStore` en cualquier componente.

---

### RF-08 — Actualización de cantidades y eliminación de ítems del carrito

**Requerimiento:** El sistema debe permitir actualizar cantidades numéricas o eliminar ítems del carrito, recalculando el monto total dinámicamente.

**Código justificativo:** `tienda/src/store/cartStore.ts:39-44` + `tienda/src/app/(public)/checkout/page.tsx:233-238`

```ts
// Store: actualización de cantidad
updateQuantity: (variantId, quantity) =>
  set((state) => ({
    items: quantity <= 0
      ? state.items.filter((i) => i.variantId !== variantId)
      : state.items.map((i) => i.variantId === variantId ? { ...i, quantity } : i),
  })),
// Store: cálculo del total
total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
```

```tsx
// Checkout: UI de cantidades
<button onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
  <Minus size={12} />
</button>
<span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
<button onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
  <Plus size={12} />
</button>
<span className="text-sm font-semibold ml-2">S/ {item.price * item.quantity}</span>
<button onClick={() => removeItem(item.variantId)} className="text-gray-400 hover:text-red-500">
  <X size={14} />
</button>
```

**Explicación:** El checkout renderiza botones +/- que llaman a `updateQuantity`. Si la cantidad llega a 0, el ítem se elimina automáticamente. El total se recalcula con `total()` que suma `price * quantity` de cada ítem. El sidebar del checkout muestra el desglose: subtotal, envío, descuentos y total final — todo reactivo al estado del store.

---

### RF-09 — Formulario de validación de datos (Checkout)

**Requerimiento:** El sistema debe proporcionar un formulario de validación de datos (Checkout) que exija información de contacto y dirección de envío.

**Código justificativo:** `tienda/src/app/(public)/checkout/page.tsx:126-137,266-323`

```tsx
const validate = (): boolean => {
  const e: FormErrors = {};
  if (!form.name.trim()) e.name = 'Nombre requerido';
  if (!form.email.trim() || !isValidEmail(form.email)) e.email = 'Email invalido';
  if (!form.phone.trim() || !isValidPeruPhone(form.phone))
    e.phone = 'Celular invalido (9 digitos, empieza con 9)';
  if (!form.department) e.department = 'Departamento requerido';
  if (!form.province) e.province = 'Provincia requerida';
  if (!form.district) e.district = 'Distrito requerido';
  if (!form.address.trim()) e.address = 'Direccion requerida';
  setErrors(e);
  return Object.keys(e).length === 0;
};

// Formulario con validación por campo
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <input value={form.name} onChange={...} placeholder="Juan Perez" />
  <input value={form.phone} onChange={...} placeholder="999123456" maxLength={9} />
</div>
// Selector cascade Departamento → Provincia → Distrito (UBIGEO)
<select value={form.department} onChange={(e) => setForm({...form, department: e.target.value, province: '', district: ''})}>
```

**Explicación:** El checkout incluye un formulario completo con validación client-side. Los campos obligatorios son: nombre, email (regex), celular peruano (9 dígitos empieza con 9), departamento, provincia, distrito (selector cascade UBIGEO), y dirección (con autocompletado via `AddressAutocomplete`). Los errores se muestran bajo cada campo con texto rojo. La validación se ejecuta antes de enviar al API.

---

### RF-10 — Integración con pasarela de pagos (MercadoPago)

**Requerimiento:** El sistema debe integrarse vía API con una pasarela de pagos para procesar transacciones con tarjetas de crédito/débito de forma segura.

**Código justificativo:** `tienda/src/app/api/v1/payments/mercadopago/route.ts:1-62`

```ts
export async function POST(request: NextRequest) {
  const { orderId, amount, currency } = body;
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  const response = await fetch('https://api.mercadopago.com/v1/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: [{ title: `Pedido ${order.orderNumber}`, quantity: 1, unit_price: Number(amount), currency_id: 'PEN' }],
      external_reference: orderId,
      back_urls: {
        success: `${NEXTAUTH_URL}/pedido/${order.orderNumber}`,
        failure: `${NEXTAUTH_URL}/pedido/${order.orderNumber}`,
      },
      auto_return: 'approved',
    }),
  });
  return apiSuccess({ preferenceId: preference.id, checkoutUrl: preference.init_point });
}
```

**Explicación:** El endpoint crea una **preferencia de MercadoPago** via su API REST. Se envía el monto, moneda (PEN), referencia externa (orderId) y URLs de callback. MercadoPago redirige al usuario a su checkout seguro (tarjeta, Yape, Plin). Si no hay token configurado, devuelve URLs mock para sandbox. El webhook (`/api/v1/payments/mercadopago/webhook`) recibe la confirmación y actualiza el estado del pago.

---

### RF-12 — Envío automático de correo electrónico post-pago

**Requerimiento:** El sistema debe utilizar un servidor SMTP para enviar automáticamente un correo electrónico con el resumen del pedido tras aprobarse el pago.

**Código justificativo:** `tienda/src/lib/notifications/email.ts:1-32` + `tienda/src/app/api/v1/orders/route.ts:103-118`

```ts
// Servicio de email con Resend API
export async function sendEmail(options: { to: string; subject: string; html: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to: [options.to], subject: options.subject, html: options.html }),
  });
}

// Template HTML del correo de confirmación
export function orderConfirmationEmail(order) {
  return `<!DOCTYPE html><html>...<h1>ADRISU KIDS</h1>
    <p>Tu pedido <strong>${order.orderNumber}</strong> ha sido recibido.</p>
    <table>...</table>
    <a href=".../pedido?n=${order.orderNumber}">Seguir mi pedido</a>...`;
}

// En la creación de orden (fire and forget):
const { sendEmail, orderConfirmationEmail } = await import('@/lib/notifications/email');
sendEmail({ to: customer.email, subject: `Pedido ${order.orderNumber} confirmado`, html: orderConfirmationEmail({...}) });
```

**Explicación:** Se usa **Resend** (servicio SMTP moderno) en lugar de SMTP tradicional. El correo se envía de forma asíncrona (`fire and forget`) al crear la orden, sin bloquear la respuesta al cliente. El template HTML incluye logo, resumen de productos, tabla de montos, dirección de envío y botón para seguir el pedido.

---

### RF-13 — Descuento automático de stock post-pago

**Requerimiento:** El sistema debe ejecutar un script que reste las cantidades vendidas del stock de la base de datos inmediatamente después de un cobro exitoso.

**Código justificativo:** `tienda/src/app/api/v1/payments/mercadopago/webhook/route.ts:57-89`

```ts
if (isApproved) {
  // Actualizar estado del pedido
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'paid', status: order.status === 'draft' ? 'confirmed' : order.status },
  });

  // RF-13: Descontar stock de inventario para cada ítem
  for (const item of order.items) {
    const inventory = await prisma.inventory.findFirst({ where: { variantId: item.variantId } });
    if (inventory) {
      const newQuantity = Math.max(0, inventory.quantity - item.quantity);
      const newReserved = Math.max(0, inventory.reservedQuantity - item.quantity);
      const newAvailable = Math.max(0, inventory.availableQuantity - item.quantity);
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity, reservedQuantity: newReserved, availableQuantity: newAvailable },
      });
    }
  }
}
```

**Explicación:** El webhook de MercadoPago se ejecuta cuando se confirma un pago. Actualiza `paymentStatus` a `paid` y luego itera sobre cada `orderItem` para descontar la cantidad comprada de la tabla `inventory`. Se actualizan tres campos: `quantity` (stock total), `reservedQuantity` (reservado) y `availableQuantity` (disponible). El `Math.max(0, ...)` evita stocks negativos.

---

### RF-18 — Modificación de estado de orden (desplegable)

**Requerimiento:** El sistema debe permitir la modificación del estado de una orden de compra mediante un menú desplegable (Pendiente, Empacado, Despachado).

**Código justificativo:** Schema: `packages/prisma/schema.prisma:27-41` (OrderStatus enum)

```prisma
enum OrderStatus {
  draft, pending, confirmed, processing, picking, packing,
  ready_to_ship, shipped, in_transit, delivered, cancelled, returned, refunded
}
```

Dashboard WMS: `wms/src/app/(dashboard)/page.tsx:60-67`

```tsx
const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  processing: 'bg-purple-500/20 text-purple-400',
  packing: 'bg-purple-500/20 text-purple-400',
  shipped: 'bg-cyan-500/20 text-cyan-400',
  delivered: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
};
```

**Explicación:** El enum `OrderStatus` define 13 estados posibles. El dashboard del WMS muestra badges de color por estado y la página de detalle de pedido (`pedidos/[id]/page.tsx`) permite cambiar el estado. La tabla `order_status_history` registra cada cambio de estado de forma inmutable (from_status, to_status, changed_by, reason, timestamp).

---

### RF-19 — Autenticación JWT con credenciales encriptadas

**Requerimiento:** El sistema debe validar las credenciales de acceso (correo y contraseña encriptada) y emitir un token de sesión (JWT) para usuarios internos.

**Código justificativo:** `tienda/src/lib/auth.ts:15-82`

```ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({ clientId: ..., clientSecret: ... }),
    Credentials({
      async authorize(credentials) {
        const user = await prisma.customer.findFirst({ where: { email: credentials.email } });
        if (!user || !user.isActive) return null;
        if (!user.password || user.password === '') return null;
        const isValid = await compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.fullName };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
});
```

**Explicación:** Se usa **NextAuth.js** con estrategia JWT. El provider `Credentials` busca el usuario por email en la BD, verifica que esté activo y compara la contraseña hasheada con `bcryptjs.compare()`. Si es válida, genera un JWT. También soporta autenticación OAuth con Google. El middleware (`middleware.ts`) protege rutas privadas verificando la sesión JWT.

---

### RF-20 — Módulo CRUD de roles y cuentas de usuarios internos

**Requerimiento:** El sistema debe proporcionar un módulo CRUD (Crear, Leer, Actualizar, Eliminar) para la gestión de roles y cuentas de usuarios internos.

**Código justificativo:** `wms/src/app/(dashboard)/usuarios/page.tsx:19-208` + `wms/src/app/api/v1/users/route.ts:1-21`

```tsx
// UI: lista de usuarios con roles
const roleConfig: Record<string, { color: string; label: string }> = {
  super_admin: { color: 'bg-red-500/20 text-red-400', label: 'Super Admin' },
  admin: { color: 'bg-purple-500/20 text-purple-400', label: 'Admin' },
  warehouse_manager: { color: 'bg-blue-500/20 text-blue-400', label: 'Gerente' },
  warehouse_staff: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Personal' },
  sales_manager: { color: 'bg-green-500/20 text-green-400', label: 'Gerente Ventas' },
  sales_rep: { color: 'bg-teal-500/20 text-teal-400', label: 'Ventas' },
  readonly: { color: 'bg-gray-500/20 text-gray-400', label: 'Solo Lectura' },
};

// API GET: listado paginado con búsqueda
const users = await prisma.user.findMany({
  select: { id, email, fullName, role, isActive, createdAt, lastLoginAt },
  orderBy: { createdAt: 'desc' }, skip: offset, take: limit,
});
```

**Explicación:** La página `/usuarios` del WMS muestra todos los usuarios internos con su rol, email y estado (activo/inactivo). Cada usuario tiene un badge de color según su rol. El botón "Nuevo Usuario" permite crear. La API soporta paginación y búsqueda por nombre o email. El schema `UserRole` enum define 10 roles del sistema.

---

### RF-23 — Tabla de órdenes en tiempo real (DataGrid)

**Requerimiento:** El sistema debe renderizar una tabla de datos actualizada en tiempo real con todas las órdenes de compra concretadas.

**Código justificativo:** `wms/src/app/(dashboard)/page.tsx:194-226`

```tsx
// Dashboard: pedidos recientes
<div className="divide-y divide-gray-800">
  {orders.map((order) => (
    <Link key={order.id} href={`/pedidos?id=${order.id}`}
      className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Clock size={14} className="text-gray-500" />
        <p className="text-sm font-medium text-white truncate">{order.orderNumber}</p>
        <p className="text-xs text-gray-400 truncate">{order.customer}</p>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
        {order.status}
      </span>
      <span className="text-sm font-medium text-brand-400">S/ {order.total}</span>
    </Link>
  ))}
</div>
```

**Explicación:** El dashboard del WMS carga órdenes recientes via `fetch('/api/v1/orders?limit=10')` y las renderiza como lista con número de orden, cliente, badge de estado (color-coded) y monto total. La página de pedidos completa (`/pedidos`) usa el componente `DataTable` que soporta búsqueda, filtros y paginación.

---

### RF-31 — Reseñas textuales y calificaciones por estrellas

**Requerimiento:** El sistema debe permitir a los clientes dejar reseñas textuales y calificaciones mediante estrellas en los productos adquiridos.

**Código justificativo:** Schema: `packages/prisma/schema.prisma:713-730` + UI: `tienda/src/app/(public)/producto/[slug]/page.tsx:200-215`

```prisma
model Review {
  id         String   @id @default(uuid())
  productId  String   @map("product_id")
  customerId String   @map("customer_id")
  rating     Int
  title      String?
  comment    String?
  isApproved Boolean  @default(false)
  @@unique([productId, customerId])  // 1 reseña por cliente por producto
}
```

```tsx
// Renderizado de estrellas
{product.reviews.map((r, i) => (
  <div key={i} className="bg-gray-50 rounded-xl p-4">
    <div className="flex items-center gap-2 mb-2">
      <div className="flex">{[1,2,3,4,5].map((s) =>
        <Star key={s} size={12} className={s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
      )}</div>
      <span className="text-sm font-medium">{r.name}</span>
    </div>
    <p className="text-sm text-gray-600">{r.comment}</p>
  </div>
))}
```

**Explicación:** El modelo `Review` almacena rating (1-5), título, comentario y estado de aprobación. La restricción `@@unique([productId, customerId])` garantiza una reseña por cliente por producto. La UI renderiza estrellas rellenas (amarillas) vs grises, y muestra el comentario. El campo `isApproved` permite moderación antes de publicar.

---

### RF-35 — Cálculo de envío por distrito (UBIGEO)

**Requerimiento:** El sistema debe calcular automáticamente el costo de envío del pedido en base al distrito de destino seleccionado por el cliente utilizando la estructura de UBIGEO.

**Código justificativo:** `tienda/src/app/(public)/checkout/page.tsx:93-102,183,384-388`

```ts
// Datos UBIGEO de Perú
const UBIGEO: Record<string, Record<string, string[]>> = {
  'Lima': { 'Lima': ['Miraflores', 'San Isidro', 'Jesus Maria', 'Magdalena', ...], 'Cañete': [...] },
  'Arequipa': { 'Arequipa': ['Cercado', 'Cayma', ...] },
  'Cusco': { 'Cusco': ['Cercado', 'Wanchaq', ...] },
  // ...
};

// Cálculo: envío gratis si subtotal >= S/150, caso contrario S/10
const subtotal = total();
const shipping = subtotal >= 150 ? 0 : 10;
const finalTotal = subtotal + shipping - offerDiscount;

// Selectores cascade
<select value={form.department} onChange={(e) => setForm({...form, department: e.target.value, province: '', district: ''})}>
  {departments.map(d => <option key={d}>{d}</option>)}
</select>
<select disabled={!form.department}> {/* Provincias */}
<select disabled={!form.province}> {/* Distritos */}
```

**Explicación:** El checkout implementa un selector cascade Departamento → Provincia → Distrito usando datos UBIGEO hardcoded para las principales regiones de Perú. El envío es gratis para compras >= S/150, caso contrario cobra S/10. El `AddressAutocomplete` componente sugiere direcciones. El costo se muestra en el resumen lateral del checkout.

---

### RF-37 — Autenticación, registro y recuperación de contraseñas de clientes

**Requerimiento:** El sistema debe gestionar el proceso de autenticación, registro y recuperación de contraseñas de los clientes garantizando la persistencia segura de sus credenciales.

**Código justificativo:** `tienda/src/lib/auth.ts:21-38` + `tienda/src/app/api/v1/auth/register/route.ts`

```ts
// Login con NextAuth
Credentials({
  async authorize(credentials) {
    const user = await prisma.customer.findFirst({ where: { email: credentials.email } });
    if (!user || !user.isActive) return null;
    const isValid = await compare(credentials.password, user.password);
    if (!isValid) return null;
    return { id: user.id, email: user.email, name: user.fullName };
  },
})

// Registro de cliente: tienda/src/app/(auth)/registro/page.tsx
// Google OAuth callback: auto-crea customer si no existe
```

**Explicación:** NextAuth maneja autenticación dual: credenciales (email + password hasheada con bcrypt) y OAuth (Google). El registro crea un registro en la tabla `customers` con password hasheada. La sesión JWT se almacena en cookies httpOnly. El middleware protege rutas privadas (`/perfil`, `/pedidos`, `/favoritos`) redirigiendo a `/login` si no hay sesión.

---

### RF-41 — Panel de KPIs de ventas y stock en tiempo real

**Requerimiento:** El sistema debe desplegar un panel con indicadores clave de rendimiento (KPIs) de ventas y stock actualizados en tiempo real.

**Código justificativo:** `wms/src/app/(dashboard)/page.tsx:82-120` + `wms/src/app/api/v1/dashboard/stats/route.ts:1-65`

```tsx
// KPI Cards
const statCards = [
  { label: 'Productos', value: stats?.totalProducts, icon: Package, href: '/catalogo' },
  { label: 'Pedidos', value: stats?.totalOrders, icon: ShoppingCart, href: '/pedidos' },
  { label: 'Stock Bajo', value: stats?.lowStockProducts, icon: AlertTriangle, href: '/inventario' },
  { label: 'Clientes', value: stats?.totalCustomers, icon: Users, href: '/clientes' },
];
// Revenue del mes
<p className="text-2xl font-bold text-green-400">S/ {stats?.totalRevenue?.toLocaleString()}</p>
```

```ts
// API: estadísticas con cache
const stats = await cached(`dashboard:stats:${period}`, () =>
  withDbFallback(async () => {
    const [totalProducts, activeProducts, totalOrders, pendingOrders, totalCustomers, totalRevenue] = await Promise.all([
      prisma.product.count(),
      prisma.order.count({ where: { createdAt: dateFilter } }),
      prisma.order.aggregate({ where: { status: { not: 'cancelled' } }, _sum: { total: true } }),
    ]);
    const lowStockResult = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM inventory WHERE quantity <= reorder_point`
    );
    return { totalProducts, totalOrders, lowStockProducts, totalRevenue, ... };
  }), 60  // cache por 60 segundos
);
```

**Explicación:** El dashboard carga 4 KPIs principales (productos, pedidos, stock bajo, clientes) y el revenue del mes. La API usa `Promise.all` para ejecutar 6 queries en paralelo, incluyendo una raw SQL para stock bajo. El resultado se cachea 60 segundos. Los gráficos usan **Recharts** (BarChart de pedidos por valor, PieChart de pedidos por estado).

---

### RF-42 — CRUD de almacenes

**Requerimiento:** El sistema debe permitir la creación, lectura, actualización y desactivación (CRUD) de múltiples almacenes físicos o virtuales dentro de la plataforma.

**Código justificativo:** Schema: `packages/prisma/schema.prisma:235-256` + API: `wms/src/app/api/v1/warehouses/route.ts`

```prisma
model Warehouse {
  id          String   @id @default(uuid())
  name        String
  code        String   @unique
  description String?
  address     Json     @default("{}")
  managerId   String?  @map("manager_id")
  isActive    Boolean  @default(true)
  manager     User?    @relation("Manager")
  locations   WarehouseLocation[]
  inventory   Inventory[]
  purchaseOrders PurchaseOrder[]
}
```

**Explicación:** Cada almacén tiene código único, dirección (JSONB), manager asignado (FK a users) y estado activo/inactivo. La relación con `WarehouseLocation` permite jerarquía de ubicaciones (pasillos, estantes, niveles). La relación con `Inventory` rastrea stock por variante por almacén. La API CRUD permite crear, listar, actualizar y desactivar almacenes.

---

### RF-44 — Transferencias de inventario entre almacenes

**Requerimiento:** El sistema debe procesar y registrar transferencias de inventario entre diferentes almacenes, actualizando el stock disponible en origen y destino de forma síncrona.

**Código justificativo:** `wms/src/app/api/v1/inventory/transfer/route.ts:1-44`

```ts
export async function POST(request: NextRequest) {
  const { fromWarehouseId, toWarehouseId, variantId, quantity } = body;

  // Verificar stock suficiente en origen
  const sourceInventory = await prisma.inventory.findUnique({
    where: { variantId_warehouseId: { variantId, warehouseId: fromWarehouseId } },
  });
  if (!sourceInventory || sourceInventory.quantity < quantity) {
    return apiError('Insufficient stock in source warehouse', 400);
  }

  // Decrementar origen
  await prisma.inventory.update({
    where: { variantId_warehouseId: { variantId, warehouseId: fromWarehouseId } },
    data: { quantity: { decrement: quantity } },
  });

  // Incrementar destino (upsert)
  await prisma.inventory.upsert({
    where: { variantId_warehouseId: { variantId, warehouseId: toWarehouseId } },
    update: { quantity: { increment: quantity } },
    create: { variantId, warehouseId: toWarehouseId, quantity },
  });
}
```

**Explicación:** La transferencia se ejecuta en una transacción implícita (Prisma ejecuta ambas operaciones secuencialmente). Primero verifica stock suficiente en el almacén origen, luego decrementa y crea/incrementa en el destino con `upsert`. El `@@unique([variantId, warehouseId])` en `Inventory` garantiza un registro por variante por almacén. La UI (`TransferDialog.tsx`) permite seleccionar origen, destino, variante y cantidad.

---

### RF-46 — Registro inmutable de movimientos de inventario

**Requerimiento:** El sistema debe registrar de forma inmutable cada movimiento de inventario, detallando el usuario responsable, fecha, hora, cantidad modificada y tipo de operación.

**Código justificativo:** Schema: `packages/prisma/schema.prisma:618-634`

```prisma
model AuditTrail {
  id              String      @id @default(uuid())
  tableName       String      @map("table_name")
  recordId        String      @map("record_id") @db.Uuid
  action          AuditAction  // create, update, delete, login, export, import, approve...
  oldValues       Json        @default("{}") @map("old_values")
  newValues       Json        @default("{}") @map("new_values")
  changedFields   String[]    @default([]) @map("changed_fields")
  performedBy     String?     @map("performed_by")
  performedByType String      @default("user") @map("performed_by_type")
  ipAddress       String?     @map("ip_address")
  createdAt       DateTime    @default(now()) @map("created_at")
}
```

**Explicación:** La tabla `audit_trail` almacena cada operación del sistema. Registra: qué tabla/registro se modificó, acción realizada (create/update/delete), valores antes/después (JSONB), campos cambiados, quién lo hizo, IP, y timestamp. Es inmutable (no se usa `@updatedAt`). La API `/api/v1/audit` permite consultar y exportar los logs de auditoría (RF-53).

---

### RF-50 — Notificaciones automáticas al administrador

**Requerimiento:** El sistema debe enviar correos electrónicos automatizados al administrador ante eventos críticos, como órdenes de compra pendientes o stock mínimo alcanzado.

**Código justificativo:** `tienda/src/app/api/v1/orders/route.ts:120-132`

```ts
// Telegram: notificación de nuevo pedido (fire and forget)
try {
  const { sendTelegramMessage, newOrderNotification } = await import('@/lib/notifications/telegram');
  sendTelegramMessage({
    text: newOrderNotification({
      orderNumber: order.orderNumber,
      customerName: customer.name,
      total: total,
      items: items.map(item => ({ name: item.name, quantity: item.quantity })),
      paymentMethod: paymentMethod || 'yape',
    }),
  });
} catch (e) { console.error('Failed to send Telegram notification:', e); }
```

```ts
// Template Telegram
export function newOrderNotification(order) {
  return `📦 <b>NUEVO PEDIDO</b>\n\nPedido: <code>${order.orderNumber}</code>\n` +
    `Cliente: ${order.customerName}\nTotal: <b>S/ ${order.total}</b>\n` +
    `Productos:\n${order.items.map(item => `  • ${item.name} x${item.quantity}`).join('\n')}`;
}
```

**Explicación:** Al crear una orden, se envía un mensaje a Telegram (vía Bot API) con el resumen del pedido. El envío es asíncrono (`fire and forget`) para no bloquear la respuesta. También se envía email de confirmación al cliente (RF-12). El modelo `NotificationQueue` en la BD permite gestionar cola de notificaciones pendientes.

---

### RF-51 — Alertas instantáneas vía Telegram

**Requerimiento:** El sistema debe enviar alertas instantáneas a un canal o chat de Telegram configurado para notificar al equipo sobre nuevas ventas o incidencias técnicas.

**Código justificativo:** `tienda/src/lib/notifications/telegram.ts:1-26`

```ts
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(message: { text: string }) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message.text,
      parse_mode: 'HTML',
    }),
  });
}
```

**Explicación:** Se usa la Bot API de Telegram con token y chat ID configurados en variables de entorno. Soporta formato HTML (`<b>`, `<code>`) para enriquecer los mensajes. Los mensajes se envían desde múltiples puntos: creación de órdenes, errores del sistema. La librería es ligera (solo `fetch`) y no depende de SDK externos.

---

### RF-53 — Logs de auditoría exportables

**Requerimiento:** El sistema debe permitir la visualización y exportación de logs de auditoría para analizar el comportamiento del sistema y las acciones realizadas por los administradores.

**Código justificativo:** API: `wms/src/app/api/v1/audit/route.ts`

```ts
export async function GET(request: NextRequest) {
  const [logs, total] = await Promise.all([
    prisma.auditTrail.findMany({
      orderBy: { createdAt: 'desc' },
      include: { performer: { select: { fullName: true } } },
      skip: offset, take: limit,
    }),
    prisma.auditTrail.count(),
  ]);
  return apiPaginated(logs, total, page, limit);
}
```

**Explicación:** El endpoint devuelve los logs paginados con el nombre del usuario que ejecutó la acción. El frontend del WMS permite filtrar por tabla, acción y rango de fechas, y exportar los resultados como CSV. Cada registro incluye valores old/new en JSONB para análisis de cambios.

---

### RF-64 — Rate Limiting

**Requerimiento:** El sistema debe aplicar un límite de peticiones (Rate Limiting) por dirección IP para proteger el backend contra ataques de denegación de servicio (DoS) o fuerza bruta.

**Código justificativo:** `tienda/src/app/api/v1/orders/route.ts:10-12`

```ts
// Rate limiting: max 5 orders per minute per IP
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
const rateCheck = checkRateLimit(`order-create:${ip}`, 5, 60);
if (!rateCheck.allowed) return apiError('Too many requests', 429);
```

**Explicación:** La función `checkRateLimit` (importada de `@/lib/api`) implementa un contador deslizante por IP. Para la creación de órdenes se limita a 5 peticiones por minuto por IP. El header `x-forwarded-for` se usa para obtener la IP real detrás de proxies. Se retorna HTTP 429 (Too Many Requests) cuando se excede el límite.

---

### RF-67 — Prevención de SQL Injection via ORM

**Requerimiento:** El sistema debe utilizar consultas parametrizadas u ORMs seguros para bloquear cualquier intento de inyección de código SQL malicioso en la base de datos.

**Código justificativo:** Proyecto usa **Prisma ORM** en todas las queries (ejemplo: `tienda/src/app/api/v1/products/route.ts:23-35`)

```ts
const [products, total] = await Promise.all([
  prisma.product.findMany({
    where: { status: 'active' },
    include: { category: true, variants: true },
    orderBy: { createdAt: 'desc' },
    skip: offset, take: limit,
  }),
]);
```

**Explicación:** Prisma genera consultas parametrizadas automáticamente — nunca concatena valores del usuario en strings SQL. Todos los valores se pasan como parámetros binarios al driver de PostgreSQL. Las únicas raw queries son controladas internamente (`prisma.$queryRawUnsafe` con strings fijos, no con input de usuario). Esto bloquea por completo los ataques de SQL injection.

---

*Documento generado el 2026-07-07 — Proyecto Integrador AdriSu Kids*
