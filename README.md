# Traffic Navigator

Quero criar uma nova plataforma SaaS de automação de tráfego e testes de navegação para sites.

ANTES DE ESCREVER OU ALTERAR QUALQUER CÓDIGO, analise cuidadosamente o site de referência:

https://www.robodetrafego.com.br/

Analise também as páginas públicas, manual, funcionalidades, estrutura de navegação, proposta comercial, planos e fluxo de criação de campanhas disponíveis no domínio.

IMPORTANTE: o site acima é somente uma REFERÊNCIA FUNCIONAL E DE PRODUTO. NÃO copie código, textos, identidade visual, marca, logotipo ou elementos proprietários. Nosso produto deverá ter identidade, design, textos e implementação próprios.

OBJETIVO DO PRODUTO

Queremos criar uma plataforma SaaS própria que permita aos clientes configurar campanhas de automação de tráfego e testes de navegação em seus próprios sites.

A plataforma deverá futuramente possuir um motor de execução em nuvem, filas e workers. Porém, NESTA PRIMEIRA ETAPA NÃO implemente o motor de execução, geração de tráfego, proxies, rotação de IP ou workers.

Nesta etapa quero somente o ESQUELETO COMPLETO, profissional e escalável do produto.

A arquitetura deve ser preparada desde o início para posteriormente receber:

Supabase;

autenticação;

banco de dados;

API;

sistema de créditos;

pagamentos;

fila de tarefas;

scheduler;

workers;

relatórios;

monitoramento;

motor de execução.

ESTRUTURA DO PRODUTO

Crie três áreas claramente separadas:

SITE PÚBLICO

ÁREA DO CLIENTE

PAINEL ADMINISTRATIVO

========================================

SITE PÚBLICO
========================================

Criar as seguintes páginas:

Home

Como funciona

Recursos

Planos

FAQ

Contato

Login

Cadastro

Recuperação de senha

Termos de Uso

Política de Privacidade

A Home deve explicar claramente a proposta da plataforma, apresentar os principais recursos, benefícios, funcionamento, planos e chamadas para cadastro/teste.

Não faça promessas de melhoria garantida de posicionamento no Google, vendas ou conversões.

A comunicação deve apresentar o produto como uma plataforma de automação, testes e análise de tráfego/navegação.

========================================
2. ÁREA DO CLIENTE

Criar um dashboard profissional com menu lateral.

Estrutura:

Dashboard
Campanhas
Sites
Relatórios
Créditos
Planos
Pagamentos
Configurações
Ajuda

Dashboard:

resumo de campanhas;

campanhas ativas;

campanhas pausadas;

consumo de créditos;

sessões/tarefas planejadas;

sessões/tarefas executadas;

gráficos preparados para receber dados reais posteriormente;

avisos;

status do sistema.

Não inventar dados reais. Quando não houver backend, utilizar estados demonstrativos claramente identificados.

========================================
3. SISTEMA DE CAMPANHAS

Criar tela:

"Minhas campanhas"

Permitir visualizar:

nome;

site;

status;

quantidade configurada;

consumo;

data de criação;

última execução;

ações.

Ações:

visualizar;

editar;

pausar;

continuar;

duplicar;

excluir.

Criar também o fluxo:

"Nova campanha"

Organizar a criação em etapas.

ETAPA 1 — SITE

Campos:

nome da campanha;

site;

URL inicial;

descrição opcional.

Preparar estrutura para futuramente validar o domínio e analisar sitemap.

ETAPA 2 — PARÂMETROS DE SESSÃO

Preparar campos para:

quantidade de sessões/tarefas;

páginas por sessão;

duração mínima;

duração máxima;

desktop;

mobile;

distribuição;

visitantes novos/recorrentes como configuração de simulação/teste.

ETAPA 3 — PÁGINAS

Permitir configurar:

URL inicial;

URLs internas;

sitemap XML;

seleção de páginas;

quantidade de páginas por sessão.

Criar interface para adicionar/remover URLs.

Preparar estrutura para futuramente importar e analisar automaticamente o sitemap do domínio.

ETAPA 4 — ORIGENS

Criar interface para configurar fontes/origens de teste.

Preparar campos para:

direto;

referência;

mecanismos de busca como cenário de teste;

redes sociais;

URL de referência personalizada.

IMPORTANTE:
Não implementar mecanismos destinados a falsificar ou mascarar tráfego para manipular sistemas de busca, antifraude ou atribuição. A interface deve representar configurações de teste/automação.

ETAPA 5 — LOCALIZAÇÃO

Preparar campos para:

país;

estado/região;

cidade;

fuso horário.

Deixar a arquitetura preparada para posteriormente integrar uma infraestrutura de execução compatível.

ETAPA 6 — VOLUME

Criar configuração para:

quantidade total;

limite diário;

distribuição fixa;

distribuição variável;

intervalo entre tarefas.

Mostrar estimativa de consumo de créditos.

ETAPA 7 — HORÁRIOS

Criar:

horário inicial;

horário final;

dias da semana;

distribuição;

prioridade de horários;

fuso horário.

Criar visualização resumida da programação.

ETAPA 8 — REVISÃO

