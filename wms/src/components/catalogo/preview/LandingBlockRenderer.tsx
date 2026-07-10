'use client';

import { LandingPageBlock } from '../ProductFormContext';

interface LandingBlockRendererProps {
  block: LandingPageBlock;
}

function getStylesFromSettings(styles: Record<string, any>): React.CSSProperties {
  if (!styles || Object.keys(styles).length === 0) return {};
  const css: React.CSSProperties = {};
  if (styles.backgroundColor) css.backgroundColor = styles.backgroundColor;
  if (styles.backgroundImage) css.backgroundImage = `url(${styles.backgroundImage})`;
  if (styles.margin) {
    const m = styles.margin;
    css.margin = `${m.top || '0'} ${m.right || '0'} ${m.bottom || '0'} ${m.left || '0'}`;
  }
  if (styles.padding) {
    const p = styles.padding;
    css.padding = `${p.top || '0'} ${p.right || '0'} ${p.bottom || '0'} ${p.left || '0'}`;
  }
  if (styles.border) {
    const b = styles.border;
    if (b.width && b.width !== '0') css.border = `${b.width} ${b.style || 'solid'} ${b.color || '#e5e7eb'}`;
    if (b.radius && b.radius !== '0') css.borderRadius = b.radius;
  }
  if (styles.shadow) {
    const s = styles.shadow;
    if (s.blur && s.blur !== '0') css.boxShadow = `${s.offsetX || '0'} ${s.offsetY || '0'} ${s.blur} ${s.spread || '0'} ${s.color || 'rgba(0,0,0,0.1)'}`;
  }
  return css;
}

