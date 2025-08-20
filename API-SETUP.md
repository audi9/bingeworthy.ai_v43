# API Keys Setup Guide for bingeworthy.ai

## Required API Keys

### 1. TMDB API Key (Required for Movie/TV Data)
- **Where to get it**: [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
- **Free tier**: 1000 requests per day, no expiration
- **Steps**:
  1. Create a free account at themoviedb.org
  2. Go to Settings > API
  3. Request an API key (choose "Developer" option)
  4. Copy your API key

### 2. Hugging Face API Key (Optional for AI Recommendations)
- **Where to get it**: [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
- **Free tier**: Limited requests per month
- **Steps**:
  1. Create a free account at huggingface.co
  2. Go to Settings > Access Tokens
  3. Create a new token with "Read" permissions
  4. Copy your token

## Where to Add API Keys

### Option 1: Vercel Environment Variables (Recommended for Production)
1. Go to your Vercel project dashboard
2. Click on "Settings" tab
3. Click on "Environment Variables"
4. Add these variables:
   - `TMDB_API_KEY` = your_tmdb_api_key_here
   - `HUGGINGFACE_API_KEY` = your_hugging_face_token_here

### Option 2: Local Development (.env.local file)
1. Create a `.env.local` file in your project root
2. Add these lines:
\`\`\`bash
TMDB_API_KEY=your_tmdb_api_key_here
HUGGINGFACE_API_KEY=your_hugging_face_token_here
\`\`\`

### Option 3: Other Deployment Platforms

#### Railway
1. Go to your Railway project
2. Click on "Variables" tab
3. Add the environment variables

#### Netlify
1. Go to Site Settings > Environment Variables
2. Add the variables

#### Docker/Docker Compose
Add to your docker-compose.yml:
\`\`\`yaml
environment:
  - TMDB_API_KEY=your_tmdb_api_key_here
  - HUGGINGFACE_API_KEY=your_hugging_face_token_here
\`\`\`

## Testing Your Setup

1. **TMDB API**: Search for any movie/TV show - you should see real results
2. **Hugging Face API**: Try the AI recommendations feature
3. **Check Console**: Open browser dev tools to see API status logs

## Troubleshooting

- **"API key required" error**: Make sure TMDB_API_KEY is set correctly
- **No search results**: Check your internet connection and API key validity
- **Rate limiting**: TMDB allows 1000 requests/day - upgrade if needed
- **CORS errors**: API keys should be server-side only (they are in this setup)

## Free Tier Limits

- **TMDB**: 1000 requests/day (permanent free tier)
- **Hugging Face**: Rate limited but generous for personal use
- **Upgrade options**: Both services offer paid tiers for higher limits

## Security Notes

- Never expose API keys in client-side code
- Use environment variables only
- Regenerate keys if accidentally exposed
- Monitor usage in respective dashboards
