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
    { key: "vestidos", label: "Dresses", genero: "Womenswear", desc: "One piece that settles the whole look." },
    { key: "tops", label: "Tops", desc: "The top layer of the look at this level." },
    { key: "bottoms", label: "Bottoms", desc: "The base of the outfit." },
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

  /* ---------- Regras com aviso na tela ----------
     Cada regra tem um aviso fixo na grade e um modal. `vale()` decide quando
     ela se aplica; `abreEm` define quando o modal dispara — null é a entrada
     nos resultados, uma chave de categoria é a abertura daquela aba, e uma
     lista aceita mais de um gatilho (vale o primeiro que acontecer). */
  /* Níveis em que a regra da calça jeans vale, para ambos os gêneros. */
  const NIVEIS_COM_REGRA_JEANS = ["Business casual", "Smart casual"];

  const REGRAS = [
    {
      id: "jeans",
      /* Abre nos Looks completos (na entrada dos resultados, que já cai
         nessa aba, e ao voltar para ela) e em "Partes de baixo" — as duas
         abas onde a calça jeans aparece. */
      abreEm: [null, "looks", "bottoms"],
      /* As abas reabrem o modal toda vez que são abertas; a entrada dispara
         uma vez por busca. */
      sempre: ["looks", "bottoms"],
      vale: function (res, f, cat) {
        return NIVEIS_COM_REGRA_JEANS.indexOf(res.nivel) !== -1 &&
          (cat === "looks" || cat === "bottoms");
      },
      aviso:
        "<b>About jeans:</b> only <b>straight</b> and <b>wide-leg</b> cuts, " +
        "in the washes shown in the examples. The leg should fall loose from hip to hem.",
      modal: {
        titulo: "The jeans rule",
        eyebrow: "Before you choose",
        /* O texto nomeia o nível da busca: a regra é a mesma nos dois. */
        texto: function (res) {
          return "In " + res.nivel + ", jeans are welcome <b>only in straight and wide-leg cuts</b>, " +
            "in the washes shown in the examples. The leg should fall loose from hip to hem.";
        },
        icone: "bottoms",
      },
    },
    {
      id: "sapatoAberto",
      abreEm: "sapatos",
      vale: function (res, f, cat) { return f.genero === "Womenswear" && cat === "sapatos"; },
      aviso:
        "<b>About open shoes:</b> sandals, mules and peep toes leave your feet on show. " +
        "Choose them when your toenails are done and the polish is in good shape — " +
        "no chips. When in doubt, a closed shoe does the job.",
      modal: {
        titulo: "Open shoes call for polished feet",
        eyebrow: "Before you choose",
        texto:
          "Sandals, mules and peep toes put your feet on display. Save them for " +
          "days when your <b>toenails are done</b> and the polish is intact, " +
          "with no chips. When in doubt, a closed shoe always works.",
        icone: "sapatos",
      },
    },
    {
      id: "unhas",
      abreEm: "unhas",
      vale: function (res, f, cat) { return cat === "unhas"; },
      aviso:
        "<b>About nails:</b> keep them neat and well groomed, with intact polish. " +
        "At the formal levels, stick to the <b>neutral shades</b> in this palette.",
      modal: {
        titulo: "Nails, always well kept",
        eyebrow: "Polish tip",
        texto:
          "Nails are part of the outfit: keep them <b>neat and well groomed</b>, " +
          "with intact, chip-free polish. At the formal levels, go for " +
          "<b>neutral shades</b> — nude, rosé, taupe and milky white.",
        icone: "unhas",
      },
    },
  ];

  /* Marca quais avisos ainda não chamaram atenção nesta busca. Consumido no
     primeiro render que exibe cada um. */
  let regrasPendentes = {};
  let modaisPendentes = {};

  /* ---------- Estado ---------- */
  const state = {
    filtros: { area: "", ocasiao: "", clima: "", estilo: "", genero: "" },
    categoria: "looks",
    busca: null,
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
    formHome: document.getElementById("form-filtros"),
    formHomeCampos: document.getElementById("form-filtros-campos"),
    formHint: document.getElementById("form-hint"),
    formProgress: document.getElementById("form-progress"),
    formDrawer: document.getElementById("form-drawer"),
    formDrawerCampos: document.getElementById("form-drawer-campos"),
    btnEditar: document.getElementById("btn-editar-filtros"),
    drawer: document.getElementById("drawer"),
    overlay: document.getElementById("drawer-overlay"),
    jeansOverlay: document.getElementById("jeans-overlay"),
    jeansModal: document.getElementById("jeans-modal"),
    jeansOk: document.getElementById("jeans-ok"),
    jeansFechar: document.getElementById("jeans-fechar"),
    jeansIcone: document.getElementById("jeans-icone"),
    jeansEyebrow: document.getElementById("jeans-eyebrow"),
    jeansTitulo: document.getElementById("jeans-titulo"),
    jeansTexto: document.getElementById("jeans-texto"),
    drawerClose: document.getElementById("drawer-close"),
    drawerCancel: document.getElementById("drawer-cancel"),
    chips: document.getElementById("chips"),
    styledesc: document.getElementById("results-styledesc"),
    cats: document.getElementById("cats"),
    grid: document.getElementById("results-grid"),
    count: document.getElementById("results-count"),
    related: document.getElementById("results-related"),
    relatedGrid: document.getElementById("results-related-grid"),
    logoHome: document.getElementById("logo-home"),
    linkDiretrizes: document.getElementById("link-diretrizes"),
    header: document.getElementById("header"),
    conteudo: document.getElementById("conteudo"),
    footer: document.querySelector(".footer"),
  };

  /* ---------- Construção dos selects ---------- */
  function buildFields(container, prefix) {
    FILTERS.forEach(function (f) {
      const field = document.createElement("div");
      field.className = "field";
      field.dataset.key = f.key;

      const label = document.createElement("label");
      label.className = "field__label";
      label.setAttribute("for", prefix + "-" + f.key);
      label.innerHTML = f.label + '<span class="field__check" aria-hidden="true"></span>';

      const wrap = document.createElement("div");
      wrap.className = "select-wrap";

      const select = document.createElement("select");
      select.className = "select";
      select.id = prefix + "-" + f.key;
      select.name = f.key;
      select.required = true;

      const ph = document.createElement("option");
      ph.value = "";
      ph.textContent = f.placeholder;
      ph.disabled = true;
      ph.selected = true;
      select.appendChild(ph);

      f.options.forEach(function (opt) {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        select.appendChild(o);
      });

      select.addEventListener("change", function () {
        field.classList.toggle("is-filled", !!select.value);
        field.classList.remove("is-error");
        select.removeAttribute("aria-invalid");
        if (f.key === "ocasiao" || f.key === "area" || f.key === "genero") atualizarEstilos(prefix);
        if (prefix === "home") updateProgress();
      });

      wrap.appendChild(select);
      field.appendChild(label);
      field.appendChild(wrap);

      if (f.key === "estilo") {
        const note = document.createElement("p");
        note.className = "field__note";
        note.id = prefix + "-estilo-note";
        note.hidden = true;
        /* A nota explica por que as opções mudaram e quando o nível foi
           escolhido sozinho — precisa ser lida e anunciada. */
        note.setAttribute("aria-live", "polite");
        select.setAttribute("aria-describedby", note.id);
        field.appendChild(note);
      }

      container.appendChild(field);
    });
  }

  /* Restringe o select de estilo aos níveis permitidos pela ocasião:
     opções fora da regra ficam desabilitadas; ocasião com nível único
     seleciona automaticamente; seleção inválida é limpa. */
  function atualizarEstilos(prefix) {
    const ocasiao = document.getElementById(prefix + "-ocasiao").value;
    const area = document.getElementById(prefix + "-area").value;
    const genero = document.getElementById(prefix + "-genero").value;
    const select = document.getElementById(prefix + "-estilo");
    const field = select.closest(".field");
    const note = document.getElementById(prefix + "-estilo-note");
    const permitidos = niveisPermitidos(ocasiao, area, genero);

    /* Níveis fora da regra saem da lista: o Smart casual não deve nem
       aparecer para áreas sem liberação no dia a dia. */
    Array.prototype.forEach.call(select.options, function (opt) {
      if (!opt.value) return;
      const fora = permitidos.indexOf(opt.value) === -1;
      opt.disabled = fora;
      opt.hidden = fora;
    });

    if (select.value && permitidos.indexOf(select.value) === -1) {
      select.value = "";
    }
    if (ocasiao && permitidos.length === 1) {
      select.value = permitidos[0];
    }
    field.classList.toggle("is-filled", !!select.value);
    field.classList.remove("is-error");

    if (note) {
      if (ocasiao && permitidos.length === 1) {
        note.textContent = "Level set by the selected occasion.";
        note.hidden = false;
      } else if (ocasiao) {
        note.textContent = permitidos.length + " levels available for this occasion.";
        note.hidden = false;
      } else {
        note.hidden = true;
      }
    }
    if (prefix === "home") updateProgress();
  }

  function setFormValues(prefix, filtros) {
    FILTERS.forEach(function (f) {
      const select = document.getElementById(prefix + "-" + f.key);
      select.value = filtros[f.key] || "";
      select.closest(".field").classList.toggle("is-filled", !!select.value);
      select.closest(".field").classList.remove("is-error");
    });
    atualizarEstilos(prefix);
  }

  function readFormValues(prefix) {
    const out = {};
    FILTERS.forEach(function (f) {
      out[f.key] = document.getElementById(prefix + "-" + f.key).value;
    });
    return out;
  }

  function validateForm(prefix) {
    let firstMissing = null;
    FILTERS.forEach(function (f) {
      const select = document.getElementById(prefix + "-" + f.key);
      const field = select.closest(".field");
      if (!select.value) {
        field.classList.add("is-error", "shake");
        /* O estado de erro não pode depender só da cor da borda. */
        select.setAttribute("aria-invalid", "true");
        setTimeout(function () { field.classList.remove("shake"); }, 400);
        if (!firstMissing) firstMissing = select;
      } else {
        select.removeAttribute("aria-invalid");
      }
    });
    if (firstMissing) firstMissing.focus();
    return !firstMissing;
  }

  function updateProgress() {
    const values = readFormValues("home");
    const n = FILTERS.filter(function (f) { return values[f.key]; }).length;
    el.formProgress.textContent = n === 5 ? "All set — see your suggestions" : n + " of 5 filters selected";
    el.formHint.classList.remove("is-error");
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

    const CLIMA_LABEL = { quente: "Warm", ameno: "Mild", frio: "Cold" };
    const climaTag = (look.cli || []).length === 3
      ? "All weather"
      : (look.cli || []).map(function (c) { return CLIMA_LABEL[c]; }).join(" · ");

    /* Área e ocasião não entram: são iguais em todos os cards e já estão
       nos chips do topo. Sobra o que de fato distingue um card do outro. */
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

  function renderChips(f) {
    const partes = [
      { label: "Department", value: f.area },
      { label: "Occasion", value: f.ocasiao },
      { label: "Weather", value: f.clima },
      { label: "Style", value: f.estilo },
      { label: "Wardrobe", value: f.genero },
    ];
    el.chips.innerHTML =
      partes.map(function (p) {
        return '<span class="chip"><span class="chip__label">' + p.label + "</span><b>" + p.value + "</b></span>";
      }).join("") +
      '<span class="chip chip--edit">' +
        '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path d="M11.3 2.7a1.6 1.6 0 0 1 2.3 2.3L5.5 13l-3 .7.7-3 8.1-8z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>' +
        "Edit</span>";
  }

  function contagem(catKey) {
    const f = state.filtros;
    const res = state.busca;
    if (!res || !res.nivel) return 0;
    if (catKey === "looks") return res.exatos.length;
    return itensDe(catKey, res.nivel, f).length;
  }

  function renderTabs() {
    el.cats.innerHTML = "";
    /* Se a categoria ativa não existe para este gênero (ex.: trocou para
       masculino estando em Vestidos), volta para Looks completos. */
    const disponiveis = categoriasDe(state.filtros.genero);
    if (!disponiveis.some(function (c) { return c.key === state.categoria; })) {
      state.categoria = "looks";
    }

    disponiveis.forEach(function (cat) {
      const n = contagem(cat.key);
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
        if (state.categoria === cat.key) {
          /* Reclicar a aba já ativa não precisa re-renderizar, mas o aviso da
             categoria ainda deve aparecer — é o que a regra do jeans pede. */
          dispararModalDaCategoria(cat.key);
          return;
        }
        state.categoria = cat.key;
        el.cats.querySelectorAll(".cat").forEach(function (b) {
          const sel = b === btn;
          b.setAttribute("aria-selected", String(sel));
          b.tabIndex = sel ? 0 : -1;
        });
        renderCategoria();
        dispararModalDaCategoria(cat.key);
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

    if (!res.adequado && res.nivel) {
      const aviso = document.createElement("p");
      aviso.className = "notice";
      aviso.innerHTML =
        "<b>" + f.estilo + "</b> isn't the recommended level for <b>" + f.ocasiao + "</b>. " +
        "Here are suggestions in <b>" + res.nivel + "</b>, the closest suitable level.";
      el.grid.appendChild(aviso);
    }

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

    if (res.climaRelaxado && state.categoria === "looks") {
      const avisoClima = document.createElement("p");
      avisoClima.className = "notice";
      avisoClima.innerHTML =
        "There are no <b>" + res.nivel + "</b> looks for <b>" + f.clima.toLowerCase() + "</b> weather yet — " +
        "showing options for the closest weather (nothing out of season).";
      el.grid.appendChild(avisoClima);
    }

    const itens = state.categoria === "looks" ? res.exatos : itensDe(state.categoria, res.nivel, f);
    const rotulo = CATEGORIAS.filter(function (c) { return c.key === state.categoria; })[0].label;

    if (itens.length === 0) {
      const vazio = document.createElement("div");
      vazio.className = "empty";
      const semClima = state.categoria === "looks";
      vazio.innerHTML =
        "<h2>" + (semClima ? "No looks for this weather yet" : "No suggestions in this category") + "</h2>" +
        "<p>" + (semClima
          ? "There are no <b>" + res.nivel + "</b> outfits for <b>" + f.clima.toLowerCase() +
            "</b> weather without out-of-season pieces yet. Try another weather or edit the filters."
          : "Adjust the filters to explore other combinations.") + "</p>" +
        '<button type="button" class="btn btn--primary" id="empty-edit">Edit filters</button>';
      el.grid.appendChild(vazio);
      document.getElementById("empty-edit").addEventListener("click", openDrawer);
      el.count.textContent = "0 suggestions";
    } else {
      /* Título só para leitor de tela, para os H3 dos cards não pendurarem
         direto no H1 da página. */
      const rotuloSr = document.createElement("h2");
      rotuloSr.className = "sr-only";
      rotuloSr.textContent = rotulo;
      el.grid.appendChild(rotuloSr);

      renderLote(itens, f);
      el.count.textContent =
        itens.length + (itens.length === 1 ? " suggestion" : " suggestions") + " · " + rotulo;
    }

    /* "Você também pode considerar" apenas em Looks completos. A limpeza
       fica fora do if para não guardar cards de buscas anteriores. */
    el.relatedGrid.innerHTML = "";
    el.related.hidden = !(state.categoria === "looks" && res.relacionados.length > 0);
    if (!el.related.hidden) {
      res.relacionados.forEach(function (look, i) {
        el.relatedGrid.appendChild(cardLook(look, f, i));
      });
    }
  }

  /* Mostra os resultados em blocos: 34 cards de uma vez viram 40 telas de
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
      const primeiroNovo = mostrados;
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
          pintar();
          const cards = el.grid.querySelectorAll(".look-card");
          const alvo = cards[primeiroNovo + LOTE];
          if (alvo) alvo.focus ? alvo.focus() : null;
        });
        wrap.appendChild(btn);
        el.grid.appendChild(wrap);
      }
    }

    pintar();
  }

  function renderResultados(f) {
    state.busca = buscar(f);
    /* Cada regra chama atenção uma vez por busca, não a cada troca de aba. */
    regrasPendentes = {};
    modaisPendentes = {};
    REGRAS.forEach(function (r) {
      regrasPendentes[r.id] = true;
      /* Uma pendência por gatilho: o modal aberto na entrada não pode
         consumir o que deve abrir ao entrar numa aba específica. */
      gatilhosDe(r).forEach(function (g) { modaisPendentes[r.id + "|" + g] = true; });
    });
    renderChips(f);
    el.styledesc.textContent = NIVEL_DESC[state.busca.nivel] || "";
    renderTabs();

    /* Sem estado de carregamento: `buscar()` é filtragem síncrona sobre um
       catálogo já em memória, na casa do sub-milissegundo. O atraso de 750 ms
       e os skeletons que havia aqui fabricavam uma espera que não existe. A
       troca de tela já é sinalizada pelo `is-entering` da view e pelo
       `card-in` escalonado de cada card. */
    renderCategoria();
    /* Regras sem categoria de gatilho abrem já na entrada dos resultados;
       as demais esperam o usuário abrir a aba correspondente. */
    dispararModalDaCategoria(null);
  }

  /* ---------- Navegação entre views ---------- */
  function showView(view) {
    [el.viewHome, el.viewResults].forEach(function (v) {
      v.hidden = v !== view;
      v.classList.toggle("is-active", v === view);
    });
    view.classList.remove("is-entering");
    void view.offsetWidth;
    view.classList.add("is-entering");
    window.scrollTo({ top: 0, behavior: "auto" });
    el.btnEditar.hidden = view !== el.viewResults;
    el.linkDiretrizes.hidden = view === el.viewResults;

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
     substitui (restauração de um popstate, que já mexeu no histórico). */
  function aplicarFiltros(filtros, historico) {
    state.filtros = filtros;
    document.title = filtros.estilo + " · " + filtros.ocasiao + " · " + filtros.clima + " — Context";
    try { sessionStorage.setItem("context-filters", JSON.stringify(filtros)); } catch (e) {}
    if (historico !== false) {
      history.pushState({ view: "resultados", filtros: filtros }, "", urlDosFiltros(filtros));
    }
    showView(el.viewResults);
    renderResultados(filtros);
  }

  function voltarParaHome(historico) {
    document.title = TITULO_BASE;
    if (historico !== false) {
      history.pushState({ view: "home" }, "", location.pathname);
    }
    showView(el.viewHome);
    setFormValues("home", state.filtros);
    updateProgress();
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

  /* Enquanto um diálogo está aberto, o resto da página fica inerte: sai do
     tab order E da árvore de acessibilidade. O trap manual de Tab que havia
     aqui só resolvia a primeira metade — quem usa leitor de tela em modo de
     leitura (setas, cursor virtual) atravessava o overlay e continuava lendo
     os cards atrás dele. `inert` cobre os dois casos e dispensa o trap. */
  const FUNDO = [el.header, el.conteudo, el.footer];
  function fundoInerte(v) {
    FUNDO.forEach(function (n) { if (n) n.inert = v; });
  }

  /* ---------- Modal de regra ----------
     Um único modal, com o conteúdo trocado conforme a regra. */
  let focoAntesModal = null;

  /* Abre o modal da regra ligada a esta categoria, se ainda não foi mostrado
     nesta busca e se a regra de fato se aplica ao contexto atual. */
  function gatilhosDe(r) {
    return Array.isArray(r.abreEm) ? r.abreEm : [r.abreEm];
  }

  function dispararModalDaCategoria(catKey) {
    if (!state.busca) return;
    const regra = REGRAS.filter(function (r) {
      return gatilhosDe(r).indexOf(catKey) !== -1 &&
        modaisPendentes[r.id + "|" + catKey] &&
        r.vale(state.busca, state.filtros, catKey === null ? state.categoria : catKey);
    })[0];
    if (!regra) return;
    /* Gatilho marcado em `sempre` continua pendente: reabre a cada visita. */
    if ((regra.sempre || []).indexOf(catKey) === -1) {
      modaisPendentes[regra.id + "|" + catKey] = false;
    }
    abrirModalRegra(regra);
  }

  function abrirModalRegra(regra) {
    const m = regra.modal;
    el.jeansEyebrow.textContent = m.eyebrow;
    el.jeansTitulo.textContent = m.titulo;
    el.jeansTexto.innerHTML = typeof m.texto === "function" ? m.texto(state.busca) : m.texto;
    el.jeansIcone.innerHTML = iconeSvg(m.icone, "", 28);

    focoAntesModal = document.activeElement;
    el.jeansOverlay.hidden = false;
    el.jeansModal.hidden = false;
    void el.jeansModal.offsetWidth;
    el.jeansOverlay.classList.add("is-open");
    el.jeansModal.classList.add("is-open");
    document.body.style.overflow = "hidden";
    fundoInerte(true);
    el.jeansOk.focus();
    document.addEventListener("keydown", onModalJeansKeydown);
  }

  function fecharModalJeans() {
    el.jeansOverlay.classList.remove("is-open");
    el.jeansModal.classList.remove("is-open");
    document.body.style.overflow = "";
    fundoInerte(false);
    document.removeEventListener("keydown", onModalJeansKeydown);
    setTimeout(function () {
      el.jeansOverlay.hidden = true;
      el.jeansModal.hidden = true;
    }, 340);
    /* O elemento que tinha o foco costuma ser o botão da home, já oculto
       quando o modal abre. Nesse caso o foco vai para a aba ativa. */
    const voltarPara = focoAntesModal && focoAntesModal.isConnected && focoAntesModal.offsetParent
      ? focoAntesModal
      : el.cats.querySelector('[aria-selected="true"]');
    if (voltarPara && voltarPara.focus) voltarPara.focus();
  }

  /* Só Escape: a contenção do Tab vem do `inert` no fundo. A lista fixa de
     focáveis que havia aqui deixaria um link inalcançável se o texto de uma
     regra passasse a ter um. */
  function onModalJeansKeydown(e) {
    if (e.key === "Escape") fecharModalJeans();
  }

  /* ---------- Drawer ---------- */
  let lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    setFormValues("drawer", state.filtros);
    el.overlay.hidden = false;
    el.drawer.hidden = false;
    void el.drawer.offsetWidth;
    el.overlay.classList.add("is-open");
    el.drawer.classList.add("is-open");
    document.body.style.overflow = "hidden";
    fundoInerte(true);
    const first = el.drawer.querySelector("select");
    if (first) first.focus();
    document.addEventListener("keydown", onDrawerKeydown);
  }

  function closeDrawer() {
    el.overlay.classList.remove("is-open");
    el.drawer.classList.remove("is-open");
    document.body.style.overflow = "";
    /* Antes de devolver o foco: o elemento que o tinha costuma estar no
       header, que acabou de sair do inerte. */
    fundoInerte(false);
    document.removeEventListener("keydown", onDrawerKeydown);
    setTimeout(function () {
      el.overlay.hidden = true;
      el.drawer.hidden = true;
    }, 450);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* Só Escape: a contenção do Tab vem do `inert` no fundo. */
  function onDrawerKeydown(e) {
    if (e.key === "Escape") closeDrawer();
  }

  /* ---------- Eventos ---------- */
  el.formHome.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateForm("home")) {
      el.formProgress.textContent = "Select all filters to continue";
      el.formHint.classList.add("is-error");
      return;
    }
    aplicarFiltros(readFormValues("home"));
  });

  el.formDrawer.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateForm("drawer")) return;
    const filtros = readFormValues("drawer");
    closeDrawer();
    aplicarFiltros(filtros);
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

  el.btnEditar.addEventListener("click", openDrawer);
  el.chips.addEventListener("click", openDrawer);
  el.drawerClose.addEventListener("click", closeDrawer);
  el.drawerCancel.addEventListener("click", closeDrawer);
  el.overlay.addEventListener("click", closeDrawer);
  el.jeansOk.addEventListener("click", fecharModalJeans);
  el.jeansFechar.addEventListener("click", fecharModalJeans);
  el.jeansOverlay.addEventListener("click", fecharModalJeans);
  el.cats.addEventListener("scroll", atualizarMascaraAbas);
  window.addEventListener("resize", atualizarMascaraAbas);

  el.logoHome.addEventListener("click", function (e) {
    e.preventDefault();
    voltarParaHome();
  });

  /* ---------- Inicialização ---------- */
  buildFields(el.formHomeCampos, "home");
  buildFields(el.formDrawerCampos, "drawer");

  /* Link com filtros na URL abre direto nos resultados — é o que permite
     mandar uma consulta pronta para outra pessoa. */
  const daURL = filtrosDaURL();
  if (daURL) {
    Object.keys(daURL).forEach(function (k) { state.filtros[k] = daURL[k]; });
    history.replaceState({ view: "resultados", filtros: state.filtros }, "", location.href);
    setFormValues("home", state.filtros);
    updateProgress();
    aplicarFiltros(state.filtros, false);
  } else {
    history.replaceState({ view: "home" }, "", location.href);
    setFormValues("home", state.filtros);
    updateProgress();
  }
})();
