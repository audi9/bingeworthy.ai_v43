"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Star, Play, Calendar, Globe, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchSuggestions } from "@/components/search-suggestions"
import { IndividualFilters } from "@/components/individual-filters"
import { DescriptionModal } from "@/components/description-modal"
import type { Content, SearchFilters } from "@/lib/types"

// Custom hook for debounced search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export default function HomePage() {
  // State management for the application
  const [searchQuery, setSearchQuery] = useState("") // User's search input
  const [content, setContent] = useState<Content[]>([]) // List of movies/shows to display
  const [loading, setLoading] = useState(false) // Loading state for API calls
  const [initialLoading, setInitialLoading] = useState(true) // Initial page load
  const [error, setError] = useState<string | null>(null) // Error state
  const [showSuggestions, setShowSuggestions] = useState(false) // Show/hide search suggestions
  const [filters, setFilters] = useState<SearchFilters>({
    // Current filter selections
    platform: "",
    genre: "",
    language: "",
    country: "",
    type: "",
  })
  const [selectedContent, setSelectedContent] = useState<Content | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Load trending content when component mounts
  useEffect(() => {
    loadTrendingContent()
  }, [])

  // Perform search when debounced query or filters change
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery, filters)
    } else if (!initialLoading) {
      loadTrendingContent()
    }
  }, [debouncedSearchQuery, filters])

  /**
   * Loads trending content from the API
   */
  const loadTrendingContent = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/content/trending?timeWindow=week")
      const result = await response.json()

      if (result.success) {
        setContent(result.data || [])
      } else {
        setError(result.error || "Failed to load trending content")
      }
    } catch (err) {
      setError("Failed to connect to the server")
      console.error("Error loading trending content:", err)
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  /**
   * Performs unified search that integrates AI recommendations with TMDB results
   */
  const performSearch = async (query: string, searchFilters: SearchFilters) => {
    console.log("🚀 FRONTEND: performSearch called with:", { query, searchFilters })

    try {
      setLoading(true)
      setError(null)

      console.log("🔍 FRONTEND: Building search params...")

      const params = new URLSearchParams({
        q: query.trim(),
      })

      // Add filters to query params
      if (searchFilters.type) params.append("type", searchFilters.type)
      if (searchFilters.genre) params.append("genre", searchFilters.genre)
      if (searchFilters.platform) params.append("platform", searchFilters.platform)
      if (searchFilters.language) params.append("language", searchFilters.language)
      if (searchFilters.country) params.append("country", searchFilters.country)

      const searchUrl = `/api/content/search?${params.toString()}`
      console.log("🌐 FRONTEND: Making API call to:", searchUrl)

      const response = await fetch(searchUrl)
      console.log("📡 FRONTEND: API response status:", response.status)

      const result = await response.json()
      console.log("📊 FRONTEND: API response data:", result)

      if (result.success) {
        console.log("✅ FRONTEND: Search successful, setting content:", result.data?.length || 0, "items")
        setContent(result.data || [])
      } else {
        console.error("❌ FRONTEND: Search failed with error:", result.error)
        setError(result.error || "Search failed")
      }
    } catch (err) {
      console.error("💥 FRONTEND: Search exception:", err)
      setError("Failed to perform search")
    } finally {
      console.log("🏁 FRONTEND: Search completed, setting loading to false")
      setLoading(false)
    }
  }

  /**
   * Handles manual search button click
   */
  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, filters)
    } else {
      loadTrendingContent()
    }
    setShowSuggestions(false)
  }

  /**
   * Handles suggestion click from search suggestions
   */
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    // Search will be triggered by useEffect when searchQuery changes
  }, [])

  /**
   * Handles filter changes
   */
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters)
  }, [])

  /**
   * Clears all filters
   */
  const handleClearFilters = useCallback(() => {
    setFilters({
      platform: "",
      genre: "",
      language: "",
      country: "",
      type: "",
    })
  }, [])

  /**
   * Gets rating color based on score
   */
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400"
    if (rating >= 7) return "text-yellow-400"
    return "text-red-400"
  }

  const handleShowDescription = (content: Content) => {
    setSelectedContent(content)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedContent(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-black">
      {/* Header Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-black/20" />

        <div className="relative max-w-7xl mx-auto px-4 py-12">
          {/* Main title and tagline */}
          <div className="text-center mb-12">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent mb-4">
              bingeworthy.ai
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Discover the highest-rated movies and TV shows across all streaming platforms, powered by AI
              recommendations and real-time ratings
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Main search input */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search for movies, shows, actors, or describe what you want to watch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="pl-10 bg-black/50 border-blue-500/50 text-white placeholder-gray-400 h-12"
                  />

                  {/* Search Suggestions */}
                  <SearchSuggestions
                    onSuggestionClick={handleSuggestionClick}
                    isVisible={showSuggestions && !searchQuery.trim()}
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-black hover:from-blue-700 hover:to-gray-900 h-12 px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>

              <IndividualFilters filters={filters} onFiltersChange={handleFiltersChange} />

              {/* Quick filter buttons */}
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {[
                  "Netflix originals",
                  "HBO Max series",
                  "Marvel movies",
                  "Korean dramas",
                  "British period dramas",
                  "Sci-fi thrillers",
                  "True crime documentaries",
                ].map((filter) => (
                  <Button
                    key={filter}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(filter)}
                    className="border-blue-500/50 text-blue-300 hover:bg-blue-600/20"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Section */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Trending Now"}
          </h2>
          <div className="flex items-center gap-2 text-gray-400">
            <span>{content.length} results</span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-400 mb-4">{error}</p>
              <Button
                onClick={() => (searchQuery ? handleSearch() : loadTrendingContent())}
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-600/20"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">
              {searchQuery ? "Finding the perfect recommendations for you..." : "Loading trending content..."}
            </p>
          </div>
        )}

        {/* Content Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {content.map((item) => (
              <Card
                key={item.id}
                className="bg-black/40 border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 hover:scale-105 group cursor-pointer"
              >
                <CardHeader className="p-0">
                  {/* Poster image */}
                  <div className="relative overflow-hidden rounded-t-lg">
                    <img
                      src={item.poster_url || "/placeholder.svg?height=300&width=200"}
                      alt={`${item.title} poster`}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    {/* Rating badge */}
                    <div className="absolute top-1 right-1 bg-black/80 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                      <span className={`text-xs font-bold ${getRatingColor(item.tmdb_rating)}`}>
                        {item.tmdb_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-3">
                  {/* Title and year */}
                  <CardTitle className="text-white mb-1 line-clamp-1 text-sm">{item.title}</CardTitle>

                  {/* Type and year */}
                  <div className="flex items-center gap-1 mb-2">
                    <Badge variant="secondary" className="bg-orange-600/20 text-orange-300 text-xs px-1.5 py-0.5">
                      {item.type === "movie" ? "Movie" : "TV"}
                    </Badge>
                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                      <Calendar className="w-2.5 h-2.5" />
                      {item.release_year}
                    </div>
                  </div>

                  {/* Description - shortened for compact view */}
                  <div className="text-gray-300 text-xs mb-2">
                    <p className="line-clamp-2">{item.description}</p>
                    <button
                      onClick={() => handleShowDescription(item)}
                      className="text-blue-400 hover:text-blue-300 underline mt-1"
                    >
                      Show more
                    </button>
                  </div>

                  {/* Genre tags - reduced */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.genre
                      .split(", ")
                      .slice(0, 1)
                      .map((genre) => (
                        <Badge
                          key={genre}
                          variant="outline"
                          className="text-xs border-gray-600 text-gray-400 px-1 py-0"
                        >
                          {genre}
                        </Badge>
                      ))}
                  </div>

                  <Button
                    onClick={async () => {
                      try {
                        // First try to get actual trailer from TMDB
                        const detailsResponse = await fetch(`/api/content/${item.id}?type=${item.type}`)
                        const detailsResult = await detailsResponse.json()

                        if (detailsResult.success && detailsResult.data.trailer_url) {
                          // Open actual trailer if available
                          window.open(detailsResult.data.trailer_url, "_blank")
                        } else {
                          // Fallback to YouTube search
                          const searchQuery = `${item.title} ${item.release_year} official trailer`
                          const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
                          window.open(youtubeUrl, "_blank")
                        }
                      } catch (error) {
                        // Fallback to YouTube search on error
                        const searchQuery = `${item.title} ${item.release_year} official trailer`
                        const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
                        window.open(youtubeUrl, "_blank")
                      }
                    }}
                    className="w-full mb-2 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white text-xs py-1"
                    size="sm"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Trailer
                  </Button>

                  {/* Streaming platforms - compact */}
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {item.streaming_platforms.slice(0, 1).map((platform) => (
                        <Badge key={platform} className="bg-gradient-to-r from-blue-600 to-black text-xs px-1 py-0">
                          {platform}
                        </Badge>
                      ))}
                      {item.streaming_platforms.length > 1 && (
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 px-1 py-0">
                          +{item.streaming_platforms.length - 1}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Additional ratings - compact */}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-700">
                    <div className="text-xs text-gray-400">IMDB: {item.imdb_rating.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">{item.runtime}min</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && content.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No results found for "{searchQuery}"</p>
            <p className="text-gray-500 mb-6">Try adjusting your search terms or filters</p>
            <Button
              onClick={() => {
                setSearchQuery("")
                handleClearFilters()
              }}
              className="bg-gradient-to-r from-blue-600 to-black hover:from-blue-700 hover:to-gray-900"
            >
              Browse Trending Content
            </Button>
          </div>
        )}
      </main>

      {selectedContent && (
        <DescriptionModal content={selectedContent} isOpen={isModalOpen} onClose={handleCloseModal} />
      )}
    </div>
  )
}
