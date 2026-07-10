'use client';

import { MessageSquare, Bell, Mail } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

export default function ComunicacionesPage() {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <PageHeader
        title="Comunicaciones"
        description="Gestiona WhatsApp, notificaciones y canales de comunicacion"
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto bg-brand-500/10 rounded-2xl flex items-center justify-center mb-4">
          <MessageSquare size={32} className="text-brand-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Modulo en desarrollo</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Las comunicaciones (WhatsApp Business, email transaccional, notificaciones push) estaran disponibles proximamente cuando se configuren las API keys correspondientes.
        </p>
        <div className="flex justify-center gap-6 mt-6">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto bg-gray-800 rounded-lg flex items-center justify-center mb-2">
              <MessageSquare size={18} className="text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">WhatsApp</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto bg-gray-800 rounded-lg flex items-center justify-center mb-2">
              <Mail size={18} className="text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">Email</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto bg-gray-800 rounded-lg flex items-center justify-center mb-2">
              <Bell size={18} className="text-gray-500" />
            </div>
            <p className="text-xs text-gray-500">Push</p>
          </div>
        </div>
      </div>
    </div>
  );
}
