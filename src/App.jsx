import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  GraduationCap, Building2, Briefcase, Users, ArrowRight, X, Plus, Check,
  ChevronRight, Bell, User, LogOut, BarChart3, Target, FolderKanban,
  FileText, Search, Send, Menu, Sparkles, ClipboardList,
  AlertCircle, CheckCircle2, Clock, Award, LayoutDashboard, Link2, Trash2
} from "lucide-react";
import { supabase } from "./lib/supabaseClient.js";

/* ============================================================
   DESIGN TOKENS
   Ink navy + working-teal + academic gold. Cool paper background
   (not the generic warm cream). Fraunces for display, Inter for UI.
   ============================================================ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap');

:root{
  --ink:#12203A;
  --canvas:#F1F4EE;
  --surface:#FFFFFF;
  --primary:#1F6F5C;
  --primary-dark:#164F41;
  --accent:#C9962B;
  --accent-soft:#F3E4C2;
  --line:#DBE1D6;
  --muted:#5B6B62;
  --danger:#B4442E;
  --radius-s:6px;
  --radius-m:10px;
  --radius-l:18px;
}
*{box-sizing:border-box;}
.sb-root{
  font-family:'Inter',sans-serif;
  background:var(--canvas);
  color:var(--ink);
  min-height:100vh;
  line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
.sb-root h1,.sb-root h2,.sb-root h3,.sb-root .display{
  font-family:'Fraunces',serif;
  font-weight:600;
  letter-spacing:-0.01em;
  color:var(--ink);
}
.sb-root button{font-family:inherit;cursor:pointer;}
.sb-root input,.sb-root select,.sb-root textarea{font-family:inherit;}
.sb-root a{color:inherit;}
.sb-root :focus-visible{outline:2px solid var(--primary);outline-offset:2px;}
.sb-btn{
  display:inline-flex;align-items:center;gap:8px;
  padding:11px 20px;border-radius:var(--radius-s);
  border:1px solid transparent;font-weight:600;font-size:14.5px;
  transition:transform .12s ease, box-shadow .12s ease;
}
.sb-btn:active{transform:translateY(1px);}
.sb-btn-primary{background:var(--primary);color:#fff;}
.sb-btn-primary:hover{background:var(--primary-dark);}
.sb-btn-ghost{background:transparent;color:var(--ink);border-color:var(--line);}
.sb-btn-ghost:hover{border-color:var(--ink);}
.sb-btn-accent{background:var(--accent);color:var(--ink);}
.sb-btn-accent:hover{filter:brightness(0.95);}
.sb-btn-sm{padding:7px 12px;font-size:13px;border-radius:6px;}
.sb-btn-danger{background:transparent;color:var(--danger);border-color:#EAC7BE;}
.sb-btn:disabled{opacity:.45;cursor:not-allowed;}
.sb-chip{
  display:inline-flex;align-items:center;gap:6px;
  padding:5px 12px;border-radius:100px;font-size:13px;font-weight:600;
  background:var(--accent-soft);color:#7A5A12;border:1px solid #E8D19E;
}
.sb-chip button{background:none;border:none;padding:0;display:flex;color:#7A5A12;}
.sb-card{
  background:var(--surface);border:1px solid var(--line);
  border-radius:var(--radius-m);
}
.sb-mock-tag{
  font-size:11px;font-weight:700;color:var(--primary-dark);
  background:#E4EFEA;border:1px solid #C7DFD5;padding:3px 8px;border-radius:5px;
}
.sb-input{
  width:100%;padding:10px 12px;border:1px solid var(--line);
  border-radius:7px;font-size:14.5px;background:#fff;color:var(--ink);
}
.sb-input:focus{border-color:var(--primary);}
.sb-label{font-size:13px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px;}
.sb-field{margin-bottom:16px;}
.sb-progress-track{height:8px;background:#E4E9E0;border-radius:100px;overflow:hidden;}
.sb-progress-fill{height:100%;border-radius:100px;background:var(--primary);}
::selection{background:var(--accent-soft);}
@media (max-width: 760px){
  .sb-nav-links{ display:none !important; }
}
@media (max-width: 520px){
  .sb-card{ border-radius:8px; }
}
`;

/* ============================================================
   STATIC REFERENCE DATA (not stored in DB — used for skill-gap
   comparison logic only)
   ============================================================ */
const CAREER_SKILL_MAP = {
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "Git", "Responsive Design", "REST APIs"],
  "Backend Developer": ["Java", "SQL", "REST APIs", "Spring Boot", "Git", "System Design", "Docker"],
  "Data Analyst": ["Excel", "SQL", "Python", "Power BI", "Statistics", "Data Visualization"],
  "Data Scientist": ["Python", "Statistics", "Machine Learning", "SQL", "Data Visualization", "Pandas"],
  "Cloud Engineer": ["AWS", "Linux", "Docker", "Kubernetes", "Networking", "CI/CD"],
  "UI/UX Designer": ["Figma", "Wireframing", "User Research", "Prototyping", "Design Systems"],
  "Cybersecurity Analyst": ["Networking", "Linux", "Ethical Hacking", "SIEM Tools", "Python"],
};
const ALL_CAREERS = Object.keys(CAREER_SKILL_MAP);

/* ============================================================
   HELPERS — map DB rows to frontend shape and vice versa
   ============================================================ */
function mapProfileRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    role: row.role,
    email: row.email || "",
    name: row.name || "",
    username: row.username || "",
    college: row.college || "",
    department: row.department || "",
    year: row.year || "",
    industry: row.industry || "",
    designation: row.designation || "",
    company: row.company || "",
    skills: row.skills || [],
    gaps: row.gaps || [],
    interests: row.interests || [],
    requiredSkills: row.required_skills || [],
    portfolio: row.portfolio || { headline: "", bio: "", projects: [], links: { github: "", linkedin: "" } },
    isSeed: row.is_seed || false,
  };
}

function profileToUpdateObj(profile) {
  const obj = {
    name: profile.name,
    email: profile.email,
    username: profile.username,
    college: profile.college,
    department: profile.department,
    skills: profile.skills,
    gaps: profile.gaps,
    interests: profile.interests,
    portfolio: profile.portfolio,
  };
  if (profile.role === "student") obj.year = profile.year;
  if (profile.role === "recruiter") {
    obj.industry = profile.industry;
    obj.required_skills = profile.requiredSkills;
  }
  if (profile.role === "faculty" || profile.role === "placement") obj.designation = profile.designation;
  return obj;
}

const emptyStudent = () => ({
  role: "student", name: "", username: "", email: "", password: "", confirmPassword: "",
  college: "", department: "", year: "1st Year", skills: [], gaps: [], interests: [],
  portfolio: { headline: "", bio: "", projects: [], links: { github: "", linkedin: "" } },
});
const emptyRecruiter = () => ({ role: "recruiter", company: "", name: "", email: "", password: "", confirmPassword: "", industry: "", requiredSkills: [] });
const emptyFaculty = () => ({ role: "faculty", name: "", email: "", password: "", confirmPassword: "", college: "", department: "", designation: "" });
const emptyPlacement = () => ({ role: "placement", name: "", email: "", password: "", confirmPassword: "", college: "", designation: "" });

