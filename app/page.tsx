import App from "@/components/App";

// A página depende da sessão de login e não pode ser pré-gerada como HTML estático no build.
export const dynamic = "force-dynamic";

export default function Page() {
  return <App />;
}
