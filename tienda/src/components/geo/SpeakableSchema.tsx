export default function SpeakableSchema({ selectors }: { selectors?: string[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'AdriSu Kids',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: selectors || ['.main-content', '.product-description', '.faq-answer'],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
