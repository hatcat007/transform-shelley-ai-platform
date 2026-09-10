"use client";

import {
  useState,
  useId,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowUp,
  AudioLines,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Clock3,
  Code2,
  Command,
  Compass,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  FileText,
  Folder,
  Globe2,
  History,
  House,
  Layers3,
  LayoutGrid,
  Link2,
  Loader2,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Square,
  Sun,
  Target,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import {
  agents,
  prompts,
  categories,
  catalog,
  type Asset,
} from "@/lib/catalog";

import { ArtImage, ArtStage, PageArtwork, tiltArt, resetArt } from "./artwork";
import { QuickActions } from "./quick-actions";

type Page =
  | "Overview"
  | "Sessions"
  | "Projects"
  | "Agent & Prompt Station"
  | "My agents"
  | "Prompt library"
  | "Usage & analytics"
  | "Settings";
type Session = {
  id: string;
  title: string;
  agent: string | null;
  mode: string;
  model: string;
  input: string;
  output: string | null;
  status: string;
  remoteId: string | null;
  createdAt: string;
  usage: { input: number; output: number; cached: number } | null;
};
type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
};
type Preferences = { name: string; ponytail: boolean; caveman: boolean };
type Model = {
  id: string;
  display_name?: string;
  source?: string;
  ready: boolean;
};
type ModalState =
  | { type: "asset"; asset: Asset }
  | { type: "editor"; asset?: Asset }
  | { type: "project" }
  | { type: "search" }
  | { type: "help" }
  | { type: "updates" }
  | { type: "share"; url: string }
  | null;
const featured = [agents[0], agents[9], agents[18]];
const navTop: [Page, typeof House][] = [
  ["Overview", House],
  ["Sessions", MessageSquare],
  ["Projects", Folder],
];
const navStation: [Page, typeof House][] = [
  ["Agent & Prompt Station", Layers3],
  ["My agents", Bot],
  ["Prompt library", FileText],
];
const starterBriefs = [
  {
    title: "Find your next growth opportunity",
    subtitle: "A focused go-to-market plan for your business",
    icon: Target,
    agent: agents[36],
    text: "Help me build a focused go-to-market strategy. Start by asking about my product, ideal customer, current traction, and budget.",
  },
  {
    title: "Turn your ideas into content",
    subtitle: "Fresh angles. Clear messaging. Your voice.",
    icon: FileText,
    agent: agents[18],
    text: "Help me create a week of thoughtful, on-brand content. Ask about my audience, channels, brand voice, and what I want to achieve.",
  },
  {
    title: "Make sense of your market",
    subtitle: "Research that leads to a clearer next step",
    icon: Globe2,
    agent: agents[9],
    text: "Help me research my market. Ask about the market, region, decision I need to make, and the source material I can provide.",
  },
];
function Mark({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "brand-mark small" : "brand-mark"}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 4C10 4 4 11 4 20s7 16 16 16c10 0 16-8 16-16S30 4 20 4Z"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        d="M13 7c-3 8 0 13 7 13s10-5 7-13M7 13c8-3 13 0 13 7s-5 10-13 7m6 6c-3-8 0-13 7-13s10 5 7 13m6-6c-8 3-13 0-13-7s5-10 13-7"
        stroke="currentColor"
        strokeWidth="2.4"
      />
    </svg>
  );
}
function CategoryIcon({
  category,
  size = 21,
}: {
  category: string;
  size?: number;
}) {
  const Icon =
    category === "Sales"
      ? Target
      : category === "Research"
        ? Globe2
        : category === "Content"
          ? FileText
          : category === "Marketing"
            ? AudioLines
            : category === "Strategy"
              ? Compass
              : category === "Finance"
                ? BarChart3
                : category === "People & HR"
                  ? Bot
                  : category === "CRM & RevOps"
                    ? Layers3
                    : BriefcaseBusiness;
  return <Icon size={size} strokeWidth={1.7} />;
}
function Modal({
  children,
  title,
  subtitle,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`toggle ${checked ? "on" : ""}`}
      onClick={onChange}
    >
      <span />
    </button>
  );
}
async function api<T = Record<string, unknown>>(
  url: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(
    url,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || data.message || "Something went wrong. Please try again.",
    );
  return data;
}

