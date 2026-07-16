export interface ProductSchemaData {
  name: string;
  description: string;
  image: string;
  sku: string;
  price: number;
  currency?: string;
  availability?: string;
  url: string;
  brand?: string;
  category?: string;
  ratingValue?: number;
  reviewCount?: number;
}

export default function ProductSchema({ product }: { product: ProductSchemaData }) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    brand: {
      '@type': 'Brand',
      name: product.brand || 'AdriSu Kids',
    },
    offers: {
      '@type': 'Offer',
      url: product.url,
      priceCurrency: product.currency || 'PEN',
      price: product.price,
      availability: product.availability || 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'AdriSu Kids',
      },
    },
  };

  if (product.category) {
    schema.category = product.category;
  }

  if (product.ratingValue && product.reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingValue,
      reviewCount: product.reviewCount,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
