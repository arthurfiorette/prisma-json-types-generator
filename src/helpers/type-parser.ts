/**
 * A function to parse the type syntax from a comment.
 *
 * @example `[TYPE] comment...`
 */
export function parseTypeSyntax(text?: string) {
  if (!text) {
    return null;
  }

  // remove leading and trailing whitespace
  text = text.trim();

  const literal = text[0] === '!';

  // No character is allowed before the opening bracket
  if (text[+literal] !== '[') {
    return null;
  }

  // Already know first char is [
  let nesting = 1;
  // converts into 0 or 1
  const start = +literal + 1;

  for (let i = start; i < text.length; i++) {
    // Skip escaped characters
    if (text[i - 1] !== '\\') {
      switch (text[i]) {
        case '[':
          nesting++;
          break;
        case ']':
          nesting--;
          break;
      }
    }

    if (nesting === 0) {
      const type = text.slice(start, i);

      // empty types are not allowed
      if (!type) {
        return null;
      }

      return { literal, type };
    }
  }

  return null;
}
