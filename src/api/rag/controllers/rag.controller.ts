import { Uuid } from '@/common/types/common.type';
import { CurrentUser } from '@/decorators/current-user.decorator';
import { ApiAuth } from '@/decorators/http.decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { ChatReqDto } from '../dto/chat.req.dto';
import { ChatResDto } from '../dto/chat.res.dto';
import { ConversationResDto } from '../dto/conversation.res.dto';
import { SearchResultResDto } from '../dto/search-result.res.dto';
import { SearchReqDto } from '../dto/search.req.dto';
import { RagService } from '../services/rag.service';

@ApiTags('rag')
@Controller({
  path: 'rag',
  version: '1',
})
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('search')
  @ApiAuth({
    type: SearchResultResDto,
    summary: 'Vector similarity search',
  })
  async search(
    @CurrentUser('id') userId: Uuid,
    @Body() reqDto: SearchReqDto,
  ): Promise<SearchResultResDto[]> {
    return this.ragService.search(userId, reqDto.query, reqDto.topK);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiAuth({
    type: ConversationResDto,
    summary: 'Create a new RAG conversation',
    statusCode: HttpStatus.CREATED,
  })
  async createConversation(
    @CurrentUser('id') userId: Uuid,
  ): Promise<ConversationResDto> {
    const conv = await this.ragService.createConversation(userId);
    return this.toConvDto(conv);
  }

  @Get('conversations')
  @ApiAuth({
    type: ConversationResDto,
    summary: 'List user conversations',
  })
  async listConversations(
    @CurrentUser('id') userId: Uuid,
  ): Promise<ConversationResDto[]> {
    const convs = await this.ragService.getConversations(userId);
    return convs.map((c) => this.toConvDto(c));
  }

  @Get('conversations/:id/messages')
  @ApiAuth({
    summary: 'Get messages for a conversation',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async getMessages(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) conversationId: Uuid,
  ) {
    return this.ragService.getMessages(conversationId, userId);
  }

  @Post('conversations/:id/chat')
  @ApiAuth({
    type: ChatResDto,
    summary: 'Send a message (full RAG pipeline: search + LLM)',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async chat(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) conversationId: Uuid,
    @Body() reqDto: ChatReqDto,
  ): Promise<ChatResDto> {
    return this.ragService.query(
      userId,
      conversationId,
      reqDto.message,
      reqDto.topK,
      reqDto.projectId as Uuid | undefined,
      reqDto.confirmation,
    );
  }

  @Delete('conversations/:id')
  @ApiAuth({
    summary: 'Delete a conversation',
  })
  @ApiParam({ name: 'id', type: 'String' })
  async deleteConversation(
    @CurrentUser('id') userId: Uuid,
    @Param('id', ParseUUIDPipe) conversationId: Uuid,
  ): Promise<void> {
    return this.ragService.deleteConversation(conversationId, userId);
  }

  private toConvDto(conv: any): ConversationResDto {
    return {
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    };
  }
}
