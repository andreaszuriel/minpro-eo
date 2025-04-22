// src/utils/generateTicket.ts
import puppeteer from 'puppeteer';
import cloudinary, { UploadApiResponse } from './cloudinary';

export async function generateTicket(details: {
  userName:   string;
  eventTitle: string;
  tierType:   string;
  quantity:   number;
  eventDate:  Date;
}): Promise<string> {
  const browser = await puppeteer.launch();
  const page    = await browser.newPage();
  await page.setContent(`
    <h1>Event Ticket</h1>
    <p>${details.userName}</p>
    <p>${details.eventTitle}</p>
    <p>Tier: ${details.tierType}</p>
    <p>Qty: ${details.quantity}</p>
    <p>Date: ${details.eventDate.toDateString()}</p>
  `);

  const buffer = await page.screenshot({ type: 'png' });
  await browser.close();

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'tickets' },
      (error, r) => error ? reject(error) : resolve(r!)
    );
    stream.end(buffer);
  });

  return result.secure_url;
}
