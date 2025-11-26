var oauth = '';

var token = {
    key: '75106a29-031b-4874-abc0-8d8e22b52c4e',
    secret: 'f9dad779-15df-4ebc-b48e-ba3cc4ed47f92ba4d4a6-599f-4116-9116-4ef1b0ce30cc',
}

var loadingOverlay;
var successModal;
var errorModal;

var MyWidget = SuperWidget.extend({
    variavelNumerica: null,
    variavelCaracter: null,

    init: function () {
        loadingOverlay = $('#loading-overlay');
        successModal = $('#success-modal');
        errorModal = $('#error-modal');

        oauth = OAuth({
            consumer: {
                'key': 'PortalFluig',
                'secret': 'PortalFluig'
            },
            signature_method: 'HMAC-SHA1',
            hash_function(base_string, key) {
                return CryptoJS.HmacSHA1(base_string, key).toString(CryptoJS.enc.Base64)
            }
        });

        this.pupularSelects();

        $('#success-modal-close').on('click', function () {
            esconderSucesso();
        });

        $('#error-modal-close').on('click', function () {
            esconderErro();
        });
    },



    bindings: {
        local: {
            'enviar': ['click_enviarSolicitscao']
        },
        global: {}
    },


    
    pupularSelects: function () {
        // 1. Definição do Array (Idêntico ao original)
        var tipos = [
            { tipo: 'funcionario', campo: 'nomeFuncionario' },
            { tipo: 'operacao', campo: 'operacao' }
        ];


        for (var j = 0; j < tipos.length; j++) {
            
            var c1 = { 
                _field: "Tipo",             // Nome do campo
                _initialValue: tipos[j].tipo,   // Valor inicial
                _finalValue: tipos[j].tipo,     // Valor final
                _type: 1,                   // 1 = ConstraintType.MUST
                _likeSearch: false          // false = Comparação exata
            };


            getDatasetExterno("ds_consultar_table_PRD003", [c1])
            .then(function(dataset) {
                if (dataset && dataset.content && dataset.content.values) {
                    var registros = dataset.content.values;

                    for (var i = 0; i < registros.length; i++) {
                        if(registros[i].Tipo == "funcionario"){
                            $('#nomeFuncionario').append(new Option(registros[i].Texto));
                        }
                        if(registros[i].Tipo == "operacao"){
                            $('#operacao').append(new Option(registros[i].Texto));
                        }
                        
                    }
                }
            })
            .catch(function(erro) {
                console.error("Erro ao carregar " + item.tipo, erro);
            });
        }
    },



    enviarSolicitscao: async function (htmlElement, event) {

        // Validações
        if ($("#nomeFuncionario").val() == "") {
            alertError("Funcionário");
            return false;
        }

        if ($("#operacao").val() == "") {
            alertError("Operação");
            return false;
        }

        if ($("#producao").val() == "") {
            alertError("Produção");
            return false;
        }

        if ($("#diaProducao").val() == "") {
            alertError("Dia de Produção");
            return false;
        }

        if ($("#funcionario").val() == "") {
            alertError("Funcionario");
            return false;
        }

        mostrarLoading();

        try {
            var data = await startProcesAsync();
            var numProtocolo = data.processInstanceId;

            esconderLoading();

            $('#success-modal h3').text('Integrado com Sucesso!');
            $('#success-modal p').html('O registo foi concluído.<br>Protocolo: <strong>' + numProtocolo + '</strong>');
            mostrarSucesso();

            $("#form")[0].reset();

        } catch (error) {
            console.error("Erro no processo de envio:", error);
            esconderLoading();

            var msgErro = error.message || "Não foi possível completar a solicitação.";
            
            if(error.responseJSON && error.responseJSON.message) {
                msgErro = error.responseJSON.message;
            }

            $('#error-modal p').text(msgErro);
            mostrarErro();
        }
    } 
}); 

function alertError(campo) {
    FLUIGC.toast({
        title: 'Atenção: ',
        message: 'O campo ' + campo + ' é obrigatório',
        type: 'danger'
    });
}

function startProcesAsync() {
    var obj = {};
    var request_data = {
        url: parent.WCMAPI.serverURL + `/process-management/api/v2/processes/prc_PRD003/start`,
        method: 'POST'
    }
    
    var data = {
        "targetState": 0,
        "targetAssignee": "",
        "subProcessTargetState": 0,
        "comment": "Processo iniciado por página pública",
        "formFields": {}
    }

    $("#form").serializeArray().forEach(field => {
        obj[field.name] = field.value
    })
    data.formFields = obj;

    return $.ajax({
        url: request_data.url,
        type: request_data.method,
        data: JSON.stringify(data),
        contentType: "application/json; charset=UTF-8",
        headers: oauth.toHeader(oauth.authorize(request_data, token))
    });
}

function mostrarLoading() {
    if (loadingOverlay) loadingOverlay.removeClass('loading-hidden');
}

function esconderLoading() {
    if (loadingOverlay) loadingOverlay.addClass('loading-hidden');
}

function mostrarSucesso() {
    if (successModal) successModal.removeClass('modal-hidden');
}

function mostrarErro() {
    if (errorModal) errorModal.removeClass('modal-hidden');
}

function esconderSucesso() {
    if (successModal) successModal.addClass('modal-hidden');
}

function esconderErro() {
    if (errorModal) errorModal.addClass('modal-hidden');
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