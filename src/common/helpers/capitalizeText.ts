export const capitalizeText = (txt: string) => {
  const transformed = txt
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
  return transformed;
};
