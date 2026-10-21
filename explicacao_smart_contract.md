# Explicação do Smart Contract: Caução Locatícia

Este documento detalha passo a passo a implementação do contrato inteligente `CaucaoLocaticia.sol`, explicando as lógicas, as atualizações de otimização de Gas e os mecanismos de proteção temporais integrados para defesa do TCC.

## 1. Declaração e Importações
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
```
- **OpenZeppelin:** Importamos bibliotecas padrão da indústria.
  - `ReentrancyGuard`: Impede ataques de chamadas recursivas, blindando a função de saque.
  - `SafeERC20`: Garante transações padronizadas ao lidar com a stablecoin (MockBRL).

## 2. Erros Customizados (Custom Errors)
```solidity
error EstadoInvalido();
error PrazoNaoVencido();
error PrazoEmAberto();
...
```
A mudança para `Custom Errors` no lugar de `require("String gigante")` reflete uma otimização moderna e obrigatória para reduzir o tamanho do *bytecode* e economizar *Gas* operacional.

## 3. Contrato Principal, Enums e Tipos de Dados
```solidity
enum Estado { CRIADO, ATIVO, AGUARDANDO_LAUDO, LAUDO_EMITIDO, EM_DISPUTA, ENCERRADO }
enum Motivo { FIM_PRAZO, INADIMPLENCIA, RESCISAO_ANTECIPADA }
```
- **`enum Estado`**: A Máquina de Estados blindada. Cada transição é irreversível, guiando o processo de aluguel passo a passo.
- **`enum Motivo`**: Categoriza rigorosamente as ações que podem levar ao encerramento do contrato, atrelando papéis (`Locador`/`Locatário`) a regras temporais.

## 4. Variáveis de Estado
- **`immutable` (`dataFim`, `prazoContestacao`, atores, `valorCaucao`)**: O uso pesado de `immutable` significa que esses valores são gravados direto no bytecode e não geram custo de leitura (*SSTORE*/*SLOAD*) posterior. Blinda os pilares do contrato contra adulteração.
- **Cronômetro (`laudoEmitidoEm`)**: Fundamental para o mecanismo de *Hold-Up* reverso. Grava o timestamp exato do envio do laudo.
- **Identificadores IPFS (`cidLaudo`, `cidVeredito`)**: Armazena as referências do Content Identifier (CID) dos arquivos no IPFS/Pinata (ex: `Qm...`), permitindo que a interface Web3 e os atores consultem o documento original diretamente via Gateways IPFS descentralizados.

## 5. O Construtor
Executado uma única vez. Ele blinda todas as amarras temporais (garantindo que o prazo de contestação é > 0 e a `dataFim` é no futuro) e distribui os endereços dos atores garantindo segregação de funções (um Locador não pode agir como Árbitro).

## 6. Funções de Negócio: Ciclo de Vida Avançado

### `depositarCaucao()`
Acionada apenas no início pelo Locatário. Bloqueia os fundos em segurança e ativa a vigência da locação (`ATIVO`).

### `solicitarLaudo(Motivo)`
Coração da inteligência procedimental do smart contract. Baseado no tipo do motivo (`enum`), o código aplica regras rigorosas:
- `FIM_PRAZO`: Restrito ao **Locador** e barrado por matemática (`block.timestamp >= dataFim`). Impede términos precoces ilícitos.
- `INADIMPLENCIA`: O **Locador** pode declarar o calote e acionar a saída antes do tempo.
- `RESCISAO_ANTECIPADA`: O **Locatário** decide pagar a multa da Lei do Inquilinato e entregar as chaves.
- Resulta no repasse da bola para o Agente Oráculo, bloqueando outras ações (`AGUARDANDO_LAUDO`).

### `enviarLaudo(string calldata _cidLaudo, uint256 _valorDanos)`
O **Agente** insere de forma irreversível o CID da perícia hospedada no IPFS via Pinata (`_cidLaudo`) e o valor monetário dos danos.
- Se danos = zero, ocorre restituição integral automática (fluxo feliz).
- Com danos, o cronômetro para resposta é disparado (`laudoEmitidoEm = block.timestamp`) e vai para `LAUDO_EMITIDO`.

### A Dinâmica do Contencioso e Resolução
Aqui reside a mitigação bidirecional do *Hold-Up Problem* apresentada no TCC:
- **Locatário Construtivo (`aceitarLaudo()`)**: Clica, aceita os danos, valores fatiados, contrato encerrado.
- **Locatário Omisso (`aceitarPorDecurso()`)**: Se o prazo acabar (`block.timestamp >= laudoEmitidoEm + prazoContestacao`), o Smart Contract assume o silêncio como anuência e permite que qualquer um destrave os fundos, evitando que o locador seja refém de um inquilino "fantasma".
- **Locatário Oprimido (`contestarLaudo()`)**: Não concorda com o laudo abusivo? Ele trava o aceite e aciona a "Mutabilidade Controlada" chamando o Árbitro JaaS.

### `emitirVeredito(uint256, string calldata _cidVeredito)`
O **Árbitro JaaS** exerce a jurisdição final registrando a sentença homologada em IPFS (`_cidVeredito`). Note que além de atuar no `EM_DISPUTA`, a arquitetura do código autoriza o juiz a intervir preventivamente na etapa `AGUARDANDO_LAUDO` como uma *Válvula de Escape*. Se o Agente "sumir" do mapa ou falecer e não entregar laudo algum, o Árbitro impede a estagnação irreversível dos fundos e profere a resolução. O contrato também possui barreira matemática explícita (`_valorLocador <= valorCaucao`) para impedir erros catastróficos de *Underflow/Overflow* (Pânico computacional) na hora da matemática.

## 7. Execução Financeira (`sacar()`)
Função independente (*Pull-Payment*). Transfere a responsabilidade da taxa de Gas do estorno para o beneficiário. Mitiga vetores de ataque se algum dos entes tiver uma conta/smart contract maliciosa configurada para rejeitar pagamentos e travar todo o pool.

## 8. Frontend API (`acoesDisponiveis()`)
Função essencial de visualização. Mantém o cliente Web ("React/App.js") leve e reativo, avaliando internamente todas as condicionais (ex: se o *timestamp* atual já ultrapassou a `dataFim` do locador, ele retorna o booleano `solicitarFimPrazo` como `true`, liberando a interface instantaneamente).
