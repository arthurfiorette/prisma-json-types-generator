import { JSON_REGEX, LITERAL_REGEX } from '../helpers/regex';
import type { PrismaJsonTypesGeneratorConfig } from './config';

/** Creates the new signature for the provided type. */
export function createType(
  description: string | undefined,
  config: PrismaJsonTypesGeneratorConfig
) {
  const type = description?.match(JSON_REGEX)?.[1];
  const isLiteral = !!description?.match(LITERAL_REGEX);

  // Literal types, just return the type
  if (isLiteral) {
    return `(${type})`;
  }

  // Defaults to unknown always, config.allowAny is handled before this function
  if (!type) {
    return 'unknown';
  }

  // If we should use a type as global type map
  if (config.useType) {
    return `${config.namespace}.${config.useType}['${JSON.stringify(type)}']`;
  }

  // Just return the type
  return `${config.namespace}.${type}`;
}
