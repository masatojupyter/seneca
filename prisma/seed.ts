import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const PASSWORD_HASH_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. 組織（Organization）の作成
  console.log('📋 Creating organization...');
  let organization = await prisma.organization.findFirst({
    where: { name: 'Test Organization' },
  });

  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
      },
    });
    console.log('✅ Created organization:', organization.name);
    console.log('   Organization ID:', organization.id);
  } else {
    console.log('⏭️  Organization already exists:', organization.name);
    console.log('   Organization ID:', organization.id);
  }
  console.log('');

  // 2. 管理者（AdminUser）の作成
  console.log('👤 Creating admin users...');
  const testAdmins = [
    {
      email: 'admin@test.com',
      password: 'adminpassword123',
      name: 'Admin User',
    },
    {
      email: 'manager@test.com',
      password: 'managerpassword123',
      name: 'Manager User',
    },
  ];

  for (const adminData of testAdmins) {
    const existing = await prisma.adminUser.findUnique({
      where: {
        email_organizationId: {
          email: adminData.email,
          organizationId: organization.id,
        },
      },
    });

    if (existing) {
      console.log(`⏭️  Skipping ${adminData.email} (already exists)`);
      continue;
    }

    const passwordHash = await bcrypt.hash(adminData.password, PASSWORD_HASH_ROUNDS);

    const admin = await prisma.adminUser.create({
      data: {
        email: adminData.email,
        passwordHash,
        name: adminData.name,
        organizationId: organization.id,
        isActive: true,
        emailVerified: new Date(),
      },
    });

    console.log(`✅ Created admin: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Password: ${adminData.password}`);
    console.log('');
  }

  // 3. 従業員招待（WorkerInvitation）の作成
  console.log('📧 Creating worker invitations...');
  const workerInvitations = [
    {
      email: 'invited-worker@test.com',
      hourlyRateUsd: 35.00,
    },
  ];

  for (const invitationData of workerInvitations) {
    const existing = await prisma.workerInvitation.findFirst({
      where: {
        email: invitationData.email,
        organizationId: organization.id,
        acceptedAt: null,
      },
    });

    if (existing) {
      console.log(`⏭️  Skipping invitation for ${invitationData.email} (already exists)`);
      continue;
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日後に期限切れ

    const invitation = await prisma.workerInvitation.create({
      data: {
        email: invitationData.email,
        token,
        hourlyRateUsd: invitationData.hourlyRateUsd,
        organizationId: organization.id,
        expiresAt,
      },
    });

    console.log(`✅ Created invitation: ${invitation.email}`);
    console.log(`   Hourly Rate: $${invitation.hourlyRateUsd}`);
    console.log(`   Token: ${invitation.token}`);
    console.log(`   Expires At: ${invitation.expiresAt.toISOString()}`);
    console.log(`   Invitation URL: http://localhost:3000/worker/accept-invitation?token=${invitation.token}`);
    console.log('');
  }

  // 4. 従業員（WorkerUser）の作成
  console.log('👷 Creating worker users...');
  const testWorkers = [
    {
      email: 'worker@test.com',
      password: 'workerpassword123',
      name: 'Test Worker',
      hourlyRateUsd: 25.00,
    },
    {
      email: 'alice@test.com',
      password: 'alicepassword123',
      name: 'Alice Johnson',
      hourlyRateUsd: 30.00,
    },
    {
      email: 'bob@test.com',
      password: 'bobpassword123',
      name: 'Bob Smith',
      hourlyRateUsd: 28.50,
    },
  ];

  for (const workerData of testWorkers) {
    const existing = await prisma.workerUser.findUnique({
      where: {
        email_organizationId: {
          email: workerData.email,
          organizationId: organization.id,
        },
      },
    });

    if (existing) {
      console.log(`⏭️  Skipping ${workerData.email} (already exists)`);
      continue;
    }

    const passwordHash = await bcrypt.hash(workerData.password, PASSWORD_HASH_ROUNDS);

    const worker = await prisma.workerUser.create({
      data: {
        email: workerData.email,
        passwordHash,
        name: workerData.name,
        hourlyRateUsd: workerData.hourlyRateUsd,
        organizationId: organization.id,
        isActive: true,
        emailVerified: new Date(),
      },
    });

    console.log(`✅ Created worker: ${worker.email}`);
    console.log(`   Name: ${worker.name}`);
    console.log(`   Hourly Rate: $${worker.hourlyRateUsd}`);
    console.log(`   Password: ${workerData.password}`);
    console.log('');
  }

  console.log('✨ Seeding completed!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📝 Test Credentials');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n👤 Admin Users:');
  console.log('   Email: admin@test.com');
  console.log('   Password: adminpassword123');
  console.log('   -----');
  console.log('   Email: manager@test.com');
  console.log('   Password: managerpassword123');
  console.log('\n👷 Worker Users:');
  console.log('   Email: worker@test.com');
  console.log('   Password: workerpassword123');
  console.log('   -----');
  console.log('   Email: alice@test.com');
  console.log('   Password: alicepassword123');
  console.log('   -----');
  console.log('   Email: bob@test.com');
  console.log('   Password: bobpassword123');
  console.log('\n🔗 Login URLs:');
  console.log('   Admin Login: http://localhost:3000/admin/login');
  console.log('   Worker Login: http://localhost:3000/worker/login');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
