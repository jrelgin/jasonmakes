type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: boolean | null | undefined };

function toArray(value: ClassValue): Array<string | number> {
  if (Array.isArray(value)) {
    return value.flatMap(toArray);
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([className]) => className);
  }

  if (typeof value === "string" || typeof value === "number") {
    return [value];
  }

  return [];
}

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flatMap(toArray)
    .map((value) => value.toString().trim())
    .filter(Boolean)
    .join(" ");
}
