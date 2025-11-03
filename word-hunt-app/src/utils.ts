export const extractWord = (
  grid: (string | null)[][],
  path: { x: number; y: number }[],
): string | undefined => {
  let word = "";
  for (const point of path) {
    const chr = grid?.[point.y]?.[point.x];
    if (chr == null) {
      return undefined;
    }
    word += chr;
  }
  return word;
};
