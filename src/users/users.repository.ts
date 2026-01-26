import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../infra/database/database.service';
import { CreateUserInput, UserRole, UserRow } from './users.types';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(input: CreateUserInput): Promise<UserRow> {
    const result = await this.db.query<UserRow>({
      text: `
        INSERT INTO
          users (name, email, password_hash, role)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *;
      `,
      values: [
        input.name,
        input.email,
        input.passwordHash,
        input.role ?? 'CUSTOMER',
      ],
    });

    return result.rows[0];
  }

  async findOneByEmail(email: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT
          1
      `,
      values: [email],
    });

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0];
  }

  async findOneById(id: string): Promise<UserRow | null> {
    const result = await this.db.query<UserRow>({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          id = $1
        LIMIT
          1
      `,
      values: [id],
    });

    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0];
  }

  async updateRole(id: string, role: UserRole): Promise<UserRow> {
    const result = await this.db.query<UserRow>({
      text: `
        UPDATE
          users
        SET
          role = $2,
          updated_at = now()
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [id, role],
    });

    return result.rows[0];
  }

  async countAdmins(): Promise<number> {
    const result = await this.db.query<{ count: string }>({
      text: `
      SELECT
        COUNT(*)::text AS count
      FROM
        users
      WHERE
        role = $1
    `,
      values: [UserRole.ADMIN],
    });

    return Number(result.rows[0].count);
  }
}
