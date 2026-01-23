import 'dotenv/config';
import { PasswordHasherService } from '../crypto/password-hasher.service';
import { UserRole } from '../../users/users.types';
import { DatabaseService } from '../database/database.service';

async function seedAdmin() {
  const database = new DatabaseService();
  const passwordHasher = new PasswordHasherService();

  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;
  const name = process.env.ADMIN_NAME! || 'Admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in the .env');
  }

  const existingAdmin = await database.query({
    text: `
      SELECT 
        id 
      FROM 
        users
      WHERE 
        email = $1
      LIMIT 1
    `,
    values: [email],
  });

  if (existingAdmin.rowCount! > 0) {
    console.log('Admin user already exists');

    return;
  }

  const passwordHash = await passwordHasher.hash(password);

  await database.query({
    text: `
      INSERT INTO 
        users (name, email, password_hash, role)
      VALUES 
        ($1, $2, $3, $4)
    `,
    values: [name, email, passwordHash, UserRole.ADMIN],
  });

  console.log('Admin user created successfully');
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
