/// <reference types="vite/client" />

// CITATION.cff is imported as raw text and parsed at runtime (see src/citation.ts).
declare module '*.cff?raw' {
  const content: string;
  export default content;
}
