# Resultados e Discussões: Viabilidade Econômica, Técnica e Jurídica

Este documento reúne a análise aprofundada dos dados experimentais obtidos nos testes do contrato inteligente `CaucaoLocaticia` na rede Layer 2 Base Sepolia, correlacionando métricas computacionais (*Gas Usado* e custos de transação) com preceitos jurídicos da Lei do Inquilinato (Lei nº 8.245/1991) e princípios de teoria econômica (*Hold-Up Problem* e Governança de Exceção).

---

## 1. Apresentação dos Resultados Empíricos

Os testes automatizados foram executados de ponta a ponta na rede **Base Sepolia (Layer 2 - OP Stack)**, utilizando contas independentes com papéis segregados (Locador, Locatário, Perito Oráculo e Árbitro). 

Os dados apresentados a seguir foram extraídos diretamente dos recibos criptográficos das transações (`Transaction Receipts`), sob as variáveis de controle metodológicas:
* **Cotação do ETH/BRL:** R$ 12.100,00
* **Taxa Efetiva de Gas L2:** ~0,0059 Gwei (ajustada pela política de taxas EIP-1559 da Layer 2 com prioridade de 0,001 Gwei)
* **Garantia Locatícia:** 3.000 mBRL (R$ 3.000,00)

### 1.1. Resumo Executivo de Custos por Cenário

* **Cenário 1 (Término Natural Sem Danos):**
  * Total de Gas: **2.716.627 unidades**
  * Custo Efetivo na Testnet (Base Sepolia): **0,000016 ETH (~R$ 0,20)**
  * Projeção em Produção (Base Mainnet a 0,005 Gwei): **~R$ 0,1644**
* **Cenário 2 (Quebra com Acordo Amigável):**
  * Total de Gas: **2.852.877 unidades**
  * Custo Efetivo na Testnet (Base Sepolia): **0,000017 ETH (~R$ 0,21)**
  * Projeção em Produção (Base Mainnet a 0,005 Gwei): **~R$ 0,1726**
* **Cenário 3 (Quebra com Disputa e Arbitragem JaaS - Pior Caso):**
  * Total de Gas: **2.904.381 unidades**
  * Custo Efetivo na Testnet (Base Sepolia): **0,000017 ETH (~R$ 0,21)**
  * Projeção em Produção (Base Mainnet a 0,005 Gwei): **~R$ 0,1757**

---

### 1.2. Tabela Detalhada de Transações e Métricas Auditáveis (BaseScan)

A tabela a seguir consolida cada uma das transações executadas nos 3 cenários, contendo o número do bloco, o identificador criptográfico, o gas consumido e o link de auditoria direta no explorador de blocos:

