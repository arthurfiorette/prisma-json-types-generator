import { logger } from '@prisma/sdk';
import ts from 'typescript';
import type { Declaration } from '../file/reader';
import type { ModelWithRegex } from '../helpers/dmmf';
import { JSON_REGEX } from '../helpers/regex';

export async function handleModule(
  module: ts.ModuleDeclaration,
  replacer: Declaration['replacer'],
  models: ModelWithRegex[],
  nsName: string
) {
  const namespace = module
    .getChildren()
    .find((n): n is ts.ModuleBlock => n.kind === ts.SyntaxKind.ModuleBlock);

  if (!namespace) {
    logger.error('Prisma namespace could not be found');
    return;
  }

  for (const statement of namespace.statements) {
    const typeAlias = statement as ts.TypeAliasDeclaration;

    // Filters any statement that isn't a export type declaration
    if (
      statement.kind !== ts.SyntaxKind.TypeAliasDeclaration ||
      typeAlias.type.kind !== ts.SyntaxKind.TypeLiteral
    ) {
      continue;
    }

    const typeAliasName = typeAlias.name.getText();
    const typeAliasType = typeAlias.type as ts.TypeLiteralNode;

    for (const model of models) {
      // May includes the model name but is not the actual model, like
      // UserCreateWithoutPostsInput for Post model. that's why we need
      // to check if the model name is in the regex
      if (!model.regexps.some((r) => r.test(typeAliasName))) {
        continue;
      }

      const fields = model.fields.filter((f) => f.documentation?.match(JSON_REGEX));

      for (const member of typeAliasType.members) {
        if (member.kind !== ts.SyntaxKind.PropertySignature) {
          continue;
        }

        const signature = member as ts.PropertySignature;

        const fieldName = member.name?.getText();
        const field = fields.find((f) => f.name === fieldName);

        if (!field) {
          continue;
        }

        if (!signature.type) {
          throw new Error(
            `No type found for field ${fieldName} at model ${typeAliasName}`
          );
        }

        const typename = field.documentation?.match(JSON_REGEX)?.[1];
        const signatureType = signature.type.getText();

        // TODO: JsonFilter and JsonWithAggregatesFilter
        switch (signatureType) {
          case 'JsonValue':
            replacer(signature.type.pos, signature.type.end, `${nsName}.${typename}`);
            break;
            
          case 'JsonValue | null':
            replacer(signature.type.pos, signature.type.end, `${nsName}.${typename} | null`);
            break;

          case 'InputJsonValue':
          case 'InputJsonValue | InputJsonValue':
            replacer(
              signature.type.pos,
              signature.type.end,
              `DeepPartial<${nsName}.${typename}>`
              );
              break;
 
          case 'NullableJsonNullValueInput | InputJsonValue':
            replacer(signature.type.pos, signature.type.end, `DeepPartial<${nsName}.${typename}> | null`);
            break;

          // TODO
          case 'JsonFilter':
            break;

          // TODO
          case 'JsonWithAggregatesFilter':
            break;

          default:
            logger.error(
              `Unknown type ${signatureType} for field ${fieldName} at model ${typeAliasName}`
            );
        }
      }

      // There is no need to continue the loop
      // as only ONE model may match
      break;
    }
  }
}
