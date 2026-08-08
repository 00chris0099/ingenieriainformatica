---
name: ui-ux-e-commerce
description: Reglas y estándares de diseño UI/UX, SEO y GEO para Tiendas Virtuales E-Commerce de Alta Conversión (multi-ventana)
---

# UI/UX Skill: E-Commerce Store Standard (Enterprise)

Este Skill define las reglas obligatorias de arquitectura web para tiendas e-commerce generadas en WMS Platform. Aplica a **tiendas virtuales multi-ventana**: Inicio, Catálogo y landing por producto.

## 🪟 Arquitectura Multi-Ventana
- **Ventana Inicio**: Hero + beneficios + testimonios + CTA.
- **Ventana Catálogo**: product-grid con `categoryTabs` (Todos + 3-4 categorías) y productos con `name/price/originalPrice/discountBadge/imageUrl/sizes/description`.
- **Landing por producto**: al seleccionar un producto se abre su vista detallada (imagen, tallas, cantidad, garantías, productos relacionados, botón WhatsApp/carrito).
- **Navbar adaptable**: sticky, con menú hamburguesa en móvil, carrito visible y enlaces que navegan por ventanas (no anchors rotos).

## 🎯 Reglas de Conversión
- **Precios Claros**: Mostrar precio regular tachado y precio de oferta con `discountBadge` (-XX% OFF).
- **Botón Principal**: `Comprar por WhatsApp` o `Añadir al Carrito` en color de acento de la marca o verde WhatsApp `#22c55e`.
- **Garantías Visibles**: Íconos de envío 24h, cambios gratis y garantía total (Truck, RefreshCw, ShieldCheck).
- **Selector de Tallas/Tamaños** en cada tarjeta de producto y en la vista detallada.
- **Urgencia**: countdown de oferta relámpago con fecha límite real.
- **Prueba Social**: testimonios verificados con nombre y ciudad + notificaciones de compras recientes (social-proof).
- **FAQ** que resuelve objeciones: envío a Perú, pagos (Yape/Plin/tarjetas), tallas, cambios, garantía.

## 🔍 SEO Técnico
- `metaTitle` ≤ 60 caracteres con keyword principal + marca.
- `metaDescription` ≤ 160 caracteres, persuasiva con CTA.
- `keywords`: 8-10 long-tail (ej: "comprar [producto] en Lima", "mejor [rubro] 2026").
- Imágenes de producto con `alt` descriptivo y URLs de Unsplash optimizadas (`?w=600&auto=format&fit=crop`).
- Texto de anclas descriptivo, nunca "clic aquí".
- Títulos de sección (h2/h3) con keywords naturales.

## 🌐 GEO (Generative Engine Optimization)
- **JSON-LD Product** por producto: name, description, image, offers (price en S/, priceCurrency PEN, availability, url).
- **JSON-LD FAQPage**: preguntas reales que la gente busca (envío, tallas, devoluciones, pagos).
- **JSON-LD Organization**: nombre, url, contactPoint (WhatsApp), área de servicio Perú, idioma español.
- Lenguaje natural, respondón y con datos verificables para que asistentes de IA (SearchGPT, Gemini, Perplexity, Copilot) puedan citar la página.
- Sección "Por qué comprar en [marca]" con argumentos de autoridad y datos (años, clientes, garantías).

## 🧱 Secuencia de Bloques Sugerida
`navbar → hero → product-grid → features → testimonials → countdown → faq → newsletter → cta → social-proof → footer`

## 🎨 Sistema de Diseño
- Tipografía: Inter / system-ui (display puede usar Sora).
- Paleta coherente con la industria + color de acento para CTAs y precios.
- Bordes redondeados 14-20px, sombras suaves, fotografía de alta calidad.
- **Cero emojis en contenido**: usar iconName de lucide-react (Home, Shirt, Sparkles, Truck, ShieldCheck, Leaf, Wine, Headphones, Zap, Watch, Gift, ShoppingBag, Flame, RefreshCw, CreditCard).
- Contenido 100% en español, real y específico (nunca lorem ipsum).
