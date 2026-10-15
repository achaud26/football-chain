(() => {
  const book = window.GOLF_STATS;
  const app = document.getElementById("app");
  const players = book.players;
  const categories = book.categories;
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
    const order = categories.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
      const swap = Math.floor(Math.random() * (i + 1));
      const hold = order[i];
      order[i] = order[swap];
      order[swap] = hold;
    }
    return order.slice(0, 3).map((category) => {
      const depth = Math.min(boards[category].length, 120);
      const target = 1 + Math.floor(Math.random() * depth);
      return { category, target };
    });
  }

  function total(row) {
    return row.reduce((sum, shot) => sum + (shot ? shot.strokes : 0), 0);
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

  function cardHtml() {
    const headers = ["", "1", "2", "3", "Tot"];
    const rows = state.names.map((name, seat) => {
      const cells = [0, 1, 2].map((index) => {
        const shot = state.shots[seat][index];
        const pending = shot && state.phase === "guess" && index === state.hole;
        const current = !shot && state.phase !== "card" && index === state.hole;
        return "<td>" + (pending ? "✓" : shot ? formatNum(shot.strokes) : current ? "•" : "–") + "</td>";
      });
      const done = state.shots[seat].filter(Boolean).length === 3;
      return "<tr><th>" + esc(name) + "</th>" + cells.join("") + '<td class="tot">' + (done ? formatNum(total(state.shots[seat])) : "–") + "</td></tr>";
    });
    return (
      '<table class="scorecard"><thead><tr>' +
      headers.map((label) => "<th>" + label + "</th>").join("") +
      "</tr></thead><tbody>" +
      rows.join("") +
      "</tbody></table>"
    );
  }

  function showHome() {
    state.screen = "home";
    app.innerHTML =
      '<main class="home wrap">' +
      nav("golf") +
      '<div class="pin" aria-hidden="true"></div>' +
      "<h1>GOLF</h1>" +
      '<p class="lede">Three holes. Each one is an all-time list and a rank, like No. 84 in passing yards. Name the player closest to that spot. If yours is No. 79, that is 5 strokes. Lowest total wins.</p>' +
      '<div class="mode-row">' +
      '<button class="btn primary" id="solo">Play a round</button>' +
      '<button class="btn" id="duel">Two players</button>' +
      "</div>" +
      '<section class="panel">' +
      "<ol class=\"steps\">" +
      "<li><strong>01 · The hole</strong><p>You get a stat and a rank. No. 84 means the 84th player all time in that category.</p></li>" +
      "<li><strong>02 · The shot</strong><p>Name who you think is closest. Five spots away costs 5 strokes. The exact player is 0.</p></li>" +
      "<li><strong>03 · The list</strong><p>Your rank appears, then the real answer and the names around him, the shots that would have stayed close.</p></li>" +
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
      (duel
        ? '<div class="name-row">' +
          '<label class="field" style="flex:1"><span>Player 1</span><input id="n1" class="text-input" maxlength="18" value="Player 1"></label>' +
          '<label class="field" style="flex:1"><span>Player 2</span><input id="n2" class="text-input" maxlength="18" value="Player 2"></label></div>' +
          '<p class="hole-copy">You both play the same three holes. Scores stay hidden until you have each taken the shot.</p>'
        : '<p class="hole-copy">Name the player at that rank. Zero strokes is a hole in one.</p>') +
      '<div class="setup-actions"><button class="btn ghost" id="back">Back</button><button class="btn primary" id="start">Start the round</button></div>' +
      "</main>";
    document.getElementById("back").onclick = showHome;
    document.getElementById("start").onclick = () => {
      state.names = duel
        ? [document.getElementById("n1").value.trim() || "Player 1", document.getElementById("n2").value.trim() || "Player 2"]
        : ["You"];
      state.holes = makeHoles();
      state.shots = state.names.map(() => [null, null, null]);
      state.hole = 0;
      state.turn = 0;
      state.phase = "guess";
      state.query = "";
      state.error = "";
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
      '<p class="eyebrow">Hole ' + (state.hole + 1) + " of 3" + (state.names.length > 1 && guessing ? " · " + esc(state.names[seat]) : "") + "</p>" +
      "<h2 class=\"display stat-title\">" + esc(statName(hole.category)) + "</h2>" +
      '<p class="target-num">#' + hole.target + "</p>" +
      '<p class="hole-copy">Name the player closest to No. ' + hole.target + " all time. The gap between ranks is your strokes.</p>" +
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
    const shot = { id: player.id, name: player.name, rank: row.rank, value: row.value, strokes: Math.abs(row.rank - hole.target) };
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
        return (
          '<p class="call">' + label + "<strong>" + esc(item.shot.name) + "</strong> is No. " +
          formatNum(item.shot.rank) + ". <strong>" + formatNum(item.shot.strokes) + " strokes.</strong></p>"
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
    const last = state.hole === 2;
    return (
      '<div class="reveal">' + chips +
      '<p class="board-label">Around No. ' + hole.target + "</p>" +
      '<ol class="board">' + rows.join("") + "</ol>" +
      '<div class="setup-actions"><button class="btn primary" id="next">' + (last ? "See the card" : "Next hole") + "</button></div></div>"
    );
  }

  function advance() {
    if (state.hole < 2) {
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
    let detail = "Add the three gaps. Lower is better.";
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
      '<p class="eyebrow">Round over</p>' +
      '<h2 class="display" style="font-size:clamp(48px,8vw,72px)">' + esc(headline) + "</h2>" +
      "<p>" + esc(detail) + "</p>" +
      cardHtml() +
      '<div class="setup-actions"><button class="btn primary" id="again">Play another round</button><button class="btn ghost" id="menu">Menu</button></div>' +
      "</main>";
    document.getElementById("again").onclick = () => {
      state.holes = makeHoles();
      state.shots = state.names.map(() => [null, null, null]);
      state.hole = 0;
      state.turn = 0;
      state.phase = "guess";
      showHole();
    };
    document.getElementById("menu").onclick = showHome;
  }

  showHome();
})();
