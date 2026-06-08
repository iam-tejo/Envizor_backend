"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Printer,
  Sparkles,
  Play,
  RotateCcw,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Database,
  Smile,
  Shield,
  Layers,
  ChevronUp,
  Settings,
  LayoutGrid,
  FileText,
  Activity,
  Briefcase,
  ExternalLink,
  Info
} from "lucide-react";
import confetti from "canvas-confetti";

// Slide Data Interface
interface SlideData {
  id: number;
  title: string;
  subtitle?: string;
  category: "intro" | "context" | "overview" | "pillar" | "dashboard" | "roadmap" | "conclusion";
  notes: string[];
}

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [presenterMode, setPresenterMode] = useState(false);
  const [lightTheme, setLightTheme] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "impact" | "action">("details");
  const [activePillarTab, setActivePillarTab] = useState<number>(0);
  
  // Custom dashboard state
  const [selectedDashboardKPI, setSelectedDashboardKPI] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = 10;

  // Trigger confetti on the conclusion slide or on approval
  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#db2777", "#c084fc", "#fbbf24", "#3b82f6"]
    });
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        nextSlide();
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        prevSlide();
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "p") {
        setPresenterMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentSlide]);

  // Autoplay Logic
  useEffect(() => {
    if (autoPlay) {
      autoPlayTimer.current = setInterval(() => {
        nextSlide();
      }, 7000);
    } else {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [autoPlay, currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const next = prev < totalSlides - 1 ? prev + 1 : 0;
      if (next === totalSlides - 1) {
        setTimeout(triggerConfetti, 500);
      }
      return next;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : totalSlides - 1));
  };

  const goToSlide = (idx: number) => {
    setCurrentSlide(idx);
    if (idx === totalSlides - 1) {
      setTimeout(triggerConfetti, 500);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Keep track of window resize for fullscreen listener
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Slide Presenter Notes Database
  const slidesMetadata: SlideData[] = [
    {
      id: 0,
      title: "ELC Velvet Project",
      subtitle: "SAP ECC Application Management Support",
      category: "intro",
      notes: [
        "Welcome ELC Leadership. Today we present the strategic KPI improvement roadmap.",
        "Our objective is to transition the ELC Velvet AMS project from a reactive ticket-solving service to a value-added business partner.",
        "We are introducing 10 proposals backed by deep SAP expertise to drive measurable financial and operational value."
      ]
    },
    {
      id: 1,
      title: "Strategic Diagnostic",
      subtitle: "Current AMS Challenges in SAP ECC",
      category: "context",
      notes: [
        "Analysis shows the current support model faces several friction points.",
        "Key challenges: Month-end close cycle delays, repeat tickets clogging support, and manual processes eating productivity.",
        "This slide highlights the current state pain points that motivated these 10 proposals."
      ]
    },
    {
      id: 2,
      title: "The 10 Strategic Proposals",
      subtitle: "Quad-Pillar Alignment Map",
      category: "overview",
      notes: [
        "The 10 proposals are grouped into 4 strategic pillars.",
        "Operational Excellence, Data Integrity & Proactivity, Financial & Audit Controls, and Process Automation.",
        "This ensures we tackle structural issues rather than just reacting to tickets."
      ]
    },
    {
      id: 3,
      title: "Pillar 1: Operational Excellence",
      subtitle: "Support Stabilization & Service Level Delivery",
      category: "pillar",
      notes: [
        "Covers SLA Compliance (Proposal 3), Incident Reduction (Proposal 4), and User Satisfaction (Proposal 7).",
        "We target >95% SLA and 30% reduction in repeating incidents.",
        "Key enabler: RCA Knowledge Base and proactive user training clinic."
      ]
    },
    {
      id: 4,
      title: "Pillar 2: Data Integrity & Proactive Operations",
      subtitle: "Optimizing Processing and System Diagnostics",
      category: "pillar",
      notes: [
        "Covers First-Time Right Transactions (Proposal 2), Master Data Governance (Proposal 5), and Proactive Dashboard (Proposal 10).",
        "Targeting 98% First-time-right and 40% reduction in Master Data errors.",
        "Key project: SAP automation rules to validate customer/vendor master fields at entry."
      ]
    },
    {
      id: 5,
      title: "Pillar 3: Financial & Audit Controls",
      subtitle: "Month-End Speed and Risk Compliance",
      category: "pillar",
      notes: [
        "Covers Month-End Closing Time (Proposal 1) and SoD Compliance (Proposal 8).",
        "Goal: Reduce month-end close by 20% through workflow automated postings.",
        "Ensures zero major audit observations with automated SoD checks."
      ]
    },
    {
      id: 6,
      title: "Pillar 4: Process Automation & Intelligence",
      subtitle: "Unlocking Workforce Productivity",
      category: "pillar",
      notes: [
        "Covers Manual Task Automation (Proposal 6) and Report Performance (Proposal 9).",
        "Targeting 20-30% automation of recurring report generations and validations.",
        "Optimizing critical SAP queries to guarantee 99% reporting uptime."
      ]
    },
    {
      id: 7,
      title: "Executive KPI Dashboard",
      subtitle: "Current Baselines vs Targets & Business Impact",
      category: "dashboard",
      notes: [
        "This interactive dashboard summarizes all 10 proposals.",
        "Click on any row to drill down into the baseline, target, RAG status, and direct cash/efficiency benefit.",
        "Notice the transition of critical areas from Red/Amber to solid Green."
      ]
    },
    {
      id: 8,
      title: "Value Realization Roadmap",
      subtitle: "30-60-90 Day Phased Implementation Schedule",
      category: "roadmap",
      notes: [
        "We are ready to execute immediately. The roadmap is divided into three key phases.",
        "Day 1-30 focuses on stabilization and RCA; Day 31-60 introduces automation workflows; Day 61-90 brings proactive dashboards.",
        "This guarantees steady, manageable change with immediate quick wins."
      ]
    },
    {
      id: 9,
      title: "Partnership Transformation",
      subtitle: "Securing Alignment and Approval",
      category: "conclusion",
      notes: [
        "Conclusion slide. Reiterate that this transforms AMS from a cost center into an innovation partner.",
        "Ask for leadership approval on the targets and sponsorship to kick off Phase 1 next week."
      ]
    }
  ];

  // Velvet Theme Styles Configuration
  const themeStyles = {
    bgGrad: lightTheme
      ? "bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50 text-slate-900"
      : "bg-gradient-to-br from-[#0c0512] via-[#1b0825] to-[#250d36] text-purple-100",
    cardBg: lightTheme
      ? "bg-white/85 border-purple-200/80 shadow-md shadow-purple-900/5 backdrop-blur-md"
      : "bg-[#180a22]/70 border-purple-900/50 shadow-xl shadow-black/40 backdrop-blur-md",
    textTitle: lightTheme ? "text-purple-950 font-extrabold" : "text-amber-300 font-extrabold",
    textSub: lightTheme ? "text-purple-800" : "text-purple-300",
    accentGlow: lightTheme ? "text-pink-600 bg-pink-100/60" : "text-amber-400 bg-amber-400/10 border-amber-500/20",
    badgeBg: lightTheme ? "bg-purple-100 text-purple-800 border-purple-200" : "bg-purple-950/60 text-purple-200 border-purple-800/40",
    buttonPrimary: lightTheme
      ? "bg-purple-800 text-white hover:bg-purple-900"
      : "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-[#12071a] font-bold shadow-lg shadow-amber-500/20",
    borderSubtle: lightTheme ? "border-purple-200" : "border-purple-900/40"
  };

  // Rendering Helper: Slides Carousel
  const renderSlideContent = () => {
    switch (currentSlide) {
      case 0: // Cover
        return (
          <div className="flex flex-col justify-center items-center h-full text-center px-6 md:px-12 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/20 rounded-full filter blur-[80px] animate-pulse-soft" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/20 rounded-full filter blur-[90px] animate-pulse-soft delay-1000" />
            
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="z-10"
            >
              <span className={`px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase inline-flex items-center gap-1.5 mb-6 ${themeStyles.accentGlow}`}>
                <Sparkles className="w-3.5 h-3.5" />
                ELC Velvet Project
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl md:text-6xl font-black tracking-tight z-10 max-w-4xl"
            >
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                SAP ECC AMS Transformation
              </span>
            </motion.h1>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className={`text-lg md:text-2xl font-light mt-4 max-w-2xl z-10 ${themeStyles.textSub}`}
            >
              10 Proposals to Optimize Business KPIs & Realize Operational Value
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="w-24 h-1 bg-gradient-to-r from-purple-500 to-amber-400 my-8 rounded-full z-10"
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 w-full max-w-3xl z-10 text-left"
            >
              <div className={`p-4 rounded-xl border ${themeStyles.cardBg}`}>
                <p className="text-xs text-purple-400/80 font-medium uppercase">Target Audience</p>
                <p className="text-sm font-semibold mt-1">Client Leadership (CIO/CFO)</p>
              </div>
              <div className={`p-4 rounded-xl border ${themeStyles.cardBg}`}>
                <p className="text-xs text-purple-400/80 font-medium uppercase">Scope</p>
                <p className="text-sm font-semibold mt-1">SAP ECC 6.0 EHP8</p>
              </div>
              <div className={`p-4 rounded-xl border ${themeStyles.cardBg}`}>
                <p className="text-xs text-purple-400/80 font-medium uppercase">Perspective</p>
                <p className="text-sm font-semibold mt-1">AMS Business Enabler</p>
              </div>
              <div className={`p-4 rounded-xl border ${themeStyles.cardBg}`}>
                <p className="text-xs text-purple-400/80 font-medium uppercase">Version</p>
                <p className="text-sm font-semibold mt-1">v1.2 (Executive Deck)</p>
              </div>
            </motion.div>
          </div>
        );

      case 1: // Diagnostic Context
        return (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full items-center p-4">
            <div className="md:col-span-4 flex flex-col justify-center">
              <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold uppercase mb-3 ${themeStyles.badgeBg}`}>
                Diagnostics
              </span>
              <h3 className={`text-3xl font-bold tracking-tight ${themeStyles.textTitle}`}>
                Why Transition to a Value Model?
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-purple-300/80">
                A diagnostic analysis of ELC Velvet support shows that a high percentage of business effort is lost in reactive loops. By addressing structural SAP ECC issues, we free up critical budget and workforce capacity.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Reduce Month-End Bottlenecks</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Prevent High-Volume Repeat Tickets</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Optimize User & System Interaction</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border transition-all ${themeStyles.cardBg}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm">Month-End Close Overhead</h4>
                </div>
                <p className="text-xs text-purple-300/70 mt-2 leading-normal">
                  Delays in journals and reconciliations lead to stress, extended working hours, and delayed financial reports.
                </p>
                <div className="mt-4 flex items-center justify-between text-xs font-medium">
                  <span className="text-red-400">RAG: Red</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-300">-20% Target close time</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${themeStyles.cardBg}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm">Clogged Ticket Pipeline</h4>
                </div>
                <p className="text-xs text-purple-300/70 mt-2 leading-normal">
                  The same incidents (batch crashes, interface sync failures) re-occur weekly, creating noise and delaying high-value changes.
                </p>
                <div className="mt-4 flex items-center justify-between text-xs font-medium">
                  <span className="text-orange-400">RAG: Amber</span>
                  <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-300">-30% Recurring Incidents</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${themeStyles.cardBg}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400">
                    <Database className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm">Master Data Cleanliness</h4>
                </div>
                <p className="text-xs text-purple-300/70 mt-2 leading-normal">
                  Inconsistent vendor/customer records trigger sales and billing failures, which leads to manual rework.
                </p>
                <div className="mt-4 flex items-center justify-between text-xs font-medium">
                  <span className="text-yellow-400">RAG: Amber</span>
                  <span className="px-2 py-0.5 rounded bg-yellow-500/15 text-yellow-300">40% Error reduction</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition-all ${themeStyles.cardBg}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                    <Smile className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-sm">Reactive Business Experience</h4>
                </div>
                <p className="text-xs text-purple-300/70 mt-2 leading-normal">
                  IT is viewed as a reactive support group rather than a partner. Users experience frustrations with delays.
                </p>
                <div className="mt-4 flex items-center justify-between text-xs font-medium">
                  <span className="text-red-400">RAG: Red</span>
                  <span className="px-2 py-0.5 rounded bg-green-500/15 text-green-300">CSAT Target: &gt;4.5 / 5</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 2: // Strategic Pillars Overview Map
        return (
          <div className="flex flex-col justify-center h-full p-4">
            <div className="text-center max-w-2xl mx-auto mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${themeStyles.badgeBg}`}>
                Strategic Overview
              </span>
              <h3 className={`text-3xl font-bold tracking-tight mt-2 ${themeStyles.textTitle}`}>
                Proposal Quad-Pillar Alignment Map
              </h3>
              <p className="text-xs text-purple-300/70 mt-1">
                The 10 proposals are grouped into 4 execution tracks to ensure business-focused value.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-6xl mx-auto w-full">
              {[
                {
                  title: "Pillar 1: Operational Excellence",
                  desc: "Stabilize service delivery, boost SLAs, and secure higher business satisfaction.",
                  proposals: ["3. Incident Resolution SLA", "4. Reduce Recurring Tickets", "7. User CSAT Improvements"],
                  color: "from-pink-500/25 to-purple-600/25",
                  slideIndex: 3
                },
                {
                  title: "Pillar 2: Data & Proactivity",
                  desc: "Enforce controls at entry and monitor health metrics proactively to prevent downtime.",
                  proposals: ["2. First-Time Right Processing", "5. Master Data Governance", "10. Proactive AMS Dashboard"],
                  color: "from-purple-500/25 to-indigo-600/25",
                  slideIndex: 4
                },
                {
                  title: "Pillar 3: Finance & Risk",
                  desc: "Accelerate cycle close sequences and enforce automated controls to mitigate audit findings.",
                  proposals: ["1. Reduce Month-End Time", "8. Financial Controls Compliance"],
                  color: "from-red-500/25 to-pink-600/25",
                  slideIndex: 5
                },
                {
                  title: "Pillar 4: Automation & Intel",
                  desc: "Maximize workforce efficiency by automating manual routines and optimizing report outputs.",
                  proposals: ["6. Automate Manual Actions", "9. Report Availability & Sync"],
                  color: "from-amber-500/25 to-orange-600/25",
                  slideIndex: 6
                }
              ].map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => goToSlide(p.slideIndex)}
                  className={`p-5 rounded-xl border hover:border-amber-400/70 cursor-pointer transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] ${themeStyles.cardBg} bg-gradient-to-br ${p.color}`}
                >
                  <div>
                    <h4 className="font-bold text-sm tracking-tight text-white mb-2">{p.title}</h4>
                    <p className="text-xs text-purple-200/80 leading-relaxed mb-4">{p.desc}</p>
                  </div>
                  <div>
                    <div className="h-[1px] bg-purple-950 w-full mb-3" />
                    <p className="text-[10px] font-bold tracking-wider text-amber-400 uppercase mb-1.5">Proposals Included</p>
                    <ul className="space-y-1">
                      {p.proposals.map((prop, pIdx) => (
                        <li key={pIdx} className="text-xs text-white/95 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          {prop}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3: // Pillar 1 Details
      case 4: // Pillar 2 Details
      case 5: // Pillar 3 Details
      case 6: // Pillar 4 Details
        const pillarData = [
          {
            index: 3,
            name: "Pillar 1: Operational Excellence",
            tagline: "Stabilizing Service Delivery & SLAs",
            desc: "Focuses on immediate stabilization of support SLAs, permanent incident resolution, and structured feedback mechanisms to increase overall business satisfaction.",
            proposals: [
              {
                num: "3",
                title: "Improve Incident Resolution SLA",
                challenge: "Delayed ticket resolution disrupts business continuity and affects operations.",
                action: "Build a standard Root Cause Analysis (RCA) repository, enable automated ticket routing rules in SAP, and construct user self-help modules.",
                target: "Achieve >95% SLA compliance (Baseline: ~88%)",
                metricType: "sla"
              },
              {
                num: "4",
                title: "Reduce Recurring Incidents",
                challenge: "Weekly repetition of identical batch and interface failures causes IT fatigue.",
                action: "Adopt permanent fixes for top 10 recurring issues, prioritize problem management root-cause tasks, and establish a weekly health review.",
                target: "Reduce repeat incidents by 30%",
                metricType: "repeat"
              },
              {
                num: "7",
                title: "Improve User Satisfaction (CSAT)",
                challenge: "Business users feel IT support is purely reactive and disconnected from pain points.",
                action: "Establish monthly business process clinics, conduct quarterly surveys, and host joint IT-business alignment reviews.",
                target: "Maintain CSAT score >4.5/5 (Baseline: ~3.8)",
                metricType: "csat"
              }
            ]
          },
          {
            index: 4,
            name: "Pillar 2: Data Integrity & Proactive Operations",
            tagline: "Optimizing Processing Standards & Dashboard Health",
            desc: "Ensures that data errors are prevented at the source rather than corrected after failure. Employs proactive health diagnostics to avoid business-impacting outages.",
            proposals: [
              {
                num: "2",
                title: "First-Time Right Transaction Processing",
                challenge: "Incorrect transaction inputs in SAP lead to costly rework, billing corrections, and manual fixes.",
                action: "Introduce automated fields check, configure validation warning flags, and implement brief master data quality checks.",
                target: "Improve transaction accuracy to >98%",
                metricType: "ftr"
              },
              {
                num: "5",
                title: "Master Data Governance",
                challenge: "Duplicate vendor/material codes trigger order blocks and corrupt business reports.",
                action: "Establish workflow validations to prevent duplicate entries and schedule quarterly automated data-cleansing routines.",
                target: "Reduce master data errors by 40%",
                metricType: "masterdata"
              },
              {
                num: "10",
                title: "Proactive AMS Health Dashboard",
                challenge: "IT support operates reactively—discovering crashes only when users raise high-priority tickets.",
                action: "Deploy a central dashboard tracking batch trends, RFC interfaces, background jobs, and master data exceptions in real-time.",
                target: "Proactively prevent 50% of IT incidents",
                metricType: "dashboard"
              }
            ]
          },
          {
            index: 5,
            name: "Pillar 3: Financial & Audit Controls",
            tagline: "Accelerating Month-End & Restricting Risk Exposure",
            desc: "Focuses on the financial core, enabling faster book closing for the CFO and ensuring complete compliance with segregation of duty audits.",
            proposals: [
              {
                num: "1",
                title: "Reduce Month-End Closing Cycle Time",
                challenge: "Manual financial reconciliations and slow batch runs delay closing deadlines.",
                action: "Automate recurring journal uploads, pre-schedule reconciliation jobs, and set automated alerts on month-end batch queues.",
                target: "Reduce month-end close cycle time by 20%",
                metricType: "monthend"
              },
              {
                num: "8",
                title: "Enhance Financial Controls Compliance",
                challenge: "Potential audit exposure due to manual reviews and Segregation of Duties (SoD) violations.",
                action: "Enforce automated workflow routing, implement quarterly automated SoD scans, and standardize audit trail logs.",
                target: "Zero major audit observations",
                metricType: "audit"
              }
            ]
          },
          {
            index: 6,
            name: "Pillar 4: Process Automation & Intelligence",
            tagline: "Workforce Productivity & Report Tuning",
            desc: "Maximizes the output of business teams by replacing manual, spreadsheet-driven processes with automated system runs and optimized SAP queries.",
            proposals: [
              {
                num: "6",
                title: "Increase Manual Activity Automation",
                challenge: "Workforce wastes hours on manual spreadsheet consolidation and report distributions.",
                action: "Convert manual reports to scheduled background jobs, configure auto-email triggers, and design SAP workflow approvals.",
                target: "Automate 20-30% of manual routines",
                metricType: "automation"
              },
              {
                num: "9",
                title: "Improve Report Availability & Sync",
                challenge: "Heavy customized SAP queries lock tables, causing report timeouts and data mismatch.",
                action: "Conduct performance query tuning, index heavy database tables, and establish an automated reconciliation engine.",
                target: "Achieve 99% report availability",
                metricType: "reporting"
              }
            ]
          }
        ];

        const activePillar = pillarData[currentSlide - 3];

        return (
          <div className="flex flex-col h-full p-4 justify-between">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-4 border-b pb-3 border-purple-900/30">
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${themeStyles.badgeBg}`}>
                  {activePillar.name}
                </span>
                <h3 className={`text-2xl font-bold tracking-tight mt-1 ${themeStyles.textTitle}`}>
                  {activePillar.tagline}
                </h3>
              </div>
              <p className="text-xs text-purple-300/70 max-w-md md:text-right leading-snug">
                {activePillar.desc}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow items-center">
              {activePillar.proposals.map((prop, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border h-full flex flex-col justify-between transition-all duration-300 relative ${themeStyles.cardBg} hover:scale-[1.01] hover:border-amber-400/50`}
                >
                  <div className="absolute top-2.5 right-3 text-3xl font-extrabold text-purple-800/20">
                    #{prop.num}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white pr-6 mb-2">{prop.title}</h4>
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-pink-400 block">Challenge</span>
                        <p className="text-xs text-purple-200/80 leading-normal">{prop.challenge}</p>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">Proposed Action</span>
                        <p className="text-xs text-purple-200/80 leading-normal">{prop.action}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-900/30">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-1">Target Benefit</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{prop.target}</span>
                      
                      {/* Mini visual indicators based on metricType */}
                      {prop.metricType === "sla" && (
                        <div className="w-12 h-6 flex items-end gap-1">
                          <div className="w-3 h-3 bg-purple-700 rounded-sm"></div>
                          <div className="w-3 h-4 bg-purple-500 rounded-sm"></div>
                          <div className="w-3 h-5 bg-emerald-400 rounded-sm animate-pulse"></div>
                        </div>
                      )}
                      {prop.metricType === "repeat" && (
                        <div className="flex items-center text-xs text-emerald-400 font-bold gap-0.5">
                          <TrendingUp className="w-3 h-3 rotate-180" /> -30%
                        </div>
                      )}
                      {prop.metricType === "csat" && (
                        <div className="flex items-center text-amber-300 font-bold text-xs">
                          ★ 4.5
                        </div>
                      )}
                      {prop.metricType === "ftr" && (
                        <div className="text-xs font-extrabold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">
                          98%
                        </div>
                      )}
                      {prop.metricType === "masterdata" && (
                        <div className="flex items-center text-xs text-emerald-400 font-bold gap-0.5">
                          <TrendingUp className="w-3 h-3 rotate-180" /> -40%
                        </div>
                      )}
                      {prop.metricType === "dashboard" && (
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                      )}
                      {prop.metricType === "monthend" && (
                        <div className="flex items-center text-emerald-400 font-bold text-xs gap-1">
                          <Clock className="w-3.5 h-3.5" /> -20%
                        </div>
                      )}
                      {prop.metricType === "audit" && (
                        <div className="text-xs font-extrabold text-emerald-400 uppercase">
                          Zero Risk
                        </div>
                      )}
                      {prop.metricType === "automation" && (
                        <div className="text-xs font-extrabold text-emerald-400">
                          +30%
                        </div>
                      )}
                      {prop.metricType === "reporting" && (
                        <div className="text-xs font-extrabold text-emerald-400">
                          99% Sync
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Custom interactive dashboard preview inside the pillar */}
            {currentSlide === 3 && (
              <div className={`mt-3 p-3 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4 ${themeStyles.cardBg}`}>
                <div className="flex items-center gap-3">
                  <Activity className="w-8 h-8 text-pink-500 animate-pulse" />
                  <div>
                    <h5 className="text-xs font-bold text-white">SLA Optimizer Simulation</h5>
                    <p className="text-[10px] text-purple-300/70">Check target SLA shift under Proposal 3 actions</p>
                  </div>
                </div>
                
                <div className="flex gap-4 items-center">
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-bold text-purple-400">Current Baseline</span>
                    <p className="text-sm font-extrabold text-red-400">88.2%</p>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] uppercase font-bold text-purple-400">Stabilized Target</span>
                    <p className="text-sm font-extrabold text-emerald-400">&gt;95.0%</p>
                  </div>
                  
                  {/* Gauge representation */}
                  <div className="w-24 bg-purple-950 h-2.5 rounded-full overflow-hidden border border-purple-800/40 relative">
                    <div className="bg-red-400 h-full absolute left-0" style={{ width: "88%" }} />
                    <div className="bg-emerald-400 h-full absolute left-0 animate-pulse" style={{ width: "95%" }} />
                  </div>
                </div>
              </div>
            )}

            {currentSlide === 5 && (
              <div className={`mt-3 p-3 rounded-lg border flex flex-col md:flex-row items-center justify-between gap-4 ${themeStyles.cardBg}`}>
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-pink-500" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Month-End Close Simulation</h5>
                    <p className="text-[10px] text-purple-300/70">Projected savings in Days (Proposal 1)</p>
                  </div>
                </div>
                
                <div className="flex gap-6 items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-3 bg-red-500/80 rounded" />
                    <div>
                      <span className="text-[9px] text-purple-400 uppercase block leading-none">Manual</span>
                      <span className="text-xs font-extrabold text-red-300">5.2 Days</span>
                    </div>
                  </div>
                  
                  <div className="text-purple-500 font-bold">➔</div>

                  <div className="flex items-center gap-2">
                    <div className="h-6 w-3 bg-emerald-500 rounded animate-bounce" />
                    <div>
                      <span className="text-[9px] text-purple-400 uppercase block leading-none">Automated</span>
                      <span className="text-xs font-extrabold text-emerald-300">4.1 Days</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 7: // Leadership-Level KPI Dashboard Summary
        const kpiList = [
          { area: "Incident SLA", current: "88.2%", target: ">95% SLA", status: "Red", targetStatus: "Green", proposal: "3. Incident SLA Resolution Compliance", driver: "SLA compliance maintains customer trust and meets business continuity expectations." },
          { area: "Repeat Tickets", current: "High Volume", target: "-30%", status: "Amber", targetStatus: "Green", proposal: "4. Incident Root Cause Correction & Problem Mgmt", driver: "Reducing tickets cuts operations waste and allows engineers to focus on innovations." },
          { area: "User Satisfaction", current: "3.8/5", target: ">4.5/5", status: "Red", targetStatus: "Green", proposal: "7. Dedicated CSAT reviews and business clinics", driver: "A closer relationship turns IT into a growth partner rather than a cost point." },
          { area: "Month-End Close", current: "5.2 Days", target: "-20% Time", status: "Red", targetStatus: "Green", proposal: "1. Automation of recurring journal postings", driver: "Speeds up financial reporting and enables faster commercial decisions." },
          { area: "Automation", current: "Manual Heavy", target: "+30%", status: "Amber", targetStatus: "Green", proposal: "6. Standard SAP Background jobs & Query distribution", driver: "Removes human errors and redirects operations bandwidth." },
          { area: "Master Data", current: "Data Gaps", target: "-40% Errors", status: "Amber", targetStatus: "Green", proposal: "5. Duplicate checks and validation rules in SAP", driver: "Increases invoicing accuracy and reduces supply chain order blockages." },
          { area: "Audit Compliance", current: "Manual Audits", target: "Zero Findings", status: "Amber", targetStatus: "Green", proposal: "8. Continuous automated SoD compliance scans", driver: "Protects business licenses and ensures regulatory compliance." },
          { area: "Reporting", current: "Slow Queries", target: "99% Availability", status: "Amber", targetStatus: "Green", proposal: "9. SAP database index tuning & query optimization", driver: "Ensures reporting matches live records for timely executive analysis." },
          { area: "First-Time Right", current: "Rework Cost", target: ">98% Accuracy", status: "Red", targetStatus: "Green", proposal: "2. Input validation warnings and key field constraints", driver: "Minimizes financial reconciliation cycle and shipping rework costs." },
          { area: "Proactive Health", current: "Reactive Alerts", target: "50% Prevention", status: "Red", targetStatus: "Green", proposal: "10. Live SAP Technical Health Monitoring Dashboard", driver: "Detects RFC and batch job failures before they affect the end customer." }
        ];

        return (
          <div className="flex flex-col h-full p-4 justify-between">
            <div className="mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${themeStyles.badgeBg}`}>
                KPI Alignment
              </span>
              <h3 className={`text-2xl font-bold tracking-tight mt-1 ${themeStyles.textTitle}`}>
                Leadership KPI Dashboard Summary
              </h3>
              <p className="text-xs text-purple-300/70 mt-0.5">
                Baseline status vs Targets. Click on a row to review the enabling action and value drivers.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch flex-grow overflow-hidden">
              <div className="lg:col-span-2 overflow-y-auto max-h-[300px] lg:max-h-[380px] border border-purple-900/30 rounded-xl pr-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-purple-900/40 text-purple-400 font-semibold bg-[#12071a]/40 sticky top-0 backdrop-blur">
                      <th className="py-2 px-3">KPI Area</th>
                      <th className="py-2 px-3">Current Focus</th>
                      <th className="py-2 px-3">RAG</th>
                      <th className="py-2 px-3">Improvement Target</th>
                      <th className="py-2 px-3">Target RAG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kpiList.map((kpi, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedDashboardKPI(idx)}
                        className={`border-b border-purple-950/30 cursor-pointer hover:bg-purple-950/20 transition-all ${
                          selectedDashboardKPI === idx ? "bg-purple-900/35 border-l-2 border-l-amber-400 pl-2" : ""
                        }`}
                      >
                        <td className="py-2 px-3 font-bold text-white">{kpi.area}</td>
                        <td className="py-2 px-3 text-purple-200/90">{kpi.current}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            kpi.status === "Red" ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                          }`}>
                            {kpi.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-emerald-300">{kpi.target}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                            {kpi.targetStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Dynamic Detail Card */}
              <div className="flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {selectedDashboardKPI !== null ? (
                    <motion.div
                      key={selectedDashboardKPI}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`p-4 rounded-xl border h-full flex flex-col justify-between ${themeStyles.cardBg}`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-purple-950/50 mb-3">
                          <h4 className="font-bold text-sm text-white">
                            {kpiList[selectedDashboardKPI].area} Details
                          </h4>
                          <span className="text-[10px] font-bold text-amber-400 px-2 py-0.5 bg-amber-400/10 rounded border border-amber-400/20">
                            Proposal #{selectedDashboardKPI + 1}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">Enabling Action</span>
                            <p className="text-xs text-white leading-normal mt-0.5">
                              {kpiList[selectedDashboardKPI].proposal}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider block">Value Driver</span>
                            <p className="text-xs text-purple-200/80 leading-normal mt-0.5">
                              {kpiList[selectedDashboardKPI].driver}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-purple-950/50 flex items-center justify-between text-xs">
                        <span className="text-purple-300">Target Metric:</span>
                        <span className="font-bold text-emerald-300">{kpiList[selectedDashboardKPI].target}</span>
                      </div>
                    </motion.div>
                  ) : (
                    <div className={`p-6 rounded-xl border border-dashed border-purple-800/40 h-full flex flex-col justify-center items-center text-center ${themeStyles.cardBg}`}>
                      <Info className="w-8 h-8 text-purple-500 mb-2 animate-bounce" />
                      <p className="text-xs text-purple-300">Click on any KPI row in the dashboard to drill down into the detail view, core enabling actions, and executive value drivers.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        );

      case 8: // Value Realization Roadmap (30-60-90 Day)
        return (
          <div className="flex flex-col h-full p-4 justify-between">
            <div className="mb-4">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${themeStyles.badgeBg}`}>
                Timeline
              </span>
              <h3 className={`text-2xl font-bold tracking-tight mt-1 ${themeStyles.textTitle}`}>
                Value Realization Roadmap
              </h3>
              <p className="text-xs text-purple-300/70 mt-0.5">
                Phased 90-day implementation plan designed to secure early wins while rolling out automated data & dashboard controls.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch flex-grow">
              {[
                {
                  phase: "Days 1 - 30",
                  title: "Foundation & Stabilization",
                  color: "border-pink-500/50 bg-gradient-to-b from-[#1b0825]/40 to-pink-950/15",
                  bullets: [
                    "Implement central RCA Knowledge Base repository.",
                    "Establish ticket categorization rules in SAP.",
                    "Kick off monthly user process training clinics.",
                    "Deliver initial master data cleansing cycles."
                  ],
                  milestone: "Milestone: Ticket queue stabilized, SLA compliance hits 92%."
                },
                {
                  phase: "Days 31 - 60",
                  title: "Automation & Risk Checks",
                  color: "border-purple-500/50 bg-gradient-to-b from-[#1b0825]/40 to-purple-950/15",
                  bullets: [
                    "Automate key journal entries upload & scheduling.",
                    "Configure validation check warnings on material input screens.",
                    "Establish automated daily Segregation of Duties scans.",
                    "Configure automated month-end reconciliation jobs."
                  ],
                  milestone: "Milestone: Month-end close speed improved by -10%."
                },
                {
                  phase: "Days 61 - 90",
                  title: "Proactive Health & Optimizations",
                  color: "border-amber-500/50 bg-gradient-to-b from-[#1b0825]/40 to-amber-950/10",
                  bullets: [
                    "Deploy Proactive AMS Health Monitoring Dashboard.",
                    "Perform index performance tuning on heavy query tables.",
                    "Automate duplicate prevention validations in master records.",
                    "Standardize custom management reports catalog."
                  ],
                  milestone: "Milestone: 50% proactive incident prevention achieved."
                }
              ].map((p, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between relative hover:scale-[1.01] transition-all duration-350 ${p.color} ${themeStyles.cardBg}`}
                >
                  <div>
                    <div className="flex justify-between items-center pb-2 border-b border-purple-900/20 mb-3">
                      <span className="text-xs font-extrabold text-amber-300 tracking-wider uppercase">{p.phase}</span>
                      <span className="text-[10px] text-purple-400 font-bold uppercase">Phase {idx + 1}</span>
                    </div>
                    <h4 className="font-bold text-sm text-white mb-3">{p.title}</h4>
                    <ul className="space-y-2">
                      {p.bullets.map((bullet, bIdx) => (
                        <li key={bIdx} className="text-xs text-purple-200/90 leading-relaxed flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-950/60">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">Success Metric</span>
                    <p className="text-xs font-semibold text-white">{p.milestone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 9: // Conclusion & Partnership Transformation
        return (
          <div className="flex flex-col justify-center items-center h-full text-center px-4 relative overflow-hidden">
            <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full filter blur-[100px] animate-pulse-soft" />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="z-10"
            >
              <span className={`px-3.5 py-1 rounded-full border text-xs font-semibold uppercase inline-flex items-center gap-1.5 mb-6 ${themeStyles.accentGlow}`}>
                <Briefcase className="w-3.5 h-3.5" />
                Partnership Transformation
              </span>
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-3xl md:text-5xl font-black max-w-3xl leading-tight"
            >
              Transitioning from Support SLA to Business Value Realization
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-sm md:text-lg text-purple-200/80 max-w-2xl mt-4 leading-relaxed"
            >
              By aligning these 10 proposals, we move the ELC Velvet AMS engagement out of reactive maintenance and into proactive innovation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-4xl text-left"
            >
              <div className={`p-4 rounded-xl border ${themeStyles.cardBg}`}>
                <h4 className="font-bold text-sm text-white mb-1.5">Action Plan Approval</h4>
                <p className="text-xs text-purple-300/80 leading-normal">Confirm targets and alignment for early SLA stabilization tracks (Pillar 1).</p>
              </div>
              <div className={`p-4 rounded-xl border ${themeStyles.cardBg}`}>
                <h4 className="font-bold text-sm text-white mb-1.5">Approve POC Funding</h4>
                <p className="text-xs text-purple-300/80 leading-normal">Authorize Phase 2 development for month-end journal and workflow automation.</p>
              </div>
              <div className={`p-4 rounded-xl border ${themeStyles.cardBg}`}>
                <h4 className="font-bold text-sm text-white mb-1.5">Data Governance</h4>
                <p className="text-xs text-purple-300/80 leading-normal">Formulate joint Master Data governance board to sustain system accuracy gains.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 z-10 flex gap-4"
            >
              <button
                onClick={triggerConfetti}
                className={`px-6 py-2.5 rounded-lg text-sm transition-all duration-300 ${themeStyles.buttonPrimary}`}
              >
                Approve KPI Improvement Proposals
              </button>
            </motion.div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${themeStyles.bgGrad}`} ref={containerRef}>
      
      {/* HEADER CONTROL BAR (Hides on standard print mode) */}
      <header className={`px-4 py-3 flex items-center justify-between border-b print:hidden ${themeStyles.borderSubtle} bg-[#0c0512]/60 backdrop-blur-md z-30`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center font-black text-white text-sm tracking-wider">
            EV
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight leading-none">ELC Velvet KPI Improvement</h1>
            <p className="text-[10px] text-purple-300/80 mt-0.5">SAP ECC AMS Executive Review</p>
          </div>
        </div>

        {/* Global Toolbar Options */}
        <div className="flex items-center gap-3">
          {/* Autoplay toggle */}
          <button
            onClick={() => setAutoPlay((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              autoPlay 
                ? "bg-amber-400 text-[#12071a] border-amber-400" 
                : "border-purple-800/40 text-purple-300 hover:bg-purple-950/40"
            }`}
            title="Toggle Autoplay (7s)"
          >
            {autoPlay ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Auto</span>
          </button>

          {/* Theme switcher */}
          <button
            onClick={() => setLightTheme((prev) => !prev)}
            className="p-1.5 rounded-lg border border-purple-800/40 text-purple-300 hover:bg-purple-950/40 transition-all flex items-center gap-1 text-xs"
            title="Toggle theme"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lightTheme ? "Velvet Dark" : "Gold Cream"}</span>
          </button>

          {/* Presenter Mode */}
          <button
            onClick={() => setPresenterMode((prev) => !prev)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
              presenterMode 
                ? "bg-purple-700 text-white border-purple-600" 
                : "border-purple-800/40 text-purple-300 hover:bg-purple-950/40"
            }`}
            title="Toggle Speaker Notes"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Presenter Notes</span>
          </button>

          {/* Print / Save to PDF */}
          <button
            onClick={handlePrint}
            className="p-1.5 rounded-lg border border-purple-800/40 text-purple-300 hover:bg-purple-950/40 transition-all flex items-center gap-1 text-xs"
            title="Print Slide-deck to PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-purple-800/40 text-purple-300 hover:bg-purple-950/40 transition-all"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* MAIN CAROUSEL PANEL & PRESENTER NOTES */}
      <main className="flex-grow flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* Slide Canvas Wrapper */}
        <div className="flex-grow flex flex-col justify-between p-6 md:p-10 relative overflow-hidden h-full">
          
          {/* Active slide display with AnimatePresence */}
          <div className="flex-grow flex flex-col justify-center h-full max-w-6xl mx-auto w-full relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50, scale: 0.99 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, scale: 0.99 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="h-full w-full"
              >
                {renderSlideContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CONTROLLER DOCK (Hides on standard print mode) */}
          <footer className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4 border-purple-900/20 z-20 print:hidden">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-[#12071a]/60 px-3 py-1 rounded-lg border border-purple-800/30">
                <button
                  onClick={prevSlide}
                  className="p-1 text-purple-300 hover:text-white transition-all"
                  title="Previous Slide (ArrowLeft)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-white px-2">
                  Slide {currentSlide + 1} of {totalSlides}
                </span>
                <button
                  onClick={nextSlide}
                  className="p-1 text-purple-300 hover:text-white transition-all"
                  title="Next Slide (ArrowRight)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Dropdown navigation map */}
              <select
                value={currentSlide}
                onChange={(e) => goToSlide(Number(e.target.value))}
                className="bg-[#12071a]/60 text-xs text-white border border-purple-800/30 rounded-lg py-1 px-2 focus:outline-none"
              >
                {slidesMetadata.map((meta, idx) => (
                  <option key={idx} value={idx}>
                    Slide {idx + 1}: {meta.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Micro progress bar */}
            <div className="w-full sm:w-64 flex items-center gap-3">
              <div className="h-1 bg-purple-950 rounded-full flex-grow overflow-hidden border border-purple-900/30">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-purple-400 font-bold">
                {Math.round(((currentSlide + 1) / totalSlides) * 100)}% Complete
              </span>
            </div>
          </footer>
        </div>

        {/* PRESENTER SPEAKER NOTES SIDE BAR */}
        <AnimatePresence>
          {presenterMode && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "24rem", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="border-t lg:border-t-0 lg:border-l border-purple-900/40 bg-[#0c0512]/80 backdrop-blur-lg flex-shrink-0 flex flex-col justify-between overflow-hidden print:hidden z-20"
            >
              <div className="p-6 overflow-y-auto flex-grow">
                <div className="flex items-center justify-between pb-3 border-b border-purple-900/30 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Presenter Notes</h3>
                  </div>
                  <span className="text-[10px] bg-purple-900/40 border border-purple-800/30 text-purple-300 font-bold px-2 py-0.5 rounded">
                    Slide {currentSlide + 1}
                  </span>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold text-amber-400/80 uppercase">Executive Talking Points:</h4>
                  <ul className="space-y-3.5">
                    {slidesMetadata[currentSlide].notes.map((note, idx) => (
                      <li key={idx} className="text-xs text-purple-200/95 leading-relaxed bg-[#12071a]/40 p-3 rounded-lg border border-purple-900/30 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-purple-900/60 text-purple-300 font-extrabold text-[10px] flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Presenter Footer Status */}
              <div className="p-4 bg-[#12071a] border-t border-purple-900/30 text-[10px] text-purple-400 font-semibold flex items-center justify-between">
                <span>Presenter Mode Active</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Sync Connected
                </span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </main>

      {/* PRINT-ONLY CSS RULES (Enables clean 16:9 PDF export of all slides) */}
      <style jsx global>{`
        @media print {
          /* Hide non-presentation UI components */
          header, footer, aside, button, select {
            display: none !important;
          }
          
          /* Fullscreen page-break layout */
          html, body, div#__next, main {
            background: #0c0512 !important;
            color: #ffffff !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          
          /* Force page break for each slide */
          .slide-print-card {
            page-break-after: always;
            height: 100vh !important;
            width: 100vw !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 2rem !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}
