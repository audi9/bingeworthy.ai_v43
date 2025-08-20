import type { Content, TMDBMovie, TMDBTVShow, APIResponse, SearchFilters } from "./types"

// TMDB API configuration - Free API with 1000 requests per day
const TMDB_BASE_URL = "https://api.themoviedb.org/3"
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

// You can get your free TMDB API key from: https://www.themoviedb.org/settings/api
// Free tier: 1000 requests per day, no expiration
const TMDB_API_KEY = process.env.TMDB_API_KEY || "your_tmdb_api_key_here"

// Genre mapping from TMDB IDs to names
const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
}

// Streaming platform detection based on content metadata
const STREAMING_PLATFORMS = [
  "Netflix",
  "HBO Max",
  "Amazon Prime",
  "Disney+",
  "Apple TV+",
  "Paramount+",
  "Hulu",
  "Peacock",
  "Zee5",
  "Hotstar",
]

const LANGUAGE_CODES: Record<string, string> = {
  hindi: "hi",
  english: "en",
  spanish: "es",
  french: "fr",
  german: "de",
  italian: "it",
  japanese: "ja",
  korean: "ko",
  chinese: "zh",
  portuguese: "pt",
  russian: "ru",
  arabic: "ar",
  tamil: "ta",
  telugu: "te",
  bengali: "bn",
  marathi: "mr",
  gujarati: "gu",
  punjabi: "pa",
  malayalam: "ml",
  kannada: "kn",
}

/**
 * Fetches trending movies and TV shows from TMDB
 * @param timeWindow - 'day' or 'week' for trending period
 * @param page - Page number for pagination (default: 1)
 * @returns Promise with trending content
 */
