import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import HeaderNavigation from "../../components/ui/HeaderNavigation";
import DynamicFooter from "../../components/ui/DynamicFooter";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import DeveloperApiModal from "../../components/projects/DeveloperApiModal";
import showcaseService from "../../utils/showcaseService";

const CreatorShowcase = () => {
  const { username } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchShowcase = async () => {
      setLoading(true);
      setError(null);
      const res = await showcaseService.getShowcase(username);
      if (!active) return;
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Creator profile not found.");
      }
      setLoading(false);
    };

    if (username) {
      fetchShowcase();
    }
    return () => {
      active = false;
    };
  }, [username]);

  const user = data?.user;
  const projects = useMemo(() => data?.projects || [], [data]);
  const stats = data?.stats;

  // Derive unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    projects.forEach((p) => {
      (p.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [projects]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
      const matchTag = !selectedTag || (p.tags && p.tags.includes(selectedTag));
      const matchCategory = !selectedCategory || p.category === selectedCategory;
      return matchSearch && matchTag && matchCategory;
    });
  }, [projects, search, selectedTag, selectedCategory]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <Helmet>
        <title>
          {user ? `${user.fullName} (@${user.username}) — Portfolio Showcase` : "Creator Showcase"}
        </title>
        {user?.headline && <meta name="description" content={user.headline} />}
      </Helmet>

      <HeaderNavigation />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <p className="text-slate-400 font-mono text-sm">Loading creator showcase...</p>
          </div>
        ) : error || !user ? (
          <div className="py-20 text-center max-w-lg mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400">
              <Icon name="AlertCircle" className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Creator Not Found</h2>
            <p className="text-slate-400 text-sm mb-6">{error || "No creator found for this handle."}</p>
            <Link to="/projects">
              <Button variant="outline" iconName="ArrowLeft">
                Explore All Projects
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Creator Header Profile Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-900/40 border border-slate-800/80 p-8 sm:p-10 shadow-2xl backdrop-blur-md">
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                {/* Avatar and Identity */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="relative group">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[2px] shadow-xl">
                      <div className="w-full h-full rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-black text-cyan-400 font-mono">
                            {(user.fullName || user.username || "U")[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    {user.role === "admin" && (
                      <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-cyan-500 text-slate-950 text-[10px] font-bold rounded-md uppercase tracking-wider shadow">
                        Admin
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {user.fullName}
                      </h1>
                      <span className="px-2.5 py-1 bg-slate-800/80 border border-slate-700/60 text-cyan-300 font-mono text-xs rounded-lg">
                        @{user.username}
                      </span>
                    </div>

                    {user.headline && (
                      <p className="text-base text-cyan-400/90 font-medium">{user.headline}</p>
                    )}

                    {user.bio && (
                      <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">{user.bio}</p>
                    )}

                    {/* Socials & Location */}
                    <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
                      {user.location && (
                        <div className="flex items-center gap-1.5">
                          <Icon name="MapPin" className="w-3.5 h-3.5 text-slate-500" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      {user.websiteUrl && (
                        <a
                          href={user.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
                        >
                          <Icon name="Globe" className="w-3.5 h-3.5" />
                          <span>Website</span>
                        </a>
                      )}
                      {user.githubHandle && (
                        <a
                          href={`https://github.com/${user.githubHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
                        >
                          <Icon name="Github" className="w-3.5 h-3.5" />
                          <span>github/{user.githubHandle}</span>
                        </a>
                      )}
                      {user.twitterHandle && (
                        <a
                          href={`https://x.com/${user.twitterHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
                        >
                          <Icon name="Twitter" className="w-3.5 h-3.5" />
                          <span>x.com/{user.twitterHandle}</span>
                        </a>
                      )}
                      {user.linkedinHandle && (
                        <a
                          href={`https://linkedin.com/in/${user.linkedinHandle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-slate-300 hover:text-cyan-400 transition-colors"
                        >
                          <Icon name="Linkedin" className="w-3.5 h-3.5" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto self-stretch md:self-auto justify-end">
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    iconName={copiedLink ? "Check" : "Share2"}
                    className="w-full sm:w-auto"
                  >
                    {copiedLink ? "Link Copied!" : "Share Portfolio"}
                  </Button>
                  <Button
                    onClick={() => setIsApiModalOpen(true)}
                    variant="primary"
                    iconName="Terminal"
                    className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white"
                  >
                    API & Headless Embed
                  </Button>
                </div>
              </div>

              {/* Skills Chips */}
              {user.skills && user.skills.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500 mr-2">
                    Skills:
                  </span>
                  {user.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 rounded-md bg-slate-800/90 text-cyan-300 border border-slate-700/60 text-xs font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Metric Counters Bar */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  <div className="text-2xl font-black text-cyan-400 font-mono">
                    {stats?.totalProjects ?? projects.length}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">
                    Published Projects
                  </div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  <div className="text-2xl font-black text-indigo-400 font-mono">
                    {stats?.totalViews ?? 0}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">
                    Project Views
                  </div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  <div className="text-2xl font-black text-pink-400 font-mono">
                    {stats?.totalLikes ?? 0}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">
                    Community Likes
                  </div>
                </div>
                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/50">
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {stats?.topCategories?.length || 1}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">
                    Disciplines
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-72">
                <Icon
                  name="Search"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
                />
                <input
                  type="text"
                  placeholder="Search showcase..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {stats?.topCategories && stats.topCategories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">All Categories</option>
                    {stats.topCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}

                {allTags.length > 0 && (
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="">All Tech Tags</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                )}

                {(search || selectedTag || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setSelectedTag("");
                      setSelectedCategory("");
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Projects Grid */}
            {filteredProjects.length === 0 ? (
              <div className="py-20 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl p-8">
                <Icon name="Folder" className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-300 mb-1">No Projects Found</h3>
                <p className="text-slate-500 text-sm">
                  {projects.length === 0
                    ? `@${user.username} hasn't published any public projects yet.`
                    : "No projects match the selected filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="group relative flex flex-col rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden hover:shadow-2xl hover:shadow-cyan-500/10"
                  >
                    {/* Media Thumbnail */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                      {project.featuredImage ? (
                        <img
                          src={project.featuredImage}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-700">
                          <Icon name="Code" className="w-12 h-12" />
                        </div>
                      )}
                      {project.featured && (
                        <span className="absolute top-3 left-3 px-2 py-0.5 bg-cyan-500 text-slate-950 text-[10px] font-black rounded-md tracking-wider uppercase shadow">
                          Featured
                        </span>
                      )}
                      <span className="absolute top-3 right-3 px-2 py-0.5 bg-slate-950/80 backdrop-blur-md text-slate-300 text-[10px] font-mono rounded-md border border-slate-800">
                        {project.category}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400 line-clamp-2">
                          {project.description || "No description provided."}
                        </p>
                      </div>

                      {/* Tags */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {project.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] font-mono text-cyan-300/90"
                            >
                              #{tag}
                            </span>
                          ))}
                          {project.tags.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-800/50 text-[10px] font-mono text-slate-500">
                              +{project.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer Stats & View */}
                      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Icon name="Eye" className="w-3.5 h-3.5 text-slate-500" />
                            {project.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="Heart" className="w-3.5 h-3.5 text-slate-500" />
                            {project.likes}
                          </span>
                        </div>
                        <Link
                          to={`/project/${project.id}`}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 group/btn"
                        >
                          View Details
                          <Icon
                            name="ArrowRight"
                            className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Developer API Modal */}
      <DeveloperApiModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />

      <DynamicFooter />
    </div>
  );
};

export default CreatorShowcase;
