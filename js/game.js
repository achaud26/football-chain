(function () {
  const roster = window.ROSTER;
  if (!roster) {
    document.getElementById("app").textContent = "Roster failed to load.";
    return;
  }

  const players = roster.players;
  const byId = new Map(players.map((p) => [p.id, p]));
  const collegeLogos = new Map(roster.colleges.map((c) => [c.name, c.logo]));

  const EXTRA_ALIASES = {
    Alabama: ["bama"],
    "Ohio State": ["ohio st", "ohio state buckeyes"],
    Georgia: ["uga"],
    LSU: ["louisiana state"],
    Clemson: [],
    Michigan: ["michigan wolverines"],
    "Notre Dame": ["notre dame fighting irish"],
    Oregon: ["oregon ducks"],
    "Penn State": ["psu", "penn st"],
    Texas: ["texas longhorns", "ut austin"],
    USC: ["southern cal", "southern california"],
    Oklahoma: ["ou"],
    Washington: ["uw"],
    Tennessee: ["vols", "tennessee volunteers"],
    Wisconsin: ["wisc"],
    Florida: ["uf", "florida gators"],
    Miami: ["the u", "miami fl", "miami florida"],
    "Texas A&M": ["tamu", "texas am", "a and m"],
    Auburn: [],
    "Ole Miss": ["mississippi", "olemiss"],
    "Florida State": ["fsu"],
    "Michigan State": ["msu"],
    "Texas Tech": ["ttu", "texas tech red raiders"],
    Iowa: ["iowa hawkeyes"],
    Stanford: [],
    UCLA: ["ucla", "ucla bruins"],
    Colorado: [],
    BYU: ["brigham young"],
    "Boise State": ["boise"],
    "Oklahoma State": ["ok state", "oklahoma st"],
    "Iowa State": ["isu"],
    "North Carolina": ["unc"],
    Maryland: [],
    SMU: ["southern methodist"],
    Cincinnati: ["cincy"],
    Louisville: [],
    Arkansas: [],
    Kentucky: [],
    Missouri: ["mizzou"],
    Pitt: ["pittsburgh"],
    Arizona: [],
    "Arizona State": ["asu"],
    "Boston College": ["bc"],
    Cal: ["california", "berkeley", "cal bears"],
    Purdue: [],
    Utah: [],
    "Utah State": ["usu"],
    Wyoming: [],
    "Fresno State": ["fresno"],
    Memphis: [],
    "Georgia Tech": ["gt", "georgia tech yellow jackets"],
    TCU: ["texas christian"],
    "NC State": ["ncsu", "north carolina state"],
    "South Carolina": ["south carolina gamecocks"],
    "Mississippi State": ["miss state", "mississippi st"],
    Nebraska: [],
    "West Virginia": ["wvu"],
    Illinois: [],
    Rutgers: [],
    "Colorado State": ["csu"],
    "South Dakota State": ["sdsu"],
    "North Dakota State": ["ndsu"],
    "Eastern Washington": ["ewu"],
    "West Alabama": [],
    Indiana: ["iu", "hoosiers"],
    Duke: ["duke blue devils"],
    "Wake Forest": ["wake"],
    "Washington State": ["wsu", "wazzu"],
    Minnesota: ["gophers"],
    UCF: ["central florida", "ucf knights"],
    "Jackson State": ["jsu"],
    "Kansas State": ["kstate", "ksu"],
    Baylor: ["baylor bears"],
    Houston: ["uh", "houston cougars"],
    Utah: ["utes"],
    Vanderbilt: ["vandy"],
    Kansas: ["ku", "jayhawks"],
    Northwestern: [],
    "Oregon State": ["oregon st", "beavers"],
    "App State": ["appalachian state", "app state"],
    FAU: ["florida atlantic"],
    UTSA: ["utsa"],
    "Miami (OH)": ["miami ohio", "miami oh"],
    "Incarnate Word": ["uiw"],
    "Sacramento State": ["sac state"],
    Liberty: [],
    Tulane: ["green wave"],
    "San Diego State": ["san diego state aztecs"],
    "San Jose State": ["sjsu"],
  };

  const colleges = [...collegeLogos.keys()];
  const aliasToCollege = new Map();
  const collegeAliases = new Map();
  for (const name of colleges) {
    const aliases = new Set([norm(name), squeeze(name), ...(EXTRA_ALIASES[name] || []).map(norm)]);
    collegeAliases.set(name, aliases);
    for (const alias of aliases) {
      if (!aliasToCollege.has(alias)) aliasToCollege.set(alias, name);
    }
  }

  const NFL_TEAMS = [
    ["ARI", "ari", "Arizona Cardinals", "Cardinals", ["cardinals", "arizona cardinals", "phoenix cardinals", "st louis cardinals"]],
    ["ATL", "atl", "Atlanta Falcons", "Falcons", ["falcons", "atlanta falcons", "atlanta"]],
    ["BAL", "bal", "Baltimore Ravens", "Ravens", ["ravens", "baltimore ravens", "baltimore"]],
    ["BUF", "buf", "Buffalo Bills", "Bills", ["bills", "buffalo bills", "buffalo"]],
    ["CAR", "car", "Carolina Panthers", "Panthers", ["panthers", "carolina panthers"]],
    ["CHI", "chi", "Chicago Bears", "Bears", ["bears", "chicago bears", "chicago"]],
    ["CIN", "cin", "Cincinnati Bengals", "Bengals", ["bengals", "cincinnati bengals"]],
    ["CLE", "cle", "Cleveland Browns", "Browns", ["browns", "cleveland browns", "cleveland"]],
    ["DAL", "dal", "Dallas Cowboys", "Cowboys", ["cowboys", "dallas cowboys", "dallas"]],
    ["DEN", "den", "Denver Broncos", "Broncos", ["broncos", "denver broncos", "denver"]],
    ["DET", "det", "Detroit Lions", "Lions", ["lions", "detroit lions", "detroit"]],
    ["GB", "gb", "Green Bay Packers", "Packers", ["packers", "green bay packers", "green bay"]],
    ["HOU", "hou", "Houston Texans", "Texans", ["texans", "houston texans", "houston"]],
    ["IND", "ind", "Indianapolis Colts", "Colts", ["colts", "indianapolis colts", "indianapolis", "baltimore colts"]],
    ["JAX", "jax", "Jacksonville Jaguars", "Jaguars", ["jaguars", "jags", "jacksonville jaguars", "jacksonville"]],
    ["KC", "kc", "Kansas City Chiefs", "Chiefs", ["chiefs", "kansas city chiefs", "kansas city", "kc"]],
    ["LV", "lv", "Las Vegas Raiders", "Raiders", ["raiders", "las vegas raiders", "oakland raiders", "los angeles raiders", "las vegas"]],
    ["LAC", "lac", "Los Angeles Chargers", "Chargers", ["chargers", "los angeles chargers", "san diego chargers"]],
    ["LAR", "lar", "Los Angeles Rams", "Rams", ["rams", "los angeles rams", "st louis rams"]],
    ["MIA", "mia", "Miami Dolphins", "Dolphins", ["dolphins", "miami dolphins", "fins"]],
    ["MIN", "min", "Minnesota Vikings", "Vikings", ["vikings", "minnesota vikings", "minnesota"]],
    ["NE", "ne", "New England Patriots", "Patriots", ["patriots", "pats", "new england patriots", "new england", "boston patriots"]],
    ["NO", "no", "New Orleans Saints", "Saints", ["saints", "new orleans saints", "new orleans"]],
    ["NYG", "nyg", "New York Giants", "Giants", ["giants", "new york giants"]],
    ["NYJ", "nyj", "New York Jets", "Jets", ["jets", "new york jets"]],
    ["PHI", "phi", "Philadelphia Eagles", "Eagles", ["eagles", "philadelphia eagles", "philadelphia", "philly"]],
    ["PIT", "pit", "Pittsburgh Steelers", "Steelers", ["steelers", "pittsburgh steelers"]],
    ["SF", "sf", "San Francisco 49ers", "49ers", ["49ers", "niners", "san francisco 49ers", "san francisco"]],
    ["SEA", "sea", "Seattle Seahawks", "Seahawks", ["seahawks", "seattle seahawks", "seattle"]],
    ["TB", "tb", "Tampa Bay Buccaneers", "Buccaneers", ["buccaneers", "bucs", "tampa bay buccaneers", "tampa bay", "tampa"]],
    ["TEN", "ten", "Tennessee Titans", "Titans", ["titans", "tennessee titans", "oilers", "houston oilers"]],
    ["WAS", "wsh", "Washington Commanders", "Commanders", ["commanders", "washington commanders"]],
  ];

  const NFL = {};
  const aliasToTeam = new Map();
  for (const [abbr, slug, name, nick, aliases] of NFL_TEAMS) {
    NFL[abbr] = {
      abbr,
      name,
      nick,
      logo: "https://a.espncdn.com/i/teamlogos/nfl/500/" + slug + ".png",
    };
    for (const alias of [name, nick, abbr, ...aliases]) {
      const key = norm(alias);
      if (key && !aliasToTeam.has(key)) aliasToTeam.set(key, abbr);
    }
  }

  function numbersOf(player) {
    return player.numbers || [];
  }

  function collegesOf(player) {
    if (player.colleges && player.colleges.length) return player.colleges;
    return player.college ? [player.college] : [];
  }

  function teamsOf(player) {
    if (player.teams && player.teams.length) return player.teams.filter((abbr) => NFL[abbr]);
    return player.team && NFL[player.team] ? [player.team] : [];
  }

  const teamCounts = new Map();
  const collegeCounts = new Map();
  const numberCounts = new Map();
  for (const player of players) {
    for (const abbr of teamsOf(player)) teamCounts.set(abbr, (teamCounts.get(abbr) || 0) + 1);
    for (const name of collegesOf(player)) collegeCounts.set(name, (collegeCounts.get(name) || 0) + 1);
    for (const number of numbersOf(player)) numberCounts.set(number, (numberCounts.get(number) || 0) + 1);
  }

  function teamPlayable(abbr) {
    return !!NFL[abbr] && (teamCounts.get(abbr) || 0) >= 2;
  }

  function collegePlayable(name) {
    return (collegeCounts.get(name) || 0) >= 2;
  }

  function numberPlayable(number) {
    return (numberCounts.get(number) || 0) >= 2;
  }

  const app = document.getElementById("app");
  const state = {
    screen: "home",
    mode: "solo",
    difficulty: "normal",
    timerSeconds: 30,
    names: ["You", "Coach"],
    scores: [0, 0],
    target: 3,
    starter: 0,
    turn: 0,
    chain: [],
    usedPlayers: new Set(),
    usedNumbers: new Set(),
    usedColleges: new Set(),
    usedTeams: new Set(),
    clock: 30,
    clockEnds: 0,
    locked: false,
    handoff: false,
    message: "",
    messageKind: "",
    suggestions: [],
    highlight: 0,
    query: "",
    mute: localStorage.getItem("chain-mute") === "1",
    lastStart: "",
    overlay: null,
    round: 0,
  };

  let clockId = null;
  let cpuId = null;
  let audioCtx = null;
  let lastTick = 0;

  function norm(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, "")
      .replace(/['’.]/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function squeeze(value) {
    return norm(value).replace(/ /g, "");
  }

  function lastName(name) {
    const parts = norm(name).split(" ").filter(Boolean);
    return parts[parts.length - 1] || "";
  }

  function splitName(name) {
    let parts = String(name).replace(/[,]/g, "").split(/\s+/).filter(Boolean);
    if (parts.length && /^(jr|sr|ii|iii|iv|v)\.?$/i.test(parts[parts.length - 1])) parts.pop();
    if (parts.length >= 3 && /^(st|de|da|van|von|del)\.?$/i.test(parts[parts.length - 2])) {
      return [parts.slice(0, -2).join(" "), parts.slice(-2).join(" ")];
    }
    if (parts.length <= 1) return [parts[0] || name];
    return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
  }

  function nameLines(name) {
    const lines = splitName(name);
    const longest = Math.max(...lines.map((line) => line.length));
    const size = longest > 12 ? "small" : longest > 8 ? "mid" : "";
    return { lines, size };
  }

  function nameBlock(name) {
    const { lines, size } = nameLines(name);
    return '<p class="who ' + size + '">' + lines.map((line) => "<span>" + esc(line) + "</span>").join("") + "</p>";
  }

  function captionBlock(name) {
    const { lines } = nameLines(name);
    return '<p class="caption">' + lines.map((line) => "<span>" + esc(line) + "</span>").join("") + "</p>";
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function initials(name) {
    const parts = name.replace(/[^A-Za-z\s]/g, " ").split(" ").filter(Boolean);
    return ((parts[0] || "?").slice(0, 1) + (parts.length > 1 ? parts[parts.length - 1].slice(0, 1) : "")).toUpperCase();
  }

  function beep(freq, duration) {
    if (state.mute) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.045, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (err) {
      state.mute = true;
    }
  }

  function currentNode() {
    return state.chain[state.chain.length - 1];
  }

  function legalMoves() {
    const node = currentNode();
    if (!node) return [];
    if (node.type === "player") {
      const player = byId.get(node.id);
      const moves = [];
      for (const number of numbersOf(player)) {
        if (!state.usedNumbers.has(number) && numberPlayable(number)) moves.push({ type: "number", value: number });
      }
      for (const name of collegesOf(player)) {
        if (!state.usedColleges.has(name) && collegePlayable(name)) moves.push({ type: "college", name });
      }
      for (const abbr of teamsOf(player)) {
        if (!state.usedTeams.has(abbr) && teamPlayable(abbr)) moves.push({ type: "team", id: abbr });
      }
      return moves;
    }
    if (node.type === "number") {
      return players
        .filter((player) => numbersOf(player).includes(node.value) && !state.usedPlayers.has(player.id))
        .map((player) => ({ type: "player", id: player.id }));
    }
    if (node.type === "team") {
      return players
        .filter((player) => teamsOf(player).includes(node.id) && !state.usedPlayers.has(player.id))
        .map((player) => ({ type: "player", id: player.id }));
    }
    return players
      .filter((player) => collegesOf(player).includes(node.name) && !state.usedPlayers.has(player.id))
      .map((player) => ({ type: "player", id: player.id }));
  }

  function commit(move) {
    state.chain.push(move);
    if (move.type === "player") state.usedPlayers.add(move.id);
    if (move.type === "number") state.usedNumbers.add(move.value);
    if (move.type === "college") state.usedColleges.add(move.name);
    if (move.type === "team") state.usedTeams.add(move.id);
  }

  function label(move) {
    if (move.type === "player") return byId.get(move.id).name;
    if (move.type === "number") return "#" + move.value;
    if (move.type === "team") return NFL[move.id].name;
    return move.name;
  }

  function fameOf(move) {
    return move.type === "player" ? byId.get(move.id).fame : 0;
  }

  function hintMoves(moves) {
    return moves.slice().sort((a, b) => fameOf(a) - fameOf(b)).slice(0, 3);
  }

  function chooseCpuMove(moves) {
    if (moves.some((move) => move.type === "player")) {
      const pool = moves.filter((move) => move.type === "player");
      const ranked = pool.slice().sort((a, b) => fameOf(a) - fameOf(b));
      if (state.difficulty === "hard") {
        const tail = ranked.slice(Math.floor(ranked.length * 0.55));
        const pickFrom = tail.length ? tail : ranked;
        return pickFrom[Math.floor(Math.random() * pickFrom.length)];
      }
      const famous = ranked.filter((move) => fameOf(move) <= 80);
      const use = famous.length ? famous : ranked;
      const head = use.slice(0, Math.max(1, Math.min(4, use.length)));
      return head[Math.floor(Math.random() * head.length)];
    }
    const scored = moves.map((move) => {
      const saved = snapshot();
      commit(move);
      const replies = legalMoves().filter((next) => next.type === "player").map(fameOf).sort((a, b) => a - b);
      restore(saved);
      return { move, best: replies.length ? replies[0] : 999 };
    });
    const alive = scored.filter((item) => item.best < 999);
    const use = (alive.length ? alive : scored).slice().sort((a, b) => a.best - b.best);
    if (state.difficulty === "hard") {
      const tail = use.slice(Math.floor(use.length * 0.55));
      const pickFrom = tail.length ? tail : use;
      return pickFrom[Math.floor(Math.random() * pickFrom.length)].move;
    }
    const head = use.slice(0, Math.max(1, Math.min(3, use.length)));
    return head[Math.floor(Math.random() * head.length)].move;
  }

  function countReplies(move) {
    const saved = snapshot();
    commit(move);
    const count = legalMoves().length;
    restore(saved);
    return count;
  }

  function snapshot() {
    return {
      chain: state.chain.slice(),
      usedPlayers: new Set(state.usedPlayers),
      usedNumbers: new Set(state.usedNumbers),
      usedColleges: new Set(state.usedColleges),
      usedTeams: new Set(state.usedTeams),
    };
  }

  function restore(saved) {
    state.chain = saved.chain;
    state.usedPlayers = saved.usedPlayers;
    state.usedNumbers = saved.usedNumbers;
    state.usedColleges = saved.usedColleges;
    state.usedTeams = saved.usedTeams;
  }

  function levenshtein(a, b) {
    const rows = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 0; j <= b.length; j++) rows[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      }
    }
    return rows[a.length][b.length];
  }

  function parseNumber(query) {
    const match = query.match(/^(?:no|number)?\s*#?\s*(\d{1,2})$/);
    if (!match) return null;
    const value = Number(match[1]);
    return value >= 0 && value <= 99 ? value : null;
  }

  function exactCollege(query) {
    return aliasToCollege.get(query) || aliasToCollege.get(squeeze(query)) || null;
  }

  function exactTeam(query) {
    return aliasToTeam.get(query) || aliasToTeam.get(squeeze(query)) || null;
  }

  function teamScore(abbr, query) {
    if (!query) return 0;
    const info = NFL[abbr];
    const aliases = [norm(info.name), norm(info.nick), norm(info.abbr)];
    for (const [alias, id] of aliasToTeam) {
      if (id === abbr) aliases.push(alias);
    }
    if (aliases.some((alias) => alias === query || alias === squeeze(query))) return 100;
    if (query.length >= 2 && aliases.some((alias) => alias.startsWith(query))) return 80;
    if (query.length >= 4 && aliases.some((alias) => alias.includes(query))) return 62;
    return 0;
  }

  function exactPlayer(query) {
    const squeezed = squeeze(query);
    const exact = players.filter((player) => norm(player.name) === query || squeeze(player.name) === squeezed);
    if (exact.length === 1) return exact[0];
    const byLast = players.filter((player) => lastName(player.name) === query);
    if (byLast.length === 1) return byLast[0];
    return null;
  }

  function playerScore(player, query) {
    const name = norm(player.name);
    const squeezed = squeeze(player.name);
    const last = lastName(player.name);
    if (!query) return 0;
    if (name === query || squeezed === squeeze(query)) return 100;
    if (last === query) return 94;
    if (name.startsWith(query) || last.startsWith(query)) return 82;
    if (query.length >= 4 && name.includes(query)) return 68;
    if (query.length >= 4 && Math.abs(name.length - query.length) <= 2 && levenshtein(name, query) <= 2) return 64;
    if (query.length >= 4 && Math.abs(last.length - query.length) <= 1 && levenshtein(last, query) <= 1) return 70;
    return 0;
  }

  function collegeScore(name, query) {
    if (!query) return 0;
    const aliases = collegeAliases.get(name) || new Set();
    if ([...aliases].some((alias) => alias === query || alias === squeeze(query))) return 100;
    if (query.length >= 2 && [...aliases].some((alias) => alias.startsWith(query))) return 80;
    if (query.length >= 4 && [...aliases].some((alias) => alias.includes(query))) return 62;
    return 0;
  }

  function buildSuggestions(raw) {
    const query = norm(raw);
    const node = currentNode();
    if (!node || !query) return [];
    if (node.type === "player") {
      const items = [];
      const asNumber = parseNumber(query);
      if (asNumber !== null) items.push({ kind: "number", value: asNumber, title: "#" + asNumber, meta: "Number" });
      colleges
        .map((name) => ({ name, score: collegeScore(name, query) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, 4)
        .forEach((item) => items.push({ kind: "college", name: item.name, title: item.name, meta: "College" }));
      Object.keys(NFL)
        .map((abbr) => ({ abbr, score: teamScore(abbr, query) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score || NFL[a.abbr].name.localeCompare(NFL[b.abbr].name))
        .slice(0, 4)
        .forEach((item) => items.push({ kind: "team", id: item.abbr, title: NFL[item.abbr].name, meta: "NFL team" }));
      return items.slice(0, 7);
    }
    return players
      .map((player) => ({ player, score: playerScore(player, query) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.player.fame - b.player.fame)
      .slice(0, 7)
      .map((item) => ({
        kind: "player",
        id: item.player.id,
        title: item.player.name,
        meta: item.player.position,
      }));
  }

  function entryFromQuery(raw) {
    const query = norm(raw);
    const node = currentNode();
    if (!query || !node) return null;
    if (node.type === "player") {
      const asNumber = parseNumber(query);
      if (asNumber !== null) return { kind: "number", value: asNumber };
      const college = exactCollege(query);
      const team = exactTeam(query);
      if (college && team) return null;
      if (college) return { kind: "college", name: college };
      if (team) return { kind: "team", id: team };
      return null;
    }
    const player = exactPlayer(query);
    if (player) return { kind: "player", id: player.id };
    return null;
  }

  function judge(entry) {
    const node = currentNode();
    if (!entry) {
      if (node.type === "player") return { error: "No college, NFL team, or number matches that." };
      return { error: "No player in the book matches that." };
    }
    if (entry.kind === "number") {
      if (node.type !== "player") return { error: "Name a player for this link." };
      const player = byId.get(node.id);
      if (!numbersOf(player).includes(entry.value)) return { error: "That's not " + player.name + "'s number." };
      if (!numberPlayable(entry.value)) return { error: "Nobody else in the book wore #" + entry.value + ".", soft: true };
      if (state.usedNumbers.has(entry.value)) return { error: "#" + entry.value + " is already in the chain.", soft: true };
      return { move: { type: "number", value: entry.value } };
    }
    if (entry.kind === "college") {
      if (node.type !== "player") return { error: "Name a player for this link." };
      const player = byId.get(node.id);
      if (!collegesOf(player).includes(entry.name)) return { error: player.name + " didn't go there." };
      if (!collegePlayable(entry.name)) return { error: "Nobody else in the book went to " + entry.name + ".", soft: true };
      if (state.usedColleges.has(entry.name)) return { error: entry.name + " is already in the chain.", soft: true };
      return { move: { type: "college", name: entry.name } };
    }
    if (entry.kind === "team") {
      if (node.type !== "player") return { error: "Name a player for this link." };
      const player = byId.get(node.id);
      const info = NFL[entry.id];
      if (!info || !teamsOf(player).includes(entry.id)) return { error: player.name + " never played for the " + (info ? info.nick : "that team") + "." };
      if (!teamPlayable(entry.id)) return { error: "Nobody else in the book played for the " + info.nick + ".", soft: true };
      if (state.usedTeams.has(entry.id)) return { error: "The " + info.nick + " are already in the chain.", soft: true };
      return { move: { type: "team", id: entry.id } };
    }
    const player = byId.get(entry.id);
    if (node.type === "player") return { error: "Play the number, the college, or the NFL team first." };
    if (state.usedPlayers.has(player.id)) return { error: player.name + " is already in the chain.", soft: true };
    if (node.type === "number" && !numbersOf(player).includes(node.value)) {
      return { error: player.name + " didn't wear #" + node.value + "." };
    }
    if (node.type === "college" && !collegesOf(player).includes(node.name)) {
      return { error: player.name + " didn't go to " + node.name + "." };
    }
    if (node.type === "team" && !teamsOf(player).includes(node.id)) {
      return { error: player.name + " never played for the " + NFL[node.id].nick + "." };
    }
    return { move: { type: "player", id: player.id } };
  }

  function nodeFrom(name) {
    const player = players.find((item) => item.name === name);
    return player ? { type: "player", id: player.id } : null;
  }


  function nodeHtml(node, now, passed) {
    if (node.type === "number") {
      const digits = String(node.value);
      return '<article class="linkball numeral' + (now ? " now" : "") + '"><p class="digits' + (digits.length > 1 ? " tens" : "") + '">' + esc(digits) + "</p></article>";
    }
    if (node.type === "college") {
      const logo = collegeLogos.get(node.name) || "";
      return (
        '<article class="linkball club' + (now ? " now" : "") + '">' +
        (logo ? '<img class="crest" alt="" src="' + esc(logo) + '">' : nameBlock(node.name)) +
        "</article>"
      );
    }
    if (node.type === "team") {
      const info = NFL[node.id];
      return '<article class="linkball club' + (now ? " now" : "") + '"><img class="crest" alt="" src="' + esc(info.logo) + '"></article>';
    }
    const player = byId.get(node.id);
    if (passed && player.image) {
      return (
        '<article class="linkball photo' + (now ? " now" : "") + '">' +
        '<img class="mug" alt="" src="' + esc(player.image) + '" data-fallback="' + esc(player.fallback || "") + '">' +
        captionBlock(player.name) + "</article>"
      );
    }
    return '<article class="linkball name' + (now ? " now" : "") + '">' + nameBlock(player.name) + "</article>";
  }

  function chainHtml(nodes, markNow) {
    return nodes
      .map((node, index) => {
        const now = markNow !== false && index === nodes.length - 1;
        const passed = node.type === "player" && index < nodes.length - 1;
        return (index ? '<div class="join" aria-hidden="true"></div>' : "") + nodeHtml(node, now, passed);
      })
      .join("");
  }

  function bindImages(root) {
    root.querySelectorAll("img").forEach((img) => {
      img.addEventListener("error", () => {
        if (img.dataset.fallback && !img.dataset.tried) {
          img.dataset.tried = "1";
          img.src = img.dataset.fallback;
          return;
        }
        const frame = img.closest(".linkball") || img.parentElement;
        if (frame && img.classList.contains("mug")) {
          const caption = frame.querySelector(".caption");
          frame.classList.remove("photo");
          frame.classList.add("name");
          frame.innerHTML = nameBlock(caption ? caption.textContent : "Player");
          return;
        }
        if (frame) frame.classList.add("no-photo");
      });
    });
  }

  function stopClock() {
    if (clockId) clearInterval(clockId);
    clockId = null;
  }

  function clearCpu() {
    if (cpuId) clearTimeout(cpuId);
    cpuId = null;
  }

  function updateClock() {
    const el = document.getElementById("clock");
    if (!el) return;
    if (!state.timerSeconds) {
      el.textContent = "∞";
      el.className = "clock off";
      return;
    }
    const left = state.clockEnds ? Math.max(0, Math.ceil((state.clockEnds - Date.now()) / 1000)) : state.timerSeconds;
    state.clock = left;
    el.textContent = String(left);
    el.className = "clock" + (left <= 10 ? " hot" : "");
    if (left <= 5 && left > 0 && left !== lastTick) {
      lastTick = left;
      beep(440, 0.06);
    }
  }

  function startClock() {
    stopClock();
    lastTick = 0;
    if (!state.timerSeconds || state.handoff || state.overlay) {
      state.clockEnds = 0;
      updateClock();
      return;
    }
    state.clockEnds = Date.now() + state.timerSeconds * 1000;
    updateClock();
    clockId = setInterval(() => {
      updateClock();
      if (state.clock <= 0) {
        stopClock();
        const moves = legalMoves();
        if (state.mode === "solo") finishChain("Time ran out.", hintMoves(moves));
        else finishRound(1 - state.turn, "Time ran out.", hintMoves(moves));
      }
    }, 200);
  }

  function setMessage(text, kind) {
    state.message = text;
    state.messageKind = kind || "";
    const el = document.getElementById("msg");
    if (!el) return;
    el.textContent = text;
    el.className = "msg" + (kind ? " " + kind : "");
  }

  function promptText() {
    const node = currentNode();
    if (!node) return "";
    const priorPlayer = state.chain.some((item) => item.type === "player");
    if (node.type === "player") return "Link " + byId.get(node.id).name + " by number, college, or NFL team.";
    if (node.type === "number") return (priorPlayer ? "Name another player who wore #" : "Name a player who wore #") + node.value + ".";
    if (node.type === "team") return (priorPlayer ? "Name another " : "Name a ") + NFL[node.id].nick + " player.";
    return (priorPlayer ? "Name another player from " : "Name a player from ") + node.name + ".";
  }

  function renderChain() {
    const el = document.getElementById("chain");
    if (!el) return;
    el.innerHTML = chainHtml(state.chain);
    bindImages(el);
    const last = el.lastElementChild;
    if (last && last.scrollIntoView) last.scrollIntoView({ inline: "end", block: "nearest", behavior: "smooth" });
  }

  function renderSuggestions() {
    const box = document.getElementById("suggestions");
    if (!box) return;
    if (!state.suggestions.length) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    box.innerHTML = state.suggestions
      .map((item, index) => {
        return (
          '<button type="button" data-index="' + index + '" class="' + (index === state.highlight ? "on" : "") + '">' +
          "<span>" + esc(item.title) + "</span><small>" + esc(item.meta || "") + "</small></button>"
        );
      })
      .join("");
  }

  function chainCount() {
    return Math.max(0, state.chain.length - 1);
  }

  function renderScores() {
    const el = document.getElementById("scores");
    if (!el) return;
    if (state.mode === "solo") {
      el.innerHTML = '<div class="score on chain-score"><span>Chain</span><strong>' + chainCount() + "</strong></div>";
      return;
    }
    el.innerHTML = [0, 1]
      .map((index) => {
        return (
          '<div class="score' + (state.turn === index && !state.overlay ? " on" : "") + '">' +
          "<span>" + esc(state.names[index]) + "</span><strong>" + state.scores[index] + "</strong></div>"
        );
      })
      .join('<span aria-hidden="true">·</span>');
  }

  function renderPrompt() {
    const title = document.getElementById("prompt");
    const who = document.getElementById("who");
    if (title) title.textContent = promptText();
    if (who) {
      if (state.mode === "solo") {
        const linking = currentNode() && currentNode().type === "player";
        who.textContent = state.turn === 1 ? (linking ? "Choosing a link…" : "Adding a player…") : "Your turn";
      }
      else who.textContent = state.names[state.turn] + "'s turn";
    }
    const input = document.getElementById("guess");
    if (input) {
      const node = currentNode();
      input.placeholder = node && node.type === "player" ? "Number, college, or NFL team" : "Player name";
      input.disabled = state.locked || state.handoff || !!state.overlay;
    }
    const linkBtn = document.getElementById("link-btn");
    const stuckBtn = document.getElementById("stuck-btn");
    if (linkBtn) linkBtn.disabled = state.locked || state.handoff || !!state.overlay;
    if (stuckBtn) stuckBtn.disabled = state.locked || state.handoff || !!state.overlay;
  }

  function clearOverlay() {
    const overlay = document.getElementById("overlay");
    if (overlay) overlay.remove();
  }

  function showHome() {
    stopClock();
    clearCpu();
    clearOverlay();
    state.screen = "home";
    state.overlay = null;
    const example = ["Patrick Mahomes", "Tim Tebow", "Anthony Richardson"]
      .map(nodeFrom)
      .filter(Boolean);
    const demo = [];
    if (example[0]) demo.push(example[0], { type: "number", value: 15 });
    if (example[1]) demo.push(example[1], { type: "college", name: "Florida" });
    if (example[2]) demo.push(example[2]);

    app.innerHTML =
      '<main class="home wrap">' +
      '<div class="brand"><div class="ball" aria-hidden="true"></div><div><p class="eyebrow">NFL × College</p></div></div>' +
      "<h1>CHAIN</h1>" +
      '<p class="lede">The open link is a full name. Say a number, a college, or an NFL team and that link appears. Once you move on, that player’s picture fills the circle.</p>' +
      '<div class="mode-row">' +
      '<button class="btn primary" id="solo">Build a chain</button>' +
      '<button class="btn" id="pass">Two players</button>' +
      "</div>" +
      '<section class="panel">' +
      "<ol class=\"steps\">" +
      "<li><strong>01 · Name</strong><p>The open link is a full name. The coach might also start you on a number or a college, so you have to find the player.</p></li>" +
      "<li><strong>02 · Link</strong><p>Say a number, any college he played at, or any NFL team, past or present. Mahomes can go to 15, Texas Tech, or the Chiefs.</p></li>" +
      "<li><strong>03 · Next name</strong><p>From 15, someone else who wore it. From Florida, a Gator. From the Chiefs, a teammate. Gibbs counts as both 26 and 0.</p></li>" +
      "<li><strong>04 · How you play</strong><p>Solo, chase a long chain. Hard just brings obscure players. Two players is first to 3, and a wrong answer ends the round.</p></li>" +
      "</ol>" +
      '<p class="example-label">Patrick Mahomes, then 15. Tim Tebow, then Florida. Anthony Richardson is next.</p>' +
      '<div class="chain demo" id="demo">' + chainHtml(demo, false) + "</div>" +
      '<p class="fine">' + players.length + " players in the book. Past teams, past numbers, and every college count. This is a fan game, not an official NFL or NCAA product.</p>" +
      "</section></main>";
    bindImages(app);
    document.getElementById("solo").onclick = () => showSetup("solo");
    document.getElementById("pass").onclick = () => showSetup("pass");
  }

  function showSetup(mode) {
    state.mode = mode;
    state.screen = "setup";
    const solo = mode === "solo";
    app.innerHTML =
      '<main class="setup panel">' +
      '<p class="eyebrow">' + (solo ? "Solo" : "Pass and play") + "</p>" +
      "<h2 class=\"display\" style=\"font-size:64px\">" + (solo ? "BUILD A CHAIN" : "TWO PLAYERS") + "</h2>" +
      (solo
        ? ""
        : '<div class="name-row">' +
          '<label class="field" style="flex:1"><span>Player 1</span><input id="n1" class="text-input" maxlength="18" value="Player 1"></label>' +
          '<label class="field" style="flex:1"><span>Player 2</span><input id="n2" class="text-input" maxlength="18" value="Player 2"></label></div>') +
      (solo
        ? '<div class="field"><span>Coach</span><div class="choices" id="diff">' +
          '<button type="button" data-diff="normal" class="on">Normal</button>' +
          '<button type="button" data-diff="hard">Hard</button></div>' +
          '<p class="fine" style="margin-top:8px">Normal keeps famous players in the chain. Hard hands you obscure ones. The counter is how long you last.</p></div>'
        : "") +
      '<div class="field"><span>Shot clock</span><div class="choices" id="clock-choice">' +
      [20, 30, 45, 0]
        .map((seconds) => {
          const on = seconds === 30 ? " on" : "";
          const labelText = seconds ? seconds + "s" : "None";
          return '<button type="button" data-seconds="' + seconds + '" class="' + on.trim() + '">' + labelText + "</button>";
        })
        .join("") +
      "</div></div>" +
      '<div class="setup-actions"><button class="btn ghost" id="back">Back</button><button class="btn primary" id="start">Start the chain</button></div>' +
      "</main>";

    document.getElementById("back").onclick = showHome;
    document.getElementById("diff")?.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      state.difficulty = button.dataset.diff;
      document.querySelectorAll("#diff button").forEach((el) => el.classList.toggle("on", el === button));
    });
    document.getElementById("clock-choice").addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      state.timerSeconds = Number(button.dataset.seconds);
      document.querySelectorAll("#clock-choice button").forEach((el) => el.classList.toggle("on", el === button));
    });
    document.getElementById("start").onclick = () => {
      state.names = solo
        ? ["You", "Coach"]
        : [
            document.getElementById("n1").value.trim() || "Player 1",
            document.getElementById("n2").value.trim() || "Player 2",
          ];
      state.scores = [0, 0];
      state.starter = 0;
      state.round = 0;
      startRound();
    };
  }

  function openingKey(move) {
    if (move.type === "player") return "player:" + move.id;
    if (move.type === "number") return "number:" + move.value;
    return "college:" + move.name;
  }

  function takeOpening(pool) {
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (openingKey(pick) === state.lastStart && pool.length > 1) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    state.lastStart = openingKey(pick);
    return pick;
  }

  function pickPlayerOpening() {
    const ranked = players.slice().sort((a, b) => a.fame - b.fame);
    let pool;
    if (state.mode === "solo" && state.difficulty === "hard") {
      pool = ranked.filter((player) => player.fame >= 90);
      if (pool.length < 8) pool = ranked.slice(Math.floor(ranked.length / 2));
    } else {
      pool = ranked.filter((player) => player.fame <= 40);
      if (pool.length < 8) pool = ranked.slice(0, 24);
    }
    return takeOpening(pool.map((player) => ({ type: "player", id: player.id })));
  }

  function linkFame(move) {
    const group = move.type === "number"
      ? players.filter((player) => numbersOf(player).includes(move.value))
      : players.filter((player) => collegesOf(player).includes(move.name));
    if (!group.length) return 999;
    return Math.min(...group.map((player) => player.fame));
  }

  function pickLinkOpening(type) {
    const options = type === "number"
      ? [...numberCounts.entries()].filter(([, count]) => count >= 2).map(([value]) => ({ type: "number", value }))
      : [...collegeCounts.entries()].filter(([, count]) => count >= 2).map(([name]) => ({ type: "college", name }));
    const ranked = options.slice().sort((a, b) => linkFame(a) - linkFame(b));
    let pool;
    if (state.difficulty === "hard") {
      pool = ranked.filter((move) => linkFame(move) >= 70);
      if (pool.length < 4) pool = ranked.slice(Math.floor(ranked.length / 2));
    } else {
      pool = ranked.filter((move) => linkFame(move) <= 45);
      if (pool.length < 4) pool = ranked.slice(0, Math.min(ranked.length, 12));
    }
    return takeOpening(pool);
  }

  function pickStart() {
    if (state.mode !== "solo") return pickPlayerOpening();
    const roll = Math.floor(Math.random() * 3);
    if (roll === 1) return pickLinkOpening("number");
    if (roll === 2) return pickLinkOpening("college");
    return pickPlayerOpening();
  }

  function startRound() {
    stopClock();
    clearCpu();
    state.round += 1;
    state.overlay = null;
    state.handoff = false;
    state.locked = false;
    state.message = "";
    state.chain = [];
    state.usedPlayers = new Set();
    state.usedNumbers = new Set();
    state.usedColleges = new Set();
    state.usedTeams = new Set();
    state.turn = state.starter;
    commit(pickStart());
    mountBoard();
  }

  function mountBoard() {
    state.screen = "game";
    app.innerHTML =
      '<main class="board wrap">' +
      '<header class="topbar">' +
      '<button class="btn ghost" id="menu">Menu</button>' +
      '<div class="scores" id="scores"></div>' +
      '<div style="display:flex;gap:8px;align-items:center">' +
      '<div class="clock" id="clock">30</div>' +
      '<button class="icon-btn" id="mute" aria-label="Mute">' + (state.mute ? "🔇" : "🔊") + "</button>" +
      "</div></header>" +
      '<div class="prompt-block"><p class="eyebrow" id="who"></p><h2 id="prompt"></h2><p class="msg" id="msg" aria-live="polite"></p></div>' +
      '<div class="chain" id="chain"></div>' +
      '<form class="play-row" id="guess-form">' +
      '<div class="search"><input id="guess" autocomplete="off" spellcheck="false" aria-autocomplete="list">' +
      '<div class="suggestions" id="suggestions" hidden></div></div>' +
      '<button class="btn primary" id="link-btn" type="submit">Link</button>' +
      '<button class="btn danger" id="stuck-btn" type="button">I\'m stuck</button>' +
      "</form>" +
      '<p class="fine">' +
      (state.mode === "solo"
        ? "Keep the chain going. A wrong answer ends it. No repeated players, numbers, colleges, or teams."
        : "Round " + state.round + " · first to " + state.target + " · a wrong answer ends the round.") +
      "</p>" +
      "</main>";

    document.getElementById("menu").onclick = showHome;
    document.getElementById("mute").onclick = () => {
      state.mute = !state.mute;
      localStorage.setItem("chain-mute", state.mute ? "1" : "0");
      document.getElementById("mute").textContent = state.mute ? "🔇" : "🔊";
    };
    document.getElementById("guess-form").onsubmit = (event) => {
      event.preventDefault();
      submitGuess();
    };
    document.getElementById("stuck-btn").onclick = onStuck;
    const input = document.getElementById("guess");
    input.addEventListener("input", () => {
      state.query = input.value;
      state.suggestions = buildSuggestions(input.value);
      state.highlight = 0;
      const stuck = document.getElementById("stuck-btn");
      if (stuck) {
        stuck.dataset.armed = "";
        stuck.textContent = "I'm stuck";
      }
      renderSuggestions();
    });
    input.addEventListener("keydown", (event) => {
      if (!state.suggestions.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        state.highlight = (state.highlight + 1) % state.suggestions.length;
        renderSuggestions();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        state.highlight = (state.highlight - 1 + state.suggestions.length) % state.suggestions.length;
        renderSuggestions();
      } else if (event.key === "Escape") {
        state.suggestions = [];
        renderSuggestions();
      }
    });
    document.getElementById("suggestions").addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const suggestion = state.suggestions[Number(button.dataset.index)];
      if (suggestion) accept(suggestion);
    });
    renderScores();
    renderChain();
    renderPrompt();
    setMessage("");
    beginTurn(false);
  }

  function beginTurn(fromHandoff) {
    const moves = legalMoves();
    if (!moves.length) {
      const node = currentNode();
      const from = node.type === "player" ? byId.get(node.id).name : node.type === "number" ? "#" + node.value : node.type === "team" ? NFL[node.id].name : node.name;
      const reason = "No unused link from " + from + ".";
      if (state.mode === "solo") finishChain(reason, []);
      else finishRound(1 - state.turn, reason, []);
      return;
    }
    const cpu = state.mode === "solo" && state.turn === 1;
    const passHandoff = state.mode === "pass" && !fromHandoff;
    if (passHandoff) {
      state.handoff = true;
      stopClock();
      renderPrompt();
      showHandoff();
      return;
    }
    state.handoff = false;
    if (cpu) {
      state.locked = true;
      renderPrompt();
      clearCpu();
      cpuId = setTimeout(playCpu, 700 + Math.random() * 700);
      return;
    }
    state.locked = false;
    renderPrompt();
    renderScores();
    startClock();
    const input = document.getElementById("guess");
    if (input) {
      input.value = "";
      input.focus();
    }
    state.suggestions = [];
    renderSuggestions();
  }

  function showHandoff() {
    const existing = document.getElementById("overlay");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.id = "overlay";
    overlay.innerHTML =
      '<div class="sheet"><p class="eyebrow">Pass the screen</p><h2>' +
      esc(state.names[state.turn]) +
      "</h2><p>The chain is waiting. Start the turn when only you can see the screen.</p>" +
      '<div class="overlay-actions"><button class="btn primary" id="ready">Start turn</button><button class="btn ghost" id="handoff-menu">Menu</button></div></div>';
    document.body.appendChild(overlay);
    document.getElementById("handoff-menu").onclick = showHome;
    document.getElementById("ready").onclick = () => {
      overlay.remove();
      state.handoff = false;
      beginTurn(true);
    };
    document.getElementById("ready").focus();
  }

  function playCpu() {
    const moves = legalMoves();
    if (!moves.length) {
      beginTurn(true);
      return;
    }
    const move = chooseCpuMove(moves);
    beep(520, 0.08);
    setTimeout(() => beep(680, 0.09), 90);
    acceptMove(move, label(move) + " joins the chain.");
  }

  function submitGuess() {
    if (state.locked || state.handoff || state.overlay) return;
    const typed = document.getElementById("guess").value;
    if (!typed.trim()) return;
    const exact = entryFromQuery(typed);
    if (exact) {
      accept(exact);
      return;
    }
    const suggestion = state.suggestions[state.highlight];
    accept(suggestion || null);
  }

  function accept(entry) {
    if (state.locked || state.handoff || state.overlay) return;
    const result = judge(entry);
    if (result.error) {
      setMessage(result.error, "bad");
      beep(180, 0.12);
      const input = document.getElementById("guess");
      if (input) {
        input.classList.remove("shake");
        void input.offsetWidth;
        input.classList.add("shake");
      }
      if (!result.soft) {
        const reveals = hintMoves(legalMoves());
        if (state.mode === "solo") finishChain(result.error, reveals);
        else finishRound(1 - state.turn, result.error, reveals);
      }
      return;
    }
    acceptMove(result.move, "");
  }

  function acceptMove(move, note) {
    stopClock();
    commit(move);
    state.suggestions = [];
    renderSuggestions();
    renderChain();
    renderScores();
    const input = document.getElementById("guess");
    if (input) input.value = "";
    if (note) setMessage(note, "good");
    else setMessage("");
    beep(640, 0.07);
    state.turn = 1 - state.turn;
    state.locked = false;
    beginTurn(false);
  }

  function onStuck() {
    if (state.locked || state.handoff || state.overlay) return;
    const button = document.getElementById("stuck-btn");
    if (button && button.dataset.armed !== "1") {
      button.dataset.armed = "1";
      button.textContent = state.mode === "solo" ? "End the chain?" : "End the round?";
      setMessage("Click again if you really have no link.", "");
      return;
    }
    const moves = legalMoves();
    if (state.mode === "solo") {
      finishChain(moves.length ? "You ended the chain." : "No link was left.", hintMoves(moves));
      return;
    }
    if (!moves.length) {
      finishRound(state.turn, "The chain was already dead.", []);
      return;
    }
    finishRound(1 - state.turn, "There was still a link on the board.", hintMoves(moves));
  }

  function finishChain(reason, reveals) {
    if (state.overlay) return;
    stopClock();
    clearCpu();
    state.locked = true;
    state.overlay = "chain";
    const count = chainCount();
    const revealHtml = reveals && reveals.length
      ? '<p>Still open:</p><ul class="reveals">' + reveals.map((move) => "<li>" + esc(label(move)) + "</li>").join("") + "</ul>"
      : "";
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.id = "overlay";
    overlay.innerHTML =
      '<div class="sheet"><p class="eyebrow">Chain over</p><h2>' + count + (count === 1 ? " LINK" : " LINKS") +
      "</h2><p>" + esc(reason) + "</p>" +
      revealHtml +
      '<div class="overlay-actions"><button class="btn primary" id="again">New chain</button><button class="btn ghost" id="home">Menu</button></div></div>';
    document.body.appendChild(overlay);
    beep(392, 0.1);
    document.getElementById("home").onclick = () => {
      overlay.remove();
      showHome();
    };
    document.getElementById("again").onclick = () => {
      overlay.remove();
      state.overlay = null;
      state.starter = 0;
      startRound();
    };
    document.getElementById("again").focus();
  }

  function finishRound(winner, reason, reveals) {
    if (state.overlay) return;
    stopClock();
    clearCpu();
    state.locked = true;
    state.overlay = "round";
    state.scores[winner] += 1;
    const matchOver = state.scores[winner] >= state.target;
    state.starter = 1 - winner;
    renderScores();
    const revealHtml = reveals.length
      ? '<p>Still open:</p><ul class="reveals">' + reveals.map((move) => "<li>" + esc(label(move)) + "</li>").join("") + "</ul>"
      : "";
    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.id = "overlay";
    overlay.innerHTML =
      '<div class="sheet"><p class="eyebrow">' + (matchOver ? "Match over" : "Round " + state.round) + "</p><h2>" +
      esc(matchOver ? state.names[winner] + " WINS" : state.names[winner] + " TAKES IT") +
      "</h2><p>" + esc(reason) + " Score " + state.scores[0] + "–" + state.scores[1] + ".</p>" +
      revealHtml +
      '<div class="overlay-actions">' +
      (matchOver
        ? '<button class="btn primary" id="again">Play again</button><button class="btn ghost" id="home">Menu</button>'
        : '<button class="btn primary" id="next">Next round</button><button class="btn ghost" id="home">Menu</button>') +
      "</div></div>";
    document.body.appendChild(overlay);
    document.getElementById("home").onclick = () => {
      overlay.remove();
      showHome();
    };
    if (matchOver) {
      beep(523, 0.1);
      setTimeout(() => beep(659, 0.12), 120);
      setTimeout(() => beep(784, 0.16), 240);
      document.getElementById("again").onclick = () => {
        overlay.remove();
        state.scores = [0, 0];
        state.starter = 0;
        state.round = 0;
        state.overlay = null;
        startRound();
      };
      document.getElementById("again").focus();
    } else {
      beep(392, 0.1);
      document.getElementById("next").onclick = () => {
        overlay.remove();
        state.overlay = null;
        startRound();
      };
      document.getElementById("next").focus();
    }
  }

  showHome();
})();
