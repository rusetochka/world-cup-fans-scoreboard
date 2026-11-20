(function () {
"use strict";

const MESSAGES = {
  en: {
    defaultTitle: "World Cup Fans Scoreboard",
    defaultSubtitle: "Who called it best?",
    rules: "Correct winner = 3 pts · Called the draw = 3 pts · Other picks on a draw = 1 pt",
    updated: "Updated: {text}",
    updatedDash: "Updated: —",
    resultsLabel: "Results",
    resultsStatus: "Results: {text}",
    lastUpdated: "Results snapshot updated {date}",
    langSwitch: "Language",
    refresh: "Refresh scores",
    loading: "Loading demo snapshot…",
    loadingScoreboard: "Loading scoreboard…",
    scoreboard: "Scoreboard",
    leaderboardFull: "Full bracket",
    leaderboardVs: "Same picks as {name}",
    leaderboardVsMany: "Same picks as {names}",
    playerPair: "{a} & {b}",
    playerList: "{rest} & {last}",
    leaderboardMatchCount: "{count} matches",
    leaderboardCoverage: "{picked} of {total} picks on this board",
    leaderboardPartialLegend: "Dashed ring = not all picks · tap player to see missing",
    missingPicksTitle: "Missing picks for {name}",
    missingPicksTap: "Tap to see missing matches",
    matchingBets: "Matching bets",
    whoThinksAlike: "Who thinks alike?",
    agreementEmpty: "Need overlapping bets on the same matches to compare.",
    agreementHint: "Same pick on a match = 1 match",
    bookmakerBets: "Bookmaker comparison",
    vsBookmakers: "As bookmakers",
    bookmakerEmpty: "No bookmaker favorites loaded.",
    bookmakerHint: "Group stage + Round of 32 + Round of 16 with known teams · same pick as favorite = 1 match",
    bookmakerLabel: "Bookmakers",
    bookmakerPicksTitle: "Bookmaker picks",
    bookmakerPicksHint: "Group stage + Round of 32 + Round of 16 with known teams — from sheet or strength rating.",
    bookmakerPicksCount: "{count} matches",
    pickAccuracyTitle: "Pick accuracy",
    pickAccuracyHint: "Correct winner or draw call ÷ your bets on finished matches",
    pickAccuracyEmpty: "No finished matches with bets yet",
    bookmakerBettingTitle: "At the bookmaker",
    bookmakerBettingHint:
      "{stake} units per pick · estimated market odds (group + R32 + R16) · settled bets only",
    bookmakerBettingEmpty: "No bets on bookmaker matches yet",
    bookmakerBettingMeta: "{wins}W-{losses}L · {pending} open",
    cupWinnerTitle: "Your World Cup winner",
    cupWinnerHint:
      "Knockout bracket from each player's picks · missing picks use results or favorites",
    cupWinnerEmpty: "Not enough data to project a winner",
    cupWinnerIncomplete: "Incomplete",
    cupWinnerGaps: "{count} gaps filled",
    upcomingMatches: "Upcoming matches",
    upcomingEmpty: "No upcoming matches",
    berlinTime: "Berlin Time",
    matchResultsTitle: "Bets vs results",
    matchResultsHint: "Tap a match to see everyone's picks",
    matchResultsEmpty: "No finished matches yet",
    matchResultsCount: "{count} matches",
    matchResultLabel: "Result",
    matchPoints: "+{count}",
    drawPick: "Draw",
    noPlayers: "No demo participants found.",
    statusNoResults: "No results yet",
    statusScored: "{finished} of {total} matches scored",
    errorLoadFailed: "Demo snapshot unavailable",
    pageTitle: "World Cup Fans Scoreboard",
  },
  ru: {
    defaultTitle: "Фанатское табло ЧМ 2026",
    defaultSubtitle: "Кто угадал лучше всех?",
    rules: "Точный победитель = 3 очка · Угадал ничью = 3 очка · Остальные при ничьей = 1 очко",
    updated: "Обновлено: {text}",
    updatedDash: "Обновлено: —",
    resultsLabel: "Результаты",
    resultsStatus: "Результаты: {text}",
    lastUpdated: "Таблица изменена {date}",
    langSwitch: "Язык",
    refresh: "Обновить",
    loading: "Загрузка демо-данных…",
    loadingScoreboard: "Загрузка таблицы…",
    scoreboard: "Таблица лидеров",
    leaderboardFull: "Все матчи",
    leaderboardVs: "Те же матчи, что {name}",
    leaderboardVsMany: "Те же матчи, что {names}",
    playerPair: "{a} и {b}",
    playerList: "{rest} и {last}",
    leaderboardMatchCount: "{count} матчей",
    leaderboardCoverage: "Ставки на {picked} из {total} матчей",
    leaderboardPartialLegend: "Пунктир = не все матчи · нажмите на игрока, чтобы увидеть пропуски",
    missingPicksTitle: "Нет ставок у {name}",
    missingPicksTap: "Нажмите, чтобы увидеть пропущенные матчи",
    matchingBets: "Совпадение ставок",
    whoThinksAlike: "Кто думает одинаково?",
    agreementEmpty: "Нужны общие ставки на одни и те же матчи.",
    agreementHint: "Одинаковый прогноз = 1 совпадение",
    bookmakerBets: "Сравнение с букмекерами",
    vsBookmakers: "Совпадение с букмекерами",
    bookmakerEmpty: "Нет данных букмекеров.",
    bookmakerHint: "Группы + 1/16 + 1/8 с известными командами · как у букмекера = 1 совпадение",
    bookmakerLabel: "Букмекеры",
    bookmakerPicksTitle: "Прогнозы букмекеров",
    bookmakerPicksHint: "Группы + 1/16 + 1/8 с известными командами — из таблицы или рейтинга силы.",
    bookmakerPicksCount: "{count} матчей",
    pickAccuracyTitle: "Точность прогнозов",
    pickAccuracyHint: "Угаданный победитель или ничья ÷ ваши ставки на сыгранные матчи",
    pickAccuracyEmpty: "Пока нет ставок на завершённые матчи",
    bookmakerBettingTitle: "У букмекера",
    bookmakerBettingHint:
      "{stake} ед. за ставку · оценка рыночных коэффициентов (группы + 1/16 + 1/8) · только сыгранные",
    bookmakerBettingEmpty: "Пока нет ставок на матчи букмекера",
    bookmakerBettingMeta: "{wins}В-{losses}П · {pending} открыто",
    cupWinnerTitle: "Победитель ЧМ по вашим ставкам",
    cupWinnerHint:
      "Плей-офф по ставкам каждого игрока · пропуски заполняются результатами или фаворитами",
    cupWinnerEmpty: "Недостаточно данных для прогноза победителя",
    cupWinnerIncomplete: "Неполный",
    cupWinnerGaps: "{count} пропусков",
    upcomingMatches: "Ближайшие матчи",
    upcomingEmpty: "Нет предстоящих матчей",
    berlinTime: "Берлин",
    matchResultsTitle: "Ставки и результаты",
    matchResultsHint: "Нажмите на матч, чтобы увидеть ставки",
    matchResultsEmpty: "Пока нет завершённых матчей",
    matchResultsCount: "{count} матчей",
    matchResultLabel: "Результат",
    matchPoints: "+{count}",
    drawPick: "Ничья",
    noPlayers: "Демо-участники не найдены.",
    statusNoResults: "Результатов пока нет",
    statusScored: "Оценено {finished} из {total} матчей",
    errorLoadFailed: "Demo snapshot unavailable",
    pageTitle: "ЧМ 2026 · Ставки",
  },
};

function detectLocale() {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || "en"];
  const ru = langs.some((lang) => String(lang).toLowerCase().startsWith("ru"));
  return ru ? "ru" : "en";
}

const LOCALE_KEY = "wc2026-locale";

const PLAYER_NAMES_RU = {};

function localizePlayerName(name) {
  if (getLocale() !== "ru") return name;
  return PLAYER_NAMES_RU[name] ?? name;
}

function getStoredLocale() {
  if (typeof localStorage === "undefined") return null;
  try {
    const value = localStorage.getItem(LOCALE_KEY);
    if (value === "en" || value === "ru") return value;
  } catch {
    /* private browsing */
  }
  return null;
}

function setLocale(locale) {
  if (locale !== "en" && locale !== "ru") return;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      /* ignore */
    }
  }
}

