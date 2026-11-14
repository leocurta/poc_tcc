/**
 * ==============================================================================
 * SCRIPT DE TESTES AUTOMATIZADOS NA LAYER 2 (BASE SEPOLIA)
 * ==============================================================================
 * 
 * Este script executa os 3 cenários diretamente na rede real de testes Base Sepolia!
 * Ele registra transações e blocos reais que podem ser auditados no BaseScan:
 * https://sepolia.basescan.org
 *
 * COMO PREPARAR E RODAR NO REMIX:
 * 1. Certifique-se de compilar "MockBRL.sol" e "caucao.sol" na aba Solidity Compiler do Remix.
 * 2. Preencha abaixo a CHAVE PRIVADA da sua Conta 1 (Locador).
 *    -> Esta conta precisa ter um pouquinho de Base Sepolia ETH (ex: 0.005 ETH).
 *    -> As contas 2, 3 e 4 são opcionais: se você deixar vazio, o script criará 
 *       carteiras temporárias e transferirá uma fração de ETH para elas automaticamente!
 * 3. No explorador de arquivos do Remix, crie um arquivo "testar_base_sepolia.js" e cole este código.
 * 4. Clique com o botão direito no arquivo -> "Run" (ou execute via Play no topo).
 * ==============================================================================
 */

// ==============================================================================
//  CONFIGURAÇÃO DE CONTAS E REDE BASE SEPOLIA
// ==============================================================================

const CONFIG = {
    // RPC Oficial da Base Sepolia
    rpcUrl: "https://sepolia.base.org",
    chainId: 84532,

    // Cotação para conversão no TCC
    cotacaoEthBrl: 12100, // 1 ETH = R$ 18.000

    // Cole aqui as Chaves Privadas (Private Keys) da MetaMask:
    // (Atenção: Use apenas contas de teste da rede Sepolia!)
    chaves: {
        // OBRIGATÓRIA: Deve ter saldo em Base Sepolia ETH
        locador: "0xe0d50dEec1ef28Ee613F2cDa412f7CbC8369cc26",

        // OPCIONAIS: Se deixar vazio (""), o script gera e abastece automaticamente com gas:
        locatario: "0xb14a31D6Cae94f4784EAE7Ca3536414eDAc49F35",
        agente: "0xF4179DA4745E960B9D263a9A8b8f2b1c040Df3a7",
        arbitro: "0x92b88132E1581d027eF6603aA22D8A20b6425C16"
    }
};

// ==============================================================================
//  EXECUÇÃO AUTOMATIZADA
// ==============================================================================

