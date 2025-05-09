import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/utils';

export class TicketService {
  /**
   * Get a ticket with all associated details for PDF generation
   */
  static async getTicketWithDetails(ticketId: string, userId: string) {
    try {
      // Find the ticket and make sure it belongs to the requesting user
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          userId: userId
        },
        include: {
          event: {
            include: {
              organizer: {
                select: {
                  name: true
                }
              }
            }
          },
          user: {
            select: {
              name: true
            }
          },
          transaction: true
        }
      });

      if (!ticket) {
        throw new ApiError('Ticket not found or unauthorized', 404);
      }

      return ticket;
    } catch (error) {
      console.error('Error in getTicketWithDetails:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to retrieve ticket information', 500);
    }
  }

  /**
   * Verify if a ticket is valid and belongs to the user
   */
  static async verifyTicketOwnership(ticketId: string, userId: string) {
    try {
      const ticket = await prisma.ticket.findFirst({
        where: {
          id: ticketId,
          userId: userId
        }
      });

      return !!ticket;
    } catch (error) {
      console.error('Error verifying ticket ownership:', error);
      return false;
    }
  }
}