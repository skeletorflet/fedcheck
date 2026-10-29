/* Deberian eliminarse las funciones que no se utilizan (estan marcadas)
comun.js (scripts comunes a varios archivos) Requiere general.js
validar_patente: valida patente nuevas, viejas y de motos
*/
	var ajax_validar_motor_y_chasis_merlin = null;
	var PATH;

	/**
	 * Abre el calendario asociado a input determinado por name
	 */
	function display_calendar_name(name, format, object) {
		var input = document.getElementsByName(name)[0];
		displayCalendar(input, format, object)
	}
	
	//--------------------- MANEJO DE FECHAS ------------------------
	
	function obtenerMesAnterior(mes){
		if(mes>10){
			return (mes-1);
			}
		if(mes>1){
			var mesAux="0"+(mes-1);
			return (mesAux);
			}
		else
			return 12;
		}
	
	//setearFechasIni: Se le pasan como parametro los id de dos campos input de fechas y setea en uno la fecha actual
						//y en el otro la fecha actual menos 1 mes.
	function setearFechasIni(fechaDesde,fechaHasta){
		var fecha=loadFechaActual();
		var diames=fecha.getDate();
		var mes=fecha.getMonth() +1 ;
		var ano=fecha.getFullYear();
		var mesAnt=obtenerMesAnterior(mes);	
		var fechaFin=diames + "/" + mes + "/" + ano;
		var fechaIni=diames + "/" + mesAnt + "/" + ano;
		if(mes<10){
			mes = "0"+ mes
			}
		if(diames<10){
			diames = "0"+diames 
		}
		if(mesAnt<10 && !mesAnt==2){
			mesAnt = "0"+mesAnt;
		}
		fechaFin = diames + "/" + mes + "/" + ano;
		fechaIni = diames + "/" + mesAnt + "/" + ano;
		if(mesAnt==12){
			fechaIni=diames + "/" + (mesAnt) + "/" + (ano-1);
		}
		if((mesAnt==02)&&(diames>28)){
			fechaIni="28" + "/" + (mesAnt) + "/" + ano;
		} 
		document.getElementById(fechaHasta).value=fechaFin;
		document.getElementById(fechaDesde).value=fechaIni;	
	}

	function comprobarSiBisisesto(anio){
        return (anio % 100 != 0) && ((anio % 4 == 0) || (anio % 400 == 0));
    }
	
	//esFechaValida: valida que la fecha pasada como parametro cumpla los parametros de dd/mm/aaaa
	function esFechaValida(fecha){
        if (fecha != undefined && fecha.value != "" ){
            if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fecha.value)){
                alert("Formato de fecha no v�lido (dd/mm/aaaa)");
                return false;
            }
            var dia  =  parseInt(fecha.value.substring(0,2),10);
            var mes  =  parseInt(fecha.value.substring(3,5),10);
            var anio =  parseInt(fecha.value.substring(6),10);
     
	        switch(mes){
	            case 1:
	            case 3:
	            case 5:
	            case 7:
	            case 8:
	            case 10:
	            case 12:
	                numDias=31;
	                break;
	            case 4: case 6: case 9: case 11:
	                numDias=30;
	                break;
	            case 2:
	                if (comprobarSiBisisesto(anio)){ numDias=29; }else{ numDias=28;};
	                break;
	            default:
	                alert("Fecha introducida err�nea");
	                return false;
        	}  
            if (dia>numDias || dia==0){
                alert("Fecha introducida err�nea");
                return false;
            }
            return true;
        }
        else{
        	alert("Campo de fecha vac�o");
        	return false;
        	}
    }
	//---------------------- FIN MANEJO DE FECHAS -----------------------

