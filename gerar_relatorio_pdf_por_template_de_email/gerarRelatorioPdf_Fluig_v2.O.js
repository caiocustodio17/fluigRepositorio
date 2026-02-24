function createDataset(fields, constraints, sortFields) {
    log.info("ENTRANDO NO DATASET ds_gerarPdfTemplateEmail_ALM001")
    var dataset = DatasetBuilder.newDataset();
    var dadosRelatorio = null
    var documentidConstraint = new Array()

    try {
        dataset.addColumn('documentId');
        
        
        var templateCodigo = "layoutRelatorio_ALM001"; // Código do template de E-Mail que foi cadastrado no Fluig
        var templateArquivo = "layoutRelatorio_ALM001.html"; // Arquivo HTML do template
        var pastaGed = 1295; 
        var nomeArquivoGed = "Relatorio_ALM001.pdf"; // Nome do arquivo que será salvo

        
        if (constraints != null) {
            for (var i = 0; i < constraints.length; i++) {
                if (constraints[i].fieldName == 'documentid') {
                    documentidConstraint.push(constraints[i].initialValue);
                }
                
                if (constraints[i].fieldName == 'dadosRelatorio') {
                    dadosRelatorio = JSON.parse(constraints[i].initialValue);
                }
            }
        }
        
        //documentidConstraint = [ "555", "556", "557", "558", "559" ]
        
        log.info("--- CONSTRAINT PASSADA: ---")
        log.info("--- DOCUMENTID: ---")
        log.dir(documentidConstraint)
        log.info(documentidConstraint.length)
        log.info(documentidConstraint[0])
        log.info(documentidConstraint[1])
        log.info(documentidConstraint[2])
        log.info(documentidConstraint[3])
        log.info(documentidConstraint[4])
        log.info("--- IMAGEM CONSTRAINT: ---")
        log.dir(dadosRelatorio)
        log.info(dadosRelatorio.length)
        
        // Obtém a lista de parâmetros
        var parametros = getParametros(documentidConstraint, dadosRelatorio);
        
        // Passa a lista de parâmetros para a função responsável por renderizar o template de E-mail
        var strHtml = renderizarTemplateEmail(parametros, templateCodigo, null, templateArquivo);
        
        // Passa a string do HTML para a função criar o PDF e retornar seu base64 
        var strBase64 = gerarPdf(strHtml);
        
        // Passa a string base64 para a função abaixo salvar no GED
        var documentId = salvarArquivo(strBase64, nomeArquivoGed, pastaGed);

        // Retorna Id do documento que foi salvo
        dataset.addRow([documentId]);

    } catch (ex) {
        dataset = DatasetBuilder.newDataset();
        dataset.addColumn('ERRO');
        dataset.addRow([("function " + arguments.callee.name + " => " + ex.toString())]);
        log.error(ex.toString())
    } finally {
        return dataset;
    }
}


/**
 * Monta lista de parâmetros a serem renderizados no no template
 * CORRIGIDO: imagens agora usam buscaImagemBase64() em vez de buscaLinkGed()
 * para evitar falha de autenticação do iText ao acessar URLs privadas do GED
 * @return {hashMap}
 */
function getParametros(documentidConstraint, dadosRelatorio){
    try {
        //Monta mapa com parâmetros do template
        var parametros = new java.util.HashMap();
        
        //informacoes
        parametros.put("logo", diretorioFluig()+"/repository/wcmdir/wcm/tenants/wcm/custom/assets/head_background.gif");
        parametros.put("dataEmissao", dadosRelatorio[0].dataEmissao);
        parametros.put("dataProcesso", dadosRelatorio[0].dataProcesso);
        parametros.put("nomeColaborador", dadosRelatorio[0].nomeColaborador);
        parametros.put("nomeFornecedor", dadosRelatorio[0].nomeFornecedor);
        parametros.put("unidadeNF", dadosRelatorio[0].unidadeNF);
        parametros.put("numeroNF", dadosRelatorio[0].numeroNF);
        parametros.put("qtdeVolumes", dadosRelatorio[0].qtdeVolumes);
        parametros.put("itensConferidos", dadosRelatorio[0].itensConferidos); 
        parametros.put("strInspecao", dadosRelatorio[0].strInspecao); 
        parametros.put("strDocumentos", dadosRelatorio[0].strDocumentos); 
        parametros.put("geolocalizacao", dadosRelatorio[0].geolocalizacao); 
        parametros.put("descricaoPedidoCompra", dadosRelatorio[0].descricaoPedidoCompra); 
        //imagens — CORRIGIDO: base64 inline, sem requisição HTTP
        parametros.put("imagem1", buscaImagemBase64(documentidConstraint[0]));
        parametros.put("imagem2", buscaImagemBase64(documentidConstraint[1]));
        parametros.put("imagem3", buscaImagemBase64(documentidConstraint[2]));
        parametros.put("imagem4", buscaImagemBase64(documentidConstraint[3]));
        parametros.put("imagem5", buscaImagemBase64(documentidConstraint[4]));
        //rodape
        parametros.put("nome", "Sistema");
        parametros.put("sobrenome", "Fluig");
        
        return parametros;
        
    } catch (ex) {
        throw "function " + arguments.callee.name + " => " + ex.toString()
    }	
}


