import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// Envío de correos por SMTP (Gmail con contraseña de aplicación). Configuración en .env.

let transporte: Transporter | null = null;

function smtp() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Falta configurar SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS en el .env");
  }
  const port = Number(SMTP_PORT);
  transporte ??= nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporte;
}

export async function enviarCorreo(correo: { para: string; asunto: string; texto: string; html: string }) {
  await smtp().sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: correo.para,
    subject: correo.asunto,
    text: correo.texto,
    html: correo.html,
  });
}

// URL pública de la app para los enlaces de los correos. Se toma de APP_URL (no de la
// cabecera Host de la petición) para que nadie pueda hacer que el enlace apunte a otro sitio.
export function urlApp() {
  const url = process.env.APP_URL;
  if (!url) throw new Error("Falta APP_URL en el .env (por ejemplo https://finanzas.pukio.lat)");
  return url.replace(/\/+$/, "");
}

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function correoRecuperacion(nombre: string, enlace: string) {
  const saludo = nombre.trim().split(/\s+/)[0] ?? "";
  return {
    asunto: "Restablece tu contraseña de Finanzas",
    texto: [
      `Hola ${saludo},`,
      "",
      "Pediste cambiar tu contraseña de Finanzas. Abre este enlace para elegir una nueva:",
      enlace,
      "",
      "El enlace vence en 30 minutos y solo sirve una vez.",
      "Si no fuiste tú, ignora este correo: tu contraseña sigue igual.",
      "",
      "PUKIO",
    ].join("\n"),
    html: `<!doctype html>
<html lang="es">
  <body style="margin:0;background:#f6f7f9;font-family:Arial,Helvetica,sans-serif;color:#14171c">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e2e5ea;border-radius:16px;padding:32px">
          <tr><td>
            <p style="margin:0 0 16px;font-size:16px">Hola ${escapar(saludo)},</p>
            <p style="margin:0 0 24px;font-size:15px;line-height:22px;color:#5d6573">Pediste cambiar tu contraseña de Finanzas. Usa este botón para elegir una nueva.</p>
            <p style="margin:0 0 24px"><a href="${escapar(enlace)}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-size:15px;padding:12px 20px;border-radius:10px">Elegir nueva contraseña</a></p>
            <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#5d6573">El enlace vence en 30 minutos y solo sirve una vez. Si no fuiste tú, ignora este correo: tu contraseña sigue igual.</p>
            <p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#8a919c;word-break:break-all">Si el botón no funciona, copia este enlace:<br>${escapar(enlace)}</p>
          </td></tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#8a919c">PUKIO</p>
      </td></tr>
    </table>
  </body>
</html>`,
  };
}
