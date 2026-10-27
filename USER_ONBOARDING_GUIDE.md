# ⚽ 5-A-Side Soccer League & Dench Derby Platform
## 📖 Comprehensive Website User & Onboarding Guide

Welcome to the **5-A-Side Soccer League Platform**! This web application is a real-time, interactive soccer tournament and league management system designed for players, team captains, match officials, spectators, and league administrators.

Whether you are here to check live scores from the sidelines, manage your team roster before the registration deadline, officiate matches from the referee console, or run the entire tournament, this guide will walk you through every feature of the website.

---

## 📑 Table of Contents

1. [Quick Start: Selecting Your Role](#1-quick-start-selecting-your-role)
2. [Role Breakdown & Permissions Matrix](#2-role-breakdown--permissions-matrix)
3. [Fan & Spectator Guide (Browse Mode)](#3-fan--spectator-guide-browse-mode)
4. [Team Captain Onboarding & Squad Management](#4-team-captain-onboarding--squad-management)
5. [Referee & Match Official Console Guide](#5-referee--match-official-console-guide)
6. [League & Tournament Admin Guide](#6-league--tournament-admin-guide)
7. [The Dench Derby Tournament Hub Walkthrough](#7-the-dench-derby-tournament-hub-walkthrough)
8. [Tournament & League Rules Cheat-Sheet](#8-tournament--league-rules-cheat-sheet)
9. [Financial & Payment System](#9-financial--payment-system)
10. [Frequently Asked Questions (FAQ)](#10-frequently-asked-questions-faq)

---

## 1. Quick Start: Selecting Your Role

When you open the website, an interactive prompt asks **"Who Are You? ⚽"**. The website adjusts its views, menus, and controls based on who you are.

```
       ┌────────────────────────────────────────────────────────┐
       │                Who Are You? ⚽                         │
       ├────────────────────────────────────────────────────────┤
       │ ⚽ Fan / Player         │ 🧢 Team Captain              │
       │    No login needed      │    4-digit team PIN          │
       │    Read-only live scores│    Squad builder (max 9)     │
       ├─────────────────────────┼──────────────────────────────┤
       │ ⏱️ Match Referee        │ 👑 League Admin              │
       │    Official credentials │    Email + password          │
       │    Live Match Console   │    Full league & data control│
       └────────────────────────────────────────────────────────┘
```

> [!TIP]
> **Switching Roles Anytime:**  
> You are never stuck in a role! Look at the top navigation bar at any time and click the **Role Badge Pill** (e.g. `⚽ Fan / Player (Switch)` or `🧢 Captain (Switch)`) to change your role or switch between teams.

---

## 2. Role Breakdown & Permissions Matrix

| Feature / Page | ⚽ Fan / Spectator | 🧢 Team Captain | ⏱️ Referee | 👑 Admin |
| :--- | :---: | :---: | :---: | :---: |
| **No Password Required** | ✅ Yes | ❌ (Needs PIN) | ❌ (Needs Login) | ❌ (Needs Login) |
| **Dench Derby Live Scores** | ✅ View | ✅ View | ✅ View | ✅ View |
| **Interactive Knockout Tree** | ✅ View | ✅ View | ✅ View | ✅ View |
| **Group Standings & Log** | ✅ View | ✅ View | ✅ View | ✅ View |
| **Golden Boot Leaderboard** | ✅ View | ✅ View | ✅ View | ✅ View |
| **Edit Team Roster (Own Team)** | ❌ | ✅ (Before Deadline) | ❌ | ✅ (Anytime) |
| **Squad Limit Enforcement** | N/A | Max 9 Players | N/A | Overridable |
| **Match Day Console (`/referee`)** | ❌ Locked | ❌ Locked | ✅ Full Control | ✅ Full Control |
| **Live Match Clock & Whistle** | ❌ | ❌ | ✅ Yes | ✅ Yes |
| **Live Score & Goal Logger** | ❌ | ❌ | ✅ Yes | ✅ Yes |
| **Admin Dashboard (`/admin`)** | ❌ Locked | ❌ Locked | ❌ Locked | ✅ Full Control |
| **Assign Captains & PINs** | ❌ | ❌ | ❌ | ✅ Yes |
| **Manage Fixtures & Pitches** | ❌ | ❌ | ❌ | ✅ Yes |
| **Reset Matches / Tournament** | ❌ | ❌ | ❌ | ✅ Yes |
| **Player Payments (`/payments`)** | ❌ (Locked Tab) | ❌ (Locked Tab) | ❌ | ✅ Yes |

---

## 3. Fan & Spectator Guide (Browse Mode)

If you are a fan, family member, supporter, or player checking upcoming fixtures:

1. Click **⚽ Fan / Player** on the role selection screen (or select **Browse Platform**).
2. You will be taken immediately to the **Dench Derby Tournament Hub** (`/dench-derby`).
3. **What You Can Do:**
   - **Live Bracket:** Watch the knockout tree dynamically update as teams win their matches.
   - **Group Standings:** View Group A and Group B tables showing Played, Won, Drawn, Lost, Goals For (GF), Goals Against (GA), Goal Difference (GD), and Points (PTS).
   - **Match Schedule:** See which pitch your team is playing on (Pitch 1 or Pitch 2), kickoff times, and live match scores.
   - **Golden Boot Race:** See which player leads the tournament in goals and assists.
   - **Club Profiles:** Explore team cards, club colors, slogans, and full player rosters.
   - **Real-Time Updates:** You do not need to refresh the page! Live scores and goal announcements push automatically to your screen as the referee blows the whistle.

> [!NOTE]
> During active tournament mode (e.g. Dench Derby), standard seasonal league tabs (Standings, Fixtures, Results, Teams) display a helpful **Tournament Lock**. All action is concentrated on the **Dench Derby** page.

---

## 4. Team Captain Onboarding & Squad Management

As a Team Captain, you are in charge of registering your players and submitting your starting squad.

### Step 1: Log in with your Captain PIN
1. Click the **Role Switcher** in the navbar or select **🧢 Team Captain** upon opening the site.
2. Select your team from the dropdown list:
   - **Dench City FC** (Captain: *Bafana Sithole*)
   - **BARCODE FC** (Captain: *Mo Hendricks*)
   - **GSW FC** (Captain: *Thabo Dlamini*)
   - **Mambisa FC** (Captain: *Sipho Zulu*)
   - **Ayoba fc** (Captain: *Mandla Nkosi*)
   - **Areyeng fc** (Captain: *Kagiso Molefe*)
3. Enter your team’s **4-digit secret PIN** (issued by the tournament admin).
4. Click **Log In as Captain**. You will be taken straight to the tournament squad manager.

### Step 2: The Roster Rules & Limits
- **The 9-Player Limit:** In accordance with 5-a-side tournament regulations, each team can register a maximum of **9 players** (5 on field + 4 rolling substitutes).
- **Player Positions:** Assign each player one of the official positions:
  - `GK` (Goalkeeper)
  - `DEF` (Defender)
  - `MID` (Midfielder)
  - `FWD` (Forward / Striker)
- **Jersey Numbers:** Assign unique squad numbers (1–99).
- **Captain Designation:** Only one player per team can carry the official Captain emblem (👑).

### Step 3: Adding & Managing Players
1. Navigate to the **Teams** tab on the Dench Derby page.
2. Your team will be highlighted with an **"Authorized to Edit"** badge.
3. Click **+ Add Player**:
   - Type the player's full name.
   - Select their position.
   - Enter their jersey number.
   - Check **"Is Captain"** if they are the team captain.
4. Click **Save Player**. The squad list updates immediately.
5. If you need to remove a player before the deadline, click the red **Trash** icon next to their name.

### Step 4: The Squad Lock Deadline
- The top of the page displays a **Live Countdown Timer** (e.g. `⏳ 1d 4h 22m remaining until roster locks`).
- **Deadline:** Squad changes are strictly cut off before kickoff (e.g. `28 Oct 18:30`).
- Once the deadline passes:
  - The squad builder locks automatically to prevent late roster additions.
  - Only a League Admin can make emergency replacements.

---

## 5. Referee & Match Official Console Guide

Referees and timekeepers run the tournament from the **Match Day Console** (`/referee`), designed for rapid, one-handed operation on mobile phones or tablets pitchside.

### Step 1: Accessing the Console
1. Select **⏱️ Referee** in the role picker.
2. Enter your referee credentials (or click **1-Click Demo Referee Login**).
3. You will be redirected immediately to `/referee`.

### Step 2: Selecting an Active Match
1. Click the **Select Match** dropdown at the top of the console.
2. Matches are grouped by pitch and kickoff order:
   - **Pitch 1 Matches:** Dench City vs BARCODE FC, GSW vs Dench City, Semi-Final 1, Grand Final.
   - **Pitch 2 Matches:** Mambisa vs Ayoba, Ayoba vs Areyeng, Semi-Final 2, 3rd Place Match.
3. Select the fixture you are officiating. The console loads both team squads and scorecards.

### Step 3: Operating the Match Clock
- **Start Timer (▶️):** Starts the official match clock. The match status automatically flips to `LIVE` on all spectator devices.
- **Pause Timer (⏸️):** Halts the clock for injuries or ball retrieval.
- **Reset Timer (🔄):** Resets clock back to 00:00 if a restart is needed.

### Step 4: Recording Scores & Goals
- **Quick Goal (+ / -):** Use the large green `+` and red `-` buttons for instant score adjustments.
- **Detailed Goal Logger:**
  1. Click **+ Record Goal Event**.
  2. Select the scoring team.
  3. Pick the player who scored from the roster dropdown (or type custom name for guest players).
  4. Optionally select the assist provider.
  5. The goal minute is stamped automatically from the running match clock.
  6. Click **Confirm Goal**. The live score, group standings, and Golden Boot leaderboard update in real time!

### Step 5: Advancing Knockout Matches
When group stages conclude:
1. In the knockout matches (Semi-Final 1, Semi-Final 2, 3rd Place, and Grand Final), the console automatically shows the advancing teams based on group points and goal difference.
2. If custom selection is required, the referee/admin can click **Assign Teams** to manually confirm which teams take the pitch.
3. Once the final whistle blows, click **End Match & Finalize**. The result is saved as `COMPLETED`.

---

## 6. League & Tournament Admin Guide

League Administrators have full master authority over the entire ecosystem.

### Admin Credentials
- **Super Admin Email:** `ngwanatuka@fivesway.xyz`
- **Tournament Admin Email:** `dench@fivesway.xyz`
- Only verified admin accounts can access the **Admin Dashboard** (`/admin`).

### Core Admin Dashboard Modules

#### 1. 🏆 Update Scores Tab
- View any fixture in the system.
- Manually edit or correct scores if a referee made an error.
- **Single Match Reset:** Reset an individual game back to `scheduled` with 0-0 scoreline without affecting other games.
- **Full Tournament Reset:** A safeguarded control with confirmation to wipe all scores and restart the entire tournament.

#### 2. 🧢 Manage Captains Tab
- **Assign Team Captains:** Update the name, email, and phone contact for any team manager.
- **Set 4-Digit PINs:** Change or reset any team captain’s access PIN.
- **Squad Deadline Controller:** Change the tournament submission deadline date and time. Setting this automatically adjusts the live countdown timer across the whole website.

#### 3. ⏱️ Match Status Tab
- Monitor the state of all pitches in one centralized grid (`Upcoming`, `Live`, `Completed`).
- Force-advance matches or adjust pitch assignments.

#### 4. 📅 Add Fixture Tab
- Create new matches for the seasonal league.
- Select Home Team, Away Team, Pitch Number, Date, Kickoff Time, Season, and Division.

#### 5. 💳 Player Payments Tab
- Audit player payment compliance.
- Filter by payment tier (Full Season, Half Season, Pay-as-you-go).
- Check players marked as `Pre-paid` vs `Owes`.

---

## 7. The Dench Derby Tournament Hub Walkthrough

The **Dench Derby** is the flagship tournament on the platform. The `/dench-derby` page consists of 6 core tabs:

```
[ 🏆 Bracket ] [ 📊 Groups ] [ 📅 Schedule ] [ ⚽ Leaderboard ] [ 🛡️ Teams ] [ 📜 Rules ]
```

### 1. 🏆 Bracket Tab
- An interactive visual tree showing the tournament progression:
  - **Semi-Final 1 (Pitch 1, 20:15):** Winner Group A vs Runner-up Group B
  - **Semi-Final 2 (Pitch 2, 20:15):** Winner Group B vs Runner-up Group A
  - **3rd Place Playoff (Pitch 2, 20:55):** Loser SF1 vs Loser SF2
  - **Grand Final (Pitch 1, 21:00):** Winner SF1 vs Winner SF2
- When a game finishes, a victory confetti banner and trophy highlight the tournament champions!

### 2. 📊 Groups Tab
- Standings tables for **Group A** and **Group B**:
  - **Group A Teams:** Dench City FC, BARCODE FC, GSW FC
  - **Group B Teams:** Mambisa FC, Ayoba fc, Areyeng fc
- Automatically calculates:
  - `P` (Played), `W` (Won), `D` (Drawn), `L` (Lost)
  - `GF` (Goals For), `GA` (Goals Against), `GD` (Goal Difference)
  - `PTS` (Points: 3 for Win, 1 for Draw, 0 for Loss)

### 3. 📅 Schedule Tab
- Complete breakdown of all 10 tournament matches:
  - **Match 1 (18:30, Pitch 1):** Dench City FC vs BARCODE FC
  - **Match 2 (18:30, Pitch 2):** Mambisa FC vs Ayoba fc
  - **Match 3 (19:05, Pitch 1):** BARCODE FC vs GSW FC
  - **Match 4 (19:05, Pitch 2):** Ayoba fc vs Areyeng fc
  - **Match 5 (19:40, Pitch 1):** GSW FC vs Dench City FC
  - **Match 6 (19:40, Pitch 2):** Areyeng fc vs Mambisa FC
  - **Matches 7 & 8 (20:15):** Semi-Finals
  - **Matches 9 & 10 (20:55 & 21:00):** 3rd Place Match & Grand Final
- Each card displays kickoff time, pitch number, status badge (`Scheduled`, `LIVE`, `Full Time`), and expandable goalscorers list.

### 4. ⚽ Leaderboard Tab
- Tracks the race for the **Golden Boot**:
  - Top Goalscorers list with player name, team, position, and goal tally.
  - Assist leaderboard.
  - Real-time updates as soon as the referee logs a goal.

### 5. 🛡️ Teams Tab
- Cards for all 6 clubs showcasing:
  - Team colors & official badge.
  - Team Slogan & City.
  - Captain name.
  - Registered player roster with positions and jersey numbers.
  - Captain squad editing interface.

### 6. 📜 Rules Tab
- Official 5-a-side pitch rules, match durations, overtime shootouts, and foul limits.

---

## 8. Tournament & League Rules Cheat-Sheet

| Rule Category | Tournament Specification |
| :--- | :--- |
| **Players on Pitch** | 5 players per team (1 Goalkeeper + 4 Outfield Players). |
| **Squad Roster Cap** | Maximum 9 registered players per team. |
| **Substitutions** | Rolling substitutions permitted at any stoppage with referee approval. |
| **Points Awarded** | Win = **3 Points**, Draw = **1 Point**, Loss = **0 Points**. |
| **Match Duration** | **15 minutes straight** per match (no half time interval). |
| **Tie-Breaker Hierarchy** | 1. Most Points<br>2. Highest Goal Difference (`GF - GA`)<br>3. Most Goals Scored (`GF`)<br>4. Head-to-Head Result<br>5. Penalty Shootout. |
| **Goalkeeper Area** | Only the goalkeeper is allowed inside the goal area. Outfield defenders entering the area concede a penalty. |
| **Overtime (Knockouts)** | If Semi-Finals or the Final end in a draw, the match goes straight to a best-of-3 penalty shootout. |

---

## 9. Financial & Payment System

The platform manages player registrations and fees with transparency:

### Payment Tiers
1. **Full Season Tier (14 Games):**
   - Cost: **R622 upfront**.
   - Player is marked as **"Pre-paid"** for the entire season.
2. **Half Season Tier (7 Games):**
   - Cost: **R311 upfront**.
   - Player is marked as **"Pre-paid"** for their first 7 matches.
   - On Game 8, the player’s status shifts automatically to **"Owes"**.
3. **Pay-As-You-Go Tier:**
   - Cost: **R45 per game**.
   - Paid pitchside on matchday.

### Online Payments Page (`/payments`)
- Open to League Admins and designated treasurers.
- Allows assigning payments to a specific team and player name.
- Issues instant confirmation and updates player balance records in the database.

---

## 10. Frequently Asked Questions (FAQ)

### Q1: Do I need an account or password just to watch games?
**No!** Anyone can view live scores, tournament brackets, and team standings as a **Fan / Player**. No email, password, or registration is required.

### Q2: How do I switch my role if I selected the wrong one?
Click the **Role Badge Pill** at the top right of the navigation bar (e.g. `⚽ Fan / Player (Switch)`). The role selection window will open, letting you switch to Captain, Referee, or Spectator at any time.

### Q3: Why can't I edit my team's squad?
Squad editing is restricted to:
1. **Team Captains** logged in with their team’s valid 4-digit PIN (and only for their own team).
2. Changes made **before the registration deadline** (e.g. `28 Oct 18:30`). If the countdown has expired, the roster is locked. Contact the League Admin for emergency modifications.

### Q4: Why do some tabs (Standings, Fixtures, Teams) say "Locked"?
When a live tournament like the **Dench Derby** is running, regular league tabs display a friendly lock notice to direct all players and fans to the active tournament page (`/dench-derby`). Only Admins can browse the background league views during active tournament mode.

### Q5: What if our referee enters a wrong score?
League Admins can go to the **Admin Dashboard (`/admin`) -> Update Scores**, select the match, and correct the score or goal event. The change will immediately sync to all viewers.

### Q6: Can a team register more than 9 players?
**No.** The 9-player cap is strictly enforced by the system to maintain fair play in 5-a-side football. If a team already has 9 players, a player must be removed before a new one can be added.

---

*5-A-Side Soccer League Platform & Dench Derby | Developed by MoSoft Solutions*
