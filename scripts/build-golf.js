const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");

const CATEGORIES = [
  ["pass_yds", "Career passing yards", "passing_yards", "off"],
  ["pass_td", "Career passing touchdowns", "passing_tds", "off"],
  ["int_thrown", "Career interceptions thrown", "interceptions", "off"],
  ["rush_yds", "Career rushing yards", "rushing_yards", "off"],
  ["rush_td", "Career rushing touchdowns", "rushing_tds", "off"],
  ["rec", "Career receptions", "receptions", "off"],
  ["rec_yds", "Career receiving yards", "receiving_yards", "off"],
  ["rec_td", "Career receiving touchdowns", "receiving_tds", "off"],
  ["sacks", "Career sacks", "def_sacks", "def"],
  ["int_caught", "Career interceptions", "def_interceptions", "def"],
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows[0];
  return rows.slice(1).filter((item) => item.length > 1).map((item) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = item[index] || "";
    });
    return record;
  });
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const players = new Map();

function ensure(row) {
  const id = row.player_id;
  if (!id) return null;
  let entry = players.get(id);
  if (!entry) {
    entry = {
      id,
      name: "",
      pos: "",
      team: "",
      img: "",
      first: 0,
      last: 0,
      stats: CATEGORIES.map(() => 0),
    };
    players.set(id, entry);
  }
  const season = Number(row.season) || 0;
  const name = row.player_display_name || row.player_name;
  if (name && (!entry.name || season >= entry.last)) entry.name = name;
  if (season && (!entry.first || season < entry.first)) entry.first = season;
  if (season >= entry.last) {
    if (row.position) entry.pos = row.position;
    const team = row.recent_team || row.team;
    if (team) entry.team = team;
    if (row.headshot_url) entry.img = row.headshot_url;
    entry.last = season;
  }
  return entry;
}

function addFile(file, side) {
  const rows = parseCsv(fs.readFileSync(path.join(root, "data", file), "utf8"));
  let min = 9999;
  let max = 0;
  for (const row of rows) {
    if (row.season_type !== "REG") continue;
    const season = Number(row.season) || 0;
    if (season && season < min) min = season;
    if (season > max) max = season;
    const entry = ensure(row);
    if (!entry) continue;
    CATEGORIES.forEach((category, index) => {
      if (category[3] !== side) return;
      entry.stats[index] += num(row[category[2]]);
    });
  }
  console.log(file, "seasons", min, max, "rows", rows.length);
}

addFile("player_stats.csv", "off");
addFile("player_stats_def.csv", "def");

const booked = [...players.values()].filter((player) => player.name && player.stats.some((value) => value > 0));
for (const player of booked) {
  player.stats = player.stats.map((value) => Math.round(value * 10) / 10);
  player.stats = player.stats.map((value) => Number.isInteger(value) ? value : Math.round(value * 10) / 10);
}
booked.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

const golf = {
  generated: "2026-10-15",
  span: "Regular-season career totals, " + Math.min(...booked.map((player) => player.first).filter(Boolean)) + "–" + Math.max(...booked.map((player) => player.last)) + ".",
  categories: CATEGORIES.map(([id, label]) => ({ id, label })),
  players: booked.map((player) => ({
    id: player.id,
    name: player.name,
    pos: player.pos || "ATH",
    team: player.team,
    first: player.first,
    last: player.last,
    img: player.img,
    stats: player.stats,
  })),
};

const out = path.join(root, "js", "golf-stats.js");
fs.writeFileSync(out, "window.GOLF_STATS=" + JSON.stringify(golf) + ";\n");

function show(name, stat) {
  const index = CATEGORIES.findIndex((category) => category[0] === stat);
  for (const player of golf.players) {
    if (player.name === name) console.log(name, player.pos, player.team, CATEGORIES[index][1], player.stats[index]);
  }
}
show("Antonio Brown", "rec_yds");
show("Patrick Mahomes", "pass_yds");
show("Tom Brady", "pass_td");
show("J.J. Watt", "sacks");
console.log("players", golf.players.length, "bytes", fs.statSync(out).size);
