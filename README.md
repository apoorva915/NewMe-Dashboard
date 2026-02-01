# NeuMe – Parent Monitor

A **parent-facing monitoring dashboard** for focus sessions and comfort breaks. Parents see a calm, summary-first view of how a child’s attention and recovery are trending—without technical charts or raw data. The system stores session, focus, and comfort events in a crash-safe SQLite database and serves them through a REST API; the React frontend polls for live updates and presents two views: **Dashboard** (weekly at a glance) and **Overview** (current session and controls). No headset or game is required—simulated inputs are enough for a full end-to-end demo.

---

## About the system

### What it does

NeuMe Parent Monitor answers a single question first: **“Is my child okay?”** It does not show raw metrics or complex graphs. Instead it surfaces:

- **Session status** — Whether a focus session is running, paused for a comfort break, or ended calmly, with a timestamp when relevant.
- **Attention energy** — A simple 0–100 “battery” for the latest focus level, interpreted as High (70+), Moderate (40–69), or Low (0–39).
- **Comfort** — Whether the system has detected stress and triggered a comfort break (“Taking a comfort break”) or that no comfort is needed right now, with reassuring copy.
- **Weekly summary** — How many sessions happened this week, average engaged time, and how many comfort breaks occurred, with a short narrative (e.g. “Overall, attention has been steady this week with short recovery breaks”).
- **Attention stability** — A small bar view of the last seven sessions’ attention level (High/Moderate/Low) so parents can see trend at a glance.
- **Engaged time** — Average time spent in focus during sessions, with context (e.g. “Typical for this child” or “Slightly below weekly average”).
- **Session rhythm** — A scrollable list of recent sessions with duration and attention level, plus a status dot (green / amber / muted red) for quick scanning.
- **Session summary** — After a session ends: duration, average attention, comfort break count, and a bold closing line (e.g. “Overall, today’s session felt calm and productive.”).

The UI is deliberately calm and empathetic: muted colours, rounded cards, and copy that explains what the numbers mean rather than leaving parents to interpret raw values.

### How it works

**Data model**

- **Sessions** — A session has a start time, an optional end time, and a status: `running`, `interrupted` (e.g. comfort break or ended early), or `ended`. Each session has a unique ID.
- **Focus logs** — During a session, the client (or a simulator) sends **focus scores** (0–100) at intervals. These are stored with timestamps. The backend does not interpret the score—it only stores and aggregates (e.g. latest score for live display, average for summaries).
- **Events** — “Meltdown” events represent moments when the system detected stress and triggered a comfort break. A “meltdown_cleared” event records that the parent (or system) acknowledged it. The dashboard uses this to show or hide the “Taking a comfort break” message.

**Flow**

1. **Start session** — Client calls `POST /start_session`. The backend creates a row in `sessions` with `status = 'running'` and returns `session_id`.
2. **During session** — Client sends `POST /add_focus` with `session_id` and `focus_score` (0–100). Each insert is committed immediately so data is not lost on crash.
3. **Comfort break** — When the system detects stress (or for demo, when “Trigger Meltdown” is used), client calls `POST /meltdown`. The UI shows the comfort message until `POST /clear_meltdown` is called.
4. **End session** — Client calls `POST /end_session` with optional `interrupted: true`. The backend sets `end_time` and `status` so duration and summaries can be computed.
5. **Parent view** — The frontend polls `GET /latest` (about once per second) for current session status, focus score, and meltdown flag; `GET /session_summary` for the latest session’s duration, average focus, and comfort break count; and `GET /history` for session list and weekly aggregates (sessions this week, comfort breaks this week, average duration, and a narrative insight sentence).

**Interpretation**

- Attention is mapped to **High** (≥70), **Moderate** (40–69), or **Low** (0–39) for display only; the backend does not change stored values.
- “Engaged time” in the UI is the average session duration (or current session duration so far) derived from start/end times and focus logs.
- The Dashboard insight line and “Typical for this child” / “Slightly below weekly average” text are derived from comparing current or latest session to weekly averages returned by `/history`.

**Demo mode**

The **Overview** tab includes a “Not shown to parents” developer section (with lock icon and “Visible only in demo mode” tooltip). It allows starting/ending sessions, sending focus via a slider, triggering and clearing meltdowns, and running an automated “Simulate session” flow—so the product can be demonstrated without a real headset or game integration.

**Tech stack**

- **Backend:** Python 3, Flask. Single process; SQLite with immediate commit on every insert (crash-safe).
- **Database:** SQLite (`neume.db` in `backend/`). Tables: `sessions`, `focus_logs`, `events`. Created automatically on first run.
- **Frontend:** React 18, Vite. Single-page app with two tabs (Dashboard, Overview); no router. CSS-only styling.

---

## Setup

### Prerequisites

- **Python 3.7+** (for the backend)
- **Node.js 18+** and **npm** (for the frontend)

### Backend

1. From the project root, install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

   Or install Flask only: `pip install flask`

2. (Optional) Use a virtual environment:

   ```bash
   python -m venv venv
   venv\Scripts\activate   # Windows
   # source venv/bin/activate   # macOS / Linux
   pip install -r requirements.txt
   ```

3. Start the server:

   ```bash
   cd backend
   python app.py
   ```

   The API runs at **http://127.0.0.1:5000**. The file `backend/neume.db` is created automatically on first run.

### Frontend

1. From the project root, install Node dependencies and start the dev server:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   The app is served at **http://localhost:5173**.

2. **Start the backend first.** The Vite dev server proxies requests under `/api` to `http://127.0.0.1:5000`, so the frontend can call the API without CORS issues during development.

3. Open **http://localhost:5173** in a browser. Use the **Overview** tab to start a session, move the Focus slider, trigger/clear meltdown, and end the session; use the **Dashboard** tab to see weekly stats, attention stability, engaged time, and session rhythm.

### Production build (optional)

- Build the frontend: `cd frontend && npm run build`. Output is in `frontend/dist/`.
- Serve the contents of `frontend/dist/` with any static file server, and ensure the backend is reachable at the URL your frontend uses (e.g. set the API base URL in the app or behind a reverse proxy that forwards `/api` to the Flask server).

### Project structure

```
neume-parent-monitor/
├── backend/
│   ├── app.py          # Flask app, routes, and business logic
│   ├── database.py     # SQLite connection and table creation
│   └── neume.db        # Created automatically
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js  # Dev server and /api proxy
│   ├── public/
│   └── src/
│       ├── main.jsx
│       ├── App.jsx     # Tabs, Dashboard, Overview, all cards
│       └── index.css
├── requirements.txt
└── README.md
```

This is a demo-quality prototype and can be extended or integrated into a larger system (e.g. real headset/game clients, auth, or multi-child support) as needed.
