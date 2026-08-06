import { GenerateSEORequest } from '../types'

export function buildSEOPrompt(request: GenerateSEORequest): string {
  const keywords = request.targetKeywords?.length
    ? `Palabras clave objetivo: ${request.targetKeywords.join(', ')}`
    : 'Genera palabras clave relevantes para la industria'

  return `Eres un experto en SEO y copywriting. Genera optimización SEO para una página web.

CONTEXTO:
- Negocio: ${request.businessName}
- Descripción: ${request.businessDescription}
- Industria: ${request.industry}
- Contenido de la página: ${request.pageContent.substring(0, 1000)}
- ${keywords}

INSTRUCCIONES:
1. Genera un meta título atractivo (máximo 60 caracteres) que incluya la palabra clave principal
2. Genera una meta descripción persuasiva (máximo 160 caracteres) con llamada a la acción
3. Genera entre 5 y 10 palabras clave relevantes
4. El contenido debe estar en español
5. El título y descripción deben ser únicos y no genéricos

RESPONDE EN JSON con esta estructura:
{
  "metaTitle": "Título SEO optimizado (max 60 chars)",
  "metaDescription": "Descripción SEO persuasiva (max 160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "suggestions": [
    "Sugerencia 1 para mejorar el SEO",
    "Sugerencia 2 para mejorar el SEO"
  ]
}`
}
