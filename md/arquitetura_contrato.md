# Arquitetura do Contrato Inteligente de Caução Locatícia

Este documento formaliza a arquitetura do sistema proposto, servindo como embasamento teórico e descritivo para o Trabalho de Conclusão de Curso (TCC). A arquitetura é baseada nas necessidades da Lei 8.245/1991 e em preceitos de automação por contratos inteligentes (*Smart Contracts*).

## 1. Visão Geral da Solução
A solução consiste em descentralizar a custódia da caução locatícia através de um *Smart Contract* implantado na rede Ethereum (testnet Sepolia). Em vez de o locador ou a imobiliária reter os fundos (gerando risco moral e assimetria de poder), o valor é travado em um contrato autônomo, programado para liberar o montante de forma determinística e baseado em regras pré-estabelecidas e na validação de oráculos (Agente de Verificação) e governança de exceção (JaaS).

## 2. Atores e Papéis
O sistema adota um modelo estrito de permissões, alinhado com o diagrama BPMN, contendo 4 papéis distintos:

1. **Locador:** Aquele que cria o contrato e disponibiliza o imóvel. Ele não tem acesso direto aos fundos custodiados após o depósito, mas possui a chave para acionar o encerramento por quebra (inadimplência) ou decurso de prazo.
2. **Locatário:** Realiza o depósito inicial e detém o poder de aceitar ou contestar o laudo técnico emitido no final da locação, além de poder pedir rescisão antecipada.
3. **Agente (Verificador/Vistoriador):** Atua como o *Oráculo* off-chain. É o terceiro técnico imparcial responsável por realizar a vistoria do imóvel e transmitir o resultado financeiro (valor de avarias) para a blockchain de maneira imutável.
4. **Árbitro (Juiz as a Service - JaaS):** A última instância de resolução de disputas (Mutabilidade Controlada). Atua como uma *válvula de escape* arquitetônica: acionado quando o Locatário contesta o laudo do Agente, ou caso o Agente fique permanentemente ausente, garantindo que o contrato nunca fique bloqueado eternamente. Sua decisão (veredito) é final e destrava a caução.

## 3. Armazenamento Híbrido (On-chain vs Off-chain)
Para máxima otimização e interoperabilidade entre a blockchain e arquivos periciais:
- **On-chain (Ethereum):** Armazena a máquina de estados, regras de negócio temporais e limites matemáticos de saque. Os identificadores periciais (`cidLaudo` e `cidVeredito`) são registrados via tipo `string` (Content Identifier - CID do IPFS) e emitidos nos Eventos (`LaudoEnviado`, `VereditoEmitido`), permitindo que qualquer parte interessada consulte e acesse os documentos de forma descentralizada.
- **Off-chain (IPFS / Pinata):** Arquivos pesados (laudos técnicos em PDF, vistorias fotográficas e sentenças do JaaS) são hospedados na rede IPFS por meio do serviço de ancoragem (*pinning*) Pinata, garantindo alta disponibilidade sem onerar a rede Ethereum com armazenamento massivo.

## 4. Máquina de Estados (State Machine)
A máquina de estados dita o fluxo sequencial da operação, complementada pela aplicação de temporizadores matemáticos:

* `CRIADO`: Aguardando o locatário assinar e depositar a caução.
* `ATIVO`: Caução bloqueada no Smart Contract sob as regras estabelecidas. Representa a vigência normal do aluguel.
* `AGUARDANDO_LAUDO`: Fim do prazo natural atingido (`dataFim`) ou uma das partes declarou quebra de contrato. Aguarda o Agente de Verificação emitir o laudo de saída.
* `LAUDO_EMITIDO`: Agente elaborou o laudo apontando danos. Um cronômetro (`prazoContestacao`) é disparado. O Locatário deve agir e contestar, ou os danos são assumidos como verdadeiros.
* `EM_DISPUTA`: Locatário contestou a retenção. Cláusula de mutabilidade controlada acionada. Aguardando análise técnica do Árbitro.
* `ENCERRADO`: Estado terminal. Fundos liberados para saque (Pull-Payment).

## 5. Princípios de Segurança e Design (Vantagens para o TCC)

### 5.1. Mecanismo de "Aceite por Decurso" (Anti-Holdup Reverso)
A literatura econômica condena a chantagem financeira (Hold-Up Problem). Se o locador não pode mais reter o dinheiro indevidamente, o locatário também não pode prejudicar o locador sumindo após causar um dano real. O contrato introduz um limite temporal para contestação: findo o prazo, qualquer pessoa pode chamar o aceite automático e o locador é devidamente indenizado.

### 5.2. O Árbitro como *Escape Valve*
Para evitar que uma falha de sistema ou omissão do Agente Oráculo transforme a caução em "moedas perdidas" (um risco documentado em smart contracts fechados), a arquitetura autoriza a jurisdição superior do Árbitro também na fase `AGUARDANDO_LAUDO`, salvando o sistema em cenários de quebra não previstos.

### 5.3. Pull-Payment e Descentralização via IPFS (Pinata)
O contrato **nunca** envia dinheiro automaticamente (Push). Exige a execução da função `sacar()` isolada, mitigando ataques de Negação de Serviço. Além disso, a ancoragem dos CIDs do IPFS viabiliza que as partes abram e verifiquem diretamente a integridade do PDF pericial (via Gateways IPFS públicos da Pinata), unindo auditabilidade jurídica à segurança computacional dos contratos inteligentes.
