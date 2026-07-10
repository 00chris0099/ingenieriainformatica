# Los 10 Requerimientos Funcionales Más Críticos — AdriSu Kids

> Selección de los RF más importantes del proyecto, con código fuente y explicación a nivel usuario.

---

## 1. RF-10: Pasarela de Pagos (MercadoPago)

**Archivo:** `tienda/src/app/api/v1/payments/mercadopago/route.ts`

```typescript
const response = await fetch('https://api.mercadopago.com/v1/preferences', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
  },
  body: JSON.stringify({
    items: [{
      title: `Pedido ${order.orderNumber}`,
      quantity: 1,
      unit_price: Number(amount),
      currency_id: currency || 'PEN',
    }],
    external_reference: orderId,
    back_urls: {
      success: `${process.env.NEXTAUTH_URL}/pedido/${order.orderNumber}`,
      failure: `${process.env.NEXTAUTH_URL}/pedido/${order.orderNumber}`,
    },
    auto_return: 'approved',
  }),
});
```

**Qué hace:** Cuando el cliente presiona "Pagar", el sistema crea una transacción segura en MercadoPago. Esta plataforma genera una página donde el cliente elige cómo pagar: tarjeta de crédito, débito o dinero en su cuenta MercadoPago.

**Cómo funciona para el usuario:** El `external_reference` es un "número de referencia" que vincula ese pago específico con el pedido. Después de pagar, MercadoPago redirige al cliente de vuelta a la tienda mostrando si el pago fue aprobado, rechazado o está pendiente.

---

## 2. RF-13: Descuento Automático de Stock Después del Pago

**Archivo:** `tienda/src/app/api/v1/payments/mercadopago/webhook/route.ts`

```typescript
if (isApproved) {
  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'paid', status: order.status === 'draft' ? 'confirmed' : order.status },
  });

  for (const item of order.items) {
    const inventory = await prisma.inventory.findFirst({
      where: { variantId: item.variantId },
    });
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

**Qué hace:** Este es el "cerebro" que conecta el pago confirmado con el inventario. Cuando MercadoPago notifica que el pago fue exitoso, automáticamente marca el pedido como pagado y resta las unidades vendidas del stock en el almacén.

**Cómo funciona para el usuario:** El `Math.max(0, ...)` es una protección que nunca permite stock negativo. Si alguien compra 5 unidades y solo quedan 3, el stock queda en 0 (no en -2). Las tres columnas (`quantity`, `reservedQuantity`, `availableQuantity`) permiten control preciso: cuántas hay, cuántas están reservadas y cuántas realmente se pueden vender.

---

## 3. RF-07/08: Carrito de Compras con Persistencia

**Archivo:** `tienda/src/store/cartStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
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
      updateQuantity: (variantId, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.variantId !== variantId)
            : state.items.map((i) => i.variantId === variantId ? { ...i, quantity } : i),
        })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: 'adriskids-cart' }
  )
);
```

**Qué hace:** El carrito es una lista temporal de compras que se guarda en la memoria del navegador del cliente, no en el servidor. Cuando alguien agrega un producto y ya tiene ese mismo en el carrito, le suma 1 a la cantidad en lugar de duplicarlo.

**Cómo funciona para el usuario:** La función `persist` guarda el carrito bajo la clave `adriskids-cart` en el `localStorage`. Si el cliente cierra el navegador y vuelve más tarde, el carrito sigue ahí. Es como si llevaras un papelito con los productos que quieres comprar, siempre en tu bolsillo. Las acciones disponibles son: agregar, eliminar, actualizar cantidad, vaciar y calcular el total.

---

## 4. RF-19: Autenticación Segura (Login/Registro)

**Archivo:** `tienda/src/lib/auth.ts`

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({ clientId: ..., clientSecret: ... }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const prisma = await getPrisma();
        const user = await prisma.customer.findFirst({
          where: { email: credentials.email as string },
        });
        if (!user || !user.isActive) return null;
        if (!user.password || user.password === '') return null;
        const isValid = await compare(credentials.password as string, user.password);
        if (!isValid) return null;
        return { id: user.id, email: user.email, name: user.fullName, image: null };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
});
```

**Qué hace:** Este es el "guardia de seguridad" de la tienda. Cuando un cliente se registra, su contraseña se "mezcla" con un código secreto mediante el algoritmo bcrypt (12 rondas de ofuscación) y se almacena así, nunca en texto plano. Al hacer login, el sistema compara la contraseña ingresada con la guardada.

**Cómo funciona para el usuario:** Si coinciden, le da un "token" (una credencial digital) que expira después de cierto tiempo. El usuario no necesita volver a ingresar sus datos hasta que el token caduque. También soporta login con Google: el cliente presiona "Continuar con Google" y Google le dice al sistema quién es, sin necesidad de contraseña adicional.

