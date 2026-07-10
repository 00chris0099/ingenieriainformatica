# Plan de Producción — AdriSu Kids

**Proyecto:** Plataforma E-commerce de Ropa Infantil Peruana
**Fecha:** Julio 2026
**Estado:** Documento de entrega al cliente

---

## 1. Resumen Ejecutivo

AdriSu Kids es una plataforma e-commerce completa para venta de ropa y accesorios infantiles, compuesta por dos aplicaciones:

- **Tienda Pública** (`adriskids.com`): Donde los clientes compran productos
- **Panel WMS** (`admin.adriskids.com`): Donde el equipo gestiona pedidos, inventario, clientes y reportes

La plataforma está lista para desplegar. Este documento detalla todo lo necesario para ponerla en producción: infraestructura, costos, proveedores, manual de usuario y mejoras pendientes.

**Costo mensual estimado:** $6-18 USD/mes (sin contar comisiones de pago)

---

## 2. Infraestructura a Contratar

### 2.1 Especificaciones del Servidor

| Parámetro | Valor Mínimo | Valor Recomendado |
|-----------|-------------|-------------------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Almacenamiento | 40 GB SSD | 80 GB SSD |
| Sistema Operativo | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Ancho de banda | 1 TB/mes | Ilimitado |
| IP Pública | 1 estática | 1 estática |

**Nota:** Todo el stack (tienda, WMS, bases de datos, caché, proxy inverso) corre en un único VPS mediante Docker containers.

### 2.2 Proveedores Internacionales

| Proveedor | Plan | Specs | Precio/mes | Ventaja Principal |
|-----------|------|-------|------------|-------------------|
| **Hostinger** | VPS 2 | 2 vCPU, 8GB, 100GB | $8.99 | Soporte en español, datacenter en EE.UU. |
| **Contabo** | VPS S | 4 vCPU, 8GB, 50GB SSD | $6.99 | Mejores specs por precio bajo |
| **Vultr** | Regular | 2 vCPU, 4GB, 80GB | $12.00 | Datacenter Miami (~80ms a Lima) |
| **DigitalOcean** | Basic | 2 vCPU, 4GB, 80GB | $24.00 | Excelente documentación |
| **AWS Lightsail** | Standard | 2 vCPU, 4GB, 80GB | $10.00 | Escalable, integración AWS |

### 2.3 Proveedores Peruanos / Regionales

| Proveedor | Plan | Specs | Precio/mes | Ventaja Principal |
|-----------|------|-------|------------|-------------------|
| **Machimal** | VPS Starter | 2 vCPU, 4GB, 60GB | ~S/ 70 (~$19) | Proveedor peruano, soporte local |
| **RyzenHosting** | VPS | 2 vCPU, 4GB, 80GB | ~S/ 60 (~$16) | Pago con Yape/Plin |
| **Locaweb** | VPS Linux | 2 vCPU, 4GB, 80GB | ~S/ 80 (~$22) | Datacenter Brasil |
| **HostGator Latam** | VPS | 2 vCPU, 4GB, 80GB | ~$15 | Marca conocida en Latam |

### 2.4 Comparativa Rápida

| Criterio | Internacional | Peruano |
|----------|---------------|---------|
| **Precio** | $7-12/mes | S/ 60-80/mes (~$16-22) |
| **Latencia a Lima** | ~80-120ms | ~10-30ms |
| **Soporte** | Inglés/español (24/7) | Español (horario laboral) |
| **Pago** | Tarjeta internacional | Yape/Plin/transferencia |
| **Fiabilidad** | Alta | Variable |

**Recomendación:** Para arrancar, **Hostinger** o **Vultr** son la mejor opción por precio y fiabilidad. Si se necesita soporte local con pago peruano, evaluar **Machimal** o **RyzenHosting**.

### 2.5 Dominio y SSL

| Servicio | Proveedor | Costo | Notas |
|----------|-----------|-------|-------|
| Dominio (.com) | Cloudflare Registrar | ~$10/año | Al costo, sin markup |
| Alternativa | Namecheap | ~$12/año | Promociones frecuentes |
| SSL | Let's Encrypt | $0 | Gratuito via Certbot, renueva automático |

**Dominios a configurar:**
- `adriskids.com` → Tienda pública (puerto 3001)
- `admin.adriskids.com` → Panel WMS (puerto 3000)

