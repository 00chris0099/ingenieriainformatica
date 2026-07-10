# Arquitectura del Proyecto — AdriSu Kids

## Tipo de Arquitectura

El proyecto utiliza una **Arquitectura Monorepo con Turborepo**, organizado como un sistema de múltiples aplicaciones (multi-app) que comparten código común a través de paquetes internos.

**En palabras simples:** Todo vive en un solo repositorio grande, pero está dividido en carpetas independientes que pueden trabajar separadas pero comparten lo que necesitan.

---

## Stack Tecnológico

| Capa | Tecnología | Función |
|------|-----------|---------|
| Framework | Next.js 14 (App Router) | Framework web para React |
| Lenguaje | TypeScript | JavaScript con tipos |
| Base de datos | PostgreSQL 15 | Almacenamiento relacional |
| ORM | Prisma 5.22 | Acceso a la base de datos |
| Cache | Redis 7 | Almacenamiento temporal rápido |
| Monorepo | pnpm workspaces + Turborepo | Gestión de múltiples paquetes |
| Container | Docker + Docker Compose | Empaquetado y despliegue |
| Reverse Proxy | Nginx | Ruteo y balanceo de tráfico |
| CSS | Tailwind CSS | Estilos utilitarios |
| State | Zustand | Estado del lado del cliente |
| Auth | NextAuth v5 (JWT) | Autenticación de usuarios |

---

## Estructura de Carpetas

```
proyecto-integrador/
│
├── tienda/                    # App 1: Tienda online para clientes
│   └── src/
│       ├── app/
│       │   ├── (public)/      # Rutas públicas (sin auth)
│       │   │   ├── carrito/   # Página del carrito
│       │   │   ├── checkout/  # Formulario de pago
│       │   │   ├── pedido/    # Seguimiento de pedido
│       │   │   ├── producto/  # Ficha de producto
│       │   │   └── tienda/    # Catálogo de productos
│       │   ├── (account)/     # Rutas autenticadas (cliente)
│       │   ├── (auth)/        # Login y registro
│       │   ├── api/           # API REST (endpoints)
│       │   ├── layout.tsx     # Layout raíz
│       │   └── page.tsx       # Landing page
│       ├── components/        # Componentes React reutilizables
│       ├── hooks/             # Custom hooks
│       ├── lib/               # Servicios (auth, email, notifications)
│       ├── store/             # Estado global (Zustand)
│       ├── types/             # Tipos TypeScript
│       ├── i18n/              # Internacionalización
│       └── messages/          # Textos traducidos
│
├── wms/                       # App 2: Sistema de gestión (almacén/ventas)
│   └── src/
│       ├── app/
│       │   ├── (dashboard)/   # Panel administrativo
│       │   │   ├── analytics-avanzado/
│       │   │   ├── auditoria/
│       │   │   ├── catalogo/
│       │   │   ├── clientes/
│       │   │   ├── compras/
│       │   │   ├── comunicaciones/
│       │   │   ├── cupones/
│       │   │   ├── finanzas/
│       │   │   ├── impuestos/
│       │   │   ├── inventario/
│       │   │   ├── logistica/
│       │   │   ├── pedidos/
│       │   │   ├── proveedores/
│       │   │   ├── reportes/
│       │   │   └── usuarios/
│       │   ├── (auth)/        # Login del admin
│       │   └── api/           # API REST del WMS
│       ├── components/        # Componentes del WMS
│       ├── hooks/             # Custom hooks
│       ├── lib/               # Servicios
│       ├── store/             # Estado global
│       └── types/             # Tipos TypeScript
│
├── packages/                  # Paquetes compartidos
│   ├── prisma/                # Schema de BD para la tienda
│   │   ├── schema.prisma      # Modelos, enums, relaciones
│   │   ├── migrations/        # Migraciones de BD
│   │   └── src/               # Cliente Prisma
│   ├── prisma-wms/            # Schema de BD para el WMS (extendido)
│   │   └── schema.prisma      # Modelos WMS adicionales
│   ├── ui/                    # Componentes UI compartidos
│   └── utils/                 # Funciones utilitarias comunes
│
├── infrastructure/            # Configuración de infraestructura
│   └── nginx/                 # Configuración de Nginx
│
├── scripts/                   # Scripts de automatización
│
├── docker-compose.yml         # Orquestación de contenedores
├── turbo.json                 # Configuración de Turborepo
├── pnpm-workspace.yaml        # Define los paquetes del monorepo
└── package.json               # Scripts raíz (dev, build, etc.)
```

---

## Monorepo con pnpm Workspaces

**Qué es un monorepo:** Un solo repositorio que contiene múltiples aplicaciones y paquetes. En lugar de tener repos separados para la tienda y el WMS, ambos viven juntos y comparten código.

**Cómo funciona pnpm workspaces:** El archivo `pnpm-workspace.yaml` le dice a pnpm qué carpetas son paquetes independientes:

```yaml
packages:
  - "wms"
  - "tienda"
  - "packages/*"
```

Esto significa que `wms/`, `tienda/`, `packages/prisma/`, `packages/ui/` y `packages/utils/` son paquetes que pueden importarse entre sí. Si la tienda necesita usar el schema de Prisma, simplemente hace `import` del paquete `@repo/prisma`.

