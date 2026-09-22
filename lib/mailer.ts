import nodemailer from "nodemailer";

let transportador: ReturnType<typeof nodemailer.createTransport> | null = null;

function pegarTransportador() {
  if (!transportador) {
    if (!process.env.EMAIL_SERVER) return null;
    transportador = nodemailer.createTransport(process.env.EMAIL_SERVER);
  }
  return transportador;
}

// Envia o link de acesso por e-mail. Se EMAIL_SERVER não estiver configurado (comum ao
// testar sozinho, sem provedor de e-mail), o link é apenas escrito no log do servidor —
// útil para rodar localmente sem precisar configurar SMTP nenhum.
export async function enviarLinkMagico(email: string, url: string) {
  const t = pegarTransportador();
  if (!t) {
    console.log(`\n[Lâmpada] EMAIL_SERVER não configurado. Link de acesso para ${email}:\n${url}\n`);
    return;
  }
  await t.sendMail({
    to: email,
    from: process.env.EMAIL_FROM || "Lâmpada <lampada@localhost>",
    subject: "Seu link de acesso à Lâmpada",
    text: `Entre na Lâmpada clicando neste link (válido por 15 minutos):\n\n${url}\n\nSe você não pediu esse link, pode ignorar este e-mail.`,
    html: `<p>Entre na Lâmpada clicando no link abaixo (válido por 15 minutos):</p><p><a href="${url}">${url}</a></p><p>Se você não pediu esse link, pode ignorar este e-mail.</p>`,
  });
}
