export function isValidUserPayload(payload: any): { valid: boolean; message?: string } {
  if (!payload || typeof payload !== "object") {
    return { valid: false, message: "Request body must be an object" };
  }

  const { username, age, hobbies } = payload;

  if (typeof username !== "string" || username.trim() === "") {
    return { valid: false, message: "Field 'username' is required and must be a non-empty string" };
  }

  if (typeof age !== "number" || !Number.isFinite(age)) {
    return { valid: false, message: "Field 'age' is required and must be a number" };
  }

  if (!Array.isArray(hobbies)) {
    return { valid: false, message: "Field 'hobbies' is required and must be an array. can be empty" };
  }

  for (const h of hobbies) {
    if (typeof h !== "string") {
      return { valid: false, message: "All hobbies must be strings" };
    }
  }

  return { valid: true };
}
