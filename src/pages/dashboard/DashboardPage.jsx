import React, { useEffect, useMemo, useState } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../../services/staffService.js';
import AttendanceModule from '../../components/attendance/AttendanceModule.jsx';
import {
  Activity, Menu, Search, Maximize, Bell, Settings, Home, ChevronRight,
  ChevronDown, ChevronLeft, Users, CalendarDays, Wallet, FileText, Folder,
  BriefcaseBusiness, Clock3, CheckCircle2, CircleMinus, CircleX, Star,
  Plus, UserRound, SlidersHorizontal, MoreHorizontal, X,
  ShieldCheck, ClipboardList, ChartColumn, Settings2, ContactRound, Mail,
  CircleGauge, Grid2X2, MessageSquare, CreditCard, TableProperties,
  Eye, Pencil, Trash2, Filter, RotateCw, Download, User, PieChart, ListChecks,
  UserPlus, Phone, MapPin, Briefcase, GraduationCap, Upload, ArrowRight, ArrowLeft,
  Check, Calendar, Heart, Droplet, Flag, Lock, EyeOff, Save, Map, ClipboardCheck
} from 'lucide-react';
import '../../styles/dashboard.css';

const employees = [
  { name: 'Jacob Ryan', initials: 'JR', color: 'avatar-blue', values: ['P','P','W','H','P','P','W','P','L','P','P','W','W','P','P','P','L','W','W','P','P','P','H','P','W'] },
  { name: 'Angelica Ramos', initials: 'AR', color: 'avatar-gold', values: ['P','P','W','P','L','P','W','P','P','H','P','W','W','P','P','P','P','W','W','P','L','P','P','P','W'] },
  { name: 'Jens Brincker', initials: 'JB', color: 'avatar-slate', values: ['P','L','W','P','P','P','W','H','P','P','L','W','W','P','P','P','P','W','W','H','P','P','P','L','W'] },
  { name: 'Mark Hay', initials: 'MH', color: 'avatar-mint', values: ['H','P','W','P','P','L','W','P','P','P','P','W','W','H','P','L','P','W','W','P','P','P','P','P','H'] },
  { name: 'Sophia Bennett', initials: 'SB', color: 'avatar-rose', values: ['P','P','W','P','P','P','W','P','P','P','L','W','W','P','P','P','P','W','W','P','P','H','P','P','W'] },
  { name: 'Daniel Foster', initials: 'DF', color: 'avatar-purple', values: ['P','L','W','P','P','P','W','P','P','H','P','W','W','P','P','L','P','W','W','P','P','P','P','P','W'] },
];

const navGroups = [
  { title: 'Human Resources', icon: Users, items: ['Leave Requests','Leave Balance','Leave Types','Holidays',"Today’s Attendance",'Employee Attendance','Attendance Sheet','Employee Salary','Payslip','ID Card Generator'] },
  { title: 'Staff', icon: ContactRound, items: ['All Staff','Add Staff','Edit Staff','Staff Profile'] },
  { title: 'Documents & Consent', icon: Folder, items: [] },
  { title: 'Assets & Equipment', icon: BriefcaseBusiness, items: [] },
];

function StatusIcon({ status }) {
  if (status === 'P') return <CheckCircle2 className="status present" size={18} strokeWidth={2.2} aria-label="Present" />;
  if (status === 'L') return <CircleX className="status leave" size={18} strokeWidth={2.2} aria-label="Leave" />;
  if (status === 'H') return <Star className="status holiday" size={17} fill="currentColor" strokeWidth={1.5} aria-label="Holiday" />;
  return <CircleMinus className="status weekend" size={18} strokeWidth={2.2} aria-label="Weekend" />;
}

