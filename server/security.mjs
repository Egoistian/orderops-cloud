import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, salt, expectedHex] = String(storedHash).split(":");
  if (algorithm !== "scrypt" || !salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(await scrypt(password, salt, expected.length));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
