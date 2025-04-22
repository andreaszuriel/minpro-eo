// src/utils/generateVoucher.ts
import puppeteer from 'puppeteer';
import cloudinary, { UploadApiResponse } from './cloudinary';

export async function generateVoucher(details: {
  userName:   string;
  eventTitle: string;
  tierType:   string;
  quantity:   number;
  total:      number;
  date:       Date;
}): Promise<string> {
  const browser = await puppeteer.launch();
  const page    = await browser.newPage();
  await page.setContent(`
    <h1>Payment Voucher</h1>
    <p>${details.userName}</p>
    <p>${details.eventTitle} (${details.tierType}) x${details.quantity}</p>
    <p>Total: Rp ${details.total}</p>
    <p>Date: ${details.date.toLocaleString()}</p>
  `);
  const buffer = await page.screenshot({ type: 'png' });
  await browser.close();

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'vouchers' },
      (error, r) => error ? reject(error) : resolve(r!)
    );
    stream.end(buffer);
  });

  return result.secure_url;
}
