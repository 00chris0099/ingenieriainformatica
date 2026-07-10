# Infraestructura Técnica — Hardware y Redes

**Proyecto**: ADRISU KIDS — Plataforma de Ropa Infantil Peruana
**Fecha de documento**: 2026-07-03
**Estado**: Documentación de arquitectura de producción

---

## 1. Infraestructura de Servidores

### 1.1 Servidor Principal (VPS)

| Parámetro | Valor |
|---|---|
| **Proveedor** | VPS (hosting peruano) |
| **IP Pública** | `187.77.57.116` |
| **Sistema Operativo** | Linux (Debian/Ubuntu) |
| **Rol** | Servidor de aplicación completo |
| **Presupuesto mensual** | $20–100 USD |

> **Nota**: Todo el stack (apps, bases de datos, caché, proxy inverso) corre en un único VPS. La separación lógica se logra mediante Docker containers, no mediante servidores separados.

### 1.2 Servicios Corriendo en el VPS

El VPS aloja los siguientes servicios via Docker Compose (6 containers):

| Servicio | Container | Puerto Externo | Puerto Interno | Descripción |
|---|---|---|---|---|
| **Nginx** | `nginx` | 80 (HTTP), 443 (HTTPS) | — | Proxy inverso, terminación SSL, rate limiting |
| **WMS Admin** | `wms` | — | 3000 | Panel administrativo Next.js 14 (autenticado) |
| **Tienda Pública** | `tienda` | — | 3001 | Tienda e-commerce Next.js 14 (público) |
| **Sync Worker** | `sync-worker` | — | — | Worker de sincronización WMS→Tienda (polling 30s) |
| **PostgreSQL WMS** | `wms_db` | — | 5432 | Base de datos del sistema WMS (25+ modelos) |
| **PostgreSQL Tienda** | `store_db` | — | 5433 | Base de datos de la tienda pública (16 modelos) |
| **Redis** | `redis` | — | 6379 | Caché, rate limiting, sesiones |

---

## 2. Redes y Enrutamiento

### 2.1 Dominios

