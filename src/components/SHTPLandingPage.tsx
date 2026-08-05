"use client";

import React, { useEffect, useRef, useState } from "react";
import CoreTeamOrgChart from "./CoreTeamOrgChart";
import OpsSupportOrgChart from "./OpsSupportOrgChart";

// BRP Style Entrance Animation
interface AnimatedSectionProps {
  children: React.ReactNode;
  direction?: "up" | "left" | "right" | "fade";
  delay?: number;
  className?: string;
}

function AnimatedSection({ children, direction = "up", delay = 0, className = "" }: AnimatedSectionProps) {
  return (
    <div className={`opacity-100 translate-y-0 translate-x-0 ${className}`}>
      {children}
    </div>
  );
}

// BRP Style Section (Alternating Light themes)
const Section = ({ dark, children, className = "" }: { dark?: boolean, children: React.ReactNode, className?: string }) => (
  <section className={`w-full bg-white text-[#212529] ${className}`}>
    {children}
  </section>
);

// BRP Split Block (50/50 Image and Text)
const SplitBlock = ({ img, title, desc, dark, reverse, badge }: any) => (
  <div className={`grid grid-cols-1 lg:grid-cols-2 bg-white`}>
    <div className={`relative h-[400px] lg:h-[600px] ${reverse ? "lg:order-last" : ""}`}>
      <img src={img} alt={title} className="w-full h-full object-cover" />
    </div>
    <div className={`flex flex-col justify-center p-8 lg:p-24 text-[#212529] border-t lg:border-t-0 border-b border-gray-200`}>
      <AnimatedSection direction={reverse ? "left" : "right"}>
        {badge && <span className="block mb-4 text-[#db011c] font-black uppercase tracking-widest text-sm">{badge}</span>}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
          {title}
        </h2>
        <p className={`text-lg font-normal leading-relaxed text-gray-600`}>
          {desc}
        </p>
      </AnimatedSection>
    </div>
  </div>
);

// BRP Split Video Block (50/50 Video and Text)
const SplitVideoBlock = ({ video, title, desc, dark, reverse, badge }: any) => (
  <div className={`grid grid-cols-1 lg:grid-cols-2 bg-[#f4f4f4]`}>
    <div className={`relative h-[400px] lg:h-[600px] ${reverse ? "lg:order-last" : ""}`}>
      <video src={video} controls autoPlay muted playsInline className="w-full h-full object-cover" />
    </div>
    <div className={`flex flex-col justify-center p-8 lg:p-24 text-[#212529] border-t lg:border-t-0 border-b border-gray-200`}>
      <AnimatedSection direction={reverse ? "left" : "right"}>
        {badge && <span className="block mb-4 text-[#db011c] font-black uppercase tracking-widest text-sm">{badge}</span>}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter mb-6 leading-[0.9]">
          {title}
        </h2>
        <p className={`text-lg font-normal leading-relaxed text-gray-600`}>
          {desc}
        </p>
      </AnimatedSection>
    </div>
  </div>
);

const constructionTabsData = [
  {
    id: "start",
    title: "Start Sept 2020",
    image: "/about_shtp/2.1.1 Construction Journey - Start Sept 2020.png",
    desc: "Initial ground breaking and site preparation."
  },
  {
    id: "piling",
    title: "Piling July 2020",
    image: "/about_shtp/2.1.2 Construction Journey - Piling July 2020.png",
    desc: "Foundation piling and structural base work."
  },
  {
    id: "structure",
    title: "Structure Feb 2023",
    image: "/about_shtp/2.1.3 Construction Journey - Structure Feb 2023.png",
    desc: "Primary facility framing and structural assembly."
  },
  {
    id: "operations",
    title: "Operations Mar 2024",
    image: "/about_shtp/2.1.4  Construction Journey- Operations Mar 2024.png",
    desc: "Final exterior finishing and operational readiness."
  }
];

function ConstructionTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const data = constructionTabsData[activeTab];

  return (
    <div className="w-full px-8 lg:px-24 py-12 bg-[#f4f4f4]">
      {/* Tabs */}
      <div className="flex flex-wrap gap-8 border-b border-gray-300">
        {constructionTabsData.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(idx)}
            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${
              activeTab === idx ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {tab.title}
            {activeTab === idx && (
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#db011c]" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-16">
        <AnimatedSection direction="left" className="flex flex-col justify-start">
          <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-8 text-[#212529] leading-tight">
            {data.title}
          </h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#db011c] mt-2 shrink-0"></div>
              <div>
                <p className="text-sm font-bold text-[#db011c] uppercase tracking-widest mb-1">Milestone</p>
                <p className="text-gray-700 text-lg leading-relaxed">{data.desc}</p>
              </div>
            </div>
          </div>
        </AnimatedSection>
        
        <AnimatedSection direction="right" className="relative w-full aspect-video md:aspect-[4/3] overflow-hidden rounded shadow-lg">
          <img src={data.image} alt={data.title} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
        </AnimatedSection>
      </div>
    </div>
  );
}

function QuickStats() {
  const stats = [
    { value: "5,000+", label: "Factory employee" },
    { value: "50+", label: "Manufacturing lines" },
    { value: "24/7", label: "Production operations" },
    { value: "ISO 9001", label: "Quality certified" },
    { value: "GOLD", label: "LEED certified", isGold: true },
  ];

  return (
    <div className="w-full px-8 lg:px-24 py-12 bg-white">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {stats.map((stat, idx) => (
          <AnimatedSection key={idx} direction="up" delay={idx * 100}>
            <div className="bg-white rounded-md shadow-sm border border-gray-100 border-t-4 border-t-[#db011c] p-6 flex flex-col justify-center h-full relative overflow-hidden">
              <h4 className={`text-3xl font-black mb-2 uppercase tracking-tight ${stat.isGold ? 'text-[#cfa03f]' : 'text-[#db011c]'}`}>
                {stat.value}
              </h4>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              
              {stat.isGold && (
                <div className="absolute top-4 right-4">
                  <img src="/about_shtp/leed_gold_certificate.png" alt="LEED Gold" className="w-14 h-14 object-contain mix-blend-multiply" />
                </div>
              )}
            </div>
          </AnimatedSection>
        ))}
      </div>
    </div>
  );
}

function BuildingOutlookSection() {
  return (
    <Section className="py-12 border-b border-gray-200 bg-white">
      <div className="w-full px-8 lg:px-24 mb-8">
        <AnimatedSection direction="up">
           <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight">
             BUILDING <span className="text-[#db011c]">OUTLOOK</span>
           </h3>
        </AnimatedSection>
      </div>

      <div className="w-full flex flex-col md:flex-row h-[500px] lg:h-[600px]">
        {/* 2024 Outlook */}
        <div className="relative flex-1 w-full h-full group overflow-hidden">
          <img 
            src="/about_shtp/2.2 Building Outlook - 2024.jpg" 
            alt="Building Outlook 2024" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-10 md:p-16 text-white">
             <h3 className="text-3xl md:text-4xl font-black italic uppercase mb-4 tracking-tight drop-shadow-md">
               2024 OUTLOOK
             </h3>
             <p className="text-sm md:text-base font-medium max-w-lg leading-relaxed text-gray-200 drop-shadow">
               Our completed state-of-the-art manufacturing campus in Saigon Hi-Tech Park, fully operational and designed for optimal assembly and world-class operations.
             </p>
          </div>
        </div>

        {/* 202X Vision */}
        <div className="relative flex-1 w-full h-full group overflow-hidden">
          <img 
            src="/about_shtp/2.3 Buildin g Outlook - 202X.jpg" 
            alt="Building Outlook 202X" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div className="absolute inset-0 flex flex-col justify-end p-10 md:p-16 text-white">
             <h3 className="text-3xl md:text-4xl font-black italic uppercase mb-4 tracking-tight drop-shadow-md">
               202X VISION
             </h3>
             <p className="text-sm md:text-base font-medium max-w-lg leading-relaxed text-gray-200 drop-shadow">
               Future expansion plans and continuous innovation as we scale our manufacturing capabilities to meet growing global demand.
             </p>
          </div>
        </div>
      </div>
    </Section>
  );
}


export default function SHTPLandingPage() {
  return (
    <div className="w-full min-h-screen bg-white font-sans overflow-x-hidden">
      
      {/* 1. HERO BANNER - Full Bleed */}
      <section className="relative w-full h-[80vh] min-h-[600px] flex items-center bg-black">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video src="/about_shtp/2.Construction Journey.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover opacity-60" />
        </div>
      </section>

      {/* QUICK STATS */}
      <QuickStats />

      {/* 2. FACILITY OVERVIEW */}
      <Section className="py-24 md:py-32 border-b border-gray-200">
        <div className="w-full px-8 lg:px-24">
          <div className="flex flex-col gap-16">
            <AnimatedSection direction="up" className="flex flex-col justify-center text-center">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
                01. FACILITY <span className="text-[#db011c]">OVERVIEW</span>
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed font-normal mb-12 max-w-4xl mx-auto">
                Our state-of-the-art manufacturing campus in Saigon Hi-Tech Park is designed for innovation, optimal assembly, and world-class operations. The facility maximizes logistical flow and provides secure access for both heavy machinery and daily commuters.
              </p>
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-gray-200 pt-12 w-full max-w-6xl mx-auto">
                {[
                  { label: "Location", value: "Saigon Hi-Tech Park" },
                  { label: "Levels", value: "6 Floors" },
                  { label: "Function", value: "Manufacturing & R&D" },
                  { label: "Status", value: "Operational" },
                ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-[#db011c] font-black uppercase tracking-widest text-xs mb-2">{stat.label}</p>
                    <p className="text-2xl font-black uppercase tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
            
            <AnimatedSection direction="up" delay={200} className="w-full">
              <img src="/about_shtp/1.Site Map.png" alt="Site Map" className="w-full h-auto object-contain" />
            </AnimatedSection>
          </div>
        </div>
      </Section>

      {/* 3. CONSTRUCTION JOURNEY */}
      <Section className="bg-[#f4f4f4]">
        <div className="py-24 px-8 lg:px-24 w-full text-left border-b border-gray-200">
          <AnimatedSection direction="up">
             <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                02. CONSTRUCTION <span className="text-[#db011c]">JOURNEY</span>
             </h2>
             <p className="text-xl text-gray-600 font-normal max-w-3xl">
                Witness the dynamic development of our manufacturing facility, from ground breaking to the final building exterior.
             </p>
          </AnimatedSection>
        </div>
        
        <ConstructionTabs />
      </Section>

      {/* BUILDING OUTLOOK */}
      <BuildingOutlookSection />

      {/* 4. ORGANIZATIONAL STRUCTURE */}
      <Section className="pt-24 md:pt-32 pb-16 bg-white">
        <div className="w-full px-8 lg:px-24 mb-12">
          <AnimatedSection direction="up" className="text-left">
             <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-6">
                03. ORGANIZATIONAL <span className="text-[#db011c]">STRUCTURE</span>
             </h2>
             <p className="text-xl text-gray-700 font-normal max-w-3xl">
                Our leadership and core team directing local operations, along with the functional hierarchy managing daily processes.
             </p>
          </AnimatedSection>
        </div>
          
        <div className="w-full flex flex-col gap-12">
           <AnimatedSection direction="up">
              <div className="w-full bg-slate-50 py-12 border-y border-gray-200">
                 <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-8 text-center text-[#212529]">MILWAUKEE PT VN CORE TEAM</h3>
                 <div className="overflow-x-auto w-full custom-scrollbar pb-4">
                   <div className="min-w-[800px] flex justify-center">
                      <CoreTeamOrgChart />
                   </div>
                 </div>
              </div>
           </AnimatedSection>

           <AnimatedSection direction="up">
              <div className="w-full bg-slate-50 py-12 border-b border-gray-200">
                 <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-8 text-center text-[#212529]">OPERATIONS SUPPORT</h3>
                 <div className="overflow-x-auto w-full custom-scrollbar pb-4">
                   <div className="min-w-[800px] flex justify-center">
                      <OpsSupportOrgChart />
                   </div>
                 </div>
              </div>
           </AnimatedSection>
        </div>
      </Section>

      {/* 5. FACILITY LAYOUTS */}
      <Section className="pt-24 md:pt-32 pb-0 bg-white">
        <div className="w-full px-8 lg:px-24 mb-16 text-left">
          <AnimatedSection direction="up">
             <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9]">
                04. FACILITY <span className="text-[#db011c]">LAYOUTS</span>
             </h2>
          </AnimatedSection>
        </div>

        {/* Manufacturing Layouts */}
        <div className="bg-[#f4f4f4] py-24 px-8 lg:px-24 border-y border-gray-200">
          <div className="w-full">
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-16 border-b-4 border-[#db011c] inline-block pb-2 text-[#212529]">
              MANUFACTURING LEVELS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {[
                { level: "LEVEL 1", desc: "HEAVY MACHINERY & PRIMARY PRODUCTION LINE", img: "/about_shtp/5.1 Manufacturing Layout_Level 1.png" },
                { level: "LEVEL 3", desc: "PRECISION ASSEMBLY & QUALITY CHECK", img: "/about_shtp/5.2 Manufacturing Layout_Level 3.png" },
                { level: "LEVEL 5", desc: "FINAL TESTING & PACKAGING STAGING AREA", img: "/about_shtp/5.3 Manufacturing Layout_Level 5.png" },
              ].map((layout, idx) => (
                <AnimatedSection key={idx} direction="up" className="bg-white p-8 flex flex-col h-full border-b-[8px] border-[#db011c] shadow-sm hover:shadow-md transition-shadow">
                   <h5 className="text-3xl font-black uppercase tracking-tighter mb-2 text-[#db011c]">{layout.level}</h5>
                   <p className="text-xs font-bold tracking-wide uppercase text-gray-500 mb-6">{layout.desc}</p>
                   <div className="flex-grow flex items-center justify-center bg-[#f4f4f4] p-4">
                     <img src={layout.img} alt={layout.level} className="w-full h-auto object-contain mix-blend-multiply" />
                   </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>

        {/* Office Layouts */}
        <div className="bg-white py-24 px-8 lg:px-24">
          <div className="w-full">
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-16 border-b-4 border-[#db011c] inline-block pb-2 text-[#212529]">
              OFFICE LEVELS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {[
                { level: "LEVEL 2", desc: "ENGINEERING BAYS & COLLABORATION ZONES", img: "/about_shtp/6.1 Office Layout_Level 2.png" },
                { level: "LEVEL 4", desc: "OPERATIONS OFFICES & CONFERENCE CLUSTERS", img: "/about_shtp/6.2 Office Layout_Level 4.png" },
                { level: "LEVEL 6", desc: "EXECUTIVE SPACES & RESEARCH WORKSPACES", img: "/about_shtp/6.3 Office Layout_Level 6.png" },
              ].map((layout, idx) => (
                <AnimatedSection key={idx} direction="up" className="bg-[#f4f4f4] p-8 flex flex-col h-full border-b-[8px] border-[#db011c] shadow-sm hover:shadow-md transition-shadow">
                   <h5 className="text-3xl font-black uppercase tracking-tighter mb-2 text-[#db011c]">{layout.level}</h5>
                   <p className="text-xs font-bold tracking-wide uppercase text-gray-500 mb-6">{layout.desc}</p>
                   <div className="flex-grow flex items-center justify-center bg-white p-4 border border-gray-200">
                     <img src={layout.img} alt={layout.level} className="w-full h-auto object-contain mix-blend-multiply" />
                   </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
        
        {/* Meeting Room Layouts */}
        <div className="bg-[#f4f4f4] py-24 px-8 lg:px-24 border-t border-gray-200">
          <div className="w-full">
            <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-16 border-b-4 border-[#db011c] inline-block pb-2 text-[#212529]">
              MEETING ROOMS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
              {[
                { level: "LEVEL 2", img: "/about_shtp/7.1 Meeting room L2.PNG" },
                { level: "LEVEL 3", img: "/about_shtp/7.2 Meeting room L3.PNG" },
                { level: "LEVEL 4", img: "/about_shtp/7.3 Meeting room L4.PNG" },
                { level: "LEVEL 5", img: "/about_shtp/7.4 Meeting room L5.PNG" },
                { level: "LEVEL 6", img: "/about_shtp/7.5 Meeting room L6.PNG" },
              ].map((room, idx) => (
                <AnimatedSection key={idx} direction="up" className="bg-white p-8 flex flex-col h-full border-b-[8px] border-[#db011c] shadow-sm hover:shadow-md transition-shadow">
                   <h5 className="text-3xl font-black uppercase tracking-tighter mb-6 text-[#212529]">{room.level}</h5>
                   <div className="flex-grow flex items-center justify-center bg-[#f4f4f4] p-4">
                     <img src={room.img} alt={room.level} className="w-full h-auto object-contain mix-blend-multiply" />
                   </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 6. VISITOR REGISTRATION */}
      <Section className="py-24 md:py-32 bg-white">
        <div className="w-full px-8 lg:px-24">
          <div className="flex flex-col gap-12">
            <AnimatedSection direction="up" className="flex flex-col justify-center text-center">
              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9] mb-8">
                05. VISITOR <span className="text-[#db011c]">PROCESS</span>
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed font-normal max-w-4xl mx-auto">
                Identity verification, safety brief instruction flow, and secure registration designed to welcome our guests efficiently. Ensure you complete the required registration before arriving on site.
              </p>
            </AnimatedSection>
            
            <AnimatedSection direction="up" delay={200} className="w-full">
              <img src="/about_shtp/9. Visitor Registration Process.png" alt="Visitor Registration Process" className="w-full h-auto object-contain" />
            </AnimatedSection>
          </div>
        </div>
      </Section>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f4f4f4;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #db011c;
          border: 3px solid #f4f4f4;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a00115;
        }
      `}} />
    </div>
  );
}
