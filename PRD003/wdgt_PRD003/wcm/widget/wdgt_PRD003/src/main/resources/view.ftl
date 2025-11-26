<div id="MyWidget_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide"
    data-params="MyWidget.instance()">

    <div id="loading-overlay" class="loading-hidden">
        <div class="spinner-container">
            <div class="spinner"></div>
            <p>A processar... Por favor, aguarde.</p>
        </div>
    </div>

    <div id="success-modal" class="modal-hidden">
        <div class="modal-content">
            <div class="success-checkmark">
                <div class="check-icon">
                    <span class="icon-line line-tip"></span>
                    <span class="icon-line line-long"></span>
                    <div class="icon-circle"></div>
                    <div class="icon-fix"></div>
                </div>
            </div>
            <h3>Integrado com Sucesso!</h3> 
            <p>O registo foi concluído.</p>
            <button id="success-modal-close" class="btn btn-info">Fechar</button>
        </div>
    </div>

    <div id="error-modal" class="modal-hidden">
        <div class="modal-content">
            <div class="error-icon-container">
                <div class="error-icon">
                    <span class="icon-line line-left"></span>
                    <span class="icon-line line-right"></span>
                </div>
            </div>

            <h3>Ocorreu um Erro!</h3>
            <p>Não foi possível completar a solicitação.</p> 
            <button id="error-modal-close" class="btn btn-danger-custom">Fechar</button>
        </div>
    </div>

    <div class="main-container-new">
        <div class="system-card">
            
            <div class="card-header-custom">
                <h1>PRD003</h1>
                <span class="subtitle">Apontamento de producao corte e costura</span>
            </div>

            <form id="form" class="card-body-custom">
                <div class="row">
                    <div class="form-group col-md-12">
                        <label>Nome do funcionário:</label>
                        <select class="form-control modern-input" name="nomeFuncionario" id="nomeFuncionario"></select>
                    </div>

                    <div class="form-group col-md-12">
                        <label>Operação:</label>
                        <select class="form-control modern-input" name="operacao" id="operacao"></select>
                    </div>

                    <div class="form-group col-md-12">
                        <label>Produção</label>
                        <input type="text" class="form-control modern-input" id="producao" name="producao">
                    </div>

                    <div class="form-group col-md-12">
                        <label>Dia da Produção</label>
                        <input type="date" class="form-control modern-input" id="diaProducao" name="diaProducao">
                    </div>

                    <div class="form-group col-md-12">
                        <label>Observação</label>
                        <input type="text" class="form-control modern-input" id="observacao" name="observacao">
                    </div>
                </div>

                <div class="row action-row">
                     <div class="form-group col-md-12">
                        <button type="button" class="btn btn-finish-modern btn-block" data-enviar>Finalizar</button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<script type="text/javascript" src="/webdesk/vcXMLRPC.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/hmac-sha1.min.js"></script>
<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/enc-base64.min.js"></script>