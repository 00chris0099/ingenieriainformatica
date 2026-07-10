'use client';

interface ContactFormBlockPreviewProps {
  content: Record<string, any>;
}

export default function ContactFormBlockPreview({ content }: ContactFormBlockPreviewProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      {content.title && (
        <h3 className="text-lg font-bold text-gray-900 mb-2">{content.title}</h3>
      )}
      {content.description && (
        <p className="text-sm text-gray-600 mb-4">{content.description}</p>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Nombre"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            disabled
          />
          <input
            type="email"
            placeholder="Email"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            disabled
          />
        </div>
        <input
          type="tel"
          placeholder="Telefono"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          disabled
        />
        <textarea
          placeholder="Mensaje"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white resize-none"
          disabled
        />
        <button
          type="button"
          className="px-6 py-2.5 text-white text-sm font-medium rounded-lg"
          style={{ backgroundColor: content.buttonColor || '#16a34a' }}
          disabled
        >
          {content.submitText || 'Enviar'}
        </button>
      </div>
    </div>
  );
}
