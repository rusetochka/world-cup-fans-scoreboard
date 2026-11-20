(function () {
"use strict";

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((key, i) => {
      obj[key] = cells[i] ?? "";
    });
    return obj;
  });
}

function normalizeTeam(name) {
  return String(name || "").trim().toLowerCase();
}

function isDrawValue(value) {
  const v = normalizeTeam(value);
  if (
    v === "draw" ||
    v === "d" ||
    v === "x" ||
    v === "tie" ||
    v === "ничья" ||
    v === "nicheya" ||
    v === "unentschieden"
  ) {
    return true;
  }
  const score = v.match(/^(\d+)\s*[-:]\s*(\d+)$/);
  return score != null && score[1] === score[2];
}

function teamMatches(a, b) {
  return normalizeTeam(a) === normalizeTeam(b);
}

const TBD_TOKENS = new Set(["", "tbd", "?", "—", "-", "n/a", "na"]);

function isTbdSide(value) {
  return TBD_TOKENS.has(String(value || "").trim().toLowerCase());
}

function normalizeMatch(raw) {
  const homeRaw = String(raw.home ?? "").trim();
  const awayRaw = String(raw.away ?? "").trim();
  const home = isTbdSide(homeRaw) ? "Home" : homeRaw;
  const away = isTbdSide(awayRaw) ? "Away" : awayRaw;

  return {
    ...raw,
    home,
    away,
    teamsPending: isTbdSide(homeRaw) || isTbdSide(awayRaw),
  };
}

function normalizePick(value, match) {
  const raw = String(value || "").trim();
  if (!raw || !match) return null;

  const lower = raw.toLowerCase();
  if (isDrawValue(raw)) return "draw";
  if (lower === "home" || lower === "h") return normalizeTeam(match.home);
  if (lower === "away" || lower === "a") return normalizeTeam(match.away);
  if (teamMatches(match.home, raw)) return normalizeTeam(match.home);
  if (teamMatches(match.away, raw)) return normalizeTeam(match.away);

  return null;
}

function normalizeResult(value, match) {
  const raw = String(value || "").trim();
  if (!raw || !match) return null;

  const lower = raw.toLowerCase();
  if (isDrawValue(raw)) return "draw";
  if (lower === "home" || lower === "h") return normalizeTeam(match.home);
  if (lower === "away" || lower === "a") return normalizeTeam(match.away);
  if (teamMatches(match.home, raw)) return normalizeTeam(match.home);
  if (teamMatches(match.away, raw)) return normalizeTeam(match.away);

  return null;
}

function matchLabel(match) {
  const label = `${match.home} vs ${match.away}`;
  if (match.teamsPending && match.id) {
    return `${match.id} · ${label}`;
  }
  return label;
}

function resolveMatchColumn(header, matches) {
  const label = String(header || "").trim();
  if (!label) return null;

  const byId = matches.find((m) => m.id === label);
  if (byId) return byId;

  const byIdPrefix = matches.find((m) => m.id && (label.startsWith(`${m.id} `) || label.startsWith(`${m.id}·`)));
  if (byIdPrefix) return byIdPrefix;

  const idLead = label.match(/^([A-Z]+\d*-?\d+)\s*[·•-]/i);
  if (idLead) {
    const byIdLead = matches.find((m) => m.id === idLead[1]);
    if (byIdLead) return byIdLead;
  }

  const vsParts = label.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (vsParts) {
    const left = vsParts[1].trim();
    const right = vsParts[2].trim();
    return (
      matches.find(
        (m) =>
          (teamMatches(m.home, left) && teamMatches(m.away, right)) ||
          (teamMatches(m.home, right) && teamMatches(m.away, left))
      ) || null
    );
  }

  return null;
}

function scorePick(pick, result) {
  if (!pick || !result) return 0;
  if (result === "draw") return pick === "draw" ? 3 : 1;
  if (pick === result) return 3;
  return 0;
}

function isCorrectPick(pick, result) {
  if (!pick || !result) return false;
  return pick === result;
}

