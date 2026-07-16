export interface EventData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  url?: string;
  offers?: {
    price: string;
    currency: string;
    availability: string;
  };
}

export default function EventSchema({ event }: { event: EventData }) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    organizer: {
      '@type': 'Organization',
      name: 'AdriSu Kids',
      url: 'https://adriskids.com',
    },
    location: {
      '@type': 'Place',
      name: 'AdriSu Kids Online',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Lima',
        addressRegion: 'Lima',
        addressCountry: 'PE',
      },
    },
  };

  if (event.url) {
    schema.url = event.url;
  }

  if (event.offers) {
    schema.offers = {
      '@type': 'Offer',
      price: event.offers.price,
      priceCurrency: event.offers.currency,
      availability: event.offers.availability,
      url: event.url || 'https://adriskids.com',
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
