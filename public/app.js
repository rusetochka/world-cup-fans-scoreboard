const {
  buildScoreData,
} = WCLogic;

const { t, localizeConfig, localizePlayerName, formatStatus, formatSheetDate, formatMatchKickoff, applyStaticUI, setLocale, getLocale } = WCI18n;

let loadGeneration = 0;
let lastScoreData = null;
let openMissingBets = null;

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function renderAgreements(agreements) {
  if (!agreements.length) {
    return `
      <section class="agreement" aria-label="${t("matchingBets")}">
        <h2 class="agreement-title">${t("whoThinksAlike")}</h2>
        <p class="agreement-empty">${t("agreementEmpty")}</p>
      </section>
    `;
  }

  const items = agreements
    .map(
      (row) => `
        <li class="agreement-row">
          <span class="agreement-pair">${localizePlayerName(row.a)} & ${localizePlayerName(row.b)}</span>
          <span class="agreement-pct">${row.pct}%</span>
          <span class="agreement-meta">${row.matched}/${row.compared}</span>
        </li>
      `
    )
    .join("");

  return `
    <section class="agreement" aria-label="${t("matchingBets")}">
      <h2 class="agreement-title">${t("whoThinksAlike")}</h2>
      <p class="agreement-hint">${t("agreementHint")}</p>
      <ul class="agreement-list">${items}</ul>
    </section>
  `;
}

function formatBookmakerPick(pick) {
  if (pick === "Draw") return t("drawPick");
  return pick;
}

function formatMatchPoints(points) {
  if (!points) return "0";
  return t("matchPoints", { count: points });
}

function renderMatchResults(matchResults) {
  if (!matchResults?.length) {
    return `
      <section class="agreement match-results" aria-label="${t("matchResultsTitle")}">
        <h2 class="agreement-title">${t("matchResultsTitle")}</h2>
        <p class="agreement-empty">${t("matchResultsEmpty")}</p>
      </section>
    `;
  }

  const blocks = matchResults
    .map((match) => {
      const picks = match.picks
        .map(
          (row) => `
            <li class="recent-pick-row is-scored-${row.points}">
              <span class="recent-player">${row.emoji} ${localizePlayerName(row.player)}</span>
              <span class="recent-pick">${formatBookmakerPick(row.pickLabel)}</span>
              <span class="recent-points">${formatMatchPoints(row.points)}</span>
            </li>
          `
        )
        .join("");

      return `
        <details class="recent-match-details">
          <summary class="recent-match-summary">
            <span class="recent-group">${match.group}</span>
            <span class="recent-match-label">${match.label}</span>
            <span class="recent-result">
              <span class="recent-result-key">${t("matchResultLabel")}</span>
              ${formatBookmakerPick(match.resultLabel)}
            </span>
          </summary>
          <div class="recent-match-body">
            ${match.kickoff ? `<p class="recent-match-time">${formatMatchKickoff(match.kickoff)}</p>` : ""}
            ${picks ? `<ul class="recent-picks">${picks}</ul>` : ""}
          </div>
        </details>
      `;
    })
    .join("");

  return `
    <section class="agreement match-results" aria-label="${t("matchResultsTitle")}">
      <h2 class="agreement-title">${t("matchResultsTitle")}</h2>
      <p class="agreement-hint">${t("matchResultsHint")} · ${t("matchResultsCount", { count: matchResults.length })}</p>
      <div class="recent-results-list">${blocks}</div>
    </section>
  `;
}

function renderBookmakerPredictions(predictions) {
  if (!predictions?.length) {
    return `
      <section class="agreement bookmaker-picks" aria-label="${t("bookmakerPicksTitle")}">
        <h2 class="agreement-title">${t("bookmakerPicksTitle")}</h2>
        <p class="agreement-empty">${t("bookmakerEmpty")}</p>
      </section>
    `;
  }

  const items = predictions
    .map(
      (row) => `
        <li class="bm-row">
          <span class="bm-group">${row.group}</span>
          <span class="bm-match">${row.label}</span>
          <span class="bm-pick">${formatBookmakerPick(row.pick)}</span>
        </li>
      `
    )
    .join("");

  return `
    <section class="agreement bookmaker-picks" aria-label="${t("bookmakerPicksTitle")}">
      <details class="bm-details">
        <summary class="bm-summary">
          <span class="agreement-title">${t("bookmakerPicksTitle")}</span>
          <span class="bm-count">${t("bookmakerPicksCount", { count: predictions.length })}</span>
        </summary>
        <p class="agreement-hint">${t("bookmakerPicksHint")}</p>
        <ul class="bm-list">${items}</ul>
      </details>
    </section>
  `;
}

