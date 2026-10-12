const fs = require("fs");
const path = require("path");

const raw = require("../sleeper-players.json");

const MAX_RANK = 120;

const SKIP_POSITIONS = new Set(["K", "P", "OL", "OT", "OG", "G", "C", "LS", "FB"]);

const FORCE_INCLUDE = new Set([
  "Tim Tebow",
  "Anthony Richardson",
  "Peyton Manning",
  "Tom Brady",
  "Aaron Rodgers",
  "Drew Brees",
  "Rob Gronkowski",
  "Patrick Mahomes",
  "Travis Kelce",
  "Joe Burrow",
  "Josh Allen",
  "Lamar Jackson",
  "Jalen Hurts",
  "Justin Jefferson",
  "Ja'Marr Chase",
  "Odell Beckham",
  "Larry Fitzgerald",
  "J.J. Watt",
  "Aaron Donald",
  "DeAndre Hopkins",
  "Tyreek Hill",
  "Cooper Kupp",
  "Calvin Johnson",
  "Cam Newton",
  "Russell Wilson",
  "Julian Edelman",
  "Antonio Brown",
  "Frank Gore",
  "Marshawn Lynch",
  "LeSean McCoy",
  "Ezekiel Elliott",
  "Saquon Barkley",
  "Derrick Henry",
  "Christian McCaffrey",
  "Travis Kelce",
  "George Kittle",
  "CeeDee Lamb",
  "Micah Parsons",
  "Nick Bosa",
  "Myles Garrett",
  "T.J. Watt",
  "Baker Mayfield",
  "Dak Prescott",
  "Justin Herbert",
  "Joe Burrow",
  "Trevor Lawrence",
  "Caleb Williams",
  "Jayden Daniels",
  "Bo Nix",
  "Brock Purdy",
  "Bijan Robinson",
  "Jahmyr Gibbs",
  "Jonathan Taylor",
  "Josh Jacobs",
  "Amon-Ra St. Brown",
  "A.J. Brown",
  "DK Metcalf",
  "Stefon Diggs",
  "Davante Adams",
  "Mike Evans",
  "Chris Godwin",
  "Tee Higgins",
  "Garrett Wilson",
  "Drake London",
  "Malik Nabers",
  "Brock Bowers",
  "Sam LaPorta",
  "Kyle Pitts",
  "Mark Andrews",
  "Tua Tagovailoa",
  "Kyler Murray",
  "Jared Goff",
  "Matthew Stafford",
  "Jordan Love",
  "CJ Stroud",
  "C.J. Stroud",
  "Drake Maye",
  "Jaxon Smith-Njigba",
  "Puka Nacua",
  "Nico Collins",
  "DeVonta Smith",
  "Jaylen Waddle",
  "Chris Olave",
  "Marvin Harrison",
  "Brian Thomas",
  "Ladd McConkey",
  "Rome Odunze",
  "Zay Flowers",
  "Rashee Rice",
  "James Cook",
  "Kyren Williams",
  "Breece Hall",
  "De'Von Achane",
  "Travis Etienne",
  "Kenneth Walker",
  "Alvin Kamara",
  "James Conner",
  "Aaron Jones",
  "Rhamondre Stevenson",
  "Isiah Pacheco",
  "Tony Pollard",
  "Najee Harris",
  "D'Andre Swift",
  "David Montgomery",
  "J.K. Dobbins",
  "Joe Mixon",
  "Nick Chubb",
  "Austin Ekeler",
  "Dalvin Cook",
  "Christian Watson",
  "DJ Moore",
  "Terry McLaurin",
  "Michael Pittman",
  "Courtland Sutton",
  "Deebo Samuel",
  "Jerry Jeudy",
  "Drake London",
  "George Pickens",
  "Jordan Addison",
  "Jameson Williams",
  "Quentin Johnston",
  "Xavier Worthy",
  "Brian Burns",
  "Roquan Smith",
  "Fred Warner",
  "Bobby Wagner",
  "Khalil Mack",
  "Maxx Crosby",
  "Aidan Hutchinson",
  "Will Anderson",
  "Sauce Gardner",
  "Jalen Ramsey",
  "Patrick Surtain",
  "Derwin James",
  "Kyle Hamilton",
  "Chris Jones",
  "Quinnen Williams",
  "Jeffery Simmons",
  "Dexter Lawrence",
  "Christian Gonzalez",
  "Calvin Ridley",
  "Jordyn Brooks",
  "Jacob Hollister",
  "Zach Charbonnet",
  "Greg Dulcich",
  "David Bell",
  "Derek Carr",
  "Tory Horton",
  "Matt Ryan",
  "Devon Witherspoon",
  "Nick Bolton",
  "Tank Bigsby",
  "Kendre Miller",
  "Carson Wentz",
  "Alshon Jeffery",
  "Amari Cooper",
  "Philip Rivers",
  "Kendrick Bourne",
  "Seth Roberts",
  "Laiatu Latu",
]);

