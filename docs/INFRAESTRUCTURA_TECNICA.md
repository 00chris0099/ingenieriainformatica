# Infraestructura Técnica: Hardware y Redes

## ADRISU KIDS — Plataforma E-commerce + WMS

---

## 1. Descripción General de la Infraestructura

El sistema ADRISU KIDS se compone de una plataforma web (tienda virtual + panel de administración WMS) que requiere infraestructura de hardware y redes para su funcionamiento. Este documento describe los equipos, dispositivos de red y topología física necesarios para soportar la operación del negocio.

---

## 2. Equipos de Hardware Requeridos

### 2.1 Servidor Principal (Backend + Base de Datos)

| Componente | Especificación |
|-----------|---------------|
| **Tipo** | Servidor rack 1U o torre |
| **Procesador** | Intel Xeon E-2336 (6 núcleos / 12 hilos) o AMD Ryzen 7 5800X |
| **Memoria RAM** | 16 GB DDR4 ECC (expandible a 64 GB) |
| **Almacenamiento** | 2x 480 GB SSD NVMe en RAID 1 (espejo) |
| **Red** | 2x Gigabit Ethernet (1GbE) integradas |
| **Fuente** | 450W 80+ Gold, redundante |
| **Sistema operativo** | Ubuntu Server 22.04 LTS |
| **Uso** | Ejecutar Docker con PostgreSQL, Redis, WMS, Tienda, Sync Worker y Nginx |

**Justificación:** Este servidor ejecuta todos los contenedores del sistema. La RAID 1 en SSDs protege contra fallos de disco manteniendo redundancia. La RAM de 16 GB es suficiente para manejar las 6 aplicaciones concurrentes con margen para crecimiento.

### 2.2 Equipo de Desarrollo / Administración

| Componente | Especificación |
|-----------|---------------|
| **Tipo** | Computadora de escritorio o laptop |
| **Procesador** | Intel Core i5 / AMD Ryzen 5 o superior |
| **Memoria RAM** | 16 GB DDR4 |
| **Almacenamiento** | 512 GB SSD |
| **Red** | Gigabit Ethernet + WiFi 6 |
| **Sistema operativo** | Windows 11 / macOS / Linux |
| **Uso** | Desarrollo, pruebas, administración del servidor, acceso al panel WMS |

### 2.3 Equipos de Punto de Venta (Opcional - Futuro)

| Componente | Especificación |
|-----------|---------------|
| **Tipo** | Computadora compacta o tablet |
| **Conexión** | WiFi o Ethernet |
| **Uso** | Consulta de inventario, generación de pedidos desde tienda física |

---

## 3. Dispositivos de Red

### 3.1 Router Principal

| Componente | Especificación |
|-----------|---------------|
| **Modelo sugerido** | TP-Link Archer AX50 / Cisco RV340 |
| **Estándar WiFi** | WiFi 6 (802.11ax) |
| **Puertos LAN** | 4x Gigabit Ethernet |
| **Puertos WAN** | 1x Gigabit Ethernet |
| **Firewall** | SPI, NAPT, control de acceso por IP |
| **VPN** | Soporte IPSec / OpenVPN (acceso remoto al servidor) |
| **Función** | Gateway de Internet, DHCP, DNS, acceso a internet para toda la red |

### 3.2 Switch de Red

| Componente | Especificación |
|-----------|---------------|
| **Modelo sugerido** | TP-Link TL-SG1016D / Netgear GS316 |
| **Puertos** | 16 puertos Gigabit Ethernet (10/100/1000 Mbps) |
| **Función** | Conexión cableada del servidor, PCs de administración y otros equipos fijos |

### 3.3 Access Point WiFi (Opcional)

| Componente | Especificación |
|-----------|---------------|
| **Modelo sugerido** | TP-Link EAP245 / Ubiquiti UniFi AP |
| **Estándar** | WiFi 5 (802.11ac) o WiFi 6 |
| **Función** | Conexión inalámbrica para dispositivos móviles y equipos de punto de venta |

