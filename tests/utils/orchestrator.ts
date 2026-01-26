import { DatabaseService } from '../../src/infra/database/database.service';
import { UsersService } from '../../src/users/users.service';
import { UsersRepository } from '../../src/users/users.repository';
import { PasswordHasherService } from '../../src/infra/crypto/password-hasher.service';
import { User, UserRole, UserRow } from '../../src/users/users.types';
import { CreateUserDto } from '../../src/users/dtos/create-user.dto';
import { TicketsRepository } from '../../src/tickets/tickets.repository';
import { TicketsService } from '../../src/tickets/tickets.service';
import {
  CreateTicketInput,
  Ticket,
  TicketTag,
} from '../../src/tickets/tickets.types';

async function clearDatabase() {
  const databaseService = new DatabaseService();

  await databaseService.query(
    'TRUNCATE TABLE users, tickets RESTART IDENTITY;',
  );
}

async function createUser(userObject: Partial<CreateUserDto>): Promise<User> {
  const databaseService = new DatabaseService();
  const usersRepository = new UsersRepository(databaseService);
  const passwordHasherService = new PasswordHasherService();
  const usersService = new UsersService(usersRepository, passwordHasherService);

  return await usersService.createUser({
    name: userObject?.name || 'John Doe',
    email: userObject?.email || 'john@example.com',
    password: userObject?.password || 'securepassword',
  });
}

async function createAdminUser(userObject: CreateUserDto): Promise<User> {
  const databaseService = new DatabaseService();
  const passwordHasherService = new PasswordHasherService();

  const result = await databaseService.query<UserRow>({
    text: `
      INSERT INTO
        users (name, email, password_hash, role)
      VALUES 
        ($1, $2, $3, $4)
      RETURNING
        *
    `,
    values: [
      userObject.name,
      userObject.email,
      await passwordHasherService.hash(userObject.password),
      UserRole.ADMIN,
    ],
  });

  const adminUser: User = {
    id: result.rows[0].id,
    name: result.rows[0].name,
    email: result.rows[0].email,
    passwordHash: result.rows[0].password_hash,
    role: result.rows[0].role,
    createdAt: new Date(result.rows[0].created_at),
    updatedAt: new Date(result.rows[0].updated_at),
  };

  return adminUser;
}

async function createAgentUser(userObject: CreateUserDto): Promise<User> {
  const databaseService = new DatabaseService();
  const passwordHasherService = new PasswordHasherService();

  const result = await databaseService.query<UserRow>({
    text: `
      INSERT INTO
        users (name, email, password_hash, role)
      VALUES 
        ($1, $2, $3, $4)
      RETURNING
        *
    `,
    values: [
      userObject.name,
      userObject.email,
      await passwordHasherService.hash(userObject.password),
      UserRole.AGENT,
    ],
  });

  const agentUser: User = {
    id: result.rows[0].id,
    name: result.rows[0].name,
    email: result.rows[0].email,
    passwordHash: result.rows[0].password_hash,
    role: result.rows[0].role,
    createdAt: new Date(result.rows[0].created_at),
    updatedAt: new Date(result.rows[0].updated_at),
  };

  return agentUser;
}

async function createTicket(
  ticketObject: Partial<CreateTicketInput>,
): Promise<Ticket> {
  const databaseService = new DatabaseService();
  const ticketsRepository = new TicketsRepository(databaseService);
  const ticketsService = new TicketsService(ticketsRepository);

  return await ticketsService.createTicket({
    title: ticketObject?.title || 'Ticket title',
    description: ticketObject?.description || 'Ticket description',
    tag: ticketObject?.tag || TicketTag.BUG,
    createdBy: ticketObject?.createdBy || (await createUser({})).id,
  });
}

const orchestrator = {
  clearDatabase,
  createUser,
  createAdminUser,
  createAgentUser,
  createTicket,
};

export default orchestrator;
