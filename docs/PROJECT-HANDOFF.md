# Manual de Usuario - ADRISU KIDS

> **Sistema**: WMS (Panel de Administracion) + Tienda Virtual
> **URLs**:
> - WMS: https://tiendavirtual-adrisuestesiwms.jpq6em.easypanel.host
> - Tienda: https://tiendavirtual-tiendaadrisuk.jpq6em.easypanel.host

---

## PARTE 1: PANEL DE ADMINISTRACION (WMS)

### 1.1 Inicio de Sesion

1. Abre el navegador y ve a la URL del WMS
2. Ingresa tu email y contrasena
3. Haz clic en "Iniciar Sesion"

> **[CAPTURA]**: Pantalla de login

---

### 1.2 Dashboard Principal

Al iniciar sesion, ves el dashboard con:

- **Resumen del dia**: Pedidos nuevos, ingresos, productos con stock bajo
- **Grafico de ventas**: Ventas de los ultimos meses
- **Pedidos recientes**: Ultimos pedidos con estado
- **Productos con stock bajo**: Alertas de reabastecimiento

> **[CAPTURA]**: Dashboard principal con todos los widgets visibles

---

### 1.3 Gestion de Productos

#### Ver productos
1. Haz clic en **Catalogo** en el menu lateral
2. Ves la lista de todos los productos con imagen, nombre, precio y stock
3. Usa la barra de busqueda para encontrar un producto especifico

> **[CAPTURA]**: Lista de productos en el catalogo

#### Crear un producto nuevo
1. Haz clic en **"+ Nuevo Producto"**
2. Completa la pestana **Informacion**:
   - Nombre del producto
   - SKU (se genera automaticamente si lo dejas vacio)
   - Descripcion
   - Categoria
   - Marca, dimensiones, peso, color
3. Ve a la pestana **Precios**:
   - Precio principal
   - Precio especial (opcional)
   - Descuento por porcentaje (opcional)
   - Precio mayorista (opcional)
4. Ve a la pestana **Variantes** si el producto tiene tallas o colores
5. Haz clic en **"Guardar"**

> **[CAPTURA]**: Formulario de nuevo producto con pestanas visibles
> **[CAPTURA]**: Pestana de precios con descuento configurado

#### Editar un producto
1. En la lista de productos, haz clic en el icono de editar (lapiz)
2. Modifica los campos que necesites
3. Haz clic en **"Guardar"**

#### Cambiar precio de un producto
1. Entra al producto
2. Ve a la pestana **Precios**
3. Cambia el precio principal
4. Haz clic en **"Guardar"**

> **[CAPTURA]**: Producto con precio y descuento configurado

---

### 1.4 Gestion de Pedidos

#### Ver pedidos
1. Haz clic en **Pedidos** en el menu lateral
2. Ves la lista de todos los pedidos con numero, cliente, total y estado
3. Filtra por estado: Pendientes, En proceso, Enviados, Entregados

> **[CAPTURA]**: Lista de pedidos con filtros

#### Ver detalle de un pedido
1. Haz clic en el numero de pedido
2. Ves:
   - **Timeline**: Los 9 pasos del pedido (Pendiente → Confirmado → ... → Entregado)
   - **Cliente**: Nombre, telefono, email
   - **Direccion de envio**
   - **Productos**: Lista con cantidades y precios
   - **Resumen**: Subtotal, IGV, envio, total

> **[CAPTURA]**: Detalle de pedido con timeline visible

#### Cambiar estado de un pedido
1. Entra al detalle del pedido
2. Haz clic en el boton del siguiente estado disponible
3. El timeline se actualiza automaticamente

**Flujo de estados:**
```
Pendiente → Confirmado → Procesando → Picking → Packing → Listo para Enviar → Enviado → En Transito → Entregado
```

> **[CAPTURA]**: Boton de cambio de estado

#### Preparar pedido (Picking)
1. Entra al pedido que esta en estado "Procesando"
2. Haz clic en **"Ir a Picking"**
3. Escanea o ingresa el SKU de cada producto
4. Marca cada producto conforme lo vas empacando
5. Cuando todos estan marcados, haz clic en **"Completar Picking"**

> **[CAPTURA]**: Estacion de picking con productos marcados

#### Empacar pedido (Packing)
1. Entra al pedido que esta en estado "Picking"
2. Haz clic en **"Ir a Packing"**
3. Verifica cada producto escaneando o marcando
4. Haz clic en **"Imprimir Etiqueta"** para generar la etiqueta de envio
5. Haz clic en **"Generar Guia de Remision"** para la guia del transportista
6. Cuando todo esta verificado, haz clic en **"Marcar como Listo para Envio"**

> **[CAPTURA]**: Estacion de packing con productos verificados
> **[CAPTURA]**: Boton de imprimir etiqueta

---

### 1.5 Gestion de Inventario

#### Ver inventario
1. Haz clic en **Inventario** en el menu lateral
2. Ves la lista de productos con su stock actual
3. Puedes editar el stock directamente haciendo clic en el numero

> **[CAPTURA]**: Lista de inventario con stock visible