---

## 5. RF-01: Landing Page (Página de Inicio)

**Archivo:** `tienda/src/app/page.tsx`

```tsx
<section className="relative bg-gradient-to-br from-green-50 to-emerald-50 py-20 md:py-32">
  <h1 className="text-4xl md:text-6xl font-extrabold">
    Muebles para bebes <span className="text-green-600"> con amor</span>
  </h1>
  <Link href="/tienda" className="bg-green-600 text-white px-8 py-3 rounded-full">
    Ver catalogo
  </Link>
</section>

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
  {categories.map((cat) => <Link href={`/tienda?categoria=${cat.slug}`}>...</Link>)}
</div>
```

**Qué hace:** Es la primera página que ve cualquier visitante. Tiene un hero con imagen de fondo y el lema de la marca, categorías destacadas como botones clickeables (camas, sillas, cochecitos), productos destacados y una sección de beneficios como envío gratis y garantía.

**Cómo funciona para el usuario:** Todo está diseñado para que el visitante se sienta atraído y haga clic en "Ver catálogo". Las categorías muestran un conteo de productos disponibles. El diseño es responsive: se adapta automáticamente a celulares, tablets y computadoras usando breakpoints de Tailwind CSS (`sm:`, `md:`, `lg:`).

---

## 6. RF-18: Gestión de Estados de Pedido (WMS)

**Archivo:** `wms/src/app/(dashboard)/pedidos/page.tsx`

```typescript
const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pendiente' },
  confirmed: { color: 'bg-blue-500/20 text-blue-400', label: 'Confirmado' },
  processing: { color: 'bg-purple-500/20 text-purple-400', label: 'Procesando' },
  picking: { color: 'bg-indigo-500/20 text-indigo-400', label: 'Picking' },
  packing: { color: 'bg-cyan-500/20 text-cyan-400', label: 'Empaquetando' },
  ready_to_ship: { color: 'bg-teal-500/20 text-teal-400', label: 'Listo para enviar' },
  shipped: { color: 'bg-blue-500/20 text-blue-400', label: 'Enviado' },
  in_transit: { color: 'bg-orange-500/20 text-orange-400', label: 'En transito' },
  delivered: { color: 'bg-green-500/20 text-green-400', label: 'Entregado' },
  cancelled: { color: 'bg-red-500/20 text-red-400', label: 'Cancelado' },
};
```

**Qué hace:** Cada pedido pasa por un "ciclo de vida" parecido a una cadena de montaje: Pendiente → Confirmado → Procesando → Picking → Empaquetando → Listo para enviar → Enviado → En tránsito → Entregado. Cada estado tiene un color distintivo para que el equipo lo identifique de un vistazo.

**Cómo funciona para el usuario:** En el WMS (sistema de gestión de almacén), el personal puede cambiar el estado de un pedido con un clic. Cada cambio se registra automáticamente en la tabla `order_status_history` con el usuario responsable, el estado anterior y el nuevo, plus una razón opcional. El cliente puede ver el estado actual de su pedido desde la página `/pedido`.

---

## 7. RF-46: Registro Inmutable de Movimientos (Auditoría)

**Archivo:** `packages/prisma/schema.prisma`

```prisma
model AuditTrail {
  id              String      @id @default(uuid())
  tableName       String      @map("table_name")
  recordId        String      @map("record_id")
  action          AuditAction
  oldValues       Json        @default("{}") @map("old_values")
  newValues       Json        @default("{}") @map("new_values")
  changedFields   String[]    @default([]) @map("changed_fields")
  performedBy     String?
  ipAddress       String?
  createdAt       DateTime    @default(now())
}
```

**Qué hace:** Esto es como una "libreta de registro" que nunca se borra. Cada vez que alguien cambia algo en el sistema —ajuste de stock, cambio de estado, actualización de precio— se guarda automáticamente quién lo hizo, qué cambió, de qué valor pasó a qué otro valor, cuándo y desde qué dirección IP.

**Cómo funciona para el usuario:** Es como tener cámaras de seguridad para los datos. Si hay un problema (por ejemplo, alguien cambió un precio por error), se puede rastrear exactamente quién lo hizo, cuándo y desde dónde. La información se almacena en formato JSON, lo que permite hacer búsquedas históricas y generar reportes de auditoría.

---

## 8. RF-16: Alerta de Stock Bajo

**Archivo:** `wms/src/app/(dashboard)/inventario/page.tsx`