export default function LandingBlockRenderer({ block }: LandingBlockRendererProps) {
  const customStyles = getStylesFromSettings(block.settings?.styles);

  switch (block.type) {
    case 'hero':
      return (
        <div className="py-12 px-6 text-center" style={{ ...customStyles, backgroundColor: block.settings.backgroundColor || '#16a34a', color: block.settings.textColor || '#ffffff' }}>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">{block.content.title}</h2>
          <p className="text-sm md:text-base opacity-90 mb-6">{block.content.subtitle}</p>
          {block.content.buttonText && (
            <a href={block.content.buttonUrl || '#'} className="inline-block px-6 py-3 bg-white/20 hover:bg-white/30 rounded-full text-sm font-semibold transition-colors">
              {block.content.buttonText}
            </a>
          )}
        </div>
      );

    case 'text':
      return (
        <div className="py-6 px-6" style={customStyles}>
          {block.content.heading && <h3 className="text-lg font-bold text-gray-900 mb-2">{block.content.heading}</h3>}
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{block.content.body}</p>
        </div>
      );

    case 'image':
      return (
        <div style={customStyles}>
          {block.content.url ? (
            <img src={block.content.url} alt={block.content.caption || ''} className="w-full block" />
          ) : (
            <div className="bg-gray-100 h-48 flex items-center justify-center text-gray-400 text-sm">Sin imagen</div>
          )}
          {block.content.caption && <p className="text-xs text-gray-500 mt-1 px-6 text-center">{block.content.caption}</p>}
        </div>
      );

    case 'gallery':
      return (
        <div className="py-2" style={customStyles}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${block.content.columns || 2}, 1fr)` }}>
            {(block.content.images || []).filter(Boolean).map((url: string, i: number) => (
              <img key={i} src={url} alt="" className="w-full h-32 object-cover" />
            ))}
          </div>
        </div>
      );

    case 'video':
      return (
        <div style={customStyles}>
          {block.content.url ? (
            <div className="aspect-video">
              <iframe src={block.content.url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen />
            </div>
          ) : (
            <div className="bg-gray-100 aspect-video flex items-center justify-center text-gray-400 text-sm">Sin video</div>
          )}
        </div>
      );

    case 'features':
      return (
        <div className="py-8 px-6" style={customStyles}>
          <div className="grid grid-cols-3 gap-4">
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="text-center p-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-green-600 text-lg">{getIconEmoji(item.icon)}</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="py-8 px-6 text-center" style={customStyles}>
          <a href={block.content.url || '#'} className="inline-block px-8 py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-105" style={{ backgroundColor: block.content.backgroundColor || '#16a34a', color: block.content.textColor || '#ffffff' }}>
            {block.content.text}
          </a>
        </div>
      );

    case 'testimonials':
      return (
        <div className="py-8 px-6 bg-gray-50" style={customStyles}>
          <div className="grid grid-cols-3 gap-4">
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-sm ${s <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  ))}
                </div>
                <p className="text-xs text-gray-600 italic mb-2">"{item.text}"</p>
                <p className="text-[10px] font-medium text-gray-900">— {item.name}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq':
    case 'accordion':
      return (
        <div className="py-6 px-6" style={customStyles}>
          {(block.content.items || []).map((item: any, i: number) => (
            <details key={i} className="border border-gray-200 rounded-lg mb-2 last:mb-0">
              <summary className="px-4 py-3 text-sm font-medium cursor-pointer hover:bg-gray-50">{item.question}</summary>
              <div className="px-4 pb-3 text-sm text-gray-600">{item.answer}</div>
            </details>
          ))}
        </div>
      );

    case 'columns':
      return (
        <div className="py-6 px-6" style={customStyles}>
          <div className="flex gap-4">
            {(block.content.columns || []).map((col: any, i: number) => (
              <div key={i} style={{ flex: `0 0 ${col.width || 50}%` }}>
                {col.title && <h4 className="font-semibold text-sm mb-1">{col.title}</h4>}
                <p className="text-xs text-gray-600">{col.content}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="py-2 px-6" style={customStyles}>
          <hr style={{ borderStyle: block.content.style || 'solid', borderColor: block.content.color || '#e5e7eb', borderWidth: `${block.content.thickness || 1}px` }} />
        </div>
      );

    case 'spacing':
      return <div style={{ height: `${block.content.height || 40}px`, ...customStyles }} />;

    case 'contact':
      return (
        <div className="py-8 px-6 bg-gray-50" style={customStyles}>
          <div className="max-w-md mx-auto">
            {block.content.title && <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">{block.content.title}</h3>}
            {block.content.description && <p className="text-sm text-gray-600 mb-4 text-center">{block.content.description}</p>}
            <form className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Nombre" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="email" placeholder="Email" className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <input type="tel" placeholder="Telefono" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              <textarea placeholder="Mensaje" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <button type="button" className="w-full py-2.5 text-white text-sm font-semibold rounded-lg" style={{ backgroundColor: block.content.buttonColor || '#16a34a' }}>
                {block.content.submitText || 'Enviar'}
              </button>
            </form>
          </div>
        </div>
      );

    case 'countdown':
      return (
        <div className="py-8 px-6 text-center" style={{ ...customStyles, backgroundColor: block.content.backgroundColor || '#1f2937', color: block.content.textColor || '#ffffff' }}>
          {block.content.label && <p className="text-sm font-medium mb-4">{block.content.label}</p>}
          <div className="flex items-center justify-center gap-3">
            {['02', '14', '35', '42'].map((val, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: block.content.numberColor || '#ef4444' }}>{val}</div>
                <p className="text-[10px] mt-1 opacity-70">{['Dias', 'Horas', 'Min', 'Seg'][i]}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'tabs':
      return (
        <div className="py-6 px-6" style={customStyles}>
          <div className="flex border-b border-gray-200 mb-4">
            {(block.content.items || []).slice(0, 4).map((item: any, i: number) => (
              <button key={i} className={`px-4 py-2 text-sm font-medium ${i === 0 ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                {item.title}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600">{block.content.items?.[0]?.content || ''}</p>
        </div>
      );

    default:
      return null;
  }
}

function getIconEmoji(icon: string): string {
  const icons: Record<string, string> = {
    truck: '🚚', shield: '🛡️', refresh: '🔄', star: '⭐', heart: '❤️',
    gift: '🎁', check: '✓', clock: '🕐', phone: '📞', mail: '✉️',
  };
  return icons[icon] || '✓';
}