#### Ajustar stock
1. En la lista de inventario, haz clic en el numero de stock de un producto
2. Ingresa la nueva cantidad
3. Confirma el cambio

> **[CAPTURA]**: Modal de ajuste de stock

#### Transferir productos entre almacenes
1. Haz clic en **Inventario > Nueva Transferencia**
2. Selecciona el producto
3. Selecciona el almacén de origen
4. Selecciona el almacén de destino
5. Ingresa la cantidad
6. Confirma la transferencia

> **[CAPTURA]**: Formulario de transferencia

---

### 1.6 Gestion de Clientes

#### Ver clientes
1. Haz clic en **Clientes** en el menu lateral
2. Ves la lista de clientes con nombre, email y telefono
3. Busca un cliente por nombre o email

> **[CAPTURA]**: Lista de clientes

#### Crear un cliente
1. Haz clic en **"+ Nuevo Cliente"**
2. Completa: nombre, email, telefono, direccion
3. Haz clic en **"Guardar"**

#### Ver historial de un cliente
1. Haz clic en el nombre del cliente
2. Ves sus datos personales y pedidos anteriores

> **[CAPTURA]**: Formulario de nuevo cliente

---

### 1.7 Facturacion

#### Ver facturas
1. Haz clic en **Facturacion** en el menu lateral
2. Ves la lista de comprobantes emitidos
3. Filtra por estado: Borrador, Emitida, Pagada, Anulada

> **[CAPTURA]**: Lista de facturas

#### Crear una factura
1. Haz clic en **"+ Nuevo Comprobante"**
2. Selecciona el tipo: **Factura** o **Boleta**
3. Selecciona el cliente
4. Agrega los productos con cantidades y precios
5. El IGV (18%) se calcula automaticamente
6. Haz clic en **"Guardar Borrador"**
7. Para enviar a SUNAT, haz clic en **"Enviar a Nubefact"**

> **[CAPTURA]**: Modal de nuevo comprobante con IGV calculado
> **[CAPTURA]**: Factura enviada con estado "Emitida"

#### Descargar factura en PDF
1. En la lista de facturas, haz clic en el icono de ojo (ver)
2. Se abre el PDF de la factura con formato profesional

> **[CAPTURA]**: PDF de factura con logo y datos

---

### 1.8 Reportes

#### Ver reportes
1. Haz clic en **Reportes** en el menu lateral
2. Selecciona el tipo de reporte:
   - **General**: KPIs y resumen del negocio
   - **IGV**: Desglose de impuestos
   - **Proveedores**: Compras por proveedor
   - **Margenes**: Rentabilidad por producto
   - **Inventario**: Valorizacion de stock

> **[CAPTURA]**: Reporte general con graficos
> **[CAPTURA]**: Reporte de IGV con desglose mensual

#### Exportar a Excel
1. En cualquier reporte, haz clic en **"Exportar"**
2. Se descarga un archivo Excel con los datos

---

### 1.9 Cupones de Descuento

#### Crear un cupon
1. Haz clic en **Cupones** en el menu lateral
2. Haz clic en **"+ Nuevo Cupon"**
3. Completa:
   - Codigo (ej: NAVIDAD10)
   - Tipo: Porcentaje o Monto fijo
   - Valor del descuento
   - Compra minima (opcional)
   - Descuento maximo (opcional)
   - Limite de usos (opcional)
   - Fechas de validez
4. Haz clic en **"Crear Cupon"**

> **[CAPTURA]**: Formulario de nuevo cupon con todos los campos

---

### 1.10 Notificaciones

- Haz clic en la **campanita** en la esquina superior derecha
- Ves las notificaciones de nuevos pedidos, cambios de estado, alertas de stock
- Haz clic en "Marcar todo leido" para limpiar

> **[CAPTURA]**: Dropdown de notificaciones abierto

---

## PARTE 2: TIENDA VIRTUAL (Cliente)

### 2.1 Navegar la Tienda

1. Abre la URL de la tienda
2. Usa la **barra de busqueda** para encontrar productos
3. Usa los **filtros de categoria** (Camas, Sillas, Carritos, etc.)
4. Ordena por: Mas recientes, Precio (mayor/menor), Nombre

> **[CAPTURA]**: Pagina principal de la tienda con productos

### 2.2 Ver un Producto

1. Haz clic en cualquier producto
2. Ves:
   - **Imagenes** del producto (puedes cambiar entre ellas)
   - **Nombre y precio** (con descuento si aplica)
   - **Descripcion** detallada
   - **Variantes** (si tiene tallas o colores)
   - **Stock disponible**
   - ** boton "Lo quiero ahora!"**

> **[CAPTURA]**: Pagina de producto con variantes y precio

### 2.3 Agregar al Carrito

1. Selecciona la variante si aplica (talla, color)
2. Haz clic en **"Lo quiero ahora!"**
3. El carrito se abre como panel lateral
4. Puedes modificar cantidades o eliminar productos

> **[CAPTURA]**: Panel lateral del carrito con productos

### 2.4 Comprar (Checkout)

