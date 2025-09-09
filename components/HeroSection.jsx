
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, Bell, Sparkles } from "lucide-react";
import { useTheme } from "./ui/Theme";
import AppLogo from "./AppLogo";
import { BRAND_LOGO_URL } from "./brand";

export default function HeroSection() {
  const { t, language } = useTheme();

  return (
    <div className="neumorphic-inset p-8 md:p-16 rounded-3xl text-center relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,179,66,0.08)] via-transparent to-[rgba(124,179,66,0.15)] pointer-events-none"></div>
        
        {/* Subtle logo watermark - official logo, centered, non-overlapping */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <AppLogo
            src={BRAND_LOGO_URL}
            className="w-auto h-[36vh] max-h-[320px] opacity-[0.08] dark:opacity-[0.04]"
            title=""
            alt="Background Logo"
            style={{ filter: 'grayscale(100%) contrast(1.05) brightness(1.05)' }}
          />
        </div>

        {/* Subtle CTA animation styles */}
        <style>{`
          @keyframes ctaPulse {
            0%, 100% { transform: translateY(0) scale(1); box-shadow: 6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light); }
            50% { transform: translateY(-1px) scale(1.02); box-shadow: 10px 10px 18px var(--shadow-dark), -10px -10px 18px var(--shadow-light); }
          }
          @keyframes ctaGlow {
            0%, 100% { opacity: .18; transform: scale(.99); }
            50% { opacity: .36; transform: scale(1.02); }
          }
          @media (prefers-reduced-motion: reduce) {
            .ai-cta { animation: none !important; }
            .ai-cta::after { animation: none !important; }
          }
          .ai-cta {
            position: relative;
            animation: ctaPulse 3.4s ease-in-out infinite;
            will-change: transform, box-shadow, filter;
            background: linear-gradient(135deg, rgba(139,92,246,.18), rgba(124,179,66,.18));
            border: 1px solid rgba(139,92,246,.25);
          }
          .ai-cta::after {
            content: "";
            position: absolute;
            inset: -3px;
            border-radius: 14px;
            pointer-events: none;
            box-shadow: 0 0 0 2px rgba(139,92,246,.35);
            animation: ctaGlow 3.4s ease-in-out infinite;
          }
        `}</style>

        <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-extrabold service-title mb-2">
                {t.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-secondary max-w-3xl mx-auto mb-4">{t.heroDescription}</p>

            <div className="flex flex-wrap justify-center gap-4">
                <Link to={createPageUrl("EconomicCalendar")} className="neumorphic-button px-8 py-4 font-bold rounded-xl text-lg flex items-center gap-3 transition-transform hover:scale-105" style={{ backgroundColor: '#7cb342', color: 'white' }}>
                    <Calendar className="w-6 h-6" />
                    <span>{t.economicCalendar}</span>
                </Link>
                <Link to={createPageUrl("Alerts")} className="neumorphic-button px-8 py-4 font-bold rounded-xl text-lg flex items-center gap-3 transition-transform hover:scale-105">
                    <Bell className="w-6 h-6" />
                    <span>{t.alerts}</span>
                </Link>
                {/* AI Assistant CTA with subtle animation */}
                <Link
                  to={createPageUrl("AIAssistant")}
                  className="neumorphic-button ai-cta px-8 py-4 font-bold rounded-xl text-lg flex items-center gap-3 transition-transform"
                  title={language === 'ar' ? 'مساعد الذكاء الاصطناعي' : 'AI Assistant'}
                >
                  <Sparkles className="w-6 h-6" />
                  <span>{language === 'ar' ? 'مساعد الذكاء الاصطناعي' : 'AI Assistant'}</span>
                </Link>
            </div>
        </div>
    </div>
  );
}
