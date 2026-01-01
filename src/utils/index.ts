function objectToString(obj: Record<string, any>): string {
  return JSON.stringify(obj);
}

function stringToObject(str: string): Record<string, any> | null {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

export { objectToString, stringToObject };