function computePickAccuracy(players, matches, bets) {
  const finishedIds = new Set(matches.filter((match) => match.result).map((match) => match.id));
  const matchById = Object.fromEntries(matches.map((match) => [match.id, match]));
  const stats = Object.fromEntries(
    players.map((player) => [player.name, { correct: 0, scored: 0 }])
  );

  for (const bet of bets) {
    if (!finishedIds.has(bet.match_id)) continue;
    if (!stats[bet.player]) continue;

    stats[bet.player].scored++;
    const match = matchById[bet.match_id];
    if (match && isCorrectPick(bet.pick, match.result)) {
      stats[bet.player].correct++;
    }
  }

  const rows = players
    .map((player) => {
      const { correct, scored } = stats[player.name];
      return {
        name: player.name,
        emoji: player.emoji,
        color: player.color,
        correct,
        scored,
        pct: scored ? Math.round((correct / scored) * 100) : null,
      };
    })
    .filter((row) => row.scored > 0)
    .sort(
      (a, b) =>
        (b.pct ?? -1) - (a.pct ?? -1) ||
        b.scored - a.scored ||
        a.name.localeCompare(b.name)
    );

  return {
    rows,
    scoredMatches: finishedIds.size,
  };
}

function parseBetsTall(rows, matches, players) {
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => String(h).trim());
  const headerKeys = header.map((h) => h.toLowerCase().replace(/\s+/g, "_"));

  const idIdx = headerKeys.findIndex((k) => k === "id" || k === "match_id");
  const matchIdx = headerKeys.findIndex((k) => k === "match" || k === "game" || k === "fixture");
  const playerNames = players.map((p) => p.name);
  const metaKeys = new Set([
    "id",
    "match_id",
    "match",
    "game",
    "fixture",
    "date",
    "time",
    "time_et",
    "group",
    "_home",
    "_away",
    "_draw",
  ]);
  const playerCols = header
    .map((name, index) => ({ name, index, key: headerKeys[index] }))
    .filter((col) => playerNames.includes(col.name) && !metaKeys.has(col.key));

  const bets = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    let match = null;

    if (idIdx >= 0) match = resolveMatchColumn(row[idIdx], matches);
    if (!match && matchIdx >= 0) match = resolveMatchColumn(row[matchIdx], matches);
    if (!match) continue;

    for (const { name, index } of playerCols) {
      const pick = normalizePick(row[index], match);
      if (pick) bets.push({ match_id: match.id, player: name, pick });
    }
  }

  return bets;
}

function parseBetsWide(rows, matches) {
  if (rows.length < 2) return [];

  const header = rows[0];
  const columns = header.slice(1).map((label) => ({
    label: label.trim(),
    match: resolveMatchColumn(label, matches),
  }));

  const bets = [];

  for (let r = 1; r < rows.length; r++) {
    const player = (rows[r][0] || "").trim();
    if (!player) continue;

    columns.forEach((col, i) => {
      if (!col.match) return;
      const pick = normalizePick(rows[r][i + 1], col.match);
      if (pick) bets.push({ match_id: col.match.id, player, pick });
    });
  }

  return bets;
}

function parseBets(rows, matches, players) {
  const firstHeader = String(rows[0]?.[0] || "")
    .trim()
    .toLowerCase();
  if (firstHeader === "player") {
    return parseBetsWide(rows, matches);
  }
  return parseBetsTall(rows, matches, players);
}

function indexBetsByPlayer(bets) {
  const map = {};
  for (const bet of bets) {
    if (!map[bet.player]) map[bet.player] = new Set();
    map[bet.player].add(bet.match_id);
  }
  return map;
}

function computeScores(players, matches, bets, matchIds = null) {
  const idSet =
    matchIds == null ? null : matchIds instanceof Set ? matchIds : new Set(matchIds);
  const totals = Object.fromEntries(players.map((p) => [p.name, 0]));

  for (const bet of bets) {
    if (idSet && !idSet.has(bet.match_id)) continue;
    if (!Object.prototype.hasOwnProperty.call(totals, bet.player)) continue;
    const match = matches.find((m) => m.id === bet.match_id);
    if (!match) continue;
    totals[bet.player] += scorePick(bet.pick, match.result);
  }

  return players.map((p) => ({
    ...p,
    points: totals[p.name] ?? 0,
  }));
}

