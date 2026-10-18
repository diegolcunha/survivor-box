# Disjuntores e fusíveis — CD 1.10

Protótipo local. Abra `index.html` no navegador. Nenhum servidor ou instalação é necessário.

Três disjuntores ficam acima de uma caixa com seis encaixes de fusíveis, distribuídos em três circuitos: iluminação (10 pontos), ventilação (15) e bancada (20). Os pontos são uma regra fictícia de soma exata para o puzzle.

Dois fusíveis começam queimados. É possível retirar, encaixar e redistribuir peças por arraste ou selecionando a peça e clicando no destino. O botão “Guardar no inventário” retira a peça selecionada. Substituir uma peça devolve a anterior ao inventário. Fusíveis não são consumidos pelas tentativas.

Um circuito liga se a soma de suas peças boas for exatamente a carga indicada e nenhum fusível queimado permanecer nele. Um encaixe vazio é permitido se a soma for suficiente. Configurações inadequadas fazem o disjuntor piscar e voltar para OFF após 720 ms. Alterar as peças desliga os circuitos afetados e cancela testes pendentes. Vencer exige os três circuitos ligados simultaneamente; Reset restaura tudo.

Validação: `node --test disjuntores/puzzle.test.cjs` a partir da raiz do GameExp. Seis testes cobrem a lógica e o controlador com DOM simulado. A aparência e os gestos de arraste ainda precisam de avaliação no navegador real.

Fluxo combinado com o usuário: alterações locais primeiro; commit e envio ao GitHub apenas após solicitação explícita.
