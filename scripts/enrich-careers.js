const fs = require("fs");
const https = require("https");
const path = require("path");

const root = path.join(__dirname, "..");
const rosterPath = path.join(root, "data", "roster.json");
const cachePath = path.join(root, "data", "career-cache.json");

const PAST_NUMBERS = {
  "Jahmyr Gibbs": [26, 0],
  "Aaron Rodgers": [12, 8],
  "Odell Beckham": [13, 3],
  "Stefon Diggs": [14, 1],
  "Calvin Ridley": [18, 0],
  "Brian Burns": [53, 0],
  "Roquan Smith": [58, 0],
  "Josh Jacobs": [28, 8],
  "D'Andre Swift": [32, 0],
  "James Conner": [30, 6],
  "Jalen Ramsey": [20, 5],
  "DeAndre Hopkins": [10, 8],
  "Amari Cooper": [19, 2],
  "Deebo Samuel": [19, 1],
  "DJ Moore": [12, 2],
  "Jerry Jeudy": [10, 3],
  "Ezekiel Elliott": [21, 15],
  "Dalvin Cook": [33, 4],
};

const COLLEGE_MAP = {
  "Miami (FL)": "Miami",
  "Miami (Fla.)": "Miami",
  "Miami (OH)": "Miami (OH)",
  "Southern California": "USC",
  Mississippi: "Ole Miss",
  California: "Cal",
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
  "Texas A&amp;M": "Texas A&M",
  "Ole Miss": "Ole Miss",
  "Mississippi State": "Mississippi State",
  "Southern Methodist": "SMU",
  "Louisiana-Lafayette": "Louisiana",
  "Louisiana Lafayette": "Louisiana",
  "UTSA": "UTSA",
  "Texas-San Antonio": "UTSA",
  "Florida Atlantic": "FAU",
  "Appalachian State": "App State",
  "Middle Tennessee": "Middle Tennessee",
  "Georgia Tech": "Georgia Tech",
  "Arizona State": "Arizona State",
  "Washington State": "Washington State",
  "Jackson State": "Jackson State",
  "Incarnate Word": "Incarnate Word",
  "Sacramento State": "Sacramento State",
  "Wake Forest": "Wake Forest",
  "Boston College": "Boston College",
  "North Dakota State": "North Dakota State",
  "South Dakota State": "South Dakota State",
  "Colorado State": "Colorado State",
  "Fresno State": "Fresno State",
  "Boise State": "Boise State",
  "Oklahoma State": "Oklahoma State",
  "Iowa State": "Iowa State",
  "Michigan State": "Michigan State",
  "Florida State": "Florida State",
  "Ohio State": "Ohio State",
  "Penn State": "Penn State",
  "Kansas State": "Kansas State",
  "Oregon State": "Oregon State",
  "Utah State": "Utah State",
  "Ball State": "Ball State",
  "Kent State": "Kent State",
  "San Diego State": "San Diego State",
  "San Jose State": "San Jose State",
  "Eastern Washington": "Eastern Washington",
  "West Alabama": "West Alabama",
  "Western Kentucky": "Western Kentucky",
  "Western Michigan": "Western Michigan",
  "Eastern Michigan": "Eastern Michigan",
  "Central Michigan": "Central Michigan",
  "Northern Illinois": "Northern Illinois",
  "Notre Dame": "Notre Dame",
  "South Carolina": "South Carolina",
  "West Virginia": "West Virginia",
  "NC State": "NC State",
};

const ABBR_FIX = { WSH: "WAS", JAC: "JAX", OAK: "LV", SD: "LAC", STL: "LAR" };

const ADD_COLLEGES = {
  "Russell Wilson": ["NC State"],
  "Baker Mayfield": ["Texas Tech"],
  "Kyler Murray": ["Texas A&M"],
};

const DROP_COLLEGES = {
  "Tyreek Hill": ["West Alabama"],
};

function usableCollege(name) {
  if (!name) return false;
  if (name === "NORTH") return false;
  if (/all-star/i.test(name)) return false;
  return true;
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "User-Agent": "football-chain-fan-game" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(get(res.headers.location));
        return;
      }
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(res.statusCode + " " + url));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(20000, () => req.destroy(new Error("timeout " + url)));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getRetry(url, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      return await get(url);
    } catch (err) {
      last = err;
      await sleep(400 * (i + 1));
    }
  }
  throw last;
}

function teamIdsFromLog(log) {
  const ids = [];
  for (const entry of log.entries || []) {
    for (const stat of entry.statistics || []) {
      if (stat.type === "team" && stat.team && stat.team.$ref) {
        const match = stat.team.$ref.match(/teams\/(\d+)/);
        if (match && !ids.includes(match[1])) ids.push(match[1]);
      }
    }
  }
  return ids;
}

function espnIdFrom(player) {
  const match = String(player.image || "").match(/\/players\/full\/(\d+)\.png/);
  return match ? match[1] : "";
}

async function findEspnId(name) {
  const data = await getRetry(
    "https://site.web.api.espn.com/apis/common/v3/search?limit=5&type=player&query=" + encodeURIComponent(name)
  );
  const items = data.items || [];
  const exact = items.find((item) => item.displayName === name && item.league === "nfl");
  if (exact) return exact.id;
  const nfl = items.find((item) => item.league === "nfl" && item.displayName && item.displayName.replace(/\./g, "") === name.replace(/\./g, ""));
  if (nfl) return nfl.id;
  const any = items.find((item) => item.league === "nfl");
  return any ? any.id : "";
}

