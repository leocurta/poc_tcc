# Síntese do Projeto: Contrato Inteligente de Caução Locatícia e DApp

Este documento sintetiza a arquitetura, as lógicas de negócio e as implementações técnicas do contrato inteligente e da interface gráfica do projeto, complementado pela análise crítica das decisões de engenharia registradas no histórico de desenvolvimento (`mudancas.txt`). Destina-se a servir de contexto metodológico primário para o Trabalho de Conclusão de Curso (TCC) e para ingestão no NotebookLM.

---

## 1. Visão Geral e Propósito

O projeto consiste no desenvolvimento de uma **Aplicação Descentralizada (DApp)** para gestão e custódia de garantias locatícias (caução de aluguel), fundamentada na Lei do Inquilinato (Lei nº 8.245/1991). A solução descentraliza a retenção financeira tradicionalmente concentrada no locador ou imobiliária, substituindo-a por um contrato inteligente autônomo, auditável e imutável implantado na rede Ethereum (testnet Sepolia), integrado a um painel web interativo e armazenamento distribuído de documentos periciais.

---

## 2. O Contrato Inteligente da Caução (`caucao.sol` e `MockBRL.sol`)

### 2.1. Custódia Financeira e Token ERC-20
* **Ativo Custodiado:** Os fundos da garantia são transacionados sob o padrão ERC-20 por meio do token sintético `MockBRL`, pareado ao Real brasileiro.
* **Segurança Operacional:** Utilização da biblioteca `SafeERC20` da OpenZeppelin para padronizar transferências e do modificador `nonReentrant` (`ReentrancyGuard`) para imunizar as funções financeiras contra ataques de reentrância.

### 2.2. Modelo de Atores e Permissões
O contrato estabelece uma segregação estrita de funções entre 4 atores autenticados por seus endereços públicos (`address`):
1. **Locador:** Proprietário do imóvel. Cria o contrato, mas não possui autoridade arbitrária sobre o saldo após o depósito. Pode acionar a saída por término do prazo contratual (`FIM_PRAZO`) ou por infração (`INADIMPLENCIA`).
2. **Locatário:** Inquilino. Realiza o depósito inicial da garantia, detém a prerrogativa de solicitar rescisão antecipada (`RESCISAO_ANTECIPADA`), e pode aceitar ou contestar o laudo pericial.
3. **Agente de Verificação (Oráculo / Vistoriador):** Terceiro técnico imparcial encarregado da vistoria de saída. Insere na blockchain o valor monetário de eventuais avarias e o identificador descentralizado do relatório pericial.
4. **Árbitro (*Juiz as a Service* - JaaS):** Instância jurídica e técnica final (cláusula de mutabilidade controlada). Julga contestações de laudos e opera como mecanismo de segurança ("válvula de escape") para resolver impasses institucionais.

### 2.3. Máquina de Estados e Ciclo de Vida
A lógica operacional é regida por uma máquina de estados finita irreversível composta por 6 estados:
* `CRIADO`: Estado inicial. Aguarda aprovação do token e depósito da caução pelo locatário.
* `ATIVO`: Depósito concluído com sucesso. Representa a vigência normal do contrato de locação.
* `AGUARDANDO_LAUDO`: Encerramento formal solicitado por uma das partes (conforme regras temporais e motivos previstos), bloqueando movimentações e demandando a atuação do Agente.
* `LAUDO_EMITIDO`: Agente registrou o laudo com avarias. Dispara-se um cronômetro para resposta do locatário. Caso os danos reportados sejam zero, o contrato transita automaticamente para `ENCERRADO` (devolução integral/fluxo feliz).
* `EM_DISPUTA`: O locatário contestou as avarias dentro da janela temporal, transferindo a jurisdição financeira ao Árbitro.
* `ENCERRADO`: Estado terminal. Saldos liquidados e disponibilizados para resgate.

### 2.4. Armazenamento Híbrido (On-chain vs. Off-chain)
* **On-chain (EVM / Sepolia):** Armazena estritamente a máquina de estados, regras de permissão, temporizadores, travas matemáticas de limites e os CIDs dos arquivos em formato `string`.
* **Off-chain (IPFS via Pinata):** Documentos volumosos (laudos com vistorias fotográficas em PDF e despachos arbitrais) são hospedados no InterPlanetary File System (IPFS) com persistência via Pinata, garantindo auditabilidade pública sem onerar a rede com custos proibitivos de *storage*.

### 2.5. Padrão de Liquidação (*Pull-Payment*)
O contrato adota o princípio arquitetural *Pull-Payment*: em vez de transferir fundos diretamente para as carteiras durante a finalização do processo (*Push*), o contrato apenas fraciona e atualiza os saldos internos (`saldoLocador` e `saldoLocatario`). Cada parte deve chamar individualmente o método `sacar()`, isolando falhas de transferência e prevenindo ataques de Negação de Serviço (DoS).

---

## 3. Aplicação Front-end (DApp / Interface Web)

### 3.1. Arquitetura e Stack
* **Tecnologias:** HTML5 semântico, Tailwind CSS (via CDN) para layout responsivo, JavaScript Vanilla modular e biblioteca `ethers.js` (v6) para comunicação RPC com nós da rede Ethereum.
* **Reatividade em Tempo Real:** Escuta ativa do evento `accountsChanged` da MetaMask. Ao alternar contas na carteira, o painel se adapta instantaneamente sem recarregar o navegador.

