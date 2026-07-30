# 📚 Guia de Estudo e Arquitetura do Código — HMMV

Este documento serve como guia de estudo para compreender em detalhes cada componente, estrutura de dados e fluxo de execução do sistema **Relatório de Enfermagem do Hospital Municipal Maria Veneri**.

---

## 📑 Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Estrutura de Tipos (`src/types/nursing.ts`)](#2-estrutura-de-tipos-srctypesnursingts)
3. [Módulo de Persistência no Firebase (`src/lib/firebase.ts`)](#3-módulo-de-persistência-no-firebase-srclibfirebasets)
4. [Gerenciamento de Estado Global (`src/App.tsx`)](#4-gerenciamento-de-estado-global-srcapptsx)
5. [Componentes da Interface (`src/components/`)](#5-componentes-da-interface-srccomponents)
   - [AuthScreen.tsx](#authscreentsx)
   - [Header.tsx](#headertsx)
   - [Dashboard.tsx](#dashboardtsx)
   - [ShiftReportForm.tsx](#shiftreportformtsx)
   - [ReportDetailModal.tsx](#reportdetailmodaltsx)
   - [UserManagementModal.tsx](#usermanagementmodaltsx)
   - [ScheduleCalendarTab.tsx & BirthdaysTab.tsx](#schedulecalendartabtsx--birthdaystabtsx)
   - [FirebaseModal.tsx](#firebasemodaltsx)
6. [Fluxo de Sincronização e Fallback (LocalStorage + Firestore)](#6-fluxo-de-sincronização-e-fallback)
7. [Boas Práticas e Conceitos Importantes para Entrevistas](#7-boas-práticas-e-conceitos-importantes-para-entrevistas)

---

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura **Single Page Application (SPA)** construída com **React 18** e **TypeScript**, otimizada para ser extremamente ágil e confiável mesmo em cenários de instabilidade de rede hospitalar.

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          Interface do Usuário                          │
│        (React Components + Tailwind CSS + Lucide React Icons)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Estado Reativo Central (App.tsx)                   │
│         - currentUser    - reports    - users    - schedule            │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐ ┌───────────────────────────────┐
│       Google Firebase Firestore       │ │   Navegador (LocalStorage)    │
│  (Persistência Nuvem em Tempo Real)  │ │ (Fallback e Cache Offline)   │
└──────────────────────────────────────┘ └───────────────────────────────┘
```

---

## 2. Estrutura de Tipos (`src/types/nursing.ts`)

A tipagem forte com TypeScript garante segurança no manuseio das informações clínicas e de prontuário.

### Tipos Principais:
1. **`Role`**: Enumeração dos cargos da equipe (`'Enfermeiro(a)'`, `'Técnico(a) de Enfermagem'`, `'Coordenador(a) de Enfermagem'`, `'Admin'`).
2. **`User`**: Representa um membro da equipe com ID, nome, cargo, COREN, data de nascimento, username e PIN criptografado/hasheado.
3. **`ShiftReport`**: Entidade principal que consolida as 12 horas de plantão:
   - `movement`: Leitos ocupados, vagas, internações, transferências, altas e óbitos.
   - `checklist`: Lista de verificação de insumos, equipamentos e rotinas do setor.
   - `complements`: Adendos e observações inseridas após o fechamento do plantão.
   - `viewReceipts`: Registro de leitura/recebimento assinado por outros enfermeiros que assumiram o turno.
   - `coordinatorConference`: Registro de vistoria do coordenador do setor.

---

## 3. Módulo de Persistência no Firebase (`src/lib/firebase.ts`)

Este arquivo inicializa a SDK do Firebase Firestore e expõe rotinas assíncronas assinaladas com `async/await`.

### Principais Funções:
- **`fetchReportsFromFirebase()`**: Executa `getDocs()` ordenado por data descendente para recuperar relatórios do Firestore.
- **`saveReportToFirebase(report)`**: Utiliza `setDoc()` com `{ merge: true }` para criar ou atualizar (upsert) relatórios sem sobrescrever campos não enviados.
- **`syncAllLocalToFirebase(users, reports, schedules)`**: Utiliza `writeBatch(db)` para enviar múltiplas coleções em uma única transação atômica, garantindo consistência e reduzindo requisições na rede.

---

## 4. Gerenciamento de Estado Global (`src/App.tsx`)

O `App.tsx` atua como o **Orquestrador Central** do sistema:
- Mantém a sessão do usuário ativo (`currentUser`).
- Gerencia o carregamento inicial: tenta ler os dados do Firestore e, caso haja desconexão, lê os dados salvos no `localStorage`.
- Sempre que uma alteração ocorre (ex: novo relatório salvo), o estado do React é atualizado reativamente e a mudança é replicada tanto no Firestore quanto no `localStorage`.

---

## 5. Componentes da Interface (`src/components/`)

### `AuthScreen.tsx`
- Gerencia a tela de login via ID de Usuário e PIN numérico.
- Oferece teclado numérico em tela otimizado para dispositivos móveis ou tablets no posto de enfermagem.

### `Header.tsx`
- Exibe o cabeçalho oficial do hospital.
- Mostra o perfil ativo e botões de atalho.
- **Regra de segurança:** O botão de acesso ao modal de configuração do Firebase só é visível quando o `currentUser` tem papel de **Administrador ou Coordenador**.

### `Dashboard.tsx`
- Painel principal com relatórios ordenados cronologicamente.
- Permite filtrar por data, turno e buscar por nome de profissional ou resumo de intercorrência.
- Oferece ação rápida para ler detalhes, assinar ciência ou gerar versão para impressão.

### `ShiftReportForm.tsx`
- Formulário dinâmico dividido em seções claras:
  1. Identificação do Plantão (Data, Turno, Setor, Enfermeiros).
  2. Movimentação e Censo de Leitos (cálculos automáticos).
  3. Checklist de Equipamentos e Insumos.
  4. Síntese do Plantão e Intercorrências.
  5. Notas Privativas (Enfermeiro/Técnico).

### `ReportDetailModal.tsx`
- Modal de leitura detalhada do plantão.
- Permite a enfermeiros de turnos subsequentes assinarem o recebimento/ciência do relatório.
- Permite à coordenação registrar a vistoria e conferência oficial.

### `UserManagementModal.tsx`
- Modal administrativo para criar, editar ou desativar usuários da equipe.
- Redefinição de PINs de acesso e atribuição de cargos/COREN.

### `FirebaseModal.tsx`
- Painel exclusivo para Administradores.
- Exibe o status da conexão com a nuvem, ID do projeto no Firebase (`relatorio-hmmv`), regras de segurança ativas e estatísticas de registros.
- Permite disparar a sincronização forçada de dados locais para o Firestore.

---

## 6. Fluxo de Sincronização e Fallback

```text
[Usuário Salva Relatório]
        │
        ├──► 1. Atualiza Estado React (`setReports(...)`) ──► UI Atualizada Instantaneamente
        │
        ├──► 2. Tenta `saveReportToFirebase(report)` (Nuvem Firestore)
        │       └─ OK ──► Salvo no banco seguro na nuvem
        │
        └──► 3. Salva no `localStorage` (Backup Offline no Navegador)
```

Essa abordagem híbrida garante **disponibilidade contínua**: a equipe nunca perde um relatório mesmo em quedas temporárias de internet no hospital.

---

## 7. Boas Práticas e Conceitos Importantes para Entrevistas

Se você for apresentar este projeto no seu portfólio do GitHub ou em entrevistas técnicas, destaque os seguintes pontos:

1. **TypeScript Restrito**: Uso de interfaces fortemente tipadas para representar entidades reais da saúde.
2. **Resiliência e Offline-First**: Implementação de cache duplo com LocalStorage e suporte a Firestore em nuvem.
3. **Controle de Acesso Baseado em Funções (RBAC)**: Exibição condicional de recursos (ex: Firebase Admin apenas para Coordenadores/Admins).
4. **Clean Code & Modularidade**: Separação clara entre camada de apresentação (`components/`), camada de dados (`types/`) e camada de serviços (`lib/`).
5. **Acessibilidade e UX Hospitalar**: Cores de alto contraste em tons de verde hospitalar (`emerald`), azul escuro e botões grandes fáceis de tocar em plantões.
