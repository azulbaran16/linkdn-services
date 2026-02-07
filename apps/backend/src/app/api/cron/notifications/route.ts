import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

// GET /api/cron/notifications - Process scheduled notifications
// This should be called by a cron job every hour
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret (simple protection)
    const secret = req.headers.get('x-cron-secret');
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    let processedRules = 0;
    let processedCampaigns = 0;
    let emailsSent = 0;

    // === 1. Process POST_SERVICE rules ===
    const postServiceRules = await prisma.notificationRule.findMany({
      where: { active: true, type: 'POST_SERVICE' },
      include: {
        workspace: { include: { profile: true } },
        service: true,
      },
    });

    for (const rule of postServiceRules) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - rule.delayValue);

      // Find bookings that happened exactly delayValue days ago (within 1 hour window)
      const windowStart = new Date(cutoffDate);
      windowStart.setMinutes(windowStart.getMinutes() - 30);
      const windowEnd = new Date(cutoffDate);
      windowEnd.setMinutes(windowEnd.getMinutes() + 30);

      const bookings = await prisma.booking.findMany({
        where: {
          workspaceId: rule.workspaceId,
          status: 'CONFIRMED',
          endTime: { gte: windowStart, lte: windowEnd },
          ...(rule.serviceId ? { serviceId: rule.serviceId } : {}),
          clientProfileId: { not: null },
        },
        include: {
          clientProfile: true,
          service: true,
        },
      });

      const providerName = rule.workspace.profile?.displayName || rule.workspace.name;

      for (const booking of bookings) {
        if (!booking.clientProfile) continue;

        // Check if we already sent this notification
        const alreadySent = await prisma.notificationLog.findFirst({
          where: {
            workspaceId: rule.workspaceId,
            clientProfileId: booking.clientProfileId!,
            type: 'RULE',
            sentAt: { gte: windowStart },
          },
        });

        if (alreadySent) continue;

        const message = rule.template
          .replace(/\{clientName\}/g, booking.clientProfile.name)
          .replace(/\{serviceName\}/g, booking.service.name)
          .replace(/\{providerName\}/g, providerName)
          .replace(/\{lastDate\}/g, booking.endTime.toLocaleDateString('es-CO'));

        try {
          await sendEmail(
            booking.clientProfile.email,
            rule.subject || `Recordatorio de ${providerName}`,
            `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <div style="color: #4A4A4A; line-height: 1.6;">${message}</div>
              <hr style="border: none; border-top: 1px solid #E8E8E8; margin: 24px 0;" />
              <p style="color: #8E8E8E; font-size: 12px;">
                Enviado por ${providerName} a traves de LinkDN Services
              </p>
            </div>
            `
          );

          await prisma.notificationLog.create({
            data: {
              workspaceId: rule.workspaceId,
              clientProfileId: booking.clientProfileId!,
              type: 'RULE',
              subject: rule.subject || `Recordatorio de ${providerName}`,
              message,
            },
          });

          emailsSent++;
        } catch (err) {
          console.error('Failed to send rule notification:', err);
        }
      }

      processedRules++;
    }

    // === 2. Process PRE_APPOINTMENT rules ===
    const preAppointmentRules = await prisma.notificationRule.findMany({
      where: { active: true, type: 'PRE_APPOINTMENT' },
      include: {
        workspace: { include: { profile: true } },
        service: true,
      },
    });

    for (const rule of preAppointmentRules) {
      const targetTime = new Date();
      targetTime.setHours(targetTime.getHours() + rule.delayValue);

      const windowStart = new Date(targetTime);
      windowStart.setMinutes(windowStart.getMinutes() - 30);
      const windowEnd = new Date(targetTime);
      windowEnd.setMinutes(windowEnd.getMinutes() + 30);

      const bookings = await prisma.booking.findMany({
        where: {
          workspaceId: rule.workspaceId,
          status: 'CONFIRMED',
          startTime: { gte: windowStart, lte: windowEnd },
          ...(rule.serviceId ? { serviceId: rule.serviceId } : {}),
          clientProfileId: { not: null },
        },
        include: {
          clientProfile: true,
          service: true,
        },
      });

      const providerName = rule.workspace.profile?.displayName || rule.workspace.name;

      for (const booking of bookings) {
        if (!booking.clientProfile) continue;

        const alreadySent = await prisma.notificationLog.findFirst({
          where: {
            workspaceId: rule.workspaceId,
            clientProfileId: booking.clientProfileId!,
            type: 'RULE',
            sentAt: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
          },
        });

        if (alreadySent) continue;

        const message = rule.template
          .replace(/\{clientName\}/g, booking.clientProfile.name)
          .replace(/\{serviceName\}/g, booking.service.name)
          .replace(/\{providerName\}/g, providerName)
          .replace(/\{lastDate\}/g, booking.startTime.toLocaleDateString('es-CO'));

        try {
          await sendEmail(
            booking.clientProfile.email,
            rule.subject || `Recordatorio: tu cita con ${providerName}`,
            `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
              <div style="color: #4A4A4A; line-height: 1.6;">${message}</div>
              <hr style="border: none; border-top: 1px solid #E8E8E8; margin: 24px 0;" />
              <p style="color: #8E8E8E; font-size: 12px;">
                Enviado por ${providerName} a traves de LinkDN Services
              </p>
            </div>
            `
          );

          await prisma.notificationLog.create({
            data: {
              workspaceId: rule.workspaceId,
              clientProfileId: booking.clientProfileId!,
              type: 'RULE',
              subject: rule.subject || `Recordatorio: tu cita con ${providerName}`,
              message,
            },
          });

          emailsSent++;
        } catch (err) {
          console.error('Failed to send pre-appointment notification:', err);
        }
      }

      processedRules++;
    }

    // === 3. Process scheduled campaigns ===
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: {
        workspace: { include: { profile: true } },
        recipients: {
          where: { status: 'DRAFT' },
          include: { clientProfile: true },
        },
      },
    });

    for (const campaign of scheduledCampaigns) {
      const providerName = campaign.workspace.profile?.displayName || campaign.workspace.name;

      for (const recipient of campaign.recipients) {
        const personalizedMessage = campaign.message
          .replace(/\{clientName\}/g, recipient.clientProfile.name)
          .replace(/\{providerName\}/g, providerName);

        try {
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

          await prisma.notificationLog.create({
            data: {
              workspaceId: campaign.workspaceId,
              clientProfileId: recipient.clientProfileId,
              type: 'CAMPAIGN',
              subject: campaign.subject,
              message: personalizedMessage,
            },
          });

          emailsSent++;
        } catch (err) {
          await prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: 'FAILED' },
          });
        }
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENT', sentAt: new Date() },
      });

      processedCampaigns++;
    }

    return NextResponse.json({
      success: true,
      processedRules,
      processedCampaigns,
      emailsSent,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron notification error:', error);
    return NextResponse.json(
      { error: 'Error procesando notificaciones' },
      { status: 500 }
    );
  }
}