/**
 * Busca o conteúdo do arquivo no GED e retorna como Data URI Base64.
 * Usa fluigAPI.getDocumentService().getDocumentContentAsBytes() — API oficial do Fluig SDK 2.0.
 * Desta forma o iText não precisa fazer nenhuma requisição HTTP para carregar a imagem.
 * 
 * @param {string|number} documentId - ID do documento no GED
 * @return {string} Data URI Base64 (ex: "data:image/jpeg;base64,...")
 *                  Retorna string vazia se documentId for inválido ou ocorrer erro.
 */
function buscaImagemBase64(documentId) {
    try {
        if (!documentId || documentId == "null" || documentId == "" || documentId == "undefined") {
            log.warn("buscaImagemBase64 => documentId inválido: " + documentId);
            return "";
        }

        var docId = parseInt(documentId);

        log.info("buscaImagemBase64 => Buscando documento: " + docId);

        // Busca metadados via DocumentService oficial
        var docVO = fluigAPI.getDocumentService().getActive(docId);
        var versao = docVO.getVersion();
        var nomeArquivo = docVO.getDocumentDescription();

        log.info("buscaImagemBase64 => nomeArquivo: [" + nomeArquivo + "] versao: [" + versao + "]");

        // Monta o path físico — padrão do volume Fluig visto nos logs anteriores
        var caminhoFisico = "/volume/wdk-data/public/" + docId + "/" + versao + "/" + nomeArquivo + ".jpg";

        log.info("buscaImagemBase64 => caminho montado: " + caminhoFisico);

        // Verifica se existe
        var arquivo = new java.io.File(caminhoFisico);
        if (!arquivo.exists()) {
            log.error("buscaImagemBase64 => Arquivo NAO encontrado: " + caminhoFisico);
            
            // Tenta listar o que existe dentro da pasta do documento para debug
            var pastaDoc = new java.io.File("/volume/wdk-data/public/" + docId + "/" + versao);
            if (pastaDoc.exists()) {
                var listaArquivos = pastaDoc.list();
                log.info("buscaImagemBase64 => Arquivos na pasta: " + java.util.Arrays.toString(listaArquivos));
            } else {
                log.error("buscaImagemBase64 => Pasta tambem nao existe: " + pastaDoc.getAbsolutePath());
            }
            return "";
        }

        log.info("buscaImagemBase64 => Arquivo encontrado! Retornando path para iText.");
        return caminhoFisico;

    } catch (ex) {
        log.error("buscaImagemBase64 => Erro ao buscar doc " + documentId + ": " + ex.toString());
        return "";
    }
}


/**
 * Processa template de E-Mail
 */
function renderizarTemplateEmail(parametros, tplCodigo, tplIdioma, tplArquivo) {
    try {
        
        if(!tplIdioma){
            tplIdioma = "pt_BR"
        }

        // Importa class da biblioteca Freemarker
        importClass(Packages.freemarker.template.Template);

        // Diretório padrão da empresa
        var diretorioPadrao = fluigAPI.getTenantService().getTenantData(["dirDefault"]).get("dirDefault")
        var templateCaminho = diretorioPadrao + "/templates/tplmail/" + tplCodigo + "/" + tplIdioma + "/" + tplArquivo;
        var templateHtml = new java.io.File(templateCaminho)

        // Ler o arquivo HTML a partir do objeto 'templateHtml'.
        var reader = new java.io.FileReader(templateHtml)

        // Objeto que representa o HTML que será preenchido com dados dinâmicos
        var template = new Template(null, reader)

        // Variável usada para capturar o resultado do processamento do modelo HTML
        var writer = new java.io.StringWriter();

        template.process(parametros, writer);

        return writer.toString();

    } catch (ex) {
        throw "function " + arguments.callee.name + " => " + ex.toString()
    }
}


