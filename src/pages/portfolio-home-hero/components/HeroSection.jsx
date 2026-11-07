import { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import settingsService from '../../../utils/settingsService';

const HeroSection = ({ currentTheme }) => {
  const [typedText, setTypedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await settingsService.getSettings();
        if (res.success) {
          setSettings(res.data);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Utility to extract filename from URL
  const getFilenameFromUrl = (url) => {
    try {
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1) || 'resume.pdf';
      return filename;
    } catch {
      return 'resume.pdf';
    }
  };

  const handleDownloadResume = () => {
    if (settings.resumeUrl) {
      // Determine filename: use settings.resumeFilename if available, else derive from URL
      const filename = settings.resumeFilename || getFilenameFromUrl(settings.resumeUrl);
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = settings.resumeUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const heroName =
    settings.ui?.hero_name ||
    settings.hero_name ||
    settings.site_title ||
    "Mikael Kraft";

  const heroTagline =
    settings.ui?.hero_tagline ||
    settings.site_tagline ||
    "";

  const defaultPhrases = useMemo(
    () => [
      "AI Autonomous Systems Architect",
      "Distributed Cloud & Data Infrastructure",
      "Full-Stack Engineering & Tooling",
      "High-Performance Edge Computing",
      "Next-Gen Digital Workforce",
    ],
    [],
  );

  const phrases = useMemo(() => {
    const custom =
      settings.ui?.hero_stacks ||
      settings.ui?.hero_typing_phrases ||
      settings.hero_stacks;
    if (Array.isArray(custom) && custom.filter(Boolean).length > 0) {
      return custom.map((s) => String(s).trim()).filter(Boolean);
    }
    if (typeof custom === "string" && custom.trim()) {
      return custom.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
    }
    return defaultPhrases;
  }, [settings, defaultPhrases]);

  useEffect(() => {
    if (!phrases.length) return;
    const typeSpeed = isDeleting ? 45 : 95;
    const currentPhrase = phrases[currentIndex % phrases.length];
    
    const timeout = setTimeout(() => {
      if (!isDeleting && typedText === currentPhrase) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && typedText === '') {
        setIsDeleting(false);
        setCurrentIndex((prev) => (prev + 1) % phrases.length);
      } else {
        setTypedText(prev => 
          isDeleting 
            ? prev.slice(0, -1)
            : currentPhrase.slice(0, prev.length + 1)
        );
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [typedText, currentIndex, isDeleting, phrases]);

  const getThemeClasses = () => {
    switch(currentTheme) {
      case 'neural':
        return 'bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30';
      case 'futuristic':
        return 'bg-gradient-to-br from-slate-900/20 to-blue-900/20 border-blue-400/30';
      case 'light':
        return 'bg-gradient-to-br from-gray-50 to-blue-50 border-gray-300';
      default: // cyberpunk
        return 'bg-gradient-to-br from-surface/20 to-primary/5 border-primary/30';
    }
  };

  const getTextClasses = () => {
    switch(currentTheme) {
      case 'light':
        return {
          primary: 'text-gray-900',
          secondary: 'text-gray-600',
          accent: 'text-blue-600'
        };
      default:
        return {
          primary: 'text-text-primary',
          secondary: 'text-text-secondary', 
          accent: 'text-primary'
        };
    }
  };

  const textColors = getTextClasses();

  return (
    <section className="min-h-screen flex items-center justify-center px-6 py-20 relative overflow-hidden bg-background transition-colors duration-500">
      {/* Ambient Background Elements (stabilized to prevent raster stall & black flashes) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {currentTheme !== 'light' && (
          <>
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-60"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-secondary/10 to-transparent rounded-full blur-2xl opacity-50"></div>
            <div className="absolute inset-0 cyber-grid opacity-10"></div>
          </>
        )}
      </div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Same Row: Left Side Trapezoid Image Container + Right Side User Name */}
        <div className="mt-8 md:mt-16 mb-8 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Trapezoid Image Container */}
          <div className="relative group flex-shrink-0">
            {/* Outer ambient glow conforming to trapezoid geometry */}
            <div
              className="absolute -inset-1.5 bg-gradient-to-r from-primary via-cyan-400 to-secondary opacity-70 blur-md group-hover:opacity-100 transition-opacity"
              style={{ clipPath: "polygon(14% 0%, 100% 0%, 86% 100%, 0% 100%)" }}
            />
            {/* Trapezoid Frame with border glow */}
            <div
              className={`relative w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 p-[3px] bg-gradient-to-r from-primary via-cyan-400 to-primary/60 shadow-glow-primary transition-all duration-300 group-hover:scale-105 ${
                currentTheme === "light" ? "border-blue-400" : ""
              }`}
              style={{ clipPath: "polygon(14% 0%, 100% 0%, 86% 100%, 0% 100%)" }}
            >
              {/* Inner clipped image */}
              <div
                className="w-full h-full bg-surface overflow-hidden relative"
                style={{ clipPath: "polygon(14% 0%, 100% 0%, 86% 100%, 0% 100%)" }}
              >
                <Image
                  src={
                    settings.heroImageUrl ||
                    settings.hero_image_url ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
                  }
                  alt={`${heroName} - Digital Portfolio`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/25 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* User Name in same row */}
          <div className="text-center sm:text-left">
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight flex items-center justify-center sm:justify-start flex-wrap gap-x-3 text-primary">
              <span className="text-primary opacity-90 select-none font-mono">//</span>
              <span className="text-primary drop-shadow-[0_0_24px_var(--color-primary)]">
                {heroName}
              </span>
            </h1>
            {heroTagline && (
              <p className="text-xs sm:text-sm font-mono text-cyan-400/90 tracking-widest uppercase mt-1 pl-1">
                {heroTagline}
              </p>
            )}
          </div>
        </div>

        {/* Typing Animation */}
        <div className="mb-8 h-16 flex items-center justify-center">
          <h2 className={`font-heading text-xl lg:text-2xl xl:text-3xl ${textColors.accent}`}>
            {typedText}
            <span className="animate-pulse">|</span>
          </h2>
        </div>

        {/* Description */}
        <div className={`max-w-4xl mx-auto mb-12 space-y-4 ${textColors.secondary}`}>
          {settings.ui?.hero_description || settings.site_description ? (
            <p className="text-lg lg:text-xl leading-relaxed">
              {settings.ui?.hero_description || settings.site_description}
            </p>
          ) : (
            <>
              <p className="text-lg lg:text-xl leading-relaxed">
                Crafting exceptional autonomous applications and high-performance digital architectures.
                Focused on building scalable, performant systems that deliver 
                outstanding user experiences through modern engineering practices.
              </p>
              <p className="text-base lg:text-lg">
                From responsive client interfaces to robust cloud backends and agent workflows, I create 
                full-stack solutions that seamlessly connect users with technology.
              </p>
            </>
          )}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <button
            onClick={() => {
              const el = document.getElementById('projects');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              } else {
                window.location.href = '/projects';
              }
            }}
            className="px-8 py-4 rounded-lg font-semibold text-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-primary hover:shadow-glow-primary hover:scale-105 active:scale-95 transition-all duration-300 min-h-[48px] min-w-[160px]"
          >
            <Icon name="FolderOpen" size={20} className="inline mr-2" />
            View Projects
          </button>
          <button 
            onClick={handleDownloadResume}
            disabled={!settings.resumeUrl}
            className={`px-8 py-4 rounded-lg font-medium text-lg border-2 border-primary/40 text-text-primary hover:text-primary hover:border-primary hover:bg-primary/10 hover:scale-105 active:scale-95 transition-all duration-300 min-h-[48px] min-w-[160px] ${!settings.resumeUrl ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Icon name="Download" size={20} className="inline mr-2" />
            Download CV
          </button>
        </div>

        {/* Animated Scroll Down Indicator */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              const el = document.getElementById("projects");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
              } else {
                window.location.href = "/projects";
              }
            }}
            className="group flex flex-col items-center focus:outline-none p-3 transition-transform duration-300 hover:scale-125"
            aria-label="Scroll to Projects"
          >
            <span className="text-xs font-caption text-text-secondary opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all duration-300 mb-1">
              Scroll Down
            </span>
            <div className="w-10 h-10 rounded-full border border-primary/30 group-hover:border-primary flex items-center justify-center text-primary bg-primary/5 group-hover:bg-primary/20 shadow-glow-primary transition-all duration-300 animate-bounce">
              <Icon name="ChevronDown" size={22} className="group-hover:translate-y-0.5 transition-transform duration-300" />
            </div>
          </button>
        </div>
      </div>

      {/* Floating Elements */}
      {currentTheme !== 'light' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 text-primary/20 animate-pulse">
            <Icon name="Code" size={32} />
          </div>
          <div className="absolute top-40 right-20 text-secondary/20 animate-pulse delay-500">
            <Icon name="Shield" size={28} />
          </div>
          <div className="absolute bottom-40 left-20 text-accent/20 animate-pulse delay-1000">
            <Icon name="Database" size={30} />
          </div>
          <div className="absolute bottom-20 right-10 text-primary/20 animate-pulse delay-1500">
            <Icon name="Cpu" size={26} />
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;