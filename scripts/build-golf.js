const fs = require("fs");
const https = require("https");
const path = require("path");
const zlib = require("zlib");

const root = path.join(__dirname, "..");

const CATEGORIES = [
  ["pass_yds", "Career passing yards", "passing_yards", "reg"],
  ["pass_td", "Career passing touchdowns", "passing_tds", "reg"],
  ["int_thrown", "Career interceptions thrown", "passing_interceptions", "reg"],
  ["rush_yds", "Career rushing yards", "rushing_yards", "reg"],
  ["rush_td", "Career rushing touchdowns", "rushing_tds", "reg"],
  ["rec", "Career receptions", "receptions", "reg"],
  ["rec_yds", "Career receiving yards", "receiving_yards", "reg"],
  ["rec_td", "Career receiving touchdowns", "receiving_tds", "reg"],
  ["sacks", "Career sacks", "def_sacks", "reg"],
  ["int_caught", "Career interceptions", "def_interceptions", "reg"],
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

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "football-chain", Accept: "application/vnd.github+json" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(get(res.headers.location));
        return;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        reject(new Error(res.statusCode + " " + url));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("timeout " + url)));
  });
}

async function pool(items, limit, worker) {
  const queue = items.slice();
  await Promise.all(Array.from({ length: limit }, async () => {
    while (queue.length) await worker(queue.shift());
  }));
}

const PAGE_STATS = {
  passing: { pass_yds: 0, pass_td: 1, pass_int: 2 },
  rushing: { rush_yds: 3, rush_td: 4 },
  receiving: { rec: 5, rec_yds: 6, rec_td: 7 },
  defense: { sacks: 8, def_int: 9 },
};

const TEAM_CODES = {
  SDG: "LAC",
  SD: "LAC",
  RAM: "LAR",
  RAI: "LV",
  OAK: "LV",
  NWE: "NE",
  GNB: "GB",
  SFO: "SF",
  KAN: "KC",
  TAM: "TB",
  NOR: "NO",
  CLT: "IND",
  CRD: "ARI",
  PHO: "ARI",
  ARZ: "ARI",
  HTX: "HOU",
  WSH: "WAS",
  STL: "LAR",
};

function teamCode(value) {
  const code = String(value || "").toUpperCase();
  if (!code || /^\d+TM$/.test(code) || code === "TOT") return "";
  return TEAM_CODES[code] || code;
}

function shortPos(value) {
  const pos = String(value || "").toUpperCase();
  if (!pos) return "";
  if (pos.includes("LB")) return "LB";
  if (pos === "FS" || pos === "SS" || pos === "DB" || pos.includes("SAF")) return "S";
  if (pos.includes("CB")) return "CB";
  if (pos === "DE" || pos === "LDE" || pos === "RDE" || pos === "EDGE") return "DE";
  if (pos === "NT" || pos === "LDT" || pos === "RDT" || pos === "DT") return "DT";
  if (["QB", "RB", "FB", "WR", "TE", "K", "P", "OL", "OT", "OG", "C", "DL"].includes(pos)) return pos;
  return pos.length <= 3 ? pos : "";
}

function section(html, id) {
  const start = html.search(new RegExp('<table\\b[^>]*\\bid="' + id + '"', "i"));
  if (start < 0) return "";
  const rest = html.slice(start + 6);
  const next = rest.search(/<table\b|<\/table>/i);
  return next < 0 ? html.slice(start) : html.slice(start, start + 6 + next);
}

function pageSection(html, id) {
  const raw = section(html, id);
  if (raw.includes("data-append-csv")) return raw;
  return section(html.replace(/<!--/g, "").replace(/-->/g, ""), id);
}

