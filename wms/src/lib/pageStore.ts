/**
 * Global in-process page store — survives across API route invocations
 * within the same Next.js server process (Node.js long-running server).
 * This is intentional: provides zero-downtime fallback when PostgreSQL is unreachable.
 */

declare global {
  // eslint-disable-next-line no-var
  var __pageStore: Map<string, any> | undefined
}

if (!global.__pageStore) {
  global.__pageStore = new Map<string, any>()
}

export const pageStore = global.__pageStore as Map<string, any>