function renderUpcomingMatches(upcoming) {
  if (!upcoming?.length) {
    return `
      <section class="agreement upcoming-matches" aria-label="${t("upcomingMatches")}">
        <h2 class="agreement-title">${t("upcomingMatches")}</h2>
        <p class="agreement-empty">${t("upcomingEmpty")}</p>
      </section>
    `;
  }

  const items = upcoming
    .map(
      (row) => `
        <li class="upcoming-row">
          <span class="upcoming-group">${row.group}</span>
          <span class="upcoming-match">${row.label}</span>
          <span class="upcoming-time">${formatMatchKickoff(row.kickoff)}</span>
        </li>
      `
    )
    .join("");

  return `
    <section class="agreement upcoming-matches" aria-label="${t("upcomingMatches")}">
      <h2 class="agreement-title">${t("upcomingMatches")}</h2>
      <ul class="upcoming-list">${items}</ul>
    </section>
  `;
}

function renderBookmaker(bookmaker) {
  if (!bookmaker?.rows?.length) {
    return `
      <section class="agreement bookmaker" aria-label="${t("bookmakerBets")}">
        <h2 class="agreement-title">${t("vsBookmakers")}</h2>
        <p class="agreement-empty">${t("bookmakerEmpty")}</p>
      </section>
    `;
  }

  const items = bookmaker.rows
    .map(
      (row) => `
        <li class="agreement-row">
          <span class="agreement-pair">${row.emoji} ${localizePlayerName(row.name)}</span>
          <span class="agreement-pct">${row.pct}%</span>
          <span class="agreement-meta">${row.matched}/${row.compared}</span>
        </li>
      `
    )
    .join("");

  return `
    <section class="agreement bookmaker" aria-label="${t("bookmakerBets")}">
      <h2 class="agreement-title">${t("vsBookmakers")}</h2>
      <p class="agreement-hint">${t("bookmakerHint")}</p>
      <ul class="agreement-list">${items}</ul>
    </section>
  `;
}

function formatBookmakerPnL(value) {
  const rounded = Math.round(Number(value) * 10) / 10;
  if (rounded > 0) return `+${rounded}`;
  if (rounded < 0) return String(rounded);
  return "0";
}

function renderPickAccuracy(pickAccuracy) {
  if (!pickAccuracy?.rows?.length) {
    return `
      <section class="agreement pick-accuracy" aria-label="${t("pickAccuracyTitle")}">
        <h2 class="agreement-title">${t("pickAccuracyTitle")}</h2>
        <p class="agreement-empty">${t("pickAccuracyEmpty")}</p>
      </section>
    `;
  }

  const items = pickAccuracy.rows
    .map(
      (row) => `
        <li class="agreement-row">
          <span class="agreement-pair">${row.emoji} ${localizePlayerName(row.name)}</span>
          <span class="agreement-pct">${row.pct}%</span>
          <span class="agreement-meta">${row.correct}/${row.scored}</span>
        </li>
      `
    )
    .join("");

  return `
    <section class="agreement pick-accuracy" aria-label="${t("pickAccuracyTitle")}">
      <h2 class="agreement-title">${t("pickAccuracyTitle")}</h2>
      <p class="agreement-hint">${t("pickAccuracyHint")}</p>
      <ul class="agreement-list">${items}</ul>
    </section>
  `;
}