function rowRecords(sectionHtml) {
  const records = [];
  const re = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  while ((match = re.exec(sectionHtml))) {
    const row = match[1];
    if (!row.includes("data-append-csv")) continue;
    const fields = {};
    let i = 0;
    while (i < row.length) {
      const start = row.indexOf("<", i);
      if (start < 0) break;
      if (row[start + 1] === "/") {
        i = start + 1;
        continue;
      }
      let j = start + 1;
      let quote = "";
      while (j < row.length) {
        const ch = row[j];
        if (quote) {
          if (ch === quote) quote = "";
        } else if (ch === '"' || ch === "'") quote = ch;
        else if (ch === ">") break;
        j++;
      }
      if (j >= row.length) break;
      const attrs = row.slice(start, j);
      const rest = row.slice(j + 1);
      const closeAt = rest.search(/<\/t[dh]>/i);
      const inner = closeAt < 0 ? "" : rest.slice(0, closeAt);
      const stat = (attrs.match(/\bdata-stat="([^"]*)"/) || [])[1];
      if (stat) {
        const pid = (attrs.match(/\bdata-append-csv="([^"]+)"/) || [])[1] || "";
        const text = inner
          .replace(/<[^>]+>/g, " ")
          .replace(/[*+]/g, "")
          .replace(/,/g, "")
          .replace(/\s+/g, " ")
          .trim();
        fields[stat] = { id: pid, text };
      }
      i = closeAt < 0 ? row.length : j + 1 + closeAt;
    }
    const who = fields.player || fields.name_display;
    if (!who || !who.id) continue;
    records.push({
      id: who.id,
      name: who.text,
      pos: shortPos((fields.pos || {}).text || ""),
      team: ((fields.team_name_abbr || fields.team || {}).text || "").toUpperCase(),
      fields,
    });
  }
  return records;
}

function parseSeason(html, kind, year, only) {
  const columns = only || PAGE_STATS[kind];
  const grouped = new Map();
  for (const record of rowRecords(pageSection(html, kind))) {
    if (!grouped.has(record.id)) grouped.set(record.id, []);
    grouped.get(record.id).push(record);
  }
  const parsed = [];
  for (const [id, list] of grouped) {
    const combined = list.filter((row) => /^\d+TM$/.test(row.team) || row.team === "TOT");
    const statRows = combined.length ? combined : list;
    const labeled = list.filter((row) => row.team && !/^\d+TM$/.test(row.team) && row.team !== "TOT");
    const label = labeled[labeled.length - 1] || statRows[statRows.length - 1];
    const stats = CATEGORIES.map(() => 0);
    for (const row of statRows) {
      for (const [column, index] of Object.entries(columns)) {
        if (column === "sacks" && year < 1982) continue;
        const value = Number(row.fields[column] && row.fields[column].text);
        if (Number.isFinite(value)) stats[index] += value;
      }
    }
    if (!stats.some((value) => value > 0)) continue;
    parsed.push({
      id,
      name: label.name,
      pos: label.pos,
      team: teamCode(label.team),
      stats,
    });
  }
  return parsed;
}

function decodeBody(buffer, encoding) {
  const kind = String(encoding || "").toLowerCase();
  const gzip = kind.includes("gzip") || (buffer.length > 2 && buffer[0] === 0x1f && buffer[1] === 0x8b);
  if (gzip) return zlib.gunzipSync(buffer).toString("utf8");
  if (kind.includes("br")) return zlib.brotliDecompressSync(buffer).toString("utf8");
  if (kind.includes("deflate")) return zlib.inflateSync(buffer).toString("utf8");
  return buffer.toString("utf8");
}

function getPage(url, depth = 0) {
  return new Promise((resolve, reject) => {
    if (depth > 5) {
      reject(new Error("redirects " + url));
      return;
    }
    const req = https.get(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "text/html" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(getPage(new URL(res.headers.location, url).href, depth + 1));
        return;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        reject(new Error(res.statusCode + " " + url));
        return;
      }
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        try {
          resolve(decodeBody(Buffer.concat(chunks), res.headers["content-encoding"]));
        } catch (error) {
          reject(error);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(45000, () => req.destroy(new Error("timeout " + url)));
  });
}

let nextRequestAt = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitTurn() {
  const now = Date.now();
  const start = Math.max(now, nextRequestAt);
  nextRequestAt = start + 900;
  if (start > now) await sleep(start - now);
}

async function loadSeasonPage(year, kind) {
  const dir = path.join(root, "data", "pfr-seasons");
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, year + "-" + kind + ".html");
  const missing = dest + ".missing";
  if (fs.existsSync(missing)) return "";
  if (fs.existsSync(dest)) {
    const cached = fs.readFileSync(dest, "utf8");
    if (cached.includes("</html>") && cached.includes("data-append-csv")) return cached;
  }
  const url = "https://web.archive.org/web/20261015120000id_/https://www.pro-football-reference.com/years/" + year + "/" + kind + ".htm";
  let reason = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    await waitTurn();
    let last = "";
    try {
      last = await getPage(url);
    } catch (error) {
      reason = error.message;
      nextRequestAt = Math.max(nextRequestAt, Date.now() + 12000);
      continue;
    }
    if (last.includes("</html>") && last.includes("data-append-csv")) {
      fs.writeFileSync(dest, last);
      return last;
    }
    if (last.includes("</html>")) {
      fs.writeFileSync(missing, "missing\n");
      return "";
    }
    reason = "incomplete page";
    nextRequestAt = Math.max(nextRequestAt, Date.now() + 8000);
  }
  const fallback = await archivedCopy(year, kind);
  if (fallback) {
    fs.writeFileSync(dest, fallback);
    return fallback;
  }
  console.log("failed", year, kind, reason);
  return "";
}

