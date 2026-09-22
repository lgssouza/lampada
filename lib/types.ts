export type Dimensao = "biblia" | "oracao" | "igreja" | "servico" | "doutrina";
export type Nivel = "iniciando" | "crescendo" | "firmando" | "multiplicando";
export type TipoCrise = "suicidio" | "violencia";
export type TipoOracao = "adoracao" | "confissao" | "gratidao" | "suplica" | "intercessao";

export type Versiculo = { n: number; texto: string };
export type Passagem = {
  referencia: string;
  versiculos: Versiculo[];
  traducao: string;
};

export type Mensagem = {
  id: string;
  role: "user" | "assistant";
  content: string;
  passagens?: Passagem[];
  crise?: TipoCrise;
};

export type Perfil = {
  respostas: number[];
  pontos: Record<Dimensao, number>;
  total: number;
  nivel: Nivel;
  foco: Dimensao;
  data: string;
};

export type Plano = {
  nivel: Nivel;
  inicio: string;
  concluidos: number[];
  desafios: number[];
  notas: Record<number, string>;
};

export type Estado = {
  consentimento: { data: string } | null;
  perfil: Perfil | null;
  plano: Plano | null;
  chat: Mensagem[];
};

export type DiaPlano = {
  dia: number;
  titulo: string;
  referencia: string;
  observe: string;
  aplique: string;
  oracao: { tipo: TipoOracao; foco: string };
  desafio: string;
};
