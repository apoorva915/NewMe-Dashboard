"""
Flask backend for NeuMe Parent Monitor.
All inserts are committed immediately (no buffering) for crash safety.
"""

from flask import Flask, request, jsonify
from datetime import datetime
import database

app = Flask(__name__)

# CORS: allow frontend on another port/origin to call this API
@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return resp


@app.before_request
def handle_preflight():
    """Respond to CORS preflight (OPTIONS) so POST requests from the dashboard succeed."""
    if request.method == "OPTIONS":
        return "", 204

# Create tables on startup
database.init_db()


def _now():
    """ISO timestamp for consistency."""
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")


@app.route("/start_session", methods=["POST"])
def start_session():
    """Create a new session; returns session_id."""
    conn = database.get_connection()
    try:
        cur = conn.execute(
            "INSERT INTO sessions (start_time, status) VALUES (?, 'running')",
            (_now(),),
        )
        conn.commit()
        session_id = cur.lastrowid
        return jsonify({"session_id": session_id})
    finally:
        conn.close()


@app.route("/add_focus", methods=["POST"])
def add_focus():
    """Record a focus score (0–100) for a session. Commits immediately."""
    data = request.get_json() or {}
    session_id = data.get("session_id")
    focus_score = data.get("focus_score")
    if session_id is None or focus_score is None:
        return jsonify({"error": "session_id and focus_score required"}), 400
    try:
        focus_score = int(focus_score)
    except (TypeError, ValueError):
        return jsonify({"error": "focus_score must be a number"}), 400
    if not 0 <= focus_score <= 100:
        return jsonify({"error": "focus_score must be 0–100"}), 400

    conn = database.get_connection()
    try:
        conn.execute(
            "INSERT INTO focus_logs (session_id, timestamp, focus_score) VALUES (?, ?, ?)",
            (session_id, _now(), focus_score),
        )
        conn.commit()
        return jsonify({"ok": True})
    finally:
        conn.close()


@app.route("/meltdown", methods=["POST"])
def meltdown():
    """Log a meltdown event for the given session."""
    data = request.get_json() or {}
    session_id = data.get("session_id")
    if session_id is None:
        return jsonify({"error": "session_id required"}), 400

    conn = database.get_connection()
    try:
        conn.execute(
            "INSERT INTO events (session_id, timestamp, event_type) VALUES (?, ?, 'meltdown')",
            (session_id, _now()),
        )
        conn.commit()
        return jsonify({"ok": True})
    finally:
        conn.close()


@app.route("/clear_meltdown", methods=["POST"])
def clear_meltdown():
    """Record that the meltdown message was acknowledged/cleared for this session."""
    data = request.get_json() or {}
    session_id = data.get("session_id")
    if session_id is None:
        return jsonify({"error": "session_id required"}), 400

    conn = database.get_connection()
    try:
        conn.execute(
            "INSERT INTO events (session_id, timestamp, event_type) VALUES (?, ?, 'meltdown_cleared')",
            (session_id, _now()),
        )
        conn.commit()
        return jsonify({"ok": True})
    finally:
        conn.close()


@app.route("/end_session", methods=["POST"])
def end_session():
    """Mark a session as ended."""
    data = request.get_json() or {}
    session_id = data.get("session_id")
    if session_id is None:
        return jsonify({"error": "session_id required"}), 400

    conn = database.get_connection()
    try:
        conn.execute(
            "UPDATE sessions SET end_time = ?, status = 'ended' WHERE id = ?",
            (_now(), session_id),
        )
        conn.commit()
        return jsonify({"ok": True})
    finally:
        conn.close()


@app.route("/latest", methods=["GET"])
def latest():
    """
    Return latest session status, latest focus score, and whether a meltdown occurred.
    Used by the parent dashboard for polling.
    """
    conn = database.get_connection()
    try:
        # Latest session
        row = conn.execute(
            "SELECT id, status FROM sessions ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not row:
            return jsonify({
                "session_id": None,
                "status": None,
                "focus_score": None,
                "meltdown": False,
            })

        session_id, status = row

        # Latest focus score for this session
        focus_row = conn.execute(
            "SELECT focus_score FROM focus_logs WHERE session_id = ? ORDER BY id DESC LIMIT 1",
            (session_id,),
        ).fetchone()
        focus_score = focus_row[0] if focus_row else None

        # Meltdown is true if there's a meltdown event and no later meltdown_cleared
        max_meltdown = conn.execute(
            "SELECT MAX(id) FROM events WHERE session_id = ? AND event_type = 'meltdown'",
            (session_id,),
        ).fetchone()[0]
        max_cleared = conn.execute(
            "SELECT MAX(id) FROM events WHERE session_id = ? AND event_type = 'meltdown_cleared'",
            (session_id,),
        ).fetchone()[0]
        meltdown = max_meltdown is not None and (max_cleared is None or max_meltdown > max_cleared)

        return jsonify({
            "session_id": session_id,
            "status": status,
            "focus_score": focus_score,
            "meltdown": meltdown,
        })
    finally:
        conn.close()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
