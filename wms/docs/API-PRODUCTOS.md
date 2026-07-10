# API de Productos - Documentacion

## Endpoints

### GET /api/v1/products
Lista todos los productos con paginacion.

**Query Parameters:**
- `q` - Busqueda por nombre o SKU
- `category` - Filtrar por slug de categoria
- `status` - Filtrar por estado (draft, active, archived)
- `page` - Numero de pagina (default: 1)
- `limit` - Limite por pagina (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sku": "ADK-MUE-001",
      "name": "Cuna Convertible",
      "slug": "cuna-convertible",
      "model": "CK-350",
      "description": "...",
      "shortDescription": "...",
      "brand": "AdriSu Kids",
      "categoryId": "uuid",
      "category": "Muebles",
      "status": "active",
      "tags": ["mueble", "bebe"],
      "images": ["url1", "url2"],
      "height": 100,
      "width": 60,
      "depth": 50,
      "color": "Blanco",
      "materials": ["Madera", "MDF"],
      "recommendedAge": "0-12 meses",
      "warrantyDays": 365,
      "originCountry": "Peru",
      "weight": 15.5,
      "weightUnit": "kg",
      "lowStockAlert": 10,
      "discountPopup": { "enabled": true, "title": "Oferta!" },
      "variants": [...],
      "totalStock": 25,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

### POST /api/v1/products
Crea un nuevo producto.

**Body:**
```json
{
  "sku": "ADK-MUE-001",           // Opcional - auto-generado si se omite
  "name": "Cuna Convertible",     // Requerido
  "model": "CK-350",              // Opcional
  "description": "...",           // Opcional
  "shortDescription": "...",      // Opcional
  "brand": "AdriSu Kids",         // Opcional
  "categoryId": "uuid",           // Opcional
  "status": "draft",              // Opcional (default: draft)
  "tags": ["mueble"],             // Opcional
  "height": 100,                  // Opcional (cm)
  "width": 60,                    // Opcional (cm)
  "depth": 50,                    // Opcional (cm)
  "color": "Blanco",              // Opcional
  "materials": ["Madera"],        // Opcional
  "recommendedAge": "0-12 meses", // Opcional
  "warrantyDays": 365,            // Opcional
  "originCountry": "Peru",        // Opcional
  "weight": 15.5,                 // Opcional
  "weightUnit": "kg",             // Opcional (default: kg)
  "lowStockAlert": 10,            // Opcional
  "discountPopup": {...},         // Opcional
  "variants": [...]               // Opcional
}
```

**SKU Auto-generacion:**
Si se omite el SKU, se genera automaticamente basado en la categoria:
- Formato: `ADK-{CATCODE}-{001}`
- Ejemplo: `ADK-MUE-001` (Muebles), `ADK-ACC-001` (Accesorios)

### GET /api/v1/products/[id]
Obtiene un producto por ID con todos sus detalles.

### PUT /api/v1/products/[id]
Actualiza un producto existente.

### DELETE /api/v1/products/[id]
Archiva un producto (soft delete).

### POST /api/v1/products/[id]/duplicate
Duplica un producto con todas sus variantes.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "sku": "ADK-COPY-001",
    "name": "Cuna Convertible (Copia)",
    "message": "Product duplicated successfully"
  }
}
```

### GET /api/v1/products/export
Exporta productos en formato CSV o JSON.

**Query Parameters:**
- `format` - csv o json (default: json)
- `category` - Filtrar por categoria
- `status` - Filtrar por estado

### POST /api/v1/products/import
Importa productos desde CSV o JSON.

**Body:**
```json
{
  "products": [...],
  "mode": "create" | "update"
}
```

### GET /api/v1/products/[id]/versions
Lista el historial de versiones de un producto.

### POST /api/v1/products/[id]/versions
Crea una nueva version (snapshot) del producto.

**Body:**
```json
{
  "changeType": "manual" | "auto",
  "authorName": "Usuario"
}
```

### POST /api/v1/versions/[id]/restore
Restaura un producto desde una version.

### PUT /api/v1/products/[id]/draft
Guarda un borrador del producto (auto-save).

---

## Modelos de Datos

### Product
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| sku | String | Codigo unico del producto |
| name | String | Nombre del producto |
| slug | String | URL-friendly del nombre |
| model | String? | Modelo del producto |
| description | String? | Descripcion larga |
| shortDescription | String? | Descripcion corta |
| brand | String? | Marca |
| categoryId | UUID? | ID de la categoria |
| status | Enum | draft, active, archived |
| tags | String[] | Etiquetas internas |
| images | String[] | URLs de imagenes del producto |
| height | Decimal? | Alto en cm |
| width | Decimal? | Ancho en cm |
| depth | Decimal? | Profundidad en cm |
| color | String? | Color principal |
| materials | String[] | Materiales del producto |
| recommendedAge | String? | Edad recomendada |
| warrantyDays | Int? | Dias de garantia |
| originCountry | String? | Pais de origen |
| weight | Decimal? | Peso |
| weightUnit | String? | Unidad de peso (kg/g) |
| lowStockAlert | Int? | Umbral de alerta de stock |
| discountPopup | Json? | Configuracion de popup de descuento |

### ProductVariant
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| productId | UUID | ID del producto padre |
| sku | String | SKU de la variante |
| name | String | Nombre de la variante |
| attributes | Json | Atributos de la variante |
| price | Decimal | Precio |
| compareAtPrice | Decimal? | Precio de comparacion |
| images | String[] | URLs de imagenes de la variante |
| isActive | Boolean | Si la variante esta activa |
| lowStockAlert | Int? | Umbral de alerta |

### ProductVersion
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | UUID | Identificador unico |
| productId | UUID | ID del producto |
| version | Int | Numero de version |
| snapshot | Json | Estado completo del producto |
| diff | Json? | Resumen de cambios |
| changeType | String | manual o auto |
| authorName | String? | Quien hizo el cambio |
| createdAt | DateTime | Timestamp |

---

## Configuracion de Atributos por Categoria

### GET /api/v1/categories/[id]/attributes
Obtiene los atributos configurados para una categoria.

### PUT /api/v1/categories/[id]/attributes
Actualiza los atributos de una categoria.

**Body:**
```json
{
  "attributes": [
    {
      "name": "Color",
      "type": "select",
      "options": ["Rojo", "Azul", "Verde"],
      "required": true
    },
    {
      "name": "Material",
      "type": "select",
      "options": ["Madera", "Metal"],
      "required": true
    }
  ]
}
```

**Tipos de atributo:**
- `text` - Texto libre
- `select` - Lista de opciones
- `color` - Selector de color con hex
- `number` - Numero

---

## Auto-Save (Borrador)

El formulario de productos incluye auto-guardado cada 30 segundos cuando hay cambios.

**Endpoint:** `PUT /api/v1/products/[id]/draft`

**Comportamiento:**
1. Guarda todos los campos del producto
2. No crea version (solo actualiza borrador)
3. Retry automatico con backoff exponencial en caso de fallo
4. Indicador visual: "Guardando..." -> "Guardado hace X min"

---

## Version History

Cada guardado manual crea un snapshot del producto con diff automatico.

**Deteccion de cambios:**
- Campos de texto: name, description, brand, model, status
- Campos numericos: weight, warrantyDays, lowStockAlert
- Dimensiones
- Arrays: tags, images, materials
- Variantes (cantidad y precios)
- Precios y popup de descuento

**Restauracion:**
- Crea una nueva version de restauracion
- Actualiza el producto con el snapshot de la version seleccionada
