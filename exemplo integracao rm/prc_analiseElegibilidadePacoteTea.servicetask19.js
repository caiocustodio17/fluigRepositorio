function servicetask19(attempt, message) {
    log.info("--- INICIO servicetask19 ---");
    sendDataToRest();
    log.info("--- FIM servicetask19 ---");
}

/**
 * prepareRequestData()
 * @description Prepara o payload mesclando os dados originais com as alterações
 */
function prepareRequestData() {
    log.info("--- prepareRequestData ---");

    var respostaRM = getDataToRest();
    
    // Validação de segurança caso o retorno seja nulo
    if (!respostaRM) {
        throw "Erro: Não foi possível obter os dados originais do RM.";
    }

    var alteracoes = {
        "GRAUPARENTESCO": 3 
    };

    for (var chave in alteracoes) {
        if (alteracoes.hasOwnProperty(chave)) {
            respostaRM[chave] = alteracoes[chave];
        }
    }

    return respostaRM;
}

/**
 * getDataToRest()
 * @description Busca os dados atuais do dependente no RM (GET)
 */
function getDataToRest() {
    log.info("--- getDataToRest ---");

    var coligadaUsuario = hAPI.getCardValue("coligadaUsuario");
    var chapa = hAPI.getCardValue("codSelPerson");
    // var chapa = "01373"; // Utilizar apenas para testes
    var nroDependente = hAPI.getCardValue("nroDependente");
    
    var clientService = fluigAPI.getAuthorizeClientService();
    var serviceCode = "RestRM";
    var endpoint = "/rmsrestdataserver/rest/FopDependData/" + coligadaUsuario + "$_$" + chapa + "$_$" + nroDependente;

    var requestData = {
        companyId: String(getValue("WKCompany")),
        serviceCode: serviceCode,
        endpoint: endpoint,
        dataType: "json",
        method: "GET",
        timeoutService: "600",
        options: { encoding: "UTF-8" },
        headers: {
            "CODCOLIGADA": coligadaUsuario
        }
    };

    var response = clientService.invoke(JSONUtil.toJSON(requestData));
    var responseJSON = {};

    try {
        responseJSON = JSON.parse(response.getResult());
    } catch (e) {
        log.error("Erro Parse JSON GET: " + response.getResult());
        throw "Erro ao ler resposta do RM (GET).";
    }

    if (!response.result || response.httpStatusResult != 200) {
        throw "Erro no endpoint GET: " + endpoint + " | Status: " + response.httpStatusResult;
    }

    // Retorna o objeto completo
    return responseJSON;
}

/**
 * sendDataToRest()
 * @description Envia os dados atualizados para o RM (PUT)
 */
function sendDataToRest() {
    log.info("--- sendDataToRest ---");

    var coligadaUsuario = hAPI.getCardValue("coligadaUsuario");
    var chapa = hAPI.getCardValue("codSelPerson");
    // var chapa = "01373"; // Utilizar apenas para testes
    var nroDependente = hAPI.getCardValue("nroDependente");
    
    // Busca os dados já mesclados e prontos
    var data = prepareRequestData();
    
    var clientService = fluigAPI.getAuthorizeClientService();
    var serviceCode = "RestRM";
    var endpoint = "/rmsrestdataserver/rest/FopDependData/" + coligadaUsuario + "$_$" + chapa + "$_$" + nroDependente;

    var requestData = {
        companyId: String(getValue("WKCompany")),
        serviceCode: serviceCode,
        endpoint: endpoint,
        dataType: "json",
        method: "PUT",
        timeoutService: "600",
        options: { encoding: "UTF-8" },
        headers: {
            "CODCOLIGADA": coligadaUsuario,
            "Content-Type": "application/json;charset=UTF-8" 
        },
        params: data
    };

    log.info("--- Payload Enviado ---");
    log.dir(requestData);

    var response = clientService.invoke(JSONUtil.toJSON(requestData));
    var responseJSON = {};

    try {
        responseJSON = JSON.parse(response.getResult());
    } catch (e) {
        log.error("Erro Parse JSON PUT: " + response.getResult());
        throw "Erro ao ler resposta do RM (PUT).";
    }

    log.info("--- Resposta do RM (PUT) ---");
    log.dir(responseJSON);

    if (!response.result || response.httpStatusResult != 200) {
        throw "Erro no endpoint PUT: " + endpoint + " | Status: " + response.httpStatusResult + " | Msg: " + JSON.stringify(responseJSON);
    }
}