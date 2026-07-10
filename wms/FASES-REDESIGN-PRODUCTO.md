# Rediseño Integral del Formulario de Productos - 38 Fases

## Contexto

El formulario actual (ProductForm.tsx, ~242 lineas) tiene 4 tabs basicos y un preview basico. El usuario quiere un sistema completo estilo Shopify con: SKU secuencial por categoria, campos opcionales con toggle, variantes con atributos por categoria, preview completo con galeria zoom/tabs/variants/related, editor de landing page avanzado (columnas, CSS, animaciones, forms, countdown, tabs), sistema de descuento popup, historial de versiones, duplicar producto, importar/exportar, plantillas, auto-guardado real, y responsive completo.

---

## Fase 1: Schema Prisma - Campos Nuevos
**Descripcion:** Agregar todos los campos nuevos al schema de Prisma: dimensiones (height/width/depth), color, materials, recommendedAge, warrantyDays, originCountry en Product. Agregar categoryAttributes en Category para atributos personalizados por categoria. Agregar discountPopup (Json) en Product para configurar popup de descuento. Agregar modelo ProductVersion para historial.
**Archivos:** `packages/prisma-wms/schema.prisma`, `packages/prisma/schema.prisma`
**Dependencias:** Ninguna
**Estado:** COMPLETADO

## Fase 2: API Endpoints Extendidos
**Descripcion:** Actualizar POST/PUT/GET de products para aceptar y retornar todos los campos nuevos (dimensiones, color, materials, etc). Crear endpoint POST /api/v1/products/[id]/duplicate para duplicar productos. Crear endpoints GET/POST /api/v1/products/export y /api/v1/products/import para importar/exportar. Crear endpoint GET /api/v1/products/[id]/versions para historial. Crear endpoint POST /api/v1/versions/[id]/restore para restaurar.
**Archivos:** `wms/src/app/api/v1/products/route.ts`, `wms/src/app/api/v1/products/[id]/route.ts`, `wms/src/app/api/v1/products/[id]/duplicate/route.ts`, `wms/src/app/api/v1/products/export/route.ts`, `wms/src/app/api/v1/products/import/route.ts`, `wms/src/app/api/v1/products/[id]/versions/route.ts`, `wms/src/app/api/v1/versions/[id]/restore/route.ts`
**Dependencias:** Fase 1
**Estado:** COMPLETADO

## Fase 3: SKU Secuencial por Categoria
**Descripcion:** Implementar servicio de generacion de SKU secuencial. Cuando se crea un producto, consultar la categoria, obtener el codigo de la categoria, buscar el ultimo numero de secuencia, generar SKU como `ADK-{CATCODE}-{001}`. Crear tabla CategorySequence o usar cache para trackear secuencias.
**Archivos:** `wms/src/lib/sku-generator.ts`, `wms/src/app/api/v1/products/route.ts`, `wms/src/components/catalogo/ProductForm.tsx`
**Dependencias:** Fase 1
**Estado:** COMPLETADO

## Fase 4: Atributos por Categoria
**Descripcion:** Crear sistema de atributos configurables por categoria. El usuario define en la configuracion de categoria que atributos tiene (ej: Muebles -> [Color, Material, Dimensiones]). Estos atributos se usan en las variantes y en el preview. Crear API para gestionar atributos de categoria.
**Archivos:** `wms/src/app/api/v1/categories/[id]/attributes/route.ts`, `wms/src/components/catalogo/ui/CategoryAttributes.tsx`, `wms/src/hooks/useCategoryAttributes.ts`, `wms/src/components/catalogo/tabs/VariantsTab.tsx`
**Dependencias:** Fase 1
**Estado:** COMPLETADO

## Fase 5: ProductFormContext Avanzado
**Descripcion:** Reescribir el context con todos los campos nuevos: dimensions, color, materials, recommendedAge, warrantyDays, originCountry, discountPopup, categoryAttributes. Agregar estados para: activeView (edit/preview), versionHistory, autoSaveStatus. Agregar funciones: toggleField, setDiscountPopup, saveVersion, duplicateProduct. Implementar auto-save real con debounce 30s.
**Archivos:** `wms/src/components/catalogo/ProductFormContext.tsx`, `wms/src/components/catalogo/ProductForm.tsx`, `wms/src/app/(dashboard)/catalogo/page.tsx`
**Dependencias:** Fase 1
**Estado:** COMPLETADO

