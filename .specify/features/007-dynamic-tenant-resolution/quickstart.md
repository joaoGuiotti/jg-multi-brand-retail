# Quickstart: Verificando a Resolução de Inquilino

Este guia orienta sobre como rodar e testar manualmente a identificação dinâmica de inquilinos em ambiente local de desenvolvimento.

---

## 🎲 1. Configurando Dados de Teste (Banco de Dados)

Certifique-se de ter um tenant cadastrado no banco com configurações estéticas populadas. Você pode rodar a seed original ou popular manualmente no banco de dados local via Prisma Studio:

```bash
cd apps/backend
npx prisma studio
```

### Exemplo de Configuração de um Tenant de Teste:
- **name**: `Loja Incrível`
- **slug**: `loja-incrivel`
- **logoUrl**: `https://images.unsplash.com/photo-1599305445671-ec2c6c34a86d?w=128&h=128&fit=crop`
- **active**: `true`
- **settings**:
  ```json
  {
    "theme": {
      "primaryColor": "#e11d48",
      "accentColor": "#9f1239"
    }
  }
  ```

---

## 🏃 2. Rodando o Projeto Localmente

Suba os servidores do backend e do frontend na raiz do projeto:

```bash
npm run dev
```

- **Frontend:** http://localhost:4200
- **Backend:** http://localhost:3000

---

## 🧪 3. Cenários de Teste Manual

### Cenário 1: Testando com Parâmetro de URL (Sem DNS)
A forma mais simples de testar localmente sem alterar o arquivo `hosts` do seu sistema operacional é através do query parameter:

1. Acesse: `http://localhost:4200/login?tenant=loja-incrivel`
2. **Resultado esperado:** O layout de login deve mudar para um estilo avermelhado (rose), exibindo o logo mockup e a saudação: *"Entrar em Loja Incrível"*.

---

### Cenário 2: Testando com Subdomínios (Loopback de DNS)
Navegadores modernos tratam subdomínios do domínio `localhost` apontando de volta para a sua máquina física de forma automática.

1. Acesse: `http://loja-incrivel.localhost:4200/login`
2. **Resultado esperado:** A tela deve carregar instantaneamente o tema vermelho da `Loja Incrível` baseando-se estritamente na URL, sem necessidade de query parameters adicionais!

---

### Cenário 3: Inquilino Inexistente (Fallback)
1. Acesse: `http://loja-fantasma.localhost:4200/login`
2. **Resultado esperado:** A tela deve reverter automaticamente para o tema azul clássico e exibir o logotipo original do "Retail SaaS".
