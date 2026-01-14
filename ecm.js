async function salvarDocumentosECM() {
    var nomeCliente = $("#nomeFornecedor").val();
    var numeroNF = $("#numeroNF").val();
    var description = nomeCliente + " - NF: " + numeroNF;
    var result = await criarPasta(48, description);
    var pastaPai = result.content.id;

    $("#idecm").val(pastaPai);

    var idsGerados = await uploadDocument(pastaPai);
    console.log("IDs dos arquivos gerados: ", idsGerados);
    
    var idsGeradosOutros = await uploadOtherDocuments(pastaPai)
    console.log("IDs dos arquivos gerados OTHER: ", idsGeradosOutros);
    
}

function criarPasta(parentId, description) {
    var request_data = {
        url: WCMAPI.serverURL + '/api/public/ecm/document/createFolder',
        method: 'POST'
    };

    var data = {
        "description": description,
        "parentId": parentId
    }

    return $.ajax({
        url: request_data.url,
        contentType: 'application/json',
        crossDomain: true,
        type: request_data.method,
        data: JSON.stringify(data),
        headers: oauth.toHeader(oauth.authorize(request_data, token))
    });
}

async function uploadDocument(pastaPai) {
    const listaAnexos = [
        { id: "urlBase64CabecalhoNF",   nome: "Cabecalho_NF" },
        { id: "urlBase64PedidoCompra",  nome: "Pedido_Compra" },
        { id: "urlBase64Inspecao",      nome: "Inspecao_Visual" },
        { id: "urlBase64ItensNF",       nome: "Itens_NF" },
        { id: "urlBase64Documentos",    nome: "Documentos_Diversos" }
    ];

    var listaIds = []; 

    for (const anexo of listaAnexos) {
        let base64Full = $("#" + anexo.id).val();

        if (!base64Full || base64Full === "") {
            continue;
        }

        try {
            let contentBase64 = base64Full.split(',')[1]; 
            let extensao = "jpg";
            let nomeArquivo = anexo.nome + "_" + new Date().getTime() + "." + extensao;
            var idRetornado = await enviarParaDataset(contentBase64, nomeArquivo, pastaPai, extensao);
            
            listaIds.push(idRetornado);
        } catch (err) {
            console.error(err);
            throw new Error("Falha ao enviar o anexo: " + anexo.nome);
        }
    }

    return listaIds;
}

async function uploadOtherDocuments(pastaPai){
    var listaIds = []; 

    try {
        var base64 = $('#urlBase64Outros').val()
        let contentBase64 = base64.split(',')[1]; 
        var nomeCompleto = $('#doc_anexo_outros').val()
        var apenasNome = nomeCompleto.substring(0, nomeCompleto.lastIndexOf('.'));
        var extensao = nomeCompleto.split('.').pop().toLowerCase();

        var idRetornado = await enviarParaDataset(contentBase64, nomeCompleto, pastaPai, extensao);

        listaIds.push(idRetornado)
    }
    catch(err){
        console.log("ERRO NO CATH DO OTHER: " + listaIds)
    }
    return listaIds;
}

function enviarParaDataset(contentBase64, nomeArquivo, parentId, extensao) {
    return new Promise((resolve, reject) => {
        var Empresa = 1;
        var filtro = [
            { _field: "companyId", _initialValue: Empresa, _finalValue: Empresa, _type: 1, _likeSearch: false },
            { _field: "extensao", _initialValue: extensao, _finalValue: extensao, _type: 1, _likeSearch: false },
            { _field: "nomeArquivo", _initialValue: nomeArquivo, _finalValue: nomeArquivo, _type: 1, _likeSearch: false },
            { _field: "parentId", _initialValue: parentId, _finalValue: parentId, _type: 1, _likeSearch: false },
            { _field: "content", _initialValue: contentBase64, _finalValue: contentBase64, _type: 1, _likeSearch: false },
            { _field: "permissaoIndividual", _initialValue: 'NAO', _finalValue: 'NAO', _type: 1, _likeSearch: false }
        ];

        getDatasetExterno("dsPortal_CreateDocument", filtro)
            .done(function (ds) {
                if (!ds || !ds.content || !ds.content.values || ds.content.values.length <= 0) {
                    reject(new Error('Dataset retornou vazio para ' + nomeArquivo));
                } else {
                    var retorno = ds.content.values[0];

                    if(retorno[0] && retorno[0].indexOf("Erro") > -1) {
                         reject(new Error(retorno[0]));
                    } else {
                         resolve(retorno);
                    }
                }
            })
            .fail(function (err) {
                reject(new Error('Falha de conexão AJAX ao enviar ' + nomeArquivo));
            });
    });
}

function getDatasetExterno(dataset, filtros) {
    var request_data = {
        url: WCMAPI.serverURL + '/api/public/ecm/dataset/datasets',
        method: 'POST'
    };

    var data = {
        "name": dataset,
        "fields": [],
        "constraints": filtros,
        "order": []
    }

    return $.ajax({
        url: request_data.url,
        contentType: 'application/json',
        crossDomain: true,
        type: request_data.method,
        data: JSON.stringify(data),
        headers: oauth.toHeader(oauth.authorize(request_data, token))
    });
};