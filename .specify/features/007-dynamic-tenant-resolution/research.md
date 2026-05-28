# Technical Research: Identificação Dinâmica de Inquilinos

Esta pesquisa técnica detalha as decisões de engenharia, mecanismos de rede e estratégias de frontend necessárias para implementar a identificação do inquilino baseada em subdomínio no monorepo Retail SaaS.

---

## 🔍 1. Resolução de Subdomínio no Frontend

No ambiente de desenvolvimento e em produção, precisamos identificar o slug do inquilino a partir do host acessado.

### Mecanismo de Parsing no Angular
Utilizaremos `window.location.hostname` no componente de Login para extrair a primeira seção do domínio:

```typescript
// Exemplo de utilitário de resolução de slug
export function getTenantSlugFromHost(hostname: string): string | null {
  const parts = hostname.split('.');
  
  // Se for localhost (ex: loja-demo.localhost) ou domínio completo (ex: loja-demo.retailsaas.com)
  if (parts.length > 1) {
    const subdomain = parts[0];
    
    // Ignorar subdomínios de infraestrutura comuns como 'www', 'app', 'api'
    const ignoredSubdomains = ['www', 'app', 'api', 'admin'];
    if (ignoredSubdomains.includes(subdomain.toLowerCase())) {
      return null;
    }
    
    return subdomain;
  }
  
  return null;
}
```

### Fallback para Desenvolvimento Local
Para que os desenvolvedores possam testar o fluxo localmente no endereço `localhost:4200` sem configurar DNS/hosts locais adicionais, suportaremos a passagem do slug opcionalmente como um query parameter de desenvolvimento (ex: `http://localhost:4200/login?tenant=loja-demo`).

---

## 🎨 2. Injeção Dinâmica de Tema (Tailwind CSS + Variáveis CSS)

Para aplicar as cores customizadas retornadas do backend sem compilar múltiplos arquivos de estilo, utilizaremos **Variáveis CSS** nativas mapeadas no arquivo de configuração do Tailwind CSS.

### Configuração CSS (Global Styles)
No arquivo global `styles.css` do frontend, declaramos as variáveis padrão:

```css
:root {
  --tenant-primary-color: #3b82f6; /* Default Blue-500 */
  --tenant-accent-color: #1d4ed8;  /* Default Blue-700 */
}
```

### Configuração do Tailwind (`tailwind.config.js`)
Configuramos as cores da marca para apontar para as variáveis CSS:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--tenant-primary-color)',
          accent: 'var(--tenant-accent-color)',
        }
      }
    }
  }
}
```

### Injeção Dinâmica via TypeScript
Quando a resposta do backend retornar as cores do tenant (ex: `settings.theme.primaryColor`), injetamos as variáveis no estilo do elemento raiz do documento:

```typescript
applyTenantTheme(primaryColor: string, accentColor: string) {
  document.documentElement.style.setProperty('--tenant-primary-color', primaryColor);
  document.documentElement.style.setProperty('--tenant-accent-color', accentColor);
}
```

Dessa forma, classes Tailwind como `bg-brand-primary` ou `text-brand-accent` se adaptarão instantaneamente à marca do inquilino logado!

---

## 🔒 3. Análise de Segurança do Endpoint Público

### Isolamento Estrito de Dados
O endpoint `GET /auth/tenants/by-slug/:slug` deve ser estritamente público, mas deve retornar **apenas** informações de identidade visual pública.

* **Campos Permitidos:** `id`, `name`, `slug`, `logoUrl`, `active`, `settings.theme` (primaryColor, accentColor).
* **Campos Proibidos:** Configurações de banco de dados, chaves de webhook, planos de faturamento, credenciais, segredos do Mailer, logs de sistema, listagem de funcionários.

### Tratamento do Campo JSON `settings`
No Prisma/NestJS, filtraremos e mapearemos o retorno utilizando um DTO de saída específico (`PublicTenantOutput`), garantindo que apenas a seção `theme` do campo genérico `settings` seja exposta ao cliente.
