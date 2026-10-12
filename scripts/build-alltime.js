const fs = require("fs");
const https = require("https");
const path = require("path");

const root = path.join(__dirname, "..");
const rosterDir = path.join(root, "data", "hist-rosters");
const priorPath = path.join(root, "data", "roster.json");
const playersPath = path.join(root, "data", "players.csv");

const COLLEGE_MAP = {
  "Miami (FL)": "Miami",
  "Miami (Fla.)": "Miami",
  "Miami (Ohio)": "Miami (OH)",
  "Miami (OH)": "Miami (OH)",
  "Southern California": "USC",
  Mississippi: "Ole Miss",
  California: "Cal",
  "California-Berkeley": "Cal",
  Pittsburgh: "Pitt",
  "Texas Christian": "TCU",
  "Brigham Young": "BYU",
  "Central Florida": "UCF",
  "Southern Mississippi": "Southern Miss",
  "North Carolina State": "NC State",
  "Louisiana State": "LSU",
  "Hawai'i": "Hawaii",
  Hawaii: "Hawaii",
  "Texas A&M": "Texas A&M",
  "Southern Methodist": "SMU",
  "Nevada-Las Vegas": "UNLV",
  "Louisiana-Lafayette": "Louisiana",
  "Louisiana Lafayette": "Louisiana",
  "Louisiana-Monroe": "ULM",
  "Texas-El Paso": "UTEP",
  "Texas-San Antonio": "UTSA",
  "Florida Atlantic": "FAU",
  "Florida International": "FIU",
  "Alabama-Birmingham": "UAB",
  "Bowling Green State": "Bowling Green",
  "Pennsylvania State": "Penn State",
  "Ohio St.": "Ohio State",
  "Michigan St.": "Michigan State",
  "Florida St.": "Florida State",
  "Arizona St.": "Arizona State",
  "Oklahoma St.": "Oklahoma State",
  "Iowa St.": "Iowa State",
  "Kansas St.": "Kansas State",
  "Oregon St.": "Oregon State",
  "Washington St.": "Washington State",
  "Fresno St.": "Fresno State",
  "Boise St.": "Boise State",
  "Colorado St.": "Colorado State",
  "San Diego St.": "San Diego State",
  "San Jose St.": "San Jose State",
  "Utah St.": "Utah State",
  "Appalachian St.": "Appalachian State",
  "Arkansas St.": "Arkansas State",
  "Ball St.": "Ball State",
  "Kent St.": "Kent State",
  "Middle Tennessee State": "Middle Tennessee",
  "North Dakota St.": "North Dakota State",
  "South Dakota St.": "South Dakota State",
  "Mississippi St.": "Mississippi State",
  "None": "",
  "No College": "",
};

const COLLEGE_LOGOS = {
  Alabama: 333, "Ohio State": 194, Georgia: 61, LSU: 99, Clemson: 228, Michigan: 130,
  "Notre Dame": 87, Oregon: 2483, "Penn State": 213, Texas: 251, USC: 30, Oklahoma: 201,
  Washington: 264, Tennessee: 2633, Wisconsin: 275, Florida: 57, Miami: 2390, "Texas A&M": 245,
  Auburn: 2, "Ole Miss": 145, "Florida State": 52, "Michigan State": 127, "Texas Tech": 2641,
  Iowa: 2294, Stanford: 24, UCLA: 26, Colorado: 38, BYU: 252, "Boise State": 68,
  "Oklahoma State": 197, "Iowa State": 66, "North Carolina": 153, Maryland: 120, SMU: 2567,
  Cincinnati: 2132, Louisville: 97, Arkansas: 8, Kentucky: 96, Missouri: 142, Pitt: 221,
  Arizona: 12, "Arizona State": 9, "Boston College": 103, Cal: 25, Purdue: 2509, Utah: 254,
  "Utah State": 328, Wyoming: 2751, "Fresno State": 278, Memphis: 235, UCF: 2116,
  "Georgia Tech": 59, Nevada: 2440, Duke: 150, "Virginia Tech": 259, Indiana: 84, TCU: 2628,
  "NC State": 152, "South Carolina": 2579, "Mississippi State": 344, Nebraska: 158,
  "Kansas State": 2306, "West Virginia": 277, Baylor: 239, "Oregon State": 204, Illinois: 356,
  Rutgers: 164, Minnesota: 135, "Colorado State": 36, "South Dakota State": 2571,
  "Wake Forest": 154, Virginia: 258, Houston: 248, Northwestern: 77, Syracuse: 183,
  Temple: 218, Tulane: 2655, Vanderbilt: 238, "Washington State": 265, Liberty: 2335,
  "North Dakota State": 2449, "Appalachian State": 2026, "San Diego State": 21, Kansas: 2305,
  "Air Force": 2005, Army: 349, Navy: 2426, "Western Michigan": 2711, Toledo: 2649,
  "Miami (OH)": 193, Ohio: 195, Marshall: 276, Rice: 242, Hawaii: 62, "San Jose State": 23,
  "New Mexico": 167, "Boston College": 103, Wisconsin: 275, "Texas Tech": 2641,
};

