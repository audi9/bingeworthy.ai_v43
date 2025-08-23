import type { SearchResult } from "./movie-api"

export async function fetchFromGoogle(query: any): Promise<SearchResult[]> {
    console.log("Inside fetchFromGoogle")
  if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_CSE_ID) {
    console.warn("⚠️ Google API not configured")
    return []
  }

  try {
    // const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    //   query + " movie tv show rating"
    // )}&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}`

    const cleanQuery = String(query).trim();
    console.log("🛑 Raw query value:", query, typeof query);
    const url = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}&q=${encodeURIComponent(cleanQuery+ " movie tv show rating")}`;

    console.log("🔍 Sending query to Google:", cleanQuery);
    console.log("🌐 Request URL:", url);

    const resp = await fetch(url)
    const data = await resp.json()

    if (!data.items) return []
    console.log("query: = ",query)
    console.log("data: = ",data)
    return data.items.map((item: any, idx: number) => ({
      id: `google_${idx}`,
      title: item.title,
      type: "movie", // Google doesn’t distinguish; assume movie
      overview: item.snippet,
      sourceRatings: {
        google: extractRating(item.snippet),
      },
    }))
  } catch (err) {
    console.error("Google fetch error:", err)
    return []
  }
}

// crude regex to extract "7.5/10" or "85%" style ratings
function extractRating(text: string): number | undefined {
  const match = text.match(/(\d+(\.\d+)?)\s*\/\s*10/) || text.match(/(\d+)%/)
  if (!match) return undefined
  let val = parseFloat(match[1])
  if (text.includes("%")) val = val / 10
  return val > 0 && val <= 10 ? val : undefined
}