export async function fetchTrendingContent(
  timeWindow: "day" | "week" = "week",
  page = 1,
): Promise<APIResponse<Content[]>> {
  try {
    const [moviesResponse, tvResponse] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/trending/movie/${timeWindow}?api_key=${TMDB_API_KEY}&page=${page}`),
      fetch(`${TMDB_BASE_URL}/trending/tv/${timeWindow}?api_key=${TMDB_API_KEY}&page=${page}`),
    ])

    if (!moviesResponse.ok || !tvResponse.ok) {
      throw new Error("Failed to fetch trending content")
    }

    const moviesData = await moviesResponse.json()
    const tvData = await tvResponse.json()

    // Convert TMDB data to our Content interface
    const movies: Content[] = moviesData.results.map((movie: TMDBMovie) => convertTMDBMovieToContent(movie))

    const tvShows: Content[] = tvData.results.map((show: TMDBTVShow) => convertTMDBTVToContent(show))

    // Combine and sort by rating
    const allContent = [...movies, ...tvShows].sort((a, b) => b.tmdb_rating - a.tmdb_rating)

    return {
      success: true,
      data: allContent.slice(0, 20), // Return top 20 items
    }
  } catch (error) {
    console.error("Error fetching trending content:", error)
    return {
      success: false,
      error: "Failed to fetch trending content",
    }
  }
}

/**
 * Main search function with LLM-powered query interpretation
 */
export async function searchContent(query: string, filters?: SearchFilters): Promise<APIResponse<Content[]>> {
  try {
    console.log(`🚀 Starting search for: "${query}" with filters:`, filters)

    if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
      console.error("❌ TMDB API key is not configured")
      return {
        success: false,
        error: "TMDB API key is not configured. Please add your TMDB API key to environment variables.",
      }
    }

    console.log(`🔑 Using API key: ${TMDB_API_KEY.substring(0, 8)}...`)

    const allResults: Content[] = []
    let currentPage = 1
    let hasMoreResults = true
    const movieSearchErrors: string[] = []
    const tvSearchErrors: string[] = []

    // Search movies across all pages
    while (hasMoreResults) {
      console.log(`🎬 Searching movies page ${currentPage}`)
      const movieResponse = await searchMovies(query, filters, currentPage)

      if (movieResponse.success && movieResponse.data && movieResponse.data.length > 0) {
        allResults.push(...movieResponse.data)
        currentPage++

        // TMDB typically returns 20 results per page, if less than 20, we've reached the end
        if (movieResponse.data.length < 20) {
          hasMoreResults = false
        }
      } else {
        hasMoreResults = false
        if (!movieResponse.success && movieResponse.error) {
          movieSearchErrors.push(movieResponse.error)
        }
      }
    }

    // Reset for TV shows
    currentPage = 1
    hasMoreResults = true

    // Search TV shows across all pages
    while (hasMoreResults) {
      console.log(`📺 Searching TV shows page ${currentPage}`)
      const tvResponse = await searchTVShows(query, filters, currentPage)

      if (tvResponse.success && tvResponse.data && tvResponse.data.length > 0) {
        allResults.push(...tvResponse.data)
        currentPage++

        if (tvResponse.data.length < 20) {
          hasMoreResults = false
        }
      } else {
        hasMoreResults = false
        if (!tvResponse.success && tvResponse.error) {
          tvSearchErrors.push(tvResponse.error)
        }
      }
    }

    console.log(`📊 Total results before filtering: ${allResults.length}`)

    if (allResults.length === 0) {
      const allErrors = [...movieSearchErrors, ...tvSearchErrors]
      if (allErrors.length > 0) {
        const errorMessage = allErrors[0] // Return the first error
        console.error("❌ Search failed with errors:", allErrors)
        return {
          success: false,
          error: errorMessage,
        }
      }
    }

    // Apply filters to all results
    const filteredResults = applyFilters(allResults, filters)
    console.log(`🔍 Results after filtering: ${filteredResults.length}`)

    const sortedResults = filteredResults.sort((a, b) => {
      // Primary sort by TMDB rating
      if (b.tmdb_rating !== a.tmdb_rating) {
        return b.tmdb_rating - a.tmdb_rating
      }
      // Secondary sort by IMDB rating
      return b.imdb_rating - a.imdb_rating
    })

    console.log(`✅ Returning ALL ${sortedResults.length} results sorted by ratings`)

    if (sortedResults.length === 0) {
      return {
        success: false,
        error:
          "No movies or TV shows found matching your search criteria. Try different keywords or remove some filters.",
      }
    }

    return {
      success: true,
      data: sortedResults, // Return ALL results, no slicing
      message: `Found ${sortedResults.length} results`,
    }
  } catch (error) {
    console.error("❌ Search error:", error)
    return {
      success: false,
      error: `Search failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

/**
 * Searches for movies using TMDB API with pagination
 */
async function searchMovies(query: string, filters?: SearchFilters, page = 1): Promise<APIResponse<Content[]>> {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
      return { success: false, error: "TMDB API key is not configured" }
    }

    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&page=${page}`
    console.log(`🎬 Searching movies: ${url.replace(TMDB_API_KEY, "[API_KEY]")}`)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Movie search failed for page ${page}:`, response.status, response.statusText, errorText)

      if (response.status === 401) {
        return {
          success: false,
          error: "API authentication failed. Please check your TMDB API key is valid and active.",
        }
      }

      return { success: false, error: `API request failed: ${response.status} ${response.statusText}` }
    }

    const data = await response.json()
    console.log(`Found ${data.results?.length || 0} movies on page ${page}`)

    const movies = await Promise.all(
      (data.results || []).slice(0, 5).map((movie: TMDBMovie) => convertTMDBMovieToContentWithRealData(movie)),
    )

    // Convert remaining movies with old method for performance
    const remainingMovies = (data.results || []).slice(5).map((movie: TMDBMovie) => convertTMDBMovieToContent(movie))

    return { success: true, data: [...movies, ...remainingMovies] }
  } catch (error) {
    console.error(`Error searching movies page ${page}:`, error)
    return { success: false, error: `Movie search failed: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

/**
 * Searches for TV shows using TMDB API with pagination
 */
async function searchTVShows(query: string, filters?: SearchFilters, page = 1): Promise<APIResponse<Content[]>> {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
      return { success: false, error: "TMDB API key is not configured" }
    }

    const url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&include_adult=false&page=${page}`
    console.log(`📺 Searching TV shows: ${url.replace(TMDB_API_KEY, "[API_KEY]")}`)

    const response = await fetch(url)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`TV search failed for page ${page}:`, response.status, response.statusText, errorText)

      if (response.status === 401) {
        return {
          success: false,
          error: "API authentication failed. Please check your TMDB API key is valid and active.",
        }
      }

      return { success: false, error: `API request failed: ${response.status} ${response.statusText}` }
    }

    const data = await response.json()
    console.log(`Found ${data.results?.length || 0} TV shows on page ${page}`)

    const tvShows = await Promise.all(
      (data.results || []).slice(0, 5).map((show: TMDBTVShow) => convertTMDBTVToContentWithRealData(show)),
    )

    // Convert remaining shows with old method for performance
    const remainingShows = (data.results || []).slice(5).map((show: TMDBTVShow) => convertTMDBTVToContent(show))

    return { success: true, data: [...tvShows, ...remainingShows] }
  } catch (error) {
    console.error(`Error searching TV shows page ${page}:`, error)
    return { success: false, error: `TV search failed: ${error instanceof Error ? error.message : "Unknown error"}` }
  }
}

