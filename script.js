// ---------- Utilidades de texto ----------

const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "um", "uma", "com", "para", "por",
  "o", "a", "e", "em", "que", "meu", "minha", "eu", "me", "sou", "tenho"
]);

// Grupos de termos relacionados. Adicione os seus aqui.
const GRUPOS_SINONIMOS = [
  ["trabalhista", "clt", "emprego", "demissao", "demitido", "demitir", "rescisao", "funcionario", "empregado", "patrao", "salario", "ferias", "fgts", "horas extras"],
  ["familia", "divorcio", "separacao", "casamento", "pensao", "alimentos", "guarda", "filhos", "uniao estavel"],
  ["sucessoes", "inventario", "heranca", "herdeiro", "testamento", "partilha", "falecimento", "morte", "espolio"],
  ["previdenciario", "inss", "aposentadoria", "aposentar", "auxilio", "beneficio", "bpc", "loas", "pensao por morte"],
  ["consumidor", "cdc", "cobranca", "cobrancas", "negativado", "negativacao", "serasa", "spc", "defeito", "garantia", "banco"],
  ["contato", "whatsapp", "zap", "falar", "atendimento", "consulta", "agendar", "orcamento", "valor", "preco", "custo"]
];

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function tokenizar(texto) {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

// Distância de Levenshtein (quantas trocas separam duas palavras)
function distancia(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 1) return 2; // atalho: já sabemos que é maior que 1
  const linha = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let anterior = linha[0];
    linha[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = linha[j];
      linha[j] = a[i - 1] === b[j - 1]
        ? anterior
        : 1 + Math.min(anterior, linha[j], linha[j - 1]);
      anterior = temp;
    }
  }
  return linha[n];
}

// Expande cada palavra digitada com seus sinônimos (com peso menor)
function expandirTermos(tokens) {
  const termos = [];
  for (const token of tokens) {
    termos.push({ texto: token, fator: 1 });
    for (const grupo of GRUPOS_SINONIMOS) {
      const grupoNormalizado = grupo.map(normalizar);
      const achou = grupoNormalizado.some(g => g === token || (token.length >= 4 && g.startsWith(token)));
      if (achou) {
        grupoNormalizado.forEach(sin => {
          termos.push({ texto: sin, fator: 0.6 });
        });
      }
    }
  }
  return termos;
}

// ---------- Pontuação ----------

function pontuar(link, termos) {
  const campos = [
    { tokens: tokenizar(link.titulo), peso: 3 },
    { tokens: (link.palavras || []).flatMap(tokenizar), peso: 2 },
    { tokens: tokenizar(link.descricao || ""), peso: 1.5 },
    { tokens: tokenizar(link.categoria || ""), peso: 1 }
  ];

  let total = 0;
  for (const termo of termos) {
    let melhor = 0;
    for (const campo of campos) {
      for (const t of campo.tokens) {
        let pontos = 0;
        if (t === termo.texto) {
          pontos = campo.peso;
        } else if (termo.texto.length >= 3 && t.startsWith(termo.texto)) {
          pontos = campo.peso * 0.8;
        } else if (termo.texto.length >= 5 && distancia(t, termo.texto) <= 1) {
          pontos = campo.peso * 0.5; // tolera erro de digitação
        }
        melhor = Math.max(melhor, pontos);
      }
    }
    total += melhor * termo.fator;
  }
  return total;
}

function buscar(consulta, links) {
  const tokens = tokenizar(consulta);
  if (tokens.length === 0) return null; // sem busca: mostrar tudo

  const termos = expandirTermos(tokens);
  return links
    .map(link => ({ link, score: pontuar(link, termos) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.link);
}

// ---------- Renderização (sem innerHTML, para evitar injeção) ----------

function criarCard(link) {
  const a = document.createElement("a");
  a.className = "link";
  a.href = link.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  const titulo = document.createElement("strong");
  titulo.textContent = link.titulo;
  a.appendChild(titulo);

  if (link.descricao) {
    const desc = document.createElement("span");
    desc.textContent = link.descricao;
    a.appendChild(desc);
  }
  return a;
}

function renderizarGrupos(links) {
  const container = document.getElementById("resultados");
  container.replaceChildren();

  const grupos = {};
  links.forEach(link => {
    const cat = link.categoria || "Outros";
    (grupos[cat] = grupos[cat] || []).push(link);
  });

  Object.keys(grupos).forEach(cat => {
    const bloco = document.createElement("div");
    bloco.className = "grupo";
    const h2 = document.createElement("h2");
    h2.textContent = cat;
    bloco.appendChild(h2);
    grupos[cat].forEach(link => bloco.appendChild(criarCard(link)));
    container.appendChild(bloco);
  });
}

function renderizarLista(links) {
  const container = document.getElementById("resultados");
  container.replaceChildren();

  if (links.length === 0) {
    const p = document.createElement("p");
    p.className = "vazio";
    p.textContent = "Nada encontrado para essa busca. Tente outro termo ou fale pelo WhatsApp.";
    container.appendChild(p);
    return;
  }

  const bloco = document.createElement("div");
  bloco.className = "grupo";
  links.forEach(link => bloco.appendChild(criarCard(link)));
  container.appendChild(bloco);
}

// ---------- Inicialização ----------

async function iniciar() {
  const resposta = await fetch("links.json");
  const dados = await resposta.json();

  // Preenche o perfil
  document.getElementById("nome").textContent = dados.perfil.nome;
  document.getElementById("oab").textContent = dados.perfil.oab;
  document.getElementById("bio").textContent = dados.perfil.bio;
  const iniciais = dados.perfil.nome.split(" ").filter(p => p.length > 2).slice(0, 2).map(p => p[0]).join("");
  document.getElementById("avatar").textContent = iniciais.toUpperCase();

  const links = dados.links;
  const campo = document.getElementById("campo-busca");

  const atualizar = () => {
    const resultado = buscar(campo.value, links);
    if (resultado === null) renderizarGrupos(links);
    else renderizarLista(resultado);
  };

  campo.addEventListener("input", atualizar);
  atualizar();
}

iniciar().catch(() => {
  document.getElementById("resultados").textContent = "Não foi possível carregar os links.";
});
