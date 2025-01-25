import Cache from "./cacheUtils";
import HtmlUtils from "./htmlUtils";
import LineParser from "./lineParser";
import { SongLine, SongTypes } from "@/types/types";

export class TabParser {
  async parseTab(url: string): Promise<SongTypes.Song | null> {
    const data = await this.getData(url);
    if (!data) return null;

    const jsonData = this.jsonifyTabPage(data);
    if (!jsonData) return null;

    const parsedData = this.parseParts(jsonData);
    console.log("Parsed data:", JSON.stringify(parsedData));
    return parsedData;
  }

  jsonifyTabPage(data: string): any {
    try {
      const content = HtmlUtils.findTextBetween(
        'data-content="',
        '"></div>',
        data
      );
      if (!content[0]) return null;
      const parsedJson = JSON.parse(content[0] || "");
      return parsedJson;
    } catch (error) {
      console.error("Error parsing JSON:", error);
      return null;
    }
  }

  async getData(url: string): Promise<string | null> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const cleanedHtml = HtmlUtils.decode(html);
      return HtmlUtils.simplifyNewlines(cleanedHtml);
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

  parseParts(jsonData: any): SongTypes.Song {
    const metadata = this.parseMetadata(
      jsonData.store.page.data.tab,
      jsonData.store.page.data.tab_view.strummings,
      jsonData.store.page.data.tab_view.meta
    );
    const versions = this.parseVersions(
      jsonData.store.page.data.tab_view.versions
    );
    const [preIntro, song] = this.parseSong(
      jsonData.store.page.data.tab_view.wiki_tab.content
    );

    return {
      metadata,
      preIntro,
      song,
      versions,
    };
  }

  parseVersions(versionsPart: any[]): SongTypes.Version[] {
    if (!Array.isArray(versionsPart)) return [];

    return versionsPart.map((version: any) => ({
      versionId: version.id,
      songId: version.song_id,
      songName: version.song_name,
      artistId: version.artist_id,
      artistName: version.artist_name,
      type: version.type,
      part: version.part,
      version: version.version,
      votes: version.votes,
      difficulty: version.difficulty || "",
      rating: version.rating,
      date: version.date,
      status: version.status,
      presetId: version.preset_id,
      tabAccessType: version.tab_access_type,
      tpVersion: version.tp_version,
      tonalityName: version.tonality_name || "",
      versionDescription: version.version_description,
      verified: version.verified,
      recording: {
        isAcoustic: version.recording?.is_acoustic || 0,
        tonalityName: version.recording?.tonality_name || "",
        performance: version.recording?.performance || null,
        recordingArtists: version.recording?.recording_artists || [],
      },
      albumCover: {
        hasAlbumCover: version.album_cover?.has_album_cover || false,
        webAlbumCover: {
          small: version.album_cover?.web_album_cover?.small || "",
        },
      },
      artistCover: {
        hasArtistCover: version.artist_cover?.has_artist_cover || false,
        webArtistCover: {
          small: version.artist_cover?.web_artist_cover?.small || "",
        },
      },
      artistUrl: version.artist_url,
      tabUrl: version.tab_url,
      dateUpdate: version.date_update,
      userId: version.user_id,
      userIq: version.user_iq,
      username: version.username,
      typeName: version.type_name,
      bestProTabUrl: version.best_pro_tab_url,
    }));
  }

