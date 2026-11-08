import React,{useEffect,useMemo,useState} from 'react';
import {Download,RefreshCw,Search,CalendarDays,UserRound} from 'lucide-react';
import {getTodayAttendance,getEmployeeAttendance,getAttendanceSheet} from '../../services/attendanceService.js';
import {getStaff} from '../../services/staffService.js';
const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const tm=v=>v?new Date(v).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—';
const dt=v=>v?new Date(v).toLocaleDateString():'—';
export default function AttendanceModule({view}){
 const [date,setDate]=useState(todayISO()),[month,setMonth]=useState(todayISO().slice(0,7)),[search,setSearch]=useState('');
 const [rows,setRows]=useState([]),[staff,setStaff]=useState([]),[employeeId,setEmployeeId]=useState('');
 const [startDate,setStartDate]=useState(`${todayISO().slice(0,7)}-01`),[endDate,setEndDate]=useState(todayISO());
 const [sheet,setSheet]=useState([]),[sheetDays,setSheetDays]=useState(0),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const load=async()=>{setLoading(true);setError('');try{
  if(view==='today'){const r=await getTodayAttendance({date});setRows(r.items||[])}
  else if(view==='employee'){const people=await getStaff();setStaff(people);const id=employeeId||(people[0]?String(people[0].id):'');if(id){if(!employeeId)setEmployeeId(id);const r=await getEmployeeAttendance(id,{start_date:startDate,end_date:endDate});setRows(r.items||[])}else setRows([])}
  else{const r=await getAttendanceSheet({month});setSheet(r.items||[]);setSheetDays(r.days_in_month||0)}
 }catch(e){setError(e.message||'Unable to load attendance')}finally{setLoading(false)}};
 useEffect(()=>{load()},[view]);
 const filtered=useMemo(()=>rows.filter(r=>`${r.name||''} ${r.email||''}`.toLowerCase().includes(search.toLowerCase())),[rows,search]);
 const exportCsv=()=>{const data=view==='sheet'?[['Employee','Email',...Array.from({length:sheetDays},(_,i)=>i+1)],...sheet.map(p=>[p.name,p.email,...Array.from({length:sheetDays},(_,i)=>p.days?.[`${month}-${String(i+1).padStart(2,'0')}`]?.status||'')])]:view==='employee'?[['Date','Check-in','Location','Confidence'],...filtered.map(r=>[dt(r.check_in_time),tm(r.check_in_time),r.location||'',r.confidence??''])]:[['Employee','Email','First check-in','Last check-in','Events','Status'],...filtered.map(r=>[r.name,r.email,tm(r.first_check_in),tm(r.last_check_in),r.check_in_count,r.status])];const csv=data.map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const a=document.createElement('a');a.href=url;a.download=`ta-attendance-${view}.csv`;a.click();URL.revokeObjectURL(url)};
 return <section className="attendance-module-card"><div className="attendance-module-toolbar"><div><h2>{view==='today'?"Today's Attendance":view==='employee'?'Employee Attendance':'Attendance Sheet'}</h2><p>{view==='today'?'Daily check-in activity across active staff':view==='employee'?'Check-in history for an individual employee':'Monthly attendance overview by employee'}</p></div><div className="attendance-module-actions">
 {view==='today'&&<label><CalendarDays size={17}/><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>}
 {view==='employee'&&<><label><UserRound size={17}/><select value={employeeId} onChange={e=>setEmployeeId(e.target.value)}><option value="">Select employee</option>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label><input type="date" aria-label="Start date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label><label><input type="date" aria-label="End date" value={endDate} onChange={e=>setEndDate(e.target.value)}/></label></>}
 {view==='sheet'&&<label><CalendarDays size={17}/><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label>}
 <label className="attendance-module-search"><Search size={17}/><input placeholder="Search employee" value={search} onChange={e=>setSearch(e.target.value)}/></label><button onClick={load} title="Refresh"><RefreshCw size={18}/></button><button onClick={exportCsv} title="Export CSV"><Download size={18}/></button><button className="attendance-module-search-button" onClick={load}>Search</button></div></div>
 {error&&<div className="attendance-module-error">{error}</div>}
 {loading?<div className="attendance-module-empty">Loading attendance...</div>:view==='today'?<div className="attendance-module-table-wrap"><table className="attendance-module-table"><thead><tr><th>Employee</th><th>Email</th><th>First check-in</th><th>Last check-in</th><th>Events</th><th>Status</th></tr></thead><tbody>{filtered.map(r=><tr key={r.user_id}><td>{r.name}</td><td>{r.email}</td><td>{tm(r.first_check_in)}</td><td>{tm(r.last_check_in)}</td><td>{r.check_in_count}</td><td><span className={`attendance-module-status ${r.status.toLowerCase()}`}>{r.status}</span></td></tr>)}{!filtered.length&&<tr><td colSpan="6" className="attendance-module-empty">No attendance records for this date.</td></tr>}</tbody></table></div>:view==='employee'?<div className="attendance-module-table-wrap"><table className="attendance-module-table"><thead><tr><th>Check-in date</th><th>Check-in time</th><th>Location</th><th>Confidence</th><th>Source image</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td>{dt(r.check_in_time)}</td><td>{tm(r.check_in_time)}</td><td>{r.location||'—'}</td><td>{r.confidence??'—'}</td><td>{r.source_image?(
  <img
    src={r.source_image}
    alt="Attendance"
    width={60}
    height={60}
    style={{
      objectFit: "cover",
      borderRadius: "8px",
      cursor: "pointer"
    }}
    onClick={() => window.open(r.source_image, "_blank")}
  />
) : (
  <span>No Image</span>
)}</td></tr>)}{!filtered.length&&<tr><td colSpan="5" className="attendance-module-empty">No attendance events in the selected period.</td></tr>}</tbody></table></div>:<div className="attendance-module-table-wrap"><table className="attendance-module-table attendance-sheet-grid"><thead><tr><th className="sticky-employee">Employee</th>{Array.from({length:sheetDays},(_,i)=><th key={i}>{i+1}</th>)}</tr></thead><tbody>{sheet.filter(p=>`${p.name} ${p.email}`.toLowerCase().includes(search.toLowerCase())).map(p=><tr key={p.user_id}><td className="sticky-employee"><strong>{p.name}</strong><small>{p.email}</small></td>{Array.from({length:sheetDays},(_,i)=>{const k=`${month}-${String(i+1).padStart(2,'0')}`,v=p.days?.[k];return <td key={k} title={v?`Present: ${tm(v.first_check_in)}`:'No check-in'}><span className={`attendance-sheet-mark ${v?'present':''}`}>{v?'P':'—'}</span></td>})}</tr>)}{!sheet.length&&<tr><td colSpan={sheetDays+1} className="attendance-module-empty">No staff found for this company.</td></tr>}</tbody></table></div>}
 <div className="attendance-module-note">Presence is based on check-in events in <code>ta_attendance</code>. Current schema does not store check-out, breaks, shifts, leave or holiday data.</div></section>
}
