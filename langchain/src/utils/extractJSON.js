export const extractJSON = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}
