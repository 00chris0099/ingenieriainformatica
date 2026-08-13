// ═══════════════════════════════════════════════════════════════════════════
// PLANTILLAS ULTRA — tienda virtual, landing de alta conversión y corporativa.
// Máxima complejidad: usan todo el librero de bloques (hero, features,
// product-grid, countdown, gallery, testimonials, newsletter, faq/accordion,
// pricing, vsl, calendar, team, articles, columns anidados, cta, contact,
// footer) y son 100% editables en el builder.
// ═══════════════════════════════════════════════════════════════════════════

export const ULTRA_TEMPLATES = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1) TIENDA VIRTUAL — AuraTech: Electrónica & Gaming Premium
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl-aura-tech',
    name: 'AuraTech - Electrónica & Gaming Premium (Ultra)',
    description: 'Tienda virtual premium multi-ventana (Inicio, Catálogo, Ofertas Flash, Garantías, Contacto): hero inmersivo, garantías con iconos, catálogo con pestañas por categoría, cuenta regresiva de ofertas, opiniones verificadas, newsletter y FAQ.',
    industry: 'tecnologia',
    category: 'ecommerce',
    type: 'store',
    thumbnail: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop',
    seo: {
      title: 'AuraTech | Electrónica y Gaming Premium en Perú',
      description: 'Audífonos, gaming, relojes y accesorios con garantía oficial de 12 meses, envío 24h y devolución en 30 días. Ofertas flash todos los días.',
    },
    settings: {
      fontFamily: 'space-grotesk',
      primaryColor: '#4338ca',
      secondaryColor: '#0b1020',
      accentColor: '#6366f1',
      whatsappNumber: '51999888777',
    },
    blocks: [
      {
        id: 'at-navbar',
        type: 'navbar',
        settings: { backgroundColor: '#0b1020', textColor: '#ffffff', accentColor: '#6366f1' },
        content: {
          announcement: '⚡ ENVÍO GRATIS 24H EN LIMA · GARANTÍA OFICIAL 12 MESES',
          brandName: 'AURATECH',
          links: [
            { label: 'Inicio', windowId: 'home', iconName: 'Home' },
            { label: 'Catálogo', windowId: 'catalogo', iconName: 'ShoppingBag' },
            { label: 'Audífonos', windowId: 'catalogo', categoryId: 'audio', iconName: 'Headphones' },
            { label: 'Gaming', windowId: 'catalogo', categoryId: 'gaming', iconName: 'Gamepad2' },
            { label: 'Ofertas Flash', windowId: 'ofertas', iconName: 'Flame' },
            { label: 'Garantías', windowId: 'garantias', iconName: 'ShieldCheck' },
            { label: 'Contacto', windowId: 'contacto', iconName: 'MessageSquare' },
          ],
        },
      },
      {
        id: 'at-hero',
        type: 'hero',
        windowId: 'home',
        settings: { backgroundColor: '#0b1020', textColor: '#ffffff', accentColor: '#6366f1', paddingY: 110 },
        content: {
          badge: 'LANZAMIENTO · SERIE NEBULA 2026',
          title: 'Tecnología Premium que Eleva tu Experiencia de Juego',
          subtitle: 'Audífonos con cancelación activa de ruido, teclados mecánicos y accesorios gaming con garantía oficial de 12 meses y envío en 24 horas.',
          buttonText: 'Ver Catálogo Completo',
          secondaryButtonText: 'Ofertas Flash (40% OFF)',
          heroImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop',
        },
      },
      {
        id: 'at-trust',
        type: 'features',
        windowId: 'home',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#6366f1', paddingY: 56 },
        content: {
          title: 'Compra con Total Confianza',
          items: [
            { iconName: 'Truck', title: 'Envío 24h', description: 'En Lima Metropolitana. Despacho el mismo día si compras antes de las 4pm.' },
            { iconName: 'RotateCcw', title: 'Devolución 30 días', description: 'Cambios y devoluciones sin preguntas ni letra pequeña.' },
            { iconName: 'ShieldCheck', title: 'Garantía oficial', description: '12 meses de garantía del fabricante en todos los productos.' },
            { iconName: 'Headphones', title: 'Soporte 24/7', description: 'Soporte técnico real por WhatsApp y correo, todos los días.' },
          ],
        },
      },
      {
        id: 'at-catalog',
        type: 'product-grid',
        windowId: 'catalogo',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#6366f1', paddingY: 80 },
        content: {
          title: 'Catálogo AuraTech',
          subtitle: 'Elige tu categoría y encuentra el dispositivo perfecto',
          categoryTabs: [
            { id: 'all', label: 'Todos' },
            { id: 'audio', label: 'Audífonos' },
            { id: 'gaming', label: 'Gaming' },
            { id: 'smart', label: 'Smartwatch' },
            { id: 'accesorios', label: 'Accesorios' },
          ],
          products: [
            { id: 'atp1', category: 'audio', name: 'Audífonos Nebula ANC Pro', price: 'S/ 499', originalPrice: 'S/ 699', discountBadge: '-29%', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop', description: 'Cancelación activa de ruido, 40h de batería y Bluetooth 5.3.' },
            { id: 'atp2', category: 'gaming', name: 'Teclado Mecánico Vertex RGB', price: 'S/ 359', originalPrice: 'S/ 459', discountBadge: '-22%', imageUrl: 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&auto=format&fit=crop', description: 'Switches red hot-swap, RGB por tecla y frame de aluminio.' },
            { id: 'atp3', category: 'smart', name: 'Smartwatch Pulse X2', price: 'S/ 429', originalPrice: 'S/ 549', discountBadge: '-22%', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop', description: 'AMOLED 1.43", GPS, monitoreo de salud y 14 días de batería.' },
            { id: 'atp4', category: 'gaming', name: 'Mouse Inalámbrico Strike Zero', price: 'S/ 199', originalPrice: 'S/ 269', discountBadge: '-26%', imageUrl: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&auto=format&fit=crop', description: '58g ultraligero, sensor de 26,000 DPI y 90h de batería.' },
            { id: 'atp5', category: 'audio', name: 'Parlante Bluetooth Boom Mini', price: 'S/ 149', originalPrice: 'S/ 199', discountBadge: '-25%', imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop', description: 'Sonido 360° resistente al agua, 20h de reproducción.' },
            { id: 'atp6', category: 'accesorios', name: 'Base Cargadora 3 en 1', price: 'S/ 129', originalPrice: 'S/ 169', discountBadge: '-24%', imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop', description: 'Carga tu teléfono, reloj y audífonos a la vez con un solo cable.' },
          ],
        },
      },
      {
        id: 'at-countdown',
        type: 'countdown',
        windowId: 'ofertas',
        settings: { backgroundColor: '#0b1020', textColor: '#ffffff', accentColor: '#6366f1', paddingY: 72 },
        content: {
          title: '⏳ OFERTAS FLASH · HASTA 40% OFF',
          subtitle: 'La oferta se reinicia todos los días a medianoche. No esperes: el stock vuela.',
          targetDate: '2026-09-01T00:00:00',
          buttonText: 'Ver Ofertas por WhatsApp',
          note: 'Aplican términos y condiciones · Máximo 2 unidades por cliente',
        },
      },
      {
        id: 'at-testimonials',
        type: 'testimonials',
        windowId: 'home',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', paddingY: 72 },
        content: {
          title: 'Lo que Dicen Nuestros Clientes',
          items: [
            { text: 'Pedí mis audífonos un lunes a las 3pm y me llegaron al día siguiente. La cancelación de ruido es de otro nivel.', name: 'Diego R.', role: 'Compra verificada · Lima' },
            { text: 'El teclado llegó impecable y con garantía real. Tuve una duda y el soporte me respondió en 5 minutos por WhatsApp.', name: 'Valeria C.', role: 'Compra verificada · Arequipa' },
            { text: 'Me equivoqué de modelo y el cambio fue gratis y sin drama. Se nota que cuidan al cliente.', name: 'Renato M.', role: 'Compra verificada · Trujillo' },
          ],
        },
      },
      {
        id: 'at-newsletter',
        type: 'newsletter',
        windowId: 'home',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#6366f1', paddingY: 64 },
        content: {
          title: 'Únete y Recibe 10% OFF en tu Primera Compra',
          subtitle: 'Ofertas exclusivas, lanzamientos y tutoriales. Sin spam, prometido.',
          buttonText: 'Quiero mi Código',
          placeholder: 'tu@correo.com',
          note: 'Al suscribirte aceptas nuestra política de privacidad.',
        },
      },
      {
        id: 'at-faq',
        type: 'faq',
        windowId: 'garantias',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#6366f1', paddingY: 72 },
        content: {
          title: 'Garantías y Preguntas Frecuentes',
          subtitle: 'Todo lo que necesitas saber antes de comprar',
          items: [
            { question: '¿Cuánto tarda el envío fuera de Lima?', answer: 'Entre 2 y 4 días hábiles a nivel nacional. El rastreo se envía por WhatsApp y correo en cuanto el pedido sale de nuestro almacén.' },
            { question: '¿Cómo funciona la garantía de 12 meses?', answer: 'Todos los productos incluyen garantía oficial del fabricante. Si falla por defecto de fábrica, lo reemplazamos o reparamos sin costo dentro de los 12 meses.' },
            { question: '¿Puedo devolver un producto que no me gustó?', answer: 'Sí, tienes 30 días desde la entrega para devoluciones o cambios. El producto debe estar en su empaque original y sin uso.' },
            { question: '¿Qué métodos de pago aceptan?', answer: 'Tarjetas de crédito y débito, Yape, Plin y transferencia bancaria. Puedes pagar en efectivo contra entrega en Lima.' },
          ],
        },
      },
      {
        id: 'at-cta',
        type: 'cta',
        windowId: 'ofertas',
        settings: { accentColor: '#6366f1', paddingY: 90 },
        content: {
          title: '¿Listo para Actualizar tu Setup?',
          description: 'Asesoría gratis por WhatsApp: te ayudamos a elegir el producto ideal para tu presupuesto y uso.',
          buttonText: 'Hablar con un Asesor',
        },
      },
      {
        id: 'at-contact',
        type: 'contact',
        windowId: 'contacto',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#6366f1', paddingY: 64 },
        content: {
          title: 'Contáctanos — Respondemos en Minutos',
          subtitle: 'Soporte, ventas corporativas y seguimiento de pedidos.',
          buttonText: 'Escribir por WhatsApp',
        },
      },
      {
        id: 'at-footer',
        type: 'footer',
        settings: { backgroundColor: '#070c18', textColor: '#ffffff', paddingY: 48 },
        content: {
          companyName: 'AURATECH PERÚ',
          tagline: 'Tecnología premium con garantía real.',
          copyright: '© 2026 AuraTech. Todos los derechos reservados. Impulsado por WMS Platform.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2) TIENDA VIRTUAL — Bella Natura: Cosmética & Skincare Natural
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl-bella-natura',
    name: 'Bella Natura - Cosmética & Skincare Natural (Ultra)',
    description: 'Tienda virtual de belleza multi-ventana (Inicio, Catálogo, Nuestra Historia, Contacto): hero elegante, beneficios, catálogo por tipo de piel, historia con columnas, rutina en galería, reseñas y newsletter con 10% OFF.',
    industry: 'belleza',
    category: 'ecommerce',
    type: 'store',
    thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&auto=format&fit=crop',
    seo: {
      title: 'Bella Natura | Skincare Natural y Cosméticos Veganos',
      description: 'Cosmética natural libre de parabenos, cruelty-free y con ingredientes peruanos. Envíos a todo el país y rutina personalizada para tu tipo de piel.',
    },
    settings: {
      fontFamily: 'lora',
      primaryColor: '#be185d',
      secondaryColor: '#fdf2f8',
      accentColor: '#ec4899',
      whatsappNumber: '51999888777',
    },
    blocks: [
      {
        id: 'bn-navbar',
        type: 'navbar',
        settings: { backgroundColor: '#ffffff', textColor: '#831843', accentColor: '#be185d' },
        content: {
          announcement: '🌿 100% VEGANO · CRUELTY-FREE · ENVÍOS A TODO EL PERÚ',
          brandName: 'BELLA NATURA',
          links: [
            { label: 'Inicio', windowId: 'home', iconName: 'Home' },
            { label: 'Catálogo', windowId: 'catalogo', iconName: 'ShoppingBag' },
            { label: 'Piel Seca', windowId: 'catalogo', categoryId: 'seca', iconName: 'Droplets' },
            { label: 'Piel Grasa', windowId: 'catalogo', categoryId: 'grasa', iconName: 'Sparkles' },
            { label: 'Ofertas de la Semana', windowId: 'ofertas', iconName: 'Flame' },
            { label: 'Nuestra Historia', windowId: 'historia', iconName: 'Heart' },
            { label: 'Contacto', windowId: 'contacto', iconName: 'MessageSquare' },
          ],
        },
      },
      {
        id: 'bn-hero',
        type: 'hero',
        windowId: 'home',
        settings: { backgroundColor: '#fdf2f8', textColor: '#831843', accentColor: '#be185d', paddingY: 96 },
        content: {
          badge: 'NUEVA LÍNEA · SÉRUM DE COCA & MUCUNA',
          title: 'Skincare Natural que tu Piel Siente y la Naturaleza Aprueba',
          subtitle: 'Fórmulas veganas con ingredientes andinos: coca, sacha inchi y caléndula. Libres de parabenos, sulfatos y crueldad. Tu piel lo nota en 14 días.',
          buttonText: 'Ver Catálogo',
          secondaryButtonText: 'Descubre tu Rutina',
          heroImage: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1000&auto=format&fit=crop',
        },
      },
      {
        id: 'bn-benefits',
        type: 'features',
        windowId: 'home',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#be185d', paddingY: 56 },
        content: {
          title: '¿Por Qué Elegir Bella Natura?',
          items: [
            { iconName: 'Leaf', title: 'Ingredientes reales', description: 'Formulados con extractos botánicos peruanos, no con promesas.' },
            { iconName: 'Heart', title: 'Cruelty-free', description: 'Certificados libres de pruebas en animales y 100% veganos.' },
            { iconName: 'FlaskConical', title: 'Sin tóxicos', description: 'Sin parabenos, sulfatos, ftalatos ni fragancias sintéticas.' },
            { iconName: 'Truck', title: 'Envíos nacionales', description: 'Llega en 2-4 días a todo el Perú, con tracking por WhatsApp.' },
          ],
        },
      },
      {
        id: 'bn-catalog',
        type: 'product-grid',
        windowId: 'catalogo',
        settings: { backgroundColor: '#fdf2f8', textColor: '#831843', accentColor: '#be185d', paddingY: 80 },
        content: {
          title: 'Nuestro Catálogo de Skincare',
          subtitle: 'Filtra por tu tipo de piel y encuentra tu nueva favorita',
          categoryTabs: [
            { id: 'all', label: 'Todos' },
            { id: 'seca', label: 'Piel Seca' },
            { id: 'grasa', label: 'Piel Grasa' },
            { id: 'mixta', label: 'Piel Mixta' },
            { id: 'cuerpo', label: 'Cuidado Corporal' },
          ],
          products: [
            { id: 'bnp1', category: 'seca', name: 'Crema Facial Andina 48h', price: 'S/ 89', originalPrice: 'S/ 120', discountBadge: '-26%', imageUrl: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop', description: 'Hidratación profunda con sacha inchi y manteca de cacao.' },
            { id: 'bnp2', category: 'grasa', name: 'Gel Limpiador Detox Carbón', price: 'S/ 69', originalPrice: 'S/ 95', discountBadge: '-27%', imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop', description: 'Controla brillo y poros con carbón activado y té verde.' },
            { id: 'bnp3', category: 'mixta', name: 'Sérum Vitamina C Andina', price: 'S/ 99', originalPrice: 'S/ 135', discountBadge: '-27%', imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop', description: 'Luminosidad y manchas con camu camu, la fruta con más vitamina C.' },
            { id: 'bnp4', category: 'cuerpo', name: 'Aceite Corporal Sacha Inchi', price: 'S/ 79', originalPrice: 'S/ 105', discountBadge: '-25%', imageUrl: 'https://images.unsplash.com/photo-1600424442717-49f21102db1d?w=600&auto=format&fit=crop', description: 'Nutre y regenera con omega 3,6,9 del sacha inchi.' },
            { id: 'bnp5', category: 'seca', name: 'Tónico Facial Caléndula', price: 'S/ 59', originalPrice: 'S/ 80', discountBadge: '-26%', imageUrl: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=600&auto=format&fit=crop', description: 'Calma y equilibra con caléndula y agua de rosas.' },
            { id: 'bnp6', category: 'grasa', name: 'Mascarilla Arcilla Purificante', price: 'S/ 65', originalPrice: 'S/ 88', discountBadge: '-26%', imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop', description: 'Desintoxica y refina poros con arcilla andina y eucalipto.' },
          ],
        },
      },
      {
        id: 'bn-story',
        type: 'columns',
        windowId: 'historia',
        settings: { columns: '2', gap: '32px', backgroundColor: '#ffffff', paddingY: 80 },
        content: {
          items: [
            {
              width: '50%',
              blocks: [
                { id: 'bn-story-img', type: 'image', settings: { variant: 'plain', borderRadius: '24px', width: '100%' }, content: { src: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop', alt: 'Taller artesanal de Bella Natura', caption: '' } },
              ],
            },
            {
              width: '50%',
              blocks: [
                { id: 'bn-story-text', type: 'text', settings: { variant: 'heading-text' }, content: { title: 'Nuestra Historia: del Valle Sagrado a tu Baño', text: 'Nacimos en el **Valle Sagrado del Cusco** trabajando mano a mano con 40 familias agricultoras que cultivan coca, sacha inchi y caléndula en **agricultura orgánica certificada**.\n\nCada producto se formula en pequeños lotes, respetando las tradiciones andinas de extracción, y se prueba en piel humana real — nunca en animales.\n\n**Nuestra promesa:** transparencia total en ingredientes, precios justos para los productores y resultados que se notan en 14 días o te devolvemos tu dinero.', } },
              ],
            },
          ],
        },
      },
      {
        id: 'bn-routine',
        type: 'gallery',
        windowId: 'historia',
        settings: { backgroundColor: '#fdf2f8', textColor: '#831843', accentColor: '#be185d', paddingY: 72 },
        content: {
          title: 'Tu Rutina en 4 Pasos',
          subtitle: 'Simple, efectiva y 100% natural',
          images: [
            'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?w=600&auto=format&fit=crop',
          ],
        },
      },
      {
        id: 'bn-ofertas',
        type: 'countdown',
        windowId: 'ofertas',
        settings: { backgroundColor: '#4c0519', textColor: '#ffffff', accentColor: '#ec4899', paddingY: 72 },
        content: {
          title: '🌸 SEMANA DE BELLEZA · HASTA 30% OFF',
          subtitle: 'Descuentos exclusivos en nuestra línea completa de skincare natural. Solo por tiempo limitado.',
          targetDate: '2026-08-31T23:59:59',
          buttonText: 'Ver Ofertas por WhatsApp',
          note: 'Aplican términos y condiciones · Sin stock de seguridad: se agota rápido',
        },
      },
      {
        id: 'bn-cta',
        type: 'cta',
        windowId: 'ofertas',
        settings: { accentColor: '#ec4899', paddingY: 80 },
        content: {
          title: 'Tu Piel se lo Merece: Aprovecha la Semana de Belleza',
          description: 'Compras mayores a S/ 150 llevan envío gratis + muestra gratis del sérum de vitamina C.',
          buttonText: 'Comprar por WhatsApp',
        },
      },
      {
        id: 'bn-testimonials',
        type: 'testimonials',
        windowId: 'home',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', paddingY: 72 },
        content: {
          title: 'Reseñas Verificadas de Nuestras Clientes',
          items: [
            { text: 'Mi piel seca por fin encontró paz. La crema andina es magia: en 10 días se me quitó la descamación.', name: 'Rosa M.', role: 'Compra verificada · Lima' },
            { text: 'Me encanta que sean veganos y que apoyen a productores del Cusco. El sérum de vitamina C me dejó la piel luminosa.', name: 'Claudia T.', role: 'Compra verificada · Cusco' },
            { text: 'El gel detox es perfecto para mi piel grasa. Se siente la diferencia de los ingredientes reales.', name: 'Fiorella P.', role: 'Compra verificada · Piura' },
          ],
        },
      },
      {
        id: 'bn-newsletter',
        type: 'newsletter',
        windowId: 'home',
        settings: { backgroundColor: '#fdf2f8', textColor: '#831843', accentColor: '#be185d', paddingY: 64 },
        content: {
          title: 'Recibe 10% OFF + Guía Gratis de Skincare',
          subtitle: 'Tips de cuidado natural, lanzamientos y descuentos exclusivos.',
          buttonText: 'Quiero mi Descuento',
          placeholder: 'tu@correo.com',
          note: 'Un correo a la semana, nunca más.',
        },
      },
      {
        id: 'bn-faq',
        type: 'faq',
        windowId: 'home',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#be185d', paddingY: 64 },
        content: {
          title: 'Preguntas Frecuentes',
          items: [
            { question: '¿Cómo sé qué productos son para mi tipo de piel?', answer: 'Usa las pestañas del catálogo o escríbenos por WhatsApp con una foto de tu rutina actual. Una asesora cosmética te recomienda gratis.' },
            { question: '¿Sus productos tienen certificación vegana?', answer: 'Sí. Todos son 100% veganos y libres de pruebas en animales, certificados por PETA y con ingredientes de comercio justo.' },
            { question: '¿Qué pasa si mi piel no lo acepta?', answer: 'Tienes 14 días de garantía: si no ves mejora, te devolvemos el 100% y además te regalamos una asesoría para encontrar tu rutina ideal.' },
            { question: '¿Hacen envíos internacionales?', answer: 'Por ahora enviamos a todo el Perú. Pronto abriremos envíos a Chile, Ecuador y Colombia.' },
          ],
        },
      },
      {
        id: 'bn-contact',
        type: 'contact',
        windowId: 'contacto',
        settings: { backgroundColor: '#ffffff', textColor: '#831843', accentColor: '#be185d', paddingY: 64 },
        content: {
          title: 'Asesoría Cosmética Gratis',
          subtitle: 'Cuéntanos tu tipo de piel y armamos tu rutina perfecta.',
          buttonText: 'Hablar con una Asesora',
        },
      },
      {
        id: 'bn-footer',
        type: 'footer',
        settings: { backgroundColor: '#4c0519', textColor: '#ffffff', paddingY: 48 },
        content: {
          companyName: 'BELLA NATURA',
          tagline: 'Cosmética natural del Perú para el mundo.',
          copyright: '© 2026 Bella Natura. Todos los derechos reservados. Impulsado por WMS Platform.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3) LANDING ALTA CONVERSIÓN — InvertiPro: Inmobiliaria
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl-inmobiliaria-pro',
    name: 'InvertiPro - Landing Inmobiliaria Alta Conversión (Ultra)',
    description: 'Landing inmobiliaria de una sola ventana: hero con promesa, cifras de respaldo, video VSL del proyecto, beneficios, galería de propiedades, calendario para agendar llamada, testimonios de inversores, FAQ de objeciones, countdown de preventa y CTA final.',
    industry: 'inmobiliaria',
    category: 'landing',
    type: 'landing',
    thumbnail: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop',
    seo: {
      title: 'InvertiPro | Departamentos en Preventa con 12% de Rentabilidad',
      description: 'Proyecto residencial en Miraflores con rentabilidad garantizada de 12% anual. Solo 24 unidades en preventa con 20% de descuento.',
    },
    settings: {
      fontFamily: 'montserrat',
      primaryColor: '#0d9488',
      secondaryColor: '#042f2e',
      accentColor: '#14b8a6',
      whatsappNumber: '51999888777',
    },
    blocks: [
      {
        id: 'ip-hero',
        type: 'hero',
        settings: { backgroundColor: '#042f2e', textColor: '#ffffff', accentColor: '#14b8a6', paddingY: 120 },
        content: {
          badge: 'PREVENTA · SOLO 24 UNIDADES · 20% OFF',
          title: 'Departamentos en Miraflores que Generan 12% de Rentabilidad Anual',
          subtitle: 'Proyecto terminado en 18 meses con contrato notarial, retorno garantizado por el constructor y pagos desde S/ 2,500 al mes. Agéndanos una llamada hoy y reserva tu unidad con S/ 5,000.',
          buttonText: 'Agendar Llamada Gratis',
          secondaryButtonText: 'Ver el Proyecto en Video',
          heroImage: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1000&auto=format&fit=crop',
        },
      },
      {
        id: 'ip-proof',
        type: 'features',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#14b8a6', paddingY: 56 },
        content: {
          title: 'Respaldo Real de Más de 800 Inversores',
          items: [
            { iconName: 'Building2', title: '18 proyectos', description: 'entregados a tiempo en los últimos 6 años.' },
            { iconName: 'Users', title: '800+ inversores', description: 'han confiado en nuestros proyectos.' },
            { iconName: 'TrendingUp', title: '12% retorno', description: 'promedio anual garantizado por contrato.' },
            { iconName: 'Star', title: '4.9/5', description: 'satisfacción de clientes previos.' },
          ],
        },
      },
      {
        id: 'ip-toast',
        type: 'social-proof',
        settings: { enabled: true, interval: 7 },
        content: {
          messages: [
            '🔥 3 personas reservaron unidades esta semana',
            '🏠 Acabamos de vender la unidad 2B — Miraflores',
            '💬 María F. acaba de agendar una llamada',
            '✅ Unidad 4A reservada hoy con entrada de S/ 5,000',
          ],
        },
      },
      {
        id: 'ip-vsl',
        type: 'vsl',
        windowId: 'home',
        settings: { backgroundColor: '#042f2e' },
        content: {
          headline: 'Mira el Proyecto en 4 Minutos: Diseño, Ubicación y Números',
          videoUrl: 'https://www.youtube.com/watch?v=8s1FpXnN1mI',
          ctaText: 'Agendar Mi Llamada Ahora',
          ctaUrl: '#agendar',
        },
      },
      {
        id: 'ip-benefits',
        type: 'features',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#14b8a6', paddingY: 80 },
        content: {
          title: '¿Por Qué los Inversores Eligen InvertiPro?',
          items: [
            { iconName: 'FileCheck', title: 'Contrato notarial', description: 'Retorno garantizado por escrito, no por promesa verbal.' },
            { iconName: 'Banknote', title: 'Entradas desde S/ 5,000', description: 'Reserva tu unidad con el mínimo y financia el resto en cuotas.' },
            { iconName: 'MapPin', title: 'Ubicación prime', description: 'A 5 min de la Costa Verde y 10 min de los principales centros comerciales.' },
            { iconName: 'Building2', title: 'Constructor certificado', description: '18 proyectos entregados a tiempo y con licencia de obra vigente.' },
            { iconName: 'BarChart3', title: 'Valorización garantizada', description: 'Estudios de mercado proyectan +35% de valorización al entrega.' },
            { iconName: 'ShieldCheck', title: 'Fondo de respaldo', description: 'Tu inversión está protegida por un seguro de caución.' },
          ],
        },
      },
      {
        id: 'ip-gallery',
        type: 'gallery',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#14b8a6', paddingY: 80 },
        content: {
          title: 'Así se Verá Tu Inversión',
          subtitle: 'Renders oficiales del proyecto Solara Miraflores',
          images: [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&auto=format&fit=crop',
          ],
        },
      },
      {
        id: 'ip-calendar',
        type: 'calendar',
        settings: { backgroundColor: '#042f2e', columns: '2' },
        content: {
          title: 'Agenda tu Llamada de 20 Minutos',
          subtitle: 'Un asesor te muestra números, planos y el simulador de rentabilidad. Sin compromiso.',
          buttonLabel: 'Confirmar mi llamada',
          whatsappNumber: '51999888777',
          hours: ['10:00', '11:30', '16:00', '18:30'],
          note: '20 minutos · 100% sin compromiso',
        },
      },
      {
        id: 'ip-testimonials',
        type: 'testimonials',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', paddingY: 72 },
        content: {
          title: 'Inversores que ya Retiran Ganancias',
          items: [
            { text: 'Compré una unidad en preventa 2022 y al entrega la vendí con 38% de ganancia. El proceso con InvertiPro fue transparente de principio a fin.', name: 'Jorge A.', role: 'Inversor desde 2021 · 3 unidades' },
            { text: 'Lo que más valoro es que el retorno está en contrato. Recibo mis pagos trimestrales puntuales hace 2 años.', name: 'María F.', role: 'Inversora · 2 unidades' },
            { text: 'Empecé con una sola entrada de S/ 5,000. Hoy tengo 4 unidades en dos proyectos distintos. El simulador de rentabilidad no miente.', name: 'Carlos P.', role: 'Inversor · 4 unidades' },
          ],
        },
      },
      {
        id: 'ip-faq',
        type: 'faq',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#14b8a6', paddingY: 72 },
        content: {
          title: 'Preguntas de Inversores (Objeciones)',
          items: [
            { question: '¿Qué pasa si el proyecto se retrasa?', answer: 'El contrato incluye penalidades por retraso: por cada mes de demora, tu retorno anual sube 2 puntos. Además tu capital está cubierto por seguro de caución.' },
            { question: '¿Es legal la garantía de retorno?', answer: 'Sí. Se formaliza como un compromiso de compra venta con cláusula de retorno, respaldado por notaría y registros públicos. Nuestros abogados revisan cada contrato.' },
            { question: '¿Puedo invertir desde el extranjero?', answer: 'Absolutamente. Atendemos a inversores de EE.UU., España y Chile con firma digital notarial y cuentas en dólares o soles.' },
            { question: '¿Cuál es el ticket mínimo?', answer: 'La entrada mínima es de S/ 5,000 (US$ 1,300 aprox.) y el total promedio de una unidad de inversión es de S/ 89,000 con cuotas de 36 meses.' },
          ],
        },
      },
      {
        id: 'ip-countdown',
        type: 'countdown',
        settings: { backgroundColor: '#042f2e', textColor: '#ffffff', accentColor: '#14b8a6', paddingY: 72 },
        content: {
          title: '⏰ El 20% OFF de Preventa Termina en…',
          subtitle: 'Después de este conteo, el precio sube 20%. Reserva tu unidad hoy.',
          targetDate: '2026-09-15T23:59:59',
          buttonText: 'Agendar Llamada y Congelar Precio',
          note: 'Solo 24 unidades · 11 ya reservadas',
        },
      },
      {
        id: 'ip-cta',
        type: 'cta',
        settings: { accentColor: '#14b8a6', paddingY: 100 },
        content: {
          title: 'Tu Unidad en Preventa Puede Esperar… Tu Competidor No',
          description: 'Los proyectos de esta zona se agotaron en 6 semanas. Agenda hoy tu llamada de 20 minutos y congelas el precio de preventa por 7 días.',
          buttonText: 'Agendar Mi Llamada Gratis',
        },
      },
      {
        id: 'ip-contact',
        type: 'contact',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#14b8a6', paddingY: 56 },
        content: {
          title: '¿Prefieres WhatsApp?',
          subtitle: 'Un asesor inmobiliario responde en menos de 10 minutos en horario de oficina.',
          buttonText: 'Escribir por WhatsApp',
        },
      },
      {
        id: 'ip-footer',
        type: 'footer',
        settings: { backgroundColor: '#022c2b', textColor: '#ffffff', paddingY: 48 },
        content: {
          companyName: 'INVERTIPRO INMOBILIARIA',
          tagline: 'Proyectos que generan rentabilidad real.',
          copyright: '© 2026 InvertiPro. Todos los derechos reservados. Impulsado por WMS Platform.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4) LANDING ALTA CONVERSIÓN — SmileStudio: Clínica Dental
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl-clinica-dental',
    name: 'SmileStudio - Landing Clínica Dental (Ultra)',
    description: 'Landing dental de una sola ventana: hero con resultado, servicios con iconos, countdown de promoción, planes de tratamiento con precios, calendario para reservar cita, testimonios de pacientes, FAQ y CTA de urgencia.',
    industry: 'salud',
    category: 'landing',
    type: 'landing',
    thumbnail: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&auto=format&fit=crop',
    seo: {
      title: 'SmileStudio | Clínica Dental Moderna en Lima',
      description: 'Limpiezas, ortodoncia invisible y blanqueamiento con tecnología láser. +10,000 pacientes atendidos. Promoción de bienvenida 50% OFF en tu primera limpieza.',
    },
    settings: {
      fontFamily: 'poppins',
      primaryColor: '#0284c7',
      secondaryColor: '#0c4a6e',
      accentColor: '#38bdf8',
      whatsappNumber: '51999888777',
    },
    blocks: [
      {
        id: 'sd-hero',
        type: 'hero',
        settings: { backgroundColor: '#0c4a6e', textColor: '#ffffff', accentColor: '#38bdf8', paddingY: 110 },
        content: {
          badge: '+10,000 PACIENTES · CLÍNICA MODERNA EN MIRAFLORES',
          title: 'Sonríe con Confianza: Odontología de Precisión sin Dolor',
          subtitle: 'Tecnología láser, sedación consciente y especialistas con 15+ años de experiencia. Primera consulta de evaluación con radiografía digital GRATIS esta semana.',
          buttonText: 'Reservar mi Cita Ahora',
          secondaryButtonText: 'Ver Planes de Tratamiento',
          heroImage: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1000&auto=format&fit=crop',
        },
      },
      {
        id: 'sd-services',
        type: 'features',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#38bdf8', paddingY: 80 },
        content: {
          title: 'Tratamientos con Tecnología de Punta',
          subtitle: 'Todo bajo un mismo techo, con garantía escrita',
          items: [
            { iconName: 'Sparkles', title: 'Blanqueamiento Láser', description: 'Hasta 8 tonos más blanco en una sola sesión de 60 minutos.' },
            { iconName: 'AlignJustify', title: 'Ortodoncia Invisible', description: 'Alineadores removibles con escaneo 3D, sin brackets ni dolor.' },
            { iconName: 'ShieldCheck', title: 'Implantes Dentales', description: 'Colocación con guía 3D y garantía de 10 años del implante.' },
            { iconName: 'Smile', title: 'Carillas de Porcelana', description: 'Diseño de sonrisa digital: mira tu resultado antes de empezar.' },
            { iconName: 'HeartPulse', title: 'Endodoncia Indolora', description: 'Tratamiento de conducto en 1-2 sesiones con microscopio.' },
            { iconName: 'Baby', title: 'Odontopediatría', description: 'Especialistas en niños con sedación consciente y ambiente lúdico.' },
          ],
        },
      },
      {
        id: 'sd-countdown',
        type: 'countdown',
        settings: { backgroundColor: '#0c4a6e', textColor: '#ffffff', accentColor: '#38bdf8', paddingY: 72 },
        content: {
          title: '🎁 50% OFF en tu Primera Limpieza Dental',
          subtitle: 'Promoción de bienvenida válida solo para pacientes nuevos. La evaluación con radiografía digital es gratis.',
          targetDate: '2026-08-31T23:59:59',
          buttonText: 'Reclamar mi 50% OFF',
          note: 'Cupo limitado: 30 cupos por semana',
        },
      },
      {
        id: 'sd-pricing',
        type: 'pricing',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#38bdf8', paddingY: 80 },
        content: {
          title: 'Planes y Precios Transparentes',
          subtitle: 'Precios en soles, sin sorpresas. Financiamiento en 6 cuotas sin intereses.',
          plans: [
            { name: 'Chequeo Completo', price: 'S/ 99', features: ['Evaluación y radiografía digital', 'Limpieza profunda', 'Plan de tratamiento digital', 'Informe fotográfico'], highlight: false },
            { name: 'Blanqueamiento', price: 'S/ 349', features: ['Blanqueamiento láser 1 sesión', 'Hasta 8 tonos más blanco', 'Kit de mantenimiento incluido', 'Garantía de 12 meses'], highlight: true },
            { name: 'Ortodoncia Invisible', price: 'S/ 89/mes', features: ['Escaneo 3D gratis', 'Alineadores personalizados', 'Ajustes cada 6 semanas', 'Garantía de resultado'], highlight: false },
          ],
        },
      },
      {
        id: 'sd-calendar',
        type: 'calendar',
        settings: { backgroundColor: '#ffffff', columns: '2' },
        content: {
          title: 'Reserva tu Cita en 30 Segundos',
          subtitle: 'Elige día y hora. Confirmamos por WhatsApp al instante.',
          buttonLabel: 'Confirmar mi cita',
          whatsappNumber: '51999888777',
          hours: ['09:00', '11:00', '15:00', '17:30'],
          note: 'Recibirás recordatorio 24h antes',
        },
      },
      {
        id: 'sd-testimonials',
        type: 'testimonials',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', paddingY: 72 },
        content: {
          title: 'Pacientes que ya Sonríen Diferente',
          items: [
            { text: 'Tenía pánico al dentista desde niña. Acá me explicaron todo, usaron sedación consciente y me quedé dormida en el tratamiento. Cambió mi vida.', name: 'Andrea L.', role: 'Paciente · Endodoncia' },
            { text: 'El blanqueamiento láser es real: salí con 7 tonos más blanco el mismo día. El antes/después que me mostraron con diseño digital fue exacto.', name: 'Marco S.', role: 'Paciente · Blanqueamiento' },
            { text: 'Llevo 8 meses con los alineadores. Nadie nota que los uso y los resultados son increíbles. El seguimiento mensual es impecable.', name: 'Karla V.', role: 'Paciente · Ortodoncia invisible' },
          ],
        },
      },
      {
        id: 'sd-faq',
        type: 'faq',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#38bdf8', paddingY: 72 },
        content: {
          title: 'Preguntas Frecuentes',
          items: [
            { question: '¿Duele el blanqueamiento láser?', answer: 'No. Usamos tecnología láser de baja temperatura y gel desensibilizante. El 98% de nuestros pacientes reporta cero molestias y resultados de 3 a 8 tonos más blancos.' },
            { question: '¿Cómo funciona la primera consulta gratis?', answer: 'Esta semana la evaluación con radiografía digital es gratis para pacientes nuevos. Incluye revisión completa, diagnóstico y plan de tratamiento con precios transparentes.' },
            { question: '¿Aceptan seguros?', answer: 'Trabajamos con las principales EPS y aseguradoras del país. Además ofrecemos financiamiento propio en 6 cuotas sin intereses.' },
            { question: '¿Hay urgencias dentales?', answer: 'Sí, atendemos urgencias todos los días incluidos domingos. Escríbenos por WhatsApp y te atendemos el mismo día.' },
          ],
        },
      },
      {
        id: 'sd-cta',
        type: 'cta',
        settings: { accentColor: '#38bdf8', paddingY: 90 },
        content: {
          title: '¿Tienes Dolor o Urgencia Dental?',
          description: 'No esperes al lunes. Contáctanos ahora y agenda tu atención el mismo día, incluso domingos.',
          buttonText: 'Atención de Urgencia por WhatsApp',
        },
      },
      {
        id: 'sd-contact',
        type: 'contact',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#38bdf8', paddingY: 56 },
        content: {
          title: '¿Prefieres Hablar Directo?',
          subtitle: 'Coordinadora dental disponible de 8am a 8pm.',
          buttonText: 'Llamar por WhatsApp',
        },
      },
      {
        id: 'sd-footer',
        type: 'footer',
        settings: { backgroundColor: '#082f49', textColor: '#ffffff', paddingY: 48 },
        content: {
          companyName: 'SMILE STUDIO CLÍNICA DENTAL',
          tagline: 'Sonrisas saludables con tecnología de precisión.',
          copyright: '© 2026 SmileStudio. Todos los derechos reservados. Impulsado por WMS Platform.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5) CORPORATIVA — LexPartner: Bufete Jurídico
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl-lex-partner',
    name: 'LexPartner - Bufete Jurídico Corporativo (Ultra)',
    description: 'Sitio corporativo para estudios de abogados multi-ventana (Inicio, Servicios, Equipo, Blog, Contacto): hero institucional, cifras de éxito, áreas de práctica, socios, artículos legales, FAQ y contacto confidencial.',
    industry: 'legal',
    category: 'corporate',
    type: 'corporate',
    thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop',
    seo: {
      title: 'LexPartner | Estudio Jurídico Corporativo & Litigio',
      description: 'Más de 25 años defendiendo los intereses de las empresas líderes del Perú. Derecho corporativo, tributario, laboral y arbitraje.',
    },
    settings: {
      fontFamily: 'playfair',
      primaryColor: '#b45309',
      secondaryColor: '#1c1917',
      accentColor: '#f59e0b',
      whatsappNumber: '51999888777',
    },
    blocks: [
      {
        id: 'lx-navbar',
        type: 'navbar',
        settings: { backgroundColor: '#1c1917', textColor: '#ffffff', accentColor: '#f59e0b' },
        content: {
          announcement: 'BUFETE DE NEGOCIOS · DESDE 1999 · CONFIDENCIALIDAD ABSOLUTA',
          brandName: 'LEXPARTNER',
          links: [
            { label: 'Inicio', windowId: 'home', iconName: 'Home' },
            { label: 'Servicios', windowId: 'servicios', iconName: 'Briefcase' },
            { label: 'Equipo', windowId: 'equipo', iconName: 'Users' },
            { label: 'Blog Legal', windowId: 'blog', iconName: 'Newspaper' },
            { label: 'Contacto', windowId: 'contacto', iconName: 'MessageSquare' },
          ],
        },
      },
      {
        id: 'lx-hero',
        type: 'hero',
        windowId: 'home',
        settings: { backgroundColor: '#1c1917', textColor: '#ffffff', accentColor: '#f59e0b', paddingY: 110 },
        content: {
          badge: '+25 AÑOS DEFENDIENDO EMPRESAS LÍDERES',
          title: 'Estrategia Legal que Protege tu Empresa y tu Patrimonio',
          subtitle: 'Corporativo, tributario, laboral y arbitraje con una visión de negocio. Atendemos a más de 120 empresas y 60% de nuestros clientes nos mantienen hace más de 10 años.',
          buttonText: 'Consulta Confidencial Gratis',
          secondaryButtonText: 'Ver Áreas de Práctica',
          heroImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1000&auto=format&fit=crop',
        },
      },
      {
        id: 'lx-stats',
        type: 'features',
        windowId: 'home',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#f59e0b', paddingY: 64 },
        content: {
          title: 'Nuestra Trayectoria en Cifras',
          items: [
            { iconName: 'Scale', title: '+25 años', description: 'de ejercicio profesional continuo desde 1999.' },
            { iconName: 'Building2', title: '120+ empresas', description: 'atendidas de forma recurrente en 12 sectores.' },
            { iconName: 'Gavel', title: 'S/ 400M+', description: 'en disputas recuperadas para nuestros clientes.' },
            { iconName: 'Award', title: '98% éxito', description: 'en casos llevados a arbitraje nacional e internacional.' },
          ],
        },
      },
      {
        id: 'lx-practice',
        type: 'features',
        windowId: 'servicios',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#f59e0b', paddingY: 80 },
        content: {
          title: 'Áreas de Práctica',
          subtitle: 'Especialistas por materia, un solo socio responsable por caso',
          items: [
            { iconName: 'Building2', title: 'Corporativo & M&A', description: 'Constitución, fusiones, adquisiciones y gobiernos corporativos.' },
            { iconName: 'Receipt', title: 'Tributario', description: 'Planificación fiscal, fiscalizaciones y controversias con SUNAT.' },
            { iconName: 'Users', title: 'Laboral Corporativo', description: 'Contratos, reestructuraciones y defensa en demandas laborales.' },
            { iconName: 'Scale', title: 'Arbitraje & Litigio', description: 'Estrategia de alta complejidad ante tribunales y centros de arbitraje.' },
            { iconName: 'ShieldCheck', title: 'Compliance & Riesgos', description: 'Programas de cumplimiento, prevención de lavado y ética corporativa.' },
            { iconName: 'FileText', title: 'Contratos & Negocios', description: 'Redacción y negociación de contratos nacionales e internacionales.' },
          ],
        },
      },
      {
        id: 'lx-team',
        type: 'team',
        windowId: 'equipo',
        settings: { backgroundColor: '#1c1917', textColor: '#ffffff', accentColor: '#f59e0b', paddingY: 80 },
        content: {
          title: 'Socios que Lideran tus Casos',
          subtitle: 'Cada cliente tiene un socio responsable directo',
          items: [
            { name: 'Dr. Ricardo Peña', role: 'Socio Fundador · Corporativo', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop' },
            { name: 'Dra. Ana Ríos', role: 'Socia · Tributario', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop' },
            { name: 'Dr. Miguel Torres', role: 'Socio · Litigio y Arbitraje', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop' },
            { name: 'Dra. Lucía Vela', role: 'Socia · Laboral', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop' },
          ],
        },
      },
      {
        id: 'lx-blog',
        type: 'articles',
        windowId: 'blog',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#f59e0b', paddingY: 80, columns: '3' },
        content: {
          title: 'Blog Legal & Compliance',
          subtitle: 'Análisis de nuestros socios sobre lo que mueve el derecho empresarial',
          articles: [
            {
              id: 'lxart1',
              title: 'Nueva ley laboral: 5 obligaciones que tu empresa debe cumplir desde enero',
              excerpt: 'El reglamento cambia la jornada, los descansos y el registro de horas. Te contamos qué ajustar antes de que llegue la primera fiscalización.',
              date: '2026-07-25',
              imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&auto=format&fit=crop',
              link: '#',
              tag: 'Laboral',
            },
            {
              id: 'lxart2',
              title: 'Tributario: cómo prepararte ante una fiscalización de SUNAT en 2026',
              excerpt: 'Los índices de fiscalización aumentaron 30%. Estos son los documentos que revisamos primero cuando defendemos a un cliente.',
              date: '2026-06-30',
              imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop',
              link: '#',
              tag: 'Tributario',
            },
            {
              id: 'lxart3',
              title: 'Arbitraje internacional: la cláusula que salva (o condena) tu contrato',
              excerpt: 'Una cláusula arbitral mal redactada puede costarte millones. Analizamos las 3 redacciones más comunes y sus riesgos.',
              date: '2026-05-18',
              imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop',
              link: '#',
              tag: 'Arbitraje',
            },
          ],
        },
      },
      {
        id: 'lx-faq',
        type: 'faq',
        windowId: 'home',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#f59e0b', paddingY: 64 },
        content: {
          title: 'Preguntas Frecuentes Empresariales',
          items: [
            { question: '¿Cómo cobran sus honorarios?', answer: 'Según la materia: hora-hombre, honorarios fijos por proyecto o éxito. Te entregamos una propuesta económica clara y por escrito antes de cualquier compromiso.' },
            { question: '¿Atienden emergencias legales fuera de horario?', answer: 'Sí. Nuestros clientes recurrentes tienen acceso a una línea de urgencia 24/7 con abogado de guardia.' },
            { question: '¿Qué información debo traer a la primera consulta?', answer: 'Nada en particular. La primera consulta es para escuchar tu caso y definir la estrategia. Si es necesario, te pediremos documentos específicos después.' },
            { question: '¿Manejan casos de clientes del extranjero?', answer: 'Sí, el 25% de nuestros clientes son grupos internacionales. Coordinamos por videollamada y con poderes notariales digitales.' },
          ],
        },
      },
      {
        id: 'lx-contact',
        type: 'contact',
        windowId: 'contacto',
        settings: { backgroundColor: '#1c1917', textColor: '#ffffff', accentColor: '#f59e0b', paddingY: 72 },
        content: {
          title: 'Consulta Confidencial Gratis',
          subtitle: '30 minutos con un socio. Tu información está protegida por secreto profesional.',
          buttonText: 'Solicitar Consulta por WhatsApp',
        },
      },
      {
        id: 'lx-footer',
        type: 'footer',
        settings: { backgroundColor: '#0c0a09', textColor: '#ffffff', paddingY: 48 },
        content: {
          companyName: 'LEXPARTNER ABOGADOS',
          tagline: 'Estrategia legal para empresas que deciden.',
          copyright: '© 2026 LexPartner. Todos los derechos reservados. Impulsado por WMS Platform.',
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6) CORPORATIVA — GrandLuxe: Hotel & Turismo
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'tpl-grand-luxe',
    name: 'GrandLuxe - Hotel & Turismo Corporativo (Ultra)',
    description: 'Sitio corporativo hotelero multi-ventana (Inicio, Habitaciones, Experiencias, Contacto): hero panorámico, amenidades, galería de suites, testimonios de huéspedes, experiencias en columnas, calendario de reservas y contacto.',
    industry: 'turismo',
    category: 'corporate',
    type: 'corporate',
    thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop',
    seo: {
      title: 'GrandLuxe | Hotel Boutique de Lujo en Cusco',
      description: 'Hotel boutique 5 estrellas en el corazón de Cusco: suites con vista a los Andes, spa andino, gastronomía de altura y experiencias únicas.',
    },
    settings: {
      fontFamily: 'playfair',
      primaryColor: '#b45309',
      secondaryColor: '#292524',
      accentColor: '#d97706',
      whatsappNumber: '51999888777',
    },
    blocks: [
      {
        id: 'gl-navbar',
        type: 'navbar',
        settings: { backgroundColor: '#292524', textColor: '#ffffff', accentColor: '#d97706' },
        content: {
          announcement: '★★★★★ HOTEL BOUTIQUE · VALLE SAGRADO DEL CUSCO',
          brandName: 'GRAND LUXE',
          links: [
            { label: 'Inicio', windowId: 'home', iconName: 'Home' },
            { label: 'Habitaciones', windowId: 'habitaciones', iconName: 'BedDouble' },
            { label: 'Experiencias', windowId: 'experiencias', iconName: 'Mountain' },
            { label: 'Reservas', windowId: 'reservas', iconName: 'CalendarDays' },
            { label: 'Contacto', windowId: 'contacto', iconName: 'MessageSquare' },
          ],
        },
      },
      {
        id: 'gl-hero',
        type: 'hero',
        windowId: 'home',
        settings: { backgroundColor: '#292524', textColor: '#ffffff', accentColor: '#d97706', paddingY: 120 },
        content: {
          badge: 'TOP 10 HOTELES BOUTIQUE · LATAM 2026',
          title: 'El Lujo Andino, a 3,400 Metros de Altura',
          subtitle: '22 suites con vista al Valle Sagrado, spa de agua de montaña, gastronomía de altura y expediciones privadas a Machu Picchu.',
          buttonText: 'Reservar Ahora',
          secondaryButtonText: 'Ver Habitaciones',
          heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop',
        },
      },
      {
        id: 'gl-amenities',
        type: 'features',
        windowId: 'home',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#d97706', paddingY: 64 },
        content: {
          title: 'Amenidades Incluidas en tu Estadía',
          items: [
            { iconName: 'Mountain', title: 'Vista panorámica', description: 'Todas las suites miran al Valle Sagrado y las montañas.' },
            { iconName: 'Sparkles', title: 'Spa Andino', description: 'Baños termales privados y masajes con piedras calientes.' },
            { iconName: 'UtensilsCrossed', title: 'Gastronomía de altura', description: 'Menú degustación con ingredientes locales y vinos peruanos.' },
            { iconName: 'Car', title: 'Transfer privado', description: 'Recojo en el aeropuerto y traslados a Machu Picchu.' },
            { iconName: 'Wifi', title: 'WiFi de fibra', description: 'Conexión estable incluso en las zonas comunes al aire libre.' },
            { iconName: 'ShieldCheck', title: 'Oxígeno en suite', description: 'Sistema de oxigenación para una adaptación confortable.' },
          ],
        },
      },
      {
        id: 'gl-suites',
        type: 'gallery',
        windowId: 'habitaciones',
        settings: { backgroundColor: '#f8fafc', textColor: '#0f172a', accentColor: '#d97706', paddingY: 80 },
        content: {
          title: 'Nuestras Suites',
          subtitle: 'Diseño contemporáneo que dialoga con lo andino',
          images: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=600&auto=format&fit=crop',
          ],
        },
      },
      {
        id: 'gl-testimonials',
        type: 'testimonials',
        windowId: 'home',
        settings: { backgroundColor: '#ffffff', textColor: '#0f172a', paddingY: 72 },
        content: {
          title: 'Lo que Dicen Nuestros Huéspedes',
          items: [
            { text: 'La vista al amanecer desde la suite es inolvidable. El servicio supera al de hoteles de 5 estrellas en Europa.', name: 'Caroline M.', role: 'Huésped · Estados Unidos' },
            { text: 'El spa andino después de subir a Machu Picchu es exactamente lo que el cuerpo necesita. Volveremos seguro.', name: 'Fernando G.', role: 'Huésped · Chile' },
            { text: 'Celebramos nuestros 25 años de casados acá. El menú degustación y la suite con chimenea fueron perfectos.', name: 'Patricia y Luis', role: 'Huéspedes · Perú' },
          ],
        },
      },
      {
        id: 'gl-experiences',
        type: 'columns',
        windowId: 'experiencias',
        settings: { columns: '2', gap: '28px', backgroundColor: '#f8fafc', paddingY: 80 },
        content: {
          items: [
            {
              width: '50%',
              blocks: [
                { id: 'gl-exp1', type: 'image', settings: { variant: 'caption', borderRadius: '20px' }, content: { src: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&auto=format&fit=crop', alt: 'Camino Inca', caption: 'Expedición privada al Camino Inca' } },
              ],
            },
            {
              width: '50%',
              blocks: [
                { id: 'gl-exp2', type: 'image', settings: { variant: 'caption', borderRadius: '20px' }, content: { src: 'https://images.unsplash.com/photo-1533106418989-88406c7cc8ca?w=800&auto=format&fit=crop', alt: 'Valle Sagrado en globo', caption: 'Paseo en globo sobre el Valle Sagrado' } },
              ],
            },
          ],
        },
      },
      {
        id: 'gl-calendar',
        type: 'calendar',
        windowId: 'reservas',
        settings: { backgroundColor: '#292524', columns: '2' },
        content: {
          title: 'Reserva tu Estadía',
          subtitle: 'Elige tu fecha y te confirmamos disponibilidad al instante por WhatsApp.',
          buttonLabel: 'Confirmar solicitud de reserva',
          whatsappNumber: '51999888777',
          hours: ['09:00', '12:00', '15:00', '18:00'],
          note: 'Check-in 15:00 · Check-out 11:00',
        },
      },
      {
        id: 'gl-contact',
        type: 'contact',
        windowId: 'contacto',
        settings: { backgroundColor: '#ffffff', textColor: '#292524', accentColor: '#d97706', paddingY: 64 },
        content: {
          title: '¿Planeas tu Viaje al Cusco?',
          subtitle: 'Nuestro equipo de reservas responde en menos de 1 hora.',
          buttonText: 'Hablar con Reservas por WhatsApp',
        },
      },
      {
        id: 'gl-footer',
        type: 'footer',
        settings: { backgroundColor: '#1c1917', textColor: '#ffffff', paddingY: 48 },
        content: {
          companyName: 'GRAND LUXE CUSCO',
          tagline: 'El lujo andino en su máxima expresión.',
          copyright: '© 2026 GrandLuxe. Todos los derechos reservados. Impulsado por WMS Platform.',
        },
      },
    ],
  },
]
