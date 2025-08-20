import { type NextRequest, NextResponse } from "next/server"

// Interface for the request body
interface RecommendationRequest {
  query: string
  type?: string
  filters?: any
  maxRecommendations?: number
}

// Interface for individual recommendation
interface Recommendation {
  id: string
  title: string
  description: string
  category: string
  confidence: number
}

/**
 * POST /api/ai/recommendations
 * Generates AI-powered content recommendations based on user query
 * Uses free LLM APIs to provide personalized suggestions
 * Now supports "List top X best [genre/type] movies and TV shows" prompts
 * Enhanced to return movie titles for search integration
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body: RecommendationRequest = await request.json()
    const { query, type, filters, maxRecommendations = 50 } = body

    // Validate input
    if (!query || query.trim().length < 3) {
      return NextResponse.json(
        {
          success: false,
          error: "Query must be at least 3 characters long",
        },
        { status: 400 },
      )
    }

    if (type === "search_titles") {
      const titles = await generateSearchTitles(query.trim(), filters)
      return NextResponse.json({
        success: true,
        titles,
        query: query.trim(),
      })
    }

    const recommendations = await generateAIRecommendations(query.trim(), maxRecommendations)

    return NextResponse.json({
      success: true,
      data: recommendations,
      query: query.trim(),
    })
  } catch (error) {
    console.error("Error generating AI recommendations:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate recommendations",
      },
      { status: 500 },
    )
  }
}

/**
 * Generate movie/TV show titles for search integration
 * This is used by the search API to get LLM-suggested titles before fetching TMDB details
 */