function countBetsInSet(byPlayer, playerName, matchIds) {
  const picks = byPlayer[playerName];
  if (!picks) return 0;
  let count = 0;
  for (const id of matchIds) {
    if (picks.has(id)) count++;
  }
  return count;
}

function buildMissingMatchesList(matches, matchIds, byPlayer, playerName) {
  const picks = byPlayer[playerName];
  const idSet = matchIds instanceof Set ? matchIds : new Set(matchIds);
  return matches
    .filter((m) => idSet.has(m.id) && !picks?.has(m.id))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    .map((m) => ({
      id: m.id,
      group: m.group,
      label: matchLabel(m),
      kickoff: m.kickoff || "",
    }));
}

function computeScoresForMatchIds(players, matches, bets, matchIds) {
  const idSet = matchIds instanceof Set ? matchIds : new Set(matchIds);
  const boardMatchCount = idSet.size;
  const byPlayer = indexBetsByPlayer(bets);
  const active = players.filter((p) =>
    bets.some((bet) => bet.player === p.name && idSet.has(bet.match_id))
  );

  return computeScores(active, matches, bets, idSet)
    .map((p) => {
      const betCount = countBetsInSet(byPlayer, p.name, idSet);
      const isPartialCoverage = betCount < boardMatchCount;
      return {
        ...p,
        betCount,
        boardMatchCount,
        isPartialCoverage,
        missingMatches: isPartialCoverage
          ? buildMissingMatchesList(matches, idSet, byPlayer, p.name)
          : [],
      };
    })
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

function matchIdsKey(matchIds) {
  return [...matchIds].sort().join("|");
}

function partialPlayersWithExactMatchSet(partialPlayers, byPlayer, matchIds) {
  return partialPlayers
    .filter((p) => {
      const ids = byPlayer[p.name];
      if (!ids || ids.size !== matchIds.size) return false;
      for (const id of matchIds) if (!ids.has(id)) return false;
      return true;
    })
    .map((p) => p.name);
}

function buildLeaderboards(config, players, matches, bets) {
  const matchCount = matches.length;
  if (!matchCount) return [];

  const byPlayer = indexBetsByPlayer(bets);
  const mainSet = new Set(config.mainPlayers || []);
  const allMatchIds = new Set(matches.map((m) => m.id));
  const leaderboards = [];

  const fullPlayers = players.filter((p) => (byPlayer[p.name]?.size ?? 0) >= matchCount);
  if (fullPlayers.length) {
    leaderboards.push({
      kind: "full",
      matchCount,
      matchIds: allMatchIds,
      players: computeScoresForMatchIds(fullPlayers, matches, bets, allMatchIds),
    });
  }

  const partialPlayers = players
    .filter((p) => !mainSet.has(p.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const seenMatchSets = new Set();

  for (const player of partialPlayers) {
    const matchIds = byPlayer[player.name];
    if (!matchIds?.size) continue;

    const setKey = matchIdsKey(matchIds);
    if (seenMatchSets.has(setKey)) continue;
    seenMatchSets.add(setKey);

    const boardPlayers = computeScoresForMatchIds(players, matches, bets, matchIds);
    if (boardPlayers.length < 2) continue;

    const focalPlayers = partialPlayersWithExactMatchSet(partialPlayers, byPlayer, matchIds);

    leaderboards.push({
      kind: "partial",
      focalPlayer: focalPlayers[0],
      focalPlayers,
      matchCount: matchIds.size,
      matchIds,
      players: boardPlayers,
    });
  }

  return leaderboards;
}

function computeBetAgreement(players, bets) {
  const byMatch = {};

  for (const bet of bets) {
    if (!byMatch[bet.match_id]) byMatch[bet.match_id] = {};
    byMatch[bet.match_id][bet.player] = bet.pick;
  }

  const pairs = [];

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i].name;
      const b = players[j].name;
      let compared = 0;
      let matched = 0;

      for (const picks of Object.values(byMatch)) {
        if (!picks[a] || !picks[b]) continue;
        compared++;
        if (picks[a] === picks[b]) matched++;
      }

      if (compared === 0) continue;

      pairs.push({
        a,
        b,
        matched,
        compared,
        pct: Math.round((matched / compared) * 100),
      });
    }
  }

  return pairs.sort((x, y) => y.pct - x.pct || y.compared - x.compared);
}