//--------------------------- FUNCIONES COMUNES A TODO LO QUE INVOLUCRE COTIZAR ----------------------//

	function is_tipo_vehiculo_sin_patente(tipoVehiculo) {
		var tiposVehiculosSinPatente = [91,92,93,94];
		var isTipoVehiculoSinPatente = false;
		var i = 0;
		while (!isTipoVehiculoSinPatente && i < tiposVehiculosSinPatente.length){
			isTipoVehiculoSinPatente = (tipoVehiculo == tiposVehiculosSinPatente[i]);
			i++;
		}
		return isTipoVehiculoSinPatente;
	}

	function is_tipo_vehiculo_patente_moto(tipoVehiculo) {
		var tiposVehiculosPatenteMoto = [95,96,195,196,197,198];
		var isTipoVehiculoPatenteMoto = false;
		var i = 0;
		while (!isTipoVehiculoPatenteMoto && i < tiposVehiculosPatenteMoto.length){
			isTipoVehiculoPatenteMoto = (tipoVehiculo == tiposVehiculosPatenteMoto[i]);
			i++;
		}
		return isTipoVehiculoPatenteMoto;
	}

	/*validar_patente_vehiculo: Valida que sea una patente valida para el tipo de vehiculo o que sea E/T en caso de que sea
							un vehiculo del an�o en curso*/
	function validar_patente_vehiculo(patente, anio, tipo) {
		//Valida si puede ser cero km
		var now = loadFechaActual();
		//now.getYear() retorna la cantidad de a�os desde el 1900. IE retorna, por ej. 2006 en lugar de 106 como dice el estandar
		var ceroKm = (now.getFullYear() == anio.value);
		//Si es 0km y es patente en tramite(E/T), es valido
		var ok = ceroKm && is_patente_en_tramite(patente.value);
		if (!ok) {
			//Valida que sea un formato correcto de patente
			ok = validar_patente(patente, tipo.value, anio.value);
		}
		return ok;
	}
	
/*is_patente_en_tramite: Retorna true si la patente es E/T*/
	function is_patente_en_tramite(patente) {
		var pte = patente.trim().toUpperCase();
		return (pte == 'E/T');
	}
/*is_like_patente_en_tramite: Retorna true si la patente incluye el string E/T*/
	function is_like_patente_en_tramite(patente) {
		var pte = patente.trim().toUpperCase();
		var en_tramite = (pte.indexOf('E/T') != -1);
		return en_tramite;
	}

var patenteValidator = (function(){
	// constructor
	var cls = function() {
		var patenteValida = false;
		this.isPatenteValida = function() {
			return patenteValida;
		};
		this.setPatenteValida = function(value) {
			patenteValida = value;
		};
	};
	
	// public static
	cls.prototype = {
			validarFormatoPatente : function(patente, tipoVehiculo, anio) {
				var req = ajaxHelper.getHttpReq(),
					url = basepath + "administrarVehiculo.do?method=validarFormatoPatente" +
							"&patente=" + patente.value + 
							"&tipoVehiculo=" + tipoVehiculo + 
							"&anio=" + anio;
				req.open("GET", url, false); //false => sincr�nico
				/* @lvalenti -----FIX PARA DETECTAR PETICIONES AJAX -----*/
				req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
				req.send();

				// Procesar respuesta
				var ea = null;
				if (req.responseText) {
					try {
						ea = JSON.parse(req.responseText);
					} catch (e) {
						if (console) {
							console.info("No se pudo parsear la respuesta.");
						};
					};
				};
				if (ea) {
					this.setPatenteValida(ea.valida);
					if (!ea.valida) {
						ea.mensaje = ea.mensaje.replace('<br>', '');
						modalB.show("warning", "Error", ea.mensaje,
								[
								 {
									 text: "Aceptar", 
									 cerrar: true, 
									 claseCss: "hierarchy_1"
								 	}
								 ]);
//						Dialog.alert(patente, ea.mensaje,
//			   		    		 {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			   			      					     width:200, height:100, resizable:false, minimizable:false, maximizable:false}, 
//			   		    	       				     okLabel: "Aceptar"});
					} else {
						//Dialog.closeInfo();
					}
				};
			}
	};
	
	return cls;
})();

/* validar_patente: valida patente nuevas, viejas y de motos */
function validar_patente(patenteInput, tipo, anio){
//	showLoadingBar(true);
	var value = false,
	pv = new patenteValidator();
	pv.validarFormatoPatente(patenteInput, tipo, anio);
	value = pv.isPatenteValida();
	
//	  if (!is_tipo_vehiculo_sin_patente(tipo)) {
//	  	Requiere validacion de patente
//	      longi = patente.length;
//	      value = (longi >= 6) && (longi <= 8);
//	      if (is_tipo_vehiculo_patente_moto(tipo)) {
//	        value = (value && (longi == 6));
//	        numero = patente.substring(0,3);
//	        letras = patente.substring(3,6);
//	      } else {
//	        if (longi == 6) {
//	          numero = patente.substring(3,6);
//	          letras = patente.substring(0,3);
//	        } else {
//	          numero = patente.substring(1,longi);
//	          letras = patente.substring(0,1);
//	        }
//	      }
//	      value = (value && validar_numero(numero,'0123456789'));
//	      value = (value && validar_letras(letras));
//	      if (!value) {
//	  		Dialog.alert(field, "Patente inv�lida",
//	  		    		 {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//	  			      					     width:200, height:100, resizable:false, minimizable:false, maximizable:false}, 
//	  		    	       				     okLabel: "Aceptar"});      
//	      }
//	  } else {
//	  	//No requiere validacion de patente
//	  	value = true;
//	  }
	  return value;
	}

