# NeuMe – Parent Monitor

A **Focus Session Logger + Parent Monitor** prototype: receive session, focus, and meltdown data; store it safely (crash-safe SQLite); show parents a live view and progress over time. No headset or game required—simulated inputs are enough for a full end-to-end demo.

## Tech stack

- **Backend:** Python + Flask  
- **Database:** SQLite (single `neume.db` file)  
- **Frontend:** One HTML file with inline CSS and vanilla JavaScript  

## Install dependencies

From the project root (`neume-parent-monitor/`):

```bash
pip install -r requirements.txt
```

Or just: `pip install flask`

Or use a virtual environment:

```bash
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate   # macOS/Linux
pip install flask
```

## Run the backend

```bash
cd backend
python app.py
```

The server runs at **http://127.0.0.1:5000**. The SQLite database `neume.db` is created automatically in the `backend/` folder on first run.

## Open the frontend

**Option A – Double-click (easiest)**  
Open `frontend/index.html` in your browser (double-click the file or **File → Open**).

**Option B – HTTP server**  
Run the server **from inside** the `neume-parent-monitor` folder (so `/frontend/` exists):

```bash
cd neume-parent-monitor
python -m http.server 8000
```

Then open **http://127.0.0.1:8000/frontend/index.html** in your browser.

If you run `python -m http.server 8000` from a different folder (e.g. `NewMe`), you’ll get 404—the server only serves files under the folder where you started it.

Make sure the backend is running so the dashboard can talk to it.

## End-to-end demo (5 steps)

1. **Start the backend**  
   In a terminal: `cd backend` then `python app.py`.

2. **Open the dashboard**  
   Open `frontend/index.html` in your browser, or run `python -m http.server 8000` from `neume-parent-monitor` and go to **http://127.0.0.1:8000/frontend/index.html**.

3. **Start a session**  
   Click **Start Session**. Status shows “Session Running”. DB row is created.

4. **Simulate focus and events**  
   - Move the **Focus** slider (0–100); battery bar updates live (green 70+, yellow 40–69, red 0–39).  
   - Click **Trigger Meltdown** → “Taking a comfort break 💛” appears; click **Clear message** to dismiss.  
   - Click **End Session** (normal end) or **End session early** (interrupted). Data is preserved.

5. **View progress over time**  
   Scroll to **Progress over time**. See sessions this week, a table of past sessions (start time, duration, avg focus, status), and click **Refresh history** to reload.

**Simulate session** runs a short automated demo: starts a session, sends random focus every 2 seconds, triggers one meltdown, then ends—good for judges and demos.

The dashboard polls `/latest` every second; every insert is committed immediately (crash-safe).

## API summary

| Method | Endpoint       | Purpose |
|--------|----------------|--------|
| POST   | `/start_session` | Create session; returns `session_id` |
| POST   | `/add_focus`     | Send `session_id` + `focus_score` (0–100); optional `timestamp` |
| POST   | `/meltdown`      | Log meltdown; optional `timestamp`, `notes` |
| POST   | `/clear_meltdown` | Clear meltdown message for session |
| POST   | `/end_session`   | Mark ended; send `interrupted: true` for “ended early” |
| GET    | `/latest`        | Latest session status, focus score, meltdown flag |
| GET    | `/history`       | List sessions with duration, avg focus; `sessions_this_week` |

## Project structure

```
neume-parent-monitor/
├── backend/
│   ├── app.py        # Flask server + endpoints
│   ├── database.py   # SQLite setup + table creation
│   └── neume.db      # Created automatically
├── frontend/
│   └── index.html    # Parent dashboard + demo controls
└── README.md
```

This is a demo-quality prototype; it can be extended or integrated into a larger system later.
