# Indicadores de Medición — AdriSu Kids

> Métricas organizadas por categoría para evaluar el rendimiento del negocio y la plataforma.

---

## 1. Indicadores Técnicos

Miden el rendimiento de la infraestructura y las aplicaciones.

| # | Indicador | Fórmula | Meta | Fuente de datos |
|---|-----------|---------|------|-----------------|
| T1 | Tiempo de respuesta del servidor | Tiempo promedio entre solicitud y respuesta de la API | < 200ms | Logs de Nginx / Next.js |
| T2 | Disponibilidad del sistema | (Tiempo total - Tiempo de inactividad) / Tiempo total × 100 | > 99.5% | Docker healthcheck / Uptime Robot |
| T3 | Tiempo de carga de páginas | Tiempo desde que el usuario hace clic hasta que la página se muestra completa | < 3 segundos | Lighthouse / Core Web Vitals |
| T4 | Tasa de error del servidor | Errores HTTP 5xx / Total de peticiones × 100 | < 0.5% | Logs de la aplicación |
| T5 | Uso de CPU del servidor | Porcentaje promedio de CPU utilizado | < 70% | Docker stats / PM2 |
| T6 | Uso de memoria RAM | Porcentaje promedio de memoria utilizado | < 80% | Docker stats / PM2 |
| T7 | Capacidad de la base de datos | Número de conexiones activas vs máximo permitido | < 80% del máximo | PostgreSQL `pg_stat_activity` |
| T8 | Tiempo de respuesta de la base de datos | Tiempo promedio de consultas SQL | < 50ms | Prisma tracing / pg_stat_statements |
| T9 | Tasa de caché de Redis | Hits / (Hits + Misses) × 100 | > 80% | Redis `INFO stats` |
| T10 | Tamaño de la base de datos | Espacio en disco utilizado por PostgreSQL | Monitoreo continuo | `pg_database_size()` |
| T11 | Velocidad de build | Tiempo que tarda Turborepo en construir ambas apps | < 2 minutos | Turborepo logs |
| T12 | Tasa de errores del cliente | Errores JavaScript en el navegador / Sesiones × 100 | < 1% | Sentry / Console errors |

---

## 2. Indicadores de Calidad

Miden la calidad del código y del producto entregado.

| # | Indicador | Fórmula | Meta | Fuente de datos |
|---|-----------|---------|------|-----------------|
| Q1 | Cobertura de código | Líneas de código con tests / Total de líneas × 100 | > 60% | Vitest / Jest coverage |
| Q2 | Tasa de bugs en producción | Bugs reportados después del deploy / Total de deploys × 100 | < 5% | GitHub Issues / Bug tracker |
| Q3 | Tiempo promedio de resolución de bugs | Tiempo desde reporte hasta fix / Número de bugs | < 24 horas | GitHub Issues |
| Q4 | Deuda técnica pendiente | Número de TODOs, FIXMEs yCodeAtas en el código | Reducir 10% mensual | ESLint / SonarQube |
| Q5 | Tasa de successfully builds | Builds exitosos / Total de builds × 100 | > 98% | GitHub Actions / Turbo |
| Q6 | Tiempo de revisión de código | Tiempo promedio entre PR creado y aprobado | < 4 horas | GitHub PRs |
| Q7 | Conformidad con estándares | Errores de linting / Total de archivos × 100 | 0 errores críticos | ESLint + Prettier |
| Q8 | Tasa de regresiones | Features que dejaron de funcionar después de un cambio / Total de cambios | < 2% | QA manual + tests |

---

## 3. Indicadores Operativos

Miden la eficiencia de los procesos del negocio.

