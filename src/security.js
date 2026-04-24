import crypto from "node:crypto";

const MAX_NAME_LENGTH = 80;
const MAX_COMMENT_LENGTH = 700;

export function getManagersFromEnv(value) {
  const managers = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (managers.length === 0) {
    throw new Error("MANAGERS must contain at least one manager name.");
  }

  return managers;
}

export function getEncryptionKey(hexKey) {
  if (!/^[a-fA-F0-9]{64}$/.test(hexKey || "")) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string.");
  }

  return Buffer.from(hexKey, "hex");
}

export function sanitizeText(value, maxLength = MAX_COMMENT_LENGTH) {
  const sanitized = String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized.slice(0, maxLength);
}

export function validateName(value) {
  const name = sanitizeText(value, MAX_NAME_LENGTH);
  if (name.length < 2) {
    return null;
  }

  return name;
}

export function normalizePhone(input) {
  const raw = String(input || "").trim();
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");

  if (digits.length < 8 || digits.length > 15) {
    return null;
  }

  return `${hasPlus ? "+" : "+"}${digits}`;
}

export function extractPhoneFromMessage(message) {
  if (message?.contact?.phone_number) {
    return normalizePhone(message.contact.phone_number);
  }

  if (typeof message?.text === "string") {
    return normalizePhone(message.text);
  }

  return null;
}

export function validateRequiredComment(value) {
  const comment = sanitizeText(value);
  if (comment.length < 3) {
    return null;
  }

  return comment;
}

export function maskPhone(phone) {
  const value = normalizePhone(phone);
  if (!value) {
    return "invalid";
  }

  const visible = value.slice(-4);
  return `***${visible}`;
}

export function encryptJson(payload, encryptionKey) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
  const serialized = JSON.stringify(payload);
  const encrypted = Buffer.concat([
    cipher.update(serialized, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    ciphertext: encrypted.toString("hex")
  };
}

export function decryptJson(encryptedPayload, encryptionKey) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(encryptedPayload.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(encryptedPayload.tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedPayload.ciphertext, "hex")),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}
