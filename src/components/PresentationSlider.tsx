"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface Slide {
  id: number;
  title: string;
  type: "image" | "video" | "grid";
  content: string | string[];
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Site Map",
    type: "image",
    content: "/about_shtp/1.Site Map.png",
  },
  {
    id: 2,
    title: "Construction Journey",
    type: "video",
    content: "/about_shtp/2.Construction Journey.mp4",
  },
  {
    id: 3,
    title: "Core Team Organization",
    type: "image",
    content: "/about_shtp/3. Milwaukee PT VN Core Team - Organization Chart.png",
  },
  {
    id: 4,
    title: "Operations Support",
    type: "image",
    content: "/about_shtp/4.Operations Support - Organization Chart.png",
  },
  {
    id: 5,
    title: "Manufacturing Layout",
    type: "grid",
    content: [
      "/about_shtp/5.1 Manufacturing Layout_Level 1.png",
      "/about_shtp/5.2 Manufacturing Layout_Level 3.png",
      "/about_shtp/5.3 Manufacturing Layout_Level 5.png",
    ],
  },
  {
    id: 6,
    title: "Office Layout",
    type: "grid",
    content: [
      "/about_shtp/6.1 Office Layout_Level 2.png",
      "/about_shtp/6.2 Office Layout_Level 4.png",
      "/about_shtp/6.3 Office Layout_Level 6.png",
    ],
  },
  {
    id: 7,
    title: "Meeting Room Layouts",
    type: "grid",
    content: [
      "/about_shtp/7.1 Meeting Room Manufacturing Layout Level 3.png",
      "/about_shtp/7.2 Meeting Room Manufacturing Layout Level 5.png",
    ],
  },
  {
    id: 8,
    title: "Working & Meeting Room Layout",
    type: "image",
    content: "/about_shtp/8. Working Room and Meeting Room Layout.png",
  },
  {
    id: 9,
    title: "Visitor Registration Process",
    type: "image",
    content: "/about_shtp/9. Visitor Registration Process.png",
  },
];

export default function PresentationSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goToSlide = (index: number) => {
    if (animating || index === currentIndex) return;
    setAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setAnimating(false), 500); // Matches transition duration
  };

  const nextSlide = () => {
    if (currentIndex < slides.length - 1) goToSlide(currentIndex + 1);
  };

  const prevSlide = () => {
    if (currentIndex > 0) goToSlide(currentIndex - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") nextSlide();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, animating]);

  const currentSlide = slides[currentIndex];

  return (
    <div className="relative w-full h-[calc(100vh-80px)] min-h-[700px] bg-[#0a0a0a] overflow-hidden flex flex-col font-sans">
      
      {/* Top Header / Progress */}
      <div className="absolute top-0 left-0 w-full z-20 p-6 md:p-10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#db011c] text-white flex items-center justify-center font-bold text-xl rounded-sm shadow-[0_0_15px_rgba(219,1,28,0.5)]">
            0{currentSlide.id}
          </div>
          <h1 className="text-2xl md:text-3xl text-white font-light tracking-wide uppercase">
            Milwaukee <span className="font-bold text-[#db011c]">SHTP</span>
          </h1>
        </div>
        
        {/* Progress Dots */}
        <div className="hidden md:flex gap-3">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(idx)}
              className={`h-1 transition-all duration-300 rounded-full ${
                idx === currentIndex ? "w-12 bg-[#db011c] shadow-[0_0_10px_rgba(219,1,28,0.8)]" : "w-4 bg-white/20 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${slide.id}`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full relative z-10 flex items-center justify-center pt-24 pb-20 px-8 md:px-20">
        
        {/* Content Wrapper with Fade/Scale Transition */}
        <div
          key={currentSlide.id}
          className="w-full max-w-7xl h-full flex flex-col xl:flex-row items-center gap-10 animate-[fadeIn_0.5s_ease-out_forwards]"
        >
          {/* Title Area */}
          <div className="xl:w-1/3 text-left w-full">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {currentSlide.title}
            </h2>
            <div className="w-20 h-1 bg-[#db011c] mt-6 shadow-[0_0_10px_rgba(219,1,28,0.8)]"></div>
          </div>

          {/* Media Area */}
          <div className="xl:w-2/3 w-full h-[50vh] xl:h-full max-h-[700px] flex items-center justify-center relative">
            {currentSlide.type === "image" && (
              <div className="relative w-full h-full bg-white/5 rounded-xl border border-white/10 p-2 shadow-2xl backdrop-blur-sm overflow-hidden flex items-center justify-center group">
                <img
                  src={currentSlide.content as string}
                  alt={currentSlide.title}
                  className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-1000 group-hover:scale-105"
                />
              </div>
            )}

            {currentSlide.type === "video" && (
              <div className="relative w-full h-full bg-black rounded-xl border border-white/10 shadow-2xl overflow-hidden">
                <video
                  src={currentSlide.content as string}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {currentSlide.type === "grid" && (
              <div className={`grid gap-4 w-full h-full ${
                (currentSlide.content as string[]).length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-3"
              }`}>
                {(currentSlide.content as string[]).map((src, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-2 flex items-center justify-center backdrop-blur-sm group overflow-hidden shadow-2xl">
                    <img
                      src={src}
                      alt={`${currentSlide.title} Part ${i + 1}`}
                      className="max-w-full max-h-full object-contain drop-shadow-xl transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        disabled={currentIndex === 0}
        className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full backdrop-blur-md border border-white/20 transition-all ${
          currentIndex === 0 ? "opacity-30 cursor-not-allowed bg-transparent" : "opacity-70 hover:opacity-100 bg-white/10 hover:bg-white/20 hover:scale-110 shadow-lg"
        }`}
      >
        <ChevronLeftIcon className="w-8 h-8 text-white" />
      </button>

      <button
        onClick={nextSlide}
        disabled={currentIndex === slides.length - 1}
        className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 p-4 rounded-full backdrop-blur-md border border-white/20 transition-all ${
          currentIndex === slides.length - 1 ? "opacity-30 cursor-not-allowed bg-transparent" : "opacity-70 hover:opacity-100 bg-white/10 hover:bg-white/20 hover:scale-110 shadow-lg"
        }`}
      >
        <ChevronRightIcon className="w-8 h-8 text-white" />
      </button>

      {/* Mobile Progress Text */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 md:hidden text-white/50 text-sm tracking-widest">
        {currentIndex + 1} / {slides.length}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
