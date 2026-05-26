"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface SlideData {
  id: number;
  number: string;
  title: string;
  description: string;
  type: "image" | "video" | "tabs";
  content: string | { title: string; src: string; desc: string }[];
}

const slides: SlideData[] = [
  {
    id: 1,
    number: "01",
    title: "Facility Site Map",
    description: "Detailed spatial distribution and entry layout of the Saigon Hi-Tech Park facility.",
    type: "image",
    content: "/about_shtp/1.Site Map.png"
  },
  {
    id: 2,
    number: "02",
    title: "Construction Journey",
    description: "A time-lapse and highlight video showcasing the dynamic development of our manufacturing facility.",
    type: "video",
    content: "/about_shtp/2.Construction Journey.mp4"
  },
  {
    id: 3,
    number: "03",
    title: "Milwaukee PT VN Core Team",
    description: "Our leadership and core team organizational structure directing local operations.",
    type: "image",
    content: "/about_shtp/3. Milwaukee PT VN Core Team - Organization Chart.png"
  },
  {
    id: 4,
    number: "04",
    title: "Operations Support Chart",
    description: "Functional hierarchy and operations support teams managing daily factory processes.",
    type: "image",
    content: "/about_shtp/4.Operations Support - Organization Chart.png"
  },
  {
    id: 5,
    number: "05",
    title: "Manufacturing Layouts",
    description: "Floor layouts for our manufacturing levels, designed for optimal assembly and logistics.",
    type: "tabs",
    content: [
      { title: "Level 1 Layout", src: "/about_shtp/5.1 Manufacturing Layout_Level 1.png", desc: "Heavy machinery and primary production line placement." },
      { title: "Level 3 Layout", src: "/about_shtp/5.2 Manufacturing Layout_Level 3.png", desc: "Precision assembly and quality check stations." },
      { title: "Level 5 Layout", src: "/about_shtp/5.3 Manufacturing Layout_Level 5.png", desc: "Final testing and packaging staging area." }
    ]
  },
  {
    id: 6,
    number: "06",
    title: "Office Layouts",
    description: "Modern, open-concept workspaces mapped out for administrative and support departments.",
    type: "tabs",
    content: [
      { title: "Level 2 Layout", src: "/about_shtp/6.1 Office Layout_Level 2.png", desc: "Engineering bays and primary collaboration zones." },
      { title: "Level 4 Layout", src: "/about_shtp/6.2 Office Layout_Level 4.png", desc: "Operations offices and conference clusters." },
      { title: "Level 6 Layout", src: "/about_shtp/6.3 Office Layout_Level 6.png", desc: "Executive spaces and research workspaces." }
    ]
  },
  {
    id: 7,
    number: "07",
    title: "Meeting Room Manufacturing Layouts",
    description: "Specialized meeting hubs positioned within the manufacturing floors.",
    type: "tabs",
    content: [
      { title: "Level 3 Layout", src: "/about_shtp/7.1 Meeting Room Manufacturing Layout Level 3.png", desc: "Ad-hoc sync rooms near the primary assembly wing." },
      { title: "Level 5 Layout", src: "/about_shtp/7.2 Meeting Room Manufacturing Layout Level 5.png", desc: "Project planning rooms located in upper levels." }
    ]
  },
  {
    id: 8,
    number: "08",
    title: "Working & Meeting Room Layout",
    description: "General floor plan highlighting unified working desks and combined presentation rooms.",
    type: "image",
    content: "/about_shtp/8. Working Room and Meeting Room Layout.png"
  },
  {
    id: 9,
    number: "09",
    title: "Visitor Registration Process",
    description: "Online check-in, identity verification, and safety brief instructions for guests.",
    type: "image",
    content: "/about_shtp/9. Visitor Registration Process.png"
  }
];