export default function Station() {
  const [page, setPage] = useState<Page>("Overview");
  const [mode, setMode] = useState<"business" | "coding">("business");
  const [prefs, setPrefs] = useState<Preferences>({
    name: "My workspace",
    ponytail: false,
    caveman: false,
  });
  const [saved, setSaved] = useState<Asset[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState("");
  const [connected, setConnected] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState("");
  const [dark, setDark] = useState(false);
  const [motion, setMotion] = useState(true);
  const [mobile, setMobile] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);
  const [tab, setTab] = useState<"agent" | "prompt" | "saved">("agent");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [visible, setVisible] = useState(18);
  const [composer, setComposer] = useState(false);
  const [brief, setBrief] = useState("");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [running, setRunning] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [runError, setRunError] = useState("");
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [sessionQuery, setSessionQuery] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [sessionFilter, setSessionFilter] = useState("all");
  const notify = useCallback((message: string) => setToast(message), []);
  const reload = useCallback(async () => {
    try {
      const data = await api<{
        assets: Asset[];
        projects: Project[];
        sessions: Session[];
        preferences: Preferences;
      }>("/api/station");
      setSaved(data.assets);
      setProjects(data.projects);
      setSessions(data.sessions);
      setPrefs(data.preferences);
      setReady(true);
      setLoadError("");
    } catch (error) {
      setLoadError((error as Error).message);
    }
  }, []);
  const refreshModels = useCallback(
    async (showToast = false) => {
      try {
        const data = await api<{
          models: Model[];
          connected: boolean;
          message?: string;
        }>("/api/station/models");
        setModels(data.models);
        setConnected(data.connected);
        setModel((prev) =>
          data.models.some((m) => m.id === prev)
            ? prev
            : data.models[0]?.id || "",
        );
        if (showToast)
          notify(
            data.connected
              ? `${data.models.length} available models refreshed.`
              : data.message || "No model server connected.",
          );
      } catch (error) {
        setConnected(false);
        notify((error as Error).message);
      }
    },
    [notify],
  );
  useEffect(() => {
    void reload();
    void refreshModels();
    const animations = localStorage.getItem("shelley-motion") !== "off";
    setMotion(animations);
    document.documentElement.dataset.motion = animations ? "on" : "off";
    const theme = localStorage.getItem("shelley-theme");
    if (theme === "dark") {
      setDark(true);
      document.documentElement.dataset.theme = "dark";
    }
  }, [reload, refreshModels]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModal((m) => (m?.type === "search" ? null : { type: "search" }));
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (!activeSession || activeSession.status !== "running") return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const updated = await api<Session>(
          `/api/station/session/${activeSession.id}`,
        );
        if (stopped) return;
        setActiveSession(updated);
        setSessions((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
        if (updated.status === "running") timer = setTimeout(poll, 2500);
      } catch (error) {
        if (!stopped) setRunError((error as Error).message);
      }
    };
    timer = setTimeout(poll, 500);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [activeSession?.id, activeSession?.status]);
  function navigate(next: Page) {
    setPage(next);
    setMobile(false);
    setComposer(false);
    setActiveSession(null);
    setQuery("");
    setCategory("All categories");
    setVisible(18);
    if (next === "Prompt library") setTab("prompt");
    if (next === "My agents") setTab("saved");
    if (next === "Agent & Prompt Station") setTab("agent");
  }
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("shelley-theme", next ? "dark" : "light");
  }
  function start(asset?: Asset, text = "") {
    setSelected(asset || null);
    if (asset?.category === "Repo optimization") setMode("coding");
    setBrief(text || (asset?.category === "Repo optimization" ? "Repository: \nTarget branch: \nScope: Review the repository and propose focused improvements.\nConstraints: Preserve existing behavior and uncommitted work." : ""));
    setRunError("");
    setActiveSession(null);
    setComposer(true);
    setModal(null);
    setPage("Sessions");
    setMobile(false);
  }
  async function updatePreferences(next: Preferences) {
    if (!ready || savingPrefs) return;
    const old = prefs;
    setPrefs(next);
    setSavingPrefs(true);
    try {
      await api("/api/station", { action: "preferences", ...next });
      notify("Workspace preferences saved.");
    } catch (error) {
      setPrefs(old);
      notify((error as Error).message);
    } finally {
      setSavingPrefs(false);
    }
  }
  async function run(e: FormEvent) {
    e.preventDefault();
    if (brief.trim().length < 5) {
      setRunError("Add a little more context—at least 5 characters.");
      return;
    }
    if (!connected || !model) {
      setRunError(
        "Your brief is ready, but no model is connected. Open Settings to connect your Shelley server. Nothing has been sent.",
      );
      return;
    }
    setRunning(true);
    setRunError("");
    try {
      const session = await api<Session>("/api/station/run", {
        message: brief,
        model,
        mode,
        instructions: selected?.instructions,
        agent: selected?.name,
        ponytail: prefs.ponytail,
        caveman: prefs.caveman,
      });
      setActiveSession(session);
      setComposer(false);
      await reload();
    } catch (error) {
      setRunError((error as Error).message);
    } finally {
      setRunning(false);
    }
  }
  async function cancelRun() {
    if (!activeSession) return;
    try {
      const result = await api<Session>(
        `/api/station/session/${activeSession.id}`,
        { action: "cancel" },
      );
      setActiveSession(result);
      await reload();
      notify("Session stopped.");
    } catch (error) {
      notify((error as Error).message);
    }
  }
  const totalTokens = sessions.reduce(
    (n, s) => n + (s.usage?.input || 0) + (s.usage?.output || 0),
    0,
  );
  const completed = sessions.filter((s) => s.status === "completed").length;
  const allAssets = [...catalog, ...saved];
  const filtered = (
    tab === "saved"
      ? saved.filter((a) => page !== "My agents" || a.kind === "agent")
      : tab === "agent"
        ? agents
        : prompts
  ).filter(
    (a) =>
      (category === "All categories" || a.category === category) &&
      `${a.name} ${a.description} ${a.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const currentTitle = page === "Overview" ? "Workspace overview" : page;
  function Card({ asset }: { asset: Asset }) {
    return (
      <article
        className={`agent-card illustrated-card ${asset.category.toLowerCase().replace(/[^a-z]+/g, "-")}`}
        onPointerMove={tiltArt} onPointerLeave={resetArt}
      >
        <button className="card-art-button" aria-label={`Preview ${asset.name}`} onClick={() => setModal({ type: "asset", asset })}><ArtImage asset={asset} /><span className="art-type"><Sparkles size={11} /> {asset.kind === "agent" ? "YOUR AI SPECIALIST" : "A BETTER STARTING POINT"}</span><span className="art-preview"><ArrowUpRight size={16} /></span></button>
        <div className="agent-card-top">
          <span className="asset-icon">
            <CategoryIcon category={asset.category} />
          </span>
          <span className="category-tag">{asset.category}</span>
          <button
            className="icon-button card-more"
            aria-label={`View ${asset.name} details`}
            onClick={() => setModal({ type: "asset", asset })}
          >
            <MoreHorizontal size={18} />
          </button>
        </div>
        <button
          className="card-title"
          onClick={() => setModal({ type: "asset", asset })}
        >
          {asset.name}
        </button>
        <p>{asset.description}</p>
        <div className="agent-card-bottom">
          <span>
            <span className="tiny-dot" />
            {asset.kind === "agent"
              ? "Business-ready workflow"
              : "Editable prompt"}{" "}
            <span className="version">v{asset.version}</span>
          </span>
          <button
            className="card-use"
            aria-label={`Use ${asset.name}`}
            onClick={() => start(asset)}
          >
            Use {asset.kind}
            <ArrowUpRight size={15} />
          </button>
        </div>
      </article>
    );
  }
  function Skills({ compact = false }: { compact?: boolean }) {
    return (
      <div className={`skills-content ${compact ? "compact" : ""}`}>
        <div className="skill-row">
          <div className="skill-icon pony">⌁</div>
          <div>
            <h4>
              Ponytail <span>Coding</span>
            </h4>
            <p>Less code. More intention.</p>
          </div>
          <Toggle
            checked={prefs.ponytail}
            disabled={!ready || savingPrefs}
            onChange={() =>
              void updatePreferences({ ...prefs, ponytail: !prefs.ponytail })
            }
            label="Enable Ponytail"
          />
        </div>
        <div className="skill-row">
          <div className="skill-icon cave">
            <Zap size={18} />
          </div>
          <div>
            <h4>
              Caveman <span>Writing</span>
            </h4>
            <p>Fewer words. Same meaning.</p>
          </div>
          <Toggle
            checked={prefs.caveman}
            disabled={!ready || savingPrefs}
            onChange={() =>
              void updatePreferences({ ...prefs, caveman: !prefs.caveman })
            }
            label="Enable Caveman"
          />
        </div>
      </div>
    );
  }
  function SessionRows({ limit = 100 }: { limit?: number }) {
    const rows = sessions
      .filter(
        (s) =>
          s.title.toLowerCase().includes(sessionQuery.toLowerCase()) &&
          (sessionFilter === "all" || s.mode === sessionFilter),
      )
      .slice(0, limit);
    return rows.length ? (
      <div className="session-list">
        {rows.map((s) => (
          <button
            className="session-row"
            key={s.id}
            onClick={() => {
              setActiveSession(s);
              setComposer(false);
              setPage("Sessions");
              setRunError("");
            }}
          >
            <span className="session-icon">
              <MessageSquare size={18} />
            </span>
            <span className="session-info">
              <strong>{s.title}</strong>
              <small>
                {s.agent || `${s.mode} session`} ·{" "}
                {new Date(s.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </small>
            </span>
            <span className={`status ${s.status}`}>{s.status}</span>
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
    ) : (
      <div className="session-empty">
        <span className="empty-orbit">
          <MessageSquare size={22} />
        </span>
        <h3>
          {sessionQuery
            ? "No matching sessions"
            : "A little ambition goes a long way."}
        </h3>
        <p>
          {sessionQuery
            ? "Try a different search or mode."
            : "Start a conversation. Your work will find a home here."}
        </p>
        <button className="text-button" onClick={() => start()}>
          Start your first session <ArrowRight size={14} />
        </button>
      </div>
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`sidebar ${mobile ? "open" : ""}`}
        inert={narrow && !mobile}
        aria-hidden={narrow && !mobile ? true : undefined}
      >
        <button
          className="brand"
          onClick={() => navigate("Overview")}
          aria-label="Shelley home"
        >
          <Mark />
          <span>
            shelley<span className="brand-period">.</span>
          </span>
        </button>
        <button
          className="workspace-switch"
          onClick={() => navigate("Settings")}
        >
          <span className="workspace-avatar">W</span>
          <span>
            {prefs.name}
            <small>Personal workspace</small>
          </span>
          <ChevronsUpDown size={14} />
        </button>
        <button
          className="sidebar-search"
          onClick={() => setModal({ type: "search" })}
        >
          <Search size={16} />
          <span>Search anything...</span>
          <kbd>⌘ K</kbd>
        </button>
        <button className="new-session" onClick={() => start()}>
          <Plus size={17} />
          New session<kbd aria-hidden="true">↵</kbd>
        </button>
        <nav aria-label="Main navigation">
          <div className="nav-group">
            {navTop.map(([label, Icon]) => (
              <button
                key={label}
                className={`nav-item ${page === label ? "active" : ""}`}
                onClick={() => navigate(label)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {label === "Sessions" && sessions.length > 0 && (
                  <span className="nav-count">{sessions.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="nav-label">BUILD YOUR ADVANTAGE</div>
          <div className="nav-group">
            {navStation.map(([label, Icon]) => (
              <button
                key={label}
                className={`nav-item ${page === label ? "active" : ""}`}
                onClick={() => navigate(label)}
              >
                <Icon size={18} />
                <span>{label}</span>
                {label === "Agent & Prompt Station" && (
                  <span className="new-tag">NEW</span>
                )}
              </button>
            ))}
          </div>
          <div className="nav-line" />
          <button
            className={`nav-item ${page === "Usage & analytics" ? "active" : ""}`}
            onClick={() => navigate("Usage & analytics")}
          >
            <BarChart3 size={18} />
            <span>Usage & analytics</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="workspace-tip">
            <span className="tip-spark">
              <Sparkles size={18} />
            </span>
            <h4>A little help. A big head start.</h4>
            <p>Your next great idea has a team of agents behind it.</p>
            <button onClick={() => navigate("Agent & Prompt Station")}>
              Meet your agents <ArrowUpRight size={14} />
            </button>
            <div className="tip-decoration" />
          </div>
          <button
            className={`nav-item ${page === "Settings" ? "active" : ""}`}
            onClick={() => navigate("Settings")}
          >
            <Settings2 size={18} />
            <span>Settings</span>
          </button>
          <button
            className="nav-item"
            onClick={() => setModal({ type: "help" })}
          >
            <CircleHelp size={18} />
            <span>Help & resources</span>
            <ArrowUpRight size={14} />
          </button>
          <div className="profile">
            <span className="profile-avatar">YO</span>
            <div>
              <strong>Your workspace</strong>
              <small>Make something matter.</small>
            </div>
            <button
              className="icon-button"
              aria-label="Appearance settings"
              onClick={toggleTheme}
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={21} />
            </button>
            <span className="desktop-crumb">
              <House size={15} />
              <span className="slash">/</span>Workspace
              <span className="slash">/</span>
            </span>
            <strong>{currentTitle}</strong>
          </div>
          <div className="topbar-right">
            <span className="workspace-private">
              <span className="tiny-dot" />
              Personal workspace
            </span>
            <span className="topbar-divider" />
            <button className="motion-button" aria-label={motion ? "Pause animations" : "Enable animations"} aria-pressed={motion} title={motion ? "Pause animations" : "Enable animations"} onClick={() => { const next = !motion; setMotion(next); document.documentElement.dataset.motion = next ? "on" : "off"; localStorage.setItem("shelley-motion", next ? "on" : "off"); }}><span className={motion ? "motion-indicator on" : "motion-indicator"} /><span>Motion {motion ? "on" : "off"}</span></button>
            <button
              className="icon-button"
              aria-label="What’s new"
              onClick={() => setModal({ type: "updates" })}
            >
              <Bell size={18} />
              <i className="notification-dot" />
            </button>
            <button
              className="top-avatar"
              aria-label="Workspace settings"
              onClick={() => navigate("Settings")}
            >
              YO
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {loadError && (
            <div className="error-banner" role="alert">
              {loadError}
              <button onClick={() => void reload()}>Retry</button>
            </div>
          )}
          {page === "Overview" && (
            <div className="view-enter">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    <span className="sunrise">✳</span> A FRESH START, EVERY DAY
                  </div>
                  <h1>
                    Good things start here
                    <span className="heading-period">.</span>
                  </h1>
                  <p>
                    Your ideas, a little AI, and a whole lot of possibility.
                  </p>
                </div>
                <div className="mode-switch" aria-label="Workspace mode">
                  <button
                    className={mode === "business" ? "selected" : ""}
                    onClick={() => setMode("business")}
                  >
                    <BriefcaseBusiness size={15} />
                    Business
                  </button>
                  <button
                    className={mode === "coding" ? "selected" : ""}
                    onClick={() => setMode("coding")}
                  >
                    <Code2 size={16} />
                    Coding
                  </button>
                </div>
              </div>
              <section
                className={`hero ${mode === "coding" ? "coding-hero" : ""}`}
              >
                <div className="hero-copy">
                  <span className="hero-label">
                    <span className="tiny-dot" />
                    {mode === "business"
                      ? "INTRODUCING BUSINESS MODE"
                      : "BUILT FOR YOUR NEXT BUILD"}
                  </span>
                  <h2>
                    {mode === "business" ? (
                      <>
                        Big ambition.
                        <br />
                        Meet your unfair advantage.
                      </>
                    ) : (
                      <>
                        Less friction.
                        <br />
                        More shipped ideas.
                      </>
                    )}
                  </h2>
                  <p>
                    {mode === "business" ? (
                      <>
                        From the first outreach to your next big launch.
                        <br />
                        Meet the AI team that moves your business forward.
                      </>
                    ) : (
                      <>
                        From the first commit to the final polish.
                        <br />
                        Your coding partner, with the full Shelley harness.
                      </>
                    )}
                  </p>
                  <div className="hero-actions">
                    <button className="primary-button" onClick={() => start()}>
                      {mode === "business"
                        ? "Let’s get to work"
                        : "Start building"}
                      <ArrowRight size={16} />
                    </button>
                    <button
                      className="hero-secondary"
                      onClick={() => navigate("Agent & Prompt Station")}
                    >
                      Explore the station
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                </div>
                <ArtStage className="hero-scene">
                  <img className="hero-scene-image" src="/images/art/growth-studio.webp" alt="Sage-green clover sculpture and a growing plant on ivory platforms" width={1100} height={733} fetchPriority="high" />
                  <span className="scene-tag tag-one"><Sparkles size={13} /> A little AI. A lot of possibility.</span>
                  <span className="scene-tag tag-two"><span className="tiny-dot" /> Built around you</span>
                  <span className="scene-cross cross-one">+</span><span className="scene-cross cross-two">+</span>
                </ArtStage>
              </section>
              <section className="stats-grid" aria-label="Workspace statistics">
                <div className="stat">
                  <div className="stat-label">
                    Ready-to-go agents
                    <Bot size={16} />
                  </div>
                  <div className="stat-bottom">
                    <strong>
                      {agents.length}
                      <span>+</span>
                    </strong>
                    <span className="stat-context green">
                      Your next dream team
                    </span>
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-label">
                    Curated prompts
                    <FileText size={16} />
                  </div>
                  <div className="stat-bottom">
                    <strong>
                      {prompts.length}
                      <span>+</span>
                    </strong>
                    <span className="stat-context">Skip the blank page</span>
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-label">
                    Sessions completed
                    <CheckCheck size={16} />
                  </div>
                  <div className="stat-bottom">
                    <strong>{completed.toString().padStart(2, "0")}</strong>
                    <span className="stat-context">
                      {completed
                        ? "Ideas put into motion"
                        : "Your next chapter awaits"}
                    </span>
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-label">
                    Tokens used
                    <Zap size={16} />
                  </div>
                  <div className="stat-bottom">
                    <strong>
                      {totalTokens
                        ? Intl.NumberFormat("en", {
                            notation: "compact",
                          }).format(totalTokens)
                        : "0"}
                    </strong>
                    <span className="stat-context token-tag">
                      <span className="tiny-dot" />
                      {totalTokens ? "Measured usage" : "A clean slate"}
                    </span>
                  </div>
                </div>
              </section>
              <QuickActions onSelect={(asset) => setModal({ type: "asset", asset })} onViewAll={() => { navigate("Prompt library"); setCategory("Repo optimization"); }} />
              <section className="featured-section">
                <div className="section-heading">
                  <div>
                    <h2>A few good agents. Endless possibilities.</h2>
                    <p>
                      Specialists for the things on your to-do list—and the
                      ideas beyond it.
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate("Agent & Prompt Station")}
                  >
                    Explore all agents <ArrowRight size={15} />
                  </button>
                </div>
                <div className="agent-grid">
                  {featured.map((a) => (
                    <Card key={a.id} asset={a} />
                  ))}
                </div>
              </section>
              <div className="home-bottom">
                <section className="recent-panel">
                  <div className="section-heading">
                    <h2>
                      Recent sessions{" "}
                      <span className="count-badge">{sessions.length}</span>
                    </h2>
                    <button
                      className="text-button muted"
                      onClick={() => navigate("Sessions")}
                    >
                      View all <ArrowRight size={14} />
                    </button>
                  </div>
                  <div className="panel session-panel">
                    <SessionRows limit={3} />
                  </div>
                </section>
                <section className="skill-panel">
                  <div className="section-heading">
                    <h2>Small skills. Big difference.</h2>
                    <span className="subtle-label">POWER-UPS</span>
                  </div>
                  <div className="panel">
                    <Skills compact />
                    <button
                      className="skills-footer"
                      onClick={() => navigate("Settings")}
                    >
                      <ShieldCheck size={14} />
                      You’re in control. Toggle anytime.
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </section>
              </div>
              <footer className="page-footer">
                <Mark small />
                <span>A little less busywork. A lot more possibility.</span>
                <span className="footer-right">Built to work with you.</span>
              </footer>
            </div>
          )}
          {(page === "Agent & Prompt Station" ||
            page === "My agents" ||
            page === "Prompt library") && (
            <div className="view-enter">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">YOUR IDEAS, SUPERCHARGED</div>
                  <h1>
                    {page === "My agents"
                      ? "Your very own dream team."
                      : page === "Prompt library"
                        ? "A better place to start."
                        : "Good help. Great possibilities."}
                  </h1>
                  <p>
                    {page === "My agents"
                      ? "The agents you’ve created and made your own."
                      : page === "Prompt library"
                        ? "Thoughtfully structured prompts. Ready for your context."
                        : "Find your specialist, craft a prompt, or build something entirely your own."}
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setModal({ type: "editor" })}
                >
                  <Plus size={16} />
                  Create {page === "Prompt library" ? "prompt" : "agent"}
                </button>
              </div>
              <PageArtwork page={page} />
              {page === "Prompt library" && !query && category === "All categories" && <QuickActions full onSelect={(asset) => setModal({ type: "asset", asset })} onViewAll={() => setCategory("Repo optimization")} />}
              <div className="library-toolbar">
                <div className="tabs" role="tablist" aria-label="Library type">
                  {(page === "My agents"
                    ? (["saved"] as const)
                    : page === "Prompt library"
                      ? (["prompt", "saved"] as const)
                      : (["agent", "prompt", "saved"] as const)
                  ).map((t) => (
                    <button
                      role="tab"
                      aria-selected={tab === t}
                      className={tab === t ? "active" : ""}
                      key={t}
                      onClick={() => {
                        setTab(t);
                        setVisible(18);
                      }}
                    >
                      {t === "agent"
                        ? "Discover agents"
                        : t === "prompt"
                          ? "Prompt library"
                          : "Saved by you"}
                      <span>
                        {t === "agent"
                          ? agents.length
                          : t === "prompt"
                            ? prompts.length
                            : saved.length}
                      </span>
                    </button>
                  ))}
                </div>
                <span className="library-count">Made for the way you work</span>
              </div>
              <div className="filter-bar">
                <label className="input-search">
                  <Search size={17} />
                  <input
                    aria-label="Search the library"
                    placeholder="Search by name, task, or possibility..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setVisible(18);
                    }}
                  />
                  {query && (
                    <button
                      className="icon-button"
                      aria-label="Clear search"
                      onClick={() => setQuery("")}
                    >
                      <X size={15} />
                    </button>
                  )}
                </label>
                <label className="select-wrap">
                  <SlidersHorizontal size={15} />
                  <select
                    aria-label="Filter category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      setVisible(18);
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="results-heading">
                <span>
                  {filtered.length} {tab === "prompt" ? "prompts" : "workflows"}{" "}
                  to make your own
                </span>
                <span>
                  <ShieldCheck size={13} />
                  Human in the loop. Always.
                </span>
              </div>
              <div className="agent-grid library-grid">
                {filtered.slice(0, visible).map((a) => (
                  <Card key={a.id} asset={a} />
                ))}
              </div>
              {!filtered.length && (
                <div className="empty-state">
                  <img className="empty-art" src="/images/art/workspace-0.webp" alt="Your future team of AI specialists" width={220} height={165} />
                  <h2>
                    {tab === "saved"
                      ? "Make this space your own."
                      : "No matches just yet."}
                  </h2>
                  <p>
                    {tab === "saved"
                      ? "Customize a catalog agent or build your own from scratch."
                      : "Try a broader search or a different category."}
                  </p>
                  <button
                    className="primary-button"
                    onClick={() =>
                      tab === "saved"
                        ? setModal({ type: "editor" })
                        : (setQuery(""), setCategory("All categories"))
                    }
                  >
                    {tab === "saved"
                      ? "Create your first agent"
                      : "Reset filters"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {filtered.length > visible && (
                <div className="load-more">
                  <button
                    className="secondary-button"
                    onClick={() => setVisible((v) => v + 18)}
                  >
                    Discover more <ChevronDown size={16} />
                  </button>
                  <span>
                    Showing {Math.min(visible, filtered.length)} of{" "}
                    {filtered.length}
                  </span>
                </div>
              )}
            </div>
          )}
          {page === "Sessions" && (
            <div className="view-enter">
              {composer ? (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">MAKE YOUR NEXT MOVE</div>
                      <h1>What are we working on?</h1>
                      <p>Bring the ambition. We’ll help with the next step.</p>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setComposer(false);
                        setRunError("");
                      }}
                    >
                      All sessions
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <PageArtwork page={page} />
                  <div className="composer-layout">
                    <form className="composer-panel panel" onSubmit={run}>
                      <div className="composer-agent">
                        <span className="asset-icon">
                          <CategoryIcon
                            category={selected?.category || "Strategy"}
                          />
                        </span>
                        <div>
                          <h3>{selected?.name || "Your Shelley partner"}</h3>
                          <span>
                            {selected?.category ||
                              "A fresh perspective, for any task"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setModal({ type: "search" })}
                        >
                          Change
                          <ChevronsUpDown size={14} />
                        </button>
                      </div>
                      <label className="field-label" htmlFor="brief">
                        YOUR BRIEF
                      </label>
                      <textarea
                        id="brief"
                        className="brief-input"
                        autoFocus
                        placeholder="I have an idea... Tell Shelley what you’re working on, who it’s for, and what a great result looks like."
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                        maxLength={16000}
                      />
                      <div className="composer-tips">
                        <ShieldCheck size={14} />
                        Your instructions stay yours. External actions need your
                        approval.
                      </div>
                      {runError && (
                        <div className="error-banner" role="alert">
                          {runError}
                          {!connected && (
                            <button
                              type="button"
                              onClick={() => {
                                setComposer(false);
                                setPage("Settings");
                              }}
                            >
                              Open Settings
                              <ArrowUpRight size={14} />
                            </button>
                          )}
                        </div>
                      )}
                      <div className="composer-controls">
                        <select
                          aria-label="Select model"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        >
                          {!models.length && (
                            <option value="">Connect a model</option>
                          )}
                          {models.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.display_name || m.id}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Session mode"
                          value={mode}
                          onChange={(e) =>
                            setMode(e.target.value as "business" | "coding")
                          }
                        >
                          <option value="business">Business Mode</option>
                          <option value="coding">Coding Mode</option>
                        </select>
                        <button
                          className="primary-button"
                          disabled={running || !ready}
                          type="submit"
                        >
                          {running ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <ArrowUp size={16} />
                          )}{" "}
                          {running ? "Starting…" : "Let’s get to work"}
                        </button>
                      </div>
                    </form>
                    <aside className="composer-aside">
                      <h3>A better brief, a better result.</h3>
                      <p>Give your agent a little direction.</p>
                      <ul>
                        <li>
                          <Target size={17} />
                          <div>
                            <strong>Start with the outcome</strong>
                            <span>What would a great result look like?</span>
                          </div>
                        </li>
                        <li>
                          <BookOpen size={17} />
                          <div>
                            <strong>Share the useful context</strong>
                            <span>
                              Your audience, evidence, and constraints.
                            </span>
                          </div>
                        </li>
                        <li>
                          <SlidersHorizontal size={17} />
                          <div>
                            <strong>Make it your own</strong>
                            <span>
                              Set the tone, format, and level of detail.
                            </span>
                          </div>
                        </li>
                      </ul>
                      <div className="aside-skills">
                        <h4>Your power-ups</h4>
                        <Skills compact />
                        <small>Ponytail applies to Coding Mode only.</small>
                      </div>
                    </aside>
                  </div>
                  {selected && (
                    <details className="instructions-preview">
                      <summary>
                        View {selected.name} instructions
                        <ChevronDown size={15} />
                      </summary>
                      <pre>{selected.instructions}</pre>
                    </details>
                  )}
                </>
              ) : activeSession ? (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        {activeSession.mode.toUpperCase()} SESSION
                      </div>
                      <h1 className="session-title">{activeSession.title}</h1>
                      <p>
                        {activeSession.agent || "Shelley"} ·{" "}
                        {activeSession.model}
                      </p>
                    </div>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setActiveSession(null);
                        setRunError("");
                      }}
                    >
                      All sessions
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="conversation">
                    <div className="message user-message">
                      <span className="profile-avatar">YO</span>
                      <div>
                        <h4>You</h4>
                        <p>{activeSession.input}</p>
                      </div>
                    </div>
                    <div className="message agent-message">
                      <Mark small />
                      <div>
                        <h4>
                          Shelley{" "}
                          <span className={`status ${activeSession.status}`}>
                            {activeSession.status}
                          </span>
                        </h4>
                        {activeSession.output ? (
                          <p className="model-output">{activeSession.output}</p>
                        ) : (
                          <p>
                            {activeSession.status === "running"
                              ? "Your agent is working on it. Results appear here as Shelley reports them."
                              : activeSession.status === "failed"
                                ? "This run did not complete. Check your model connection and start a new session."
                                : "No text output was returned."}
                          </p>
                        )}
                        {activeSession.status === "running" && (
                          <span className="working-dots">
                            <i />
                            <i />
                            <i />
                          </span>
                        )}
                      </div>
                    </div>
                    {runError && (
                      <div className="error-banner" role="alert">
                        {runError}
                        <button
                          onClick={async () => {
                            try {
                              const s = await api<Session>(
                                `/api/station/session/${activeSession.id}`,
                              );
                              setActiveSession(s);
                              setRunError("");
                            } catch (error) {
                              notify((error as Error).message);
                            }
                          }}
                        >
                          Refresh
                        </button>
                      </div>
                    )}
                    {activeSession.status !== "running" && (
                      <form
                        className="follow-up-form"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          setRunning(true);
                          setRunError("");
                          try {
                            const updated = await api<Session>(
                              `/api/station/session/${activeSession.id}`,
                              { action: "chat", message: followUp },
                            );
                            setActiveSession(updated);
                            setFollowUp("");
                            await reload();
                          } catch (error) {
                            setRunError((error as Error).message);
                          } finally {
                            setRunning(false);
                          }
                        }}
                      >
                        <label htmlFor="follow-up" className="field-label">
                          KEEP THE CONVERSATION GOING
                        </label>
                        <textarea
                          id="follow-up"
                          value={followUp}
                          onChange={(e) => setFollowUp(e.target.value)}
                          required
                          minLength={5}
                          maxLength={16000}
                          placeholder="Refine the direction, add context, or ask what comes next."
                        />
                        <button
                          type="submit"
                          className="primary-button"
                          disabled={running}
                        >
                          {running ? (
                            <Loader2 size={14} className="spin" />
                          ) : (
                            <ArrowUp size={14} />
                          )}
                          Send follow-up
                        </button>
                      </form>
                    )}
                    <div className="conversation-footer">
                      <span>
                        {activeSession.usage
                          ? `${activeSession.usage.input.toLocaleString()} input · ${activeSession.usage.output.toLocaleString()} output tokens`
                          : "Usage appears when reported by your model."}
                      </span>
                      {activeSession.output &&
                        activeSession.status !== "running" && (
                          <button
                            className="secondary-button"
                            onClick={() =>
                              setModal({
                                type: "editor",
                                asset: {
                                  id: "generated-draft",
                                  name: "My new workflow",
                                  description:
                                    "A workflow created with Shelley. Review and refine before saving.",
                                  category: "Strategy",
                                  kind: "agent",
                                  version: 1,
                                  instructions: activeSession.output || "",
                                },
                              })
                            }
                          >
                            <Plus size={14} />
                            Save as workflow
                          </button>
                        )}
                      {activeSession.status === "running" ? (
                        <button
                          className="secondary-button"
                          onClick={() => void cancelRun()}
                        >
                          <Square size={13} />
                          Stop session
                        </button>
                      ) : (
                        <button
                          className="secondary-button"
                          onClick={() => {
                            setMode(
                              activeSession.mode === "coding"
                                ? "coding"
                                : "business",
                            );
                            start(
                              allAssets.find(
                                (a) => a.name === activeSession.agent,
                              ),
                              activeSession.input,
                            );
                          }}
                        >
                          Run again
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">A SPACE FOR YOUR MOMENTUM</div>
                      <h1>Your work, in good company.</h1>
                      <p>
                        Every conversation. Every next step. Right where you
                        left it.
                      </p>
                    </div>
                    <button className="primary-button" onClick={() => start()}>
                      <Plus size={16} />
                      New session
                    </button>
                  </div>
                  <div className="filter-bar">
                    <label className="input-search">
                      <Search size={17} />
                      <input
                        aria-label="Search sessions"
                        placeholder="Find a session..."
                        value={sessionQuery}
                        onChange={(e) => setSessionQuery(e.target.value)}
                      />
                    </label>
                    <select
                      className="secondary-button"
                      aria-label="Filter sessions by mode"
                      value={sessionFilter}
                      onChange={(e) => setSessionFilter(e.target.value)}
                    >
                      <option value="all">All modes</option>
                      <option value="business">Business</option>
                      <option value="coding">Coding</option>
                    </select>
                  </div>
                  <div className="panel">
                    <PageArtwork page="Sessions" />
                      <SessionRows />
                  </div>
                  {!sessions.length && (
                    <section className="starter-section">
                      <h2>A little inspiration to get going.</h2>
                      <div className="starter-grid">
                        {starterBriefs.map((b) => (
                          <button
                            className="starter-card"
                            key={b.title}
                            onClick={() => start(b.agent, b.text)}
                          >
                            <b.icon size={23} />
                            <h3>{b.title}</h3>
                            <p>{b.subtitle}</p>
                            <span>
                              Try this brief
                              <ArrowUpRight size={15} />
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          )}
          {page === "Projects" && (
            <div className="view-enter">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">ROOM FOR THE BIGGER PICTURE</div>
                  <h1>Give your ideas a home.</h1>
                  <p>
                    Keep your goals and project briefs together, from what-if to
                    what’s-next.
                  </p>
                </div>
                <button
                  className="primary-button"
                  onClick={() => setModal({ type: "project" })}
                >
                  <Plus size={16} />
                  New project
                </button>
              </div>
              <PageArtwork page={page} />
              {projects.length ? (
                <div className="project-grid">
                  {projects.map((project) => (
                    <article className="project-card panel" key={project.id}>
                      <span className="asset-icon">
                        <Folder size={22} />
                      </span>
                      <h2>{project.name}</h2>
                      <p>
                        {project.description || "Ready for your next idea."}
                      </p>
                      <span>
                        Created{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        className="text-button"
                        onClick={() =>
                          start(
                            undefined,
                            `Project: ${project.name}\nContext: ${project.description}\nHelp me identify the most useful next step.`,
                          )
                        }
                      >
                        Work on this project
                        <ArrowUpRight size={15} />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state panel">
                  <img className="empty-art" src="/images/art/workspace-1.webp" alt="Stacked folders with a growing plant" width={220} height={165} />
                  <h2>Big ideas deserve a little space.</h2>
                  <p>
                    Create a project, give it a goal, and take it one thoughtful
                    step at a time.
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => setModal({ type: "project" })}
                  >
                    <Plus size={16} />
                    Create your first project
                  </button>
                </div>
              )}
            </div>
          )}
          {page === "Usage & analytics" && (
            <div className="view-enter">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">CLARITY, NOT GUESSWORK</div>
                  <h1>Make every token count.</h1>
                  <p>
                    Real usage, reported by your models. No estimated savings
                    dressed up as facts.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => {
                    const rows = [
                      "session,mode,model,status,input_tokens,output_tokens,cached_tokens",
                      ...sessions.map((s) =>
                        [
                          s.id,
                          s.mode,
                          s.model,
                          s.status,
                          s.usage?.input ?? "",
                          s.usage?.output ?? "",
                          s.usage?.cached ?? "",
                        ]
                          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
                          .join(","),
                      ),
                    ];
                    const url = URL.createObjectURL(
                      new Blob([rows.join("\n")], { type: "text/csv" }),
                    );
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "shelley-usage.csv";
                    a.click();
                    URL.revokeObjectURL(url);
                    notify("Usage report exported.");
                  }}
                >
                  <Download size={16} />
                  Export usage
                </button>
              </div>
              <PageArtwork page={page} />
              <div className="analytics-stats">
                {[
                  ["Total sessions", sessions.length],
                  ["Completed", completed],
                  ["Tokens used", totalTokens.toLocaleString()],
                  [
                    "Cached input tokens",
                    sessions
                      .reduce((n, s) => n + (s.usage?.cached || 0), 0)
                      .toLocaleString(),
                  ],
                ].map(([label, value]) => (
                  <div className="panel analytics-stat" key={label}>
                    <p>{label}</p>
                    <strong>{value}</strong>
                    <span>In your latest 100 sessions</span>
                  </div>
                ))}
              </div>
              <div className="panel analytics-chart">
                <div className="section-heading">
                  <h2>Business & Coding, side by side</h2>
                  <span className="subtle-label">REPORTED TOKENS</span>
                </div>
                {["business", "coding"].map((m) => {
                  const amount = sessions
                    .filter((s) => s.mode === m)
                    .reduce(
                      (n, s) =>
                        n + (s.usage?.input || 0) + (s.usage?.output || 0),
                      0,
                    );
                  return (
                    <div className="usage-bar" key={m}>
                      <div>
                        <strong>
                          {m === "business" ? "Business Mode" : "Coding Mode"}
                        </strong>
                        <span>{amount.toLocaleString()} tokens</span>
                      </div>
                      <div className="bar-track">
                        <div
                          style={{
                            width: totalTokens
                              ? `${(amount / totalTokens) * 100}%`
                              : "0%",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <p className="analytics-note">
                  <ShieldCheck size={16} />
                  Token reduction and quality improvements require matched,
                  live-model evaluations. No baseline comparison has been
                  recorded yet.
                </p>
              </div>
              <section className="panel measurement-note">
                <Sparkles size={24} />
                <div>
                  <h3>Less unnecessary context. More room for the work.</h3>
                  <p>
                    Only your selected workflow and enabled skills are added to
                    each brief. Ponytail runs only in Coding Mode; Caveman
                    preserves normal prose in customer-facing content.
                  </p>
                </div>
              </section>
            </div>
          )}
          {page === "Settings" && (
            <div className="view-enter">
              <div className="page-heading">
                <div>
                  <div className="eyebrow">MAKE YOURSELF AT HOME</div>
                  <h1>Your workspace. Your way.</h1>
                  <p>The little settings that make Shelley feel like yours.</p>
                </div>
              </div>
              <PageArtwork page={page} />
              <div className="settings-layout">
                <section className="settings-card panel">
                  <div className="settings-heading">
                    <h2>Workspace</h2>
                    <p>A familiar name for your next big thing.</p>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = new FormData(e.currentTarget).get(
                        "name",
                      ) as string;
                      void updatePreferences({ ...prefs, name });
                    }}
                  >
                    <label className="field-label" htmlFor="workspace-name">
                      WORKSPACE NAME
                    </label>
                    <div className="inline-form">
                      <input
                        id="workspace-name"
                        name="name"
                        key={prefs.name}
                        defaultValue={prefs.name}
                        minLength={2}
                        maxLength={80}
                        required
                      />
                      <button
                        className="secondary-button"
                        disabled={!ready || savingPrefs}
                      >
                        Save changes
                      </button>
                    </div>
                  </form>
                  <p className="setting-footnote">
                    <ShieldCheck size={13} />
                    This personal sandbox is tied to this browser. It is not a
                    multi-user authentication system.
                  </p>
                </section>
                <section className="settings-card panel">
                  <div className="settings-heading">
                    <h2>
                      Models & connection{" "}
                      <span
                        className={`connection-badge ${connected ? "connected" : ""}`}
                      >
                        <span className="tiny-dot" />
                        {connected ? "Connected" : "Not connected"}
                      </span>
                    </h2>
                    <p>Use any ready model available on your Shelley server.</p>
                  </div>
                  {models.length > 0 ? (
                    <div className="model-list">
                      {models.map((m) => (
                        <div key={m.id}>
                          <span className="asset-icon">
                            <Sparkles size={18} />
                          </span>
                          <div>
                            <strong>{m.display_name || m.id}</strong>
                            <small>{m.source || m.id}</small>
                          </div>
                          <span className="status completed">Ready</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="connection-instructions">
                      <Link2 size={24} />
                      <div>
                        <h3>Bring your models along.</h3>
                        <p>
                          Set <code>SHELLEY_API_URL</code> in the server
                          environment to your running Shelley instance.
                          Optionally set <code>SHELLEY_API_TOKEN</code> if your
                          gateway requires a bearer token. Configure model
                          credentials in Shelley—not in this browser.
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    className="secondary-button"
                    onClick={() => void refreshModels(true)}
                  >
                    <History size={15} />
                    Refresh models
                  </button>
                </section>
                <section className="settings-card panel">
                  <div className="settings-heading">
                    <h2>Skills & power-ups</h2>
                    <p>
                      Thoughtful additions, on your terms. Your choices are
                      saved automatically.
                    </p>
                  </div>
                  <Skills />
                  <div className="skill-sources">
                    <a
                      href="https://github.com/DietrichGebert/ponytail"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ponytail source
                      <ExternalLink size={12} />
                    </a>
                    <a
                      href="https://github.com/JuliusBrussee/caveman"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Caveman source
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <p className="setting-footnote">
                    Ponytail only applies to Coding Mode. Skills are vendored
                    instructions, not executable plugins. Caveman does not
                    compress customer-facing deliverables.
                  </p>
                </section>
                <section className="settings-card panel">
                  <div className="appearance-setting">
                    <div>
                      <h2>Appearance</h2>
                      <p>A lighter outlook, or a little less light.</p>
                    </div>
                    <div className="mode-switch">
                      <button
                        className={!dark ? "selected" : ""}
                        onClick={() => {
                          if (dark) toggleTheme();
                        }}
                      >
                        <Sun size={15} />
                        Light
                      </button>
                      <button
                        className={dark ? "selected" : ""}
                        onClick={() => {
                          if (!dark) toggleTheme();
                        }}
                      >
                        <Moon size={15} />
                        Dark
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>
      {modal?.type === "search" && (
        <SearchModal
          assets={allAssets}
          onClose={() => setModal(null)}
          onSelect={(a) => setModal({ type: "asset", asset: a })}
          onPage={(p) => {
            navigate(p);
            setModal(null);
          }}
        />
      )}
      {modal?.type === "asset" && (
        <AssetModal
          asset={modal.asset}
          saved={saved.some((a) => a.id === modal.asset.id)}
          onClose={() => setModal(null)}
          onUse={() => start(modal.asset)}
          onEdit={() => setModal({ type: "editor", asset: modal.asset })}
          onShare={async () => {
            try {
              const asset = modal.asset;
              let id = asset.id;
              if (!saved.some((a) => a.id === id)) {
                const copy = await api<Asset>("/api/station", {
                  action: "saveAsset",
                  name: asset.name,
                  description: asset.description,
                  kind: asset.kind,
                  category: asset.category,
                  instructions: asset.instructions,
                });
                id = copy.id;
                await reload();
              }
              const result = await api<{ token: string }>("/api/station", {
                action: "share",
                id,
                enabled: true,
              });
              setModal({
                type: "share",
                url: `${location.origin}/share/${result.token}`,
              });
            } catch (error) {
              notify((error as Error).message);
            }
          }}
        />
      )}
      {modal?.type === "editor" && (
        <EditorModal
          asset={modal.asset}
          kind={page === "Prompt library" ? "prompt" : "agent"}
          isSaved={!!modal.asset && saved.some((a) => a.id === modal.asset?.id)}
          onClose={() => setModal(null)}
          onSave={async (data) => {
            const asset = await api<Asset>("/api/station", data);
            await reload();
            notify(`${asset.name} saved as version ${asset.version}.`);
            setModal({ type: "asset", asset });
          }}
          onGenerate={(instructions) => {
            setModal(null);
            start(
              {
                id: "creator",
                name: "Agent & Prompt Designer",
                category: "Strategy",
                description: "Create a reusable workflow",
                kind: "agent",
                version: 1,
                instructions:
                  "Create a production-quality agent specification from the user requirements. Return name, description, category, required inputs, concise reusable instructions, task-specific output format, factuality and approval boundaries, and three evaluation scenarios. Do not claim the resulting agent has been tested.",
              },
              instructions,
            );
          }}
        />
      )}
      {modal?.type === "project" && (
        <ProjectModal
          onClose={() => setModal(null)}
          onSave={async (name, description) => {
            await api("/api/station", { action: "project", name, description });
            await reload();
            setModal(null);
            navigate("Projects");
            notify("A new home for your idea. Project created.");
          }}
        />
      )}
      {modal?.type === "share" && (
        <Modal
          title="Good ideas are worth sharing."
          subtitle="Anyone with this link can read the saved instructions. No session data is shared."
          onClose={() => setModal(null)}
        >
          <div className="modal-body">
            <label className="field-label">PUBLIC READ-ONLY LINK</label>
            <div className="share-link">
              <input readOnly value={modal.url} aria-label="Share link" />
              <button
                className="secondary-button"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(modal.url)
                    .then(() => notify("Share link copied."))
                    .catch(() => notify("Copy the link from the field."));
                }}
              >
                <Copy size={16} />
                Copy
              </button>
            </div>
            <a
              className="text-button"
              href={modal.url}
              target="_blank"
              rel="noreferrer"
            >
              Open shared workflow
              <ArrowUpRight size={14} />
            </a>
            <p className="setting-footnote">
              This link shows the latest saved version. Generating a new link
              replaces the previous link.
            </p>
          </div>
        </Modal>
      )}
      {modal?.type === "help" && (
        <Modal
          title="A little guidance goes a long way."
          subtitle="Welcome to your Shelley workspace."
          onClose={() => setModal(null)}
        >
          <div className="modal-body help-content">
            <div>
              <span>01</span>
              <section>
                <h3>Find your specialist</h3>
                <p>
                  Browse 108 agents and 108 prompts in the Station. Add your own
                  context, or customize the instructions and save a new version.
                </p>
              </section>
            </div>
            <div>
              <span>02</span>
              <section>
                <h3>Connect your models</h3>
                <p>
                  Point SHELLEY_API_URL to your Shelley server. Ready models
                  will appear in the session composer.
                </p>
              </section>
            </div>
            <div>
              <span>03</span>
              <section>
                <h3>Make the next move</h3>
                <p>
                  Run a brief in Business or Coding Mode. Check actual usage in
                  Analytics. Review any factual claims before you act.
                </p>
              </section>
            </div>
            <div className="shortcut-hint">
              <Command size={16} />
              <kbd>⌘ / Ctrl + K</kbd>
              <span>Find anything, from anywhere.</span>
            </div>
            <a
              className="text-button"
              href="https://github.com/boldsoftware/shelley"
              target="_blank"
              rel="noreferrer"
            >
              Explore Shelley on GitHub
              <ExternalLink size={14} />
            </a>
          </div>
        </Modal>
      )}
      {modal?.type === "updates" && (
        <Modal
          title="A fresh chapter for Shelley."
          subtitle="Introducing your business workspace"
          onClose={() => setModal(null)}
        >
          <div className="modal-body updates-content">
            <span className="pill">NEW IN YOUR WORKSPACE</span>
            <h3>Your ambition has a new home.</h3>
            <p>
              Discover business-focused workflows, create and version your own
              agents, and bring any model from your Shelley server.
            </p>
            <ul>
              <li>
                <Check size={16} />
                108 task-specific business agents
              </li>
              <li>
                <Check size={16} />
                108 editable companion prompts
              </li>
              <li>
                <Check size={16} />
                Optional Ponytail and Caveman skills
              </li>
              <li>
                <Check size={16} />
                Real session usage, never invented savings
              </li>
            </ul>
            <button
              className="primary-button"
              onClick={() => {
                setModal(null);
                navigate("Agent & Prompt Station");
              }}
            >
              Explore the station
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
function SearchModal({
  assets,
  onClose,
  onSelect,
  onPage,
}: {
  assets: Asset[];
  onClose: () => void;
  onSelect: (a: Asset) => void;
  onPage: (p: Page) => void;
}) {
  const [query, setQuery] = useState("");
  const results = assets
    .filter((a) =>
      `${a.name} ${a.category}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 7);
  return (
    <Modal title="Find your next possibility." onClose={onClose}>
      <div className="command-search">
        <Search size={20} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agents, prompts, and pages..."
          aria-label="Search everything"
        />
        <kbd>ESC</kbd>
      </div>
      <div className="command-results">
        {!query && (
          <>
            <span className="field-label">JUMP TO</span>
            {(
              [
                "Overview",
                "Agent & Prompt Station",
                "Projects",
                "Settings",
              ] as Page[]
            ).map((p) => (
              <button key={p} onClick={() => onPage(p)}>
                <LayoutGrid size={17} />
                <span>{p}</span>
                <ArrowUpRight size={15} />
              </button>
            ))}
          </>
        )}
        <span className="field-label">
          {query ? "MATCHING WORKFLOWS" : "A FEW GREAT STARTING POINTS"}
        </span>
        {results.map((a) => (
          <button key={a.id} onClick={() => onSelect(a)}>
            <CategoryIcon category={a.category} size={17} />
            <span>
              {a.name}
              <small>
                {a.category} · {a.kind}
              </small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        ))}
        {!results.length && (
          <p className="no-results">
            No matching workflows. Try “sales”, “content”, or “research”.
          </p>
        )}
      </div>
    </Modal>
  );
}
function AssetModal({
  asset,
  saved,
  onClose,
  onUse,
  onEdit,
  onShare,
}: {
  asset: Asset;
  saved: boolean;
  onClose: () => void;
  onUse: () => void;
  onEdit: () => void;
  onShare: () => void;
}) {
  const [tab, setTab] = useState("Overview");
  const [copied, setCopied] = useState(false);
  const [versions, setVersions] = useState<
    { version: number; instructions: string; createdAt: string }[]
  >([]);
  const [error, setError] = useState("");
  useEffect(() => {
    if (tab === "Versions" && saved)
      api<typeof versions>(`/api/station?versions=${asset.id}`)
        .then(setVersions)
        .catch((e) => setError(e.message));
  }, [tab, saved, asset.id]);
  return (
    <Modal
      title={asset.name}
      subtitle={asset.description}
      onClose={onClose}
      wide
    >
      <div className="detail-meta">
        <span className="category-tag">{asset.category}</span>
        <span>Version {asset.version}</span>
        <span>{saved ? "Saved by you" : "Catalog workflow"}</span>
      </div>
      <div className="tabs detail-tabs">
        {["Overview", "Instructions", "Versions"].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="modal-body asset-detail">
        <ArtStage className="detail-art"><ArtImage asset={asset} /><span><Sparkles size={15} /> {asset.category === "Repo optimization" ? "A QUICK WIN FOR YOUR CODEBASE" : "YOUR NEXT POSSIBILITY"}</span></ArtStage>
        {error && tab !== "Versions" && <p role="status">{error}</p>}
        {tab === "Overview" ? (
          <>
            <h3>Good context makes great work.</h3>
            <p>
              {asset.inputs ||
                "Provide your goal, audience, relevant facts, and any important constraints."}
            </p>
            <h3>What you’ll walk away with</h3>
            <p>
              {asset.deliverable ||
                "A focused, usable deliverable following your saved instructions."}
            </p>
            <div className="detail-note">
              <ShieldCheck size={20} />
              <p>
                Designed with evidence checks and human approval in mind. Review
                outputs before acting. This catalog entry has not been validated
                through a live-model evaluation.
              </p>
            </div>
          </>
        ) : tab === "Instructions" ? (
          <pre>{asset.instructions}</pre>
        ) : (
          <>
            {error && <p role="alert">{error}</p>}
            {saved ? (
              versions.map((v) => (
                <details className="version-row" key={v.version}>
                  <summary>
                    <span>Version {v.version}</span>
                    <span>{new Date(v.createdAt).toLocaleString()}</span>
                    <ChevronDown size={14} />
                  </summary>
                  <pre>{v.instructions}</pre>
                </details>
              ))
            ) : (
              <div className="version-row">
                <h3>Version 1 · Catalog original</h3>
                <p>
                  Customize and save this workflow to start your own version
                  history.
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <div className="modal-actions">
        <button
          className="icon-button share-button"
          aria-label="Share workflow publicly"
          onClick={onShare}
        >
          <Link2 size={18} />
        </button>
        {saved && (
          <button
            className="text-button"
            onClick={async () => {
              try {
                await api("/api/station", {
                  action: "share",
                  id: asset.id,
                  enabled: false,
                });
                setError("Public sharing is now disabled.");
              } catch (error) {
                setError((error as Error).message);
              }
            }}
          >
            Disable sharing
          </button>
        )}
        <button className="secondary-button" onClick={async () => { try { await navigator.clipboard.writeText(asset.instructions); setCopied(true); } catch { setError("Clipboard unavailable. Open Instructions to select and copy the prompt."); } }}><Copy size={14} />{copied ? "Copied!" : "Copy prompt"}</button>
        <button className="secondary-button" onClick={onEdit}>
          {saved ? "Edit workflow" : "Customize & save"}
          <SlidersHorizontal size={15} />
        </button>
        <button className="primary-button" onClick={onUse}>
          Use {asset.kind}
          <ArrowUpRight size={16} />
        </button>
      </div>
    </Modal>
  );
}
function EditorModal({
  asset,
  kind,
  isSaved,
  onClose,
  onSave,
  onGenerate,
}: {
  asset?: Asset;
  kind: "agent" | "prompt";
  isSaved: boolean;
  onClose: () => void;
  onSave: (data: unknown) => Promise<void>;
  onGenerate: (instructions: string) => void;
}) {
  const [name, setName] = useState(asset?.name || "");
  const [description, setDescription] = useState(asset?.description || "");
  const [instructions, setInstructions] = useState(asset?.instructions || "");
  const [category, setCategory] = useState(asset?.category || "Sales");
  const [type, setType] = useState(asset?.kind || kind);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title={
        isSaved ? "Make a good workflow even better." : `Make your own ${type}.`
      }
      subtitle={
        isSaved
          ? "Every save creates a new version. Your previous instructions stay safe."
          : "Start with an idea. Give it a purpose. Make it yours."
      }
      onClose={onClose}
      wide
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await onSave({
              action: "saveAsset",
              ...(isSaved ? { id: asset?.id, version: asset?.version } : {}),
              name,
              description,
              instructions,
              category,
              kind: type,
            });
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body editor-form">
          <div className="form-columns">
            <label>
              Name
              <input
                required
                minLength={2}
                maxLength={100}
                placeholder="Your next great agent"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              Type
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "agent" | "prompt")}
              >
                <option value="agent">Agent</option>
                <option value="prompt">Prompt</option>
              </select>
            </label>
          </div>
          <label>
            A one-line purpose
            <input
              required
              minLength={3}
              maxLength={300}
              placeholder="What will this workflow help you do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label>
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.slice(1).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label htmlFor="workflow-instructions">
            Instructions
            <textarea
              id="workflow-instructions"
              aria-label="Instructions"
              required
              minLength={20}
              maxLength={24000}
              rows={9}
              placeholder="Define the role, required context, workflow, deliverable, and quality checks. Keep factuality and human approval in mind."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="text-button"
            onClick={() =>
              onGenerate(
                `Create or refine this ${type}.\nName: ${name || "Suggest a useful name"}\nPurpose: ${description || "Ask me what I want to achieve."}\nCategory: ${category}\nExisting instructions: ${instructions || "None yet."}`,
              )
            }
          >
            <WandSparkles size={16} />
            Create or refine with a model
            <ArrowUpRight size={14} />
          </button>
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="modal-actions">
          <span className="editor-version">
            {isSaved
              ? `Saving version ${(asset?.version || 1) + 1}`
              : "Your first version starts here."}
          </span>
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            Save {type}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function ProjectModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <Modal
      title="Give your next idea a home."
      subtitle="A clear purpose is a great place to start."
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          setBusy(true);
          try {
            await onSave(
              form.get("name") as string,
              form.get("description") as string,
            );
          } catch (error) {
            setError((error as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body editor-form">
          <label>
            Project name
            <input
              autoFocus
              name="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="Something worth building"
            />
          </label>
          <label>
            What are you working toward?
            <textarea
              name="description"
              maxLength={1000}
              rows={4}
              placeholder="The goal, the context, and what success looks like."
            />
          </label>
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" disabled={busy}>
            {busy ? <Loader2 className="spin" size={16} /> : <Plus size={16} />}
            Create project
          </button>
        </div>
      </form>
    </Modal>
  );
}
