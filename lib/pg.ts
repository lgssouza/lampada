import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

// Em desenvolvimento o Next.js recarrega módulos a cada mudança de arquivo; guardar
// o pool em globalThis evita abrir uma conexão nova a cada recarga.
export const pool: Pool =
  globalThis._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalThis._pgPool = pool;
