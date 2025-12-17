// ==UserScript==
// @name         TOTVS Fluig - Auto Demo Mode
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Pular o modo demonstração do Fluig
// @author       Você
// @match        http://192.168.0.6:8080/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log('=== Fluig Auto Demo ===');

    const urlAtual = location.href;
    const CHAVE_REFRESH = 'fluig_refresh_portal_home';

    if (urlAtual.includes('/portal/home')) {

        // Verifica se já deu refresh na url
        const jaRefreshou = sessionStorage.getItem(CHAVE_REFRESH) === urlAtual;

        if (!jaRefreshou) {
            console.log('/portal/home detectado - dando refresh...');
            sessionStorage.setItem(CHAVE_REFRESH, urlAtual);
            location.reload();
            return;
        }

        console.log('Refresh já feito em /portal/home - processando demo...');
    }

    function processarDemo() {
        if (typeof $ === 'undefined') {
            setTimeout(processarDemo, 100);
            return;
        }

        const botaoDemo = $('#btDemo');
        const formulario = $('#frmcd');

        if (botaoDemo.length > 0 && formulario.length > 0) {
            console.log('Modal encontrado - ativando demo!');

            botaoDemo.click();
            formulario.attr("action", "/portal/api/servlet/license.do?demo=true");
            formulario.submit();

            sessionStorage.removeItem(CHAVE_REFRESH);

            return true;
        }

        return false;
    }

    // Tenta processar continuamente
    let tentativas = 0;
    const intervalo = setInterval(function() {
        if (processarDemo() || tentativas > 200) {
            clearInterval(intervalo);
        }
        tentativas++;
    }, 100);

    // Monitora mudanças de URL
    let urlAnterior = location.href;
    setInterval(function() {
        const urlNova = location.href;

        if (urlNova !== urlAnterior) {
            console.log('URL mudou de', urlAnterior, 'para', urlNova);

            if (urlAnterior.includes('/portal/home') && !urlNova.includes('/portal/home')) {
                console.log('Saiu de /portal/home - limpando flag');
                sessionStorage.removeItem(CHAVE_REFRESH);
            }

            urlAnterior = urlNova;
        }
    }, 500);

})();