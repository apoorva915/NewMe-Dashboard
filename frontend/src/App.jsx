import { useState, useCallback, useEffect } from 'react'

const API = import.meta.env.DEV ? '/api' : 'http://127.0.0.1:5000'

function attentionLevel(score) {
  if (score == null || score === undefined) return null
  if (score >= 70) return 'High'
  if (score >= 40) return 'Moderate'
  return 'Low'
}

function formatDuration(sec) {
  if (sec == null) return '—'
  if (sec < 60) return sec + 's'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? m + 'm ' + s + 's' : m + 'm'
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch (_) {
    return iso
  }
}

function NavBar({ activeTab, onSelect }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'overview', label: 'Overview' },
  ]
  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">NeuMe</span>
        <span className="navbar-tagline">Parent Monitor</span>
      </div>
      <nav className="navbar-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={'navbar-tab' + (activeTab === tab.id ? ' active' : '')}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="navbar-actions">
        <button type="button" className="navbar-btn navbar-btn-setting" aria-label="Settings">
          <span className="navbar-btn-icon">⚙</span>
          <span>Setting</span>
        </button>
        <button type="button" className="navbar-btn navbar-btn-icon-only" aria-label="Notifications">
          <span className="navbar-btn-icon">🔔</span>
          <span className="navbar-notification-dot" aria-hidden />
        </button>
        <button type="button" className="navbar-btn navbar-btn-avatar" aria-label="Profile">
          <img src="/avatar.png" alt="" className="navbar-avatar" />
        </button>
      </div>
    </header>
  )
}

function WeeklyStats({ history }) {
  const sessions = history?.sessions_this_week ?? 0
  const avgSec = history?.avg_duration_seconds_this_week
  const avgStr = avgSec != null ? (avgSec < 60 ? avgSec + 's' : Math.round(avgSec / 60) + ' min') : '—'
  const comfort = history?.comfort_breaks_this_week ?? 0
  return (
    <div className="dashboard-card">
      <h2 className="dashboard-card-title">This week</h2>
      <div className="weekly-stats">
        <div className="stat-block stat-block-sessions">
          <p className="stat-value">{sessions}</p>
          <p className="stat-label">Sessions</p>
        </div>
        <div className="weekly-stats-fill">
          <div className="stat-block">
            <p className="stat-value">{avgStr}</p>
            <p className="stat-label">Avg time</p>
          </div>
          <div className="stat-block">
            <p className="stat-value">{comfort}</p>
            <p className="stat-label">Comfort breaks</p>
            <p className="stat-helper">Mostly short, recovery-focused breaks</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function AttentionStability({ history }) {
  const sessions = (history?.sessions ?? []).slice(0, 7)
  const levels = sessions.map((s) => (s.avg_focus != null ? attentionLevel(s.avg_focus) : null))
  const descriptor = (() => {
    if (levels.length === 0) return '—'
    const high = levels.filter((l) => l === 'High').length
    const low = levels.filter((l) => l === 'Low').length
    if (high >= 4) return 'High'
    if (low >= 3) return 'Low'
    return 'Moderate'
  })()
  return (
    <div className="dashboard-card">
      <h2 className="dashboard-card-title">Attention stability</h2>
      <p className="stability-descriptor">{descriptor}</p>
      <p className="stability-label">Stability over the past 7 sessions</p>
      <div className="stability-bars">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          const level = levels[i] || 'Moderate'
          const h = level === 'High' ? 85 : level === 'Low' ? 35 : 60
          return (
            <div
              key={i}
              className={'stability-bar ' + (level === 'High' ? '' : level === 'Low' ? 'low' : 'moderate')}
              style={{ height: (h || 20) + '%' }}
              aria-hidden
            />
          )
        })}
      </div>
      <p className="stability-helper">Last 7 sessions (older → newer)</p>
    </div>
  )
}

function EngagedTime({ summary, history }) {
  let sec = summary?.duration_seconds
  if (sec == null && history?.sessions?.length) {
    const withDur = history.sessions.filter((s) => s.duration_seconds != null)
    if (withDur.length) sec = withDur.reduce((a, s) => a + s.duration_seconds, 0) / withDur.length
  }
  const display = sec != null ? formatDuration(Math.round(sec)) : '—'
  const pct = sec != null && sec > 0 ? Math.min(100, (sec / 600) * 100) : 0
  const avgSecThisWeek = history?.avg_duration_seconds_this_week
  const contextLine = (() => {
    if (sec == null || avgSecThisWeek == null) return 'Typical for this child'
    const diff = sec - avgSecThisWeek
    if (diff < -60) return 'Slightly below weekly average'
    if (diff > 60) return 'Above weekly average'
    return 'Typical for this child'
  })()
  return (
    <div className="dashboard-card">
      <h2 className="dashboard-card-title">Engaged time</h2>
      <div className="engaged-time-wrap">
        <div className="engaged-ring" style={{ '--p': (pct / 100) * 360 + 'deg' }}>
          <div className="engaged-ring-inner">
            <p className="engaged-value">{display}</p>
            <p className="engaged-label">Avg time</p>
          </div>
        </div>
        <p className="engaged-context">{contextLine}</p>
      </div>
    </div>
  )
}