### 2.6 Almacenamiento de Imágenes

| Servicio | Costo | Capacidad |
|----------|-------|-----------|
| **Cloudflare R2** | $0 (tier gratuito) | 5 GB gratis |
| Después del tier gratuito | $0.015/GB/mes | Ilimitado |
| **Alternativa:** AWS S3 | $0.023/GB/mes | Ilimitado |

Cloudflare R2 es compatible con S3 y no cobra por transferencia de datos (egress fees = $0).

---

## 3. Costos Estimados

### 3.1 Costos Fijos Mensuales

| Item | Costo Mensual (USD) | Notas |
|------|---------------------|-------|
| VPS (servidor) | $7-12 | Según proveedor elegido |
| Dominio | ~$1 | $10/año ÷ 12 meses |
| SSL (HTTPS) | $0 | Let's Encrypt |
| Cloudflare R2 | $0-5 | Tier gratuito al inicio |
| Resend (emails) | $0 | Plan gratuito: 100 emails/día |
| Telegram Bot | $0 | Gratuito |
| Google Analytics | $0 | Gratuito |
| **TOTAL FIJO** | **$8-18/mes** | Sin contar comisiones de pago |

### 3.2 Costos Variables (Comisiones por Venta)

| Servicio | Comisión | Ejemplo |
|----------|----------|---------|
| **MercadoPago** | 3.49% + $0.49 por transacción | Venta de S/ 100 → comisión ~S/ 7.50 |
| **Yape/Plin** | $0 (manual, sin comisión) | El cliente paga directo |
| **iZipay/PagoPlux** | Variable según plan | Alternativa a MercadoPago |

### 3.3 Presupuesto por Escenario

| Escenario | Costo Mensual | Detalle |
|-----------|---------------|---------|
| **Bajo** (arranque) | ~$10/mes | VPS básico ($7) + dominio ($1) + R2 gratis ($0) + Resend gratis ($0) |
| **Medio** (crecimiento) | ~$25/mes | VPS mejorado ($12) + dominio ($1) + R2 ($5) + Resend Pro ($20) |
| **Alto** (escalar) | ~$60/mes | VPS premium ($24) + dominio ($1) + R2 ($10) + Resend Pro ($20) + monitoreo ($5) |

---

## 4. APIs y Servicios Externos

### 4.1 Gratuitas

| Servicio | Uso | Estado |
|----------|-----|--------|
| Telegram Bot | Alertas de pedidos, stock, pagos | Integrado |
| Resend (tier gratuito) | Emails transaccionales (100/día) | Integrado |
| Google Analytics | Tracking de tráfico | Provider implementado |
| Meta Pixel | Remarketing | Provider implementado |
| Cloudflare R2 (tier gratuito) | Almacenamiento de imágenes (5GB) | Integrado |
| Let's Encrypt | Certificados SSL | Pendiente configurar |

### 4.2 De Pago

| Servicio | Uso | Costo |
|----------|-----|-------|
| MercadoPago | Pagos online con tarjeta | 3.49% + $0.49/transacción |
| Resend Pro | Emails transaccionales (>100/día) | $20/mes |
| Cloudflare R2 | Almacenamiento (>5GB) | $0.015/GB |

### 4.3 Requieren Convenio

| Servicio | Uso | Requisito |
|----------|-----|-----------|
| SUNAT | Facturación electrónica | Certificado digital de firma |
| Shalom/Olva | Tracking de envíos | Convenio empresarial |
| WhatsApp Business API | Notificaciones al cliente | Verificación de Business Account |

---

## 5. Pasos de Despliegue (Checklist)

| Paso | Descripción | Comando/Acción |
|------|-------------|----------------|
| 1 | Contratar VPS con Ubuntu 22.04 | Seleccionar proveedor y plan |
| 2 | Configurar SSH con clave | `ssh-keygen` + copiar clave al VPS |
| 3 | Instalar Docker + Docker Compose | `curl -fsSL https://get.docker.com \| sh` |
| 4 | Clonar repositorio | `git clone <repo-url> /app` |
| 5 | Configurar variables de entorno | Copiar `.env.example` → `.env.production` y llenar valores |
| 6 | Configurar Nginx | Copiar `infrastructure/nginx/nginx.conf` |
| 7 | Instalar Certbot y configurar SSL | `apt install certbot && certbot --nginx` |
| 8 | Ejecutar la aplicación | `docker compose up -d --build` |
| 9 | Verificar health checks | `docker compose ps` (todos "healthy") |
| 10 | Configurar backups automáticos | Cron job: `0 2 * * * pg_dump ...` |
| 11 | Apuntar dominio | Configurar DNS A record → IP del VPS |