Mostrar um resumo completo da campanha antes de salvar.

Botões:

Voltar

Salvar rascunho

Criar campanha

Depois de criada:

visualizar;

editar;

pausar;

continuar.

========================================
4. SITES

Criar seção "Meus Sites".

Permitir:

adicionar site;

editar;

excluir;

visualizar;

verificar domínio;

visualizar status.

Preparar uma área para futuramente realizar análise automática do domínio.

Essa análise deverá futuramente poder verificar:

sitemap;

quantidade de URLs;

URLs acessíveis;

erros;

redirecionamentos;

estrutura básica;

páginas disponíveis;

links internos;

informações técnicas úteis para testes.

Nesta primeira etapa criar somente a interface e a estrutura necessária, sem implementar o crawler completo.

========================================
5. RELATÓRIOS

Criar página de relatórios preparada para dados reais.

Filtros:

período;

site;

campanha;

status.

Indicadores:

tarefas planejadas;

tarefas executadas;

páginas testadas;

duração;

erros;

sucesso;

consumo de créditos.

Criar gráficos profissionais usando dados mockados claramente identificados enquanto o backend não existir.

========================================
6. CRÉDITOS

Criar sistema visual de créditos.

Mostrar:

saldo;

créditos utilizados;

histórico;

consumo por campanha;

créditos adquiridos;

créditos expirados, se aplicável.

Criar estrutura preparada para posteriormente conectar ao banco de dados.

========================================
7. PLANOS

Criar página de planos com:

plano gratuito/teste;

planos pagos;

quantidade de créditos;

limites;

recursos;

botão de contratação.

Não colocar preços definitivos ainda. Usar valores facilmente configuráveis posteriormente.

========================================
8. PAGAMENTOS

Criar estrutura visual para:

assinatura;

histórico;

método de pagamento;

faturas;

renovação;

cancelamento.

Não implementar gateway agora.

Deixar preparado para integração futura com um gateway de pagamento.

========================================
9. PAINEL ADMINISTRATIVO

Criar uma área administrativa separada.

Menu:

Admin Dashboard
Usuários
Sites
Campanhas
Planos
Créditos
Pagamentos
Tarefas
Logs
Workers
Configurações

Dashboard administrativo:

usuários;

campanhas;

consumo;

receita;

tarefas;

erros;

status da infraestrutura.

Criar interfaces e estados preparados para backend real.

========================================
10. ARQUITETURA

Use uma arquitetura limpa e modular.

Prioridades:

componentes reutilizáveis;

tipagem;

organização por domínio;

rotas bem estruturadas;

estados bem definidos;

responsividade;

acessibilidade;

boa performance;

código fácil de manter.

Não criar um código monolítico.

Não colocar toda a lógica em um único arquivo.

Preparar claramente os pontos onde futuramente entrarão:

Frontend
↓
API
↓
Supabase
↓
Scheduler
↓
Fila
↓
Workers
↓
Motor de execução

========================================
11. BANCO DE DADOS FUTURO

Mesmo sem conectar o banco agora, organize os modelos pensando em entidades como:

users
profiles
sites
campaigns
campaign_settings
campaign_pages
campaign_sources
campaign_locations
campaign_schedules
plans
subscriptions
credits
credit_transactions
payments
jobs
job_runs
workers
logs

Não é necessário implementar todas as tabelas nesta etapa, mas o frontend deve ser projetado para essa estrutura.

========================================
12. DESIGN

Não copie o design do Robô de Tráfego.

Crie uma identidade visual própria, moderna e profissional para um SaaS tecnológico.

Priorizar:

interface limpa;

dashboard profissional;

boa hierarquia visual;

cards;

tabelas;

gráficos;

indicadores;

formulários organizados;

wizard de criação de campanha;

excelente experiência em desktop;

excelente experiência em mobile.

A interface deve parecer um produto SaaS real e pronto para comercialização.

========================================
13. IMPORTANTE SOBRE O LOVABLE

Tenho poucos créditos disponíveis.

Portanto:

NÃO fique gerando implementações desnecessárias.

NÃO implemente o motor de tráfego nesta primeira etapa.

NÃO implemente workers.

NÃO implemente proxies.

NÃO implemente rotação de IP.

NÃO implemente infraestrutura de execução distribuída.

NÃO tente criar funcionalidades falsas que aparentem estar funcionando com backend real.

O objetivo desta etapa é produzir uma BASE SÓLIDA.

Antes de finalizar, verifique:

todas as páginas existem;

todas as rotas funcionam;

todos os menus possuem destino;

não existem links quebrados;

não existem páginas vazias;

o fluxo de criação de campanha funciona visualmente;

desktop está correto;

mobile está correto;

componentes são reutilizáveis;

a arquitetura está preparada para integração futura com GitHub, Supabase e backend.

IMPORTANTE:

O código deverá permanecer organizado para que, posteriormente, o desenvolvimento possa continuar diretamente pelo repositório GitHub sem precisar reconstruir o frontend.

Não faça alterações fora do escopo desta primeira fase.

Primeiro construa o esqueleto completo e consistente da plataforma.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bcdaf823-8a46-495d-bd7e-cb5679873a0f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
