import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import apiKeyService from "../../utils/apiKeyService";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Icon from "../AppIcon";

const DeveloperApiModal = ({ isOpen, onClose, onRequireLogin }) => {
  const { user } = useAuth();
  const { show: showToast } = useToast();

  const [activeTab, setActiveTab] = useState("keys"); // 'keys' | 'snippets'
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  const apiEndpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/v1/projects`
      : "https://mkraft.tech/api/v1/projects";

  // Load keys when opened and user is logged in
  useEffect(() => {
    if (isOpen && user) {
      loadKeys();
    }
    if (!isOpen) {
      setNewlyCreatedKey(null);
      setKeyName("");
    }
  }, [isOpen, user]);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await apiKeyService.getKeys();
      if (res.success) {
        setKeys(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setCreating(true);
    try {
      const res = await apiKeyService.createKey(keyName.trim());
      if (res.success && res.data) {
        setNewlyCreatedKey(res.data.apiKey);
        setKeyName("");
        showToast("API key created successfully", { type: "success" });
        loadKeys();
      } else {
        showToast(res.error || "Failed to create API key", { type: "error" });
      }
    } catch {
      showToast("Error creating key", { type: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeKey = async (id, name) => {
    if (!window.confirm(`Revoke API key "${name}"? External apps using this key will lose access immediately.`)) {
      return;
    }
    setRevokingId(id);
    try {
      const res = await apiKeyService.revokeKey(id);
      if (res.success) {
        showToast("API key revoked", { type: "info" });
        setKeys((prev) => prev.filter((k) => k.id !== id));
      } else {
        showToast(res.error || "Failed to revoke key", { type: "error" });
      }
    } finally {
      setRevokingId(null);
    }
  };

  const copyToClipboard = (text, type = "key") => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedSnippet(type);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
    showToast("Copied to clipboard", { type: "success" });
  };

  if (!isOpen) return null;

  const sampleKey = newlyCreatedKey || "mk_live_your_api_key_here";

  const curlSnippet = `curl -X GET "${apiEndpoint}?limit=10" \\
  -H "x-api-key: ${sampleKey}"`;

  const jsSnippet = `// 1. Fetch your live projects from any website or app
const response = await fetch("${apiEndpoint}?limit=10", {
  headers: {
    "x-api-key": "${sampleKey}"
  }
});

const data = await response.json();
console.log("My live projects:", data.projects);`;

  const reactSnippet = `import { useState, useEffect } from "react";

export default function ExternalProjectFeed() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("${apiEndpoint}?limit=6", {
      headers: { "x-api-key": "${sampleKey}" }
    })
      .then((res) => res.json())
      .then((data) => {
        setProjects(data.projects || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading projects...</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
      {projects.map((p) => (
        <div key={p.id} style={{ border: "1px solid #333", borderRadius: "12px", padding: "16px" }}>
          {p.featured_image && (
            <img src={p.featured_image} alt={p.title} style={{ width: "100%", borderRadius: "8px", marginBottom: "12px" }} />
          )}
          <h3>{p.title}</h3>
          <p>{p.description}</p>
        </div>
      ))}
    </div>
  );
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-surface border border-border-accent/40 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-glow-primary overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border-accent/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Icon name="Code2" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-text-primary">
                Headless Projects API &amp; Embeds
              </h2>
              <p className="text-xs text-text-secondary">
                Hook into your projects from external websites, apps, and portfolios in real time.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border-accent/20 px-6 bg-surface/50">
          <button
            onClick={() => setActiveTab("keys")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "keys"
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon name="Key" size={16} />
            <span>Developer API Keys</span>
            {keys.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {keys.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("snippets")}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "snippets"
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <Icon name="Terminal" size={16} />
            <span>Integration Snippets</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-grow">
          {activeTab === "keys" && (
            <div className="space-y-6">
              {/* Not Logged In State */}
              {!user ? (
                <div className="p-8 text-center bg-background/50 rounded-xl border border-border-accent/20">
                  <div className="w-12 h-12 rounded-full bg-primary/20 mx-auto mb-4 flex items-center justify-center text-primary">
                    <Icon name="Lock" size={24} />
                  </div>
                  <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
                    Authentication Required
                  </h3>
                  <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
                    Sign in to your account to generate secure developer API keys that connect external apps directly to your projects.
                  </p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      onClose();
                      onRequireLogin?.();
                    }}
                    iconName="LogIn"
                    iconPosition="left"
                  >
                    Sign In to Generate Keys
                  </Button>
                </div>
              ) : (
                <>
                  {/* Newly Created Key Alert (Shown once) */}
                  {newlyCreatedKey && (
                    <div className="p-5 bg-success/10 border border-success/40 rounded-xl space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-success font-medium text-sm">
                          <Icon name="CheckCircle2" size={18} />
                          <span>New API Key Generated!</span>
                        </div>
                        <span className="text-xs text-text-secondary font-mono">
                          Only shown once
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-background p-3 rounded-lg border border-border-accent/30 font-mono text-xs break-all text-text-primary">
                        <span className="flex-grow select-all font-semibold text-primary">
                          {newlyCreatedKey}
                        </span>
                        <Button
                          size="sm"
                          variant={copiedKey ? "success" : "outline"}
                          onClick={() => copyToClipboard(newlyCreatedKey, "key")}
                          className="flex-shrink-0"
                        >
                          {copiedKey ? "Copied!" : "Copy Key"}
                        </Button>
                      </div>
                      <p className="text-xs text-text-secondary">
                        Please copy and store this API key in your external app's environment variables. It will never be shown again.
                      </p>
                    </div>
                  )}

                  {/* Create New Key Form */}
                  <form onSubmit={handleCreateKey} className="flex gap-3">
                    <Input
                      type="text"
                      placeholder="e.g. My Portfolio Website, Client Feed, Blog Widget"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      className="flex-grow text-sm"
                      disabled={creating}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={creating || !keyName.trim()}
                      className="flex-shrink-0"
                      iconName="Plus"
                      iconPosition="left"
                    >
                      {creating ? "Generating..." : "Generate Key"}
                    </Button>
                  </form>

                  {/* Keys Table / List */}
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase tracking-wider text-text-secondary font-semibold">
                      Your Active API Keys
                    </h4>

                    {loading ? (
                      <div className="p-8 text-center text-text-secondary text-sm">
                        Loading your developer keys...
                      </div>
                    ) : keys.length === 0 ? (
                      <div className="p-8 text-center bg-background/30 rounded-xl border border-border-accent/10">
                        <p className="text-sm text-text-secondary">
                          No API keys generated yet. Create one above to hook external websites into your projects!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {keys.map((k) => (
                          <div
                            key={k.id}
                            className="p-4 rounded-xl bg-background/60 border border-border-accent/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-primary/40 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-heading font-medium text-text-primary text-sm">
                                  {k.name}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success border border-success/30 font-medium">
                                  Active
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-text-secondary font-mono">
                                <span className="bg-surface px-2 py-0.5 rounded border border-border-accent/20">
                                  {k.key_prefix || k.keyPrefix}
                                </span>
                                <span>
                                  Created: {(k.created_at || k.createdAt || "").slice(0, 10)}
                                </span>
                                {k.last_used_at && (
                                  <span>
                                    Last active: {new Date(k.last_used_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeKey(k.id, k.name)}
                              disabled={revokingId === k.id}
                              className="text-error hover:bg-error/10 hover:border-error/40 flex-shrink-0"
                            >
                              {revokingId === k.id ? "Revoking..." : "Revoke"}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "snippets" && (
            <div className="space-y-6">
              {/* Endpoint Overview */}
              <div className="p-4 rounded-xl bg-background/60 border border-border-accent/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-text-secondary">
                    Headless REST Endpoint
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                    CORS Enabled (*)
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-surface p-2.5 rounded-lg border border-border-accent/30 font-mono text-xs text-text-primary break-all">
                  <span className="text-success font-bold">GET</span>
                  <span className="flex-grow select-all">{apiEndpoint}</span>
                </div>
              </div>

              {/* JavaScript fetch() */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    1. JavaScript (Browser / Node)
                  </span>
                  <Button
                    size="sm"
                    variant={copiedSnippet === "js" ? "success" : "outline"}
                    onClick={() => copyToClipboard(jsSnippet, "js")}
                  >
                    {copiedSnippet === "js" ? "Copied!" : "Copy Code"}
                  </Button>
                </div>
                <pre className="p-4 bg-background rounded-xl border border-border-accent/20 font-mono text-xs text-text-primary overflow-x-auto">
                  {jsSnippet}
                </pre>
              </div>

              {/* cURL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    2. cURL (Terminal / Backend)
                  </span>
                  <Button
                    size="sm"
                    variant={copiedSnippet === "curl" ? "success" : "outline"}
                    onClick={() => copyToClipboard(curlSnippet, "curl")}
                  >
                    {copiedSnippet === "curl" ? "Copied!" : "Copy Code"}
                  </Button>
                </div>
                <pre className="p-4 bg-background rounded-xl border border-border-accent/20 font-mono text-xs text-text-primary overflow-x-auto">
                  {curlSnippet}
                </pre>
              </div>

              {/* React Component */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-text-primary">
                    3. React Component (Drop into any React / Next.js app)
                  </span>
                  <Button
                    size="sm"
                    variant={copiedSnippet === "react" ? "success" : "outline"}
                    onClick={() => copyToClipboard(reactSnippet, "react")}
                  >
                    {copiedSnippet === "react" ? "Copied!" : "Copy Code"}
                  </Button>
                </div>
                <pre className="p-4 bg-background rounded-xl border border-border-accent/20 font-mono text-xs text-text-primary overflow-x-auto max-h-56">
                  {reactSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border-accent/20 flex items-center justify-between bg-surface/50">
          <span className="text-xs text-text-secondary">
            Cross-Origin Resource Sharing (CORS) is enabled on all responses.
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeveloperApiModal;
