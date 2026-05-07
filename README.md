# Restaurant Online Queuing System

A restaurant queue management app for customers and restaurant staff/admins. Customers can browse restaurants, join a queue remotely, track queue status, leave a queue, scan a restaurant QR code, and view booking history. Staff/admin users can manage live queues, call the next party, assign called parties to tables, update table states, and configure restaurant settings.

The implementation follows `Project_Proposal.pdf`: React Native + TypeScript + Expo for web/mobile, Flask for the backend API, MongoDB for storage, JWT authentication, and Flask-SocketIO for real-time queue updates.

## Current Demo Data

This local demo database has three restaurants:

| Restaurant | Cuisine | Restaurant ID | Staff ID | PIN |
| --- | --- | --- | --- | --- |
| Siam Basil Demo | Thai | `69fcb1c6a72ac7d55216e768` | `admin` | `123456` |
| PizzaCompany | Pizza | `69fcb64b286d7a1d2349c0af` | `admin` | `123456` |
| Katsuya | Japanese | `69fcb64b286d7a1d2349c0ba` | `admin` | `123456` |

Demo customer:

```text
Email: demo.user@example.com
Password: password123
```

QR code payload format:

```text
restaurantId:<restaurant_id>
```

Example:

```text
restaurantId:69fcb1c6a72ac7d55216e768
```

## Features

### Customer

- Register and log in with email/password
- Browse and search restaurants by name or cuisine
- View queue length and estimated wait time
- Join a restaurant queue with party size
- Track active queue status and position
- Leave/cancel an active queue
- Scan a restaurant QR code to open its queue page
- View queue booking history
- Log out from the Discover screen

### Staff / Admin

- Log in with restaurant ID, staff ID, and PIN
- View a live queue dashboard
- Call the next waiting party
- Assign a called party to an available table
- Manage table state with one-tap cycle: available -> occupied -> checked -> available
- Update queue capacity, average turn time, opening hours, closing hours, and accepting-queue status
- Log out from the queue dashboard

### Real Time

- Socket.IO broadcasts queue updates to restaurant subscribers
- Customers receive `your_turn` when staff calls their party
- Table status updates are broadcast to staff clients

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile/Web frontend | React Native + TypeScript + Expo |
| Backend/API | Python + Flask |
| Database | MongoDB |
| Auth | JWT role claims |
| Real-time sync | Flask-SocketIO + `socket.io-client` |
| Deployment helper | Docker Compose for MongoDB/backend |

## Project Structure

```text
.
|-- backend/
|   |-- app.py
|   |-- config.py
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- sockets/
|   |-- Dockerfile
|   `-- requirements.txt
|-- frontend/
|   |-- App.tsx
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- navigation/
|   |   |-- screens/
|   |   |-- types/
|   |   `-- utils/
|   |-- .env.example
|   `-- package.json
|-- docker-compose.yml
`-- Project_Proposal.pdf
```

## Prerequisites

- Node.js and npm
- Python 3.12+
- MongoDB running locally, or Docker Desktop for MongoDB
- Android Studio / Android Emulator for Android testing
- Expo Go on a physical phone if testing with a real device

## Environment Files

Environment files are ignored by git. Use the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

For local web testing, `frontend/.env` can use:

```env
EXPO_PUBLIC_API_URL=http://localhost:6001
```

For Android emulator or physical phone testing, use your computer LAN IP:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.111:6001
```

The backend is commonly run on port `6001` because macOS often occupies port `5000`.

## Run Locally

### 1. Start MongoDB

If MongoDB is already running locally on port `27017`, skip this step.

With Docker:

```bash
cd /Users/phuditpreechanarit/Desktop/restaurant-queue-system
docker compose up mongo
```

### 2. Start Backend

```bash
cd /Users/phuditpreechanarit/Desktop/restaurant-queue-system/backend
PORT=6001 CORS_ORIGINS=http://localhost:8082,http://127.0.0.1:8082,http://192.168.0.111:8082 .venv/bin/python app.py
```

Health check:

```bash
curl http://127.0.0.1:6001/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### 3. Start Web Frontend

```bash
cd /Users/phuditpreechanarit/Desktop/restaurant-queue-system/frontend
npm run web -- --port 8082
```

Useful web URLs:

- Customer: `http://127.0.0.1:8082`
- Admin/staff: `http://192.168.0.111:8082`
- Localhost also works: `http://localhost:8082`

Using different hostnames keeps separate customer/admin browser sessions because web storage is per origin.

### 4. Start Android

Make sure Android Studio has an emulator running, then:

```bash
cd /Users/phuditpreechanarit/Desktop/restaurant-queue-system/frontend
npm run android -- --port 8082
```

Expo opens:

```text
exp://192.168.0.111:8082
```

If using a physical Android phone, connect to the same Wi-Fi and scan the Expo QR code with Expo Go.

## API Overview

### Auth

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register customer |
| `POST` | `/api/auth/login` | Customer login |
| `POST` | `/api/auth/staff/login` | Staff/admin login |
| `GET` | `/api/auth/me` | Current authenticated user |

### Restaurants

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/restaurants/` | List/search restaurants |
| `GET` | `/api/restaurants/<restaurant_id>` | Restaurant details |
| `POST` | `/api/restaurants/` | Create restaurant, admin only |
| `GET` | `/api/restaurants/<restaurant_id>/tables` | Restaurant tables |

### Queues

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/queues/join` | Join queue, customer only |
| `GET` | `/api/queues/my-status` | Active customer queue |
| `POST` | `/api/queues/<entry_id>/cancel` | Cancel/leave queue |
| `GET` | `/api/queues/restaurant/<restaurant_id>` | Staff/admin queue list |
| `GET` | `/api/queues/history` | Customer queue history |

### Staff

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/staff/call-next` | Call next waiting party |
| `POST` | `/api/staff/seat/<entry_id>` | Seat called party, optionally with `table_id` |
| `POST` | `/api/staff/tables/<table_id>/status` | Update table status |
| `PATCH` | `/api/staff/settings` | Update restaurant settings, admin only |
| `POST` | `/api/staff/create-staff` | Create staff account, admin only |

## Verification Checklist

Current tested flows:

- Customer login
- Customer logout
- Customer restaurant discovery and search
- Customer queue join
- Customer leave queue
- Customer booking history
- QR Scan tab is reachable
- Staff/admin login
- Staff/admin logout
- Call next party
- Assign called party to table
- Table status cycle
- Restaurant settings save
- Android emulator launch through Expo

## Notes

- Do not commit `.env`, `.venv`, `node_modules`, or `.expo`.
- If the frontend shows network errors on Android, confirm `frontend/.env` uses the LAN IP backend URL, not `localhost`.
- If web and Android are running at the same time, keep the backend on `6001` and Metro on `8082`.