---

## 6. Manual de Usuario Detallado

### Sección A: Panel WMS (admin.adriskids.com)

#### A1. Inicio de Sesión

1. Abrir navegador e ir a `admin.adriskids.com`
2. Se muestra la pantalla de login con campos de email y contraseña
3. Ingresar credenciales:
   - **Email:** admin@adriskids.com (o el email configurado)
   - **Contraseña:** la contraseña definida durante la instalación
4. Clic en el botón **"Iniciar sesión"**
5. Si las credenciales son correctas, se redirige al **Dashboard principal**
6. El Dashboard muestra tarjetas KPI con:
   - Pedidos pendientes (número)
   - Ventas del día (monto en soles)
   - Productos con stock bajo (cantidad)
   - Clientes nuevos esta semana (cantidad)

#### A2. Gestión de Productos

**Ver lista de productos:**
1. Menú lateral izquierdo → clic en **"Catálogo"**
2. Submenú desplegable → clic en **"Productos"**
3. Se muestra una tabla con todos los productos: imagen miniatura, nombre, SKU, precio, stock, estado (Activo/Borrador)
4. Se puede buscar por nombre o SKU usando la barra de búsqueda superior
5. Se puede filtrar por categoría o estado usando los dropdowns

**Crear un nuevo producto:**
1. En la vista de productos, clic en el botón **"Nuevo Producto"** (esquina superior derecha, botón verde)
2. Se abre el formulario de creación con los siguientes campos:
   - **Nombre del producto:** Texto libre (ej: "Cuna Convertible 3 en 1")
   - **SKU:** Código único alfanumérico (ej: "CU-3EN1-001"). No se repite.
   - **Descripción:** Texto detallado del producto (máximo recomendado: 500 caracteres)
   - **Categoría:** Seleccionar del dropdown (ej: "Camas y Cunas"). Si no existe, crear primero la categoría (ver A3)
   - **Estado:** Seleccionar "Borrador" (no visible en tienda) o "Activo" (visible y a la venta)
3. **Subir imágenes:**
   - Clic en la zona de carga de imágenes o arrastrar archivos desde el computador
   - Formatos aceptados: JPG, PNG, WebP
   - Tamaño recomendado: 800x800 píxeles
   - Mínimo 1 imagen, recomendado 3-5
   - La primera imagen será la principal (se muestra en el catálogo)
4. **Agregar variantes (opcional pero recomendado):**
   - Clic en **"Agregar variante"**
   - Seleccionar tipo de variante: Talla, Color, u otro atributo
   - Ingresar valor (ej: "Blanco", "Talla M")
   - Ingresar **precio** de esa variante
   - Ingresar **stock** (cantidad disponible)
   - Repetir para cada variante disponible
5. Clic en el botón **"Guardar producto"** (parte inferior del formulario)
6. El producto se guarda y aparece en la lista de productos
7. Si el estado es "Activo", el producto es visible inmediatamente en la tienda pública

**Editar un producto existente:**
1. En la tabla de productos, clic en el **nombre** o ícono de **editar** (lápiz) del producto deseado
2. Se abre el mismo formulario de creación, pero con los datos actuales
3. Modificar los campos necesarios
4. Clic en **"Guardar cambios"**

**Desactivar/Archivar un producto:**
1. En la tabla de productos, cambiar el interruptor de **Estado** de "Activo" a "Borrador"
2. El producto desaparece de la tienda pública pero se mantiene en la base de datos
3. Para reactivarlo, volver a cambiar el interruptor a "Activo"

#### A3. Gestión de Categorías

**Ver categorías:**
1. Menú lateral → **"Catálogo"** → **"Categorías"**
2. Se muestra la lista de categorías con: nombre, número de productos, estado

**Crear categoría raíz:**
1. Clic en **"Nueva Categoría"**
2. **Nombre:** Ingresar nombre (ej: "Camas y Cunas")
3. **Slug:** Se genera automáticamente (ej: "camas-y-cunas"). Se puede modificar.
4. **Descripción:** Opcional, texto breve
5. **Categoría padre:** Dejar vacío (es categoría raíz)
6. Clic en **"Guardar"**

