# ADRISU KIDS

Sistema integral de e-commerce + WMS para ropa infantil peruana.

## Estructura

```
adriskids/
├── wms/                    # Panel de administracion (Next.js 14)
├── tienda/                 # Tienda virtual (Next.js 14)
├── packages/
│   ├── prisma/             # Schema DB principal
│   ├── prisma-wms/         # Schema DB extendido para WMS
│   ├── ui/                 # Componentes UI compartidos
│   └── utils/              # Utilidades compartidas
├── infrastructure/
│   ├── nginx/              # Configuracion Nginx
│   └── env/                # Variables de entorno
├── docs/                   # Documentacion
├── scripts/                # Scripts de automatizacion
├── docker-compose.yml      # Orquestacion Docker
└── package.json            # Scripts del monorepo
```

## Requisitos

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose (para produccion)
- PostgreSQL 15 (local o via Docker)

## Inicio Rapido (Desarrollo)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Generar clientes Prisma
pnpm db:generate

# 3. Sembrar datos iniciales (admin, categorias, productos)
pnpm db:seed

# 4. Iniciar en desarrollo
pnpm dev

# WMS: http://localhost:3000
# Tienda: http://localhost:3001
```

### Credenciales de prueba

| Rol | Email | Contrasena |
|-----|-------|------------|
| Admin WMS | admin@adriskids.com | admin123 |
| Ventas | ventas@adriskids.com | demo123 |
| Almacen | almacen@adriskids.com | demo123 |
| Cliente tienda | cliente@adriskids.com | cliente123 |

## Deploy con Docker (Produccion)

```bash
# 1. Copiar variables de entorno
cp infrastructure/env/.env.example .env

# 2. Editar .env con credenciales reales
#    - DB_PASSWORD: password seguro para PostgreSQL
#    - NEXTAUTH_SECRET: secreto para JWT (generar con: openssl rand -hex 32)
#    - MERCADOPAGO_ACCESS_TOKEN: token de MercadoPago
#    - RESEND_API_KEY: API key de Resend
#    - TELEGRAM_BOT_TOKEN: token del bot de Telegram

# 3. Levantar servicios
docker compose up -d --build

# 4. Ejecutar migraciones y seed
docker compose exec wms npx prisma migrate deploy
docker compose exec wms npx prisma db seed

# 5. Verificar estado
docker compose ps
docker compose logs -f

# 6. Configurar SSL (despues de apuntar dominio)
# Instalar Certbot en el VPS:
# apt install certbot
# certbot --nginx -d adriskids.com -d admin.adriskids.com
```

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Framework | Next.js | 14 (App Router) |
| Lenguaje | TypeScript | 5.4+ |
| UI | Tailwind CSS | - |
| ORM | Prisma | 5.22 |
| DB | PostgreSQL | 15 |
| Cache | Redis | 7 |
| Auth | NextAuth.js | v5 (JWT) |
| State | Zustand | 4.5 |
| Deploy | Docker + Nginx | - |

## APIs Integradas

| Servicio | Uso | Estado |
|----------|-----|--------|
| MercadoPago | Pagos online con tarjeta | Integrado |
| Yape/Plin | Pagos por QR (manual) | Integrado |
| Resend | Emails transaccionales | Integrado |
| Telegram Bot | Alertas al equipo | Integrado |
| Cloudflare R2 | Almacenamiento de imagenes | Integrado |
| Google Analytics | Tracking de trafico | Provider listo |
| Meta Pixel | Remarketing | Provider listo |

## Comandos Disponibles

```bash
# Desarrollo
pnpm dev                  # Ambas apps en paralelo
pnpm wms:dev              # Solo WMS
pnpm tienda:dev           # Solo Tienda

# Build
pnpm build                # Build de produccion
pnpm build:wms            # Solo WMS
pnpm build:tienda         # Solo Tienda

# Base de datos
pnpm db:generate          # Generar clientes Prisma
pnpm db:seed              # Sembrar datos iniciales

# Produccion
docker compose up -d      # Iniciar servicios
docker compose down       # Detener servicios
docker compose logs -f    # Ver logs
docker compose restart    # Reiniciar todo
docker compose ps         # Ver estado
```

## Backups

```bash
# Backup manual
./scripts/backup.sh

# Backup automatico (agregar al crontab del VPS)
# 0 2 * * * /home/adriskids/proyecto-integrador/scripts/backup.sh
```

## Documentacion

- `docs/PLAN-DE-PRODUCCION.md` - Plan de produccion completo
- `docs/RF_TOP_10_CRITICOS.md` - 10 requerimientos funcionales clave
- `docs/INDICADORES-MEDICION.md` - KPIs e indicadores
- `docs/ARQUITECTURA-PROYECTO.md` - Arquitectura del sistema
- `REQUERIMIENTOS-FUNCIONALES.md` - Todos los RFs (75+)
- `INFRAESTRUCTURA-TECNICA.md` - Detalle de infraestructura

## Health Check

```bash
# Verificar estado del sistema
curl http://localhost:3000/api/v1/health  # WMS
curl http://localhost:3001/api/v1/health  # Tienda
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2026-07-07T00:00:00.000Z",
  "checks": {
    "postgresql": "ok",
    "redis": "ok"
  }
}
```

## Licencia

Propietario - AdriSu Kids 2026