| Dominio | Servicio | SSL |
|---|---|---|
| `adriskids.com` | Tienda pública (puerto 3001) | Pendiente (Let's Encrypt) |
| `admin.adriskids.com` | Panel WMS administrativo (puerto 3000) | Pendiente (Let's Encrypt) |

### 2.2 Diagrama de Red

```
Internet
   │
   ▼
┌──────────────────────────────────────────────┐
│  Nginx (Puerto 80/443)                       │
│  - Proxy inverso por dominio                 │
│  - Security headers                          │
│  - Rate limiting                             │
│  - Compresión gzip/brotli                    │
└──────────┬───────────────┬───────────────────┘
           │               │
           ▼               ▼
┌─────────────────┐  ┌─────────────────┐
│ adriskids.com   │  │ admin.adriskids │
│ → Tienda :3001  │  │ → WMS :3000     │
└────────┬────────┘  └────────┬────────┘
         │                    │
         ▼                    ▼
┌─────────────────────────────────────────┐
│           Docker Network (bridge)       │
│                                         │
│  ┌──────────┐  ┌──────────────────┐     │
│  │ store_db │  │     Redis        │     │
│  │ :5433    │  │     :6379        │     │
│  └──────────┘  └──────────────────┘     │
│                                         │
│  ┌──────────┐  ┌──────────────────┐     │
│  │ wms_db   │  │  Sync Worker     │     │
│  │ :5432    │  │  (polling 30s)   │     │
│  └──────────┘  └──────────────────┘     │
└─────────────────────────────────────────┘
```

### 2.3 Configuración de Nginx

- **Routing basado en dominio**: `admin.adriskids.com` → backend WMS (:3000), `adriskids.com` → tienda (:3001)
- **Security headers**: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Content-Security-Policy, Strict-Transport-Security
- **Rate limiting**: Límite de peticiones por IP para prevenir abuso
- **Compresión**: gzip/brotli para assets estáticos
- **SSL/TLS**: Pendiente de configurar con Let's Encrypt / Certbot

### 2.4 Puertos del VPS

| Puerto | Servicio | Acceso |
|---|---|---|
| 22 | SSH | Solo admin (clave) |
| 80 | HTTP (Nginx) | Público |
| 443 | HTTPS (Nginx) | Público |
| 5432 | PostgreSQL WMS | Solo Docker network interno |
| 5433 | PostgreSQL Tienda | Solo Docker network interno |
| 6379 | Redis | Solo Docker network interno |

> **Seguridad**: Las bases de datos y Redis NO están expuestos al exterior. Solo accesibles desde otros containers dentro de la red Docker bridge.

---

## 3. Infraestructura de Base de Datos

### 3.1 Topología Dual Database

```
┌─────────────────────┐         ┌─────────────────────┐
│      wms_db         │         │     store_db         │
│  (PostgreSQL)       │◄────────│  (PostgreSQL)        │
│  25+ modelos        │ sync    │  16 modelos          │
│  Puerto: 5432       │ worker  │  Puerto: 5433        │
│                     │  30s    │                      │
│  - Users/Auth       │         │  - Categories        │
│  - Products/Variants│         │  - Products/Variants │
│  - Inventory        │         │  - Customers         │
│  - Orders/Invoices  │         │  - Cart/Wishlist     │
│  - Suppliers        │         │  - Orders/Payments   │
│  - Shipments        │         │  - Reviews           │
│  - Audit/Logs       │         │  - Sync Log          │
│  - Settings/Config  │         │                      │
└─────────────────────┘         └─────────────────────┘
         ▲                               ▲
         │                               │
    WMS App                        Tienda App
    (Next.js)                     (Next.js)
```

### 3.2 Esquemas de Base de Datos

**wms_db** (sistema WMS — 25+ modelos Prisma):
- `User`, `Role`, `Permission` — autenticación y RBAC
- `Category`, `Product`, `Variant` — catálogo de productos
- `Inventory`, `Warehouse` — gestión de inventario
- `Order`, `OrderItem`, `Invoice` — ventas y facturación
- `Supplier`, `PurchaseOrder` — compras
- `Shipment`, `ShipmentEvent` — logística
- `AuditLog`, `SyncEvent` — trazabilidad
- `Setting`, `Notification` — configuración y notificaciones

**store_db** (tienda pública — 16 modelos Prisma):
- `Category`, `Product`, `Variant` — catálogo (réplica del WMS)
- `Customer` — clientes registrados
- `Cart`, `CartItem`, `Wishlist` — carrito y lista de deseos
- `Order`, `OrderItem`, `Payment` — pedidos y pagos
- `Review` — reseñas de productos
- `SyncLog` — log de sincronización

### 3.3 Dirección de Sincronización

| Dirección | Datos | Frecuencia | Mecanismo |
|---|---|---|---|
| **WMS → Tienda** | Productos, variantes, categorías, inventario, estado de pedidos | Cada 30 segundos | Sync Worker (polling) |
| **Tienda → WMS** | Nuevos pedidos, nuevos clientes | Cada 30 segundos | Sync Worker (polling) |

> **Regla**: El WMS es la **fuente de verdad** (system of record). En caso de conflicto, los datos del WMS prevalecen.

---

## 4. Stack de Aplicación

### 4.1 Frontend — Tienda Pública (`tienda/`)

| Componente | Tecnología | Versión |
|---|---|---|
| Framework | Next.js | 14 (App Router) |
| Lenguaje | TypeScript | — |
| Estilos | Tailwind CSS | — |
| Estado | Zustand + localStorage | — |
| UI | Componentes propios + shadcn/ui | — |
| PWA | next-pwa | — |
| SEO | Next.js metadata API | — |

**Puerto**: 3001
**Tema**: Minimalista, blanco, estilo Shopify
**Mobile-first**: Crítico (50%+ tráfico)

### 4.2 Backend — WMS Administrativo (`wms/`)

| Componente | Tecnología | Versión |
|---|---|---|
| Framework | Next.js | 14 (App Router + API Routes) |
| Lenguaje | TypeScript | — |
| Auth | NextAuth.js v5 | 5.0.0-beta.19 |
| ORM | Prisma | — |
| Cache | ioredis | — |
| UI | Tailwind CSS + shadcn/ui | — |
| Charts | Recharts | — |
| Forms | React Hook Form + Zod | — |
| Export | ExcelJS | — |

**Puerto**: 3000
**Tema**: Dashboard oscuro, sidebar fijo (260px desktop), bottom nav (móvil)
**12 módulos**: Dashboard, Catálogo, Pedidos, Clientes, Inventario, Facturación, Compras, Logística, Notificaciones, Reportes, Auditoría, Configuración

### 4.3 Paquetes Compartidos (`packages/`)

| Paquete | Propósito |
|---|---|
| `prisma-wms` | Schema Prisma + cliente WMS (output separado) |
| `prisma-store` | Schema Prisma + cliente Tienda (output separado) |
| `sync-worker` | Worker de sincronización WMS↔Tienda |
| `ui` | Componentes React compartidos (button, card, input, etc.) |
| `utils` | Helpers de formato, validación, utilidades |

---

## 5. Infraestructura Docker

### 5.1 Arquitectura de Containers

```yaml
# docker-compose.yml — 6 servicios
services:
  nginx:        # Proxy inverso + SSL termination
  wms:          # Next.js WMS (build: wms/Dockerfile)
  tienda:       # Next.js Tienda (build: tienda/Dockerfile)
  sync-worker:  # Node.js sync daemon (build: packages/sync-worker/)
  wms_db:       # PostgreSQL (wms_db)
  store_db:     # PostgreSQL (store_db)
  redis:        # Redis 7
```

### 5.2 Dockerfiles

Ambas apps (`wms/Dockerfile`, `tienda/Dockerfile`) usan patrón multi-stage:

```
Stage 1: deps     → npm install (production deps)
Stage 2: builder  → npm run build
Stage 3: runner   → Copiar build output, exponer puerto
```

- **Base image**: `node:20` (Debian, NO Alpine — Prisma necesita OpenSSL 1.1)
- **Build context**: Raíz del monorepo (`.`)
- **Output**: `standalone` (Next.js output mode)

### 5.3 Volúmenes y Persistencia

| Volumen | Container | Propósito |
|---|---|---|
| `wms_db_data` | wms_db | Datos PostgreSQL WMS |
| `store_db_data` | store_db | Datos PostgreSQL Tienda |
| `redis_data` | redis | caché y sesiones |

---

## 6. Integraciones Externas (APIs de Terceros)

### 6.1 Pagos

| Servicio | Uso | Estado |
|---|---|---|
| **MercadoPago** | Checkout Pro (pagos online) | Integrado |
| **iZipay / PagoPlux** | Pagos con tarjeta | Integrado |
| **Yape / Plin** | Pagos por QR (manual) | Placeholder |

### 6.2 Logística

| Servicio | Uso | Estado |
|---|---|---|
| **Shalom** | Cotización, envío, tracking | Integrado |

### 6.3 Facturación Electrónica

| Servicio | Uso | Estado |
|---|---|---|
| **SUNAT** | XML de factura electrónica + CDR | Integrado |

### 6.4 Notificaciones

| Servicio | Uso | Estado |
|---|---|---|
| **Telegram** | Alertas de pedidos, stock, pagos (bot) | Integrado |
| **Resend** | Emails transaccionales | Integrado |
| **WhatsApp Business** | Notificaciones al cliente | Planificado |

### 6.5 Almacenamiento y AI

| Servicio | Uso | Estado |
|---|---|---|
| **Cloudflare R2** | Almacenamiento de imágenes (S3-compatible) | Integrado |
| **OpenAI** | Chat de soporte (vía n8n) | Mock activo, n8n configurado |

### 6.6 Analytics

| Servicio | Uso | Estado |
|---|---|---|
| **Google Analytics** | Tracking de tráfico | Planificado |
| **Meta Pixel** | Remarketing | Planificado |

---

## 7. Seguridad

### 7.1 Autenticación

- **WMS**: NextAuth.js v5 con credenciales (email/password) + JWT
- **Roles**: Sistema RBAC con permisos granulares por módulo
- **Middleware**: Protección de rutas en WMS (excepto /login y /api/auth)
- **Password hashing**: bcryptjs (bcrypt puro JS)

### 7.2 Red

- PostgreSQL y Redis **no expuestos** al exterior (solo red Docker interna)
- Nginx con security headers (X-Frame-Options, CSP, HSTS, etc.)
- Rate limiting configurado en Nginx
- HTTPS pendiente (Let's Encrypt / Certbot)

### 7.3 Datos

- `.env` con credenciales reales — **nunca** committear
- CORS configurado en backend para orígenes permitidos
- Validación de inputs con Zod en API routes

---

## 8. Cronograma de Producción

### Estado Actual

| Componente | Estado |
|---|---|
| WMS App | Funcional (todas las páginas conectadas a APIs reales) |
| Tienda App | Estructura creada, pendiente de desarrollo completo |
| Sync Worker | Implementado, pendiente de update a Prisma |
| Docker Compose | Configuración creada |
| Nginx | Configuración creada |
| SSL/HTTPS | Pendiente |
| CI/CD | Pendiente |
| Testing | Pendiente (sin tests unitarios) |
| Monitoreo | Pendiente |

### Pendientes para Producción

1. **SSL/TLS**: Configurar Let's Encrypt via Certbot en Nginx
2. **CI/CD**: Pipeline de deploy automático (GitHub Actions → VPS)
3. **Testing**: Tests unitarios y de integración
4. **Monitoreo**: Health checks, uptime monitoring, logging
5. **Backups**: Cron job de backup de PostgreSQL (wms_db + store_db)
6. **Imágenes reales**: Reemplazar placeholders en productos
7. **Tienda completa**: Desarrollar todas las páginas de la tienda pública

---

## 9. Monitoreo y Mantenimiento

### 9.1 Health Checks

- **Endpoint**: `GET /api/v1/health` en WMS
- **Docker**: Health checks configurados en docker-compose
- **Nginx**: Proxy con timeouts y reintentos

### 9.2 Logs

- **Docker**: `docker compose logs -f [service]`
- **Nginx**: Access log + error log
- **Application**: Console logs (pendiente: estructurar con Winston/Pino)

### 9.3 Backups

- **PostgreSQL**: `pg_dump` periódico (pendiente de automatizar)
- **Redis**: RDB snapshots (automático por defecto)
- **Archivos**: Cloudflare R2 (redundante, S3-compatible)

---

## 10. Presupuesto Estimado

| Item | Costo Mensual (USD) |
|---|---|
| VPS (1 servidor) | $20–60 |
| Dominio (.com) | ~$1 |
| SSL (Let's Encrypt) | $0 (gratuito) |
| Cloudflare R2 | $0–5 (tier gratuito) |
| APIs externas | Variable |
| **Total estimado** | **$25–70/mes** |

> Se mantiene dentro del presupuesto de $20–100/mes definido por el usuario.

---

*Documento generado automáticamente basado en la arquitectura del proyecto ADRISU KIDS.*
*Última actualización: 2026-07-03*
