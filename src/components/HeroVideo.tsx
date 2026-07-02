"use client";

import { useState, useRef, useEffect } from "react";
import { 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon, 
  PlayIcon, 
  PauseIcon 
} from "@heroicons/react/24/outline";

interface HeroVideoProps {
  children: React.ReactNode;
}

export default function HeroVideo({ children }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      const currentMute = videoRef.current.muted;
      videoRef.current.muted = !currentMute;
      setIsMuted(!currentMute);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((err) => {
          console.warn("Autoplay / Play was prevented:", err);
        });
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Sync state in case browser policy modifies playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden min-h-[75vh] flex items-center justify-center py-20 bg-transparent">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/landing_page/landingpage_clip.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 w-full px-8 md:px-16">
        {children}
      </div>

      {/* Glassmorphic Playback Controls */}
      <div className="absolute bottom-6 right-8 z-20 flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/25 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
          title={isPlaying ? "Pause" : "Play"}
          aria-label={isPlaying ? "Pause background video" : "Play background video"}
        >
          {isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={toggleMute}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/25 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
          title={isMuted ? "Unmute" : "Mute"}
          aria-label={isMuted ? "Unmute background video" : "Mute background video"}
        >
          {isMuted ? (
            <SpeakerXMarkIcon className="w-5 h-5" />
          ) : (
            <SpeakerWaveIcon className="w-5 h-5" />
          )}
        </button>
      </div>
    </section>
  );
}
