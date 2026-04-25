import "dotenv/config";
import { Markup, Telegraf } from "telegraf";
import { getText, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from "./i18n.js";
import {
  extractPhoneFromMessage,
  getEncryptionKey,
  getManagersFromEnv,
  maskPhone,
  sanitizeText,
  validateName,
  validateRequiredComment
} from "./security.js";
import { getSessionKey, loadSession, saveSession } from "./session-store.js";
import { saveFeedback } from "./storage.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "";
const ADMIN_INCLUDE_FULL_PHONE = String(
  process.env.ADMIN_INCLUDE_FULL_PHONE || "false"
).toLowerCase() === "true";
const managers = getManagersFromEnv(process.env.MANAGERS);
const encryptionKey = getEncryptionKey(process.env.ENCRYPTION_KEY);

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is required.");
}

const bot = new Telegraf(BOT_TOKEN);

function createSession() {
  return {
    language: null,
    step: "choose_language",
    feedback: {}
  };
}

function getLanguage(ctx) {
  return ctx.session?.language || "en";
}

function languageKeyboard() {
  return Markup.inlineKeyboard(
    SUPPORTED_LANGUAGES.map((language) =>
      Markup.button.callback(LANGUAGE_LABELS[language], `lang:${language}`)
    ),
    { columns: 1 }
  );
}

function phoneKeyboard(language) {
  return Markup.keyboard([
    [Markup.button.contactRequest(getText(language, "phoneButton"))]
  ])
    .oneTime()
    .resize();
}

function managerKeyboard() {
  return Markup.inlineKeyboard(
    managers.map((manager, index) =>
      Markup.button.callback(manager, `manager:${index}`)
    ),
    { columns: 1 }
  );
}

function ratingKeyboard(prefix) {
  return Markup.inlineKeyboard(
    [1, 2, 3, 4, 5].map((rating) =>
      Markup.button.callback(String(rating), `${prefix}:${rating}`)
    ),
    { columns: 5 }
  );
}

function returnKeyboard(language) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(getText(language, "yes"), "return:yes"),
      Markup.button.callback(getText(language, "no"), "return:no")
    ]
  ]);
}

async function resetToLanguageChoice(ctx, noticeKey = null) {
  ctx.session = createSession();

  if (noticeKey) {
    await ctx.reply(getText("en", noticeKey));
  }

  await ctx.reply(getText("en", "chooseLanguage"), languageKeyboard());
}

async function askManagerQuestion(ctx) {
  const language = getLanguage(ctx);
  ctx.session.step = "ask_manager";
  await ctx.reply(getText(language, "askManager"), managerKeyboard());
}

function formatReturnAnswer(willWorkAgain) {
  return willWorkAgain ? "Yes" : "No";
}

function formatAdminFeedbackMessage(payload) {
  const phone = ADMIN_INCLUDE_FULL_PHONE
    ? payload.feedback.phone
    : maskPhone(payload.feedback.phone);

  const lines = [
    "New client feedback received",
    `Submitted: ${payload.createdAt}`,
    `Name: ${payload.feedback.name}`,
    `Phone: ${phone}`,
    `Manager: ${payload.feedback.manager}`,
    `Manager rating: ${payload.feedback.managerRating}/5`,
    `Manager comment: ${payload.feedback.managerComment}`,
    `Service rating: ${payload.feedback.serviceRating}/5`,
    `Service comment: ${payload.feedback.serviceComment}`,
    `Will work with us again: ${formatReturnAnswer(
      payload.feedback.willWorkAgain
    )}`
  ];

  if (!payload.feedback.willWorkAgain && payload.feedback.noReason) {
    lines.push(`Reason for No: ${payload.feedback.noReason}`);
  }

  if (payload.telegram.username) {
    lines.push(`Telegram username: @${payload.telegram.username}`);
  }

  if (payload.telegram.userId) {
    lines.push(`Telegram user ID: ${payload.telegram.userId}`);
  }

  return lines.join("\n");
}

async function finalizeFeedback(ctx, finalMessageKey) {
  const language = getLanguage(ctx);
  const payload = {
    createdAt: new Date().toISOString(),
    language,
    telegram: {
      userId: ctx.from?.id || null,
      username: ctx.from?.username || null,
      firstName: ctx.from?.first_name || null,
      lastName: ctx.from?.last_name || null
    },
    feedback: ctx.session.feedback
  };

  await saveFeedback(payload, encryptionKey);

  if (ADMIN_CHAT_ID) {
    const adminText = formatAdminFeedbackMessage(payload);
    await bot.telegram.sendMessage(ADMIN_CHAT_ID, adminText).catch((error) => {
      console.error("Failed to send admin notification", error);
    });
  }

  ctx.session = createSession();
  await ctx.reply(getText(language, finalMessageKey), Markup.removeKeyboard());
}

bot.use(async (ctx, next) => {
  const sessionKey = getSessionKey(ctx);
  ctx.session = sessionKey
    ? await loadSession(sessionKey, encryptionKey, createSession)
    : createSession();

  await next();

  if (sessionKey) {
    await saveSession(sessionKey, ctx.session, encryptionKey);
  }
});

bot.use(async (ctx, next) => {
  if (ctx.chat?.type !== "private") {
    await ctx.reply(getText("en", "privateOnly"));
    return;
  }

  return next();
});

bot.start(async (ctx) => {
  ctx.session = createSession();
  await ctx.reply(getText("en", "chooseLanguage"), languageKeyboard());
});

