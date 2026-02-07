export default function PrivacyPolicyPage() {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Politica de Privacidad - LinkDN Services</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
          .container { max-width: 680px; margin: 0 auto; padding: 24px 16px; }
          .header { background: #6D28D9; color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 16px; }
          h1 { font-size: 20px; font-weight: 600; }
          .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 16px; }
          h2 { font-size: 16px; color: #6D28D9; margin-bottom: 12px; margin-top: 20px; }
          h2:first-child { margin-top: 0; }
          p { font-size: 14px; margin-bottom: 8px; }
          ul { font-size: 14px; padding-left: 20px; margin-bottom: 8px; }
          li { margin-bottom: 4px; }
          .date { font-size: 13px; color: #888; text-align: center; margin-top: 16px; }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>Politica de Privacidad</h1>
          </div>

          <div className="card">
            <h2>1. Informacion que Recopilamos</h2>
            <p>LinkDN Services recopila la siguiente informacion personal:</p>
            <ul>
              <li>Nombre completo y correo electronico al crear una cuenta</li>
              <li>Numero de telefono y ciudad (opcionales, para mejorar la experiencia)</li>
              <li>Informacion de reservas realizadas (servicios, fechas, horarios)</li>
              <li>Datos de transacciones de pago (montos, referencias, metodo de pago)</li>
            </ul>
            <p>No almacenamos datos de tarjetas de credito. Los pagos son procesados de forma segura por Wompi, nuestro proveedor de pagos certificado.</p>

            <h2>2. Uso de la Informacion</h2>
            <p>Utilizamos su informacion para:</p>
            <ul>
              <li>Facilitar la reserva de servicios profesionales</li>
              <li>Enviar confirmaciones y recordatorios de citas</li>
              <li>Procesar pagos y depositos</li>
              <li>Mejorar nuestros servicios y experiencia de usuario</li>
              <li>Comunicar actualizaciones importantes sobre la plataforma</li>
            </ul>

            <h2>3. Proteccion de Datos</h2>
            <p>Implementamos medidas de seguridad tecnicas y organizativas para proteger su informacion personal, incluyendo encriptacion de datos sensibles y acceso restringido a la informacion.</p>

            <h2>4. Derechos del Titular (Ley 1581 de 2012)</h2>
            <p>De acuerdo con la legislacion colombiana de proteccion de datos personales (Habeas Data), usted tiene derecho a:</p>
            <ul>
              <li>Conocer, actualizar y rectificar sus datos personales</li>
              <li>Solicitar la supresion de sus datos cuando no sean necesarios</li>
              <li>Revocar la autorizacion para el tratamiento de sus datos</li>
              <li>Acceder de forma gratuita a sus datos personales</li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio</li>
            </ul>

            <h2>5. Compartir Informacion</h2>
            <p>Compartimos su informacion unicamente con:</p>
            <ul>
              <li>Proveedores de servicios que usted reserve (nombre, correo, telefono)</li>
              <li>Procesadores de pago (Wompi) para completar transacciones</li>
              <li>Autoridades competentes cuando sea requerido por ley</li>
            </ul>
            <p>No vendemos ni compartimos su informacion con terceros para fines publicitarios.</p>

            <h2>6. Cookies y Tecnologias</h2>
            <p>Nuestra aplicacion movil utiliza almacenamiento local (AsyncStorage) para mantener su sesion activa y preferencias. No utilizamos cookies de rastreo de terceros.</p>

            <h2>7. Contacto</h2>
            <p>Para ejercer sus derechos o realizar consultas sobre privacidad, contactenos a: <strong>soporte@linkdn.co</strong></p>
          </div>

          <p className="date">Ultima actualizacion: Febrero 2026</p>
        </div>
      </body>
    </html>
  );
}
