"use client";

import React, { useEffect, useRef, useState } from "react";
import CoreTeamOrgChart from "./CoreTeamOrgChart";
import OpsSupportOrgChart from "./OpsSupportOrgChart";

// Flexible scroll reveal component for custom entrance animations
interface AnimatedSectionProps {
  children: React.ReactNode;
  direction?: "up" | "left" | "right" | "zoom";
  delay?: number;
  className?: string;
}

function AnimatedSection({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -5% 0px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [delay]);

  const getTransitionClass = () => {
    if (isVisible) {
      return "opacity-100 translate-y-0 translate-x-0 scale-100";
    }
    switch (direction) {
      case "left":
        return "opacity-0 -translate-x-12";
      case "right":
        return "opacity-0 translate-x-12";
      case "zoom":
        return "opacity-0 scale-90";
      case "up":
      default:
        return "opacity-0 translate-y-12";
    }
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${getTransitionClass()} ${className}`}
    >
      {children}
    </div>
  );
}

export default function SHTPLandingPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--color-bg-page)] text-gray-900 font-sans pb-32 px-4 md:px-8 space-y-24">
      
      {/* 1. Header Banner */}
      <AnimatedSection direction="zoom" className="w-full">
        <div className="relative w-full h-[380px] rounded-3xl overflow-hidden flex items-center justify-center shadow-sm">
          <div className="absolute inset-0 z-0 bg-black">
            <img
              src="/about_shtp/1.Site Map.png"
              alt="SHTP Facility"
              className="w-full h-full object-cover opacity-60 transition-transform duration-[12s] hover:scale-105"
            />
          </div>
          <div className="relative z-10 text-center px-4">
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Milwaukee Tool Vietnam</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
              About <span className="text-[#db011c]">SHTP Facility</span>
            </h1>
          </div>
        </div>
      </AnimatedSection>

      {/* 2. Facility Overview */}
      <section className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Stats & Description */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatedSection direction="left" className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-[#db011c]">01</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-l-4 border-[#db011c] pl-3">
                Facility Overview
              </h2>
            </div>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light">
              Our state-of-the-art manufacturing campus in Saigon Hi-Tech Park is designed for innovation, optimal assembly, and world-class operations. The facility maximizes logistical flow and provides secure access for both heavy machinery and daily commuters.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { label: "Location", value: "Saigon Hi-Tech Park" },
                { label: "Levels", value: "6 Floors" },
                { label: "Primary Function", value: "Manufacturing & R&D" },
                { label: "Status", value: "Operational" },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/40 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/30 hover:bg-white/60 transition-colors">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</p>
                  <p className="text-gray-900 font-semibold text-sm md:text-base mt-1">{stat.value}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>

        {/* Right Featured Image */}
        <div className="lg:col-span-5 flex items-center justify-center">
          <AnimatedSection direction="right" className="w-full">
            <div className="relative w-full h-[320px] lg:h-[400px] overflow-hidden rounded-3xl group shadow-sm bg-white border border-gray-100 p-2">
              <img
                src="/about_shtp/1.Site Map.png"
                alt="Facility Site Map"
                className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 3. Construction Journey */}
      <section className="space-y-12">
        <AnimatedSection direction="up">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-[#db011c]">02</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-l-4 border-[#db011c] pl-3">
              Construction Journey
            </h2>
          </div>
          <p className="text-gray-500 font-light text-sm mt-4 max-w-2xl">
            Witness the dynamic development of our manufacturing facility, from ground breaking to the final building exterior.
          </p>
        </AnimatedSection>

        <div className="space-y-16">
          {[
            {
              title: "Time-lapse Video",
              src: "/about_shtp/2.Construction Journey.mp4",
              desc: "Site construction progress from ground breaking to completion.",
              isVideo: true
            },
            {
              title: "Actual Progress",
              src: "/about_shtp/2.1 Construction Journey.PNG",
              desc: "Mid-stage facility framing and structural assembly.",
              isVideo: false
            },
            {
              title: "Building Outlook",
              src: "/about_shtp/2.2 Construction Journey.PNG",
              desc: "Final building exterior and site finishing.",
              isVideo: false
            },
          ].map((item, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div key={idx} className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Image/Video container */}
                <div className={`lg:col-span-7 ${isEven ? "" : "lg:order-last"}`}>
                  <AnimatedSection direction={isEven ? "left" : "right"} className="group">
                    <div className="overflow-hidden rounded-3xl bg-white border border-gray-100 p-2 aspect-[16/9] relative shadow-sm flex items-center justify-center">
                      {item.isVideo ? (
                        <video
                          src={item.src}
                          controls
                          autoPlay
                          muted
                          playsInline
                          className="w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <img
                          src={item.src}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-[1.02]"
                        />
                      )}
                    </div>
                  </AnimatedSection>
                </div>
                {/* Content container */}
                <div className="lg:col-span-5 space-y-3">
                  <AnimatedSection direction={isEven ? "right" : "left"}>
                    <h3 className={`text-xl font-bold text-gray-900 ${isEven ? "" : "lg:text-right"}`}>{item.title}</h3>
                    <p className={`text-gray-500 font-light text-sm md:text-base leading-relaxed ${isEven ? "" : "lg:text-right"}`}>{item.desc}</p>
                  </AnimatedSection>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Organizational Structure */}
      <section className="space-y-16 pt-8">
        <AnimatedSection direction="up">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-[#db011c]">03</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-l-4 border-[#db011c] pl-3">
              Organizational Structure
            </h2>
          </div>
          <p className="text-gray-500 font-light text-sm mt-4 max-w-2xl">
            Our leadership and core team directing local operations, along with the functional hierarchy managing daily processes.
          </p>
        </AnimatedSection>

        <div className="space-y-16">
          <AnimatedSection direction="up">
             <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-gray-200/30 shadow-sm overflow-x-auto custom-scrollbar">
                <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">Milwaukee PT VN Core Team</h3>
                <div className="min-w-[800px] flex justify-center">
                  <CoreTeamOrgChart />
                </div>
             </div>
          </AnimatedSection>

          <AnimatedSection direction="up" delay={200}>
             <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-gray-200/30 shadow-sm flex flex-col items-center group">
                <h3 className="text-xl font-bold text-gray-900 mb-8 text-center">Operations Support</h3>
                <div className="overflow-hidden rounded-2xl w-full flex justify-center">
                   <img src="/about_shtp/4.Operations Support - Organization Chart.png" alt="Ops Support" className="max-w-full h-auto drop-shadow-sm transition-transform duration-[10s] group-hover:scale-105" />
                </div>
             </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 5. Facility Layouts */}
      <section className="space-y-16 pt-8">
        <AnimatedSection direction="up">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-[#db011c]">04</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-l-4 border-[#db011c] pl-3">
              Facility Layouts
            </h2>
          </div>
        </AnimatedSection>

        {/* Manufacturing Layouts */}
        <div className="space-y-12">
          <AnimatedSection direction="left">
            <h3 className="text-2xl font-extrabold text-gray-900 border-b-2 border-gray-200 pb-2">
              Manufacturing Layouts
            </h3>
            <p className="text-gray-500 font-light text-sm md:text-base leading-relaxed mt-4">
              Floor layouts for our manufacturing levels, designed for optimal assembly and logistics.
            </p>
          </AnimatedSection>

          <div className="space-y-12">
            {[
              { level: "Level 1", desc: "Heavy machinery & primary production line.", img: "/about_shtp/5.1 Manufacturing Layout_Level 1.png" },
              { level: "Level 3", desc: "Precision assembly & quality check.", img: "/about_shtp/5.2 Manufacturing Layout_Level 3.png" },
              { level: "Level 5", desc: "Final testing & packaging staging area.", img: "/about_shtp/5.3 Manufacturing Layout_Level 5.png" },
            ].map((layout, idx) => (
              <AnimatedSection key={idx} direction="up" delay={150} className="grid lg:grid-cols-12 gap-8 items-center bg-white/40 backdrop-blur-sm p-4 md:p-8 rounded-3xl border border-gray-200/30 group shadow-sm">
                <div className="lg:col-span-4 space-y-3">
                  <h4 className="text-3xl font-bold text-gray-900">{layout.level}</h4>
                  <p className="text-gray-600 text-sm md:text-base">{layout.desc}</p>
                </div>
                <div className="lg:col-span-8 overflow-hidden rounded-2xl bg-white aspect-[16/9] flex items-center justify-center p-2">
                  <img src={layout.img} alt={layout.level} className="w-full h-full object-contain transition-transform duration-[10s] group-hover:scale-[1.03]" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>

        {/* Office Layouts */}
        <div className="space-y-12 pt-8">
          <AnimatedSection direction="right">
            <h3 className="text-2xl font-extrabold text-gray-900 border-b-2 border-gray-200 pb-2 text-right">
              Office Layouts
            </h3>
            <p className="text-gray-500 font-light text-sm md:text-base leading-relaxed mt-4 text-right">
              Modern, open-concept workspaces mapped out for administrative and support departments.
            </p>
          </AnimatedSection>

          <div className="space-y-12">
            {[
              { level: "Level 2", desc: "Engineering bays & collaboration zones.", img: "/about_shtp/6.1 Office Layout_Level 2.png" },
              { level: "Level 4", desc: "Operations offices & conference clusters.", img: "/about_shtp/6.2 Office Layout_Level 4.png" },
              { level: "Level 6", desc: "Executive spaces & research workspaces.", img: "/about_shtp/6.3 Office Layout_Level 6.png" },
            ].map((layout, idx) => (
               <AnimatedSection key={idx} direction="up" delay={150} className="grid lg:grid-cols-12 gap-8 items-center bg-white/40 backdrop-blur-sm p-4 md:p-8 rounded-3xl border border-gray-200/30 group shadow-sm">
                <div className="lg:col-span-8 overflow-hidden rounded-2xl bg-white aspect-[16/9] flex items-center justify-center p-2 lg:order-first order-last">
                  <img src={layout.img} alt={layout.level} className="w-full h-full object-contain transition-transform duration-[10s] group-hover:scale-[1.03]" />
                </div>
                <div className="lg:col-span-4 space-y-3 lg:text-right">
                  <h4 className="text-3xl font-bold text-gray-900">{layout.level}</h4>
                  <p className="text-gray-600 text-sm md:text-base">{layout.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>

        {/* Meeting Rooms Layouts */}
        <div className="space-y-12 pt-8">
          <AnimatedSection direction="left">
             <h4 className="text-lg font-bold text-gray-800 border-l-3 border-[#db011c] pl-2.5">
                Meeting Room Layouts
              </h4>
              <p className="text-xs text-gray-500 font-light mt-1">Specialized meeting hubs positioned across office and manufacturing floors.</p>
          </AnimatedSection>

          <div className="space-y-8">
             {[
                { level: "Level 2", img: "/about_shtp/7.1 Meeting room L2.PNG" },
                { level: "Level 3", img: "/about_shtp/7.2 Meeting room L3.PNG" },
                { level: "Level 4", img: "/about_shtp/7.3 Meeting room L4.PNG" },
                { level: "Level 5", img: "/about_shtp/7.4 Meeting room L5.PNG" },
                { level: "Level 6", img: "/about_shtp/7.5 Meeting room L6.PNG" },
             ].map((room, idx) => (
                <AnimatedSection key={idx} direction="zoom" delay={100} className="bg-white/40 backdrop-blur-sm p-4 rounded-3xl border border-gray-200/30 shadow-sm group flex flex-col md:flex-row items-center gap-6">
                   <div className="flex-shrink-0 w-32 md:w-48 text-center md:text-left md:pl-4">
                     <h5 className="text-xl font-bold text-gray-900">{room.level}</h5>
                     <span className="text-xs text-gray-500 font-light">Meeting Rooms</span>
                   </div>
                   <div className="bg-white rounded-2xl p-2 w-full flex items-center justify-center h-48 md:h-64 overflow-hidden shadow-inner">
                      <img src={room.img} alt={room.level} className="max-h-full max-w-full object-contain transition-transform duration-[10s] group-hover:scale-[1.03]" />
                   </div>
                </AnimatedSection>
             ))}
          </div>
        </div>

      </section>

      {/* 6. Visitor Registration Process */}
      <section className="space-y-12 border-t border-gray-200/50 pt-16">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 lg:order-first">
              <AnimatedSection direction="left" className="w-full">
                <div className="overflow-hidden rounded-3xl bg-white p-4 border border-gray-100 shadow-sm group">
                  <img
                    src="/about_shtp/9. Visitor Registration Process.png"
                    alt="Registration Process"
                    className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                </div>
              </AnimatedSection>
            </div>
            
            <div className="lg:col-span-7 space-y-6">
              <AnimatedSection direction="right" className="space-y-6">
                 <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-[#db011c]">05</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-l-4 border-[#db011c] pl-3">
                    Visitor Process
                  </h2>
                </div>
                <p className="text-gray-500 font-light text-sm md:text-base leading-relaxed">
                  A seamless online check-in, identity verification, and safety brief instruction flow designed to welcome our guests efficiently and safely. Ensure you complete the required registration before arriving on site.
                </p>
              </AnimatedSection>
            </div>
          </div>
      </section>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}} />
    </div>
  );
}