| Cenário | Operação | Ator | Nº Bloco | Link do Bloco | Gas Usado | Custo Efetivo (R$) | Transação Auditável (BaseScan) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **C1 (Sem Danos)** | Deploy Contrato Caução | Locador | #48761491 | [Bloco #48761491](https://sepolia.basescan.org/block/48761491) | 2.435.343 | R$ 0,1768 | [Ver Tx](https://sepolia.basescan.org/tx/0x26ffe57bdeef7a53d788a276fca8a2432e94e73b2370a7c271adc9abc3ed492f) |
| **C1 (Sem Danos)** | Aprovar mBRL (Approve) | Locatário | #48761508 | [Bloco #48761508](https://sepolia.basescan.org/block/48761508) | 46.940 | R$ 0,0034 | [Ver Tx](https://sepolia.basescan.org/tx/0x6e1b74a99518da0934269b325f93c00ef2ac3c6a608e866eeedb226c1194d792) |
| **C1 (Sem Danos)** | Depositar Caução | Locatário | #48761525 | [Bloco #48761525](https://sepolia.basescan.org/block/48761525) | 82.492 | R$ 0,0060 | [Ver Tx](https://sepolia.basescan.org/tx/0xb056836b55e765e62b8c8d6a749609395f617b5c72cd64db64b1a5f000148f41) |
| **C1 (Sem Danos)** | Solicitar Laudo (Fim de Prazo) | Locador | #48761586 | [Bloco #48761586](https://sepolia.basescan.org/block/48761586) | 28.747 | R$ 0,0021 | [Ver Tx](https://sepolia.basescan.org/tx/0xa6778d4a5df0833fdc0d2d9045f379c237ccc1d57f1f336dc512704c9a9a01ed) |
| **C1 (Sem Danos)** | Enviar Laudo (Zero Avarias) | Agente | #48761602 | [Bloco #48761602](https://sepolia.basescan.org/block/48761602) | 81.495 | R$ 0,0059 | [Ver Tx](https://sepolia.basescan.org/tx/0x2d26d4fa3e6240d39156a86d84b209801f8ebd5ca07cd5af5641ed7eba67fe89) |
| **C1 (Sem Danos)** | Sacar Devolução 100% | Locatário | #48761618 | [Bloco #48761618](https://sepolia.basescan.org/block/48761618) | 41.610 | R$ 0,0030 | [Ver Tx](https://sepolia.basescan.org/tx/0xface62310663c0cf2a6e2addf6fcff8c83ffd67512047062b79b63ce865bd28b) |
| **TOTAL C1** | **Cenário 1 Completo** | — | **2.716.627** | — | **R$ 0,1972** | **Término natural com devolução 100%** |
| | | | | | | | |
| **C2 (Acordo)** | Deploy Contrato Caução | Locador | #48761643 | [Bloco #48761643](https://sepolia.basescan.org/block/48761643) | 2.435.331 | R$ 0,1768 | [Ver Tx](https://sepolia.basescan.org/tx/0x5e3e607e605d576d364f8e87d6d815c354f2d4fff893a9d95fd28e4921ef9255) |
| **C2 (Acordo)** | Aprovar mBRL (Approve) | Locatário | #48761659 | [Bloco #48761659](https://sepolia.basescan.org/block/48761659) | 46.940 | R$ 0,0034 | [Ver Tx](https://sepolia.basescan.org/tx/0x59e4a67b15a634fc533e0248d96f606b7f652870adbca86b0acf669182ab085d) |
| **C2 (Acordo)** | Depositar Caução | Locatário | #48761677 | [Bloco #48761677](https://sepolia.basescan.org/block/48761677) | 82.492 | R$ 0,0060 | [Ver Tx](https://sepolia.basescan.org/tx/0xfc3b7b6e2642d7612a8f1831a2ff76f26538d94107d19b043f69d5ffe6c4f2b9) |
| **C2 (Acordo)** | Solicitar Laudo (Inadimplência) | Locador | #48761693 | [Bloco #48761693](https://sepolia.basescan.org/block/48761693) | 28.810 | R$ 0,0021 | [Ver Tx](https://sepolia.basescan.org/tx/0x515b47166b56c1f708491007a8e3ca447453bfeefa550a12d33e4550465d3bb8) |
| **C2 (Acordo)** | Enviar Laudo (R$ 1.000 Danos) | Agente | #48761710 | [Bloco #48761710](https://sepolia.basescan.org/block/48761710) | 97.242 | R$ 0,0071 | [Ver Tx](https://sepolia.basescan.org/tx/0x215cc9bdbc6635a57ee222684544bf0863e5e3420d41b2e47bb86370daa2de21) |
| **C2 (Acordo)** | Aceitar Laudo | Locatário | #48761727 | [Bloco #48761727](https://sepolia.basescan.org/block/48761727) | 76.075 | R$ 0,0055 | [Ver Tx](https://sepolia.basescan.org/tx/0x19ce84bed1987fe0b0c9783f22918e2c34d6217b0554d66001f82810f9bbbbb8) |
| **C2 (Acordo)** | Sacar Indenização Avarias | Locador | #48761744 | [Bloco #48761744](https://sepolia.basescan.org/block/48761744) | 44.377 | R$ 0,0032 | [Ver Tx](https://sepolia.basescan.org/tx/0x58272b226ce82d107540eadb77eac7431399dca4fe9edec54a81ef5d5a11743f) |
| **C2 (Acordo)** | Sacar Saldo Remanescente | Locatário | #48761761 | [Bloco #48761761](https://sepolia.basescan.org/block/48761761) | 41.610 | R$ 0,0030 | [Ver Tx](https://sepolia.basescan.org/tx/0x09dede6fe4feb422a888902d879d37bfabb6ff12a9112f5f351188bb340fd7e8) |
| **TOTAL C2** | **Cenário 2 Completo** | — | **2.852.877** | — | **R$ 0,2071** | **Inadimplência com acordo pericial** |
| | | | | | | | |
| **C3 (Disputa)** | Deploy Contrato Caução | Locador | #48761785 | [Bloco #48761785](https://sepolia.basescan.org/block/48761785) | 2.435.331 | R$ 0,1768 | [Ver Tx](https://sepolia.basescan.org/tx/0x1ccc7610c25500d99a9b55f7898da614e78a67a0a7f58243c9cce62bbaf883ea) |
| **C3 (Disputa)** | Aprovar mBRL (Approve) | Locatário | #48761801 | [Bloco #48761801](https://sepolia.basescan.org/block/48761801) | 46.940 | R$ 0,0034 | [Ver Tx](https://sepolia.basescan.org/tx/0xa7e5038c7b1f7baf461c2929993c21f60fe85ca25b24707828bd1cb0a80f21ad) |
| **C3 (Disputa)** | Depositar Caução | Locatário | #48761819 | [Bloco #48761819](https://sepolia.basescan.org/block/48761819) | 82.492 | R$ 0,0060 | [Ver Tx](https://sepolia.basescan.org/tx/0x5423af74f95a0c8cc1ddd6bb61c9225cf19d29a6c7b9651b66a8e4bdf457737c) |
| **C3 (Disputa)** | Solicitar Laudo (Inadimplência) | Locador | #48761835 | [Bloco #48761835](https://sepolia.basescan.org/block/48761835) | 28.810 | R$ 0,0021 | [Ver Tx](https://sepolia.basescan.org/tx/0xb24523b37b2348f4ceb6979acd6706f6acb90d55587cd25341aa2a3218d22064) |
| **C3 (Disputa)** | Enviar Laudo (R$ 1.000 Danos) | Agente | #48761853 | [Bloco #48761853](https://sepolia.basescan.org/block/48761853) | 97.242 | R$ 0,0071 | [Ver Tx](https://sepolia.basescan.org/tx/0x48b45d47242389530f7b9fe3b2acbf9c58630bba75bf8d169a7edefa913a50bb) |
| **C3 (Disputa)** | Contestar Laudo (Disputa) | Locatário | #48761869 | [Bloco #48761869](https://sepolia.basescan.org/block/48761869) | 27.772 | R$ 0,0020 | [Ver Tx](https://sepolia.basescan.org/tx/0x23b2d19ece42320d5d2bb9acce1ebdd5fdd5404dde90a32cf2b8f6fa7eb369d8) |
| **C3 (Disputa)** | Emitir Veredito Arbitral | Árbitro | #48761885 | [Bloco #48761885](https://sepolia.basescan.org/block/48761885) | 99.807 | R$ 0,0072 | [Ver Tx](https://sepolia.basescan.org/tx/0x25b18e04f7c6dc54edc08d4450a8d57393079820520e088a7ded94a1236e2198) |
| **C3 (Disputa)** | Sacar Indenização Decidida | Locador | #48761903 | [Bloco #48761903](https://sepolia.basescan.org/block/48761903) | 44.377 | R$ 0,0032 | [Ver Tx](https://sepolia.basescan.org/tx/0x01649a3ea6dd297ae1ffb42a59269aeb13102edca9b74cb188a466a40c1d1c3a) |
| **C3 (Disputa)** | Sacar Saldo Restante | Locatário | #48761919 | [Bloco #48761919](https://sepolia.basescan.org/block/48761919) | 41.610 | R$ 0,0030 | [Ver Tx](https://sepolia.basescan.org/tx/0x53b22a152897ed10d4a45780ad7cdf518ca7ef5bb6883edf15bb2a9a236b1dc9) |
| **TOTAL C3** | **Cenário 3 Completo** | — | **2.904.381** | — | **R$ 0,2108** | **Rescisão contenciosa com arbitragem JaaS** |