### 3.2. Componentes e Funcionalidades
* **Linha do Tempo de Estados (Stepper Visual):** Componente de 5 fases no topo do painel que reflete visualmente a progressão do aluguel. Em caso de litígio, a etapa de avaliação assume coloração de alerta com o badge *"Em Disputa!"*.
* **Governança Guiada pelo Smart Contract:** O front-end elimina regras concorrentes de negócio consultando a função on-chain `acoesDisponiveis(address)`. Essa função avalia internamente o estado atual, timestamps e endereço conectado, retornando uma máscara de booleanos que determina quais cards de ação serão renderizados:
  - Card de Aprovação e Depósito da Caução;
  - Card de Solicitação de Encerramento com seleção de motivos;
  - Card de Envio de Laudo pericial com campo de upload para IPFS;
  - Card de Avaliação/Contestação pelo locatário com botão de abertura do laudo oficial;
  - Card de Veredito Arbitral (JaaS);
  - Card de Resgate de Fundos (*Pull-Payment*).
* **Auditoria Documental Integrada:** Assim que o CID do laudo é registrado on-chain pelo perito, a interface disponibiliza o botão **"Abrir Laudo"**, que aponta diretamente para o *gateway* público descentralizado da Pinata, viabilizando a conferência prévia do PDF antes de qualquer aceite ou contestação.

---

## 4. Análise do Histórico de Mudanças (`mudancas.txt`)

### 4.1. Síntese Metodológica
> O arquivo `mudancas.txt` documenta o processo iterativo de desenvolvimento e as refatorações arquiteturais realizadas no artefato ao longo do ciclo de engenharia de software, evidenciando uma evolução orientada à segurança, viabilidade econômica e teoria dos incentivos. Dentre as alterações mais críticas, destaca-se a solução para o problema do *Hold-Up* reverso por meio da função de aceite por decurso de prazo (`aceitarPorDecurso`), que impede que a omissão do locatário retenha o saldo do locador indefinidamente; a instituição do Árbitro como uma "válvula de escape" para destravar a custódia caso o perito fique inerte na fase de vistoria; e a otimização de *Gas* através da substituição de armazenamento pesado em *storage* por eventos e CIDs curtos no IPFS, da adoção de variáveis imutáveis (`immutable`) e de *Custom Errors* em detrimento de strings de erro tradicionais. Adicionalmente, as decisões técnicas contemplaram o refinamento das regras de negócio — como a imposição de motivos e prazos formais para encerramento, o bloqueio de laudos extemporâneos via estado intermediário `AGUARDANDO_LAUDO`, a devolução automática sem atritos em casos de danos nulos (fluxo feliz), a implementação do padrão defensivo *Pull-Payment* para saques e a centralização das regras de exibição na função on-chain `acoesDisponiveis`, que resultou em uma interface reativa e transparente com linha do tempo de estados.

### 4.2. Alterações feitas durante do desenvolvimento

| # | Decisão de Engenharia | Motivação / Problema Resolvido | Impacto Metodológico / Técnico |
|---|----------------------|--------------------------------|--------------------------------|
| **1** | **Aprovação Automática por Tempo (`aceitarPorDecurso`)** | Inquilino omisso ou sumido reteria a caução por tempo indeterminado. | Mitigação do *Hold-Up Problem* reverso e garantia de liquidez ao locador. |
| **2** | **Árbitro como Válvula de Escape** | Omissão, perda de chave ou inércia do perito paralisaria o contrato na fase de vistoria. | Resolução de estagnação sistêmica com trava matemática (`_valorLocador <= valorCaucao`). |
| **3** | **Otimização de Armazenamento de Arquivos** | Armazenar URLs completas no *storage* da EVM gerava custos proibitivos de Gas. | Emissão em Eventos de rede e persistência estrita do hash CID via IPFS/Pinata. |
| **4** | **Travas de Motivos e Prazo Contratual** | Encerramentos indevidos antes da data estipulada de vigência. | Vinculação estrita entre motivos (`FIM_PRAZO`, etc.), legitimidade do solicitante e `dataFim`. |
| **5** | **Integração Documental IPFS e Gatilho Visual** | Inquilino precisava verificar a perícia antes de aceitar cobranças. | Botão no front condicionado à confirmação do CID on-chain via gateway descentralizado. |
| **6** | **Estado Intermediário `AGUARDANDO_LAUDO`** | Vistoriador conseguia enviar laudos a qualquer momento durante a vigência. | Bloqueio de vistorias extemporâneas; envio permitido apenas após provocação formal. |
| **7** | **Devolução Imediata sem Avarias (Fluxo Feliz)** | Burocracia e perda de tempo desnecessárias quando o imóvel é entregue perfeito. | Encerramento imediato e liberação de 100% dos fundos quando danos são iguais a zero. |
| **8** | **Adoção de *Custom Errors*** | Declarações `require` com strings extensas encareciam o deploy e a execução de reverts. | Otimização moderna de bytecode e economia expressiva de Gas em transações rejeitadas. |
| **9** | **Variáveis de Configuração `immutable`** | Parâmetros fixados na criação (endereços, prazos, valor) podiam ser vulneráveis ou custosos. | Gravação direta no bytecode, redução do custo de leitura (`SLOAD`) e imutabilidade assegurada. |
| **10** | **Saque Individual Manual (*Pull-Payment*)** | Envio direto de fundos (*Push*) sujeito a falhas de transferência e ataques DoS. | Isolamento de responsabilidade financeira; cada ente saca seu saldo de forma autônoma. |
| **11** | **Função On-chain `acoesDisponiveis`** | Duplicação de regras de permissão complexas e risco de divergência no JavaScript. | Lógica de governança centralizada no contrato, simplificando o front-end Web3. |
| **12** | **Linha do Tempo Visual com Destaque de Disputa** | Falta de clareza para usuários leigos sobre o estágio atual da locação. | UX orientada a estados com alerta visual explícito quando um litígio é instaurado. |