// Retired players whose Sleeper number is a 0 placeholder, not a real jersey.
const PRIMARY_OVERRIDE = {
  "Tim Tebow": 15,
  "Antonio Brown": 84,
  "Julian Edelman": 11,
  "Frank Gore": 21,
  "LeSean McCoy": 25,
  "Marshawn Lynch": 24,
  "Jason Witten": 82,
  "Henry Ruggs": 11,
  "Sony Michel": 25,
  "Jordan Reed": 86,
  "Peyton Manning": 18,
  "Brett Favre": 4,
  "Odell Beckham": 13,
  "Von Miller": 58,
};

// Extra famous numbers fans still use. Kept only if another player shares them.
const EXTRA_NUMBERS = {
  "Aaron Rodgers": [12],
  "Odell Beckham": [13],
  "Ezekiel Elliott": [21],
  "Antonio Brown": [84],
};

const COLLEGE_MAP = {
  "Miami (FL)": "Miami",
  "Miami (Fla.)": "Miami",
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
  "Texas A&amp;M": "Texas A&M",
};

const COLLEGE_LOGOS = {
  Alabama: 333,
  "Ohio State": 194,
  Georgia: 61,
  LSU: 99,
  Clemson: 228,
  Michigan: 130,
  "Notre Dame": 87,
  Oregon: 2483,
  "Penn State": 213,
  Texas: 251,
  USC: 30,
  Oklahoma: 201,
  Washington: 264,
  Tennessee: 2633,
  Wisconsin: 275,
  Florida: 57,
  Miami: 2390,
  "Texas A&M": 245,
  Auburn: 2,
  "Ole Miss": 145,
  "Florida State": 52,
  "Michigan State": 127,
  "Texas Tech": 2641,
  Iowa: 2294,
  Stanford: 24,
  UCLA: 26,
  Colorado: 38,
  BYU: 252,
  "Boise State": 68,
  "Oklahoma State": 197,
  "Iowa State": 66,
  "North Carolina": 153,
  Maryland: 120,
  SMU: 2567,
  Cincinnati: 2132,
  Louisville: 97,
  Arkansas: 8,
  Kentucky: 96,
  Missouri: 142,
  Pitt: 221,
  Arizona: 12,
  "Arizona State": 9,
  "Boston College": 103,
  Cal: 25,
  Purdue: 2509,
  Utah: 254,
  "Utah State": 328,
  Wyoming: 2751,
  "Fresno State": 278,
  Memphis: 235,
  UCF: 2116,
  "Georgia Tech": 59,
  Nevada: 2440,
  Duke: 150,
  "Virginia Tech": 259,
  Indiana: 84,
  TCU: 2628,
  "NC State": 152,
  "South Carolina": 2579,
  "Mississippi State": 344,
  Nebraska: 158,
  "Kansas State": 2306,
  "West Virginia": 277,
  Baylor: 239,
  "Oregon State": 204,
  Illinois: 356,
  Rutgers: 164,
  Minnesota: 135,
  "Colorado State": 36,
  "South Dakota State": 2571,
  "Eastern Michigan": 2199,
  "Coastal Carolina": 324,
  "Wake Forest": 154,
  Virginia: 258,
  Houston: 248,
  Northwestern: 77,
  Syracuse: 183,
  Temple: 218,
  Troy: 2653,
  Tulane: 2655,
  Vanderbilt: 238,
  "Washington State": 265,
  Liberty: 2335,
  "Kent State": 2309,
  "Central Michigan": 2117,
  "Appalachian State": 2026,
  "Western Kentucky": 309,
  "North Dakota State": 2449,
  "Bowling Green": 189,
  UTEP: 2638,
  "East Carolina": 151,
  "San Diego State": 21,
  "Kansas": 2305,
  "Air Force": 2005,
  Army: 349,
  Navy: 2426,
  "South Florida": 58,
  "Florida Atlantic": 2226,
  "Florida International": 2229,
  "Western Michigan": 2711,
  Toledo: 2649,
  "Miami (OH)": 193,
  Ohio: 195,
  Buffalo: 2084,
  Marshall: 276,
  "Georgia Southern": 290,
  "Louisiana": 309,
  "Louisiana Tech": 2348,
  "Southern Miss": 2572,
  "Louisiana-Monroe": 2433,
  "Arkansas State": 2032,
  "South Alabama": 6,
  "James Madison": 256,
  "Jacksonville State": 55,
  "Sam Houston": 2534,
  UNLV: 2439,
  "New Mexico": 167,
  "Utah State": 328,
  Wyoming: 2751,
  "Fresno State": 278,
  Hawaii: 62,
  "San Jose State": 23,
  "Colorado State": 36,
  Rice: 242,
  Tulsa: 2655,
  SMU: 2567,
  Temple: 218,
  "West Alabama": null,
};