function renderBookmakerBetting(bookmakerBetting) {
  if (!bookmakerBetting?.rows?.length) {
    return `
      <section class="agreement bookmaker-betting" aria-label="${t("bookmakerBettingTitle")}">
        <h2 class="agreement-title">${t("bookmakerBettingTitle")}</h2>
        <p class="agreement-empty">${t("bookmakerBettingEmpty")}</p>
      </section>
    `;
  }

  const stake = bookmakerBetting.stake ?? 1;
  const items = bookmakerBetting.rows
    .map((row) => {
      const pnlClass =
        row.net > 0 ? "pnl-positive" : row.net < 0 ? "pnl-negative" : "pnl-zero";
      return `
        <li class="agreement-row">
          <span class="agreement-pair">${row.emoji} ${localizePlayerName(row.name)}</span>
          <span class="agreement-pct ${pnlClass}">${formatBookmakerPnL(row.net)}</span>
          <span class="agreement-meta">${t("bookmakerBettingMeta", {
            wins: row.wins,
            losses: row.losses,
            pending: row.pending,
          })}</span>
        </li>
      `;
    })
    .join("");

  return `
    <section class="agreement bookmaker-betting" aria-label="${t("bookmakerBettingTitle")}">
      <h2 class="agreement-title">${t("bookmakerBettingTitle")}</h2>
      <p class="agreement-hint">${t("bookmakerBettingHint", { stake })}</p>
      <ul class="agreement-list">${items}</ul>
    </section>
  `;
}

function renderCupWinners(cupWinners) {
  if (!cupWinners?.rows?.length) {
    return `
      <section class="agreement cup-winners" aria-label="${t("cupWinnerTitle")}">
        <h2 class="agreement-title">${t("cupWinnerTitle")}</h2>
        <p class="agreement-empty">${t("cupWinnerEmpty")}</p>
      </section>
    `;
  }

  const items = cupWinners.rows
    .map((row) => {
      const champion = row.complete
        ? row.champion || t("cupWinnerIncomplete")
        : t("cupWinnerIncomplete");
      const meta = row.complete && row.gaps
        ? t("cupWinnerGaps", { count: row.gaps })
        : row.complete
          ? ""
          : "";
      return `
        <li class="agreement-row">
          <span class="agreement-pair">${row.emoji} ${localizePlayerName(row.name)}</span>
          <span class="cup-champion">${champion}</span>
          ${meta ? `<span class="agreement-meta">${meta}</span>` : "<span class=\"agreement-meta\"></span>"}
        </li>
      `;
    })
    .join("");

  return `
    <section class="agreement cup-winners" aria-label="${t("cupWinnerTitle")}">
      <h2 class="agreement-title">${t("cupWinnerTitle")}</h2>
      <p class="agreement-hint">${t("cupWinnerHint")}</p>
      <ul class="agreement-list cup-winner-list">${items}</ul>
    </section>
  `;
}

function renderMissingBetsPanel(player) {
  if (!player?.missingMatches?.length) return "";

  const items = player.missingMatches
    .map(
      (match) => `
        <li class="missing-bet-row">
          <span class="missing-bet-group">${match.group}</span>
          <span class="missing-bet-label">${match.label}</span>
          ${match.kickoff ? `<span class="missing-bet-time">${formatMatchKickoff(match.kickoff)}</span>` : ""}
        </li>
      `
    )
    .join("");

  return `
    <div class="missing-bets-panel" role="region" aria-label="${t("missingPicksTitle", { name: localizePlayerName(player.name) })}">
      <p class="missing-bets-title">${t("missingPicksTitle", { name: localizePlayerName(player.name) })}</p>
      <ul class="missing-bets-list">${items}</ul>
    </div>
  `;
}

