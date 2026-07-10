# Arquitectura del Proyecto Integrador

## Visión General

Proyecto fullstack que combina:
- **Landing Page + Ecommerce** (Next.js 14)
- **Agente de IA Multifunción** (n8n + OpenAI)
- **Backend** (AWS Amplify)

## Stack Tecnológico

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | Next.js 14 (App Router) | SSR/SSG, SEO |
| CSS | Tailwind CSS | Estilos |
| Estado | Zustand | Carrito, UI state |
| Backend | AWS Amplify | Auth, API, Storage |
| Base de Datos | DynamoDB | Productos, pedidos |
| Auth | Cognito | Login, registro |
| Pagos | Stripe/MercadoPago | Checkout |
| IA | n8n + OpenAI | Agente multifunción |
| Deploy | AWS Amplify Hosting | CI/CD |

## Estructura

```
proyecto-integrador/
├── apps/web/           # Next.js (landing + ecommerce)
├── services/n8n/       # Agente IA (workflows + config)
├── packages/           # Código compartido (types, utils)
├── infrastructure/     # Config AWS Amplify
└── docs/               # Documentación
```

## Flujo de Datos

```
Usuario → Next.js → API Routes → AWS Amplify → DynamoDB
                ↕
         n8n Webhook → AI Agent → OpenAI → Respuesta
```

## Integración IA

El agente de n8n se comunica con Next.js vía webhooks:
1. Frontend envía mensaje a `/api/chat`
2. API route reenvía a n8n webhook
3. n8n procesa con AI Agent + tools
4. Respuesta vuelve al frontend
