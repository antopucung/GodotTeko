'use client'

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { formatNumber } from "@/lib/utils";
import { useResponsive } from "@/hooks/useResponsive";
import { cn } from "@/styles/component-variants";

export default function HeroSection() {
  const { hero } = siteConfig;
  const { isMobile, isTablet } = useResponsive();

  return (
    <section className="relative bg-ui8-background overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=1080&fit=crop')"
        }}
      />

      <div className={cn(
        "relative z-10 container-ui8",
        isMobile ? "py-12" : isTablet ? "py-16" : "py-20"
      )}>
        <div className="text-center">
          {/* Main Headline */}
          <h1 className={cn(
            "font-medium text-ui8-text-primary leading-tight",
            isMobile
              ? "text-3xl mb-4"
              : isTablet
                ? "text-4xl mb-5"
                : "text-4xl lg:text-5xl xl:text-6xl mb-6"
          )}>
            {formatNumber(hero.stats.resources)} curated design resources to
            {!isMobile && <br />}
            {isMobile && " "}
            speed up your creative workflow.
          </h1>

          {/* Subtitle */}
          <p className={cn(
            "text-ui8-text-secondary max-w-3xl mx-auto",
            isMobile
              ? "text-base mb-8"
              : isTablet
                ? "text-lg mb-10"
                : "text-xl mb-12"
          )}>
            Join a growing family of {formatNumber(hero.stats.members)} designers and makers from around the world.
          </p>


        </div>
      </div>
    </section>
  );
}