async function archivedCopy(year, kind) {
  const cdx = "https://web.archive.org/cdx/search/cdx?url=pro-football-reference.com/years/" + year + "/" + kind + ".htm&output=json&fl=timestamp,statuscode&filter=statuscode:200&limit=-6";
  let body = "";
  try {
    await waitTurn();
    body = await getPage(cdx);
  } catch (error) {
    return "";
  }
  let rows = [];
  try {
    rows = JSON.parse(body).slice(1);
  } catch (error) {
    return "";
  }
  for (let i = rows.length - 1; i >= 0; i--) {
    const stamp = rows[i][0];
    const url = "https://web.archive.org/web/" + stamp + "id_/https://www.pro-football-reference.com/years/" + year + "/" + kind + ".htm";
    try {
      await waitTurn();
      const html = await getPage(url);
      if (html.includes("</html>") && html.includes("data-append-csv")) return html;
    } catch (error) {
      nextRequestAt = Math.max(nextRequestAt, Date.now() + 8000);
    }
  }
  return "";
}

function blank(id, name) {
  return {
    id,
    name: name || "",
    pos: "",
    team: "",
    img: "",
    first: 0,
    last: 0,
    stats: CATEGORIES.map(() => 0),
  };
}

async function historicalPlayers() {
  const jobs = [];
  for (let year = 1920; year <= 1998; year++) {
    for (const kind of ["passing", "rushing", "receiving", "defense"]) jobs.push({ year, kind });
  }
  const hist = new Map();
  function fold(list, year) {
    for (const row of list) {
      let entry = hist.get(row.id);
      if (!entry) {
        entry = blank("pfr:" + row.id, row.name);
        entry.pfr = row.id;
        hist.set(row.id, entry);
      }
      if (!entry.first || year < entry.first) entry.first = year;
      if (year >= entry.last) {
        if (row.name) entry.name = row.name;
        if (row.pos) entry.pos = row.pos;
        if (row.team) entry.team = row.team;
        entry.last = year;
      }
      row.stats.forEach((value, index) => {
        entry.stats[index] += value;
      });
    }
  }

  const rushingHtml = new Map();
  const haveReceiving = new Set();
  let done = 0;
  let passingYears = 0;
  await sleep(15000);
  await pool(jobs, 2, async (job) => {
    const html = await loadSeasonPage(job.year, job.kind);
    if (html) {
      if (job.kind === "passing") passingYears += 1;
      if (job.kind === "receiving") haveReceiving.add(job.year);
      if (job.kind === "rushing") rushingHtml.set(job.year, html);
      fold(parseSeason(html, job.kind, job.year), job.year);
    }
    done += 1;
    if (done % 25 === 0 || done === jobs.length) console.log("history pages", done, "/", jobs.length);
  });
  for (let year = 1920; year <= 1998; year++) {
    if (!haveReceiving.has(year) && rushingHtml.has(year)) {
      fold(parseSeason(rushingHtml.get(year), "rushing", year, { rec: 5, rec_yds: 6, rec_td: 7 }), year);
    }
  }
  console.log("passing years", passingYears, "historical players", hist.size);
  return hist;
}

function pfrIndex() {
  const file = path.join(root, "data", "players.csv");
  const byPfr = new Map();
  for (const row of parseCsv(fs.readFileSync(file, "utf8"))) {
    if (!row.pfr_id || !row.gsis_id || byPfr.has(row.pfr_id)) continue;
    byPfr.set(row.pfr_id, {
      gsis: row.gsis_id,
      name: row.display_name,
      pos: row.position || "",
      img: row.headshot || "",
    });
  }
  return byPfr;
}

function mergeHistory(hist) {
  const index = pfrIndex();
  let joined = 0;
  let added = 0;
  for (const entry of hist.values()) {
    const known = index.get(entry.pfr);
    const modern = known && players.get(known.gsis);
    if (modern) {
      entry.stats.forEach((value, index) => {
        modern.stats[index] += value;
      });
      if (entry.first && (!modern.first || entry.first < modern.first)) modern.first = entry.first;
      joined += 1;
      continue;
    }
    if (known) {
      if (known.name) entry.name = known.name;
      if (known.pos) entry.pos = known.pos;
      if (known.img) entry.img = known.img;
      entry.id = known.gsis;
    }
    if (!entry.name || players.has(entry.id)) continue;
    players.set(entry.id, entry);
    added += 1;
  }
  console.log("history joined", joined, "added", added);
}