  parseMetadata(
    tabPart: any,
    strummingsPart: any[],
    metaPart: any
  ): SongTypes.Metadata {
    try {
      return {
        songId: tabPart.song_id,
        songName: tabPart.song_name,
        artistId: tabPart.artist_id,
        artistName: tabPart.artist_name,
        tabType: tabPart.type,
        version: tabPart.version,
        votes: tabPart.votes,
        rating: tabPart.rating,
        status: tabPart.status,
        tonality: metaPart.tonality || tabPart.tonality_name,
        tuning: {
          name: metaPart.tuning?.name || "Standard",
          value: metaPart.tuning?.value || "E A D G B E",
        },
        capo: metaPart.capo || 0,
        difficulty: metaPart.difficulty || "Unknown",
        presetId: tabPart.preset_id,
        date: tabPart.date,
        dateUpdate: tabPart.date_update,
        verified: tabPart.verified,
        typeName: tabPart.type_name,
        versionDescription: tabPart.version_description,
        bestProTabUrl: tabPart.best_pro_tab_url,
        userId: tabPart.user_id,
        userIq: tabPart.user_iq,
        username: tabPart.username,
        tabUrl: tabPart.tab_url,
        artistUrl: tabPart.artist_url,
        albumCover: tabPart.album_cover?.web_album_cover?.small || "",
        artistCover: tabPart.artist_cover?.web_artist_cover?.small || "",
        tabAccessType: tabPart.tab_access_type,
        tpVersion: tabPart.tp_version,
        recording: {
          isAcoustic: tabPart.recording?.is_acoustic || 0,
          tonalityName: tabPart.recording?.tonality_name || "",
          performance: tabPart.recording?.performance || null,
          recordingArtists: tabPart.recording?.recording_artists || [],
        },
        strummings: strummingsPart.map((strum: any) => ({
          part: strum.part,
          bpm: strum.bpm,
          denominator: strum.denuminator,
          isTriplet: strum.is_triplet,
          measures: strum.measures.map((m: any) => m.measure),
        })),
      };
    } catch (error) {
      console.log("Failed to parse metadata", error);
      return {
        songId: 0,
        songName: "",
        artistId: 0,
        artistName: "",
        tabType: "",
        version: 0,
        votes: 0,
        rating: 0,
        status: "",
        tonality: "",
        tuning: { name: "Standard", value: "E A D G B E" },
        capo: 0,
        difficulty: "Unknown",
        presetId: 0,
        date: "",
        dateUpdate: "",
        verified: 0,
        typeName: "",
        versionDescription: "",
        bestProTabUrl: "",
        userId: 0,
        userIq: 0,
        username: "",
        tabUrl: "",
        artistUrl: "",
        albumCover: "",
        artistCover: "",
        tabAccessType: "",
        tpVersion: 0,
        recording: {
          isAcoustic: 0,
          tonalityName: "",
          performance: null,
          recordingArtists: [],
        },
        strummings: [],
      };
    }
  }

  parsePreIntro(preIntroPart: string): string {
    // Implement logic to parse pre-intro
    return preIntroPart;
  }

  parseSong(input: string): [string, SongTypes.Section[]] {
    const [preIntroPart, songPart] = this.splitByIntro(input);
    const preIntro = this.parsePreIntro(preIntroPart);
    const sections = this.parsePostIntro(songPart);
    return [preIntro, sections];
  }

  /**
   * Splits the content into the intro and the rest of the song
   * Finds the first occurrence of [Intro] and splits the content by it
   * If no [Intro] is found, returns an empty string for the intro
   * and the whole content as the rest of the song
   *
   * @param content input content
   * @returns tuple of intro and the rest of the song
   */
  splitByIntro(content: string): [string, string] {
    const introStart = content.indexOf("[Intro]");
    if (introStart === -1) {
      return ["", content];
    }

    return [content.slice(0, introStart), content.slice(introStart)];
  }

  parsePostIntro(songPart: string): SongTypes.Section[] {
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
      : [{ title: "Intro", lines: content }];
  }

  private extractSections(content: string): { title: string; lines: string }[] {
    const sectionRegex =
      /\[(?!(?:\/)?(?:ch|tab)\])([^\]]+)\]([\s\S]*?)(?=\[(?!(?:\/)?(?:ch|tab)\])[^\]]+\]|$)/g;
    const sections: { title: string; lines: string }[] = [];
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      sections.push({
        title: match[1].trim(),
        lines: match[2].replace(/^\n+|\n+$/g, ""),
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
