import { PrismaClient } from '@prisma/client';
import { concertList } from '../src/components/data/concertlist2'; // Ensure this path is correct
import { genreList } from '../src/components/data/genrelist'; // Ensure this path is correct
import { countryList } from '../src/components/data/countrylist'; // Ensure this path is correct
import { userList } from '../src/components/data/userlist'; // Ensure this path is correct
import { transactionList, ticketList } from '../src/components/data/transactionlist'; // Ensure this path is correct
import { saltAndHashPassword } from '../src/utils/password'; // Ensure this path is correct

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up existing data (optional but recommended for dev)...');
  // Optional: Add cleanup logic if needed, e.g., deleting in reverse order of creation
  // await prisma.ticket.deleteMany({});
  // await prisma.transaction.deleteMany({});
  // await prisma.event.deleteMany({});
  // await prisma.country.deleteMany({});
  // await prisma.genre.deleteMany({});
  // await prisma.user.deleteMany({}); // Be careful with deleting users if other things depend on them outside seeding

  console.log('🌱 Seeding users...');
  for (const user of userList) {
    const hashedPassword = await saltAndHashPassword(user.password); // Make sure password isn't null/undefined
    await prisma.user.upsert({
      where: { id: user.id },
      update: { // Update existing users too
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        points: user.points,
        referralCode: user.referralCode,
        image: user.image,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null, // Handle optional verified date
        updatedAt: new Date(), // Explicitly set update time
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        points: user.points,
        referralCode: user.referralCode,
        image: user.image,
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      },
    });
  }
  console.log(`✅ Users seeded: ${userList.length}`);

  console.log('🌱 Seeding genres...');
  for (const g of genreList) {
    await prisma.genre.upsert({
      where: { id: g.id },
      update: { name: g.name },
      create: { id: g.id, name: g.name },
    });
  }
   console.log(`✅ Genres seeded: ${genreList.length}`);

  console.log('🌱 Seeding countries...');
  for (const c of countryList) {
    await prisma.country.upsert({
      where: { id: c.id },
      update: { name: c.name, code: c.code },
      create: { id: c.id, name: c.name, code: c.code },
    });
  }
   console.log(`✅ Countries seeded: ${countryList.length}`);

  console.log('🌱 Seeding events...');
  let eventCount = 0;
  for (const e of concertList) {
    try {
      console.log(` -> Upserting event ID: ${e.id}, Title: ${e.title}`);
      const eventData = {
          title:        e.title,
          artist:       e.artist,
          genreId:      e.genreId,
          countryId:    e.countryId,
          startDate:    new Date(e.startDate),
          endDate:      new Date(e.endDate),
          location:     e.location,
          seats:        e.seats,
          tiers:        e.tiers, // Prisma handles JSON conversion
          price:        e.price, // Prisma handles JSON conversion
          image:        e.image,
          description:  e.description,
          organizerId:  e.organizerId, // Make sure organizerId exists in userList
      };
      await prisma.event.upsert({
        where: { id: e.id },
        // Provide data for updates as well
        update: {
           ...eventData,
           updatedAt: new Date(),
        },
        create: {
          id: e.id,
          ...eventData,
        },
      });
      eventCount++;
    } catch (error: any) {
       console.error(`❌ Failed to upsert event ID: ${e.id}, Title: ${e.title}`);
       // Log specific FK errors if possible
       if (error.code === 'P2003') {
         console.error(`   Foreign Key constraint violated. Field: ${error.meta?.field_name}. Does genreId ${e.genreId}, countryId ${e.countryId}, or organizerId ${e.organizerId} exist?`);
       } else {
         console.error(error);
       }
    }
  }
  console.log(`✅ Events seeded: ${eventCount}/${concertList.length}`);

  // *** Add a check here ***
  const eventsInDb = await prisma.event.findMany({ select: { id: true } });
  const eventIdsInDb = new Set(eventsInDb.map(ev => ev.id));
  console.log(`ℹ️ Event IDs found in DB before transactions: [${Array.from(eventIdsInDb).join(', ')}]`);


  console.log('🌱 Seeding transactions...');
  let transactionCount = 0;
  for (const transaction of transactionList) {
    // *** Add check before attempting insert ***
    if (!eventIdsInDb.has(transaction.eventId)) {
        console.error(`❌ Skipping transaction ID ${transaction.id}: Event with ID ${transaction.eventId} not found in the database.`);
        continue; // Skip this transaction
    }
     // Also check if userId exists (less likely to fail if user seeding was first, but good practice)
     const userExists = await prisma.user.findUnique({ where: { id: transaction.userId }, select: { id: true } });
     if (!userExists) {
        console.error(`❌ Skipping transaction ID ${transaction.id}: User with ID ${transaction.userId} not found in the database.`);
        continue; // Skip this transaction
     }

    try {
      console.log(` -> Upserting transaction ID: ${transaction.id} for Event ID: ${transaction.eventId}`);
      const transactionData = {
          userId:          transaction.userId,
          eventId:         transaction.eventId,
          ticketQuantity:  transaction.ticketQuantity,
          basePrice:       transaction.basePrice,
          finalPrice:      transaction.finalPrice,
          couponDiscount:  transaction.couponDiscount ?? 0, // Ensure default if undefined
          paymentDeadline: new Date(transaction.paymentDeadline),
          pointsUsed:      transaction.pointsUsed ?? 0, // Ensure default if undefined
          tierType:        transaction.tierType,
          status:          transaction.status,
          paymentProof:    transaction.paymentProof,
          ticketUrl:       transaction.ticketUrl,
          voucherUrl:      transaction.voucherUrl,
          // createdAt handled by @default(now())
      };
      await prisma.transaction.upsert({
        where: { id: transaction.id },
        update: {
          ...transactionData,
          updatedAt: new Date(),
        },
        create: {
          id: transaction.id,
          ...transactionData,
        },
      });
      transactionCount++;
    } catch (error: any) {
      console.error(`❌ Failed to upsert transaction ID: ${transaction.id}`);
       if (error.code === 'P2003') {
         console.error(`   Foreign Key constraint violated. Field: ${error.meta?.field_name}. Does eventId ${transaction.eventId} or userId ${transaction.userId} exist?`);
       } else {
         console.error(error);
       }
    }
  }
  console.log(`✅ Transactions seeded: ${transactionCount}/${transactionList.length}`);

  console.log('🌱 Seeding tickets...');
  let ticketCount = 0;
  // *** Add check for transactions similar to events ***
  const transactionsInDb = await prisma.transaction.findMany({ select: { id: true } });
  const transactionIdsInDb = new Set(transactionsInDb.map(tx => tx.id));
   console.log(`ℹ️ Transaction IDs found in DB before tickets: [${Array.from(transactionIdsInDb).join(', ')}]`);

  for (const ticket of ticketList) {
     // Check dependencies
     if (!eventIdsInDb.has(ticket.eventId)) {
        console.error(`❌ Skipping ticket ID ${ticket.id}: Event with ID ${ticket.eventId} not found.`);
        continue;
     }
      if (!transactionIdsInDb.has(ticket.transactionId)) {
        console.error(`❌ Skipping ticket ID ${ticket.id}: Transaction with ID ${ticket.transactionId} not found.`);
        continue;
     }
     const userExists = await prisma.user.findUnique({ where: { id: ticket.userId }, select: { id: true } });
     if (!userExists) {
        console.error(`❌ Skipping ticket ID ${ticket.id}: User with ID ${ticket.userId} not found.`);
        continue;
     }

    try {
       console.log(` -> Upserting ticket ID: ${ticket.id} for Transaction ID: ${ticket.transactionId}`);
       const ticketData = {
          serialCode:    ticket.serialCode,
          userId:        ticket.userId,
          eventId:       ticket.eventId,
          transactionId: ticket.transactionId,
          tierType:      ticket.tierType,
          isUsed:        ticket.isUsed ?? false, // Default if undefined
       };
      await prisma.ticket.upsert({
        where: { id: ticket.id }, // Assuming ticket.id is unique string like cuid()
        // where: { serialCode: ticket.serialCode }, // Alternative: use serialCode if it's guaranteed unique and stable
        update: {
           ...ticketData,
           updatedAt: new Date(),
        },
        create: {
          id: ticket.id, // Make sure generated ticket IDs are unique cuid() like strings
          ...ticketData,
        },
      });
      ticketCount++;
    } catch (error: any) {
       console.error(`❌ Failed to upsert ticket ID: ${ticket.id} (Serial: ${ticket.serialCode})`);
        if (error.code === 'P2003') {
         console.error(`   Foreign Key constraint violated. Field: ${error.meta?.field_name}. Check userId ${ticket.userId}, eventId ${ticket.eventId}, transactionId ${ticket.transactionId}.`);
       } else if (error.code === 'P2002') { // Unique constraint violation
          console.error(`   Unique constraint violated. Field: ${error.meta?.target}. Is ticket ID ${ticket.id} or serialCode ${ticket.serialCode} already used?`);
       }
       else {
         console.error(error);
       }
    }
  }
   console.log(`✅ Tickets seeded: ${ticketCount}/${ticketList.length}`);

  console.log('🎉 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed overall:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });