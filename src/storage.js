import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { encryptJson } from "./security.js";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "data");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback-log.jsonl");

export async function saveFeedback(payload, encryptionKey) {
  console.log("saveFeedback called, saving to:", FEEDBACK_FILE); // ← add this
  await mkdir(DATA_DIR, { recursive: true });

  const encrypted = encryptJson(payload, encryptionKey);
  const record = {
    createdAt: payload.createdAt,
    iv: encrypted.iv,
    tag: encrypted.tag,
    ciphertext: encrypted.ciphertext
  };

  await appendFile(FEEDBACK_FILE, `${JSON.stringify(record)}\n`, "utf8");
  console.log("Feedback saved successfully."); // ← and this
}
