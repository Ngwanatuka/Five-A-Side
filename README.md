# 5-a-Side Soccer League Management Platform

**Developed by:** MoSoft Solutions
**Version:** 1.0.0

## 📖 Project Overview

A comprehensive, real-time web platform built to manage a multi-division 5-a-side soccer league. The system handles team registrations, dynamic league standings, promotion/relegation cycles, live score updates via WebSockets, and strict roster/financial constraints.

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
4. Run database migrations to construct the relational tables.
5. Start the development server.

---
*Property of MoSoft Solutions. All rights reserved.*
