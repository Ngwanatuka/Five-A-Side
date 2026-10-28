export interface TournamentPlayer {
  id: string;
  teamKey: string;
  name: string;
  jerseyNumber: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  isCaptain?: boolean;
  goals?: number;
  assists?: number;
  matchesPlayed?: number;
}

export const DEFAULT_TOURNAMENT_PLAYERS: TournamentPlayer[] = [
  {
    "id": "p-180013",
    "teamKey": "team-dench",
    "name": "Kgotso",
    "jerseyNumber": 1,
    "position": "GK",
    "isCaptain": false
  },
  {
    "id": "p-180014",
    "teamKey": "team-dench",
    "name": "Moses",
    "jerseyNumber": 2,
    "position": "DEF",
    "isCaptain": false
  },
  {
    "id": "p-180015",
    "teamKey": "team-dench",
    "name": "Dench",
    "jerseyNumber": 3,
    "position": "MID",
    "isCaptain": true
  },
  {
    "id": "p-180016",
    "teamKey": "team-dench",
    "name": "Vincent",
    "jerseyNumber": 4,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180017",
    "teamKey": "team-dench",
    "name": "Sila",
    "jerseyNumber": 5,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180018",
    "teamKey": "team-dench",
    "name": "Vuyo",
    "jerseyNumber": 6,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180019",
    "teamKey": "team-dench",
    "name": "Jnr",
    "jerseyNumber": 7,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180020",
    "teamKey": "cpt-superstars",
    "name": "Sasa",
    "jerseyNumber": 1,
    "position": "GK",
    "isCaptain": false
  },
  {
    "id": "p-180021",
    "teamKey": "cpt-superstars",
    "name": "Banques",
    "jerseyNumber": 2,
    "position": "DEF",
    "isCaptain": false
  },
  {
    "id": "p-180022",
    "teamKey": "cpt-superstars",
    "name": "Feels",
    "jerseyNumber": 3,
    "position": "MID",
    "isCaptain": true
  },
  {
    "id": "p-180023",
    "teamKey": "cpt-superstars",
    "name": "Liam",
    "jerseyNumber": 4,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180024",
    "teamKey": "cpt-superstars",
    "name": "Elijah",
    "jerseyNumber": 5,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180025",
    "teamKey": "cpt-superstars",
    "name": "Fudge",
    "jerseyNumber": 6,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180026",
    "teamKey": "cpt-superstars",
    "name": "Pablo",
    "jerseyNumber": 7,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180050",
    "teamKey": "bras-ba-kasi",
    "name": "Jiki",
    "jerseyNumber": 10,
    "position": "FWD",
    "isCaptain": true
  },
  {
    "id": "p-180051",
    "teamKey": "bras-ba-kasi",
    "name": "Shoelace",
    "jerseyNumber": 2,
    "position": "DEF",
    "isCaptain": false
  },
  {
    "id": "p-180052",
    "teamKey": "bras-ba-kasi",
    "name": "Sbu",
    "jerseyNumber": 1,
    "position": "GK",
    "isCaptain": false
  },
  {
    "id": "p-180053",
    "teamKey": "bras-ba-kasi",
    "name": "Cat",
    "jerseyNumber": 8,
    "position": "MID",
    "isCaptain": false
  },
  {
    "id": "p-180054",
    "teamKey": "bras-ba-kasi",
    "name": "Mandla",
    "jerseyNumber": 7,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180055",
    "teamKey": "bras-ba-kasi",
    "name": "Kagiso",
    "jerseyNumber": 9,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180027",
    "teamKey": "gauteng-warriors",
    "name": "Nsovo.",
    "jerseyNumber": 1,
    "position": "GK",
    "isCaptain": false
  },
  {
    "id": "p-180028",
    "teamKey": "gauteng-warriors",
    "name": "Mash",
    "jerseyNumber": 2,
    "position": "DEF",
    "isCaptain": true
  },
  {
    "id": "p-180029",
    "teamKey": "gauteng-warriors",
    "name": "Mas",
    "jerseyNumber": 3,
    "position": "MID",
    "isCaptain": false
  },
  {
    "id": "p-180030",
    "teamKey": "gauteng-warriors",
    "name": "Happler",
    "jerseyNumber": 4,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180031",
    "teamKey": "gauteng-warriors",
    "name": "Mrube",
    "jerseyNumber": 5,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180032",
    "teamKey": "gauteng-warriors",
    "name": "Sbuda",
    "jerseyNumber": 6,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180033",
    "teamKey": "gauteng-warriors",
    "name": "Mbuso",
    "jerseyNumber": 7,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180034",
    "teamKey": "gauteng-warriors",
    "name": "Mdu",
    "jerseyNumber": 8,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180035",
    "teamKey": "gauteng-warriors",
    "name": "King",
    "jerseyNumber": 9,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180036",
    "teamKey": "woza-madzala",
    "name": "Sipho",
    "jerseyNumber": 1,
    "position": "GK",
    "isCaptain": false
  },
  {
    "id": "p-180037",
    "teamKey": "woza-madzala",
    "name": "Webster",
    "jerseyNumber": 2,
    "position": "DEF",
    "isCaptain": false
  },
  {
    "id": "p-180038",
    "teamKey": "woza-madzala",
    "name": "Future",
    "jerseyNumber": 3,
    "position": "MID",
    "isCaptain": true
  },
  {
    "id": "p-180039",
    "teamKey": "woza-madzala",
    "name": "Starmation",
    "jerseyNumber": 4,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180040",
    "teamKey": "woza-madzala",
    "name": "James",
    "jerseyNumber": 5,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180041",
    "teamKey": "woza-madzala",
    "name": "Given",
    "jerseyNumber": 6,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180042",
    "teamKey": "woza-madzala",
    "name": "Mahlatse",
    "jerseyNumber": 7,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180043",
    "teamKey": "woza-madzala",
    "name": "Peng",
    "jerseyNumber": 8,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180044",
    "teamKey": "woza-madzala",
    "name": "Mayibuye",
    "jerseyNumber": 9,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180070",
    "teamKey": "areyeng-fc",
    "name": "Betri",
    "jerseyNumber": 1,
    "position": "GK",
    "isCaptain": false
  },
  {
    "id": "p-180071",
    "teamKey": "areyeng-fc",
    "name": "Lethabo",
    "jerseyNumber": 2,
    "position": "DEF",
    "isCaptain": false
  },
  {
    "id": "p-180072",
    "teamKey": "areyeng-fc",
    "name": "Stu",
    "jerseyNumber": 3,
    "position": "MID",
    "isCaptain": true
  },
  {
    "id": "p-180073",
    "teamKey": "areyeng-fc",
    "name": "Teekay",
    "jerseyNumber": 4,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180074",
    "teamKey": "areyeng-fc",
    "name": "Molly",
    "jerseyNumber": 5,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180075",
    "teamKey": "areyeng-fc",
    "name": "Thabang",
    "jerseyNumber": 6,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180076",
    "teamKey": "areyeng-fc",
    "name": "Small",
    "jerseyNumber": 7,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-180077",
    "teamKey": "areyeng-fc",
    "name": "Stuff",
    "jerseyNumber": 8,
    "position": "FWD",
    "isCaptain": false
  },
  {
    "id": "p-390001",
    "teamKey": "team-dench",
    "name": "Kagiso Sithole",
    "jerseyNumber": 8,
    "position": "MID",
    "isCaptain": false
  }
];
