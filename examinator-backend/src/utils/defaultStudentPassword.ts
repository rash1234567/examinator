/** Initial password for lecturer-created students when none is provided. */
export function defaultStudentPassword(lastName: string): string {
  return lastName.trim();
}