| # | Indicador | Fórmula | Meta | Fuente de datos |
|---|-----------|---------|------|-----------------|
| O1 | Volumen de pedidos diario | Total de pedidos recibidos por día | Tendencia creciente | BD `orders` |
| O2 | Ticket promedio | Ingresos totales / Número de pedidos | > S/ 150 | BD `orders.total` |
| O3 | Tiempo promedio de preparación del pedido | Tiempo desde confirmación hasta envío | < 24 horas | BD `orders` timestamps |
| O4 | Tasa de cancelación de pedidos | Pedidos cancelados / Total de pedidos × 100 | < 5% | BD `orders.status = cancelled` |
| O5 | Tasa de devolución | Devoluciones / Total de pedidos entregados × 100 | < 3% | BD `returns` vs `orders` |
| O6 | Precisión del inventario | (Productos con stock correcto / Total de productos) × 100 | > 98% | Audit trail + inventario |
| O7 | Rotación de inventario | Costo de mercadería vendida / Inventario promedio | > 4 veces/año | BD `inventory` + `orders` |
| O8 | Tiempo de entrega al cliente | Tiempo desde envío hasta entrega confirmada | < 5 días hábiles | BD `shipments` |
| O9 | Tasa de cumplimiento a tiempo | Pedidos entregados a tiempo / Total de pedidos × 100 | > 95% | BD `shipments.actualDelivery vs estimatedDelivery` |
| O10 | Productos agotados | Productos con stock = 0 / Total de productos activos × 100 | < 5% | BD `inventory` |
| O11 | Tasa de conversión del checkout | Completaron pago / Iniciaron checkout × 100 | > 60% | BD `orders` vs `abandoned_checkouts` |
| O12 | Checkouts abandonados | Checkouts abandonados / Total de checkouts iniciados × 100 | < 30% | BD `abandoned_checkouts` |
| O13 | Pedidos procesados por hora (WMS) | Total de pedidos cambiados de estado / Horas de operación | > 10 pedidos/hora | BD `order_status_history` |
| O14 | Eficiencia de picking | Items correctos escaneados / Total de items picked × 100 | > 99% | BD `pick_list_items.scannedQty` |
| O15 | Tiempo de respuesta a clientes | Tiempo promedio entre consulta y primera respuesta | < 2 horas | Sistema de soporte |

---

## 4. Indicadores de Seguridad

Miden la postura de seguridad del sistema y la protección de datos.

| # | Indicador | Fórmula | Meta | Fuente de datos |
|---|-----------|---------|------|-----------------|
| S1 | Intentos de login fallidos | Total de autenticaciones fallidas por día | Monitoreo continuo | BD `sessions` + logs |
| S2 | Cuentas bloqueadas por intentos fallidos | Cuentas desactivadas temporalmente / Total de cuentas | < 1% | BD `users.isActive` |
| S3 | Tokens expirados rechazados | Solicitudes con token caducado / Total de solicitudes autenticadas | Monitoreo continuo | Logs de NextAuth |
| S4 | Endpoints sin rate limiting | Endpoints críticos sin protección / Total de endpoints críticos | 0 | Auditoría de código |
| S5 | Vulnerabilidades dependencias | Dependencias con CVEs conocidas / Total de dependencias | 0 críticas | `pnpm audit` / Snyk |
| S6 | Datos sensibles en logs | Número de registros con emails, passwords o tokens en logs | 0 | Búsqueda en logs |
| S7 | Tasa de éxito de 2FA | Usuarios con 2FA habilitado / Total de usuarios admin | > 90% | BD `users.twoFactorEnabled` |
| S8 | Sesiones concurrentes sospechosas | Logins desde múltiples IPs para el mismo usuario en < 5 min | Alerta si > 3 | BD `sessions` + IP tracking |
| S9 | Tiempo de respuesta a incidents | Tiempo desde detección hasta mitigación de un incidente de seguridad | < 1 hora | Registro de incidents |
| S10 | Auditorías de seguridad realizadas | Número de auditorías de código y dependencias por trimestre | >= 1 trimestral | Programa de auditorías |

---

## 5. Indicadores Financieros

Miden la salud económica del negocio.

| # | Indicador | Fórmula | Meta | Fuente de datos |
|---|-----------|---------|------|-----------------|
| F1 | Ingresos brutos mensuales | Suma de totales de pedidos pagados en el mes | Tendencia creciente | BD `orders` WHERE `paymentStatus = paid` |
| F2 | Margen bruto | (Ingresos - Costo de mercadería vendida) / Ingresos × 100 | > 30% | BD `orders` + `product_variants.costPrice` |
| F3 | Ingresos por canal de pago | Ingresos por MercadoPago / Ingresos por Yape / Ingresos por Plin | Diversificar canales | BD `payments.method` |
| F4 | Valor promedio del carrito abandonado | Suma de totales de checkouts abandonados / Número de abandonos | Monitoreo continuo | BD `abandoned_checkouts` |
| F5 | Costo de adquisición por cliente (CAC) | Gasto en marketing / Nuevos clientes adquiridos | < S/ 30 | Datos de marketing + BD `customers` |
| F6 | Valor de vida del cliente (LTV) | Ingreso promedio por cliente × Frecuencia de compra × Tiempo de vida | > S/ 300 | BD `customers` + `orders` |
| F7 | Relación LTV/CAC | LTV / CAC | > 3:1 | Calculado |
| F8 | Tasa de recurrencia | Clientes con 2+ pedidos / Total de clientes × 100 | > 20% | BD `orders` agrupado por `customerId` |
| F9 | Ingresos por cupones de descuento | Suma de descuentos aplicados / Ingresos totales × 100 | < 10% | BD `offers` + `orders.discountAmount` |
| F10 | Costo de envío promedio | Suma de costos de envío / Total de envíos | Monitoreo continuo | BD `shipments.cost` |
| F11 | Tasa de impuestos (IGV) recaudado | IGV cobrado / Ventas gravadas × 100 | 18% (Perú) | BD `invoices.taxAmount` |
| F12 | Margen por categoría de producto | (Ingresos por categoría - Costo por categoría) / Ingresos por categoría × 100 | Identificar top y bottom | BD `orders` + `categories` + `costPrice` |

