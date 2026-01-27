import { TicketComment } from './ticket-comments.types';
import { TicketCommentResponseDto } from './dtos/ticket-comment-response.dto';

export function mapTicketCommentToResponseDto(
  comment: TicketComment,
): TicketCommentResponseDto {
  return {
    id: comment.id,
    ticketId: comment.ticketId,
    authorId: comment.authorId,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}
