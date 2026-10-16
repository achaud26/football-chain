(() => {
  const book = window.GOLF_STATS;
  const app = document.getElementById("app");
  const players = book.players;
  const categories = book.categories;
  const STROKE_CAP = 250;
  const OFFENSE_IDS = ["pass_yds", "pass_td", "int_thrown", "rush_yds", "rush_td", "rec", "rec_yds", "rec_td"];
  const DEFENSE_IDS = ["sacks", "int_caught"];
  const boards = categories.map((_, index) =>
    players
      .filter((player) => player.stats[index] > 0)
      .sort((a, b) => b.stats[index] - a.stats[index] || a.name.localeCompare(b.name))
      .map((player, place) => ({
        id: player.id,
        name: player.name,
        pos: player.pos,
        value: player.stats[index],
        rank: place + 1,
      }))
  );
  const atRank = boards.map((board) => new Map(board.map((row) => [row.rank, row])));
  const placeOf = boards.map((board) => new Map(board.map((row) => [row.id, row])));

  const state = {
    screen: "home",
    mode: "solo",
    names: ["You"],
    holesCount: 3,
    side: "both",
    holes: [],
    hole: 0,
    turn: 0,
    phase: "guess",
    shots: [],
    query: "",
    picks: [],
    active: 0,
    error: "",
  };

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatNum(value) {
    const rounded = Math.round(value * 10) / 10;
    const digits = Number.isInteger(rounded) ? 0 : 1;
    return rounded.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function statName(index) {
    return categories[index].label.replace(/^Career /, "");
  }

  function years(player) {
    if (!player.first) return player.pos;
    if (player.first === player.last) return player.pos + " · " + player.first;
    return player.pos + " · " + player.first + "–" + player.last;
  }

  function sideName(side) {
    if (side === "defense") return "Defense";
    if (side === "offense") return "Offense";
    return "Both sides";
  }

  function indexesFor(side) {
    const ids = side === "defense" ? DEFENSE_IDS : side === "offense" ? OFFENSE_IDS : categories.map((category) => category.id);
    return ids.map((id) => categories.findIndex((category) => category.id === id)).filter((index) => index >= 0);
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const swap = Math.floor(Math.random() * (i + 1));
      const hold = copy[i];
      copy[i] = copy[swap];
      copy[swap] = hold;
    }
    return copy;
  }

  function suggestions(query) {
    const key = norm(query);
    if (key.length < 2) return [];
    const starts = [];
    const contains = [];
    for (const player of players) {
      const name = norm(player.name);
      if (name.startsWith(key)) starts.push(player);
      else if (name.includes(key)) contains.push(player);
    }
    starts.sort((a, b) => a.name.localeCompare(b.name));
    contains.sort((a, b) => a.name.localeCompare(b.name));
    return starts.concat(contains).slice(0, 8);
  }

  function sameName(query) {
    const key = norm(query);
    return players.filter((player) => norm(player.name) === key);
  }

  function makeHoles() {
    const pool = indexesFor(state.side);
    const bag = [];
    while (bag.length < state.holesCount) bag.push(...shuffle(pool));
    const used = new Set();
    return bag.slice(0, state.holesCount).map((category) => {
      const depth = Math.min(boards[category].length, 120);
      let target = 1 + Math.floor(Math.random() * depth);
      let guard = 0;
      while (used.has(category + ":" + target) && guard < 30) {
        target = 1 + Math.floor(Math.random() * depth);
        guard += 1;
      }
      used.add(category + ":" + target);
      return { category, target };
    });
  }

  function freshCard() {
    state.shots = state.names.map(() => Array(state.holesCount).fill(null));
    state.hole = 0;
    state.turn = 0;
    state.phase = "guess";
    state.query = "";
    state.error = "";
  }

  function total(row) {
    return row.reduce((sum, shot) => sum + (shot ? shot.strokes : 0), 0);
  }

  function visibleShot(seat, index) {
    const shot = state.shots[seat][index];
    if (!shot) return null;
    if (state.phase === "guess" && index === state.hole) return null;
    return shot;
  }

  function sumRange(seat, from, to) {
    let sum = 0;
    let any = false;
    for (let index = from; index < to; index++) {
      const shot = visibleShot(seat, index);
      if (!shot) continue;
      sum += shot.strokes;
      any = true;
    }
    return any ? formatNum(sum) : "–";
  }

  function nav(page) {
    return (
      '<nav class="game-nav"><a href="index.html"' +
      (page === "chain" ? ' class="on"' : "") +
      '>Chain</a><a href="golf.html"' +
      (page === "golf" ? ' class="on"' : "") +
      ">Golf</a></nav>"
    );
  }

  function courseHtml(mode) {
    const played = mode === "shot";
    const shots = played
      ? state.names.map((name, seat) => ({ name, shot: state.shots[seat][state.hole] })).filter((item) => item.shot)
      : [];
    const ace = shots.some((item) => item.shot.strokes === 0);
    const balls = played
      ? shots
          .map((item, index) => {
            const wide = item.shot.capped;
            const land = wide ? 18 : item.shot.strokes === 0 ? 82 : Math.round(Math.max(18, 82 - (item.shot.strokes / STROKE_CAP) * 64));
            const mark = item.shot.strokes === 0 ? "1" : formatNum(item.shot.strokes);
            return (
              '<div class="gball ' + (wide ? "wide" : item.shot.strokes === 0 ? "ace" : "fair") + (index ? " lag" : "") + '" style="--land:' + land + '%"><b>' + mark + "</b></div>"
            );
          })
          .join("")
      : '<div class="gball"></div>';
    return (
      '<div class="course' + (played ? " played" : "") + (ace ? " hole-ace" : "") + '" aria-hidden="true">' +
      '<div class="sky"><i></i><i></i></div>' +
      '<div class="grass"></div>' +
      '<div class="fairway"></div>' +
      '<div class="bunker"></div>' +
      '<div class="green"><b></b></div>' +
      '<div class="flag"><i></i></div>' +
      '<div class="golfer"><span class="club"></span></div>' +
      balls +
      (ace ? '<p class="ace-banner">Hole in one</p>' : "") +
      "</div>"
    );
  }

  function cardHtml() {
    const count = state.holes.length || state.holesCount;
    const nines = count === 18;
    const keys = [];
    const labels = [];
    for (let index = 0; index < count; index++) {
      if (nines && index === 9) {
        labels.push("Out");
        keys.push("out");
      }
      labels.push(String(index + 1));
      keys.push(index);
    }
    if (nines) {
      labels.push("In");
      keys.push("in");
    }
    labels.push("Tot");
    keys.push("tot");
    const rows = state.names.map((name, seat) => {
      const cells = keys.map((key) => {
        if (key === "out") return '<td class="sub">' + sumRange(seat, 0, 9) + "</td>";
        if (key === "in") return '<td class="sub">' + sumRange(seat, 9, 18) + "</td>";
        if (key === "tot") return '<td class="tot">' + sumRange(seat, 0, count) + "</td>";
        const shot = state.shots[seat] && state.shots[seat][key];
        const shown = visibleShot(seat, key);
        const pending = shot && !shown;
        const current = state.phase !== "card" && key === state.hole;
        return "<td" + (current ? ' class="now"' : "") + ">" + (pending ? "✓" : shown ? formatNum(shown.strokes) : current ? "•" : "–") + "</td>";
      });
      return "<tr><th>" + esc(name) + "</th>" + cells.join("") + "</tr>";
    });
    return (
      '<div class="scorecard-wrap"><table class="scorecard' + (count > 6 ? " long" : "") + '"><thead><tr><th></th>' +
      labels.map((label) => "<th>" + label + "</th>").join("") +
      "</tr></thead><tbody>" +
      rows.join("") +
      "</tbody></table></div>"
    );
  }

  function choiceRow(id, label, options, current) {
    return (
      '<div class="field"><span>' + label + '</span><div class="choices" id="' + id + '">' +
      options
        .map(([value, text]) => '<button type="button" data-value="' + value + '"' + (String(value) === String(current) ? ' class="on"' : "") + ">" + text + "</button>")
        .join("") +
      "</div></div>"
    );
  }

  function showHome() {
    state.screen = "home";
    app.innerHTML =
      '<main class="home wrap">' +
      nav("golf") +
      "<h1>GOLF</h1>" +
      courseHtml("idle") +
      '<p class="lede">Play 3, 6, 9, or 18 holes, on offense, defense, or both. Each hole is an all-time rank, like No. 84 in passing yards. Name the closest player. Five spots away is 5 strokes. Miss by more than 250 and it counts as 250. Lowest total wins.</p>' +
      '<div class="mode-row">' +
      '<button class="btn primary" id="solo">Play a round</button>' +
      '<button class="btn" id="duel">Two players</button>' +
      "</div>" +
      '<section class="panel">' +
      '<ol class="steps">' +
      "<li><strong>01 · The tee</strong><p>Pick the round length and a side. Offense is passing, rushing, and receiving. Defense is sacks and interceptions.</p></li>" +
      "<li><strong>02 · The shot</strong><p>Name who you think is closest to that rank. The exact player is a hole in one.</p></li>" +
      "<li><strong>03 · The ball</strong><p>It flies toward the pin. Closer ranks land nearer the cup. Anything past 250 stops at 250.</p></li>" +
      "</ol>" +
      '<p class="fine">' +
      players.length +
      " players. " +
      esc(book.span) +
      " This is a fan game, not an official NFL product.</p>" +
      "</section></main>";
    document.getElementById("solo").onclick = () => showSetup("solo");
    document.getElementById("duel").onclick = () => showSetup("duel");
  }

  function showSetup(mode) {
    state.mode = mode;
    const duel = mode === "duel";
    app.innerHTML =
      '<main class="setup panel">' +
      nav("golf") +
      '<p class="eyebrow">' + (duel ? "Two players" : "Solo") + "</p>" +
      '<h2 class="display" style="font-size:64px">TEE OFF</h2>' +
      courseHtml("idle") +
      (duel
        ? '<div class="name-row">' +
          '<label class="field" style="flex:1"><span>Player 1</span><input id="n1" class="text-input" maxlength="18" value="' + esc(state.names[0] && state.names[0] !== "You" ? state.names[0] : "Player 1") + '"></label>' +
          '<label class="field" style="flex:1"><span>Player 2</span><input id="n2" class="text-input" maxlength="18" value="' + esc(state.names[1] || "Player 2") + '"></label></div>' +
          '<p class="hole-copy">You both play the same holes. Scores stay hidden until you have each taken the shot.</p>'
        : '<p class="hole-copy">Name the player at that rank. Zero strokes is a hole in one. A miss past 250 counts as 250.</p>') +
      choiceRow("round-length", "Holes", [[3, "3"], [6, "6"], [9, "9"], [18, "18"]], state.holesCount) +
      choiceRow("round-side", "Side", [["both", "Both"], ["offense", "Offense"], ["defense", "Defense"]], state.side) +
      '<p class="hole-copy">Offense is passing, rushing, and receiving. Defense is sacks and interceptions.</p>' +
      '<div class="setup-actions"><button class="btn ghost" id="back">Back</button><button class="btn primary" id="start">Start the round</button></div>' +
      "</main>";
    document.querySelectorAll(".choices").forEach((group) => {
      group.onclick = (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        group.querySelectorAll("button").forEach((item) => item.classList.toggle("on", item === button));
      };
    });
    document.getElementById("back").onclick = showHome;
    document.getElementById("start").onclick = () => {
      state.holesCount = Number(document.querySelector("#round-length button.on").dataset.value);
      state.side = document.querySelector("#round-side button.on").dataset.value;
      state.names = duel
        ? [document.getElementById("n1").value.trim() || "Player 1", document.getElementById("n2").value.trim() || "Player 2"]
        : ["You"];
      state.holes = makeHoles();
      freshCard();
      showHole();
    };
  }

  function currentHole() {
    return state.holes[state.hole];
  }

  function showHole() {
    const hole = currentHole();
    const guessing = state.phase === "guess";
    const seat = state.names.length === 1 ? 0 : state.turn;
    app.innerHTML =
      '<main class="home wrap">' +
      '<div class="topbar">' +
      nav("golf") +
      '<button class="btn ghost" id="menu">Menu</button>' +
      "</div>" +
      '<p class="eyebrow">Hole ' + (state.hole + 1) + " of " + state.holes.length + " · " + esc(sideName(state.side)) + (state.names.length > 1 && guessing ? " · " + esc(state.names[seat]) : "") + "</p>" +
      '<h2 class="display stat-title">' + esc(statName(hole.category)) + "</h2>" +
      '<p class="target-num">#' + hole.target + "</p>" +
      courseHtml(guessing ? "tee" : "shot") +
      '<p class="hole-copy">Name the player closest to No. ' + hole.target + " all time. The gap in ranks is your strokes, and 250 is the most a hole can cost.</p>" +
      (guessing
        ? '<form class="play-row" id="shot">' +
          '<div class="search"><input id="guess" autocomplete="off" placeholder="Player name" value="' + esc(state.query) + '">' +
          '<div class="suggestions" id="suggestions" hidden></div></div>' +
          '<button class="btn primary" type="submit">Take the shot</button></form>' +
          '<p class="miss" id="miss">' + esc(state.error) + "</p>"
        : revealHtml()) +
      '<section class="panel">' + cardHtml() + "</section>" +
      '<p class="fine">' + esc(book.span) + " No. 1 is the leader. Closest rank wins the hole.</p>" +
      "</main>";
    document.getElementById("menu").onclick = showHome;
    if (!guessing) {
      const next = document.getElementById("next");
      if (next) next.onclick = advance;
      return;
    }
    const input = document.getElementById("guess");
    const box = document.getElementById("suggestions");
    input.focus();
    const paint = () => {
      state.picks = suggestions(input.value);
      state.active = 0;
      if (!state.picks.length) {
        box.hidden = true;
        box.innerHTML = "";
        return;
      }
      box.hidden = false;
      box.innerHTML = state.picks
        .map(
          (player, index) =>
            '<button type="button" data-id="' + esc(player.id) + '"' + (index === 0 ? ' class="on"' : "") + ">" +
            esc(player.name) + "<small>" + esc(years(player)) + "</small></button>"
        )
        .join("");
    };
    input.oninput = () => {
      state.query = input.value;
      state.error = "";
      document.getElementById("miss").textContent = "";
      paint();
    };
    input.onkeydown = (event) => {
      if (box.hidden) return;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const dir = event.key === "ArrowDown" ? 1 : -1;
        state.active = (state.active + dir + state.picks.length) % state.picks.length;
        box.querySelectorAll("button").forEach((button, index) => button.classList.toggle("on", index === state.active));
      } else if (event.key === "Enter" && state.picks.length) {
        event.preventDefault();
        commit(state.picks[state.active]);
      }
    };
    box.onclick = (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      commit(players.find((player) => player.id === button.dataset.id));
    };
    document.getElementById("shot").onsubmit = (event) => {
      event.preventDefault();
      const typed = sameName(input.value);
      if (typed.length === 1) commit(typed[0]);
      else if (typed.length > 1) {
        state.error = "Two players share that name. Pick one from the list.";
        document.getElementById("miss").textContent = state.error;
        paint();
      } else {
        state.error = "Nobody in the book matches that.";
        document.getElementById("miss").textContent = state.error;
      }
    };
    paint();
  }

  function commit(player) {
    if (!player) return;
    const hole = currentHole();
    const row = placeOf[hole.category].get(player.id);
    if (!row) {
      state.error = player.name + " isn't on the " + statName(hole.category) + " list.";
      const miss = document.getElementById("miss");
      if (miss) miss.textContent = state.error;
      return;
    }
    const gap = Math.abs(row.rank - hole.target);
    const shot = {
      id: player.id,
      name: player.name,
      rank: row.rank,
      value: row.value,
      strokes: Math.min(STROKE_CAP, gap),
      capped: gap > STROKE_CAP,
    };
    const seat = state.names.length === 1 ? 0 : state.turn;
    state.shots[seat][state.hole] = shot;
    state.query = "";
    state.error = "";
    if (state.names.length > 1 && state.turn === 0) {
      state.turn = 1;
      showHole();
      return;
    }
    state.phase = "reveal";
    showHole();
  }

  function band(center, span, length) {
    const ranks = [];
    for (let rank = Math.max(1, center - span); rank <= Math.min(length, center + span); rank++) ranks.push(rank);
    return ranks;
  }

  function revealHtml() {
    const hole = currentHole();
    const board = boards[hole.category];
    const shots = state.names.map((name, seat) => ({ name, shot: state.shots[seat][state.hole] }));
    const wanted = new Set(band(hole.target, 4, board.length));
    for (const item of shots) for (const rank of band(item.shot.rank, 1, board.length)) wanted.add(rank);
    const ordered = [...wanted].sort((a, b) => a - b);
    const chips = shots
      .map((item) => {
        const label = state.names.length > 1 ? esc(item.name) + ". " : "";
        if (item.shot.strokes === 0) {
          return '<p class="call ace">' + label + "<strong>" + esc(item.shot.name) + "</strong> is No. " + item.shot.rank + ". Hole in one.</p>";
        }
        const maxNote = item.shot.capped ? ", the max" : "";
        return (
          '<p class="call">' + label + "<strong>" + esc(item.shot.name) + "</strong> is No. " +
          formatNum(item.shot.rank) + ". <strong>" + formatNum(item.shot.strokes) + " strokes" + maxNote + ".</strong></p>"
        );
      })
      .join("");
    let delay = 180;
    let previous = 0;
    const rows = ordered.map((rank) => {
      let gap = "";
      if (previous && rank > previous + 1) {
        gap = '<li class="gap" style="animation-delay:' + delay + 'ms">···</li>';
        delay += 50;
      }
      previous = rank;
      const row = atRank[hole.category].get(rank);
      const mine = shots.filter((item) => item.shot.rank === rank);
      const classes = ["row"];
      if (rank === hole.target) classes.push("flag");
      if (mine.length) classes.push("you");
      const notes = [];
      if (rank === hole.target) notes.push("The answer");
      for (const item of mine) notes.push((state.names.length > 1 ? item.name : "You") + " · " + formatNum(item.shot.strokes));
      const html =
        '<li class="' + classes.join(" ") + '" style="animation-delay:' + delay + 'ms">' +
        '<span class="rk">' + rank + "</span>" +
        '<span class="nm"><b>' + esc(row.name) + "</b><small>" + esc(row.pos) + (notes.length ? " · " + esc(notes.join(" · ")) : "") + "</small></span>" +
        '<span class="st">' + formatNum(row.value) + "</span></li>";
      delay += 65;
      return gap + html;
    });
    const last = state.hole === state.holes.length - 1;
    return (
      '<div class="reveal">' + chips +
      '<p class="board-label">Around No. ' + hole.target + "</p>" +
      '<ol class="board">' + rows.join("") + "</ol>" +
      '<div class="setup-actions"><button class="btn primary" id="next">' + (last ? "See the card" : "Next hole") + "</button></div></div>"
    );
  }

  function advance() {
    if (state.hole < state.holes.length - 1) {
      state.hole += 1;
      state.turn = 0;
      state.phase = "guess";
      showHole();
      return;
    }
    showCard();
  }

  function showCard() {
    state.phase = "card";
    const totals = state.names.map((_, seat) => total(state.shots[seat]));
    let headline = formatNum(totals[0]) + " STROKES";
    let detail = state.holes.length + " holes. Lower is better.";
    if (totals.length === 2) {
      if (totals[0] === totals[1]) {
        headline = "ALL SQUARE";
        detail = "You both finished at " + formatNum(totals[0]) + ".";
      } else {
        const winner = totals[0] < totals[1] ? 0 : 1;
        headline = state.names[winner].toUpperCase() + " WINS";
        detail = formatNum(totals[0]) + " to " + formatNum(totals[1]) + ".";
      }
    }
    app.innerHTML =
      '<main class="setup panel">' +
      nav("golf") +
      '<p class="eyebrow">Round over · ' + esc(sideName(state.side)) + "</p>" +
      '<h2 class="display" style="font-size:clamp(48px,8vw,72px)">' + esc(headline) + "</h2>" +
      "<p>" + esc(detail) + "</p>" +
      cardHtml() +
      '<div class="setup-actions"><button class="btn primary" id="again">Play another round</button><button class="btn ghost" id="menu">Menu</button></div>' +
      "</main>";
    document.getElementById("again").onclick = () => {
      state.holes = makeHoles();
      freshCard();
      showHole();
    };
    document.getElementById("menu").onclick = showHome;
  }

  showHome();
})();
