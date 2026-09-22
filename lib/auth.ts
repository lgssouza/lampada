import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { enviarLinkMagico } from "./mailer";
import { pool } from "./pg";

export const auth = betterAuth({
  database: pool,
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_URL,
  advanced: {
    // Ids em formato UUID em todas as tabelas (usuário, sessão, etc.), gerados pelo Node.
    database: { generateId: () => crypto.randomUUID() },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15, // 15 minutos
      sendMagicLink: async ({ email, url }) => {
        await enviarLinkMagico(email, url);
      },
    }),
  ],
});