## Fase 6: InfoTab - Campos Opcionales con Toggle
**Descripcion:** Reescribir InfoTab con todos los campos. Todos visibles por defecto. Cada campo opcional tiene un toggle button para mostrar/ocultar. Campos requeridos: SKU, Nombre, Categoria, Estado, Descripcion. Campos opcionales con toggle: Modelo, Marca, Dimensiones, Color, Materiales, Edad Recomendada, Garantia, Origen, Peso, Etiquetas. Usar FormField components existentes.
**Archivos:** `wms/src/components/catalogo/tabs/InfoTab.tsx`
**Dependencias:** Fase 5
**Estado:** COMPLETADO

## Fase 7: VariantsTab - Atributos por Categoria
**Descripcion:** Reescribir VariantsTab para que los atributos de las variantes se configuren segun la categoria seleccionada. Cuando el usuario selecciona una categoria, se cargan los atributos configurados para esa categoria. Cada variante puede tener valores para esos atributos. Agregar UI para definir valores de atributos por variante.
**Archivos:** `wms/src/components/catalogo/tabs/VariantsTab.tsx`, `wms/src/hooks/useCategoryAttributes.ts`
**Dependencias:** Fase 4, Fase 5
**Estado:** COMPLETADO

## Fase 8: DiscountPopup - Configuracion por Producto
**Descripcion:** Agregar seccion de configuracion de popup de descuento en el PricingTab. Toggle para activar/desactivar. Cuando esta activo, mostrar campos: titulo del popup, texto del CTA, porcentaje de descuento, precio especial, imagen del popup. Guardar como discountPopup Json en el producto. El popup aparece en la tienda cuando el usuario cierra el checkout por primera vez.
**Archivos:** `wms/src/components/catalogo/tabs/PricingTab.tsx`, `wms/src/components/catalogo/ui/DiscountPopupConfig.tsx`
**Dependencias:** Fase 5
**Estado:** COMPLETADO

## Fase 9: Schema Version History
**Descripcion:** Crear modelo ProductVersion en Prisma para almacenar historial de versiones. Cada version guarda: snapshot completo del producto, timestamp, autor, tipo de cambio (manual/auto), diff resumido. Crear servicio para crear versiones al guardar y comparar con la version anterior.
**Archivos:** `packages/prisma-wms/schema.prisma`, `wms/src/lib/version-history.ts`, `wms/src/app/api/v1/products/[id]/versions/route.ts`, `wms/src/app/api/v1/versions/[id]/restore/route.ts`
**Dependencias:** Fase 1
**Estado:** COMPLETADO

## Fase 10: Version History - UI Panel
**Descripcion:** Agregar panel de historial de versiones accesible desde la barra superior del ProductForm. Muestra timeline de versiones con timestamps, autor, y resumen de cambios. Cada version se expande para ver diff completo. Boton "Restaurar esta version" con dialogo de confirmacion.
**Archivos:** `wms/src/components/catalogo/ui/VersionHistoryPanel.tsx`, `wms/src/components/catalogo/ProductForm.tsx`, `wms/src/app/(dashboard)/catalogo/page.tsx`
**Dependencias:** Fase 9
**Estado:** COMPLETADO

## Fase 11: Duplicar Producto
**Descripcion:** Implementar boton "Duplicar Producto" en la barra superior del form y en la lista de productos. Llama al endpoint POST /api/v1/products/[id]/duplicate que clona el producto con todas las variantes, precios, y landing page, agregando "(Copia)" al nombre y generando nuevo SKU. Abre el producto duplicado en modo edicion.
**Archivos:** `wms/src/components/catalogo/ProductForm.tsx`, `wms/src/app/(dashboard)/catalogo/page.tsx`, `wms/src/app/api/v1/products/[id]/duplicate/route.ts`
**Dependencias:** Fase 2
**Estado:** COMPLETADO

