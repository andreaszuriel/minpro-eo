import { NextRequest, NextResponse } from 'next/server';
import { TicketService } from '@/services/ticket.service';
import { ApiError } from '@/lib/utils';
import { auth } from '@/auth';
// Import only jsPDF
import { jsPDF } from 'jspdf';
import path from 'path';
import fs from 'fs';

async function generateQRCode(data: string): Promise<string> {
  try {
    const QRCode = await import('qrcode');
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
    });
  } catch (err) {
    console.error('QR code generation failed', err);
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=`;
  }
}

const PRIMARY_COLOR = '#4F46E5';
const PRIMARY_DARKER_COLOR = '#4338CA';
const SECONDARY_COLOR = '#06B6D4';
const TERTIARY_COLOR = '#facc15';
const BLACK_COLOR = '#0F172A';
const WHITE_COLOR = '#FFFFFF';
const GRAY_COLOR = '#94A3B8';
const HIGHLIGHT_COLOR = '#FB7185';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticketId = params.id;
    if (!ticketId) {
      return NextResponse.json({ error: 'Missing ticket ID' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await TicketService.getTicketWithDetails(ticketId, session.user.id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const fontPath = path.join(process.cwd(), 'src/fonts/Figtree.ttf');
    let customFontLoaded = false;
    if (fs.existsSync(fontPath)) {
      try {
        const fontBytes = fs.readFileSync(fontPath);
        doc.addFileToVFS('Figtree.ttf', fontBytes.toString('latin1'));
        doc.addFont('Figtree.ttf', 'Figtree', 'normal');
        doc.addFont('Figtree.ttf', 'Figtree', 'bold');
        doc.setFont('Figtree', 'normal');
        customFontLoaded = true;
      } catch (fontError) {
        console.error('Error loading custom font, falling back to Helvetica:', fontError);
        doc.setFont('Helvetica', 'normal');
      }
    } else {
      console.warn(`Font file not found at: ${fontPath}, falling back to Helvetica.`);
      doc.setFont('Helvetica', 'normal');
    }

    const pageMargin = 40;
    const contentWidth = pageWidth - 2 * pageMargin;
    let currentY = pageMargin;

    doc.setFillColor(BLACK_COLOR);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setDrawColor(PRIMARY_DARKER_COLOR);
    doc.setLineWidth(0.3);
    for (let i = -pageWidth; i < pageHeight + pageWidth; i += 15) {
      doc.line(0, i, pageWidth, i - pageWidth / 2);
    }

    doc.setDrawColor(TERTIARY_COLOR);
    doc.setLineWidth(2);
    const drawJaggedBorder = () => {
      const segmentLength = 20;
      const jaggedness = 4;
      const borderMargin = 25;
      let x = borderMargin;
      while (x < pageWidth - borderMargin) {
        const xEnd = Math.min(x + segmentLength + (Math.random() * 10 - 5), pageWidth - borderMargin);
        const yVariation = Math.random() * jaggedness * (Math.random() > 0.5 ? 1 : -1);
        doc.line(x, borderMargin + yVariation, xEnd, borderMargin - yVariation);
        x = xEnd;
      }
      let y = borderMargin;
      while (y < pageHeight - borderMargin) {
        const yEnd = Math.min(y + segmentLength + (Math.random() * 10 - 5), pageHeight - borderMargin);
        const xVariation = Math.random() * jaggedness * (Math.random() > 0.5 ? 1 : -1);
        doc.line(pageWidth - borderMargin - xVariation, y, pageWidth - borderMargin + xVariation, yEnd);
        y = yEnd;
      }
      x = pageWidth - borderMargin;
      while (x > borderMargin) {
        const xEnd = Math.max(x - segmentLength - (Math.random() * 10 - 5), borderMargin);
        const yVariation = Math.random() * jaggedness * (Math.random() > 0.5 ? 1 : -1);
        doc.line(x, pageHeight - borderMargin - yVariation, xEnd, pageHeight - borderMargin + yVariation);
        x = xEnd;
      }
      y = pageHeight - borderMargin;
      while (y > borderMargin) {
        const yEnd = Math.max(y - segmentLength - (Math.random() * 10 - 5), borderMargin);
        const xVariation = Math.random() * jaggedness * (Math.random() > 0.5 ? 1 : -1);
        doc.line(borderMargin + xVariation, y, borderMargin - xVariation, yEnd);
        y = yEnd;
      }
    };
    drawJaggedBorder();

    doc.setFont(customFontLoaded ? 'Figtree' : 'Helvetica', 'bold');
    doc.setTextColor(PRIMARY_COLOR);
    doc.setFontSize(90);
    // TEMPORARILY COMMENTED OUT to debug t.equals error
    // doc.setGState({ opacity: 0.08 }); 
    doc.text('ADMIT ONE', pageWidth / 2, pageHeight / 2 + 30, { align: 'center', baseline: 'middle' });
    // TEMPORARILY COMMENTED OUT
    // doc.setGState({ opacity: 1.0 });

    currentY = pageMargin + 30;
    const headerHeight = 80;
    doc.setFillColor(PRIMARY_COLOR);
    doc.rect(pageMargin, currentY, contentWidth, headerHeight, 'F');

    doc.setFontSize(28);
    doc.setTextColor(WHITE_COLOR);
    if (customFontLoaded) doc.setFont('Figtree', 'bold'); else doc.setFont('Helvetica', 'bold');
    doc.text('EVENT TICKET', pageWidth / 2, currentY + headerHeight / 2 - 10, { align: 'center', baseline: 'middle' });

    doc.setFontSize(16);
    doc.setTextColor(TERTIARY_COLOR);
    if (customFontLoaded) doc.setFont('Figtree', 'normal'); else doc.setFont('Helvetica', 'normal');
    doc.text(ticket.event.title.toUpperCase(), pageWidth / 2, currentY + headerHeight / 2 + 20, { align: 'center', baseline: 'middle' });

    currentY += headerHeight + 30;

    const artistSectionHeight = 60;
    doc.setFillColor('#1E1B4B');
    doc.setDrawColor(TERTIARY_COLOR);
    doc.setLineWidth(1.5);
    doc.rect(pageMargin, currentY, contentWidth, artistSectionHeight, 'FD');

    doc.setFontSize(24);
    doc.setTextColor(TERTIARY_COLOR);
    if (customFontLoaded) doc.setFont('Figtree', 'bold'); else doc.setFont('Helvetica', 'bold');
    doc.text(ticket.event.artist.toUpperCase(), pageWidth / 2, currentY + artistSectionHeight / 2, {
      align: 'center', baseline: 'middle'
    });
    currentY += artistSectionHeight + 20;

    const eventDetailsHeight = 130;
    doc.setFillColor('#0F172A');
    doc.setDrawColor(SECONDARY_COLOR);
    doc.setLineWidth(1.5);
    doc.rect(pageMargin, currentY, contentWidth, eventDetailsHeight, 'FD');

    const sectionTitleY = currentY + 20;
    doc.setFontSize(16);
    doc.setTextColor(TERTIARY_COLOR);
    if (customFontLoaded) doc.setFont('Figtree', 'bold'); else doc.setFont('Helvetica', 'bold');
    doc.text('EVENT DETAILS', pageMargin + 15, sectionTitleY);

    let detailsContentY = sectionTitleY + 25;
    doc.setFontSize(12);
    if (customFontLoaded) doc.setFont('Figtree', 'normal'); else doc.setFont('Helvetica', 'normal');

    const eventDate = new Date(ticket.event.startDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit',
    });

    const drawDetailRow = (label: string, value: string | string[], yPos: number) => {
      doc.setTextColor(GRAY_COLOR);
      doc.text(`${label}:`, pageMargin + 15, yPos);
      doc.setTextColor(WHITE_COLOR);
      const textValue = Array.isArray(value) ? value.join(', ') : value;
      doc.text(textValue, pageMargin + 95, yPos);
    };

    const lineSpacing = 20;
    drawDetailRow('ARTIST', ticket.event.artist, detailsContentY);
    detailsContentY += lineSpacing;
    drawDetailRow('DATE', formattedDate, detailsContentY);
    detailsContentY += lineSpacing;
    drawDetailRow('TIME', formattedTime, detailsContentY);
    detailsContentY += lineSpacing;
    drawDetailRow('VENUE', ticket.event.location, detailsContentY);

    currentY += eventDetailsHeight + 20;

    const ticketInfoHeight = 100;
    doc.setFillColor('#312E81');
    doc.setDrawColor(HIGHLIGHT_COLOR);
    doc.setLineWidth(1.5);
    doc.setLineDashPattern([4, 2], 0);
    doc.rect(pageMargin, currentY, contentWidth, ticketInfoHeight, 'FD');
    doc.setLineDashPattern([], 0);

    const ticketInfoTitleY = currentY + 20;
    doc.setFontSize(16);
    doc.setTextColor(TERTIARY_COLOR);
    if (customFontLoaded) doc.setFont('Figtree', 'bold'); else doc.setFont('Helvetica', 'bold');
    doc.text('YOUR TICKET', pageMargin + 15, ticketInfoTitleY);

    let ticketDetailsContentY = ticketInfoTitleY + 25;
    if (customFontLoaded) doc.setFont('Figtree', 'normal'); else doc.setFont('Helvetica', 'normal');
    doc.setFontSize(12);

    drawDetailRow('HOLDER', ticket.user.name || 'N/A', ticketDetailsContentY);
    ticketDetailsContentY += lineSpacing;
    drawDetailRow('TYPE', ticket.tierType, ticketDetailsContentY);
    ticketDetailsContentY += lineSpacing;

    doc.setTextColor(GRAY_COLOR);
    doc.text('SERIAL:', pageMargin + 15, ticketDetailsContentY);

    doc.setFillColor(HIGHLIGHT_COLOR);
    const serialCodeText = ticket.serialCode || "N/A";
    const detailFontSizeForSerial = 12;

    const serialFontName = customFontLoaded ? 'Figtree' : 'Helvetica';
    doc.setFont(serialFontName, 'bold');
    doc.setFontSize(detailFontSizeForSerial);
    const serialCodeWidth = doc.getTextWidth(serialCodeText);

    doc.rect(pageMargin + 95 - 5, ticketDetailsContentY - detailFontSizeForSerial + 2, serialCodeWidth + 10, detailFontSizeForSerial + 2, 'F');

    doc.setTextColor(BLACK_COLOR);
    doc.text(serialCodeText, pageMargin + 95, ticketDetailsContentY);

    if (customFontLoaded) doc.setFont('Figtree', 'normal'); else doc.setFont('Helvetica', 'normal');
    doc.setFontSize(12);

    currentY += ticketInfoHeight + 20;

    const qrSectionHeight = 190;
    doc.setDrawColor(TERTIARY_COLOR);
    doc.setLineDashPattern([3, 3], 0);
    doc.line(pageMargin, currentY - 5, pageMargin + contentWidth, currentY - 5);
    doc.setLineDashPattern([], 0);

    doc.setFillColor('#1E1B4B');
    doc.rect(pageMargin, currentY, contentWidth, qrSectionHeight, 'F');

    const qrTitleY = currentY + 20;
    doc.setFontSize(16);
    doc.setTextColor(TERTIARY_COLOR);
    if (customFontLoaded) doc.setFont('Figtree', 'bold'); else doc.setFont('Helvetica', 'bold');
    doc.text('SCAN FOR ENTRY', pageWidth / 2, qrTitleY, { align: 'center' });

    const qrCodeYPos = qrTitleY + 25;
    const qrSize = 110;

    try {
      const qrCodeDataUrl = await generateQRCode(ticket.serialCode);
      if (qrCodeDataUrl.startsWith('data:image/')) {
        const qrX = (pageWidth - qrSize) / 2;
        doc.setFillColor(WHITE_COLOR);
        doc.rect(qrX - 5, qrCodeYPos - 5, qrSize + 10, qrSize + 10, 'F');
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrCodeYPos, qrSize, qrSize);

        const textBelowQR_Y = qrCodeYPos + qrSize + 15;
        doc.setFontSize(10);
        doc.setTextColor(GRAY_COLOR);
        if (customFontLoaded) doc.setFont('Figtree', 'normal'); else doc.setFont('Helvetica', 'normal');
        doc.text('BRING ID & THIS DIGITAL TICKET', pageWidth / 2, textBelowQR_Y, { align: 'center' });
      } else {
        doc.setTextColor(HIGHLIGHT_COLOR);
        doc.text('Error: QR code invalid.', pageWidth / 2, qrCodeYPos + qrSize / 2, { align: 'center', baseline: 'middle' });
      }
    } catch (qrError) {
      console.error("Error generating or embedding QR code:", qrError);
      doc.setTextColor(HIGHLIGHT_COLOR);
      doc.text('QR Code unavailable.', pageWidth / 2, qrCodeYPos + qrSize / 2, { align: 'center', baseline: 'middle' });
    }
    currentY += qrSectionHeight + 20;

    doc.setFontSize(10);
    doc.setTextColor(TERTIARY_COLOR);
    if (customFontLoaded) doc.setFont('Figtree', 'bold'); else doc.setFont('Helvetica', 'bold');
    doc.text('FINE PRINT:', pageMargin, currentY);
    currentY += 15;

    doc.setTextColor(GRAY_COLOR);
    if (customFontLoaded) doc.setFont('Figtree', 'normal'); else doc.setFont('Helvetica', 'normal');
    const terms = [
      '1. Ticket valid for one entry. Scanned once. No refunds. No re-entry.',
      '2. Arrive early. Latecomers may not be admitted. Doors open 60 mins prior.',
      '3. Valid ID may be required. Ticket is non-transferable.',
      '4. Disorderly conduct will result in ejection without refund. Be cool.',
      '5. Event organizer is not liable for lost/stolen items. Rock responsibly.'
    ];
    const smallLineSpacing = 12;
    terms.forEach(term => {
      const splitTerm = doc.splitTextToSize(term, contentWidth);
      doc.text(splitTerm, pageMargin, currentY);
      currentY += (splitTerm.length * smallLineSpacing) + (splitTerm.length > 1 ? 2 : 0);
    });

    const footerHeight = 35;
    const footerStartY = Math.max(currentY + 15, pageHeight - footerHeight - pageMargin / 2);

    doc.setFillColor(PRIMARY_COLOR);
    doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F');

    doc.setFontSize(9);
    doc.setTextColor(WHITE_COLOR);
    if (customFontLoaded) doc.setFont('Figtree', 'normal'); else doc.setFont('Helvetica', 'normal');

    const footerTextY = pageHeight - footerHeight / 2;
    doc.text(`ID: ${ticket.id}`, pageMargin, footerTextY, { baseline: 'middle' });

    doc.setFontSize(10);
    doc.setTextColor(TERTIARY_COLOR);
    const organizerFontName = customFontLoaded ? 'Figtree' : 'Helvetica';
    doc.setFont(organizerFontName, 'bold');

    const organizerName = ticket.event.organizer?.name || 'EVENT PRODUCTIONS';
    const organizerWidth = doc.getTextWidth(organizerName);

    doc.text(organizerName, pageWidth - pageMargin - organizerWidth, footerTextY, { baseline: 'middle' });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const readableStream = new ReadableStream({
      start(controller) {
        controller.enqueue(pdfBuffer);
        controller.close();
      }
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${ticket.serialCode}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error generating ticket PDF:', error);
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Failed to generate ticket' }, { status: 500 });
  }
}