'use client';

interface ContactFormBlockEditorProps {
  content: Record<string, any>;
  onUpdate: (content: Record<string, any>) => void;
}

export default function ContactFormBlockEditor({ content, onUpdate }: ContactFormBlockEditorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Titulo del formulario</label>
        <input
          type="text"
          value={content.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Contactanos"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Descripcion</label>
        <input
          type="text"
          value={content.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Envianos tu consulta..."
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Texto del boton</label>
          <input
            type="text"
            value={content.submitText || ''}
            onChange={(e) => onUpdate({ submitText: e.target.value })}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="Enviar"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Color del boton</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={content.buttonColor || '#16a34a'}
              onChange={(e) => onUpdate({ buttonColor: e.target.value })}
              className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer"
            />
            <input
              type="text"
              value={content.buttonColor || '#16a34a'}
              onChange={(e) => onUpdate({ buttonColor: e.target.value })}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Mensaje de exito</label>
        <input
          type="text"
          value={content.successMessage || ''}
          onChange={(e) => onUpdate({ successMessage: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="Gracias por contactarnos!"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Email de destino</label>
        <input
          type="email"
          value={content.destinationEmail || ''}
          onChange={(e) => onUpdate({ destinationEmail: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          placeholder="contacto@ejemplo.com"
        />
      </div>
    </div>
  );
}
