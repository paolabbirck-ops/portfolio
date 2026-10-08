/* ==========================================================================
   CONTEXT — Dress the context · Aplicação
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- Níveis de dress code (do mais formal ao mais casual) ---------- */
  const NIVEIS = [
    "Full formal",
    "Formal, no tie",
    "Business casual",
    "Smart casual",
  ];

  const NIVEL_DESC = {
    "Full formal": "Suit and tie, or a structured blazer with a skirt or tailored trousers — plain fabrics, sober tones and leather shoes.",
    "Formal, no tie": "The same tailoring, minus the tie — a jacket over an open-collar shirt, a fine knit or a sweater.",
    "Business casual": "Tailored trousers or a skirt with a shirt, blouse or knit — vests, cardigans and coats layer on top.",
    "Smart casual": "A knit, polo or well-cut T-shirt with tailored trousers or straight-leg jeans — relaxed, for the occasional moment.",
  };

  /* A ocasião dita o nível: somente estes estilos podem ser
  /* A ocasião dita o nível: somente estes estilos podem ser
     selecionados para cada ocasião. O Smart casual só aparece no Happy
     hour — nenhuma área o usa em ocasião de expediente. */
  const OCASIAO_NIVEIS = {
    "Office day": ["Business casual"],
    "Remote work": ["Business casual"],
    "Internal meeting": ["Formal, no tie"],
    "Client meeting": ["Full formal"],
    "Corporate event": ["Full formal", "Formal, no tie"],
    "Happy hour": ["Smart casual"],
    "Conference": ["Formal, no tie"],
    "Key presentation": ["Full formal"],
  };

  /* Áreas 100% formais, com regra própria que se sobrepõe ao mapa acima:
     usam Full formal em toda ocasião de trabalho, para ambos os
     gêneros. A única exceção é o Happy hour (OCASIOES_SEM_REGRA_DE_AREA).
     As demais áreas seguem apenas o mapa de ocasiões. */
  const AREAS_SEMPRE_FORMAL = [
    "Legal",
    "Client Advisory",
  ];
  const NIVEL_AREA_FORMAL = "Full formal";

  /* Ocasião fora do expediente: vale para todas as áreas, inclusive as
     de regra própria. */
  const OCASIOES_SEM_REGRA_DE_AREA = ["Happy hour"];

  /* Tênis só entram em Happy hour, em qualquer nível ou área. */
  const SO_HAPPY_HOUR = /sneaker/i;

  /* No frio a lista de "Partes de cima" abre pelo agasalho mais pesado.
     Quanto maior o número, mais cedo a peça aparece. O peso vem do tipo de
     peça no nome; o que não casar com nenhum tipo cai em 0 e vai para o fim. */
  const PESO_AGASALHO = [
    [/overcoat/i, 60],
    [/\bcoat\b|trench/i, 50],
    [/blazer|jacket/i, 40],
    [/sweater|cardigan|pullover|turtleneck|knit/i, 30],
    [/sweatshirt/i, 20],
    [/\bvest\b/i, 15],
    [/t-shirt|tank top/i, 5],
    [/shirt|blouse/i, 10],
  ];

  function pesoAgasalho(nome) {
    for (let k = 0; k < PESO_AGASALHO.length; k++) {
      if (PESO_AGASALHO[k][0].test(nome)) return PESO_AGASALHO[k][1];
    }
    return 0;
  }

  /* dir = -1 põe o mais pesado primeiro (frio); +1 põe o mais leve primeiro,
     empurrando blazer e casaco para o fim da lista (quente). */
  function ordenarPorAgasalho(itens, dir) {
    return itens
      .map(function (item, i) { return { item: item, i: i }; })
      .sort(function (a, b) {
        const pa = pesoAgasalho(a.item.nome);
        const pb = pesoAgasalho(b.item.nome);
        return dir * (pa - pb) || a.i - b.i;
      })
      .map(function (o) { return o.item; });
  }

  /* No frio a bota é o calçado que resolve; vem primeiro. O resto da lista
     mantém a ordem do catálogo — é uma promoção das botas, não uma
     reordenação geral. */
  const BOTA = /\bboots?\b/i;

  function botasPrimeiro(sapatos) {
    return sapatos
      .map(function (s, i) { return { s: s, i: i }; })
      .sort(function (a, b) {
        return (BOTA.test(b.s.nome) ? 1 : 0) - (BOTA.test(a.s.nome) ? 1 : 0) || a.i - b.i;
      })
      .map(function (o) { return o.s; });
  }

  /* Fora do frio não há hierarquia de peso, mas a ordem do catálogo espalha
     o mesmo tipo de peça em blocos separados. Aqui cada tipo fica junto, na
     ordem em que aparece pela primeira vez. */
  function agruparPorTipo(itens) {
    const ordem = [];
    const grupos = {};
    itens.forEach(function (item) {
      if (!grupos[item.nome]) { grupos[item.nome] = []; ordem.push(item.nome); }
      grupos[item.nome].push(item);
    });
    return ordem.reduce(function (acc, nome) { return acc.concat(grupos[nome]); }, []);
  }

  /* "Formal, no tie" é paletó e camisa: não existe no guarda-roupa
     feminino. Para mulheres o nível é retirado; quando ele era a única
     opção da ocasião (reunião interna, convenção), entram estes dois. */
  const NIVEL_SO_MASCULINO = "Formal, no tie";
  const SUBSTITUTOS_FEMININOS = ["Full formal", "Business casual"];

  /* Níveis realmente selecionáveis para a combinação ocasião + área +
     gênero. Sem ocasião definida, devolve todos os níveis. */
  function niveisPermitidos(ocasiao, area, genero) {
    if (!ocasiao) return NIVEIS;
    let base = OCASIAO_NIVEIS[ocasiao] || [];
    if (OCASIOES_SEM_REGRA_DE_AREA.indexOf(ocasiao) === -1 &&
        AREAS_SEMPRE_FORMAL.indexOf(area) !== -1) {
      base = [NIVEL_AREA_FORMAL];
    }
    if (genero === "Womenswear" && base.indexOf(NIVEL_SO_MASCULINO) !== -1) {
      const semEle = base.filter(function (n) { return n !== NIVEL_SO_MASCULINO; });
      base = semEle.length ? semEle : SUBSTITUTOS_FEMININOS.slice();
    }
    return base;
  }

  function nivelAdequado(nivel, f) {
    return niveisPermitidos(f.ocasiao, f.area, f.genero).indexOf(nivel) !== -1;
  }

  /* ---------- Configuração dos filtros ---------- */
  const FILTERS = [
    {
      key: "area",
      label: "Department",
      placeholder: "Select department",
      options: [
        "Administration",
        "Client Advisory",
        "Customer Success",
        "Finance",
        "Legal",
        "Marketing",
        "Operations",
        "People & Culture",
        "Product",
        "Sales",
        "Technology",
      ],
    },
    {
      key: "ocasiao",
      label: "Occasion",
      placeholder: "Select occasion",
      options: ["Office day", "Remote work", "Internal meeting", "Client meeting", "Corporate event", "Happy hour", "Conference", "Key presentation"],
    },
    {
      key: "clima",
      label: "Weather",
      placeholder: "Select weather",
      options: ["Warm", "Mild", "Cold"],
    },
    {
      key: "estilo",
      label: "Style",
      placeholder: "Select style",
      options: NIVEIS,
    },
    {
      key: "genero",
      label: "Wardrobe",
      placeholder: "Select wardrobe",
      options: ["Womenswear", "Menswear"],
    },
  ];

  const CLIMA_GRUPO = {
    "Warm": "quente",
    "Mild": "ameno",
    "Cold": "frio",
  };

  /* Atalhos de clima usados no catálogo */
  const Q = ["quente", "ameno"];
  const F = ["ameno", "frio"];
  const A = ["quente", "ameno", "frio"];

  /* ---------- Catálogo: looks completos ----------
     Carregado de js/looks-data.js (gerado por tools/build-looks.js a partir
     das fotos classificadas de originais/roupas). */

  /* ---------- Catálogo: peças por categoria ----------
     Item: string (qualquer clima) ou { n: nome, c: climas }. */
  const ITENS = {
    "Full formal": {
      "Womenswear": {
        tops: [{ n: "Off-white satin blouse", c: Q }, "White silk shirt", { n: "Pussy-bow blouse", c: F }],
        bottoms: ["Pencil skirt", "Straight tailored trousers", { n: "Tropical wool trousers", c: F }],
        sapatos: ["Nude pumps", "Classic black pumps"],
        acessorios: ["Silk scarf", "Discreet earrings", "Structured bag"],
      },
      "Menswear": {
        tops: [{ n: "Lightweight cotton dress shirt", c: Q }, "White dress shirt", "Light blue dress shirt"],
        bottoms: [{ n: "Lightweight tailored trousers", c: Q }, "Charcoal suit trousers", { n: "Navy wool trousers", c: F }],
        sapatos: ["Black leather dress shoes", "Dark brown Derby shoes"],
        acessorios: ["Plain silk tie", "Black leather belt", "Pocket square"],
      },
    },
    "Formal, no tie": {
      "Womenswear": {
        tops: [{ n: "Light tailored blouse", c: Q }, "Satin shirt", { n: "Fine knit under the jacket", c: F }],
        bottoms: [{ n: "Light tailored trousers", c: Q }, "Black dress trousers", "Tailored midi skirt"],
        sapatos: ["Mid-heel pumps", "Leather loafers"],
        acessorios: ["Slim leather belt", "Minimalist watch", { n: "Light wrap scarf", c: F }],
      },
      "Menswear": {
        tops: [{ n: "Linen-blend shirt", c: Q }, "White poplin shirt", { n: "Fine turtleneck under the jacket", c: F }],
        bottoms: ["Gray tailored trousers", "Tailored chinos"],
        sapatos: ["Leather loafers", "Brown dress shoes"],
        acessorios: ["Brown leather belt", "Classic watch"],
      },
    },
    "Business casual": {
      "Womenswear": {
        tops: [{ n: "Light dress shirt", c: Q }, "Poplin dress shirt", { n: "Fine knit over the shirt", c: F }],
        bottoms: [{ n: "Fluid dress trousers", c: Q }, "Creased dress trousers", "Dark dress trousers"],
        sapatos: ["Leather ballet flats", "Low pumps"],
        acessorios: ["Discreet belt", "Minimalist necklace", { n: "Wool wrap scarf", c: F }],
      },
      "Menswear": {
        tops: [{ n: "Lightweight dress shirt", c: Q }, "Long-sleeve dress shirt", { n: "Sweater over the shirt", c: F }],
        bottoms: ["Charcoal dress trousers", "Khaki dress trousers"],
        sapatos: ["Casual leather shoes", "Brown loafers"],
        acessorios: ["Leather belt", "Leather-strap watch"],
      },
    },
    "Smart casual": {
      "Womenswear": {
        tops: [{ n: "Polished light blouse", c: Q }, "Cotton shirt", { n: "Light knit", c: F }],
        bottoms: ["Twill trousers", "Straight tailored trousers"],
        sapatos: ["Minimalist white sneakers", { n: "Leather boots", c: F }],
        acessorios: ["Casual belt", "Small earrings", { n: "Light scarf", c: F }],
      },
      "Menswear": {
        tops: [{ n: "Polished short-sleeve shirt", c: Q }, "Oxford shirt", { n: "Fine sweater", c: F }],
        bottoms: ["Twill trousers", "Straight chinos"],
        sapatos: ["Premium white sneakers", { n: "Chelsea boots", c: F }],
        acessorios: ["Casual leather belt", "Discreet watch"],
      },
    },
  };

  /* ---------- Categorias ---------- */
  const ICONES = {
    looks:
      '<path d="M24 10a4 4 0 1 1 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M24 10v4M24 14L5.5 27.5A3 3 0 0 0 7.3 33h33.4a3 3 0 0 0 1.8-5.5L24 14z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    tops:
      '<path d="M18 8l6 3 6-3 8 6-4 6-3-2v22H17V18l-3 2-4-6 8-6z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    bottoms:
      '<path d="M17 6h14v7l-2.5 29h-4.5L24 22l-2 20h-4.5L15 13z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M17 12h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    sapatos:
      '<path d="M5 34c0-4.5 3-6.5 7.5-6.5h7c3.5 0 6.2-1.6 8.2-4.4l2.8-3.9c2.2 2.8 5.3 5 9.3 6.5 3.6 1.4 7.2 3.2 7.2 7v3.3H5V34z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M5 32.5c3 0 4.5 2 7.5 2s4-1.5 6-1.5M30 22.5l3 2.5M27 26l3 2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    acessorios:
      '<circle cx="24" cy="24" r="9" stroke="currentColor" stroke-width="1.6"/>' +
      '<path d="M20 15l1-8h6l1 8M20 33l1 8h6l1-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    /* Vestido: corpete e saia evasê. */
    vestidos:
      '<path d="M18 7l6 4 6-4 4 8-4 3 4 22H14l4-22-4-3z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M18 18h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
    /* Unhas: ponta do dedo com a lâmina da unha. */
    unhas:
      '<path d="M16 20c0-6 3.6-10 8-10s8 4 8 10v14a7 7 0 0 1-7 7h-2a7 7 0 0 1-7-7V20z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M17.5 21c1.6-1.6 11.4-1.6 13 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  };

  /* `genero` restringe a categoria: sem o campo, vale para todos. Vestidos e
     Unhas só aparecem no feminino. */
  const CATEGORIAS = [
    { key: "looks", label: "Complete looks" },
    { key: "tops", label: "Tops", desc: "The top layer of the look at this level." },
    { key: "bottoms", label: "Bottoms", desc: "The base of the outfit." },
    { key: "vestidos", label: "Dresses", genero: "Womenswear", desc: "One piece that settles the whole look." },
    { key: "sapatos", label: "Shoes", desc: "Footwear matched to the level of formality." },
    { key: "acessorios", label: "Accessories", desc: "The detail that finishes the look." },
    { key: "unhas", label: "Nails", genero: "Womenswear", desc: "A polish shade suited to the level." },
  ];

  function categoriasDe(genero) {
    return CATEGORIAS.filter(function (c) { return !c.genero || c.genero === genero; });
  }

  /* Um look pode valer em mais de um nível (`niveis`, ver NIVEIS_EXTRAS em
     tools/build-looks.js). `estilo` guarda o nível principal e é trocado
     pelo nível da busca em comNivel(). */
  const LOOKS = (window.LOOKS_DATA || []).map(function (d) {
    return {
      nome: d.nome,
      estilo: d.nivel,
      niveis: d.niveis || [d.nivel],
      genero: d.genero,
      cli: d.climas,
      desc: d.desc,
      cat: "looks",
      img: d.img,
      destaque: d.destaque || 0,
    };
  });

  /* Looks em destaque abrem a lista, na ordem do número; o resto segue a
     afinidade com o clima (menos climas no look = mais específico, antes). */
  function ordemLooks(a, b) {
    return ((a.destaque || 999) - (b.destaque || 999)) || (a.cli.length - b.cli.length);
  }

  /* ---------- Regras de estilo ----------
     Cada regra aparece onde a peça está, sem modal: como aviso fixo na
     grade de "Build it yourself" (`vale()` decide em qual aba) e como nota
     de estilista no look principal, quando o look tem a peça
     (`noLook()`). */
  /* Níveis em que a regra da calça jeans vale, para ambos os gêneros. */
  const NIVEIS_COM_REGRA_JEANS = ["Business casual", "Smart casual"];

  function textoDoLook(look) {
    return look.nome + " " + look.desc;
  }

  const REGRAS = [
    {
      id: "jeans",
      vale: function (res, f, cat) {
        return NIVEIS_COM_REGRA_JEANS.indexOf(res.nivel) !== -1 && cat === "bottoms";
      },
      noLook: function (look, res) {
        return NIVEIS_COM_REGRA_JEANS.indexOf(res.nivel) !== -1 && /\bjeans\b/i.test(textoDoLook(look));
      },
      aviso:
        "<b>About jeans:</b> only <b>straight</b> and <b>wide-leg</b> cuts, " +
        "in the washes shown in the examples. The leg should fall loose from hip to hem.",
      nota: {
        titulo: "On jeans",
        texto: "Only straight and wide-leg cuts, in washes like these. The leg should fall loose from hip to hem.",
      },
    },
    {
      id: "sapatoAberto",
      vale: function (res, f, cat) { return f.genero === "Womenswear" && cat === "sapatos"; },
      noLook: function (look, res, f) {
        return f.genero === "Womenswear" && /sandal|mule|peep/i.test(textoDoLook(look));
      },
      aviso:
        "<b>About open shoes:</b> sandals, mules and peep toes leave your feet on show. " +
        "Choose them when your toenails are done and the polish is in good shape — " +
        "no chips. When in doubt, a closed shoe does the job.",
      nota: {
        titulo: "Open shoes",
        texto: "They leave your feet on show — wear them when your toenails are done and the polish is intact.",
      },
    },
    {
      id: "unhas",
      vale: function (res, f, cat) { return cat === "unhas"; },
      noLook: function () { return false; },
      aviso:
        "<b>About nails:</b> keep them neat and well groomed, with intact polish. " +
        "At the formal levels, stick to the <b>neutral shades</b> in this palette.",
    },
  ];

  /* Marca quais avisos ainda não chamaram atenção nesta busca. Consumido no
     primeiro render que exibe cada um. */
  let regrasPendentes = {};

  /* ---------- Estado ---------- */
  const state = {
    filtros: { area: "", ocasiao: "", clima: "", estilo: "", genero: "" },
    /* A frase da home enquanto está sendo preenchida, antes de virar busca. */
    rascunho: null,
    categoria: "tops",
    busca: null,
    /* Posição do look principal na lista de looks da busca. */
    destaque: 0,
  };

  /* Opções que mudarem de nome entram aqui (nome antigo → nome atual), para
     que links já enviados e sessões abertas não percam o filtro. */
  const AREAS_RENOMEADAS = {};

  /* Valor guardado
  /* Valor guardado ou vindo da URL só entra no estado se ainda existir nas
     opções, depois de traduzido pelo mapa de renomeações. */
  function valorValido(f, v) {
    if (!v) return "";
    const atual = (f.key === "area" && AREAS_RENOMEADAS[v]) || v;
    return f.options.indexOf(atual) !== -1 ? atual : "";
  }

  try {
    const saved = sessionStorage.getItem("context-filters");
    if (saved) {
      const parsed = JSON.parse(saved);
      FILTERS.forEach(function (f) {
        const v = valorValido(f, parsed[f.key]);
        if (v) state.filtros[f.key] = v;
      });
    }
  } catch (e) { /* armazenamento indisponível */ }

  /* ---------- Estado na URL ----------
     Os filtros vivem na query string para que o botão Voltar do navegador
     funcione e para que um resultado possa ser enviado a outra pessoa.
     A URL tem precedência sobre o sessionStorage. */
  function filtrosDaURL() {
    const q = new URLSearchParams(location.search);
    const out = {};
    let completo = true;
    FILTERS.forEach(function (f) {
      const v = valorValido(f, q.get(f.key));
      if (v) out[f.key] = v;
      else completo = false;
    });
    return completo ? out : null;
  }

  function urlDosFiltros(filtros) {
    const q = new URLSearchParams();
    FILTERS.forEach(function (f) { q.set(f.key, filtros[f.key]); });
    return location.pathname + "?" + q.toString();
  }

  /* O título do documento é o rótulo do estado no histórico, nas abas e nos
     favoritos do sistema. Como os filtros já vivem na URL, ele precisa
     acompanhá-los — senão toda entrada do histórico fica idêntica. */
  const TITULO_BASE = document.title;

  /* ---------- Elementos ---------- */
  const el = {
    viewHome: document.getElementById("view-home"),
    viewResults: document.getElementById("view-results"),
    askHome: document.getElementById("ask-home"),
    askHomeFrase: document.getElementById("ask-home-frase"),
    askHomeResposta: document.getElementById("ask-home-resposta"),
    askHomeHint: document.getElementById("ask-home-hint"),
    btnVer: document.getElementById("btn-ver-looks"),
    askRes: document.getElementById("ask-res"),
    resResposta: document.getElementById("res-resposta"),
    picker: document.getElementById("picker"),
    pickerTitulo: document.getElementById("picker-titulo"),
    pickerOpcoes: document.getElementById("picker-opcoes"),
    pickerScrim: document.getElementById("picker-scrim"),
    look: document.getElementById("look"),
    lookAnuncio: document.getElementById("look-anuncio"),
    stripWrap: document.getElementById("look-strip"),
    strip: document.getElementById("strip"),
    buildSub: document.getElementById("build-sub"),
    cats: document.getElementById("cats"),
    grid: document.getElementById("results-grid"),
    count: document.getElementById("results-count"),
    logoHome: document.getElementById("logo-home"),
    linkDiretrizes: document.getElementById("link-diretrizes"),
  };

  /* ---------- A frase ----------
     A home pergunta em forma de frase, com uma lacuna por filtro. O estilo
     não é perguntado: ele é a resposta — sai da ocasião, da área e do
     guarda-roupa (niveisPermitidos) e só vira escolha quando a ocasião
     aceita mais de um nível. A mesma frase reaparece no topo dos
     resultados, onde cada lacuna troca a busca na hora. */
  const FRASE = [
    "I work in ", "area",
    ", and today it’s ", "ocasiao",
    ". The weather is ", "clima",
    ", and I wear ", "genero",
    ".",
  ];
  const CHAVES_FRASE = ["area", "ocasiao", "clima", "genero"];

  const LACUNAS = {
    area: { titulo: "Department", vazio: "your department" },
    ocasiao: { titulo: "Occasion", vazio: "an occasion" },
    clima: { titulo: "Weather", vazio: "warm, mild or cold" },
    genero: { titulo: "Wardrobe", vazio: "womenswear or menswear" },
  };

  /* Como cada ocasião se encaixa no meio da frase. */
  const OCASIAO_FRASE = {
    "Office day": "an office day",
    "Remote work": "a remote work day",
    "Internal meeting": "an internal meeting",
    "Client meeting": "a client meeting",
    "Corporate event": "a corporate event",
    "Happy hour": "happy hour",
    "Conference": "a conference",
    "Key presentation": "a key presentation",
  };

  function naFrase(key, valor) {
    if (key === "ocasiao") return OCASIAO_FRASE[valor] || valor;
    if (key === "clima" || key === "genero") return valor.toLowerCase();
    return valor;
  }

  function maiuscula(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function opcoesDe(key) {
    return FILTERS.filter(function (f) { return f.key === key; })[0].options;
  }

  function valoresDe(ctx) {
    return ctx === "home" ? state.rascunho : state.filtros;
  }

  function completa(f) {
    return CHAVES_FRASE.every(function (k) { return f[k]; });
  }

  /* O estilo acompanha o resto da frase: se o nível escolhido deixou de
     valer para a nova combinação, volta para o primeiro permitido. */
  function ajustarEstilo(f) {
    if (!f.ocasiao) { f.estilo = ""; return; }
    const permitidos = niveisPermitidos(f.ocasiao, f.area, f.genero);
    if (permitidos.indexOf(f.estilo) === -1) f.estilo = permitidos[0];
  }

  const SETA_LACUNA =
    '<svg class="slot__seta" width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
    '<path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function slotDe(ctx, key) {
    const alvo = ctx === "home" ? el.askHomeFrase : el.askRes;
    return alvo.querySelector('.slot[data-key="' + key + '"]');
  }

  function renderFrase(ctx) {
    const alvo = ctx === "home" ? el.askHomeFrase : el.askRes;
    const valores = valoresDe(ctx);
    alvo.innerHTML = "";
    FRASE.forEach(function (parte) {
      const cfg = LACUNAS[parte];
      if (!cfg) {
        alvo.appendChild(document.createTextNode(parte));
        return;
      }
      const v = valores[parte];
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "slot" + (v ? " is-filled" : "");
      slot.dataset.key = parte;
      slot.dataset.ctx = ctx;
      slot.setAttribute("aria-haspopup", "dialog");
      slot.setAttribute("aria-expanded", "false");
      slot.setAttribute("aria-label", cfg.titulo + ": " + (v || "not chosen yet"));
      slot.innerHTML = '<span class="slot__txt">' + (v ? naFrase(parte, v) : cfg.vazio) + "</span>" + SETA_LACUNA;
      slot.addEventListener("click", function () { abrirPicker(slot); });
      alvo.appendChild(slot);
    });
  }

  /* ---------- Escolha de uma lacuna ----------
     Um seletor só, compartilhado pelas oito lacunas: abre colado à lacuna
     no desktop e como folha na base da tela no celular. */
  const FOLHA = window.matchMedia("(max-width: 600px)");
  let pickerSlot = null;

  function abrirPicker(slot) {
    if (pickerSlot === slot) { fecharPicker(true); return; }
    fecharPicker(false);
    pickerSlot = slot;
    const key = slot.dataset.key;
    const atual = valoresDe(slot.dataset.ctx)[key];

    el.pickerTitulo.textContent = LACUNAS[key].titulo;
    el.pickerOpcoes.innerHTML = "";
    opcoesDe(key).forEach(function (op) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "opcao";
      b.textContent = op;
      b.setAttribute("aria-pressed", String(op === atual));
      b.addEventListener("click", function () { escolher(slot, key, op); });
      el.pickerOpcoes.appendChild(b);
    });

    slot.setAttribute("aria-expanded", "true");
    slot.classList.add("is-open");
    el.picker.hidden = false;
    posicionarPicker();
    if (FOLHA.matches) el.pickerScrim.hidden = false;
    void el.picker.offsetWidth;
    el.picker.classList.add("is-open");
    el.pickerScrim.classList.add("is-open");

    const foco = el.pickerOpcoes.querySelector('[aria-pressed="true"]') || el.pickerOpcoes.firstChild;
    foco.focus({ preventScroll: true });
    document.addEventListener("keydown", onPickerKeydown);
    document.addEventListener("pointerdown", onForaDoPicker, true);
  }

  function posicionarPicker() {
    const p = el.picker;
    if (FOLHA.matches) {
      p.style.left = "";
      p.style.top = "";
      return;
    }
    const r = pickerSlot.getBoundingClientRect();
    const margem = 16;
    const maxLeft = window.scrollX + document.documentElement.clientWidth - p.offsetWidth - margem;
    const left = Math.max(window.scrollX + margem, Math.min(r.left + window.scrollX - 8, maxLeft));
    p.style.left = left + "px";
    p.style.top = (r.bottom + window.scrollY + 10) + "px";
    /* Lacuna perto do pé da tela: rola o bastante para o seletor caber. */
    const sobra = p.getBoundingClientRect().bottom - (window.innerHeight - 16);
    if (sobra > 0) window.scrollBy({ top: sobra, behavior: "smooth" });
  }

  function fecharPicker(devolverFoco) {
    if (!pickerSlot) return;
    const slot = pickerSlot;
    pickerSlot = null;
    slot.setAttribute("aria-expanded", "false");
    slot.classList.remove("is-open");
    el.picker.classList.remove("is-open");
    el.pickerScrim.classList.remove("is-open");
    el.picker.hidden = true;
    el.pickerScrim.hidden = true;
    document.removeEventListener("keydown", onPickerKeydown);
    document.removeEventListener("pointerdown", onForaDoPicker, true);
    if (devolverFoco && slot.isConnected) slot.focus();
  }

  function onPickerKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      fecharPicker(true);
      return;
    }
    /* O seletor fica no fim do documento, longe da lacuna. Tab devolve o
       foco à lacuna sem cancelar o evento, e o navegador segue a ordem
       normal a partir dela: Tab vai para a lacuna seguinte, Shift+Tab para
       a anterior. */
    if (e.key === "Tab") {
      fecharPicker(true);
      return;
    }
    const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!passo) return;
    const ops = Array.prototype.slice.call(el.pickerOpcoes.children);
    const i = ops.indexOf(document.activeElement);
    if (i === -1) return;
    e.preventDefault();
    ops[(i + passo + ops.length) % ops.length].focus();
  }

  /* A própria lacuna fica de fora: o clique nela já fecha (abrirPicker). */
  function onForaDoPicker(e) {
    if (el.picker.contains(e.target) || (pickerSlot && pickerSlot.contains(e.target))) return;
    fecharPicker(false);
  }

  function escolher(slot, key, valor) {
    const ctx = slot.dataset.ctx;
    fecharPicker(false);

    if (ctx === "res") {
      const f = Object.assign({}, state.filtros);
      f[key] = valor;
      ajustarEstilo(f);
      aplicarFiltros(f, true, true);
      slotDe("res", key).focus();
      return;
    }

    const estavaVazia = !state.rascunho[key];
    state.rascunho[key] = valor;
    ajustarEstilo(state.rascunho);
    renderFrase("home");
    renderResposta("home");

    /* Preenchendo pela primeira vez, a conversa segue para a próxima lacuna
       vazia; com tudo preenchido, o foco vai para o botão. Corrigir uma
       lacuna já preenchida não arrasta a pessoa para lugar nenhum. */
    const ordem = CHAVES_FRASE.slice(CHAVES_FRASE.indexOf(key) + 1).concat(CHAVES_FRASE);
    const proxima = ordem.filter(function (k) { return !state.rascunho[k]; })[0];
    if (!proxima) el.btnVer.focus({ preventScroll: true });
    else if (estavaVazia) abrirPicker(slotDe("home", proxima));
    else slotDe("home", key).focus();
  }

  /* ---------- A resposta: o nível de dress code ---------- */
  function razaoNivel(f, permitidos) {
    const oc = OCASIAO_FRASE[f.ocasiao] || f.ocasiao;
    const Oc = maiuscula(oc);
    if (OCASIOES_SEM_REGRA_DE_AREA.indexOf(f.ocasiao) === -1 &&
        AREAS_SEMPRE_FORMAL.indexOf(f.area) !== -1) {
      return "In " + f.area + ", every work occasion calls for <b>" + NIVEL_AREA_FORMAL + "</b>.";
    }
    const base = OCASIAO_NIVEIS[f.ocasiao] || [];
    if (f.genero === "Womenswear" && base.length === 1 && base[0] === NIVEL_SO_MASCULINO) {
      return "<b>" + NIVEL_SO_MASCULINO + "</b> is a menswear level — for " + oc +
        ", womenswear goes <b>" + permitidos.join("</b> or <b>") + "</b>. Pick the one that fits your day.";
    }
    if (permitidos.length > 1) {
      return Oc + " works at two levels — pick the one that fits your day.";
    }
    return Oc + " calls for <b>" + permitidos[0] + "</b>.";
  }

  function renderResposta(ctx) {
    const alvo = ctx === "home" ? el.askHomeResposta : el.resResposta;
    const f = valoresDe(ctx);

    if (ctx === "home") {
      const faltam = CHAVES_FRASE.filter(function (k) { return !f[k]; }).length;
      el.askHome.classList.toggle("is-complete", faltam === 0);
      el.askHomeHint.classList.remove("is-error");
      el.askHomeHint.textContent = faltam === 0 ? "" :
        faltam === 4 ? "Tap a blank to start." :
        faltam + (faltam === 1 ? " blank" : " blanks") + " to go.";
    }
    if (!completa(f)) {
      alvo.hidden = true;
      alvo.innerHTML = "";
      return;
    }

    const permitidos = niveisPermitidos(f.ocasiao, f.area, f.genero);
    const nivel = ctx === "res" && state.busca ? state.busca.nivel : f.estilo;
    const fora = ctx === "res" && state.busca && !state.busca.adequado;

    alvo.innerHTML =
      '<span class="resposta__orb" aria-hidden="true"></span>' +
      '<div class="resposta__corpo">' +
        '<p class="eyebrow">Your dress code</p>' +
        '<p class="resposta__nivel">' + nivel + "</p>" +
        '<p class="resposta__porque">' +
          (fora
            ? "<b>" + f.estilo + "</b> isn’t the recommended level for " + (OCASIAO_FRASE[f.ocasiao] || f.ocasiao) +
              " — here’s <b>" + nivel + "</b>, the closest suitable level."
            : razaoNivel(f, permitidos)) +
        "</p>" +
        '<p class="resposta__desc">' + (NIVEL_DESC[nivel] || "") + "</p>" +
      "</div>";

    if (permitidos.length > 1) {
      const grupo = document.createElement("div");
      grupo.className = "niveis";
      grupo.setAttribute("role", "group");
      grupo.setAttribute("aria-label", "Choose your level");
      permitidos.forEach(function (n) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "nivel";
        b.dataset.nivel = n;
        b.textContent = n;
        b.setAttribute("aria-pressed", String(n === nivel));
        b.addEventListener("click", function () { escolherNivel(ctx, n); });
        grupo.appendChild(b);
      });
      alvo.querySelector(".resposta__corpo").appendChild(grupo);
    }
    alvo.hidden = false;
  }

  function escolherNivel(ctx, nivel) {
    if (ctx === "res") {
      const f = Object.assign({}, state.filtros, { estilo: nivel });
      aplicarFiltros(f, true, true);
    } else {
      state.rascunho.estilo = nivel;
      renderResposta("home");
    }
    const alvo = ctx === "home" ? el.askHomeResposta : el.resResposta;
    const b = alvo.querySelector('.nivel[data-nivel="' + nivel + '"]');
    if (b) b.focus({ preventScroll: true });
  }

  /* ---------- Matching ---------- */
  /* Looks do nível compatíveis com o clima, ordenados por afinidade:
     quanto mais específico ao clima escolhido (menos climas no look),
     mais cedo aparece. */
  function looksDe(nivel, f) {
    return LOOKS.filter(function (l) {
      return (
        l.niveis.indexOf(nivel) !== -1 &&
        l.genero === f.genero &&
        l.cli.indexOf(CLIMA_GRUPO[f.clima]) !== -1
      );
    }).map(comNivel(nivel)).sort(ordemLooks);
  }

  /* A tag do card mostra o nível em que o look foi encontrado, não o
     principal: o mesmo look aparece como Smart casual numa busca e como
     Business casual na outra. */
  function comNivel(nivel) {
    return function (l) {
      return Object.assign({}, l, { estilo: nivel });
    };
  }


  function itensDe(catKey, nivel, f) {
    const grupoClima = CLIMA_GRUPO[f.clima];

    /* Sapatos: catálogo fotográfico (assets/sapatos), filtrado por nível
       adequado, gênero (ou "Ambos") e clima. */
    /* Vestidos e Unhas: catálogos próprios, só femininos. */
    if (catKey === "vestidos" || catKey === "unhas") {
      const fonte = catKey === "vestidos" ? window.VESTIDOS_DATA : window.UNHAS_DATA;
      return (fonte || [])
        .filter(function (o) {
          return (
            o.niveis.indexOf(nivel) !== -1 &&
            o.genero === f.genero &&
            o.climas.indexOf(grupoClima) !== -1
          );
        })
        .map(function (o) {
          return { nome: o.nome, cli: o.climas, estilo: nivel, desc: o.desc, cat: catKey, img: o.img };
        });
    }

    if (catKey === "sapatos") {
      const sapatos = (window.SAPATOS_DATA || [])
        .filter(function (s) {
          if (SO_HAPPY_HOUR.test(s.nome) && f.ocasiao !== "Happy hour") return false;
          return (
            s.niveis.indexOf(nivel) !== -1 &&
            (s.genero === f.genero || s.genero === "Both") &&
            s.climas.indexOf(grupoClima) !== -1
          );
        })
        .map(function (s) {
          return { nome: s.nome, cli: s.climas, estilo: nivel, desc: s.desc, cat: "sapatos", img: s.img };
        });
      return grupoClima === "frio" ? botasPrimeiro(sapatos) : sapatos;
    }

    /* Partes de cima / de baixo: catálogo fotográfico (assets/peças),
       filtrado por categoria, nível, gênero (ou "Ambos") e clima. */
    if (catKey === "tops" || catKey === "bottoms") {
      const pecas = (window.PECAS_DATA || [])
        .filter(function (p) {
          return (
            p.categoria === catKey &&
            p.niveis.indexOf(nivel) !== -1 &&
            (p.genero === f.genero || p.genero === "Both") &&
            p.climas.indexOf(grupoClima) !== -1
          );
        })
        .map(function (p) {
          return { nome: p.nome, cli: p.climas, estilo: nivel, desc: p.desc, cat: catKey, img: p.img };
        });

      /* A ordem de "Partes de cima" segue a temperatura: no frio o agasalho
         abre a lista; no calor ele vai para o fim, e camiseta e camisa vêm
         primeiro. No ameno não há hierarquia — só o agrupamento por tipo. */
      if (catKey === "tops" && grupoClima === "frio") return ordenarPorAgasalho(pecas, -1);
      if (catKey === "tops" && grupoClima === "quente") return ordenarPorAgasalho(pecas, 1);
      return agruparPorTipo(pecas);
    }

    /* Acessórios: catálogo fotográfico (assets/acessórios), filtrado por
       nível, gênero (ou "Ambos") e clima. */
    if (catKey === "acessorios") {
      return (window.ACESSORIOS_DATA || [])
        .filter(function (a) {
          return (
            a.niveis.indexOf(nivel) !== -1 &&
            (a.genero === f.genero || a.genero === "Both") &&
            a.climas.indexOf(grupoClima) !== -1
          );
        })
        .map(function (a) {
          return { nome: a.nome, cli: a.climas, estilo: nivel, desc: a.desc, cat: "acessorios", img: a.img };
        });
    }

    const catDesc = CATEGORIAS.filter(function (c) { return c.key === catKey; })[0].desc;
    const grupo = ((ITENS[nivel] || {})[f.genero] || {})[catKey] || [];
    return grupo
      .map(function (item) {
        const obj = typeof item === "string" ? { n: item, c: A } : item;
        return { nome: obj.n, cli: obj.c || A, estilo: nivel, desc: catDesc, cat: catKey };
      })
      .filter(function (item) {
        return item.cli.indexOf(grupoClima) !== -1;
      });
  }

  /* Nível adequado mais próximo na escala de formalidade
     (empate resolvido para o lado mais formal) */
  function nivelRecomendado(f) {
    const idx = NIVEIS.indexOf(f.estilo);
    let melhor = null;
    let melhorDist = Infinity;
    NIVEIS.forEach(function (nivel, i) {
      if (!nivelAdequado(nivel, f)) return;
      const dist = Math.abs(i - idx);
      if (dist < melhorDist || (dist === melhorDist && i < NIVEIS.indexOf(melhor))) {
        melhor = nivel;
        melhorDist = dist;
      }
    });
    return melhor;
  }

  function buscar(f) {
    const adequado = nivelAdequado(f.estilo, f);
    const nivelEfetivo = adequado ? f.estilo : nivelRecomendado(f);

    /* níveis vizinhos na escala, desde que também adequados à ocasião */
    const idx = NIVEIS.indexOf(nivelEfetivo);
    const relacionados = [];
    [idx - 1, idx + 1, idx - 2, idx + 2].forEach(function (i) {
      if (i < 0 || i >= NIVEIS.length) return;
      if (!nivelAdequado(NIVEIS[i], f)) return;
      looksDe(NIVEIS[i], f).forEach(function (l) { relacionados.push(l); });
    });

    /* fallback coerente: sem looks do clima exato, recua para o clima
       vizinho seguro, SEMPRE excluindo o extremo oposto — quente jamais
       traz peça de frio (casaco/tricô) e frio jamais traz peça de calor. */
    let exatos = nivelEfetivo ? looksDe(nivelEfetivo, f) : [];
    let climaRelaxado = false;
    if (exatos.length === 0 && nivelEfetivo) {
      const grupo = CLIMA_GRUPO[f.clima];
      const oposto = { quente: "frio", frio: "quente", ameno: null }[grupo];
      const vizinhos = { quente: ["ameno"], ameno: ["quente", "frio"], frio: ["ameno"] };
      (vizinhos[grupo] || []).forEach(function (alvo) {
        if (exatos.length) return;
        exatos = LOOKS.filter(function (l) {
          return l.niveis.indexOf(nivelEfetivo) !== -1 && l.genero === f.genero &&
            l.cli.indexOf(alvo) !== -1 && (!oposto || l.cli.indexOf(oposto) === -1);
        }).map(comNivel(nivelEfetivo)).sort(ordemLooks);
      });
      climaRelaxado = exatos.length > 0;
    }

    /* Look com mais de um nível pode cair nos exatos e num vizinho, ou em
       dois vizinhos: cada foto aparece uma vez só. */
    const vistos = {};
    exatos.forEach(function (l) { vistos[l.img] = true; });
    const vizinhos = relacionados.filter(function (l) {
      if (vistos[l.img]) return false;
      vistos[l.img] = true;
      return true;
    });

    return {
      adequado: adequado,
      nivel: nivelEfetivo,
      exatos: exatos,
      climaRelaxado: climaRelaxado,
      relacionados: vizinhos.slice(0, 4),
    };
  }

  /* ---------- Renderização ---------- */
  function iconeSvg(catKey, cls, size) {
    return (
      '<svg class="' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
      ICONES[catKey] +
      "</svg>"
    );
  }

  /* Variantes de 600 px geradas por tools/gera-variantes.py, gravadas em
     <pasta>/600/<nome>.jpg. Os cards são exibidos a ~265 px, então a de
     600 atende até telas 2x; a original entra só como opção grande. */
  const VARIANTES_600 = window.VARIANTES_600 || {};

  /* srcset separa candidatos por vírgula e o descritor por espaço, então
     caminho com espaço no nome ("blazer - feminino (1).JPG") precisa vir
     codificado ou o browser descarta o candidato. */
  function srcsetDe(img) {
    const v = VARIANTES_600[img];
    if (!v) return "";
    return ' srcset="' + encodeURI(v) + ' 600w, ' + encodeURI(img) + ' 1200w"';
  }

  /* A foto aparece inteira (object-fit: contain). Quando a proporção dela não
     bate com a do card sobra uma faixa; ela é pintada com a cor da borda da
     própria imagem, então a emenda não aparece. Amostramos só as bordas que
     encostam na sobra: as laterais quando a foto é mais estreita que o card,
     o topo e a base quando é mais larga. */
  const RAZAO_CARD = 3 / 4;

  function pintarSobra(img) {
    const media = img.parentNode;
    if (!media || !img.naturalWidth || !img.naturalHeight) return;
    const razao = img.naturalWidth / img.naturalHeight;
    if (Math.abs(razao - RAZAO_CARD) < 0.01) return; // preenche o card, não sobra nada
    try {
      const N = 48;
      const c = document.createElement("canvas");
      c.width = N;
      c.height = N;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, N, N);
      const d = ctx.getImageData(0, 0, N, N).data;
      const px = [];
      for (let k = 0; k < N; k++) {
        const a = razao < RAZAO_CARD
          ? [k * N, k * N + (N - 1)]   // colunas 0 e N-1
          : [k, (N - 1) * N + k];      // linhas 0 e N-1
        a.forEach(function (i) {
          const o = i * 4;
          px.push([d[o], d[o + 1], d[o + 2]]);
        });
      }
      /* Percentil 75 de luminância, não média nem mediana. O fundo do estúdio
         é quase sempre mais claro que a peça, então quando a roupa encosta na
         borda da foto o percentil alto ignora a roupa e acerta o fundo; numa
         borda uniforme ele dá no mesmo. */
      px.sort(function (a, b) { return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]); });
      const m = px[Math.floor(px.length * 0.75)];
      media.style.background = "rgb(" + m[0] + "," + m[1] + "," + m[2] + ")";
    } catch (e) {
      /* canvas bloqueado (index.html aberto direto por file://). A foto
         continua inteira, só sobre o fundo neutro padrão. */
    }
  }
  function cardLook(look, f, index) {
    const card = document.createElement("article");
    card.className = "look-card";
    card.style.setProperty("--i", index);

    const climaTag = climaTagDe(look);

    /* Área e ocasião não entram: são iguais em todos os cards e já estão
       na frase do topo. Sobra o que de fato distingue um card do outro. */
    const tags = [
      { label: look.estilo, mod: " tag--style" },
      { label: climaTag, mod: "" },
    ];

    /* Quando as imagens forem fornecidas, basta adicionar o campo
       `img: "assets/looks/arquivo.jpg"` ao item correspondente no catálogo. */
    /* alt vazio: o nome e a descrição do look vêm logo abaixo, no texto do
       card. Com alt preenchido o leitor de tela lia tudo duas vezes. */
    const media = look.img
      ? '<img src="' + look.img + '"' + srcsetDe(look.img) +
        ' sizes="(max-width: 768px) 100vw, 300px" alt="" loading="lazy" decoding="async" />'
      : iconeSvg(look.cat || "looks", "look-card__hanger", 44) +
        '<span class="look-card__ph-tag">Image placeholder</span>' +
        '<span class="look-card__ph-text">Photo coming soon</span>';

    card.innerHTML =
      '<div class="look-card__media' + (look.img ? " look-card__media--foto" : "") + (look.cat === "unhas" ? " look-card__media--recorte" : "") + '"' +
        (look.img ? "" : ' role="img" aria-label="Placeholder: image of ' + look.nome + '"') +
      ">" + media + "</div>" +
      '<div class="look-card__body">' +
        '<h3 class="look-card__name">' + look.nome + "</h3>" +
        '<p class="look-card__desc">' + look.desc + "</p>" +
        '<div class="look-card__tags">' +
          tags.map(function (t) { return '<span class="tag' + t.mod + '">' + t.label + "</span>"; }).join("") +
        "</div>" +
      "</div>";

    const foto = card.querySelector("img");
    if (foto && look.cat !== "unhas") {
      if (foto.complete) pintarSobra(foto);
      else foto.addEventListener("load", function () { pintarSobra(foto); }, { once: true });
    }
    return card;
  }

  /* ---------- O look principal ----------
     Os resultados abrem por uma sugestão só, grande, com as notas de
     estilista ao lado. As outras ficam numa régua logo abaixo: primeiro os
     looks do nível da busca, depois os dos níveis vizinhos que também
     servem para a ocasião. */
  const CLIMA_LABEL = { quente: "Warm", ameno: "Mild", frio: "Cold" };

  function listaLooks() {
    const res = state.busca;
    return res.exatos.concat(res.relacionados);
  }

  function climaTagDe(look) {
    return (look.cli || []).length === 3
      ? "All weather"
      : (look.cli || []).map(function (c) { return CLIMA_LABEL[c]; }).join(" · ");
  }

  function notasDoLook(look, extra) {
    const res = state.busca;
    const f = state.filtros;
    const grupo = CLIMA_GRUPO[f.clima];
    const notas = [];

    if (extra) {
      notas.push({
        titulo: "Another option",
        texto: "This one is <b>" + look.estilo + "</b>, a neighboring level that also works for " +
          (OCASIAO_FRASE[f.ocasiao] || f.ocasiao) + ".",
      });
    }

    let clima;
    if (res.climaRelaxado && !extra) {
      clima = "There’s no " + res.nivel + " look for " + f.clima.toLowerCase() +
        " weather yet — this is the closest, with nothing out of season.";
    } else if ((look.cli || []).length === 3) {
      clima = "Works in any weather — add or drop a layer as the day changes.";
    } else {
      clima = {
        quente: "Picked for warm days — nothing heavy, nothing out of season.",
        ameno: "Picked for mild weather — easy to layer up or down as the day changes.",
        frio: "Picked for cold days — warm layers that still look sharp indoors.",
      }[grupo];
    }
    notas.push({ titulo: "The weather", texto: clima });

    REGRAS.forEach(function (r) {
      if (r.nota && r.noLook(look, res, f)) notas.push(r.nota);
    });
    return notas;
  }

  function renderLook() {
    const res = state.busca;
    const f = state.filtros;
    const lista = listaLooks();
    el.look.innerHTML = "";

    if (!lista.length) {
      el.look.classList.add("look--vazio");
      el.look.innerHTML =
        '<div class="empty">' +
          "<h2>No complete looks for this weather yet</h2>" +
          "<p>There are no <b>" + res.nivel + "</b> outfits for <b>" + f.clima.toLowerCase() +
          "</b> weather without out-of-season pieces yet. Build one from the pieces below, " +
          "or change the weather in the sentence above.</p>" +
        "</div>";
      return;
    }
    el.look.classList.remove("look--vazio");

    const i = Math.min(state.destaque, lista.length - 1);
    const look = lista[i];
    const extra = i >= res.exatos.length;
    const contador = extra
      ? "Also suitable"
      : "Your look · " + (i + 1) + " of " + res.exatos.length;
    const tags = [
      '<span class="tag tag--style">' + look.estilo + "</span>",
      '<span class="tag">' + climaTagDe(look) + "</span>",
    ];
    const notas = notasDoLook(look, extra);
    const seta = function (d) {
      return '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="' +
        (d < 0 ? "M10 3.5L5.5 8l4.5 4.5" : "M6 3.5L10.5 8 6 12.5") +
        '" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    };

    el.look.innerHTML =
      '<div class="look__media look-card__media look-card__media--foto">' +
        '<img src="' + look.img + '"' + srcsetDe(look.img) +
        ' sizes="(max-width: 768px) 100vw, 560px" alt="" decoding="async" />' +
      "</div>" +
      '<div class="look__info">' +
        '<div class="look__topo">' +
          '<p class="eyebrow look__contador">' + contador + "</p>" +
          '<div class="look__nav">' +
            '<button type="button" class="btn-icon" data-passo="-1" aria-label="Previous look"' +
              (lista.length < 2 ? " disabled" : "") + ">" + seta(-1) + "</button>" +
            '<button type="button" class="btn-icon" data-passo="1" aria-label="Next look"' +
              (lista.length < 2 ? " disabled" : "") + ">" + seta(1) + "</button>" +
          "</div>" +
        "</div>" +
        '<h2 class="look__nome" id="look-nome">' + look.nome + "</h2>" +
        '<p class="look__desc">' + look.desc + "</p>" +
        '<div class="look-card__tags">' + tags.join("") + "</div>" +
        '<div class="notas">' +
          '<p class="eyebrow notas__titulo">Stylist notes</p>' +
          "<ul>" +
            notas.map(function (n) {
              return '<li class="nota"><span class="nota__titulo">' + n.titulo + "</span>" +
                '<span class="nota__texto">' + n.texto + "</span></li>";
            }).join("") +
          "</ul>" +
        "</div>" +
      "</div>";

    const foto = el.look.querySelector("img");
    if (foto.complete) pintarSobra(foto);
    else foto.addEventListener("load", function () { pintarSobra(foto); }, { once: true });

    el.look.querySelectorAll("[data-passo]").forEach(function (b) {
      b.addEventListener("click", function () {
        const passo = Number(b.dataset.passo);
        mostrarLook((state.destaque + passo + lista.length) % lista.length);
        const igual = el.look.querySelector('[data-passo="' + passo + '"]');
        if (igual) igual.focus({ preventScroll: true });
      });
    });
  }

  function renderStrip() {
    const res = state.busca;
    const lista = listaLooks();
    el.strip.innerHTML = "";
    el.stripWrap.hidden = lista.length < 2;

    lista.forEach(function (look, i) {
      const extra = i >= res.exatos.length;
      if (extra && i === res.exatos.length && i > 0) {
        const sep = document.createElement("span");
        sep.className = "strip__sep";
        sep.setAttribute("role", "presentation");
        sep.textContent = "Also suitable";
        el.strip.appendChild(sep);
      }
      const b = document.createElement("button");
      b.type = "button";
      b.className = "thumb";
      b.dataset.i = i;
      b.setAttribute("role", "listitem");
      b.setAttribute("aria-label", look.nome + (extra ? " — " + look.estilo : ""));
      const src = VARIANTES_600[look.img] || look.img;
      b.innerHTML =
        '<span class="thumb__media"><img src="' + encodeURI(src) + '" alt="" loading="lazy" decoding="async" /></span>' +
        (extra ? '<span class="thumb__tag">' + look.estilo + "</span>" : "");
      const foto = b.querySelector("img");
      if (foto.complete) pintarSobra(foto);
      else foto.addEventListener("load", function () { pintarSobra(foto); }, { once: true });
      b.addEventListener("click", function () {
        mostrarLook(i);
        /* O look principal fica acima da régua: no celular ele já saiu da
           tela quando a pessoa chega aqui. */
        const topo = el.look.getBoundingClientRect().top;
        if (topo < 0) el.look.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      el.strip.appendChild(b);
    });
    marcarThumb();
  }

  function marcarThumb() {
    let ativo = null;
    el.strip.querySelectorAll(".thumb").forEach(function (t) {
      const sel = Number(t.dataset.i) === state.destaque;
      if (sel) { t.setAttribute("aria-current", "true"); ativo = t; }
      else t.removeAttribute("aria-current");
    });
    if (!ativo) return;
    const s = el.strip;
    const ini = ativo.offsetLeft - 16;
    const fim = ativo.offsetLeft + ativo.offsetWidth + 16;
    if (ini < s.scrollLeft) s.scrollTo({ left: ini, behavior: "smooth" });
    else if (fim > s.scrollLeft + s.clientWidth) s.scrollTo({ left: fim - s.clientWidth, behavior: "smooth" });
  }

  function mostrarLook(i) {
    state.destaque = i;
    renderLook();
    marcarThumb();
    const nome = el.look.querySelector(".look__nome");
    const contador = el.look.querySelector(".look__contador");
    if (nome) el.lookAnuncio.textContent = contador.textContent + ": " + nome.textContent;
  }

  /* ---------- Build it yourself: as peças por categoria ---------- */
  function categoriasDePecas(genero) {
    return categoriasDe(genero).filter(function (c) { return c.key !== "looks"; });
  }

  function renderTabs() {
    el.cats.innerHTML = "";
    /* Se a categoria ativa não existe para este guarda-roupa (ex.: trocou
       para menswear estando em Dresses), volta para a primeira. */
    const disponiveis = categoriasDePecas(state.filtros.genero);
    if (!disponiveis.some(function (c) { return c.key === state.categoria; })) {
      state.categoria = disponiveis[0].key;
    }

    disponiveis.forEach(function (cat) {
      const n = itensDe(cat.key, state.busca.nivel, state.filtros).length;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat";
      btn.id = "cat-" + cat.key;
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-controls", "results-grid");
      const ativa = state.categoria === cat.key;
      btn.setAttribute("aria-selected", String(ativa));
      /* Padrão ARIA de abas: só a ativa entra no Tab; as setas percorrem
         o resto. */
      btn.tabIndex = ativa ? 0 : -1;
      btn.innerHTML = cat.label + '<span class="cat__count">' + n + "</span>";
      btn.addEventListener("click", function () {
        if (state.categoria === cat.key) return;
        state.categoria = cat.key;
        el.cats.querySelectorAll(".cat").forEach(function (b) {
          const sel = b === btn;
          b.setAttribute("aria-selected", String(sel));
          b.tabIndex = sel ? 0 : -1;
        });
        renderCategoria();
      });
      el.cats.appendChild(btn);
    });
    atualizarMascaraAbas();
  }

  /* Some com o esmaecimento quando a régua chega ao fim. */
  function atualizarMascaraAbas() {
    const fim = el.cats.scrollLeft + el.cats.clientWidth >= el.cats.scrollWidth - 2;
    el.cats.classList.toggle("is-fim", fim);
  }

  function renderCategoria() {
    const f = state.filtros;
    const res = state.busca;
    el.grid.innerHTML = "";
    el.grid.setAttribute("aria-labelledby", "cat-" + state.categoria);

    /* Avisos de regra fixos na grade. Cada um sabe quando se aplica. */
    REGRAS.forEach(function (regra) {
      if (!regra.vale(res, f, state.categoria)) return;
      const aviso = document.createElement("p");
      aviso.className = "notice notice--regra";
      if (regrasPendentes[regra.id]) {
        aviso.classList.add("notice--chamada");
        regrasPendentes[regra.id] = false;
      }
      aviso.innerHTML = regra.aviso;
      el.grid.appendChild(aviso);
    });

    const itens = itensDe(state.categoria, res.nivel, f);
    const rotulo = CATEGORIAS.filter(function (c) { return c.key === state.categoria; })[0].label;

    if (itens.length === 0) {
      const vazio = document.createElement("div");
      vazio.className = "empty";
      vazio.innerHTML =
        "<h2>No suggestions in this category</h2>" +
        "<p>Try another weather or occasion in the sentence above.</p>";
      el.grid.appendChild(vazio);
      el.count.textContent = "0 pieces";
      return;
    }

    /* Título só para leitor de tela, para os H3 dos cards não pendurarem
       direto no H2 da seção. */
    const rotuloSr = document.createElement("h3");
    rotuloSr.className = "sr-only";
    rotuloSr.textContent = rotulo;
    el.grid.appendChild(rotuloSr);

    renderLote(itens, f);
    el.count.textContent = itens.length + (itens.length === 1 ? " piece" : " pieces") + " · " + rotulo;
  }

  /* Mostra as peças em blocos: 34 cards de uma vez viram 40 telas de
     rolagem no celular. */
  const LOTE = 12;

  function renderLote(itens, f) {
    let mostrados = 0;

    function pintar() {
      const antigo = el.grid.querySelector(".carregar-mais");
      if (antigo) antigo.remove();

      const ate = Math.min(mostrados + LOTE, itens.length);
      for (let i = mostrados; i < ate; i++) {
        el.grid.appendChild(cardLook(itens[i], f, i - mostrados));
      }
      mostrados = ate;

      if (mostrados < itens.length) {
        const wrap = document.createElement("div");
        wrap.className = "carregar-mais";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--ghost btn--lg";
        btn.textContent = "Show " + Math.min(LOTE, itens.length - mostrados) +
          " more · " + (itens.length - mostrados) + " left";
        btn.addEventListener("click", function () {
          const primeiroNovo = mostrados;
          pintar();
          /* O botão some no repaint; o foco vai para o primeiro card novo. */
          const alvo = el.grid.querySelectorAll(".look-card")[primeiroNovo];
          if (alvo) {
            alvo.tabIndex = -1;
            alvo.focus({ preventScroll: true });
          }
        });
        wrap.appendChild(btn);
        el.grid.appendChild(wrap);
      }
    }

    pintar();
  }

  function renderResultados(f) {
    state.busca = buscar(f);
    /* Cada aviso de regra chama atenção uma vez por busca, não a cada
       troca de aba. */
    regrasPendentes = {};
    REGRAS.forEach(function (r) { regrasPendentes[r.id] = true; });

    renderFrase("res");
    renderResposta("res");
    state.destaque = 0;
    renderLook();
    renderStrip();

    el.buildSub.innerHTML =
      "Every piece here is <b>" + state.busca.nivel + "</b> and right for " +
      f.clima.toLowerCase() + " weather — mix them your way.";
    renderTabs();
    renderCategoria();
  }

  /* ---------- Navegação entre views ---------- */
  function showView(view) {
    fecharPicker(false);
    [el.viewHome, el.viewResults].forEach(function (v) {
      v.hidden = v !== view;
      v.classList.toggle("is-active", v === view);
    });
    view.classList.remove("is-entering");
    void view.offsetWidth;
    view.classList.add("is-entering");
    window.scrollTo({ top: 0, behavior: "auto" });

    /* Leva o foco para o título da tela nova. Sem isso, quem usa teclado ou
       leitor de tela é devolvido ao topo do documento e precisa tabular
       tudo de novo. */
    const titulo = view.querySelector("h1");
    if (titulo) {
      titulo.setAttribute("tabindex", "-1");
      titulo.focus({ preventScroll: true });
    }
  }

  /* historico: true empilha no navegador (ação do usuário), false apenas
     substitui (restauração de um popstate, que já mexeu no histórico).
     mesmaTela: a busca mudou pela frase dos resultados, então a tela fica
     onde está, sem voltar ao topo. */
  function aplicarFiltros(filtros, historico, mesmaTela) {
    state.filtros = filtros;
    state.rascunho = Object.assign({}, filtros);
    document.title = filtros.estilo + " · " + filtros.ocasiao + " · " + filtros.clima + " — Context";
    try { sessionStorage.setItem("context-filters", JSON.stringify(filtros)); } catch (e) {}
    if (historico !== false) {
      history.pushState({ view: "resultados", filtros: filtros }, "", urlDosFiltros(filtros));
    }
    if (!mesmaTela) showView(el.viewResults);
    renderResultados(filtros);
  }

  function voltarParaHome(historico) {
    document.title = TITULO_BASE;
    if (historico !== false) {
      history.pushState({ view: "home" }, "", location.pathname);
    }
    state.rascunho = Object.assign({}, state.filtros);
    renderFrase("home");
    renderResposta("home");
    showView(el.viewHome);
  }

  /* Voltar/Avançar do navegador alternam entre as duas telas em vez de
     tirar a pessoa do site. */
  window.addEventListener("popstate", function (e) {
    const st = e.state;
    if (st && st.view === "resultados" && st.filtros) {
      aplicarFiltros(st.filtros, false);
    } else {
      voltarParaHome(false);
    }
  });

  /* ---------- Eventos ---------- */
  el.askHome.addEventListener("submit", function (e) {
    e.preventDefault();
    const falta = CHAVES_FRASE.filter(function (k) { return !state.rascunho[k]; })[0];
    if (falta) {
      el.askHomeHint.textContent = "Fill in the blanks to see your looks.";
      el.askHomeHint.classList.add("is-error");
      abrirPicker(slotDe("home", falta));
      return;
    }
    aplicarFiltros(Object.assign({}, state.rascunho));
  });

  /* navegação por setas entre as abas de categoria */
  el.cats.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const tabs = Array.prototype.slice.call(el.cats.querySelectorAll(".cat"));
    const atual = tabs.indexOf(document.activeElement);
    if (atual === -1) return;
    e.preventDefault();
    const prox = e.key === "ArrowRight"
      ? (atual + 1) % tabs.length
      : (atual - 1 + tabs.length) % tabs.length;
    tabs[prox].focus();
    tabs[prox].click();
  });

  el.cats.addEventListener("scroll", atualizarMascaraAbas);
  window.addEventListener("resize", function () {
    atualizarMascaraAbas();
    fecharPicker(false);
  });
  el.pickerScrim.addEventListener("click", function () { fecharPicker(true); });

  el.logoHome.addEventListener("click", function (e) {
    e.preventDefault();
    voltarParaHome();
  });

  /* As diretrizes moram na home; nos resultados o link volta para ela antes
     de rolar até a seção. */
  el.linkDiretrizes.addEventListener("click", function (e) {
    if (el.viewHome.hidden) {
      e.preventDefault();
      voltarParaHome();
      document.getElementById("diretrizes").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  /* ---------- Inicialização ---------- */
  state.rascunho = Object.assign({}, state.filtros);
  ajustarEstilo(state.rascunho);

  /* Link com filtros na URL abre direto nos resultados — é o que permite
     mandar uma consulta pronta para outra pessoa. */
  const daURL = filtrosDaURL();
  if (daURL) {
    Object.keys(daURL).forEach(function (k) { state.filtros[k] = daURL[k]; });
    history.replaceState({ view: "resultados", filtros: state.filtros }, "", location.href);
    aplicarFiltros(state.filtros, false);
  } else {
    history.replaceState({ view: "home" }, "", location.href);
    renderFrase("home");
    renderResposta("home");
  }
})();