**Crear subcategoría:**
1. Clic en **"Nueva Categoría"**
2. **Nombre:** Ingresar nombre (ej: "Cunas convertibles")
3. **Categoría padre:** Seleccionar del dropdown la categoría padre (ej: "Camas y Cunas")
4. Clic en **"Guardar"**
5. La subcategoría aparece anidada bajo la categoría padre

**Editar categoría:**
1. Clic en el nombre de la categoría
2. Modificar nombre, descripción u orden
3. Clic en **"Guardar"**

**Activar/Desactivar:**
1. Clic en el interruptor al lado de la categoría
2. Categorías desactivadas no aparecen en el filtro de la tienda

#### A4. Gestión de Pedidos

**Ver lista de pedidos:**
1. Menú lateral → **"Pedidos"**
2. Se muestra tabla con: número de pedido, nombre del cliente, total, estado, fecha
3. **Filtros superiores:**
   - Por estado: Pendiente, Confirmado, Procesando, Enviado, Entregado, Cancelado
   - Por rango de fechas
   - Por número de pedido (búsqueda)

**Ver detalle de un pedido:**
1. Clic en el **número de pedido** (ej: ADR-20260704-00001)
2. Se abre la vista de detalle con:
   - **Datos del cliente:** nombre, email, teléfono, dirección de envío
   - **Productos comprados:** lista con nombre, cantidad, precio unitario, subtotal
   - **Resumen de pago:** subtotal, envío, descuentos, IGV, total
   - **Método de pago:** MercadoPago, Yape, Plin
   - **Historial de estados:** timeline con fecha, usuario que hizo el cambio

**Cambiar estado de un pedido:**
1. En la vista de detalle del pedido, ubicar el botón **"Cambiar estado"**
2. Clic en el botón → se despliega lista de estados disponibles
3. Seleccionar el nuevo estado:
   - **Pendiente → Confirmado:** El almacén acepta el pedido
   - **Confirmado → Procesando:** Se empieza a preparar
   - **Procesando → Picking:** Alguien recoge los productos del estante
   - **Picking → Packing:** Se empaca el pedido
   - **Packing → Listo para enviar:** El paquete está listo
   - **Listo para enviar → Enviado:** El courier recogió el paquete
   - **Enviado → Entregado:** El cliente recibió el pedido
4. Clic en **"Confirmar cambio"**
5. El cambio se registra automáticamente con:
   - Usuario que hizo el cambio
   - Fecha y hora exacta
   - Estado anterior y nuevo
6. Se envía notificación al cliente (email) y al admin (Telegram)

#### A5. Gestión de Inventario

**Ver stock:**
1. Menú lateral → **"Inventario"**
2. Se muestra tabla de productos con columnas: producto, almacén, stock actual, stock reservado, stock disponible, punto de reorden
3. **Alerta amarilla:** Aparece automáticamente cuando el stock disponible ≤ punto de reorden (default: 10 unidades)
4. **Alerta roja:** Stock = 0 (agotado)

**Ajuste manual de stock:**
1. En la tabla de inventario, clic en el botón **"Ajustar stock"** junto al producto
2. Se abre un modal con los siguientes campos:
   - **Tipo de ajuste:** Seleccionar "Ingreso" (suma stock) o "Salida" (resta stock)
   - **Cantidad:** Ingresar número de unidades
   - **Motivo:** Texto obligatorio explicando el motivo (ej: "Ingreso por compra a proveedor PO-2026-001", "Salida por daño en almacén")
3. Clic en **"Confirmar ajuste"**
4. El stock se actualiza inmediatamente
5. Se registra automáticamente en la tabla de auditoría (AuditTrail) con: usuario, fecha, valores anteriores y nuevos

**Transferencia entre almacenes:**
1. Clic en el botón **"Transferir"** junto al producto
2. Se abre el modal de transferencia:
   - **Almacén origen:** Seleccionar de dónde sale el stock
   - **Almacén destino:** Seleccionar a dónde llega
   - **Producto:** Seleccionar variante del producto
   - **Cantidad:** Ingresar unidades a transferir
3. Clic en **"Confirmar transferencia"**
4. Se resta stock del almacén origen y se suma al destino
5. Se registra en auditoría