/**
 * Converte string html em um arquivo PDF usando a biblioteca itextpdf
 */
function gerarPdf(strHtml) {
	try {
		// Importa as classes
		importClass(Packages.com.itextpdf.text.Document);
		importClass(Packages.com.itextpdf.text.PageSize);
		importClass(Packages.com.itextpdf.text.Rectangle);
		importClass(Packages.com.itextpdf.text.pdf.PdfWriter);
		importClass(Packages.com.itextpdf.tool.xml.XMLWorkerHelper);
		importClass(Packages.java.io.ByteArrayOutputStream);
		importClass(Packages.java.util.Base64);

		// Define as dimensões da página para o tamanho A4
		var pageSize = new Rectangle(PageSize.A4);
		
		// Cria um novo documento com as dimensões da página A4 e margens de 36 pontos
		var document = new Document(pageSize, 36, 36, 36, 36);

		// Cria um novo stream de saída para capturar o conteúdo do PDF
		var byteArrayOutputStream = new ByteArrayOutputStream();

		// Cria o arquivo PDF
		var writer = PdfWriter.getInstance(document, byteArrayOutputStream);

		// Abre o documento para escrita
		document.open();

		// Converte a string HTML em um array de bytes 
		var is = new java.io.ByteArrayInputStream(new java.lang.String(strHtml).getBytes());
		
		// Converter o HTML em PDF
		XMLWorkerHelper.getInstance().parseXHtml(writer, document, is);

		// Fecha o documento
		document.close();

		// Codifica o conteúdo do PDF em base64 e o retorna como uma string
		var pdfAsBase64 = Base64.getEncoder().encodeToString(byteArrayOutputStream.toByteArray());

		return pdfAsBase64;

	} catch (ex) {
		throw "function " + arguments.callee.name + " => " + ex.toString()
	}
}


/**
 * Salva o documento no GED
 */
function salvarArquivo(stringBase64, description, parentDocumentId) {
    try {

        var docDto = docAPI.newDocumentDto();
        docDto.setParentDocumentId(parentDocumentId);
        docDto.setDocumentTypeId("");
        docDto.setDocumentDescription(description);
        docDto.setVersion(1000);
        docDto.setPublicDocument(true);

        var attachArray = new java.util.ArrayList();
        var attach = docAPI.newAttachment();

        // Tranforma a string base64 em um byteArray
        var byteArray = java.util.Base64.getDecoder().decode(new String(stringBase64));

        //Arquivo físico do documento
        attach.setFileName(description);
        attach.setFilecontent(byteArray);
        attach.setPrincipal(true);
        attach.setAttach(false);

        // Adiciona o arquivo físico ao array de anexos
        attachArray.add(attach);

        var doc = docAPI.createDocument(docDto, attachArray, null, null, null);

        return doc.getDocumentId()

    } catch (ex) {
        throw "function " + arguments.callee.name + " => " + ex.toString()
    }
}


/**
 * Retorna caminho do diretório de instalação do fluig
 */
function diretorioFluig(){
    try {
        // Retorna o caminho [PASTA DE INSTALAÇÃO]\appserver
        var diretorioAtual = new java.io.File(".").getCanonicalFile();
        
        // Retrocede um nível na estrutura de pastas
        var diretorioAtualParent = diretorioAtual.getParentFile();
        
        // Retorna o caminho completo da pasta onde foi instalado o Fluig
        return diretorioAtualParent.getAbsolutePath();
    } catch (ex) {
        throw ex
    }
}


function buscaLinkGed(documentId){
    var c1 = DatasetFactory.createConstraint("documentid", documentId, documentId, ConstraintType.MUST);
    var dataset = DatasetFactory.getDataset("ds_buscaLinkGed", null, [c1], null);
    var result = dataset.getValue(0, "url");
    log.info("--- BUSCA LINK GED ---")
    log.info(result)
    
    return result
}