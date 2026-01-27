export type TicketCommentRow = {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type TicketComment = {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTicketCommentInput = {
  ticketId: string;
  authorId: string;
  content: string;
};
