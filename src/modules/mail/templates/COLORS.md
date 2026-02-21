# Cores do Template de Email - ARU CRM

Este documento descreve as cores utilizadas nos templates de email do ARU CRM, alinhadas com o tema do frontend.

## Paleta de Cores

### Cores Primárias

- **Primary (Azul)**: `#2563eb` (blue-600)
  - Usado para: Botões principais, links, destaques
  - Hover: `#1d4ed8` (blue-700)

- **Secondary (Ciano/Azul Claro)**: `#06b6d4` (cyan-500)
  - Usado para: Gradientes, elementos secundários
  - Combinado com primary no gradiente do header

### Cores Neutras

- **Texto Principal**: `#1f2937` (gray-800)
- **Texto Secundário**: `#374151` (gray-700)
- **Texto Terciário**: `#4b5563` (gray-600)
- **Texto Desabilitado**: `#6b7280` (gray-500)
- **Texto Footer**: `#9ca3af` (gray-400)

- **Fundo Principal**: `#ffffff` (branco)
- **Fundo Secundário**: `#f9fafb` (gray-50)
- **Fundo Body**: `#f5f5f5` (gray-100)

- **Bordas**: `#e5e7eb` (gray-200)

### Cores de Estado

- **Warning (Aviso)**: `#f59e0b` (amber-500)
  - Fundo: `#fef3c7` (amber-100)
  - Texto: `#92400e` (amber-800)
  - Usado para: Mensagens de aviso importantes

- **Success (Sucesso)**: `#10b981` (green-500)
  - Disponível para uso em futuros templates

- **Error (Erro)**: `#ef4444` (red-500)
  - Disponível para uso em futuros templates

- **Info (Informação)**: `#3b82f6` (blue-500)
  - Disponível para uso em futuros templates

## Gradientes

### Header Gradient
```css
background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
```
- Combina primary (azul) com secondary (ciano)
- Usado no cabeçalho do email

## Uso no Template

### Botão Primário
```html
background-color: #2563eb;
color: #ffffff;
border-radius: 8px;
padding: 14px 32px;
```

### Card/Container
```html
background-color: #ffffff;
border-radius: 16px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
```

### Mensagem de Aviso
```html
background-color: #fef3c7;
border-left: 4px solid #f59e0b;
color: #92400e;
```

## Compatibilidade com Email Clients

As cores foram escolhidas considerando:
- Suporte amplo em clientes de email (Gmail, Outlook, Apple Mail, etc.)
- Contraste adequado para acessibilidade (WCAG AA)
- Renderização consistente em modo claro e escuro

## Notas

- Os valores hexadecimais são baseados no sistema de cores Tailwind CSS
- As cores seguem o mesmo padrão do frontend para consistência visual
- Para novos templates, use esta paleta como referência