async function generateSearchTitles(query: string, filters: any): Promise<string[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const queryLower = query.toLowerCase()

  // Enhanced title suggestions based on common search patterns
  const titleSuggestions: Record<string, string[]> = {
    // Action content
    action: [
      "Mad Max: Fury Road",
      "John Wick",
      "The Dark Knight",
      "Mission: Impossible - Fallout",
      "Avengers: Endgame",
      "Die Hard",
      "The Matrix",
      "Terminator 2: Judgment Day",
      "Heat",
      "Casino Royale",
    ],

    // Horror content
    horror: [
      "Hereditary",
      "The Conjuring",
      "Get Out",
      "A Quiet Place",
      "The Babadook",
      "It Follows",
      "Midsommar",
      "The Witch",
      "Sinister",
      "Insidious",
    ],

    // Comedy content
    comedy: [
      "The Grand Budapest Hotel",
      "Parasite",
      "Knives Out",
      "The Big Lebowski",
      "Superbad",
      "Anchorman",
      "Borat",
      "Tropic Thunder",
      "Wedding Crashers",
      "Zoolander",
    ],

    // Drama content
    drama: [
      "The Godfather",
      "Shawshank Redemption",
      "Goodfellas",
      "Pulp Fiction",
      "There Will Be Blood",
      "No Country for Old Men",
      "Moonlight",
      "Manchester by the Sea",
      "Lady Bird",
      "Call Me by Your Name",
    ],

    // Sci-fi content
    "sci-fi": [
      "Blade Runner 2049",
      "Arrival",
      "Interstellar",
      "Ex Machina",
      "Her",
      "Dune",
      "The Martian",
      "Gravity",
      "Inception",
      "2001: A Space Odyssey",
    ],

    // Netflix originals
    netflix: [
      "Stranger Things",
      "The Crown",
      "Ozark",
      "Mindhunter",
      "Dark",
      "The Queen's Gambit",
      "Bridgerton",
      "Money Heist",
      "Narcos",
      "House of Cards",
    ],

    // HBO content
    hbo: [
      "Game of Thrones",
      "The Last of Us",
      "Succession",
      "True Detective",
      "Westworld",
      "The Sopranos",
      "The Wire",
      "Barry",
      "Euphoria",
      "Mare of Easttown",
    ],

    // Marvel content
    marvel: [
      "Avengers: Endgame",
      "Black Panther",
      "Spider-Man: Into the Spider-Verse",
      "Iron Man",
      "Captain America: The Winter Soldier",
      "Thor: Ragnarok",
      "Guardians of the Galaxy",
      "Doctor Strange",
      "WandaVision",
      "Loki",
    ],

    // Korean content
    korean: [
      "Parasite",
      "Squid Game",
      "Train to Busan",
      "Oldboy",
      "The Handmaiden",
      "Burning",
      "Kingdom",
      "Crash Landing on You",
      "Goblin",
      "Reply 1988",
    ],

    // British period dramas
    "british period": [
      "The Crown",
      "Downton Abbey",
      "Bridgerton",
      "Outlander",
      "Poldark",
      "Victoria",
      "Anne with an E",
      "Pride and Prejudice",
      "Sense and Sensibility",
      "Emma",
    ],

    // True crime
    "true crime": [
      "Making a Murderer",
      "The Staircase",
      "Wild Wild Country",
      "Tiger King",
      "The Jinx",
      "Serial",
      "Mindhunter",
      "Zodiac",
      "The Night Stalker",
      "Don't F**k with Cats",
    ],
  }

  // Find matching titles based on query keywords
  let suggestedTitles: string[] = []

  for (const [key, titles] of Object.entries(titleSuggestions)) {
    if (queryLower.includes(key) || key.split(" ").some((word) => queryLower.includes(word))) {
      suggestedTitles.push(...titles)
    }
  }

  // If no specific matches, provide general popular titles
  if (suggestedTitles.length === 0) {
    suggestedTitles = [
      "The Shawshank Redemption",
      "The Godfather",
      "The Dark Knight",
      "Breaking Bad",
      "Game of Thrones",
      "Stranger Things",
      "Pulp Fiction",
      "The Lord of the Rings",
      "Inception",
      "The Matrix",
      "Goodfellas",
      "The Sopranos",
      "True Detective",
      "Fargo",
      "Better Call Saul",
    ]
  }

  // Apply filters if provided
  if (filters?.type === "movie") {
    // Filter to only include movies (remove TV shows)
    suggestedTitles = suggestedTitles.filter((title) => {
      const tvShows = [
        "Breaking Bad",
        "Game of Thrones",
        "Stranger Things",
        "The Sopranos",
        "True Detective",
        "Better Call Saul",
        "The Crown",
        "Ozark",
        "Mindhunter",
        "Dark",
        "Bridgerton",
        "Money Heist",
        "Narcos",
        "House of Cards",
        "Succession",
        "The Last of Us",
        "Westworld",
        "The Wire",
        "Barry",
        "Euphoria",
        "WandaVision",
        "Loki",
        "Squid Game",
        "Kingdom",
        "Crash Landing on You",
        "Goblin",
        "Reply 1988",
        "Downton Abbey",
        "Outlander",
        "Poldark",
        "Victoria",
        "Anne with an E",
        "Making a Murderer",
        "The Staircase",
        "Wild Wild Country",
        "Tiger King",
        "The Jinx",
        "Serial",
        "The Night Stalker",
        "Don't F**k with Cats",
        "Fargo",
      ]
      return !tvShows.includes(title)
    })
  } else if (filters?.type === "tv") {
    // Filter to only include TV shows
    const tvShows = [
      "Breaking Bad",
      "Game of Thrones",
      "Stranger Things",
      "The Sopranos",
      "True Detective",
      "Better Call Saul",
      "The Crown",
      "Ozark",
      "Mindhunter",
      "Dark",
      "Bridgerton",
      "Money Heist",
      "Narcos",
      "House of Cards",
      "Succession",
      "The Last of Us",
      "Westworld",
      "The Wire",
      "Barry",
      "Euphoria",
      "WandaVision",
      "Loki",
      "Squid Game",
      "Kingdom",
      "Crash Landing on You",
      "Goblin",
      "Reply 1988",
      "Downton Abbey",
      "Outlander",
      "Poldark",
      "Victoria",
      "Anne with an E",
      "Making a Murderer",
      "The Staircase",
      "Wild Wild Country",
      "Tiger King",
      "The Jinx",
      "Serial",
      "Mindhunter",
      "The Night Stalker",
      "Don't F**k with Cats",
      "Fargo",
    ]
    suggestedTitles = suggestedTitles.filter((title) => tvShows.includes(title))
  }

  // Remove duplicates and limit results
  const uniqueTitles = Array.from(new Set(suggestedTitles))
  return uniqueTitles.slice(0, 50) // Return up to 15 titles for search
}

/**
 * Enhanced AI recommendation generator that handles "top X best" prompts
 * Uses real LLM APIs when available, falls back to enhanced mock data
 */
