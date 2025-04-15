// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { organizers } from '../src/components/data/organizer';
import { customers } from '../src/components/data/customer';
import { concertList } from '../src/components/data/concertlist';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed organizers
  for (const org of organizers) {
    await prisma.user.upsert({
      where: { email: org.email },
      update: {},
      create: {
        name: org.name,
        email: org.email,
        password: org.password, // Hash if needed
        role: 'organizer',
        referralCode: org.referralCode,
      },
    });
  }

  // Seed customers
  for (const customer of customers) {
    await prisma.user.upsert({
      where: { email: customer.email },
      update: {},
      create: {
        name: customer.name,
        email: customer.email,
        password: customer.password,
        role: 'customer',
        referralCode: customer.referralCode,
        referredBy: customer.referredBy ?? null,
      },
    });
  }

  // Use the first organizer for events
  const firstOrganizer = await prisma.user.findFirst({
    where: { role: 'organizer' },
  });

  if (!firstOrganizer) throw new Error('No organizer found for events.');

  // Seed events
  for (const concert of concertList) {
    await prisma.event.upsert({
        where: { id: concert.id },
        update: {},
        create: {
          title: concert.title,
          genre: concert.genre,
          startDate: new Date(concert.startDate),
          endDate: new Date(concert.endDate),
          location: concert.location,
          seats: concert.seats,
          tiers: concert.tiers, 
          price: concert.price, 
          image: concert.image,
          description: concert.description,
          organizerId: firstOrganizer.id,
        },
      });
      
      
  }

  console.log('✅ Seeding complete.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