---

## 2. Análise Comparativa e Discussão Técnica

### 2.1. Custo Operacional vs. Custo de Publicação (Deploy)
Os dados empíricos comprovam um comportamento fundamental da computação em blockchain:
* O **Deploy do Contrato** consumiu **2.435.343 unidades de gas** (~84% a 89% do total de cada cenário), pois grava todo o código executável, tabelas de variáveis imutáveis e verificações do OpenZeppelin na blockchain.
* Em contrapartida, as **operações cotidianas de negócio** (aprovar, depositar, solicitar, contestar e sacar) são extremamente econômicas, consumindo entre **27.772 e 99.807 de gas**.
* **Impacto Econômico Real:** Excluído o deploy inicial (pago uma única vez na assinatura e que custa R$ 0,17), a gestão de todo o ciclo de vida do aluguel custa **apenas R$ 0,02 a R$ 0,03 (menos de três centavos de real)**.

### 2.2. A Revolução das Camadas 2 (L1 vs. Layer 2)
A viabilidade econômica do modelo só é possível graças à utilização de um Rollup de Layer 2 (Base). Se essa mesma rotina fosse executada diretamente na **Ethereum Mainnet (Layer 1)** sob condições médias de mercado (25 Gwei), o quadro comparativo seria proibitivo:

