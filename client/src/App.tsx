import DashboardLayout, { type WorkspaceRole } from "@/components/DashboardLayout";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Download,
  FileText,
  Filter,
  Globe2,
  GraduationCap,
  Linkedin,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UploadCloud,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const rankings = [
  { rank: "01", name: "Maia Patel", initials: "MP", role: "Senior Product Designer", score: 92, semantic: 96, skills: 91, experience: 88, education: 95, availability: 89, status: "Shortlist", strengths: ["Expert Figma systems practice", "Scaled design work across B2B product teams"], gaps: ["No direct payroll-domain experience"], note: "An unusually strong match for the design-system and product-thinking dimensions. Maia should progress to a portfolio review this week.", tags: ["Figma", "B2B SaaS", "Design systems"] },
  { rank: "02", name: "Emre Kaya", initials: "EK", role: "Staff Product Designer", score: 86, semantic: 90, skills: 87, experience: 89, education: 78, availability: 82, status: "Pending", strengths: ["Deep enterprise workflow experience", "Experienced mentor and team lead"], gaps: ["Longer 60-day notice period"], note: "Emre meets the seniority bar and brings valuable enterprise experience. Validate compensation expectations before interviewing.", tags: ["Research", "Enterprise", "Leadership"] },
  { rank: "03", name: "Noah Williams", initials: "NW", role: "Product Designer", score: 79, semantic: 83, skills: 81, experience: 77, education: 74, availability: 88, status: "Pending", strengths: ["Strong mobile product portfolio", "Available to interview this week"], gaps: ["Limited systems-scale design examples"], note: "A promising mid-senior profile with a clear mobile background. Use the portfolio discussion to probe system-design depth.", tags: ["Mobile", "Prototyping", "UX"] },
  { rank: "04", name: "Ava Chen", initials: "AC", role: "Interaction Designer", score: 74, semantic: 81, skills: 72, experience: 70, education: 86, availability: 75, status: "Reject", strengths: ["Excellent research rigor", "Strong academic grounding"], gaps: ["Below requested experience band", "Missing B2B SaaS evidence"], note: "Ava has high-quality interaction design fundamentals but does not currently meet the role’s experience threshold.", tags: ["Research", "Interaction", "Accessibility"] },
];

const candidates = [
  { name: "Maia Patel", initials: "MP", title: "Senior Product Designer", location: "Bengaluru, IN", score: 92, tags: ["Figma", "B2B SaaS", "Design systems"], status: "Shortlist" },
  { name: "Emre Kaya", initials: "EK", title: "Staff Product Designer", location: "Istanbul, TR", score: 86, tags: ["Research", "Enterprise", "Leadership"], status: "Pending" },
  { name: "Noah Williams", initials: "NW", title: "Product Designer", location: "London, UK", score: 79, tags: ["Mobile", "UX", "Prototyping"], status: "Pending" },
  { name: "Ava Chen", initials: "AC", title: "Interaction Designer", location: "Singapore", score: 74, tags: ["Accessibility", "Research", "Motion"], status: "Reject" },
  { name: "Luca Rossi", initials: "LR", title: "UX Designer", location: "Milan, IT", score: 70, tags: ["Fintech", "UX writing", "Figma"], status: "Pending" },
];

const demoResumeUrl = "/manus-storage/maia-patel-interview-demo-resume_616e5d05.pdf";

