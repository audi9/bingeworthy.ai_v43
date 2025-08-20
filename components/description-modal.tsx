"use client"
import { X, Star, Calendar, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Content } from "@/lib/types"

interface DescriptionModalProps {
  content: Content
  isOpen: boolean
  onClose: () => void
}

export function DescriptionModal({ content, isOpen, onClose }: DescriptionModalProps) {
  if (!isOpen) return null

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "text-green-400"
    if (rating >= 7) return "text-yellow-400"
    return "text-red-400"
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black border border-blue-500/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-700">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">{content.title}</h2>
            <div className="flex items-center gap-4 text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{content.release_year}</span>
              </div>
              <Badge variant="secondary" className="bg-orange-600/20 text-orange-300">
                {content.type === "movie" ? "Movie" : "TV Show"}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className={`font-bold ${getRatingColor(content.tmdb_rating)}`}>
                  {content.tmdb_rating.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Poster and basic info */}
          <div className="flex gap-6 mb-6">
            <img
              src={content.poster_url || "/placeholder.svg?height=300&width=200"}
              alt={`${content.title} poster`}
              className="w-32 h-48 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-3">Full Description</h3>
              <p className="text-gray-300 leading-relaxed mb-4">{content.description}</p>

              {/* Additional details */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Runtime:</span>
                  <span className="text-white">{content.runtime} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Language:</span>
                  <span className="text-white">{content.language}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-medium">Country:</span>
                  <span className="text-white">{content.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Genres */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-2">Genres</h4>
            <div className="flex flex-wrap gap-2">
              {content.genre.split(", ").map((genre) => (
                <Badge key={genre} variant="outline" className="border-blue-500/50 text-blue-300">
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          {/* Streaming Platforms */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-2">Available On</h4>
            <div className="flex flex-wrap gap-2">
              {content.streaming_platforms.map((platform) => (
                <Badge key={platform} className="bg-gradient-to-r from-blue-600 to-black">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>

          {/* Ratings */}
          <div className="mb-6">
            <h4 className="text-white font-medium mb-2">Ratings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-lg p-3">
                <div className="text-gray-400 text-sm">TMDB Rating</div>
                <div className={`text-xl font-bold ${getRatingColor(content.tmdb_rating)}`}>
                  {content.tmdb_rating.toFixed(1)}/10
                </div>
              </div>
              <div className="bg-black/40 rounded-lg p-3">
                <div className="text-gray-400 text-sm">IMDB Rating</div>
                <div className={`text-xl font-bold ${getRatingColor(content.imdb_rating)}`}>
                  {content.imdb_rating.toFixed(1)}/10
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                try {
                  const detailsResponse = await fetch(`/api/content/${content.id}?type=${content.type}`)
                  const detailsResult = await detailsResponse.json()

                  if (detailsResult.success && detailsResult.data.trailer_url) {
                    window.open(detailsResult.data.trailer_url, "_blank")
                  } else {
                    const searchQuery = `${content.title} ${content.release_year} official trailer`
                    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
                    window.open(youtubeUrl, "_blank")
                  }
                } catch (error) {
                  const searchQuery = `${content.title} ${content.release_year} official trailer`
                  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
                  window.open(youtubeUrl, "_blank")
                }
              }}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900"
            >
              <Play className="w-4 h-4 mr-2" />
              Watch Trailer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
