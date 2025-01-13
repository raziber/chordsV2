import React, { createContext, useContext, useState } from "react";
import { RawSearchResult } from "@/utils/searchParser";
import { ParsedTab } from "@/utils/tabParser";

interface PlayerContextType {
  isExpanded: boolean;
  currentTrack: Track | null;
  setIsExpanded: (expanded: boolean) => void;
  setCurrentTrack: (track: Track | null) => void;
}

export interface Track extends RawSearchResult {
  parsedTab?: ParsedTab | null;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

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
