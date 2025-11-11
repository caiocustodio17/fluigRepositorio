var imagem1 = ""

function createDataset(fields, constraints, sortFields) {

    var dataset = DatasetBuilder.newDataset();

    try {
        dataset.addColumn('documentId');
        
        
        var templateCodigo = "codigoLayout"; // Código do template de E-Mail que foi cadastrado no Fluig
        var templateArquivo = "nomeArquivoLayoutHTML"; // Arquivo HTML do template
        var pastaGed = 125; //Onde vai salvar o arquivo
        var nomeArquivoGed = "resultadoRelatorio"; // Nome do arquivo que será salvo
    
        
        if (constraints != null) {
            for (var i = 0; i < constraints.length; i++) {
                //A constraint vai conter o documentid do arquivo que será anexado no relatório
                if (constraints[i].fieldName == 'documentid') {
                    imagem1 = constraints[i].initialValue;
                }
            }
        }
        
        log.info("--- CONSTRAINT PASSADA: ---")
        log.info(imagem1)
        
        

        // Obtém a lista de parâmetros
        var parametros = getParametros();
        
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
 * (ADAPTADO PARA O RELATÓRIO)
 * @return {hashMap}
 */
function getParametros(){
    try {
        //Monta mapa com parâmetros do template
        var parametros = new java.util.HashMap();
        
        //Logo
        parametros.put("logo", diretorioFluig()+"/repository/wcmdir/wcm/tenants/wcm/custom/assets/head_background.gif");

        //Dados do Relatório
        var dataFormatada = new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new java.util.Date());
        
        parametros.put("dataEmissao", dataFormatada);
        parametros.put("dataProcesso", dataFormatada);
        parametros.put("nomeColaborador", "Caio Custodio");
        parametros.put("nomeFornecedor", "EMPRESA");
        parametros.put("unidadeNF", "SP");
        parametros.put("numeroNF", "2585");
        parametros.put("qtdeVolumes", "5");
        parametros.put("itensConferidos", "SIM"); 
        parametros.put("strInspecao", "Nenhuma inconformidade"); 
        parametros.put("strDocumentos", "Nenhum documento adicional"); 
        parametros.put("geolocalizacao", "-23.4174, -46.3940"); 
        parametros.put("nome", "Sistema");
        parametros.put("sobrenome", "Fluig");
        parametros.put("imagem1", buscaLinkGed(imagem1))

        return parametros;
        
    } catch (ex) {
        throw "function " + arguments.callee.name + " => " + ex.toString()
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
 * Converte string html em um arquivo PDF usando a bibloteca  itextpdf
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


/**
 * Retorna a URL de Download do arquivo
 */
function buscaLinkGed(documentId){
    var c1 = DatasetFactory.createConstraint("documentid", documentId, documentId, ConstraintType.MUST);
    var dataset = DatasetFactory.getDataset("ds_buscaLinkGed", null, [c1], null);
    var result = dataset.getValue(0, "url");
    log.info("--- BUSCA LINK GED ---")
    log.info(result)
    
    return result
}