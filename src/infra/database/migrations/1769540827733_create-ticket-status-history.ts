import type { MigrationBuilder } from 'node-pg-migrate';

export function up(pgm: MigrationBuilder): void {
  pgm.createTable('ticket_status_history', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    ticket_id: {
      type: 'uuid',
      notNull: true,
    },
    previous_status: {
      type: 'ticket_status',
      notNull: true,
    },
    new_status: {
      type: 'ticket_status',
      notNull: true,
    },
    changed_by: {
      type: 'uuid',
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });
}
