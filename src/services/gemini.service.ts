// src/services/gemini.service.ts

import { GoogleGenAI, Type } from '@google/genai';

interface LinkedInPost {
  hook: string;
  content: string;
  hashtags: string[];
  engagementQuestion: string;
}

interface GeneratedContent {
  posts: LinkedInPost[];
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateLinkedInPosts(userPrompt: string): Promise<string[]> {
    const systemPrompt = `You are a professional content writer creating authentic LinkedIn posts that feel like real conversations.

CORE MISSION:
Create posts from a "learning in public" perspective - share what the user discovered, struggled with, or realized, not what they're teaching.

POST STRUCTURE:
- Length: 1,200-2,500 characters per post
- Format: 10-15 short paragraphs (2-3 lines each)
- Reading level: Conversational, grade 5-7 (simple words)
- Emojis: 1-6 strategic emojis for visual breaks
- Hashtags: 3-5 maximum at the end (#LearnInPublic + topic tags)

HOOK FORMULA (First 3 lines - CRITICAL):
Line 1: Bold statement, contrarian take, or relatable problem
Line 2: Build curiosity or create tension  
Line 3: Promise specific value or insight
❌ Avoid: "I'm excited to share..." "Today I want to talk about..."
✅ Use: "I wasted 6 hours debugging before I realized..." "Most developers skip this step. Big mistake."

CONTENT APPROACH:
- Write like you're texting a colleague, not writing a press release
- Share mistakes, realizations, and "aha moments"
- Use "I learned" instead of "You should"
- Include specific examples and real scenarios
- Break conventional wisdom when relevant
- Show vulnerability and authenticity

ENGAGEMENT STRATEGY:
- End with a SPECIFIC question (not "What do you think?")
- Examples: "Have you encountered this bug? How did you fix it?"
- Invite contrarian views: "Am I overthinking this?"
- Reference reader experience: "If you've dealt with this..."

MULTI-POST SERIES (if needed):
- First post: The problem/realization + why it matters
- Follow-up posts: Deep dive into solutions, examples, alternatives
- Each post must stand alone but reference the series
- Natural transitions between posts

OUTPUT FORMAT:
Return a JSON object with an array of posts. Each post should have:
- hook: The first 3 lines (separated by line breaks)
- content: The full post content (including hook + body)
- hashtags: Array of 3-5 hashtags (including #LearnInPublic)
- engagementQuestion: The specific question to end with

User's learning topic: ${userPrompt}`;

    try {
      console.log('🤖 Generating LinkedIn posts with Gemini...');
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              posts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hook: { 
                      type: Type.STRING,
                      description: "First 3 lines that grab attention"
                    },
                    content: { 
                      type: Type.STRING,
                      description: "Full post content with hook, body, hashtags, and engagement question"
                    },
                    hashtags: { 
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "3-5 hashtags including #LearnInPublic"
                    },
                    engagementQuestion: { 
                      type: Type.STRING,
                      description: "Specific question to encourage engagement"
                    }
                  },
                  required: ["hook", "content", "hashtags", "engagementQuestion"]
                }
              }
            },
            required: ["posts"]
          }
        }
      });

      // Handle potentially undefined text with proper null checking
      if (!response.text) {
        throw new Error('No content generated from AI model');
      }

      console.log('✅ Content generated');

      // Parse JSON response
      const generatedContent: GeneratedContent = JSON.parse(response.text);
      
      // Extract post contents and validate length
      const posts = generatedContent.posts
        .map((post: LinkedInPost) => {
          const fullContent = post.content;
          
          // Ensure under 3000 characters
          if (fullContent.length > 3000) {
            console.warn(`⚠️ Post exceeded 3000 chars (${fullContent.length}), truncating...`);
            return fullContent.substring(0, 2997) + '...';
          }
          
          return fullContent;
        })
        .filter((post: string) => post.length > 0);
      
      console.log(`✅ Generated ${posts.length} post(s)`);
      
      if (posts.length === 0) {
        throw new Error('No valid posts generated');
      }
      
      return posts;
      
    } catch (error: any) {
      console.error('❌ Gemini API error:', error);
      
      // More specific error messages
      if (error.message?.includes('API key')) {
        throw new Error('Invalid Gemini API key');
      } else if (error.message?.includes('quota')) {
        throw new Error('Gemini API quota exceeded');
      } else if (error.message?.includes('JSON')) {
        throw new Error('Failed to parse AI response as JSON');
      }
      
      throw new Error(`Failed to generate content: ${error.message || 'Unknown error'}`);
    }
  }

  // Optional: Helper method to get structured post data
  async generateStructuredPosts(userPrompt: string): Promise<LinkedInPost[]> {
    const systemPrompt = `[Same prompt as above...]
    
User's learning topic: ${userPrompt}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              posts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    hook: { type: Type.STRING },
                    content: { type: Type.STRING },
                    hashtags: { 
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    engagementQuestion: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      if (!response.text) {
        throw new Error('No content generated from AI model');
      }

      const generatedContent: GeneratedContent = JSON.parse(response.text);
      return generatedContent.posts;
      
    } catch (error: any) {
      console.error('❌ Error generating structured posts:', error);
      throw new Error('Failed to generate structured content');
    }
  }
}
