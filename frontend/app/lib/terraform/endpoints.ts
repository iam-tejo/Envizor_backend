export function generateEndpointTF(env: string, name: string) {
  return `
resource "saviynt_endpoint" "${name}" {
  name = "${name}"
  environment = "${env}"
}
`;
}
