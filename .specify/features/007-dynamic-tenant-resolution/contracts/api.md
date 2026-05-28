# API Contract: Resolução Pública de Tenant

Este documento especifica o contrato do endpoint público de resolução de dados estéticos do inquilino.

---

## 🎯 1. Rota de Resolução de Tenant

Retorna informações de branding visual do tenant para personalização da tela de login pré-autenticação.

* **Método:** `GET`
* **Caminho:** `/api/v1/auth/tenants/by-slug/:slug`
* **Autenticação Requerida:** Nenhuma (Endpoint Público)

---

## 📥 2. Parâmetros de Requisição

### Parâmetros de Path (Caminho):
- `slug` (String, obrigatório): O slug identificador do inquilino (ex: `loja-demo`).

---

## 📤 3. Respostas da API

### Resposta: `200 OK` (Tenant Encontrado e Ativo)
Retorna os dados visuais públicos do inquilino.

```json
{
  "id": "11a47318-7bb7-4cfb-a01c-6d9b1c97a829",
  "name": "Loja Demo",
  "slug": "loja-demo",
  "logoUrl": "https://url-imagem.com/logo.png",
  "active": true,
  "theme": {
    "primaryColor": "#10b981",
    "accentColor": "#047857"
  }
}
```

---

### Resposta: `200 OK` (Tenant Encontrado, porém Inativo)
Retorna os dados com o campo `active: false`. O frontend deve usar esta resposta para renderizar o logotipo do inquilino, mas bloquear qualquer tentativa de entrada e exibir a mensagem de suspensão.

```json
{
  "id": "11a47318-7bb7-4cfb-a01c-6d9b1c97a829",
  "name": "Loja Demo Suspensa",
  "slug": "loja-demo",
  "logoUrl": "https://url-imagem.com/logo.png",
  "active": false,
  "theme": {
    "primaryColor": "#10b981",
    "accentColor": "#047857"
  }
}
```

---

### Resposta: `404 Not Found` (Tenant Não Encontrado)
Retorna se o slug fornecido não corresponder a nenhuma loja registrada no banco de dados.

```json
{
  "statusCode": 404,
  "message": "Tenant with slug 'slug-inexistente' not found",
  "error": "Not Found"
}
```
