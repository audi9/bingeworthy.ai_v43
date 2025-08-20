import { type NextRequest, NextResponse } from "next/server"
import { searchContent } from "@/lib/movie-api"
import type { SearchFilters } from "@/lib/types"

/**
 * GET /api/content/search
 * Searches for movies and TV shows using TMDB API
 * Query params:
 * - q: search query (required)
 * - type: 'movie' | 'tv' | '' (optional)
 * - genre: genre filter (optional)
 * - platform: streaming platform filter (optional)
 * - language: language filter (optional)
 * - country: country filter (optional)
 * - year: release year filter (optional)
 * - rating_min: minimum rating filter (optional)
 */
export async function GET(request: NextRequest) {
  try {
    console.log("🌐 API ROUTE: Full URL:", request.url)

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    console.log("🔍 API ROUTE: Raw query parameter:", JSON.stringify(query))
    
    // Validate required parameters
    if (!query || query.trim().length === 0) {
      console.error("❌ API ROUTE: Query validation failed - missing or empty")
      return NextResponse.json({ success: false, error: "Search query is required" }, { status: 400 })
    }

    if (query.length > 100) {
      console.error("❌ API ROUTE: Query validation failed - too long")
      return NextResponse.json({ success: false, error: "Search query too long (max 100 characters)" }, { status: 400 })
    }


    // Build filters object
    const filters: SearchFilters = {
      platform: searchParams.get("platform") || "",
      genre: searchParams.get("genre") || "",
      language: searchParams.get("language") || "",
      country: searchParams.get("country") || "",
      type: searchParams.get("type") || "",
    }

    // Parse optional numeric filters
    const year = searchParams.get("year")
    if (year) {
      const yearNum = Number.parseInt(year)
      if (yearNum >= 1900 && yearNum <= new Date().getFullYear() + 5) {
        filters.year = yearNum
      }
    }

    const ratingMin = searchParams.get("rating_min")
    if (ratingMin) {
      const ratingNum = Number.parseFloat(ratingMin)
      if (ratingNum >= 0 && ratingNum <= 10) {
        filters.rating_min = ratingNum
      }
    }

    const result = await searchContent(query.trim(), filters)

    if (!result.success) {
      console.error("❌ Search failed:", result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    console.log(`✅ Search API returning ${result.data?.length || 0} results`)

    // Return results with appropriate caching
    return NextResponse.json(
      {
        ...result,
        source: "tmdb_search",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      },
    )
  } catch (error) {
    console.error("❌ Search API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
