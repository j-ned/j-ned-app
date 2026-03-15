import { db } from '../db/client';
import { appUser } from '../db/schema';
import { hashPassword } from '../services/auth-manager';

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: pnpm run db:create-user <email> <password>');
    process.exit(1);
  }

  const hashedPassword = await hashPassword(password);

  try {
    const [user] = await db
      .insert(appUser)
      .values({ email, password: hashedPassword })
      .returning({ id: appUser.id, email: appUser.email });

    console.log(`User created:`, user);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      console.error(`User with email "${email}" already exists.`);
    } else {
      throw error;
    }
  }

  process.exit(0);
}

main();
