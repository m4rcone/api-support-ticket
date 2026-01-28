import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/auth/authenticated-request';
import { TicketCommentsService } from './ticket-comments.service';
import { CreateTicketCommentDto } from './dtos/create-ticket-comment.dto';
import { TicketCommentResponseDto } from './dtos/ticket-comment-response.dto';
import { mapTicketCommentToResponseDto } from './ticket-comments.mapper';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('TicketComments')
@ApiCookieAuth('accessToken')
@Controller('tickets/:id/comments')
@UseGuards(JwtAuthGuard)
export class TicketCommentsController {
  constructor(private readonly ticketCommentsService: TicketCommentsService) {}

  @ApiOkResponse({
    type: TicketCommentResponseDto,
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Req() req: AuthenticatedRequest,
    @Param('id') ticketId: string,
    @Body() body: CreateTicketCommentDto,
  ): Promise<TicketCommentResponseDto> {
    const user = req.user;

    const comment = await this.ticketCommentsService.createComment(
      ticketId,
      user,
      body.content,
    );

    return mapTicketCommentToResponseDto(comment);
  }

  @Get()
  @ApiOkResponse({
    type: TicketCommentResponseDto,
    isArray: true,
  })
  @HttpCode(HttpStatus.OK)
  async listComments(
    @Req() req: AuthenticatedRequest,
    @Param('id') ticketId: string,
  ): Promise<TicketCommentResponseDto[]> {
    const user = req.user;

    const comments = await this.ticketCommentsService.listComments(
      ticketId,
      user,
    );

    return comments.map((comment) => mapTicketCommentToResponseDto(comment));
  }
}