/*obtener_valor: Obtiene el valor del item seleccionado en el combo*/
	function obtener_valor(combo) {
		var index = combo.selectedIndex;
		descripcion = combo.options[index].text;
		//Parsea el string para obtener el monto
		var ini = descripcion.indexOf('($');
		//Busca el ) desde la posicion inicial del $, por si hay otro ) antes
		var fin = ini + descripcion.substring(ini+2).indexOf(')');
		var value = '';
		if (ini > -1) {
			value = descripcion.substring(ini+2, fin+2);
		}
		return value;
	}

/*obtener_descripcion: Obtiene la descripcion del item seleccionado en el combo(sin el monto)*/
	function obtener_descripcion(combo) {
		var index = combo.selectedIndex;
		descripcion = combo.options[index].text;
		//Parsea el string para obtener el monto
		var ini = descripcion.indexOf('($');
		var value = '';
		if (ini > -1) {
			value = descripcion.substring(0, ini);
		}
		return value;
	}

/*hide_show_element_change_image: Oculta o muestra el componente correspondiente y cambia la imagen del icono*/
	function hide_show_element_change_image(name, imageName) {
		var element = $(name);
		var image = $(imageName);
		var display = element.style.display;
		if (display == 'none') {
			element.style.display = '';
			image.src = basepath + "/images/menos.gif";
		} else {
			element.style.display = 'none';
			image.src = basepath + "/images/mas.gif";
		}
	}

/*change_current_tab: Cambia el tab que esta seleccionado*/
	function change_current_tab(source) {
		$('ajaxCurrentTab').id = '';
		source.id = 'ajaxCurrentTab';
	}


/**
 * Retorna TRUE si se debe validar la suma asegurada dependiendo del plan de cobertura
 */
	function valida_suma_asegurada(planCobertura) {
		return !((planCobertura == 'A') || (planCobertura == 'A1') || (planCobertura == 'A2') || (planCobertura == 'A4')
					|| (planCobertura == 'CS') || (planCobertura == 'CS1') || (planCobertura == 'CS2'));
	}

/**
 * Se elimino la restriccion del importe de accesorios (01/06/2009)
 * Valida que el importe de los accesorios no sea superior al 25% de la suma asegurada
 */
	function validar_importe_accesorios(importeAccesorio, sumaAsegurada) {
		var importe_accesorios = parseInt(importeAccesorio.value);
		var suma_asegurada = parseInt(sumaAsegurada.value);
		var ok = true; //(importe_accesorios <= (suma_asegurada * 0.25));
		if (!ok) {
	      	Dialog.alert(null, 'El importe de los accesorios no puede ser superior al 25% de la suma asegurada.',
			      		{windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
			   								width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
				    	       				okLabel: "Aceptar"}); 		
		}
		return ok;
	}

