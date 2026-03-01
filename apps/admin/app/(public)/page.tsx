"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import "./landing.css";

const COLOR_PRESETS = [
  { name: "Indigo", accent: "#4f46e5", light: "#818cf8", dark: "#3730a3", rgb: "79, 70, 229", text: "#ffffff" },
  { name: "Amber", accent: "#e8963d", light: "#f5c06e", dark: "#d07a2a", rgb: "232, 150, 61", text: "#0a0a0a" },
  { name: "Rose", accent: "#f43f5e", light: "#fb7185", dark: "#e11d48", rgb: "244, 63, 94", text: "#ffffff" },
  { name: "Emerald", accent: "#10b981", light: "#34d399", dark: "#059669", rgb: "16, 185, 129", text: "#0a0a0a" },
  { name: "Purple", accent: "#8b5cf6", light: "#a78bfa", dark: "#7c3aed", rgb: "139, 92, 246", text: "#ffffff" },
];

export default function LandingPage() {
  const navRef = useRef<HTMLElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);
  const landingRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const cursorGlowRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeColor, setActiveColor] = useState(0);

  const closeMobileNav = useCallback(() => {
    mobileNavRef.current?.classList.remove("open");
  }, []);

  const applyPreset = useCallback((index: number) => {
    const preset = COLOR_PRESETS[index];
    if (!preset) return;
    const el = landingRef.current;
    if (!el) return;

    el.style.setProperty("--accent", preset.accent);
    el.style.setProperty("--accent-light", preset.light);
    el.style.setProperty("--accent-dark", preset.dark);
    el.style.setProperty("--accent-rgb", preset.rgb);
    el.style.setProperty("--accent-text", preset.text);
    el.style.setProperty("--accent-glow", `rgba(${preset.rgb}, 0.2)`);

    // Update SVG gradient stop-colors
    if (svgRef.current) {
      const stops = svgRef.current.querySelectorAll("stop");
      stops.forEach((stop) => {
        const slot = stop.getAttribute("data-slot");
        if (slot === "accent") stop.setAttribute("stop-color", preset.accent);
        if (slot === "light") stop.setAttribute("stop-color", preset.light);
      });
    }

    // Update float-1 icon stroke (the accent-colored one)
    const float1Svg = el.querySelector(".l-float-1 svg");
    if (float1Svg) {
      float1Svg.setAttribute("stroke", preset.accent);
    }
    const float4Svg = el.querySelector(".l-float-4 svg");
    if (float4Svg) {
      float4Svg.setAttribute("stroke", preset.light);
    }

    setActiveColor(index);
    localStorage.setItem("landing-color", String(index));

    // Sync accent to admin theme
    localStorage.setItem("site-accent", JSON.stringify({ accent: preset.accent, light: preset.light, dark: preset.dark }));
    let styleTag = document.getElementById("accent-override") as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "accent-override";
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = `:root{--site-primary:${preset.accent};--site-primary-fill:${preset.accent};--site-accent:${preset.dark}}[data-theme="dark"]{--site-primary:${preset.light};--site-primary-fill:${preset.accent};--site-accent:${preset.light}}`;
  }, []);

  useEffect(() => {
    // Restore saved color
    const saved = localStorage.getItem("landing-color");
    if (saved !== null) {
      const idx = parseInt(saved);
      if (!isNaN(idx) && idx >= 0 && idx < COLOR_PRESETS.length) {
        applyPreset(idx);
      }
    }

    // Scroll reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".landing .reveal").forEach((el) => observer.observe(el));

    // Nav scroll effect
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          navRef.current?.classList.toggle("scrolled", window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll);

    // Stat counter animation
    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const text = el.textContent ?? "";
            const num = parseInt(text);
            if (!isNaN(num) && num > 0 && num <= 100) {
              const suffix = text.replace(String(num), "");
              let startTime: number;
              const duration = 1200;
              const step = (timestamp: number) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(eased * num) + suffix;
                if (progress < 1) requestAnimationFrame(step);
              };
              requestAnimationFrame(step);
            }
            statObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll(".landing .stat-num").forEach((el) => statObserver.observe(el));

    // Cursor glow follow
    const glow = cursorGlowRef.current;
    const onMouseMove = (e: MouseEvent) => {
      if (glow) {
        glow.style.transform = `translate(${e.clientX}px, ${e.clientY + window.scrollY}px)`;
        glow.style.opacity = "1";
      }
    };
    const onMouseLeave = () => {
      if (glow) glow.style.opacity = "0";
    };
    window.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      observer.disconnect();
      statObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [applyPreset]);

  return (
    <div className="landing" ref={landingRef}>
      {/* Background effects */}
      <div className="l-bg">
        <div className="l-bg-glow-1" />
        <div className="l-bg-glow-2" />
        <div className="l-bg-grid" />
        <div className="l-bg-noise" />
      </div>

      {/* Cursor-following glow */}
      <div className="l-cursor-glow" ref={cursorGlowRef} />

      {/* Navigation */}
      <nav className="l-nav" ref={navRef}>
        <div className="l-wrap">
          <Link href="/" className="l-logo">
            <div className="l-logo-mark">P</div>
            <span className="l-logo-text">Postloom</span>
          </Link>
          <div className="l-nav-center">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#stats">Results</a>
          </div>
          <div className="l-nav-right">
            <Link href="/login" className="l-nav-login">Log In</Link>
            <Link href="/login" className="l-btn-accent">
              Get Started
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          </div>
          <button className="l-hamburger" onClick={() => mobileNavRef.current?.classList.add("open")} aria-label="Open menu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="l-mobile-nav" ref={mobileNavRef}>
        <button className="l-mobile-close" onClick={closeMobileNav} aria-label="Close menu">&times;</button>
        <a href="#features" onClick={closeMobileNav}>Features</a>
        <a href="#how-it-works" onClick={closeMobileNav}>How It Works</a>
        <a href="#stats" onClick={closeMobileNav}>Results</a>
        <Link href="/login" className="l-btn-accent l-btn-lg" onClick={closeMobileNav}>Get Started</Link>
      </div>

      {/* Hero */}
      <section className="l-hero">
        <div className="l-wrap l-hero-inner">
          <div className="l-hero-content">
            <div className="l-hero-tag">
              <span className="l-tag-dot" />
              AI-Powered Content Pipeline
            </div>
            <h1>Blog Content<br />That <em>Ranks</em>,<br />Created While<br />You Sleep</h1>
            <p className="l-hero-sub">From keyword research to published article — Postloom automates your entire content pipeline with AI.</p>
            <div className="l-hero-ctas">
              <Link href="/login" className="l-btn-accent l-btn-lg">
                Start Creating
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              </Link>
              <a href="#how-it-works" className="l-btn-ghost">See How It Works</a>
            </div>
          </div>
          <div className="l-hero-visual">
            <div className="l-orbit">
              <svg className="l-orbit-rings" viewBox="0 0 500 500" fill="none" ref={svgRef}>
                <defs>
                  <linearGradient id="rg1" x1="0" y1="0" x2="500" y2="500" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.5" data-slot="accent" />
                    <stop offset="50%" stopColor="#fb7185" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.35" data-slot="accent" />
                  </linearGradient>
                  <linearGradient id="rg2" x1="500" y1="0" x2="0" y2="500" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.08" data-slot="accent" />
                    <stop offset="50%" stopColor="#818cf8" stopOpacity="0.3" data-slot="light" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="0.06" />
                  </linearGradient>
                </defs>
                <circle cx="250" cy="250" r="100" stroke="url(#rg1)" strokeWidth="1" strokeDasharray="8 14" className="l-ring l-ring-1" />
                <circle cx="250" cy="250" r="168" stroke="url(#rg2)" strokeWidth="1" strokeDasharray="14 20" className="l-ring l-ring-2" />
                <circle cx="250" cy="250" r="228" stroke="url(#rg1)" strokeWidth="0.5" strokeDasharray="6 22" className="l-ring l-ring-3" />
              </svg>
              <div className="l-orbit-glow" />
              <div className="l-orbit-center">
                <div className="l-orbit-stat">10x</div>
                <div className="l-orbit-label">Faster</div>
              </div>
              <div className="l-float l-float-1" title="AI Research">
                <svg viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              </div>
              <div className="l-float l-float-2" title="SEO Optimization">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fb7185" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
              </div>
              <div className="l-float l-float-3" title="Content Generation">
                <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
              </div>
              <div className="l-float l-float-4" title="AI Images">
                <svg viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
              </div>
              <div className="l-float l-float-5" title="Keywords">
                <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" /></svg>
              </div>
              <div className="l-float l-float-6" title="Publish">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="l-features" id="features">
        <div className="l-wrap">
          <div className="l-section-tag reveal">Capabilities</div>
          <h2 className="l-section-title reveal">Everything your content<br />engine needs</h2>
          <div className="l-bento">
            <div className="l-bento-card l-bento-wide reveal">
              <div className="l-feat-icon l-feat-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /><path d="M11 8v6" /><path d="M8 11h6" /></svg>
              </div>
              <div>
                <h3>AI-Powered Research</h3>
                <p>Discover profitable niches, trending keywords, and content gaps. Our AI analyzes search intent and ranking potential before a single word is written.</p>
              </div>
            </div>
            <div className="l-bento-card reveal">
              <div className="l-feat-icon l-feat-rose">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
              </div>
              <h3>SEO Optimization</h3>
              <p>Meta tags, structured data, internal linking, and keyword placement — all baked in automatically.</p>
            </div>
            <div className="l-bento-card reveal">
              <div className="l-feat-icon l-feat-green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
              </div>
              <h3>Content Generation</h3>
              <p>Long-form articles with nuance and depth. No filler — just content that ranks.</p>
            </div>
            <div className="l-bento-card reveal">
              <div className="l-feat-icon l-feat-amber">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
              </div>
              <h3>AI Image Generation</h3>
              <p>Unique featured images for every article. No stock photos, no attribution headaches.</p>
            </div>
            <div className="l-bento-card reveal">
              <div className="l-feat-icon l-feat-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
              </div>
              <h3>Multi-Blog Dashboard</h3>
              <p>Dozens of blogs from one place. Each gets its own domain, design, and strategy.</p>
            </div>
            <div className="l-bento-card l-bento-wide reveal">
              <div className="l-feat-icon l-feat-purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v9" /><path d="m16 16-4-4-4 4" /></svg>
              </div>
              <div>
                <h3>Auto-Publishing</h3>
                <p>Articles go live automatically with schema markup, sitemaps, and cache invalidation. Your content pipeline runs 24/7 without intervention.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="l-pipeline" id="how-it-works">
        <div className="l-wrap">
          <div className="l-section-tag reveal">How It Works</div>
          <h2 className="l-section-title reveal">From zero to published<br />in four steps</h2>
          <p className="l-section-sub reveal">Our AI pipeline runs end-to-end, fully autonomously.</p>
          <div className="l-timeline reveal">
            <div className="l-timeline-track">
              <div className="l-timeline-flow" />
            </div>
            <div className="l-timeline-steps">
              <div className="l-timeline-step">
                <div className="l-step-dot" />
                <div className="l-step-num">01</div>
                <h3>Research &amp; Discover</h3>
                <p>AI analyzes your niche, discovers trending keywords, and identifies content opportunities.</p>
              </div>
              <div className="l-timeline-step">
                <div className="l-step-dot" />
                <div className="l-step-num">02</div>
                <h3>Plan &amp; Cluster</h3>
                <p>Topics grouped into content clusters with internal linking strategies mapped out.</p>
              </div>
              <div className="l-timeline-step">
                <div className="l-step-dot" />
                <div className="l-step-num">03</div>
                <h3>Write &amp; Generate</h3>
                <p>AI writes comprehensive articles. Unique images generated. Every piece SEO-optimized.</p>
              </div>
              <div className="l-timeline-step">
                <div className="l-step-dot" />
                <div className="l-step-num">04</div>
                <h3>Publish &amp; Monitor</h3>
                <p>Articles go live with schema markup, sitemaps, and continuous performance tracking.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="l-stats" id="stats">
        <div className="l-wrap">
          <div className="l-stats-row">
            <div className="l-stat reveal">
              <div className="stat-num">10x</div>
              <div className="stat-label">Faster content<br />production</div>
            </div>
            <div className="l-stat reveal">
              <div className="stat-num">11</div>
              <div className="stat-label">Automated<br />pipeline steps</div>
            </div>
            <div className="l-stat reveal">
              <div className="stat-num">24/7</div>
              <div className="stat-label">Autonomous<br />operation</div>
            </div>
            <div className="l-stat reveal">
              <div className="stat-num">&infin;</div>
              <div className="stat-label">Blogs from one<br />dashboard</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="l-cta">
        <div className="l-wrap">
          <div className="l-cta-box reveal">
            <h2>Ready to automate<br />your content engine?</h2>
            <p>Start creating SEO-optimized blog content with AI. No writing, no hassle — just results.</p>
            <Link href="/login" className="l-btn-accent l-btn-lg">
              Start Creating for Free
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="l-footer">
        <div className="l-wrap l-footer-inner">
          <div className="l-footer-copy">&copy; {new Date().getFullYear()} Postloom</div>
          <Link href="/login" className="l-footer-link">Dashboard</Link>
        </div>
      </footer>

      {/* Color Picker */}
      <div className={`l-picker${pickerOpen ? " open" : ""}`}>
        <div className="l-picker-tray">
          {COLOR_PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              className={`l-picker-swatch${i === activeColor ? " active" : ""}`}
              onClick={() => { applyPreset(i); }}
              title={preset.name}
              aria-label={`Switch to ${preset.name} theme`}
            >
              <span className="l-picker-swatch-inner" style={{ background: preset.accent }} />
            </button>
          ))}
        </div>
        <button
          className="l-picker-toggle"
          onClick={() => setPickerOpen(!pickerOpen)}
          aria-label="Toggle color picker"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="13.5" cy="6.5" r="2.5" />
            <path d="M17.08 8.43a1 1 0 0 1 .49.86v.17c0 .07-.01.15-.03.22l-2.5 8.24a2.5 2.5 0 0 1-2.4 1.78h-2.17a1.5 1.5 0 0 1-1.08-.45L6 16l.83-.83a1.5 1.5 0 0 1 1.77-.28l.67.34 1.23-4.05-2-1.86a1 1 0 0 1 0-1.41l.7-.7a1 1 0 0 1 1.42 0l3.48 3.24 1.46-4.81a1 1 0 0 1 .52-.64Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
