import { PrismaClient } from '@prisma/client';
import { concertList } from '../src/components/data/concertlist2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding events...');

  // Use the first organizer for events
  const firstOrganizer = await prisma.user.findFirst({
    where: { role: 'organizer' },
  });

  if (!firstOrganizer) {
    throw new Error('No organizer found. Cannot seed events.');
  }

  // Seed events
for (const concert of concertList) {
  await prisma.event.upsert({
    where: { id: concert.id },
    update: {},
    create: {
      title: concert.title,
      artist: concert.artist,
      genre: concert.genre,
      startDate: new Date(concert.startDate),
      endDate: new Date(concert.endDate),
      location: concert.location,
      seats: concert.seats,
      tiers: concert.tiers,
      price: concert.price,
      image: concert.image,
      description: concert.description,
      organizerId: concert.organizerId, 
    },
  });
}


  console.log('✅ Events seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());