"use client";

import { usePathname } from "next/navigation";

interface LayoutContentWrapperProps {
  children: React.ReactNode;
}

export default function LayoutContentWrapper({ children }: LayoutContentWrapperProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isAboutSHTP = pathname === "/introduction/about_shtp";
  const isFullBleed = isHome || isAboutSHTP;

  return (
    <div className={`${isFullBleed ? "p-0" : "p-6 md:p-8"} flex-1 flex flex-col`}>
      {children}
    </div>
  );
}
