(() => {
  const book = window.GOLF_STATS;
  const app = document.getElementById("app");
  const players = book.players;
  const categories = book.categories;

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
      const pool = players.filter((player) => player.stats[category] > 0);
      const secret = pool[Math.floor(Math.random() * pool.length)];
      return { category, target: secret.stats[category], secret: secret.id };
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
      '<p class="lede">Three holes. Each one gives you a career stat and a number. Name the NFL player whose total is closest. The difference is your strokes, and a perfect guess is 0. Lowest score wins.</p>' +
      '<div class="mode-row">' +
      '<button class="btn primary" id="solo">Play a round</button>' +
      '<button class="btn" id="duel">Two players</button>' +
      "</div>" +
      '<section class="panel">' +
      "<ol class=\"steps\">" +
      "<li><strong>01 · The hole</strong><p>A stat appears, like career receiving yards, with a target number.</p></li>" +
      "<li><strong>02 · The shot</strong><p>Name a player. Antonio Brown against a target of 24 would cost you the whole gap between his yards and 24.</p></li>" +
      "<li><strong>03 · The card</strong><p>Add the three differences. Like golf, the lowest total wins.</p></li>" +
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
        : '<p class="hole-copy">Chase a low number. Zero on a hole is a hole in one.</p>') +
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
    const category = categories[hole.category];
    const guessing = state.phase === "guess";
    const seat = state.names.length === 1 ? 0 : state.turn;
    app.innerHTML =
      '<main class="home wrap">' +
      '<div class="topbar">' +
      nav("golf") +
      '<button class="btn ghost" id="menu">Menu</button>' +
      "</div>" +
      '<p class="eyebrow">Hole ' + (state.hole + 1) + " of 3" + (state.names.length > 1 && guessing ? " · " + esc(state.names[seat]) : "") + "</p>" +
      "<h2 class=\"display\" style=\"font-size:clamp(36px,6vw,64px)\">" + esc(category.label) + "</h2>" +
      '<p class="target-num">' + formatNum(hole.target) + "</p>" +
      '<p class="hole-copy">Name a player whose ' + esc(category.label.toLowerCase()) + " is as close to " + formatNum(hole.target) + " as you can get.</p>" +
      (guessing
        ? '<form class="play-row" id="shot">' +
          '<div class="search"><input id="guess" autocomplete="off" placeholder="Player name" value="' + esc(state.query) + '">' +
          '<div class="suggestions" id="suggestions" hidden></div></div>' +
          '<button class="btn primary" type="submit">Take the shot</button></form>' +
          '<p class="miss" id="miss">' + esc(state.error) + "</p>"
        : revealHtml()) +
      '<section class="panel">' + cardHtml() + "</section>" +
      '<p class="fine">' + esc(book.span) + " Closer is better. The lowest total wins.</p>" +
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
    const actual = player.stats[hole.category];
    const shot = { id: player.id, name: player.name, actual, strokes: Math.abs(actual - hole.target) };
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

  function playerById(id) {
    return players.find((player) => player.id === id);
  }

  function shotLine(seatName, shot, hole) {
    const category = categories[hole.category].label.toLowerCase();
    const who = state.names.length > 1 ? "<strong>" + esc(seatName) + ".</strong> " + esc(shot.name) : "<strong>" + esc(shot.name) + "</strong>";
    if (shot.strokes === 0) return '<p class="ace">' + who + " has exactly " + formatNum(shot.actual) + ". Hole in one.</p>";
    return "<p>" + who + " has " + formatNum(shot.actual) + " " + esc(category) + ". <strong>" + formatNum(shot.strokes) + " strokes.</strong></p>";
  }

  function revealHtml() {
    const hole = currentHole();
    const secret = playerById(hole.secret);
    const lines = state.names.map((name, seat) => shotLine(name, state.shots[seat][state.hole], hole));
    const guessed = new Set(state.shots.map((row) => row[state.hole] && row[state.hole].id));
    const flag = guessed.has(secret.id)
      ? ""
      : '<p>The flag was planted on ' + esc(secret.name) + ", who has exactly " + formatNum(hole.target) + ".</p>";
    const last = state.hole === 2;
    return (
      '<div class="reveal">' + lines.join("") + flag +
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
