import { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";

const getBrowserAndOS = () => {
  if (typeof window === "undefined" || !navigator)
    return { browser: "Modern Browser", os: "Desktop" };
  const ua = navigator.userAgent;
  let browser = "Chrome";
  let os = "Unknown OS";

  if (ua.includes("Firefox/")) {
    const v = ua.split("Firefox/")[1]?.split(" ")[0];
    browser = `Firefox ${v ? v.split(".")[0] : ""}`;
  } else if (ua.includes("Edg/")) {
    const v = ua.split("Edg/")[1]?.split(" ")[0];
    browser = `Edge ${v ? v.split(".")[0] : ""}`;
  } else if (ua.includes("Chrome/")) {
    const v = ua.split("Chrome/")[1]?.split(" ")[0];
    browser = `Chrome ${v ? v.split(".")[0] : ""}`;
  } else if (ua.includes("Safari/") && !ua.includes("Chrome")) {
    const v = ua.split("Version/")[1]?.split(" ")[0];
    browser = `Safari ${v ? v.split(".")[0] : ""}`;
  }

  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { browser: `${browser.trim()}`, os };
};

const getConnectionInfo = () => {
  if (typeof navigator === "undefined") return "High-Speed";
  const conn =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;
  if (!conn) return "Broadband";
  const type = conn.effectiveType ? conn.effectiveType.toUpperCase() : "Online";
  const downlink = conn.downlink ? ` (${conn.downlink} Mbps)` : "";
  return `${type}${downlink}`;
};

const getPreferredLanguage = () => {
  if (typeof navigator === "undefined") return "en-US";
  const lang =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    "en-US";
  try {
    const intl = new Intl.DisplayNames(["en"], { type: "language" });
    const code = lang.split("-")[0];
    const name = intl.of(code);
    return `${name || lang} (${lang})`;
  } catch {
    return lang;
  }
};

const getTimezoneString = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const offsetMin = -new Date().getTimezoneOffset();
    const sign = offsetMin >= 0 ? "+" : "-";
    const hrs = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, "0");
    const mins = String(Math.abs(offsetMin) % 60).padStart(2, "0");
    return `${tz} (UTC${sign}${hrs}:${mins})`;
  } catch {
    return "UTC";
  }
};

