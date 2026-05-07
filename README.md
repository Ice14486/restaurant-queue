# Restaurant Online Queuing System

A restaurant queue management system for customers and restaurant staff. Customers can browse restaurants, join a queue remotely, track their queue status, and view history. Staff can manage the live queue, call the next party, seat customers, manage table status, and update restaurant settings.

The project follows the technology stack in `Project_Proposal.pdf`: React Native + TypeScript + Expo for mobile and web, Python + Flask for the backend API, MongoDB for data storage, JWT for authentication, and Flask-SocketIO / polling for real-time queue sync.

## Features

### Customer

- Register and log in as a customer
- Browse and search restaurants
- View restaurant queue length and estimated wait time
- Join a restaurant queue with party size
- Track live queue position and estimated wait
- Receive an in-app turn alert when staff calls the party
- Leave/cancel an active queue
- View queue booking history

### Staff / Admin

- Log in with restaurant ID, staff ID, and PIN
- View the restaurant queue dashboard
- Call the next waiting party
- Mark a called party as seated
- Manage table status: available, occupied, cleaning, reserved
- Update restaurant settings such as queue capacity, average turn time, and accepting queue status
- Admin can create staff users

### Real-Time Updates

- Socket.IO is used for live queue updates.
- Staff clients subscribe to their restaurant room.
- Customer clients subscribe to their active restaurant queue.
- Customers receive a `your_turn` event when their queue entry is called.

## Technology Stack

| Layer | Technology |
| --- | --- |
| Mobile Frontend | React Native + TypeScript + Expo |
| Web Frontend | React Native + TypeScript + Expo through Expo Web / React |
| Backend / API | Python + Flask |
| Database | MongoDB (NoSQL) |
| Authentication | JWT (JSON Web Tokens) with role claims |
| Real-time Sync | Flask-SocketIO / polling with `socket.io-client` |

Supporting implementation tools:

- `bcrypt` for password/PIN hashing
- `axios` for frontend HTTP requests
- Docker Compose for running MongoDB and the backend together

## Project Structure

```text
.
|-- backend/
|   |-- app.py                  # Flask app factory and Socket.IO setup
|   |-- config.py               # Environment-based configuration
|   |-- models/                 # MongoDB document helpers/serializers
|   |-- routes/                 # REST API blueprints
|   |-- middleware/             # JWT auth and role guards
|   |-- sockets/                # Socket.IO event registration
|   |-- Dockerfile
|   `-- requirements.txt
|-- frontend/
|   |-- App.tsx                 # Frontend root providers and navigator
|   |-- src/
|   |   |-- api/                # Axios API clients
|   |   |-- contexts/           # Auth, socket, and queue state
|   |   |-- navigation/         # Customer/staff navigation
|   |   |-- screens/            # Auth, customer, and staff screens
|   |   |-- components/         # Shared UI components
|   |   |-- hooks/
|   |   |-- types/
|   |   `-- utils/
|   `-- package.json
|-- docker-compose.yml
`-- Project_Proposal.pdf
```

## Prerequisites

- Docker and Docker Compose
- Node.js and npm
- Expo CLI through `npx expo`

For local backend development without Docker:

- Python 3.12+
- MongoDB running locally

## Environment Variables

Backend configuration is read from `backend/.env`.

Example:

```env
MONGO_URI=mongodb://localhost:27017/restaurant_queue
JWT_SECRET=change_me_to_a_long_random_string_in_production
JWT_EXPIRY_HOURS=24
STAFF_SESSION_TIMEOUT_MINUTES=60
FLASK_ENV=development
PORT=5000
CORS_ORIGINS=http://localhost:8081,http://localhost:19006
```

Frontend configuration is read from `frontend/.env`.

Example:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
```

If testing on a physical phone, replace `localhost` with the LAN IP address of the machine running the backend, for example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.123:5000
```

## Running the Project

### 1. Start MongoDB and Backend

From the repository root:

```bash
docker compose up --build
```

This starts:

- MongoDB on port `27017`
- Flask backend on port `5000`

Check the backend health endpoint:

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

### 2. Start the Frontend

In another terminal:

```bash
cd frontend
npm install
npm start
```

Then choose the Expo target:

- press `i` for iOS simulator
- press `a` for Android emulator
- press `w` for web
- scan the Expo QR code from a physical phone

## API Overview

### Auth

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Register customer |
| `POST` | `/api/auth/login` | Customer login |
| `POST` | `/api/auth/staff/login` | Staff/admin login |
| `GET` | `/api/auth/me` | Get current authenticated user |

### Restaurants

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/restaurants/` | List/search restaurants |
| `GET` | `/api/restaurants/<restaurant_id>` | Get restaurant detail |
| `POST` | `/api/restaurants/` | Create restaurant, admin only |
| `GET` | `/api/restaurants/<restaurant_id>/tables` | List restaurant tables, staff/admin only |

### Queues

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/queues/join` | Join queue, customer only |
| `GET` | `/api/queues/my-status` | Get active customer queue |
| `POST` | `/api/queues/<entry_id>/cancel` | Cancel queue entry |
| `GET` | `/api/queues/restaurant/<restaurant_id>` | Get restaurant queue, staff/admin only |
| `GET` | `/api/queues/history` | Get customer queue history |