## Fase 12: Import/Export - CSV, Excel, JSON
**Descripcion:** Construir funcionalidad de importacion/exportacion. Exportar: generar CSV/Excel/JSON de productos seleccionados o filtrados con todos los campos. Importar: subir CSV/Excel/JSON, validar esquema, previsualizar mapeo, crear/actualizar productos en lote. Usar papaparse para CSV, xlsx para Excel. Incluir UI de mapeo de campos.
**Archivos:** `wms/src/lib/import-export.ts`, `wms/src/components/catalogo/ImportExportDialog.tsx`, `wms/src/app/api/v1/products/export/route.ts`, `wms/src/app/api/v1/products/import/route.ts`, `wms/src/app/(dashboard)/catalogo/page.tsx`
**Dependencias:** Fase 2
**Estado:** COMPLETADO

## Fase 13: Plantillas de Producto
**Descripcion:** Crear sistema de plantillas con 3 plantillas predefinidas: Mueble, Accesorio, Paquete/Bundle. Las plantillas pre-cargan campos, configuracion de atributos de variante, y bloques de landing page. Boton "Cargar Plantilla" en la parte superior del form en modo creacion. Plantillas almacenadas en JSON.
**Archivos:** `wms/src/lib/product-templates.ts`, `wms/src/components/catalogo/ui/TemplateSelector.tsx`, `wms/src/data/templates.json`, `wms/src/components/catalogo/ProductForm.tsx`
**Dependencias:** Fase 5, Fase 6
**Estado:** COMPLETADO

## Fase 14: Preview - Modo Tabs Edit/Preview
**Descripcion:** Reemplazar el preview split-view con modo tabs Edit/Preview. La barra superior del ProductForm tiene tabs "Editar" y "Preview". Click en "Preview" oculta el form y muestra preview completo a pantalla completa. Click en "Editar" vuelve al form. Dentro de Preview hay toggle web/mobile.
**Archivos:** `wms/src/components/catalogo/ProductForm.tsx`, `wms/src/components/catalogo/preview/ProductPreview.tsx`
**Dependencias:** Fase 5
**Estado:** COMPLETADO (implementado en Fase 5)

## Fase 15: Preview Shopify - Galeria de Imagenes con Zoom
**Descripcion:** Reconstruir la galeria de imagenes del preview estilo Shopify. Imagen principal con click-to-zoom (lightbox modal), strip de thumbnails con scroll horizontal, contador de imagen, transiciones suaves. Usar CSS transforms para zoom (sin librerias pesadas). Crear componente ImageGallery reutilizable.
**Archivos:** `wms/src/components/catalogo/preview/ImageGallery.tsx`, `wms/src/components/catalogo/preview/ImageZoomModal.tsx`, `wms/src/components/catalogo/preview/WebPreview.tsx`, `wms/src/components/catalogo/preview/MobilePreview.tsx`
**Dependencias:** Fase 14
**Estado:** COMPLETADO

## Fase 16: Preview Shopify - Selector de Variantes
**Descripcion:** Agregar selector de variantes al preview que renderiza atributos como chips/botones seleccionables. Para color, mostrar swatches. Para talla/material, botones de texto. Variante seleccionada actualiza precio, imagenes, y estado de stock mostrados.
**Archivos:** `wms/src/components/catalogo/preview/VariantSelector.tsx`, `wms/src/components/catalogo/preview/WebPreview.tsx`, `wms/src/components/catalogo/preview/MobilePreview.tsx`
**Dependencias:** Fase 15
**Estado:** COMPLETADO

## Fase 17: Preview Shopify - Tabs Descripcion/Especificaciones/Reviews
**Descripcion:** Agregar seccion de tabs debajo de la info del producto: Descripcion (texto largo + imagenes), Especificaciones (tabla de atributos del producto), Reviews (barra de distribucion de estrellas + reviews simulados). Componente mock/preview.
**Archivos:** `wms/src/components/catalogo/preview/ProductTabs.tsx`, `wms/src/components/catalogo/preview/WebPreview.tsx`, `wms/src/components/catalogo/preview/MobilePreview.tsx`
**Dependencias:** Fase 15
**Estado:** COMPLETADO