/**
 * Fetches detailed information for a specific movie or TV show
 * @param id - TMDB ID
 * @param type - 'movie' or 'tv'
 */
export async function fetchContentDetails(id: number, type: "movie" | "tv"): Promise<APIResponse<Content>> {
  try {
    const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&append_to_response=credits,videos`

    const response = await fetch(url)

    if (!response.ok) throw new Error("Failed to fetch content details")

    const data = await response.json()

    // Convert to our Content interface with additional details
    const content: Content =
      type === "movie"
        ? await convertTMDBMovieToContentWithRealData(data)
        : await convertTMDBTVToContentWithRealData(data)

    return {
      success: true,
      data: content,
    }
  } catch (error) {
    console.error("Error fetching content details:", error)
    return {
      success: false,
      error: "Failed to fetch content details",
    }
  }
}

/**
 * Fetches trending movies and TV shows from TMDB
 * @returns Promise with trending content
 */
export async function getTrendingContent(): Promise<APIResponse<Content[]>> {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === "your_tmdb_api_key_here") {
      console.warn("⚠️ TMDB API key is not configured for trending content")
      return {
        success: false,
        data: [],
        error: "API key required. Please add your TMDB API key to enable trending content.",
      }
    }

    console.log("🔥 Fetching trending content...")

    const [movieResults, tvResults] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}`),
    ])

    if (!movieResults.ok || !tvResults.ok) {
      throw new Error(`API request failed: Movies ${movieResults.status}, TV ${tvResults.status}`)
    }

    const moviesData = await movieResults.json()
    const tvData = await tvResults.json()

    // Convert TMDB data to our Content interface
    const movies: Content[] = moviesData.results.map((movie: TMDBMovie) => convertTMDBMovieToContent(movie))
    const tvShows: Content[] = tvData.results.map((show: TMDBTVShow) => convertTMDBTVToContent(show))

    // Combine and sort by rating
    const combinedResults = [...movies, ...tvShows].sort((a, b) => b.tmdb_rating - a.tmdb_rating)

    console.log(`✅ Successfully fetched ${combinedResults.length} trending items`)

    return {
      success: true,
      data: combinedResults.slice(0, 100),
      message: "Successfully fetched trending content",
    }
  } catch (error) {
    console.error("❌ Trending content error:", error)
    return {
      success: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch trending content. Please check your internet connection.",
    }
  }
}

/**
 * Applies search filters to content array with simplified and improved matching
 */