function parseSheetDateValue(value) {
  if (value == null || value === "") return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const googleDate = raw.match(/^Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+)(?:,(\d+))?)?\)$/);
  if (googleDate) {
    return new Date(
      Number(googleDate[1]),
      Number(googleDate[2]),
      Number(googleDate[3]),
      Number(googleDate[4] || 0),
      Number(googleDate[5] || 0),
      Number(googleDate[6] || 0)
    );
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function wallClockInTimeZoneToDate({ year, month, day, hour, minute }, timeZone) {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const desired = { year, month, day, hour, minute };

  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = formatter.formatToParts(new Date(utcMs));
    const actual = {};
    for (const part of parts) {
      if (part.type !== "literal") actual[part.type] = Number(part.value);
    }
    if (
      actual.year === desired.year &&
      actual.month === desired.month &&
      actual.day === desired.day &&
      actual.hour === desired.hour &&
      actual.minute === desired.minute
    ) {
      return new Date(utcMs);
    }

    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute
    );
    const desiredAsUtc = Date.UTC(
      desired.year,
      desired.month - 1,
      desired.day,
      desired.hour,
      desired.minute
    );
    utcMs += desiredAsUtc - actualAsUtc;
  }

  return new Date(utcMs);
}

function parseGoogleDateParts(value) {
  const match = String(value).trim().match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]) + 1,
    day: Number(match[3]),
  };
}

