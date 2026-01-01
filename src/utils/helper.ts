export const getInitials = (name: string): string => {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getFirstLetter = (str: string): string => {
  if (!str) return "#";

  const normalized = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const firstChar = normalized.charAt(0).toUpperCase();
  if (/[A-Z]/.test(firstChar)) {
    return firstChar;
  }

  return "#";
};
