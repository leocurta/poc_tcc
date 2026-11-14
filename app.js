// ==========================================
// CONFIGURAÇÕES DO CONTRATO E IPFS (PINATA)
// ==========================================
// TODO: Cole aqui os endereços após fazer o deploy no Remix!!
const CAUCAO_ADDRESS = "enreco_caucao";
const MOCKBRL_ADDRESS = "endereco_mockbrl";

const PINATA_JWT = "chave_pinata_jwt";


let provider;
let signer;
let userAddress;
let caucaoContract;
let mockBrlContract;

let currentLaudoCid = "";
let currentVereditoCid = "";

const mockBrlABI = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];


const ESTADOS = [
    "CRIADO",
    "ATIVO",
    "AGUARDANDO LAUDO",
    "LAUDO EMITIDO",
    "EM DISPUTA",
    "ENCERRADO"
];


async function init() {
    if (typeof window.ethereum === 'undefined') {
        showMsg("MetaMask não detectada. Instale a extensão no seu navegador.", "error");
        return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', () => window.location.reload());

    document.getElementById('btnConnect').addEventListener('click', connectWallet);
    document.getElementById('btnRefresh').addEventListener('click', updateUI);

    setupButtons();
    setupFileUploads();
}

async function connectWallet() {
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        handleAccountsChanged(accounts);
    } catch (error) {
        console.error("Erro na conexão", error);
        showMsg("Erro ao conectar a carteira.", "error");
    }
}

async function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        showMsg("Por favor, conecte a MetaMask.", "error");
        document.getElementById('walletInfo').classList.add('hidden');
        document.getElementById('btnConnect').classList.remove('hidden');
        return;
    }

    userAddress = accounts[0];
    signer = await provider.getSigner();

    document.getElementById('userAddress').innerText = userAddress.substring(0, 6) + "..." + userAddress.substring(38);
    document.getElementById('walletInfo').classList.remove('hidden');
    document.getElementById('btnConnect').classList.add('hidden');

    showMsg(`Carteira conectada: ${userAddress}`, "success");

    await loadContracts();
}

async function loadContracts() {
    if (!CAUCAO_ADDRESS || CAUCAO_ADDRESS.includes("COLE_SEU")) {
        showMsg("Atenção: Cole os endereços dos contratos no topo do arquivo app.js!", "error");
        return;
    }

    try {
        const response = await fetch('abi.txt');
        const caucaoABI = await response.json();

        caucaoContract = new ethers.Contract(CAUCAO_ADDRESS, caucaoABI, signer);
        mockBrlContract = new ethers.Contract(MOCKBRL_ADDRESS, mockBrlABI, signer);

        await updateUI();
    } catch (error) {
        console.error("Erro ao carregar contratos:", error);
        showMsg("Erro ao carregar abi.txt. Você está usando um servidor local (Live Server / http-server)?", "error");
    }
}


async function updateUI() {
    if (!caucaoContract) return;

    try {
        console.log("Atualizando Estado...");
        const estadoRaw = await caucaoContract.estado();
        const estadoAtual = Number(estadoRaw);

        updateTimeline(estadoAtual);

        console.log(`Lendo permissões on-chain para a carteira: ${userAddress}`);
        const acoes = await caucaoContract.acoesDisponiveis(userAddress);
        console.log("Ações liberadas para você:", acoes);


        toggleCard('card-depositar', acoes.depositar);

        const podeSolicitar = acoes.solicitarFimPrazo || acoes.solicitarInadimplencia || acoes.solicitarRescisao;
        toggleCard('card-solicitarLaudo', podeSolicitar);
        atualizarSelectMotivos(acoes);

        toggleCard('card-enviarLaudo', acoes.enviarLaudo);
        toggleCard('card-avaliarLaudo', acoes.aceitarLaudo || acoes.contestarLaudo);
        toggleCard('card-decursoPrazo', acoes.aceitarPorDecurso);
        toggleCard('card-emitirVeredito', acoes.emitirVeredito);
        toggleCard('card-sacar', acoes.sacar);

        if (acoes.sacar) {
            try {
                let saldo = 0n;
                const locadorAddr = await caucaoContract.locador();
                const locatarioAddr = await caucaoContract.locatario();
                if (userAddress.toLowerCase() === locadorAddr.toLowerCase()) {
                    saldo = await caucaoContract.saldoLocador();
                } else if (userAddress.toLowerCase() === locatarioAddr.toLowerCase()) {
                    saldo = await caucaoContract.saldoLocatario();
                }
                const infoEl = document.getElementById('saldoSacarInfo');
                if (infoEl) {
                    infoEl.innerHTML = `Saldo disponível para resgate: <span class="text-emerald-900 font-bold">${ethers.formatEther(saldo)} mBRL</span>`;
                }
            } catch (err) {
                console.warn("Erro ao ler saldo a sacar:", err);
            }
        }

        if (acoes.depositar) {
            await checkAllowance();
        }


        await checkLaudoRegistrado(acoes);

    } catch (error) {
        console.error("Erro ao atualizar UI", error);
    }
}


