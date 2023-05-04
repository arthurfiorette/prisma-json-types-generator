import ts from 'typescript';
import type { Declaration } from '../file/reader';
import type { ModelWithRegex } from '../helpers/dmmf';
import { replaceSignature } from '../helpers/handle-signature';
import { JSON_REGEX } from '../helpers/regex';

export async function handleModule(
  module: ts.ModuleDeclaration,
  replacer: Declaration['replacer'],
  models: ModelWithRegex[],
  nsName: string,
  useType?: string
) {
  const namespace = module
    .getChildren()
    .find((n): n is ts.ModuleBlock => n.kind === ts.SyntaxKind.ModuleBlock);

  if (!namespace) {
    throw new Error('Prisma namespace could not be found');
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

    // May includes the model name but is not the actual model, like
    // UserCreateWithoutPostsInput for Post model. that's why we need
    // to check if the model name is in the regex
    const model = models.find((m) => m.regexps.some((r) => r.test(typeAliasName)));

    if (!model) {
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

      if (!field || !fieldName) {
        continue;
      }

      if (!signature.type) {
        throw new Error(`No type found for field ${fieldName} at model ${typeAliasName}`);
      }

      const typename = field.documentation?.match(JSON_REGEX)?.[1];

      if (!typename) {
        throw new Error(
          `No typename found for field ${fieldName} at model ${typeAliasName}`
        );
      }

      replaceSignature(
        signature.type,
        typename,
        nsName,
        replacer,
        fieldName,
        model.name,
        typeAliasName,
        useType
      );
    }
  }
}
