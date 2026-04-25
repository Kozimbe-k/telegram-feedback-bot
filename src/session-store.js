import crypto from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { decryptJson, encryptJson } from "./security.js";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "data");
const SESSIONS_DIR = path.join(DATA_DIR, "sessions");

function getSessionFilename(sessionKey) {
  const digest = crypto.createHash("sha256").update(sessionKey).digest("hex");
  return path.join(SESSIONS_DIR, `${digest}.json`);
}

export function getSessionKey(ctx) {
  if (!ctx.from?.id || !ctx.chat?.id) {
    return null;
  }

  return `${ctx.from.id}:${ctx.chat.id}`;
}

export async function loadSession(sessionKey, encryptionKey, createSession) {
  try {
    const filename = getSessionFilename(sessionKey);
    const raw = await readFile(filename, "utf8");
    const encrypted = JSON.parse(raw);
    return decryptJson(encrypted, encryptionKey);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return createSession();
    }

    console.error("Failed to load session, starting fresh.", error);
    return createSession();
  }
}

export async function saveSession(sessionKey, session, encryptionKey) {
  const filename = getSessionFilename(sessionKey);
  await mkdir(SESSIONS_DIR, { recursive: true });

  const encrypted = encryptJson(session, encryptionKey);
  await writeFile(filename, JSON.stringify(encrypted), "utf8");
}
