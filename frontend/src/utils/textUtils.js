export const generateSearchableWords = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter((word) => word.trim().length > 0); // Remove empty strings
};