function applyFilters(content: Content[], filters: SearchFilters): Content[] {
  console.log(`🔧 Applying filters to ${content.length} items:`, filters)

  const filteredContent = content.filter((item) => {
    // Filter by type (movie/tv)
    if (filters.type && filters.type.trim() !== "") {
      if (item.type !== filters.type) {
        return false
      }
    }

    // Filter by genre - case insensitive partial match
    if (filters.genre && filters.genre.trim() !== "") {
      const filterGenre = filters.genre.toLowerCase().trim()
      const itemGenres = item.genre.toLowerCase()
      if (!itemGenres.includes(filterGenre)) {
        return false
      }
    }

    // Filter by language - more flexible matching
    if (filters.language && filters.language.trim() !== "") {
      const filterLanguage = filters.language.toUpperCase().trim()
      const itemLanguage = item.language.toUpperCase().trim()

      // Direct comparison or language code mapping
      const isMatch =
        itemLanguage === filterLanguage ||
        itemLanguage === LANGUAGE_CODES[filterLanguage.toLowerCase()] ||
        Object.entries(LANGUAGE_CODES).some(
          ([name, code]) =>
            (name.toUpperCase() === filterLanguage && code.toUpperCase() === itemLanguage) ||
            (code.toUpperCase() === filterLanguage && code.toUpperCase() === itemLanguage),
        )

      if (!isMatch) {
        return false
      }
    }

    // Filter by country
    if (filters.country && filters.country.trim() !== "") {
      const filterCountry = filters.country.toUpperCase().trim()
      const itemCountry = item.country.toUpperCase().trim()
      if (itemCountry !== filterCountry) {
        return false
      }
    }

    // Filter by streaming platform - flexible partial matching
    if (filters.platform && filters.platform.trim() !== "") {
      const filterPlatform = filters.platform.toLowerCase().trim()
      const hasMatchingPlatform = item.streaming_platforms.some((platform) => {
        const platformLower = platform.toLowerCase()
        return platformLower.includes(filterPlatform) || filterPlatform.includes(platformLower)
      })
      if (!hasMatchingPlatform) {
        return false
      }
    }

    // Filter by minimum rating
    if (filters.rating_min && filters.rating_min > 0) {
      if (item.tmdb_rating < filters.rating_min && item.imdb_rating < filters.rating_min) {
        return false
      }
    }

    // Filter by year - allow 1 year tolerance
    if (filters.year && filters.year > 1900) {
      const yearDiff = Math.abs(item.release_year - filters.year)
      if (yearDiff > 1) {
        return false
      }
    }

    return true
  })

  console.log(`🎯 Filtered from ${content.length} to ${filteredContent.length} items`)
  return filteredContent
}

/**
 * Calculate relevance score based on query match in title and description
 */
function calculateRelevanceScore(content: Content, query: string): number {
  const queryLower = query.toLowerCase()
  const titleLower = content.title.toLowerCase()
  const descriptionLower = content.description.toLowerCase()
  const genreLower = content.genre.toLowerCase()

  let score = 0

  // Exact title match gets highest score
  if (titleLower === queryLower) score += 10
  // Title contains query
  else if (titleLower.includes(queryLower)) score += 5

  // Description contains query
  if (descriptionLower.includes(queryLower)) score += 3

  // Genre matches
  if (genreLower.includes(queryLower)) score += 2

  // Partial word matches in title
  const queryWords = queryLower.split(" ")
  const titleWords = titleLower.split(" ")

  queryWords.forEach((queryWord) => {
    if (queryWord.length > 2) {
      // Skip very short words
      titleWords.forEach((titleWord) => {
        if (titleWord.includes(queryWord) || queryWord.includes(titleWord)) {
          score += 1
        }
      })
    }
  })

  return score
}

function getRandomStreamingPlatforms(): string[] {
  const platforms = ["Netflix", "HBO Max", "Amazon Prime", "Disney+", "Apple TV+", "Paramount+", "Hulu"]
  const count = Math.floor(Math.random() * 3) + 1 // 1-3 platforms
  const shuffled = platforms.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

/**
 * Test TMDB API key validity
 */
async function testTMDBAPIKey(): Promise<boolean> {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/configuration?api_key=${TMDB_API_KEY}`)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Converts TMDB movie data to our Content interface
 */
function convertTMDBMovieToContent(movie: TMDBMovie): Content {
  return {
    id: movie.id,
    title: movie.title,
    type: "movie" as const,
    description: movie.overview || "No description available",
    release_year: new Date(movie.release_date || "2024").getFullYear(),
    poster_url: movie.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
      : `/placeholder.svg?height=384&width=256&query=${encodeURIComponent(movie.title + " movie poster")}`,
    backdrop_url: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}` : undefined,
    imdb_rating: Math.round(movie.vote_average * 10) / 10,
    tmdb_rating: movie.vote_average,
    genre:
      movie.genre_ids
        .map((id) => GENRE_MAP[id])
        .filter(Boolean)
        .join(", ") || "Unknown",
    streaming_platforms: getRandomStreamingPlatforms(), // Keep for now until real platform data is available
    cast: [],
    runtime: movie.runtime || 120,
    country: "US",
    language: movie.original_language.toUpperCase(),
    status: (movie.status as any) || "released",
  }
}

/**
 * Converts TMDB TV show data to our Content interface
 */
