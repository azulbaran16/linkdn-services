export default function TermsOfServicePage() {
  return (
    <html lang="es">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Terminos de Servicio - LinkDN Services</title>
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
            <h1>Terminos de Servicio</h1>
          </div>

          <div className="card">
            <h2>1. Aceptacion de los Terminos</h2>
            <p>Al utilizar la plataforma LinkDN Services, usted acepta estos terminos de servicio. Si no esta de acuerdo con alguno de ellos, no debe utilizar la plataforma.</p>

            <h2>2. Descripcion del Servicio</h2>
            <p>LinkDN Services es una plataforma que conecta clientes con proveedores de servicios profesionales. Facilitamos la busqueda, reserva y pago de servicios como limpieza, reparaciones, bienestar y mas.</p>

            <h2>3. Registro y Cuenta</h2>
            <ul>
              <li>Debe proporcionar informacion veraz al crear su cuenta</li>
              <li>Es responsable de mantener la confidencialidad de sus credenciales</li>
              <li>Puede registrarse con correo electronico, Google o Apple ID</li>
              <li>Una cuenta puede operar como cliente, proveedor, o ambos</li>
            </ul>

            <h2>4. Reservas</h2>
            <ul>
              <li>Las reservas estan sujetas a la disponibilidad del proveedor</li>
              <li>Al confirmar una reserva, se compromete a asistir en la fecha y hora acordadas</li>
              <li>Las cancelaciones deben realizarse con al menos 24 horas de anticipacion</li>
              <li>Cancelaciones tardias pueden estar sujetas a cargos segun la politica del proveedor</li>
            </ul>

            <h2>5. Pagos y Depositos</h2>
            <ul>
              <li>Algunos servicios requieren un deposito del 30% al momento de la reserva</li>
              <li>El deposito se paga a traves de la plataforma mediante Wompi (PSE, tarjeta, Nequi)</li>
              <li>El 70% restante se paga directamente al proveedor al momento del servicio</li>
              <li>Los depositos son reembolsables si la cancelacion se realiza dentro del plazo permitido</li>
              <li>Todos los precios estan en pesos colombianos (COP)</li>
            </ul>

            <h2>6. Responsabilidades</h2>
            <p><strong>LinkDN Services:</strong></p>
            <ul>
              <li>Facilita la conexion entre clientes y proveedores</li>
              <li>Procesa pagos de forma segura</li>
              <li>No es responsable de la calidad del servicio prestado por el proveedor</li>
            </ul>
            <p><strong>Proveedores:</strong></p>
            <ul>
              <li>Son responsables de la calidad y cumplimiento de sus servicios</li>
              <li>Deben mantener actualizada su disponibilidad y precios</li>
              <li>Deben cumplir con las normativas locales aplicables</li>
            </ul>
            <p><strong>Clientes:</strong></p>
            <ul>
              <li>Deben proporcionar informacion correcta al reservar</li>
              <li>Deben respetar los horarios acordados</li>
              <li>Deben tratar con respeto a los proveedores de servicios</li>
            </ul>

            <h2>7. Cancelacion de Cuenta</h2>
            <p>Puede solicitar la eliminacion de su cuenta en cualquier momento contactando a soporte. Las reservas activas deben ser canceladas o completadas antes de eliminar la cuenta.</p>

            <h2>8. Ley Aplicable</h2>
            <p>Estos terminos se rigen por las leyes de la Republica de Colombia. Cualquier controversia sera resuelta ante los tribunales competentes de Colombia.</p>

            <h2>9. Contacto</h2>
            <p>Para consultas sobre estos terminos: <strong>soporte@linkdn.co</strong></p>
          </div>

          <p className="date">Ultima actualizacion: Febrero 2026</p>
        </div>
      </body>
    </html>
  );
}
