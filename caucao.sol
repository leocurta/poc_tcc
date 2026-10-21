// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

error EstadoInvalido();
error NaoAutorizado();
error ValorInvalido();
error EnderecoInvalido();
error SemSaldo();
error PrazoNaoVencido();
error PrazoEmAberto();


contract CaucaoLocaticia is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Estado {
        CRIADO,           // Aguardando locatário depositar
        ATIVO,            // Depósito feito. Aluguel vigente
        AGUARDANDO_LAUDO, // Locador ou Locatário solicitaram encerramento/avaliação
        LAUDO_EMITIDO,    // Agente enviou laudo com danos, aguardando aceite/contestação do locatário
        EM_DISPUTA,       // Locatário contestou, acionando o Árbitro (JaaS)
        ENCERRADO         // Valores divididos e prontos para saque (Pull-Payment)
    }

    enum Motivo { FIM_PRAZO, INADIMPLENCIA, RESCISAO_ANTECIPADA }

    IERC20 public immutable token;
    address public immutable locador;
    address public immutable locatario;
    address public immutable agente;
    address public immutable arbitro;
    
    uint256 public immutable valorCaucao;
    uint256 public immutable dataFim;
    uint256 public immutable prazoContestacao;

    Estado public estado;

    uint256 public saldoLocador;
    uint256 public saldoLocatario;

    string public cidLaudo;
    string public cidVeredito;

    uint256 public valorDanosLaudo;
    uint256 public laudoEmitidoEm;

    event ContratoCriado(address indexed locador, address indexed locatario, address agente, address arbitro, uint256 valorCaucao, uint256 dataFim, uint256 prazoContestacao);
    event CaucaoDepositada(address indexed locatario, uint256 valor);
    event LaudoSolicitado(address indexed por, Motivo motivo);
    event LaudoEnviado(string cidLaudo, uint256 valorDanos);
    event LaudoAceito(address indexed locatario);
    event LaudoAceitoPorDecurso();
    event LaudoContestado(address indexed locatario);
    event VereditoEmitido(string cidVeredito, uint256 valorLocador, uint256 valorLocatario);
    event Encerrado(uint256 valorLocador, uint256 valorLocatario);
    event Sacado(address indexed quem, uint256 valor);

    modifier inEstado(Estado _e) {
        if (estado != _e) revert EstadoInvalido();
        _;
    }

    modifier somente(address _conta) {
        if (msg.sender != _conta) revert NaoAutorizado();
        _;
    }

    constructor(
        IERC20 _token, address _locatario, address _agente, address _arbitro, uint256 _valorCaucao, uint256 _dataFim, uint256 _prazoContestacao
    ) {
        if (address(_token) == address(0) || _locatario == address(0) || _agente == address(0) || _arbitro == address(0)) revert EnderecoInvalido();
        if (_valorCaucao == 0 || _prazoContestacao == 0) revert ValorInvalido();
        if (_dataFim <= block.timestamp) revert ValorInvalido();
        
        locador = msg.sender;
        if (locador == _locatario || locador == _agente || locador == _arbitro ||
            _locatario == _agente || _locatario == _arbitro || _agente == _arbitro) revert EnderecoInvalido();

        token = _token;
        locatario = _locatario;
        agente = _agente;
        arbitro = _arbitro;
        valorCaucao = _valorCaucao;
        dataFim = _dataFim;
        prazoContestacao = _prazoContestacao;
        
        estado = Estado.CRIADO;

        emit ContratoCriado(locador, locatario, agente, arbitro, _valorCaucao, _dataFim, _prazoContestacao);
    }

    function _encerrar(uint256 _valorLocador) internal {
        if (_valorLocador > valorCaucao) revert ValorInvalido();
        saldoLocador = _valorLocador;
        saldoLocatario = valorCaucao - _valorLocador;
        estado = Estado.ENCERRADO;
        emit Encerrado(saldoLocador, saldoLocatario);
    }

    // 1-> Locatário deposita a caução inicial
    function depositarCaucao() external inEstado(Estado.CRIADO) nonReentrant somente(locatario) {
        token.safeTransferFrom(msg.sender, address(this), valorCaucao);
        estado = Estado.ATIVO;
        emit CaucaoDepositada(msg.sender, valorCaucao);
    }

    // Locador ou Locatário solicitam o laudo baseados em regras objetivas
    function solicitarLaudo(Motivo _motivo) external inEstado(Estado.ATIVO) {
        if (_motivo == Motivo.FIM_PRAZO) {
            if (msg.sender != locador) revert NaoAutorizado();
            if (block.timestamp < dataFim) revert PrazoNaoVencido();
        } else if (_motivo == Motivo.INADIMPLENCIA) {
            if (msg.sender != locador) revert NaoAutorizado();
        } else if (_motivo == Motivo.RESCISAO_ANTECIPADA) {
            if (msg.sender != locatario) revert NaoAutorizado();
        } else {
            revert ValorInvalido();
        }

        estado = Estado.AGUARDANDO_LAUDO;
        emit LaudoSolicitado(msg.sender, _motivo);
    }

    // 2-> Agente de Verificação (Oráculo) insere o laudo de saída
    function enviarLaudo(string calldata _cidLaudo, uint256 _valorDanos) external inEstado(Estado.AGUARDANDO_LAUDO) somente(agente) {
        if (_valorDanos > valorCaucao) revert ValorInvalido();
        
        cidLaudo = _cidLaudo;
        valorDanosLaudo = _valorDanos;
        emit LaudoEnviado(_cidLaudo, _valorDanos);

        if (_valorDanos == 0) {
            _encerrar(0);
        } else {
            laudoEmitidoEm = block.timestamp;
            estado = Estado.LAUDO_EMITIDO;
        }
    }

    // 3-> Locatário concorda com o laudo do Agente
    function aceitarLaudo() external inEstado(Estado.LAUDO_EMITIDO) somente(locatario) {
        emit LaudoAceito(msg.sender);
        _encerrar(valorDanosLaudo);
    }

    // Função para aceite automático por silêncio do locatário
    function aceitarPorDecurso() external inEstado(Estado.LAUDO_EMITIDO) {
        if (block.timestamp < laudoEmitidoEm + prazoContestacao) revert PrazoEmAberto();
        emit LaudoAceitoPorDecurso();
        _encerrar(valorDanosLaudo);
    }

    // 4-> Locatário discorda do laudo e aciona mutabilidade controlada
    function contestarLaudo() external inEstado(Estado.LAUDO_EMITIDO) somente(locatario) {
        estado = Estado.EM_DISPUTA;
        emit LaudoContestado(msg.sender);
    }

    // 5-> Árbitro (JaaS) emite veredito final. Válvula de escape acionável em caso de disputa ou omissão do Agente.
    function emitirVeredito(uint256 _valorLocador, string calldata _cidVeredito) external somente(arbitro) {
        if (estado != Estado.EM_DISPUTA && estado != Estado.AGUARDANDO_LAUDO) revert EstadoInvalido();
        if (_valorLocador > valorCaucao) revert ValorInvalido();

        cidVeredito = _cidVeredito;
        emit VereditoEmitido(_cidVeredito, _valorLocador, valorCaucao - _valorLocador);
        _encerrar(_valorLocador);
    }

    // 6-> Saque (Pull-Payment) para as partes resgatarem seus valores finais
    function sacar() external inEstado(Estado.ENCERRADO) nonReentrant {
        uint256 _valor = 0;
        if (msg.sender == locador) {
            _valor = saldoLocador; 
            saldoLocador = 0;
        } else if (msg.sender == locatario) {
            _valor = saldoLocatario; 
            saldoLocatario = 0;
        } else {
            revert NaoAutorizado();
        }

        if (_valor == 0) revert SemSaldo();
        token.safeTransfer(msg.sender, _valor);
        emit Sacado(msg.sender, _valor);
    }

    // --- Leitura Frontend ---
    struct Acoes {
        bool depositar; 
        bool solicitarFimPrazo; 
        bool solicitarInadimplencia; 
        bool solicitarRescisao; 
        bool enviarLaudo; 
        bool aceitarLaudo; 
        bool contestarLaudo; 
        bool aceitarPorDecurso;
        bool emitirVeredito; 
        bool sacar;
    }

    function acoesDisponiveis(address _conta) external view returns (Acoes memory acoes) {
        acoes.depositar = (estado == Estado.CRIADO && _conta == locatario);
        
        acoes.solicitarFimPrazo = (estado == Estado.ATIVO && _conta == locador && block.timestamp >= dataFim);
        acoes.solicitarInadimplencia = (estado == Estado.ATIVO && _conta == locador);
        acoes.solicitarRescisao = (estado == Estado.ATIVO && _conta == locatario);
        
        acoes.enviarLaudo = (estado == Estado.AGUARDANDO_LAUDO && _conta == agente);
        
        acoes.aceitarLaudo = (estado == Estado.LAUDO_EMITIDO && _conta == locatario);
        acoes.contestarLaudo = (estado == Estado.LAUDO_EMITIDO && _conta == locatario);
        acoes.aceitarPorDecurso = (estado == Estado.LAUDO_EMITIDO && block.timestamp >= laudoEmitidoEm + prazoContestacao);
        
        acoes.emitirVeredito = ((estado == Estado.EM_DISPUTA || estado == Estado.AGUARDANDO_LAUDO) && _conta == arbitro);
        
        acoes.sacar = (estado == Estado.ENCERRADO && 
            ((_conta == locador && saldoLocador > 0) || (_conta == locatario && saldoLocatario > 0)));
            
        return acoes;
    }
}