/**
 * Valida que la suma asegurada no este fuera de los limites permitidos segun el valor del vehiculo(depende del anio).
 */
	function validar_suma_asegurada(sumaAsegurada, combo, is_tipo_vehiculo_descripcion_riesgo, limite_minimo_no_modificable, limite_maximo_no_modificable, porcentaje_suma_asegurada_minimo, porcentaje_suma_asegurada_maximo) {
		var ok = false;
		var costo_vehiculo = 0;
		if (combo.selectedIndex > 0) {
			costo_vehiculo = parseInt(obtener_valor(combo));
		}
		return validar_suma_asegurado_comun(sumaAsegurada, costo_vehiculo, is_tipo_vehiculo_descripcion_riesgo, limite_minimo_no_modificable, limite_maximo_no_modificable, porcentaje_suma_asegurada_minimo, porcentaje_suma_asegurada_maximo);
	}

	/**
	 * Metodo comun para invocar desde renovacion y desde emision, endoso y cobertura
	 * @param suma_asegurada
	 * @param costo_vehiculo
	 * @param is_tipo_vehiculo_descripcion_riesgo
	 * @param limite_minimo_no_modificable
	 * @param limite_maximo_no_modificable
	 * @returns
	 */
	function validar_suma_asegurado_comun(sumaAsegurada, costo_vehiculo, is_tipo_vehiculo_descripcion_riesgo, limite_minimo_no_modificable, limite_maximo_no_modificable, porcentaje_suma_asegurada_minimo, porcentaje_suma_asegurada_maximo) {
		var ok = false;
		var suma_asegurada = parseInt(sumaAsegurada.value);
		var costo_superior = Math.round(costo_vehiculo + (costo_vehiculo * porcentaje_suma_asegurada_maximo / 100 ));//100% Cambio 5354
		var costo_inferior = Math.round(costo_vehiculo - (costo_vehiculo * porcentaje_suma_asegurada_minimo / 100));//-10% RSF-25240
		//Si el tipo de vehiculo es descripcion riesgo, permite modificar la suma asegurada hasta un 100% mas
		if (is_tipo_vehiculo_descripcion_riesgo) {
			costo_superior = costo_vehiculo * 2;
			costo_inferior = 1; //Se pueden utilizar planes con casco, por lo que la suma no puede ser 0 #Levas 21207
		}
		//Si el costo del vehiculo esta entre 500000 y 550000 no permite cambiar la suma (Cambio #4060)
		if ((costo_vehiculo >= limite_minimo_no_modificable) && (costo_vehiculo <= limite_maximo_no_modificable)) {
			//costo_superior = costo_vehiculo;
			costo_inferior = limite_minimo_no_modificable;
		}
		if (costo_inferior == 0 ) {
			costo_inferior = 1;
		}
		ok = (suma_asegurada >= costo_inferior) && (suma_asegurada <= costo_superior);
		if (!ok)  {
			var mensaje = ((costo_vehiculo == costo_inferior) && (costo_vehiculo == costo_superior))
																? 'No se puede modificar la suma asegurada del veh�culo'
																: 'La Suma Asegurada debe ser superior a $' + costo_inferior + ' e inferior a $' + costo_superior;
			modalB.show("warning", "Advertencia", mensaje,
					[
					 {
						 text: "Aceptar", 
						 cerrar: true, 
						 claseCss: "hierarchy_1"
					 	}
					 ]);
//	      	Dialog.alert(sumaAsegurada, mensaje,
//			      		{windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			   								width:300, height:100, resizable:false, minimizable:false, maximizable:false}, 
//				    	       				okLabel: "Aceptar"});
		}
		return ok;
	}
/**
 * Valida que los nombres de las localidades sean iguales
 */
	function validar_localidad(nombreLocalidad1, nombreLocalidad2) {
		var ok = nombreLocalidad1.value.equalsIgnoreCase(nombreLocalidad2.value);
		if (!ok) {
//	      	Dialog.alert(nombreLocalidad1, 'Debe seleccionar una localidad de la lista',
//			      		{windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			   								width:300, height:100, resizable:false, minimizable:false, maximizable:false}, 
//				    	       				okLabel: "Aceptar"}); 	
	      	alert('Debe seleccionar una localidad de la lista');
	      	$(nombreLocalidad1).focus();
		}
		return ok;
	}

//--------------------------- FIN FUNCIONES COMUNES A TODO LO QUE INVOLUCRE COTIZAR ----------------------//

//------------------------- ESTAS FUNCIONES NO DEBERIAN BORRARSE. VERIFICAR QUE NO SE USEN ------------------------//

