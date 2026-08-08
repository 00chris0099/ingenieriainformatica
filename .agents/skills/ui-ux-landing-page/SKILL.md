---
name: ui-ux-landing-page
description: Reglas y estándares de diseño UI/UX, SEO y GEO para Landing Pages de Alta Conversión (una sola ventana)
---

# UI/UX Skill: High-Converting Landing Page (Enterprise)

Este Skill define las reglas obligatorias de copywriting, secuencia narrativa, SEO y GEO para landing pages de una sola ventana (scroll continuo) generadas en WMS Platform.

## 🚀 Secuencia Narrativa (una sola ventana)
1. **Hero**: Promesa de valor irresistible + Imagen + 2 botones CTA (acción principal + acción secundaria).
2. **Prueba Social con Números**: alumnos/clientes, % de éxito, rating, garantía.
3. **Features / Beneficios**: qué incluye, con íconos y beneficios medibles.
4. **Matriz de Precios**: 3 planes (Básico, Profesional/Recomendado, Premium) con features y plan destacado.
5. **Testimonios**: reales, con nombre y rol/ciudad.
6. **Acordeón FAQ**: objeciones de compra (¿cuánto cuesta?, ¿para quién?, ¿garantía?, ¿cómo pago?).
7. **CTA de Cierre**: urgencia (plazas/bonus/descuento) + botón repetido.

## 🎯 Reglas de Conversión
- Hero que responde en 5 segundos: qué es, para quién, qué obtiene, cuánto cuesta.
- 2 CTA visibles (hero + cierre) y uno flotante/móvil opcional.
- Prueba social con números concretos (no "miles", sino "12,400 alumnos").
- Garantía explícita (7/14/30 días, sin letra pequeña).
- Precios transparentes en S/ o US$ con plan destacado ("Más Popular").
- FAQ que destruye objeciones: precio, experiencia previa, tiempo requerido, cancelación, seguridad de pago.
- Urgencia honesta: cupos limitados, bonos por tiempo limitado.

## 🔍 SEO Técnico
- `metaTitle` ≤ 60 caracteres: keyword principal + promesa.
- `metaDescription` ≤ 160 caracteres con CTA ("Empieza hoy con 7 días gratis").
- 8-10 keywords long-tail (ej: "curso de [tema] online", "agencia de [servicio] en Lima").
- Contenido que responde preguntas reales de búsqueda en títulos de sección.

## 🌐 GEO (Generative Engine Optimization)
- **JSON-LD FAQPage**: preguntas de compra que los asistentes de IA citan.
- **JSON-LD Product/Offer** para el plan principal o infoproducto (precio, moneda, disponibilidad).
- **JSON-LD Organization** con contactPoint (WhatsApp) y área de servicio.
- Lenguaje natural, directo y con datos verificables (números, plazos, garantía) para SearchGPT, Gemini, Perplexity y Copilot.
- Responder explícitamente: "¿qué es?", "¿para quién es?", "¿cuánto cuesta?", "¿qué incluye?".

## 🧱 Secuencia de Bloques Sugerida
`hero → features → pricing → testimonials → faq → cta → contact → footer`

## 🎨 Sistema de Diseño
- Tipografía: Inter / system-ui.
- Paleta limpia con acento para CTAs (violeta `#8b5cf6`, azul `#2563eb` o verde `#22c55e`).
- Bordes redondeados 12-16px, mucho whitespace, jerarquía clara.
- **Cero emojis**: iconName de lucide-react (Lightbulb, Megaphone, LineChart, ShieldCheck, Users, Award, Wallet, Clock, Star, Rocket, Video, FileText, Bot, PenTool, GraduationCap).
- Contenido en español, real y específico (nunca lorem ipsum).
