export interface GuideStep {
  title: string;
  content: string;
}

export default function ProductGuide({ steps }: { steps: GuideStep[] }) {
  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      <h3>Guia de uso del producto</h3>
      {steps.map((step, i) => (
        <div key={i}>
          <h4>Paso {i + 1}: {step.title}</h4>
          <p>{step.content}</p>
        </div>
      ))}
    </div>
  );
}
