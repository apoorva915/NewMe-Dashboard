# NeuMe – Parent Monitor

A simple prototype that logs focus sessions and shows a live parent dashboard. No auth, no build tools—just Python, Flask, SQLite, and a single HTML file.

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

## Demo the system in 4 steps

1. **Start the backend**  
   In a terminal: `cd backend` then `python app.py`.

2. **Open the dashboard**  
   Open `frontend/index.html` in your browser, or run `python -m http.server 8000` from `neume-parent-monitor` and go to **http://127.0.0.1:8000/frontend/index.html**.

3. **Start a session**  
   Click **Start Session**. The status should show “Running”.

4. **Try the controls**  
   - Move the **Focus** slider to send focus scores; the battery bar updates.  
   - Click **Trigger Meltdown** to show “Taking a comfort break 💛”.  
   - Click **End Session** to mark the session as ended.

The dashboard polls the server every second, so you see updates without refreshing.

## API summary

| Method | Endpoint       | Purpose                                      |
|--------|----------------|----------------------------------------------|
| POST   | `/start_session` | Create a session; returns `session_id`    |
| POST   | `/add_focus`     | Send `session_id` + `focus_score` (0–100) |
| POST   | `/meltdown`      | Log a meltdown for the session            |
| POST   | `/end_session`   | Mark session as ended                     |
| GET    | `/latest`        | Latest session status, focus, meltdown    |

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