/* validar_sumaAsegurada: valida que la suma no supere o infiera un 10% del valor v�lido */
  function validar_sumaAsegurada(){
    if (validar_float(document.callform.sumaAsegurada,'Suma Asegurada')) {
      if ((document.callform.sumaAseguradaOriginal.value * 1.20) < (document.callform.sumaAsegurada.value * 1)){
		Dialog.alert(document.callform.sumaAsegurada, 
					 "La suma asegurada no puede ser superior al 20% del valor anterior",
		    		 {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
			      					     width:300, height:100, resizable:false, minimizable:false, maximizable:false}, 
		    	       				     okLabel: "Aceptar"});      
//        alert("La suma asegurada no puede ser superior al 20% del valor anterior");
        document.callform.sumaAsegurada.value = document.callform.sumaAseguradaOriginal.value;
//        document.callform.sumaAsegurada.focus();
        return (false);
      }
      else if ((document.callform.sumaAsegurada.value * 1) < document.callform.sumaAseguradaOriginal.value * 0.80){
		Dialog.alert(document.callform.sumaAsegurada, 
					 "La suma asegurada no puede ser inferior al 20% del valor anterior",
		    		 {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
			      					     width:300, height:100, resizable:false, minimizable:false, maximizable:false}, 
		    	       				     okLabel: "Aceptar"});      
//        alert("La suma asegurada no puede ser inferior al 20% del valor anterior");
        document.callform.sumaAsegurada.value = document.callform.sumaAseguradaOriginal.value;
//        document.callform.sumaAsegurada.focus();
        return (false);
      }
      return (true);
    }
    else return(false);
  }

/* validar_premio: valida que el premio dea un n�mero v�lido */
  function validar_premio(){
    value = (validar_float(document.callform.premioProd,'Premio propio'));
    return (value);
  }

/* informe_inspeccion: abre la ventana para llenar el informe de inspecci�n*/
  function informe_inspeccion(tipo){
    if ((tipo != null) && (tipo != '')) tipo = 'tipo=' + tipo + '&';
	else tipo = '';
    var url = basepath+"renovacion/InformeInspeccion.jsp?"+tipo+"Observaciones='" + document.callform.observaciones.value + "'";
    window.open(url, '', 'width=500,height=400,status=no,scrollbars=1,resizable=yes,top=0,left=50');  
  }

/* show_modelos: abre la ventana para elegir el modelo */
  function show_modelos() {
	document.callform.codigoModelo.value = '';
    document.callform.nombreModelo.value = '';
    document.callform.anio.value = '';
    document.callform.motor.value= '';
    document.callform.chasis.value= '';
    document.callform.patente.value= '';
    document.callform.tipoVehiculo.value = '';
    document.callform.descripcionTipo.value = '';
    document.callform.marca.value = document.callform.codigoMarca.options[document.callform.codigoMarca.selectedIndex].value;
    url = basepath+'renovacion/ModeloSelector.jsp?marca=' + document.callform.codigoMarca.options[document.callform.codigoMarca.selectedIndex].value + '&codigoModelo=&nombreModelo=';
    window.open(url, '', 'width=400,height=450,status=no,scrollbars=1,resizable=yes,top=100,left=200');
  }

/* show_anios: abre la ventana para elegir el a�o */
  function show_anios() {
    if (document.callform.codigoModelo.value != ""){
    	document.callform.anio.value = '';
    	url = basepath+'renovacion/AnioSelector.jsp?marca=' + document.callform.codigoMarca.options[document.callform.codigoMarca.selectedIndex].value + '&modelo='+document.callform.codigoModelo.value;
		window.open(url, '', 'width=250,height=300,status=no,scrollbars=1,resizable=yes,top=100,left=200');
    }
    else Dialog.alert(null, "Complete los datos de marca y modelo",
		    		 {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
			      					     width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
		    	       				     okLabel: "Aceptar"});  
//    alert("Complete los datos de marca y modelo");
  }

/* show_tipos: abre la ventana para elegir el tipo */
  function show_tipos() {
    document.callform.tipoVehiculo.value = '';
    document.callform.descripcionTipo.value = '';
    url = basepath+'renovacion/TipoSelector.jsp?marca=' + document.callform.codigoMarca.options[document.callform.codigoMarca.selectedIndex].value + '&modelo='+document.callform.codigoModelo.value;
    window.open(url, '', 'width=500,height=300,status=no,scrollbars=1,resizable=yes,top=100,left=200');
  }

