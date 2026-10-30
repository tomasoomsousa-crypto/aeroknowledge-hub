# AeroKnowledge Hub

Aplicação web para registar e partilhar o conhecimento prático dos mecânicos de manutenção aeronáutica (MRO). Os mecânicos registam no hangar as soluções que encontram e os colegas mais novos tiram dúvidas num chat.

**Demo online:** https://tomasoomsousa-crypto.github.io/aeroknowledge-hub/

> Projeto de demonstração. Todos os dados (dicas, pessoas, matrículas) são fictícios e as dicas não substituem os manuais oficiais do avião.

## O que faz

- **Dois perfis**, que se trocam no topo da página: Mecânico e Supervisor / Engenheiro de Qualidade.
- **Submeter**: formulário pensado para tablet. Pede avião, sistema (código ATA), peça, aviso, horas de paragem poupadas, tipo de anexo e a descrição da solução. A dica fica *Pendente de Aprovação*.
- **Validação** (só Supervisor):
  - aprovar, com confirmação das horas poupadas, ou rejeitar com um motivo;
  - **Hangar ao vivo**: os aviões desenhados nos lugares do hangar, com o estado de cada um (operacional, em manutenção ou parado), as paragens do dia e os motivos, e as dicas que podem ajudar;
  - indicadores: horas poupadas, tempo de decisão, gráficos por mês, sistema e avião, e quem mais contribui.
- **Feed**: as dicas aprovadas, com pesquisa e filtros por avião e sistema.
- **Chat MEC-AI**: o mecânico descreve o problema por palavras suas. O assistente faz perguntas até perceber a causa e responde só com dicas aprovadas, mostrando sempre quem resolveu o problema.

## Duas versões

| | claude.ai (Artifact) | GitHub Pages (este repositório) |
|---|---|---|
| Dados | Base partilhada em tempo real entre dispositivos | Dados de exemplo guardados só no browser de cada pessoa |
| Chat MEC-AI | IA (Claude), com perguntas de diagnóstico e análise de fotos | Pesquisa por palavras-chave |

A página deteta sozinha onde está a correr. Fora do claude.ai entra em **Modo demo**, e o link "Repor dados de exemplo", no fundo da página, volta ao início.

## Ficheiros

- `aeroknowledge-hub.html`: a aplicação, numa página só, sem dependências. É o ficheiro publicado como Artifact.
- `index.html`: a mesma página com o cabeçalho HTML completo, para o GitHub Pages. É gerado por `build.py`.
- `seed-items.json`: as dicas de exemplo.
- `seed-fleet.json`: os aviões de exemplo do hangar.

## Correr localmente

O browser não carrega os ficheiros JSON se abrires o `index.html` diretamente. Usa um servidor local:

```bash
python -m http.server 8000
```

Depois abre http://localhost:8000.

Depois de alterares `aeroknowledge-hub.html`, volta a gerar o `index.html`:

```bash
python build.py
```
