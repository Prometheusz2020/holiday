# Holiday Project

Este é um projeto web construído com **React (Vite)** no frontend e **Express + Prisma** no backend, utilizando o banco de dados **Neon (PostgreSQL)**.

## 🚀 Como Iniciar

### Pré-requisitos

- Node.js instalado
- Banco de dados PostgreSQL (Neon) configurado

### Configuração

1.  Clone o repositório.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure o arquivo `.env` com as suas credenciais (DATABASE_URL, etc).
4.  Sincronize o banco de dados com o Prisma:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

### Rodando o Projeto

Para rodar o frontend e o backend simultaneamente:

- **Frontend:** `npm run dev`
- **Backend:** `npm run start` (ou `npm run server` para usar nodemon)

---

## 📂 Pasta de Scripts (`/scripts`)

Esta pasta contém scripts utilitários e migrações SQL utilizadas para manutenção e migração de dados.

### Arquivos SQL

- `RUN_IN_SUPABASE.sql`: Scripts legados executados no Supabase.
- `supabase_migration.sql`: Script principal para migração de estrutura do Supabase para o Neon.
- `fix_kiosk_and_realtime.sql`: Ajustes específicos para as funcionalidades de Kiosk e Realtime.
- `fix_security_warnings.sql`: Scripts para correção de permissões e segurança no banco de dados.

### Scripts Node.js

- `import_sql.cjs`: Utilitário para importar arquivos SQL diretamente no banco configurado.
- `migrate_data.cjs`: Script para migração programática de dados entre ambientes.
- `seed_skina.js`: Script de seed para popular o banco com dados iniciais da loja Skina.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React, Vite, Tailwind CSS, Lucide React.
- **Backend:** Node.js, Express, Prisma ORM.
- **Banco de Dados:** PostgreSQL (Neon).
