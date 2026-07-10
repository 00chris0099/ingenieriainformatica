'use client';

import { useState } from 'react';
import { useProductForm } from '../ProductFormContext';

type Tab = 'description' | 'specs';

export default function ProductTabs() {
  const { description, shortDescription, dimensions, color, materials, recommendedAge, warrantyDays, originCountry, weight, weightUnit } = useProductForm();
  const [activeTab, setActiveTab] = useState<Tab>('description');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'description', label: 'Descripcion' },
    { key: 'specs', label: 'Especificaciones' },
  ];

  const specs = [
    dimensions.height && { label: 'Alto', value: `${dimensions.height} cm` },
    dimensions.width && { label: 'Ancho', value: `${dimensions.width} cm` },
    dimensions.depth && { label: 'Profundidad', value: `${dimensions.depth} cm` },
    color && { label: 'Color', value: color },
    materials.length > 0 && { label: 'Materiales', value: materials.join(', ') },
    recommendedAge && { label: 'Edad recomendada', value: recommendedAge },
    warrantyDays && { label: 'Garantia', value: `${warrantyDays} dias` },
    originCountry && { label: 'Origen', value: originCountry },
    weight && { label: 'Peso', value: `${weight} ${weightUnit}` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="border-t border-gray-100 pt-8">
      <div className="flex gap-8 border-b border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.key
                ? 'text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
            )}
          </button>
        ))}
      </div>

      <div className="py-6">
        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none">
            {description ? (
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">{description}</div>
            ) : (
              <p className="text-gray-400 italic">Sin descripcion disponible</p>
            )}
            {shortDescription && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{shortDescription}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="space-y-4">
            {specs.length > 0 ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {specs.map((spec, i) => (
                    <tr key={i}>
                      <td className="py-2.5 text-gray-500 w-1/3">{spec.label}</td>
                      <td className="py-2.5 text-gray-900">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 italic text-center py-4">Sin especificaciones disponibles</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
