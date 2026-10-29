//var movimiento;
//
//function nuevoMovimiento(){
//	movimiento.dialog('open');
//}
var caja = null;
var CD_MONEDA_DOLAR = "2";
var config = {
	init: function(){
		config.initDatePicker();
		$jqfp("#advertemciaEnvioSMSpopup").dialog({
			autoOpen: false,
			modal: true,
	        width: "400",
			title: "Envío Recibo Electrónico",
			buttons: {"Aceptar": function(data) {
						$jqfp(this).dialog('close');
					}
			}
		});
	},
	 initDatePicker: function(){
	        $jqfp('.datepicker').datepicker({
	            changeMonth: true,
	            changeYear: true,
	            dateFormat: "dd/mm/yy",
	            minDate:-1825
	        });
	    }
};

var deudaCliente = {
		mostrarPopup: function() {
			if ($jqfp("#abrirPPDeudaCliente").val() == "true") {
				$jqfp("#ppListadoInformeDeuda").dialog({
					modal: true,
					width: "60%",
					title: $jqfp("#tituloDeudaCliente").val(),
					appendTo: "#page-wrapper",
					buttons: {"Cerrar": function(data) {
								limpiarBusquedaPoliza();
								$jqfp(this).dialog('close');
							}
					}
				});
			}
		}
};

function mostrarDetalleLote(basePath, compania, ingreso, lote) {
	window.location.href = basePath + '/StrutsJsfServlet?beanName=lotesPorIngresoBean&method=lotesPorIngreso&compania=' + compania + '&ingreso=' + ingreso + '&lote=' + lote;
}

function mostrarMensajeAdvertenciaCierreLote(basePath, compania, ingreso, lote) {
	var mensajeAdvertenciaCierreLoteDialog = $jqfp("#mensajeAdvertenciaCierreLote").dialog({
		autoOpen: true,
		modal: true,
		height: "auto",
        width: "40%",
		title: "Advertencia!",
		buttons: {"Aceptar": function(data) {
					mostrarDetalleLote(basePath, compania, ingreso, lote);
				}
		}
	});
}

function mostrarListadoMails() {
	$jqfp("#advertemciaEnvioSMSpopup").dialog('open');
}

function setFocus2Component(idComponent2Focus) {
	document.getElementById(idComponent2Focus).childNodes[0].focus();
}

function generarRegistroCaja(){
	var aPagar = $jqfp('#totalAPagar').html(),
	    nroCuotaImp = $jqfp('#nroCuotaImpagaSel').val(),
	    endosoCuotaImp = $jqfp('#endosoCuotaImpagaSel').val(),
	    cuotaId = $jqfp('#cuotaImpagaSel').val(),
	    tasaCambio = ($jqfp('#tasaCambioPagarCuota').val() ? parseFloat($jqfp('#tasaCambioPagarCuota').val()) : 0);
	genRegCajaInd(nroCuotaImp, endosoCuotaImp, aPagar, tasaCambio);
}

function validarCuotaSel(){
	var aPagar = $jqfp('#totalAPagar').html();
	var ok = true;
	if (aPagar === ""){
		modalB.show("warning", "Caja", "Debe seleccionar una cuota", 
		        [{
		             text: "Aceptar", 
		             cerrar: true, 
		             claseCss: "hierarchy_1"
		          }]);
		ok = false;
	}
	return ok;
}

function genTablaCaja(jsonResponse, msj) {
	var jsonObject = JSON.parse(jsonResponse);
	console.log(jsonObject);
	if (msj == ""){
		if(jsonObject.codMsj == "S"){
			var source   = $jqfp("#self-plan-de-pago-template").html();
 			var template = Handlebars.compile(source);
 			var content = template(jsonObject);
			$jqfp("#cuotasImpagasContenido").html(content);
			$jqfp("#tasaCambioPagarCuota").inputmask("9999.99", { "placeholder": "*" }); //INC-7640 - INC-15466
			var cdMoneda = $jqfp("#cdMoneda").val();
            if (cdMoneda == CD_MONEDA_DOLAR) {
                $jqfp("#tasaCambioCont").removeClass("hidden"); }
            responsiveTables2();

 			caja.dialog('open');
		}	
			else{
				jqUiDialog.showAlert("No puede abonar", jsonObject.textoMsj);
			}
	}	
}

function setCompletedCaja() {
	if($jqfp("#mostrarCajaComplete").val() === "true"){
		caja.dialog("close");
		//$jqfp("#cajaSpr").css("display", true);
		$jqfp("#moduloCajaLnk").css("display", true);
	}
}

$jqfp(function() {
	config.init();
	caja = $jqfp("#cuotasImpagas").dialog({
		autoOpen: false,
		modal: true,
		height: "auto",
	    width: "60%",
		title: "Caja",
		buttons : {
			"Pagar" : function(data){
				if(validarCuotaSel()){
					generarRegistroCaja();
				}
				caja.dialog("close");
			},
			"Cancelar" : function(){
				caja.dialog("close");
			}
		}
	});
});
