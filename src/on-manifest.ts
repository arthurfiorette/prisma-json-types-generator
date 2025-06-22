import { styleText } from 'node:util';
import type { GeneratorManifest } from '@prisma/generator';
import semverSatisfies from 'semver/functions/satisfies';

/** Generates simple metadata for this generator. */
export function onManifest(): GeneratorManifest {
  let version: string | undefined;

  try {
    const pkg = require('../package.json');
    version = pkg.version;
    const prismaPeerVersion = pkg.peerDependencies?.prisma;
    const prismaVersion = require('prisma/package.json').version;

    if (!semverSatisfies(prismaVersion, prismaPeerVersion)) {
      console.log(
        styleText(
          'red',
          `\n\nPrisma Json Types Generator@${version} relies on Prisma ${prismaPeerVersion} and was not tested with your Prisma@${prismaVersion} installation.
The generated output might not work correctly or even completely break Prisma Client types.\n`
        )
      );
    }
  } catch {}

  return {
    version,
    // TODO: We should change this to the real output of the generator in some way. But we cannot get its real output here
    // because we need to await the prisma client to be generated first.
    defaultOutput: './',
    prettyName: 'Prisma Json Types Generator'
  };
}
