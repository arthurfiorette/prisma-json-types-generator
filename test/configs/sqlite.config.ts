import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'schemas/sqlite.prisma',
  datasource: { url: '' }
});
