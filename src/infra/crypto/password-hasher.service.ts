import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PasswordHasherService {
  private readonly saltRounds: number;

  constructor() {
    this.saltRounds = process.env.NODE_ENV === 'production' ? 14 : 1;
  }

  async hash(providedPassword: string): Promise<string> {
    return bcrypt.hash(providedPassword, this.saltRounds);
  }

  async compare(providedPassword: string, hash: string): Promise<boolean> {
    return bcrypt.compare(providedPassword, hash);
  }
}