function parseMatchKickoff(value) {
  if (value == null || value === "") return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const isEastern = /\sET$/i.test(raw);
  const cleaned = raw.replace(/\s+ET$/i, "").trim();

  const googleWithTime = cleaned.match(/^Date\((\d+),(\d+),(\d+)\)\s+(\d{1,2}):(\d{2})$/);
  if (googleWithTime) {
    return wallClockInTimeZoneToDate(
      {
        year: Number(googleWithTime[1]),
        month: Number(googleWithTime[2]) + 1,
        day: Number(googleWithTime[3]),
        hour: Number(googleWithTime[4]),
        minute: Number(googleWithTime[5]),
      },
      "America/New_York"
    );
  }

  const googleDateOnly = parseGoogleDateParts(cleaned);
  if (googleDateOnly) {
    return wallClockInTimeZoneToDate(
      { ...googleDateOnly, hour: 0, minute: 0 },
      "America/New_York"
    );
  }

  const fromSheet = parseSheetDateValue(raw);
  if (fromSheet && !/\d{1,2}:\d{2}/.test(raw)) return fromSheet;

  const wall = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (wall) {
    const parts = {
      year: Number(wall[1]),
      month: Number(wall[2]),
      day: Number(wall[3]),
      hour: Number(wall[4] ?? 0),
      minute: Number(wall[5] ?? 0),
    };
    const timeZone = isEastern || wall[4] != null ? "America/New_York" : "UTC";
    return wallClockInTimeZoneToDate(parts, timeZone);
  }

  if (fromSheet) return fromSheet;

  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getUpcomingMatches(matches, limit = 4, now = new Date()) {
  const nowMs = now.getTime();
  const pending = matches
    .filter((m) => !m.result)
    .map((m) => ({
      ...m,
      kickoffAt: parseMatchKickoff(m.kickoff) || parseMatchKickoff(m.date),
    }))
    .sort((a, b) => {
      if (a.kickoffAt && b.kickoffAt) return a.kickoffAt - b.kickoffAt;
      if (a.kickoffAt) return -1;
      if (b.kickoffAt) return 1;
      return String(a.id).localeCompare(String(b.id));
    });

  const future = pending.filter((m) => !m.kickoffAt || m.kickoffAt.getTime() >= nowMs);
  const pool = future.length ? future : pending;

  return pool.slice(0, limit).map((m) => ({
    id: m.id,
    group: m.group,
    label: matchLabel(m),
    kickoff: m.kickoff,
    kickoffAt: m.kickoffAt,
  }));
}

function buildMatchResultsComparison(matches, bets, players) {
  const finished = matches
    .map((m) => ({
      ...m,
      kickoffAt: parseMatchKickoff(m.kickoff) || parseMatchKickoff(m.date),
    }))
    .filter((m) => m.result)
    .sort((a, b) => {
      if (a.kickoffAt && b.kickoffAt) return b.kickoffAt - a.kickoffAt;
      if (a.kickoffAt) return -1;
      if (b.kickoffAt) return 1;
      return String(b.id).localeCompare(String(a.id));
    });

  const betsByMatch = {};
  for (const bet of bets) {
    if (!betsByMatch[bet.match_id]) betsByMatch[bet.match_id] = {};
    betsByMatch[bet.match_id][bet.player] = bet.pick;
  }

  return finished.map((match) => ({
    id: match.id,
    group: match.group,
    label: matchLabel(match),
    kickoff: match.kickoff,
    result: match.result,
    resultLabel: pickDisplayName(match.result, match),
    picks: players
      .map((player) => {
        const pick = betsByMatch[match.id]?.[player.name];
        if (!pick) return null;
        return {
          player: player.name,
          emoji: player.emoji,
          pick,
          pickLabel: pickDisplayName(pick, match),
          points: scorePick(pick, match.result),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.points - a.points || a.player.localeCompare(b.player)),
  }));
}

function parseMetaUpdated(rows) {
  if (!rows?.length) return null;

  const objs = rowsToObjects(rows);
  const row = objs.find((entry) => {
    const key = String(entry.key || "").trim().toLowerCase();
    return key === "last_updated" || key === "sheet_updated";
  });
  if (row?.value) return String(row.value).trim();

  if (rows.length >= 2 && String(rows[1][0] || "").trim().toLowerCase() === "last_updated") {
    return String(rows[1][1] || "").trim() || null;
  }

  return null;
}

function computeBookmakerComparison(players, matches, bets) {
  const withBookmaker = bookmakerMatchPool(matches)
    .map((match) => ({
      ...match,
      bookmakerPick: matchBookmakerPick(match),
    }))
    .filter((match) => match.bookmakerPick);
  if (!withBookmaker.length) {
    return { rows: [], comparedMatches: 0 };
  }

  const betsByPlayer = {};
  for (const bet of bets) {
    if (!betsByPlayer[bet.player]) betsByPlayer[bet.player] = {};
    betsByPlayer[bet.player][bet.match_id] = bet.pick;
  }

  const rows = players.map((player) => {
    let matched = 0;
    let compared = 0;

    for (const match of withBookmaker) {
      const pick = betsByPlayer[player.name]?.[match.id];
      if (!pick) continue;
      compared++;
      if (pick === match.bookmakerPick) matched++;
    }

    return {
      name: player.name,
      emoji: player.emoji,
      color: player.color,
      matched,
      compared,
      pct: compared ? Math.round((matched / compared) * 100) : null,
    };
  });

  rows.sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1) || b.compared - a.compared);

  return {
    rows: rows.filter((row) => row.compared > 0),
    comparedMatches: withBookmaker.length,
  };
}

function resolveBookmakerPick(raw, match, fallbackPick) {
  const fromSheet = normalizePick(raw, match);
  if (fromSheet) return fromSheet;
  if (!fallbackPick) return null;
  return normalizePick(fallbackPick, match);
}

function pickDisplayName(pick, match) {
  if (!pick || !match) return "";
  if (pick === "draw") return "Draw";
  if (teamMatches(pick, match.home)) return match.home;
  if (teamMatches(pick, match.away)) return match.away;
  if (normalizeTeam(pick) === "home") return match.home;
  if (normalizeTeam(pick) === "away") return match.away;
  return pick;
}

const BOOKMAKER_TIER1 = new Set([
  "Brazil", "Argentina", "France", "Germany", "Spain", "England", "Portugal",
  "Netherlands", "Belgium", "USA", "Mexico", "Croatia", "Uruguay", "Colombia",
]);

const BOOKMAKER_TIER2 = new Set([
  "Japan", "Korea Republic", "Morocco", "Switzerland", "Austria", "Senegal",
  "Ecuador", "Canada", "Paraguay", "Czechia", "Norway", "Sweden", "Australia",
  "Türkiye", "IR Iran", "Egypt", "Scotland", "Ghana", "Tunisia", "Algeria",
  "Saudi Arabia", "Qatar", "Uzbekistan", "Jordan", "Iraq", "Panama", "Haiti",
  "Curaçao", "Cabo Verde", "Côte d'Ivoire", "Congo DR", "New Zealand",
  "South Africa", "Bosnia and Herzegovina",
]);

function teamStrength(name) {
  if (BOOKMAKER_TIER1.has(name)) return 3;
  if (BOOKMAKER_TIER2.has(name)) return 2;
  return 1;
}

function computeBookmakerFavorite(home, away) {
  const homeStrength = teamStrength(home);
  const awayStrength = teamStrength(away);
  if (homeStrength > awayStrength) return home;
  if (awayStrength > homeStrength) return away;
  return home;
}

function inferMatchStage(match) {
  const group = String(match.group || "").trim();
  if (group) return group;
  const id = String(match.id || "");
  const stage = id.match(/^(R32|R16|QF|SF|3P|F)-\d+/);
  return stage ? stage[1] : "";
}

function resolveMatchBookmakerPick(match, rawBookmaker, fallbackPick) {
  const fromSheet = resolveBookmakerPick(rawBookmaker, match);
  if (fromSheet) return fromSheet;

  const fromFallback = fallbackPick ? normalizePick(fallbackPick, match) : null;
  if (fromFallback) return fromFallback;

  if (match.teamsPending || match.home === "Home" || match.away === "Away") return null;
  return normalizePick(computeBookmakerFavorite(match.home, match.away), match);
}

function matchBookmakerPick(match) {
  return match.bookmakerPick || resolveMatchBookmakerPick(match, null, null);
}

function isGroupStageMatch(match) {
  return /^M\d+/i.test(String(match.id || ""));
}

function bookmakerMatchPool(matches) {
  return matches.filter((match) => {
    if (match.teamsPending) return false;
    const stage = inferMatchStage(match);
    if (isGroupStageMatch(match)) return true;
    return stage === "R32" || stage === "R16";
  });
}

function americanToDecimal(american) {
  const value = Number(american);
  if (value > 0) return 1 + value / 100;
  return 1 + 100 / Math.abs(value);
}

function strengthGap(home, away) {
  return Math.abs(teamStrength(home) - teamStrength(away));
}

function isKnockoutStageMatch(match) {
  const stage = inferMatchStage(match);
  return ["R32", "R16", "QF", "SF", "3P", "F"].includes(stage);
}

function decimalOddsForPick(pick, match) {
  const gap = strengthGap(match.home, match.away);
  if (pick === "draw") return americanToDecimal(260);

  const favorite = computeBookmakerFavorite(match.home, match.away);
  const isFavorite = teamMatches(pick, favorite);

  if (isKnockoutStageMatch(match)) {
    const favoriteAmerican = gap >= 2 ? -220 : gap >= 1 ? -165 : -130;
    const underdogAmerican = gap >= 2 ? 180 : gap >= 1 ? 145 : 110;
    return americanToDecimal(isFavorite ? favoriteAmerican : underdogAmerican);
  }

  const favoriteAmerican = gap >= 2 ? -180 : gap >= 1 ? -140 : -115;
  const underdogAmerican = gap >= 2 ? 320 : gap >= 1 ? 260 : 220;
  return americanToDecimal(isFavorite ? favoriteAmerican : underdogAmerican);
}

function computeBookmakerBettingPnL(players, matches, bets, stake = 1) {
  const poolIds = new Set(bookmakerMatchPool(matches).map((match) => match.id));
  const matchById = Object.fromEntries(matches.map((match) => [match.id, match]));
  const stats = Object.fromEntries(
    players.map((player) => [
      player.name,
      { net: 0, wins: 0, losses: 0, settled: 0, pending: 0 },
    ])
  );

  for (const bet of bets) {
    if (!poolIds.has(bet.match_id)) continue;
    if (!stats[bet.player]) continue;

    const match = matchById[bet.match_id];
    if (!match) continue;

    if (!match.result) {
      stats[bet.player].pending++;
      continue;
    }

    const decimal = decimalOddsForPick(bet.pick, match);
    stats[bet.player].settled++;
    if (isCorrectPick(bet.pick, match.result)) {
      stats[bet.player].net += stake * (decimal - 1);
      stats[bet.player].wins++;
    } else {
      stats[bet.player].net -= stake;
      stats[bet.player].losses++;
    }
  }

  const rows = players
    .map((player) => {
      const row = stats[player.name];
      const active = row.settled + row.pending;
      if (!active) return null;
      return {
        name: player.name,
        emoji: player.emoji,
        color: player.color,
        net: Math.round(row.net * 10) / 10,
        wins: row.wins,
        losses: row.losses,
        settled: row.settled,
        pending: row.pending,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) => b.net - a.net || b.settled - a.settled || a.name.localeCompare(b.name)
    );

  return { rows, stake };
}

function buildBookmakerPredictions(matches) {
  return bookmakerMatchPool(matches)
    .map((m) => {
      const pick = matchBookmakerPick(m);
      if (!pick) return null;
      return {
        id: m.id,
        group: inferMatchStage(m) || m.group,
        label: matchLabel(m),
        pick: pickDisplayName(pick, m),
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      String(a.id).localeCompare(String(b.id), undefined, { numeric: true })
    );
}

const KNOCKOUT_BRACKET = {
  "R16-01": ["R32-01", "R32-04"],
  "R16-02": ["R32-03", "R32-06"],
  "R16-03": ["R32-02", "R32-05"],
  "R16-04": ["R32-07", "R32-08"],
  "R16-05": ["R32-11", "R32-12"],
  "R16-06": ["R32-10", "R32-09"],
  "R16-07": ["R32-15", "R32-14"],
  "R16-08": ["R32-16", "R32-13"],
  "QF-01": ["R16-01", "R16-02"],
  "QF-02": ["R16-05", "R16-06"],
  "QF-03": ["R16-04", "R16-03"],
  "QF-04": ["R16-07", "R16-08"],
  "SF-01": ["QF-01", "QF-02"],
  "SF-02": ["QF-03", "QF-04"],
  "F-01": ["SF-01", "SF-02"],
};

const KNOCKOUT_SIM_ORDER = [
  ...Array.from({ length: 16 }, (_, index) => `R32-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 8 }, (_, index) => `R16-${String(index + 1).padStart(2, "0")}`),
  "QF-01",
  "QF-02",
  "QF-03",
  "QF-04",
  "SF-01",
  "SF-02",
  "F-01",
];

function resolvePickWinnerTeam(pick, home, away) {
  if (!pick || pick === "draw") return null;
  if (teamMatches(pick, home)) return home;
  if (teamMatches(pick, away)) return away;
  const lower = normalizeTeam(pick);
  if (lower === "home") return home;
  if (lower === "away") return away;
  return null;
}

function resultToWinnerTeam(match) {
  if (!match?.result || match.result === "draw") return null;
  return pickDisplayName(match.result, match);
}

function resolveBracketMatchWinner(match, pick) {
  const fromPick = pick ? resolvePickWinnerTeam(pick, match.home, match.away) : null;
  if (fromPick) return { winner: fromPick, fromPick: true };

  const fromResult = resultToWinnerTeam(match);
  if (fromResult) return { winner: fromResult, fromPick: false };

  const favorite = matchBookmakerPick(match);
  const fromFavorite = favorite
    ? resolvePickWinnerTeam(favorite, match.home, match.away) ||
      pickDisplayName(favorite, match)
    : null;
  if (fromFavorite) return { winner: fromFavorite, fromPick: false };

  return { winner: null, fromPick: false };
}

function simulateCupWinnerForPlayer(playerName, matches, betsByPlayer) {
  const matchById = Object.fromEntries(matches.map((match) => [match.id, match]));
  const winners = {};
  let gaps = 0;

  for (const matchId of KNOCKOUT_SIM_ORDER) {
    const feeders = KNOCKOUT_BRACKET[matchId];
    let home;
    let away;

    if (feeders) {
      home = winners[feeders[0]];
      away = winners[feeders[1]];
      if (!home || !away) {
        return { champion: null, complete: false, gaps };
      }
    } else {
      const base = matchById[matchId];
      if (!base || base.teamsPending) {
        return { champion: null, complete: false, gaps };
      }
      home = base.home;
      away = base.away;
    }

    const base = matchById[matchId] || {};
    const match = normalizeMatch({
      id: matchId,
      group: inferMatchStage({ id: matchId, group: base.group }),
      home,
      away,
      result: base.result,
      bookmakerPick: base.bookmakerPick,
    });

    const pick = betsByPlayer[playerName]?.[matchId];
    const { winner, fromPick } = resolveBracketMatchWinner(match, pick);
    if (!winner) {
      return { champion: null, complete: false, gaps };
    }
    if (!fromPick) gaps++;
    winners[matchId] = pickDisplayName(winner, match) || winner;
  }

  return { champion: winners["F-01"], complete: true, gaps };
}

function computeCupWinnerPredictions(players, matches, bets) {
  const betsByPlayer = {};
  for (const bet of bets) {
    if (!betsByPlayer[bet.player]) betsByPlayer[bet.player] = {};
    betsByPlayer[bet.player][bet.match_id] = bet.pick;
  }

  const rows = players
    .map((player) => {
      const sim = simulateCupWinnerForPlayer(player.name, matches, betsByPlayer);
      return {
        name: player.name,
        emoji: player.emoji,
        color: player.color,
        champion: sim.champion,
        complete: sim.complete,
        gaps: sim.gaps,
      };
    })
    .sort((a, b) => {
      const champA = a.champion || "";
      const champB = b.champion || "";
      if (champA !== champB) return champA.localeCompare(champB);
      return a.name.localeCompare(b.name);
    });

  return { rows };
}

function buildScoreData(config, players, matches, bets, sheetUpdatedAt = null) {
  const leaderboards = buildLeaderboards(config, players, matches, bets);
  const scored = leaderboards[0]?.players ?? computeScores(players, matches, bets);
  const finished = matches.filter((m) => m.result).length;

  return {
    title: config.title,
    subtitle: config.subtitle,
    finishedCount: finished,
    matchCount: matches.length,
    sheetUpdatedAt,
    updated:
      finished === 0
        ? "No results yet"
        : `${finished} of ${matches.length} matches scored`,
    players: scored,
    leaderboards,
    agreements: computeBetAgreement(players, bets),
    bookmaker: computeBookmakerComparison(players, matches, bets),
    bookmakerPredictions: buildBookmakerPredictions(matches),
    pickAccuracy: computePickAccuracy(players, matches, bets),
    bookmakerBetting: computeBookmakerBettingPnL(
      players,
      matches,
      bets,
      config.bookmakerBetStake ?? 1
    ),
    cupWinners: computeCupWinnerPredictions(players, matches, bets),
    upcomingMatches: getUpcomingMatches(matches, 4),
    matchResults: buildMatchResultsComparison(matches, bets, players),
  };
}

const WCLogic = {
  rowsToObjects,
  normalizeTeam,
  isTbdSide,
  normalizeMatch,
  isDrawValue,
  teamMatches,
  normalizePick,
  normalizeResult,
  matchLabel,
  resolveMatchColumn,
  scorePick,
  isCorrectPick,
  computePickAccuracy,
  parseBetsTall,
  parseBetsWide,
  parseBets,
  indexBetsByPlayer,
  countBetsInSet,
  buildMissingMatchesList,
  computeScores,
  computeScoresForMatchIds,
  buildLeaderboards,
  computeBetAgreement,
  computeBookmakerComparison,
  buildBookmakerPredictions,
  resolveBookmakerPick,
  resolveMatchBookmakerPick,
  matchBookmakerPick,
  bookmakerMatchPool,
  isGroupStageMatch,
  americanToDecimal,
  decimalOddsForPick,
  computeBookmakerBettingPnL,
  computeCupWinnerPredictions,
  simulateCupWinnerForPlayer,
  resolvePickWinnerTeam,
  KNOCKOUT_BRACKET,
  isKnockoutStageMatch,
  computeBookmakerFavorite,
  inferMatchStage,
  pickDisplayName,
  parseMetaUpdated,
  parseSheetDateValue,
  parseMatchKickoff,
  getUpcomingMatches,
  buildMatchResultsComparison,
  buildScoreData,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = WCLogic;
}

if (typeof window !== "undefined") {
  window.WCLogic = WCLogic;
}
})();
