import type { SearchResult } from "./movie-api"

export async function fetchFromOMDB(query: string): Promise<SearchResult[]> {
    console.log("Inside fetchFromOMDB")
    if (!process.env.OMDB_API_KEY) {
    console.warn("⚠️ OMDB_API_KEY not set")
    return []
  }

  try {
    const url = `http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&s=${encodeURIComponent(query)}`
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
    console.error("OMDB fetch error:", err)
    return []
  }
}
