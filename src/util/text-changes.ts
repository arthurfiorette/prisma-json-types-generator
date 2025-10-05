/** A changes made in the original file to help adjust any future coordinates of texts */
export interface TextDiff {
  start: number;
  end: number;
  text: string;
}

/**
 * Applies multiple text changes to a string efficiently.
 * Uses array-based approach to avoid quadratic string concatenation.
 *
 * @param content The original text content
 * @param changes Array of changes to apply
 * @returns The text with all changes applied
 */
export function applyTextChanges(content: string, changes: TextDiff[]): string {
  if (changes.length === 0) {
    return content;
  }

  // Sort the changes by their start index to apply them in order
  const sortedChanges = [...changes].sort((a, b) => a.start - b.start);

  const segments: string[] = [];
  let lastEnd = 0;

  for (const change of sortedChanges) {
    // Add the unchanged content before this change
    if (change.start > lastEnd) {
      segments.push(content.substring(lastEnd, change.start));
    }

    // Add the replacement text
    segments.push(change.text);

    // Update the position for the next iteration
    lastEnd = change.end;
  }

  // Add any remaining content after the last change
  if (lastEnd < content.length) {
    segments.push(content.substring(lastEnd));
  }

  // Join all segments once at the end
  return segments.join('');
}
