function createDataset(fields, constraints, sortFields) {
    var dataset = DatasetBuilder.newDataset();
    dataset.addColumn("STATUS");
    dataset.addColumn("MENSAGEM");

    var docId = 6380; //<--- bota o documentid do arquivo aqui
    var uploadFileName = "";
    var uploadFileContent = "";

    if (constraints != null) {
        for (var i = 0; i < constraints.length; i++) {
            if (constraints[i].fieldName == "documentId") {
                docId = parseInt(constraints[i].initialValue);
            }
            if (constraints[i].fieldName == "fileName") {
                uploadFileName = constraints[i].initialValue;
            }
            if (constraints[i].fieldName == "fileContent") {
                uploadFileContent = constraints[i].initialValue;
            }
        }
    }

    if (docId == 0) {
        dataset.addRow(["ERRO", "Constraint 'documentId' é obrigatória", ""]);
        return dataset;
    }

    try {
        var usuario = "USUARIO";
        var senha = "SENHA";
        var empresa = 1;        

        var provider = ServiceManager.getServiceInstance("ECMDocumentService");
        var locator = provider.instantiate("com.totvs.technology.ecm.dm.ws.ECMDocumentServiceService");
        var service = locator.getDocumentServicePort();
        var helper = provider.getBean();

        var resultGet = service.getActiveDocument(usuario, senha, empresa, docId, usuario);
        if (resultGet.getItem().isEmpty()) {
            dataset.addRow(["ERRO", "Documento não encontrado.", ""]);
            return dataset;
        }
        var docDto = resultGet.getItem().get(0);
        
        var attachmentArray = helper.instantiate("com.totvs.technology.ecm.dm.ws.AttachmentArray");
        var novoAnexo = helper.instantiate("com.totvs.technology.ecm.dm.ws.Attachment");
        var bytesArquivo = null;
        var nomeArquivoFinal = "";

        if (uploadFileName != "" && uploadFileContent != "") {
            log.info("DS_PUBLIC: Usando novo arquivo enviado via constraint.");
            nomeArquivoFinal = uploadFileName;
            try {
                bytesArquivo = javax.xml.bind.DatatypeConverter.parseBase64Binary(uploadFileContent);
            } catch (errBase64) {
                 throw "Erro ao converter Base64 do novo arquivo: " + errBase64;
            }
        } else {
            var phisicalName = docDto.getPhisicalFile(); 
            nomeArquivoFinal = phisicalName;

            bytesArquivo = service.getDocumentContent(
                usuario, 
                senha, 
                empresa, 
                docId, 
                usuario, 
                docDto.getVersion(), 
                phisicalName
            );
            
            if (bytesArquivo == null || bytesArquivo.length == 0) {
                 throw "O documento atual parece estar vazio ou não foi possível recuperar o conteúdo.";
            }
        }

        novoAnexo.setFileName(nomeArquivoFinal);
        novoAnexo.setFilecontent(bytesArquivo);
        novoAnexo.setPrincipal(true);
        novoAnexo.setAttach(true);
        
        attachmentArray.getItem().add(novoAnexo);

        if (docDto.getAttachments() != null) {
            docDto.getAttachments().clear();
        }

        docDto.setDocumentType("2");
        docDto.setDocumentTypeId("2");
        docDto.setExternalDocumentId("");
        docDto.setDocumentKeyWord("");
        docDto.setInheritSecurity(false);
        docDto.setPublicDocument(true);
        docDto.setDownloadEnabled(true);
        docDto.setUpdateIsoProperties(false);
        
        var securityDto = helper.instantiate("com.totvs.technology.ecm.dm.ws.DocumentSecurityConfigDto");
        
        securityDto.setCompanyId(empresa);
        securityDto.setDocumentId(docId);
        securityDto.setVersion(docDto.getVersion());
        securityDto.setSequence(1);
        securityDto.setSecurityVersion(false);
        securityDto.setInheritSecurity(false); 
        securityDto.setAttributionType(1);
        securityDto.setAttributionValue(usuario);
        securityDto.setSecurityLevel(3);
        securityDto.setPermission(true);
        securityDto.setShowContent(true);
        securityDto.setDownloadEnabled(true);

        var securityArray = helper.instantiate("com.totvs.technology.ecm.dm.ws.DocumentSecurityConfigDtoArray");
        securityArray.getItem().add(securityDto);

        var docArray = helper.instantiate("com.totvs.technology.ecm.dm.ws.DocumentDtoArray");
        docArray.getItem().add(docDto);

        var approverArray = helper.instantiate("com.totvs.technology.ecm.dm.ws.ApproverDtoArray");
        var relatedArray = helper.instantiate("com.totvs.technology.ecm.dm.ws.RelatedDocumentDtoArray");

        var resultUpdate = service.updateDocument(
            usuario, senha, empresa, 
            docArray, attachmentArray, securityArray, approverArray, relatedArray
        );

        if (resultUpdate.getItem().size() > 0) {;
            dataset.addRow(["SUCESSO", "Documento atualizado e arquivo preservado."]);
        } else {
            dataset.addRow(["ERRO", "O serviço não retornou confirmação.", ""]);
        }

    } catch (e) {
        var msg = e.toString();
        if (e.message) msg = e.message;
        dataset.addRow(["ERRO", "Exceção: " + msg, ""]);
        log.error("ERRO DS PUBLIC: " + msg);
    }

    return dataset;
}