function renderPitch(players, { compact = false, showCoverage = false, boardIndex = 0 } = {}) {
  if (!players.length) return "";

  const maxPoints = Math.max(...players.map((p) => p.points), 1);
  const leaderPoints = Math.max(...players.map((p) => p.points));
  const horizontal = players.length > 4;

  const rows = players
    .map((player) => {
      const pct = (player.points / maxPoints) * 100;
      const isLeader = player.points === leaderPoints && leaderPoints > 0;
      const partial = showCoverage && player.isPartialCoverage;
      const isSelected =
        partial &&
        openMissingBets?.boardIndex === boardIndex &&
        openMissingBets?.playerName === player.name;
      const coverageTitle = partial
        ? t("leaderboardCoverage", {
            picked: player.betCount,
            total: player.boardMatchCount,
          })
        : localizePlayerName(player.name);
      const rowClass = `${isLeader ? " is-leader" : ""}${partial ? " is-partial-coverage is-clickable" : ""}${isSelected ? " is-selected" : ""}`;
      const coverageBadge = partial
        ? `<span class="coverage-badge" title="${coverageTitle}">${player.betCount}/${player.boardMatchCount}</span>`
        : "";
      const clickAttrs = partial
        ? ` role="button" tabindex="0" data-board-index="${boardIndex}" data-player-name="${escapeAttr(player.name)}" aria-expanded="${isSelected ? "true" : "false"}" aria-label="${escapeAttr(`${coverageTitle}. ${t("missingPicksTap")}`)}"`
        : "";

      if (horizontal) {
        return `
          <div class="player-row${rowClass}"${clickAttrs}>
            <div class="player-row-head">
              <div class="character-wrap">
                ${isLeader ? '<span class="crown" aria-hidden="true">👑</span>' : ""}
                <div class="character" style="background:${player.color}" title="${coverageTitle}">
                  ${player.emoji}
                </div>
              </div>
              <div class="player-row-meta">
                <span class="name">${localizePlayerName(player.name)}</span>
                ${coverageBadge}
              </div>
            </div>
            <div class="bar-area-h">
              <div class="bar-track-h" aria-hidden="true">
                <div class="bar-fill-h" style="width:${pct}%; background:${player.color}"></div>
              </div>
              <span class="points-h">${player.points}</span>
            </div>
          </div>
        `;
      }

      return `
        <div class="player-col${rowClass}"${clickAttrs}>
          <div class="character-wrap">
            ${isLeader ? '<span class="crown" aria-hidden="true">👑</span>' : ""}
            <div class="character" style="background:${player.color}" title="${coverageTitle}">
              ${player.emoji}
            </div>
          </div>
          <div class="bar-area">
            <div class="bar-track" aria-hidden="true">
              <div class="bar-fill" style="height:${pct}%; background:${player.color}"></div>
            </div>
          </div>
          <span class="points">${player.points}</span>
          <span class="name">${localizePlayerName(player.name)}</span>
          ${coverageBadge}
        </div>
      `;
    })
    .join("");

  if (horizontal) {
    return `
      <section class="pitch is-horizontal${compact ? " is-compact" : ""}" aria-label="${t("scoreboard")}">
        <div class="chart-h">${rows}</div>
      </section>
    `;
  }

  return `
    <section class="pitch${compact ? " is-compact" : ""}" aria-label="${t("scoreboard")}">
      <div class="chart">${rows}</div>
    </section>
  `;
}

function formatPlayerList(names) {
  const localized = names.map(localizePlayerName);
  if (localized.length <= 1) return localized[0] || "";
  if (localized.length === 2) return t("playerPair", { a: localized[0], b: localized[1] });
  const last = localized[localized.length - 1];
  const rest = localized.slice(0, -1).join(", ");
  return t("playerList", { rest, last });
}

function leaderboardTitle(board) {
  if (board.kind === "full") return t("leaderboardFull");
  const names = board.focalPlayers?.length
    ? board.focalPlayers
    : [board.focalPlayer];
  if (names.length > 1) {
    return t("leaderboardVsMany", { names: formatPlayerList(names) });
  }
  return t("leaderboardVs", { name: localizePlayerName(names[0]) });
}

function renderLeaderboards(leaderboards) {
  if (!leaderboards?.length) return "";

  return leaderboards
    .map((board, index) => {
      const title = leaderboardTitle(board);
      const hint = t("leaderboardMatchCount", { count: board.matchCount });
      const showCoverage = board.kind === "partial";
      const hasPartial =
        showCoverage && board.players.some((player) => player.isPartialCoverage);
      const panelPlayer =
        openMissingBets?.boardIndex === index
          ? board.players.find(
              (player) =>
                player.name === openMissingBets.playerName && player.missingMatches?.length
            )
          : null;

      return `
        <section class="leaderboard-block" data-board-index="${index}">
          <div class="leaderboard-heading">
            <h2 class="leaderboard-title">${title}</h2>
            <p class="leaderboard-hint">${hint}</p>
            ${hasPartial ? `<p class="leaderboard-coverage-hint">${t("leaderboardPartialLegend")}</p>` : ""}
          </div>
          ${renderPitch(board.players, { compact: index > 0, showCoverage, boardIndex: index })}
          ${panelPlayer ? renderMissingBetsPanel(panelPlayer) : ""}
        </section>
      `;
    })
    .join("");
}