#### Paso 1: Carrito
- Revisa los productos, cantidades y subtotal
- Haz clic en **"Continuar compra"**

#### Paso 2: Informacion
- Ingresa tus datos: nombre, email, telefono
- Selecciona o ingresa la direccion de envio
- Haz clic en **"Continuar al pago"**

#### Paso 3: Pago
Elige tu metodo de pago:
- **MercadoPago**: Paga con tarjeta de credito o debito
- **Yape**: Escanea el codigo QR y paga desde tu celular
- **Plin**: Escanea el codigo QR y paga desde tu celular
- **Contraentrega**: Paga en efectivo cuando recibas el pedido (solo Lima)

> **[CAPTURA]**: Paso de pago con opciones de MercadoPago, Yape y Plin

#### Paso 4: Confirmacion
- Ves el resumen de tu pedido
- Recibes el **numero de pedido** para dar seguimiento
- Recibes un **email de confirmacion**

> **[CAPTURA]**: Pagina de confirmacion con numero de pedido

### 2.5 Seguir tu Pedido

1. Ve a **/pedido** o usa el link del email
2. Ingresa tu numero de pedido (ej: ADR-20260715-abc12)
3. Haz clic en **"Buscar"**
4. Ves el **timeline** con el estado actual de tu pedido

> **[CAPTURA]**: Pagina de seguimiento con timeline

### 2.6 Preguntas Frecuentes

1. Ve a **/faq**
2. Encuentra respuestas sobre envios, pagos, garantia, devoluciones
3. Las preguntas estan organizadas por categoria

> **[CAPTURA]**: Pagina de FAQ con categorias

---

## PARTE 3: TAREAS COMUNES

### Crear un producto paso a paso
1. WMS → Catalogo → Nuevo Producto
2. Llenar informacion basica
3. Agregar precio
4. Agregar variantes si aplica
5. Guardar
6. Verificar que aparece en la tienda

### Procesar un pedido de principio a fin
1. WMS → Pedidos → Ver pedido nuevo
2. Cambiar a "Confirmado"
3. Cambiar a "Procesando"
4. Ir a Picking → Escanear productos
5. Ir a Packing → Verificar → Imprimir etiqueta
6. Cambiar a "Listo para Enviar"
7. Cambiar a "Enviado" (cuando el transportista lo recoja)
8. Cambiar a "Entregado" (cuando el cliente lo reciba)

### Crear una factura
1. WMS → Facturacion → Nuevo Comprobante
2. Seleccionar tipo (Factura o Boleta)
3. Seleccionar cliente
4. Agregar productos
5. Guardar borrador
6. Enviar a Nubefact
7. Descargar PDF

### Responder un reclamo de devolucion
1. WMS → Devoluciones → Nueva Devolucion
2. Ingresar numero de pedido
3. Ingresar motivo de la devolucion
4. Cambiar estado a "Inspeccionando" cuando llegue el producto
5. Cambiar a "Aprobada" o "Rechazada"
6. Si se aprueba, procesar reembolso

---

## PARTE 4: CONFIGURACION INICIAL

### Datos de la empresa (configurar en WMS → Configuracion)
- **Nombre**: ADRISU KIDS
- **RUC**: 10730431746
- **Direccion**: Av. Industrial 123, Lima
- **Telefono**: 999 111 222
- **Moneda**: Soles (PEN)

### Usuarios iniciales
- **Admin**: Crear desde WMS → Usuarios → Nuevo Usuario
- **Rol**: Super Admin o Admin

### Productos iniciales
- El sistema viene con 18 productos de ejemplo (muebles para bebes)
- Puedes editarlos o crear nuevos desde Catalogo

### Configurar Nubefact (Facturacion)
1. Crear cuenta en https://www.nubefact.com/registro
2. Obtener token de la API
3. Configurar en WMS → Variables de entorno:
   - `NUBEFACT_TOKEN=tu_token`
   - `NUBEFACT_URL=https://demo.nubefact.com/api/v1`

### Configurar MercadoPago (Pagos)
1. Crear cuenta en https://www.mercadopago.com
2. Obtener credenciales de produccion
3. Configurar en las variables de entorno de ambos servicios

---

## PARTE 5: SOLUCION DE PROBLEMAS COMUNES

### No se ven los productos en la tienda
- Verificar que el producto tenga estado "Activo"
- Verificar que el WMS este corriendo
- Esperar 1 minuto (cache de 60 segundos)

### No se genera la factura
- Verificar que Nubefact este configurado con token valido
- Verificar que el cliente tenga RUC o DNI

### El pedido no cambia de estado
- Verificar que el estado actual permita la transicion
- Ejemplo: No se puede ir de "Pendiente" directo a "Enviado"

### No se envia el email de confirmacion
- Verificar que Resend este configurado con API key valida
- Revisar la carpeta de spam del cliente

### La busqueda no encuentra productos
- Intentar con sinonimos: "cuna" tambien busca "berlin", "cama convertible"
- Verificar que el producto este activo y con stock

---

*Manual de usuario para el sistema ADRISU KIDS - WMS y Tienda Virtual*