async function generateAIRecommendations(query: string, maxRecommendations: number): Promise<Recommendation[]> {
  const topListPattern =
    /(?:list|show|give me|find)\s+(?:top\s+)?(\d+)?\s*(?:best|top|greatest|most popular)\s+(.+?)(?:movies?|tv shows?|series)/i
  const match = query.match(topListPattern)
  console.log(`============== app/api/ai/recommendations/route.ts ============== `)
  console.log(` topListPattern = `, topListPattern)
  console.log(` match = `, match)
  if (match) {
    const requestedCount = match[1] ? Number.parseInt(match[1]) : maxRecommendations
    const category = match[2].trim()

    // Try to use real LLM API first
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        return await generateRealAIRecommendations(query, category, requestedCount)
      } catch (error) {
        console.error("LLM API failed, falling back to enhanced mock:", error)
      }
    }

    // Enhanced mock data for "top X best" queries
    return await generateTopListRecommendations(category, requestedCount)
  }

  // For regular queries, use the existing mock system
  return await generateMockRecommendations(query, maxRecommendations)
}

/**
 * Generate top list recommendations for specific categories
 */
async function generateTopListRecommendations(category: string, count: number): Promise<Recommendation[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const categoryLower = category.toLowerCase()

  const topLists: Record<string, Recommendation[]> = {
    // Action movies and shows
    action: [
      {
        id: "a1",
        title: "Mad Max: Fury Road",
        description: "High-octane post-apocalyptic action masterpiece",
        category: "Action Movie",
        confidence: 0.95,
      },
      {
        id: "a2",
        title: "John Wick",
        description: "Stylish revenge thriller with incredible choreography",
        category: "Action Movie",
        confidence: 0.92,
      },
      {
        id: "a3",
        title: "The Raid",
        description: "Indonesian martial arts action film with brutal intensity",
        category: "Action Movie",
        confidence: 0.9,
      },
      {
        id: "a4",
        title: "Mission: Impossible - Fallout",
        description: "Tom Cruise's most dangerous stunts in this spy thriller",
        category: "Action Movie",
        confidence: 0.89,
      },
      {
        id: "a5",
        title: "Daredevil",
        description: "Netflix's gritty superhero series with amazing fight scenes",
        category: "Action Series",
        confidence: 0.87,
      },
    ],

    // Horror content
    horror: [
      {
        id: "h1",
        title: "Hereditary",
        description: "Psychological horror that redefines family trauma",
        category: "Horror Movie",
        confidence: 0.94,
      },
      {
        id: "h2",
        title: "The Conjuring",
        description: "Classic supernatural horror with perfect atmosphere",
        category: "Horror Movie",
        confidence: 0.91,
      },
      {
        id: "h3",
        title: "Get Out",
        description: "Social thriller that revolutionized horror cinema",
        category: "Horror Movie",
        confidence: 0.93,
      },
      {
        id: "h4",
        title: "The Haunting of Hill House",
        description: "Netflix's masterful horror series about family and ghosts",
        category: "Horror Series",
        confidence: 0.9,
      },
      {
        id: "h5",
        title: "Midsommar",
        description: "Disturbing folk horror set in broad daylight",
        category: "Horror Movie",
        confidence: 0.88,
      },
    ],

    // Comedy content
    comedy: [
      {
        id: "c1",
        title: "The Grand Budapest Hotel",
        description: "Wes Anderson's whimsical comedy masterpiece",
        category: "Comedy Movie",
        confidence: 0.92,
      },
      {
        id: "c2",
        title: "Brooklyn Nine-Nine",
        description: "Perfect workplace comedy with diverse cast",
        category: "Comedy Series",
        confidence: 0.9,
      },
      {
        id: "c3",
        title: "Parasite",
        description: "Dark comedy thriller about class warfare",
        category: "Comedy-Thriller",
        confidence: 0.95,
      },
      {
        id: "c4",
        title: "Schitt's Creek",
        description: "Heartwarming comedy about family and growth",
        category: "Comedy Series",
        confidence: 0.89,
      },
      {
        id: "c5",
        title: "What We Do in the Shadows",
        description: "Vampire mockumentary series that's absolutely hilarious",
        category: "Comedy Series",
        confidence: 0.87,
      },
    ],

    // Drama content
    drama: [
      {
        id: "d1",
        title: "Breaking Bad",
        description: "The ultimate character transformation drama",
        category: "Crime Drama",
        confidence: 0.97,
      },
      {
        id: "d2",
        title: "The Godfather",
        description: "Epic crime saga that defined cinema",
        category: "Drama Movie",
        confidence: 0.96,
      },
      {
        id: "d3",
        title: "Better Call Saul",
        description: "Breaking Bad prequel with incredible character depth",
        category: "Crime Drama",
        confidence: 0.94,
      },
      {
        id: "d4",
        title: "Moonlight",
        description: "Coming-of-age drama with beautiful cinematography",
        category: "Drama Movie",
        confidence: 0.93,
      },
      {
        id: "d5",
        title: "The Crown",
        description: "Royal family drama with stunning production values",
        category: "Historical Drama",
        confidence: 0.91,
      },
    ],

    // Sci-fi content
    "sci-fi": [
      {
        id: "s1",
        title: "Blade Runner 2049",
        description: "Visually stunning cyberpunk masterpiece",
        category: "Sci-Fi Movie",
        confidence: 0.94,
      },
      {
        id: "s2",
        title: "The Expanse",
        description: "Hard science fiction with realistic space politics",
        category: "Sci-Fi Series",
        confidence: 0.92,
      },
      {
        id: "s3",
        title: "Arrival",
        description: "Thoughtful alien contact film about communication",
        category: "Sci-Fi Movie",
        confidence: 0.91,
      },
      {
        id: "s4",
        title: "Black Mirror",
        description: "Anthology series exploring technology's dark side",
        category: "Sci-Fi Series",
        confidence: 0.9,
      },
      {
        id: "s5",
        title: "Dune",
        description: "Epic space opera with incredible world-building",
        category: "Sci-Fi Movie",
        confidence: 0.89,
      },
    ],

    // Netflix originals
    netflix: [
      {
        id: "n1",
        title: "Stranger Things",
        description: "80s nostalgia meets supernatural horror",
        category: "Netflix Original",
        confidence: 0.93,
      },
      {
        id: "n2",
        title: "The Queen's Gambit",
        description: "Chess prodigy's journey through addiction and genius",
        category: "Netflix Original",
        confidence: 0.92,
      },
      {
        id: "n3",
        title: "Ozark",
        description: "Money laundering family drama in the Missouri Ozarks",
        category: "Netflix Original",
        confidence: 0.9,
      },
      {
        id: "n4",
        title: "Mindhunter",
        description: "FBI profilers study serial killers in the 1970s",
        category: "Netflix Original",
        confidence: 0.89,
      },
      {
        id: "n5",
        title: "Dark",
        description: "German time-travel thriller with complex storytelling",
        category: "Netflix Original",
        confidence: 0.88,
      },
    ],
  }

  // Find matching category or use general recommendations
  let recommendations: Recommendation[] = []

  for (const [key, list] of Object.entries(topLists)) {
    if (categoryLower.includes(key) || key.includes(categoryLower)) {
      recommendations = list
      break
    }
  }

  // If no specific category found, combine popular items from all categories
  if (recommendations.length === 0) {
    const allRecommendations = Object.values(topLists).flat()
    recommendations = allRecommendations.sort((a, b) => b.confidence - a.confidence)
  }

  // Return requested count, shuffling if we have more than needed
  if (recommendations.length > count) {
    recommendations = recommendations.slice(0, count)
  }

  return recommendations
}

