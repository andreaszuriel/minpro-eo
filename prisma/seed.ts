import { PrismaClient } from '@prisma/client';
import { concertList } from '../src/components/data/concertlist2';
import { genreList } from '../src/components/data/genrelist';
import { countryList } from '../src/components/data/countrylist';
import { userList } from '../src/components/data/userlist';
import { transactionList, ticketList } from '../src/components/data/transactionlist';
import { saltAndHashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...');
  for (const user of userList) {
    const hashedPassword = await saltAndHashPassword(user.password);
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        points: user.points,
        referralCode: user.referralCode,
        image: user.image
      },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        points: user.points,
        referralCode: user.referralCode,
        image: user.image
      },
    });
  }
  
  
  console.log('🌱 Seeding genres...');
  for (const g of genreList) {
    await prisma.genre.upsert({
      where: { id: g.id },
      update: { name: g.name },
      create: { id: g.id, name: g.name },
    });
  }

  console.log('🌱 Seeding countries...');
  for (const c of countryList) {
    await prisma.country.upsert({
      where: { id: c.id },
      update: { name: c.name, code: c.code },
      create: { id: c.id, name: c.name, code: c.code },
    });
  }

  console.log('🌱 Seeding events...');
  for (const e of concertList) {
    await prisma.event.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id:           e.id,
        title:        e.title,
        artist:       e.artist,
        genreId:      e.genreId,
        countryId:    e.countryId,
        startDate:    new Date(e.startDate),
        endDate:      new Date(e.endDate),
        location:     e.location,
        seats:        e.seats,
        tiers:        e.tiers,
        price:        e.price,
        image:        e.image,
        description:  e.description,
        organizerId:  e.organizerId || userList[0].id, // Default to first organizer if not specified
      },
    });
  }

  console.log('🌱 Seeding transactions...');
  for (const transaction of transactionList) {
    await prisma.transaction.upsert({
      where: { id: transaction.id },
      update: {},
      create: {
        id:              transaction.id,
        userId:          transaction.userId,
        eventId:         transaction.eventId,
        ticketQuantity:  transaction.ticketQuantity,
        basePrice:       transaction.basePrice,
        finalPrice:      transaction.finalPrice,
        couponDiscount:  transaction.couponDiscount,
        paymentDeadline: new Date(transaction.paymentDeadline),
        pointsUsed:      transaction.pointsUsed,
        tierType:        transaction.tierType,
        status:          transaction.status,
        paymentProof:    transaction.paymentProof,
        ticketUrl:       transaction.ticketUrl,
        voucherUrl:      transaction.voucherUrl,
      },
    });
  }

  console.log('🌱 Seeding tickets...');
  for (const ticket of ticketList) {
    await prisma.ticket.upsert({
      where: { id: ticket.id },
      update: {},
      create: {
        id:            ticket.id,
        serialCode:    ticket.serialCode,
        userId:        ticket.userId,
        eventId:       ticket.eventId,
        transactionId: ticket.transactionId,
        tierType:      ticket.tierType,
        isUsed:        ticket.isUsed,
      },
    });
  }

  console.log('✅ Seeding completed.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());