declare namespace NodeJS {
  interface ProcessEnv {
    ANTHROPIC_API_KEY: string;
    ANTHROPIC_API_ENDPOINT?: string;
    ANTHROPIC_API_VERSION?: string;
  }
} 