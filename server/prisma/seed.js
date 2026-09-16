const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Hash passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@webshield.local' },
    update: {},
    create: {
      email: 'admin@webshield.local',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin'
    }
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@webshield.local' },
    update: {},
    create: {
      email: 'user@webshield.local',
      password: userPassword,
      name: 'Demo User',
      role: 'user'
    }
  });

  console.log('Created users:', admin, user);

  // Create security rules
  const rules = [
    {
      name: 'SQL Injection Detection',
      category: 'signature',
      enabled: true,
      severity: 'HIGH',
      score: 40,
      description: 'Detects common SQL injection patterns in request parameters'
    },
    {
      name: 'XSS Detection',
      category: 'signature',
      enabled: true,
      severity: 'HIGH',
      score: 35,
      description: 'Detects cross-site scripting patterns in request parameters'
    },
    {
      name: 'Path Traversal Detection',
      category: 'signature',
      enabled: true,
      severity: 'HIGH',
      score: 30,
      description: 'Detects path traversal attempts like ../ or ..\\'
    },
    {
      name: 'Login Abuse Protection',
      category: 'behavior',
      enabled: true,
      severity: 'MEDIUM',
      score: 10,
      description: 'Detects repeated authentication failures from same source'
    },
    {
      name: 'Request Rate Protection',
      category: 'behavior',
      enabled: true,
      severity: 'MEDIUM',
      score: 20,
      description: 'Detects excessive request frequency from a single source'
    },
    {
      name: 'Suspicious User-Agent Detection',
      category: 'behavior',
      enabled: true,
      severity: 'LOW',
      score: 10,
      description: 'Detects missing or suspicious user-agent headers'
    },
    {
      name: 'Authentication Abuse Detection',
      category: 'behavior',
      enabled: true,
      severity: 'MEDIUM',
      score: 10,
      description: 'Detects repeated authentication failures'
    },
    {
      name: 'Payload Size Protection',
      category: 'behavior',
      enabled: true,
      severity: 'MEDIUM',
      score: 15,
      description: 'Detects requests exceeding safe payload size limits'
    }
  ];

  for (const rule of rules) {
    await prisma.securityRule.upsert({
      where: { name: rule.name },
      update: {},
      create: rule
    });
  }

  console.log('Created security rules');

  // Create system settings
  const settings = [
    { key: 'idps_mode', value: 'IDS' },
    { key: 'rate_limit_threshold', value: '50' },
    { key: 'rate_limit_window', value: '60' },
    { key: 'login_failure_threshold', value: '5' },
    { key: 'login_failure_window', value: '60' },
    { key: 'max_payload_size', value: '1048576' },
    { key: 'temp_block_duration', value: '300' }
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting
    });
  }

  console.log('Created system settings');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
