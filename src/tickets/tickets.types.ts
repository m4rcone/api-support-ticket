export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketTag {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  QUESTION = 'QUESTION',
  IMPROVEMENT = 'IMPROVEMENT',
}
export type TicketRow = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  tag: TicketTag;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type Ticket = {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  tag: TicketTag;
  createdBy: string;
  assignedTo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTicketInput = {
  title: string;
  description: string;
  tag: TicketTag;
  createdBy: string;
};