function collegeName(rawCollege) {
  if (!rawCollege) return "";
  const trimmed = rawCollege.trim();
  return COLLEGE_MAP[trimmed] || trimmed;
}

function imageUrls(player) {
  const sleeper = player.player_id
    ? `https://sleepercdn.com/content/nfl/players/${player.player_id}.jpg`
    : "";
  const espn = player.espn_id
    ? `https://a.espncdn.com/i/headshots/nfl/players/full/${player.espn_id}.png`
    : "";
  return { image: espn || sleeper, fallback: espn ? sleeper : "" };
}

function consider(player) {
  if (!player.full_name || !player.college || !player.position) return false;
  if (SKIP_POSITIONS.has(player.position)) return false;
  const rank = player.search_rank;
  const forced = FORCE_INCLUDE.has(player.full_name);
  if (!forced && !(typeof rank === "number" && rank > 0 && rank <= MAX_RANK)) return false;
  return true;
}

const byName = new Map();
for (const player of Object.values(raw)) {
  if (!consider(player)) continue;
  const prev = byName.get(player.full_name);
  if (!prev || player.search_rank < prev.search_rank) byName.set(player.full_name, player);
}

let players = [...byName.values()].map((player) => {
  const primary = PRIMARY_OVERRIDE[player.full_name] || Number(player.number);
  const extras = EXTRA_NUMBERS[player.full_name] || [];
  const numbers = [...new Set([primary, ...extras])]
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 99);
  const imgs = imageUrls(player);
  return {
    id: String(player.player_id),
    name: player.full_name,
    numbers,
    college: collegeName(player.college),
    position: player.position,
    team: player.team || "",
    rank: player.search_rank,
    tier: FORCE_INCLUDE.has(player.full_name) || player.search_rank <= MAX_RANK ? "A" : "B",
    image: imgs.image,
    fallback: imgs.fallback,
  };
});

players = players.filter((p) => p.college && p.numbers.length);

