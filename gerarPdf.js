class GeradorPDF_RDO {
    constructor() {
        this.doc = null;
        this.margemEsquerda = 20;
        this.margemDireita = 20;
        this.margemSuperior = 20;
        this.margemInferior = 20;
        this.larguraPagina = 210;
        this.alturaPagina = 297;
        this.posicaoY = this.margemSuperior;
        this.dados = {};
        this.imagensGed = [];
        this.pdfGerado = null; // NOVO: armazenar o PDF gerado
    }


    async inicializar() {
        this.buscaUrlImagemGed();

        // Coletar todos os dados do formulário
        this.coletarDadosGerais();
        this.coletarDadosVisita();
        this.coletarContratos();
        this.coletarEquipamentos();

        // Coletar dados de cada tipo de equipamento
        this.dados.quikdeck = this.coletarDadosQuikdeck();
        this.dados.andaime = this.coletarDadosAndaime();
        this.dados.elevador = this.coletarDadosElevador();
        this.dados.forma = this.coletarDadosForma();
        this.dados.escoramento = this.coletarDadosEscoramento();

        // Coletar dados adicionais
        this.dados.situacaoAtual = this.coletarSituacaoAtual();
        this.dados.evidencias = this.coletarEvidencias();
        this.dados.acoes = this.coletarAcoes();
        this.dados.assinatura = this.coletarAssinatura();
    }


    buscaUrlImagemGed() {
        const linksGed = [];

        try {
            const attachments = top.WKFViewAttachment.getAllAttachments();

            for (let i = 0; i < attachments.length; i++) {
                if (attachments[i]) {
                    const nomeArquivo = attachments[i].description;
                    const documentId = attachments[i].documentId;

                    try {
                        var c1 = DatasetFactory.createConstraint("documentid", documentId, documentId, ConstraintType.MUST);
                        var dataset = DatasetFactory.getDataset("ds_buscaLinkGed", null, [c1], null);

                        if (dataset && dataset.values && dataset.values.length > 0 && dataset.values[0].url) {
                            linksGed.push({
                                nome: nomeArquivo,
                                url: dataset.values[0].url,
                                documentId: documentId
                            });
                        } else {
                            console.warn(`[PDF] Dataset sem URL para: ${nomeArquivo}`);
                        }
                    } catch (datasetError) {
                        console.error(`[PDF] Erro ao buscar dataset para ${nomeArquivo}:`, datasetError);
                    }
                }
            }
        } catch (error) {
            console.error('[PDF] Erro ao buscar anexos:', error);
        }

        this.imagensGed = linksGed;
    }


    coletarDadosGerais() {
        this.dados.numeroSolicitacao = WKNumProces || '-';
        this.dados.dataSolicitacao = $('#dataSolicitacao').val() || '-';
        this.dados.tipoOperacao = $('#tipoOperacao').val() || '-';
    }


    coletarDadosVisita() {
        this.dados.tecnicoResponsavel = $('#tecnicoResponsavel').val() || '-';

        this.dados.apoioTecnico1 = $('#apoioTecnico1').val() || '-';
        this.dados.apoioTecnico2 = $('#apoioTecnico2').val() || '-';
        this.dados.dataEntrada = $('#dataEntrada').val() || '-';
        this.dados.horaInicio = $('#horaInicio').val() || '-';
        this.dados.dataSaida = $('#dataSaida').val() || '-';
        this.dados.horaTermino = $('#horaTermino').val() || '-';
        this.dados.duracaoVisita = $('#duracaoVisita').val() || '-';
        this.dados.tipoVisita = $('#tipoVisita').val() || '-';
        this.dados.tipoAtendimento = $('#tipoAtendimento').val() || '-';
    }


    coletarContratos() {
        this.dados.contratos = [];

        const contrato = {
            numero: $('#zoomContrato').val(),
            unidade: $('#txtUnidade').val(),
            nomeCliente: $('#txtNomeCliente').val(),
            cnpj: $('#txtCNPJ').val(),
            nomeObra: $('#txtNomeObra').val(),
            enderecoObra: $('#txtEnderecoObra').val(),
            segmentoObra: $('#txtSegmentoObra').val()
        };

        // Só adiciona se tiver pelo menos o número do contrato
        if (contrato.numero) {
            this.dados.contratos.push(contrato);
        }
    }


    coletarEquipamentos() {
        const tipoOperacao = $("#tipoOperacao").val();
        this.dados.equipamentos = [];
        this.dados.tipoOperacaoEquipamento = tipoOperacao;

        if (tipoOperacao === "contratoLocacao") {
            $('#tblEquipamentos tbody tr').each((index, row) => {
                const selecionado = $(row).find('input[name*="chkEquipamento"]').is(':checked');
                if (selecionado) {
                    const contrato = $(row).find('input[name*="txtContratoEquipamento"]').val();
                    const equipamento = $(row).find('select[name*="txtEquipamento"]').val();

                    if (contrato || equipamento) {
                        this.dados.equipamentos.push({
                            tipo: 'contrato',
                            contrato: contrato || '-',
                            equipamento: equipamento || '-'
                        });
                    }
                }
            });
        }

        if (tipoOperacao === "avulso") {
            $('#tblEquipamentosAvulso tbody tr').each((index, row) => {
                const equipamento = $(row).find('select[name*="slctEquipamentoAvulso"]').val();
                const informacao = $(row).find('textarea[name*="txtInfoEquipamentoAvulso"]').val();

                if (equipamento) {
                    this.dados.equipamentos.push({
                        tipo: 'avulso',
                        equipamento: equipamento || '-',
                        informacao: informacao || '-'
                    });
                }
            });
        }
    }


    coletarDadosQuikdeck() {
        const dados = {
            tipoProjeto: $('input[name*="tipoProjetoQuikdeck"]:checked').val() || null,
            numProjeto: $('#numProjetoReferenciaQuikdeck').val() || null,
            statusMontagem: $('input[name*="statusMontagemQuikdeck"]:checked').val() || null,
            trechoObra: $('#trechoObraQuikdeck').val() || null,
            trechoMontado: $('#qdk_trechoMontado').val() || null,
            previsaoTermino: $('#qdk_previsaoTermino').val() || null,
            desmontarMovimentacao: $('#qdk_desmontarMovimentacao').val() || null,
            materialObra: $('#qdk_materialObra').val() || null,
            previsaoDesmobilizacao: $('#qdk_previsaoDesmobilizacao').val() || null,

            projetoBaseUltimaVersao: $('#qdk_projetoBaseUltimaVersao').val() || null,
            necessidadeAlteracao: $('#qdk_necessidadeAlteracao').val() || null,
            necessidadeProjeto: $('#qdk_necessidadeProjeto').val() || null,
            todasPecasEnviadas: $('#qdk_todasPecasEnviadas').val() || null,
            procedimentoMontagem: $('#qdk_procedimentoMontagem').val() || null,
            riscosObra: $('#qdk_riscosObra').val() || null,
            aplicacaoPlataforma: $('#qdk_aplicacaoPlataforma').val() || null,
            certificadoCapacitacao: $('#qdk_certificadoCapacitacao').val() || null,
            necessidadeTreinamento: $('#qdk_necessidadeTreinamento').val() || null,
            tipoColaboradores: $('#qdk_tipoColaboradores').val() || null,
            artMontagem: $('#qdk_artMontagem').val() || null,
            organizacaoMaterial: $('#qdk_organizacaoMaterial').val() || null,
            estadoConservacao: $('#qdk_estadoConservacao').val() || null,
            outrasConsideracoes: $('#qdk_outrasConsideracoes').val() || null,
            checklist: []
        };

        dados.checklist = this.coletarChecklist('quikdeck', 31);

        const temValor = Object.values(dados).some(val => {
            if (Array.isArray(val)) return val.length > 0;
            return val !== null && val !== '';
        });

        return temValor ? dados : null;
    }


    coletarDadosAndaime() {
        const dados = {
            tipoProjeto: $('input[name*="tipoProjetoAndaime"]:checked').val() || null,
            numProjeto: $('#numProjetoReferenciaAndaime').val() || null,
            statusMontagem: $('input[name*="statusMontagemAndaime"]:checked').val() || null,
            trechoObra: $('#trechoObraAndaime').val() || null,
            checklist: []
        };

        dados.checklist = this.coletarChecklist('andaime', 24);

        const temValor = Object.values(dados).some(val => {
            if (Array.isArray(val)) return val.length > 0;
            return val !== null && val !== '';
        });

        return temValor ? dados : null;
    }


    coletarDadosElevador() {
        const dados = {
            tipoProjeto: $('input[name*="tipoProjetoElevador"]:checked').val() || null,
            numProjeto: $('#numProjetoReferenciaElevador').val() || null,
            statusMontagem: $('input[name*="statusMontagemElevador"]:checked').val() || null,
            trechoObra: $('#trechoObraElevador').val() || null,
            trechoMontado: $('#elev_trechoMontado').val() || null,
            previsaoTermino: $('#elev_previsaoTermino').val() || null,
            materialObra: $('#elev_materialObra').val() || null,
            previsaoDesmobilizacao: $('#elev_previsaoDesmobilizacao').val() || null,

            projetoBaseUltimaVersao: $('#elev_projetoBaseUltimaVersao').val() || null,
            necessidadeAlteracao: $('#elev_necessidadeAlteracao').val() || null,
            necessidadeProjeto: $('#elev_necessidadeProjeto').val() || null,
            todasPecasEnviadas: $('#elev_todasPecasEnviadas').val() || null,
            projetoMontagem: $('#elev_projetoMontagem').val() || null,
            riscosObra: $('#elev_riscosObra').val() || null,
            aplicacaoElevador: $('#elev_aplicacaoElevador').val() || null,
            treinamentoHabilitacao: $('#elev_treinamentoHabilitacao').val() || null,
            necessidadeTreinamento: $('#elev_necessidadeTreinamento').val() || null,
            tipoColaboradores: $('#elev_tipoColaboradores').val() || null,
            artMontagem: $('#elev_artMontagem').val() || null,
            organizacaoMaterial: $('#elev_organizacaoMaterial').val() || null,
            estadoConservacao: $('#elev_estadoConservacao').val() || null,
            outrasConsideracoes: $('#elev_outrasConsideracoes').val() || null,
            checklist: []
        };

        dados.checklist = this.coletarChecklist('elevador', 28);

        const temValor = Object.values(dados).some(val => {
            if (Array.isArray(val)) return val.length > 0;
            return val !== null && val !== '';
        });

        return temValor ? dados : null;
    }


    coletarDadosForma() {
        const dados = {
            tipoProjeto: $('input[name*="tipoProjetoForma"]:checked').val() || null,
            numProjeto: $('#numProjetoReferenciaForma').val() || null,
            statusMontagem: $('input[name*="statusMontagemForma"]:checked').val() || null,
            trechoObra: $('#trechoObraForma').val() || null,
            checklist: []
        };

        dados.checklist = this.coletarChecklist('forma', 26);

        const temValor = Object.values(dados).some(val => {
            if (Array.isArray(val)) return val.length > 0;
            return val !== null && val !== '';
        });

        return temValor ? dados : null;
    }


    coletarDadosEscoramento() {
        const dados = {
            tipoProjeto: $('input[name*="tipoProjetoEscoramento"]:checked').val() || null,
            numProjeto: $('#numProjetoRefEscoramento').val() || null,
            statusMontagem: $('input[name*="statusMontagemEscoramento"]:checked').val() || null,
            trechoObra: $('#trechoObraEscoramento').val() || null,
            checklist: []
        };

        dados.checklist = this.coletarChecklist('escoramento', 29);

        const temValor = Object.values(dados).some(val => {
            if (Array.isArray(val)) return val.length > 0;
            return val !== null && val !== '';
        });

        return temValor ? dados : null;
    }


    coletarChecklist(tipoEquipamento, totalItens) {
        const checklist = [];

        const possiveisContainers = [
            `#bloco${this.capitalize(tipoEquipamento)}Checklist`,
            `[name="bloco${this.capitalize(tipoEquipamento)}Checklist"]`,
            `[name="bloco${this.capitalize(tipoEquipamento)}"]`
        ];

        let $container = null;
        for (const seletor of possiveisContainers) {
            $container = $(seletor);
            if ($container.length > 0) {
                break;
            }
        }

        if (!$container || $container.length === 0) {
            return [];
        }

        for (let i = 1; i <= totalItens; i++) {
            const nomeRadio = `_${tipoEquipamento}_status_${i}`;
            const nomeObs = `_${tipoEquipamento}_obs_${i}`;
            const status = $(`input[name*="${nomeRadio}"]:checked`).val() || null;
            const obs = $(`textarea[name*="${nomeObs}"]`).val() || null;
            let verificacao = '';

            let $label = $(`label[for*="${tipoEquipamento}_status_${i}_conforme"]`);
            if ($label.length > 0) {
                const $span = $label.closest('td').find('.checklist-item-label');
                if ($span.length > 0) {
                    verificacao = $span.text().trim();
                }
            }

            if (!verificacao) {
                const $tr = $(`input[name*="${nomeRadio}"]`).closest('tr');
                const $tdVerificacao = $tr.find('td').eq(1);
                const $span = $tdVerificacao.find('.checklist-item-label');

                if ($span.length > 0) {
                    verificacao = $span.text().trim();
                } else {
                    verificacao = $tdVerificacao.text().trim();

                    if (verificacao) {
                        verificacao = verificacao
                            .replace(new RegExp(`^${i}\\s*`), '')
                            .replace(/Conforme/g, '')
                            .replace(/Não Conforme/g, '')
                            .replace(/Não Aplica/g, '')
                            .trim();
                    }
                }
            }

            if (!verificacao) {
                verificacao = `Item ${i} (Verificação não coletada corretamente)`;
            }

            if (status || obs) {
                checklist.push({
                    item: i,
                    verificacao: verificacao,
                    status: status,
                    observacao: obs
                });
            }
        }

        return checklist;
    }


    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    coletarSituacaoAtual() {
        const dados = {
            trechoMontagemPrevisao: $('#trechoMontagemPrevisao').val() || null,
            previsaoConcretagem: $('#previsaoConcretagem').val() || null,
            previsaoDesmontagem: $('#previsaoDesmontagem').val() || null,
            verificacaoProjeto: $('#verificacaoProjeto').val() || null,
            necessidadeAlteracao: $('#necessidadeAlteracao').val() || null,
            necessidadeProjeto: $('#necessidadeProjeto').val() || null,
            proximaEstrutura: $('#proximaEstrutura').val() || null,
            montagemReaproveitamento: $('#montagemReaproveitamento').val() || null,
            previsaoDevolucao: $('#previsaoDevolucao').val() || null,
            organizacaoMaterial: $('#organizacaoMaterial').val() || null,
            outrasConsideracoes: $('#outrasConsideracoes').val() || null
        };

        const temValor = Object.values(dados).some(val => val !== null && val !== '');
        return temValor ? dados : null;
    }


    coletarEvidencias() {
        const evidencias = [];
        $('#tabelaEvidencias tbody tr').each((index, row) => {
            const legenda = $(row).find('input[name*="legendaEvidencia"]').val();
            const nomeArquivo = $(row).find('input[name*="txtNomeAnexoEvidencia"]').val();

            if (legenda || nomeArquivo) {
                const evidencia = {
                    legenda: legenda || 'Sem legenda',
                    arquivo: nomeArquivo || 'Sem arquivo'
                };

                const dadosImagem = this.buscarDadosImagem(nomeArquivo);
                if (dadosImagem) {
                    evidencia.url = dadosImagem.url;
                    evidencia.documentId = dadosImagem.documentId;
                }

                evidencias.push(evidencia);
            }
        });

        return evidencias.length > 0 ? evidencias : null;
    }


    buscarDadosImagem(nomeArquivo) {
        if (!nomeArquivo || !this.imagensGed || this.imagensGed.length === 0) {
            return null;
        }

        let imagem = this.imagensGed.find(img => img.nome === nomeArquivo);
        if (imagem) {
            return { url: imagem.url, documentId: imagem.documentId };
        }

        imagem = this.imagensGed.find(img =>
            img.nome.includes(nomeArquivo) || nomeArquivo.includes(img.nome)
        );

        if (imagem) {
            return { url: imagem.url, documentId: imagem.documentId };
        }

        const nomeArquivoSemExt = nomeArquivo.replace(/\.[^/.]+$/, "");
        imagem = this.imagensGed.find(img => {
            const nomeImgSemExt = img.nome.replace(/\.[^/.]+$/, "");
            return nomeImgSemExt === nomeArquivoSemExt;
        });

        if (imagem) {
            return { url: imagem.url, documentId: imagem.documentId };
        }

        return null;
    }


    coletarAcoes() {
        const acoes = [];
        $('#tabelaAcoes tbody tr').each((index, row) => {
            const acao = {
                descricao: $(row).find('input[name*="descricaoAcao"]').val(),
                area: $(row).find('select[name*="areaResponsavel"]').val(),
                responsavel: $(row).find('input[name*="responsavelExecucao"]').val(),
                apoio: $(row).find('input[name*="apoioExecucao"]').val(),
                prazo: $(row).find('input[name*="prazoExecucao"]').val()
            };

            if (acao.descricao) {
                acoes.push(acao);
            }
        });

        return acoes.length > 0 ? acoes : null;
    }


    coletarAssinatura() {
        return {
            nomeTecnico: $('#nomeTecRespAssinatura').val() || $('#tecnicoResponsavel').val(),
            contatoCliente: $('#contatoCliente').val(),
            cargo: $('#cargoCliente').val(),
            email: $('#emailCliente').val(),
            telefone: $('#telefoneCliente').val(),
            assinaturaBase64: $('#assinaturaClienteBase64').val(),
            motivoAusenciaAssinatura: $('#motivoAusenciaAssinatura').val(),
            observacoes: $('#observacoesFinais').val()
        };
    }


    async gerarPDF() {
        const { jsPDF } = window.jspdf;
        const dataVisita = $('#dataEntrada').val();
        const numeroContrato = $('#zoomContrato').val();
        const cnpj = this.limparCNPJ($('#txtCNPJ').val());

        this.doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        await this.adicionarCabecalhoComLogo();
        //this.adicionarInformacoesGerais();
        this.adicionarInformacoesVisita();
        this.adicionarContratosObra();
        this.adicionarEquipamentosSelecionados();

        if (this.dados.quikdeck) this.adicionarQuikdeck();
        if (this.dados.andaime) this.adicionarAndaime();
        if (this.dados.elevador) this.adicionarElevador();
        if (this.dados.forma) this.adicionarForma();
        if (this.dados.escoramento) this.adicionarEscoramento();

        if (this.dados.situacaoAtual) this.adicionarSituacaoAtual();
        if (this.dados.evidencias) await this.adicionarEvidencias();
        if (this.dados.acoes) this.adicionarAcoes();

        this.adicionarAssinatura();
        this.adicionarRodape();

        var nomeArquivo = ""

        if (this.dados.tipoOperacaoEquipamento == "contratoLocacao") {
            nomeArquivo = `RDO_${numeroContrato}_${cnpj}_${dataVisita}.pdf`;
        }
        else if (this.dados.tipoOperacaoEquipamento == "avulso") {
            nomeArquivo = `RDO_${numeroContrato}_${cnpj}_${dataVisita}_AVULSO.pdf`;
        }


        // Salvar PDF localmente (download)
        this.doc.save(nomeArquivo);

        // NOVO: Guardar o PDF em memória para enviar ao GED
        this.pdfGerado = {
            nome: nomeArquivo,
            base64: this.doc.output('datauristring').split(',')[1]
        };

        console.log('[PDF] PDF gerado e armazenado para envio ao GED');
    }

    getDataHoraFormatada() {
        const agora = new Date();
        const ano = agora.getFullYear();
        const mes = String(agora.getMonth() + 1).padStart(2, '0');
        const dia = String(agora.getDate()).padStart(2, '0');
        const hora = String(agora.getHours()).padStart(2, '0');
        const min = String(agora.getMinutes()).padStart(2, '0');
        return `${ano}${mes}${dia}_${hora}${min}`;
    }


    async adicionarCabecalhoComLogo() {
        try {
            // Carrega a logo e suas dimensões
            const logoData = await this.carregarImagemComDimensoes('img');

            // Fundo azul do cabeçalho (altura 18mm)
            this.doc.setFillColor(0, 74, 159);
            this.doc.rect(0, 0, this.larguraPagina, 18, 'F');

            if (logoData) {
                // Logo: altura 10mm, largura proporcional
                const alturaLogo = 10;
                const larguraLogo = (logoData.width / logoData.height) * alturaLogo;

                // Posiciona logo à esquerda, centralizada verticalmente no cabeçalho
                const yLogo = 4; // (18mm - 10mm) / 2 = 4mm do topo
                this.doc.addImage(logoData.base64, 'PNG', this.margemEsquerda, yLogo, larguraLogo, alturaLogo);

                // Título: posicionado à direita da logo
                this.doc.setTextColor(255, 255, 255);
                this.doc.setFontSize(18);
                this.doc.setFont('helvetica', 'bold');

                // X = posição após a logo + espaçamento
                // Y = meio do cabeçalho (18/2 = 9mm, ajustado para baseline do texto)
                const xTitulo = this.margemEsquerda + larguraLogo + 5;
                const yTitulo = 11; // centralizado verticalmente
                this.doc.text('Relatório de Acompanhamento Obras', xTitulo, yTitulo);
            } else {
                // Fallback sem logo: título centralizado
                this.doc.setTextColor(255, 255, 255);
                this.doc.setFontSize(18);
                this.doc.setFont('helvetica', 'bold');
                const textoTitulo = 'Relatório de Acompanhamento Obras';
                const larguraTexto = this.doc.getTextWidth(textoTitulo);
                const xCentralizado = (this.larguraPagina - larguraTexto) / 2;
                this.doc.text(textoTitulo, xCentralizado, 11);
            }

            this.doc.setFontSize(10);
            this.doc.setFont('helvetica', 'normal');
            this.posicaoY = 23;

        } catch (erro) {
            console.warn('[PDF] Erro ao carregar logo, usando cabeçalho sem logo:', erro);
            // Fallback: cabeçalho simples sem logo
            this.doc.setFillColor(0, 74, 159);
            this.doc.rect(0, 0, this.larguraPagina, 18, 'F');
            this.doc.setTextColor(255, 255, 255);
            this.doc.setFontSize(18);
            this.doc.setFont('helvetica', 'bold');
            const textoTitulo = 'Relatório de Acompanhamento Obras';
            const larguraTexto = this.doc.getTextWidth(textoTitulo);
            const xCentralizado = (this.larguraPagina - larguraTexto) / 2;
            this.doc.text(textoTitulo, xCentralizado, 11);
            this.doc.setFontSize(10);
            this.doc.setFont('helvetica', 'normal');
            this.posicaoY = 23;
        }
    }

    async carregarImagemComDimensoes(nomeArquivo) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';

            // Timeout para não travar se a imagem demorar muito
            const timeout = setTimeout(() => {
                console.warn('[PDF] Timeout ao carregar logo');
                resolve(null);
            }, 2000); // 2 segundos de timeout

            img.onload = function () {
                clearTimeout(timeout);

                // Redimensiona a imagem para tamanho otimizado (máximo 300px de largura)
                // Menor que antes para reduzir tamanho mantendo qualidade visual
                const maxWidth = 300;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Desenha a imagem redimensionada
                ctx.drawImage(img, 0, 0, width, height);

                try {
                    // Usa PNG para manter transparência, mas com imagem redimensionada
                    const dataURL = canvas.toDataURL('image/png');
                    resolve({
                        base64: dataURL,
                        width: img.width, // dimensões originais para calcular proporção
                        height: img.height
                    });
                } catch (e) {
                    clearTimeout(timeout);
                    console.warn('[PDF] Erro ao processar logo:', e);
                    resolve(null);
                }
            };

            img.onerror = function (erro) {
                clearTimeout(timeout);
                console.warn('[PDF] Não foi possível carregar a logo');
                resolve(null); // Resolve com null em vez de rejeitar, para continuar sem logo
            };

            // Tenta carregar a imagem da raiz do projeto
            img.src = nomeArquivo;
        });
    }


    adicionarRodape() {
        const totalPaginas = this.doc.internal.getNumberOfPages();

        for (let i = 1; i <= totalPaginas; i++) {
            this.doc.setPage(i);
            this.doc.setFillColor(240, 240, 240);
            this.doc.rect(0, this.alturaPagina - 15, this.larguraPagina, 15, 'F');
            this.doc.setTextColor(100, 100, 100);
            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'normal');
            this.doc.text(
                'EMPRESA SA',
                this.margemEsquerda,
                this.alturaPagina - 8
            );

            this.doc.text(
                `Página ${i} de ${totalPaginas}`,
                this.larguraPagina - this.margemDireita,
                this.alturaPagina - 6,
                { align: 'right' }
            );
        }
    }

    /*
    adicionarInformacoesGerais() {
        this.verificarNovaPagina(30);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Informações Gerais', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        this.doc.autoTable({
            startY: this.posicaoY,
            head: [],
            body: [
                ['Nº Solicitação:', this.dados.numeroSolicitacao],
                ['Data Solicitação:', this.dados.dataSolicitacao],
                ['Tipo de Operação:', this.dados.tipoOperacao]
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;
    }*/


    adicionarInformacoesVisita() {
        this.verificarNovaPagina(40);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Informações da Visita', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        var tipos = {
            'locacao': 'Locação',
            'maoDeObra': 'Mão de obra',
            'vendaEquipamento': 'Venda de equipamento'
        };

        var tipoAtendimento = tipos[this.dados.tipoAtendimento] || "";

        this.doc.autoTable({
            startY: this.posicaoY,
            head: [],
            body: [
                ['Nº Solicitação:', this.dados.numeroSolicitacao],
                ['Técnico Responsável:', this.dados.tecnicoResponsavel],

                ['Apoio Técnico 1:', this.dados.apoioTecnico1],
                ['Apoio Técnico 2:', this.dados.apoioTecnico2],
                ['Data/Hora Entrada:', `${this.dados.dataEntrada} ${this.dados.horaInicio}`],
                ['Data/Hora Saída:', `${this.dados.dataSaida} ${this.dados.horaTermino}`],
                ['Duração da Visita:', this.dados.duracaoVisita],
                ['Tipo de Visita:', this.dados.tipoVisita],
                ['Tipo de Atendimento:', tipoAtendimento]
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;
    }


    adicionarContratosObra() {
        if (!this.dados.contratos || this.dados.contratos.length === 0) return;

        this.verificarNovaPagina(40);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Identificação da Obra', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        this.dados.contratos.forEach((contrato, index) => {
            this.verificarNovaPagina(50);

            if (this.dados.contratos.length > 1) {
                this.doc.setFillColor(230, 230, 230);
                this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 6, 'F');
                this.doc.setTextColor(0, 0, 0);
                this.doc.setFontSize(10);
                this.doc.setFont('helvetica', 'bold');
                this.doc.text(`Contrato ${index + 1}`, this.margemEsquerda + 3, this.posicaoY + 4);
                this.posicaoY += 8;
            }

            this.doc.autoTable({
                startY: this.posicaoY,
                head: [],
                body: [
                    ['Nº Contrato:', contrato.numero || '-'],
                    ['Unidade:', contrato.unidade || '-'],
                    ['Nome do Cliente:', contrato.nomeCliente || '-'],
                    ['CNPJ:', contrato.cnpj || '-'],
                    ['Nome da Obra:', contrato.nomeObra || '-'],
                    ['Endereço da Obra:', contrato.enderecoObra || '-'],
                    ['Segmento da Obra:', contrato.segmentoObra || '-']
                ],
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 2 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 60 },
                    1: { cellWidth: 'auto' }
                },
                margin: { left: this.margemEsquerda, right: this.margemDireita }
            });

            this.posicaoY = this.doc.lastAutoTable.finalY + 5;
        });
    }


    adicionarEquipamentosSelecionados() {
        if (!this.dados.equipamentos || this.dados.equipamentos.length === 0) return;

        this.verificarNovaPagina(40);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Equipamentos Selecionados', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        const tipoOperacao = this.dados.tipoOperacaoEquipamento;

        if (tipoOperacao === "contratoLocacao") {
            const linhasTabela = this.dados.equipamentos.map(eq => [
                eq.contrato || '-',
                eq.equipamento || '-'
            ]);

            this.doc.autoTable({
                startY: this.posicaoY,
                head: [['Contrato', 'Equipamento']],
                body: linhasTabela,
                theme: 'striped',
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: {
                    fillColor: [0, 74, 159],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 'auto' }
                },
                margin: { left: this.margemEsquerda, right: this.margemDireita }
            });
        } else if (tipoOperacao === "avulso") {
            const linhasTabela = this.dados.equipamentos.map(eq => [
                eq.equipamento || '-',
                eq.informacao || '-'
            ]);

            this.doc.autoTable({
                startY: this.posicaoY,
                head: [['Equipamento', 'Informações Relevantes']],
                body: linhasTabela,
                theme: 'striped',
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    overflow: 'linebreak'
                },
                headStyles: {
                    fillColor: [0, 74, 159],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { cellWidth: 50 },
                    1: { cellWidth: 'auto' }
                },
                margin: { left: this.margemEsquerda, right: this.margemDireita }
            });
        }

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;
    }


    adicionarQuikdeck() {
        this.verificarNovaPagina(40);

        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Quikdeck', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        const dados = this.dados.quikdeck;
        this.doc.autoTable({
            startY: this.posicaoY,
            head: [],
            body: [
                ['Tipo de Projeto:', this.traduzirValor(dados.tipoProjeto)],
                ['Nº Projeto Referência:', dados.numProjeto || '-'],
                ['Status da Montagem:', this.traduzirValor(dados.statusMontagem)],
                ['Trecho da Obra:', dados.trechoObra || '-']
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;

        if (dados.checklist && dados.checklist.length > 0) {
            this.adicionarChecklist(dados.checklist, 'Quikdeck');
        }

        this.verificarNovaPagina(80);
        this.doc.setFillColor(200, 200, 200);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 6, 'F');
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Informações Adicionais - Quikdeck', this.margemEsquerda + 3, this.posicaoY + 4);
        this.posicaoY += 10;

        const infoAdicional = [
            ['Trecho Montado', dados.trechoMontado],
            ['Previsão de Término', dados.previsaoTermino],
            ['Desmontar para Movimentação', dados.desmontarMovimentacao],
            ['Material na Obra', dados.materialObra],
            ['Previsão de Desmobilização', dados.previsaoDesmobilizacao],
            ['Projeto Base na Última Versão', dados.projetoBaseUltimaVersao],
            ['Necessidade de Alteração', dados.necessidadeAlteracao],
            ['Necessidade de Projeto', dados.necessidadeProjeto],
            ['Todas as Peças Enviadas', dados.todasPecasEnviadas],
            ['Procedimento de Montagem', dados.procedimentoMontagem],
            ['Riscos na Obra', dados.riscosObra],
            ['Aplicação da Plataforma', dados.aplicacaoPlataforma],
            ['Certificado de Capacitação', dados.certificadoCapacitacao],
            ['Necessidade de Treinamento', dados.necessidadeTreinamento],
            ['Tipo de Colaboradores', dados.tipoColaboradores],
            ['ART de Montagem', dados.artMontagem],
            ['Organização do Material', dados.organizacaoMaterial],
            ['Estado de Conservação', dados.estadoConservacao],
            ['Outras Considerações', dados.outrasConsideracoes]
        ];

        this.doc.autoTable({
            startY: this.posicaoY,
            head: [],
            body: infoAdicional,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;
    }


    adicionarAndaime() {
        this.adicionarEquipamentoGenerico('Andaime', this.dados.andaime);
    }


    adicionarElevador() {
        const dados = this.dados.elevador;

        this.verificarNovaPagina(40);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Elevador', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        this.doc.autoTable({
            startY: this.posicaoY,
            head: [],
            body: [
                ['Tipo de Projeto:', this.traduzirValor(dados.tipoProjeto)],
                ['Nº Projeto Referência:', dados.numProjeto || '-'],
                ['Status da Montagem:', this.traduzirValor(dados.statusMontagem)],
                ['Trecho da Obra:', dados.trechoObra || '-']
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;

        if (dados.checklist && dados.checklist.length > 0) {
            this.adicionarChecklist(dados.checklist, 'Elevador');
        }

        if (dados.trechoMontado || dados.previsaoTermino || dados.materialObra) {
            this.verificarNovaPagina(60);
            this.doc.setFillColor(200, 200, 200);
            this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 6, 'F');
            this.doc.setTextColor(0, 0, 0);
            this.doc.setFontSize(10);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text('Informações Adicionais - Elevador', this.margemEsquerda + 3, this.posicaoY + 4);
            this.posicaoY += 10;

            const infoAdicional = [
                ['Trecho Montado', dados.trechoMontado],
                ['Previsão de Término', dados.previsaoTermino],
                ['Material na Obra', dados.materialObra],
                ['Previsão de Desmobilização', dados.previsaoDesmobilizacao],

                ['Projeto Base na Última Versão', dados.projetoBaseUltimaVersao],
                ['Necessidade de Alteração', dados.necessidadeAlteracao],
                ['Necessidade de Projeto', dados.necessidadeProjeto],
                ['Todas as Peças Enviadas', dados.todasPecasEnviadas],
                ['Projeto de Montagem', dados.projetoMontagem],
                ['Riscos na Obra', dados.riscosObra],
                ['Aplicação do Elevador', dados.aplicacaoElevador],
                ['Treinamento/Habilitação', dados.treinamentoHabilitacao],
                ['Necessidade de Treinamento', dados.necessidadeTreinamento],
                ['Tipo de Colaboradores', dados.tipoColaboradores],
                ['ART de Montagem', dados.artMontagem],
                ['Organização do Material', dados.organizacaoMaterial],
                ['Estado de Conservação', dados.estadoConservacao],
                ['Outras Considerações', dados.outrasConsideracoes]
            ];

            this.doc.autoTable({
                startY: this.posicaoY,
                head: [],
                body: infoAdicional,
                theme: 'striped',
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 60 },
                    1: { cellWidth: 'auto' }
                },
                margin: { left: this.margemEsquerda, right: this.margemDireita }
            });

            this.posicaoY = this.doc.lastAutoTable.finalY + 5;
        }
    }


    adicionarForma() {
        this.adicionarEquipamentoGenerico('Fôrma', this.dados.forma);
    }


    adicionarEscoramento() {
        this.adicionarEquipamentoGenerico('Escoramento', this.dados.escoramento);
    }


    adicionarEquipamentoGenerico(nome, dados) {
        this.verificarNovaPagina(40);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(nome, this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        this.doc.autoTable({
            startY: this.posicaoY,
            head: [],
            body: [
                ['Tipo de Projeto:', this.traduzirValor(dados.tipoProjeto)],
                ['Nº Projeto Referência:', dados.numProjeto || '-'],
                ['Status da Montagem:', this.traduzirValor(dados.statusMontagem)],
                ['Trecho da Obra:', dados.trechoObra || '-']
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;

        if (dados.checklist && dados.checklist.length > 0) {
            this.adicionarChecklist(dados.checklist, nome);
        }
    }


    adicionarChecklist(checklist, nomeEquipamento) {
        this.verificarNovaPagina(40);
        this.doc.setFillColor(200, 200, 200);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 6, 'F');
        this.doc.setTextColor(0, 0, 0);
        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(`Checklist de Verificação - ${nomeEquipamento}`, this.margemEsquerda + 3, this.posicaoY + 4);
        this.posicaoY += 10;

        const linhasTabela = checklist.map(item => {
            const statusFormatado = this.formatarStatus(item.status);
            const obsFormatada = item.observacao ? item.observacao.substring(0, 100) : '-';

            return [
                item.item.toString(),
                item.verificacao,
                statusFormatado,
                obsFormatada
            ];
        });

        this.doc.autoTable({
            startY: this.posicaoY,
            head: [['Item', 'Verificação', 'Status', 'Observações']],
            body: linhasTabela,
            theme: 'striped',
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: [0, 74, 159],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 70 },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 'auto' }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita },
            didParseCell: (data) => {
                if (data.column.index === 2 && data.section === 'body') {
                    const status = checklist[data.row.index].status;
                    if (status === 'conforme') {
                        data.cell.styles.fillColor = [200, 255, 200];
                        data.cell.styles.textColor = [0, 100, 0];
                    } else if (status === 'naoConforme') {
                        data.cell.styles.fillColor = [255, 200, 200];
                        data.cell.styles.textColor = [150, 0, 0];
                    } else if (status === 'naoAplica') {
                        data.cell.styles.fillColor = [220, 220, 220];
                        data.cell.styles.textColor = [100, 100, 100];
                    }
                }
            }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;
    }


    formatarStatus(status) {
        const mapa = {
            'conforme': 'Conforme',
            'naoConforme': 'Não Conforme',
            'naoAplica': 'Não Aplica'
        };
        return mapa[status] || status || '-';
    }


    adicionarSituacaoAtual() {
        this.verificarNovaPagina(60);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Situação Atual da Obra', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        const dados = this.dados.situacaoAtual;
        const corpo = [
            ['Trecho de Montagem/Previsão:', dados.trechoMontagemPrevisao || '-'],
            ['Previsão de Concretagem:', dados.previsaoConcretagem || '-'],
            ['Previsão de Desmontagem:', dados.previsaoDesmontagem || '-'],
            ['Verificação do Projeto:', dados.verificacaoProjeto || '-'],
            ['Necessidade de Alteração:', dados.necessidadeAlteracao || '-'],
            ['Necessidade de Projeto:', dados.necessidadeProjeto || '-'],
            ['Próxima Estrutura:', dados.proximaEstrutura || '-'],
            ['Montagem com Reaproveitamento:', dados.montagemReaproveitamento || '-'],
            ['Previsão de Devolução:', dados.previsaoDevolucao || '-'],
            ['Organização do Material:', dados.organizacaoMaterial || '-'],
            ['Outras Considerações:', dados.outrasConsideracoes || '-']
        ];

        this.doc.autoTable({
            startY: this.posicaoY,
            head: [],
            body: corpo,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;
    }


    isVideo(nomeArquivo) {
        if (!nomeArquivo) return false;
        const extensoesVideo = ['.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm', '.flv', '.m4v', '.3gp'];
        const extensao = nomeArquivo.toLowerCase().substring(nomeArquivo.lastIndexOf('.'));
        return extensoesVideo.includes(extensao);
    }


    gerarUrlGed(documentId) {
        return `LINK/webdesk/streamcontrol/totvs_azul.jpg?WDCompanyId=1&WDNrDocto=${documentId}&WDNrVersao=1000`;
    }


    async adicionarEvidencias() {
        this.verificarNovaPagina(40);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Evidências Visuais', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        for (const evidencia of this.dados.evidencias) {
            this.verificarNovaPagina(100);

            const index = this.dados.evidencias.indexOf(evidencia) + 1;
            const ehVideo = this.isVideo(evidencia.arquivo);

            this.doc.setFontSize(10);
            this.doc.setFont('helvetica', 'bold');
            this.doc.setTextColor(0, 0, 0);
            const tituloEvidencia = ehVideo ? `Evidência ${index} (Vídeo):` : `Evidência ${index}:`;
            this.doc.text(tituloEvidencia, this.margemEsquerda, this.posicaoY);
            this.posicaoY += 6;

            if (evidencia.legenda && evidencia.legenda !== 'Sem legenda') {
                this.doc.setFontSize(9);
                this.doc.setFont('helvetica', 'normal');
                this.doc.setTextColor(0, 0, 0);
                this.doc.text(`Legenda: ${evidencia.legenda}`, this.margemEsquerda, this.posicaoY);
                this.posicaoY += 5;
            }

            this.doc.setFontSize(8);
            this.doc.setFont('helvetica', 'italic');

            if (evidencia.documentId) {
                const urlGed = this.gerarUrlGed(evidencia.documentId);
                this.doc.setTextColor(0, 0, 255);
                const textoArquivo = `Arquivo: ${evidencia.arquivo}`;
                this.doc.textWithLink(textoArquivo, this.margemEsquerda, this.posicaoY, { url: urlGed });

                const larguraTexto = this.doc.getTextWidth(textoArquivo);
                this.doc.setDrawColor(0, 0, 255);
                this.doc.line(this.margemEsquerda, this.posicaoY + 0.5, this.margemEsquerda + larguraTexto, this.posicaoY + 0.5);

                console.log(`[PDF] ✓ Hyperlink adicionado: ${urlGed}`);
            } else {
                this.doc.setTextColor(100, 100, 100);
                this.doc.text(`Arquivo: ${evidencia.arquivo}`, this.margemEsquerda, this.posicaoY);
            }

            this.posicaoY += 8;

            if (ehVideo) {
                this.doc.setFillColor(230, 240, 255);
                this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 15, 'F');
                this.doc.setFontSize(9);
                this.doc.setFont('helvetica', 'italic');
                this.doc.setTextColor(0, 74, 159);
                this.doc.text('🎬 Este arquivo é um vídeo. Clique no link acima para visualizar.',
                    this.margemEsquerda + 5, this.posicaoY + 10);
                this.posicaoY += 20;
            }
            else if (evidencia.url) {
                try {
                    const imagemBase64 = await this.converterImagemParaBase64(evidencia.url);

                    if (imagemBase64) {
                        const larguraImagem = 170;
                        const alturaImagem = 80;

                        this.doc.addImage(
                            imagemBase64,
                            'JPEG',
                            this.margemEsquerda,
                            this.posicaoY,
                            larguraImagem,
                            alturaImagem
                        );

                        this.posicaoY += alturaImagem + 10;
                    } else {
                        this.adicionarAvisoImagemNaoCarregada();
                    }
                } catch (erro) {
                    this.adicionarAvisoImagemNaoCarregada();
                }
            } else {
                this.adicionarAvisoImagemNaoCarregada();
            }
        }
    }


    async converterImagemParaBase64(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const base64 = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(base64);
                } catch (erro) {
                    resolve(null);
                }
            };

            img.onerror = (erro) => {
                resolve(null);
            };

            img.src = url;
        });
    }


    adicionarAvisoImagemNaoCarregada() {
        this.doc.setFillColor(255, 250, 200);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 15, 'F');
        this.doc.setFontSize(9);
        this.doc.setFont('helvetica', 'italic');
        this.doc.setTextColor(150, 100, 0);
        this.doc.text('⚠ Imagem não disponível no momento da geração do PDF',
            this.margemEsquerda + 5, this.posicaoY + 10);
        this.posicaoY += 20;
    }


    adicionarAcoes() {
        this.verificarNovaPagina(40);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Ações para Tratativa', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        const linhas = this.dados.acoes.map(acao => {
            const apoio = acao.apoio ? `Apoio: ${acao.apoio}` : '';
            const descCompleta = acao.descricao + (apoio ? ` - ${apoio}` : '');

            return [
                descCompleta,
                this.traduzirArea(acao.area),
                acao.responsavel || '-',
                acao.prazo || '-'
            ];
        });

        this.doc.autoTable({
            startY: this.posicaoY,
            head: [['Descrição', 'Área', 'Responsável', 'Prazo']],
            body: linhas,
            theme: 'striped',
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: {
                fillColor: [0, 74, 159],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { cellWidth: 35 },
                2: { cellWidth: 40 },
                3: { cellWidth: 25 }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 5;
    }


    adicionarAssinatura() {
        this.verificarNovaPagina(80);
        this.doc.setFillColor(0, 74, 159);
        this.doc.rect(this.margemEsquerda, this.posicaoY, this.larguraPagina - 2 * this.margemEsquerda, 8, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Assinatura e Observações', this.margemEsquerda + 3, this.posicaoY + 5.5);
        this.posicaoY += 12;

        const dados = this.dados.assinatura;
        this.doc.autoTable({
            startY: this.posicaoY,
            head: [],
            body: [
                ['Técnico Responsável:', dados.nomeTecnico || '-'],
                ['Contato do Cliente:', dados.contatoCliente || '-'],
                ['Cargo:', dados.cargo || '-'],
                ['E-mail:', dados.email || '-'],
                ['Telefone:', dados.telefone || '-']
            ],
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 60 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: this.margemEsquerda, right: this.margemDireita }
        });

        this.posicaoY = this.doc.lastAutoTable.finalY + 8;

        this.doc.setFontSize(10);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setTextColor(0, 0, 0);
        this.doc.text('Assinatura do Cliente:', this.margemEsquerda, this.posicaoY);
        this.posicaoY += 8;

        if (dados.assinaturaBase64) {
            try {
                this.doc.addImage(
                    dados.assinaturaBase64,
                    'PNG',
                    this.margemEsquerda,
                    this.posicaoY,
                    80,
                    30
                );
                this.posicaoY += 35;
            } catch (erro) {
                console.error('[PDF] Erro ao adicionar assinatura:', erro);
                this.doc.setFontSize(9);
                this.doc.setFont('helvetica', 'italic');
                this.doc.text('(Assinatura não disponível)', this.margemEsquerda, this.posicaoY);
                this.posicaoY += 10;
            }
        } else if (dados.motivoAusenciaAssinatura) {
            this.doc.setFontSize(9);
            this.doc.setFont('helvetica', 'italic');
            this.doc.text(`Motivo da ausência: ${dados.motivoAusenciaAssinatura}`, this.margemEsquerda, this.posicaoY);
            this.posicaoY += 10;
        }

        if (dados.observacoes) {
            this.verificarNovaPagina(30);

            this.doc.setFontSize(10);
            this.doc.setFont('helvetica', 'bold');
            this.doc.text('Observações Finais:', this.margemEsquerda, this.posicaoY);
            this.posicaoY += 6;

            this.doc.setFontSize(9);
            this.doc.setFont('helvetica', 'normal');

            const linhasObs = this.doc.splitTextToSize(
                dados.observacoes,
                this.larguraPagina - 2 * this.margemEsquerda
            );

            this.doc.text(linhasObs, this.margemEsquerda, this.posicaoY);
            this.posicaoY += linhasObs.length * 5;
        }
    }


    verificarNovaPagina(alturaMinima) {
        if (this.posicaoY + alturaMinima > this.alturaPagina - this.margemInferior - 15) {
            this.doc.addPage();
            this.posicaoY = this.margemSuperior;
        }
    }


    traduzirValor(valor) {
        const mapa = {
            'anteprojeto': 'Anteprojeto',
            'executivo': 'Executivo',
            'estudo': 'Estudo',
            'naoIniciada': 'Não iniciada',
            'andamento': 'Em andamento',
            'pausada': 'Pausada',
            'finalizada': 'Finalizada'
        };
        return mapa[valor] || valor || '-';
    }


    traduzirArea(area) {
        const mapa = {
            'engenharia': 'Engenharia',
            'logistica': 'Logística',
            'comercial': 'Comercial',
            'catec': 'CATEC',
            'noc': 'NOC'
        };
        return mapa[area] || area || 'Selecione...';
    }

    limparCNPJ(cnpj) {
        if (!cnpj) return '';
        return cnpj.replace(/[^\d]/g, '');
    }

    verificaExistenciaDoFolderDoClienteNoGed() {
        try {
            const cnpj = this.limparCNPJ($('#txtCNPJ').val());
            const pastaPai = "34353";
            let pastaCliente = null;
            let pastaRDO = null;

            console.log('=== VERIFICAÇÃO DE PASTA GED ===');
            console.log('CNPJ:', cnpj);
            console.log('Pasta Pai:', pastaPai);

            if (!cnpj || cnpj.trim() === '') {
                console.error('CNPJ não informado ou inválido');
                throw new Error('CNPJ não informado ou inválido');
            }

            // ========================================
            // ETAPA 1: Verifica/Cria pasta do cliente
            // ========================================
            console.log('--- Verificando pasta do cliente ---');

            try {
                var datasetCliente = this.buscarDadosDocumentos(pastaPai, cnpj);

                console.log('Dataset Cliente completo:', datasetCliente);

                if (datasetCliente && datasetCliente.values && datasetCliente.values.length > 0) {
                    const registro = datasetCliente.values[0];

                    console.log('Registro encontrado:', registro);
                    console.log('Chaves do registro:', Object.keys(registro));

                    // CORREÇÃO: Tentar múltiplos formatos possíveis
                    if (registro['documentPK.documentId']) {
                        pastaCliente = registro['documentPK.documentId'];
                        console.log('✓ Pasta do cliente encontrada (documentPK.documentId):', pastaCliente);
                    } else if (registro.documentid) {
                        pastaCliente = registro.documentid;
                        console.log('✓ Pasta do cliente encontrada (documentid):', pastaCliente);
                    } else if (registro.documentId) {
                        pastaCliente = registro.documentId;
                        console.log('✓ Pasta do cliente encontrada (documentId):', pastaCliente);
                    } else {
                        console.warn('Dataset retornou dados mas sem documentId reconhecível');
                        console.warn('Registro completo:', JSON.stringify(registro));
                    }
                } else {
                    console.log('Pasta do cliente não encontrada no GED');
                }
            } catch (erroConsulta) {
                console.warn('Erro ao consultar pasta do cliente:', erroConsulta);
            }

            // Se não encontrou, cria pasta do cliente
            if (!pastaCliente) {
                console.log('Criando nova pasta para o cliente...');

                try {
                    var datasetCriarCliente = DatasetFactory.getDataset("ds_createFolder", [cnpj, pastaPai], null, null);

                    console.log('Dataset Criar Cliente:', datasetCriarCliente);

                    if (datasetCriarCliente && datasetCriarCliente.values && datasetCriarCliente.values.length > 0) {
                        const novaPasta = datasetCriarCliente.values[0];

                        console.log('Nova pasta criada:', novaPasta);

                        if (novaPasta.documentid) {
                            pastaCliente = novaPasta.documentid;
                            console.log('✓ Pasta do cliente criada (documentid):', pastaCliente);
                        } else if (novaPasta.documentId) {
                            pastaCliente = novaPasta.documentId;
                            console.log('✓ Pasta do cliente criada (documentId):', pastaCliente);
                        } else if (novaPasta['documentPK.documentId']) {
                            pastaCliente = novaPasta['documentPK.documentId'];
                            console.log('✓ Pasta do cliente criada (documentPK.documentId):', pastaCliente);
                        } else {
                            console.error('Pasta criada mas sem documentId retornado');
                            console.error('Nova pasta completa:', JSON.stringify(novaPasta));
                            throw new Error('Falha ao obter ID da pasta criada');
                        }
                    } else {
                        console.error('Dataset de criação não retornou dados');
                        throw new Error('Falha ao criar pasta do cliente');
                    }
                } catch (erroCriacao) {
                    console.error('Erro ao criar pasta do cliente:', erroCriacao);
                    throw new Error('Não foi possível criar a pasta do cliente: ' + erroCriacao);
                }
            }

            // ========================================
            // ETAPA 2: Verifica/Cria pasta RDO
            // ========================================
            console.log('--- Verificando pasta RDO ---');

            try {
                var datasetRDO = this.buscarDadosDocumentos(pastaCliente, "RDO");

                console.log('Dataset RDO completo:', datasetRDO);

                if (datasetRDO && datasetRDO.values && datasetRDO.values.length > 0) {
                    const registroRDO = datasetRDO.values[0];

                    console.log('Registro RDO encontrado:', registroRDO);

                    if (registroRDO['documentPK.documentId']) {
                        pastaRDO = registroRDO['documentPK.documentId'];
                        console.log('✓ Pasta RDO encontrada (documentPK.documentId):', pastaRDO);
                    } else if (registroRDO.documentid) {
                        pastaRDO = registroRDO.documentid;
                        console.log('✓ Pasta RDO encontrada (documentid):', pastaRDO);
                    } else if (registroRDO.documentId) {
                        pastaRDO = registroRDO.documentId;
                        console.log('✓ Pasta RDO encontrada (documentId):', pastaRDO);
                    } else {
                        console.warn('Dataset RDO retornou dados mas sem documentId reconhecível');
                    }
                } else {
                    console.log('Pasta RDO não encontrada');
                }
            } catch (erroConsultaRDO) {
                console.warn('Erro ao consultar pasta RDO:', erroConsultaRDO);
            }

            // Se não encontrou, cria pasta RDO
            if (!pastaRDO) {
                console.log('Criando nova pasta RDO...');

                try {
                    var datasetCriarRDO = DatasetFactory.getDataset("ds_createFolder", ["RDO", pastaCliente], null, null);

                    console.log('Dataset Criar RDO:', datasetCriarRDO);

                    if (datasetCriarRDO && datasetCriarRDO.values && datasetCriarRDO.values.length > 0) {
                        const novaPastaRDO = datasetCriarRDO.values[0];

                        console.log('Nova pasta RDO criada:', novaPastaRDO);

                        if (novaPastaRDO.documentid) {
                            pastaRDO = novaPastaRDO.documentid;
                            console.log('✓ Pasta RDO criada (documentid):', pastaRDO);
                        } else if (novaPastaRDO.documentId) {
                            pastaRDO = novaPastaRDO.documentId;
                            console.log('✓ Pasta RDO criada (documentId):', pastaRDO);
                        } else if (novaPastaRDO['documentPK.documentId']) {
                            pastaRDO = novaPastaRDO['documentPK.documentId'];
                            console.log('✓ Pasta RDO criada (documentPK.documentId):', pastaRDO);
                        } else {
                            console.error('Pasta RDO criada mas sem documentId retornado');
                            console.error('Nova pasta RDO completa:', JSON.stringify(novaPastaRDO));
                            throw new Error('Falha ao obter ID da pasta RDO criada');
                        }
                    } else {
                        console.error('Dataset de criação RDO não retornou dados');
                        throw new Error('Falha ao criar pasta RDO');
                    }
                } catch (erroCriacaoRDO) {
                    console.error('Erro ao criar pasta RDO:', erroCriacaoRDO);
                    throw new Error('Não foi possível criar a pasta RDO: ' + erroCriacaoRDO);
                }
            }

            // ========================================
            // RETORNO FINAL
            // ========================================
            console.log('=== RESULTADO FINAL ===');
            console.log('Pasta Cliente:', pastaCliente);
            console.log('Pasta RDO:', pastaRDO);
            console.log('========================');

            if (!pastaRDO) {
                throw new Error('Não foi possível obter ou criar a pasta RDO');
            }

            return pastaRDO;

        } catch (erro) {
            console.error('=== ERRO GERAL NA VERIFICAÇÃO ===');
            console.error('Mensagem:', erro.message || erro);
            console.error('Stack:', erro.stack);

            FLUIGC.toast({
                title: 'Erro',
                message: 'Erro ao verificar/criar pastas no GED: ' + (erro.message || erro),
                type: 'danger',
                timeout: 5000
            });

            return null;
        }
    }

    buscarDadosDocumentos(idPai, nomePastaFilho) {
        console.log("ENTREI NO DATASET BUSCANDO A PASTA: " + idPai + "; " + nomePastaFilho);
        var c1 = DatasetFactory.createConstraint("parentDocumentId", idPai, idPai, ConstraintType.MUST);
        var c2 = DatasetFactory.createConstraint("deleted", false, false, ConstraintType.MUST);
        var c3 = DatasetFactory.createConstraint("activeVersion", true, true, ConstraintType.MUST);
        var c4 = DatasetFactory.createConstraint("documentDescription", nomePastaFilho, nomePastaFilho, ConstraintType.MUST);
        var c5 = DatasetFactory.createConstraint('userSecurityId', 'adm', 'adm', ConstraintType.MUST);
        var c6 = DatasetFactory.createConstraint("documentType", "1", "1", ConstraintType.MUST)
        var sortingFields = new Array("documentDescription");
        var constraints = new Array(c1, c2, c3, c4, c5, c6);
        var resultado = DatasetFactory.getDataset("document", null, constraints, sortingFields);
        console.log("RESULTADO");
        console.log(resultado);
        return resultado;
    }

    createDocument(parentId, folderDescription, file) {
        try {
            var constraintDsCreateDoc1 = DatasetFactory.createConstraint(parentId, '100', '100', ConstraintType.MUST);
            var constraintDsCreateDoc2 = DatasetFactory.createConstraint(folderDescription, '100', '100', ConstraintType.MUST);
            var constraintDsCreateDoc3 = DatasetFactory.createConstraint(file, '100', '100', ConstraintType.MUST);
            var constraintDsCreateDoc4 = DatasetFactory.createConstraint('userSecurityId', 'pvt.consultoria', 'pvt.consultoria', ConstraintType.MUST);
            var filter = new Array(constraintDsCreateDoc1, constraintDsCreateDoc2, constraintDsCreateDoc3, constraintDsCreateDoc4);
            var datasetDsCreateDoc = DatasetFactory.getDataset('dsAttachFile', null, filter, null);
            return datasetDsCreateDoc.values[0].IdDoc;
        } catch (err) {
            swalError(err);
            return false;
        }
    }

    async popularGed() {
        try {
            const documentIdPastaPai = this.verificaExistenciaDoFolderDoClienteNoGed();

            if (!documentIdPastaPai) {
                throw new Error('Não foi possível obter a pasta de destino no GED');
            }

            // ========================================
            // ETAPA 1: Enviar o PDF do relatório
            // ========================================
            if (this.pdfGerado && this.pdfGerado.base64) {
                try {
                    var datasetPDF = DatasetFactory.getDataset("ds_createDocument", [this.pdfGerado.nome, this.pdfGerado.base64, String(documentIdPastaPai)], null, null);

                    if (datasetPDF && datasetPDF.values && datasetPDF.values.length > 0) {
                        $('#documentidRelatorioGed').val(datasetPDF.values[0].codDocumento)
                    } else {
                        throw new Error('Falha ao enviar PDF do relatório: ' + erroPDF);
                    }
                } catch (erroPDF) {
                    throw new Error('Falha ao enviar PDF do relatório: ' + erroPDF);
                }
            } else {
                throw new Error('PDF não foi gerado ou não está disponível para envio');
            }

            // ========================================
            // ETAPA 2: Enviar os anexos (evidências)
            // ========================================
            var anexos = this.imagensGed;

            if (anexos && anexos.length > 0) {
                console.log(`[GED] Enviando ${anexos.length} anexo(s)...`);

                for (let i = 0; i < anexos.length; i++) {
                    var urlAnexo = anexos[i].url;
                    var nomeAnexo = anexos[i].nome;

                    console.log(`[GED] Processando anexo ${i + 1}/${anexos.length}: ${nomeAnexo}`);

                    try {
                        var anexoBase64 = await this.converterAnexoParaBase64(urlAnexo);

                        if (anexoBase64) {
                            var datasetAnexo = DatasetFactory.getDataset("ds_createDocument", [nomeAnexo, anexoBase64, String(documentIdPastaPai)], null, null);

                            if (datasetAnexo && datasetAnexo.values && datasetAnexo.values.length > 0) {
                                console.log(`Anexo ${i + 1} enviado: ${nomeAnexo}`);
                            } else {
                                throw new Error(`Falha ao enviar o anexo ${i + 1}`);
                            }
                        } else {
                            throw new Error(`Falha ao enviar o anexo ${i + 1}`);
                        }
                    } catch (erroAnexo) {
                        throw new Error(`Falha ao enviar o anexo ${i + 1}`);
                    }
                }

            }

            // ========================================
            // FEEDBACK FINAL
            // ========================================
            FLUIGC.toast({
                title: 'Sucesso',
                message: 'PDF e anexos enviados para o GED com sucesso!',
                type: 'success',
                timeout: 5000
            });

        } catch (error) {

            FLUIGC.toast({
                title: 'Erro',
                message: 'Erro ao enviar arquivos para o GED: ' + (error.message || error),
                type: 'danger',
                timeout: 5000
            });

            throw error;
        }
    }

    async converterAnexoParaBase64(url) {
        return new Promise((resolve) => {
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64Completo = reader.result;
                        const base64Puro = base64Completo.split(',')[1];
                        resolve(base64Puro);
                    };
                    reader.onerror = () => {
                        console.error('[GED] Erro ao ler blob como base64');
                        resolve(null);
                    };
                    reader.readAsDataURL(blob);
                })
                .catch(error => {
                    console.error('[GED] Erro ao buscar anexo:', error);
                    resolve(null);
                });
        });
    }
}

async function gerarPDFdoFormulario() {
    try {
        const gerador = new GeradorPDF_RDO();
        await gerador.inicializar();
        await gerador.gerarPDF();
        await gerador.popularGed();

        return true;
    } catch (erro) {
        console.error('[PDF] Erro ao gerar PDF:', erro);
        alert('Erro ao gerar PDF: ' + erro.message);
        return false;
    }
}