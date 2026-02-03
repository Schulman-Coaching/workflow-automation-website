export default () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Required security keys in production
  if (isProduction) {
    const requiredKeys = [
      'JWT_SECRET',
      'DATABASE_URL',
    ];

    for (const key of requiredKeys) {
      if (!process.env[key]) {
        throw new Error(`CRITICAL: Environment variable ${key} is required in production`);
      }
    }
  }

  return {
    app: {
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3004', 10),
      apiUrl: process.env.API_URL || 'http://localhost:3004',
      webUrl: process.env.WEB_URL || 'http://localhost:3005',
    },

    database: {
      url: process.env.DATABASE_URL,
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    auth: {
      jwtSecret: process.env.JWT_SECRET || 'development-secret-change-me',
      jwtExpiry: process.env.JWT_EXPIRY || '24h',
      refreshExpiry: process.env.REFRESH_EXPIRY || '7d',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
    },

    ai: {
      provider: process.env.AI_PROVIDER || 'ollama',
      ollama: {
        baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2:8b',
        maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '2048', 10),
        temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
        timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '30000', 10),
      },
    },

    whatsapp: {
      webhookSecret: process.env.WHATSAPP_WEBHOOK_SECRET,
      apiUrl: process.env.WHATSAPP_API_URL,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    },
  };
};
