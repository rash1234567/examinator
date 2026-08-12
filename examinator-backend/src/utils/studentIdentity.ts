export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeMatric(matric: string): string {
  return matric.trim().toUpperCase();
}
