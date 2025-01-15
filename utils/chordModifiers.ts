// list in the order to search in
export const MODIFIERS = [
  "m", // minor
  "aug", // augmented
  "dim", // diminished

  "maj7",
  "maj9",
  "maj11",
  "maj13",

  "sus2", // suspended second
  "sus4", // suspended fourth

  "add9",
  "add11",
  "add13",

  "5",
  "7",
  "9",
  "11",
  "13",

  "b5",
  "#5",
  "b9",
  "#9",
  "b11",
  "#11",
  "b13",
  "#13",
] as const;

export const INVALID_COMBINATIONS = [
  { modifiers: ["m", "+"], message: "Can't be minor and augmented" },
  { modifiers: ["sus2", "sus4"], message: "Can't have both sus2 and sus4" },
  { modifiers: ["7", "maj7"], message: "Can't have both 7 and maj7" },
  { modifiers: ["dim", "maj"], message: "Can't be diminished and major" },
  { modifiers: ["dim", "+"], message: "Can't be diminished and augmented" },
  { modifiers: ["m", "dim"], message: "Can't be minor and diminished" },
  {
    modifiers: ["add2", "sus2"],
    message: "Can't add2 when sus2 is already present",
  },
  {
    modifiers: ["add4", "sus4"],
    message: "Can't add4 when sus4 is already present",
  },
  {
    modifiers: ["6", "13"],
    message: "6 is redundant if 13 is already present",
  },
  {
    modifiers: ["add9", "9"],
    message: "Can't use add9 when 9 is already implied",
  },
  {
    modifiers: ["add11", "11"],
    message: "Can't use add11 when 11 is already implied",
  },
  {
    modifiers: ["add13", "13"],
    message: "Can't use add13 when 13 is already implied",
  },
  {
    modifiers: ["ø", "dim"],
    message: "Can't be both half-diminished and fully diminished",
  },
  { modifiers: ["ø", "maj"], message: "Can't be half-diminished and major" },
  { modifiers: ["sus2", "m"], message: "Can't have both sus2 and minor third" },
  { modifiers: ["sus4", "m"], message: "Can't have both sus4 and minor third" },
  {
    modifiers: ["sus4", "maj"],
    message: "Can't have both sus4 and major third",
  },
  { modifiers: ["maj7", "m"], message: "Can't have both major 7th and minor" },
  {
    modifiers: ["7", "m△"],
    message: "Can't have both dominant 7th and minor with major 7th",
  },
  {
    modifiers: ["dim", "add9"],
    message: "Diminished chords can't have added 9th",
  },
  {
    modifiers: ["dim", "add11"],
    message: "Diminished chords can't have added 11th",
  },
  {
    modifiers: ["dim", "add13"],
    message: "Diminished chords can't have added 13th",
  },
  {
    modifiers: ["m7b5", "dim7"],
    message: "Can't be both half-diminished and fully diminished",
  },
  {
    modifiers: ["maj13", "7"],
    message: "Can't have both major 13th and dominant 7th",
  },
  {
    modifiers: ["ø", "add13"],
    message: "Half-diminished chords can't have added 13th",
  },
] as const;