---

## 6. Indicadores de Satisfacción del Cliente

Miden la experiencia y percepción del cliente.

| # | Indicador | Fórmula | Meta | Fuente de datos |
|---|-----------|---------|------|-----------------|
| CS1 | Net Promoter Score (NPS) | % Promotores (9-10) - % Detractores (0-6) | > 50 | Encuesta post-compra |
| CS2 | Calificación promedio de productos | Suma de ratings / Número de reviews | > 4.0 / 5 | BD `reviews.rating` |
| CS3 | Tasa de aprobación de reviews | Reviews aprobadas / Total de reviews enviadas | > 80% | BD `reviews.isApproved` |
| CS4 | Tiempo de entrega percibido | Días desde compra hasta entrega según el cliente | < 5 días | BD `orders.deliveredAt - orders.createdAt` |
| CS5 | Tasa de consultas post-venta | Consultas de soporte / Total de pedidos × 100 | < 10% | Sistema de soporte |
| CS6 | Tasa de resolución en primer contacto | Consultas resueltas sin escalación / Total de consultas × 100 | > 70% | Sistema de soporte |
| CS7 | Satisfacción con el pago | Clientes que completan el pago / Clientes que inician checkout × 100 | > 70% | BD `orders` vs `abandoned_checkouts` |
| CS8 | Tasa de suscripción al newsletter | Suscriptores nuevos / Total de visitas únicas × 100 | > 3% | BD `newsletter_subscribers` + analytics |
| CS9 | Tasa de quejas por producto | Quejas recibidas / Unidades vendidas del producto × 100 | < 1% | BD `returns.reason` + soporte |
| CS10 | Retención de clientes a 90 días | Clientes que compraron en los últimos 90 días / Total de clientes que compraron hace 90+ días × 100 | > 30% | BD `orders` agrupado por fecha |
| CS11 | Tasa de recompra | Clientes con 2+ pedidos en los últimos 6 meses / Total de clientes con al menos 1 pedido × 100 | > 25% | BD `orders` |
| CS12 | Tiempo promedio entre compras | Días promedio entre el pedido N y el pedido N+1 del mismo cliente | < 45 días | BD `orders` |

---

## Resumen Visual

```
┌──────────────────────────────────────────────────────────┐
│                    TABLERO DE COMANDOS                    │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TÉCNICOS          CALIDAD           OPERATIVOS          │
│  ─────────         ────────          ──────────          │
│  Disponibilidad    Cobertura code    Ticket promedio     │
│  Tiempo respuesta  Bugs en prod      Tasa conversión     │
│  Uso CPU/RAM       Deuda técnica     Tiempo preparación  │
│  Errores servidor  Builds exitosos   Checkouts aband.    │
│                                                          │
│  SEGURIDAD         FINANCIEROS       SATISFACCIÓN        │
│  ─────────         ───────────       ────────────        │
│  Login fallidos    Ingresos brutos   NPS                 │
│  2FA admin         Margen bruto      Rating productos    │
│  Vuln. depend.     LTV / CAC         Tiempo entrega      │
│  Rate limiting     Recurrencia       Retención 90 días   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Frecuencia de Medición

| Categoría | Frecuencia | Responsable |
|-----------|------------|-------------|
| Técnicos | Diaria / en tiempo real | DevOps / Desarrollador |
| Calidad | Semanal (sprint) | Desarrollador |
| Operativos | Diaria | Gerente de operaciones / WMS |
| Seguridad | Semanal + alertas en tiempo real | DevOps / Administrador |
| Financieros | Semanal / Mensual | Gerente / Contabilidad |
| Satisfacción | Mensual / Trimestral | Marketing / Atención al cliente |