function renderFooter(data) {
  const finished = data.finishedCount ?? 0;
  const total = data.matchCount ?? 0;
  const pct = total ? Math.min(100, Math.round((finished / total) * 100)) : 0;

  const resultsLabel = document.getElementById("results-label");
  const resultsCount = document.getElementById("results-count");
  const resultsBarTrack = document.getElementById("results-bar-track");
  const resultsBarFill = document.getElementById("results-bar-fill");

  if (resultsLabel) resultsLabel.textContent = t("resultsLabel");
  if (resultsCount) resultsCount.textContent = total ? `${finished} / ${total}` : "—";
  if (resultsBarFill) {
    resultsBarFill.style.width = `${pct}%`;
    resultsBarFill.classList.toggle("is-complete", total > 0 && finished >= total);
  }
  if (resultsBarTrack) {
    resultsBarTrack.setAttribute("aria-valuenow", String(finished));
    resultsBarTrack.setAttribute("aria-valuemax", String(total));
    resultsBarTrack.setAttribute("aria-label", formatStatus(finished, total));
  }

  const sheetUpdated = document.getElementById("sheet-updated");
  if (sheetUpdated) {
    const formatted = formatSheetDate(data.sheetUpdatedAt, getLocale());
    if (formatted) {
      sheetUpdated.hidden = false;
      sheetUpdated.textContent = t("lastUpdated", { date: formatted });
    } else {
      sheetUpdated.hidden = true;
      sheetUpdated.textContent = "";
    }
  }
}

function bindMissingBetsHandlers() {
  document.querySelectorAll(".is-partial-coverage.is-clickable").forEach((el) => {
    const activate = () => {
      const boardIndex = Number(el.dataset.boardIndex);
      const playerName = el.dataset.playerName;
      if (
        openMissingBets?.boardIndex === boardIndex &&
        openMissingBets?.playerName === playerName
      ) {
        openMissingBets = null;
      } else {
        openMissingBets = { boardIndex, playerName };
      }
      render(lastScoreData);
    };

    el.addEventListener("click", activate);
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}

function render(data) {
  lastScoreData = data;
  const leaderboards =
    data.leaderboards?.length > 0
      ? data.leaderboards
      : [{ kind: "full", players: data.players, matchCount: data.matchCount }];

  if (openMissingBets) {
    const board = leaderboards[openMissingBets.boardIndex];
    const player = board?.players?.find((row) => row.name === openMissingBets.playerName);
    if (!player?.missingMatches?.length) openMissingBets = null;
  }

  document.getElementById("title").textContent = data.title;
  document.getElementById("subtitle").textContent = data.subtitle;
  renderFooter(data);

  if (!data.players.length) {
    document.getElementById("content").innerHTML =
      `<p class="error">${t("noPlayers")}</p>`;
    return;
  }

  document.getElementById("content").innerHTML = `
    ${renderLeaderboards(leaderboards)}
    ${renderAgreements(data.agreements || [])}
    ${renderBookmaker(data.bookmaker || {})}
    ${renderPickAccuracy(data.pickAccuracy || {})}
    ${renderBookmakerBetting(data.bookmakerBetting || {})}
    ${renderCupWinners(data.cupWinners || {})}
    ${renderBookmakerPredictions(data.bookmakerPredictions || [])}
    ${renderMatchResults(data.matchResults || [])}
    ${renderUpcomingMatches(data.upcomingMatches || [])}
  `;

  bindMissingBetsHandlers();
}

function showError() {
  document.getElementById("content").innerHTML = '<p class="error">The demo snapshot could not load. Please refresh this page.</p>';
}

async function loadFromSnapshot(config) {
  const data = await WCDemo.loadData();
  return buildScoreData(localizeConfig(config), data.players, data.matches, data.bets, data.sourceUpdatedAt);
}

async function init() {
  const generation = ++loadGeneration;
  applyStaticUI();

  const config = window.DEMO_CONFIG;


  document.getElementById("content").innerHTML = `<p class="loading">${t("loading")}</p>`;

  try {
    const data = await loadFromSnapshot(config);
    if (generation !== loadGeneration) return;
    openMissingBets = null;
    render(data);
  } catch (err) {
    if (generation !== loadGeneration) return;
    showError(err.message || t("errorLoadFailed"));
  }
}

document.getElementById("refresh-btn")?.addEventListener("click", init);
window.addEventListener("wc-demo-change", init);

init();
