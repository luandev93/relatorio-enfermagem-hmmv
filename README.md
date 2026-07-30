# 🏥 Sistema de Relatório da Equipe de Enfermagem — Hospital Municipal Maria Veneri (HMMV)

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase_Firestore-Cloud_Database-FFCA28?logo=firebase&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)

Aplicação web completa, responsiva e segura desenvolvida para a gestão, acompanhamento e registro de **Relatórios de Plantão de Enfermagem (12h)**, gestão de equipe, escalas de trabalho e controle de acessos no **Hospital Municipal Maria Veneri**.

---

## 🚀 Funcionalidades Principais

- **🔐 Autenticação e Controle de Acesso por Perfil:**
  - Login individual por Usuário/PIN com validação em tempo real.
  - Permissões diferenciadas para Enfeimeiros(as), Técnicos(as) e Coordenadores/Administradores.
  - Troca de senha obrigatória no primeiro acesso.

- **📝 Registro e Gestão de Relatórios de Plantão (12h):**
  - Formulário guiado com cálculo automático de leitos e censo de pacientes.
  - Checklist estruturado de intercorrências por setor (Emergência, UTI, Enfermarias, Cirúrgico, etc.).
  - Sistema de assinaturas e coautoria com conferência da coordenação.
  - Notas privativas (Técnico e Enfermeiro) com controle de visibilidade.

- **📊 Dashboard de Indicadores e Filtros Avançados:**
  - Visualização gráfica de movimentações (internações, altas, transferências, óbitos).
  - Busca rápida por data, turno, enfermeiro responsável ou setor.
  - Exportação de relatórios em formato limpo pronto para impressão/PDF.

- **📅 Gestão de Escalas e Aniversariantes:**
  - Calendário interativo de escala de plantões por profissional e cor.
  - Aba de aniversariantes do mês para acompanhamento da equipe.

- **☁️ Integração com Google Firebase Firestore:**
  - Persistência contínua na nuvem via **Firestore (`relatorio-hmmv`)**.
  - Fallback automático para armazenamento local no navegador (`localStorage`) em caso de indisponibilidade.
  - Sincronização em lote bidirecional com regras de segurança publicadas.
  - Painel administrativo do Firebase reservado apenas para perfis Administradores/Coordenadores.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Função no Projeto |
| :--- | :--- |
| **React 18** | Biblioteca principal para interface de usuário reativa |
| **TypeScript** | Tipagem estática para garantia de consistência nos dados de saúde |
| **Tailwind CSS** | Estilização utilitária moderna com esquema visual corporativo hospitalar |
| **Firebase Firestore** | Banco de dados NoSQL em nuvem em tempo real |
| **Lucide React** | Conjunto de ícones vetoriais modernos |
| **Vite** | Bundler rápido para desenvolvimento frontend |

---

## 📁 Estrutura do Projeto

```text
/
├── firebase-blueprint.json    # Esquema e estrutura das entidades no Firestore
├── firestore.rules            # Regras de segurança e permissões do banco Firestore
├── src/
│   ├── types/
│   │   └── nursing.ts         # Definições de interfaces e tipos do domínio médico
│   ├── lib/
│   │   ├── firebase.ts        # Cliente Firestore e operações CRUD
│   │   └── supabase.ts        # Auxiliares de compatibilidade / armazenamento
│   ├── components/
│   │   ├── AuthScreen.tsx            # Tela de Login e PIN
│   │   ├── Dashboard.tsx             # Visão geral de relatórios e métricas
│   │   ├── ShiftReportForm.tsx       # Formulário completo de plantão de 12h
│   │   ├── ReportDetailModal.tsx     # Visualização e conferência detalhada
│   │   ├── UserManagementModal.tsx   # Gestão da equipe (CRUD de usuários)
│   │   ├── ScheduleCalendarTab.tsx   # Escala visual de trabalho
│   │   ├── BirthdaysTab.tsx          # Aniversariantes da equipe
│   │   ├── FirebaseModal.tsx         # Modal de status/sync do Firebase (Admin)
│   │   └── Header.tsx                # Cabeçalho com indicador de perfil e ações
│   ├── App.tsx                       # Componente raiz e gerenciador de estado global
│   └── main.tsx                      # Ponto de entrada da aplicação
└── DOCUMENTACAO_CODIGO.md     # Guia detalhado de estudo e arquitetura do código
```

---

## ⚙️ Como Executar Localmente

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** ou **bun**

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/relatorio-hmmv.git
   cd relatorio-hmmv
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Executar em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em `http://localhost:3000`.

4. **Gerar a versão de produção (Build):**
   ```bash
   npm run build
   ```

---

## 📖 Guia de Estudo do Código

Para explorar detalhadamente o funcionamento de cada módulo, tipos de dados e funções para fins de estudo ou entrevista técnica, consulte o arquivo **[`DOCUMENTACAO_CODIGO.md`](./DOCUMENTACAO_CODIGO.md)**.

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de gestão interna hospitalar.
