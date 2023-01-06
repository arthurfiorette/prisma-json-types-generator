import { generatorHandler } from '@prisma/generator-helper';
import { onGenerate } from './on-generate';
import { onManifest } from './on-manifest';

generatorHandler({
  onManifest,
  onGenerate
});
