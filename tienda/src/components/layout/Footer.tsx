'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo.png" alt="AdriSu Kids" className="h-10 w-auto" />
            </div>
            <p className="text-sm text-gray-400">Muebles para bebes de calidad premium.</p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Tienda</h4>
            <div className="space-y-2 text-sm">
              <Link href="/tienda" className="block hover:text-white">Todos los productos</Link>
              <Link href="/tienda?categoria=camas-cunas" className="block hover:text-white">Camas y Cunas</Link>
              <Link href="/tienda?categoria=sillas-altas" className="block hover:text-white">Sillas Altas</Link>
              <Link href="/tienda?categoria=carritos" className="block hover:text-white">Carritos</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Ayuda</h4>
            <div className="space-y-2 text-sm">
              <span className="block">Envios a todo el Peru</span>
              <span className="block">Devoluciones en 30 dias</span>
              <span className="block">Pagos seguros</span>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3">Contacto</h4>
            <div className="space-y-2 text-sm">
              <span className="block">WhatsApp: +51 999 111 222</span>
              <span className="block">Lima, Peru</span>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          2026 AdriSu Kids. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
