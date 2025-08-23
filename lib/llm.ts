
// import { InferenceClient } from "@huggingface/inference"
import OpenAI from "openai";
import { APIResponse, Content } from "./types";


export async function cleanQueryWithLLM(query: string): Promise<APIResponse<Content[]>>  {
    console.log("Inside cleanQueryWithLLM")
  
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY
  try {
      const prompt = `5 movies & TV shows Only for "${query}" with ratings & information from https://www.imdb.com/ sort by release year, return ONLY valid JSON array (no text before or after).
      JSON format: 
      [
        {
          "title": "Movie or TV title",
          "description": "Short plot or info in no more than 15 words",
          "category": "movie | tv",
          "confidence": 0.95
          "type": "movie" | "tv"
          "release_year": number
          "poster_url": string
          "imdb_rating": number
          "rotten_tomatoes_rating?": number
          "tmdb_rating": number
          "genre": string
          "streaming_platforms": string[]
          "cast": string[]
          "runtime": number
          "language": string
          "trailer_url?": string
          "status": "released" | "upcoming"
        }
      ]
      Ensure it is strictly JSON. if none still 5 sorted by latest year`;

      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    // console.log("response Data", data);
    // console.log("LLM response message(query)", data.choices?.[0]?.message?.content?.trim())
    const raw = data.choices?.[0]?.message?.content?.trim() ||""
     
    // Clean out code fences
    let cleanedResult = raw.replace(/```json/gi, "").replace(/```/g, "").trim()

    // console.log("response cleaned Data", cleanedResult);
     // --- NEW: grab objects one by one ---
    const matches = cleanedResult.match(/\{[\s\S]*?\}/g) || []

    const parsed: any[] = []
    for (const m of matches) {
      try {
        const obj = JSON.parse(m)

        // only accept if it has a title and no obviously broken fields
        if (obj.title && typeof obj.title === "string") {
          parsed.push(obj)
        }
      } catch {
        // skip broken object (e.g. truncated URL, half-written key)
        continue
      }
    }

    if (!cleanedResult) {
      return { success: false, error: "LLM returned no content" }
    }
    let llmResults: Content[] = []
    try {
      const parsed = JSON.parse(cleanedResult) // parse JSON returned by LLM
      if (Array.isArray(parsed)) {
        llmResults = parsed as Content[]
      }
      llmResults = parsed.map((m: any) => ({
          title: m.title || "",
          description: m.description || "",
          category: m.category || "Unknown",
          confidence: m.confidence || 0.8,
          type: m.type || "movie",
          release_year: m.release_year || null,
          poster_url: m.poster_url || "",
          backdrop_url: m.backdrop_url || "",
          imdb_rating: m.imdb_rating || null,
          rotten_tomatoes_rating: m.rotten_tomatoes_rating || null,
          tmdb_rating: m.tmdb_rating || null,
          genre: m.genre || [],
          streaming_platforms: m.streaming_platforms || [],
          cast: m.cast || [],
          runtime: m.runtime || null,
          country: m.country || "",
          language: m.language || "",
          trailer_url: m.trailer_url || "",
          status: m.status || "unknown",
        }))
      } catch (parseError) {
      console.error("Failed to parse LLM JSON:", cleanedResult)
      return { success: false, error: "Invalid JSON from LLM" }
    }
    return { success: true, data: llmResults }
  } catch (err) {
    console.error("LLM exception:", err);
    return  { success: false, error: err instanceof Error ? err.message : "Unknown LLM error" };

}}



// WOrks if still have FREE TIER
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });
//   try {
//     const prompt = `Top 100 movies & TV shows for "${query}" with ratings from web. Return JSON: [{"title":"...","description":"...","category":"...","confidence":0.95}]. Include popular & acclaimed content; if none still top 100 sorted by latest year`;

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini", // or "gpt-4o", "gpt-3.5-turbo"
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.7,
//       max_tokens: 300,
//     });

//     const text = response.choices?.[0]?.message?.content ?? query;
//     console.log ("response text = ", text)
//     return text.trim();
//   } catch (err) {
//     console.error("LLM exception:", err);
//     return query;
//   }
// }



// const resp = await fetch("https://api.openai.com/v1/chat/completions", {
//   method: "POST",
//   headers: {
//     "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     model: "gpt-3.5-turbo",
//     messages: [
//       {
//         role: "system",
//         content: "You are a movie and TV show expert."
//       },
//       {
//         role: "user",
//         content: `Top 100 movies & TV shows for "${query}" with ratings from web. Return JSON: [{"title":"...","description":"...","category":"...","confidence":0.95}]. Include popular & acclaimed content; if none still top 100 sorted by latest year`
//       }
//     ],
//     max_tokens: 300
//   }),
// });

// const data = await resp.json();
// console.log(data.choices[0].message.content);


// const HF_API_KEY = `${process.env.HF_API_KEY}`
// const client = new InferenceClient(HF_API_KEY)
// const resp = await client.textGeneration({
//   model: "https://api.openai.com/v1/chat/completions", // or any model you like
//   inputs: `You are a movie and TV show expert. List the top 100 movies and TV shows with keywords "${query}" and sort them based on ratings and ensure the records are fetched not just from TMDB API but also from internet searches and average the ratings from all sources.
//             Please provide exactly recommendations for the best movies and TV shows. For each recommendation, provide:

//             1. Title (exact name)
//             2. Brief description (max 80 characters)
//             3. Category (genre or type)
//             4. Why it's considered one of the best (confidence reason)

//             Format your response as a JSON array with this structure:
//             [
//             {
//                 "title": "Movie/Show Title",
//                 "description": "Brief description",
//                 "category": "Genre/Type",
//                 "confidence": 0.95
//             }
//             ]
//             Focus on critically acclaimed, popular, and influential content. Include both movies and TV shows if the query mentions both.
//             If no results were found, show "No results found for your query" but still shows top 100 movies and shows sorted by reviews and year`
// })

// console.log("resp.generated_text" , resp.generated_text)


//     if (!resp.ok) {
//       console.error("LLM error:", await resp.generated_text)
//       return query
//     }

//     // const data = await resp.json()
//     if (Array.isArray(resp.generated_text)) {
//       return resp.generated_text.trim()
//     }

// try {
//     const resp = await fetch("https://api-inference.huggingface.co/models/google/tiiuae/falcon-7b", {
//       method: "POST",
//       headers: {
//         "Authorization": `Bearer ${process.env.HF_API_KEY}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         inputs: `You are a movie and TV show expert. List the top 100 movies and TV shows with keywords "${query}" and sort them based on ratings and ensure the records are fetched not just from TMDB API but also from internet searches and average the ratings from all sources.

// Please provide exactly recommendations for the best movies and TV shows. For each recommendation, provide:

// 1. Title (exact name)
// 2. Brief description (max 80 characters)
// 3. Category (genre or type)
// 4. Why it's considered one of the best (confidence reason)

// Format your response as a JSON array with this structure:
// [
//   {
//     "title": "Movie/Show Title",
//     "description": "Brief description",
//     "category": "Genre/Type",
//     "confidence": 0.95
//   }
// ]

// Focus on critically acclaimed, popular, and influential content. Include both movies and TV shows if the query mentions both.
// If no results were found, show "No results found for your query" but still shows top 100 movies and shows sorted by reviews and year`,
//       }),
//     })

    // console.log("LLM resp = ", resp)



//     return query
//   } catch (err) {
//     console.error("LLM exception:", err)
//     return query
//   }