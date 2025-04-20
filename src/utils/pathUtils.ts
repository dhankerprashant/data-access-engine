/**
 * Resolves dot-notation paths and handles array wildcards like [i].
 * Example: "accounts[i].balance" → ["accounts[0].balance", "accounts[1].balance", ...]
 */

export function resolvePaths(obj: any, pathPattern: string | undefined): string[] {
  const paths: string[] = [];

  if (!pathPattern || typeof pathPattern !== 'string') {
    console.warn(`[resolvePaths] Invalid pathPattern:`, pathPattern);
    return [];
  }

  const parts = pathPattern.split('.');

  function traverse(current: any, pathParts: string[], acc: string[]) {
    if (!current || pathParts.length === 0) {
      paths.push(acc.join('.'));
      return;
    }

    const [segment, ...rest] = pathParts;

    const arrayMatch = segment.match(/^(\w+)\[i\]$/);
    const indexMatch = segment.match(/^(\w+)\[(\d+)\]$/);

    if (arrayMatch) {
      const key = arrayMatch[1];
      const array = current[key];
      if (Array.isArray(array)) {
        array.forEach((_, idx) => {
          traverse(array[idx], rest, [...acc, `${key}[${idx}]`]);
        });
      }
    } else if (indexMatch) {
      const [_, key, idxStr] = indexMatch;
      const index = parseInt(idxStr, 10);
      const next = current[key]?.[index];
      traverse(next, rest, [...acc, `${key}[${index}]`]);
    } else {
      traverse(current?.[segment], rest, [...acc, segment]);
    }
  }

  traverse(obj, parts, []);
  return paths;
}
