import { DatabaseService } from 'src/infra/database/database.service';
import { UsersRepository } from 'src/users/users.repository';
import { PasswordHasherService } from 'src/infra/crypto/password-hasher.service';
import { CreateUserOrchestrator, User, UserRole } from 'src/users/users.types';
import { TicketsRepository } from 'src/tickets/tickets.repository';
import {
  CreateTicketOrchestrator,
  Ticket,
  TicketStatus,
  TicketTag,
} from 'src/tickets/tickets.types';
import { faker } from '@faker-js/faker';

let databaseService: DatabaseService;

function setDatabaseService(db: DatabaseService) {
  databaseService = db;
}

async function clearDatabase() {
  if (!databaseService) {
    throw new Error(
      'DatabaseService has not been configured in the orchestrator.',
    );
  }

  await databaseService.query(
    'TRUNCATE TABLE users, tickets RESTART IDENTITY;',
  );
}

async function createUser(userObject: CreateUserOrchestrator): Promise<User> {
  if (!databaseService) {
    throw new Error(
      'DatabaseService has not been configured in the orchestrator.',
    );
  }

  const usersRepository = new UsersRepository(databaseService);
  const passwordHasherService = new PasswordHasherService();

  const { name, email, password, role } = userObject;

  const passwordHash = await passwordHasherService.hash(
    password || 'securePassword',
  );

  const row = await usersRepository.create({
    name: name || faker.name.fullName(),
    email: email || faker.internet.email(),
    passwordHash: passwordHash,
    role: role || UserRole.CUSTOMER,
  });

  const createdUser: User = {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };

  return createdUser;
}

async function createTicket(
  ticketObject: CreateTicketOrchestrator,
): Promise<Ticket> {
  if (!databaseService) {
    throw new Error(
      'DatabaseService has not been configured in the orchestrator.',
    );
  }

  const ticketsRepository = new TicketsRepository(databaseService);

  const { title, description, status, tag, createdBy, assignedTo } =
    ticketObject;

  const row = await ticketsRepository.create({
    title: title || faker.company.catchPhrase(),
    description: description || faker.lorem.paragraph(),
    status: status || TicketStatus.OPEN,
    tag: tag || TicketTag.BUG,
    createdBy,
    assignedTo: assignedTo || null,
  });

  const createdTicker: Ticket = {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    tag: row.tag,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };

  return createdTicker;
}

const orchestrator = {
  setDatabaseService,
  clearDatabase,
  createUser,
  createTicket,
};

export default orchestrator;