function SessionTimeline({ history }) {
  const sessions = (history?.sessions ?? []).slice(0, 6)
  return (
    <div className="dashboard-card">
      <h2 className="dashboard-card-title">Weekly session rhythm</h2>
      <p className="timeline-section-label">Recent sessions</p>
      <ul className="timeline-list">
        {sessions.length === 0 ? (
          <li className="timeline-item"><span className="timeline-session">No sessions yet</span></li>
        ) : (
          sessions.map((s) => {
            const level = s.avg_focus != null ? attentionLevel(s.avg_focus) : null
            const dotClass = level === 'High' ? 'timeline-dot high' : level === 'Low' ? 'timeline-dot low' : 'timeline-dot moderate'
            return (
              <li key={s.session_id} className="timeline-item">
                <span className="timeline-session">Session {String(s.session_id).padStart(2, '0')}</span>
                <span className="timeline-meta">
                  <span className={dotClass} aria-hidden />
                  {formatDuration(s.duration_seconds)} · {level || '—'}
                </span>
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}

function DashboardInsight({ history }) {
  const sessions = history?.sessions_this_week ?? 0
  const comfort = history?.comfort_breaks_this_week ?? 0
  const line = sessions > 0
    ? comfort > 0
      ? 'Overall, attention has been steady this week with short recovery breaks.'
      : 'Overall, attention has been steady this week.'
    : 'Start a session to see your weekly summary.'
  return <p className="dashboard-insight">{line}</p>
}

function Dashboard({ latest, summary, history }) {
  return (
    <div className="dashboard-content">
      <DashboardInsight history={history} />
      <div className="dashboard-grid">
        <div className="dashboard-cell dashboard-cell-1-1">
          <WeeklyStats history={history} />
        </div>
        <div className="dashboard-cell dashboard-cell-2-1">
          <AttentionStability history={history} />
        </div>
        <div className="dashboard-cell dashboard-cell-1-2">
          <SessionTimeline history={history} />
        </div>
        <div className="dashboard-cell dashboard-cell-2-2">
          <EngagedTime summary={summary} history={history} />
        </div>
      </div>
    </div>
  )
}

function StatusCard({ latest }) {
  const statusLabels = {
    running: 'Session running smoothly',
    ended: 'Session ended calmly',
    interrupted: 'Session paused for comfort',
  }
  const text = latest?.session_id ? (statusLabels[latest.status] || 'Session running smoothly') : 'No active session'
  let accent = 'accent-none'
  if (latest?.session_id) {
    if (latest.status === 'running') accent = 'accent-green'
    else if (latest.status === 'interrupted') accent = 'accent-yellow'
    else accent = 'accent-grey'
  }
  const timeStr = (() => {
    const raw = latest?.status === 'ended' || latest?.status === 'interrupted' ? latest?.end_time : latest?.start_time
    if (!raw) return null
    try {
      const d = new Date(raw)
      return d.toLocaleString(undefined, { timeStyle: 'short' })
    } catch (_) {
      return null
    }
  })()
  const timeLabel = latest?.status === 'running' ? 'Started at' : latest?.status === 'ended' || latest?.status === 'interrupted' ? 'Ended at' : null
  return (
    <div className={'card status-card ' + accent}>
      <h2 className="card-section-header">Session Status</h2>
      <p className="primary-status-text">{text}</p>
      {timeLabel && timeStr && <p className="status-timestamp">{timeLabel} {timeStr}</p>}
    </div>
  )
}

function AttentionEnergyCard({ latest }) {
  const score = latest?.focus_score
  const pct = score != null && score !== undefined ? Math.max(0, Math.min(100, score)) : 0
  const level = attentionLevel(pct)
  let fillClass = 'battery-fill'
  if (pct > 0) {
    if (pct < 40) fillClass += ' red'
    else if (pct < 70) fillClass += ' yellow'
  }
  return (
    <div className="card">
      <h2 className="card-section-header">Attention Energy</h2>
      <div className="battery-wrap">
        <div className={fillClass} style={{ width: pct + '%' }} />
      </div>
      <p className="attention-label">{level || '—'}</p>
      <p className="attention-label-secondary">{pct > 0 ? pct + '%' : ''}</p>
      <p className="attention-range-labels">Low · Moderate · High</p>
    </div>
  )
}

function ComfortCard({ latest, onClearMeltdown }) {
  const showMeltdown = latest?.meltdown && latest?.session_id
  return (
    <div className="card">
      <h2 className="card-section-header">Comfort</h2>
      <div className={'comfort-card-inner' + (showMeltdown ? '' : ' hidden')}>
        <p className="comfort-message">Taking a comfort break 💛</p>
        <p className="comfort-helper">The system noticed signs of stress and slowed things down.</p>
        <button type="button" className="btn btn-secondary comfort-clear" onClick={onClearMeltdown}>
          Clear message
        </button>
      </div>
      {!showMeltdown && (
        <>
          <p className="comfort-headline">No comfort needed</p>
          <p className="comfort-helper">The system hasn&apos;t detected stress recently.</p>
        </>
      )}
    </div>
  )
}

function SessionSummaryCard({ summary }) {
  if (!summary?.session_id) {
    return (
      <div className="card">
        <h2 className="card-section-header">Session Summary</h2>
        <p className="summary-empty">Start a session to see a summary here.</p>
      </div>
    )
  }
  const mins = summary.duration_seconds != null ? Math.round(summary.duration_seconds / 60) : null
  const avgLabel = summary.avg_focus != null ? attentionLevel(summary.avg_focus) : '—'
  const breaks = summary.comfort_breaks_count != null ? summary.comfort_breaks_count : 0
  return (
    <div className="card">
      <h2 className="card-section-header">Session Summary</h2>
      <ul className="summary-list">
        <li>Duration: {mins != null ? mins + ' minute' + (mins !== 1 ? 's' : '') : '—'}</li>
        <li>Average attention: {avgLabel || '—'}</li>
        <li>Comfort breaks: {breaks}</li>
      </ul>
      <p className="summary-overall summary-overall-bold">Overall, today&apos;s session felt calm and productive.</p>
    </div>
  )
}

function DeveloperBox({
  currentSessionId,
  focusSliderValue,
  onFocusSliderChange,
  onStartSession,
  onEndSession,
  onEndSessionEarly,
  onTriggerMeltdown,
  onRefreshAfterAction,
}) {
  const [simulating, setSimulating] = useState(false)

  const handleSimulate = () => {
    if (simulating) return
    onStartSession().then((sid) => {
      if (sid == null) {
        setSimulating(false)
        return
      }
      setSimulating(true)
      let count = 0
      const max = 10
      const iv = setInterval(() => {
        fetch(API + '/add_focus', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sid, focus_score: 40 + Math.floor(Math.random() * 55) }),
        }).catch(() => {})
        onRefreshAfterAction()
        count++
        if (count === 4) {
          fetch(API + '/meltdown', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sid }),
          }).then(() => onRefreshAfterAction()).catch(() => {})
        }
        if (count >= max) {
          clearInterval(iv)
          fetch(API + '/end_session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sid }),
          })
            .then(() => onRefreshAfterAction())
            .catch(() => {})
          setSimulating(false)
        }
      }, 2000)
    }).catch(() => setSimulating(false))
  }

  return (
    <div className="card developer-section" title="Visible only in demo mode">
      <h2 className="card-section-header developer-section-header">
        <span className="developer-lock" aria-hidden>🔒</span>
        Not shown to parents
      </h2>
      <p className="developer-tooltip">Visible only in demo mode</p>
      <p>Use these to simulate sessions and test the dashboard.</p>
      <div className="controls">
        <button type="button" className="btn btn-primary" onClick={onStartSession}>
          Start Session
        </button>
        <button type="button" className="btn btn-secondary" onClick={onEndSession} disabled={!currentSessionId}>
          End Session
        </button>
        <button type="button" className="btn btn-secondary" onClick={onEndSessionEarly} disabled={!currentSessionId}>
          End session early
        </button>
        <button type="button" className="btn btn-comfort" onClick={onTriggerMeltdown} disabled={!currentSessionId}>
          Trigger Meltdown
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleSimulate} disabled={simulating}>
          {simulating ? 'Simulating…' : 'Simulate session'}
        </button>
      </div>
      <div className="slider-wrap">
        <label>Focus (0–100): {focusSliderValue}</label>
        <input
          type="range"
          min="0"
          max="100"
          value={focusSliderValue}
          onChange={(e) => onFocusSliderChange(parseInt(e.target.value, 10))}
        />
      </div>
    </div>
  )
}

