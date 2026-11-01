# Jusintegra: página de links para advogado

Site estático (HTML, CSS e JavaScript). Não precisa de servidor, banco de dados nem pagamento.

## Arquivos

| Arquivo | Para que serve |
|---|---|
| `index.html` | Estrutura da página |
| `style.css` | Cores e visual |
| `script.js` | Lógica da busca inteligente |
| `links.json` | **Onde você edita nome, OAB, links e áreas** |

## Como editar os links

Abra `links.json` e troque os dados. Cada item segue este modelo:

```json
{
  "titulo": "Direito Trabalhista",
  "descricao": "Demissão, horas extras, verbas rescisórias",
  "url": "https://seusite.com/trabalhista",
  "categoria": "Áreas de atuação",
  "palavras": ["clt", "emprego", "demissao", "fgts"]
}
```

- `palavras`: termos que ajudam a busca a achar o link (sinônimos, gírias do cliente).
- Para adicionar um link, copie um bloco inteiro, separe por vírgula e edite.
- Para a busca entender termos novos ligados às suas áreas, edite a lista `GRUPOS_SINONIMOS` no topo de `script.js`.

## Como a busca inteligente funciona

1. Remove acentos e maiúsculas (`demissão` = `DEMISSAO`).
2. Expande a palavra com sinônimos (`demitido` também busca `rescisão`, `CLT`).
3. Aceita erros pequenos de digitação (`divorio` encontra `divórcio`).
4. Ordena os resultados pela relevância.

Tudo acontece no navegador, sem custo e sem enviar dados do visitante para terceiros.

## Testar no seu computador

Basta dar dois cliques em `index.html`. Se a página não carregar os links pelo duplo clique (alguns navegadores bloqueiam `fetch` local), rode um servidor simples na pasta:

```bash
python3 -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Publicar no GitHub Pages (gratuito)

1. Entre em github.com e crie uma conta, se ainda não tiver.
2. Instale o GitHub CLI (`gh`) e faça login:
   ```bash
   gh auth login
   ```
3. Dentro da pasta do site, rode:
   ```bash
   git init -b main
   git add .
   git commit -m "Site inicial Jusintegra"
   gh repo create jusintegra-site --public --source=. --push
   ```
4. No GitHub, abra o repositório > **Settings** > **Pages**.
5. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`, e clique em **Save**.
6. Em alguns minutos, o site estará em `https://SEU-USUARIO.github.io/jusintegra-site/`.

Para atualizar depois: edite o `links.json`, depois rode `git add . && git commit -m "Atualiza links" && git push`.

## Domínio próprio (opcional)

Compre um domínio, por exemplo `jusintegra.com.br`, e em **Settings > Pages > Custom domain** informe o endereço. Depois configure no seu registrador um registro CNAME apontando para `SEU-USUARIO.github.io`.

## Antes de publicar

- Confirme o número do WhatsApp e os links reais no `links.json`.
- Revise os textos de áreas de atuação. A publicidade de advogado precisa seguir o Código de Ética e o Provimento 205/2021 da OAB. Conteúdo informativo e sem promessa de resultado é o caminho mais seguro.
- O rodapé já inclui aviso de que o conteúdo não é aconselhamento jurídico.