## Fase 18: Preview Shopify - Breadcrumb
**Descripcion:** Agregar navegacion breadcrumb en la parte superior del preview: Inicio > Categoria > Subcategoria > Nombre Producto. Obtener jerarquia de categoria del producto. En mobile, breadcrumb truncado con "..." para rutas largas.
**Archivos:** `wms/src/components/catalogo/preview/Breadcrumbs.tsx`, `wms/src/components/catalogo/preview/WebPreview.tsx`
**Dependencias:** Fase 14
**Estado:** COMPLETADO

## Fase 19: Preview Shopify - Share Buttons y Social Proof
**Descripcion:** Agregar botones de compartir (WhatsApp, Facebook, Instagram) al preview. WhatsApp abre link de share con nombre + precio. Facebook abre dialogo. Instagram copia link. Agregar indicadores de urgencia de stock ("Solo quedan 3!", "Se vende rapido!") basados en stock de variantes. Agregar popup de newsletter (mock, despues de 5 seg).
**Archivos:** `wms/src/components/catalogo/preview/ShareButtons.tsx`, `wms/src/components/catalogo/preview/StockUrgency.tsx`, `wms/src/components/catalogo/preview/NewsletterPopup.tsx`, `wms/src/components/catalogo/preview/WebPreview.tsx`
**Dependencias:** Fase 15
**Estado:** COMPLETADO

## Fase 20: Preview Shopify - Trust Badges y Star Ratings
**Descripcion:** Mejorar seccion de trust badges con iconos y textos configurables (umbral de envio, periodo de garantia desde datos del producto, dias de devolucion). Agregar display interactivo de estrellas con grafico de barras de distribucion. Badges usan info de garantia del campo warrantyDays del producto.
**Archivos:** `wms/src/components/catalogo/preview/TrustBadges.tsx`, `wms/src/components/catalogo/preview/StarRating.tsx`, `wms/src/components/catalogo/preview/WebPreview.tsx`
**Dependencias:** Fase 15
**Estado:** COMPLETADO

## Fase 21: Preview Shopify - Productos Relacionados
**Descripcion:** Agregar seccion "Productos Relacionados" al fondo del preview mostrando 4 tarjetas de productos de la misma categoria. Cada tarjeta muestra imagen, nombre, precio, y boton de agregar rapido. En mobile, fila horizontal scrolleable.
**Archivos:** `wms/src/components/catalogo/preview/RelatedProducts.tsx`, `wms/src/components/catalogo/preview/WebPreview.tsx`, `wms/src/components/catalogo/preview/MobilePreview.tsx`
**Dependencias:** Fase 15
**Estado:** COMPLETADO

## Fase 22: Preview Shopify - Sticky CTA Mobile
**Descripcion:** Implementar barra sticky "Agregar al Carrito" en la parte inferior del preview mobile. Muestra precio de variante seleccionada, selector de variante resumen, y boton CTA a ancho completo. Incluye selector de cantidad.
**Archivos:** `wms/src/components/catalogo/preview/StickyCTA.tsx`, `wms/src/components/catalogo/preview/MobilePreview.tsx`
**Dependencias:** Fase 16
**Estado:** COMPLETADO

## Fase 23: Discount Popup - Integracion Tienda
**Descripcion:** Construir el componente modal de descuento para la tienda (tienda). Muestra: imagen del producto, precio original tachado, precio con descuento, badge "% OFF", boton CTA. Aparece cuando el usuario cierra el checkout por primera vez. Estado "visto" en localStorage. Configurable por producto desde WMS.
**Archivos:** `tienda/src/components/ui/DiscountPopup.tsx`, `tienda/src/app/(public)/checkout/page.tsx`
**Dependencias:** Fase 8
**Estado:** COMPLETADO

## Fase 24: Landing Page - Editores de Bloques Faltantes
**Descripcion:** Implementar los 6 editores de bloques que muestran "En desarrollo". Editores completos para: Imagen (URL, caption, alineacion, ancho), Galeria (agregar/quitar imagenes, columnas), Caracteristicas (agregar/quitar items con icono/titulo/descripcion), Testimonios (agregar/quitar items con nombre/texto/estrellas), FAQ (agregar/quitar items accordion), Columnas (2-3-4 columnas con contenido).
**Archivos:** `wms/src/components/catalogo/landing/blocks/` (6 archivos nuevos), `wms/src/components/catalogo/tabs/LandingPageTab.tsx`
**Dependencias:** Fase 5
**Estado:** COMPLETADO

