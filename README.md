<div align="center">
  <img src="./assets/header.svg" alt="Gestão de Frota — abastecimento, consumo e manutenção" width="100%">
</div>

Aplicação React para acompanhar abastecimentos, consumo de combustível e manutenção do veículo. Os registros são salvos localmente no navegador.

## Recursos

- Cadastro de quilometragem, distância rodada e litros abastecidos.
- Cálculo do consumo médio em km/L.
- Histórico dos cinco abastecimentos mais recentes.
- Status de manutenção calculado a partir da quilometragem da última troca informada.
- Validação para impedir hodômetro regressivo e valores inválidos.
- Armazenamento local com tratamento de dados inválidos.

## Executar localmente

1. Instale uma versão recente do Node.js.
2. No diretório do projeto, execute `npm install`.
3. Execute `npm run dev` e abra o endereço indicado no terminal.
4. Para validar a versão de produção, execute `npm run build`.

## Observação sobre manutenção

Os intervalos exibidos são os valores configurados no aplicativo e servem apenas como referência. Confira o manual e as recomendações de um mecânico para o ano e a versão exatos do veículo. Os dados ficam no armazenamento local do navegador e não são enviados a um servidor.
