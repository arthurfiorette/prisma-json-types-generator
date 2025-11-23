import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'schemas/mysql.prisma',
  datasource: { url: '' }
});
