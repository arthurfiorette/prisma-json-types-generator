import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'schemas/cockroach.prisma',
  datasource: {
    url: ''
  }
});
