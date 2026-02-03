export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    url: process.env.DATABASE_URL,
  },
  jwtSecret: process.env.JWT_SECRET || 'super-secret',
});