/**
 * Real AI recommendation generator using Hugging Face API
 * Handles "List top X best [category] movies and TV shows" prompts
 */
async function generateRealAIRecommendations(
  query: string,
  category: string,
  count: number,
): Promise<Recommendation[]> {
  const HF_API_KEY = process.env.HUGGINGFACE_API_KEY

  if (!HF_API_KEY) {
    throw new Error("Hugging Face API key not configured")
  }

  const prompt = `You are a movie and TV show expert. List the top 100 movies and TV shows with keywords "${query}" and sort them based on ratings and ensure the records are fetched not just from TMDB API but also from internet searches and average the ratings from all sources.

Please provide exactly ${count} recommendations for the best ${category} movies and TV shows. For each recommendation, provide:

1. Title (exact name)
2. Brief description (max 80 characters)
3. Category (genre or type)
4. Why it's considered one of the best (confidence reason)

Format your response as a JSON array with this structure:
[
  {
    "title": "Movie/Show Title",
    "description": "Brief description",
    "category": "Genre/Type",
    "confidence": 0.95
  }
]

Focus on critically acclaimed, popular, and influential content. Include both movies and TV shows if the query mentions both.
If no results were found, show "No results found for your query" but still shows top 100 movies and shows sorted by reviews and year`

  try {
    // Using a more suitable model for text generation
    const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-large", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 1000,
          temperature: 0.3, // Lower temperature for more consistent results
          do_sample: true,
          top_p: 0.9,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`)
    }

    const result = await response.json()

    try {
      // Extract JSON from the response
      const aiText = result[0]?.generated_text || result.generated_text || ""
      const jsonMatch = aiText.match(/\[[\s\S]*\]/)

      if (jsonMatch) {
        const parsedRecommendations = JSON.parse(jsonMatch[0])

        // Convert to our format and add IDs
        return parsedRecommendations
          .map((rec: any, index: number) => ({
            id: `ai_${Date.now()}_${index}`,
            title: rec.title || `Recommendation ${index + 1}`,
            description: rec.description || "AI-generated recommendation",
            category: rec.category || category,
            confidence: rec.confidence || 0.8,
          }))
          .slice(0, count)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError)
    }

    // Fallback if parsing fails
    throw new Error("Could not parse AI response")
  } catch (error) {
    console.error("Hugging Face API error:", error)
    throw error
  }
}

/**
 * Mock AI recommendation generator
 * In production, replace this with actual LLM API calls
 */
async function generateMockRecommendations(query: string, maxRecommendations: number): Promise<Recommendation[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Mock recommendation database based on common search patterns
  const mockRecommendations: Record<string, Recommendation[]> = {
    // Netflix-related searches
    netflix: [
      {
        id: "1",
        title: "Stranger Things",
        description: "Supernatural thriller series set in the 1980s with great character development",
        category: "Netflix Original",
        confidence: 0.9,
      },
      {
        id: "2",
        title: "The Crown",
        description: "Historical drama about the British Royal Family with excellent production values",
        category: "Netflix Original",
        confidence: 0.85,
      },
    ],

    // HBO-related searches
    hbo: [
      {
        id: "3",
        title: "Game of Thrones",
        description: "Epic fantasy series with complex characters and political intrigue",
        category: "HBO Original",
        confidence: 0.9,
      },
      {
        id: "4",
        title: "The Last of Us",
        description: "Post-apocalyptic drama based on the popular video game",
        category: "HBO Original",
        confidence: 0.88,
      },
    ],

    // Genre-based searches
    "sci-fi": [
      {
        id: "5",
        title: "Blade Runner 2049",
        description: "Visually stunning sequel to the classic cyberpunk film",
        category: "Sci-Fi Movie",
        confidence: 0.92,
      },
      {
        id: "6",
        title: "The Expanse",
        description: "Hard science fiction series with realistic space politics",
        category: "Sci-Fi Series",
        confidence: 0.87,
      },
    ],

    thriller: [
      {
        id: "7",
        title: "Mindhunter",
        description: "Psychological crime series about FBI profilers studying serial killers",
        category: "Crime Thriller",
        confidence: 0.89,
      },
      {
        id: "8",
        title: "Gone Girl",
        description: "Psychological thriller about a missing wife and suspicious husband",
        category: "Psychological Thriller",
        confidence: 0.86,
      },
    ],

    comedy: [
      {
        id: "9",
        title: "The Office",
        description: "Mockumentary sitcom about office workers with great character humor",
        category: "Comedy Series",
        confidence: 0.91,
      },
      {
        id: "10",
        title: "Brooklyn Nine-Nine",
        description: "Police procedural comedy with diverse cast and clever writing",
        category: "Comedy Series",
        confidence: 0.84,
      },
    ],

    // Actor-based searches
    "ryan gosling": [
      {
        id: "11",
        title: "La La Land",
        description: "Musical romantic drama about aspiring artists in Los Angeles",
        category: "Musical Drama",
        confidence: 0.93,
      },
      {
        id: "12",
        title: "Drive",
        description: "Neo-noir action film with stylish cinematography and minimal dialogue",
        category: "Action Thriller",
        confidence: 0.88,
      },
    ],

    // Default recommendations for general searches
    default: [
      {
        id: "13",
        title: "Breaking Bad",
        description: "Crime drama about a chemistry teacher turned methamphetamine manufacturer",
        category: "Crime Drama",
        confidence: 0.95,
      },
      {
        id: "14",
        title: "The Mandalorian",
        description: "Star Wars series following a bounty hunter in the outer rim",
        category: "Sci-Fi Adventure",
        confidence: 0.87,
      },
      {
        id: "15",
        title: "Parasite",
        description: "Korean thriller about class conflict and social inequality",
        category: "International Thriller",
        confidence: 0.94,
      },
    ],
  }

  // Find matching recommendations based on query keywords
  const queryLower = query.toLowerCase()
  let selectedRecommendations: Recommendation[] = []

  // Check for specific matches
  for (const [key, recommendations] of Object.entries(mockRecommendations)) {
    if (key !== "default" && queryLower.includes(key)) {
      selectedRecommendations.push(...recommendations)
    }
  }

  // If no specific matches, use default recommendations
  if (selectedRecommendations.length === 0) {
    selectedRecommendations = mockRecommendations.default
  }

  // Shuffle and limit results
  const shuffled = selectedRecommendations.sort(() => Math.random() - 0.5).slice(0, maxRecommendations)

  return shuffled
}
