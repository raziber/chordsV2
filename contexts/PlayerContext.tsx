import React, { createContext, useContext, useState } from "react";
import { RawSearchResult } from "@/utils/searchParser";
import { SongTypes } from "@/types/types";

interface PlayerContextType {
  isExpanded: boolean;
  currentTrack: Track | null;
  isLoading: boolean;
  setIsExpanded: (expanded: boolean) => void;
  setCurrentTrack: (track: Track | null) => void;
  setIsLoading: (loading: boolean) => void;
  setScrollPosition: (songId: number, position: number) => void;
  getScrollPosition: (songId: number) => number;
}

export interface Track extends RawSearchResult {
  parsedTab?: SongTypes.Song | null;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollPositions, setScrollPositions] = useState<
    Record<number, number>
  >({});

  const setScrollPosition = (songId: number, position: number) => {
    setScrollPositions((prev) => ({ ...prev, [songId]: position }));
  };

  const getScrollPosition = (songId: number) => {
    return scrollPositions[songId] || 0;
  };

  return (
    <PlayerContext.Provider
      value={{
        isExpanded,
        currentTrack,
        isLoading,
        setIsExpanded,
        setCurrentTrack,
        setIsLoading,
        setScrollPosition,
        getScrollPosition,
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
