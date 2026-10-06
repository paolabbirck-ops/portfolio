# Currículo — Product Designer (UX/UI)

- `Paola_Bertoni_Product_Designer_UX_UI.pdf`: versão em português
- `Paola_Bertoni_Product_Designer_UX_UI_EN.pdf`: versão em inglês

Os PDFs têm texto real (selecionável), na ordem de leitura certa para sistemas de recrutamento (ATS).

## Editar e gerar de novo

1. Edite o texto em `src/cv_pt.html` / `src/cv_en.html` (o visual fica em `src/cv.css`).
2. Rode na raiz do repositório:

```sh
NODE_PATH=$(npm root -g) node curriculo/src/build.mjs
```

O script precisa do Playwright com Chromium. As fontes em `src/fonts` são a Inter (SIL Open Font License), convertidas para TrueType, para que o PDF não use fontes Type 3.
