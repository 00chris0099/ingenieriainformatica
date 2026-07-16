export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AdriSu Kids',
  alternateName: 'AdriSu Kids Muebles para Bebes',
  url: 'https://adriskids.com',
  logo: 'https://adriskids.com/logo.png',
  description: 'Tienda online de muebles para bebes en Peru. Camas convertibles, sillas altas, cochecitos, decoracion nursery y mas.',
  foundingDate: '2024',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Industrial 123',
    addressLocality: 'Lima',
    addressRegion: 'Lima',
    postalCode: '15001',
    addressCountry: 'PE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -12.0464,
    longitude: -77.0428,
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+51-999-111-222',
    contactType: 'customer service',
    areaServed: 'PE',
    availableLanguage: 'Spanish',
  },
  sameAs: [
    'https://www.facebook.com/adriskids',
    'https://www.instagram.com/adriskids',
    'https://www.tiktok.com/@adriskids',
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Peru',
  },
  makesOffer: {
    '@type': 'OfferCatalog',
    name: 'Muebles para Bebes',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Camas y Cunas' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Sillas Altas' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Cochecitos' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Decoracion Nursery' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Accesorios para Banio' } },
    ],
  },
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AdriSu Kids',
  url: 'https://adriskids.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://adriskids.com/tienda?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'AdriSu Kids',
  image: 'https://adriskids.com/logo.png',
  url: 'https://adriskids.com',
  telephone: '+51-999-111-222',
  priceRange: '$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Industrial 123',
    addressLocality: 'Lima',
    addressRegion: 'Lima',
    addressCountry: 'PE',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: -12.0464,
    longitude: -77.0428,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '09:00',
      closes: '14:00',
    },
  ],
  areaServed: {
    '@type': 'Country',
    name: 'Peru',
  },
};