## Fase 25: Landing Page - Bloque Formulario de Contacto
**Descripcion:** Agregar tipo de bloque "Formulario de Contacto". Editor configura: campos del formulario (nombre, email, telefono, mensaje), texto del boton submit, color de fondo, mensaje de exito. Preview muestra formulario estilizado. En tienda renderiza como formulario real.
**Archivos:** `wms/src/components/catalogo/landing/blocks/ContactFormBlockEditor.tsx`, `wms/src/components/catalogo/landing/blocks/ContactFormBlockPreview.tsx`, `wms/src/components/catalogo/tabs/LandingPageTab.tsx`
**Dependencias:** Fase 24
**Estado:** COMPLETADO

## Fase 26: Landing Page - Bloque Contador Regresivo
**Descripcion:** Agregar tipo de bloque "Contador Regresivo". Editor configura: fecha/hora final, texto de etiqueta, color de fondo, colores de urgencia. Preview muestra countdown en vivo con dias:horas:minutos:segundos. En tienda renderiza countdown real.
**Archivos:** `wms/src/components/catalogo/landing/blocks/CountdownBlockEditor.tsx`, `wms/src/components/catalogo/landing/blocks/CountdownBlockPreview.tsx`, `wms/src/components/catalogo/tabs/LandingPageTab.tsx`
**Dependencias:** Fase 24
**Estado:** COMPLETADO

## Fase 27: Landing Page - Bloques Tabs/Accordion
**Descripcion:** Agregar tipos de bloque "Tabs" y "Accordion". Tabs: configurar multiples paneles con titulos y contenido rico. Accordion: configurar secciones colapsables con headers y contenido. Ambos preview en tiempo real. Utiles para FAQ, detalles de producto, especificaciones.
**Archivos:** `wms/src/components/catalogo/landing/blocks/TabsBlockEditor.tsx`, `wms/src/components/catalogo/landing/blocks/TabsBlockPreview.tsx`, `wms/src/components/catalogo/landing/blocks/AccordionBlockEditor.tsx`, `wms/src/components/catalogo/landing/blocks/AccordionBlockPreview.tsx`, `wms/src/components/catalogo/tabs/LandingPageTab.tsx`
**Dependencias:** Fase 24
**Estado:** COMPLETADO

## Fase 28: Landing Page - Columnas Flexibles
**Descripcion:** Mejorar bloque Columnas para soportar 2, 3, o 4 columnas con anchos porcentuales customizables (ej: 30/70, 25/25/50). Slider o input de porcentaje por columna. Cada columna puede contener sub-bloques o texto rico. Preview renderiza con anchos proporcionales exactos.
**Archivos:** `wms/src/components/catalogo/landing/blocks/ColumnsBlockEditor.tsx`, `wms/src/components/catalogo/tabs/LandingPageTab.tsx`
**Dependencias:** Fase 24
**Estado:** COMPLETADO

## Fase 29: Landing Page - Estilos CSS por Bloque
**Descripcion:** Agregar tab "Estilo" a cada editor de bloque que permite configurar: margin (top/right/bottom/left), padding (igual), color de fondo/imagen, border (width/style/color/radius), box shadow (offset/blur/color). Guardar como settings.styles en cada bloque. Aplicar estilos en preview y en tienda.
**Archivos:** `wms/src/components/catalogo/landing/ui/BlockStyleEditor.tsx`, `wms/src/components/catalogo/tabs/LandingPageTab.tsx`
**Dependencias:** Fase 24
**Estado:** COMPLETADO

## Fase 30: Landing Page - Animaciones por Bloque
**Descripcion:** Agregar configuracion de animacion a cada bloque. Opciones: fade-in, slide-up, slide-left, slide-right, parallax, zoom-in. Configurar trigger (on scroll, on load), duracion, delay. Guardar como settings.animation. Preview muestra animacion en loop. En tienda, usar Intersection Observer.
**Archivos:** `wms/src/components/catalogo/landing/ui/BlockAnimationEditor.tsx`, `tienda/src/lib/animations.ts`, `wms/src/components/catalogo/tabs/LandingPageTab.tsx`
**Dependencias:** Fase 29
**Estado:** COMPLETADO

