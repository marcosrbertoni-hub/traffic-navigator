import type { Plan } from "@/domain/types";

export const BRAND = {
  name: "Navora",
  tagline: "Automação e testes de navegação para sites",
  supportEmail: "contato@navora.app", // placeholder — replace with the real address
};

/** Credit rules — single source of truth for estimates (backend will enforce the same). */
export const CREDIT_RULES = {
  creditsPerPage: 1,
  trialCredits: 500,
};

/** Plans — prices intentionally null ("a definir"). Edit here or load from the `plans` table later. */
export const PLANS: Plan[] = [
  {
    id: "trial",
    name: "Teste",
    tagline: "Para conhecer a plataforma",
    price_monthly: 0,
    credits_monthly: CREDIT_RULES.trialCredits,
    max_sites: 1,
    max_campaigns: 1,
    features: ["1 site", "1 campanha ativa", "Relatórios básicos", "Suporte por e-mail"],
    is_trial: true,
  },
  {
    id: "starter",
    name: "Essencial",
    tagline: "Para sites e projetos individuais",
    price_monthly: null,
    credits_monthly: 10000,
    max_sites: 3,
    max_campaigns: 5,
    features: ["3 sites", "5 campanhas", "Agendamento por horário", "Relatórios completos"],
  },
  {
    id: "pro",
    name: "Profissional",
    tagline: "Para equipes e agências",
    price_monthly: null,
    credits_monthly: 50000,
    max_sites: 15,
    max_campaigns: 30,
    features: ["15 sites", "30 campanhas", "Análise de sitemap", "Exportação de relatórios", "Suporte prioritário"],
    highlighted: true,
  },
  {
    id: "business",
    name: "Empresarial",
    tagline: "Volume e controle avançado",
    price_monthly: null,
    credits_monthly: 200000,
    max_sites: null,
    max_campaigns: null,
    features: ["Sites ilimitados", "Campanhas ilimitadas", "Acesso à API", "Gerente de conta"],
  },
];
