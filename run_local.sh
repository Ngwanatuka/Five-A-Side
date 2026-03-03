#!/bin/bash

echo "🚀 Starting 5-a-Side Soccer League Platform local execution script..."

# Function to kill process on a port to avoid conflicts
kill_port() {
  PORT=$1
  PID=$(lsof -ti :$PORT)
  if [ ! -z "$PID" ]; then
    echo "⚠️  Port $PORT is in use by PID $PID. Killing it to avoid conflicts..."
    kill -9 $PID
  fi
}

# 1. Resolve Port Conflicts (Backend: 5000, Frontend: 5173)
kill_port 5000
kill_port 5173

# 2. Check and start Database
echo "📦 Starting Database container..."
docker compose up -d

echo "⏳ Waiting for Database to be ready..."
sleep 5 # Simple wait to ensure MySQL is up before Prisma tries to connect

# 3. Setup Backend
echo "⚙️  Setting up Backend..."
cd server
npm install --silent
npx prisma db push
npx prisma generate
npx ts-node prisma/seed.ts
# Optionally seed test data if the file exists
if [ -f "prisma/seed-test.ts" ]; then
  npx ts-node prisma/seed-test.ts
fi

echo "🚀 Starting Backend Server (Port 5000)..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!
cd ..

# 4. Setup Frontend
echo "💻 Setting up Frontend..."
cd client
npm install --silent
echo "🚀 Starting Frontend Server (Port 5173)..."
npm run dev -- --port 5173 > client.log 2>&1 &
CLIENT_PID=$!
cd ..

echo "✅ All services started successfully!"
echo "⚽ Backend is running on http://localhost:5000"
echo "⚽ Frontend is running on http://localhost:5173"
echo "Press Ctrl+C to stop all services cleanly."

# Trap Ctrl+C to kill background processes cleanly
trap "echo -e '\n🛑 Stopping services...'; kill $SERVER_PID $CLIENT_PID; docker compose stop; exit 0" INT

# Wait for background processes so the script doesn't exit immediately
wait
