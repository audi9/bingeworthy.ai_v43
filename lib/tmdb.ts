import type { SearchResult } from "./movie-api"

export async function fetchFromTMDB(query: string): Promise<SearchResult[]> {
console.log("Inside fetchFromTMDB")    
// TMDB API configuration - Free API with 1000 requests per day
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

// You can get your free TMDB API key from: https://www.themoviedb.org/settings/api
// Free tier: 1000 requests per day, no expiration
const TMDB_API_KEY = process.env.TMDB_API_KEY || "your_tmdb_api_key_here"

  if (!process.env.TMDB_API_KEY) {
    console.warn("⚠️ TMDB_API_KEY not set")
    return []
  }

  try {
    const url = `${TMDB_BASE_URL}/configuration?api_key=${TMDB_API_KEY}&s=${encodeURIComponent(query)}`
    const resp = await fetch(url)
    const data = await resp.json()

    if (!data.Search) return []

    return data.Search.map((item: any) => ({
      id: item.imdbID,
      title: item.Title,
      type: item.Type === "series" ? "tv" : "movie",
      year: parseInt(item.Year) || undefined,
      overview: undefined,
      poster: item.Poster !== "N/A" ? item.Poster : undefined,
      sourceRatings: { imdb: undefined }, // will fetch rating in detail call
      
    }))
  } catch (err) {
    console.error("TMDB fetch error:", err)
    return []
  }
}