#### A6. Gestión de Clientes

**Ver lista de clientes:**
1. Menú lateral → **"Clientes"**
2. Se muestra tabla con: nombre, email, teléfono, total de pedidos, gasto total, fecha de registro
3. Se puede buscar por nombre o email

**Ver detalle de un cliente:**
1. Clic en el **nombre** del cliente
2. Se abre vista de detalle con:
   - Datos personales (nombre, email, teléfono)
   - Direcciones de envío y facturación
   - Historial de pedidos (número, fecha, total, estado)
   - Saldo actual (si tiene crédito)

**Exportar a CSV:**
1. En la vista de clientes, clic en el botón **"Exportar CSV"** (ícono de descarga)
2. Se descarga un archivo Excel con todos los clientes
3. El archivo se puede abrir en Excel, Google Sheets o similar

#### A7. Reportes y Analytics

**Dashboard principal:**
1. Menú lateral → **"Dashboard"** (o clic en el logo)
2. Se muestran tarjetas KPI:
   - Ventas del día / semana / mes
   - Pedidos pendientes / en proceso / enviados
   - Productos con stock bajo
   - Clientes nuevos
3. Gráficos de tendencia de ventas (Recharts)

**Reportes disponibles:**
1. Menú → **"Reportes"** → seleccionar tipo:
   - **Resumen de ventas:** Gráfico de ventas por día/semana/mes. Filtrable por categoría.
   - **Ranking de productos:** Top 10 más vendidos con cantidad y monto
   - **Tasa de conversión:** Visitas vs pedidos completados
   - **Checkouts abandonados:** Carritos abandonados con datos de contacto (email, teléfono)

#### A8. Configuración

**Notificaciones Telegram:**
1. Menú lateral → **"Configuración"** (ícono de engranaje)
2. Sección **"Notificaciones Telegram"**
3. **Token del Bot:** Obtener de @BotFather en Telegram → `/newbot` → copiar token
4. **Chat ID:** Enviar un mensaje al bot → ir a `https://api.telegram.org/bot<TOKEN>/getUpdates` → copiar el `chat.id`
5. Clic en **"Probar"** → se envía un mensaje de prueba al canal
6. Clic en **"Guardar"**

**Notificaciones Email:**
1. Sección **"Notificaciones Email"**
2. **API Key de Resend:** Obtener de resend.com → Dashboard → API Keys → Create
3. **Email remitente:** Debe estar verificado en Resend (ej: notifications@adriskids.com)
4. Clic en **"Guardar"**

**Gestión de usuarios del WMS:**
1. Menú → **"Usuarios"**
2. Clic en **"Nuevo Usuario"**
3. Llenar: nombre, email, rol (Admin, Almacenero, Vendedor, Contador)
4. Clic en **"Guardar"**
5. El nuevo usuario puede iniciar sesión inmediatamente

**Impuestos:**
1. Sección **"Impuestos"**
2. IGV configurado por defecto en **18%** (tasa estándar peruana)
3. Se puede modificar si es necesario (ej: para productos exonerados, tasa = 0%)

---

### Sección B: Tienda Pública (adriskids.com)

#### B1. Flujo de Compra del Cliente

**Paso 1: Explorar productos**
1. Ir a `adriskids.com`
2. En la página principal (landing), ver categorías destacadas y productos promocionales
3. Clic en **"Ver catálogo"** o en una categoría específica
4. Se abre la página de tienda con todos los productos

**Paso 2: Buscar un producto**
1. En la barra de búsqueda (parte superior), escribir el nombre del producto (ej: "cuna")
2. Los resultados aparecen en tiempo real mientras se escribe
3. Alternativamente, usar los botones de categoría para filtrar (ej: "Camas y Cunas", "Sillas Altas")

**Paso 3: Ver producto**
1. Clic en la imagen o nombre del producto
2. Se abre la ficha completa del producto con:
   - Galería de imágenes (clic en thumbnails para cambiar)
   - Nombre, marca, precio, descuento (si aplica)
   - Estado del stock (En stock / Solo X unidades / Agotado)
   - Descripción detallada
   - Especificaciones técnicas
   - Opiniones de clientes

