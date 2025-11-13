function servicetask24(attempt, message) {
    log.info("--- INICIANDO servicetask24 ---")

    // Busca os dados do formulário para enviar ao RM
    var codColigada = hAPI.getCardValue("CODCOLIGADA");
    var chapa = hAPI.getCardValue("CHAPA");
    var contaPagamento = hAPI.getCardValue("CodConta")
    var codAgenciaPagto = hAPI.getCardValue("numAgencia");

    // Chama a função de integração
    integrarRM(codColigada, chapa, contaPagamento, codAgenciaPagto)
}

function integrarRM(codColigada, chapa, contaPagamento, codAgenciaPagto) {
    // Monta as constraints para o dataset
    var constraints = new Array()
    var c1 = DatasetFactory.createConstraint("codColigada", codColigada, codColigada, ConstraintType.MUST);
    var c2 = DatasetFactory.createConstraint("chapa", chapa, chapa, ConstraintType.MUST);
    var c3 = DatasetFactory.createConstraint("contaPagamento", contaPagamento, contaPagamento, ConstraintType.MUST);
    var c4 = DatasetFactory.createConstraint("codAgenciaPagto", codAgenciaPagto, codAgenciaPagto, ConstraintType.MUST);

    constraints.push(c1, c2, c3, c4)

    // Executa o dataset que atualiza os dados no RM
    var dataset = DatasetFactory.getDataset("ds_Update_FopFuncData", null, constraints, null);

    // Valida o que aconteceu lá no RM
    verificaResultadoIntegracao(dataset, "ds_Update_FopFuncData")

    return dataset
}

function verificaResultadoIntegracao(dataset, nomeDataset) {
    var mensagemRetorno = ""
    var result = dataset.getValue(0, "status");

    // Se não deu "SUCESSO", trata o erro e para o processo
    if (result != "SUCESSO") {
        var erroMsg = dataset.getValue(0, "MSG");
        mensagemRetorno = "ERRO na atualização do RM: " + erroMsg;

        log.error(mensagemRetorno);
        throw mensagemRetorno; // Isso vai parar a execução da tarefa
    }

    // Deu tudo certo
    if (result == "SUCESSO") {
        log.info("Alteração de conta do funcionário realizada com SUCESSO!");
        return true;
    }

    // Se chegou aqui, é um cenário inesperado (nem SUCESSO, nem ERRO)
    mensagemRetorno = "O Dataset " + nomeDataset + " retornou um formato inesperado. Não é erro, nem sucesso padrão"
    log.warn(mensagemRetorno);

    throw mensagemRetorno
}