# Technical Decisions & Research: 008-loyalty-cashback

Este documento detalha as decisões técnicas arquiteturais tomadas para garantir a **segurança financeira, performance e integridade** do Módulo de Fidelidade e Cashback do **Retail OS**.

---

## 📐 Decisão 1: Lógica de Arredondamento no Acúmulo de Pontos

**Contexto:** Ao realizar o cálculo de pontos de fidelidade gerados por uma compra líquida (ex: venda de R$ 15,60 com fator de acúmulo 1:1), qual deve ser a precisão matemática?

* **Decisão:** O sistema aplicará **arredondamento matemático para baixo** (*floor* / truncamento de inteiros).
  * Exemplo: R$ 15,60 gastos = 15 pontos acumulados (não 16).
* **Justificativa:** 
  1. **Conservadorismo Financeiro:** Evita que a loja emita frações de centavos a mais em descontos, protegendo a margem do lojista contra manipulações de valores pequenos.
  2. **Simplicidade do Saldo:** O saldo de pontos é armazenado estritamente como um número inteiro (`Int`) no banco de dados, reduzindo a complexidade de query e overhead de pontos fracionados.

---

## 🔒 Decisão 2: Prevenção de Fraude por Duplo Resgate (Race Condition)

**Contexto:** Um cliente malicioso pode abrir o aplicativo em dois PDVs da mesma loja física ao mesmo tempo. Se ambos os caixas finalizarem a venda resgatando os mesmos 500 pontos de forma simultânea (no mesmo milissegundo), o cliente poderia obter R$ 10,00 de desconto gastando apenas 500 pontos se o banco não bloquear a concorrência.

* **Decisão:** Implementação de **Trava Pessimista de Escrita (Pessimistic Locking)** em nível de banco de dados PostgreSQL usando o Prisma `$transaction` e travas de linha.
* **Mecanismo:**
  No backend NestJS, a consulta de verificação de saldo e a atualização do saldo devem ocorrer dentro de uma transação serializada do Prisma, bloqueando a linha da conta corrente do cliente:
  ```typescript
  await this.prisma.$transaction(async (tx) => {
    // 1. Busca a conta corrente aplicando LOCK de escrita
    const account = await tx.$queryRaw<LoyaltyAccount[]>`
      SELECT * FROM loyalty_accounts 
      WHERE tenant_id = ${tenantId} AND customer_id = ${customerId} 
      FOR UPDATE
    `;
    
    // 2. Valida se o saldo é suficiente no backend
    if (account[0].balance < pointsNeeded) {
      throw new BadRequestException('Saldo de pontos insuficiente');
    }

    // 3. Executa o débito
    await tx.loyaltyAccount.update({ ... });
  });
  ```
* **Justificativa:** Em sistemas de checkout financeiro, a integridade do saldo deve ser garantida no nível do banco para evitar fraudes em redes distribuídas multi-caixas.

---

## 🔄 Decisão 3: Tratamento de Saldo Negativo em Devoluções

**Contexto:** O que acontece quando um cliente faz uma compra de R$ 500,00 (ganha 500 pontos), gasta esses 500 pontos no dia seguinte em outra compra, e no terceiro dia solicita a devolução (RMA) da primeira compra de R$ 500,00?

* **Decisão:** O sistema deve **permitir saldo negativo** temporário na conta de fidelidade do cliente ao processar a devolução.
  * Exemplo: Saldo atual 0 pontos. Ao devolver a venda que originou 500 pontos, o sistema debita 500 pontos, deixando a conta com saldo de `-500` pontos.
* **Justificativa:** 
  1. **Prevenção a Fraudes:** Impede o golpe clássico do varejo em que o cliente compra um produto caro para resgatar o cashback e depois devolve o produto para receber o estorno total em dinheiro, mantendo o desconto obtido.
  2. **Recuperação Automática:** As compras subsequentes do cliente irão gradativamente abater o saldo negativo até voltar a ficar positivo, sem a necessidade de intervenção do gerente ou bloqueio da conta corrente.
