import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { KnowledgeBaseService } from '../knowledge-base.service';
import { ChatMessage, ChatResponse } from './types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatbotService {
  private readonly conversationHistory: Map<string, ChatMessage[]> = new Map();
  private readonly MAX_HISTORY = 20;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly knowledgeBase: KnowledgeBaseService,
  ) {}

  private get apiKey(): string | undefined {
    return this.configService.get<string>('OPENROUTER_API_KEY');
  }

  private get model(): string {
    return this.configService.get<string>('OPENROUTER_MODEL', 'openai/gpt-4o-mini');
  }

  private getOfflineResponse(message: string, chunks: any[]): string {
    const lowerMessage = message.toLowerCase();
    
    // Greeting
    if (lowerMessage.match(/\b(hi|hello|hey|greetings|welcome)\b/)) {
      return "Hello! I'm Yousef's AI assistant (running in offline mode). How can I help you learn about his skills, experience, or projects today?";
    }
    
    // Use retrieved chunks directly if available
    if (chunks.length > 0 && chunks[0].score > 0) {
      // Find the most relevant chunk
      const bestChunk = chunks[0];
      return `Based on my offline knowledge base: \n\n${bestChunk.text}\n\n(This is an offline response because the OpenRouter connection is unavailable or no API key was provided.)`;
    }
    
    // Generic fallback
    return "I am currently running in offline mode and couldn't find a specific answer for your query in my local database. Yousef is an AI Engineer and Machine Learning Developer. You can ask me about his experience at Wider, his skills with LangChain/TensorFlow, or his student club activities.";
  }

  async sendMessage(
    message: string,
    sessionId: string = 'default',
  ): Promise<{
    response: string;
    model: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    sources: string[];
  }> {
    // Search knowledge base for relevant context
    const relevantChunks = await this.knowledgeBase.search(message, 5);

    // Build context from knowledge base
    let context = '';
    const sources: string[] = [];
    if (relevantChunks.length > 0) {
      context = relevantChunks.map((chunk, i) => {
        sources.push(chunk.source);
        return `[Context ${i + 1}]: ${chunk.text}`;
      }).join('\n\n');
    }

    // Build system prompt
    const systemPrompt = `
You are Yousef Malak Ibrahim's AI assistant. You are knowledgeable about his background, skills, experience, projects, and education. You answer questions based on the provided context and your general knowledge.

About Yousef:
- Yousef Malak Ibrahim Andraws is an AI Engineer and Machine Learning Developer based in Maadi, Cairo, Egypt.
- He is pursuing a Bachelor of Computer Science in Software Engineering at Ain Shams University (GPA: 3.4/4.0).
- He works as an AI Engineer at Wider, a multinational company.
- He is the Head of AI at iCLUB student club.
- He completed an AI Agent Developer Course at Orange Digital Center with a grade of 99.3%.
- His expertise includes LangChain, LangGraph, Multi-Agent Systems, RAG, Prompt Engineering, Knowledge Graphs, TensorFlow, PyTorch, Django, FastAPI, and many more.

Context from knowledge base:
${context}

Instructions:
1. Answer questions based on the context provided above.
2. If the question is about Yousef, use the context to answer.
3. If the question is general AI/tech, use your knowledge.
4. Be friendly, professional, and concise.
5. If you don't have enough context, say so honestly.
6. Respond in the same language as the user's question.
7. Cite relevant context when answering about Yousef's experience or projects.
`.trim();

    // Get conversation history
    if (!this.conversationHistory.has(sessionId)) {
      this.conversationHistory.set(sessionId, []);
    }
    const history = this.conversationHistory.get(sessionId)!;

    // Build messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-this.MAX_HISTORY),
      { role: 'user', content: message },
    ];
    
    // Check if we should use offline mode
    const currentApiKey = this.apiKey;
    const isPlaceholderKey = !currentApiKey || currentApiKey === 'sk-or-v1-your-api-key-here';

    if (isPlaceholderKey) {
      console.log('Using offline mode: No valid API key provided');
      const offlineResponse = this.getOfflineResponse(message, relevantChunks);
      
      // Save to history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: offlineResponse });
      if (history.length > this.MAX_HISTORY * 2) {
        history.splice(0, history.length - this.MAX_HISTORY * 2);
      }
      
      return {
        response: offlineResponse,
        model: 'offline-local-rag',
        sources: [...new Set(sources)],
      };
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<ChatResponse>(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: this.model,
            messages,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 0.9,
            frequency_penalty: 0.1,
            presence_penalty: 0.1,
          },
          {
            headers: {
              Authorization: `Bearer ${currentApiKey}`,
              'HTTP-Referer': 'http://localhost:8080',
              'X-Title': 'Yousef Malak Ibrahim Portfolio',
            },
          },
        ),
      );

      const assistantMessage = response.data.choices[0].message.content;

      // Save to history
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: assistantMessage });
      if (history.length > this.MAX_HISTORY * 2) {
        history.splice(0, history.length - this.MAX_HISTORY * 2);
      }

      return {
        response: assistantMessage,
        model: response.data.model,
        usage: response.data.usage,
        sources: [...new Set(sources)],
      };
    } catch (error: any) {
      console.error('OpenRouter API error:', error.response?.data || error.message);
      
      // Fallback to offline mode on connection error
      console.log('Falling back to offline mode due to API error');
      const offlineResponse = this.getOfflineResponse(message, relevantChunks);
      
      history.push({ role: 'user', content: message });
      history.push({ role: 'assistant', content: offlineResponse });
      
      return {
        response: offlineResponse,
        model: 'offline-fallback-local-rag',
        sources: [...new Set(sources)],
      };
    }
  }

  clearHistory(sessionId: string): void {
    this.conversationHistory.delete(sessionId);
  }

  getHistory(sessionId: string): ChatMessage[] {
    return this.conversationHistory.get(sessionId) || [];
  }
}