function getLocale() {
  return "en";
}

function formatSheetDate(isoValue, locale) {
  const parser =
    typeof WCLogic !== "undefined" ? WCLogic.parseSheetDateValue : null;
  const date = parser ? parser(isoValue) : new Date(isoValue);
  if (!date || Number.isNaN(date.getTime())) return null;
  const tag = locale === "ru" ? "ru-RU" : "en-US";
  return new Intl.DateTimeFormat(tag, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function t(key, params = {}) {
  const locale = getLocale();
  const bucket = MESSAGES[locale] || MESSAGES.en;
  let text = bucket[key] ?? MESSAGES.en[key] ?? key;
  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

function localizeConfig(config) {
  if (getLocale() !== "ru") return config;
  return {
    ...config,
    title: config.titleRu || t("defaultTitle"),
    subtitle: config.subtitleRu || t("defaultSubtitle"),
  };
}

function formatMatchKickoff(kickoff, locale = getLocale()) {
  const parser = typeof WCLogic !== "undefined" ? WCLogic.parseMatchKickoff : null;
  const date = parser ? parser(kickoff) : new Date(kickoff);
  if (!date || Number.isNaN(date.getTime())) {
    return kickoff ? String(kickoff) : "—";
  }

  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${parts.day}.${parts.month}.${parts.year} ${parts.hour}:${parts.minute} (${t("berlinTime")})`;
}

function formatStatus(finished, total) {
  if (!total) return t("statusNoResults");
  return t("statusScored", { finished, total });
}

function applyStaticUI() {
  const locale = getLocale();
  document.documentElement.lang = locale;
  document.title = t("pageTitle");

  const rules = document.querySelector(".rules");
  if (rules) rules.textContent = t("rules");

  const refreshBtn = document.getElementById("refresh-btn");
  if (refreshBtn) refreshBtn.textContent = t("refresh");

  const langSwitch = document.getElementById("lang-switch");
  if (langSwitch) langSwitch.setAttribute("aria-label", t("langSwitch"));

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const active = btn.dataset.lang === locale;
    btn.classList.toggle("is-active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });

  const content = document.getElementById("content");
  if (content?.classList.contains("loading")) {
    content.textContent = t("loadingScoreboard");
  }

  const resultsLabel = document.getElementById("results-label");
  const resultsCount = document.getElementById("results-count");
  const resultsBarTrack = document.getElementById("results-bar-track");
  const resultsBarFill = document.getElementById("results-bar-fill");
  if (resultsLabel) resultsLabel.textContent = t("resultsLabel");
  if (resultsCount) resultsCount.textContent = "—";
  if (resultsBarFill) {
    resultsBarFill.style.width = "0%";
    resultsBarFill.classList.remove("is-complete");
  }
  if (resultsBarTrack) {
    resultsBarTrack.setAttribute("aria-valuenow", "0");
    resultsBarTrack.setAttribute("aria-valuemax", "0");
    resultsBarTrack.setAttribute("aria-label", t("resultsLabel"));
  }

  const sheetUpdated = document.getElementById("sheet-updated");
  if (sheetUpdated) {
    sheetUpdated.hidden = true;
    sheetUpdated.textContent = "";
  }

  const config = window.DEMO_CONFIG;
  if (config) {
    const localized = localizeConfig(config);
    const title = document.getElementById("title");
    const subtitle = document.getElementById("subtitle");
    if (title) title.textContent = localized.title;
    if (subtitle) subtitle.textContent = localized.subtitle;
  }
}

const WCI18n = {
  getLocale,
  detectLocale,
  getStoredLocale,
  setLocale,
  t,
  localizeConfig,
  localizePlayerName,
  formatStatus,
  formatSheetDate,
  formatMatchKickoff,
  applyStaticUI,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = WCI18n;
}

if (typeof window !== "undefined") {
  window.WCI18n = WCI18n;
}
})();
