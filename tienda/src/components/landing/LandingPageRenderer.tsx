'use client';

import { useEffect, useRef } from 'react';

interface LandingBlock {
  id: string;
  type: string;
  settings: Record<string, any>;
  content: Record<string, any>;
}

interface LandingPageRendererProps {
  blocks: LandingBlock[];
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
    if (b.width && b.width !== '0') {
      css.border = `${b.width} ${b.style || 'solid'} ${b.color || '#e5e7eb'}`;
    }
    if (b.radius && b.radius !== '0') {
      css.borderRadius = b.radius;
    }
  }

  if (styles.shadow) {
    const s = styles.shadow;
    if (s.blur && s.blur !== '0') {
      css.boxShadow = `${s.offsetX || '0'} ${s.offsetY || '0'} ${s.blur} ${s.spread || '0'} ${s.color || 'rgba(0,0,0,0.1)'}`;
    }
  }

  return css;
}

function getAnimationAttrs(animation: Record<string, any>) {
  if (!animation || animation.type === 'none') return {};

  return {
    'data-animation-type': animation.type,
    'data-animation-duration': animation.duration || 500,
    'data-animation-delay': animation.delay || 0,
    'data-animation-trigger': animation.trigger || 'scroll',
  };
}

function BlockRenderer({ block }: { block: LandingBlock }) {
  const customStyles = getStylesFromSettings(block.settings?.styles);
  const animationAttrs = getAnimationAttrs(block.settings?.animation);

  switch (block.type) {
    case 'hero':
      return (
        <div
          className="py-16 px-6 text-center"
          style={{ ...customStyles, backgroundColor: block.settings.backgroundColor || '#16a34a', color: block.settings.textColor || '#ffffff' }}
          {...animationAttrs}
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">{block.content.title}</h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">{block.content.subtitle}</p>
            {block.content.buttonText && (
              <a
                href={block.content.buttonUrl || '#'}
                className="inline-block px-8 py-3 bg-white/20 hover:bg-white/30 rounded-full text-lg font-semibold transition-colors"
              >
                {block.content.buttonText}
              </a>
            )}
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="py-8 px-6" style={customStyles} {...animationAttrs}>
          <div className="max-w-3xl mx-auto">
            {block.content.heading && <h2 className="text-2xl font-bold mb-4">{block.content.heading}</h2>}
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{block.content.body}</p>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="py-8 px-6" style={customStyles} {...animationAttrs}>
          <div className="max-w-4xl mx-auto" style={{ textAlign: block.content.alignment || 'center' }}>
            <img
              src={block.content.url}
              alt={block.content.caption || ''}
              className="rounded-lg shadow-lg"
              style={{ maxWidth: `${block.content.width || 100}%` }}
            />
            {block.content.caption && (
              <p className="text-sm text-gray-500 mt-2">{block.content.caption}</p>
            )}
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="py-8 px-6" style={customStyles} {...animationAttrs}>
          <div className="max-w-4xl mx-auto grid gap-4" style={{ gridTemplateColumns: `repeat(${block.content.columns || 2}, 1fr)` }}>
            {(block.content.images || []).filter(Boolean).map((url: string, i: number) => (
              <img key={i} src={url} alt="" className="rounded-lg shadow-md w-full h-48 object-cover" />
            ))}
          </div>
        </div>
      );

    case 'video':
      return (
        <div className="py-8 px-6" style={customStyles} {...animationAttrs}>
          <div className="max-w-3xl mx-auto aspect-video">
            <iframe
              src={block.content.url?.replace('watch?v=', 'embed/')}
              className="w-full h-full rounded-lg shadow-lg"
              allowFullScreen
            />
          </div>
        </div>
      );

    case 'features':
      return (
        <div className="py-12 px-6" style={customStyles} {...animationAttrs}>
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-6">
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="text-center p-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 text-xl">{getFeatureIcon(item.icon)}</span>
                </div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="py-12 px-6 text-center" style={customStyles} {...animationAttrs}>
          <a
            href={block.content.url || '#'}
            className="inline-block px-8 py-4 rounded-xl text-lg font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: block.content.backgroundColor || '#16a34a', color: block.content.textColor || '#ffffff' }}
          >
            {block.content.text}
          </a>
        </div>
      );

    case 'testimonials':
      return (
        <div className="py-12 px-6 bg-gray-50" style={customStyles} {...animationAttrs}>
          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            {(block.content.items || []).map((item: any, i: number) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-lg ${s <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-3">"{item.text}"</p>
                <p className="text-sm font-medium text-gray-900">— {item.name}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="py-12 px-6" style={customStyles} {...animationAttrs}>
          <div className="max-w-3xl mx-auto space-y-4">
            {(block.content.items || []).map((item: any, i: number) => (
              <details key={i} className="border border-gray-200 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-medium hover:bg-gray-50">
                  {item.question}
                </summary>
                <div className="px-4 pb-4 text-gray-600">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      );

    case 'columns':
      return (
        <div className="py-8 px-6" style={customStyles} {...animationAttrs}>
          <div className="max-w-4xl mx-auto flex gap-6">
            {(block.content.columns || []).map((col: any, i: number) => (
              <div key={i} style={{ flex: `0 0 ${col.width || 50}%` }}>
                {col.title && <h3 className="font-semibold mb-2">{col.title}</h3>}
                <p className="text-gray-600 text-sm">{col.content}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'divider':
      return (
        <div className="py-4 px-6" style={customStyles} {...animationAttrs}>
          <div className="max-w-4xl mx-auto">
            <hr
              style={{
                borderStyle: block.content.style || 'solid',
                borderColor: block.content.color || '#e5e7eb',
                borderWidth: `${block.content.thickness || 1}px`,
              }}
            />
          </div>
        </div>
      );

    case 'spacing':
      return <div style={{ height: `${block.content.height || 60}px`, ...customStyles }} {...animationAttrs} />;

    case 'contact':
      return (
        <div className="py-12 px-6 bg-gray-50" style={customStyles} {...animationAttrs}>
          <div className="max-w-xl mx-auto">
            {block.content.title && <h2 className="text-2xl font-bold mb-2 text-center">{block.content.title}</h2>}
            {block.content.description && <p className="text-gray-600 mb-6 text-center">{block.content.description}</p>}
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Nombre" className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="email" placeholder="Email" className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <input type="tel" placeholder="Telefono" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              <textarea placeholder="Mensaje" rows={4} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
              <button
                type="submit"
                className="w-full py-3 text-white font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: block.content.buttonColor || '#16a34a' }}
              >
                {block.content.submitText || 'Enviar'}
              </button>
            </form>
          </div>
        </div>
      );

    case 'countdown':
      return (
        <div className="py-12 px-6" style={{ ...customStyles, backgroundColor: block.content.backgroundColor || '#1f2937', color: block.content.textColor || '#ffffff' }} {...animationAttrs}>
          <div className="max-w-2xl mx-auto text-center">
            {block.content.label && <p className="text-lg mb-6">{block.content.label}</p>}
            <CountdownTimer endDate={block.content.endDate} numberColor={block.content.numberColor} />
          </div>
        </div>
      );

    case 'tabs':
      return (
        <div className="py-8 px-6" style={customStyles} {...animationAttrs}>
          <div className="max-w-3xl mx-auto">
            <TabsComponent items={block.content.items || []} />
          </div>
        </div>
      );

    case 'accordion':
      return (
        <div className="py-8 px-6" style={{ ...customStyles, backgroundColor: block.content.backgroundColor || '#ffffff' }} {...animationAttrs}>
          <div className="max-w-3xl mx-auto space-y-2">
            {(block.content.items || []).map((item: any, i: number) => (
              <details key={i} className="border border-gray-200 rounded-lg">
                <summary className="px-4 py-3 cursor-pointer font-medium hover:bg-gray-50">
                  {item.question}
                </summary>
                <div className="px-4 pb-4 text-gray-600">{item.answer}</div>
              </details>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
}

function CountdownTimer({ endDate, numberColor }: { endDate: string; numberColor?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!endDate || !ref.current) return;

    const updateCountdown = () => {
      const difference = new Date(endDate).getTime() - Date.now();
      if (difference <= 0) {
        ref.current!.innerHTML = '<p class="text-xl font-bold">Oferta finalizada</p>';
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      const pad = (n: number) => String(n).padStart(2, '0');
      const color = numberColor || '#ef4444';

      ref.current!.innerHTML = `
        <div class="flex items-center justify-center gap-4">
          <div class="text-center">
            <div class="text-4xl font-bold px-4 py-3 rounded-lg" style="background:rgba(0,0,0,0.3);color:${color}">${pad(days)}</div>
            <p class="text-sm mt-2 opacity-70">Dias</p>
          </div>
          <span class="text-3xl font-bold opacity-50">:</span>
          <div class="text-center">
            <div class="text-4xl font-bold px-4 py-3 rounded-lg" style="background:rgba(0,0,0,0.3);color:${color}">${pad(hours)}</div>
            <p class="text-sm mt-2 opacity-70">Horas</p>
          </div>
          <span class="text-3xl font-bold opacity-50">:</span>
          <div class="text-center">
            <div class="text-4xl font-bold px-4 py-3 rounded-lg" style="background:rgba(0,0,0,0.3);color:${color}">${pad(minutes)}</div>
            <p class="text-sm mt-2 opacity-70">Min</p>
          </div>
          <span class="text-3xl font-bold opacity-50">:</span>
          <div class="text-center">
            <div class="text-4xl font-bold px-4 py-3 rounded-lg" style="background:rgba(0,0,0,0.3);color:${color}">${pad(seconds)}</div>
            <p class="text-sm mt-2 opacity-70">Seg</p>
          </div>
        </div>
      `;
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [endDate, numberColor]);

  return <div ref={ref} />;
}

function TabsComponent({ items }: { items: any[] }) {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="flex border-b border-gray-200">
        {items.map((item: any, i: number) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === i ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="py-4">
        <p className="text-gray-600 whitespace-pre-wrap">{items[activeTab]?.content}</p>
      </div>
    </div>
  );
}

function getFeatureIcon(icon: string): string {
  const icons: Record<string, string> = {
    truck: '🚚', shield: '🛡️', refresh: '🔄', star: '⭐', heart: '❤️',
    gift: '🎁', check: '✓', clock: '🕐', phone: '📞', mail: '✉️',
  };
  return icons[icon] || '✓';
}

import { useState } from 'react';

export default function LandingPageRenderer({ blocks }: LandingPageRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p>No hay contenido configurado para esta landing page</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} />
      ))}
    </div>
  );
}
