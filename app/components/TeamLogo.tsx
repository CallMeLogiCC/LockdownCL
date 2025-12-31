"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getTeamLogo } from "@/lib/teams";
import type { LeagueKey } from "@/lib/league";

type Props = {
  teamSlug: string;
  league: LeagueKey;
  alt: string;
  size?: number;
  className?: string;
};

export default function TeamLogo({ teamSlug, league, alt, size = 40, className }: Props) {
  const { src, fallbacks, defaultSrc } = useMemo(
    () => getTeamLogo(teamSlug, league),
    [teamSlug, league]
  );
  const sources = useMemo(() => [src, ...fallbacks, defaultSrc], [src, fallbacks, defaultSrc]);
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <Image
      src={sources[currentIndex]}
      alt={alt}
      width={size}
      height={size}
      className={className}
      onError={() => {
        setCurrentIndex((prev) => (prev < sources.length - 1 ? prev + 1 : prev));
      }}
    />
  );
}
