import React, { forwardRef } from "react";
import { Badge as UIBadge } from "@/components/ui/badge";

export interface CertificateBadge {
  name: string;
  description: string;
  icon?: string;
}

export interface AdultCertificateData {
  id: string;
  certificateId: string;
  title: string;
  recipientName: string;
  schoolName?: string;
  type: "course" | "level" | "program";
  dateEarned: string;
  citation?: string;
  questsExplored?: string[];
  badges?: CertificateBadge[];
  verificationUrl?: string;
}

interface AdultCertificateTemplateProps {
  data: AdultCertificateData;
  scale?: number;
}

export const AdultCertificateTemplate = forwardRef<HTMLDivElement, AdultCertificateTemplateProps>(
  ({ data, scale = 1 }, ref) => {
    const formattedDate = data.dateEarned
      ? new Date(data.dateEarned).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

    const questsText = data.questsExplored && data.questsExplored.length > 0
      ? data.questsExplored.join(" · ")
      : "Unplugged Logic Games · Pattern Recognition · Robot Sequence";

    const defaultCitation =
      data.citation ||
      `for active participation, enthusiastic problem-solving, and adventurous teamwork during the ${
        data.title || "Codesrock Level 1"
      } Computational Thinking Quests!`;

    return (
      <div
        ref={ref}
        id="adult-certificate-container"
        className="relative bg-white text-slate-900 overflow-hidden font-sans shadow-2xl select-none"
        style={{
          width: "1050px",
          height: "742px", // Standard A4 landscape ratio
          boxSizing: "border-box",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top left",
        }}
      >
        {/* Top-Left Corner Decorative Waves */}
        <div className="absolute top-0 left-0 w-72 h-72 pointer-events-none z-0">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path
              d="M0,0 L200,0 C150,60 120,120 0,160 Z"
              fill="#5D3B98"
              opacity="0.9"
            />
            <path
              d="M0,0 L160,0 C120,50 80,100 0,130 Z"
              fill="#46C5D5"
              opacity="0.95"
            />
            <path
              d="M0,0 L120,0 C90,40 50,80 0,100 Z"
              fill="#FF7340"
              opacity="0.95"
            />
            <path
              d="M0,0 L80,0 C60,25 30,50 0,65 Z"
              fill="#FDC82F"
              opacity="0.9"
            />
          </svg>
          {/* Dot Grid Accent */}
          <div className="absolute top-6 left-28 grid grid-cols-4 gap-1.5 opacity-60">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            ))}
          </div>
        </div>

        {/* Top-Right Corner Decorative Waves */}
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none z-0">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path
              d="M200,0 L0,0 C50,60 80,120 200,160 Z"
              fill="#22C55E"
              opacity="0.85"
            />
            <path
              d="M200,0 L40,0 C80,50 120,100 200,130 Z"
              fill="#FDC82F"
              opacity="0.9"
            />
            <path
              d="M200,0 L80,0 C110,40 150,80 200,100 Z"
              fill="#46C5D5"
              opacity="0.95"
            />
          </svg>
          {/* Dot Grid Accent */}
          <div className="absolute top-8 right-24 grid grid-cols-4 gap-1.5 opacity-60">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            ))}
          </div>
        </div>

        {/* Bottom-Left Corner Decorative Waves */}
        <div className="absolute bottom-0 left-0 w-72 h-72 pointer-events-none z-0">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path
              d="M0,200 L200,200 C150,140 120,80 0,40 Z"
              fill="#22C55E"
              opacity="0.85"
            />
            <path
              d="M0,200 L160,200 C120,150 80,100 0,70 Z"
              fill="#46C5D5"
              opacity="0.95"
            />
            <path
              d="M0,200 L110,200 C80,160 40,120 0,90 Z"
              fill="#5D3B98"
              opacity="0.9"
            />
          </svg>
          <div className="absolute bottom-6 left-6 grid grid-cols-4 gap-1.5 opacity-60">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
            ))}
          </div>
        </div>

        {/* Bottom-Right Corner Decorative Waves */}
        <div className="absolute bottom-0 right-0 w-72 h-72 pointer-events-none z-0">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path
              d="M200,200 L0,200 C50,140 80,80 200,40 Z"
              fill="#FF7340"
              opacity="0.9"
            />
            <path
              d="M200,200 L40,200 C80,150 120,100 200,70 Z"
              fill="#5D3B98"
              opacity="0.95"
            />
            <path
              d="M200,200 L90,200 C120,160 160,120 200,100 Z"
              fill="#FDC82F"
              opacity="0.9"
            />
          </svg>
          <div className="absolute bottom-6 right-6 grid grid-cols-4 gap-1.5 opacity-60">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />
            ))}
          </div>
        </div>

        {/* Top Decorative Dots Header Bar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
        </div>

        {/* Rocky 3D Mascot - Standing / Clapping Pose on Right Side */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 z-20 pointer-events-none drop-shadow-2xl">
          <img
            src="/rocky_celebration_pose.png"
            alt="Rocky 3D Mascot"
            className="w-56 h-auto object-contain transition-transform duration-300"
            onError={(e) => {
              // Fallback to secondary Rocky asset if primary fails
              (e.target as HTMLImageElement).src = "/assets/rocky/celebration-transparent.webp";
            }}
          />
        </div>

        {/* Certificate Main Body Content Container */}
        <div className="relative z-10 h-full flex flex-col justify-between p-12 pr-64 text-center">
          {/* Header Section */}
          <div className="space-y-2 mt-4">
            <h1 className="text-4xl font-extrabold tracking-tight text-emerald-600 uppercase font-sans">
              CERTIFICATE
            </h1>
            <p className="text-xl font-semibold tracking-widest text-indigo-900 uppercase">
              OF {data.type === "level" ? "EXCELLENCE" : "PARTICIPATION"}
            </p>

            {/* Logo & Level Lockup */}
            <div className="flex flex-col items-center justify-center my-3">
              <div className="flex items-center gap-2 bg-purple-900/5 px-4 py-1.5 rounded-full border border-purple-900/10 shadow-sm">
                <span className="text-2xl">🚀</span>
                <span className="font-extrabold text-lg text-purple-950 tracking-wider">
                  CODESROCK
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-400 text-purple-950 uppercase tracking-wide">
                  {data.title || "LEVEL 1 QUEST"}
                </span>
              </div>
            </div>

            <p className="text-sm font-medium text-slate-600 tracking-wide mt-1">
              Proudly Presented to
            </p>
          </div>

          {/* Recipient Name */}
          <div className="my-2">
            <h2 className="text-4xl font-black text-purple-900 tracking-wide uppercase font-serif border-b-2 border-slate-300 pb-2 inline-block px-12">
              {data.recipientName}
            </h2>
          </div>

          {/* Citation & Quests Explored */}
          <div className="space-y-3 px-8">
            <p className="text-base text-slate-700 font-medium leading-relaxed max-w-2xl mx-auto">
              {defaultCitation}
            </p>

            <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/80 rounded-lg p-2 max-w-xl mx-auto">
              <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Quests Explored
              </p>
              <p className="text-sm font-semibold text-teal-700 mt-0.5">
                {questsText}
              </p>
            </div>
          </div>

          {/* Badge & Crest Section */}
          <div className="flex items-center justify-center gap-6 my-3">
            {data.badges && data.badges.length > 0 ? (
              data.badges.map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center max-w-[150px]">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-2xl shadow-md">
                    {badge.icon || "🏅"}
                  </div>
                  <span className="text-xs font-bold text-purple-900 mt-1 uppercase text-center line-clamp-1">
                    {badge.name}
                  </span>
                  <span className="text-[10px] text-slate-500 text-center line-clamp-1">
                    {badge.description}
                  </span>
                </div>
              ))
            ) : (
              /* Default Gold Seal Badge */
              <div className="relative flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-1 shadow-lg flex items-center justify-center">
                  <div className="w-full h-full rounded-full border-2 border-dashed border-amber-800/40 flex flex-col items-center justify-center text-center p-1 bg-amber-400/90">
                    <span className="text-xs font-black text-amber-950 uppercase tracking-tighter">
                      CODESROCK
                    </span>
                    <span className="text-[9px] font-extrabold text-amber-900 uppercase">
                      LABS
                    </span>
                    <span className="text-[8px] italic text-amber-950">
                      Honoris Causa
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-2 bg-amber-500 text-amber-950 text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                  STEM COACH
                </div>
              </div>
            )}

            {/* School affiliation tag if present */}
            {data.schoolName && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold shadow-md border-2 border-white">
                  🏫
                </div>
                <span className="text-xs font-bold text-slate-700 mt-1">
                  {data.schoolName}
                </span>
              </div>
            )}
          </div>

          {/* Signatures Section */}
          <div className="grid grid-cols-2 gap-12 px-12 mb-2">
            {/* Signature 1: Course Director */}
            <div className="flex flex-col items-center space-y-1">
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic text-2xl text-indigo-900 tracking-wide font-bold">
                  Ellen Hall
                </span>
              </div>
              <div className="w-48 border-t border-slate-400" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Codesrock School Representative
              </p>
              <p className="text-[10px] text-slate-700 font-semibold">
                & Quality Lead · Course Director
              </p>
              <p className="text-xs font-bold text-purple-900">
                Ellen Swatson Hall
              </p>
            </div>

            {/* Signature 2: Education Director */}
            <div className="flex flex-col items-center space-y-1">
              <div className="h-10 flex items-end justify-center">
                <span className="font-serif italic text-2xl text-purple-950 tracking-wide font-bold">
                  Triumph Tetteh
                </span>
              </div>
              <div className="w-48 border-t border-slate-400" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Director, Codesrock Education
              </p>
              <p className="text-xs font-bold text-purple-900 pt-3">
                Triumph Tetteh
              </p>
            </div>
          </div>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
            <div>
              <span>Date Earned: </span>
              <span className="font-bold text-slate-700">{formattedDate}</span>
            </div>
            <div>
              <span className="font-semibold">Verify at: </span>
              <span className="font-mono text-purple-900 font-bold">
                {data.verificationUrl || `codesrock.org/verify/${data.certificateId}`}
              </span>
            </div>
            <div>
              <span>ID: </span>
              <span className="font-mono font-bold text-slate-700">
                {data.certificateId}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AdultCertificateTemplate.displayName = "AdultCertificateTemplate";
