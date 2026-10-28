# 5-a-Side Soccer League Management Platform

**Developed by:** MoSoft Solutions
**Version:** 1.0.0

## 📖 Project Overview

A comprehensive, real-time web platform built to manage a multi-division 5-a-side soccer league. The system handles team registrations, dynamic league standings, promotion/relegation cycles, live score updates via WebSockets, and strict roster/financial constraints.

> 📚 **Looking for the Website User & Onboarding Guide?**  
> Check out the complete walkthrough for players, captains, referees, and spectators in [USER_ONBOARDING_GUIDE.md](file:///home/ngwanatuka/Five-A-Side/USER_ONBOARDING_GUIDE.md).

## 🛠 Tech Stack

* **Database:** PostgreSQL / MySQL (via Prisma ORM)
* **Backend:** Node.js / Express
* **Frontend:** React / Vite
* **Real-time Engine:** Socket.io

## 📂 Expected Directory Structure

```text
├── /client                # Frontend application (UI/UX)
│   ├── /components        # Reusable UI elements (Match Cards, League Tables)
│   ├── /pages             # Core views (Admin Dashboard, Public Log, Match Day Console)
│   └── /services          # API calls and WebSocket listeners
├── /server                # Backend API and business logic
│   ├── /controllers       # Request handlers (e.g., calculateStandings, updateScore)
│   ├── /models            # Database schemas (Seasons, Teams, Matches, Finances)
│   ├── /routes            # API endpoints
│   ├── /services          # Complex logic (End-of-season transition, financial validation)
│   └── /utils             # Helpers (Goal difference calculators)
└── README.md
```

## ⚙️ Core Business Logic & Constraints

### 1. The League Log (Dynamic Calculation)

Standings are **never hardcoded**. They are calculated dynamically from `Completed` matches for a specific `season_id` and `division_id`.

* **Points System:** Win = 3 | Draw = 1 | Loss = 0
* **Tie-Breakers:** Points > Goal Difference (GF-GA) > Goals For (GF)

### 2. Roster & Financial Constraints

The platform enforces strict rules on match day and during registration:

* **The 9-Player Cap:** A team can only field a maximum of 9 players per season/match. The API will reject any roster addition exceeding this limit.
* **Payment Tiers:**
  * **Full Season (14 Games):** R622 upfront. Player is marked "Pre-paid".
  * **Half Season (7 Games):** R311 upfront. "Pre-paid" for the first 7 games played. On game 8, status shifts to "Owes".
  * **Pay-as-you-go:** Player pays per match on the day.

### 3. Multi-Division & Seasons

* Teams are assigned to a `Division` strictly via a `Team_Season_Registration` link.
* At the end of a season, admins manually promote/relegate teams via the Admin Dashboard before generating the next season's fixtures.

## 🚀 Getting Started

1. Clone the repository: `git clone git@github.com:Ngwanatuka/Five-A-Side.git`
2. Install dependencies for server and client: `npm install`
3. Set up your environment variables (`.env`) for Database Credentials and WebSocket ports.
4. From `server/`, run `npx prisma db push` and `npx prisma generate` to apply the database schema and generate the Prisma client.
5. Start the development server.

## Tournament data persistence

The Dench Derby tournament's authoritative state is stored in the MySQL `TournamentState` row. The server also maintains `server/data/derby-tournament.json` as a local mirror and as a one-time bootstrap source when the database row does not yet exist. The JSON file is not the production source of truth and does not need a persistent Render disk.

### Production rollout

1. Before changing the live service, export and retain a backup of the current `GET /api/derby` response. This includes team edits, squads, match results, goal events, and referee assignments.
2. Back up the MySQL database using the provider's normal backup/export facility.
3. Generate the Prisma client and apply the additive schema change to the existing MySQL database with `cd server && npx prisma db push`. Do this against the intended database only after confirming the backup is usable.
4. If the `TournamentState` row is empty, import the verified API snapshot **before deploying the new server**. Save the response to a temporary JSON file and run `cd server && npm run import:tournament -- /path/to/verified-derby-snapshot.json` with the production `DATABASE_URL` supplied through the deployment environment. The importer refuses to overwrite an existing row.
5. Deploy the server and verify `GET /api/derby` matches the exported snapshot. Do not use the checked-in JSON to replace an existing database row.
6. In a controlled maintenance window, record a harmless test change, read it back, restart/redeploy the service, and verify it remains. Revert the test change after verification.

If MySQL is unavailable or the schema has not been applied, startup fails instead of serving tournament data from a temporary filesystem. Keep the pre-migration API export and database backup until read-after-restart verification is complete.

Captain PIN/email and roster-deadline configuration is still stored separately in `server/data/captains.json`; changes to that configuration are not covered by the tournament-state migration and may be lost on a Render restart or redeploy.

---
*Property of MoSoft Solutions. All rights reserved.*
