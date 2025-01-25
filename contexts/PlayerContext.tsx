import React, { createContext, useContext, useState } from "react";
import { RawSearchResult } from "@/utils/searchParser";
import { SongTypes } from "@/types/types";

interface PlayerContextType {
  isExpanded: boolean;
  currentTrack: Track | null;
  isLoading: boolean;
  scrollPosition: number;
  setIsExpanded: (expanded: boolean) => void;
  setCurrentTrack: (track: Track | null) => void;
  setIsLoading: (loading: boolean) => void;
  setScrollPosition: (position: number) => void;
}

export interface Track extends RawSearchResult {
  parsedTab?: SongTypes.Song | null;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // Reset scroll position when changing tracks
  const setCurrentTrackWithReset = (track: Track | null) => {
    setCurrentTrack(track);
    setScrollPosition(0);
  };

  return (
    <PlayerContext.Provider
      value={{
        isExpanded,
        currentTrack,
        isLoading,
        scrollPosition,
        setIsExpanded,
        setCurrentTrack: setCurrentTrackWithReset,
        setIsLoading,
        setScrollPosition,
      }}
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
