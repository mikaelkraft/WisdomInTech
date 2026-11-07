import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import HeaderNavigation from "../../components/ui/HeaderNavigation";
import DynamicFooter from "../../components/ui/DynamicFooter";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import DeveloperApiModal from "../../components/projects/DeveloperApiModal";
import workspaceService from "../../utils/workspaceService";
import showcaseService from "../../utils/showcaseService";
import { useAuth } from "../../contexts/AuthContext";

const TABS = [
  { id: "projects", label: "Projects Studio", icon: "Folder" },
  { id: "repos", label: "Connected Repos", icon: "Github" },
  { id: "agents", label: "Agent Workforce", icon: "Bot" },
  { id: "profile", label: "Showcase & Profile", icon: "User" },
];

const UserWorkspace = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("projects");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [profile, setProfile] = useState(null);

  // Modals & Forms
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isRepoModalOpen, setIsRepoModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    category: "Full Stack",
    tags: "",
    status: "published",
    featuredImage: "",
    videoUrl: "",
    repoUrl: "",
  });

  const [repoForm, setRepoForm] = useState({
    projectId: "",
    repoUrl: "",
    defaultBranch: "main",
  });

  // Agent State
  const [selectedAgentProject, setSelectedAgentProject] = useState("");
  const [agentType, setAgentType] = useState("doc_generator");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentTasks, setAgentTasks] = useState([]);
  const [selectedAgentOutput, setSelectedAgentOutput] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    username: "",
    headline: "",
    bio: "",
    location: "",
    websiteUrl: "",
    githubHandle: "",
    twitterHandle: "",
    linkedinHandle: "",
    skills: [],
  });
  const [skillInput, setSkillInput] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  // Filters
  const [projectSearch, setProjectSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadWorkspaceData = useCallback(async () => {
    setLoading(true);
    try {
      const [projRes, profRes] = await Promise.all([
        workspaceService.getProjects(),
        showcaseService.getMyProfile(),
      ]);

      if (projRes.success) {
        setProjects(projRes.projects || []);
        setStats(projRes.stats || {});
        if (projRes.projects?.length > 0 && !selectedAgentProject) {
          setSelectedAgentProject(projRes.projects[0].id);
        }
      }

      if (profRes.success && profRes.profile) {
        const p = profRes.profile;
        setProfile(p);
        setProfileForm({
          fullName: p.full_name || p.fullName || "",
          username: p.username || "",
          headline: p.headline || "",
          bio: p.bio || "",
          location: p.location || "",
          websiteUrl: p.website_url || p.websiteUrl || "",
          githubHandle: p.github_handle || p.githubHandle || "",
          twitterHandle: p.twitter_handle || p.twitterHandle || "",
          linkedinHandle: p.linkedin_handle || p.linkedinHandle || "",
          skills: Array.isArray(p.skills) ? p.skills : [],
        });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedAgentProject]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Load agent tasks when selected project changes
  useEffect(() => {
    if (selectedAgentProject) {
      workspaceService.getAgentTasks(selectedAgentProject).then((res) => {
        if (res.success) {
          setAgentTasks(res.tasks || []);
        }
      });
    }
  }, [selectedAgentProject]);

  // Handle Project Form Submission
  const handleSaveProject = async (e) => {
    e.preventDefault();
    const tagArray = projectForm.tags
      ? projectForm.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      title: projectForm.title,
      description: projectForm.description,
      category: projectForm.category,
      tags: tagArray,
      status: projectForm.status,
      featuredImage: projectForm.featuredImage || null,
      videoUrl: projectForm.videoUrl || null,
      repoUrl: projectForm.repoUrl || null,
    };

    if (editingProject) {
      const res = await workspaceService.updateProject(editingProject.id, payload);
      if (res.success) {
        setIsProjectModalOpen(false);
        setEditingProject(null);
        await loadWorkspaceData();
      } else {
        alert(res.error || "Failed to update project");
      }
    } else {
      const res = await workspaceService.createProject(payload);
      if (res.success) {
        setIsProjectModalOpen(false);
        resetProjectForm();
        await loadWorkspaceData();
      } else {
        alert(res.error || "Failed to create project");
      }
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: "",
      description: "",
      category: "Full Stack",
      tags: "",
      status: "published",
      featuredImage: "",
      videoUrl: "",
      repoUrl: "",
    });
    setEditingProject(null);
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title || "",
      description: project.description || "",
      category: project.category || "Full Stack",
      tags: Array.isArray(project.tags) ? project.tags.join(", ") : "",
      status: project.status || "published",
      featuredImage: project.featuredImage || "",
      videoUrl: project.videoUrl || "",
      repoUrl: project.connectedRepos?.[0]?.repoUrl || "",
    });
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    const res = await workspaceService.deleteProject(id);
    if (res.success) {
      await loadWorkspaceData();
    } else {
      alert(res.error || "Failed to delete project");
    }
  };

  // Link Repository
  const handleLinkRepo = async (e) => {
    e.preventDefault();
    if (!repoForm.projectId || !repoForm.repoUrl) {
      alert("Please select a project and enter a repository URL");
      return;
    }
    const res = await workspaceService.linkRepository(repoForm);
    if (res.success) {
      setIsRepoModalOpen(false);
      setRepoForm({ projectId: "", repoUrl: "", defaultBranch: "main" });
      await loadWorkspaceData();
    } else {
      alert(res.error || "Failed to link repository");
    }
  };

  // Run Agent
  const handleRunAgent = async (e) => {
    e.preventDefault();
    if (!selectedAgentProject) return;
    setAgentRunning(true);
    try {
      const res = await workspaceService.runAgentTask({
        projectId: selectedAgentProject,
        agentType,
        prompt: agentPrompt,
      });
      if (res.success && res.task) {
        setAgentTasks((prev) => [res.task, ...prev]);
        setSelectedAgentOutput(res.task);
      } else {
        alert(res.error || "Agent task failed");
      }
    } finally {
      setAgentRunning(false);
    }
  };

  // Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      const res = await showcaseService.updateMyProfile({
        full_name: profileForm.fullName,
        username: profileForm.username,
        headline: profileForm.headline,
        bio: profileForm.bio,
        location: profileForm.location,
        website_url: profileForm.websiteUrl,
        github_handle: profileForm.githubHandle,
        twitter_handle: profileForm.twitterHandle,
        linkedin_handle: profileForm.linkedinHandle,
        skills: profileForm.skills,
      });

      if (res.success) {
        setProfile(res.profile);
        setProfileMessage({ type: "success", text: "Showcase profile updated successfully!" });
        setTimeout(() => setProfileMessage(null), 3500);
      } else {
        setProfileMessage({ type: "error", text: res.error || "Failed to save profile." });
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // Skills Management
  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !profileForm.skills.includes(s)) {
      setProfileForm((prev) => ({ ...prev, skills: [...prev.skills, s] }));
      setSkillInput("");
    }
  };

  const removeSkill = (s) => {
    setProfileForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((x) => x !== s),
    }));
  };

  // Filter projects for Project Studio
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !projectSearch ||
        p.title?.toLowerCase().includes(projectSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(projectSearch.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && p.status === "published") ||
        (statusFilter === "draft" && p.status === "draft");
      return matchSearch && matchStatus;
    });
  }, [projects, projectSearch, statusFilter]);

  const liveShowcaseUrl = profile?.username ? `/u/${profile.username}` : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <Helmet>
        <title>Project Management Workspace & Collaboration Console</title>
      </Helmet>

      <HeaderNavigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Workspace Top Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-mono font-semibold">
                  Creator Workspace
                </span>
                {profile?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-mono font-semibold hover:bg-purple-500/20 transition-colors"
                  >
                    Admin Console →
                  </Link>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {profile?.full_name || user?.email?.split("@")[0] || "Creator"}
              </h1>
              <p className="text-sm text-slate-400 max-w-xl">
                Manage your portfolio projects, link code repositories, run autonomous agents, and publish to your personal showcase.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {liveShowcaseUrl ? (
                <Link to={liveShowcaseUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" iconName="ExternalLink" className="text-xs">
                    View Live Showcase ({liveShowcaseUrl})
                  </Button>
                </Link>
              ) : null}
              <Button
                variant="primary"
                iconName="Terminal"
                onClick={() => setIsApiModalOpen(true)}
                className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Developer API Keys
              </Button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
              <div className="text-xl font-bold font-mono text-cyan-400">{stats.totalProjects || 0}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Total Projects</div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
              <div className="text-xl font-bold font-mono text-emerald-400">{stats.published || 0}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Published Live</div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
              <div className="text-xl font-bold font-mono text-indigo-400">{stats.reposConnected || 0}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Connected Repos</div>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
              <div className="text-xl font-bold font-mono text-pink-400">{stats.totalViews || 0}</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400">Project Views</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 overflow-x-auto space-x-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Icon name={tab.icon} className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PROJECTS STUDIO */}
        {activeTab === "projects" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Icon
                    name="Search"
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                  />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Status</option>
                  <option value="published">Published</option>
                  <option value="draft">Drafts</option>
                </select>
              </div>

              <Button
                variant="primary"
                iconName="Plus"
                onClick={() => {
                  resetProjectForm();
                  setIsProjectModalOpen(true);
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs w-full sm:w-auto"
              >
                Create Project
              </Button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-500 text-sm">Loading projects...</div>
            ) : filteredProjects.length === 0 ? (
              <div className="py-16 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8">
                <Icon name="FolderPlus" className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300 mb-1">No Projects Found</h3>
                <p className="text-slate-500 text-xs mb-4">
                  Create your first portfolio project to begin showcasing your workforce.
                </p>
                <Button
                  variant="outline"
                  iconName="Plus"
                  onClick={() => {
                    resetProjectForm();
                    setIsProjectModalOpen(true);
                  }}
                  className="text-xs"
                >
                  Create Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    className="group rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between overflow-hidden shadow-lg"
                  >
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                            p.status === "published"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {p.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                          {p.userRole || "Owner"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {p.description || "No description."}
                      </p>

                      {/* Repos Connected */}
                      {p.connectedRepos && p.connectedRepos.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-cyan-400/90 font-mono">
                          <Icon name="Github" className="w-3.5 h-3.5" />
                          <span className="truncate">{p.connectedRepos[0].repoFullName}</span>
                        </div>
                      )}

                      {/* Tags */}
                      {p.tags && p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {p.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-slate-800/60 text-[10px] font-mono text-slate-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Project Card Footer */}
                    <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-slate-500">
                        <span className="flex items-center gap-1">
                          <Icon name="Eye" className="w-3 h-3" /> {p.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Heart" className="w-3 h-3" /> {p.likes || 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="px-2 py-1 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                          title="Edit Project"
                        >
                          <Icon name="Edit" className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="px-2 py-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                          title="Delete Project"
                        >
                          <Icon name="Trash2" className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/project/${p.id}`}
                          className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                          title="View Detail"
                        >
                          <Icon name="ExternalLink" className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONNECTED REPOSITORIES */}
        {activeTab === "repos" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Linked Repositories</h2>
                <p className="text-xs text-slate-400">
                  Connect GitHub repositories to track stars, issues, releases, and branches.
                </p>
              </div>
              <Button
                variant="primary"
                iconName="Link"
                onClick={() => setIsRepoModalOpen(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
              >
                Link Repository
              </Button>
            </div>

            {/* List Repos */}
            {projects.flatMap((p) => p.connectedRepos || []).length === 0 ? (
              <div className="py-16 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8">
                <Icon name="GitBranch" className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300 mb-1">No Repositories Linked Yet</h3>
                <p className="text-slate-500 text-xs mb-4">
                  Link your code repositories to synchronize real-time commit metadata.
                </p>
                <Button
                  variant="outline"
                  iconName="Plus"
                  onClick={() => setIsRepoModalOpen(true)}
                  className="text-xs"
                >
                  Link First Repo
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {projects.flatMap((p) =>
                  (p.connectedRepos || []).map((repo) => (
                    <div
                      key={repo.id}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400">
                            <Icon name="Github" className="w-5 h-5" />
                          </div>
                          <div>
                            <a
                              href={repo.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-bold text-white hover:text-cyan-400 transition-colors flex items-center gap-1.5"
                            >
                              <span>{repo.repoFullName}</span>
                              <Icon name="ExternalLink" className="w-3 h-3 text-slate-500" />
                            </a>
                            <p className="text-xs text-slate-400">
                              Attached to project: <span className="text-slate-200">{p.title}</span>
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (!window.confirm("Unlink this repository?")) return;
                            await workspaceService.unlinkRepository(repo.id);
                            await loadWorkspaceData();
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded transition-colors"
                          title="Unlink"
                        >
                          <Icon name="Trash2" className="w-4 h-4" />
                        </button>
                      </div>

                      {/* GitHub Metadata Pills */}
                      {repo.syncMetadata && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/60 text-center text-xs">
                          <div className="bg-slate-950/40 p-2 rounded-lg">
                            <span className="text-amber-400 font-bold font-mono">
                              ★ {repo.syncMetadata.stars || 0}
                            </span>
                            <div className="text-[10px] text-slate-500">Stars</div>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-lg">
                            <span className="text-cyan-400 font-bold font-mono">
                              ⑂ {repo.syncMetadata.forks || 0}
                            </span>
                            <div className="text-[10px] text-slate-500">Forks</div>
                          </div>
                          <div className="bg-slate-950/40 p-2 rounded-lg">
                            <span className="text-indigo-400 font-bold font-mono">
                              {repo.defaultBranch || "main"}
                            </span>
                            <div className="text-[10px] text-slate-500">Branch</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )),
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI AGENT WORKFORCE */}
        {activeTab === "agents" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/30 to-purple-950/30 border border-cyan-800/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Icon name="Bot" className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Agent Workforce Engine</h2>
                  <p className="text-xs text-slate-400">
                    Run autonomous agents on your projects to generate documentation, audit architecture, or produce changelogs.
                  </p>
                </div>
              </div>

              {/* Agent Trigger Form */}
              <form onSubmit={handleRunAgent} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Target Project
                  </label>
                  <select
                    value={selectedAgentProject}
                    onChange={(e) => setSelectedAgentProject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Agent Capability
                  </label>
                  <select
                    value={agentType}
                    onChange={(e) => setAgentType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="doc_generator">Technical Documentation Generator</option>
                    <option value="code_reviewer">Automated Code & Architecture Review</option>
                    <option value="release_notes">Release Notes & Changelog Synthesizer</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Custom Agent Guidelines / Focus (Optional)
                  </label>
                  <input
                    type="text"
                    value={agentPrompt}
                    onChange={(e) => setAgentPrompt(e.target.value)}
                    placeholder="e.g. Focus on microservices security, explain caching patterns..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={agentRunning || !selectedAgentProject}
                    iconName={agentRunning ? "Loader2" : "Play"}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs h-9"
                  >
                    {agentRunning ? "Agent Working..." : "Deploy Agent Task"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Agent Tasks Output / History */}
            <div className="space-y-4">
              <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400">
                Agent Run History ({agentTasks.length})
              </h3>

              {agentTasks.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  No agent tasks executed for this project yet. Trigger an agent above!
                </div>
              ) : (
                <div className="space-y-3">
                  {agentTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase font-semibold">
                            {t.agentType}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400">
                            {t.status}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(t.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-200">
                          {t.outputPayload?.title || "Agent task execution output"}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        iconName="Eye"
                        onClick={() => setSelectedAgentOutput(t)}
                        className="text-xs"
                      >
                        Inspect Output
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SHOWCASE & PROFILE SETTINGS */}
        {activeTab === "profile" && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Creator Showcase Settings</h2>
              <p className="text-xs text-slate-400">
                Personalize your public showcase URL, bio, headline, and professional skills.
              </p>
            </div>

            {profileMessage && (
              <div
                className={`p-4 rounded-xl text-xs font-semibold ${
                  profileMessage.type === "success"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="e.g. Mike Kraft"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Showcase Handle (@username)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
                      @
                    </span>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                      placeholder="mike"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Public URL: /u/{profileForm.username || "username"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={profileForm.headline}
                  onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Full-Stack Engineer & AI Systems Architect"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Bio / About Me
                </label>
                <textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="Tell clients and collaborators about your focus, experience, and passions..."
                />
              </div>

              {/* Skills Chips */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Skills & Core Technologies
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder="Type skill and press Add (e.g. React, PostgreSQL)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <Button type="button" variant="outline" onClick={addSkill} className="text-xs">
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {profileForm.skills.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-md bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono flex items-center gap-1.5"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="text-slate-500 hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Socials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    GitHub Handle
                  </label>
                  <input
                    type="text"
                    value={profileForm.githubHandle}
                    onChange={(e) => setProfileForm({ ...profileForm, githubHandle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="octocat"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Personal Website / Portfolio
                  </label>
                  <input
                    type="text"
                    value={profileForm.websiteUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, websiteUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    Twitter / X Handle
                  </label>
                  <input
                    type="text"
                    value={profileForm.twitterHandle}
                    onChange={(e) => setProfileForm({ ...profileForm, twitterHandle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                    LinkedIn Handle
                  </label>
                  <input
                    type="text"
                    value={profileForm.linkedinHandle}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedinHandle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    placeholder="in/username"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={profileSaving}
                  iconName={profileSaving ? "Loader2" : "Save"}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
                >
                  {profileSaving ? "Saving..." : "Save Showcase Profile"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Project Form Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editingProject ? "Edit Project" : "Create New Project"}
              </h3>
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={projectForm.category}
                    onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Status
                  </label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Technologies / Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={projectForm.tags}
                  onChange={(e) => setProjectForm({ ...projectForm, tags: e.target.value })}
                  placeholder="React, TypeScript, Tailwind, Node.js"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Featured Image URL
                </label>
                <input
                  type="text"
                  value={projectForm.featuredImage}
                  onChange={(e) => setProjectForm({ ...projectForm, featuredImage: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {!editingProject && (
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                    Connect GitHub Repo (optional)
                  </label>
                  <input
                    type="text"
                    value={projectForm.repoUrl}
                    onChange={(e) => setProjectForm({ ...projectForm, repoUrl: e.target.value })}
                    placeholder="https://github.com/owner/repository"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProjectModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
                >
                  {editingProject ? "Update Project" : "Create Project"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Repo Modal */}
      {isRepoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Link Git Repository</h3>
              <button
                onClick={() => setIsRepoModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkRepo} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Target Project *
                </label>
                <select
                  required
                  value={repoForm.projectId}
                  onChange={(e) => setRepoForm({ ...repoForm, projectId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Repository URL *
                </label>
                <input
                  type="url"
                  required
                  value={repoForm.repoUrl}
                  onChange={(e) => setRepoForm({ ...repoForm, repoUrl: e.target.value })}
                  placeholder="https://github.com/owner/repository"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                  Default Branch
                </label>
                <input
                  type="text"
                  value={repoForm.defaultBranch}
                  onChange={(e) => setRepoForm({ ...repoForm, defaultBranch: e.target.value })}
                  placeholder="main"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsRepoModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs"
                >
                  Link Repo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agent Output Modal */}
      {selectedAgentOutput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Icon name="Bot" className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {selectedAgentOutput.outputPayload?.title || "Agent Output"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedAgentOutput(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {selectedAgentOutput.outputPayload?.markdown && (
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                  {selectedAgentOutput.outputPayload.markdown}
                </pre>
              )}

              {selectedAgentOutput.outputPayload?.checks && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="font-bold text-slate-300">Overall Architecture Score</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {selectedAgentOutput.outputPayload.score}/100 ({selectedAgentOutput.outputPayload.grade})
                    </span>
                  </div>
                  {selectedAgentOutput.outputPayload.checks.map((c, i) => (
                    <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold">
                        {c.status}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-200">{c.category}</div>
                        <div className="text-slate-400 text-[11px]">{c.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <Button
                variant="outline"
                iconName="Copy"
                onClick={() => {
                  const text =
                    selectedAgentOutput.outputPayload?.markdown ||
                    JSON.stringify(selectedAgentOutput.outputPayload, null, 2);
                  navigator.clipboard.writeText(text);
                  alert("Agent output copied to clipboard!");
                }}
                className="text-xs"
              >
                Copy Markdown
              </Button>
              <Button
                variant="primary"
                onClick={() => setSelectedAgentOutput(null)}
                className="text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Developer API Modal */}
      <DeveloperApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />

      <DynamicFooter />
    </div>
  );
};

export default UserWorkspace;