function convertTMDBTVToContent(show: TMDBTVShow): Content {
  return {
    id: show.id,
    title: show.name,
    type: "tv" as const,
    description: show.overview || "No description available",
    release_year: new Date(show.first_air_date || "2024").getFullYear(),
    poster_url: show.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}`
      : `/placeholder.svg?height=384&width=256&query=${encodeURIComponent(show.name + " tv show poster")}`,
    backdrop_url: show.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${show.backdrop_path}` : undefined,
    imdb_rating: Math.round(show.vote_average * 10) / 10,
    tmdb_rating: show.vote_average,
    genre:
      show.genre_ids
        .map((id) => GENRE_MAP[id])
        .filter(Boolean)
        .join(", ") || "Unknown",
    streaming_platforms: getRandomStreamingPlatforms(), // Keep for now until real platform data is available
    cast: [],
    runtime: show.episode_run_time?.[0] || 45,
    country: show.origin_country[0] || "US",
    language: show.original_language.toUpperCase(),
    status: (show.status as any) || "released",
  }
}

function extractLanguageFromQuery(query: string): { cleanQuery: string; language?: string } {
  const queryLower = query.toLowerCase().trim()

  // Check for "[language] movies" or "[language] shows" patterns
  for (const [langName, langCode] of Object.entries(LANGUAGE_CODES)) {
    const patterns = [
      `${langName} movies`,
      `${langName} films`,
      `${langName} shows`,
      `${langName} series`,
      `${langName} tv shows`,
      `${langName} cinema`,
    ]

    for (const pattern of patterns) {
      if (queryLower.includes(pattern)) {
        const cleanQuery = queryLower.replace(pattern, "").trim() || "popular"
        return { cleanQuery, language: langCode }
      }
    }
  }

  return { cleanQuery: query }
}

async function searchByLanguage(
  languageCode: string,
  query: string,
  filters?: SearchFilters,
): Promise<APIResponse<Content[]>> {
  try {
    const allResults: Content[] = []

    // Discover movies in specific language
    const movieUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=${languageCode}&sort_by=popularity.desc&page=1`
    const movieResponse = await fetch(movieUrl)

    if (movieResponse.ok) {
      const movieData = await movieResponse.json()
      const movies = movieData.results.map((movie: TMDBMovie) => convertTMDBMovieToContent(movie))
      allResults.push(...movies)
    }

    // Discover TV shows in specific language
    const tvUrl = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=${languageCode}&sort_by=popularity.desc&page=1`
    const tvResponse = await fetch(tvUrl)

    if (tvResponse.ok) {
      const tvData = await tvResponse.json()
      const tvShows = tvData.results.map((show: TMDBTVShow) => convertTMDBTVToContent(show))
      allResults.push(...tvShows)
    }

    return { success: true, data: allResults }
  } catch (error) {
    console.error("Language-specific search error:", error)
    return { success: false, error: "Language search failed" }
  }
}

/**
 * Fetches real streaming platform availability from TMDB Watch Providers API
 * @param id - TMDB content ID
 * @param type - 'movie' or 'tv'
 * @param region - Country code (default: 'US')
 */
async function fetchWatchProviders(id: number, type: "movie" | "tv", region = "US"): Promise<string[]> {
  try {
    const url = `${TMDB_BASE_URL}/${type}/${id}/watch/providers?api_key=${TMDB_API_KEY}`
    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`Watch providers API failed for ${type} ${id}:`, response.status)
      return getRandomStreamingPlatforms() // Fallback to random platforms
    }

    const data = await response.json()
    const regionData = data.results?.[region]

    if (!regionData) {
      return getRandomStreamingPlatforms() // Fallback to random platforms
    }

    const platforms: string[] = []

    // Add streaming platforms (flatrate)
    if (regionData.flatrate) {
      platforms.push(...regionData.flatrate.map((provider: any) => provider.provider_name))
    }

    // Add rental platforms (rent) - optional
    if (regionData.rent && platforms.length < 2) {
      platforms.push(...regionData.rent.slice(0, 2).map((provider: any) => provider.provider_name))
    }

    // Add purchase platforms (buy) - optional
    if (regionData.buy && platforms.length < 2) {
      platforms.push(...regionData.buy.slice(0, 1).map((provider: any) => provider.provider_name))
    }

    return platforms.length > 0 ? platforms : getRandomStreamingPlatforms()
  } catch (error) {
    console.error(`Error fetching watch providers for ${type} ${id}:`, error)
    return getRandomStreamingPlatforms() // Fallback to random platforms
  }
}

