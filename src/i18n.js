export const SUPPORTED_LANGUAGES = ["en", "ru", "uz"];

export const LANGUAGE_LABELS = {
  en: "English",
  ru: "Русский",
  uz: "O'zbek"
};

export const TEXTS = {
  en: {
    chooseLanguage: "Please choose your language:",
    privateOnly: "Please use this bot in a private chat.",
    askName: "Please enter your full name.",
    askPhone: "Please share your phone number or type it manually.",
    phoneButton: "Share phone number",
    askManager: "How would you rate our Manager? First, please select your manager.",
    askManagerRating: (manager) => `How would you rate ${manager}? Please choose a score from 1 to 5.`,
    askManagerComment: "Please leave a comment explaining your rating for the manager.",
    managerThanks: "Thank you for your feedback about the manager.",
    askServiceRating: "How would you rate our service department or service workers? Please choose a score from 1 to 5.",
    askServiceComment: "Please leave a comment explaining your rating for the service department.",
    serviceThanks: "Thank you for your feedback about our service team.",
    askReturn: "Will you work with us again?",
    yes: "Yes",
    no: "No",
    askNoReason: "Please tell us why you would not work with us again.",
    finalThanksYes: "Thank you. Your feedback has been recorded.",
    finalThanksNo: "Thank you for your honesty. Your feedback has been recorded.",
    invalidName: "Please enter a valid name with at least 2 characters.",
    invalidPhone: "Please enter a valid phone number.",
    invalidComment: "Please write a short comment so we can understand your rating better.",
    invalidReason: "Please explain the reason in a few words.",
    useStart: "Please send /start to begin the survey.",
    restarted: "The survey has been restarted.",
    cancelled: "The survey has been cancelled. Send /start whenever you are ready.",
    adminSubmitted: "New client feedback received"
  },
  ru: {
    chooseLanguage: "Пожалуйста, выберите язык:",
    privateOnly: "Пожалуйста, используйте этого бота в личном чате.",
    askName: "Пожалуйста, введите ваше полное имя.",
    askPhone: "Пожалуйста, отправьте ваш номер телефона или введите его вручную.",
    phoneButton: "Отправить номер телефона",
    askManager: "Как бы вы оценили нашего менеджера? Сначала выберите вашего менеджера.",
    askManagerRating: (manager) => `Как бы вы оценили ${manager}? Пожалуйста, выберите оценку от 1 до 5.`,
    askManagerComment: "Пожалуйста, оставьте комментарий с объяснением вашей оценки менеджера.",
    managerThanks: "Спасибо за ваш отзыв о менеджере.",
    askServiceRating: "Как бы вы оценили наш сервисный отдел или сервисных работников? Пожалуйста, выберите оценку от 1 до 5.",
    askServiceComment: "Пожалуйста, оставьте комментарий с объяснением вашей оценки сервисного отдела.",
    serviceThanks: "Спасибо за ваш отзыв о нашей сервисной команде.",
    askReturn: "Будете ли вы работать с нами снова?",
    yes: "Да",
    no: "Нет",
    askNoReason: "Пожалуйста, расскажите, почему вы не хотели бы работать с нами снова.",
    finalThanksYes: "Спасибо. Ваш отзыв сохранен.",
    finalThanksNo: "Спасибо за честность. Ваш отзыв сохранен.",
    invalidName: "Пожалуйста, введите корректное имя не короче 2 символов.",
    invalidPhone: "Пожалуйста, введите корректный номер телефона.",
    invalidComment: "Пожалуйста, оставьте короткий комментарий, чтобы мы поняли вашу оценку лучше.",
    invalidReason: "Пожалуйста, кратко объясните причину.",
    useStart: "Пожалуйста, отправьте /start, чтобы начать опрос.",
    restarted: "Опрос был перезапущен.",
    cancelled: "Опрос отменен. Отправьте /start, когда будете готовы.",
    adminSubmitted: "Получен новый отзыв клиента"
  },
  uz: {
    chooseLanguage: "Iltimos, tilni tanlang:",
    privateOnly: "Iltimos, bu botdan shaxsiy chatda foydalaning.",
    askName: "Iltimos, to'liq ismingizni kiriting.",
    askPhone: "Iltimos, telefon raqamingizni yuboring yoki qo'lda kiriting.",
    phoneButton: "Telefon raqamini yuborish",
    askManager: "Menejerimizga qanday baho berasiz? Avval menejeringizni tanlang.",
    askManagerRating: (manager) => `${manager} uchun 1 dan 5 gacha baho bering.`,
    askManagerComment: "Iltimos, menejer bahosiga izoh yozing.",
    managerThanks: "Menejer haqidagi fikringiz uchun rahmat.",
    askServiceRating: "Servis bo'limimiz yoki servis xodimlarimizga qanday baho berasiz? 1 dan 5 gacha tanlang.",
    askServiceComment: "Iltimos, servis bo'limi bahosiga izoh yozing.",
    serviceThanks: "Servis jamoamiz haqidagi fikringiz uchun rahmat.",
    askReturn: "Yana biz bilan ishlaysizmi?",
    yes: "Ha",
    no: "Yo'q",
    askNoReason: "Iltimos, nega yana ishlamasligingiz sababini yozing.",
    finalThanksYes: "Rahmat. Fikringiz saqlandi.",
    finalThanksNo: "Samimiy javobingiz uchun rahmat. Fikringiz saqlandi.",
    invalidName: "Iltimos, kamida 2 ta belgidan iborat to'g'ri ism kiriting.",
    invalidPhone: "Iltimos, to'g'ri telefon raqamini kiriting.",
    invalidComment: "Iltimos, bahongizni tushuntiruvchi qisqa izoh yozing.",
    invalidReason: "Iltimos, sababni bir necha so'z bilan tushuntiring.",
    useStart: "So'rovni boshlash uchun /start yuboring.",
    restarted: "So'rov qayta boshlandi.",
    cancelled: "So'rov bekor qilindi. Tayyor bo'lsangiz /start yuboring.",
    adminSubmitted: "Yangi mijoz fikri qabul qilindi"
  }
};

export function getText(language, key, ...args) {
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : "en";
  const value = TEXTS[lang][key];
  return typeof value === "function" ? value(...args) : value;
}