function withSharedNumbers(list) {
  const numberCounts = new Map();
  for (const p of list) {
    for (const n of p.numbers) numberCounts.set(n, (numberCounts.get(n) || 0) + 1);
  }
  return list.map((p) => ({
    ...p,
    numbers: p.numbers.filter((n) => (numberCounts.get(n) || 0) >= 2),
  }));
}

function prune(list) {
  let current = list.slice();
  let guard = 0;
  while (guard++ < 30) {
    const collegeCounts = new Map();
    const numberCounts = new Map();
    for (const p of current) {
      collegeCounts.set(p.college, (collegeCounts.get(p.college) || 0) + 1);
      for (const n of p.numbers) numberCounts.set(n, (numberCounts.get(n) || 0) + 1);
    }
    const next = [];
    for (const p of current) {
      if ((collegeCounts.get(p.college) || 0) < 2) continue;
      const shared = p.numbers.filter((n) => (numberCounts.get(n) || 0) >= 2);
      if (!shared.length) continue;
      next.push({ ...p, numbers: shared });
    }
    if (next.length === current.length && next.every((p, i) => p.numbers.join() === current[i].numbers.join())) {
      return next;
    }
    current = next;
  }
  return current;
}

const before = players.slice();
players = prune(players);
players.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
const kept = new Set(players.map((p) => p.name));
const dropped = before.filter((p) => !kept.has(p.name)).sort((a, b) => a.rank - b.rank);
console.log("DROPPED", dropped.length);
for (const p of dropped) {
  if (p.rank <= 80 || FORCE_INCLUDE.has(p.name)) {
    console.log(`  - ${p.rank} ${p.name} #${p.numbers.join("/")} ${p.college}`);
  }
}

const colleges = {};
for (const p of players) {
  if (!colleges[p.college]) {
    const logoId = COLLEGE_LOGOS[p.college];
    colleges[p.college] = {
      name: p.college,
      logo: logoId ? `https://a.espncdn.com/i/teamlogos/ncaa/500/${logoId}.png` : "",
    };
  }
}

const roster = {
  generated: new Date().toISOString().slice(0, 10),
  players: players.map(({ rank, tier, ...rest }) => ({
    ...rest,
    fame: rank > 4000 ? 55 : rank,
  })),
  colleges: Object.values(colleges).sort((a, b) => a.name.localeCompare(b.name)),
};

const outDir = path.join(__dirname, "..", "data");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "roster.json"), JSON.stringify(roster, null, 2));
const jsDir = path.join(__dirname, "..", "js");
fs.mkdirSync(jsDir, { recursive: true });
fs.writeFileSync(path.join(jsDir, "roster.js"), "window.ROSTER = " + JSON.stringify(roster) + ";\n");

const byCollege = new Map();
const byNumber = new Map();
for (const p of players) {
  if (!byCollege.has(p.college)) byCollege.set(p.college, []);
  byCollege.get(p.college).push(p.name);
  for (const n of p.numbers) {
    if (!byNumber.has(n)) byNumber.set(n, []);
    byNumber.get(n).push(p.name);
  }
}

console.log("players", players.length);
console.log("colleges", byCollege.size);
console.log("numbers", byNumber.size);
console.log("\nCOLLEGES");
for (const [college, names] of [...byCollege.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(String(names.length).padStart(3), college, "-", names.slice(0, 8).join(", "));
}
console.log("\nNUMBERS");
for (const [num, names] of [...byNumber.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log(String(num).padStart(3), names.length, names.slice(0, 8).join(", "));
}

const wanted = ["Patrick Mahomes", "Tim Tebow", "Anthony Richardson", "Tom Brady", "Aaron Rodgers"];
console.log("\nKEY");
for (const name of wanted) {
  const p = players.find((x) => x.name === name);
  console.log(name, p ? `#${p.numbers.join("/")} ${p.college}` : "MISSING");
}

const missingLogos = Object.values(colleges).filter((c) => !c.logo).map((c) => c.name);
console.log("\nNO LOGO", missingLogos.join(", ") || "none");