| Operação | Gasto Real de Gas | Custo na Layer 1 (Ethereum a 25 Gwei)* | Custo Real na Layer 2 (Base Sepolia)* | Redução de Custo |
| :--- | :--- | :--- | :--- | :--- |
| **Deploy do Contrato** | 2.435.343 | R$ 736,69 (0,0608 ETH) | **R$ 0,1768** (0,000014 ETH) | **99,97%** |
| **Depósito da Caução** | 82.492 | R$ 24,95 (0,0020 ETH) | **R$ 0,0060** (0,0000005 ETH) | **99,97%** |
| **Contestação do Laudo** | 27.772 | R$ 8,40 (0,0007 ETH) | **R$ 0,0020** (0,0000001 ETH) | **99,97%** |
| **Veredito Arbitral (JaaS)**| 99.807 | R$ 30,19 (0,0025 ETH) | **R$ 0,0072** (0,0000006 ETH) | **99,97%** |
| **Ciclo Completo (C3)** | 2.904.381 | **R$ 878,57** (0,0726 ETH) | **R$ 0,2108** (0,000017 ETH) | **99,97%** |

*\*Projeção considerando cotação do ETH a R$ 12.100,00.*

> **Conclusão:** Na Layer 1, os custos de transação superariam 29% de todo o valor da garantia caucionada (R$ 878 de taxas sobre uma caução de R$ 3.000), inviabilizando o projeto. Na **Layer 2 da Base**, o custo de ponta a ponta é de **vinte e um centavos de real**, tornando a tecnologia incomparavelmente mais acessível do que as taxas bancárias de títulos de capitalização ou seguros-fiança tradicionais.

### 2.3. Transposição da Testnet para a Mainnet: Dinâmica de Taxas e Validade Externa
Uma discussão fundamental para a solidez metodológica do TCC é compreender como os dados colhidos em ambiente de teste (*Base Sepolia*) se comportariam em uma operação real de mercado (*Base Mainnet*):

1. **O Paradoxo das Taxas em Ambientes de Testnet:**
   * Em redes de teste, os tokens de gas são gratuitos (distribuídos por *faucets*). Como não há incentivo de contenção de gastos, bibliotecas de conexão Web3 (como o *ethers.js*) costumam carregar parâmetros de configuração legados da Ethereum Layer 1, injetando gorjetas desproporcionais de até 1.5 Gwei se não forem explicitamente configuradas.
   * Ao calibrar os parâmetros de prioridade para **0.001 Gwei** (o padrão nativo da MetaMask em redes L2), os testes refletiram com fidelidade a precificação real do sequenciador da Base, estabilizando as taxas em **~0,0059 Gwei**.
2. **Impacto da Atualização Dencun (EIP-4844) na Mainnet:**
   * Desde a ativação dos *data blobs* (EIP-4844) na rede principal do Ethereum, as Layer 2 deixaram de disputar espaço caro de computação (*calldata*) na Camada 1 para publicar suas provas de transação. 
   * Na **Base Mainnet**, o *Gas Price* médio em condições habituais de mercado varia entre **0,002 Gwei e 0,005 Gwei**. Isso comprova que a **projeção de R$ 0,16 a R$ 0,17** por contrato completo calculada neste trabalho não é apenas uma estimativa teórica, mas um reflexo direto da economia pós-Dencun em produção.
3. **Análise de Ameaças à Validade Externa:**
   * Em um cenário de produção em massa, a rede está sujeita a flutuações sazonais de tráfego (picos de demanda e volatilidade do ETH).
   * Contudo, mesmo em uma simulação de estresse extremo na qual o *Gas Price* da Layer 2 subisse 10 vezes (para 0,05 Gwei), o custo total do ciclo de vida da locação subiria de R$ 0,17 para apenas **R$ 1,70**. Esse montante ainda seria incomparavelmente inferior a qualquer custo de emissão de boleto bancário ou tarifas de registro em cartório de notas, comprovando a resiliência e viabilidade econômica contínua do modelo.