function profileCompletion(s) {
  const fields = [s.name, s.email, s.college, s.department, s.skills.length, s.interests.length, s.portfolio?.bio, s.portfolio?.projects?.length];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

/* ============================================================
   SMALL SHARED UI
   ============================================================ */
function SkillTagInput({ value, onAdd, onRemove, placeholder, tone = "primary" }) {
  const [text, setText] = useState("");
  const submit = () => {
    const v = text.trim();
    if (v && !value.includes(v)) onAdd(v);
    setText("");
  };
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input className="sb-input" placeholder={placeholder} value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} />
        <button type="button" className="sb-btn sb-btn-ghost sb-btn-sm" onClick={submit}><Plus size={15} /> Add</button>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {value.length === 0 && <span style={{ fontSize: 13, color: "var(--muted)" }}>None added yet.</span>}
        {value.map((s) => (
          <span key={s} className="sb-chip" style={tone === "gap" ? { background: "#FCEDE8", color: "#93341C", borderColor: "#F1CFC2" } : {}}>
            {s} <button onClick={() => onRemove(s)}><X size={13} /></button>
          </span>
        ))}
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, action, children }) {
  return (
    <div className="sb-card" style={{ padding: 22, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {Icon && <Icon size={18} color="var(--primary)" />}
          <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Row({ children }) { return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>{children}</div>; }
function Field({ label, value, onChange, type = "text", required, placeholder }) {
  return (
    <div className="sb-field">
      <label className="sb-label">{label}{required && " *"}</label>
      <input className="sb-input" type={type} value={value} required={required} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
function Logo({ size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <circle cx="9" cy="9" r="5" fill="#1F6F5C" />
        <circle cx="23" cy="9" r="5" fill="#C9962B" />
        <circle cx="16" cy="24" r="5" fill="#12203A" />
        <line x1="12.3" y1="11.3" x2="19.7" y2="11.3" stroke="#C7CFC3" strokeWidth="1.6" />
        <line x1="10.5" y1="13.2" x2="14.5" y2="20" stroke="#C7CFC3" strokeWidth="1.6" />
        <line x1="21.5" y1="13.2" x2="17.5" y2="20" stroke="#C7CFC3" strokeWidth="1.6" />
      </svg>
      <span className="display" style={{ fontSize: 20, fontWeight: 600 }}>SkillBridge</span>
    </div>
  );
}

function HeroGraphic() {
  return (
    <svg viewBox="0 0 460 360" width="100%" style={{ maxWidth: 460 }}>
      <line x1="120" y1="90" x2="330" y2="90" stroke="#C7CFC3" strokeWidth="2" strokeDasharray="4 5" />
      <line x1="120" y1="90" x2="225" y2="270" stroke="#C7CFC3" strokeWidth="2" strokeDasharray="4 5" />
      <line x1="330" y1="90" x2="225" y2="270" stroke="#C7CFC3" strokeWidth="2" strokeDasharray="4 5" />

      <g>
        <circle cx="120" cy="90" r="52" fill="#E4EFEA" stroke="#1F6F5C" strokeWidth="1.5" />
        <foreignObject x="80" y="65" width="80" height="55">
          <div style={{ textAlign: "center", fontFamily: "Inter", fontSize: 12, fontWeight: 700, color: "#164F41" }}>
            <GraduationCap size={20} style={{ marginBottom: 2 }} /><div>Students</div>
          </div>
        </foreignObject>
      </g>
      <g>
        <circle cx="330" cy="90" r="52" fill="#FBF1DC" stroke="#C9962B" strokeWidth="1.5" />
        <foreignObject x="290" y="65" width="80" height="55">
          <div style={{ textAlign: "center", fontFamily: "Inter", fontSize: 12, fontWeight: 700, color: "#7A5A12" }}>
            <Building2 size={20} style={{ marginBottom: 2 }} /><div>Industry</div>
          </div>
        </foreignObject>
      </g>
      <g>
        <circle cx="225" cy="270" r="58" fill="#EAEEF5" stroke="#12203A" strokeWidth="1.5" />
        <foreignObject x="180" y="242" width="90" height="60">
          <div style={{ textAlign: "center", fontFamily: "Inter", fontSize: 12, fontWeight: 700, color: "#12203A" }}>
            <Users size={20} style={{ marginBottom: 2 }} /><div>Colleges &amp; Faculty</div>
          </div>
        </foreignObject>
      </g>
      {["React", "SQL", "Figma", "AWS"].map((t, i) => (
        <g key={t} transform={`translate(${[195, 245, 165, 275][i]} ${[150, 165, 190, 195][i]})`}>
          <rect width="52" height="22" rx="11" fill="#fff" stroke="#DBE1D6" />
          <text x="26" y="15" textAnchor="middle" fontFamily="Inter" fontSize="10" fontWeight="600" fill="#12203A">{t}</text>
        </g>
      ))}
    </svg>
  );
}

function LandingPage({ goto }) {
  const [tab, setTab] = useState("students");
  const benefits = {
    students: ["See exactly which skills recruiters want, and which ones you're missing", "Build a living portfolio that updates as you learn", "Apply to verified internships matched to your profile"],
    colleges: ["Spot department-wide skill gaps before placement season", "Track every student's readiness in one roster view", "Show recruiters a verified, data-backed talent pipeline"],
    companies: ["Filter candidates by exact skill match, not just CGPA", "Post roles once, reach every partner college instantly", "Track applicants from shortlist to offer in one place"],
  };
  return (
    <div>
      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(241,244,238,0.9)", backdropFilter: "blur(6px)", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <nav style={{ display: "flex", gap: 26, fontSize: 14.5, fontWeight: 600, color: "var(--muted)" }} className="sb-nav-links">
            <a href="#problem">Problem</a><a href="#features">Features</a><a href="#how">How it works</a><a href="#benefits">Benefits</a>
          </nav>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="sb-btn sb-btn-ghost sb-btn-sm" onClick={() => goto("login")}>Log in</button>
            <button className="sb-btn sb-btn-primary sb-btn-sm" onClick={() => goto("signup")}>Sign up</button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "72px 24px 60px", display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 440px" }}>
          <span className="sb-mock-tag" style={{ marginBottom: 18, display: "inline-block" }}>Built for Smart India Hackathon</span>
          <h1 className="display" style={{ fontSize: "clamp(32px,4.4vw,50px)", lineHeight: 1.08, margin: "14px 0 20px" }}>
            One shared map for skills, internships and placement.
          </h1>
          <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 480, marginBottom: 30 }}>
            SkillBridge connects students, colleges and recruiters around a single, honest picture of who has which skills — and who still needs to build them.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="sb-btn sb-btn-primary" onClick={() => goto("signup")}>Get started free <ArrowRight size={16} /></button>
            <button className="sb-btn sb-btn-ghost" onClick={() => goto("login")}>I already have an account</button>
          </div>
        </div>
        <div style={{ flex: "1 1 340px", display: "flex", justifyContent: "center" }}>
          <HeroGraphic />
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" style={{ background: "var(--ink)", color: "#fff", padding: "56px 24px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <h2 className="display" style={{ color: "#fff", fontSize: 26, marginBottom: 18 }}>The gap nobody has a shared view of</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 20 }}>
            {[
              ["Students don't know what they're missing", "They graduate with a transcript, not a clear picture of the skills recruiters are actually hiring for."],
              ["Colleges can't see it at scale", "Faculty and placement cells have no single view of which skills their students have or lack, department-wide."],
              ["Recruiters search blind", "Companies sift through resumes and CGPA sheets instead of filtering by real, verified skills."],
            ].map(([t, d]) => (
              <div key={t} style={{ padding: 20, border: "1px solid #2A3A55", borderRadius: 12 }}>
                <h3 style={{ color: "#fff", fontSize: 16.5, margin: "0 0 8px" }}>{t}</h3>
                <p style={{ color: "#AEB9C9", fontSize: 14, margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 24px" }}>
        <h2 className="display" style={{ fontSize: 26, marginBottom: 8 }}>Everything each side needs, in one portal</h2>
        <p style={{ color: "var(--muted)", marginBottom: 32, maxWidth: 560 }}>Four dashboards, one shared source of truth on skills and opportunities.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 18 }}>
          {[
            [GraduationCap, "For students", "Skill-gap analysis, a portfolio builder, and internships matched to your profile."],
            [Users, "For faculty", "Monitor each student's skill development and flag who needs support."],
            [ClipboardList, "For placement cells", "Track internships, drives and outcomes across every department."],
            [Building2, "For recruiters", "Post roles and filter applicants by verified, specific skills."],
          ].map(([Icon, t, d]) => (
            <div key={t} className="sb-card" style={{ padding: 22 }}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: "#E4EFEA", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon size={19} color="var(--primary)" />
              </div>
              <h3 style={{ fontSize: 16, margin: "0 0 6px" }}>{t}</h3>
              <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ background: "#E9EEE5", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <h2 className="display" style={{ fontSize: 26, marginBottom: 32 }}>How SkillBridge works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 0, borderTop: "1px solid var(--line)" }}>
            {[
              ["Create your profile", "Students list current skills and career interests; colleges and recruiters register their organisation."],
              ["See the gap", "Our rule-based engine compares current skills against the target role and shows exactly what's missing."],
              ["Match and apply", "Recruiters post roles; students apply to opportunities ranked by real skill match."],
              ["Track outcomes", "Faculty and placement cells follow progress from first login to final offer."],
            ].map(([t, d], i) => (
              <div key={t} style={{ padding: "22px 20px 22px 0", borderBottom: "1px solid var(--line)", position: "relative" }}>
                <div style={{ fontFamily: "Fraunces", fontSize: 28, color: "var(--accent)", marginBottom: 8 }}>{i + 1}</div>
                <h3 style={{ fontSize: 15.5, margin: "0 0 6px" }}>{t}</h3>
                <p style={{ fontSize: 13.5, color: "var(--muted)", margin: 0, maxWidth: 220 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 24px" }}>
        <h2 className="display" style={{ fontSize: 26, marginBottom: 20 }}>Built around three audiences</h2>
        <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
          {[["students", "Students"], ["colleges", "Colleges & faculty"], ["companies", "Companies"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className="sb-btn sb-btn-sm"
              style={{ background: tab === k ? "var(--ink)" : "transparent", color: tab === k ? "#fff" : "var(--ink)", border: "1px solid " + (tab === k ? "var(--ink)" : "var(--line)") }}>
              {l}
            </button>
          ))}
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
          {benefits[tab].map((b) => (
            <li key={b} className="sb-card" style={{ padding: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <CheckCircle2 size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 14.5 }}>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section style={{ padding: "60px 24px", textAlign: "center" }}>
        <h2 className="display" style={{ fontSize: 28, marginBottom: 16 }}>Ready to close the skill gap?</h2>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="sb-btn sb-btn-primary" onClick={() => goto("signup")}>Create free account</button>
          <button className="sb-btn sb-btn-ghost" onClick={() => goto("login")}>Log in</button>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--line)", padding: "28px 24px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, maxWidth: 1140, margin: "0 auto" }}>
        <Logo size={18} />
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Built for Smart India Hackathon · Powered by Supabase</span>
      </footer>
    </div>
  );
}

/* ============================================================
   AUTH
   ============================================================ */
const ROLES = [
  { key: "student", label: "Student", icon: GraduationCap, desc: "Map your skills, build a portfolio, apply to roles." },
  { key: "faculty", label: "Faculty", icon: Users, desc: "Monitor your students' skill development." },
  { key: "recruiter", label: "Industry Recruiter", icon: Building2, desc: "Post roles and find matching student talent." },
  { key: "placement", label: "Placement Cell", icon: ClipboardList, desc: "Track internships and placement activity." },
];

function AuthShell({ children, goto, title, sub }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <div style={{ marginBottom: 26, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => goto("landing")} style={{ background: "none", border: "none" }}><Logo /></button>
          <span className="sb-mock-tag">Secure authentication powered by Supabase</span>
        </div>
        <div className="sb-card" style={{ padding: 32 }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 22 }}>{title}</h2>
          {sub && <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 22px" }}>{sub}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

function SignupFlow({ goto, onCreate }) {
  const [role, setRole] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!role) {
    return (
      <AuthShell goto={goto} title="Create your account" sub="Choose how you'll use SkillBridge.">
        <div style={{ display: "grid", gap: 10 }}>
          {ROLES.map((r) => (
            <button key={r.key} onClick={() => { setRole(r.key); setForm(r.key === "student" ? emptyStudent() : r.key === "recruiter" ? emptyRecruiter() : r.key === "faculty" ? emptyFaculty() : emptyPlacement()); setError(""); }}
              className="sb-card" style={{ display: "flex", alignItems: "center", gap: 14, padding: 16, textAlign: "left", border: "1px solid var(--line)", background: "#fff" }}>
              <div style={{ width: 42, height: 42, borderRadius: 9, background: "#E4EFEA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <r.icon size={20} color="var(--primary)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.label}</div>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>{r.desc}</div>
              </div>
              <ChevronRight size={18} color="var(--muted)" />
            </button>
          ))}
        </div>
        <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 20, textAlign: "center" }}>
          Already have an account? <button onClick={() => goto("login")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, padding: 0 }}>Log in</button>
        </p>
      </AuthShell>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError("Account creation failed — no user ID returned.");
        setLoading(false);
        return;
      }

      const profileRow = {
        user_id: userId,
        role: form.role,
        email: form.email,
        name: form.name,
        username: form.username || null,
        college: form.college || null,
        department: form.department || null,
        skills: form.skills || [],
        gaps: form.gaps || [],
        interests: form.interests || [],
        portfolio: form.portfolio || { headline: "", bio: "", projects: [], links: { github: "", linkedin: "" } },
      };
      if (form.role === "student") {
        profileRow.year = form.year;
      }
      if (form.role === "recruiter") {
        profileRow.company = form.company;
        profileRow.industry = form.industry;
        profileRow.required_skills = form.requiredSkills || [];
      }
      if (form.role === "faculty" || form.role === "placement") {
        profileRow.designation = form.designation;
      }

      const { error: profileError } = await supabase.from("profiles").insert(profileRow);

      if (profileError) {
        setError("Account created but profile could not be saved: " + profileError.message);
        setLoading(false);
        return;
      }

      onCreate(mapProfileRow({ ...profileRow, id: userId, is_seed: false }));
    } catch (err) {
      setError("An unexpected error occurred: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  return (
    <AuthShell goto={goto} title={`Sign up as ${ROLES.find((r) => r.key === role).label}`} sub="This is your own profile — nothing here is pre-filled with sample data.">
      <form onSubmit={submit}>
        {role === "student" && (
          <>
            <Row><Field label="Full name" value={form.name} onChange={(v) => set("name", v)} required /><Field label="Username" value={form.username} onChange={(v) => set("username", v)} required /></Row>
            <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} required />
            <Row><Field label="Password" type="password" value={form.password} onChange={(v) => set("password", v)} required /><Field label="Confirm password" type="password" value={form.confirmPassword} onChange={(v) => set("confirmPassword", v)} required /></Row>
            <Row><Field label="College name" value={form.college} onChange={(v) => set("college", v)} required /><Field label="Department" value={form.department} onChange={(v) => set("department", v)} required /></Row>
            <div className="sb-field">
              <label className="sb-label">Year of study</label>
              <select className="sb-input" value={form.year} onChange={(e) => set("year", e.target.value)}>
                {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div className="sb-field"><label className="sb-label">Skills you currently have</label>
              <SkillTagInput value={form.skills} placeholder="e.g. Python, Excel, Figma" onAdd={(s) => set("skills", [...form.skills, s])} onRemove={(s) => set("skills", form.skills.filter((x) => x !== s))} />
            </div>
            <div className="sb-field"><label className="sb-label">Areas where you need improvement</label>
              <SkillTagInput value={form.gaps} tone="gap" placeholder="e.g. Public speaking, SQL" onAdd={(s) => set("gaps", [...form.gaps, s])} onRemove={(s) => set("gaps", form.gaps.filter((x) => x !== s))} />
            </div>
            <div className="sb-field"><label className="sb-label">Career interests</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ALL_CAREERS.map((c) => {
                  const active = form.interests.includes(c);
                  return <button type="button" key={c} onClick={() => set("interests", active ? form.interests.filter((x) => x !== c) : [...form.interests, c])}
                    className="sb-chip" style={{ background: active ? "var(--primary)" : "#fff", color: active ? "#fff" : "var(--ink)", borderColor: active ? "var(--primary)" : "var(--line)" }}>{c}</button>;
                })}
              </div>
            </div>
          </>
        )}
        {role === "recruiter" && (
          <>
            <Row><Field label="Company name" value={form.company} onChange={(v) => set("company", v)} required /><Field label="Recruiter name" value={form.name} onChange={(v) => set("name", v)} required /></Row>
            <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} required />
            <Row><Field label="Password" type="password" value={form.password} onChange={(v) => set("password", v)} required /><Field label="Confirm password" type="password" value={form.confirmPassword} onChange={(v) => set("confirmPassword", v)} required /></Row>
            <Field label="Industry" value={form.industry} onChange={(v) => set("industry", v)} required placeholder="e.g. IT Services, Fintech" />
            <div className="sb-field"><label className="sb-label">Skills you usually hire for</label>
              <SkillTagInput value={form.requiredSkills} placeholder="e.g. React, SQL" onAdd={(s) => set("requiredSkills", [...form.requiredSkills, s])} onRemove={(s) => set("requiredSkills", form.requiredSkills.filter((x) => x !== s))} />
            </div>
          </>
        )}
        {role === "faculty" && (
          <>
            <Field label="Full name" value={form.name} onChange={(v) => set("name", v)} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} required />
            <Row><Field label="Password" type="password" value={form.password} onChange={(v) => set("password", v)} required /><Field label="Confirm password" type="password" value={form.confirmPassword} onChange={(v) => set("confirmPassword", v)} required /></Row>
            <Row><Field label="College name" value={form.college} onChange={(v) => set("college", v)} required /><Field label="Department" value={form.department} onChange={(v) => set("department", v)} required /></Row>
            <Field label="Designation" value={form.designation} onChange={(v) => set("designation", v)} placeholder="e.g. Assistant Professor" required />
          </>
        )}
        {role === "placement" && (
          <>
            <Field label="Full name" value={form.name} onChange={(v) => set("name", v)} required />
            <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} required />
            <Row><Field label="Password" type="password" value={form.password} onChange={(v) => set("password", v)} required /><Field label="Confirm password" type="password" value={form.confirmPassword} onChange={(v) => set("confirmPassword", v)} required /></Row>
            <Field label="College name" value={form.college} onChange={(v) => set("college", v)} required />
            <Field label="Designation" value={form.designation} onChange={(v) => set("designation", v)} placeholder="e.g. Placement Officer" required />
          </>
        )}
        {error && <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#FCEDE8", border: "1px solid #F1CFC2", padding: 12, borderRadius: 8, fontSize: 13.5, color: "#93341C", marginBottom: 14, marginTop: 4 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button type="button" className="sb-btn sb-btn-ghost" onClick={() => { setRole(null); setError(""); }}>Back</button>
          <button type="submit" disabled={loading} className="sb-btn sb-btn-primary" style={{ flex: 1, justifyContent: "center" }}>
            {loading ? "Creating account..." : <>Create account <ArrowRight size={16} /></>}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

function LoginPage({ goto, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes("invalid login")) {
          setError("Incorrect email or password. Please try again.");
        } else if (authError.message.toLowerCase().includes("not confirmed")) {
          setError("Your account has not been verified. Please check your email.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        setError("Login succeeded but no user ID was returned.");
        setLoading(false);
        return;
      }

      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        setError("Could not load your profile: " + profileError.message);
        setLoading(false);
        return;
      }

      if (!profileRow) {
        setError("No profile found for this account. Please contact support.");
        setLoading(false);
        return;
      }

      onLogin(mapProfileRow(profileRow));
    } catch (err) {
      setError("A network or authentication error occurred: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  return (
    <AuthShell goto={goto} title="Log in" sub="Enter the email and password you used at signup.">
      <form onSubmit={submit}>
        <Field label="Email" type="email" value={email} onChange={setEmail} required />
        <Field label="Password" type="password" value={password} onChange={setPassword} required />
        {error && <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#FCEDE8", border: "1px solid #F1CFC2", padding: 12, borderRadius: 8, fontSize: 13.5, color: "#93341C", marginBottom: 14, marginTop: 4 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>}
        <button type="submit" disabled={loading} className="sb-btn sb-btn-primary" style={{ width: "100%", justifyContent: "center", marginBottom: 10 }}>
          {loading ? "Logging in..." : <>Log in <ArrowRight size={16} /></>}
        </button>
      </form>
      <p style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 18, textAlign: "center" }}>
        New here? <button onClick={() => goto("signup")} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, padding: 0 }}>Create an account</button>
      </p>
    </AuthShell>
  );
}

/* ============================================================
   DASHBOARD SHELL
   ============================================================ */
function DashboardShell({ user, tabs, active, setActive, onLogout, notifCount, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside style={{
        width: 240, background: "var(--ink)", color: "#fff", padding: "22px 16px",
        position: "sticky", top: 0, height: "100vh", flexShrink: 0,
        display: "flex", flexDirection: "column",
      }} className={"sb-sidebar" + (mobileOpen ? " sb-sidebar-open" : "")}>
        <div style={{ padding: "0 8px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="20" height="20" viewBox="0 0 32 32"><circle cx="9" cy="9" r="5" fill="#1F6F5C" /><circle cx="23" cy="9" r="5" fill="#C9962B" /><circle cx="16" cy="24" r="5" fill="#fff" /></svg>
            <span className="display" style={{ color: "#fff", fontSize: 17 }}>SkillBridge</span>
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => { setActive(t.key); setMobileOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 8,
                background: active === t.key ? "rgba(255,255,255,0.12)" : "transparent", border: "none", color: "#fff",
                fontSize: 14, fontWeight: 600, textAlign: "left",
              }}>
              <t.icon size={17} />{t.label}
              {t.key === "notifications" && notifCount > 0 && <span style={{ marginLeft: "auto", background: "var(--accent)", color: "#12203A", fontSize: 11, fontWeight: 800, borderRadius: 100, padding: "1px 7px" }}>{notifCount}</span>}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{user.name || user.company}</div>
          <div style={{ fontSize: 12, color: "#9FB0A5", marginBottom: 12, textTransform: "capitalize" }}>{user.role}</div>
          <button onClick={onLogout} className="sb-btn sb-btn-ghost sb-btn-sm" style={{ width: "100%", justifyContent: "center", color: "#fff", borderColor: "rgba(255,255,255,0.25)" }}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </aside>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="sb-mobile-topbar" style={{ display: "none", padding: "14px 20px", borderBottom: "1px solid var(--line)", alignItems: "center", justifyContent: "space-between" }}>
          <Logo size={18} />
          <button onClick={() => setMobileOpen((o) => !o)} className="sb-btn sb-btn-ghost sb-btn-sm"><Menu size={16} /></button>
        </div>
        <div className="sb-dash-content" style={{ padding: "28px 32px 60px", maxWidth: 1080 }}>{children}</div>
      </div>
      <style>{`
        @media (max-width: 880px){
          .sb-sidebar{ position:fixed !important; z-index:30; display:none !important; width:80vw !important; max-width:280px; }
          .sb-sidebar.sb-sidebar-open{ display:flex !important; box-shadow:0 0 0 100vmax rgba(0,0,0,0.35); }
          .sb-mobile-topbar{ display:flex !important; }
          .sb-dash-content{ padding:20px 18px 48px !important; }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
   STUDENT DASHBOARD
   ============================================================ */
function StudentDashboard({ user, setUser, jobs, applications, applyToJob, updateProfile, notifications, onLogout }) {
  const [active, setActive] = useState("overview");
  const completion = profileCompletion(user);
  const primaryCareer = user.interests[0];
  const target = primaryCareer ? CAREER_SKILL_MAP[primaryCareer] : [];
  const have = target.filter((s) => user.skills.includes(s));
  const missing = target.filter((s) => !user.skills.includes(s));
  const readiness = target.length ? Math.round((have.length / target.length) * 100) : 0;

  const rankedJobs = useMemo(() => jobs.map((j) => {
    const matched = j.skills.filter((s) => user.skills.includes(s));
    return { ...j, matchPct: Math.round((matched.length / j.skills.length) * 100), matched };
  }).sort((a, b) => b.matchPct - a.matchPct), [jobs, user.skills]);

  const myApplications = applications.filter((a) => a.student_id === user.userId);

  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "skills", label: "Skills & Gap Analysis", icon: Target },
    { key: "portfolio", label: "Portfolio", icon: FolderKanban },
    { key: "opportunities", label: "Opportunities", icon: Briefcase },
    { key: "applications", label: "Applications", icon: FileText },
    { key: "notifications", label: "Notifications", icon: Bell },
  ];

  const setField = (k, v) => {
    setUser((u) => ({ ...u, [k]: v }));
    updateProfile({ [k]: v });
  };

  return (
    <DashboardShell user={user} tabs={tabs} active={active} setActive={setActive} onLogout={onLogout} notifCount={notifications.length}>
      {active === "overview" && (
        <>
          <h1 style={{ fontSize: 25, margin: "0 0 4px" }}>Welcome back, {user.name.split(" ")[0] || "there"}.</h1>
          <p style={{ color: "var(--muted)", margin: "0 0 26px" }}>{user.college || "Your college"} · {user.department || "Department"} · {user.year}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginBottom: 24 }}>
            <Stat label="Profile completion" value={`${completion}%`} icon={User} />
            <Stat label="Skills logged" value={user.skills.length} icon={Sparkles} />
            <Stat label="Target-role readiness" value={primaryCareer ? `${readiness}%` : "Add a career interest"} icon={Target} />
            <Stat label="Applications sent" value={myApplications.length} icon={Send} />
          </div>

          <Section icon={Target} title="Profile completion">
            <div className="sb-progress-track" style={{ marginBottom: 8 }}><div className="sb-progress-fill" style={{ width: `${completion}%` }} /></div>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
              {completion < 100 ? "Finish your portfolio and add more skills to reach 100%." : "Your profile is complete — recruiters see the full picture."}
            </p>
          </Section>

          <Section icon={Briefcase} title="Top recommended opportunities" action={<button className="sb-btn sb-btn-ghost sb-btn-sm" onClick={() => setActive("opportunities")}>View all</button>}>
            {rankedJobs.slice(0, 3).map((j) => <JobRow key={j.id} job={j} onApply={() => applyToJob(j, user)} applied={myApplications.some((a) => a.job_id === j.id)} />)}
          </Section>
        </>
      )}

      {active === "skills" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 4px" }}>Skill-gap analysis</h1>
          <p style={{ color: "var(--muted)", margin: "0 0 22px", maxWidth: 620 }}>
            This is a transparent, <strong>rule-based</strong> comparison — not an AI model. We compare the skills you've logged against a fixed skill list for your chosen career interest.
          </p>

          <Section icon={Sparkles} title="Your current skills">
            <SkillTagInput value={user.skills} placeholder="Add a skill you have" onAdd={(s) => setField("skills", [...user.skills, s])} onRemove={(s) => setField("skills", user.skills.filter((x) => x !== s))} />
          </Section>

          <Section icon={AlertCircle} title="Areas you've flagged for improvement">
            <SkillTagInput value={user.gaps} tone="gap" placeholder="Add an area to improve" onAdd={(s) => setField("gaps", [...user.gaps, s])} onRemove={(s) => setField("gaps", user.gaps.filter((x) => x !== s))} />
          </Section>

          <Section icon={Target} title="Career interests">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ALL_CAREERS.map((c) => {
                const isActive = user.interests.includes(c);
                return <button key={c} onClick={() => setField("interests", isActive ? user.interests.filter((x) => x !== c) : [...user.interests, c])}
                  className="sb-chip" style={{ background: isActive ? "var(--primary)" : "#fff", color: isActive ? "#fff" : "var(--ink)", borderColor: isActive ? "var(--primary)" : "var(--line)" }}>{c}</button>;
              })}
            </div>
          </Section>

          {primaryCareer ? (
            <Section icon={BarChart3} title={`Target skill path: ${primaryCareer}`}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Overall readiness</span><span>{readiness}%</span>
                </div>
                <div className="sb-progress-track"><div className="sb-progress-fill" style={{ width: `${readiness}%`, background: readiness > 65 ? "var(--primary)" : "var(--accent)" }} /></div>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {target.map((s) => {
                  const got = user.skills.includes(s);
                  return (
                    <div key={s} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                      {got ? <CheckCircle2 size={17} color="var(--primary)" /> : <Clock size={17} color="var(--muted)" />}
                      <span style={{ flex: 1, textDecoration: got ? "none" : "none", color: got ? "var(--ink)" : "var(--muted)" }}>{s}</span>
                      <span className="sb-mock-tag" style={got ? {} : { color: "#93341C", background: "#FCEDE8", borderColor: "#F1CFC2" }}>{got ? "Have it" : "Gap"}</span>
                    </div>
                  );
                })}
              </div>
              {missing.length > 0 && (
                <div style={{ marginTop: 18, padding: 16, background: "#F6F1E2", borderRadius: 9, border: "1px solid #E8D19E" }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Award size={15} /> Suggested next steps</div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, color: "#6B5620" }}>
                    {missing.slice(0, 3).map((s) => <li key={s} style={{ marginBottom: 4 }}>Take a short course or mini-project in <strong>{s}</strong> to close this gap.</li>)}
                  </ul>
                </div>
              )}
            </Section>
          ) : (
            <div className="sb-card" style={{ padding: 22, textAlign: "center", color: "var(--muted)" }}>Add a career interest above to generate your target skill path.</div>
          )}
        </>
      )}

      {active === "portfolio" && <PortfolioBuilder user={user} setField={setField} />}

      {active === "opportunities" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 4px" }}>Recommended internships & jobs</h1>
          <p style={{ color: "var(--muted)", margin: "0 0 22px" }}>Ranked by how well your logged skills match each listing.</p>
          {rankedJobs.map((j) => <JobRow key={j.id} job={j} onApply={() => applyToJob(j, user)} applied={myApplications.some((a) => a.job_id === j.id)} detailed />)}
        </>
      )}

      {active === "applications" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 20px" }}>Application tracking</h1>
          {myApplications.length === 0 && <div className="sb-card" style={{ padding: 30, textAlign: "center", color: "var(--muted)" }}>No applications yet. Head to Opportunities and apply to your first role.</div>}
          <div style={{ display: "grid", gap: 12 }}>
            {myApplications.map((a) => <ApplicationRow key={a.id} app={a} />)}
          </div>
        </>
      )}

      {active === "notifications" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 20px" }}>Notifications</h1>
          <div style={{ display: "grid", gap: 10 }}>
            {notifications.length === 0 && <div className="sb-card" style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>You're all caught up.</div>}
            {notifications.map((n, i) => (
              <div key={i} className="sb-card" style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <Bell size={16} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                <div><div style={{ fontSize: 14, fontWeight: 600 }}>{n.title}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{n.body}</div></div>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

function Stat({ label, value, icon: Icon }) {
  return (
    <div className="sb-card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 12.5, fontWeight: 600, marginBottom: 8 }}><Icon size={14} />{label}</div>
      <div style={{ fontFamily: "Fraunces", fontSize: 24 }}>{value}</div>
    </div>
  );
}

function JobRow({ job, onApply, applied, detailed }) {
  return (
    <div className="sb-card" style={{ padding: 16, marginBottom: 12, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ width: 42, height: 42, borderRadius: 9, background: "#EAEEF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Building2 size={19} color="var(--ink)" />
      </div>
      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5 }}>{job.title}</div>
        <div style={{ fontSize: 13, color: "var(--muted)" }}>{job.company} · {job.location} · {job.stipend}</div>
        {detailed && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {job.skills.map((s) => <span key={s} className="sb-mock-tag" style={job.matched?.includes(s) ? {} : { background: "#F1F1EC", color: "var(--muted)", borderColor: "var(--line)" }}>{s}</span>)}
        </div>}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: job.matchPct >= 60 ? "var(--primary)" : "var(--accent)", marginBottom: 6 }}>{job.matchPct}% skill match</div>
        <button disabled={applied} onClick={onApply} className="sb-btn sb-btn-sm" style={{ background: applied ? "#E4EFEA" : "var(--primary)", color: applied ? "var(--primary-dark)" : "#fff" }}>
          {applied ? <><Check size={14} /> Applied</> : "Apply"}
        </button>
      </div>
    </div>
  );
}

const STATUS_STEPS = ["Applied", "Shortlisted", "Interview", "Offer"];
function ApplicationRow({ app }) {
  const stepIdx = STATUS_STEPS.indexOf(app.status);
  return (
    <div className="sb-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div><div style={{ fontWeight: 700, fontSize: 14.5 }}>{app.job_title}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{app.company}</div></div>
        <span className="sb-mock-tag">{app.status}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        {STATUS_STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: i <= stepIdx ? "var(--primary)" : "#E4E9E0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {i <= stepIdx && <Check size={12} color="#fff" />}
              </div>
              <span style={{ fontSize: 11, marginTop: 4, color: i <= stepIdx ? "var(--ink)" : "var(--muted)" }}>{s}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < stepIdx ? "var(--primary)" : "#E4E9E0", margin: "0 4px 16px" }} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function PortfolioBuilder({ user, setField }) {
  const p = user.portfolio;
  const setP = (k, v) => setField("portfolio", { ...p, [k]: v });
  const [proj, setProj] = useState({ title: "", desc: "" });
  return (
    <>
      <h1 style={{ fontSize: 23, margin: "0 0 4px" }}>Portfolio builder</h1>
      <p style={{ color: "var(--muted)", margin: "0 0 22px" }}>This becomes your shareable profile preview for recruiters.</p>

      <Section icon={User} title="Headline & bio">
        <Field label="Headline" value={p.headline} onChange={(v) => setP("headline", v)} placeholder="e.g. Aspiring Frontend Developer" />
        <div className="sb-field"><label className="sb-label">Short bio</label>
          <textarea className="sb-input" rows={3} value={p.bio} onChange={(e) => setP("bio", e.target.value)} placeholder="Tell recruiters who you are and what you're building toward." />
        </div>
      </Section>

      <Section icon={Link2} title="Links">
        <Row><Field label="GitHub" value={p.links.github} onChange={(v) => setP("links", { ...p.links, github: v })} placeholder="github.com/username" />
        <Field label="LinkedIn" value={p.links.linkedin} onChange={(v) => setP("links", { ...p.links, linkedin: v })} placeholder="linkedin.com/in/username" /></Row>
      </Section>

      <Section icon={FolderKanban} title="Projects">
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          {p.projects.map((pr, i) => (
            <div key={i} className="sb-card" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div><div style={{ fontWeight: 700, fontSize: 14 }}>{pr.title}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{pr.desc}</div></div>
              <button className="sb-btn sb-btn-danger sb-btn-sm" onClick={() => setP("projects", p.projects.filter((_, x) => x !== i))}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
        <Row><Field label="Project title" value={proj.title} onChange={(v) => setProj({ ...proj, title: v })} /><Field label="One-line description" value={proj.desc} onChange={(v) => setProj({ ...proj, desc: v })} /></Row>
        <button className="sb-btn sb-btn-ghost sb-btn-sm" onClick={() => { if (proj.title) { setP("projects", [...p.projects, proj]); setProj({ title: "", desc: "" }); } }}><Plus size={14} /> Add project</button>
      </Section>

      <Section icon={FileText} title="Preview">
        <div style={{ border: "1px dashed var(--line)", borderRadius: 10, padding: 20 }}>
          <div style={{ fontFamily: "Fraunces", fontSize: 20 }}>{user.name || "Your name"}</div>
          <div style={{ color: "var(--primary)", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{p.headline || "Your headline"}</div>
          <div style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 12 }}>{p.bio || "Your bio will appear here."}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>{user.skills.map((s) => <span key={s} className="sb-mock-tag">{s}</span>)}</div>
          {p.projects.map((pr, i) => <div key={i} style={{ fontSize: 13.5, marginBottom: 4 }}>&bull; <strong>{pr.title}</strong> — {pr.desc}</div>)}
        </div>
      </Section>
    </>
  );
}

/* ============================================================
   RECRUITER DASHBOARD
   ============================================================ */
function RecruiterDashboard({ user, jobs, postJob, applications, students, onLogout }) {
  const [active, setActive] = useState("overview");
  const [form, setForm] = useState({ title: "", type: "Internship", location: "", stipend: "", skills: [] });
  const [search, setSearch] = useState("");

  const myJobs = jobs.filter((j) => j.recruiter_id === user.userId);
  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "post", label: "Post opportunity", icon: Plus },
    { key: "find", label: "Find talent", icon: Search },
    { key: "postings", label: "My postings", icon: Briefcase },
  ];

  const allStudents = students.filter((s) => s.role === "student");
  const filtered = allStudents.filter((s) => !search || s.skills.some((sk) => sk.toLowerCase().includes(search.toLowerCase())));

  const post = async (e) => {
    e.preventDefault();
    if (!form.title || form.skills.length === 0) return;
    await postJob({
      title: form.title,
      company: user.company,
      type: form.type,
      location: form.location || "Remote",
      stipend: form.stipend || "Not disclosed",
      skills: form.skills,
    });
    setForm({ title: "", type: "Internship", location: "", stipend: "", skills: [] });
    setActive("postings");
  };

  return (
    <DashboardShell user={user} tabs={tabs} active={active} setActive={setActive} onLogout={onLogout} notifCount={0}>
      {active === "overview" && (
        <>
          <h1 style={{ fontSize: 25, margin: "0 0 4px" }}>Welcome, {user.name || "Recruiter"}.</h1>
          <p style={{ color: "var(--muted)", margin: "0 0 26px" }}>{user.company || "Your company"} · {user.industry || "Industry"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
            <Stat label="Active postings" value={myJobs.length} icon={Briefcase} />
            <Stat label="Applicants received" value={applications.filter((a) => myJobs.some((j) => j.id === a.job_id)).length} icon={Users} />
            <Stat label="Students in talent pool" value={allStudents.length} icon={GraduationCap} />
          </div>
          <Section icon={Plus} title="Post your first opportunity" action={<button className="sb-btn sb-btn-primary sb-btn-sm" onClick={() => setActive("post")}>Post now</button>}>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>Reach every partner college on SkillBridge with one listing.</p>
          </Section>
        </>
      )}

      {active === "post" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 20px" }}>Post an opportunity</h1>
          <form onSubmit={post} className="sb-card" style={{ padding: 22 }}>
            <Row><Field label="Role title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
              <div className="sb-field"><label className="sb-label">Type</label>
                <select className="sb-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Internship</option><option>Full-time</option></select>
              </div></Row>
            <Row><Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="e.g. Bengaluru · Hybrid" />
              <Field label="Stipend / CTC" value={form.stipend} onChange={(v) => setForm({ ...form, stipend: v })} placeholder="e.g. ₹15,000/mo" /></Row>
            <div className="sb-field"><label className="sb-label">Required skills</label>
              <SkillTagInput value={form.skills} placeholder="e.g. React, SQL" onAdd={(s) => setForm({ ...form, skills: [...form.skills, s] })} onRemove={(s) => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })} />
            </div>
            <button type="submit" className="sb-btn sb-btn-primary">Publish listing</button>
          </form>
        </>
      )}

      {active === "find" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 16px" }}>Find talent by skill</h1>
          <div style={{ marginBottom: 18, maxWidth: 340 }}><input className="sb-input" placeholder="Search by skill, e.g. React" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div style={{ display: "grid", gap: 12 }}>
            {filtered.map((s) => (
              <div key={s.id || s.username} className="sb-card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#E4EFEA", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--primary-dark)" }}>{s.name[0]}</div>
                <div style={{ flex: "1 1 220px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>{s.college} · {s.department} · {s.year}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{s.skills.map((sk) => <span key={sk} className="sb-mock-tag">{sk}</span>)}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {active === "postings" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 20px" }}>My postings</h1>
          {myJobs.length === 0 && <div className="sb-card" style={{ padding: 26, textAlign: "center", color: "var(--muted)" }}>No listings yet — post your first opportunity.</div>}
          <div style={{ display: "grid", gap: 12 }}>
            {myJobs.map((j) => {
              const apps = applications.filter((a) => a.job_id === j.id);
              return (
                <div key={j.id} className="sb-card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div><div style={{ fontWeight: 700, fontSize: 14.5 }}>{j.title}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{j.type} · {j.location}</div></div>
                    <span className="sb-mock-tag">{apps.length} applicant{apps.length !== 1 && "s"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

/* ============================================================
   FACULTY DASHBOARD
   ============================================================ */
function FacultyDashboard({ user, students, onLogout }) {
  const [active, setActive] = useState("overview");
  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "roster", label: "Student roster", icon: Users },
    { key: "gaps", label: "Skill gap reports", icon: BarChart3 },
  ];
  const studentProfiles = students.filter((s) => s.role === "student");
  const allGaps = {};
  studentProfiles.forEach((s) => s.gaps.forEach((g) => { allGaps[g] = (allGaps[g] || 0) + 1; }));
  const topGaps = Object.entries(allGaps).sort((a, b) => b[1] - a[1]);

  return (
    <DashboardShell user={user} tabs={tabs} active={active} setActive={setActive} onLogout={onLogout} notifCount={0}>
      {active === "overview" && (
        <>
          <h1 style={{ fontSize: 25, margin: "0 0 4px" }}>Welcome, {user.name || "Faculty"}.</h1>
          <p style={{ color: "var(--muted)", margin: "0 0 26px" }}>{user.college} · {user.department}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
            <Stat label="Students tracked" value={studentProfiles.length} icon={GraduationCap} />
            <Stat label="Distinct skill gaps" value={Object.keys(allGaps).length} icon={AlertCircle} />
            <Stat label="Avg. skills per student" value={(studentProfiles.reduce((a, s) => a + s.skills.length, 0) / (studentProfiles.length || 1)).toFixed(1)} icon={Sparkles} />
          </div>
          <Section icon={BarChart3} title="Most common skill gaps in your department">
            {topGaps.slice(0, 5).map(([g, c]) => (
              <div key={g} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 4 }}><span>{g}</span><span>{c} students</span></div>
                <div className="sb-progress-track"><div className="sb-progress-fill" style={{ width: `${(c / studentProfiles.length) * 100}%`, background: "var(--accent)" }} /></div>
              </div>
            ))}
          </Section>
        </>
      )}
      {active === "roster" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 18px" }}>Student roster</h1>
          <div style={{ display: "grid", gap: 12 }}>
            {studentProfiles.map((s) => (
              <div key={s.id || s.username} className="sb-card" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 8 }}>
                  <div><div style={{ fontWeight: 700, fontSize: 14.5 }}>{s.name}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{s.department} · {s.year}</div></div>
                  <span className="sb-mock-tag">{s.interests?.[0] || "No interest set"}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {s.skills.map((sk) => <span key={sk} className="sb-mock-tag">{sk}</span>)}
                  {s.gaps.map((g) => <span key={g} className="sb-mock-tag" style={{ background: "#FCEDE8", color: "#93341C", borderColor: "#F1CFC2" }}>{g}</span>)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {active === "gaps" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 18px" }}>Skill gap report</h1>
          <div className="sb-card" style={{ padding: 22 }}>
            {topGaps.length === 0 && <p style={{ color: "var(--muted)" }}>No gaps logged yet.</p>}
            {topGaps.map(([g, c]) => (
              <div key={g} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 5 }}><strong>{g}</strong><span>{c} of {studentProfiles.length} students</span></div>
                <div className="sb-progress-track"><div className="sb-progress-fill" style={{ width: `${(c / studentProfiles.length) * 100}%`, background: "var(--danger)" }} /></div>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}

/* ============================================================
   PLACEMENT CELL DASHBOARD
   ============================================================ */
function PlacementDashboard({ user, students, jobs, applications, onLogout }) {
  const [active, setActive] = useState("overview");
  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "tracker", label: "Internship & placement tracker", icon: ClipboardList },
    { key: "reports", label: "Reports", icon: BarChart3 },
  ];
  const studentProfiles = students.filter((s) => s.role === "student");
  const byStatus = {};
  applications.forEach((a) => { byStatus[a.status] = (byStatus[a.status] || 0) + 1; });

  return (
    <DashboardShell user={user} tabs={tabs} active={active} setActive={setActive} onLogout={onLogout} notifCount={0}>
      {active === "overview" && (
        <>
          <h1 style={{ fontSize: 25, margin: "0 0 4px" }}>Welcome, {user.name || "Placement Officer"}.</h1>
          <p style={{ color: "var(--muted)", margin: "0 0 26px" }}>{user.college}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
            <Stat label="Registered students" value={studentProfiles.length} icon={GraduationCap} />
            <Stat label="Live opportunities" value={jobs.length} icon={Briefcase} />
            <Stat label="Total applications" value={applications.length} icon={Send} />
            <Stat label="Offers extended" value={byStatus["Offer"] || 0} icon={Award} />
          </div>
          <Section icon={BarChart3} title="Applications by stage">
            {STATUS_STEPS.map((s) => (
              <div key={s} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 4 }}><span>{s}</span><span>{byStatus[s] || 0}</span></div>
                <div className="sb-progress-track"><div className="sb-progress-fill" style={{ width: `${applications.length ? ((byStatus[s] || 0) / applications.length) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </Section>
        </>
      )}
      {active === "tracker" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 18px" }}>Internship & placement tracker</h1>
          <div style={{ display: "grid", gap: 12 }}>
            {jobs.map((j) => {
              const apps = applications.filter((a) => a.job_id === j.id);
              return (
                <div key={j.id} className="sb-card" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    <div><div style={{ fontWeight: 700, fontSize: 14.5 }}>{j.title}</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{j.company} · {j.type}</div></div>
                    <span className="sb-mock-tag">{apps.length} applicant{apps.length !== 1 && "s"}</span>
                  </div>
                  {apps.map((a) => (
                    <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderTop: "1px solid var(--line)" }}>
                      <span>{a.student_name}</span><span style={{ color: "var(--muted)" }}>{a.status}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
      {active === "reports" && (
        <>
          <h1 style={{ fontSize: 23, margin: "0 0 18px" }}>Placement readiness report</h1>
          <Section icon={GraduationCap} title="Students by career interest">
            {ALL_CAREERS.map((c) => {
              const count = studentProfiles.filter((s) => s.interests?.includes(c)).length;
              if (!count) return null;
              return (
                <div key={c} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 4 }}><span>{c}</span><span>{count}</span></div>
                  <div className="sb-progress-track"><div className="sb-progress-fill" style={{ width: `${(count / studentProfiles.length) * 100}%`, background: "var(--accent)" }} /></div>
                </div>
              );
            })}
          </Section>
        </>
      )}
    </DashboardShell>
  );
}

/* ============================================================
   APP ROOT
   ============================================================ */
export default function App() {
  const [page, setPage] = useState("loading");
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);

  const goto = (p) => { setPage(p); window.scrollTo(0, 0); };

  /* ----- Restore session on mount, listen for auth changes ----- */
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        const { data: profileRow } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (mounted && profileRow) {
          setUser(mapProfileRow(profileRow));
          setPage("dashboard");
        } else if (mounted) {
          setPage("landing");
        }
      } else {
        setPage("landing");
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setPage("landing");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user && !user) {
          (async () => {
            const { data: profileRow } = await supabase
              .from("profiles")
              .select("*")
              .eq("user_id", session.user.id)
              .maybeSingle();
            if (mounted && profileRow) {
              setUser(mapProfileRow(profileRow));
              setPage("dashboard");
            }
          })();
        }
      }
    });

    return () => { mounted = false; listener?.subscription?.unsubscribe(); };
  }, []);

  /* ----- Load jobs, applications, students from DB when logged in ----- */
  const loadDashboardData = useCallback(async (currentUser) => {
    if (!currentUser) return;

    const [jobsRes, studentsRes] = await Promise.all([
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    ]);

    if (jobsRes.data) setJobs(jobsRes.data);
    if (studentsRes.data) setStudents(studentsRes.data.map(mapProfileRow));

    if (currentUser.role === "student") {
      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .eq("student_id", currentUser.userId)
        .order("created_at", { ascending: false });
      if (apps) setApplications(apps);
    } else {
      const { data: allApps } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (allApps) setApplications(allApps);
    }
  }, []);

  useEffect(() => {
    if (user && page === "dashboard") {
      loadDashboardData(user);
    }
  }, [user, page, loadDashboardData]);

  /* ----- Handlers ----- */
  const handleCreate = (profile) => {
    setUser(profile);
    setNotifications([{ title: "Welcome to SkillBridge", body: "Your account was created. Complete your profile to improve visibility to recruiters." }]);
    goto("dashboard");
  };

  const handleLogin = (profile) => {
    setUser(profile);
    setNotifications([{ title: "Welcome back", body: "You are now logged in to SkillBridge." }]);
    goto("dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setJobs([]);
    setApplications([]);
    setStudents([]);
    setNotifications([]);
    goto("landing");
  };

  const applyToJob = async (job, studentUser) => {
    const { data, error } = await supabase.from("applications").insert({
      job_id: job.id,
      student_name: studentUser.name,
      job_title: job.title,
      company: job.company,
      status: "Applied",
    }).select().single();

    if (error) {
      setNotifications((n) => [{ title: "Application failed", body: `Could not apply to ${job.title}: ${error.message}` }, ...n]);
      return;
    }

    setApplications((apps) => [data, ...apps]);
    setNotifications((n) => [{ title: "Application submitted", body: `You applied to ${job.title} at ${job.company}.` }, ...n]);
  };

  const postJob = async (jobData) => {
    const { data, error } = await supabase.from("jobs").insert({
      title: jobData.title,
      company: jobData.company,
      type: jobData.type,
      location: jobData.location,
      stipend: jobData.stipend,
      skills: jobData.skills,
      recruiter_id: user.userId,
    }).select().single();

    if (error) return;
    setJobs((js) => [data, ...js]);
  };

  const updateProfile = async (changes) => {
    if (!user || user.isSeed) return;
    const updateObj = {};
    Object.keys(changes).forEach((k) => {
      if (k === "requiredSkills") updateObj.required_skills = changes[k];
      else if (k === "portfolio") updateObj.portfolio = changes[k];
      else updateObj[k] = changes[k];
    });
    await supabase.from("profiles").update(updateObj).eq("user_id", user.userId);
  };

  /* ----- Render ----- */
  if (page === "loading") {
    return (
      <div className="sb-root" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <style>{CSS}</style>
        <div style={{ textAlign: "center" }}>
          <Logo size={28} />
          <p style={{ color: "var(--muted)", marginTop: 16, fontSize: 15 }}>Loading SkillBridge...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sb-root">
      <style>{CSS}</style>
      {page === "landing" && <LandingPage goto={goto} />}
      {page === "signup" && <SignupFlow goto={goto} onCreate={handleCreate} />}
      {page === "login" && <LoginPage goto={goto} onLogin={handleLogin} />}
      {page === "dashboard" && user?.role === "student" && (
        <StudentDashboard user={user} setUser={setUser} jobs={jobs} applications={applications} applyToJob={applyToJob} updateProfile={updateProfile} notifications={notifications} onLogout={handleLogout} />
      )}
      {page === "dashboard" && user?.role === "recruiter" && (
        <RecruiterDashboard user={user} jobs={jobs} postJob={postJob} applications={applications} students={students} onLogout={handleLogout} />
      )}
      {page === "dashboard" && user?.role === "faculty" && (
        <FacultyDashboard user={user} students={students} onLogout={handleLogout} />
      )}
      {page === "dashboard" && user?.role === "placement" && (
        <PlacementDashboard user={user} students={students} jobs={jobs} applications={applications} onLogout={handleLogout} />
      )}
    </div>
  );
}
