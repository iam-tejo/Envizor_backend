export function generateSecuritySystemTF(env: string, name: string) {
  return `
resource "saviynt_security_system" "${name}" {
  name = "${name}"
  environment = "${env}"
}
`;
}
