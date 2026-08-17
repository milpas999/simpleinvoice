/** Builds a compact page list like [1, "ellipsis", 4, 5, 6, "ellipsis", 12] for pagination controls. */
export function getPageItems(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  const sorted = [...items].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) {
      result.push("ellipsis");
    }
    result.push(n);
    prev = n;
  }
  return result;
}