function collegeName(team) {
  const loc = team.location || team.shortDisplayName || team.displayName || "";
  return COLLEGE_MAP[loc] || COLLEGE_MAP[team.displayName] || COLLEGE_MAP[team.shortDisplayName] || loc;
}

async function pool(items, limit, worker) {
  const queue = items.slice();
  const runners = Array.from({ length: limit }, async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

(async () => {
  const roster = JSON.parse(fs.readFileSync(rosterPath, "utf8"));
  const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : { nfl: {}, colleges: {}, players: {} };

  if (!Object.keys(cache.nfl).length) {
    try {
      const teams = await getRetry("https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=50");
      for (const item of teams.sports[0].leagues[0].teams) {
        const team = item.team;
        cache.nfl[String(team.id)] = ABBR_FIX[team.abbreviation] || team.abbreviation;
      }
    } catch (err) {
      const list = await getRetry("https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/teams?limit=40");
      const refs = (list.items || []).map((item) => item.$ref).filter(Boolean);
      await pool(refs, 6, async (ref) => {
        const team = await getRetry(ref);
        const id = String(team.id);
        cache.nfl[id] = ABBR_FIX[team.abbreviation] || team.abbreviation;
      });
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache));
    console.log("nfl teams", Object.keys(cache.nfl).length, JSON.stringify(cache.nfl));
  }

  let done = 0;
  await pool(roster.players, 6, async (player) => {
    if (cache.players[player.id]) {
      done += 1;
      return;
    }
    const record = { espnId: espnIdFrom(player), teams: [], colleges: [], error: "" };
    try {
      if (!record.espnId) record.espnId = await findEspnId(player.name);
      if (record.espnId) {
        const [nflLog, collegeLog] = await Promise.all([
          getRetry(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${record.espnId}/statisticslog?lang=en&region=us`).catch(() => ({ entries: [] })),
          getRetry(`https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/athletes/${record.espnId}/statisticslog?lang=en&region=us`).catch(() => ({ entries: [] })),
        ]);
        record.teams = teamIdsFromLog(nflLog);
        record.colleges = teamIdsFromLog(collegeLog);
      }
    } catch (err) {
      record.error = String(err.message || err);
    }
    cache.players[player.id] = record;
    done += 1;
    if (done % 20 === 0) {
      fs.writeFileSync(cachePath, JSON.stringify(cache));
      console.log("cached", done, "/", roster.players.length);
    }
    await sleep(40);
  });
  fs.writeFileSync(cachePath, JSON.stringify(cache));

  const collegeIds = new Set();
  for (const record of Object.values(cache.players)) {
    for (const id of record.colleges || []) collegeIds.add(id);
  }
  const missing = [...collegeIds].filter((id) => !cache.colleges[id]);
  await pool(missing, 6, async (id) => {
    try {
      const team = await getRetry(
        `https://sports.core.api.espn.com/v2/sports/football/leagues/college-football/teams/${id}?lang=en&region=us`
      );
      cache.colleges[id] = collegeName(team);
    } catch (err) {
      cache.colleges[id] = "";
    }
  });
  fs.writeFileSync(cachePath, JSON.stringify(cache));

  const collegeLogos = new Map(roster.colleges.map((college) => [college.name, college.logo || ""]));
  for (const player of roster.players) {
    const record = cache.players[player.id] || { teams: [], colleges: [] };
    const teams = [];
    for (const id of record.teams || []) {
      const abbr = cache.nfl[id];
      if (abbr && !teams.includes(abbr)) teams.push(abbr);
    }
    if (player.team && !teams.includes(player.team)) teams.push(player.team);
    player.teams = teams;

    const colleges = [];
    const drop = new Set(DROP_COLLEGES[player.name] || []);
    if (player.college && usableCollege(player.college) && !drop.has(player.college)) colleges.push(player.college);
    for (const id of record.colleges || []) {
      const name = cache.colleges[id];
      if (!usableCollege(name) || drop.has(name)) continue;
      if (!collegeLogos.has(name)) collegeLogos.set(name, `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`);
      if (!colleges.includes(name)) colleges.push(name);
    }
    for (const name of ADD_COLLEGES[player.name] || []) {
      if (!colleges.includes(name)) colleges.push(name);
    }
    player.colleges = colleges;

    const numbers = new Set(player.numbers || []);
    for (const number of PAST_NUMBERS[player.name] || []) numbers.add(number);
    player.numbers = [...numbers].sort((a, b) => a - b);
  }

  const usedColleges = new Set(roster.players.flatMap((player) => player.colleges));
  roster.colleges = [...usedColleges]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, logo: collegeLogos.get(name) || "" }));

  fs.writeFileSync(rosterPath, JSON.stringify(roster, null, 2));
  fs.writeFileSync(path.join(root, "js", "roster.js"), "window.ROSTER = " + JSON.stringify(roster) + ";\n");

  const watch = ["Jahmyr Gibbs", "Aaron Rodgers", "Caleb Williams", "Jayden Daniels", "Bo Nix", "Joe Burrow", "Jalen Hurts", "Baker Mayfield", "Russell Wilson", "Cam Ward", "Tom Brady", "Stefon Diggs"];
  for (const name of watch) {
    const player = roster.players.find((item) => item.name === name);
    if (!player) continue;
    console.log(name, "nums", player.numbers.join(","), "schools", player.colleges.join(" | "), "teams", player.teams.join(","));
  }
  console.log("players", roster.players.length, "colleges", roster.colleges.length);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
