#!/usr/bin/env node

/*!
 * Prisma Json Types Generator
 * MIT License
 * https://github.com/arthurfiorette/prisma-json-types-generator
 */

// Allows error stack traces to be readable if available
try {
  if (process.sourceMapsEnabled === false) {
    process.setSourceMapsEnabled(true);
  }
} catch {}

require('./dist/generator.js');