/* show_ciudades: abre la ventana para elegir ciudades */
  function show_ciudades4(codigo,nombre,query,formname) {
    url = basepath+'comun/ciudadSelector.jsp?codigo=' + codigo + '&nombre=' + nombre + '&query=' + query + '&formname=' + formname;
    window.open(url, '', 'width=450,height=450,status=no,scrollbars=1,resizable=yes,top=50,left=200');
  }

  function show_ciudades3(codigo,nombre,query) {
    show_ciudades4(codigo,nombre,query,'self.opener.document.callform');
  }
  
  function show_ciudades2(codigo,nombre) {
    show_ciudades3(codigo,nombre,'ciudades.sql');
  }
  
  function show_ciudades() {
    show_ciudades2('codigoLocalidad','nombreLocalidad');
  }

/* show_ciudades_zonas: abre la ventana para elegir ciudades con zonas de riesgo*/
  function show_ciudades_zonas4(codigo,nombre,query,formname) {
    url = basepath+'comun/ciudadZonaSelector.jsp?codigo=' + codigo + '&nombre=' + nombre + '&query=' + query + '&formname=' + formname;
    window.open(url, '', 'width=450,height=450,status=no,scrollbars=1,resizable=yes,top=50,left=200');
  }
  
  function show_ciudades_zonas3(codigo,nombre,query) {
    show_ciudades_zonas4(codigo,nombre,query,'self.opener.document.callform');
  }
  
  function show_ciudades_zonas2(codigo,nombre) {
    show_ciudades_zonas3(codigo,nombre,'ciudadesZonas.sql');
  }
  
  function show_ciudades_zonas() {
    show_ciudades_zonas2('codigoLocalidad','nombreLocalidad');
  }

/* set_suma: setea las sumas aseguradas */
  function set_suma(valor){
    document.callform.sumaAsegurada.value = valor;
    document.callform.sumaAseguradaOriginal.value = valor;
  }

/* locate_marca: setea la marca de acuerdo con el c�digo ingresado */
  function locate_marca(){
    locate(document.callform.codigoMarca,document.callform.marca.value);
    show_modelos();
  }

/* locate_marca_modelo: setea la marca y el modelo de acuerdo con el c�digo ingresado */
  function locate_marca_modelo(){
    if (document.callform.codigoVehiculo.value.length == 5){
    	marca = document.callform.codigoVehiculo.value.substr(0,2);
    	modelo = document.callform.codigoVehiculo.value.substr(2,5) * 1;
		document.callform.codigoModelo.value = modelo;
		document.callform.marca.value = marca;
		locate(document.callform.codigoMarca,document.callform.marca.value);
    	document.callform.nombreModelo.value = '';
		document.callform.anio.value = '';
    	document.callform.tipoVehiculo.value = '';
		document.callform.descripcionTipo.value = '';
	   	document.callform.marca.value = document.callform.codigoMarca.options[document.callform.codigoMarca.selectedIndex].value;
		url = basepath+'renovacion/ModeloSelector.jsp?marca=' + document.callform.codigoMarca.options[document.callform.codigoMarca.selectedIndex].value + '&codigoModelo=' + modelo + '&nombreModelo=';
    	window.open(url, '', 'width=400,height=450,status=no,scrollbars=1,resizable=yes,top=100,left=200');
	}
  }

/* items: abre la ventana para llenar los �tems*/
  function items(tipo,formname,itemdetalle,itemsuma,descripcion,pagina,operacion,modo){
    if (modo == null) modo = 'normal';
    var url = basepath+'cobertura/items.jsp?tipo=' + tipo + '&formname=' + formname + '&itemdetalle=' + itemdetalle + '&itemsuma=' + itemsuma + '&pagina=' + pagina + '&paginaoperacion=' + operacion + '&modo=' + modo + '&descripcion=' + descripcion;
    window.open(url, '', 'width=530,height=250,status=no,scrollbars=1,resizable=yes,top=0,left=50');
  }
  
/*Retorna un arreglo de las posiciones de los datos seleccionadas en un COMBO con seleccion multiple
  Recibe como parametro el objeto COMBO
  */
  function multipleObjectsIndexes(objetoSelect)
  {
       var opt_selected = new Array();
       var index = 0;
       for (var i=0;i < objetoSelect.options.length;i++)
       {
          if (objetoSelect.options[i].selected)
          {
             opt_selected[index] = i;
             index++;
          }
       }
       return opt_selected;
  }    
  
