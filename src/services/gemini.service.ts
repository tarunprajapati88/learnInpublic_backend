// src/services/gemini.service.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateLinkedInPosts(userPrompt: string): Promise<string[]> {
    const systemPrompt = `You are a professional content writer who creates engaging posts on LinkedIn.

INSTRUCTIONS:
1. Create LinkedIn posts based on the user's input
2. Keep EACH post under 3000 characters
3. Use relevant hashtags including #LearnInPublic and topic-specific hashtags
4. Make posts interactive - encourage questions and engagement
5. If the topic is complex, create 2-3 follow-up posts that dive deeper
6. Expand with details, examples, and real-world applications
7. Ask questions to engage readers (e.g., "What's your approach to this?")
8. Use line breaks and emojis for readability
9. Structure: Hook → Value → Call-to-action

IMPORTANT: 
- Separate each post with "---POST_SEPARATOR---"
- Create 1-3 posts depending on content depth
- First post: Introduction/overview
- Following posts: Deep dives into specific aspects

User's topic: ${userPrompt}`;

    try {
      console.log('🤖 Generating LinkedIn posts with Gemini...');
      
      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Content generated');
      // Split by separator
 const posts = text
  .split('---POST_SEPARATOR---')
  .map((post: string) => post.trim())
  .filter((post: string) => post.length > 0)
  .map((post: string) => {
    // Ensure under 3000 characters
    if (post.length > 3000) {
      return post.substring(0, 2997) + '...';
    }
    return post;
  });
      
       console.log(`✅ Generated ${posts.length} post(s)`);
      
      return posts;
      
    } catch (error: any) {
      console.error('❌ Gemini API error:', error.message);
      throw new Error('Failed to generate content with AI');
    }
  }
}