### 3.4 Módem / ONT (del ISP)

| Componente | Especificación |
|-----------|---------------|
| **Proveedor** | Claro, Movistar, Bitel o similar (Perú) |
| **Velocidad mínima** | 50 Mbps bajada / 10 Mbps subida |
| **Conexión** | FTTH (Fibra óptica) o HFC (Cable) |
| **Función** | Conexión a Internet de la red local |

---

## 4. Topología de Red Física

### 4.1 Diagrama de Conexiones

```
                         ┌─────────────┐
                         │  INTERNET   │
                         │  (ISP)     │
                         └──────┬──────┘
                                │
                         ┌──────▼──────┐
                         │   MODEM /   │
                         │    ONT      │
                         │ (Fibra/Cable)│
                         └──────┬──────┘
                                │ Cable WAN
                                │
                         ┌──────▼──────┐
                         │   ROUTER    │
                         │  Principal  │
                         │  (WiFi 6)   │
                         └──┬───────┬──┘
                            │       │
              Cable LAN 1   │       │  Cable LAN 2
              (a servidor)  │       │  (a switch)
                            │       │
                   ┌────────▼┐    ┌─▼──────────┐
                   │ SERVIDOR │    │   SWITCH    │
                   │ Principal│    │  16 puertos │
                   │          │    │  Gigabit    │
                   │ Ubuntu   │    └──┬────┬──┬──┘
                   │ Server   │       │    │  │
                   └──────────┘       │    │  │
                                      │    │  │
                         Cable LAN    │    │  │
                         (PC Admin)   │    │  │
                                      │    │  │
                              ┌───────▼┐ ┌─▼──▼────┐
                              │   PC   │ │  WiFi   │
                              │  Admin │ │  AP     │
                              │(Escritorio)│ │(Opcional)│
                              └────────┘ └────┬────┘
                                              │
                                       ┌──────▼──────┐
                                       │  Dispositivos│
                                       │  Móviles /   │
                                       │  POS futuro  │
                                       └─────────────┘
```

### 4.2 Conexiones del Servidor

El servidor principal se conecta a la red de la siguiente manera:

| Puerto de Red | Conexión | Función |
|--------------|----------|---------|
| eth0 (principal) | Switch → Router | Servicios web accesibles por Internet |
| eth1 (respaldo) | Switch → Router | Redundancia de enlace (failover) |

---

## 5. Plan de Direcciones IP

### 5.1 Segmento de Red

| Parámetro | Valor |
|-----------|-------|
| **Red** | 192.168.1.0 |
| **Máscara de subred** | 255.255.255.0 (/24) |
| **Gateway** | 192.168.1.1 (Router) |
| **Rango DHCP** | 192.168.1.100 – 192.168.1.200 |
| **Rango estático** | 192.168.1.2 – 192.168.1.50 |

### 5.2 Asignación de Direcciones IP

| Dispositivo | IP Asignada | Tipo | Descripción |
|------------|-------------|------|-------------|
| Router | 192.168.1.1 | Gateway | Gateway de la red local |
| Servidor Principal | 192.168.1.10 | Estática | Backend + Base de datos |
| PC Administración | 192.168.1.20 | Estática | Equipo de desarrollo/admin |
| Access Point WiFi | 192.168.1.25 | Estática | Punto de acceso inalámbrico |
| Impresora red | 192.168.1.30 | Estática | Impresora de etiquetas/guías (futuro) |
| Dispositivos clientes | 192.168.1.100–200 | DHCP | Laptops, tablets, móviles |

### 5.3 Puertos del Servidor (Mapeo Externo → Interno)

| Servicio | Puerto Externo (Nginx) | Puerto Interno (Docker) | Acceso |
|----------|----------------------|------------------------|--------|
| Tienda Virtual | 80 / 443 | 3001 | Público (Internet) |
| WMS Admin | 80 / 443 (subdominio) | 3000 | Público (Internet) |
| PostgreSQL | — | 5432 | Solo red local |
| Redis | — | 6379 | Solo red local |

