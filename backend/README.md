# EDUNEXUS Backend (FastAPI)

## Run locally (PowerShell)

```powershell
cd "C:\Users\Nature\Downloads\edunexus-main\nexus-ai-dashboard-main\nexus-ai-dashboard-main\backend"
C:\Users\Nature\AppData\Local\Programs\Python\Python313\python.exe -m pip install -r requirements.txt
C:\Users\Nature\AppData\Local\Programs\Python\Python313\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API docs

- Swagger: http://localhost:8000/docs
- OpenAPI: http://localhost:8000/openapi.json

## Implemented endpoints

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/login-json`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /uploads/*` (static files)

Note: this is an in-memory dev backend. Data resets when server restarts.
