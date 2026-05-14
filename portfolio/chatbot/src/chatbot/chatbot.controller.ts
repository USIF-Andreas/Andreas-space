import { Controller, Post, Body, Get, Query, Delete } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatMessage } from './types';

@Controller('api/chat')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('send')
  async sendMessage(@Body() dto: SendMessageDto) {
    return this.chatbotService.sendMessage(dto.message, dto.sessionId);
  }

  @Get('history')
  getHistory(@Query('sessionId') sessionId: string = 'default') {
    return {
      messages: this.chatbotService.getHistory(sessionId),
    };
  }

  @Delete('history')
  clearHistory(@Query('sessionId') sessionId: string = 'default') {
    this.chatbotService.clearHistory(sessionId);
    return { success: true, message: 'Conversation cleared' };
  }

  @Get('info')
  getInfo() {
    return {
      name: 'Yousef Malak Ibrahim AI Assistant',
      description: 'Ask me anything about my experience, skills, projects, or background!',
      capabilities: [
        'Answer questions about my CV and experience',
        'Provide details about my projects',
        'Discuss my technical skills and expertise',
        'General AI and technology conversations',
      ],
    };
  }
}