```tsx
const lowStockCount = inventory.filter(i => i.availableQuantity <= i.reorderPoint).length;

{lowStockCount > 0 && (
  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
    <AlertTriangle size={18} className="text-yellow-400" />
    <p>{lowStockCount} productos con stock bajo o agotado</p>
  </div>
)}
```

```prisma
model Inventory {
  quantity          Int @default(0)
  reservedQuantity  Int @default(0)
  availableQuantity Int @default(0) @map("available_quantity")
  reorderPoint      Int @default(10) @map("reorder_point")
}
```

**Qué hace:** Cada producto en cada almacén tiene un "punto de reorden" (por defecto 10 unidades). Cuando las unidades disponibles bajan de ese número, aparece una alerta amarilla con icono de advertencia en el dashboard del WMS.

**Cómo funciona para el usuario:** Es como un semáforo de stock. El `reorderPoint` es configurable por producto y almacén: para productos muy vendidos puedes ponerlo en 20, para los que se venden poco en 5. El cálculo es: `availableQuantity = quantity - reservedQuantity`. Si el resultado es menor o igual al punto de reorden, se dispara la alerta visual.

---

## 9. RF-02: Catálogo Dinámico desde Base de Datos

**Archivo:** `tienda/src/app/api/v1/products/route.ts`

```typescript
const [products, total] = await Promise.all([
  prisma.product.findMany({
    where,
    include: {
      category: true,
      variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  }),
  prisma.product.count({ where }),
]);
return apiPaginated(products, total, page, limit);
```

**Qué hace:** Esta es la "fuente de verdad" de los productos. Cuando un cliente visita la tienda, el sistema consulta PostgreSQL y trae el nombre, descripción, imágenes, precio y categoría de cada producto disponible.

**Cómo funciona para el usuario:** La paginación es clave: si hay 500 productos, no los carga todos de golpe. Carga una cantidad configurable por página (por ejemplo 12) y el cliente puede navegar entre páginas. El `include: { category: true, variants: true }` le dice a Prisma que traiga también la categoría y las variantes (tallas, colores, etc.) de cada producto en una sola consulta.

---

## 10. RF-51: Alertas Instantáneas por Telegram

**Archivo:** `tienda/src/lib/notifications/telegram.ts`

```typescript
export async function sendTelegramMessage(message: { text: string }) {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message.text,
      parse_mode: 'HTML'
    }),
  });
}

export function newOrderNotification(order): string {
  return `📦 <b>NUEVO PEDIDO</b>\n\n` +
    `Pedido: <code>${order.orderNumber}</code>\n` +
    `Cliente: ${order.customerName}\n` +
    `Total: <b>S/ ${order.total}</b>\n` +
    `Pago: ${order.paymentMethod}\n\n` +
    `Productos:\n${itemsList}`;
}
```

**Qué hace:** Cuando un cliente realiza un pedido, el sistema envía automáticamente un mensaje formateado al canal de Telegram del administrador. Es una notificación push instantánea: en lugar de revisar el correo o abrir el WMS, el dueño recibe en su celular la alerta.

**Cómo funciona para el usuario:** La API de Telegram Bot es gratuita. El `parse_mode: 'HTML'` permite formato en negrita y código para que el mensaje sea fácil de leer. El envío es "fire-and-forget": se ejecuta en segundo plano sin bloquear la respuesta al cliente. Si Telegram falla, el pedido igual se crea correctamente.

---

## Tabla Resumen

| # | RF | Nombre | Archivo principal | Por qué es crítico |
|---|-----|--------|-------------------|-------------------|
| 1 | RF-10 | Pasarela de pagos | `mercadopago/route.ts` | Sin cobro no hay negocio |
| 2 | RF-13 | Descuento stock post-pago | `webhook/route.ts` | Evita vender lo que no existe |
| 3 | RF-07/08 | Carrito de compras | `cartStore.ts` | Base de cualquier tienda online |
| 4 | RF-19 | Auth JWT + bcrypt | `auth.ts` | Protege cuentas de clientes |
| 5 | RF-01 | Landing page | `page.tsx` | Primera impresión del cliente |
| 6 | RF-18 | Estados de pedido | `pedidos/page.tsx` | Control operativo del almacén |
| 7 | RF-46 | Auditoría inmutable | `schema.prisma` | Trazabilidad y cumplimiento |
| 8 | RF-16 | Alerta stock bajo | `inventario/page.tsx` | Evita quiebre de inventario |
| 9 | RF-02 | Catálogo dinámico | `products/route.ts` | Mostrar productos al cliente |
| 10 | RF-51 | Alertas Telegram | `telegram.ts` | Notificación al dueño en tiempo real |

---

> Estos 10 RFs cubren el ciclo completo de negocio: **venta → pago → inventario → notificación**, más la seguridad y auditoría necesarias para operar.
