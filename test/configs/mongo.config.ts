import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'schemas/mongo.prisma',
  datasource: { url: '' }
});
