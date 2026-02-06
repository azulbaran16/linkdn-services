import { PrismaClient, WorkspaceType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create categories relevant to Colombia
  const categoriesData = [
    { name: 'Belleza', slug: 'belleza' },
    { name: 'Salud', slug: 'salud' },
    { name: 'Hogar y Oficios', slug: 'hogar-oficios' },
    { name: 'Tecnologia', slug: 'tecnologia' },
    { name: 'Mantenimiento', slug: 'mantenimiento' },
    { name: 'Educacion', slug: 'educacion' },
    { name: 'Fitness y Deporte', slug: 'fitness-deporte' },
    { name: 'Legal', slug: 'legal' },
    { name: 'Contabilidad', slug: 'contabilidad' },
    { name: 'Fotografia', slug: 'fotografia' },
    { name: 'Diseno', slug: 'diseno' },
    { name: 'Mascotas', slug: 'mascotas' },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created.id;
  }

  console.log(`Created ${Object.keys(categories).length} categories`);

  // Demo provider 1: Salon de Belleza
  const password1 = await bcrypt.hash('password123', 12);
  const user1 = await prisma.user.upsert({
    where: { email: 'maria@demo.co' },
    update: {},
    create: {
      email: 'maria@demo.co',
      passwordHash: password1,
      name: 'Maria Garcia',
    },
  });

  const workspace1 = await prisma.workspace.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      userId: user1.id,
      type: WorkspaceType.PERSON,
      name: 'Maria Estilista',
    },
  });

  await prisma.providerProfile.upsert({
    where: { workspaceId: workspace1.id },
    update: {},
    create: {
      workspaceId: workspace1.id,
      slug: 'maria-estilista',
      displayName: 'Maria Estilista',
      city: 'Bogota',
      description: 'Estilista profesional con 10 anos de experiencia en cortes, color y tratamientos capilares.',
      contactEmail: 'maria@demo.co',
      isPublished: true,
    },
  });

  // Link categories
  await prisma.workspaceCategory.upsert({
    where: { workspaceId_categoryId: { workspaceId: workspace1.id, categoryId: categories['belleza'] } },
    update: {},
    create: { workspaceId: workspace1.id, categoryId: categories['belleza'] },
  });

  // Services for provider 1
  await prisma.service.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      workspaceId: workspace1.id,
      name: 'Corte de cabello',
      description: 'Corte personalizado para hombre o mujer.',
      durationMinutes: 60,
      bufferMinutesBefore: 0,
      bufferMinutesAfter: 15,
      priceFrom: 35000,
      active: true,
    },
  });

  await prisma.service.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      workspaceId: workspace1.id,
      name: 'Color completo',
      description: 'Aplicacion de color con productos profesionales.',
      durationMinutes: 120,
      bufferMinutesBefore: 0,
      bufferMinutesAfter: 15,
      priceFrom: 80000,
      active: true,
    },
  });

  // Availability rules for provider 1: Mon-Fri 9:00-12:00, 14:00-18:00
  const workdays = [1, 2, 3, 4, 5]; // Mon-Fri
  for (const day of workdays) {
    // Delete existing rules for this day first
    await prisma.availabilityRule.deleteMany({
      where: { workspaceId: workspace1.id, dayOfWeek: day },
    });

    await prisma.availabilityRule.create({
      data: { workspaceId: workspace1.id, dayOfWeek: day, startTime: '09:00', endTime: '12:00' },
    });
    await prisma.availabilityRule.create({
      data: { workspaceId: workspace1.id, dayOfWeek: day, startTime: '14:00', endTime: '18:00' },
    });
  }

  // Demo provider 2: Techno Fix (Company)
  const password2 = await bcrypt.hash('password123', 12);
  const user2 = await prisma.user.upsert({
    where: { email: 'carlos@demo.co' },
    update: {},
    create: {
      email: 'carlos@demo.co',
      passwordHash: password2,
      name: 'Carlos Rodriguez',
    },
  });

  const workspace2 = await prisma.workspace.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      userId: user2.id,
      type: WorkspaceType.COMPANY,
      name: 'TechnoFix SAS',
    },
  });

  await prisma.providerProfile.upsert({
    where: { workspaceId: workspace2.id },
    update: {},
    create: {
      workspaceId: workspace2.id,
      slug: 'technofix',
      displayName: 'TechnoFix SAS',
      city: 'Medellin',
      description: 'Servicio tecnico especializado en computadores, celulares y redes. Atencion a domicilio.',
      contactEmail: 'carlos@demo.co',
      contactPhone: '3001234567',
      isPublished: true,
    },
  });

  await prisma.workspaceCategory.upsert({
    where: { workspaceId_categoryId: { workspaceId: workspace2.id, categoryId: categories['tecnologia'] } },
    update: {},
    create: { workspaceId: workspace2.id, categoryId: categories['tecnologia'] },
  });

  await prisma.workspaceCategory.upsert({
    where: { workspaceId_categoryId: { workspaceId: workspace2.id, categoryId: categories['mantenimiento'] } },
    update: {},
    create: { workspaceId: workspace2.id, categoryId: categories['mantenimiento'] },
  });

  await prisma.service.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      workspaceId: workspace2.id,
      name: 'Reparacion de computador',
      description: 'Diagnostico y reparacion de equipos de escritorio y portatiles.',
      durationMinutes: 90,
      bufferMinutesBefore: 15,
      bufferMinutesAfter: 15,
      priceFrom: 50000,
      active: true,
    },
  });

  await prisma.service.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      workspaceId: workspace2.id,
      name: 'Configuracion de red WiFi',
      description: 'Instalacion y configuracion de redes inalambricas para hogar u oficina.',
      durationMinutes: 60,
      bufferMinutesBefore: 30,
      bufferMinutesAfter: 0,
      priceFrom: 70000,
      active: true,
    },
  });

  // Availability: Mon-Sat 8:00-17:00
  const workdays2 = [1, 2, 3, 4, 5, 6]; // Mon-Sat
  for (const day of workdays2) {
    await prisma.availabilityRule.deleteMany({
      where: { workspaceId: workspace2.id, dayOfWeek: day },
    });

    await prisma.availabilityRule.create({
      data: { workspaceId: workspace2.id, dayOfWeek: day, startTime: '08:00', endTime: '17:00' },
    });
  }

  // Demo provider 3: Fitness trainer
  const password3 = await bcrypt.hash('password123', 12);
  const user3 = await prisma.user.upsert({
    where: { email: 'laura@demo.co' },
    update: {},
    create: {
      email: 'laura@demo.co',
      passwordHash: password3,
      name: 'Laura Martinez',
    },
  });

  const workspace3 = await prisma.workspace.upsert({
    where: { userId: user3.id },
    update: {},
    create: {
      userId: user3.id,
      type: WorkspaceType.PERSON,
      name: 'Laura Fitness',
    },
  });

  await prisma.providerProfile.upsert({
    where: { workspaceId: workspace3.id },
    update: {},
    create: {
      workspaceId: workspace3.id,
      slug: 'laura-fitness',
      displayName: 'Laura Fitness',
      city: 'Bogota',
      description: 'Entrenadora personal certificada. Planes personalizados de entrenamiento y nutricion.',
      contactEmail: 'laura@demo.co',
      isPublished: true,
    },
  });

  await prisma.workspaceCategory.upsert({
    where: { workspaceId_categoryId: { workspaceId: workspace3.id, categoryId: categories['fitness-deporte'] } },
    update: {},
    create: { workspaceId: workspace3.id, categoryId: categories['fitness-deporte'] },
  });

  await prisma.workspaceCategory.upsert({
    where: { workspaceId_categoryId: { workspaceId: workspace3.id, categoryId: categories['salud'] } },
    update: {},
    create: { workspaceId: workspace3.id, categoryId: categories['salud'] },
  });

  await prisma.service.upsert({
    where: { id: '00000000-0000-0000-0000-000000000005' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      workspaceId: workspace3.id,
      name: 'Sesion de entrenamiento personal',
      description: 'Sesion individual de entrenamiento adaptada a tus objetivos.',
      durationMinutes: 60,
      bufferMinutesBefore: 10,
      bufferMinutesAfter: 10,
      priceFrom: 45000,
      active: true,
    },
  });

  // Availability: Mon-Fri 6:00-10:00, 16:00-20:00
  for (const day of [1, 2, 3, 4, 5]) {
    await prisma.availabilityRule.deleteMany({
      where: { workspaceId: workspace3.id, dayOfWeek: day },
    });

    await prisma.availabilityRule.create({
      data: { workspaceId: workspace3.id, dayOfWeek: day, startTime: '06:00', endTime: '10:00' },
    });
    await prisma.availabilityRule.create({
      data: { workspaceId: workspace3.id, dayOfWeek: day, startTime: '16:00', endTime: '20:00' },
    });
  }

  // Saturday mornings
  await prisma.availabilityRule.deleteMany({
    where: { workspaceId: workspace3.id, dayOfWeek: 6 },
  });
  await prisma.availabilityRule.create({
    data: { workspaceId: workspace3.id, dayOfWeek: 6, startTime: '07:00', endTime: '12:00' },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
