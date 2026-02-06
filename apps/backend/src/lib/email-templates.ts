import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

const TIMEZONE = 'America/Bogota';

function formatDateTime(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, "EEEE d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { padding: 24px; background: #fff; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px; }
    .detail { margin: 8px 0; }
    .label { font-weight: 600; color: #555; }
    .btn { display: inline-block; padding: 12px 24px; background: #1a1a2e; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
    .footer { margin-top: 24px; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin:0; font-size:20px;">LinkDN Services</h1>
  </div>
  <div class="content">
    ${content}
  </div>
  <div class="footer">
    <p>Este correo fue enviado automaticamente. No responda a este mensaje.</p>
  </div>
</body>
</html>`;
}

export function bookingConfirmationEmail(data: {
  clientName: string;
  serviceName: string;
  providerName: string;
  startTime: Date;
  endTime: Date;
  manageUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Confirmacion de reserva - ${data.serviceName}`,
    html: baseTemplate(`
      <h2>Reserva confirmada</h2>
      <p>Hola ${data.clientName},</p>
      <p>Tu reserva ha sido confirmada con los siguientes detalles:</p>
      <div class="detail"><span class="label">Servicio:</span> ${data.serviceName}</div>
      <div class="detail"><span class="label">Proveedor:</span> ${data.providerName}</div>
      <div class="detail"><span class="label">Fecha y hora:</span> ${formatDateTime(data.startTime)}</div>
      <p>Para gestionar tu reserva (reprogramar o cancelar), usa el siguiente enlace:</p>
      <a href="${data.manageUrl}" class="btn">Gestionar reserva</a>
    `),
  };
}

export function bookingCancelledEmail(data: {
  clientName: string;
  serviceName: string;
  providerName: string;
  startTime: Date;
}): { subject: string; html: string } {
  return {
    subject: `Reserva cancelada - ${data.serviceName}`,
    html: baseTemplate(`
      <h2>Reserva cancelada</h2>
      <p>Hola ${data.clientName},</p>
      <p>Tu reserva ha sido cancelada:</p>
      <div class="detail"><span class="label">Servicio:</span> ${data.serviceName}</div>
      <div class="detail"><span class="label">Proveedor:</span> ${data.providerName}</div>
      <div class="detail"><span class="label">Fecha original:</span> ${formatDateTime(data.startTime)}</div>
      <p>Si deseas reservar nuevamente, visita el perfil del proveedor en la aplicacion.</p>
    `),
  };
}

export function bookingRescheduledEmail(data: {
  clientName: string;
  serviceName: string;
  providerName: string;
  oldStartTime: Date;
  newStartTime: Date;
  manageUrl: string;
}): { subject: string; html: string } {
  return {
    subject: `Reserva reprogramada - ${data.serviceName}`,
    html: baseTemplate(`
      <h2>Reserva reprogramada</h2>
      <p>Hola ${data.clientName},</p>
      <p>Tu reserva ha sido reprogramada:</p>
      <div class="detail"><span class="label">Servicio:</span> ${data.serviceName}</div>
      <div class="detail"><span class="label">Proveedor:</span> ${data.providerName}</div>
      <div class="detail"><span class="label">Fecha anterior:</span> ${formatDateTime(data.oldStartTime)}</div>
      <div class="detail"><span class="label">Nueva fecha:</span> ${formatDateTime(data.newStartTime)}</div>
      <p>Para gestionar tu reserva, usa el siguiente enlace:</p>
      <a href="${data.manageUrl}" class="btn">Gestionar reserva</a>
    `),
  };
}
