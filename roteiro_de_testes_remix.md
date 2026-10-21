# Roteiro de Testes e Apresentação (Remix IDE & Front-end)

Este roteiro contém o passo a passo exato para realizar o deploy e testar o fluxo completo do contrato inteligente `CaucaoLocaticia` na rede de testes Sepolia, tanto diretamente pelo Remix quanto pela interface web visual desenvolvida para a banca.

---

## 0. Preparação do Ambiente (MetaMask)
Para que os testes funcionem sem esbarrar nas travas de permissão do contrato, utilize **4 contas (endereços) diferentes** na sua MetaMask:

* **Conta 1:** Locador (Criador do contrato / Proprietário)
* **Conta 2:** Locatário (Inquilino)
* **Conta 3:** Agente de Verificação (Oráculo / Perito)
* **Conta 4:** Árbitro (Juiz as a Service - JaaS)

> 💡 **Dica:** Certifique-se de que a **Conta 1 (Locador)** possui saldo em Sepolia ETH para pagar o deploy. As contas 2, 3 e 4 também precisam de uma pequena fração de Sepolia ETH para pagar as taxas de transação das ações.

No Remix, vá na aba **Deploy & Run Transactions** e mude o campo `Environment` para **Injected Provider - MetaMask** (para conectar sua carteira ao Remix).

---

## 1. Deploy da Moeda Falsa (MockBRL)
O contrato de caução custódia tokens ERC-20 pareados ao Real.

1. Na aba lateral do Remix, compile o arquivo `MockBRL.sol`.
2. Em **Deploy & Run Transactions**, confirme que a MetaMask está na **Conta 1 (Locador)**.
3. Selecione o contrato `MockBRL` no dropdown.
4. Clique em **Deploy** e confirme a transação na MetaMask.
5. Quando finalizar, o contrato aparecerá em *Deployed Contracts*. **Copie o endereço dele** clicando no ícone de prancheta.

---

## 2. Emissão de Saldo para o Inquilino (Faucet)
O Locatário (Conta 2) precisa de saldo fictício de mBRL para depositar a garantia.

1. Na MetaMask, copie o endereço público da **Conta 2 (Locatário)**.
2. No Remix, expanda as funções do contrato `MockBRL` recém-criado.
3. Abra a função laranja **`mint`**:
   - `to`: Cole o endereço da **Conta 2**.
   - `amount`: Digite `3000` (ou `3000000000000000000000` caso utilize 18 casas decimais).
4. Clique em **transact** e confirme na MetaMask.

---

## 3. Deploy do Contrato Principal de Caução
1. Compile o arquivo `caucao.sol`.
2. Garanta que a MetaMask está selecionada na **Conta 1 (Locador)**.
3. No campo `CONTRACT`, selecione `CaucaoLocaticia`.
4. Abra a setinha ao lado do botão **Deploy** e preencha os parâmetros do construtor:
   - `_token`: Endereço do **MockBRL** (copiado no Passo 1).
   - `_locatario`: Endereço da **Conta 2**.
   - `_agente`: Endereço da **Conta 3**.
   - `_arbitro`: Endereço da **Conta 4**.
   - `_valorCaucao`: `3000` (mesmo montante emitido para o inquilino).
   - `_dataFim`: `2000000000` (Timestamp que representa o ano 2033, simulando contrato vigente).
   - `_prazoContestacao`: `86400` (Representa 1 dia em segundos para o prazo de resposta).
5. Clique em **transact** e confirme na MetaMask.
6. Copie o endereço do contrato `CaucaoLocaticia` recém-criado.

> ⚠️ **Configuração para o Front-end:**  
> Abra o arquivo `app.js` e cole os endereços gerados nas constantes do topo:
> ```javascript
> const CAUCAO_ADDRESS = "COLE_O_ENDERECO_DO_CAUCAO_AQUI";
> const MOCKBRL_ADDRESS = "COLE_O_ENDERECO_DO_MOCKBRL_AQUI";
> ```

---

## 4. Apresentação Visual pelo Front-end (Recomendado para a Banca)

Este é o fluxo ideal para apresentar para a banca de TCC, pois a interface reage automaticamente à troca de contas na MetaMask.

### Preparação do Front-end:
Abra a pasta do projeto no VS Code com a extensão **Live Server** (ou via terminal com `npx http-server .`) para abrir o `index.html` em `http://localhost:5500` (evitando bloqueios de CORS ao ler o `abi.txt`).

---

### Passo a Passo no Navegador:

