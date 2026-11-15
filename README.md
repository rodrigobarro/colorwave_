<p align="center">
  <img src="docs/logo.svg" alt="Colorwave" width="300">
</p>

<p align="center">
  Crie e compartilhe paletas de cores, a partir de uma harmonia ou de uma imagem.
</p>

<p align="center">
  <a href="https://colorwave.vercel.app"><img src="https://img.shields.io/badge/site-colorwave.vercel.app-000?logo=vercel" alt="Site"></a>
  <img src="https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs" alt="Next.js 16">
  <img src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/Neon-Postgres-00e599?logo=postgresql&logoColor=white" alt="Neon Postgres">
  <img src="https://img.shields.io/badge/Drizzle-ORM-c5f74f?logo=drizzle&logoColor=black" alt="Drizzle ORM">
</p>

<table>
  <tr>
    <td><img src="docs/gallery.png" alt="Galeria de paletas"></td>
    <td><img src="docs/editor.png" alt="Editor de paletas"></td>
  </tr>
</table>

## O que faz

- **Editor em OKLCH**: parte de uma cor base e uma harmonia (análoga, monocromática, complementar, triádica) ou extrai as cores de uma imagem enviada.
- **Ajuste fino** de luminosidade, croma e matiz, com aviso de cores fora de sRGB.
- **Prévias** da paleta num gradiente, numa landing page, numa planilha e num gráfico.
- **Galeria pública**: as paletas nascem privadas e são publicadas quando o autor quiser.

## Rodando localmente

Requer Node 24 (`nvm use`). Crie um `.env.local` apontando para uma branch de desenvolvimento do Neon, nunca a de produção:

```bash
DATABASE_URL="string com pooling, usada pelo app"
DATABASE_URL_UNPOOLED="string sem pooling, usada nas migrações"
DATABASE_NEON_AUTH_BASE_URL="URL de Auth da mesma branch do Neon"
NEON_AUTH_COOKIE_SECRET="saída de: openssl rand -base64 32"
```

```bash
npm install
npm run db:migrate
npm run dev      # http://localhost:3000
npm test
```

Depois de alterar `src/db/schema.ts`, rode `npm run db:generate` e `npm run db:migrate`. O `npm run build` aplica as migrações pendentes, então cada deploy na Vercel migra o banco do próprio ambiente. Lá, as três primeiras variáveis vêm da integração com o Neon. O `NEON_AUTH_COOKIE_SECRET` é criado à mão, com um valor diferente do local.
