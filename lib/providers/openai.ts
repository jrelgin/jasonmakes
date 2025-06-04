import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { kv } from '../kv';
import { get } from '@vercel/edge-config';
import type { Profile } from '../profile';

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Default prompt if Edge Config isn't available
const DEFAULT_SYSTEM_PROMPT = `You generate a short, casual, first-person blurb about Jason based on his recent activity.
Use the provided weather, article reading, and music listening data to create a single sentence (60-80 tokens)
that feels natural and conversational. Don't use bullet points or lists.`;

/**
 * Generate a blurb about Jason based on his profile data
 * @param profile The user profile containing weather, feedly, and spotify data
 * @param timeoutMs Timeout in milliseconds (default: 12000ms)
 */
export async function generateBlurb(profile: Profile, timeoutMs = 12000): Promise<string> {
  try {
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    // Try to get the system prompt from Edge Config
    let systemPrompt: string;
    try {
      const configPrompt = await get('prompt_blurb_v1');
      systemPrompt = typeof configPrompt === 'string' ? configPrompt : DEFAULT_SYSTEM_PROMPT;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error: unknown) {
      console.warn('Failed to get prompt from Edge Config, using default prompt');
      systemPrompt = DEFAULT_SYSTEM_PROMPT;
    }
    
    // Extract data for the prompt
    const weather = profile.weather;
    const latestArticle = profile.feedly?.articles?.[0];
    const lastTrack = profile.spotify?.track;
    
    // Prepare user message with profile data
    const userMessage: ChatCompletionMessageParam = {
      role: 'user',
      content: `Generate a short, casual one-sentence blurb about Jason based on this data:
      
Weather: ${weather?.city || 'Unknown location'}, ${weather?.temperature || 'unknown'}°F, ${weather?.condition || 'unknown condition'}, Humidity: ${weather?.mean_humidity || 'unknown'}%

${latestArticle ? `Latest article read: "${latestArticle.title}"
Excerpt: "${latestArticle.excerpt || 'No excerpt available'}"` : 'No recent articles'}

${lastTrack ? `Last played music: "${lastTrack.title}" by ${lastTrack.artist}` : 'No recent music'}

Current date and time: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}

Create a natural-sounding, casual sentence (max 80 tokens) that mentions these activities.`
    };
    
    // Call OpenAI chat completions API with timeout
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo',  // Using GPT-4 Turbo as it's currently the most capable general model
      messages: [
        { role: 'system', content: systemPrompt } as ChatCompletionMessageParam,
        userMessage
      ],
      max_tokens: 100,
      temperature: 0.7,  // Slightly creative but not too random
    }, { signal: controller.signal });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Extract and return the generated blurb
    const generatedBlurb = response.choices[0]?.message?.content?.trim();
    
    if (!generatedBlurb) {
      throw new Error('OpenAI returned empty response');
    }
    
    return generatedBlurb;
  } catch (error: unknown) {
    // Handle timeout or other errors
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('OpenAI request timed out');
    } else {
      console.error('Error generating blurb:', error);
    }
    
    // Try to get the previous blurb as fallback
    try {
      const previousBlurb = await kv.get('blurb') as string;
      if (previousBlurb) {
        return previousBlurb;
      }
    } catch (fallbackError) {
      console.error('Error getting fallback blurb:', fallbackError);
    }
    
    // Default fallback if everything fails
    return `Jason is currently in ${profile.weather?.city || 'Atlanta'}, enjoying the day and working on interesting projects.`;
  }
}