---

## 6. Conectividad a Internet

### 6.1 Requisitos del Servicio de Internet

| Parámetro | Mínimo | Recomendado |
|-----------|--------|-------------|
| **Velocidad de bajada** | 30 Mbps | 100 Mbps |
| **Velocidad de subida** | 5 Mbps | 20 Mbps |
| **Tipo de conexión** | FTTH (Fibra óptica) | FTTH dedicada |
| **IP pública** | Dinámica (con DDNS) | Estática |
| **Latencia** | < 50 ms | < 20 ms |
| **Disponibilidad** | 99% | 99.9% |

### 6.2 Configuración de Acceso Externo

```
Internet → IP Pública del ISP → Router (puerto 80/443) → Servidor (Nginx)
                                                              │
                                                    ┌─────────┼─────────┐
                                                    │         │         │
                                              adriskids.com  admin.adriskids.com
                                              (Tienda)       (WMS Admin)
```

Para acceder al sistema desde Internet se requiere:
1. **IP pública** estática o DNS dinámico (DDNS)
- Ejemplo: `adriskids.ddns.net` apuntando a la IP del ISP
2. **Puertos abiertos** en el router: 80 (HTTP) y 443 (HTTPS)
3. **Certificado SSL/TLS** para tráfico cifrado (Let's Encrypt)
4. **Reglas de reenvío de puertos** (Port Forwarding) en el router

### 6.3 Configuración del Router (Port Forwarding)

| Regla | Puerto Externo | IP Interna | Puerto Interno | Protocolo |
|-------|---------------|------------|---------------|-----------|
| HTTP → Nginx | 80 | 192.168.1.10 | 80 | TCP |
| HTTPS → Nginx | 443 | 192.168.1.10 | 443 | TCP |

---

## 7. Seguridad de la Red

### 7.1 Firewall del Router

| Regla | Dirección | Puerto | Acción | Descripción |
|-------|-----------|--------|--------|-------------|
| Allow HTTP | Entrada | 80 | Permitir | Tráfico web público |
| Allow HTTPS | Entrada | 443 | Permitir | Tráfico web cifrado |
| Allow SSH | Entrada | 22 | Limitar IPs | Administración remota (solo IP del admin) |
| Block PostgreSQL | Entrada | 5432 | Bloquear | Base de datos NO accesible desde Internet |
| Block Redis | Entrada | 6379 | Bloquear | Caché NO accesible desde Internet |
| Allow All Out | Salida | Todos | Permitir | Acceso a Internet desde la red local |

### 7.2 Seguridad del Servidor (Ubuntu)

| Medida | Implementación |
|--------|---------------|
| **SSH** | Solo acceso con llave pública, desactivar login con contraseña |
| **UFW (Firewall local)** | Solo puertos 80, 443, 22 abiertos |
| **Fail2ban** | Bloqueo automático tras 5 intentos fallidos |
| **Actualizaciones** | `unattended-upgrades` para parches de seguridad |
| **Usuarios** | Desactivar root login, crear usuario administrador con sudo |

### 7.3 Configuración UFW (Servidor)

```bash
# Reglas del firewall del servidor
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH (solo IP del admin)
ufw allow 80/tcp      # HTTP (Nginx)
ufw allow 443/tcp     # HTTPS (Nginx)
ufw enable
```

---

## 8. Seguridad Física

### 8.1 Ubicación del Servidor

| Medida | Descripción |
|--------|-------------|
| **Espacio** | Sala de servidores o rack cerrado con llave |
| **Temperatura** | 18–24°C, aire acondicionado |
| **Humedad** | 40–60% relativa |
| **Alimentación eléctrica** | Circuito dedicado, breaker protegido |
| **UPS** | SAI/UPS de 1000VA mínimo (respaldo 15–30 min) |
| **Regleta** | Regleta con protección contra picos de voltaje |
| **Iluminación** | Mínima, para reducir calor |
| **Acceso** | Restringido solo a personal autorizado |

### 8.2 UPS (SAI)

| Componente | Especificación |
|-----------|---------------|
| **Capacidad** | 1000VA / 600W mínimo |
| **Autonomía** | 15–30 minutos con carga completa |
| **Función** | Proteger contra cortes y fluctuaciones eléctricas |
| **Modelo sugerido** | APC Back-UPS Pro 1500 / CyberPower 1000VA |

---

## 9. Cableado de Red

### 9.1 Tipos de Cable

| Tipo | Uso | Longitud máxima |
|------|-----|----------------|
| **Cat 6 UTP** | Conexión servidor → Switch | 100 metros |
| **Cat 6 UTP** | Conexión Switch → Router | 100 metros |
| **Cat 6 UTP** | Conexión Switch → PC Admin | 100 metros |
| **Fibra óptica multimodo** | Uso futuro (si se expande) | 300 metros |

### 9.2 Conectores y Herramientas

| Elemento | Cantidad estimada |
|---------|------------------|
| Conectores RJ45 | 10 |
| Cable Cat 6 (rollo) | 50 metros |
| Crimpadora de red | 1 herramienta |
| Tester de red | 1 herramienta |
| Patch panel (opcional) | 1 de 12 puertos |

### 9.3 Estandar de Cableado

- Utilizar estándar **T568B** en todos los conectores
- Mantener cables separados de fuentes de alimentación eléctrica
- Etiquetar cada extremo del cable con identificación del dispositivo
- Evitar ángulos agudos en las conexiones
- Usar bridas o canaletas para organizar el cableado

---

## 10. Diagrama Completo de la Red

```
┌────────────────────────────────────────────────────────────────────────┐
│                         RED FÍSICA - ADRISU KIDS                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   EXTERNO (INTERNET)                                                  │
│   ═══════════════════                                                 │
│                                                                        │
│        ┌──────────────────┐                                           │
│        │   ISP (Claro /   │                                           │
│        │   Movistar)      │                                           │
│        │   Fibra Óptica   │                                           │
│        └────────┬─────────┘                                           │
│                 │ Cable coaxial / Fibra                                │
│                 │                                                      │
│   INTERNO (RED LOCAL)                                                  │
│   ═══════════════════                                                 │
│                                                                        │
│        ┌──────────────────┐                                           │
│        │     MODEM /      │                                           │
│        │      ONT         │  IP pública del ISP                        │
│        │  (Fibra/Cable)   │                                           │
│        └────────┬─────────┘                                           │
│                 │ Cable WAN                                            │
│                 │                                                      │
│        ┌────────▼─────────┐                                           │
│        │     ROUTER       │  192.168.1.1                               │
│        │   WiFi 6 AX      │  Gateway + DHCP + Firewall                │
│        │  TP-Link AX50    │  Port Forwarding: 80, 443                 │
│        └──┬────┬──────┬───┘                                           │
│           │    │      │                                               │
│           │    │      └──────────────────────┐                        │
│           │    │                             │                         │
│     Cable │    │ Cable LAN                   │ Cable LAN               │
│     LAN   │    │ (a Switch)                  │ (WiFi AP)              │
│     (srv) │    │                             │                        │
│           │    │                             │                        │
│  ┌────────▼┐   │   ┌──────────────────────┐ │                        │
│  │SERVIDOR │   │   │      SWITCH          │ │                        │
│  │Principal│   │   │   16 puertos         │ │                        │
│  │         │   │   │   Gigabit            │ │                        │
│  │Ubuntu   │   │   │   TP-Link SG1016D    │ │                        │
│  │Server   │   │   └──┬────┬────┬────┬───┘ │                        │
│  │         │   │      │    │    │    │      │                        │
│  │192.168  │   │      │    │    │    │      │                        │
│  │  .1.10  │   │      │    │    │    └──────┤                        │
│  └─────────┘   │      │    │    │           │                        │
│                │      │    │    │           │                        │
│  ┌─────────────┘      │    │    │    ┌──────▼──────────┐            │
│  │                    │    │    │    │  ACCESS POINT    │            │
│  │                    │    │    │    │  WiFi 5/6        │            │
│  │                    │    │    │    │  192.168.1.25    │            │
│  │                    │    │    │    └────────┬─────────┘            │
│  │                    │    │    │             │                      │
│  │                    │    │    │             │ WiFi                 │
│  │                    │    │    │             │                      │
│  │                    │    │    │    ┌────────▼─────────┐            │
│  │                    │    │    │    │  Dispositivos    │            │
│  │                    │    │    │    │  móviles / POS   │            │
│  │                    │    │    │    │  (DHCP)          │            │
│  │                    │    │    │    └──────────────────┘            │
│  │                    │    │    │                                    │
│  └────────────────────┘    │    │                                    │
│                            │    │                                    │
│                     ┌──────▼┐ ┌─▼──────┐                             │
│                     │  PC   │ │Impresora│                             │
│                     │ Admin │ │  (red)  │                             │
│                     │192.168│ │192.168  │                             │
│                     │ .1.20 │ │ .1.30   │                             │
│                     └───────┘ └─────────┘                             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 11. Servicios Corriendo en el Servidor

### 11.1 Diagrama de Servicios (Docker)

```
SERVIDOR (192.168.1.10)
│
├── Docker Engine
│   │
│   ├── Contenedor: adris-nginx
│   │   ├── Puerto 80 (HTTP)
│   │   ├── Puerto 443 (HTTPS)
│   │   └── Función: Reverse proxy, SSL, seguridad
│   │
│   ├── Contenedor: adris-wms
│   │   ├── Puerto interno: 3000
│   │   └── Función: Panel de administración (Next.js)
│   │
│   ├── Contenedor: adris-tienda
│   │   ├── Puerto interno: 3001
│   │   └── Función: Tienda virtual pública (Next.js)
│   │
│   ├── Contenedor: adris-postgres
│   │   ├── Puerto interno: 5432
│   │   ├── Bases: wms_db + store_db
│   │   └── Datos: Volumen persistente
│   │
│   ├── Contenedor: adris-redis
│   │   ├── Puerto interno: 6379
│   │   └── Función: Caché, rate limiting
│   │
│   └── Contenedor: adris-sync
│       ├── Sin puertos expuestos
│       └── Función: Sincronización WMS → Tienda
│
└── Red Docker: adris-network (bridge)
    └── Todos los contenedores interconectados
```

---

## 12. Presupuesto Estimado de Hardware

### 12.1 Opción Mínima (Desarrollo / Pruebas)

| Equipo | Modelo sugerido | Precio estimado (USD) |
|--------|----------------|----------------------|
| Servidor | PC con Ryzen 5 + 16GB RAM + 512GB SSD | $500 – $700 |
| Router | TP-Link Archer AX3000 | $80 – $120 |
| Switch | TP-Link TL-SG1008D (8 puertos) | $25 – $40 |
| Cableado Cat 6 | Rollo 50m + conectores | $30 – $50 |
| UPS | APC Back-UPS 600VA | $60 – $90 |
| **Total** | | **$695 – $1,000** |

### 12.2 Opción Recomendada (Producción Pequeña)

| Equipo | Modelo sugerido | Precio estimado (USD) |
|--------|----------------|----------------------|
| Servidor | Dell PowerEdge T150 / HP ProLiant ML30 | $1,200 – $2,000 |
| Router | Cisco RV340 | $300 – $450 |
| Switch | TP-Link TL-SG1016D (16 puertos) | $60 – $90 |
| Access Point | Ubiquiti UniFi AP AC Lite | $80 – $120 |
| Cableado Cat 6 | Rollo 100m + patch panel | $60 – $100 |
| UPS | APC Back-UPS Pro 1500VA | $200 – $300 |
| Rack pequeño (8U) | TP-Link / StarTech | $150 – $250 |
| **Total** | | **$2,050 – $3,310** |

### 12.3 Costo Mensual de Internet

| Proveedor (Perú) | Plan | Precio mensual (S/) |
|-------------------|------|---------------------|
| Claro | Fibra 100 Mbps | S/ 120 – S/ 180 |
| Movistar | Fibra 100 Mbps | S/ 110 – S/ 170 |
| Bitel | Fibra 100 Mbps | S/ 90 – S/ 140 |

---

## 13. Flujo de Datos por la Red

### 13.1 Acceso de un Cliente a la Tienda

```
1. Cliente (celular/PC) → WiFi/Datos móviles → Internet
2. Internet → ISP → IP pública → Router (puerto 443)
3. Router → Servidor 192.168.1.10:443 → Nginx
4. Nginx → SSL termination → adriskids.com
5. Nginx → proxy_pass → adris-tienda:3001
6. Tienda → PostgreSQL (wms_db) → Consulta productos
7. Tienda → Redis → Caché de catálogo
8. Respuesta → reversa → Cliente ve la tienda
```

### 13.2 Un Pedido Pasa por la Siguientes Redes

```
1. Cliente compra en tienda → POST /api/orders
2. Tienda → PostgreSQL → Inserta pedido
3. Sync Worker detecta evento → Replica a WMS
4. WMS recibe pedido → Notifica al admin
5. Admin gestiona pedido en WMS → Actualiza estado
6. WMS → PostgreSQL → Actualiza inventario
7. WMS → Shalom API (HTTPS) → Genera guía de envío
8. WMS → Telegram Bot (HTTPS) → Notifica al equipo
9. WMS → SUNAT API (HTTPS) → Emite factura electrónica
```

---

## 14. Mantenimiento de la Infraestructura

### 14.1 Tareas Periódicas

| Tarea | Frecuencia | Responsable |
|-------|------------|-------------|
| Actualizar sistema operativo del servidor | Mensual | Administrador |
| Actualizar Docker y contenedores | Mensual | Administrador |
| Revisar logs de errores | Semanal | Administrador |
| Backup de bases de datos | Diario (automático) | Automatizado |
| Verificar UPS / batería | Trimestral | Administrador |
| Limpiar polvo del hardware | Trimestral | Administrador |
| Revisar certificados SSL | Antes de expirar | Automatizado (Let's Encrypt) |
| Revisar espacio en disco | Semanal | Administrador |
| Probar restore de backups | Mensual | Administrador |

### 14.2 Monitoreo

| Herramienta | Función |
|-------------|---------|
| `htop` / `glances` | Monitoreo de CPU, RAM, disco en tiempo real |
| Docker stats | Uso de recursos por contenedor |
| Uptime Kuma (opcional) | Alerta si el servidor cae |
| Grafana + Prometheus (opcional) | Dashboard de métricas histórico |

---

## 15. Plan de Continuidad ante Desastres

| Escenario | Acción | Tiempo de recuperación |
|-----------|--------|----------------------|
| Caída del servidor | Restaurar en equipo de respaldo con backups | 1–4 horas |
| Fallo de disco | RAID 1 mantiene operación, reemplazar disco | Sin downtime |
| Caída de Internet | El sistema queda inaccesible, pedidos pendientes | Hasta restaurar conexión |
| Corte eléctrico | UPS mantiene servidor 15–30 min, apagado seguro | Automático |
| Borrado accidental de DB | Restaurar desde backup diario | 30 min – 2 horas |

---

*Documento de Infraestructura Técnica — Hardware y Redes*
*ADRISU KIDS — Julio 2026*