bot.command("cancel", async (ctx) => {
  const language = getLanguage(ctx);
  ctx.session = createSession();
  await ctx.reply(getText(language, "cancelled"), Markup.removeKeyboard());
});

bot.command("restart", async (ctx) => {
  await resetToLanguageChoice(ctx, "restarted");
});

bot.action(/lang:(en|ru|uz)/, async (ctx) => {
  const language = ctx.match[1];
  ctx.session = createSession();
  ctx.session.language = language;
  ctx.session.step = "ask_name";

  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => {});
  await ctx.reply(getText(language, "askName"), Markup.removeKeyboard());
});

bot.action(/manager:(\d+)/, async (ctx) => {
  if (ctx.session.step !== "ask_manager") {
    await ctx.answerCbQuery();
    return;
  }

  const language = getLanguage(ctx);
  const index = Number(ctx.match[1]);
  const manager = managers[index];

  if (!manager) {
    await ctx.answerCbQuery();
    return;
  }

  ctx.session.feedback.manager = manager;
  ctx.session.step = "ask_manager_rating";

  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => {});
  await ctx.reply(
    getText(language, "askManagerRating", manager),
    ratingKeyboard("manager_rating")
  );
});

bot.action(/manager_rating:([1-5])/, async (ctx) => {
  if (ctx.session.step !== "ask_manager_rating") {
    await ctx.answerCbQuery();
    return;
  }

  const language = getLanguage(ctx);
  ctx.session.feedback.managerRating = Number(ctx.match[1]);
  ctx.session.step = "ask_manager_comment";

  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => {});
  await ctx.reply(getText(language, "askManagerComment"));
});

bot.action(/service_rating:([1-5])/, async (ctx) => {
  if (ctx.session.step !== "ask_service_rating") {
    await ctx.answerCbQuery();
    return;
  }

  const language = getLanguage(ctx);
  ctx.session.feedback.serviceRating = Number(ctx.match[1]);
  ctx.session.step = "ask_service_comment";

  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => {});
  await ctx.reply(getText(language, "askServiceComment"));
});

bot.action(/return:(yes|no)/, async (ctx) => {
  if (ctx.session.step !== "ask_returning") {
    await ctx.answerCbQuery();
    return;
  }

  const language = getLanguage(ctx);
  const willWorkAgain = ctx.match[1] === "yes";
  ctx.session.feedback.willWorkAgain = willWorkAgain;

  await ctx.answerCbQuery();
  await ctx.editMessageReplyMarkup(undefined).catch(() => {});

  if (willWorkAgain) {
    await finalizeFeedback(ctx, "finalThanksYes");
    return;
  }

  ctx.session.step = "ask_no_reason";
  await ctx.reply(getText(language, "askNoReason"));
});

bot.on("message", async (ctx) => {
  const language = getLanguage(ctx);
  const step = ctx.session.step;

  if (step === "choose_language") {
    await ctx.reply(getText("en", "chooseLanguage"), languageKeyboard());
    return;
  }

  if (step === "ask_name") {
    const name = validateName(ctx.message.text);
    if (!name) {
      await ctx.reply(getText(language, "invalidName"));
      return;
    }

    ctx.session.feedback.name = name;
    ctx.session.step = "ask_phone";

    await ctx.reply(getText(language, "askPhone"), phoneKeyboard(language));
    return;
  }

  if (step === "ask_phone") {
    const phone = extractPhoneFromMessage(ctx.message);
    if (!phone) {
      await ctx.reply(getText(language, "invalidPhone"));
      return;
    }

    ctx.session.feedback.phone = phone;
    await askManagerQuestion(ctx);
    return;
  }

  if (step === "ask_manager_comment") {
    const comment = validateRequiredComment(ctx.message.text);
    if (!comment) {
      await ctx.reply(getText(language, "invalidComment"));
      return;
    }

    ctx.session.feedback.managerComment = comment;
    ctx.session.step = "ask_service_rating";

    await ctx.reply(getText(language, "managerThanks"));
    await ctx.reply(
      getText(language, "askServiceRating"),
      ratingKeyboard("service_rating")
    );
    return;
  }

  if (step === "ask_service_comment") {
    const comment = validateRequiredComment(ctx.message.text);
    if (!comment) {
      await ctx.reply(getText(language, "invalidComment"));
      return;
    }

    ctx.session.feedback.serviceComment = comment;
    ctx.session.step = "ask_returning";

    await ctx.reply(getText(language, "serviceThanks"));
    await ctx.reply(getText(language, "askReturn"), returnKeyboard(language));
    return;
  }

  if (step === "ask_no_reason") {
    const reason = validateRequiredComment(ctx.message.text);
    if (!reason) {
      await ctx.reply(getText(language, "invalidReason"));
      return;
    }

    ctx.session.feedback.noReason = reason;
    await finalizeFeedback(ctx, "finalThanksNo");
    return;
  }

  if (step === "done") {
    await ctx.reply(getText(language, "useStart"));
    return;
  }

  const fallback = sanitizeText(ctx.message.text || "");
  if (fallback === "/start") {
    ctx.session = createSession();
    await ctx.reply(getText("en", "chooseLanguage"), languageKeyboard());
    return;
  }

  await ctx.reply(getText(language, "useStart"));
});

bot.catch((error, ctx) => {
  console.error("Bot error", error, { userId: ctx.from?.id });
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