export default function FullPagePresenter() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const isLocked = useRef(false);
  const touchStartY = useRef(0);

  // Reset active tab when slide changes
  useEffect(() => {
    setActiveTab(0);
  }, [activeIndex]);

  const handleScroll = (direction: "up" | "down") => {
    if (isLocked.current) return;

    if (direction === "down" && activeIndex < slides.length - 1) {
      isLocked.current = true;
      setActiveIndex((prev) => prev + 1);
      setTimeout(() => {
        isLocked.current = false;
      }, 1000); // 1s animation transition lock
    } else if (direction === "up" && activeIndex > 0) {
      isLocked.current = true;
      setActiveIndex((prev) => prev - 1);
      setTimeout(() => {
        isLocked.current = false;
      }, 1000);
    }
  };

  // Listen to wheel events
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent browser default scroll
      e.preventDefault();
      if (e.deltaY > 0) {
        handleScroll("down");
      } else if (e.deltaY < 0) {
        handleScroll("up");
      }
    };

    const container = document.getElementById("fullpage-container");
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
      }
    };
  }, [activeIndex]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleScroll("down");
      } else {
        handleScroll("up");
      }
    }
  };

  return (
    <div
      id="fullpage-container"
      className="relative w-full h-[calc(100vh-140px)] min-h-[600px] bg-[var(--color-bg-page)] overflow-hidden select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Side Navigation Dots */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-4">
        {slides.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => {
              if (!isLocked.current) {
                setActiveIndex(idx);
              }
            }}
            className={`w-3 h-3 rounded-full transition-all duration-500 border ${
              idx === activeIndex
                ? "bg-[#db011c] border-[#db011c] scale-125 shadow-md shadow-[#db011c]/30"
                : "bg-gray-200 border-gray-300 hover:bg-gray-400"
            }`}
            title={slide.title}
          />
        ))}
      </div>

      {/* Floating Arrows */}
      <div className="absolute left-6 bottom-6 z-30 flex items-center gap-3">
        <button
          onClick={() => handleScroll("up")}
          disabled={activeIndex === 0}
          className={`p-2.5 rounded-full border transition-all ${
            activeIndex === 0
              ? "text-gray-300 border-gray-100 bg-gray-50/50 cursor-not-allowed"
              : "text-gray-600 border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:scale-105 active:scale-95"
          }`}
        >
          <ChevronUpIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleScroll("down")}
          disabled={activeIndex === slides.length - 1}
          className={`p-2.5 rounded-full border transition-all ${
            activeIndex === slides.length - 1
              ? "text-gray-300 border-gray-100 bg-gray-50/50 cursor-not-allowed"
              : "text-gray-600 border-gray-200 bg-white shadow-sm hover:bg-gray-50 hover:scale-105 active:scale-95"
          }`}
        >
          <ChevronDownIcon className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-gray-400 pl-2">
          {activeIndex + 1} / {slides.length}
        </span>
      </div>

      {/* Slides Container */}
      <div
        className="w-full h-full transition-transform duration-[1000ms]"
        style={{
          transform: `translateY(-${activeIndex * 100}%)`,
          transitionTimingFunction: "cubic-bezier(0.85, 0, 0.15, 1)", // Premium cubic bezier for page slide
        }}
      >
        {slides.map((slide, slideIdx) => {
          const isActive = slideIdx === activeIndex;

          return (
            <div
              key={slide.id}
              className="w-full h-full flex flex-col md:flex-row items-center gap-8 md:gap-12 px-8 md:px-12 lg:px-16 py-8 relative overflow-hidden bg-[var(--color-bg-page)]"
            >
              {/* Left Side: Info */}
              <div className="w-full md:w-[22%] lg:w-[18%] flex flex-col justify-center h-full space-y-6 z-10 text-left">
                <div
                  className={`transition-all duration-700 delay-300 transform ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                >
                  <span className="text-5xl md:text-7xl font-black text-[#db011c] tracking-tighter block mb-2">
                    {slide.number}
                  </span>
                  <div className="w-12 h-1 bg-[#db011c] mb-4"></div>
                  <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                    {slide.title}
                  </h2>
                </div>

                <p
                  className={`text-gray-500 font-light leading-relaxed text-sm md:text-base transition-all duration-700 delay-500 transform ${
                    isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                >
                  {slide.description}
                </p>

                {/* Sub-tabs Selector for type "tabs" */}
                {slide.type === "tabs" && (
                  <div
                    className={`flex flex-wrap gap-2 pt-2 transition-all duration-700 delay-700 transform ${
                      isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    }`}
                  >
                    {(slide.content as any[]).map((tab, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`px-4 py-2 text-xs font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                          idx === activeTab
                            ? "bg-gray-900 border-gray-900 text-white shadow-sm"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {tab.title.split(" ")[0]} {tab.title.split(" ")[1]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Media Container */}
              <div
                className={`w-full md:w-[78%] lg:w-[82%] h-[60%] md:h-full flex items-center justify-center relative transition-all duration-1000 delay-400 transform ${
                  isActive ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                {/* Image Slide */}
                {slide.type === "image" && (
                  <div className="relative w-full h-full max-h-[96%] bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] transition-shadow duration-500 flex items-center justify-center group overflow-hidden">
                    <img
                      src={slide.content as string}
                      alt={slide.title}
                      className="max-w-full max-h-full object-contain rounded-xl transition-transform duration-700 group-hover:scale-[1.01]"
                    />
                  </div>
                )}

                {/* Video Slide */}
                {slide.type === "video" && (
                  <div className="relative w-full h-full max-h-[96%] bg-black rounded-3xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.12)] overflow-hidden">
                    <video
                      src={slide.content as string}
                      controls
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Tabs Layout (Alternates based on activeTab) */}
                {slide.type === "tabs" && (
                  <div className="w-full h-full flex flex-col justify-center space-y-4">
                    <div className="relative w-full h-full max-h-[90%] bg-white border border-gray-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden">
                      <img
                        key={activeTab}
                        src={(slide.content as any[])[activeTab]?.src || (slide.content as any[])[0]?.src}
                        alt={(slide.content as any[])[activeTab]?.title || (slide.content as any[])[0]?.title}
                        className="max-w-full max-h-full object-contain rounded-xl animate-[fadeIn_0.5s_ease-out]"
                      />
                    </div>
                    <div className="text-xs text-gray-400 italic text-center md:text-left">
                      {(slide.content as any[])[activeTab]?.desc || (slide.content as any[])[0]?.desc}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}} />
    </div>
  );
}
