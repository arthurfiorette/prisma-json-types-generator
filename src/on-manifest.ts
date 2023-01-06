import type { GeneratorManifest } from '@prisma/generator-helper';

const { version } = require('../package.json');

export function onManifest(): GeneratorManifest {
  return {
    version,
    defaultOutput: './',
    prettyName: 'Prisma Json Types Generator',
    requiresGenerators: ['prisma-client-js']
  };
}
