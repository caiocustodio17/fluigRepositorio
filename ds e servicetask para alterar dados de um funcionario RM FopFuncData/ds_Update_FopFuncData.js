/*
 * Fonte: ds_Update_FopFuncData
 * Autor: Caio Custodio
 * Descrição: Dataset para alterar dados cadastrais de um funcionário no RM via PATCH
 */
function createDataset(fields, constraints, sortFields) {
    // Registra o início da execução.
    log.info("Executando dataset ds_Update_FopFuncData para atualização cadastral.");

    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("status");

    // Prepara as variáveis que vão receber os dados de filtro/atualização
    var codColigada = "";
    var chapa = "";
    var contaPagamento = "";
    var codAgenciaPagto = "";

    // Pega os valores essenciais que vieram nas constraints
    if (constraints) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == "codColigada") {
                codColigada = constraints[i].initialValue;
            }
            if (constraints[i].fieldName == "chapa") {
                chapa = constraints[i].initialValue;
            }
            if (constraints[i].fieldName == "contaPagamento") {
                contaPagamento = constraints[i].initialValue;
            }
            if (constraints[i].fieldName == "codAgenciaPagto") {
                codAgenciaPagto = constraints[i].initialValue;
            }
        }
    }

    // Exibe os dados recebidos para conferência no log
    log.info("--- DADOS RECEBIDOS PARA ATUALIZAÇÃO ---");
    log.info("COLIGADA: " + codColigada);
    log.info("CHAPA: " + chapa);
    log.info("NOVA CONTA: " + contaPagamento);
    log.info("NOVA AGENCIA: " + codAgenciaPagto);

    // Verifica se falta alguma constraint
    if (!codColigada || !chapa || !contaPagamento || !codAgenciaPagto) {
        var msgErro = "Faltando dados essenciais para a atualização (Coligada, Chapa, Conta ou Agência).";
        log.error(msgErro);
        return datasetError(msgErro);
    }

    try {
        // Pega autorização
        var clientService = fluigAPI.getAuthorizeClientService();

        // Montamos o objeto de configuração para a chamada REST (PATCH)
        var requestData = {
            companyId: String(getValue("WKCompany")),
            serviceCode: "RestRM", 
            endpoint: "/rmsrestdataserver/rest/FopFuncData/" + codColigada + "$_$" + chapa, // Endpoint para o funcionário específico.
            method: "patch",
            timeoutService: "600", 
            
            // Os dados que queremos alterar no RM.
            params: {
                "CONTAPAGAMENTO": contaPagamento,
                "CODAGENCIAPAGTO": codAgenciaPagto
            },
            // Informação da coligada no Header
            headers:{"CODCOLIGADA": codColigada},
            
            options: {
                encoding: "UTF-8",
                mediaType: "application/json", 
                useSSL: true 
            }
        };

        log.info("(ds_Update_FopFuncData) Chamando REST (PATCH) com o objeto:");
        log.dir(requestData);

        // Executa a chamada REST
        var restCall = clientService.invoke(JSONUtil.toJSON(requestData));

        // Pega o resultado da chamada.
        var resultString = restCall.getResult();

        log.info("(ds_Update_FopFuncData) REST retornou (string): " + resultString);

        // Analisa o retorno da chamada para verificar se deu tudo certo.
        if (resultString == null || resultString.isEmpty()) {
            if (restCall.httpStatusResult == 200 || restCall.httpStatusResult == 204) {
                // Sucesso sem corpo de resposta
                log.info("Atualização realizada com sucesso (HTTP " + restCall.httpStatusResult + ").");
                dataset.addRow(["SUCESSO"]);
            } else {
                // Erro sem corpo de resposta.
                var msgErroHttp = "Erro na chamada REST: HTTP " + restCall.httpStatusResult;
                log.error(msgErroHttp);
                return datasetError(msgErroHttp);
            }
        } else {
            // Se houver algum retorno
            log.info("Resultado parseado:");
            
            try {
                log.dir(JSON.parse(resultString));
            } catch (e) {
                log.info("O retorno não é um JSON válido. Exibindo como texto puro.");
            }

            if (restCall.httpStatusResult == 200 || restCall.httpStatusResult == 204) {
                log.info("Atualização realizada com sucesso!");
                dataset.addRow(["SUCESSO"]);
            } else {
                // Erro com algum conteúdo no retorno
                log.error("Erro no PATCH (com retorno): " + resultString);
                return datasetError(resultString);
            }
        }

        log.info("Finalizando e retornando o dataset.");
        log.dir(dataset);
        return dataset;

    } catch (e) {
        // Se algo quebrar no meio do caminho, pegamos aqui.
        log.error("Ops! Deu um erro inesperado no try/catch do dataset: " + e);
        return datasetError(e.message ? e.message : e);
    }
}

// Função auxiliar para padronizar o retorno de erro do dataset.
function datasetError(msg) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("ERROR");
    dataset.addColumn("MSG");
    dataset.addRow([true, String(msg)]);
    log.error("Retornando ERRO: " + String(msg));
    return dataset;
}