#!/usr/bin/env node

/*!
 * Prisma Json Types Generator
 * MIT License
 * https://github.com/arthurfiorette/prisma-json-types-generator
 */

// Allows error stack traces to be readable if available
if (process.env.NODE_ENV === undefined) {
  try {
    require('source-map-support').install();
  } catch {}
}

require('./dist/generator.js');