const VisitorInfoPanel = ({ currentTheme }) => {
  const browserInfo =
    typeof window !== "undefined"
      ? getBrowserAndOS()
      : { browser: "Chrome", os: "Desktop" };
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  const [visitorInfo, setVisitorInfo] = useState({
    currentTime: new Date(),
    ipAddress: "Resolving IP...",
    ispProvider: "Detecting network...",
    browser: `${browserInfo.browser} on ${browserInfo.os}`,
    deviceRAM:
      typeof navigator !== "undefined" && navigator.deviceMemory
        ? `${navigator.deviceMemory} GB+`
        : "8 GB (Protected)",
    cpuCores:
      typeof navigator !== "undefined" && navigator.hardwareConcurrency
        ? `${navigator.hardwareConcurrency} Cores`
        : "8 Cores",
    connectionType:
      typeof window !== "undefined" ? getConnectionInfo() : "Broadband",
    displaySize:
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight} viewport`
        : "1920x1080",
    screenResolution:
      typeof window !== "undefined" && window.screen
        ? `${Math.round(window.screen.width * dpr)}x${Math.round(
            window.screen.height * dpr,
          )} (${dpr}x DPR)`
        : "1920x1080",
    preferredLanguage:
      typeof window !== "undefined" ? getPreferredLanguage() : "English (en-US)",
    location: "Locating region...",
    timezone: typeof window !== "undefined" ? getTimezoneString() : "UTC",
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Live clock
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setVisitorInfo((prev) => ({
        ...prev,
        currentTime: new Date(),
      }));
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Fetch IP & geo lookup
  useEffect(() => {
    let cancelled = false;

    const fetchGeo = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data && data.ip) {
            setVisitorInfo((prev) => ({
              ...prev,
              ipAddress: data.ip,
              ispProvider: data.org || data.asn || "Public Provider",
              location:
                [
                  data.city,
                  data.region_code || data.region,
                  data.country_name,
                ]
                  .filter(Boolean)
                  .join(", ") || "Global",
            }));
            return;
          }
        }
      } catch {
        // Fallback below
      }

      try {
        const res = await fetch("https://api.ipify.org?format=json");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.ip) {
            setVisitorInfo((prev) => ({
              ...prev,
              ipAddress: data.ip,
              ispProvider: "Direct Connection",
              location: "Client Verified",
            }));
          }
        }
      } catch {
        if (!cancelled) {
          setVisitorInfo((prev) => ({
            ...prev,
            ipAddress: "127.0.0.1 (Local Session)",
            ispProvider: "Direct Host",
            location: "Client Environment",
          }));
        }
      }
    };

    fetchGeo();
    return () => {
      cancelled = true;
    };
  }, []);

  const getThemeClasses = () => {
    switch (currentTheme) {
      case "neural":
        return {
          panel: "bg-purple-950/20 border-purple-500/30",
          text: "text-purple-100",
          secondary: "text-purple-300/80",
          accent: "text-purple-400",
          pill: "bg-purple-900/40 text-purple-200 border-purple-500/20",
        };
      case "futuristic":
        return {
          panel: "bg-slate-900/30 border-blue-400/30",
          text: "text-blue-100",
          secondary: "text-blue-300/80",
          accent: "text-blue-400",
          pill: "bg-blue-900/30 text-blue-200 border-blue-400/20",
        };
      case "light":
        return {
          panel: "bg-white border-gray-200 shadow-sm",
          text: "text-gray-900",
          secondary: "text-gray-600",
          accent: "text-blue-600",
          pill: "bg-blue-50 text-blue-700 border-blue-200",
        };
      default: // cyberpunk
        return {
          panel: "bg-surface/40 border-border-accent/40 shadow-glow-primary/20",
          text: "text-text-primary",
          secondary: "text-text-secondary",
          accent: "text-primary",
          pill: "bg-primary/10 text-primary border-primary/20",
        };
    }
  };

  const themeClasses = getThemeClasses();

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: true,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const detailedItems = [
    { label: "IP Address", value: visitorInfo.ipAddress, icon: "Globe" },
    { label: "ISP Network", value: visitorInfo.ispProvider, icon: "Wifi" },
    { label: "Client Engine", value: visitorInfo.browser, icon: "Monitor" },
    { label: "Hardware RAM", value: visitorInfo.deviceRAM, icon: "Cpu" },
    { label: "Logical Cores", value: visitorInfo.cpuCores, icon: "Zap" },
    { label: "Network Pipeline", value: visitorInfo.connectionType, icon: "Radio" },
    { label: "Viewport Size", value: visitorInfo.displaySize, icon: "Smartphone" },
    { label: "Display Canvas", value: visitorInfo.screenResolution, icon: "Maximize" },
    { label: "Language Locale", value: visitorInfo.preferredLanguage, icon: "Languages" },
    { label: "Geo Origin", value: visitorInfo.location, icon: "MapPin" },
    { label: "Session Timezone", value: visitorInfo.timezone, icon: "Clock" },
  ];

  return (
    <section className="py-6 sm:py-8 px-4 sm:px-6 relative z-10 transition-all duration-300">
      <div className="max-w-6xl mx-auto">
        <div
          className={`${themeClasses.panel} rounded-2xl border backdrop-blur-md p-4 sm:p-5 transition-all`}
        >
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-border-accent/20">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  currentTheme === "light" ? "bg-emerald-500" : "bg-primary"
                }`}
              />
              <span
                className={`text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase ${themeClasses.accent}`}
              >
                // Live System Telemetry & Visitor Session
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className={`font-semibold ${themeClasses.accent}`}>
                {formatTime(visitorInfo.currentTime)}
              </span>
              <span className="text-text-secondary/70 hidden md:inline">
                • {visitorInfo.location}
              </span>
            </div>
          </div>

          {/* Quick HUD Metrics Bar (Compact Text Sizes) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* IP Address */}
            <div className={`${themeClasses.pill} p-2.5 rounded-xl border flex items-center gap-2.5`}>
              <Icon name="Globe" size={15} className={`${themeClasses.accent} flex-shrink-0`} />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-mono tracking-wider opacity-70 truncate">
                  IP Address
                </div>
                <div className={`text-xs font-mono font-semibold truncate ${themeClasses.text}`}>
                  {visitorInfo.ipAddress}
                </div>
              </div>
            </div>

            {/* Hardware Cores */}
            <div className={`${themeClasses.pill} p-2.5 rounded-xl border flex items-center gap-2.5`}>
              <Icon name="Cpu" size={15} className={`${themeClasses.accent} flex-shrink-0`} />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-mono tracking-wider opacity-70 truncate">
                  CPU / Cores
                </div>
                <div className={`text-xs font-mono font-semibold truncate ${themeClasses.text}`}>
                  {visitorInfo.cpuCores} ({visitorInfo.deviceRAM})
                </div>
              </div>
            </div>

            {/* Viewport */}
            <div className={`${themeClasses.pill} p-2.5 rounded-xl border flex items-center gap-2.5`}>
              <Icon name="Monitor" size={15} className={`${themeClasses.accent} flex-shrink-0`} />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-mono tracking-wider opacity-70 truncate">
                  Display
                </div>
                <div className={`text-xs font-mono font-semibold truncate ${themeClasses.text}`}>
                  {visitorInfo.displaySize}
                </div>
              </div>
            </div>

            {/* Network / Connection */}
            <div className={`${themeClasses.pill} p-2.5 rounded-xl border flex items-center gap-2.5`}>
              <Icon name="Radio" size={15} className={`${themeClasses.accent} flex-shrink-0`} />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase font-mono tracking-wider opacity-70 truncate">
                  Network Link
                </div>
                <div className={`text-xs font-mono font-semibold truncate ${themeClasses.text}`}>
                  {visitorInfo.connectionType}
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Detailed Specs Drawer */}
          <div className="mt-3 pt-2.5 border-t border-border-accent/20">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full py-1 text-[11px] font-mono text-text-secondary hover:text-text-primary transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Icon name="Sliders" size={12} className={themeClasses.accent} />
                <span>{isExpanded ? "Hide Detailed Telemetry" : "Show Detailed System Specifications"}</span>
              </span>
              <Icon
                name={isExpanded ? "ChevronUp" : "ChevronDown"}
                size={14}
                className={themeClasses.accent}
              />
            </button>

            {isExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3 pt-2 border-t border-border-accent/10 animate-in fade-in duration-200">
                {detailedItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-lg bg-surface/50 border border-border-accent/20 flex items-center gap-2 text-xs"
                  >
                    <Icon
                      name={item.icon}
                      size={13}
                      className={`${themeClasses.accent} flex-shrink-0`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] uppercase font-mono text-text-secondary/70 truncate">
                        {item.label}
                      </div>
                      <div className="text-[11px] font-mono text-text-primary truncate">
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisitorInfoPanel;
