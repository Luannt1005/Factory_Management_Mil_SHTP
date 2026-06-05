"use client";

import React, { useEffect, useRef, useState } from "react";

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

export default function AboutVietnam() {
  return (
    <div className="w-full min-h-screen bg-[var(--color-bg-page)] text-gray-900 font-sans pb-32 px-4 md:px-8 space-y-24">
      
      {/* 1. Header Banner */}
      <AnimatedSection direction="zoom" className="w-full">
        <div className="relative w-full h-[380px] rounded-3xl overflow-hidden flex items-center justify-center shadow-sm">
          <div className="absolute inset-0 z-0 bg-black">
            <img
              src="/about_vn/header_banner.jpg"
              alt="Vietnam Landscape"
              className="w-full h-full object-cover opacity-50 transition-transform duration-[12s] hover:scale-105"
            />
          </div>
          <div className="relative z-10 text-center px-4">
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl">
              About <span className="text-[#db011c]">Vietnam</span>
            </h1>
          </div>
        </div>
      </AnimatedSection>

      {/* 2. Overview of Vietnam */}
      <section className="grid lg:grid-cols-12 gap-12 items-center">
        {/* Left Stats & Description */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatedSection direction="left" className="space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-[#db011c]">01</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-l-4 border-[#db011c] pl-3">
                Overview of Vietnam
              </h2>
            </div>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed font-light">
              Vietnam is a vibrant Southeast Asian country known for its stunning natural landscapes, rich history, and deep-rooted culture. Characterized by its iconic "S" shape, it offers a fascinating blend of bustling modern cities, ancient traditions, and incredible street food, all framed by a massive coastline.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { label: "Official Name", value: "Socialist Republic of Vietnam" },
                { label: "Capital", value: "Hanoi" },
                { label: "Largest City", value: "Ho Chi Minh City" },
                { label: "Population", value: "Over 102 million" },
                { label: "Currency", value: "Vietnamese Dong (VND)" },
                { label: "Language", value: "Vietnamese" },
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
            <div className="relative w-full h-[320px] lg:h-[400px] overflow-hidden rounded-3xl group shadow-sm">
              <img
                src="/about_vn/vietnam_overview.jpg"
                alt="Vietnam Overview"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* 3. Geography & Climate */}
      <section className="space-y-12">
        <AnimatedSection direction="up">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-[#db011c]">02</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-l-4 border-[#db011c] pl-3">
              Geography & Climate
            </h2>
          </div>
        </AnimatedSection>

        {/* Geography cards - Alternating Layout */}
        <div className="space-y-16">
          {[
            {
              title: "The North",
              img: "/about_vn/north_region.jpg",
              desc: "Home to the capital city, Hanoi, mountainous regions like Sa Pa and the spectacular limestone karsts of UNESCO-listed Halong Bay.",
            },
            {
              title: "The Central Region",
              img: "/about_vn/central_region.jpg",
              desc: "Famous for its historical heritage, including the ancient capital of Hue and the charming lantern-lit streets of Hoi An.",
            },
            {
              title: "The South",
              img: "/about_vn/south_region.jpg",
              desc: "Driven by the bustling economic hub of Ho Chi Minh City, the region is dominated by the fertile Mekong River Delta, known for its floating markets and dense fruit orchards.",
            },
          ].map((region, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div key={idx} className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                {/* Image container */}
                <div className={`lg:col-span-5 ${isEven ? "" : "lg:order-last"}`}>
                  <AnimatedSection direction={isEven ? "left" : "right"} className="group">
                    <div className="overflow-hidden rounded-3xl aspect-[16/10] relative shadow-sm">
                      <img
                        src={region.img}
                        alt={region.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </AnimatedSection>
                </div>
                {/* Content container */}
                <div className="lg:col-span-7 space-y-3">
                  <AnimatedSection direction={isEven ? "right" : "left"}>
                    <h3 className={`text-xl font-bold text-gray-900 ${isEven ? "" : "lg:text-right"}`}>{region.title}</h3>
                    <p className={`text-gray-500 font-light text-sm md:text-base leading-relaxed ${isEven ? "" : "lg:text-right"}`}>{region.desc}</p>
                  </AnimatedSection>
                </div>
              </div>
            );
          })}
        </div>

        {/* Climate information grid */}
        <div className="space-y-6 pt-8">
          <AnimatedSection direction="up">
            <h3 className="text-xl font-bold text-gray-900">Climate Across Regions</h3>
            <p className="text-gray-500 font-light text-sm">Vietnam features diverse climate profiles due to its long shape and varying terrain.</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 pb-12">
            {[
              {
                region: "The North",
                type: "Humid subtropical monsoon with four seasons",
                details: [
                  "Spring (Feb-Apr): Cool with light drizzle.",
                  "Summer (May-Aug): Hot, humid (28°C - 30°C).",
                  "Autumn (Sep-Oct): Cool and dry.",
                  "Winter (Nov-Jan): Cold, dry; can drop below 10°C in mountains.",
                ],
                style: "bg-blue-50/30 border-blue-100/30 text-blue-800",
                staggerClass: "md:translate-y-0",
              },
              {
                region: "The Central Region",
                type: "Hot dry Lao wind & frequent storms",
                details: [
                  "Dry season (Jan-Aug): Hot and dry weather.",
                  "Rainy season (Sep-Dec): Heavy rainfall, easily causes flooding.",
                ],
                style: "bg-amber-50/30 border-amber-100/30 text-amber-800",
                staggerClass: "md:translate-y-4",
              },
              {
                region: "The South",
                type: "Tropical monsoon with two main seasons",
                details: [
                  "Rainy season (May-Nov): Heavy rain usually in the afternoon.",
                  "Dry season (Dec-Apr): Hot weather with average temperatures of 25°C - 30°C.",
                ],
                style: "bg-emerald-50/30 border-emerald-100/30 text-emerald-800",
                staggerClass: "md:translate-y-8",
              },
            ].map((climate, idx) => (
              <AnimatedSection key={idx} direction="up" delay={idx * 150} className={`p-6 rounded-2xl border ${climate.style.split(" ")[1]} ${climate.style.split(" ")[0]} flex flex-col ${climate.staggerClass}`}>
                <h4 className="text-lg font-bold text-gray-900">{climate.region}</h4>
                <p className="text-xs font-semibold uppercase tracking-wider opacity-85 mt-1">{climate.type}</p>
                <ul className="space-y-2 text-sm text-gray-600 font-light pt-4 flex-1">
                  {climate.details.map((detail, dIdx) => (
                    <li key={dIdx} className="flex items-start gap-2">
                      <span className="text-[#db011c] mt-1.5">•</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Culture and Lifestyle */}
      <section className="space-y-16">
        <AnimatedSection direction="up">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black text-[#db011c]">03</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 border-l-4 border-[#db011c] pl-3">
              Culture and Lifestyle
            </h2>
          </div>
        </AnimatedSection>

        {/* 4.1 Lifestyle Section */}
        <div className="space-y-12">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 lg:order-first">
              <AnimatedSection direction="left" className="w-full">
                <div className="overflow-hidden rounded-3xl shadow-sm aspect-video">
                  <img
                    src="/about_vn/lifestyle.jpg"
                    alt="Traditional Dress"
                    className="w-full h-full object-cover"
                  />
                </div>
              </AnimatedSection>
            </div>
            
            <div className="lg:col-span-7 space-y-6">
              <AnimatedSection direction="right" className="space-y-6">
                <h3 className="text-2xl font-extrabold text-gray-900 border-b-2 border-gray-200 pb-2">
                  Lifestyle
                </h3>
                <p className="text-gray-500 font-light text-sm md:text-base leading-relaxed">
                  Daily life in Vietnam is a beautiful blend of active modernization and age-old values. From early morning exercises around lakes to late-night street vendor conversations, the lifestyle balances rapid urban development with a relaxed, community-oriented pace.
                </p>
              </AnimatedSection>
            </div>
          </div>

          {/* Regional Lifestyle & Culinary Styles (Alternating layouts for subheadings/dishes) */}
          <div className="space-y-12 pt-6">
            {[
              {
                region: "The Northern Lifestyle & Cuisine",
                tagline: "Refined flavors, rich in traditional taste",
                dishes: [
                  { name: "Phở", img: "/about_vn/north_pho.jpg" },
                  { name: "Bún Chả", img: "/about_vn/north_buncha.jpg" },
                  { name: "Bánh Cuốn Thanh Trì", img: "/about_vn/north_banhcuon.jpg" },
                  { name: "Chả Cá Lã Vọng", img: "/about_vn/north_chaca.jpg" }
                ],
              },
              {
                region: "The Central Lifestyle & Cuisine",
                tagline: "Rich, spicy, and diverse in flavor",
                dishes: [
                  { name: "Bún Bò Huế", img: "/about_vn/central_bunbo.jpg" },
                  { name: "Mì Quảng", img: "/about_vn/central_miquang.jpg" },
                  { name: "Cao Lầu Hội An", img: "/about_vn/central_caolau.jpg" },
                  { name: "Bánh Xèo Miền Trung", img: "/about_vn/central_banhxeo.jpg" }
                ],
              },
              {
                region: "The Southern Lifestyle & Cuisine",
                tagline: "Rustic, diverse, with a naturally sweet flavor",
                dishes: [
                  { name: "Cơm Tấm", img: "/about_vn/south_comtam.jpg" },
                  { name: "Lẩu Mắm", img: "/about_vn/south_laumam.jpg" },
                  { name: "Hủ Tiếu Nam Vang", img: "/about_vn/south_hutieu.jpg" },
                  { name: "Bánh Xèo Miền Nam", img: "/about_vn/south_banhxeo.jpg" }
                ],
              },
            ].map((section, idx) => {
              const isEven = idx % 2 === 0;
              return (
                <AnimatedSection key={idx} direction={isEven ? "left" : "right"} className="space-y-4">
                  <div className="grid md:grid-cols-12 gap-6 items-center">
                    {/* Text header info */}
                    <div className={`md:col-span-5 space-y-2 ${isEven ? "" : "md:order-last md:text-right"}`}>
                      <div className={`border-[#db011c] ${isEven ? "border-l-3 pl-3" : "md:border-r-3 border-l-3 md:border-l-0 pl-3 md:pl-0 md:pr-3"}`}>
                        <h4 className="text-lg font-bold text-gray-900">{section.region}</h4>
                        <p className="text-xs text-gray-500 font-medium tracking-wide mt-0.5">{section.tagline}</p>
                      </div>
                    </div>
                    {/* Small image/tag grid */}
                    <div className="md:col-span-7">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {section.dishes.map((dish, dIdx) => (
                          <div key={dIdx} className="flex items-center gap-3 bg-white/25 backdrop-blur-sm p-2 rounded-xl border border-gray-200/10 hover:bg-white/40 transition-all duration-300 group">
                            <div className="overflow-hidden rounded-lg w-12 h-12 flex-shrink-0 relative shadow-sm">
                              <img
                                src={dish.img}
                                alt={dish.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            </div>
                            <span className="text-xs font-bold text-gray-800 tracking-wide">{dish.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>

        {/* 4.2 Culture Section (Contains culinary specialties, national symbols, and mythical creatures) */}
        <div className="space-y-16 border-t border-gray-200/50 pt-16">
          
          <AnimatedSection direction="up" className="space-y-4">
            <h3 className="text-2xl font-extrabold text-gray-900 border-b-2 border-gray-200 pb-2">
              Culture
            </h3>
            <p className="text-gray-500 font-light text-sm md:text-base leading-relaxed">
              Vietnamese culture is heavily centered around family, community, and respect for heritage. With 54 distinct ethnic groups, the country boasts a rich diversity of traditions, arts, and crafts.
            </p>
          </AnimatedSection>

          {/* Culture Subdivision 1: Iconic Culinary Specialties */}
          <div className="space-y-6">
            <AnimatedSection direction="left">
              <h4 className="text-lg font-bold text-gray-800 border-l-3 border-[#db011c] pl-2.5">
                Iconic Culinary Specialties
              </h4>
              <p className="text-xs text-gray-500 font-light mt-1">Dishes that define the rich flavor landscape of Vietnam.</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-6 pb-8">
              {[
                {
                  name: "Phở",
                  img: "/about_vn/iconic_pho.jpg",
                  desc: "A savory noodle soup brewed for hours with spices, beef bone broth, and served hot with fresh herbs.",
                },
                {
                  name: "Bánh Mì",
                  img: "/about_vn/iconic_banhmi.jpg",
                  desc: "A crispy baguette stuffed with pate, cold cuts, pickled daikon, cucumber, cilantro, and chili.",
                },
                {
                  name: "Gỏi Cuốn",
                  img: "/about_vn/iconic_goicuon.jpg",
                  desc: "Fresh, healthy spring rolls wrapping shrimp, pork slices, herbs, and vermicelli in translucent rice paper.",
                },
              ].map((food, idx) => (
                <AnimatedSection key={idx} direction="up" delay={idx * 150} className={`flex items-center gap-4 bg-white/20 backdrop-blur-sm p-3 rounded-2xl border border-gray-200/20 hover:bg-white/40 transition-all duration-300 group ${idx === 0 ? "md:translate-y-0" : idx === 1 ? "md:translate-y-4" : "md:translate-y-8"}`}>
                  <div className="overflow-hidden rounded-xl w-20 h-20 flex-shrink-0 relative shadow-sm">
                    <img
                      src={food.img}
                      alt={food.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-gray-900">{food.name}</h5>
                    <p className="text-[11px] text-gray-500 font-light leading-relaxed mt-1 line-clamp-2">{food.desc}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Culture Subdivision 2: National Symbols */}
          <div className="space-y-6">
            <AnimatedSection direction="left">
              <h4 className="text-lg font-bold text-gray-800 border-l-3 border-[#db011c] pl-2.5">
                National Symbols
              </h4>
              <p className="text-xs text-gray-500 font-light mt-1">Official emblems and natural components representing sovereignty.</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-3 gap-8 pb-12">
              {[
                {
                  title: "National Flower (Lotus)",
                  img: "/about_vn/symbol_lotus.jpg",
                  desc: "The Lotus (Hoa Sen) represents purity, serenity, and strength, symbolizing the spirit of the Vietnamese people rising above mud and hardships to bloom.",
                },
                {
                  title: "Emblems & Flag",
                  img: "/about_vn/symbol_flag.jpg",
                  desc: "The National Flag features a bright yellow star on a crimson background. The red represents revolutionary struggle, while the five points of the golden star represent class unity.",
                },
                {
                  title: "Natural Elements",
                  img: "/about_vn/symbol_nature.jpg",
                  desc: "Limestone peaks, coastlines, and major river deltas define the geography, reflecting the natural adaptability and resilience of the local community.",
                },
              ].map((symbol, idx) => (
                <AnimatedSection key={idx} direction="up" delay={idx * 150} className={`flex flex-col space-y-3 group ${idx === 0 ? "md:translate-y-0" : idx === 1 ? "md:translate-y-6" : "md:translate-y-12"}`}>
                  <div className="overflow-hidden rounded-3xl aspect-[4/3] relative shadow-sm">
                    <img
                      src={symbol.img}
                      alt={symbol.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h5 className="text-base font-bold text-gray-900 px-1">{symbol.title}</h5>
                  <p className="text-xs text-gray-500 font-light leading-relaxed px-1">{symbol.desc}</p>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Culture Subdivision 3: Mythical Creatures (Tứ Linh) */}
          <div className="space-y-6">
            <AnimatedSection direction="left">
              <h4 className="text-lg font-bold text-gray-800 border-l-3 border-[#db011c] pl-2.5">
                Mythical Creatures (Tứ Linh)
              </h4>
              <p className="text-xs text-gray-500 font-light mt-1">The Four Holy Guardians guarding history, culture, and architecture.</p>
            </AnimatedSection>

            <div className="grid md:grid-cols-4 gap-6 pb-8">
              {[
                {
                  name: "Long (Dragon)",
                  img: "/about_vn/creature_dragon.jpg",
                  meaning: "Symbol of imperial power, noble birth, and agricultural abundance. Vietnamese people proudly identify as descendants of the Dragon (Con Rồng Cháu Tiên).",
                },
                {
                  name: "Lân (Qilin / Lion)",
                  img: "/about_vn/creature_qilin.jpg",
                  meaning: "Symbol of benevolence, peace, prosperity, and authority. Statues of Lân are commonly placed at gates of pagodas and houses to ward off negative energy.",
                },
                {
                  name: "Quy (Tortoise)",
                  img: "/about_vn/creature_tortoise.jpg",
                  meaning: "Symbol of longevity, health, and academic wisdom. Famously depicted carrying stone steles of doctoral laureates at Hanoi's Temple of Literature.",
                },
                {
                  name: "Phụng (Phoenix)",
                  img: "/about_vn/creature_phoenix.jpg",
                  meaning: "Symbol of nobility, grace, peace, and rebirth. Commonly paired alongside the dragon to represent harmony and royal elegance.",
                },
              ].map((creature, idx) => (
                <AnimatedSection key={idx} direction="up" delay={idx * 150} className={`flex flex-col space-y-3 group ${idx % 2 === 0 ? "md:-translate-y-4" : "md:translate-y-4"}`}>
                  <div className="overflow-hidden rounded-3xl aspect-[3/4] relative shadow-sm">
                    <img
                      src={creature.img}
                      alt={creature.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h5 className="text-base font-bold text-gray-900 px-1">{creature.name}</h5>
                  <p className="text-xs text-gray-500 font-light leading-relaxed px-1">{creature.meaning}</p>
                </AnimatedSection>
              ))}
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
