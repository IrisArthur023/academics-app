import { useEffect, useState } from 'react'

const courses = [
  { name: 'Literature', code: 'LIT101', room: 'A-250', days: 'Tu-Th', time: '11:00-12:20pm' },
  { name: 'Math', code: 'MATH102', room: 'FA-12', days: 'Mo-We-Fr', time: '1:00-3:00pm' },
  { name: 'Biology', code: 'BIO101', room: 'B-200', days: 'Mo-We-Fr', time: '7:00-9:00am' },
]
const tasks = [
  { title: 'Quiz (Book Chapters)', tags: ['Test/Exam', 'High Priority'], due: 'Dec 1', late: true },
  { title: 'Biology Test', tags: ['Test/Exam', 'High Priority'], due: 'Dec 3', late: true },
  { title: 'Complete problems 1-20 on pages 92-93', tags: ['Reflection & Practice', 'Medium Energy'], due: 'Dec 5', late: true },
]
const assignments = [
  { title: 'Short Story Analysis', deadline: 'Dec 6', progress: 40 },
  { title: 'Solving Quadratic Equations', deadline: 'Dec 12', progress: 50 },
]
const hours = ['7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '6:00 PM']
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday']
const slots = {
  '7:00 AM': ['Study (Literature)', 'Study (Math)', 'Study (Biology)', 'Study (Literature)'],
  '8:00 AM': ['Study (Literature)', 'Study (Math)', 'Study (Biology)', 'Study (Literature)'],
  '9:00 AM': ['Study (Literature)', 'Study (Math)', 'Study (Biology)', 'Study (Literature)'],
  '10:00 AM': ['Class (Math)', 'Class (Literature)', 'Class (Biology)', 'Class (Math)'],
  '11:00 AM': ['Class (Literature)', 'Class (Biology)', 'Class (Math)', 'Class (Literature)'],
  '1:00 PM': ['Study (Biology)', 'Study (Math)', 'Study (Math)', 'Study (Literature)'],
  '2:00 PM': ['Study (Biology)', 'Study (Math)', 'Study (Math)', 'Study (Literature)'],
  '3:00 PM': ['Study (Biology)', 'Study (Math)', 'Study (Biology)', 'Study (Literature)'],
  '4:00 PM': ['Work on assignments', 'Work on assignments', 'Work on assignments', 'Work on assignments'],
  '6:00 PM': ['Review / homework', 'Review / homework', 'Review / homework', 'Review / homework'],
}
const subjectClass = s => (s.includes('Literature') ? 'lit' : s.includes('Math') ? 'math' : s.includes('Biology') ? 'bio' : '')

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t) }, [])
  const s = now.getSeconds(), m = now.getMinutes() + s / 60, h = (now.getHours() % 12) + m / 60
  const hand = (deg, len, w) => <line x1="100" y1="100" x2="100" y2={100 - len} strokeWidth={w} transform={`rotate(${deg} 100 100)`} />
  return (
    <div className="clock">
      <svg viewBox="0 0 200 200" role="img" aria-label="Analog clock">
        {[...Array(12)].map((_, i) => <line key={i} x1="100" y1="12" x2="100" y2="22" strokeWidth="2" transform={`rotate(${i * 30} 100 100)`} />)}
        {hand(h * 30, 50, 4)}{hand(m * 6, 72, 3)}
        <g className="sec">{hand(s * 6, 80, 1.5)}</g>
      </svg>
      <span>{now.toLocaleTimeString()}</span>
    </div>
  )
}

export default function Dashboard({ goAI }) {
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  return (
    <main className="dash">
      <aside className="side">
        <Clock />
        <h3 className="h-accent">Welcome back</h3>
        <p className="serif-note">Every step you take brings you closer to the future you've been working for. Let's make it happen.</p>
        <button className="btn" onClick={goAI}>Start your study session</button>

        <div className="panel">
          <h4>Notification center</h4>
          <p>Good evening. Today is {today}.</p>
          <p className="lbl bad">Overdue</p><p>You have 4 items overdue: 3 tasks and 1 goal.</p>
          <p className="lbl">Assignments</p><p>1 pending assignment this month.</p>
          <p className="lbl">Habits</p><p>You have completed all of your habits.</p>
          <p className="lbl">Weekly progress</p>
          <div className="bar"><i style={{ width: '0%' }} /></div>
        </div>
      </aside>

      <section className="main">
        <h2 className="center-title">Courses</h2>
        <div className="courses">
          {courses.map(c => (
            <article className="course" key={c.code}>
              <div className="cover"><small>Notebook</small><span>{c.name}</span></div>
              <div className="meta">
                <strong>{c.name}</strong>
                <span>Course code: {c.code}</span>
                <span>Classroom: {c.room}</span>
                <span className="chip">{c.days}</span> <span className="chip">{c.time}</span>
              </div>
            </article>
          ))}
        </div>

        <h2 className="center-title">Tasks &amp; assignments</h2>
        <h3 className="sub">Today's &amp; weekly tasks</h3>
        <ul className="rows">
          {tasks.map(t => (
            <li key={t.title}>
              <span className="grow">{t.title}</span>
              {t.tags.map(g => <span className="tag" key={g}>{g}</span>)}
              <span className="due">{t.due}</span>
              {t.late && <span className="tag late">Overdue</span>}
            </li>
          ))}
        </ul>

        <h3 className="sub">Assignment workspace</h3>
        <ul className="rows">
          {assignments.map(a => (
            <li key={a.title}>
              <span className="grow">{a.title}</span>
              <span className="due">Deadline: {a.deadline}</span>
              <span className="mini"><i style={{ width: a.progress + '%' }} /></span>
              <span className="due">{a.progress}%</span>
              <span className="tag prog">In progress</span>
            </li>
          ))}
        </ul>

        <h3 className="sub">Time block / study schedule</h3>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Time</th>{days.map(d => <th key={d}>{d}</th>)}</tr></thead>
            <tbody>
              {hours.map(h => (
                <tr key={h}>
                  <td className="time">{h}</td>
                  {slots[h].map((s, i) => <td key={i}><span className={'slot ' + subjectClass(s)}>{s}</span></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
