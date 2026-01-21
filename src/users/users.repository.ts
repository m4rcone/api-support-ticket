import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../infra/database/database.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { User } from './users.types';

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async create(dto: CreateUserDto): Promise<User> {
    const result = await this.db.query({
      text: `
        INSERT INTO
          users (name, email, password_hash, role)
        VALUES
          ($1, $2, $3, $4)
        RETURNING
          *;
      `,
      values: [dto.name, dto.email, dto.password, dto.role ?? 'CUSTOMER'],
    });

    return result.rows[0];
  }
}
