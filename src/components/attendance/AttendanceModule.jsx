import React, { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw, Search, CalendarDays, UserRound, Clock3, X } from 'lucide-react';
import {
  getTodayAttendance,
  getEmployeeAttendance,
  getAttendanceSheet,
  addAdminPunch,
  updateAdminPunch
} from '../../services/attendanceService.js';
import { getStaff } from '../../services/staffService.js';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const tm = value => {
  if (!value || value === '-') return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getCurrentISTDateTime = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const dt = value => value ? new Date(value).toLocaleDateString() : '—';
const toDateTimeLocal = value => value ? String(value).replace(' ', 'T').slice(0, 16) : '';

export default function AttendanceModule({ view }) {
  const [date, setDate] = useState(todayISO());
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [staff, setStaff] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState(`${todayISO().slice(0, 7)}-01`);
  const [endDate, setEndDate] = useState(todayISO());
  const [sheet, setSheet] = useState([]);
  const [sheetDays, setSheetDays] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [punchTarget, setPunchTarget] = useState(null);
  const [punchDateTime, setPunchDateTime] = useState('');
  const [savingPunch, setSavingPunch] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    setNotice('');
    try {
      if (view === 'today') {
        const result = await getTodayAttendance({ date });
        setRows(result.items || []);
      } else if (view === 'employee') {
        const people = await getStaff();
        setStaff(people);
        const id = employeeId || (people[0] ? String(people[0].id) : '');
        if (id) {
          if (!employeeId) setEmployeeId(id);
          const result = await getEmployeeAttendance(id, { start_date: startDate, end_date: endDate });
          setRows(result.items || []);
        } else {
          setRows([]);
        }
      } else {
        const result = await getAttendanceSheet({ month });
        setSheet(result.items || []);
        setSheetDays(result.days_in_month || 0);
      }
    } catch (e) {
      setError(e.message || 'Unable to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [view]);

  const filtered = useMemo(
    () => rows.filter(r => `${r.name || ''} ${r.email || ''}`.toLowerCase().includes(search.toLowerCase())),
    [rows, search]
  );

  const openPunchEditor = row => {
    const existing = Number(row.check_in_count || 0) > 0;
    const defaultTime = existing && row.first_check_in
      ? toDateTimeLocal(row.first_check_in)
      : `${date}T09:00`;
    setPunchTarget({
      userId: row.user_id,
      attendanceId: existing ? row.first_check_in_id : null,
      employeeName: row.name,
      mode: existing ? 'edit' : 'add'
    });
    setPunchDateTime(defaultTime);
    setError('');
    setNotice('');
  };

  const savePunch = async event => {
    event.preventDefault();
    if (!punchTarget || !punchDateTime) return;
    setSavingPunch(true);
    setError('');
    try {
      const payload = { check_in_time: punchDateTime };
      if (punchTarget.mode === 'edit') {
        await updateAdminPunch(punchTarget.attendanceId, payload);
        setNotice(`Punch-in updated for ${punchTarget.employeeName}.`);
      } else {
        await addAdminPunch({ ...payload, user_id: punchTarget.userId });
        setNotice(`Punch-in added for ${punchTarget.employeeName}.`);
      }
      setPunchTarget(null);
      await load();
    } catch (e) {
      setError(e.message || 'Unable to save punch-in');
    } finally {
      setSavingPunch(false);
    }
  };

  const exportCsv = () => {
    const data = view === 'sheet'
      ? [['Employee', 'Email', ...Array.from({ length: sheetDays }, (_, i) => i + 1)],
        ...sheet.map(person => [person.name, person.email, ...Array.from({ length: sheetDays }, (_, i) => person.days?.[`${month}-${String(i + 1).padStart(2, '0')}`]?.status || '')])]
      : view === 'employee'
        ? [['Date', 'Check-in', 'Location', 'Confidence'], ...filtered.map(r => [dt(r.check_in_time), tm(r.check_in_time), r.location || '', r.confidence ?? ''])]
        : [['Employee', 'Email', 'First check-in', 'Last check-in', 'Events', 'Status'], ...filtered.map(r => [r.name, r.email, tm(r.first_check_in), tm(r.last_check_in), r.check_in_count, r.status])];

    const csv = data.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ta-attendance-${view}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="attendance-module-card">
      <div className="attendance-module-toolbar">
        <div>
          <h2>{view === 'today' ? "Today's Attendance" : view === 'employee' ? 'Employee Attendance' : 'Attendance Sheet'}</h2>
          <p>{view === 'today' ? 'Daily check-in activity across active staff' : view === 'employee' ? 'Check-in history for an individual employee' : 'Monthly attendance overview by employee'}</p>
        </div>
        <div className="attendance-module-actions">
          {view === 'today' && <label><CalendarDays size={17} /><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>}
          {view === 'employee' && <>
            <label><UserRound size={17} /><select value={employeeId} onChange={e => setEmployeeId(e.target.value)}><option value="">Select employee</option>{staff.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
            <label><input type="date" aria-label="Start date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
            <label><input type="date" aria-label="End date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
          </>}
          {view === 'sheet' && <label><CalendarDays size={17} /><input type="month" value={month} onChange={e => setMonth(e.target.value)} /></label>}
          <label className="attendance-module-search"><Search size={17} /><input placeholder="Search employee" value={search} onChange={e => setSearch(e.target.value)} /></label>
          <button onClick={load} title="Refresh"><RefreshCw size={18} /></button>
          <button onClick={exportCsv} title="Export CSV"><Download size={18} /></button>
          <button className="attendance-module-search-button" onClick={load}>Search</button>
        </div>
      </div>

      {error && <div className="attendance-module-error">{error}</div>}
      {notice && <div className="attendance-module-success">{notice}</div>}

      {loading ? <div className="attendance-module-empty">Loading attendance...</div> : view === 'today' ? (
        <div className="attendance-module-table-wrap">
          <table className="attendance-module-table">
            <thead><tr><th>Employee</th><th>Email</th><th>First check-in</th><th>Last check-in</th><th>Events</th><th>Status</th><th>Admin action</th></tr></thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.user_id}>
                  <td>{row.name}</td><td>{row.email}</td>
                  <td>{tm(row.first_check_in)}</td><td>{tm(row.last_check_in)}</td><td>{row.check_in_count}</td>
                  <td><span className={`attendance-module-status ${(row.status || 'Absent').toLowerCase()}`}>{row.status || 'Absent'}</span></td>
                  <td><button type="button" className="attendance-punch-action" onClick={() => openPunchEditor(row)}>
                    <Clock3 size={15} />{Number(row.check_in_count || 0) > 0 ? 'Edit First Punch' : 'Add Punch'}
                  </button></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="7" className="attendance-module-empty">No attendance records for this date.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : view === 'employee' ? (
        <div className="attendance-module-table-wrap">
          <table className="attendance-module-table">
            <thead><tr><th>Check-in date</th><th>Check-in time</th><th>Location</th><th>Confidence</th><th>Source image</th></tr></thead>
            <tbody>
              {filtered.map(row => <tr key={row.id}>
                <td>{dt(row.check_in_time)}</td><td>{tm(row.check_in_time)}</td><td>{row.location || '—'}</td><td>{row.confidence ?? '—'}</td>
                <td>{row.source_image ? <img src={row.source_image} alt="Attendance" width={60} height={60} loading="lazy" style={{ objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(row.source_image, '_blank', 'noopener,noreferrer')} /> : <span>No Image</span>}</td>
              </tr>)}
              {!filtered.length && <tr><td colSpan="5" className="attendance-module-empty">No attendance events in the selected period.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="attendance-module-table-wrap">
          <table className="attendance-module-table attendance-sheet-grid">
            <thead><tr><th className="sticky-employee">Employee</th>{Array.from({ length: sheetDays }, (_, i) => <th key={i}>{i + 1}</th>)}</tr></thead>
            <tbody>
              {sheet.filter(person => `${person.name} ${person.email}`.toLowerCase().includes(search.toLowerCase())).map(person => (
                <tr key={person.user_id}>
                  <td className="sticky-employee"><strong>{person.name}</strong><small>{person.email}</small></td>
                  {Array.from({ length: sheetDays }, (_, i) => {
                    const key = `${month}-${String(i + 1).padStart(2, '0')}`;
                    const value = person.days?.[key];
                    return <td key={key} title={value ? `Present: ${tm(value.first_check_in)}` : 'No check-in'}><span className={`attendance-sheet-mark ${value ? 'present' : ''}`}>{value ? 'P' : '—'}</span></td>;
                  })}
                </tr>
              ))}
              {!sheet.length && <tr><td colSpan={sheetDays + 1} className="attendance-module-empty">No staff found for this company.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <div className="attendance-module-note">Presence is based on check-in events in <code>ta_attendance</code>. Current schema does not store check-out, breaks, shifts, leave or holiday data.</div>

      {punchTarget && <div className="attendance-punch-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !savingPunch) setPunchTarget(null); }}>
        <section className="attendance-punch-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-punch-title">
          <header><div><h3 id="attendance-punch-title">{punchTarget.mode === 'edit' ? 'Edit punch-in' : 'Add missed punch-in'}</h3><p>{punchTarget.employeeName}</p></div><button type="button" aria-label="Close" onClick={() => setPunchTarget(null)} disabled={savingPunch}><X size={21} /></button></header>
          <form onSubmit={savePunch}>
            <label>Check-in date and time
              <input type="datetime-local" value={punchDateTime} max={getCurrentISTDateTime()} onChange={event => setPunchDateTime(event.target.value)} required />
            </label>
            <p className="attendance-punch-help">Enter the actual punch-in time in Indian Standard Time. Past times are allowed; future times are not.</p>
            <div className="attendance-punch-modal-actions">
              <button type="button" className="attendance-punch-cancel" onClick={() => setPunchTarget(null)} disabled={savingPunch}>Cancel</button>
              <button type="submit" className="attendance-punch-save" disabled={savingPunch || !punchDateTime}>{savingPunch ? 'Saving…' : 'Save punch-in'}</button>
            </div>
          </form>
        </section>
      </div>}
    </section>
  );
}