/*Retorna un arreglo de las opciones seleccionadas de un COMBO con seleccion multiple
  Recibe como parametro el objeto COMBO
*/
	function multipleObjectsValues(objetoSelect)
    {
       var opt_selected = new Array();
       var index = 0;
       for (var i=0;i < objetoSelect.options.length;i++)
       {
          if (objetoSelect.options[i].selected)
          {
             opt_selected[index] = objetoSelect.options[i].value;
             index++;
          }
       }
       return opt_selected;
     }
	
/*Retorna un string de las opciones seleccionadas de un COMBO con seleccion multiple
  Recibe como parametro el objeto COMBO
  Los distintos elementos est�n separados por || 
*/
	function multipleObjectsValuesString(objetoSelect, delimiter)
    { 
       var opt_selected = "";      
       for (var i=0;i < objetoSelect.options.length;i++)
       {
          if (objetoSelect.options[i].selected)          
             opt_selected += objetoSelect.options[i].value +  delimiter;      
       }       
       //alert(opt_selected);
       //alert(opt_selected.length);
       opt_selected = opt_selected.substring(0,opt_selected.length-1);
       return opt_selected;
     } 	
//------------------------- FIN ESTAS FUNCIONES NO DEBERIAN BORRARSE. VERIFICAR QUE NO SE USEN ------------------------//

//------------------------- Muestra el PDF de la declaracion jurada para personas PEP -----------------------//
	function mostrar_archivo_declaracion_jurada_pep() {
		var archivo = 'Declaracion Jurada Sobre Condicion de PEP.pdf';
		var type = 'application/pdf';
		var url = 'mostrarArchivoSistema.do?nombreArchivo=' + archivo + '&contentType=' + type
		window.location = url;
//		executeActionInPos(url, 0, 0, 600, 250);
	}
//------------------------- FIN Muestra el PDF de la declaracion jurada para personas PEP -----------------------//

//----------------------------- MUESTRA U OCULTA EL CPA DE UNA DETERMINADA DIRECCION ----------------------------//
	/**
	 * Muestra u oculta el CPA de la direcci�n, dependiendo del par�metro "show".
	 * @param show
	 */
	function show_hidden_cpa(cpaSpanID, cpaValueID, show) {
		if (show) {
			$jqfp(cpaSpanID).hide();
		} else {
			$jqfp(cpaSpanID).hide();
			$jqfp(cpaValueID).html('');
		}
	} //show_hidden_cpa

	/**
	 * Si el CPA es nulo, se muestra C.P.A.: 'No encontrado', de lo contrario muestra el valor del mismo
	 * @param cpa
	 */
	function mostrar_cpa(cpaSpanID, cpaValueID, cpa) {
		show_hidden_cpa(cpaSpanID, cpaValueID, true);
		if (''.equalsIgnoreCase(cpa.trim())) {
			$jqfp(cpaValueID).html('No encontrado');
		} else {
			$jqfp(cpaValueID).html(cpa);
		}
	} //mostrar_cpa

//---------------------------- FIN MUESTRA U OCULTA EL CPA DE UNA DETERMINADA DIRECCION --------------------------//

//----------------------------------------- EXTIENDE LA CLASE STRING ---------------------------------------------//

	if (typeof String.prototype.startsWith != 'function') {
		String.prototype.startsWith = function (str){
			return this.slice(0, str.length) == str;
		};
	}
	if (typeof String.prototype.endsWith != 'function') {
		String.prototype.endsWith = function (str){
			return this.slice(-str.length) == str;
		};
	}
	if (typeof String.prototype.replaceAll != 'function') {
		String.prototype.replaceAll = function(search, replacement) {
		    var target = this,
		    	find = search.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
		    return target.replace(new RegExp(find, 'g'), replacement);
		};
	}

