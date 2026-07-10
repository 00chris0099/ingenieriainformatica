# Guía de Instalación

## Prerrequisitos

- Node.js 18+
- pnpm 9+
- Docker (para n8n local)
- Cuenta AWS (para Amplify)
- Cuenta OpenAI (para agente IA)

## Instalación

### 1. Clonar e instalar dependencias

```bash
git clone <repo-url>
cd proyecto-integrador
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus valores
```

### 3. Iniciar desarrollo

```bash
# Frontend (Next.js)
pnpm dev

# n8n (opcional, para agente IA)
pnpm n8n:up
```

### 4. Acceder

- Frontend: http://localhost:3000
- n8n: http://localhost:5678

## Deploy

### AWS Amplify

1. Conectar repositorio a AWS Amplify
2. Configurar variables de entorno en Amplify
3. Deploy automático al hacer push a main

## Comandos Útiles

```bash
pnpm dev          # Iniciar todos los servicios
pnpm build        # Build de producción
pnpm lint         # Verificar código
pnpm typecheck    # Verificar tipos
pnpm n8n:up       # Iniciar n8n local
pnpm n8n:down     # Detener n8n
```
