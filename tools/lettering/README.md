# Letreiramentos do banner ("the future")

Gera as versões desenhadas à mão de "the future" que trocam no banner da home
(`assets/images/tf/tf-NN.webp`).

Cada versão parte de um esqueleto de traço único (fontes de linha única EMS/Hershey,
licença OFL, em `fonts/`), recebe imperfeições de mão (inclinação, tremor, letras
desalinhadas) e é "pintada" com uma ferramenta simulada: pincel, caneta-pincel,
pena chanfrada, marcador, pincel seco, contorno traçado à mão, pautas de caderno
com rabiscos de aquecimento, linha interna e tinta escorrendo. No fim leva textura
de tinta escaneada (borda irregular, falhas de fotocópia, respingos).

```sh
pip install numpy opencv-python-headless pillow
python3 gen.py fatbrush,capsmarker 1,2,3   # gera candidatos em cand/ e cands.jpg
python3 final.py ../../assets/images/tf     # renderiza a seleção (PICKS) em WebP
```

`final.py` também grava `manifest.json` com a caixa da palavra de cada imagem; esses
números vão para a lista `L` do script do banner em `index.html`.