async function checkLaudoRegistrado(acoes) {
    const banner = document.getElementById('bannerLaudoRegistrado');
    const boxLocatario = document.getElementById('boxLaudoLocatario');
    const bannerCid = document.getElementById('bannerLaudoCid');
    const locatarioCid = document.getElementById('cidLaudoLocatario');
    const btnBanner = document.getElementById('btnAbrirLaudoBanner');
    const btnLocatario = document.getElementById('btnAbrirLaudoLocatario');

    try {
        const cidOnChain = await caucaoContract.cidLaudo();


        if (cidOnChain && cidOnChain.trim() !== "") {
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${cidOnChain}`;


            if (banner) {
                banner.classList.remove('hidden');
                if (bannerCid) bannerCid.innerText = cidOnChain;
                if (btnBanner) btnBanner.href = ipfsUrl;
            }

            if (boxLocatario && (acoes.aceitarLaudo || acoes.contestarLaudo)) {
                boxLocatario.classList.remove('hidden');
                if (locatarioCid) locatarioCid.innerText = cidOnChain;
                if (btnLocatario) btnLocatario.href = ipfsUrl;
            } else if (boxLocatario) {
                boxLocatario.classList.add('hidden');
            }
        } else {

            if (banner) banner.classList.add('hidden');
            if (boxLocatario) boxLocatario.classList.add('hidden');
        }
    } catch (e) {
        console.warn("Laudo ainda não inserido no contrato:", e);
        if (banner) banner.classList.add('hidden');
        if (boxLocatario) boxLocatario.classList.add('hidden');
    }
}

function updateTimeline(estado) {
    let progress = 0;
    if (estado === 1) progress = 25;
    if (estado === 2) progress = 50;
    if (estado === 3 || estado === 4) progress = 75;
    if (estado === 5) progress = 100;

    document.getElementById('timelineProgress').style.width = progress + '%';

    const steps = [0, 1, 2, 3, 5];

    steps.forEach(step => {
        const icon = document.getElementById(`step-icon-${step}`);
        if (!icon) return;

        icon.className = "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-500 z-10 relative";

        if (estado > step || (estado === 4 && step === 3) || estado === 5) {
            icon.classList.add('border-emerald-500', 'bg-emerald-500', 'text-white');
            icon.innerHTML = "✓";
        }
        else if (estado === step) {
            icon.classList.add('border-emerald-500', 'bg-white', 'text-emerald-600', 'ring-4', 'ring-emerald-100');
            icon.innerHTML = "•";
        }
        else {
            icon.classList.add('border-slate-300', 'bg-white', 'text-slate-400');
            icon.innerHTML = step === 5 ? "5" : (step === 3 ? "4" : step + 1);
        }
    });

    const step3Text = document.getElementById('step-text-3');
    if (estado === 4) {
        step3Text.innerText = "Em Disputa!";
        step3Text.classList.add('text-red-500', 'font-bold');
        document.getElementById('step-icon-3').classList.replace('text-emerald-600', 'text-red-500');
        document.getElementById('step-icon-3').classList.replace('border-emerald-500', 'border-red-500');
        document.getElementById('step-icon-3').classList.replace('ring-emerald-100', 'ring-red-100');
    } else {
        step3Text.innerText = "Avaliação";
        step3Text.classList.remove('text-red-500', 'font-bold');
    }
}

function toggleCard(id, show) {
    const el = document.getElementById(id);
    if (show) el.classList.remove('hidden-action');
    else el.classList.add('hidden-action');
}

function atualizarSelectMotivos(acoes) {
    const select = document.getElementById('motivoSelect');
    select.innerHTML = '';
    if (acoes.solicitarFimPrazo) select.innerHTML += `<option value="0">Término de Contrato (Fim do Prazo)</option>`;
    if (acoes.solicitarInadimplencia) select.innerHTML += `<option value="1">Inadimplência (Calote)</option>`;
    if (acoes.solicitarRescisao) select.innerHTML += `<option value="2">Rescisão Antecipada (Multa)</option>`;
}

async function checkAllowance() {
    try {
        const allowance = await mockBrlContract.allowance(userAddress, CAUCAO_ADDRESS);

        if (allowance > 0n) {
            document.getElementById('btnApprove').classList.add('opacity-50', 'cursor-not-allowed');
            document.getElementById('btnApprove').disabled = true;
            document.getElementById('btnApprove').innerText = "✅ Aprovado";

            document.getElementById('btnDeposit').classList.remove('opacity-50', 'cursor-not-allowed');
            document.getElementById('btnDeposit').disabled = false;
        } else {
            document.getElementById('btnApprove').classList.remove('opacity-50', 'cursor-not-allowed');
            document.getElementById('btnApprove').disabled = false;
            document.getElementById('btnApprove').innerText = "1. Aprovar M-BRL";

            document.getElementById('btnDeposit').classList.add('opacity-50', 'cursor-not-allowed');
            document.getElementById('btnDeposit').disabled = true;
        }
    } catch (error) {
        console.error("Erro checkAllowance:", error);
    }
}


function generateMockCid(bytes) {
    const hashHex = ethers.keccak256(bytes).replace('0x', '');
    const b58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let mock = "Qm";
    for (let i = 0; i < 44; i++) {
        const idx = parseInt(hashHex.substr((i * 2) % 60, 2), 16) % b58.length;
        mock += b58[idx];
    }
    return mock;
}

async function uploadArquivoIPFS(file, statusElement) {
    if (PINATA_JWT && PINATA_JWT.trim() !== "") {
        try {
            statusElement.innerText = "Enviando arquivo para o nó IPFS (Pinata)...";
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${PINATA_JWT}`
                },
                body: formData
            });

            if (!res.ok) {
                throw new Error(`Pinata HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            return data.IpfsHash;
        } catch (err) {
            console.warn("Aviso na API Pinata, gerando CID via fallback:", err);
            showMsg("Aviso: Falha na API Pinata. Usando CID local de contingência.", "info");
        }
    }

    statusElement.innerText = "Processando arquivo e gerando CID IPFS...";
    const buffer = await file.arrayBuffer();
    return generateMockCid(new Uint8Array(buffer));
}

function setupFileUploads() {
    document.getElementById('fileLaudo').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        document.getElementById('fileLaudoName').innerText = file.name;
        const hashEl = document.getElementById('fileLaudoHash');

        try {
            currentLaudoCid = await uploadArquivoIPFS(file, hashEl);
            hashEl.innerHTML = `CID IPFS: <a href="https://gateway.pinata.cloud/ipfs/${currentLaudoCid}" target="_blank" class="text-emerald-600 underline font-semibold">${currentLaudoCid.substring(0, 16)}...</a>`;
            showMsg(`Laudo processado para IPFS! CID: ${currentLaudoCid}`, "success");
        } catch (error) {
            console.error("Erro no processamento do laudo:", error);
            showMsg("Erro ao processar arquivo para IPFS.", "error");
        }
    });

    // Upload do Árbitro (Veredito)
    document.getElementById('fileVeredito').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        document.getElementById('fileVereditoName').innerText = file.name;
        const hashEl = document.getElementById('fileVereditoHash');

        try {
            currentVereditoCid = await uploadArquivoIPFS(file, hashEl);
            hashEl.innerHTML = `CID IPFS: <a href="https://gateway.pinata.cloud/ipfs/${currentVereditoCid}" target="_blank" class="text-emerald-600 underline font-semibold">${currentVereditoCid.substring(0, 16)}...</a>`;
            showMsg(`Sentença processada para IPFS! CID: ${currentVereditoCid}`, "success");
        } catch (error) {
            console.error("Erro no processamento do veredito:", error);
            showMsg("Erro ao processar arquivo para IPFS.", "error");
        }
    });
}

function setupButtons() {
    document.getElementById('btnApprove').addEventListener('click', async () => {
        execTx(async () => {
            const tx = await mockBrlContract.approve(CAUCAO_ADDRESS, ethers.parseEther("1000000"));
            return tx;
        }, "Autorizando gasto na MetaMask...");
    });

    document.getElementById('btnDeposit').addEventListener('click', async () => {
        execTx(() => caucaoContract.depositarCaucao(), "Enviando dinheiro para o cofre (Depositar)...");
    });

    document.getElementById('btnSolicitarLaudo').addEventListener('click', async () => {
        const motivo = document.getElementById('motivoSelect').value;
        execTx(() => caucaoContract.solicitarLaudo(motivo), "Sinalizando o contrato sobre o término...");
    });

    document.getElementById('btnEnviarLaudo').addEventListener('click', async () => {
        const valorDanos = document.getElementById('valorDanos').value;
        if (!currentLaudoCid || !valorDanos) {
            showMsg("Atenção: Você precisa anexar um arquivo PDF e preencher o valor dos danos!", "error");
            return;
        }
        const valorDanosWei = ethers.parseEther(valorDanos.toString());
        execTx(() => caucaoContract.enviarLaudo(currentLaudoCid, valorDanosWei), "Gravando Laudo com CID IPFS na Blockchain...");
    });

    document.getElementById('btnAceitarLaudo').addEventListener('click', async () => {
        execTx(() => caucaoContract.aceitarLaudo(), "Assinando aceite e encerrando contrato...");
    });

    document.getElementById('btnContestarLaudo').addEventListener('click', async () => {
        execTx(() => caucaoContract.contestarLaudo(), "Acionando a Mutabilidade Controlada (Em Disputa)...");
    });

    document.getElementById('btnDecursoPrazo').addEventListener('click', async () => {
        execTx(() => caucaoContract.aceitarPorDecurso(), "Forçando aprovação por decurso de prazo...");
    });

    document.getElementById('btnEmitirVeredito').addEventListener('click', async () => {
        const valorLocador = document.getElementById('valorLocadorVeredito').value;
        if (!currentVereditoCid || !valorLocador) {
            showMsg("Atenção: Anexe a sentença em PDF e preencha o valor do Locador!", "error");
            return;
        }
        const valorLocadorWei = ethers.parseEther(valorLocador.toString());
        execTx(() => caucaoContract.emitirVeredito(valorLocadorWei, currentVereditoCid), "Emitindo Sentença com CID IPFS...");
    });

    document.getElementById('btnSacar').addEventListener('click', async () => {
        execTx(() => caucaoContract.sacar(), "Resgatando fundos do cofre (Pull-Payment)...");
    });
}

async function execTx(txFunction, loadingMsg) {
    showMsg(loadingMsg, "info");
    try {
        const tx = await txFunction();
        console.log("Hash da Transação:", tx.hash);
        showMsg("Transação enviada! Aguardando mineração...", "info");

        await tx.wait();

        console.log("Transação confirmada na blockchain!");
        showMsg("Sucesso! Transação confirmada.", "success");
        updateUI();
    } catch (error) {
        console.error(error);
        const reason = error.reason || error.message || "Erro desconhecido";
        showMsg(`Transação Falhou: ${reason}`, "error");
    }
}

function showMsg(text, type) {
    const box = document.getElementById('msgBox');
    box.innerText = text;
    box.classList.remove('hidden', 'bg-red-50', 'text-red-700', 'border-red-200', 'bg-emerald-50', 'text-emerald-700', 'border-emerald-200', 'bg-blue-50', 'text-blue-700', 'border-blue-200');

    if (type === "error") box.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
    else if (type === "success") box.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
    else box.classList.add('bg-blue-50', 'text-blue-700', 'border-blue-200');
}

// Start
window.onload = init;