function franchise(abbr, season) {
  const year = Number(season) || 0;
  const code = String(abbr || "").toUpperCase();
  if (!code) return "";
  if (code === "HOU" && year && year < 2002) return "TEN";
  if (code === "HST" && year && year < 2002) return "TEN";
  if (code === "BAL" && year && year < 1996) return "IND";
  if (code === "BLT" && year && year < 1996) return "IND";
  if (code === "STL" && year && year < 1988) return "ARI";
  if (code === "SL" && year && year < 1988) return "ARI";
  const map = {
    ARI: "ARI", ATL: "ATL", BAL: "BAL", BUF: "BUF", CAR: "CAR", CHI: "CHI", CIN: "CIN", CLE: "CLE",
    DAL: "DAL", DEN: "DEN", DET: "DET", GB: "GB", HOU: "HOU", IND: "IND", JAX: "JAX", KC: "KC",
    LA: "LAR", LAC: "LAC", LAR: "LAR", LV: "LV", MIA: "MIA", MIN: "MIN", NE: "NE", NO: "NO",
    NYG: "NYG", NYJ: "NYJ", PHI: "PHI", PIT: "PIT", SEA: "SEA", SF: "SF", TB: "TB", TEN: "TEN",
    WAS: "WAS", WSH: "WAS", SD: "LAC", OAK: "LV", STL: "LAR", SL: "LAR", PHO: "ARI", CRD: "ARI", ARZ: "ARI",
    BOS: "NE", NWE: "NE", SDG: "LAC", RAM: "LAR", RAI: "LV", OTI: "TEN", CLT: "IND",
    NYT: "NYJ", GNB: "GB", KAN: "KC", NOR: "NO", TAM: "TB", SFO: "SF",
    CLV: "CLE", HST: "HOU", BLT: "BAL", CHB: "CHI", CHC: "ARI", NY: "NYG", COW: "DAL", TEX: "KC", POR: "DET",
    DEC: "CHI", CHS: "CHI",
  };
  return map[code] || "";
}

function collegeName(raw) {
  let trimmed = String(raw || "").trim();
  if (!trimmed || trimmed === "NA" || trimmed === "None" || trimmed === "No College") return "";
  trimmed = trimmed.replace(/ University$/i, "").replace(/^University of /i, "");
  return COLLEGE_MAP[trimmed] || trimmed;
}

