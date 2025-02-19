export const testSong = {
  metadata: {
    title: "Amazing Grace",
    artist: "Traditional",
  },
  song: [
    {
      title: "Verse 1",
      lines: [
        {
          lyrics: "Amazing grace how sweet the sound",
          chords: [
            { chord: "G", position: 1.5 },
            { chord: "C", position: 18.5 },
            { chord: "G", position: 28.5 },
          ],
        },
        {
          lyrics: "That saved a wretch like me",
          chords: [
            { chord: "Em", position: 6 },
            { chord: "D", position: 14.5 },
            { chord: "G", position: 25.5 },
          ],
        },
      ],
    },
  ],
} as const;
