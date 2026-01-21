import { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
  pgm.createType('user_role', ['CUSTOMER', 'AGENT', 'ADMIN']);
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    name: {
      type: 'varchar(50)',
      notNull: true,
    },
    email: {
      type: 'varchar(254)',
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: 'varchar(60)',
      notNull: true,
    },
    role: {
      type: 'user_role',
      notNull: true,
      default: 'CUSTOMER',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
}