**Paso 4: Agregar al carrito**
1. Clic en el botón **"Quiero este producto"** (botón verde grande)
2. Se muestra confirmación de que el producto se agregó al carrito
3. El ícono del carrito (esquina superior derecha) muestra el número de productos

**Paso 5: Revisar carrito**
1. Clic en el ícono del carrito (superior derecha)
2. Se muestra la lista de productos en el carrito:
   - Imagen, nombre, precio unitario
   - Botones **+** y **-** para modificar cantidad
   - Botón **X** para eliminar el producto
   - Subtotal por producto
   - Total general
3. Modificar cantidades si es necesario

**Paso 6: Ir al checkout**
1. Clic en **"Ir al checkout"** o **"Finalizar compra"**
2. Se abre el formulario de checkout

**Paso 7: Llenar datos de envío**
1. **Nombre completo:** Ingresar nombre y apellidos (ej: "María García López")
2. **Email:** Ingresar correo electrónico (se enviará la confirmación aquí)
3. **Celular:** Ingresar 9 dígitos empezando con 9 (ej: "999111222")
4. **Departamento:** Seleccionar del dropdown (ej: "Lima")
5. **Provincia:** Seleccionar del dropdown (se filtra según departamento)
6. **Distrito:** Seleccionar del dropdown (se filtra según provincia)
7. **Dirección:** Ingresar calle, número y referencias (ej: "Av. Los Olivos 123, int. 4, ref: frente al parque")

**Paso 8: Seleccionar método de pago**
1. **Opción 1 - MercadoPago:**
   - Clic en la tarjeta de "Pago seguro - Tarjeta / Yape / Plin"
   - Clic en **"Pagar ahora"**
   - Se redirige a la página de pago de MercadoPago (página segura)
   - Ingresar datos de tarjeta de crédito/débito
   - Confirmar pago
   - Se redirige de vuelta a la tienda con confirmación

2. **Opción 2 - Yape/Plin:**
   - Clic en la tarjeta de "Yape / Plin"
   - Se muestra un código QR con el monto a pagar
   - Abrir la app de Yape o Plin en el celular
   - Escanear el código QR
   - Confirmar el pago en la app
   - Enviar comprobante de pago por WhatsApp al número indicado

**Paso 9: Confirmación**
1. Después del pago, se muestra pantalla de confirmación con:
   - Número de pedido (ej: ADR-20260704-00001)
   - Resumen del pedido
   - Instrucciones de seguimiento
2. Se envía email automático de confirmación con el resumen
3. Se puede seguir el estado del pedido en `adriskids.com/pedido`

#### B2. Seguimiento de Pedido

1. Ir a `adriskids.com/pedido`
2. Ingresar el **número de pedido** (ej: ADR-20260704-00001)
3. Clic en **"Buscar"**
4. Se muestra una **línea de tiempo visual** con los estados:
   - ✅ Pedido recibido
   - ✅ Confirmado
   - ✅ Procesando
   - ✅ Enviado (con número de tracking si aplica)
   - ⬜ Entregado
5. Los estados completados aparecen en verde, el actual en amarillo, los pendientes en gris

#### B3. Registro e Inicio de Sesión

**Crear cuenta:**
1. Clic en el ícono de **persona** (esquina superior derecha)
2. Clic en **"Crear cuenta"**
3. Llenar formulario:
   - **Nombre completo**
   - **Email**
   - **Contraseña** (mínimo 8 caracteres)
4. Clic en **"Registrarse"**
5. Se crea la cuenta y se redirige al Dashboard del cliente

**Iniciar sesión:**
1. Clic en el ícono de persona
2. Ingresar **email** y **contraseña**
3. Clic en **"Iniciar sesión"**
4. O clic en **"Continuar con Google"** para login con cuenta de Google

**Mi cuenta:**
1. Después de iniciar sesión, clic en ícono de persona → **"Mi cuenta"**
2. Se puede ver:
   - Historial de pedidos
   - Editar perfil (nombre, email, teléfono)
   - Gestionar direcciones

---

### Sección C: Mantenimiento y Soporte Técnico

#### C1. Comandos Esenciales (para el equipo técnico)

