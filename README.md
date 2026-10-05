# IRIS — Infrared Interpretation System

Aplicação web didática para **interpretação de espectros de infravermelho (IV/FTIR)** em Química Orgânica.
O estudante digita os números de onda observados e o IRIS conduz a análise por uma árvore de decisão,
explicando o raciocínio: **bandas → ligações → grupos funcionais → classe provável de composto**.

Árvore de decisão baseada em: Lopes, W. A.; Fascio, M. *Quím. Nova* **2004**, 27, 670–673.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento
npm test         # testes do motor (exemplos A–D do artigo + exemplos didáticos)
npm run build    # gera dist/
```

Deploy: o workflow `.github/workflows/deploy.yml` (igual ao do Elementar) publica no GitHub Pages a cada push na `main`
(ative em *Settings → Pages → Source: GitHub Actions*).

## Entrada

- Separadores: vírgula, espaço ou ponto e vírgula. Uma banda só também vale.
- Sufixos opcionais (notação das tabelas de correlação): `F` forte, `m` média, `f` fraca, `L` larga.
- Faixa = absorção larga: `2500-3300`.
- Fórmula molecular opcional → calcula o IDH.

Quando forma ou intensidade da banda são decisivas e não foram informadas, o IRIS **pergunta ao estudante**
(ex.: "a banda em 3350 é larga ou estreita?").

## Estrutura

```
src/
  data/                ← tudo o que é química e fácil de editar
    irRules.js         faixas de número de onda (IR_RULES), subfaixas de C=O, regiões do gráfico
    hypotheses.js      funções orgânicas e pontuação (índice de compatibilidade)
    steps.js           etapas da análise guiada
    examples.js        exemplos para praticar
  input/
    manualInput.js     entrada digitada → formato padrão de banda
  engine/              motor de análise (sem React; testável)
    evidence.js        bandas → evidências (presente / incerta / ausente) + perguntas
    scoring.js         índice de compatibilidade espectroscópica
    decisionTree.js    árvore de Lopes & Fascio
    reasoning.js       texto "Como chegamos a essa conclusão?"
    idh.js             índice de deficiência de hidrogênio
    index.js           analyzeSpectrum(bands, answers, { formula })
  components/          interface (React + Tailwind, mesmo estilo do Elementar)
```

### Como ajustar / estender

- **Mudar uma faixa:** edite `min`/`max` em `src/data/irRules.js`.
- **Nova função orgânica ou nova pontuação:** copie um bloco em `src/data/hypotheses.js`.
- **Tolerância nas bordas das faixas:** `TOLERANCE` em `irRules.js` (padrão 10 cm⁻¹ → evidência "incerta").

### Arquitetura futura (não implementado)

Todo dado de entrada vira o mesmo objeto de banda `{ value, min, max, width, intensity }`. Assim, novos
adaptadores em `src/input/` (upload de espectro, CSV, detecção automática de picos) alimentam o mesmo motor.
Comparação com banco de espectros, machine learning, proposição de estruturas e RDKit (ex.: RDKit.js/WASM)
devem consumir o objeto de evidências retornado por `analyzeSpectrum`, em módulos novos (ex.: `src/structure/`).
