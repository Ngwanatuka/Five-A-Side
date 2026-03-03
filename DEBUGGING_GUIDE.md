# 5-a-Side Soccer League Management Platform - Debugging Guide

This guide provides a comprehensive, step-by-step approach to debugging the various layers of the platform: Database, Backend (Server), and Frontend (Client).

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Layer 1: Database (MySQL & Prisma)](#2-layer-1-database-mysql--prisma)
3. [Layer 2: Backend (Node.js & Express)](#3-layer-2-backend-nodejs--express)
4. [Layer 3: Frontend (React & Vite)](#4-layer-3-frontend-react--vite)
5. [End-to-End Debugging Using Network Logs](#5-end-to-end-debugging-using-network-logs)

---

## 1. Prerequisites

Before debugging, ensure your local development environment is correctly running.

Open three separate terminal windows in the root of your project:

* **Terminal 1 (Database):** `docker compose up -d`
* **Terminal 2 (Backend):** `cd server && npm run dev`
* **Terminal 3 (Frontend):** `cd client && npm run dev`

---

## 2. Layer 1: Database (MySQL & Prisma)

The database is isolated inside a Docker container, and we use Prisma as our ORM to interact with it.

### Checking the Database Container

If the backend fails to connect to the database (often seen as a `PrismaClientInitializationError` in the server terminal):

1. Verify the container is running:

    ```bash
    docker ps
    ```

    Look for a container named `five_a_side_db` (or similar, depending on `docker-compose.yml`).
2. If it's not running, view the logs to see why it crashed:

    ```bash
    docker logs five_a_side_db
    ```

### Inspecting Data with Prisma Studio

If you suspect the data in the database is incorrect (e.g., a player's finance tier is wrong, or a match roster exceeds 9 players but was still saved):

1. Navigate to the server directory:

    ```bash
    cd server
    ```

2. Open Prisma Studio:

    ```bash
    npx prisma studio
    ```

3. Open `http://localhost:5555` in your browser.
4. Here, you can directly view, filter, edit, and delete records in the database. This is explicitly helpful for resetting state while testing constraints (like the "9-player cap").

### Database Schema Updates

If you get errors about missing columns or tables, it usually means your Prisma schema is out of sync with the database.

```bash
cd server
npx prisma db push # Pushes the schema to the DB without creating a migration file OR
npx prisma migrate dev # Recreates the database & applies the update
```

---

## 3. Layer 2: Backend (Node.js & Express)

Our backend server handles all the business rules (standings updates, roster constraints). It runs using `ts-node` during development.

### Inspecting Server Logs

When an API request fails (e.g., returns a 400 or 500 status code to the frontend):

1. Look at the **Terminal 2 (Backend)** where you ran `npm run dev`.
2. Express typically logs incoming requests. Look for the request that failed (e.g., `POST /api/matches/1/roster`).
3. Follow the stack trace below the error. If it is a Prisma error (e.g., Unique constraint failed), the error will be quite detailed.

### Using `console.log` Effectively

If business logic is failing silently (e.g., the points are calculating wrong, but no crash happens), inject `console.log` statements directly into your controller functions:

```typescript
// Example: src/controllers/matchController.ts
console.log('Incoming roster data:', req.body);
console.log('Current player count for this match:', currentRoster.length);
```

### Debugging WebSockets (Socket.io)

If real-time match scores aren't updating:

1. Check the server logs to ensure the client is connecting: Look for connection logs if established in your `src/index.ts` or socket configuration file.
2. Log the event payloads right before emitting: Let's assume you emit a `scoreUpdate` event. Log `console.log('Emitting scoreUpdate:', matchId, newScore)` to ensure the server actually triggers the event.

---

## 4. Layer 3: Frontend (React & Vite)

The frontend is what the user sees. Debugging here involves checking UI state, network requests, and component rendering.

### The Browser Console

If the UI breaks, a button doesn't work, or the screen goes blank:

1. Open your browser's Developer Tools (F12 or Right Click -> Inspect).
2. Navigate to the **Console** tab.
3. Look for red error messages. Common issues here include React runtime errors (e.g., `Cannot read properties of undefined (reading 'map')`), or unhandled API rejections.

### The React Developer Tools (Browser Extension)

To debug issues with component state (e.g., a modal not opening, or form data not saving locally before submission):

1. Install the **React Developer Tools** extension for your browser.
2. Open DevTools and go to the **Components** tab.
3. Select the component that is misbehaving. You can view and dynamically modify its `props` and `state` on the right-hand panel.

### Debugging WebSocket Client

If the frontend isn't receiving the live score updates:

1. Use `console.log` inside your `useEffect` hooks where the socket listens for events.
2. Check the DevTools **Network** tab, click on the **WS** (WebSockets) filter.
3. Click on the active WebSocket connection to see the "Messages" being passed back and forth in real-time.

---

## 5. End-to-End Debugging Using Network Logs

When you are unsure if a bug is on the Frontend or Backend, the **Network Tab** is your source of truth.

1. Open the Browser DevTools and go to the **Network** tab.
2. Perform the action that creates the bug (e.g., clicking "Add Player to Roster").
3. Observe the network request that appears. Click on it.
4. **Check the Headers:** Did the frontend send the correct URL and HTTP Method (POST/PUT/GET)?
5. **Check the Payload/Request:** Did the frontend send the correct data? (e.g., `{"playerId": 5, "matchId": 12}`). If the payload is wrong -> **Bug is in Frontend.**
6. **Check the Response/Preview:** What did the server send back? If it's a 500 Internal Server Error, or a 400 Bad Request with an error message -> **Bug is in Backend.**

Use this information to decide whether to switch to "Backend Debugging" or "Frontend Debugging".