function collegeParts(raw) {
  return String(raw || "").split(/[;|/]/).map(collegeName).filter(Boolean);
}

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
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((item) => item.length > 1);
  const index = new Map(header.map((name, i) => [name, i]));
  return body.map((cells) => {
    const record = {};
    for (const [name, i] of index) record[name] = cells[i] || "";
    return record;
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
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

function norm(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function add(set, value) {
  if (value) set.add(value);
}

(async () => {
  fs.mkdirSync(rosterDir, { recursive: true });
  const release = JSON.parse(fs.readFileSync(path.join(root, "data", "rosters-release.json"), "utf8"));
  const files = release.assets.filter((asset) => /^roster_\d{4}\.csv$/.test(asset.name));
  let downloaded = 0;
  await pool(files, 6, async (asset) => {
    const dest = path.join(rosterDir, asset.name);
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
      const body = await get(asset.browser_download_url);
      fs.writeFileSync(dest, body);
    }
    downloaded += 1;
    if (downloaded % 20 === 0) console.log("rosters", downloaded, "/", files.length);
  });
  console.log("rosters ready", files.length);

  const career = new Map();
  const byNameBirth = new Map();
  const unmapped = new Map();

  function ensure(key) {
    let entry = career.get(key);
    if (!entry) {
      entry = { numbers: new Set(), teams: new Set(), colleges: new Set(), seasons: new Set(), name: "", position: "", image: "", birth: "" };
      career.set(key, entry);
    }
    return entry;
  }

  function absorb(target, sourceKey) {
    const source = career.get(sourceKey);
    if (!source || source === target) return;
    for (const number of source.numbers) target.numbers.add(number);
    for (const team of source.teams) target.teams.add(team);
    for (const school of source.colleges) target.colleges.add(school);
    for (const season of source.seasons) target.seasons.add(season);
    if (!target.name) target.name = source.name;
    if (!target.position) target.position = source.position;
    if (!target.image) target.image = source.image;
    career.delete(sourceKey);
  }

  for (const asset of files) {
    const rows = parseCsv(fs.readFileSync(path.join(rosterDir, asset.name), "utf8"));
    for (const row of rows) {
      const nb = row.full_name && row.birth_date ? norm(row.full_name) + "|" + row.birth_date : "";
      let key = row.gsis_id ? "id:" + row.gsis_id : nb ? "nb:" + nb : "";
      if (!key) continue;
      if (nb) {
        const prev = byNameBirth.get(nb);
        if (row.gsis_id && prev && prev !== key) absorb(ensure(key), prev);
        if (!prev || row.gsis_id) byNameBirth.set(nb, key);
        else if (String(prev).startsWith("id:")) key = prev;
      }
      const entry = ensure(key);
      if (row.full_name) entry.name = row.full_name;
      if (row.position) entry.position = row.position;
      if (row.headshot_url) entry.image = row.headshot_url;
      if (row.birth_date) entry.birth = row.birth_date;
      if (row.season) entry.seasons.add(Number(row.season));
      for (const school of collegeParts(row.college)) entry.colleges.add(school);
      const number = Number(row.jersey_number);
      const year = Number(row.season) || 0;
      if (Number.isInteger(number) && number >= 0 && number <= 99 && !(number === 0 && year < 2023)) entry.numbers.add(number);
      const code = String(row.team || "").toUpperCase();
      const team = franchise(row.team, row.season);
      if (team) entry.teams.add(team);
      else if (code === "P-P") {
        entry.teams.add("PHI");
        entry.teams.add("PIT");
      } else if (code === "C-P") {
        entry.teams.add("ARI");
        entry.teams.add("PIT");
      } else if (row.team) unmapped.set(row.team, (unmapped.get(row.team) || 0) + 1);
    }
  }
  console.log("career ids", career.size);
  console.log("unmapped", [...unmapped.entries()].sort((a, b) => b[1] - a[1]).map(([code, count]) => code + ":" + count).join(", "));

  const people = parseCsv(fs.readFileSync(playersPath, "utf8"));
  const prior = JSON.parse(fs.readFileSync(priorPath, "utf8"));
  const priorByKey = new Map();
  const priorNameCount = new Map();
  function remember(key, player) {
    const existing = priorByKey.get(key);
    if (!existing || player.fame < existing.fame) priorByKey.set(key, player);
  }
  for (const player of prior.players) {
    const nameKey = norm(player.name);
    priorNameCount.set(nameKey, (priorNameCount.get(nameKey) || 0) + 1);
    remember(nameKey + "|" + player.position, player);
    remember(nameKey, player);
  }

  const players = [];
  const usedCareer = new Set();

  function materialize(id, name, position, entry, person) {
    const fromRosters = entry || { numbers: new Set(), teams: new Set(), colleges: new Set(), seasons: new Set(), image: "" };
    const numbers = new Set(fromRosters.numbers);
    const teams = new Set(fromRosters.teams);
    const colleges = new Set(fromRosters.colleges);
    let latestTeam = "";
    if (person) {
      const latestNumber = Number(person.jersey_number);
      const lastYear = Number(person.last_season) || 0;
      if (Number.isInteger(latestNumber) && latestNumber >= 0 && latestNumber <= 99 && !(latestNumber === 0 && lastYear < 2023)) numbers.add(latestNumber);
      latestTeam = franchise(person.latest_team, person.last_season);
      if (latestTeam) teams.add(latestTeam);
      for (const school of collegeParts(person.college_name)) colleges.add(school);
    }
    const match = priorByKey.get(norm(name) + "|" + position) || priorByKey.get(norm(name));
    if (match && priorNameCount.get(norm(name)) === 1 && match.fame <= 80) {
      for (const number of match.numbers || []) if (!(number === 0 && !numbers.has(0))) numbers.add(number);
      for (const team of match.teams || []) {
        const mapped = franchise(team, 2026);
        if (mapped) teams.add(mapped);
      }
      for (const school of match.colleges || []) for (const part of collegeParts(school)) colleges.add(part);
      for (const part of collegeParts(match.college)) colleges.add(part);
    }
    if (!numbers.size && !teams.size && !colleges.size) return;
    const seasonCount = fromRosters.seasons ? fromRosters.seasons.size : 0;
    const years = seasonCount || Number(person && person.years_of_experience) || 1;
    const round = Number(person && person.draft_round) || 8;
    let fame = Math.round(36 + round * 14 + Math.max(0, 10 - years) * 6);
    if (match && priorNameCount.get(norm(name)) === 1 && match.fame <= 80) fame = match.fame;
    const collegeList = [...colleges].filter(Boolean).sort();
    const teamList = [...teams].sort();
    players.push({
      id,
      name,
      numbers: [...numbers].sort((a, b) => a - b),
      college: collegeList[0] || "",
      colleges: collegeList,
      position: position || "ATH",
      team: latestTeam || teamList[teamList.length - 1] || "",
      teams: teamList,
      image: (person && person.headshot) || fromRosters.image || (person && person.espn_id ? "https://a.espncdn.com/i/headshots/nfl/players/full/" + person.espn_id + ".png" : ""),
      fallback: "",
      fame,
    });
  }

  for (const person of people) {
    const id = person.gsis_id;
    const name = person.display_name || person.football_name;
    if (!id || !name) continue;
    const nb = person.birth_date ? norm(name) + "|" + person.birth_date : "";
    const idKey = "id:" + id;
    const named = nb ? byNameBirth.get(nb) : "";
    if (named && named !== idKey && career.has(named)) {
      absorb(ensure(idKey), named);
      if (nb) byNameBirth.set(nb, idKey);
    }
    const careerKey = career.has(idKey) ? idKey : named || "";
    if (careerKey) usedCareer.add(careerKey);
    materialize(id, name, person.position || "", career.get(careerKey), person);
  }

  for (const [key, entry] of career) {
    if (usedCareer.has(key) || !entry.name) continue;
    const slug = norm(entry.name).replace(/ /g, "-") + "-" + (entry.birth || key).replace(/[^0-9a-z]+/gi, "");
    materialize("hist-" + slug, entry.name, entry.position, entry, null);
  }

  const samePerson = new Map();
  for (const player of players) {
    if (!player.image) continue;
    const key = norm(player.name) + "|" + player.image;
    if (!samePerson.has(key)) samePerson.set(key, []);
    samePerson.get(key).push(player);
  }
  const drop = new Set();
  for (const group of samePerson.values()) {
    if (group.length < 2) continue;
    const keep = group.slice().sort((a, b) => (b.numbers.length + b.teams.length + b.colleges.length) - (a.numbers.length + a.teams.length + a.colleges.length) || a.fame - b.fame)[0];
    for (const other of group) {
      if (other === keep) continue;
      for (const number of other.numbers) if (!keep.numbers.includes(number)) keep.numbers.push(number);
      for (const team of other.teams) if (!keep.teams.includes(team)) keep.teams.push(team);
      for (const school of other.colleges) if (!keep.colleges.includes(school)) keep.colleges.push(school);
      keep.numbers.sort((a, b) => a - b);
      keep.teams.sort();
      keep.colleges.sort();
      keep.college = keep.colleges[0] || keep.college;
      keep.fame = Math.min(keep.fame, other.fame);
      drop.add(other);
    }
  }

  const knownNumbers = [
    ["Walter Payton", "CHI", 34], ["Jim Brown", "CLE", 32], ["Dick Butkus", "CHI", 51], ["Gale Sayers", "CHI", 40],
    ["Sammy Baugh", "WAS", 33], ["Night Train Lane", "LAR", 81], ["Joe Greene", "PIT", 75], ["Franco Harris", "PIT", 32],
    ["Bronko Nagurski", "CHI", 3], ["Red Grange", "CHI", 77], ["Don Hutson", "GB", 14], ["Ray Nitschke", "GB", 66],
    ["Chuck Bednarik", "PHI", 60], ["Bobby Layne", "DET", 22], ["Y.A. Tittle", "NYG", 14], ["George Blanda", "TEN", 16],
    ["Mike Singletary", "CHI", 50], ["Eric Dickerson", "LAR", 29], ["Earl Campbell", "TEN", 34], ["Deacon Jones", "LAR", 75],
    ["Merlin Olsen", "LAR", 74], ["Bob Lilly", "DAL", 74], ["Paul Hornung", "GB", 5], ["Jim Taylor", "GB", 31],
    ["Raymond Berry", "IND", 82], ["Gino Marchetti", "IND", 89], ["Lenny Moore", "IND", 24], ["Jack Lambert", "PIT", 58],
    ["Jack Ham", "PIT", 59], ["Sid Luckman", "CHI", 42], ["Crazy Legs Hirsch", "LAR", 40], ["Doak Walker", "DET", 37],
    ["Hugh McElhenny", "SF", 39], ["Ollie Matson", "ARI", 33], ["Marion Motley", "CLE", 76], ["Dante Lavelli", "CLE", 86],
    ["Frank Gifford", "NYG", 16], ["Sam Huff", "NYG", 70], ["Herb Adderley", "GB", 26], ["Willie Davis", "GB", 87],
    ["Willie Wood", "GB", 24], ["Paul Warfield", "CLE", 42], ["Lance Alworth", "LAC", 19], ["Bob Hayes", "DAL", 22],
    ["Mel Renfro", "DAL", 20], ["Harvey Martin", "DAL", 79], ["Drew Pearson", "DAL", 88], ["Steve Largent", "SEA", 80],
    ["Art Monk", "WAS", 81], ["James Lofton", "GB", 80], ["Charlie Joiner", "LAC", 18], ["John Stallworth", "PIT", 82],
    ["Lynn Swann", "PIT", 88], ["Dan Fouts", "LAC", 14], ["Sonny Jurgensen", "WAS", 9], ["Norm Van Brocklin", "PHI", 11],
  ];
  for (const player of players) {
    if (drop.has(player) || player.numbers.length) continue;
    for (const [name, team, number] of knownNumbers) {
      if (player.name === name && player.teams.includes(team)) player.numbers = [number];
    }
  }

  const booked = players.filter((player) => !drop.has(player));
  booked.sort((a, b) => a.fame - b.fame || a.name.localeCompare(b.name));
  players.length = 0;
  players.push(...booked);
  const collegeNames = new Set(players.flatMap((player) => player.colleges));
  const roster = {
    generated: "2026-10-12",
    players,
    colleges: [...collegeNames].sort().map((name) => ({
      name,
      logo: COLLEGE_LOGOS[name] ? "https://a.espncdn.com/i/teamlogos/ncaa/500/" + COLLEGE_LOGOS[name] + ".png" : "",
    })),
  };
  fs.writeFileSync(path.join(root, "data", "roster.json"), JSON.stringify(roster));
  fs.writeFileSync(path.join(root, "js", "roster.js"), "window.ROSTER=" + JSON.stringify(roster) + ";\n");
  const watch = ["Jerry Rice", "Bart Starr", "Jim Brown", "Johnny Unitas", "Jahmyr Gibbs", "Patrick Mahomes", "Tom Brady", "Dick Butkus"];
  for (const name of watch) {
    const found = players.filter((player) => player.name === name);
    for (const player of found) {
      console.log(player.name, player.position, "fame", player.fame, "nums", player.numbers.join(","), "schools", player.colleges.join(" | "), "teams", player.teams.join(","));
    }
    if (!found.length) console.log("MISSING", name);
  }
  console.log("players", players.length, "colleges", roster.colleges.length, "roster.js bytes", fs.statSync(path.join(root, "js", "roster.js")).size);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
