export interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

export interface HowToData {
  name: string;
  description: string;
  estimatedCost?: { currency: string; value: string };
  supply?: string[];
  tool?: string[];
  steps: HowToStep[];
}

export default function HowToSchema({ data }: { data: HowToData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: data.name,
    description: data.description,
    estimatedCost: data.estimatedCost || { currency: 'PEN', value: '0' },
    supply: data.supply || [],
    tool: data.tool || [],
    step: data.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
