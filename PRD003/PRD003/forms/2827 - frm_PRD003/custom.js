/*$(function () {
    pupularSelects();
});

function pupularSelects() {
    var tipos = new Array({
        tipo: 'funcionario', campo: 'nomeFuncionario'
    }, {
        tipo: 'operacao', campo: 'operacao'
    });

    for (var i = 0; i < tipos.length; i++) {
        $('#' + tipos[i].campo).empty();
        
        var c1 = DatasetFactory.createConstraint("Tipo", tipos[i].tipo, tipos[i].tipo, ConstraintType.MUST);
        var dataset = DatasetFactory.getDataset("ds_consultar_table_PRD003", null, [c1], null);

        for (var j = 0; j < dataset.values.length; j++) {
            $('#' + tipos[i].campo).append(new Option(dataset.values[j].Texto));
        }
    }

}*/