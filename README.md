# EDUNEXUS

EDUNEXUS is a role-based college management dashboard with a React frontend and a FastAPI backend.

It supports multiple user roles such as Student, Staff, Admin, Club Coordinator, and Exam Coordinator, with dedicated workflows for assignments, notes, queries, events, smart seating, and hall ticket management.

## Features

- Role-based authentication and dashboards
- Student dashboard with attendance and fee eligibility data
- Hall ticket generation and PDF download
- Exam coordinator bulk hall ticket generation with generated-ticket listing
- Smart seating preview and visualization
- Staff assignment and query management
- Club coordinator event submission and event tracking

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- Backend: FastAPI, SQLite
- Testing: Vitest

## Project Structure

```text
nexus-ai-dashboard-main/
	backend/                  # FastAPI backend + SQLite database
		main.py
		requirements.txt
	src/                      # React app source code
	package.json
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ (3.13 also works)

## Local Setup

1. Clone the repository

```bash
git clone https://github.com/Nandhini3Devaraj/edunexus.git
cd edunexus
```

2. Install frontend dependencies

```bash
npm install
```

3. Install backend dependencies

```bash
cd backend
python -m pip install -r requirements.txt
cd ..
```

## Run the Application

Run backend (Terminal 1):

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Run frontend (Terminal 2):

```bash
npm run dev
```

App URLs:

- Frontend: http://localhost:8080 (or the Vite port shown in terminal)
- Backend health: http://localhost:8000/api/health
- Swagger docs: http://localhost:8000/docs

## Useful Scripts

```bash
npm run dev         # Start frontend in dev mode
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run test        # Run tests once
npm run test:watch  # Run tests in watch mode
```

## API Overview

Authentication:

- POST /api/auth/register
- POST /api/auth/login-json
- GET /api/auth/me

Hall Tickets:

- GET /api/hall-tickets/eligibility
- POST /api/hall-tickets/generate
- POST /api/hall-tickets/generate-bulk
- GET /api/hall-tickets/generated
- GET /api/hall-tickets/{ticket_id}/pdf

Events:

- POST /api/events
- GET /api/events/my

## Notes

- Backend uses SQLite. A local database file is created under backend.
- This repository currently tracks backend/edunexus.db. If needed, add it to .gitignore and untrack it in a follow-up commit.

## Contributing

1. Create a branch
2. Commit your changes
3. Push and open a pull request

## License

No license file has been added yet.



