type ClassValue = string | number | boolean | null | undefined | ClassValue[];

function flatten(input: ClassValue): string[] {
  if (input === null || input === undefined || input === false) return [];
  if (typeof input === 'string' || typeof input === 'number') return [String(input)];
  if (Array.isArray(input)) return input.flatMap(flatten);
  return [];
}

/** 合并 className，过滤 falsy 值 */
export function cn(...inputs: ClassValue[]): string {
  return inputs.flatMap(flatten).join(' ');
}