---

## 3. Análise Jurídico-Econômica e de Governança

### 3.1. Conformidade com a Lei do Inquilinato (Lei nº 8.245/1991)
* **Vedação à Dupla Garantia (Art. 37, Parágrafo Único):** O contrato opera como garantia única e isolada (caução em dinheiro), impedindo a cumulação com fiador ou seguro-fiança.
* **Teto Legal de 3 Aluguéis (Art. 38, §2º):** O contrato parametriza o valor exato combinado no construtor como constante imutável (`valorCaucao`), impedindo qualquer exigência suplementar posterior.
* **Segregação da Custódia:** Historicamente, o art. 38, §2º exige depósito da caução em conta poupança conjunta. Na prática imobiliária brasileira, isso raramente ocorre: locadores e administradoras retêm os valores em contas correntes próprias, apropriando-se dos rendimentos e criando barreiras no momento da restituição. O contrato inteligente cumpre a finalidade teleológica da lei de forma superior: a custódia não pertence a nenhuma das partes, mas sim ao código neutro.

### 3.2. Conformidade com a Resolução COFECI nº 1.551/2025 e o Marco Regulatório de DLT
A publicação da **Resolução COFECI nº 1.551/2025** pelo Conselho Federal de Corretores de Imóveis representou um divisor de águas institucional no Brasil ao regulamentar a aplicação de **Tecnologias de Registro Distribuído (Blockchain/DLT)** e tokenização no ecossistema imobiliário.

A solução desenvolvida dialoga diretamente com os pilares instituídos pela resolução:
* **Plataforma Imobiliária para Transações Digitais (PITD):** A interface Web3 descentralizada concebida atua como ambiente auditável de intermediação digital, garantindo que o corretor e a imobiliária operem transações com integridade criptográfica.
* **Agente de Custódia e Garantia Imobiliária (ACGI Automatizado):** A Resolução nº 1.551/2025 criou a figura do custodiante de garantias em ambiente virtual. O smart contract `CaucaoLocaticia` atua materialmente como a realização técnica desse papel: em vez de a imobiliária reter o dinheiro da caução em contas próprias (criando risco de confusão patrimonial e apropriação indevida), a custódia é delegada a um contrato inteligente imparcial e autônomo na rede Base.
* **O Corretor/Perito como Agente de Verificação (Oráculo Habilitado):** O papel de `agente` definido no contrato reflete a atividade pericial do corretor de imóveis ou vistoriador credenciado, permitindo que a imobiliária execute suas vistorias de entrada e saída com fé pública e ancore as conclusões técnicas no IPFS.

> ⚖️ **Atenção à Controvérsia Jurídica (Debate ONR/IRIB vs. COFECI):**  
> Embora a Resolução nº 1.551/2025 tenha sido alvo de questionamento judicial por entidades registrais (ONR e IRIB) quanto à criação de "registros paralelos de propriedade imobiliária", a aplicação deste TCC **não esbarra em qualquer vício de competência registral**.  
> A caução locatícia **não constitui direito real sobre o imóvel** nem transmissão de titularidade (matéria privativa dos Cartórios de Registro de Imóveis, conforme art. 1.245 do Código Civil). Trata-se de uma **relação puramente obrigacional e de garantia pecuniária** (art. 37, I da Lei 8.245/91 e arts. 421 e 425 do Código Civil — Liberdade Contratual). Assim, a solução absorve a vanguarda tecnológica incentivada pelo COFECI com absoluta higidez e segurança jurídica perante a banca examinadora.

### 3.3. Mitigação Bilateral do *Hold-Up Problem*
A literatura de Economia dos Contratos aponta o *Hold-Up Problem* (problema do aprisionamento oportunista) como a principal falha de mercado nas locações:

1. **Ameaça do Locador Desonesto (Retenção Abusiva):**
   * *No modelo tradicional:* O locador retém a caução sob alegações genéricas de "pintura ou avarias", forçando o inquilino a aceitar acordos desfavoráveis ou enfrentar anos no Juizado Especial Cível.
   * *Na solução proposta:* O locador **não tem o poder de descontar valores sozinho**. Ele é obrigado a solicitar uma vistoria formal, cujo laudo é emitido por um perito credenciado.