| Comando | Qué hace |
|---------|----------|
| `docker compose ps` | Ver el estado de todos los servicios (si están corriendo) |
| `docker compose restart` | Reiniciar todos los servicios |
| `docker compose restart wms` | Reiniciar solo el WMS |
| `docker compose restart tienda` | Reiniciar solo la tienda |
| `docker compose logs -f` | Ver logs en tiempo real de todos los servicios |
| `docker compose logs -f wms` | Ver logs del WMS en tiempo real |
| `docker compose logs -f tienda` | Ver logs de la tienda en tiempo real |
| `docker compose down` | Detener todos los servicios |
| `docker compose up -d` | Iniciar todos los servicios en background |

**Backup manual de base de datos:**
```bash
docker exec adris-postgres pg_dump -U adris adriskids > backup_$(date +%Y%m%d).sql
```

**Restaurar backup:**
```bash
docker exec -i adris-postgres psql -U adris adriskids < backup.sql
```

**Actualizar la aplicación:**
```bash
git pull
docker compose build
docker compose up -d
```

#### C2. Solución de Problemas Comunes

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| "La página no carga" | Servicio caído | `docker compose ps` → verificar estado → `docker compose restart` |
| "Error 500 en API" | Base de datos no disponible | `docker exec adris-postgres pg_isready` → reiniciar PostgreSQL |
| "Emails no se envían" | API key de Resend incorrecta | Verificar variable `RESEND_API_KEY` en `.env` |
| "Pago no se registra" | Webhook de MercadoPago mal configurado | Verificar URL del webhook en configuración de MercadoPago |
| "Imágenes no se ven" | Cloudflare R2 no configurado | Verificar variables de R2 en `.env` |
| "Lentitud general" | CPU o RAM al 100% | `docker stats` → identificar servicio → reiniciar o escalar VPS |

---

## 7. Landing Pages de Productos

### 7.1 Estado Actual

La ficha de producto (`/producto/[slug]`) actualmente incluye:
- Hero con galería de imágenes (múltiples fotos + thumbnails)
- Info del producto (nombre, marca, precio, descuento, stock)
- Trust badges (envío gratis, garantía, devolución)
- Tabs: Descripción / Especificaciones / Opiniones
- Sección "Por qué elegir AdriSu Kids"
- Productos relacionados
- Botón sticky mobile ("Quiero este producto")

### 7.2 Las 12 Secciones Nuevas

Se agregarán las siguientes secciones al archivo `tienda/src/app/(public)/producto/[slug]/page.tsx`:

**1. Video del Producto**
- Sección con embed de YouTube/Vimeo o video local
- Layout: video a pantalla completa en mobile, centrado en desktop (max-width 800px)
- Placeholder estático si no hay video disponible
- Ubicación: después de la galería de imágenes, antes de la descripción

**2. Testimonios de Clientes**
- Cards con: foto del cliente, nombre, estrellas (1-5), comentario, fecha
- Grid de 2-3 testimonios visibles
- Más destacado que el tab de reviews (que se mantiene como lista completa)
- Ubicación: después de la sección de beneficios

**3. Tabla de Especificaciones Detallada**
- Tabla con: Material, Dimensiones (largo x ancho x alto), Peso, Edad recomendada, Certificaciones de seguridad, Colores disponibles, País de origen
- Layout: 2 columnas en desktop, apilado en mobile
- Ubicación: en el tab de "Especificaciones" (reemplaza la tabla actual simple)

**4. Cross-sell / "También te puede interesar"**
- Grid de 4 productos complementarios
- Cards con: imagen, nombre, precio, botón "Agregar al carrito"
- Productos desde la BD (modelo Offer con type="crosssell") o hardcodeados como fallback
- Ubicación: después de los testimonios

**5. FAQ del Producto**
- Acordeón (expand/collapse) con 4-6 preguntas frecuentes
- Preguntas ejemplo: ¿Se puede armar solo?, ¿Cuánto tarda en llegar?, ¿Tiene garantía?, ¿Se puede devolver?, ¿Incluye accesorios?
- Ubicación: después de cross-sell

**6. Garantía y Devoluciones**
- Sección visual con 3 iconos grandes:
  - Escudo: "Garantía 12 meses"
  - Flecha circular: "Devolución en 30 días"
  - Chat: "Soporte por WhatsApp 24/7"
- Política clara en texto debajo de los iconos
- Ubicación: después de FAQ

**7. Guía de Medidas**
- Imagen diagrama con dimensiones del producto (largo, ancho, alto)
- Flechas indicando cada dimensión
- Especialmente útil para camas, sillas altas, mesas
- Ubicación: en el tab de "Especificaciones" o como sección separada

