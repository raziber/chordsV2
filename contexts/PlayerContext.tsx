import React, { createContext, useContext, useState } from "react";
import { RawSearchResult } from "@/utils/searchParser";

interface PlayerContextType {
  isExpanded: boolean;
  currentTrack: RawSearchResult | null;
  setIsExpanded: (expanded: boolean) => void;
  setCurrentTrack: (track: RawSearchResult | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<RawSearchResult | null>(
    null
  );

  return (
    <PlayerContext.Provider
      value={{ isExpanded, currentTrack, setIsExpanded, setCurrentTrack }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
}
