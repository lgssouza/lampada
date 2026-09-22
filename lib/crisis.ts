import type { TipoCrise } from "./types";

// Primeira camada do protocolo de crise: detecção por padrões, ANTES de qualquer chamada ao modelo.
// Decisão de projeto: preferimos falsos positivos (mostrar ajuda sem necessidade) a falsos negativos.
// A segunda camada é o próprio modelo, instruído a responder com [[CRISE:tipo]] quando perceber risco.

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const PADROES_SUICIDIO: RegExp[] = [
  /\bsuicid\w*/,
  /\b(quero|queria|vou|vontade de|penso em|pensando em|pensei em|ideia de|planejo|planejando)\s+(me\s+)?(matar|morrer)\b/,
  /\b(tirar|acabar com)\s+(a\s+)?(minha\s+)?vida\b/,
  /\bacabar com tudo\b/,
  /\bnao (quero|aguento|consigo) mais viver\b/,
  /\bnao vejo (mais )?sentido (em|na) (viver|vida)\b/,
  /\b(seria|era) melhor (sem mim|eu morrer|se eu morresse|se eu nao existisse)\b/,
  /\bautomutila\w*/,
  /\bme (cortar|cortando|corto|machucar|machucando|ferir)\b/,
  /\btomar (todos os|todo o) (comprimidos|remedios|remedio)\b/,
  /\bme enforcar\b/,
  /\bpular (da|do|de) (ponte|predio|janela|viaduto)\b/,
];

const PADROES_VIOLENCIA: RegExp[] = [
  /\bme (bate|bateu|batem|espanca|espancou|agride|agrediu|estuprou)\b/,
  /\bapanho (do|da|de|dele|dela)\b/,
  /\bviolencia domestica\b/,
  /\bestupr\w*/,
  /\babus(o|ou|a|ando|aram|ada|ado)\s+(sexual\w*|de mim|dela|dele|da minha|do meu)/,
  /\b(vai|vao|quer|querem) me matar\b/,
  /\bameaca(s|ram|ndo)? (de morte|de me matar)\b/,
  /\bme ameaca(m|ram|ou|ndo)? (de morte|de me matar|com (uma )?(faca|arma))\b/,
];

export function detectarCrise(texto: string): TipoCrise | null {
  const t = normalizar(texto);
  if (PADROES_SUICIDIO.some((p) => p.test(t))) return "suicidio";
  if (PADROES_VIOLENCIA.some((p) => p.test(t))) return "violencia";
  return null;
}

export type Contato = { nome: string; tel: string; nota: string };

// Conteúdo fixo, escrito pelo produto. Não depende do modelo. Revisar com pastor e profissional de saúde.
export const CONTEUDO_CRISE: Record<
  TipoCrise,
  { titulo: string; mensagem: string; contatos: Contato[]; passos: string[] }
> = {
  suicidio: {
    titulo: "Você não precisa passar por isso sozinho(a)",
    mensagem:
      "O que você está sentindo importa, e existem pessoas prontas para ouvir você agora. Antes de qualquer conselho, procure ajuda humana. Pedir ajuda não é fraqueza.",
    contatos: [
      { nome: "CVV, Centro de Valorização da Vida", tel: "188", nota: "24 horas, gratuito. Também por chat em cvv.org.br" },
      { nome: "SAMU", tel: "192", nota: "Emergência médica" },
    ],
    passos: [
      "Se você está em perigo agora, ligue 192 ou vá ao pronto-socorro mais próximo.",
      "Fale hoje com alguém de confiança: familiar, amigo, seu pastor ou presbítero.",
      "Se puder, afaste-se de qualquer coisa que possa ser usada para se machucar.",
    ],
  },
  violencia: {
    titulo: "A sua segurança vem primeiro",
    mensagem:
      "O que você descreve é sério, e a culpa não é sua. Antes de qualquer conselho, procure proteção e ajuda humana.",
    contatos: [
      { nome: "Polícia Militar", tel: "190", nota: "Se há perigo agora" },
      { nome: "Central de Atendimento à Mulher", tel: "180", nota: "24 horas, gratuito e sigiloso" },
      { nome: "Disque Direitos Humanos", tel: "100", nota: "Denúncias de violência contra crianças, idosos e outros" },
    ],
    passos: [
      "Se houver perigo imediato, ligue 190 e vá para um lugar seguro.",
      "Conte a uma pessoa de confiança, alguém que você saiba que vai proteger você.",
      "Guarde mensagens, fotos e registros que possam ajudar em uma denúncia.",
    ],
  },
};