2. **Ameaça do Locatário Inadimplente (Incentivo ao Calote / Inquilino Fantasma):**
   * *O risco reverso:* Se o sistema exigisse anuência expressa do locatário para liberar os fundos das avarias, o locatário poderia simplesmente "sumir", desligar o telefone e recusar-se a assinar a transação, mantendo o dinheiro do locador congelado indefinidamente no contrato.
   * *A solução algorítmica (`aceitarPorDecurso()`):* A implementação introduziu um prazo decadencial estrito (`prazoContestacao = 86400s`). Transcorrido o prazo sem impugnação formal, qualquer participante pode acionar a liberação automática dos fundos em favor do locador, garantindo segurança jurídica bilateral.

### 3.4. A Governança de Exceção: O Árbitro como Válvula de Escape
A ortodoxia dos primeiros anos da blockchain defendia que *"o código é a lei"* (*Code is Law*), sob uma imutabilidade cega e intransigente. Na vida real, contratos são incompletos por definição:
* O que acontece se o Perito falecer, perder a chave privada ou recusar-se a enviar o laudo?
* Em um contrato puramente determinístico e fechado, os R$ 3.000 ficariam bloqueados para a eternidade na blockchain.

Para solucionar essa fragilidade, a arquitetura implementou a **Mutabilidade Controlada**:
* O papel do Árbitro (*Justice as a Service - JaaS*) foi habilitado com jurisdição para agir não apenas na fase de disputa (`EM_DISPUTA`), mas também como **Válvula de Escape** na fase de espera (`AGUARDANDO_LAUDO`).
* Diante da inércia ou omissão pericial, o árbitro pode emitir um veredito fundamentado (com documento em PDF ancorado via CID no IPFS) e fatiar a caução com base na equidade, destravando a execução financeira sem depender de intervenção estatal morosa.

### 3.5. Arquitetura Híbrida: O Peso Probatório do IPFS
A blockchain não foi utilizada para armazenar documentos pesados (como laudos fotográficos em PDF), o que oneraria a rede com milhões de gas em operações de *SSTORE*.
* Os arquivos residem na rede peer-to-peer **IPFS**, protegidos por ancoragem permanente via nós dedicados (**Pinata**).
* Na blockchain, gravam-se apenas os **CIDs (Content Identifiers)** criptográficos (funções hash SHA-256 baseadas no conteúdo).
* **Valor Probatório:** Se qualquer caractere do laudo pericial ou da sentença arbitral for adulterado no futuro, o hash resultante muda integralmente, quebrando a correspondência com a blockchain. Isso confere validade probatória irrefutável e auditoria pericial pública a custo zero de storage on-chain.

### 3.6. Blindagem Computacional: Pull-Payment e Anti-Reentrância
A função `sacar()` implementa as melhores práticas de segurança da Ethereum Foundation:
* **Padrão Pull-Payment:** O contrato nunca "empurra" (*push*) fundos para a carteira do usuário de forma automática durante o encerramento. Se a carteira destinatária for um contrato inteligente com lógica maliciosa ou com estouro de gas no *fallback*, a transação falharia e travaria todo o encerramento. No padrão *pull*, o contrato apenas atualiza os saldos contábeis (`saldoLocador` e `saldoLocatario`) e cada parte saca sua parcela de forma isolada e assíncrona.
* **Mutadores de Estado Antecipados:** O saldo da parte é zerado **antes** da transferência do token (`saldoLocador = 0; token.safeTransfer(...)`), impedindo qualquer possibilidade teórica de ataque de reentrância recursiva, reforçado pela camada do `ReentrancyGuard` da OpenZeppelin.

---

## 4. Conclusão dos Resultados para a Banca

1. **Eficiência Econômica Comprovada:** O custo total de operação na Base Layer 2 gira em torno de **R$ 0,20**, viabilizando a adoção prática no mercado imobiliário sem onerar inquilinos ou locadores.
2. **Equilíbrio Jurídico Inovador:** A máquina de estados soluciona o *Hold-Up Problem* em ambas as direções, protegendo o inquilino contra deduções unilaterais e resguardando o proprietário contra a inércia do inquilino mediante o aceite tácito por decurso de prazo.
3. **Resiliência Arquitetural:** A introdução do Árbitro como válvula de escape e a integração híbrida com IPFS superam o dogma da imutabilidade cega, criando um ecossistema pronto para lidar com exceções do mundo real com total auditoria probatória.
