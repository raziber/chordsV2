import Cache from "./cacheUtils";
import HtmlUtils from "./htmlUtils";
import LineParser from "./lineParser";
import { SongLine, SongTypes } from "@/types/types";

export class TabParser {
  async parseTab(url: string): Promise<SongTypes.Song | null> {
    const data = await this.getData(url);
    if (!data) return null;
    return this.parseParts(this.splitToParts(data));
  }

  async getData(url: string): Promise<string> {
    const response = await fetch(url);
    const html = await response.text();
    const decodedHtml = HtmlUtils.decode(html);

    return decodedHtml;
  }

  splitToParts(html: string): [string, string, string, string] {
    const preSongMetadataPart = this.findPreSongMetadata(html);
    const preIntroPart = this.findPreIntro(html);
    const songPart = this.findSong(html);
    const postSongMetadataPart = this.findPostSongMetadata(html);

    return [preSongMetadataPart, preIntroPart, songPart, postSongMetadataPart];
  }

  private findPreSongMetadata(html: string): string {
    const preSongMetadataStartText = ',"tab":{"id":';
    const preSongMetadataEndText = ',"content":"';
    return "";
  }

  private findPreIntro(html: string): string {
    const preIntroStartText = '{"content":"';
    const preIntroEndText = "[Intro]";
    // if not found, return empty string
    return "";
  }

  private findSong(html: string): string {
    const songStartText = "[Intro]";
    const songStartTextAlt = '{"content":"';
    const songEndText = '","revision_id';
    return "";
  }

  private findPostSongMetadata(html: string): string {
    const postSongMetadataStartText = ',"strummings":';
    // don't know the ending yet
    return "";
  }

  parseParts(parts: [string, string, string, string]): SongTypes.Song {
    const [preSongMetadataPart, preIntroPart, songPart, postSongMetadataPart] =
      parts;

    const metadata = this.parseMetadata(
      preSongMetadataPart,
      postSongMetadataPart
    );
    const preIntro = this.parsePreIntro(preIntroPart);
    const song = this.parseSong(songPart);

    return {
      metadata,
      preIntro,
      song,
    };
  }

  parseMetadata(
    preSongMetadataPart: string,
    postSongMetadataPart: string
  ): SongTypes.Metadata {
    // Implement logic to parse metadata
    return {
      title: "",
      artist: "",
      album: "",
      year: "",
    };
  }

  parsePreIntro(preIntroPart: string): string {
    // Implement logic to parse pre-intro
    return "";
  }

  parseSong(songPart: string): SongTypes.Section[] {
    let parsedSections: SongTypes.Section[] = [];

    const sections = this.splitToSections(songPart);
    sections.forEach((section) => {
      parsedSections.push(this.parseSection(section));
    });
    return parsedSections;
  }

  splitToSections(songPart: string): Array<{ title: string; lines: string }> {
    // Implement logic to split song part into sections
    return [{ title: "Intro", lines: "" }];
  }

  parseSection(section: { title: string; lines: string }): SongTypes.Section {
    const parsedLines: SongLine.Line[] = [];
    const lines = this.splitToLines(section.lines);
    lines.forEach((line) => {
      parsedLines.push(LineParser.parseLine(line));
    });

    return {
      title: section.title,
      lines: parsedLines,
    };
  }

  splitToLines(section: string): string[] {
    // Implement logic to split section into lines
    return [];
  }
}