//------------------------------------- FIN EXTIENDE LA CLASE STRING ---------------------------------------------//	
	
	function initialize_motor_y_chasis(path,motor,chasis,patente) {
		initialize_ajax_motor_y_chasis_merlin(path,motor,chasis,patente);
	}
	
	function validarMotorYchasis() {
		ajax_validar_motor_y_chasis_merlin.execute();
	}
	
	function initialize_ajax_motor_y_chasis_merlin(path,motor,chasis,patente) {
		ajax_validar_motor_y_chasis_merlin = new AjaxJspTag.UpdateField(path+"/administrarVehiculo.do", {
								parameters: "method=validarMotorYChasis&patente={" + patente + "}",
								target: motor + "," + chasis,
								handler: motor_y_chasis_merlin_handler,
								parser: new ResponseXmlParser(),
								errorFunction: report_error_generic,
								setListener: false
							});
	}
	
	function motor_y_chasis_merlin_handler(request, options) {
		$jqfp("#nroChasisCorrecto").hide();
		$jqfp("#nroMotorCorrecto").hide();	
		
//		document.getElementById('nroChasisCorrecto').style.display = "none";
//		document.getElementById('nroMotorCorrecto').style.display = "none";
		var i = 0;
		var nombreMotor = options.targets[0];
		var nombreChasis = options.targets[1];
		var chasis = options.items[0][i++][1];
		var motor = options.items[0][i++][1];
		if (($jqfp('#' + nombreChasis).val()== "") && (($jqfp('#' + nombreMotor).val())=="")){
			
			if (motor == "") {
				$jqfp('#' + nombreMotor).val("");
			} else {
				$jqfp('#' + nombreMotor).val(motor);
			}
			if (chasis == "") {
				$jqfp('#' + nombreChasis).val("");
			} else {
				$jqfp('#' + nombreChasis).val(chasis);				
			}
		} else {
			if (!(($jqfp('#' + nombreChasis).val())=="") && !($jqfp('#' + nombreMotor).val())=="") {
				if ((($jqfp('#' + nombreChasis).val())=="") && !($jqfp('#' + nombreMotor).val())=="") {
					$jqfp('#' + nombreChasis).val(chasis);
				}
				if ((($jqfp('#' + nombreMotor).val())=="") && (!(($jqfp('#' + nombreChasis).val())==""))) {
					$jqfp('#' + nombreMotor).val(motor);
				}
			} 
			// para que no muestre el sugerido cuando no hay motor.
			if (!motor == "") {
				$jqfp('#nroMotorCorrecto').show();				
				$jqfp('#nroMotorCorrecto').html("Sugerido: " + motor);
			} 
		
			if (!chasis == "") {
				$jqfp('#nroChasisCorrecto').show();				
				$jqfp('#nroChasisCorrecto').html("Sugerido: " + chasis);				
				
				}
	}
	}

	function crear_xml_document(response) {
		//Reemplaza todos los &lt; por '<', y los &gt; por '>'. El /g indica que cambie todas las ocurrencias
		response = response.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
		//Crea el XMLDocument para poder parsearlo
		var xml = null;
	    if (document.implementation.createDocument) {
	    	//Mozilla and Netscape browsers
	        var parser = new DOMParser();
	        xml = parser.parseFromString(response, "text/xml");
	    } else if (window.ActiveXObject) {
	    	//MSIE
	        xml = new ActiveXObject("Microsoft.XMLDOM");
	        xml.async = "false";
	        xml.loadXML(response);
	    }
	    return xml;
	}

	/**
	 * Funcion generica para mostrar error de invocacion en AJAX
	 */
	function report_error_generic(request, content) {
		$(content).innerHTML = request.responseText;
		Element.show(content);
	}	
	

	/**	
	 * Funcion para admitir solo numeros
	 */
	
	function validar_numeros(valor){
		var reg = new RegExp('^[0-9]+$');
		return reg.test(valor);
	}
	
	
	/**	
	 * Funcion para validar que fecha desde sea mayor que fecha hasta
	 */
	
	 function validar_fecha_menor_sin_mensaje(fechaDesde,fechaHasta){
		  var mMonth = fechaHasta.substr(3, 2);
		  var mDay = fechaHasta.substr(0, 2);
		  var mYear = fechaHasta.substr(6, 4);
		  var strSeperator = '/';
		  var vDateValueCheck = mMonth + strSeperator + mDay + strSeperator + mYear;
		  var dateOri = new Date(fechaDesde.substr(3, 2) + '/'
		  + fechaDesde.substr(0, 2) + '/' + fechaDesde.substr(6, 4));
		  var dateNew = new Date(vDateValueCheck);
		  var diff = dateNew.getTime() - dateOri.getTime();
		  if (diff < 0) {
		  return false;
		  } else {
		  return true;
		  }  
		  }

		function mailValido(email) {
			var regExPattern = /^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(\.[A-Za-z]{2,})$/;
		    var ok = true;
		    if (!email.match(regExPattern)) {
		    	ok = false;
		    }
		    return ok;
		}