#### Etapa 1: Depósito da Caução (Inquilino)
1. Na MetaMask, selecione a **Conta 2 (Locatário)** e clique em **Conectar MetaMask** no site.
2. O card **"Depositar Caução"** aparecerá na tela.
3. Clique em **"1. Aprovar"** e confirme a permissão na MetaMask.
4. Quando a aprovação confirmar, o botão **"2. Depositar"** será liberado.
5. Clique em **"2. Depositar"** e aprove na carteira.
   - *Resultado:* A barra da Linha do Tempo avança para o **Passo 2: Ativo**.

#### Etapa 2: Sinalização de Quebra / Encerramento (Locador)
1. Na MetaMask, troque para a **Conta 1 (Locador)**. A tela se adapta sozinha sem precisar de F5!
2. O card **"Solicitar Laudo"** aparecerá.
3. No campo de seleção, escolha **"Inadimplência (Calote)"** e clique em **"Sinalizar Rede"**.
   - *Resultado:* A barra avança para o **Passo 3: Aguard. Laudo**.

#### Etapa 3: Vistoria e Envio do Laudo no IPFS (Agente / Oráculo)
1. Na MetaMask, troque para a **Conta 3 (Agente)**.
2. O card **"Enviar Laudo (Oráculo)"** se tornará visível.
3. No campo de upload, selecione qualquer arquivo PDF do seu computador.
   - *O sistema calcula o hash ou faz o upload para a Pinata, exibindo o CID do IPFS gerado.*
4. No campo do valor de avarias, digite `1000`.
5. Clique em **"Registrar Laudo na Blockchain"** e confirme na MetaMask.
   - *Resultado:* O contrato armazena o CID e avança para a fase de avaliação.

#### Etapa 4: Avaliação e Contestação com Leitura do Laudo (Locatário)
1. Na MetaMask, troque para a **Conta 2 (Locatário)**.
2. **A mágica do IPFS:** Repare que agora surgiu o banner **"Laudo Pericial Registrado na Blockchain"** e, dentro do card de avaliação, o botão:
   👉 **`[📄 Abrir Laudo]`** (ou Abrir Laudo no IPFS).
3. Clique no botão para mostrar para a banca que o documento oficial pode ser lido diretamente pelo gateway descentralizado da Pinata.
4. Para demonstrar a governança de exceção e a válvula de escape do árbitro, clique em **"Contestar"**.
   - *Resultado:* A Etapa 4 da Linha do Tempo fica vermelha e exibe com destaque: **"Em Disputa!"**.

#### Etapa 5: Resolução do Litígio (Árbitro - JaaS)
1. Na MetaMask, troque para a **Conta 4 (Árbitro)**.
2. O card **"Veredito Arbitral (JaaS)"** aparecerá.
3. Selecione um PDF com a sentença arbitral.
4. No campo de montante para o locador, defina um valor conciliatório, ex: `500` (reduzindo a penalidade de 1000 para 500).
5. Clique em **"Executar Sentença"** e confirme na MetaMask.
   - *Resultado:* A linha do tempo avança para o **Passo 5: Encerrado**, fatiando os saldos (500 pro locador e 2500 pro locatário).

#### Etapa 6: Resgate dos Fundos (Pull-Payment)
1. Conecte com a **Conta 1 (Locador)** -> O card **"Resgate de Fundos"** estará disponível -> Clique em **"Sacar meu Saldo"** para resgatar os 500 mBRL.
2. Conecte com a **Conta 2 (Locatário)** -> O mesmo card estará visível -> Clique em **"Sacar meu Saldo"** para resgatar a devolução de 2500 mBRL.

---

## 5. Roteiro Alternativo pelo Remix (Para Debug Técnico)

Caso queira testar ou demonstrar diretamente pelos botões do Remix IDE:

1. **Aprovar e Depositar:** Na Conta 2, execute `MockBRL.approve(enderecoCaucao, 3000)` e depois `CaucaoLocaticia.depositarCaucao()`.
2. **Solicitar Laudo:** Na Conta 1, execute `solicitarLaudo(1)`.
3. **Enviar Laudo:** Na Conta 3, execute `enviarLaudo`:
   - `_cidLaudo`: Digite `"QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"` (ou qualquer string entre aspas).
   - `_valorDanos`: `1000`.
4. **Contestar:** Na Conta 2, execute `contestarLaudo()`.
5. **Emitir Veredito:** Na Conta 4, execute `emitirVeredito`:
   - `_valorLocador`: `500`.
   - `_cidVeredito`: `"QmVereditoSentencaFinal123"`.
6. **Sacar:** Execute `sacar()` na Conta 1 e depois na Conta 2.
