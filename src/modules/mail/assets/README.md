# Email Assets

Esta pasta contém assets estáticos para uso nos templates de email (logos, imagens, etc.).

## Como usar nos templates Handlebars

### Opção 1: Base64 inline (Recomendado para emails)

Use o helper `assetBase64` para converter a imagem para base64 e incluir diretamente no HTML:

```handlebars
<img src="{{assetBase64 "logo.png"}}" alt="Logo" style="max-width: 200px;">
```

**Vantagens:**
- Funciona mesmo quando o cliente de email bloqueia imagens externas
- Não requer servidor para servir os arquivos
- Melhor compatibilidade com clientes de email

### Opção 2: URL pública (Opcional)

Se você configurar o servidor para servir assets estaticamente, pode usar:

```handlebars
<img src="{{assetUrl "logo.png"}}" alt="Logo" style="max-width: 200px;">
```

**Requisitos:**
- Configurar `MAIL_ASSETS_BASE_URL` nas variáveis de ambiente
- Servir os assets via HTTP (ex: `/mail-assets/logo.png`)

## Formatos suportados

- PNG (`.png`)
- JPEG (`.jpg`, `.jpeg`)
- GIF (`.gif`)
- SVG (`.svg`)
- WebP (`.webp`)

## Exemplo de uso completo

```handlebars
{{#if (assetBase64 "logo.png")}}
<div style="text-align: center; margin-bottom: 24px;">
  <img src="{{assetBase64 "logo.png"}}" alt="Logo" style="max-width: 200px; height: auto;">
</div>
{{/if}}
```

## Nota

Os arquivos desta pasta são copiados automaticamente para `dist/modules/mail/assets/` durante o build.