function PageIntro({ index, title, description, action }: { index: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-intro"><div><p className="section-index">{index}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action && <div className="page-action">{action}</div>}</div>;
}

function Metric({ label, value, delta, danger = false }: { label: string; value: string; delta: string; danger?: boolean }) {
  return <article className="metric-card"><p className="micro-label">{label}</p><div className="metric-main"><strong>{value}</strong><span className={danger ? "delta delta-down" : "delta"}>{danger ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{delta}</span></div><div className="metric-rule" /></article>;
}

function Dashboard() {
  const activities = [
    ["10:42", "New candidate parsed", "Maia Patel’s resume is ready for review."],
    ["09:20", "Role published", "Senior Product Designer has entered matching."],
    ["Yesterday", "Ranking completed", "47 candidates were scored for Data Engineer."],
    ["Yesterday", "Status updated", "Emre Kaya was moved to Pending."],
  ];
  return <div className="page-wrap"><PageIntro index="01 / OVERVIEW" title="Recruitment, with a clearer signal." description="A structured view of the work that matters: roles in motion, candidates in consideration, and decisions ready to make." action={<button className="red-button" onClick={() => toast("New job form opened")}>Create job <Plus size={16} /></button>} />
    <section className="metric-grid"><Metric label="ACTIVE JOBS" value="12" delta="+2 this month" /><Metric label="TOTAL CANDIDATES" value="1,284" delta="+14.8%" /><Metric label="MATCHES TODAY" value="47" delta="+9 since 09:00" /><Metric label="TOP SCORE" value="92.0" delta="Maia Patel" /></section>
    <section className="dashboard-grid">
      <article className="grid-panel activity-panel"><div className="panel-heading"><div><p className="micro-label">LIVE LOG</p><h2>Recent activity</h2></div><button className="text-button">View all <ArrowRight size={15} /></button></div><div className="activity-list">{activities.map(([time, title, content], index) => <div className="activity-row" key={title}><span className="activity-time">{time}</span><span className={`activity-marker ${index === 0 ? "is-new" : ""}`} /><div><strong>{title}</strong><p>{content}</p></div></div>)}</div></article>
      <article className="grid-panel velocity-panel"><div className="panel-heading"><div><p className="micro-label">MATCH VELOCITY</p><h2>Candidate flow</h2></div><span className="panel-kpi">+18.4%</span></div><div className="velocity-chart" aria-label="Candidate matching volume over the last seven days"><span style={{ height: "26%" }} /><span style={{ height: "45%" }} /><span style={{ height: "35%" }} /><span style={{ height: "72%" }} /><span style={{ height: "54%" }} /><span style={{ height: "88%" }} /><span className="is-latest" style={{ height: "64%" }} /></div><div className="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div><p className="chart-caption">214 candidates moved through a matching workflow this week.</p></article>
    </section>
    <section className="focus-strip"><p className="micro-label">FOCUS FOR TODAY</p><div><strong>03</strong><span>High-fit candidates need a recruiter decision.</span></div><button className="black-button">Review ranking <ArrowRight size={16} /></button></section>
  </div>;
}

function Jobs({ role }: { role: WorkspaceRole }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState("Senior Product Designer");
  const roleJobs = [
    ["Senior Product Designer", "Product · Bengaluru / Hybrid", "47", "92.0", "Active"],
    ["Data Engineer", "Data · Remote", "64", "89.0", "Active"],
    ["Customer Success Lead", "Growth · London", "29", "84.0", "Paused"],
  ];
  const submitJob = (event: FormEvent) => { event.preventDefault(); if (draft.trim().length < 20) { toast.error("Add a fuller job description to continue."); return; } setShowForm(false); setDraft(""); toast.success("Job description submitted for AI parsing."); };
  return <div className="page-wrap"><PageIntro index="02 / JOBS" title={role === "candidate" ? "Open roles, without the noise." : "Every role. One decision surface."} description={role === "candidate" ? "Browse live roles, understand what the team needs, and submit a profile when the fit is right." : "Turn raw job descriptions into a ranked, explainable candidate pipeline."} action={role === "recruiter" ? <button className="red-button" onClick={() => setShowForm(true)}>Create job <Plus size={16} /></button> : null} />
    {role === "recruiter" ? <><div className="jobs-grid">{roleJobs.map(([title, subline, matches, score, state]) => <button className={`job-card ${selected === title ? "is-selected" : ""}`} onClick={() => setSelected(title)} key={title}><div className="job-card-top"><span className={`state-pill ${state === "Paused" ? "is-muted" : ""}`}>{state}</span><MoreHorizontal size={18} /></div><h2>{title}</h2><p>{subline}</p><div className="job-card-data"><span><strong>{matches}</strong>matched</span><span><strong>{score}</strong>top score</span></div><div className="job-card-footer">Review ranking <ArrowRight size={16} /></div></button>)}</div>
      <section className="ranking-preview"><div className="panel-heading"><div><p className="micro-label">SELECTED ROLE</p><h2>{selected}</h2></div><button className="black-button" onClick={() => toast("Opening ranking workspace")}>Open ranking <ArrowRight size={16} /></button></div><p className="panel-copy">The active shortlist combines semantic context, skill coverage, relevant experience, education, and availability into a transparent decision aid.</p><div className="rank-avatars">{rankings.map((item) => <span key={item.name} className="avatar-block">{item.initials}</span>)}<span className="avatar-more">+43</span></div></section></> : <section className="open-role-list">{roleJobs.filter(([, , , , state]) => state === "Active").map(([title, subline, matches, score]) => <article key={title} className="open-role-row"><div><span className="state-pill">Open now</span><h2>{title}</h2><p>{subline}</p></div><div className="role-detail"><span>{matches} people matched</span><button className="black-button" onClick={() => toast.success("Your profile is ready to be considered for this role.")}>Apply <ArrowRight size={16} /></button></div></article>)}</section>}
    {showForm && <Modal title="Create a job from a raw description" onClose={() => setShowForm(false)}><form className="job-form" onSubmit={submitJob}><label>Job title<input placeholder="e.g. Senior Product Designer" required /></label><label>Raw job description<textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Paste the complete job description here. TalentLens will structure the skills, seniority, responsibilities, and role context." required /></label><div className="form-note"><Sparkles size={16} /> AI will map requirements into an explainable candidate-ranking model.</div><button className="red-button" type="submit">Parse and create job <ArrowRight size={16} /></button></form></Modal>}
  </div>;
}

function Candidates() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All candidates");
  const [, setLocation] = useLocation();
  const filtered = useMemo(() => candidates.filter((candidate) => (filter === "All candidates" || candidate.status === filter) && `${candidate.name} ${candidate.title} ${candidate.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [filter, query]);
  return <div className="page-wrap"><PageIntro index="03 / CANDIDATES" title="A real view of every profile." description="Search the signals that matter, review context without hunting, and keep every decision traceable." action={<button className="red-button" onClick={() => toast("Candidate import is ready for a CSV or PDF source.")}>Import candidates <UploadCloud size={16} /></button>} />
    <div className="filter-bar"><label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, skill, or role" /></label><div className="filter-group"><Filter size={16} /><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter candidates"><option>All candidates</option><option>Shortlist</option><option>Pending</option><option>Reject</option></select><ChevronDown size={15} /></div><p>{filtered.length} profiles</p></div>
    <section className="candidate-table"><div className="candidate-head"><span>Candidate</span><span>Expertise</span><span>Best match</span><span>Decision</span><span /></div>{filtered.map((candidate) => <button className="candidate-row" key={candidate.name} onClick={() => setLocation("/candidates/maia-patel")}><div className="person-cell"><span className="avatar-block">{candidate.initials}</span><span><strong>{candidate.name}</strong><small>{candidate.title}</small></span></div><div className="tag-list">{candidate.tags.slice(0, 2).map((tag) => <em key={tag}>{tag}</em>)}</div><div className="score-cell"><strong>{candidate.score}.0</strong><span>Senior Product Designer</span></div><StatusBadge status={candidate.status} /><ChevronRight className="row-arrow" size={18} /></button>)}</section>
  </div>;
}

function CandidateProfile({ candidateMode = false }: { candidateMode?: boolean }) {
  const [, setLocation] = useLocation();
  return <div className="page-wrap"><button className="back-link" onClick={() => setLocation(candidateMode ? "/jobs" : "/candidates")}>← {candidateMode ? "Open roles" : "All candidates"}</button><section className="candidate-hero"><div className="candidate-identity"><span className="candidate-monogram">MP</span><div><p className="section-index">CANDIDATE / 00084</p><h1>{candidateMode ? "Your profile" : "Maia Patel"}</h1><p>Senior Product Designer · Bengaluru, India</p><div className="hero-contact"><span><Mail size={14} />maia.patel.demo@talentlens.example</span><span><MapPin size={14} />Hybrid-ready</span><span><Linkedin size={14} />Verified profile</span></div><div className="demo-profile-actions"><span>Fictional interview-demo profile</span><a className="demo-resume-link" href={demoResumeUrl} target="_blank" rel="noreferrer"><FileText size={15} />Open demo resume</a></div></div></div><div className="candidate-score-hero"><p className="micro-label">BEST MATCH</p><strong>92.0</strong><span>Senior Product Designer</span></div></section>
    <section className="profile-grid"><article className="grid-panel profile-summary"><p className="micro-label">PROFILE SUMMARY</p><h2>Product designer with a systems mindset.</h2><p>Seven years of experience designing high-velocity B2B tools across complex operational workflows. Strong in product strategy, system design, and research synthesis.</p><div className="tag-list large">{["Figma", "Design systems", "B2B SaaS", "User research", "Prototyping"].map((tag) => <em key={tag}>{tag}</em>)}</div></article><article className="grid-panel score-rail"><p className="micro-label">MATCH BREAKDOWN</p>{[["semantic", 96], ["skills", 91], ["experience", 88], ["education", 95], ["availability", 89]].map(([label, value]) => <ScoreLine key={String(label)} label={String(label)} value={Number(value)} />)}</article></section>
    <section className="timeline-grid"><article className="grid-panel"><div className="panel-heading"><div><p className="micro-label">CAREER HISTORY</p><h2>Selected experience</h2></div><BriefcaseBusiness size={19} /></div><div className="timeline"><TimelineItem title="Senior Product Designer" org="Helio Systems" date="2022 — Present" text="Led the end-to-end redesign of a workflow product used by 18,000 operations teams." /><TimelineItem title="Product Designer" org="Ledger & Co." date="2019 — 2022" text="Built reusable patterns and scaled product discovery practice across two squads." /></div></article><article className="grid-panel"><div className="panel-heading"><div><p className="micro-label">EDUCATION</p><h2>Foundation</h2></div><GraduationCap size={19} /></div><div className="education-card"><span>2015 — 2019</span><strong>B.Des, Interaction Design</strong><p>National Institute of Design</p><small>Tier 1 · 95.0 education fit</small></div></article></section>
  </div>;
}

function Rankings() {
  const [active, setActive] = useState<(typeof rankings)[number] | null>(null);
  const [status, setStatus] = useState("Pending");
  const exportExcel = () => { const rows = ["Rank,Candidate,Overall,semantic,skills,experience,education,availability,Status", ...rankings.map((r) => `${r.rank},${r.name},${r.score},${r.semantic},${r.skills},${r.experience},${r.education},${r.availability},${r.status}`)]; const blob = new Blob([rows.join("\n")], { type: "application/vnd.ms-excel" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "talentlens-senior-product-designer-ranking.xls"; link.click(); URL.revokeObjectURL(link.href); toast.success("Excel ranking report downloaded."); };
  return <div className="page-wrap"><PageIntro index="04 / RANKINGS" title="The why behind every score." description="A transparent shortlist for Senior Product Designer, built from the criteria you set — not a black box." action={<button className="red-button" onClick={exportExcel}>Export Excel <Download size={16} /></button>} />
    <div className="ranking-toolbar"><div><p className="micro-label">ACTIVE ROLE</p><button className="role-selector">Senior Product Designer <ChevronDown size={16} /></button></div><div className="ranking-summary"><span>47 candidates analyzed</span><span className="divider-dot" /><span>Updated 09:18 today</span></div></div>
    <section className="ranking-table"><div className="ranking-head"><span>Rank / Candidate</span><span>Overall</span><span>Score composition</span><span>Recommendation</span><span /></div>{rankings.map((item) => <button className="ranking-row" key={item.name} onClick={() => { setActive(item); setStatus(item.status); }}><div className="rank-person"><b>{item.rank}</b><span className="avatar-block">{item.initials}</span><span><strong>{item.name}</strong><small>{item.role}</small></span></div><div className="overall-score"><strong>{item.score}.0</strong><span>/ 100</span></div><div className="micro-score-grid">{[["semantic", item.semantic], ["skills", item.skills], ["experience", item.experience], ["education", item.education], ["availability", item.availability]].map(([label, value]) => <span key={String(label)}><i style={{ width: `${Number(value)}%` }} /><small>{label}</small></span>)}</div><div><StatusBadge status={item.status} /></div><ChevronRight className="row-arrow" size={18} /></button>)}</section>
    {active && <Modal title={`Match explanation · ${active.name}`} onClose={() => setActive(null)}><div className="explanation-modal"><div className="explanation-score"><span className="avatar-block">{active.initials}</span><div><p className="micro-label">OVERALL MATCH</p><strong>{active.score}.0 <small>/ 100</small></strong></div><StatusBadge status={status} /></div><section><p className="micro-label">AI RECOMMENDATION</p><p className="recommendation-copy">{active.note}</p></section><section className="modal-columns"><div><p className="micro-label">STRENGTHS</p>{active.strengths.map((text) => <p className="tick-line" key={text}><Check size={15} />{text}</p>)}</div><div><p className="micro-label">MISSING SKILLS / RISKS</p>{active.gaps.map((text) => <p className="risk-line" key={text}><AlertTriangle size={14} />{text}</p>)}</div></section><section><p className="micro-label">IMPROVEMENT SUGGESTIONS</p><div className="suggestion-box"><Sparkles size={17} /><p>Ask for one case study that demonstrates how the candidate navigated stakeholder alignment while scaling a reusable design system.</p></div></section><section><p className="micro-label">RECRUITER STATUS</p><div className="status-controls">{["Shortlist", "Reject", "Pending"].map((label) => <button key={label} className={status === label ? "is-selected" : ""} onClick={() => { setStatus(label); toast.success(`Candidate marked ${label}.`); }}>{label}</button>)}</div></section></div></Modal>}
  </div>;
}

function Analytics() {
  return <div className="page-wrap"><PageIntro index="05 / ANALYTICS" title="Patterns worth acting on." description="See where the pipeline is moving, how score quality distributes, and which open roles are attracting the right signal." action={<button className="black-button" onClick={() => toast("Analytics snapshot prepared.")}>Download snapshot <Download size={16} /></button>} />
    <section className="analytics-top"><ChartPanel label="SCORE DISTRIBUTION" title="Candidate quality" caption="Most matches are clustering in the 70–89 range."><div className="distribution-chart">{[12, 22, 47, 71, 90, 65, 40, 20].map((height, index) => <span className={index === 4 ? "is-emphasis" : ""} style={{ height: `${height}%` }} key={index} />)}</div><div className="chart-labels wide"><span>40</span><span>50</span><span>60</span><span>70</span><span>80</span><span>90</span><span>100</span></div></ChartPanel><ChartPanel label="HIRING TREND" title="Shortlist momentum" caption="Shortlisting is up 18.4% versus the previous month."><svg className="line-chart" viewBox="0 0 440 180" role="img" aria-label="Shortlist trend rising through July"><path d="M0 149H440M0 90H440M0 31H440" className="grid-lines" /><polyline points="0,135 62,118 124,129 186,77 248,91 310,39 374,64 440,21" className="trend-line" /><circle cx="440" cy="21" r="6" className="trend-point" /></svg><div className="chart-labels wide"><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span></div></ChartPanel></section>
    <section className="analytics-bottom"><ChartPanel label="CANDIDATE PIPELINE" title="Movement by stage" caption="A healthy top-of-funnel with a small decision bottleneck."><div className="pipeline-list">{[["Imported", "1,284", "100%"], ["Parsed", "1,108", "86%"], ["Matched", "824", "64%"], ["Shortlisted", "213", "17%"], ["Interview", "76", "6%"]].map(([label, count, pct], index) => <div key={label} className="pipeline-row"><span className="pipeline-index">0{index + 1}</span><strong>{label}</strong><div className="pipeline-track"><i style={{ width: pct }} /></div><span>{count}</span></div>)}</div></ChartPanel><article className="grid-panel top-jobs"><div className="panel-heading"><div><p className="micro-label">TOP-PERFORMING JOBS</p><h2>Strongest candidate pools</h2></div><BarChart3 size={19} /></div>{[["Senior Product Designer", "92.0", "47 matches"], ["Data Engineer", "89.0", "64 matches"], ["Product Manager", "84.6", "32 matches"]].map(([name, score, matches], index) => <div className="top-job-row" key={name}><span>0{index + 1}</span><div><strong>{name}</strong><small>{matches}</small></div><b>{score}</b></div>)}</article></section>
  </div>;
}

function Upload() {
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const acceptFile = (file?: File) => { if (!file) return; if (file.type !== "application/pdf") { toast.error("Please choose a PDF resume."); return; } setFileName(file.name); toast.success("Resume parsed. Your profile preview is ready."); };
  return <div className="page-wrap"><PageIntro index="06 / RESUME UPLOAD" title="Bring your work into focus." description="Drop in a resume and TalentLens will extract a structured profile you can review before sharing with a hiring team." />
    <section className="upload-layout"><div className="upload-column"><label className={`dropzone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFile(event.dataTransfer.files[0]); }}><input type="file" accept="application/pdf" onChange={(event) => acceptFile(event.target.files?.[0])} /><UploadCloud size={32} /><strong>Drop your PDF resume here</strong><span>or select a file from your device</span><em>PDF only · maximum 10 MB</em></label>{fileName && <div className="uploaded-file"><FileText size={18} /><div><strong>{fileName}</strong><span>Parsed successfully · just now</span></div><CircleCheck size={19} /></div>}</div><div className="parse-note"><Sparkles size={18} /><p><strong>Structured, not speculative.</strong> Your profile is generated from the information in your resume and stays reviewable by you.</p><a className="demo-resume-link inline-demo-resume" href={demoResumeUrl} target="_blank" rel="noreferrer"><FileText size={15} />Use the fictional demo resume</a></div></section>
    {fileName && <section className="parsed-preview"><div className="panel-heading"><div><p className="micro-label">PARSED PROFILE PREVIEW</p><h2>Maia Patel</h2></div><span className="state-pill">Ready to review</span></div><div className="preview-grid"><div><p className="micro-label">IDENTIFIED EXPERIENCE</p><strong>7.0 years</strong><span>Product design · B2B SaaS</span></div><div><p className="micro-label">KEY SKILLS</p><div className="tag-list"><em>Figma</em><em>Design systems</em><em>Research</em></div></div><div><p className="micro-label">EDUCATION</p><strong>B.Des, Interaction Design</strong><span>National Institute of Design</span></div></div><button className="red-button" onClick={() => toast.success("Profile submitted to your candidate workspace.")}>Save my profile <ArrowRight size={16} /></button></section>}
  </div>;
}

function AuthPage({ register = false }: { register?: boolean }) {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const submit = (event: FormEvent) => { event.preventDefault(); setSubmitted(true); toast.success(register ? "Registration details accepted." : "Credentials verified for demo access."); };
  return <div className="auth-page"><div className="auth-editorial"><p className="section-index">TALENTLENS / ACCESS</p><h1>Recruitment has more signal than noise.</h1><p>Use structured evidence to move from a pile of resumes to a clearer, faster decision.</p><div className="auth-shape" /><div className="auth-quote"><span>01</span><p>Make every candidate conversation more informed.</p></div></div><div className="auth-card-wrap"><div className="auth-card"><p className="micro-label">{register ? "CREATE ACCOUNT" : "WELCOME BACK"}</p><h2>{register ? "Set up your workspace." : "Sign in to TalentLens."}</h2><p>{register ? "Start with your identity, then choose how you will use the platform." : "Use your credentials or continue with your Google account."}</p><form onSubmit={submit}>{register && <label>Full name<input required placeholder="Your name" /></label>}<label>Email address<input type="email" required placeholder="name@company.com" /></label><label>Password<input type="password" required placeholder="••••••••" /></label>{register && <label>Workspace role<select defaultValue="recruiter"><option value="recruiter">Recruiter</option><option value="candidate">Candidate</option></select></label>}<button className="red-button full" type="submit">{register ? "Create account" : "Sign in"} <ArrowRight size={16} /></button></form><div className="auth-separator"><span>or</span></div><button className="google-button" onClick={() => toast("Google OAuth would continue from here.")}><Globe2 size={17} />Continue with Google</button><p className="auth-switch">{register ? "Already have an account?" : "New to TalentLens?"}<button onClick={() => setLocation(register ? "/login" : "/register")}>{register ? "Sign in" : "Create one"}</button></p>{submitted && <p className="auth-confirmation"><Check size={14} /> Your next step is ready.</p>}</div></div></div>;
}

function SettingsPage() { return <div className="page-wrap"><PageIntro index="07 / SETTINGS" title="Keep the system accountable." description="Review workspace controls, data visibility, and how matching signals are used in this environment." /><section className="settings-grid"><article className="grid-panel"><p className="micro-label">DATA GOVERNANCE</p><h2>Candidate data access</h2><p className="panel-copy">Profile data is visible only inside your workspace and should be used as recruiter decision support, not autonomous selection.</p><button className="black-button" onClick={() => toast("Data policy panel opened")}>Review policy <ArrowRight size={16} /></button></article><article className="grid-panel"><p className="micro-label">MATCHING MODEL</p><h2>Explainable scoring</h2><div className="setting-status"><ShieldCheck size={20} /><span>Sub-scores are exposed to recruiters.</span></div><div className="setting-status"><Sparkles size={20} /><span>AI recommendations are reviewable.</span></div></article></section></div>; }

function Restricted() { const [, setLocation] = useLocation(); return <div className="restricted"><LockKeyhole size={28} /><p className="micro-label">ROLE-SPECIFIC WORKSPACE</p><h1>This view belongs to the recruiter workspace.</h1><p>Use the role switcher in the sidebar to preview the recruiter navigation, or return to an available candidate view.</p><button className="red-button" onClick={() => setLocation("/jobs")}>Browse open roles <ArrowRight size={16} /></button></div>; }

function StatusBadge({ status }: { status: string }) { return <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>; }
function ScoreLine({ label, value }: { label: string; value: number }) { return <div className="score-line"><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><b>{value}</b></div>; }
function TimelineItem({ title, org, date, text }: { title: string; org: string; date: string; text: string }) { return <div className="timeline-item"><span /><div><small>{date}</small><strong>{title}</strong><em>{org}</em><p>{text}</p></div></div>; }
function ChartPanel({ label, title, caption, children }: { label: string; title: string; caption: string; children: React.ReactNode }) { return <article className="grid-panel chart-panel"><div className="panel-heading"><div><p className="micro-label">{label}</p><h2>{title}</h2></div><MoreHorizontal size={19} /></div><div className="chart-inner">{children}</div><p className="chart-caption">{caption}</p></article>; }
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-layer" role="dialog" aria-modal="true" aria-label={title}><button className="modal-backdrop" onClick={onClose} aria-label="Close modal" /><div className="modal"><div className="modal-header"><h2>{title}</h2><button onClick={onClose} aria-label="Close modal"><X size={20} /></button></div>{children}</div></div>; }

function Router({ role }: { role: WorkspaceRole }) {
  const recruiterOnly = (element: React.ReactNode) => role === "recruiter" ? element : <Restricted />;
  return <Switch>
    <Route path="/">{recruiterOnly(<Dashboard />)}</Route>
    <Route path="/jobs"><Jobs role={role} /></Route>
    <Route path="/candidates/:id">{recruiterOnly(<CandidateProfile />)}</Route>
    <Route path="/candidates">{recruiterOnly(<Candidates />)}</Route>
    <Route path="/profile"><CandidateProfile candidateMode /></Route>
    <Route path="/rankings">{recruiterOnly(<Rankings />)}</Route>
    <Route path="/analytics">{recruiterOnly(<Analytics />)}</Route>
    <Route path="/upload"><Upload /></Route>
    <Route path="/settings"><SettingsPage /></Route>
    <Route path="/login"><AuthPage /></Route>
    <Route path="/register"><AuthPage register /></Route>
    <Route><Dashboard /></Route>
  </Switch>;
}

function App() {
  const [role, setRole] = useState<WorkspaceRole>("recruiter");
  return <><DashboardLayout role={role} onRoleChange={setRole}><Router role={role} /></DashboardLayout><Toaster position="bottom-right" richColors /></>;
}

export default App;
