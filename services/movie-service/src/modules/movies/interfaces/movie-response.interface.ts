export interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  mediaUrl: string;
  duration: number;
  status: string;
  viewCount: number;
  createdAt: Date;
}

export interface Premiere {
  id: string;
  title: string;
  thumbnail: string;
  releaseDate: Date;
  creatorId: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  movieId: string;
  addedAt: Date;
}

export interface LibraryItem {
  id: string;
  userId: string;
  movieId: string;
  purchasedAt: Date;
}

export interface MovieResponse {
  success: boolean;
  data?: {
    movies?: Movie[];
    movie?: Movie;
    premieres?: Premiere[];
    watchlist?: WatchlistItem[];
    library?: LibraryItem[];
    message?: string;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
  };
}
