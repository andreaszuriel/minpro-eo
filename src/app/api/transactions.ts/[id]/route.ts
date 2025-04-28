import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid transaction ID" }), { status: 400 });
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        event: true,
        user: true,
      },
    });

    if (!transaction) {
      return new Response(JSON.stringify({ error: "Transaction not found" }), { status: 404 });
    }

    return new Response(JSON.stringify({ transaction }), { status: 200 });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid transaction ID" }), { status: 400 });
  }

  try {
    const data = await req.json();

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        status: data.status, // expecting a TransactionStatus enum ("PENDING", "PAID", etc.)
        paymentProof: data.paymentProof || undefined,
        ticketUrl: data.ticketUrl || undefined,
        voucherUrl: data.voucherUrl || undefined,
      },
    });

    return new Response(JSON.stringify({ transaction }), { status: 200 });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
}