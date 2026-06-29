import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AiAnalysisResult {
  summary: string;
  tags: string[];
  category: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly model;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('ai.geminiApiKey');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set — AI analysis will be disabled');
    }

    const genAI = new GoogleGenerativeAI(apiKey || '');
    this.model = genAI.getGenerativeModel({
      model:
        this.configService.get<string>('ai.geminiModel') || 'gemini-2.0-flash',
    });
  }

  async analyzeContent(
    url: string,
    textContent: string,
  ): Promise<AiAnalysisResult> {
    const prompt = `You are a URL content analyzer. Analyze the following webpage content and return a JSON response.

    URL: ${url}

    Content:
    ${textContent}

    Respond with ONLY a valid JSON object (no markdown, no code fences, no extra text) in this exact format:
    {
    "summary": "A concise 1-2 sentence summary of what this webpage is about",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "category": "One of: Technology, Programming, Business, Finance, Education, Science, Health, News, Entertainment, Sports, Social Media, Shopping, Travel, Food, Other"
    }

    Rules:
    - Summary should be informative and under 200 characters
    - Provide 3-5 relevant lowercase tags
    - Pick exactly ONE category from the list above
    - Return ONLY the JSON, nothing else`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      return this.parseResponse(text);
    } catch (error) {
      this.logger.error(
        `Gemini API error: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      throw error;
    }
  }

  private parseResponse(text: string): AiAnalysisResult {
    // Strip markdown code fences if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;

      const summary =
        typeof parsed.summary === 'string'
          ? parsed.summary.slice(0, 500)
          : 'No summary available';

      const tags = Array.isArray(parsed.tags)
        ? parsed.tags
            .filter((t): t is string => typeof t === 'string')
            .map((t) => t.toLowerCase().trim())
            .slice(0, 10)
        : [];

      const validCategories = [
        'Technology',
        'Programming',
        'Business',
        'Finance',
        'Education',
        'Science',
        'Health',
        'News',
        'Entertainment',
        'Sports',
        'Social Media',
        'Shopping',
        'Travel',
        'Food',
        'Other',
      ];

      const category =
        typeof parsed.category === 'string' &&
        validCategories.includes(parsed.category)
          ? parsed.category
          : 'Other';

      return { summary, tags, category };
    } catch {
      this.logger.warn(`Failed to parse AI response: ${cleaned.slice(0, 200)}`);
      return {
        summary: 'AI analysis could not be completed',
        tags: [],
        category: 'Other',
      };
    }
  }
}
