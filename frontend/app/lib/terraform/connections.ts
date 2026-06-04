export function generateConnectionTF(env: string, name: string) {
  return `
resource "saviynt_connection" "${name}" {
  name = "${name}"
  environment = "${env}"
}
`;
}