(async () => {
    try {
        console.log("===============================================================");
        console.log("🌐 INICIANDO TESTES NA LAYER 2 (BASE SEPOLIA - CHAIN ID 84532)");
        console.log("===============================================================\n");

        if (!CONFIG.chaves.locador || CONFIG.chaves.locador.includes("COLE_SUA_CHAVE")) {
            throw new Error(
                "Você precisa preencher a chave privada do Locador no objeto CONFIG.chaves.locador no topo do arquivo!"
            );
        }

        // Utilitários de compatibilidade
        const parseEther = (val) => ethers.parseEther ? ethers.parseEther(val) : ethers.utils.parseEther(val);
        const parseUnits = (val, unit) => ethers.parseUnits ? ethers.parseUnits(val, unit) : ethers.utils.parseUnits(val, unit);
        const formatEther = (val) => ethers.formatEther ? ethers.formatEther(val) : ethers.utils.formatEther(val);
        const getAddr = async (c) => (c.getAddress ? await c.getAddress() : c.address);
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Força os mesmos parâmetros de taxa de Layer 2 que a MetaMask usa na Base Sepolia:
        // Prioridade de 0.001 Gwei e teto de 0.015 Gwei (evita o default de 1.5 Gwei de L1 do ethers.js)
        const L2_FEE = {
            maxPriorityFeePerGas: parseUnits("0.001", "gwei"),
            maxFeePerGas: parseUnits("0.015", "gwei")
        };

        // 1. Conectar ao Provider da Base Sepolia
        let provider;
        if (ethers.JsonRpcProvider) {
            provider = new ethers.JsonRpcProvider(CONFIG.rpcUrl); // ethers v6
        } else {
            provider = new ethers.providers.JsonRpcProvider(CONFIG.rpcUrl); // ethers v5
        }

        const network = await provider.getNetwork();
        console.log(`🔗 Conectado à rede: Chain ID ${network.chainId.toString()}`);

        // 2. Inicializar Wallets dos 4 atores
        const locador = new ethers.Wallet(CONFIG.chaves.locador, provider);

        const locatario = CONFIG.chaves.locatario
            ? new ethers.Wallet(CONFIG.chaves.locatario, provider)
            : ethers.Wallet.createRandom().connect(provider);

        const agente = CONFIG.chaves.agente
            ? new ethers.Wallet(CONFIG.chaves.agente, provider)
            : ethers.Wallet.createRandom().connect(provider);

        const arbitro = CONFIG.chaves.arbitro
            ? new ethers.Wallet(CONFIG.chaves.arbitro, provider)
            : ethers.Wallet.createRandom().connect(provider);

        console.log("\n👥 Carteiras dos 4 Atores no Base Sepolia:");
        console.log(` • Locador   : ${locador.address}`);
        console.log(` • Locatário : ${locatario.address}`);
        console.log(` • Agente    : ${agente.address}`);
        console.log(` • Árbitro   : ${arbitro.address}\n`);

        // 3. Verificar Saldo do Locador e Abastecer as outras contas se necessário
        const saldoLocador = await provider.getBalance(locador.address);
        console.log(`💰 Saldo do Locador: ${formatEther(saldoLocador)} ETH`);

        if (saldoLocador < parseEther("0.001")) {
            throw new Error(
                `Saldo insuficiente na conta do Locador (${formatEther(saldoLocador)} ETH). Obtenha ETH no faucet da Base Sepolia.`
            );
        }

        // Garante que Locatário, Agente e Árbitro tenham saldo suficiente para pagar o Gas das suas transações
        const atoresSecundarios = [
            { nome: "Locatário", wallet: locatario },
            { nome: "Agente", wallet: agente },
            { nome: "Árbitro", wallet: arbitro }
        ];

        async function abastecerAtores(minimoEth = "0.0015", enviarEth = "0.004") {
            for (const ator of atoresSecundarios) {
                const saldo = await provider.getBalance(ator.wallet.address);
                if (saldo < parseEther(minimoEth)) {
                    console.log(`  ⛽ Abastecendo ${ator.nome} (${formatEther(saldo)} ETH restantes) com +${enviarEth} ETH para gas...`);
                    const txEnvio = await locador.sendTransaction({
                        to: ator.wallet.address,
                        value: parseEther(enviarEth),
                        ...L2_FEE
                    });
                    await txEnvio.wait();
                }
            }
        }

        console.log("⛽ Verificando/Abastecendo saldo de Gas para os outros atores...");
        await abastecerAtores("0.002", "0.004");
        console.log("✔ Todas as 4 contas possuem saldo de gas na Base Sepolia!\n");

        // 4. Carregar Artefatos Compilados do Remix
        async function getFactory(name, signer) {
            const paths = [
                `artifacts/${name}.json`,
                `contracts/artifacts/${name}.json`,
                `browser/artifacts/${name}.json`
            ];
            for (const p of paths) {
                try {
                    const artifact = JSON.parse(await remix.call('fileManager', 'getFile', p));
                    const bytecode = artifact.data ? artifact.data.bytecode.object : artifact.bytecode;
                    return new ethers.ContractFactory(artifact.abi, bytecode, signer);
                } catch (e) { }
            }
            // Tentativa via getContractFactory
            if (ethers.getContractFactory) {
                const f = await ethers.getContractFactory(name);
                return f.connect(signer);
            }
            throw new Error(`Artefatos de ${name} não encontrados. Compile ${name}.sol no Solidity Compiler do Remix.`);
        }

        console.log("📦 Carregando contratos compilados...");
        const MockBRLFactory = await getFactory("MockBRL", locador);
        const CaucaoFactory = await getFactory("CaucaoLocaticia", locador);

        // 5. Deploy do Token ERC20 de garantia (MockBRL)
        console.log("\n📦 [Passo Base] Fazendo deploy do MockBRL na Base Sepolia...");
        const mockBRL = await MockBRLFactory.deploy(L2_FEE);
        if (mockBRL.waitForDeployment) await mockBRL.waitForDeployment();
        else await mockBRL.deployed();
        const mockBRLAddress = await getAddr(mockBRL);
        console.log(`✔ MockBRL publicado em: ${mockBRLAddress}`);

        const VALOR_CAUCAO = parseEther("3000"); // 3.000 mBRL
        const VALOR_DANOS = parseEther("1000");  // 1.000 mBRL danos
        const VALOR_VEREDITO = parseEther("500"); // 500 mBRL veredito

        // Emite tokens para o Inquilino
        console.log("💳 Emitindo 10.000 mBRL de saldo para o Inquilino...");
        const mintTx = await mockBRL.connect(locador).mint(locatario.address, parseEther("10000"), L2_FEE);
        await mintTx.wait();

        const registros = [];

        async function registrar(cenario, operacao, atorNome, txPromise) {
            console.log(`  ⏳ Enviando: [${cenario}] ${operacao} (${atorNome})...`);
            const tx = await txPromise;
            const receipt = await tx.wait();

            const gasUsed = receipt.gasUsed ? BigInt(receipt.gasUsed.toString()) : 0n;
            const gasPrice = receipt.effectiveGasPrice ? BigInt(receipt.effectiveGasPrice.toString()) :
                (receipt.gasPrice ? BigInt(receipt.gasPrice.toString()) : 10000000n); // ~0.01 Gwei padrão na L2

            const custoEthNum = (Number(gasUsed * gasPrice) / 1e18);
            const custoBrlNum = custoEthNum * CONFIG.cotacaoEthBrl;
            const txHash = receipt.hash || receipt.transactionHash;
            const blockHash = receipt.blockHash;

            registros.push({
                cenario,
                operacao,
                ator: atorNome,
                blocoNum: receipt.blockNumber,
                blocoHashCurto: blockHash.substring(0, 10) + "...",
                linkBloco: `https://sepolia.basescan.org/block/${receipt.blockNumber}`,
                txHashCurto: txHash.substring(0, 10) + "...",
                linkTx: `https://sepolia.basescan.org/tx/${txHash}`,
                gasUsadoNum: Number(gasUsed),
                gasUsadoStr: Number(gasUsed).toLocaleString('pt-BR'),
                custoEthNum,
                custoBrlNum,
                custoEth: custoEthNum.toFixed(8) + " ETH",
                custoBrl: "R$ " + custoBrlNum.toFixed(4)
            });

            console.log(`  ✔ Confirmado no Bloco #${receipt.blockNumber}! Gas: ${Number(gasUsed).toLocaleString('pt-BR')} (Tx: ${txHash.substring(0, 10)}...)`);
            return receipt;
        }

        // =====================================================================
        // CENÁRIO 1: Encerramento sem problemas (Fim de Contrato + 100% Devolução)
        // =====================================================================
        console.log("\n===============================================================");
        console.log("▶ EXECUTANDO CENÁRIO 1: Fim do Contrato Sem Danos (100% Devolução)");
        console.log("===============================================================");
        {
            const cenarioNome = "C1 (Sem Danos)";
            const blockAtual = await provider.getBlock('latest');
            // Prazo curto de 15 segundos para vencer de verdade na blockchain da Base Sepolia
            const dataFim = blockAtual.timestamp + 15;
            const prazoContestacao = 86400;

            const caucaoC1 = await CaucaoFactory.deploy(
                mockBRLAddress, locatario.address, agente.address, arbitro.address,
                VALOR_CAUCAO, dataFim, prazoContestacao, L2_FEE
            );
            const deployTx = caucaoC1.deploymentTransaction ? caucaoC1.deploymentTransaction() : caucaoC1.deployTransaction;
            await registrar(cenarioNome, "Deploy Contrato Caução", "Locador", deployTx);

            const caucaoC1Addr = await getAddr(caucaoC1);

            // Inquilino aprova e deposita
            await registrar(cenarioNome, "Aprovar mBRL (Approve)", "Locatário",
                mockBRL.connect(locatario).approve(caucaoC1Addr, VALOR_CAUCAO, L2_FEE));

            await registrar(cenarioNome, "Depositar Caução", "Locatário",
                caucaoC1.connect(locatario).depositarCaucao(L2_FEE));

            // Aguarda o tempo real da blockchain atingir a dataFim
            let checkBlock = await provider.getBlock('latest');
            if (checkBlock.timestamp <= dataFim) {
                const esperaSegundos = (dataFim - checkBlock.timestamp) + 3;
                console.log(`  ⏳ Aguardando ${esperaSegundos}s para vencer a vigência do contrato na Base Sepolia...`);
                await sleep(esperaSegundos * 1000);
            }

            // Locador solicita laudo com motivo FIM_PRAZO
            await registrar(cenarioNome, "Solicitar Laudo (Fim de Prazo)", "Locador",
                caucaoC1.connect(locador).solicitarLaudo(0, L2_FEE));

            // Agente envia laudo atestando 0 avarias
            await registrar(cenarioNome, "Enviar Laudo (Zero Avarias)", "Agente",
                caucaoC1.connect(agente).enviarLaudo("QmLaudoImpecavelBase123", 0, L2_FEE));

            // Inquilino saca 100% da garantia
            await registrar(cenarioNome, "Sacar Devolução 100%", "Locatário",
                caucaoC1.connect(locatario).sacar(L2_FEE));
        }

        // =====================================================================
        // CENÁRIO 2: Quebra com Acordo Amigável (Avarias Aceitas)
        // =====================================================================
        console.log("\n===============================================================");
        console.log("▶ EXECUTANDO CENÁRIO 2: Quebra de Contrato com Aceite Amigável");
        console.log("===============================================================");
        {
            const cenarioNome = "C2 (Acordo Amigável)";
            await abastecerAtores();
            const dataFim = 2000000000;
            const prazoContestacao = 86400;

            const caucaoC2 = await CaucaoFactory.deploy(
                mockBRLAddress, locatario.address, agente.address, arbitro.address,
                VALOR_CAUCAO, dataFim, prazoContestacao, L2_FEE
            );
            const deployTx = caucaoC2.deploymentTransaction ? caucaoC2.deploymentTransaction() : caucaoC2.deployTransaction;
            await registrar(cenarioNome, "Deploy Contrato Caução", "Locador", deployTx);

            const caucaoC2Addr = await getAddr(caucaoC2);

            await registrar(cenarioNome, "Aprovar mBRL (Approve)", "Locatário",
                mockBRL.connect(locatario).approve(caucaoC2Addr, VALOR_CAUCAO, L2_FEE));

            await registrar(cenarioNome, "Depositar Caução", "Locatário",
                caucaoC2.connect(locatario).depositarCaucao(L2_FEE));

            // Locador declara quebra por inadimplência
            await registrar(cenarioNome, "Solicitar Laudo (Inadimplência)", "Locador",
                caucaoC2.connect(locador).solicitarLaudo(1, L2_FEE));

            // Perito emite laudo de avarias (R$ 1.000)
            await registrar(cenarioNome, "Enviar Laudo (R$ 1.000 Danos)", "Agente",
                caucaoC2.connect(agente).enviarLaudo("QmLaudoDanos1000Base", VALOR_DANOS, L2_FEE));

            // Locatário concorda com o laudo
            await registrar(cenarioNome, "Aceitar Laudo", "Locatário",
                caucaoC2.connect(locatario).aceitarLaudo(L2_FEE));

            // Saques
            await registrar(cenarioNome, "Sacar Indenização Avarias", "Locador",
                caucaoC2.connect(locador).sacar(L2_FEE));

            await registrar(cenarioNome, "Sacar Saldo Remanescente", "Locatário",
                caucaoC2.connect(locatario).sacar(L2_FEE));
        }

        // =====================================================================
        // CENÁRIO 3: Quebra com Disputa, Contestação e Sentença Arbitral (JaaS)
        // =====================================================================
        console.log("\n===============================================================");
        console.log("▶ EXECUTANDO CENÁRIO 3: Quebra com Contestação e Sentença Arbitral");
        console.log("===============================================================");
        {
            const cenarioNome = "C3 (Arbitragem JaaS)";
            await abastecerAtores();
            const dataFim = 2000000000;
            const prazoContestacao = 86400;

            const caucaoC3 = await CaucaoFactory.deploy(
                mockBRLAddress, locatario.address, agente.address, arbitro.address,
                VALOR_CAUCAO, dataFim, prazoContestacao, L2_FEE
            );
            const deployTx = caucaoC3.deploymentTransaction ? caucaoC3.deploymentTransaction() : caucaoC3.deployTransaction;
            await registrar(cenarioNome, "Deploy Contrato Caução", "Locador", deployTx);

            const caucaoC3Addr = await getAddr(caucaoC3);

            await registrar(cenarioNome, "Aprovar mBRL (Approve)", "Locatário",
                mockBRL.connect(locatario).approve(caucaoC3Addr, VALOR_CAUCAO, L2_FEE));

            await registrar(cenarioNome, "Depositar Caução", "Locatário",
                caucaoC3.connect(locatario).depositarCaucao(L2_FEE));

            await registrar(cenarioNome, "Solicitar Laudo (Inadimplência)", "Locador",
                caucaoC3.connect(locador).solicitarLaudo(1, L2_FEE));

            await registrar(cenarioNome, "Enviar Laudo (R$ 1.000 Danos)", "Agente",
                caucaoC3.connect(agente).enviarLaudo("QmLaudoDanos1000Base", VALOR_DANOS, L2_FEE));

            // Locatário discorda e aciona disputa
            await registrar(cenarioNome, "Contestar Laudo (Disputa)", "Locatário",
                caucaoC3.connect(locatario).contestarLaudo(L2_FEE));

            // Árbitro intervém com sentença de conciliação
            await registrar(cenarioNome, "Emitir Veredito Arbitral", "Árbitro",
                caucaoC3.connect(arbitro).emitirVeredito(VALOR_VEREDITO, "QmSentencaFinalBase500", L2_FEE));

            // Saques finais
            await registrar(cenarioNome, "Sacar Indenização Decidida", "Locador",
                caucaoC3.connect(locador).sacar(L2_FEE));

            await registrar(cenarioNome, "Sacar Saldo Restante", "Locatário",
                caucaoC3.connect(locatario).sacar(L2_FEE));
        }

        // =====================================================================
        // TABELAS E RESULTADOS FINAIS
        // =====================================================================
        console.log("\n===============================================================");
        console.log("📊 TABELA CONSOLIDADA DE GASTOS NA LAYER 2 (BASE SEPOLIA)");
        console.log("===============================================================");

        console.table(registros.map(r => ({
            "Cenário": r.cenario,
            "Operação": r.operacao,
            "Ator": r.ator,
            "Nº Bloco": r.blocoNum,
            "Gas Usado": r.gasUsadoStr,
            "Custo (ETH)": r.custoEth,
            "Custo (R$)": r.custoBrl,
            "BaseScan Tx": r.linkTx
        })));

        const totais = {};
        for (const r of registros) {
            if (!totais[r.cenario]) {
                totais[r.cenario] = { gas: 0, custoEth: 0, custoBrl: 0 };
            }
            totais[r.cenario].gas += r.gasUsadoNum;
            totais[r.cenario].custoEth += r.custoEthNum;
            totais[r.cenario].custoBrl += r.custoBrlNum;
        }

        console.log("\n📌 RESUMO TOTAL DE CUSTOS POR CENÁRIO:");
        for (const [cenario, t] of Object.entries(totais)) {
            // Projeção se estivesse na Base Mainnet real (onde o gas price é de ~0.005 Gwei)
            const brlMainnet = (t.gas * 0.005 * 1e-9 * CONFIG.cotacaoEthBrl).toFixed(4);
            console.log(`\n • ${cenario}:`);
            console.log(`   - Total de Gas: ${t.gas.toLocaleString('pt-BR')} unidades`);
            console.log(`   - Custo Real na Testnet (Base Sepolia): ${t.custoEth.toFixed(6)} ETH (~R$ ${t.custoBrl.toFixed(2)})`);
            console.log(`   - Custo Projetado na Rede Real (Base Mainnet a 0.005 Gwei): ~R$ ${brlMainnet}`);
        }

        console.log("\n📝 TABELA EM MARKDOWN COM LINKS REAIS DO BASESCAN (PARA O SEU TCC):");
        console.log("------------------------------------------------------------------------------------------------------------------------");
        console.log("| Cenário | Operação | Ator | Nº Bloco | Link do Bloco | Gas Usado | Custo Estimado (R$) | Link Transação (BaseScan) |");
        console.log("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |");
        for (const r of registros) {
            console.log(`| ${r.cenario} | ${r.operacao} | ${r.ator} | #${r.blocoNum} | [Bloco #${r.blocoNum}](${r.linkBloco}) | ${r.gasUsadoStr} | ${r.custoBrl} | [Ver Tx](${r.linkTx}) |`);
        }
        console.log("------------------------------------------------------------------------------------------------------------------------");
        console.log("✨ Todos os testes foram gravados com sucesso na rede Base Sepolia!");

    } catch (erro) {
        console.error("\n❌ ERRO NA EXECUÇÃO DO TESTE NA BASE SEPOLIA:", erro);
    }
})();