### Staff

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/staff/call-next` | Call next waiting party |
| `POST` | `/api/staff/seat/<entry_id>` | Mark party as seated |
| `POST` | `/api/staff/tables/<table_id>/status` | Update table status |
| `PATCH` | `/api/staff/settings` | Update restaurant settings, admin only |
| `POST` | `/api/staff/create-staff` | Create staff account, admin only |

## Data Model Summary

### User

Customers use email/password authentication. Staff/admin users use a restaurant ID, staff ID, and PIN.

Important fields:

- `role`: `customer`, `staff`, or `admin`
- `restaurant_id`: staff/admin restaurant ownership
- `active_queue_entry_id`: customer's current active queue entry

### Restaurant

Important fields:

- `name`
- `description`
- `cuisine`
- `operating_hours`
- `max_queue_capacity`
- `avg_turn_time_minutes`
- `is_accepting_queue`
- `current_queue_length`
- `table_count`

### Queue Entry

Important fields:

- `restaurant_id`
- `user_id`
- `party_size`
- `status`: `waiting`, `called`, `seated`, `cancelled`, `expired`
- `position`
- `estimated_wait_minutes`
- `queue_number`

### Table

Important fields:

- `restaurant_id`
- `table_number`
- `capacity`
- `status`: `available`, `occupied`, `reserved`, `cleaning`
- `current_queue_entry_id`

## Proposal Criteria Status

This checklist is based on `Project_Proposal.pdf`.

| Criteria | Status | Notes |
| --- | --- | --- |
| Customer restaurant discovery | Met | Implemented in customer home screen and restaurant API. |
| View queue length and estimated wait before joining | Met | Restaurant list/detail exposes current queue length and estimated wait. |
| Remote queue joining through web/app | Met | Customers can join from restaurant detail. Expo can run on mobile and web. |
| Party size selection | Met | Customers choose party size before joining. |
| QR code queue joining | Partial | `QRScanScreen` exists and parses `restaurantId:<id>`, but it is not currently wired into customer navigation. |
| Live queue status | Met | Queue status screen shows queue number, position, wait estimate, and called state. |
| Countdown/wait timer | Met | Implemented by the queue timer component. |
| Alert when table is ready | Met | Staff `call-next` emits `your_turn`; customer screen updates to called state. |
| Booking history with restaurant/status data | Met | Customer history endpoint and screen exist. |
| Staff ID + PIN login | Met | Staff login uses restaurant ID, staff ID, and PIN. |
| Staff queue management dashboard | Met | Staff can view waiting/called entries. |
| Call next party | Met | Staff dashboard calls the next waiting queue entry. |
| Table status manager | Met | Tables can be cycled through statuses. |
| Assign queued parties to tables | Partial | Backend supports optional `table_id` while seating, but the current dashboard seats without selecting a table. |
| Restaurant settings | Mostly met | Capacity, turn time, and accepting queue status are editable. Operating hours exist in the model/API allowlist but are not exposed in the current settings UI. |
| Customer email/password authentication | Met | Register/login endpoints and screens exist. |
| Optional Google/social login | Not implemented | The user model has a `google_id` field, but there is no social sign-in flow. |
| JWT stored securely on device | Met | Native uses Expo SecureStore; web uses localStorage. |
| Staff/admin session timeout | Met | Staff/admin JWT expiry uses `STAFF_SESSION_TIMEOUT_MINUTES`. |
| Role-based access control | Met | Backend decorators enforce customer/staff/admin access. |
| React Native + TypeScript + Expo mobile frontend | Met | Frontend is an Expo React Native TypeScript app. |
| React Native + TypeScript + Expo web frontend | Met | `npm run web` runs the same Expo app on web. |
| Python + Flask backend/API | Met | Backend is a Flask API. |
| MongoDB NoSQL database | Met | Backend uses MongoDB through PyMongo. |
| JWT authentication | Met | JWT token generation and role guards are implemented. |
| Flask-SocketIO / polling real-time sync | Met | Flask-SocketIO and socket.io-client are implemented. |
| Project limitations respected | Met | No payment, GPS tracking, offline mode, or live chat features are implemented. |

## Known Gaps

- There is no seed script or first-admin bootstrap flow. To create restaurants and staff through protected admin endpoints, an admin user must already exist in MongoDB.
- `max_queue_capacity` is editable but is not enforced when a customer joins a queue.
- QR scanning exists as a screen but is not reachable from the current customer tabs.
- Optional Google/social login from the proposal is not implemented.
- Native push notifications are not implemented; the current alert is in-app through Socket.IO.
- The web frontend is the Expo Web version of the React Native app, matching the updated proposal stack of React Native + TypeScript + Expo for web.
- `frontend/.env` should point to the actual backend port. The Docker setup exposes the backend on `5000`.

## Development Notes

- The backend creates indexes on startup for users, queue entries, restaurants, and tables.
- Customers are restricted to one active queue at a time.
- Cancelling or seating a queue entry decrements the restaurant queue length and resequences waiting entries.
- Staff/admin tokens expire sooner than customer tokens based on `STAFF_SESSION_TIMEOUT_MINUTES`.
