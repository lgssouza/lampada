import type { Dimensao, Nivel, Perfil } from "./types";

export const DIMENSOES: { id: Dimensao; nome: string; descricao: string }[] = [
  { id: "biblia", nome: "Leitura da Bíblia", descricao: "Hábito e compreensão das Escrituras" },
  { id: "oracao", nome: "Vida de oração", descricao: "Constância e profundidade no falar com Deus" },
  { id: "igreja", nome: "Igreja local", descricao: "Culto, comunhão e cuidado mútuo" },
  { id: "servico", nome: "Serviço e testemunho", descricao: "Servir e falar de Cristo" },
  { id: "doutrina", nome: "Entendimento da fé", descricao: "Conhecimento do que a igreja crê" },
];

export const NIVEIS: Record<Nivel, { nome: string; resumo: string }> = {
  iniciando: {
    nome: "Iniciando a caminhada",
    resumo:
      "Você está começando a conhecer Jesus e a Bíblia. O plano desta semana caminha pelo Evangelho de João, com passos curtos e simples.",
  },
  crescendo: {
    nome: "Crescendo",
    resumo:
      "Você já tem alguns hábitos de fé e quer aprofundar. O plano desta semana passa por Salmos, Mateus, Romanos e Filipenses, com foco em oração e em viver o evangelho.",
  },
  firmando: {
    nome: "Firmando raízes",
    resumo:
      "Você já conhece bem o caminho e quer fundamentos sólidos. O plano desta semana estuda graça, justificação, santificação e perseverança nas cartas.",
  },
  multiplicando: {
    nome: "Multiplicando",
    resumo:
      "Sua fé já produz fruto e cuidado pelos outros. O plano desta semana trata de discipulado, comunhão e serviço na igreja local.",
  },
};

export type Pergunta = { dim: Dimensao; texto: string; opcoes: string[] };

// Cada opção vale de 0 a 3 pontos, na ordem em que aparece.
export const PERGUNTAS: Pergunta[] = [
  {
    dim: "biblia",
    texto: "Com que frequência você lê a Bíblia?",
    opcoes: [
      "Quase nunca",
      "Algumas vezes por mês",
      "Algumas vezes por semana",
      "Quase todos os dias",
    ],
  },
  {
    dim: "biblia",
    texto: "Como você se sente lendo a Bíblia por conta própria?",
    opcoes: [
      "Perdido(a), não sei por onde começar",
      "Acompanho as histórias, mas os textos mais difíceis me travam",
      "Entendo bastante e faço perguntas ao texto",
      "Estudo com método e considero o contexto de cada passagem",
    ],
  },
  {
    dim: "oracao",
    texto: "Como é a sua vida de oração?",
    opcoes: [
      "Oro raramente, sobretudo em momentos de aperto",
      "Oro com alguma frequência, mas sem rotina",
      "Tenho um momento diário de oração",
      "Oro todo dia com adoração, confissão, gratidão e pedidos",
    ],
  },
  {
    dim: "oracao",
    texto: "Você ora pelas outras pessoas?",
    opcoes: [
      "Raramente",
      "Por familiares, quando lembro",
      "Tenho uma lista de pessoas e pedidos",
      "Oro regularmente pela igreja, pelos que não conhecem a Cristo e pelas autoridades",
    ],
  },
  {
    dim: "igreja",
    texto: "Como é a sua participação na igreja local?",
    opcoes: [
      "Ainda não frequento uma igreja",
      "Vou ao culto de vez em quando",
      "Vou ao culto com regularidade",
      "Culto, escola dominical e comunhão fazem parte da minha semana",
    ],
  },
  {
    dim: "igreja",
    texto: "Você tem irmãos com quem compartilha a vida e a fé?",
    opcoes: [
      "Ainda não",
      "Conheço pessoas, mas conversamos pouco sobre fé",
      "Tenho alguns amigos na fé",
      "Estou em um pequeno grupo ou discipulado, onde recebo e ofereço cuidado",
    ],
  },
  {
    dim: "servico",
    texto: "Como você serve na igreja ou na comunidade?",
    opcoes: [
      "Ainda não sirvo",
      "Ajudo quando me pedem",
      "Tenho um serviço regular",
      "Sirvo e ajudo outros a encontrar o seu serviço",
    ],
  },
  {
    dim: "servico",
    texto: "Você conversa com outras pessoas sobre Jesus?",
    opcoes: [
      "Ainda não",
      "Só quando a oportunidade surge",
      "Procuro oportunidades para falar",
      "Falo de Cristo e acompanho quem está começando a fé",
    ],
  },
  {
    dim: "doutrina",
    texto: "Quanto você conhece do que a igreja crê (Credo Apostólico, catecismos)?",
    opcoes: [
      "Nunca estudei",
      "Conheço o básico do Credo Apostólico",
      "Já estudei parte dos catecismos ou da Confissão de Fé",
      "Consigo explicar as principais doutrinas a outras pessoas",
    ],
  },
  {
    dim: "doutrina",
    texto: "Como você entende a salvação?",
    opcoes: [
      "Ainda não tenho clareza",
      "Creio em Jesus, mas às vezes misturo fé com méritos meus",
      "Somos salvos pela graça, mediante a fé em Cristo",
      "Somos salvos somente pela graça, mediante a fé, para boas obras, e sei mostrar isso na Bíblia",
    ],
  },
];

const ORDEM_DESEMPATE: Dimensao[] = ["biblia", "oracao", "igreja", "doutrina", "servico"];

export function calcularPerfil(respostas: number[]): Perfil {
  const pontos: Record<Dimensao, number> = { biblia: 0, oracao: 0, igreja: 0, servico: 0, doutrina: 0 };
  PERGUNTAS.forEach((p, i) => {
    pontos[p.dim] += respostas[i] ?? 0;
  });
  const total = Object.values(pontos).reduce((a, b) => a + b, 0);
  const nivel: Nivel =
    total <= 9 ? "iniciando" : total <= 17 ? "crescendo" : total <= 24 ? "firmando" : "multiplicando";
  const foco = [...ORDEM_DESEMPATE].sort((a, b) => pontos[a] - pontos[b])[0];
  return { respostas, pontos, total, nivel, foco, data: new Date().toISOString() };
}