function Overview({
  latest,
  summary,
  onClearMeltdown,
  currentSessionId,
  focusSliderValue,
  onFocusSliderChange,
  onStartSession,
  onEndSession,
  onEndSessionEarly,
  onTriggerMeltdown,
  onRefreshAfterAction,
}) {
  return (
    <div className="overview-layout">
      <div className="overview-left">
        <StatusCard latest={latest} />
        <AttentionEnergyCard latest={latest} />
        <ComfortCard latest={latest} onClearMeltdown={onClearMeltdown} />
        <SessionSummaryCard summary={summary} />
      </div>
      <div className="overview-right">
        <DeveloperBox
          currentSessionId={currentSessionId}
          focusSliderValue={focusSliderValue}
          onFocusSliderChange={onFocusSliderChange}
          onStartSession={onStartSession}
          onEndSession={onEndSession}
          onEndSessionEarly={onEndSessionEarly}
          onTriggerMeltdown={onTriggerMeltdown}
          onRefreshAfterAction={onRefreshAfterAction}
        />
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('overview')
  const [latest, setLatest] = useState(null)
  const [summary, setSummary] = useState(null)
  const [history, setHistory] = useState(null)
  const [focusSliderValue, setFocusSliderValue] = useState(80)

  const pollLatest = useCallback(() => {
    fetch(API + '/latest')
      .then((res) => res.json())
      .then(setLatest)
      .catch(() => setLatest(null))
  }, [])

  const loadSummary = useCallback(() => {
    fetch(API + '/session_summary')
      .then((res) => res.json())
      .then(setSummary)
      .catch(() => setSummary(null))
  }, [])

  const loadHistory = useCallback(() => {
    fetch(API + '/history')
      .then((res) => res.json())
      .then(setHistory)
      .catch(() => setHistory(null))
  }, [])

  const refreshAll = useCallback(() => {
    pollLatest()
    loadSummary()
    loadHistory()
  }, [pollLatest, loadSummary, loadHistory])

  useEffect(() => {
    pollLatest()
    loadSummary()
    loadHistory()
    const t = setInterval(pollLatest, 1000)
    const s = setInterval(loadSummary, 2000)
    return () => {
      clearInterval(t)
      clearInterval(s)
    }
  }, [pollLatest, loadSummary, loadHistory])

  const currentSessionId = latest?.session_id ?? null

  const onClearMeltdown = useCallback(() => {
    if (!currentSessionId) return
    fetch(API + '/clear_meltdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: currentSessionId }),
    }).then(pollLatest).catch(console.error)
  }, [currentSessionId, pollLatest])

  const onStartSession = useCallback(() => {
    return fetch(API + '/start_session', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        refreshAll()
        return data.session_id
      })
      .catch(console.error)
  }, [refreshAll])

  const onEndSession = useCallback(() => {
    if (!currentSessionId) return
    fetch(API + '/end_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: currentSessionId }),
    }).then(refreshAll).catch(console.error)
  }, [currentSessionId, refreshAll])

  const onEndSessionEarly = useCallback(() => {
    if (!currentSessionId) return
    fetch(API + '/end_session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: currentSessionId, interrupted: true }),
    }).then(refreshAll).catch(console.error)
  }, [currentSessionId, refreshAll])

  const onTriggerMeltdown = useCallback(() => {
    if (!currentSessionId) return
    fetch(API + '/meltdown', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: currentSessionId }),
    }).then(pollLatest).catch(console.error)
  }, [currentSessionId, pollLatest])

  const onFocusSliderChange = useCallback((value) => {
    setFocusSliderValue(value)
    if (!currentSessionId) return
    fetch(API + '/add_focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: currentSessionId, focus_score: value }),
    }).catch(console.error)
  }, [currentSessionId])

  return (
    <div className="app-container">
      <NavBar activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === 'dashboard' && (
        <div className="tab-content">
          <Dashboard latest={latest} summary={summary} history={history} />
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="tab-content">
          <Overview
          latest={latest}
          summary={summary}
          onClearMeltdown={onClearMeltdown}
          currentSessionId={currentSessionId}
          focusSliderValue={focusSliderValue}
          onFocusSliderChange={onFocusSliderChange}
          onStartSession={onStartSession}
          onEndSession={onEndSession}
          onEndSessionEarly={onEndSessionEarly}
          onTriggerMeltdown={onTriggerMeltdown}
          onRefreshAfterAction={refreshAll}
        />
        </div>
      )}
    </div>
  )
}