## Fase 31: Landing Page - Renderizado en Tienda (WYSIWYG)
**Descripcion:** Construir el renderer de landing pages en la tienda que toma los bloques configurados desde WMS y los renderiza con el EXACTO mismo CSS, componentes, y estilos. Crear biblioteca de componentes compartidos o CSS variables que usan tanto el preview del WMS como la tienda. Garantizar WYSIWYG.
**Archivos:** `tienda/src/components/landing/LandingPageRenderer.tsx`, `tienda/src/lib/animations.ts`
**Dependencias:** Fase 24-30
**Estado:** COMPLETADO

## Fase 32: Responsive - Tablet y Mobile
**Descripcion:** Hacer todo el ProductForm responsive. Tablet (768-1024px): tabs colapsan en fila scrolleable, paneles de form se apilan, preview va full-width debajo del form. Mobile (<768px): barra superior compacta, tabs scroll horizontal, campos en columna unica, editor de landing page como stack vertical con paneles colapsables.
**Archivos:** Todos los archivos en `wms/src/components/catalogo/`, `wms/src/app/globals.css`
**Dependencias:** Fase 14
**Estado:** COMPLETADO

## Fase 33: Dark Mode Polish
**Descripcion:** Auditar y pulir el estilo dark mode en todos los componentes nuevos y existentes. Asegurar uso consistente de gray-950/900/800/700, brand-600/500, ratios de contraste correctos, transiciones suaves. Corregir inconsistencias visuales.
**Archivos:** Todos los archivos en `wms/src/components/catalogo/`, `wms/src/app/globals.css`
**Dependencias:** Fase 32
**Estado:** COMPLETADO

## Fase 34: Auto-Save Real
**Descripcion:** Reemplazar el stub de auto-save con implementacion real. Cuando el state isDirty, debounce 30 segundos, luego POST el estado actual como borrador a PUT /api/v1/products/[id]/draft. Mostrar indicador sutil "Guardando..." en barra superior. En fallo de red, retry con backoff exponencial. Mostrar "Ultimo guardado: hace X minutos".
**Archivos:** `wms/src/components/catalogo/ProductFormContext.tsx`, `wms/src/components/catalogo/ProductForm.tsx`, `wms/src/app/api/v1/products/[id]/draft/route.ts`
**Dependencias:** Fase 5, Fase 9
**Estado:** COMPLETADO

## Fase 35: Flujo de Guardado + Version History
**Descripcion:** Integrar historial de versiones en el flujo de guardado. Al hacer click en "Guardar" (manual), despues de guardar, crear snapshot ProductVersion con diff del ultimo estado guardado. Al auto-save, NO crear version (solo actualizar borrador). Toast "Producto guardado" con link "Deshacer" que abre historial.
**Archivos:** `wms/src/components/catalogo/ProductForm.tsx`, `wms/src/components/catalogo/ProductFormContext.tsx`, `wms/src/lib/version-history.ts`
**Dependencias:** Fase 9, Fase 34
**Estado:** COMPLETADO

## Fase 36: Testing de Integracion
**Descripcion:** Escribir tests de integracion para el flujo completo: crear producto con SKU auto-generado, agregar variantes con atributos de categoria, configurar bloques de landing page, guardar y verificar historial, duplicar producto, importar/exportar, restaurar desde version. Testear edge cases: formularios vacios, nombres largos, caracteres especiales, maximo de variantes, fallos de red.
**Archivos:** `wms/src/__tests__/components/ProductForm.test.tsx`, `wms/src/__tests__/api/products-extended.test.ts`
**Dependencias:** Todas las fases anteriores
**Estado:** COMPLETADO

## Fase 37: Optimizacion de Performance
**Descripcion:** Optimizar rendimiento del formulario. Lazy-load de editores de bloques de landing page, React.memo en componentes costosos (block previews, variant list), virtual scrolling para listas largas de variantes (>20), indicadores de progreso en subida de imagenes, debounce en inputs de formulario, Web Workers para parsing CSV/Excel en importacion.
**Archivos:** `wms/src/components/catalogo/ui/VirtualList.tsx`, `wms/src/components/catalogo/ui/DebouncedInput.tsx`, `wms/src/components/catalogo/ui/LazyBlockEditor.tsx`, `wms/src/components/catalogo/ui/UploadProgress.tsx`, `wms/src/components/catalogo/ui/ImageUploader.tsx`
**Dependencias:** Fase 36
**Estado:** COMPLETADO

