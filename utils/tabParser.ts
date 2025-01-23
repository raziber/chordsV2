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

  async getData(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      return HtmlUtils.decode(html);
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
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
    const preSongMetadataEndText = '"content":"';

    const match = HtmlUtils.findTextBetween(
      preSongMetadataStartText,
      preSongMetadataEndText,
      html
    );
    if (match[0]) {
      return '"id":' + match[0];
    }
    return "";
  }

  private findPreIntro(html: string): string {
    const preIntroStartText = '"content":"';
    const preIntroEndText = "[Intro]";

    const match = HtmlUtils.findTextBetween(
      preIntroStartText,
      preIntroEndText,
      html
    );
    if (match[0]) {
      return match[0];
    }
    return "";
  }

  private findSong(html: string): string {
    const songStartText = "[Intro]";
    const songStartTextAlt = '"content":"';
    const songEndText = '","revision_id';

    const match = HtmlUtils.findTextBetween(
      songStartTextAlt,
      songEndText,
      html
    );
    if (!match[0]) {
      return "";
    }
    const matchAlt = HtmlUtils.findTextBetween(
      songStartText,
      songEndText,
      match[0]
    );
    return match[0];
  }

  private findPostSongMetadata(html: string): string {
    const postSongMetadataStartText = ',"strummings":';
    const postSongMetadataEndText = "}";
    // don't know the ending yet

    const match = HtmlUtils.findTextBetween(
      postSongMetadataStartText,
      postSongMetadataEndText,
      html
    );
    if (match[0]) {
      return match[0];
    }
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
    return preIntroPart;
  }

  parseSong(songPart: string): SongTypes.Section[] {
    let parsedSections: SongTypes.Section[] = [];

    const sections = this.splitToSections(songPart);
    sections.forEach((section) => {
      parsedSections.push(this.parseSection(section));
    });
    return parsedSections;
  }

  splitToSections(content: string): { title: string; lines: string }[] {
    if (!content.trim()) {
      return [{ title: "No Song...", lines: "" }];
    }

    const sections = this.extractSections(content);
    return sections.length > 0
      ? sections
      : [{ title: "Intro", lines: content.trim() }];
  }

  private extractSections(content: string): { title: string; lines: string }[] {
    const sectionRegex = /\[(.*?)\]([^[]*)/g;
    const sections: { title: string; lines: string }[] = [];
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      sections.push({
        title: match[1].trim(),
        lines: match[2],
      });
    }

    return sections;
  }

  splitToLines(content: string): string[] {
    if (!content) return [];

    const parts = this.splitByTabSections(content);
    return this.processLineParts(parts);
  }

  private splitByTabSections(
    content: string
  ): { text: string; isTab: boolean }[] {
    const tabSections = this.findTabSections(content);
    return this.createContentParts(content, tabSections);
  }

  private findTabSections(
    content: string
  ): { start: number; end: number; text: string }[] {
    const sections: { start: number; end: number; text: string }[] = [];
    const tabRegex = /\[tab\](.*?)\[\/tab\]/gs;
    let match;

    while ((match = tabRegex.exec(content)) !== null) {
      sections.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
      });
    }

    return sections;
  }

  private createContentParts(
    content: string,
    tabSections: { start: number; end: number; text: string }[]
  ): { text: string; isTab: boolean }[] {
    if (tabSections.length === 0) {
      return [{ text: content, isTab: false }];
    }

    const parts: { text: string; isTab: boolean }[] = [];
    let lastIndex = 0;

    tabSections.forEach((section) => {
      if (lastIndex < section.start) {
        parts.push({
          text: content.slice(lastIndex, section.start),
          isTab: false,
        });
      }

      parts.push({
        text: section.text,
        isTab: true,
      });

      lastIndex = section.end;
    });

    if (lastIndex < content.length) {
      parts.push({
        text: content.slice(lastIndex),
        isTab: false,
      });
    }

    return parts;
  }

  private processLineParts(
    parts: { text: string; isTab: boolean }[]
  ): string[] {
    return parts.flatMap((part) => {
      if (part.isTab) {
        return [part.text];
      }
      return part.text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    });
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
}
