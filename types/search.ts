export interface SearchResult {
  id: number;
  song_name: string;
  artist_name: string;
  artist_id?: number;
  votes: number;
  image_url?: string;
}