## Fase 38: QA Final, Compatibilidad y Documentacion
**Descripcion:** Verificar que todos los productos existentes cargan correctamente con el nuevo form (compatibilidad hacia atras). Campos nuevos con default null/vacio para productos existentes. SKU auto-generado solo para nuevos. Version history empieza desde cero. Testear flujo completo end-to-end. Corregir bugs restantes. Documentar campos nuevos en API docs.
**Archivos:** `wms/src/components/catalogo/ProductForm.tsx`, `wms/src/app/api/v1/products/route.ts`, `wms/docs/API-PRODUCTOS.md`
**Dependencias:** Fase 37
**Estado:** COMPLETADO

---

## Ejecucion en Paralelo

```
Batch 1 (despues de Fase 1-2):  Fases 3, 4 en paralelo        (SKU + Atributos)
Batch 2 (despues de Fase 5):    Fases 6, 7, 8 en paralelo      (InfoTab, VariantsTab, Popup)
Batch 3 (despues de Fase 2):    Fases 9, 11, 12, 13 en paralelo (Historial, Duplicar, Import/Export, Plantillas)
Batch 4 (despues de Fase 14):   Fases 15-22 en paralelo        (todos los features de preview)
Batch 5 (despues de Fase 24):   Fases 25-30 en paralelo        (todos los editores de bloques)
```

## Camino Critico

```
Fase 1 → Fase 2 → Fase 5 → Fase 14 → Fase 15 → Fase 16 → Fase 32 → Fase 36 → Fase 38
```

## Resumen de Archivos por Fase

| Fase | Archivos a Crear | Archivos a Modificar |
|------|------------------|---------------------|
| 1 | 0 | 2 (schema.prisma x2) |
| 2 | 4+ endpoints | 2 (products routes) |
| 3 | 1 (sku-generator.ts) | 1 (products route) |
| 4 | 2 | 0 |
| 5 | 0 | 1 (ProductFormContext) |
| 6 | 0 | 1 (InfoTab) |
| 7 | 0 | 1 (VariantsTab) |
| 8 | 1 (DiscountPopupConfig) | 1 (PricingTab) |
| 9 | 2 | 1 (schema.prisma) |
| 10 | 1 (VersionHistoryPanel) | 1 (ProductForm) |
| 11 | 1 (duplicate route) | 1 (ProductForm) |
| 12 | 3 | 0 |
| 13 | 3 | 0 |
| 14 | 0 | 2 (ProductForm, ProductPreview) |
| 15 | 2 (ImageGallery, ImageZoomModal) | 2 (WebPreview, MobilePreview) |
| 16 | 1 (VariantSelector) | 2 (WebPreview, MobilePreview) |
| 17 | 1 (ProductTabs) | 2 (WebPreview, MobilePreview) |
| 18 | 1 (Breadcrumbs) | 1 (WebPreview) |
| 19 | 3 | 1 (WebPreview) |
| 20 | 2 | 0 |
| 21 | 1 (RelatedProducts) | 2 (WebPreview, MobilePreview) |
| 22 | 1 (StickyCTA) | 1 (MobilePreview) |
| 23 | 1 (DiscountPopup) | 1 (checkout page) |
| 24 | 6 (block editors) | 0 |
| 25 | 2 | 0 |
| 26 | 2 | 0 |
| 27 | 2 | 0 |
| 28 | 0 | 1 (ColumnsBlockEditor) |
| 29 | 1 (BlockStyleEditor) | 6+ (all block editors) |
| 30 | 2 | 0 |
| 31 | 2 | 0 |
| 32 | 0 | 10+ (all catalogo components) |
| 33 | 0 | 10+ (all catalogo components) |
| 34 | 1 (draft route) | 2 (Context, ProductForm) |
| 35 | 0 | 3 (ProductForm, Context, version-history) |
| 36 | 2 (test files) | 0 |
| 37 | 0 | 5+ (performance optimization) |
| 38 | 0 | 2 (ProductForm, products route) |