function addFile(file) {
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  let min = 9999;
  let max = 0;
  for (const row of rows) {
    if (row.season_type && row.season_type !== "REG") continue;
    const season = Number(row.season) || 0;
    if (season && season < min) min = season;
    if (season > max) max = season;
    const entry = ensure(row);
    if (!entry) continue;
    CATEGORIES.forEach((category, index) => {
      entry.stats[index] += num(row[category[2]]);
    });
  }
  console.log(path.basename(file), "seasons", min, max, "rows", rows.length);
}

async function main() {
  const release = JSON.parse((await get("https://api.github.com/repos/nflverse/nflverse-data/releases/tags/stats_player")).toString("utf8"));
  const assets = release.assets.filter((asset) => /^stats_player_reg_\d{4}\.csv$/.test(asset.name));
  const dir = path.join(root, "data", "stat-seasons");
  fs.mkdirSync(dir, { recursive: true });
  const refreshFrom = new Date().getFullYear() - 1;
  await pool(assets, 6, async (asset) => {
    const dest = path.join(dir, asset.name);
    const year = Number(asset.name.slice(-8, -4));
    if (!fs.existsSync(dest) || year >= refreshFrom) {
      fs.writeFileSync(dest, await get(asset.browser_download_url));
    }
    addFile(dest);
  });
  mergeHistory(await historicalPlayers());

  const booked = [...players.values()].filter((player) => player.name && player.stats.some((value) => value > 0));
  for (const player of booked) {
    player.stats = player.stats.map((value) => {
      const rounded = Math.round(value * 10) / 10;
      return Number.isInteger(rounded) ? rounded : rounded;
    });
  }
  booked.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const from = Math.min(...booked.map((player) => player.first).filter(Boolean));
  const to = Math.max(...booked.map((player) => player.last));
  const span = from <= 1932
    ? "Regular-season totals, all-time through the latest week on record."
    : "Regular-season totals, " + from + "–" + to + ", through the latest week on record.";

  const golf = {
    generated: "2026-10-15",
    span,
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
      if (player.name === name) console.log(name, player.pos, player.team, player.first + "-" + player.last, CATEGORIES[index][1], player.stats[index]);
    }
  }
  function rank(name, stat) {
    const index = CATEGORIES.findIndex((category) => category[0] === stat);
    const board = golf.players
      .filter((player) => player.stats[index] > 0)
      .sort((a, b) => b.stats[index] - a.stats[index] || a.name.localeCompare(b.name));
    const place = board.findIndex((player) => player.name === name);
    const player = board[place];
    console.log(
      name,
      stat,
      place < 0 ? "MISSING" : "#" + (place + 1) + " " + player.stats[index] + " " + player.first + "-" + player.last + " " + player.team
    );
  }
  show("Antonio Brown", "rec_yds");
  show("Patrick Mahomes", "pass_yds");
  show("Justin Herbert", "pass_yds");
  show("Tom Brady", "pass_td");
  show("J.J. Watt", "sacks");
  rank("Tom Brady", "pass_yds");
  rank("Dan Marino", "pass_yds");
  rank("John Elway", "pass_yds");
  rank("Fran Tarkenton", "pass_yds");
  rank("Jerry Rice", "rec_yds");
  rank("Emmitt Smith", "rush_yds");
  rank("Jim Brown", "rush_yds");
  rank("Bruce Smith", "sacks");
  console.log("marino rows", golf.players.filter((player) => player.name === "Dan Marino").length);
  console.log("rice rows", golf.players.filter((player) => player.name === "Jerry Rice").length);
  console.log("from", from, "span", span);
  console.log("players", golf.players.length, "bytes", fs.statSync(out).size);
}

function checkPages() {
  const passing = parseSeason(fs.readFileSync(path.join(root, "data", "pfr-1975-passing.html"), "utf8"), "passing", 1975);
  console.log("ken", passing.find((row) => row.name === "Ken Anderson"));
  console.log("doug", passing.find((row) => row.id === "DougBo00"));
  const defense = parseSeason(fs.readFileSync(path.join(root, "data", "pfr-seasons-test-1990-defense.html"), "utf8"), "defense", 1990);
  defense.sort((a, b) => b.stats[8] - a.stats[8]);
  console.log("sack leader", defense[0]);
  console.log("def counted", defense.length);
}

if (process.argv[2] === "--check") {
  checkPages();
} else {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

