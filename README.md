# Colorwave

Crie e compartilhe paletas de cores.

## Desenvolvimento

Requer Node 24 (`nvm use` lê a versão do `.nvmrc`).

Crie um `.env.local` com a conexão de uma branch de desenvolvimento do Neon, nunca a de produção:

```bash
DATABASE_URL="string com pooling, usada pelo app"
DATABASE_URL_UNPOOLED="string sem pooling, usada nas migrações"
```

```bash
npm install
npm run db:migrate
npm run dev
```

O site abre em [http://localhost:3000](http://localhost:3000).

## Banco de dados

O schema fica em `src/db/schema.ts`. Depois de alterá-lo, gere a migração e aplique:

```bash
npm run db:generate
npm run db:migrate
```

O `npm run build` aplica as migrações pendentes antes de compilar, então cada deploy da Vercel migra o banco do seu ambiente.
