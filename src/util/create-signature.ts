import { parseTypeSyntax } from '../helpers/type-parser';
import type { PrismaJsonTypesGeneratorConfig } from './config';

/** Creates the new signature for the provided type. */
export function createType(
  description: string | undefined,
  config: PrismaJsonTypesGeneratorConfig
) {
  if (!description) {
    return 'unknown';
  }

  /* 
    Description can be a multi-line string like:
      '@DtoCastType(Customization, ../../types, Customization)\n' +
      '[CustomizationType]'
    So we need to find the correct line to parse
  */
  const lines = description.split('\n');
  let parsed = null;
  for (const line of lines) {
    parsed = parseTypeSyntax(line);
    if (parsed) {
      break;
    }
  }

  // Defaults to unknown always, config.allowAny is handled before this function
  if (!parsed) {
    return 'unknown';
  }

  // Literal types, just return the type
  if (parsed.literal) {
    return `(${parsed.type})`;
  }

  // If we should use a type as global type map
  if (config.useType) {
    return `${config.namespace}.${config.useType}[${JSON.stringify(parsed.type)}]`;
  }

  // Just return the type
  return `${config.namespace}.${parsed.type}`;
}
