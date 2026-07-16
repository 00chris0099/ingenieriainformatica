import { Metadata } from 'next';
import FAQSchema from '@/components/geo/FAQSchema';
import BreadcrumbSchema, { Breadcrumbs } from '@/components/geo/BreadcrumbSchema';
import SpeakableSchema from '@/components/geo/SpeakableSchema';

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description: 'Resuelve tus dudas sobre envios, pagos, garantias, devoluciones y productos de AdriSu Kids - Tienda de muebles para bebes en Peru.',
};

const faqs = [
  // ENVÍOS Y ENTREGAS (10)
  { q: '¿Envían a todo Perú?', a: 'Sí, realizamos envíos a todo el territorio peruano. En Lima la entrega es en 2-5 días hábiles y a provincias en 5-10 días hábiles.' },
  { q: '¿Cuánto cuesta el envío?', a: 'El envío es GRATIS en compras mayores a S/ 200. Para compras menores, el costo varía según la zona: Lima S/ 15-25, Provincias S/ 25-45.' },
  { q: '¿Cómo puedo rastrear mi pedido?', a: 'Una vez enviado, recibirás un correo con el número de seguimiento. También puedes consultar el estado en tu cuenta en la sección "Mis Pedidos".' },
  { q: '¿Puedo cambiar la dirección de entrega después de comprar?', a: 'Sí, puedes cambiar la dirección mientras el pedido no haya sido despachado. Contáctanos al 999 111 222 o por WhatsApp.' },
  { q: '¿Hacen entregas los fines de semana?', a: 'Las entregas en Lima se realizan de lunes a sábado de 9am a 6pm. No realizamos entregas los domingos ni feriados.' },
  { q: '¿Qué transportista usan?', a: 'Trabajamos con transportistas confiables de primera línea. El transportista se asigna según tu zona de entrega.' },
  { q: '¿Puedo elegir la hora de entrega?', a: 'En Lima podemos coordinar una franja horaria preferida (mañana o tarde). A provincias la entrega es en horario laboral.' },
  { q: '¿Qué pasa si no estoy en casa cuando llega el envío?', a: 'El transportista intentará contactarte. Si no es posible, reprogramará la entrega para el siguiente día hábil sin costo adicional.' },
  { q: '¿Los muebles vienen armados?', a: 'Algunos productos vienen armados y otros requieren ensamblaje. Incluimos instrucciones detalladas y en muchos casos herramientas básicas.' },
  { q: '¿Puedo recoger mi pedido en tienda?', a: 'Actualmente solo vendemos online. Estamos trabajando en habilitar un punto de recogida en Lima.' },

  // PAGOS Y DEVOLUCIONES (10)
  { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos: Tarjeta de crédito/débito (via MercadoPago), Yape, Plin, Transferencia bancaria y Contraentrega (solo Lima).' },
  { q: '¿Puedo pagar en cuotas?', a: 'Sí, con tarjeta de crédito puedes pagar en hasta 12 cuotas via MercadoPago. El número de cuotas aparece al momento del checkout.' },
  { q: '¿Es seguro pagar con tarjeta en su tienda?', a: 'Sí, utilizamos MercadoPago que cuenta con certificación PCI DSS. Tus datos de tarjeta nunca se almacenan en nuestros servidores.' },
  { q: '¿Cómo pago con Yape o Plin?', a: 'Al elegir Yape o Plin, te mostramos un código QR con el monto exacto. Realizas la transferencia y subes el comprobante de pago.' },
  { q: '¿Aceptan contraentrega?', a: 'Sí, aceptamos contraentrega solo en Lima. El pago se realiza en efectivo al momento de la entrega. Hay un recargo de S/ 5.' },
  { q: '¿Puedo cancelar mi pedido?', a: 'Sí, puedes cancelar sin costo mientras el pedido no haya sido despachado. Si ya fue despachado, debes esperar la entrega y solicitar devolución.' },
  { q: '¿Cómo solicito una devolución?', a: 'Contacta al 999 111 222 dentro de los primeros 30 días. El producto debe estar en estado original y embalaje. El reembolso se realiza en 5-7 días hábiles.' },
  { q: '¿Quién paga el envío de devolución?', a: 'El costo del envío de devolución es por cuenta del cliente. Nosotros coordinamos la recogida con el transportista.' },
  { q: '¿Qué pasa si el producto llega dañado?', a: 'Fotografía el daño al momento de la entrega y contáctanos inmediatamente. Cambiamos el producto sin costo para ti.' },
  { q: '¿Puedo cambiar un producto por otro?', a: 'Sí, dentro de los primeros 30 días. El producto debe estar sin usar y con embalaje original. Coordinamos el cambio sin costo si es por defecto de fábrica.' },

  // GARANTÍA Y SOPORTE (5)
  { q: '¿Cuánto dura la garantía?', a: 'Todos nuestros productos tienen 1 año de garantía contra defectos de fabricación. La garantía inicia desde la fecha de compra.' },
  { q: '¿Qué cubre la garantía?', a: 'La garantía cubre defectos de fabricación, materiales defectuosos y problemas estructurales. No cubre daños por mal uso, accidentes o desgaste natural.' },
  { q: '¿Cómo activo la garantía?', a: 'Contacta al 999 111 222 con tu número de pedido y fotos del problema. Coordinamos la revisión y solución.' },
  { q: '¿Puedo comprar repuestos?', a: 'Sí, tenemos repuestos disponibles para la mayoría de productos. Contáctanos con el modelo y la pieza que necesitas.' },
  { q: '¿Ofrecen soporte post-venta?', a: 'Sí, nuestro equipo de soporte está disponible de lunes a viernes de 9am a 6pm al 999 111 222 o por WhatsApp.' },

  // PRODUCTOS Y CALIDAD (5)
  { q: '¿De qué material son los muebles?', a: 'Utilizamos materiales de alta calidad: madera de pino certificada, MDF ecológico, plásticos libres de BPA y telas hipoalergénicas.' },
  { q: '¿Los productos son seguros para bebés?', a: 'Sí, todos nuestros productos cumplen con las normas de seguridad internacionales. Las cunas cumplen con estándares ASTM y EN 716.' },
  { q: '¿Puedo ver los productos antes de comprar?', a: 'Actualmente solo vendemos online. Sin embargo, ofrecemos fotos detalladas, videos de productos y garantía de satisfacción de 30 días.' },
  { q: '¿Tienen tienda física?', a: 'Solo vendemos online por ahora. Estamos trabajando en habilitar un showroom en Lima para que puedas ver nuestros productos.' },
  { q: '¿Los colores son exactos a las fotos?', a: 'Hacemos nuestro mayor esfuerzo por mostrar colores reales. Puede haber ligera variación según la pantalla. Si no te gusta, puedes devolverlo.' },

  // MONTAJE Y USO (5)
  { q: '¿Los muebles vienen con instrucciones?', a: 'Sí, todos los productos que requieren ensamblaje incluyen instrucciones detalladas con imágenes paso a paso en español.' },
  { q: '¿Necesito herramientas especiales para armar?', a: 'La mayoría incluye las herramientas básicas necesarias. Solo necesitarás un destornillador Phillips y una llave Allen que incluimos.' },
  { q: '¿Cuánto tiempo tarda en armar una cuna?', a: 'La Cuna Convertible 3 en 1 toma aproximadamente 45-60 minutos con dos personas. La Cuna Portátil se arma en 10-15 minutos.' },
  { q: '¿Puedo armar yo solo o necesito ayuda?', a: 'Recomendamos armar con dos personas para mayor seguridad y facilidad. Los productos más pequeños pueden armarse solo.' },
  { q: '¿Ofrecen servicio de armado?', a: 'Actualmente no ofrecemos servicio de armado, pero nuestras instrucciones están diseñadas para que cualquier persona pueda armarlos.' },
];

export default function FAQPage() {
  return (
    <>
      <FAQSchema faqs={faqs.map((f) => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema items={[
        { name: 'Inicio', url: 'https://adriskids.com' },
        { name: 'Preguntas Frecuentes', url: 'https://adriskids.com/faq' },
      ]} />
      <SpeakableSchema selectors={['.faq-answer']} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs items={[
          { name: 'Inicio', url: '/' },
          { name: 'Preguntas Frecuentes', url: '/faq' },
        ]} />

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Preguntas Frecuentes</h1>
        <p className="text-gray-600 mb-8">Resuelve tus dudas sobre envios, pagos, garantias y productos</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">📦</span>
              Envios y Entregas
            </h2>
            <div className="space-y-3">
              {faqs.slice(0, 10).map((faq, i) => (
                <details key={i} className="bg-gray-50 rounded-lg group">
                  <summary className="p-4 cursor-pointer font-medium text-gray-800 hover:text-green-600 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed faq-answer">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">💳</span>
              Pagos y Devoluciones
            </h2>
            <div className="space-y-3">
              {faqs.slice(10, 20).map((faq, i) => (
                <details key={i} className="bg-gray-50 rounded-lg group">
                  <summary className="p-4 cursor-pointer font-medium text-gray-800 hover:text-green-600 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed faq-answer">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm">🛡️</span>
              Garantia y Soporte
            </h2>
            <div className="space-y-3">
              {faqs.slice(20, 25).map((faq, i) => (
                <details key={i} className="bg-gray-50 rounded-lg group">
                  <summary className="p-4 cursor-pointer font-medium text-gray-800 hover:text-green-600 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed faq-answer">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm">🧸</span>
              Productos y Calidad
            </h2>
            <div className="space-y-3">
              {faqs.slice(25, 30).map((faq, i) => (
                <details key={i} className="bg-gray-50 rounded-lg group">
                  <summary className="p-4 cursor-pointer font-medium text-gray-800 hover:text-green-600 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed faq-answer">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm">🔧</span>
              Montaje y Uso
            </h2>
            <div className="space-y-3">
              {faqs.slice(30, 35).map((faq, i) => (
                <details key={i} className="bg-gray-50 rounded-lg group">
                  <summary className="p-4 cursor-pointer font-medium text-gray-800 hover:text-green-600 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed faq-answer">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-12 bg-green-50 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">¿No encontraste tu respuesta?</h3>
          <p className="text-gray-600 mb-4">Contactanos y te ayudamos</p>
          <a href="https://wa.me/51999111222" className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors">
            WhatsApp: 999 111 222
          </a>
        </div>
      </div>
    </>
  );
}