**Scripts del package.json raíz:**

```json
{
  "dev": "pnpm run --parallel wms:dev tienda:dev",     // Ejecuta ambas apps en paralelo
  "build": "pnpm run --parallel build:wms build:tienda", // Construye ambas apps
  "wms:dev": "pnpm --filter @repo/wms dev",            // Solo el WMS
  "tienda:dev": "pnpm --filter @repo/tienda dev"       // Solo la tienda
}
```

El flag `--filter` selecciona un paquete específico. El flag `--parallel` ejecuta comandos simultáneamente.

---

## Turborepo

**Qué es Turborepo:** Un sistema de caché y orquestación que acelera las construcciones en monorepos. Analiza las dependencias entre paquetes y ejecuta tareas de forma óptima.

**Configuración (`turbo.json`):**

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],    // Construye dependencias primero
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,             // No cachear en desarrollo
      "persistent": true          // Mantener proceso vivo
    }
  }
}
```

El `^build` significa: "antes de construir este paquete, construye todos los paquetes de los que depende". Esto garantiza el orden correcto.

---

## Las Dos Aplicaciones

### Tienda (`tienda/`)

- **Puerto:** 3001 en producción
- **Audiencia:** Clientes que compran productos
- **Rutas principales:**
  - `/` → Landing page
  - `/tienda` → Catálogo de productos
  - `/producto/[slug]` → Ficha de producto
  - `/carrito` → Carrito de compras
  - `/checkout` → Formulario de pago
  - `/pedido` → Seguimiento de pedido
  - `/api/v1/*` → API REST pública

### WMS (`wms/`)

- **Puerto:** 3000 en producción
- **Audiencia:** Administradores, almaceneros, equipo de ventas
- **Módulos del dashboard:**
  - `pedidos/` → Gestión de órdenes
  - `inventario/` → Control de stock
  - `clientes/` → CRM
  - `compras/` → Órdenes de compra
  - `proveedores/` → Gestión de proveedores
  - `logistica/` → Envíos y tracking
  - `finanzas/` → Facturación
  - `usuarios/` → Gestión de cuentas
  - `auditoria/` → Logs de actividad
  - `analytics-avanzado/` → KPIs e informes

---

## Base de Datos Compartida

Ambas aplicaciones usan la **misma base de datos PostgreSQL** (`adriskids`), pero con schemas Prisma ligeramente diferentes:

- `packages/prisma/schema.prisma` → Usado por la tienda (modelos base)
- `packages/prisma-wms/schema.prisma` → Usado por el WMS (modelos extendidos con WMS)

El schema del WMS **extiende** el de la tienda, agregando tablas como:
- `PickList` / `PickListItem` → Picking de almacén
- `Return` / `ReturnItem` → Devoluciones
- `CycleCount` / `CycleCountItem` → Inventario cíclico
- `Lot` / `LotMovement` → Tracking por lote
- `SerialNumber` → Números de serie
- `QualityCheck` / `QualityCheckItem` → Control de calidad
- `AbandonedCheckout` → Checkouts abandonados
- `Wishlist` → Lista de deseos
- `Coupon` → Cupones de descuento
- `NewsletterSubscriber` → Suscriptores
- `TaxConfig` → Configuración de impuestos

---

## Infraestructura Docker

El `docker-compose.yml` define 5 servicios:

```
┌─────────────┐     ┌─────────────┐
│   Nginx     │────▶│   Tienda    │ :3001
│  (Proxy)    │────▶│   (Next.js) │
│  :80/:443   │     └──────┬──────┘
└─────────────┘            │
                           │
┌─────────────┐     ┌──────▼──────┐
│   Redis     │◀───▶│ PostgreSQL  │
│   (Cache)   │     │   :5432     │
│   :6379     │     └─────────────┘
└─────────────┘
       │
┌──────▼──────┐
│    WMS      │
│  (Next.js)  │
│   :3000     │
└─────────────┘
```

- **Nginx:** Recibe todo el tráfico en puerto 80/443 y lo redirige a la tienda o WMS según el dominio
- **PostgreSQL:** Base de datos principal, datos persistentes en un volumen Docker
- **Redis:** Caché para sesiones, rate limiting y datos temporales
- **Tienda y WMS:** Aplicaciones Next.js independientes
- **Red:** Todos los servicios están en la red `adris-network` y se comunican por nombre de servicio

---

## Flujo de Datos

```
Cliente (navegador)
       │
       ▼
   Nginx (proxy inverso)
       │
       ├── dominio adriskids.com ──────▶ Tienda (Next.js :3001)
       │                                     │
       │                                     ▼
       │                                 PostgreSQL ◀── Prisma ORM
       │                                     ▲
       │                                     │
       └── dominio admin.adriskids.com ──▶ WMS (Next.js :3000)
                                              │
                                              ▼
                                          PostgreSQL ◀── Prisma ORM
```

---

## Conclusión

El proyecto es un **monorepo fullstack** con arquitectura **multi-app** que separa la experiencia del cliente (tienda) de la gestión interna (WMS), compartiendo base de datos, esquemas y componentes UI. La infraestructura Docker permite despliegue consistente en cualquier entorno.
