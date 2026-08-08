---
name: ui-ux-corporate
description: Reglas y estándares de diseño UI/UX, SEO y GEO para Páginas Corporativas Multi-Sección (empresas, consultoras, agencias, logística)
---

# UI/UX Skill: Corporate Website Standard (Enterprise)

Este Skill define las reglas obligatorias para **páginas corporativas multi-sección** generadas en WMS Platform: Inicio, Nosotros, Servicios, Metodología, Equipo, Contacto.

## 🧱 Estructura Multi-Sección Obligatoria
1. **Navbar sticky**: Inicio, Servicios, Nosotros, Casos/Portafolio, Equipo, Contacto (adaptable móvil con hamburguesa).
2. **Hero Institucional**: Propuesta de valor B2B, badge de experiencia/años, 2 CTAs (Agendar/Conocer servicios).
3. **Cifras de Impacto**: 4 KPIs (años, proyectos, clientes, % de crecimiento).
4. **Servicios/Áreas**: 6 tarjetas con iconName, título y descripción de entregables.
5. **Metodología/Proceso**: 4 fases con plazos.
6. **Casos de Éxito / Testimonios**: con nombre, cargo y empresa.
7. **Equipo**: integrantes con foto, nombre y rol.
8. **Galería/Portafolio**: imágenes de proyectos o instalaciones.
9. **FAQ Institucional**: ¿cuánto cuesta?, ¿a quién atienden?, ¿cuánto dura?, ¿qué entregables incluye?.
10. **Contacto**: formulario + WhatsApp + CTA de reunión/diagnóstico gratis.
11. **Footer**: marca, copyright, plataforma.

## 🎯 Reglas de Conversión B2B
- Hero con propuesta de valor clara: qué resuelve, para quién, con qué evidencia.
- Cifras concretas (200+ proyectos, 15 años, 38% crecimiento) — nunca vagas.
- Diagnóstico/reunión gratis como gancho de captación.
- Certificaciones y cumplimiento visibles (ISO, SUNAT, sostenibilidad).
- CTA repetido: hero, medio y contacto.

## 🔍 SEO Técnico
- `metaTitle` ≤ 60 caracteres: "Consultora Estratégica en [Ciudad] | [Marca]".
- `metaDescription` ≤ 160 con servicio principal y CTA.
- keywords: "[servicio] corporativo en [ciudad]", "empresa de [rubro]".
- Alt descriptivo en imágenes de equipo y proyectos.

## 🌐 GEO (Generative Engine Optimization)
- **JSON-LD Organization**: name, url, description, contactPoint (teléfono/WhatsApp), areaServed, sameAs (redes).
- **JSON-LD FAQPage**: preguntas institucionales que los motores de IA citan.
- **JSON-LD ProfessionalService** para consultoras/agencias (si aplica).
- Contenido que responde: "¿qué hace la empresa?", "¿cuánto cuesta?", "¿dónde opera?", "¿qué la diferencia?".
- Sección "Nosotros" con misión/visión/valores y años de trayectoria.

## 🧱 Secuencia de Bloques Sugerida
`navbar → hero → features(KPIs) → features(servicios) → features(metodología) → testimonials → team → gallery → faq → contact → footer`

## 🎨 Sistema de Diseño
- Tipografía: Inter / system-ui.
- Paleta corporativa sobria + acento para CTAs (azul `#2563eb`, naranja `#f97316`, violeta `#8b5cf6`).
- Bordes redondeados 12-16px, sombras suaves, fotos profesionales.
- **Cero emojis**: iconName de lucide-react (Briefcase, Compass, Settings, BarChart3, Users, ShieldCheck, Lightbulb, Search, ClipboardList, Rocket, LineChart, Truck, Warehouse, MapPin, BadgeCheck, Target, Eye, Handshake).
- Contenido en español, real y específico (nunca lorem ipsum).
