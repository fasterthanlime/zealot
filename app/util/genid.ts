const generate = require("nanoid/generate");

const alphabet = "1234567890abcdef";
const length = 10;

export function genid(): string {
  return generate(alphabet, length);
}
