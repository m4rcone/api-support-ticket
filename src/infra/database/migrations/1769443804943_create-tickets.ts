import { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
  pgm.createType('ticket_status', [
    'OPEN',
    'IN PROGRESS',
    'RESOLVED',
    'CLOSED',
  ]);
  pgm.createType('ticket_tag', ['BUG', 'FEATURE', 'QUESTION', 'IMPROVEMENT']);
  pgm.createTable('tickets', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
      notNull: true,
    },
    status: {
      type: 'ticket_status',
      notNull: true,
      default: 'OPEN',
    },
    tag: {
      type: 'ticket_tag',
      notNull: true,
    },
    created_by: {
      type: 'uuid',
      notNull: true,
    },
    assigned_to: {
      type: 'uuid',
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
  pgm.createIndex('tickets', 'created_by');
  pgm.createIndex('tickets', 'status');
  pgm.createIndex('tickets', 'tag');
}
