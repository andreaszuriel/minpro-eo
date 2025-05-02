import { PrismaClient, UserRole } from '@prisma/client';
import { concertList } from '../src/components/data/concertlist2'; 
import { genreList } from '../src/components/data/genrelist'; 
import { countryList } from '../src/components/data/countrylist'; 
import { userList } from '../src/components/data/userlist'; 
import { transactionList, ticketList } from '../src/components/data/transactionlist'; 
import { saltAndHashPassword } from '../src/utils/password'; 
import { reviewList } from '../src/components/data/reviewlist'; 
import { updateEventAverageRating } from '../src/lib/utils'; 
import { addMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up existing seeded data...');
  // Delete in reverse order (adjust if needed)
  await prisma.review.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.coupon.deleteMany({}); // Assuming no coupons seeded here, but good practice
  await prisma.pointTransaction.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.authenticator.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.country.deleteMany({});
  console.log('✅ Cleanup finished.');;
  
  console.log('🌱 Seeding users...');
  for (const user of userList) {
    const hashedPassword = await saltAndHashPassword(user.password);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name, email: user.email, password: hashedPassword,
        role: user.role, points: user.points, 
        referralCode: user.referralCode, image: user.image,
        emailVerified: user.emailVerified, updatedAt: new Date(), isAdmin: user.isAdmin,
      },
      create: {
        id: user.id, name: user.name, email: user.email, password: hashedPassword,
        role: user.role, points: user.points, referralCode: user.referralCode,
        image: user.image, emailVerified: user.emailVerified, isAdmin: user.isAdmin,
      },
    });
  }
  console.log(`✅ Users seeded: ${userList.length}`);

 
  console.log('🌱 Seeding initial Point Transactions...');
  let pointTxnCount = 0;
  const now = new Date();
  for (const user of userList) {
    if (user.points > 0) {
      try {
        const expiresAt = addMonths(now, 3);

        console.log(` -> Creating PointTransaction for User: ${user.id}, Points: ${user.points}, Expires: ${expiresAt.toISOString()}`);

        await prisma.pointTransaction.create({
          data: {
            userId: user.id,
            points: user.points,
            description: 'Initial seeded points',
            expiresAt: expiresAt,
            isExpired: false, // Explicitly false
            // createdAt defaults to now()
          },
        });
        pointTxnCount++;
      } catch (error: any) {
         console.error(`❌ Failed to create PointTransaction for User ID: ${user.id}`);
         // Handle potential errors like user not found (though unlikely if user seeding succeeded)
         if (error.code === 'P2003') {
             console.error(`   Foreign Key constraint violated. Does User ID ${user.id} exist?`);
         } else {
             console.error(error);
         }
      }
    }
  }
  console.log(`✅ Initial Point Transactions seeded: ${pointTxnCount}`);
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

   console.log('🌱 Seeding reviews...');
   let reviewCount = 0;
   const reviewedEventIds = new Set<number>();
 
   for (const review of reviewList) {
     // Ensure referenced event and user exist
     const userExists = await prisma.user.findUnique({ where: { id: review.userId }, select: { id: true } });
     const eventExists = await prisma.event.findUnique({ where: { id: review.eventId }, select: { id: true } });
 
     if (!userExists) {
       console.error(`❌ Skipping review ID ${review.id}: User with ID ${review.userId} not found.`);
       continue;
     }
     if (!eventExists) {
       console.error(`❌ Skipping review ID ${review.id}: Event with ID ${review.eventId} not found.`);
       continue;
     }
 
     try {
       console.log(` -> Upserting review ID: ${review.id} by User: ${review.userId} for Event: ${review.eventId}`);
       const reviewData = {
         userId: review.userId,
         eventId: review.eventId,
         rating: review.rating,
         comment: review.comment,
         createdAt: new Date(review.createdAt),
         updatedAt: new Date(review.updatedAt),
       };
 
       await prisma.review.upsert({
         where: { id: review.id },
         update: {
           ...reviewData,
           updatedAt: new Date(),
         },
         create: {
           id: review.id,
           ...reviewData,
         },
       });
 

       reviewedEventIds.add(review.eventId); 
       reviewCount++;
     } catch (error: any) {
       console.error(`❌ Failed to upsert review ID: ${review.id}`);
       if (error.code === 'P2003') {
         console.error(`   Foreign Key constraint violated. Field: ${error.meta?.field_name}. Check userId ${review.userId}, eventId ${review.eventId}.`);
       } else if (error.code === 'P2002') {
         console.error(`   Unique constraint violated. Field: ${error.meta?.target}. Is review ID ${review.id} already used?`);
       } else {
         console.error(error);
       }
     }
   }
 
   console.log(`✅ Reviews seeded: ${reviewCount}/${reviewList.length}`);
 
   console.log('🔄 Calculating and updating average ratings for seeded reviews...');
   let updatedRatingCount = 0;
   for (const eventId of reviewedEventIds) {
       try {
           console.log(`   -> Updating average rating for Event ID: ${eventId}`);
           await updateEventAverageRating(eventId); // Call the utility function
           updatedRatingCount++;
       } catch (error) {
           // Log error from the update function itself (it already has console.error)
           console.error(`   ❌ Failed to update average rating for Event ID: ${eventId} during post-seed update.`);
       }
   }
   console.log(`✅ Average ratings updated for ${updatedRatingCount}/${reviewedEventIds.size} events affected by review seeding.`);

     // --- RESET SEQUENCES (Add this section AFTER seeding data) ---
  console.log('🔄 Resetting ID sequences for auto-increment tables...');
  try {
    // Use $executeRawUnsafe. The SQL string now directly includes the double quotes
    // needed by PostgreSQL without extra JavaScript escaping backslashes.

    // Reset sequence for Genre
    // Correct syntax: Double quotes directly in the string
    await prisma.$executeRawUnsafe(`SELECT setval('"Genre_id_seq"', COALESCE((SELECT MAX(id) FROM "Genre"), 0) + 1, false);`);
    console.log("   -> Genre sequence reset.");

    // Reset sequence for Country
    await prisma.$executeRawUnsafe(`SELECT setval('"Country_id_seq"', COALESCE((SELECT MAX(id) FROM "Country"), 0) + 1, false);`);
     console.log("   -> Country sequence reset.");

    // Reset sequence for Event
    await prisma.$executeRawUnsafe(`SELECT setval('"Event_id_seq"', COALESCE((SELECT MAX(id) FROM "Event"), 0) + 1, false);`);
     console.log("   -> Event sequence reset.");

    // Reset sequence for Transaction
    await prisma.$executeRawUnsafe(`SELECT setval('"Transaction_id_seq"', COALESCE((SELECT MAX(id) FROM "Transaction"), 0) + 1, false);`);
     console.log("   -> Transaction sequence reset.");

    // Reset sequence for Review
    await prisma.$executeRawUnsafe(`SELECT setval('"Review_id_seq"', COALESCE((SELECT MAX(id) FROM "Review"), 0) + 1, false);`);
    console.log("   -> Review sequence reset.");

    // Reset sequence for Coupon
     await prisma.$executeRawUnsafe(`SELECT setval('"Coupon_id_seq"', COALESCE((SELECT MAX(id) FROM "Coupon"), 0) + 1, false);`);
     console.log("   -> Coupon sequence reset.");

    // Add any other tables with auto-incrementing integer IDs here...

    console.log('✅ Sequences reset successfully.');
  } catch (error) {
      console.error('❌ Failed to reset sequences:', error);
      // process.exit(1); // Optionally exit if sequence reset fails
  }
  // --- End Reset Sequences Section -
  
  
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