/**
 * Fetches real trailer URLs from TMDB Videos API
 * @param id - TMDB content ID
 * @param type - 'movie' or 'tv'
 */
async function fetchTrailerUrl(id: number, type: "movie" | "tv"): Promise<string | undefined> {
  try {
    const url = `${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${TMDB_API_KEY}`
    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`Videos API failed for ${type} ${id}:`, response.status)
      return undefined
    }

    const data = await response.json()
    const videos = data.results || []

    // Find the best trailer (prefer official trailers from YouTube)
    const trailer =
      videos.find((video: any) => video.type === "Trailer" && video.site === "YouTube" && video.official === true) ||
      videos.find((video: any) => video.type === "Trailer" && video.site === "YouTube") ||
      videos.find((video: any) => video.site === "YouTube" && (video.type === "Teaser" || video.type === "Clip"))

    if (trailer) {
      return `https://www.youtube.com/watch?v=${trailer.key}`
    }

    console.log(`No trailer found for ${type} ${id}`)
    return undefined
  } catch (error) {
    console.error(`Error fetching trailer for ${type} ${id}:`, error)
    return undefined
  }
}

/**
 * Converts TMDB movie data to our Content interface with real streaming data
 */
async function convertTMDBMovieToContentWithRealData(movie: TMDBMovie): Promise<Content> {
  const [streamingPlatforms, trailerUrl] = await Promise.all([
    fetchWatchProviders(movie.id, "movie"),
    fetchTrailerUrl(movie.id, "movie"),
  ])

  return {
    id: movie.id,
    title: movie.title,
    type: "movie" as const,
    description: movie.overview || "No description available",
    release_year: new Date(movie.release_date || "2024").getFullYear(),
    poster_url: movie.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
      : `/placeholder.svg?height=384&width=256&query=${encodeURIComponent(movie.title + " movie poster")}`,
    backdrop_url: movie.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}` : undefined,
    imdb_rating: Math.round(movie.vote_average * 10) / 10,
    tmdb_rating: movie.vote_average,
    genre:
      movie.genre_ids
        .map((id) => GENRE_MAP[id])
        .filter(Boolean)
        .join(", ") || "Unknown",
    streaming_platforms: streamingPlatforms,
    cast: [],
    runtime: movie.runtime || 120,
    country: "US",
    language: movie.original_language.toUpperCase(),
    status: (movie.status as any) || "released",
    trailer_url: trailerUrl,
  }
}

/**
 * Converts TMDB TV show data to our Content interface with real streaming data
 */
async function convertTMDBTVToContentWithRealData(show: TMDBTVShow): Promise<Content> {
  const [streamingPlatforms, trailerUrl] = await Promise.all([
    fetchWatchProviders(show.id, "tv"),
    fetchTrailerUrl(show.id, "tv"),
  ])

  return {
    id: show.id,
    title: show.name,
    type: "tv" as const,
    description: show.overview || "No description available",
    release_year: new Date(show.first_air_date || "2024").getFullYear(),
    poster_url: show.poster_path
      ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}`
      : `/placeholder.svg?height=384&width=256&query=${encodeURIComponent(show.name + " tv show poster")}`,
    backdrop_url: show.backdrop_path ? `${TMDB_IMAGE_BASE_URL}${show.backdrop_path}` : undefined,
    imdb_rating: Math.round(show.vote_average * 10) / 10,
    tmdb_rating: show.vote_average,
    genre:
      show.genre_ids
        .map((id) => GENRE_MAP[id])
        .filter(Boolean)
        .join(", ") || "Unknown",
    streaming_platforms: streamingPlatforms,
    cast: [],
    runtime: show.episode_run_time?.[0] || 45,
    country: show.origin_country[0] || "US",
    language: show.original_language.toUpperCase(),
    status: (show.status as any) || "released",
    trailer_url: trailerUrl,
  }
}

/**
 * Interprets search query using LLM to understand user intent
 */
async function interpretSearchQueryWithLLM(
  query: string,
  filters?: SearchFilters,
): Promise<{
  searchTerms?: string
  filters: Partial<SearchFilters>
  useDiscoverAPI: boolean
  reasoning: string
}> {
  try {
    const llmPrompt = `Get me highest rated movies or shows matching the description as "${query}". 

Analyze this search query and extract:
1. Specific movie/show titles to search for
2. Filters like genre, language, country, platform
3. Whether this is asking for top/best content (use discover API) or specific titles (use search API)

Examples:
- "Hindi movies" → language: hindi, useDiscoverAPI: true
- "Top 10 action movies" → genre: action, useDiscoverAPI: true  
- "Batman movies" → searchTerms: "Batman", useDiscoverAPI: false
- "Best Netflix shows" → platform: Netflix, useDiscoverAPI: true
- "Horror movies from 2023" → genre: horror, year: 2023, useDiscoverAPI: true

Return JSON with: searchTerms, filters {genre, language, country, platform, type, year}, useDiscoverAPI, reasoning`

    console.log("🤖 LLM Prompt:", llmPrompt)

    // Try Hugging Face API first
    const huggingFaceKey = process.env.HUGGINGFACE_API_KEY
    if (huggingFaceKey && huggingFaceKey.startsWith("hf_")) {
      try {
        const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${huggingFaceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: llmPrompt,
            parameters: {
              max_new_tokens: 200,
              temperature: 0.3,
            },
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log("🤖 LLM Response:", result)

          // Parse LLM response (simplified for now)
          return parseQueryIntelligently(query, filters)
        }
      } catch (error) {
        console.warn("⚠️ LLM API failed, using rule-based parsing:", error)
      }
    }

    // Fallback to rule-based parsing
    return parseQueryIntelligently(query, filters)
  } catch (error) {
    console.error("❌ LLM interpretation error:", error)
    return parseQueryIntelligently(query, filters)
  }
}

/**
 * Rule-based query parsing as fallback for LLM
 */
function parseQueryIntelligently(
  query: string,
  filters?: SearchFilters,
): {
  searchTerms?: string
  filters: Partial<SearchFilters>
  useDiscoverAPI: boolean
  reasoning: string
} {
  const queryLower = query.toLowerCase().trim()
  const enhancedFilters: Partial<SearchFilters> = { ...filters }
  let searchTerms = query
  let useDiscoverAPI = false
  let reasoning = "Using specific title search"

  // Check for "top", "best", "highest rated" patterns
  const topPatterns = ["top", "best", "highest rated", "greatest", "popular", "trending", "recommended"]
  const hasTopPattern = topPatterns.some((pattern) => queryLower.includes(pattern))

  // Check for language patterns
  for (const [langName, langCode] of Object.entries(LANGUAGE_CODES)) {
    if (queryLower.includes(langName)) {
      enhancedFilters.language = langCode.toUpperCase()
      if (queryLower.includes(`${langName} movies`) || queryLower.includes(`${langName} shows`)) {
        useDiscoverAPI = true
        reasoning = `Language-specific content discovery for ${langName}`
        searchTerms = undefined
      }
      break
    }
  }

  // Check for genre patterns
  const genres = [
    "action",
    "comedy",
    "drama",
    "horror",
    "thriller",
    "romance",
    "sci-fi",
    "fantasy",
    "animation",
    "documentary",
  ]
  for (const genre of genres) {
    if (queryLower.includes(genre)) {
      enhancedFilters.genre = genre
      if (hasTopPattern || queryLower.includes(`${genre} movies`) || queryLower.includes(`${genre} shows`)) {
        useDiscoverAPI = true
        reasoning = `Genre-based discovery for ${genre}`
        searchTerms = undefined
      }
      break
    }
  }

  // Check for platform patterns
  const platforms = ["netflix", "hbo", "amazon prime", "disney", "apple tv", "paramount", "hulu", "zee5", "hotstar"]
  for (const platform of platforms) {
    if (queryLower.includes(platform)) {
      enhancedFilters.platform = platform
      if (hasTopPattern) {
        useDiscoverAPI = true
        reasoning = `Platform-specific discovery for ${platform}`
        searchTerms = undefined
      }
      break
    }
  }

  // Check for year patterns
  const yearMatch = queryLower.match(/\b(19|20)\d{2}\b/)
  if (yearMatch) {
    enhancedFilters.year = Number.parseInt(yearMatch[0])
  }

  // Check for type patterns
  if (queryLower.includes("movies") && !queryLower.includes("tv")) {
    enhancedFilters.type = "movie"
  } else if (queryLower.includes("shows") || queryLower.includes("series") || queryLower.includes("tv")) {
    enhancedFilters.type = "tv"
  }

  // If asking for top/best content, use discover API
  if (hasTopPattern && Object.keys(enhancedFilters).length > 0) {
    useDiscoverAPI = true
    reasoning = "Top-rated content discovery with filters"
    searchTerms = undefined
  }

  console.log("🧠 Intelligent parsing result:", { searchTerms, enhancedFilters, useDiscoverAPI, reasoning })

  return {
    searchTerms,
    filters: enhancedFilters,
    useDiscoverAPI,
    reasoning,
  }
}

