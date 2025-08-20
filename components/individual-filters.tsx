"use client"

import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { SearchFilters } from "@/lib/types"

// Available filter options
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

const GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
]

const LANGUAGES = [
  { code: "EN", name: "English" },
  { code: "ES", name: "Spanish" },
  { code: "FR", name: "French" },
  { code: "DE", name: "German" },
  { code: "IT", name: "Italian" },
  { code: "JA", name: "Japanese" },
  { code: "KO", name: "Korean" },
  { code: "HI", name: "Hindi" },
  { code: "ZH", name: "Chinese" },
]

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "UK", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
]

interface IndividualFiltersProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
}

export function IndividualFilters({ filters, onFiltersChange }: IndividualFiltersProps) {
  // Helper function to update a single filter
  const updateFilter = (key: keyof SearchFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {/* Country Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-blue-500/50 text-blue-300 hover:bg-blue-600/20 bg-black/30">
            {COUNTRIES.find((c) => c.code === filters.country)?.name || "Country"}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-black border-blue-500/50 max-h-60 overflow-y-auto">
          <DropdownMenuItem onClick={() => updateFilter("country", "")} className="text-gray-300 hover:bg-blue-600/20">
            All Countries
          </DropdownMenuItem>
          {COUNTRIES.map((country) => (
            <DropdownMenuItem
              key={country.code}
              onClick={() => updateFilter("country", country.code)}
              className="text-gray-300 hover:bg-blue-600/20"
            >
              {country.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Genre Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-blue-500/50 text-blue-300 hover:bg-blue-600/20 bg-black/30">
            {filters.genre || "Genre"}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-black border-blue-500/50 max-h-60 overflow-y-auto">
          <DropdownMenuItem onClick={() => updateFilter("genre", "")} className="text-gray-300 hover:bg-blue-600/20">
            All Genres
          </DropdownMenuItem>
          {GENRES.map((genre) => (
            <DropdownMenuItem
              key={genre}
              onClick={() => updateFilter("genre", genre)}
              className="text-gray-300 hover:bg-blue-600/20"
            >
              {genre}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Language Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-blue-500/50 text-blue-300 hover:bg-blue-600/20 bg-black/30">
            {LANGUAGES.find((l) => l.code === filters.language)?.name || "Language"}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-black border-blue-500/50 max-h-60 overflow-y-auto">
          <DropdownMenuItem onClick={() => updateFilter("language", "")} className="text-gray-300 hover:bg-blue-600/20">
            All Languages
          </DropdownMenuItem>
          {LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => updateFilter("language", language.code)}
              className="text-gray-300 hover:bg-blue-600/20"
            >
              {language.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Streaming Platform Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-blue-500/50 text-blue-300 hover:bg-blue-600/20 bg-black/30">
            {filters.platform || "Platform"}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-black border-blue-500/50 max-h-60 overflow-y-auto">
          <DropdownMenuItem onClick={() => updateFilter("platform", "")} className="text-gray-300 hover:bg-blue-600/20">
            All Platforms
          </DropdownMenuItem>
          {STREAMING_PLATFORMS.map((platform) => (
            <DropdownMenuItem
              key={platform}
              onClick={() => updateFilter("platform", platform)}
              className="text-gray-300 hover:bg-blue-600/20"
            >
              {platform}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