**8. Badge de Urgencia/Escasez**
- Badge animado: "Solo quedan X unidades" cuando stock < 10
- Color naranja cuando stock entre 4-9
- Color rojo cuando stock < 3
- Parpadeo suave en el badge para llamar atención
- Ubicación: junto al precio y estado de stock

**9. Sección de Confianza**
- Stats grandes y visibles:
  - "Más de 500 familias confían en nosotros"
  - "Envío a todo Perú"
  - "4.8 estrellas en Google"
- Bandera peruana + "Marca peruana"
- Ubicación: antes del footer, después de productos relacionados

**10. Botón de WhatsApp**
- Botón flotante en la esquina inferior derecha
- Color verde de WhatsApp con ícono
- Link: `https://wa.me/51999111222?text=Hola, tengo una consulta sobre [nombre del producto]`
- Visible siempre (fixed position)
- Ubicación: esquina inferior derecha, visible en todas las secciones

**11. Comparativa de Productos**
- Tabla comparativa con 2-3 productos similares de la misma categoría
- Columnas: Característica | Producto A | Producto B | Producto actual (resaltado)
- Características: Precio, Material, Dimensiones, Edad, Certificación
- Ubicación: después de la sección de confianza

**12. Share Buttons**
- Botones de compartir en:
  - WhatsApp (link directo con mensaje predefinido)
  - Facebook (share URL de la página)
  - Instagram (copia link al portapapeles)
- Íconos circulares con colores de cada red social
- Ubicación: junto al precio o debajo del nombre del producto

---

## 8. Cronograma de Implementación

| Fase | Actividad | Duración Estimada |
|------|-----------|-------------------|
| 1 | Contratar VPS y dominio | 1-2 días |
| 2 | Configurar servidor (Docker, SSH, Nginx) | 1 día |
| 3 | Desplegar aplicación (docker compose up) | 1 día |
| 4 | Configurar SSL (Let's Encrypt) | 1 día |
| 5 | Configurar backups automáticos | 0.5 días |
| 6 | Probar flujo completo (compra → pago → email) | 1 día |
| 7 | Agregar 12 secciones a landing page de productos | 2-3 días |
| 8 | Entregar manual de usuario al cliente | 1 día |
| **Total** | | **7-10 días** |

---

## 9. Anexos

### Anexo A: Variables de Entorno (.env)

```
# Base de datos
DATABASE_URL=postgres://adris:password@localhost:5432/adriskids

# NextAuth
NEXTAUTH_SECRET=secreto-aqui
NEXTAUTH_URL=https://adriskids.com

# MercadoPago
MP_ACCESS_TOKEN=token-mercadopago
MP_PUBLIC_KEY=public-key-mercadopago

# Resend (emails)
RESEND_API_KEY=re_key_aqui
FROM_EMAIL=notifications@adriskids.com

# Telegram
TELEGRAM_BOT_TOKEN=token-del-bot
TELEGRAM_CHAT_ID=chat-id

# Cloudflare R2 (imágenes)
R2_ACCOUNT_ID=account-id
R2_ACCESS_KEY_ID=access-key
R2_SECRET_ACCESS_KEY=secret-key
R2_BUCKET_NAME=adriskids-images
R2_PUBLIC_URL=https://images.adriskids.com
```

### Anexo B: Puerto de Servicios

| Servicio | Puerto | Acceso |
|----------|--------|--------|
| Nginx (HTTP) | 80 | Público |
| Nginx (HTTPS) | 443 | Público |
| WMS Admin | 3000 | Solo Nginx (interno) |
| Tienda | 3001 | Solo Nginx (interno) |
| PostgreSQL WMS | 5432 | Solo Docker network |
| PostgreSQL Tienda | 5433 | Solo Docker network |
| Redis | 6379 | Solo Docker network |
| SSH | 22 | Solo admin |

### Anexo C: Contacto de Soporte

- **Soporte técnico:** [Agregar email/teléfono del equipo de desarrollo]
- **Soporte de hosting:** [Agregar contacto del proveedor de VPS]
- **MercadoPago:** [Agregar contacto o link de soporte]
- **Resend:** [support@resend.com]

---

*Documento generado como parte del plan de producción de AdriSu Kids.*
*Última actualización: Julio 2026*
