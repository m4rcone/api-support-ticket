import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../infra/database/database.service';
import { CreateUserInput, UserRow } from './users.types';

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
}
