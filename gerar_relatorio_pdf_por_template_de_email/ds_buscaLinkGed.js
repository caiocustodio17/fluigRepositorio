function createDataset(fields, constraints, sortFields) { // transferencia
    
    var dataset = DatasetBuilder.newDataset();
    var documentid = '120'
   
    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {

            if (constraints[i].fieldName == 'documentid') {
                documentid = constraints[i].initialValue;
            }
        }
    }
    
    try {
        
        var clientService = fluigAPI.getAuthorizeClientService();
        
        var data = {
            companyId: getValue('WKCompany') + '',
            serviceCode: 'FluigREST',
            endpoint: '/api/public/2.0/documents/getDownloadURL/'+documentid,
            method: 'GET',
            timeoutService: '120', // segundos
            options: {
                encoding: 'UTF-8',
                mediaType: 'application/json',
                useSSL : true
            },
        }

        var vo = clientService.invoke(JSONUtil.toJSON(data));
        var status = String(vo.getHttpStatusResult());
        var ret = JSON.parse(vo.getResult());

        if (status == 200 || status == 201 ) {

            log.info("Teste log - ret");
            log.dir(ret);

            if (ret.content) {

                dataset.addColumn("status");
                dataset.addColumn("url");
                dataset.addColumn("message");

               dataset.addRow([
                    status,
                    ret.content, // A URL que você buscou
                    ret.message.message // A mensagem "OK"
                ]);
            }else {
                // Isso não deve acontecer se o status for 200, mas é uma boa prática
                log.warn("Status 200, mas 'ret.content' está vazio.");
                dataset.addColumn("status");
                dataset.addColumn("erro");
                dataset.addRow([status, "Resposta OK, mas URL não encontrada no 'content'."]);
            }

        } else {

            log.error('Erro ao buscar a URL');
            log.error(JSON.stringify(ret));

            dataset.addColumn("status");
            dataset.addColumn("erro");

            dataset.addRow([
                status,
                ret.Message
            ]);
        }
        
        return dataset;
        
        
    } catch (e) {
        
        log.error("Erro ao buscar a URL: " + e)
        
        dataset.addColumn("status");
        dataset.addColumn("erro");
        dataset.addRow(['error', e]);

        return dataset;
        
    }
}