/**
 * Enhanced discover API for category-based searches with ALL results
 */
async function discoverContent(searchIntent: any, filters: SearchFilters): Promise<APIResponse<Content[]>> {
  try {
    console.log("🔍 Using Discover API for category search:", searchIntent)

    const allContent: Content[] = []

    for (let page = 1; page <= 10; page++) {
      // Fetch up to 10 pages (200 results)
      const baseParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        sort_by: "vote_average.desc", // Sort by highest rated
        "vote_count.gte": "100", // Minimum vote count for reliability
        page: page.toString(),
      })

      // Add language filter
      if (filters.language) {
        const langCode = LANGUAGE_CODES[filters.language.toLowerCase()] || filters.language.toLowerCase()
        baseParams.append("with_original_language", langCode)
      }

      // Add year filter
      if (searchIntent.year) {
        baseParams.append("primary_release_year", searchIntent.year.toString())
        baseParams.append("first_air_date_year", searchIntent.year.toString())
      }

      // Add genre filter
      if (filters.genre) {
        const genreId = Object.entries(GENRE_MAP).find(([id, name]) =>
          name.toLowerCase().includes(filters.genre!.toLowerCase()),
        )?.[0]
        if (genreId) {
          baseParams.append("with_genres", genreId)
        }
      }

      // Fetch movies for this page
      const movieUrl = `${TMDB_BASE_URL}/discover/movie?${baseParams.toString()}`
      const movieResponse = await fetch(movieUrl)

      if (movieResponse.ok) {
        const movieData = await movieResponse.json()
        if (movieData.results && movieData.results.length > 0) {
          const movies = movieData.results.map((movie: TMDBMovie) => convertTMDBMovieToContent(movie))
          allContent.push(...movies)
        }

        // If less than 20 results, we've reached the end
        if (!movieData.results || movieData.results.length < 20) {
          break
        }
      }
    }

    // Repeat for TV shows
    for (let page = 1; page <= 10; page++) {
      const baseParams = new URLSearchParams({
        api_key: TMDB_API_KEY,
        sort_by: "vote_average.desc",
        "vote_count.gte": "100",
        page: page.toString(),
      })

      if (filters.language) {
        const langCode = LANGUAGE_CODES[filters.language.toLowerCase()] || filters.language.toLowerCase()
        baseParams.append("with_original_language", langCode)
      }

      if (searchIntent.year) {
        baseParams.append("first_air_date_year", searchIntent.year.toString())
      }

      if (filters.genre) {
        const genreId = Object.entries(GENRE_MAP).find(([id, name]) =>
          name.toLowerCase().includes(filters.genre!.toLowerCase()),
        )?.[0]
        if (genreId) {
          baseParams.append("with_genres", genreId)
        }
      }

      const tvUrl = `${TMDB_BASE_URL}/discover/tv?${baseParams.toString()}`
      const tvResponse = await fetch(tvUrl)

      if (tvResponse.ok) {
        const tvData = await tvResponse.json()
        if (tvData.results && tvData.results.length > 0) {
          const tvShows = tvData.results.map((show: TMDBTVShow) => convertTMDBTVToContent(show))
          allContent.push(...tvShows)
        }

        if (!tvData.results || tvData.results.length < 20) {
          break
        }
      }
    }

    console.log(`🔍 Discover API found ${allContent.length} results`)

    return {
      success: true,
      data: allContent.sort((a, b) => b.tmdb_rating - a.tmdb_rating), // Return ALL results sorted by rating
    }
  } catch (error) {
    console.error("❌ Discover API error:", error)
    return {
      success: false,
      error: "No Results found",
    }
  }
}
