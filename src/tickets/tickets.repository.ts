import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../infra/database/database.service';
import {
  CreateTicketInput,
  TicketRow,
  TicketStatus,
  TicketTag,
} from './tickets.types';

@Injectable()
export class TicketsRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(input: CreateTicketInput): Promise<TicketRow> {
    const result = await this.db.query<TicketRow>({
      text: `
        INSERT INTO
          tickets (title, description, status, tag, created_by, assigned_to)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING
          *;
      `,
      values: [
        input.title,
        input.description,
        input.status,
        input.tag,
        input.createdBy,
        input.assignedTo,
      ],
    });

    return result.rows[0];
  }

  async findOneById(id: string): Promise<TicketRow | null> {
    const result = await this.db.query<TicketRow>({
      text: `
        SELECT
          *
        FROM
          tickets
        WHERE
          id = $1
        LIMIT 1
      `,
      values: [id],
    });

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0];
  }

  async findMany(filters: {
    createdBy?: string;
    assignedTo?: string;
    status?: TicketStatus;
    tag?: TicketTag;
    limit: number;
    offset: number;
  }): Promise<TicketRow[]> {
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.createdBy) {
      conditions.push(`created_by = $${values.length + 1}`);
      values.push(filters.createdBy);
    }

    if (filters.assignedTo) {
      conditions.push(`assigned_to = $${values.length + 1}`);
      values.push(filters.assignedTo);
    }

    if (filters.status) {
      conditions.push(`status = $${values.length + 1}`);
      values.push(filters.status);
    }

    if (filters.tag) {
      conditions.push(`tag = $${values.length + 1}`);
      values.push(filters.tag);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    values.push(filters.limit);
    const limitIndex = values.length;

    values.push(filters.offset);
    const offsetIndex = values.length;

    const result = await this.db.query<TicketRow>({
      text: `
      SELECT
        *
      FROM
        tickets
      ${whereClause}
      ORDER BY
        created_at DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `,
      values,
    });

    return result.rows;
  }

  async updateAssignedTo(id: string, agentId: string): Promise<TicketRow> {
    const result = await this.db.query<TicketRow>({
      text: `
        UPDATE
          tickets
        SET
          assigned_to = $2,
          updated_at = now()
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, agentId],
    });

    return result.rows[0];
  }

  async updateStatus(id: string, status: TicketStatus): Promise<TicketRow> {
    const result = await this.db.query<TicketRow>({
      text: `
        UPDATE
          tickets
        SET
          status = $2,
          updated_at = now()
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, status],
    });

    return result.rows[0];
  }
}
