import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'schemas/normal-prisma-client.prisma',
  datasource: { url: '' }
});
