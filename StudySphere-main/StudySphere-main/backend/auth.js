// Password hashing + signed session tokens, built entirely on Node's
// built-in `node:crypto` module. No `bcrypt` / `jsonwebtoken` dependency.
//
// Passwords: scrypt (CPU/memory-hard, same family bcrypt/argon2 belong to)
// with a random salt per user, compared in constant time.
//
// Tokens: a JWT-shaped token (header.payload.signature, base64url, HMAC-SHA256)
// — interoperable with standard JWT tooling if you ever swap this out later.

const crypto = require("node:crypto");

const SCRYPT_KEYLEN = 64;

/* =====================================================
   PASSWORDS
===================================================== */

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  const candidate = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const stored = Buffer.from(hash, "hex");

  if (candidate.length !== stored.length) return false;

  return crypto.timingSafeEqual(candidate, stored);
}

/* =====================================================
   TOKENS (JWT-shaped, HMAC-SHA256)
===================================================== */

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + padding, "base64").toString("utf8");
}

function sign(payload, secret, expiresInSeconds) {
  const header = { alg: "HS256", typ: "JWT" };

  const fullPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(fullPayload));

  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest();

  const signaturePart = signature
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return `${headerPart}.${payloadPart}.${signaturePart}`;
}

function verify(token, secret) {
  if (typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [headerPart, payloadPart, signaturePart] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${headerPart}.${payloadPart}`)
    .digest();

  const expectedSignaturePart = expectedSignature
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const providedBuf = Buffer.from(signaturePart);
  const expectedBuf = Buffer.from(expectedSignaturePart);

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(base64urlDecode(payloadPart));
  } catch {
    return null;
  }

  if (typeof payload.exp === "number" && Date.now() / 1000 > payload.exp) {
    return null; // expired
  }

  return payload;
}

module.exports = {
  hashPassword,
  verifyPassword,
  sign,
  verify,
};
