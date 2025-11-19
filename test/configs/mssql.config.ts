import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'schemas/mssql.prisma',
  datasource: {
    url: ''
  }
});
