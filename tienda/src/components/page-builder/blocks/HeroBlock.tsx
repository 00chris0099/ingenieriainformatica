'use client'

import { Block, ThemeConfig } from '@repo/blocks'

interface Props { block: Block; theme?: ThemeConfig }

export default function HeroBlock({ block, theme }: Props) {
  const { settings, content } = block
  const bgColor = settings.backgroundColor || theme?.colors?.primary || '#2563eb'
  const textColor = settings.textColor || '#ffffff'
  const height = settings.height === 'full' ? '100vh' : settings.height === 'medium' ? '60vh' : 'auto'
  const bgImage = settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined
  const overlay = settings.backgroundType === 'image' ? settings.overlayOpacity || 50 : 0

  return (
    <section
      className="relative flex items-center"
      style={{
        minHeight: height,
        backgroundColor: bgColor,
        color: textColor,
        backgroundImage: bgImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {overlay > 0 && (
        <div className="absolute inset-0 bg-black" style={{ opacity: overlay / 100 }} />
      )}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20" style={{ textAlign: settings.textAlign || 'center' }}>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">{content.title}</h1>
        {content.subtitle && (
          <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto" style={settings.textAlign === 'left' ? { margin: '0 0 2rem 0' } : {}}>
            {content.subtitle}
          </p>
        )}
        <div className="flex gap-4 justify-center flex-wrap" style={settings.textAlign === 'left' ? { justifyContent: 'flex-start' } : {}}>
          {content.buttonText && (
            <a
              href={content.buttonLink || '#'}
              className="px-8 py-3 rounded-lg text-lg font-semibold transition-transform hover:scale-105"
              style={{
                backgroundColor: content.buttonVariant === 'primary' ? textColor : 'transparent',
                color: content.buttonVariant === 'primary' ? bgColor : textColor,
                border: content.buttonVariant === 'primary' ? 'none' : `2px solid ${textColor}`,
              }}
            >
              {content.buttonText}
            </a>
          )}
          {content.secondaryButtonText && (
            <a
              href={content.secondaryButtonLink || '#'}
              className="px-8 py-3 rounded-lg text-lg font-semibold border-2 transition-transform hover:scale-105"
              style={{ borderColor: textColor, color: textColor }}
            >
              {content.secondaryButtonText}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
