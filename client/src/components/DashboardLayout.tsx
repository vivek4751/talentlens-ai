import {
  BarChart3,
  BriefcaseBusiness,
  CircleUserRound,
  FileSpreadsheet,
  Gauge,
  Menu,
  Settings,
  UploadCloud,
  UsersRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useLocation } from "wouter";

export type WorkspaceRole = "recruiter" | "candidate";

export type DemoPersona = {
  id: string;
  name: string;
  title: string;
  initials: string;
};

type NavItem = {
  label: string;
  path: string;
  icon: typeof Gauge;
};

const recruiterMenu: NavItem[] = [
  { label: "Overview", path: "/", icon: Gauge },
  { label: "Jobs", path: "/jobs", icon: BriefcaseBusiness },
  { label: "Candidates", path: "/candidates", icon: UsersRound },
  { label: "Rankings", path: "/rankings", icon: FileSpreadsheet },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];

const candidateMenu: NavItem[] = [
  { label: "Open roles", path: "/jobs", icon: BriefcaseBusiness },
  { label: "My profile", path: "/profile", icon: CircleUserRound },
  { label: "Resume upload", path: "/upload", icon: UploadCloud },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function DashboardLayout({
  children,
  role,
  onRoleChange,
  recruiters,
  candidates,
  activeRecruiterId,
  activeCandidateId,
  onRecruiterChange,
  onCandidateChange,
}: {
  children: ReactNode;
  role: WorkspaceRole;
  onRoleChange: (role: WorkspaceRole) => void;
  recruiters: DemoPersona[];
  candidates: DemoPersona[];
  activeRecruiterId: string;
  activeCandidateId: string;
  onRecruiterChange: (id: string) => void;
  onCandidateChange: (id: string) => void;
}) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menu = role === "recruiter" ? recruiterMenu : candidateMenu;
  const roleName = role === "recruiter" ? "Recruiter" : "Candidate";
  const personas = role === "recruiter" ? recruiters : candidates;
  const activePersonaId = role === "recruiter" ? activeRecruiterId : activeCandidateId;
  const profile = personas.find((persona) => persona.id === activePersonaId) ?? personas[0];

  const navigate = (path: string) => {
    setLocation(path);
    setMobileOpen(false);
  };

  const switchRole = (nextRole: WorkspaceRole) => {
    onRoleChange(nextRole);
    navigate(nextRole === "recruiter" ? "/" : "/profile");
  };

  const switchPersona = (id: string) => {
    if (role === "recruiter") {
      onRecruiterChange(id);
    } else {
      onCandidateChange(id);
      navigate("/profile");
    }
  };

  return (
    <div className="workspace-shell">
      <aside className={`workspace-sidebar ${mobileOpen ? "is-open" : ""}`} aria-label="Primary navigation">
        <div className="brand-block">
          <button className="brand-mark" onClick={() => navigate("/")} aria-label="TalentLens AI home">TL</button>
          <div>
            <p className="brand-title">TALENTLENS</p>
            <p className="brand-subtitle">Recruitment intelligence</p>
          </div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>

        <div className="role-switcher" aria-label="Preview user role">
          <p className="micro-label">WORKSPACE MODE</p>
          <div className="role-switcher-buttons">
            <button className={role === "recruiter" ? "is-selected" : ""} onClick={() => switchRole("recruiter")}>Recruiter</button>
            <button className={role === "candidate" ? "is-selected" : ""} onClick={() => switchRole("candidate")}>Candidate</button>
          </div>
        </div>

        <div className="persona-switcher">
          <p className="micro-label">DEMO {role === "recruiter" ? "RECRUITER" : "CANDIDATE"} IDENTITY</p>
          <select value={activePersonaId} onChange={(event) => switchPersona(event.target.value)} aria-label={`Choose a fictional ${role} demo identity`}>
            {personas.map((persona) => <option key={persona.id} value={persona.id}>{persona.name} — {persona.title}</option>)}
          </select>
          <span>{personas.length} fictional demo profiles available</span>
        </div>

        <nav className="sidebar-nav">
          <p className="micro-label">{roleName} MENU</p>
          {menu.map((item) => {
            const Icon = item.icon;
            const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
            return (
              <button key={item.path} className={`nav-row ${active ? "is-active" : ""}`} onClick={() => navigate(item.path)}>
                <Icon size={17} strokeWidth={1.8} />
                <span>{item.label}</span>
                {active && <i aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-block">
            <div className="avatar-block">{profile?.initials}</div>
            <div>
              <p>{profile?.name}</p>
              <span>{profile?.title} · Demo account</span>
              <small className="demo-account">Fictional interview demo</small>
            </div>
          </div>
          <button className="sidebar-signout" onClick={() => navigate("/login")}>Sign out</button>
        </div>
      </aside>
      {mobileOpen && <button className="nav-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}

      <section className="workspace-content">
        <header className="topline">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <p><span className="topline-square" />Data-led talent decisions</p>
          <div className="topline-meta"><span>{roleName} view</span><span className="live-dot" />Live workspace</div>
        </header>
        <main>{children}</main>
      </section>
    </div>
  );
}
