import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'schemas/any.prisma',
  datasource: {
    url: ''
  }
});