function DashboardPage({ onLogout, user }) {
  const currentUserName = user?.fullName || user?.username || 'Ella Jones';
  const currentUserInitials = currentUserName.split(/[\\s._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'EJ';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [year, setYear] = useState('2024');
  const [month, setMonth] = useState('November');
  const [applied, setApplied] = useState({ year: '2024', month: 'November' });
  const [query, setQuery] = useState('');
  const [activeItem, setActiveItem] = useState('All Staff');
  const [hrExpanded, setHrExpanded] = useState(true);
  const [staffExpanded, setStaffExpanded] = useState(true);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([
    { id: 1, name: 'John Deo', initials: 'JD', color: 'avatar-mint', firstIn: '10:30', breakTime: '01:15', lastOut: '19:37', total: '08:02', status: 'present', shift: 'Night Shift' },
    { id: 2, name: 'Sarah Smith', initials: 'SS', color: 'avatar-gold', firstIn: '10:32', breakTime: '01:00', lastOut: '19:30', total: '08:10', status: 'absent', shift: 'Day Shift' },
    { id: 3, name: 'Edna Gilbert', initials: 'EG', color: 'avatar-slate', firstIn: '10:42', breakTime: '01:10', lastOut: '19:32', total: '08:08', status: 'absent', shift: 'Day Shift' },
    { id: 4, name: 'Shelia Oster', initials: 'SO', color: 'avatar-mint', firstIn: '10:38', breakTime: '01:07', lastOut: '19:40', total: '08:00', status: 'present', shift: 'Night Shift' },
    { id: 5, name: 'Barbara Garcia', initials: 'BG', color: 'avatar-rose', firstIn: '10:33', breakTime: '01:15', lastOut: '19:30', total: '08:01', status: 'present', shift: 'Night Shift' },
    { id: 6, name: 'Sarah Smith', initials: 'SS', color: 'avatar-blue', firstIn: '10:30', breakTime: '01:10', lastOut: '19:37', total: '08:10', status: 'absent', shift: 'Day Shift' },
    { id: 7, name: 'Marie Brody', initials: 'MB', color: 'avatar-slate', firstIn: '10:32', breakTime: '01:05', lastOut: '19:40', total: '08:00', status: 'absent', shift: 'Day Shift' },
    { id: 8, name: 'Kara Thomas', initials: 'KT', color: 'avatar-purple', firstIn: '10:40', breakTime: '01:07', lastOut: '19:30', total: '08:12', status: 'present', shift: 'Day Shift' },
    { id: 9, name: 'Joseph Nye', initials: 'JN', color: 'avatar-blue', firstIn: '10:28', breakTime: '01:00', lastOut: '19:32', total: '08:02', status: 'present', shift: 'Night Shift' },
  ]);
  const [attendanceForm, setAttendanceForm] = useState({
    name: '', firstIn: '', breakTime: '', lastOut: '', total: '', status: '', shift: ''
  });
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('Maria Smith');
  const [employeeTab, setEmployeeTab] = useState('details');
  const [employeeMonth, setEmployeeMonth] = useState('February');
  const [employeeYear, setEmployeeYear] = useState('2018');
  const [employeeDailyRecords, setEmployeeDailyRecords] = useState([
    { date:'2018-02-10', in:'10:28', out:'19:32', breakTime:'01:00', shift:'Shift 1', status:'Present' },
    { date:'2018-02-11', in:'10:32', out:'19:32', breakTime:'01:00', shift:'Shift 1', status:'Present' },
    { date:'2018-02-12', in:'10:45', out:'19:40', breakTime:'01:15', shift:'Shift 1', status:'Present' },
    { date:'2018-02-13', in:'', out:'', breakTime:'', shift:'Shift 1', status:'Absent' },
    { date:'2018-02-14', in:'10:30', out:'19:30', breakTime:'01:00', shift:'Shift 1', status:'Present' },
    { date:'2018-02-15', in:'10:35', out:'19:20', breakTime:'01:00', shift:'Shift 1', status:'Present' },
    { date:'2018-02-16', in:'', out:'', breakTime:'', shift:'Shift 1', status:'Leave' },
    { date:'2018-02-17', in:'10:25', out:'19:35', breakTime:'01:10', shift:'Shift 1', status:'Present' },
    { date:'2018-02-18', in:'', out:'', breakTime:'', shift:'Shift 1', status:'Weekend' },
    { date:'2018-02-19', in:'10:30', out:'19:30', breakTime:'01:00', shift:'Shift 1', status:'Present' }
  ]);
  const [editingDailyDate, setEditingDailyDate] = useState(null);
  const [dailyEdit, setDailyEdit] = useState(null);
  const [staffSearch, setStaffSearch] = useState('');
  const [editingStaffId, setEditingStaffId] = useState(10);
  const [staffStep, setStaffStep] = useState(1);
  const [staffPhoto, setStaffPhoto] = useState(null);
  const [staffAccepted, setStaffAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emptyStaffForm = {
    firstName:'', lastName:'', gender:'', dob:'', bloodGroup:'', maritalStatus:'', nationality:'',
    email:'', mobile:'', emergencyName:'', emergencyNumber:'', address:'', city:'', state:'', postalCode:'', country:'',
    staffId:'', joinDate:'', designation:'', department:'', specialization:'', experience:'', employmentType:'', shift:'',
    education:'', certifications:'', licenses:'', licenseExpiry:'', skills:'',
    username:'', password:'', confirmPassword:'', bio:''
  };
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState('');
  const [staffSaving, setStaffSaving] = useState(false);
  const loadStaff = async () => {
    setStaffLoading(true); setStaffError('');
    try {
      const rows = await getStaff();
      setStaffMembers(rows.map(row => ({
        ...row, name: row.name || '', email: row.email || '',
        gender: '', designation: row.external_id || '—', mobile: '—',
        joining: row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
        address: '—', salary: '—'
      })));
    } catch (error) { setStaffError(error.message || 'Unable to load staff'); }
    finally { setStaffLoading(false); }
  };
  useEffect(() => { loadStaff(); }, []);


  const days = useMemo(() => {
    const monthIndex = new Date(`${applied.month} 1, ${applied.year}`).getMonth();
    return new Date(Number(applied.year), monthIndex + 1, 0).getDate();
  }, [applied]);
  const filteredEmployees = employees.filter(e => e.name.toLowerCase().includes(query.toLowerCase()));

  const toMinutes = value => {
    if (!value || !/^\\d{2}:\\d{2}$/.test(value)) return 0;
    const [h, m] = value.split(':').map(Number);
    return h * 60 + m;
  };
  const duration = (record) => {
    if (!record.in || !record.out) return '—';
    const minutes = Math.max(0, (toMinutes(record.out) - toMinutes(record.in) + 1440) % 1440 - toMinutes(record.breakTime));
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  };
  const employeeRecords = employeeDailyRecords.filter(r => {
    const d = new Date(`${r.date}T12:00:00`);
    return d.getFullYear() === Number(employeeYear) && d.toLocaleString('en-US', { month:'long' }) === employeeMonth;
  });
  const workingRecords = employeeRecords.filter(r => r.status === 'Present' && r.in && r.out);
  const averageMinutes = (values) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
  const displayDuration = mins => `${String(Math.floor(mins / 60)).padStart(2,'0')}:${String(mins % 60).padStart(2,'0')}`;
  const displayClock = mins => {
    const hour = Math.floor(mins / 60) % 24;
    return `${String(hour % 12 || 12).padStart(2,'0')}:${String(mins % 60).padStart(2,'0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  };
  const averageIn = averageMinutes(workingRecords.map(r => toMinutes(r.in)));
  const averageOut = averageMinutes(workingRecords.map(r => toMinutes(r.out)));
  const averageBreak = averageMinutes(workingRecords.map(r => toMinutes(r.breakTime)));
  const averageWork = averageMinutes(workingRecords.map(r => toMinutes(duration(r))));
  const applyFilter = () => setApplied({ year, month });
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
    setFullScreen(!fullScreen);
  };

  const openEditStaff = (staffId = 10) => {
    const staff = staffMembers.find(item => item.id === staffId) || staffMembers[0];
    const [firstName, ...lastParts] = (staff?.name || '').split(' ');
    setEditingStaffId(staff?.id ?? null);
    setStaffForm({
      ...emptyStaffForm,
      firstName, lastName:lastParts.join(' '), gender:staff?.gender === 'female' ? 'Female' : 'Male',
      dob:'1987-02-17', bloodGroup:'B+', maritalStatus:'Single', nationality:'Indian',
      email:staff?.email || '', mobile:staff?.mobile || '', emergencyName:'', emergencyNumber:'',
      address:staff?.address || '', city:'Mumbai', state:'Maharashtra', postalCode:'400001', country:'India',
      staffId:staff?.external_id || String(staff?.id || ''), joinDate:'2015-01-12',
      designation:staff?.designation || '', department:staff?.department || '',
      specialization:'General Medicine', experience:'8', employmentType:'Full Time', shift:'Day Shift',
      education:'Bachelor of Medicine and Bachelor of Surgery (MBBS)', certifications:'Registered Medical Practitioner',
      licenses:'MCI-123456', licenseExpiry:'2027-12-31', skills:'Patient care, communication, clinical assessment',
      username:(staff?.email || 'staff@ta.com').split('@')[0], password:'', confirmPassword:'', bio:'Experienced healthcare professional.'
    });
    setStaffStep(1); setStaffPhoto(null); setStaffAccepted(true); setShowPassword(false); setActiveItem('Edit Staff');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className={`brand-area ${sidebarOpen ? '' : 'brand-area-compact'}`}>
          <div className="brand-mark"><Activity size={27} strokeWidth={2.8} /></div>
          <span className="brand-name">TA</span>
        </div>
        <button className="icon-button menu-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle navigation">
          <Menu size={25} />
        </button>
        <div className="top-actions">
          <button className="icon-button" aria-label="Search" onClick={() => document.querySelector('.employee-search')?.focus()}><Search /></button>
          <button className="icon-button desktop-only" aria-label="Toggle fullscreen" onClick={toggleFullscreen}><Maximize /></button>
          <div className="notification-wrap">
            <button className="icon-button" aria-label="Notifications" onClick={() => setNoticeOpen(v => !v)}><Bell /><span className="notification-count">3</span></button>
            {noticeOpen && <div className="notification-popover"><strong>Notifications</strong><p>3 attendance updates need your attention.</p><button onClick={() => setNoticeOpen(false)}>Close</button></div>}
          </div>
          <span className="flag">🇺🇸</span>
          <span className="user-name">{currentUserName}</span>
          <button className="dashboard-signout" onClick={onLogout} title="Sign out">Sign out</button>
          <div className="user-avatar">{currentUserInitials}</div>
        </div>
      </header>

      <div className="workspace">
        <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
          {sidebarOpen ? <>
            <nav>
              {navGroups.map((group, idx) => {
                const Icon = group.icon;
                const expanded = idx === 0 ? hrExpanded : idx === 1 ? staffExpanded : false;
                return <div className="nav-group" key={group.title}>
                  <button className={`nav-group-heading ${(idx === 0 || (idx === 1 && activeItem.includes('Staff'))) ? 'selected-group' : ''}`} onClick={() => idx === 0 ? setHrExpanded(v => !v) : idx === 1 ? setStaffExpanded(v => !v) : setActiveItem(group.title)} title={group.title}>
                    <Icon size={20} /><span>{group.title}</span>{group.items.length ? <span className="group-control">{expanded ? '−' : '+'}</span> : <Plus className="group-plus" size={18} />}
                  </button>
                  {group.items.length > 0 && expanded && <div className="nav-subitems">
                    {group.items.map(item => <button key={item} onClick={() => item === 'Edit Staff' ? openEditStaff() : setActiveItem(item)} className={`nav-item ${activeItem === item ? 'active' : ''}`}>
                      {(item === 'Attendance Sheet' || item === 'Add Staff') && <ChevronRight size={17} className="active-chevron" />}
                      <span>{item}</span>
                    </button>)}
                  </div>}
                </div>;
              })}
            </nav>
            <div className="sidebar-footer"><div className="help-icon">?</div><span>Need help?</span><ChevronDown size={15} /></div>
          </> : <nav className="compact-nav" aria-label="Collapsed navigation">
            {[
              [ShieldCheck, 'Dashboard'], [ContactRound, 'Employees'], [ChartColumn, 'Reports'],
              [Settings2, 'Settings'], [CalendarDays, 'Attendance'], [ClipboardList, 'Leave Requests'],
              [FileText, 'Documents'], [Mail, 'Messages'], [CircleGauge, 'Performance'],
              [Grid2X2, 'Apps'], [MessageSquare, 'Support'], [CreditCard, 'Payroll'],
              [TableProperties, 'Attendance Sheet']
            ].map(([Icon, label]) => <button key={label} title={label} aria-label={label}
              className={`compact-nav-button ${label === 'Attendance Sheet' ? 'compact-active' : ''}`}
              onClick={() => setActiveItem(label)}>
              <Icon size={21} strokeWidth={2} />
            </button>)}
          </nav>}
        </aside>

        <main className="main-content">
          <div className="page-heading">
            <h1>{activeItem === 'Today’s Attendance' ? "Today's Attendance" : activeItem === 'Add Staff' ? 'Add Staffs' : activeItem}</h1>
            <div className="breadcrumb"><span className="home-crumb"><Home size={19} /></span><ChevronRight /><span>{activeItem.includes("Staff") ? "Staffs" : "Attendance"}</span><ChevronRight /><strong>{activeItem === "Add Staff" ? "Add Staffs" : activeItem}</strong></div>
          </div>

          {activeItem === 'All Staff' ? <section className="staff-list-card">
            <div className="staff-toolbar">
              <h2>Staff</h2>
              <label className="staff-search"><Search size={21}/><input placeholder="Search" value={staffSearch} onChange={e => setStaffSearch(e.target.value)}/></label>
              <div className="staff-toolbar-actions">
                <button title="Filter"><Filter size={23}/></button>
                <button title="Add staff" className="staff-add-button" onClick={() => { setStaffStep(1); setStaffForm(emptyStaffForm); setStaffPhoto(null); setStaffAccepted(false); setActiveItem('Add Staff'); }}><Plus size={23}/></button>
                <button title="Refresh" onClick={loadStaff}><RotateCw size={22}/></button>
                <button title="Download"><Download size={22}/></button>
              </div>
            </div>
            {staffLoading && <p className="staff-feedback">Loading staff...</p>}
            {staffError && <p className="staff-feedback error">{staffError}</p>}
            <div className="staff-table-wrap"><table className="staff-table">
              <thead><tr><th>Name</th><th>Email</th><th>Staff ID / External ID</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{staffMembers.filter(st => `${st.name} ${st.external_id || ''} ${st.email}`.toLowerCase().includes(staffSearch.toLowerCase())).map(st => <tr key={st.id}>
                <td><div className="staff-name-cell"><span className={`staff-avatar staff-avatar-${st.id%5}`}>{st.name.split(' ').map(x=>x[0]).join('').slice(0,2)}</span><span>{st.name}</span></div></td>
                <td><span className="staff-email"><Mail size={18}/>{st.email}</span></td>
                <td>{st.external_id || '—'}</td><td>{st.created_at ? new Date(st.created_at).toLocaleDateString() : '—'}</td>
                <td><span className="attendance-module-status present">Active</span></td>
                <td><button title="Edit staff" onClick={() => openEditStaff(st.id)}><Pencil size={17}/></button><button title="Deactivate staff" onClick={async () => { if (window.confirm(`Deactivate ${st.name}?`)) { try { await deleteStaff(st.id); await loadStaff(); } catch (error) { alert(error.message); } } }}><Trash2 size={17}/></button></td>
              </tr>)}</tbody>
            </table></div>
          </section> : (activeItem === 'Add Staff' || activeItem === 'Edit Staff') ? <section className="add-staff-card">
            <div className="add-staff-heading"><div><h2><UserPlus size={21}/> {activeItem === 'Edit Staff' ? 'Edit Staff Member' : 'Add New Staff Member'}</h2><p>{activeItem === 'Edit Staff' ? 'Update employee information and save your changes' : 'Complete all required fields for staff onboarding'}</p></div></div>
            <div className="staff-wizard">
              <div className="staff-stepper">{['Personal Information','Contact Information','Professional Details','Qualifications','Account Setup'].map((label,i)=><button type="button" key={label} className={`staff-step ${staffStep===i+1?'current':staffStep>i+1?'completed':''}`} onClick={()=>staffStep>i+1&&setStaffStep(i+1)}><span className="step-number">{staffStep>i+1?<Check size={17}/>:i+1}</span><b>{label}</b>{i<4&&<i/>}</button>)}</div>
              <form className="staff-step-form" onSubmit={e=>e.preventDefault()}>
                {staffStep===1 && <><h3>Personal Information</h3>
                  <div className="staff-form-grid two"><label className="staff-field"><input required placeholder="First name*" value={staffForm.firstName} onChange={e=>setStaffForm(f=>({...f,firstName:e.target.value}))}/><User size={21}/></label>
                    <label className="staff-field"><input required placeholder="Last name*" value={staffForm.lastName} onChange={e=>setStaffForm(f=>({...f,lastName:e.target.value}))}/><User size={21}/></label>
                    <label className="staff-field"><select required value={staffForm.gender} onChange={e=>setStaffForm(f=>({...f,gender:e.target.value}))}><option value="">Gender*</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select><ChevronDown size={18}/></label>
                    <label className="staff-field"><input required type="date" aria-label="Date of Birth" value={staffForm.dob} onChange={e=>setStaffForm(f=>({...f,dob:e.target.value}))}/><Calendar size={20}/></label>
                  </div>
                  <div className="staff-form-grid three"><label className="staff-field"><select value={staffForm.bloodGroup} onChange={e=>setStaffForm(f=>({...f,bloodGroup:e.target.value}))}><option value="">Blood Group</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(x=><option key={x}>{x}</option>)}</select><Droplet size={20}/></label>
                    <label className="staff-field"><select value={staffForm.maritalStatus} onChange={e=>setStaffForm(f=>({...f,maritalStatus:e.target.value}))}><option value="">Marital Status</option>{['Single','Married','Divorced','Widowed'].map(x=><option key={x}>{x}</option>)}</select><ChevronDown size={18}/></label>
                    <label className="staff-field"><input placeholder="Nationality" value={staffForm.nationality} onChange={e=>setStaffForm(f=>({...f,nationality:e.target.value}))}/><Flag size={20}/></label>
                  </div>
                </>}
                {staffStep===2 && <><h3>Contact Information</h3>
                  <div className="staff-form-grid two"><label className="staff-field"><input required type="email" placeholder="Email*" value={staffForm.email} onChange={e=>setStaffForm(f=>({...f,email:e.target.value}))}/><Mail size={21}/></label>
                    <label className="staff-field"><input required type="tel" placeholder="Mobile*" value={staffForm.mobile} onChange={e=>setStaffForm(f=>({...f,mobile:e.target.value}))}/><Phone size={21}/></label>
                    <label className="staff-field"><input placeholder="Emergency Contact Name" value={staffForm.emergencyName} onChange={e=>setStaffForm(f=>({...f,emergencyName:e.target.value}))}/><ContactRound size={21}/></label>
                    <label className="staff-field"><input type="tel" placeholder="Emergency Contact Number" value={staffForm.emergencyNumber} onChange={e=>setStaffForm(f=>({...f,emergencyNumber:e.target.value}))}/><Phone size={21}/></label>
                  </div>
                  <label className="staff-field staff-textarea"><textarea required placeholder="Address*" value={staffForm.address} onChange={e=>setStaffForm(f=>({...f,address:e.target.value}))}/><Home size={21}/></label>
                  <div className="staff-form-grid four"><label className="staff-field"><input placeholder="City" value={staffForm.city} onChange={e=>setStaffForm(f=>({...f,city:e.target.value}))}/></label><label className="staff-field"><input placeholder="State/Province" value={staffForm.state} onChange={e=>setStaffForm(f=>({...f,state:e.target.value}))}/></label><label className="staff-field"><input placeholder="Postal Code" value={staffForm.postalCode} onChange={e=>setStaffForm(f=>({...f,postalCode:e.target.value}))}/></label><label className="staff-field"><input placeholder="Country" value={staffForm.country} onChange={e=>setStaffForm(f=>({...f,country:e.target.value}))}/></label></div>
                </>}
                {staffStep===3 && <><h3>Professional Information</h3>
                  <div className="staff-form-grid two"><label className="staff-field"><input required placeholder="Staff ID*" value={staffForm.staffId} onChange={e=>setStaffForm(f=>({...f,staffId:e.target.value}))}/><ContactRound size={21}/></label>
                    <label className="staff-field"><input type="date" aria-label="Join Date" value={staffForm.joinDate} onChange={e=>setStaffForm(f=>({...f,joinDate:e.target.value}))}/><Calendar size={20}/></label>
                    <label className="staff-field"><input required placeholder="Designation*" value={staffForm.designation} onChange={e=>setStaffForm(f=>({...f,designation:e.target.value}))}/><Briefcase size={21}/></label>
                    <label className="staff-field"><select required value={staffForm.department} onChange={e=>setStaffForm(f=>({...f,department:e.target.value}))}><option value="">Select Department*</option>{['Administration','Cardiology','Emergency','Gynecology','Laboratory','Nursing','Pharmacy','Radiology','Security'].map(x=><option key={x}>{x}</option>)}</select><ChevronDown size={18}/></label>
                    <label className="staff-field"><input placeholder="Specialization" value={staffForm.specialization} onChange={e=>setStaffForm(f=>({...f,specialization:e.target.value}))}/><GraduationCap size={20}/></label>
                    <label className="staff-field"><input type="number" min="0" placeholder="Experience (years)" value={staffForm.experience} onChange={e=>setStaffForm(f=>({...f,experience:e.target.value}))}/><ChartColumn size={20}/></label>
                    <label className="staff-field"><select value={staffForm.employmentType} onChange={e=>setStaffForm(f=>({...f,employmentType:e.target.value}))}><option value="">Employment Type</option>{['Full Time','Part Time','Contract','Temporary','Intern'].map(x=><option key={x}>{x}</option>)}</select><ClipboardList size={20}/></label>
                    <label className="staff-field"><select value={staffForm.shift} onChange={e=>setStaffForm(f=>({...f,shift:e.target.value}))}><option value="">Shift</option>{['Day Shift','Night Shift','Rotational','General'].map(x=><option key={x}>{x}</option>)}</select><Clock3 size={20}/></label>
                  </div>
                </>}
                {staffStep===4 && <><h3>Qualifications &amp; Certifications</h3>
                  <label className="staff-field staff-textarea"><textarea required placeholder="Education*" value={staffForm.education} onChange={e=>setStaffForm(f=>({...f,education:e.target.value}))}/><GraduationCap size={21}/></label>
                  <label className="staff-field staff-textarea"><textarea placeholder="Certifications" value={staffForm.certifications} onChange={e=>setStaffForm(f=>({...f,certifications:e.target.value}))}/><ClipboardCheck size={21}/></label>
                  <div className="staff-form-grid two"><label className="staff-field"><input placeholder="Licenses" value={staffForm.licenses} onChange={e=>setStaffForm(f=>({...f,licenses:e.target.value}))}/><Check size={20}/></label><label className="staff-field"><input type="date" aria-label="License Expiry Date" value={staffForm.licenseExpiry} onChange={e=>setStaffForm(f=>({...f,licenseExpiry:e.target.value}))}/><Calendar size={20}/></label></div>
                  <label className="staff-field staff-textarea"><textarea placeholder="Skills" value={staffForm.skills} onChange={e=>setStaffForm(f=>({...f,skills:e.target.value}))}/><Activity size={21}/></label>
                </>}
                {staffStep===5 && <><h3>Account Information</h3>
                  <div className="staff-form-grid one"><label className="staff-field"><input required placeholder="Username*" value={staffForm.username} onChange={e=>setStaffForm(f=>({...f,username:e.target.value}))}/><User size={21}/></label></div>
                  <div className="staff-form-grid two"><label className="staff-field"><input required type={showPassword?'text':'password'} placeholder="Password*" value={staffForm.password} onChange={e=>setStaffForm(f=>({...f,password:e.target.value}))}/><Lock size={20}/><button type="button" className="field-icon-button" onClick={()=>setShowPassword(v=>!v)}><Eye size={19}/></button></label>
                    <label className="staff-field"><input required type={showPassword?'text':'password'} placeholder="Confirm Password*" value={staffForm.confirmPassword} onChange={e=>setStaffForm(f=>({...f,confirmPassword:e.target.value}))}/><Lock size={20}/></label></div>
                  <div className="staff-photo-upload"><span>Profile Photo</span><label><input type="file" accept="image/*" onChange={e=>setStaffPhoto(e.target.files?.[0]||null)}/><b>Choose file</b><span>{staffPhoto?.name || 'or drag and drop file here'}</span></label></div>
                  <label className="staff-field staff-textarea"><textarea placeholder="Bio" value={staffForm.bio} onChange={e=>setStaffForm(f=>({...f,bio:e.target.value}))}/><FileText size={21}/></label>
                  <label className="staff-terms"><input type="checkbox" checked={staffAccepted} onChange={e=>setStaffAccepted(e.target.checked)}/> I agree to the terms and conditions</label>
                </>}
                <div className="staff-wizard-actions">{staffStep>1&&<button type="button" className="wizard-back" onClick={()=>setStaffStep(n=>n-1)}><ArrowLeft size={18}/> Back</button>}
                  {staffStep<5?<button type="button" className="wizard-next" onClick={()=>{
                    const required = staffStep===1?['firstName','lastName','gender','dob']:staffStep===2?['email','mobile','address']:staffStep===3?['staffId','designation','department']:['education'];
                    const missing=required.find(k=>!String(staffForm[k]||'').trim());
                    if(missing){alert(`Please complete ${missing.replace(/([A-Z])/g,' $1').toLowerCase()}.`);return;}
                    setStaffStep(n=>n+1);
                  }}>Next <ArrowRight size={19}/></button>:
                  <button type="button" className="wizard-submit" disabled={staffSaving} onClick={async ()=>{
                    if(!staffAccepted){alert('Please agree to the terms and conditions.');return;}
                    const fullName=`${staffForm.firstName} ${staffForm.lastName}`.trim();
                    const payload={name:fullName,email:staffForm.email.trim().toLowerCase(),face_id:null,external_id:staffForm.staffId.trim(),active:1};
                    setStaffSaving(true);
                    try {
                      if(activeItem === 'Edit Staff') await updateStaff(editingStaffId,payload);
                      else await createStaff(payload);
                      await loadStaff();
                      setStaffForm(emptyStaffForm);setStaffPhoto(null);setStaffAccepted(false);setActiveItem('All Staff');
                    } catch(error) { alert(error.message || 'Unable to save staff member'); }
                    finally { setStaffSaving(false); }
                  }}><Check size={18}/> {staffSaving ? 'Saving...' : 'Submit'}</button>}
                </div>
              </form>
            </div>
          </section> : activeItem === 'Today’s Attendance' ? <AttendanceModule view="today" />
            : activeItem === 'Employee Attendance' ? <AttendanceModule view="employee" />
            : <AttendanceModule view="sheet" />}
          <div className="page-footnote">© 2026 TA. All rights reserved.</div>
        </main>
      </div>
      {dailyEdit && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setDailyEdit(null); }}>
        <section className="view-attendance-modal" role="dialog" aria-modal="true" aria-label="Edit daily attendance">
          <header className="attendance-modal-header"><h2>Edit Attendance — {editingDailyDate}</h2><button className="modal-close" aria-label="Close" onClick={() => setDailyEdit(null)}><X size={23}/></button></header>
          <form className="daily-edit-form" onSubmit={e => { e.preventDefault(); setEmployeeDailyRecords(prev => prev.map(r => r.date === editingDailyDate ? dailyEdit : r)); setDailyEdit(null); }}>
            <label>Check In <input type="time" value={dailyEdit.in} onChange={e => setDailyEdit(r => ({...r, in:e.target.value}))}/></label>
            <label>Check Out <input type="time" value={dailyEdit.out} onChange={e => setDailyEdit(r => ({...r, out:e.target.value}))}/></label>
            <label>Break (HH:MM) <input value={dailyEdit.breakTime} placeholder="01:00" pattern="[0-9]{2}:[0-5][0-9]" onChange={e => setDailyEdit(r => ({...r, breakTime:e.target.value}))}/></label>
            <label>Shift <select value={dailyEdit.shift} onChange={e => setDailyEdit(r => ({...r, shift:e.target.value}))}><option>Shift 1</option><option>Shift 2</option><option>Night Shift</option></select></label>
            <label>Status <select value={dailyEdit.status} onChange={e => setDailyEdit(r => ({...r, status:e.target.value}))}>{['Present','Absent','Leave','Weekend'].map(v => <option key={v}>{v}</option>)}</select></label>
            <div className="modal-form-actions"><button className="save-button" type="submit">Save</button><button className="cancel-button" type="button" onClick={() => setDailyEdit(null)}>Cancel</button></div>
          </form>
        </section>
      </div>}
      {showAttendanceModal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setShowAttendanceModal(false); }}>
        <section className="attendance-modal" role="dialog" aria-modal="true" aria-labelledby="attendance-modal-title">
          <header className="attendance-modal-header">
            <div className="modal-heading-avatar"><User size={23} /></div>
            <h2 id="attendance-modal-title">{editingRecordId ? 'Edit Entry' : 'New Entry'}</h2>
            <button className="modal-close" onClick={() => setShowAttendanceModal(false)} aria-label="Close"><X size={25} /></button>
          </header>
          <form className="attendance-form" onSubmit={e => {
            e.preventDefault();
            const initials = attendanceForm.name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
            const record = { ...attendanceForm, initials, color: 'avatar-blue', id: editingRecordId || Date.now() };
            setAttendanceRecords(rows => editingRecordId ? rows.map(row => row.id === editingRecordId ? record : row) : [...rows, record]);
            setShowAttendanceModal(false);
          }}>
            <label className="modal-field"><input required placeholder="Name*" value={attendanceForm.name} onChange={e => setAttendanceForm(f => ({ ...f, name: e.target.value }))} /><User size={21} /></label>
            <label className="modal-field"><input required type="time" aria-label="First In" value={attendanceForm.firstIn} onChange={e => setAttendanceForm(f => ({ ...f, firstIn: e.target.value }))} /><Clock3 size={22} /></label>
            <label className="modal-field"><input required type="text" placeholder="Break* (e.g. 01:00)" value={attendanceForm.breakTime} onChange={e => setAttendanceForm(f => ({ ...f, breakTime: e.target.value }))} /><Clock3 size={22} /></label>
            <label className="modal-field"><input required type="time" aria-label="Last Out" value={attendanceForm.lastOut} onChange={e => setAttendanceForm(f => ({ ...f, lastOut: e.target.value }))} /><Clock3 size={22} /></label>
            <label className="modal-field"><input type="text" placeholder="Total (e.g. 08:00)" value={attendanceForm.total} onChange={e => setAttendanceForm(f => ({ ...f, total: e.target.value }))} /><Clock3 size={22} /></label>
            <label className="modal-field select-modal-field"><select required value={attendanceForm.status} onChange={e => setAttendanceForm(f => ({ ...f, status: e.target.value }))}><option value="" disabled>Status*</option><option value="present">Present</option><option value="absent">Absent</option><option value="leave">Leave</option><option value="half-day">Half Day</option></select><ChevronDown size={19} /></label>
            <label className="modal-field select-modal-field"><select required value={attendanceForm.shift} onChange={e => setAttendanceForm(f => ({ ...f, shift: e.target.value }))}><option value="" disabled>Shift*</option><option>Day Shift</option><option>Night Shift</option><option>General Shift</option></select><ChevronDown size={19} /></label>
            <div className="modal-form-actions"><button type="submit" className="save-button">{editingRecordId ? 'Update' : 'Save'}</button><button type="button" className="cancel-button" onClick={() => setShowAttendanceModal(false)}>Cancel</button></div>
          </form>
        </section>
      </div>}
      {viewRecord && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setViewRecord(null); }}>
        <section className="view-attendance-modal" role="dialog" aria-modal="true">
          <header className="attendance-modal-header"><div className="modal-heading-avatar"><User size={23} /></div><h2>Attendance Details</h2><button className="modal-close" onClick={() => setViewRecord(null)} aria-label="Close"><X size={25} /></button></header>
          <div className="view-record-content"><strong>{viewRecord.name}</strong><p>First In: {viewRecord.firstIn || '—'}</p><p>Break: {viewRecord.breakTime || '—'}</p><p>Last Out: {viewRecord.lastOut || '—'}</p><p>Total Hours: {viewRecord.total || '—'}</p><p>Status: {viewRecord.status}</p><p>Shift: {viewRecord.shift}</p></div>
        </section>
      </div>}
      <button className="settings-fab" aria-label="Settings"><Settings size={24} /></button>
      <button className="assistant-fab" aria-label="Assistant"><span>✦</span></button>
    </div>
  );
}

export default DashboardPage;
