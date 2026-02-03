export default () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    app: {
      env: process.env.NODE_ENV || 'development',
      port: parseInt(process.env.PORT || '3000', 10),
      apiUrl: process.env.API_URL || 'http://localhost:3000',
      webUrl: process.env.WEB_URL || 'http://localhost:3001',
    },

    database: {
      url: process.env.DATABASE_URL,
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
  };
};
