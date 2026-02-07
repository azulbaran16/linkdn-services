import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { withAuth, getWorkspace, handleError, ApiError } from '@/lib/middleware';

// POST /api/campaigns/:id/send - Send a campaign now
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await withAuth(req);
    const workspace = await getWorkspace(user.userId);
    const { id } = await params;

    const campaign = await prisma.campaign.findFirst({
      where: { id, workspaceId: workspace.id },
      include: {
        recipients: {
          include: {
            clientProfile: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new ApiError(404, 'Campana no encontrada');
    }

    if (campaign.status === 'SENT') {
      throw new ApiError(400, 'Esta campana ya fue enviada');
    }

    const providerName = workspace.profile?.displayName || workspace.name;
    let sentCount = 0;

    for (const recipient of campaign.recipients) {
      try {
        const personalizedMessage = campaign.message
          .replace(/\{clientName\}/g, recipient.clientProfile.name)
          .replace(/\{providerName\}/g, providerName);

        await sendEmail(
          recipient.clientProfile.email,
          campaign.subject,
          `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #1A1A1A;">${campaign.subject}</h2>
            <div style="color: #4A4A4A; line-height: 1.6;">${personalizedMessage}</div>
            <hr style="border: none; border-top: 1px solid #E8E8E8; margin: 24px 0;" />
            <p style="color: #8E8E8E; font-size: 12px;">
              Enviado por ${providerName} a traves de LinkDN Services
            </p>
          </div>
          `
        );

        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { sentAt: new Date(), status: 'SENT' },
        });

        // Log notification
        await prisma.notificationLog.create({
          data: {
            workspaceId: workspace.id,
            clientProfileId: recipient.clientProfileId,
            type: 'CAMPAIGN',
            subject: campaign.subject,
            message: personalizedMessage,
          },
        });

        sentCount++;
      } catch (err) {
        await prisma.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED' },
        });
      }
    }

    await prisma.campaign.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      sentCount,
      totalRecipients: campaign.recipients.length,
    });
  } catch (error) {
    return handleError(error);
  }
}
