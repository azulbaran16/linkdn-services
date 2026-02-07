import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { notFound } from 'next/navigation';

const TIMEZONE = 'America/Bogota';

function formatDateTime(date: Date): string {
  const zonedDate = toZonedTime(date, TIMEZONE);
  return format(zonedDate, "EEEE d 'de' MMMM 'de' yyyy, h:mm a", { locale: es });
}

export default async function ManageBookingPage({
  params,
}: {
  params: { token: string };
}) {
  const bookingToken = await prisma.bookingToken.findUnique({
    where: { token: params.token },
    include: {
      booking: {
        include: {
          service: { select: { name: true } },
          workspace: {
            include: {
              profile: { select: { displayName: true } },
            },
          },
        },
      },
    },
  });

  if (!bookingToken) {
    notFound();
  }

  const { booking } = bookingToken;
  const providerName = booking.workspace.profile?.displayName || '';
  const mobileScheme = process.env.MOBILE_SCHEME || 'linkdn-services';
  const deepLink = `${mobileScheme}://booking/manage/${params.token}`;
  const apiBase = process.env.APP_URL || 'http://localhost:3000';

  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Gestionar reserva - LinkDN Services</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
          .container { max-width: 480px; margin: 0 auto; padding: 24px 16px; }
          .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #6D28D9; color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 16px; }
          h1 { font-size: 18px; font-weight: 600; }
          h2 { font-size: 16px; margin-bottom: 16px; }
          .detail { margin: 8px 0; font-size: 14px; }
          .label { font-weight: 600; color: #555; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
          .status-confirmed { background: #d4edda; color: #155724; }
          .status-cancelled { background: #f8d7da; color: #721c24; }
          .btn { display: block; width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; margin-top: 12px; text-align: center; text-decoration: none; }
          .btn-primary { background: #6D28D9; color: white; }
          .btn-danger { background: #dc3545; color: white; }
          .btn-secondary { background: #6c757d; color: white; }
          .btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .message { padding: 12px; border-radius: 8px; margin-top: 12px; font-size: 14px; }
          .message-success { background: #d4edda; color: #155724; }
          .message-error { background: #f8d7da; color: #721c24; }
          .app-link { text-align: center; margin-top: 16px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>LinkDN Services</h1>
          </div>

          <div className="card">
            <h2>Detalles de la reserva</h2>

            <div className="detail">
              <span className="label">Servicio:</span> {booking.service.name}
            </div>
            <div className="detail">
              <span className="label">Proveedor:</span> {providerName}
            </div>
            <div className="detail">
              <span className="label">Fecha:</span> {formatDateTime(booking.startTime)}
            </div>
            <div className="detail">
              <span className="label">Cliente:</span> {booking.clientName}
            </div>
            <div className="detail" style={{ marginTop: '12px' }}>
              <span className="label">Estado: </span>
              <span className={`status ${booking.status === 'CONFIRMED' ? 'status-confirmed' : 'status-cancelled'}`}>
                {booking.status === 'CONFIRMED' ? 'Confirmada' : booking.status === 'CANCELLED' ? 'Cancelada' : 'Reprogramada'}
              </span>
            </div>

            {booking.status === 'CONFIRMED' && (
              <div id="actions">
                <button className="btn btn-danger" id="cancelBtn">
                  Cancelar reserva
                </button>
                <div id="msg" className="message" style={{ display: 'none' }}></div>
                <script dangerouslySetInnerHTML={{ __html: `
                  document.getElementById('cancelBtn').addEventListener('click', function() {
                    if (confirm('Esta seguro de que desea cancelar esta reserva?')) {
                      fetch('${apiBase}/api/bookings/${params.token}/cancel', { method: 'POST' })
                        .then(function(r) { return r.json(); })
                        .then(function(data) {
                          if (data.error) { document.getElementById('msg').className = 'message message-error'; document.getElementById('msg').textContent = data.error; }
                          else { document.getElementById('msg').className = 'message message-success'; document.getElementById('msg').textContent = 'Reserva cancelada exitosamente'; document.getElementById('actions').style.display = 'none'; }
                          document.getElementById('msg').style.display = 'block';
                        })
                        .catch(function() { document.getElementById('msg').className = 'message message-error'; document.getElementById('msg').textContent = 'Error al cancelar. Intente de nuevo.'; document.getElementById('msg').style.display = 'block'; });
                    }
                  });
                `}} />
              </div>
            )}
          </div>

          <div className="app-link">
            <a href={deepLink} className="btn btn-primary" style={{ display: 'inline-block', width: 'auto', padding: '14px 32px', marginTop: '16px' }}>
              Abrir en la app
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
