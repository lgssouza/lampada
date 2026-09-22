// A saída "standalone" do Next.js não copia public/ e .next/static/ sozinha — isso é
// esperado (documentado pela própria Next.js), então fazemos aqui logo após o build,
// tanto para "npm run build && npm start" quanto para o Dockerfile.
import { cpSync, existsSync } from "node:fs";

if (existsSync("public")) cpSync("public", ".next/standalone/public", { recursive: true });
if (existsSync(".next/static")) cpSync(".next/static", ".next/standalone/.next/static", { recursive: true });
console.log("postbuild: public/ e .next/static/ copiados para .next/standalone/");
