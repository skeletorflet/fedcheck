/*
general.js scripts de validaciones y funciones generales
trim: elimnina los espacios a izquierda y derecha del string recibido como par�metro
validar_letras_digitos: valida que la entrada sean solo letras y digitos
validar_letras: valida que la entrada sean solo letras
validar_numero: valida que la entrada sean solo d�gitos, - y .
validar_float: valida que la entrada sea un float v�lido y focaliza en el error
validar_int: valida que la entrada sea un entero v�lido y focaliza en el error
validar_int_positivo: valida que la entrada sea un entero positivo v�lido y focaliza en el error
validar_mayor: valida que la entrada sea un numero mayor a otro y focaliza en el error
validar_mayor_igual: valida que la entrada sea un numero mayor o igual a otro y focaliza en el error
validar_menor: valida que la entrada sea un numero menor a otro y focaliza en el error
validar_menor_igual: valida que la entrada sea un numero menor o igual a otro y focaliza en el error
validar_entre: valida que la entrada sea un numero entre otros y focaliza en el error
validar_menor_igual_int_positivo: valida que la entrada sea un numero entero positivo menor o igual a otro y de no ser as� focaliza en el error
validar_mayor_igual_int_positivo: valida que la entrada sea un numero entero positivo mayor o igual a otro y focaliza en el error
validar_int_positivo_entre: valida que la entrada sea un numero entero positivo entre los n�meros enteros positivos menor y mayor
validar_float_entre: valida que la entrada sea un numero float y que caiga dentro de un rango cerrado. Luego focaliza en el error
validar_float_entre_abierto: valida que la entrada sea un numero float y que caiga dentro de un rango abierto. Luego focaliza en el error
get_now_date: Retorna la fecha actual y setea horas, minutos, segundos y milisegundos en 0
parse_date: Crea un Date con el string que recibe como parametro. El formato del strind debe ser dd?mm?yyyy
validar_fecha_limite_superior: Valida que la fecha no supere en cantidad de dias a la fecha referencia
validar_fecha_limite_inferior: Valida que la fecha no sea inferior en cantidad de dias a la fecha referencia
validar_fecha_menor_actual: valida que la fecha no sea menor a la fecha actual
validar_fecha_menor_actual_focus: valida que la fecha recibida como par�metro no sea menor a la fecha actual 
								  y setea el foco en dicha fecha
validar_fecha_mayor_actual_focus: valida que la fecha recibida como par�metro no sea mayor a la fecha actual 
								  y setea el foco en dicha fecha
validar_fecha_inferior: valida que la "fecha" recibida no sea inferior a la "fecha_limite_inf"
validar_fecha: valida que la fecha de entrada no supere los diez dias posteriores a la original
validar_fecha_menor: valida que la fecha desde no supere a la fecha hasta
validar_formato_fecha: valida que el formato de la fecha sea v�lida
validar_nulo: valida que se haya ingresado algo
validar_valor_nulo: valida que lo que se haya ingresado sea distinto del valor nulo que recibe como par�metro
validar_valor_nulo_no_focus: valida que lo que se haya ingresado sea distinto del valor nulo que recibe como par�metro. No realiza focus
validar_valor_nulo_focus: valida que lo que se haya ingresado sea distinto del valor nulo que recibe como par�metro
						 y setea el foco en el field indicado
validar_length: valida que la entrada tenga cierto tama�o
combo_include_value: Verifica si el combo incluye como opcion el valor que recibe como parametro
get_combo_value: retorna el value del item seleccionado en el combo
get_combo_text: retorna el text del item seleccionado en el combo
locate: posiciona un combo box dado un valor
locate_combo: posiciona un combo box dado con el valor de un field
locate_combo_detalle: posiciona un combo box dado con el valor de un field y setea el detalle en otro input
set_input_combo: setea un input cuando cambia un combo
set_input_combo_detalle: setea un input cuando cambia un combo y el detalle en otro
browser_name: retorna el nombre del browser
browser_version: retorna la versi�n del browser
browser_valido: Netscape cualquiera - IE 5.0 o superior
is_IE: retorna true si el browser es Internet Explorer (Cualquiera de sus versiones)
imprimir: abre un p�gina lista para imprimir
textarea_maxlength: limita la longitud de un textarea
executeAction: abre un nuevo browser maximizado con la p�gina recibida como par�metro (puede recibir el nombre de una acci�n)
executeActionInPos: abre un nuevo browser en la posici�n y con el tama�o que recibe como par�metro
executeReport: abre el reporte recibido como par�metro.
createTarget: se utiliza para abrir una nueva ventana customizada desde un form
setearActionForm: setea la acci�n a ejecutarse y luego ejecuta el submit del form.
setearAccionAsegurado: setea la p�gina (nextPage) a la cual tiene que navegar despu�s 
					   de ejecutar la acci�n y llama a la funci�n setearActionForm.
open_modal_window: abre una ventana modal mostrando el mensaje recibido como par�metro.
addOption2Select: agrega una nueva option al select con los valores recibidos
executeActionForm: crea un form con el action, method e inputs ocultos recibidos 
				   como par�metros y realiza el submit. 
*/
String.prototype.equalsIgnoreCase=MatchIgnoreCase;
String.prototype.trim=AllTrim;
String.prototype.leftPad=leftPad;
var basepath = '/self/';
var SI = 'S';

function round(numero, decimales) {
	var x = Math.pow(10, decimales);
	var resultado = Math.round(numero * x) / x;
	return resultado;
}

function MatchIgnoreCase(strTerm){
	var strToSearch = this.toLowerCase();
	strTerm = strTerm.toLowerCase();
	if (strToSearch==strTerm){
		return true;
	} else {
		return false;
	}
} //End Function

function AllTrim(){
 // skip leading and trailing whitespace
 // and return everything in between
  var x=this;
  x=x.replace(/^\s*(.*)/, "$1");
  x=x.replace(/(.*?)\s*$/, "$1");
  return x;
}

function leftPad(numDesiredLen,strPadChar){
      tmpStr = "";
      numChars = numDesiredLen-this.length;
      for (i=0; i < numChars; i++){
            tmpStr = tmpStr+strPadChar;
      } //for
      return tmpStr+this;
} //leftPad

//setearActionForm: setea la acci�n a ejecutarse y luego ejecuta el submit  del form
function setearActionForm(form, actionName) {
	if (actionName != "") form.action = actionName;
	form.submit();
} //setearActionForm

/**
 * Funcion generica para mostrar error de invocacion en AJAX
 */
function report_error_generic(request, content) {
	$(content).innerHTML = request.responseText;
	Element.show(content);
}

/*createTarget: se utiliza para abrir una nueva ventana customizada desde un form*/
function createTarget(form) {
	_target = form.target;
	_colon = _target.indexOf(":");
	if(_colon != -1) {
		form.target = _target.substring(0,_colon);
		form.args = _target.substring(_colon+1);
	} 
	else if(typeof(form.args)=="undefined") {
		form.args = "";
	}
	if(form.args.indexOf("{")!=-1) {
		_args = form.args.split("{");
		form.args = _args[0];
		for(var i = 1; i < _args.length;i++) {
			_args[i] = _args[i].split("}");
			form.args += eval(_args[i][0]) + _args[i][1];
	   }
	}
	form.args = form.args.replace(/ /g,"");
	_win = window.open('',form.target,form.args);
	if(typeof(focus)=="function")
	_win.focus();
	return true;
} //createTarget

/* executeAction: abre un nuevo browser maximizado con la p�gina recibida como par�metro 
(puede recibir el nombre de una acci�n) */
function executeAction(action) {
	var aw = screen.availWidth-10;
    var ah = screen.availHeight-25;
	window.open(basepath + action,"","width="+aw+",height="+ah+",status=no,scrollbars=yes,resizable=yes,top=0,left=0");
} //executeAction

function openNewWindow(url) {
	var aw = screen.availWidth-10;
    var ah = screen.availHeight-25;
    openNewWindowSize(url,aw, ah);
	//window.open(url,"","width="+aw+",height="+ah+",status=no,scrollbars=yes,resizable=yes,top=0,left=0");
} //executeAction

function openNewWindowSize(url, width, height) {
	window.open(url,"","width="+width+",height="+height+",status=no,scrollbars=yes,resizable=yes,top=0,left=0");
} //executeAction

/*executeActionInPos: abre un nuevo browser en la posici�n y con el tama�o que recibe como par�metro*/
function executeActionInPos(action, left, top, width, hight) {
	window.open(basepath + action,"","width="+width+",height="+hight+",status=no,scrollbars=yes,resizable=yes,top="+top+",left="+left);
} //executeActionInPos

/*executeReport: abre el reporte recibido como par�metro. Implementaci�n ReportServlet*/
function executeReport(url) {
	if (checkReportServlet().equalsIgnoreCase('true')) {
		top.location = basepath + url;
	} else {
		open_creating_report_window();
	}	
} //executeReport

/*executeActionForm: crea un form con el action, method e inputs ocultos recibidos 
como par�metros y realiza el submit. */
function executeActionForm(url, paramsValue, methodForm) {
	//Crea el form con method="post" y action=url
	var form = document.createElement("form");
	with(form) {
		setAttribute("id", "formName");
		setAttribute("name", "formName");
		setAttribute("action", basepath + url);
		setAttribute("method", methodForm); 
	} //with
	for (var i = 0; i < paramsValue.length; i++) {
		var paramValue = paramsValue[i];
		//Crea un elemento input conteniendo el valor del par�metro
		var input = document.createElement("input"); 
		with(input) {
			setAttribute("name", paramValue[0]);
			setAttribute("type", "hidden"); 
			setAttribute("value", paramValue[1]); 
		} //with
		//A�ade el input al formulario
		form.appendChild(input); 
	} //for
	//A�ade el formulario al documento
	document.getElementsByTagName("body")[0].appendChild(form);
	form.submit();
} //executeActionForm

/*abrirGaleriaFotos: abre la galer�a de fotos dependiendo de la resoluci�n de la pantalla.*/
function abrirGaleriaFotos(action) {
	var width = screen.availWidth-10;
	if (width > 1024) {
		width = width-(width*15/100);
	}
	var height = height = screen.availHeight-25;
	if  (height > 768) {
		height = height-(height*15/100)
	}
	executeActionInPos(action, 0, 0, width, height);
} //abrirGaleriaFotos

/* trim */
function trim(s) {
  while (s.substring(0,1) == ' ') {
    s = s.substring(1,s.length);
  }
  while (s.substring(s.length-1,s.length) == ' ') {
    s = s.substring(0,s.length-1);
  }
  return s;
} //trim

/* validar_letras_digitos: valida que la entrada sean solo letras y digitos */
  function validar_letras_digitos(letras){
    var checkOK = 'abcdefghijklmnopqrstuvwxyz1234567890';
    var checkStr = letras.toLowerCase();
    var allValid = true;
    for (i = 0;  i < checkStr.length;  i++){
      ch = checkStr.charAt(i);
      for (j = 0;  j < checkOK.length;  j++)
        if (ch == checkOK.charAt(j))
          break;
      if (j == checkOK.length) {
        allValid = false;
        break;
      }
    }
    if (!allValid){
      return (false);
    }
    return (true);
  } //validar_letras_digitos

/* validar_letras: valida que la entrada sean solo letras */
  function validar_letras(letras){
    var checkOK = 'ABCDEFGHIJKLMN�OPQRSTUVWXYZ';
    var checkStr = letras.toUpperCase();
    var allValid = true;
    for (i = 0;  i < checkStr.length;  i++){
      ch = checkStr.charAt(i);
      for (j = 0;  j < checkOK.length;  j++)
        if (ch == checkOK.charAt(j))
          break;
      if (j == checkOK.length) {
        allValid = false;
        break;
      }
    }
    if (!allValid){
      return (false);
    }
    return (true);
  } //validar_letras

/* validar_numero: valida que la entrada sean solo d�gitos, - y . */
  function validar_numero(numero, checkOK){
    var checkStr = numero;
    var allValid = true;
    var decPoints = 0;
    for (i = 0;  i < checkStr.length;  i++){
      ch = checkStr.charAt(i);
      for (j = 0;  j < checkOK.length;  j++){
        if (ch == checkOK.charAt(j))
          break;
      }
      if (j == checkOK.length) {
        allValid = false;
        break;
      }
      if (ch == '.')
        decPoints++;
    }
    if (!allValid){
      return (false);
    }
    if (decPoints > 1) {
      return (false);
    }
    return (true);
  } //validar_numero

/*validar_float: valida que la entrada sea un float v�lido y focaliza en el error */
  function validar_float(field,fieldname){
    var checkOK = '0123456789-.';
    if (validar_numero(field.value,checkOK)) return (true);
    else {
//	  Dialog.alert(field, "Ingrese un n�mero v�lido en " + fieldname, 
//		           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:260, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});
      alert("Ingrese un n\u00FAmero v\u00E1lido en " + fieldname);
	  field.focus();
      return (false);
    }
  } //validar_float

/*validar_int: valida que la entrada sea un entero v�lido y focaliza en el error */
  function validar_int(field,fieldname){
    var checkOK = '0123456789-';
    if (validar_numero(field.value,checkOK)) return (true);
    else {
//	  Dialog.alert(field, "Ingrese un n�mero v�lido en " + fieldname, 
//		           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:260, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});
      alert("Ingrese un entero v\u00E1lido en " + fieldname);
	  field.focus();
      return (false);
    }
  } //validar_int

/*validar_int_positivo: valida que la entrada sea un entero positivo v�lido y focaliza en el error */
  function validar_int_positivo(field,fieldname){
    var checkOK = '0123456789';
    if($jqfp) {
    	var valorDef = $jqfp(field).val();
    }else {
    	var valorDef = field.value;
    }
    if (validar_numero(valorDef,checkOK)) return (true);
    else {
	  alert("Ingrese un entero positivo v\u00E1lido en " + fieldname);
	  field.focus();
      return (false);
    }
  } //validar_int_positivo

/*validar_mayor: valida que la entrada sea un numero mayor a otro y focaliza en el error */
  function validar_mayor(field,fieldname,value){
    var result = validar_float(field,fieldname);
    if ((result) && (field.value > value)) return (true);
    else {
    	modalB.show("important", "Error", "Ingrese un n\u00FAmero mayor a " + value + " en " + fieldname,
    			[
    			 {
    				 text: "Aceptar", 
    				 cerrar: true, 
    				 claseCss: "hierarchy_1"
    			 	}
    			 ]);
//      alert("Ingrese un n�mero mayor a " + value + " en " + fieldname);
//	  Dialog.alert(field, "Ingrese un n�mero mayor a " + value + " en " + fieldname, 
//		           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});		           					   
      return (false);
    }
  } //validar_mayor
  
/*validar_mayor_igual: valida que la entrada sea un numero mayor o igual a otro y focaliza en el error */
  function validar_mayor_igual(field,fieldname,value){
    var result = validar_float(field,fieldname);
    if ((result) && (field.value >= value)) return (true);
    else {
    	modalB.show("important", "Error", "Ingrese un n\u00FAmero mayor o igual a " + value + " en " + fieldname,
    			[
    			 {
    				 text: "Aceptar", 
    				 cerrar: true, 
    				 claseCss: "hierarchy_1"
    			 	}
    			 ]);
//      alert("Ingrese un n�mero mayor a " + value + " en " + fieldname);
//	  Dialog.alert(field, "Ingrese un n�mero mayor o igual a " + value + " en " + fieldname, 
//		           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});		           					   
      return (false);
    }
  } //validar_mayor_igual
  

/* validar_mayor_igual_int_positivo: valida que la entrada sea un numero entero positivo mayor o igual a otro y focaliza en el error */
  function validar_mayor_igual_int_positivo(field,fieldname,value){
    var result = validar_int_positivo(field,fieldname);
    if ((result) && (field.value >= value)) return (true);
    else {
    	modalB.show("important", "Error", "Ingrese un n\u00FAmero mayor o igual a " + value + " en " + fieldname,
    			[
    			 {
    				 text: "Aceptar", 
    				 cerrar: true, 
    				 claseCss: "hierarchy_1"
    			 	}
    			 ]);
//      alert("Ingrese un n�mero mayor a " + value + " en " + fieldname);
//	  Dialog.alert(field, "Ingrese un n�mero mayor o igual a " + value + " en " + fieldname, 
//		           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});
//	  field.focus();
      return (false);
    }
  } //validar_mayor_igual_int_positivo

/*validar_menor: valida que la entrada sea un numero menor a otro y focaliza en el error */
  function validar_menor(field,fieldname,value){
    var result = validar_float(field,fieldname);
    if ((result) && (field.value < value)) return (true);
    else {
    	modalB.show("important", "Error", "Ingrese un n\u00FAmero menor a " + value + " en " + fieldname,
    			[
    			 {
    				 text: "Aceptar", 
    				 cerrar: true, 
    				 claseCss: "hierarchy_1"
    			 	}
    			 ]);
//      alert("Ingrese un n�mero menor a " + value + " en " + fieldname);
//	  Dialog.alert(field, "Ingrese un n�mero menor a " + value + " en " + fieldname, 
//		           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});      
      return (false);
    }
  } //validar_menor

/*validar_menor_igual: valida que la entrada sea un numero menor o igual a otro y focaliza en el error */
  function validar_menor_igual(field,fieldname,value){
    var ok = validar_float(field,fieldname);
    ok = ok && (parseFloat(field.value) <= parseFloat(value));
    if (!ok) {
    	modalB.show("important", "Error", "Ingrese un n\u00FAmero menor o igual a " + value + " en " + fieldname,
    			[
    			 {
    				 text: "Aceptar", 
    				 cerrar: true, 
    				 claseCss: "hierarchy_1"
    			 	}
    			 ]);
//    	Dialog.alert(field, "Ingrese un n�mero menor o igual a " + value + " en " + fieldname, 
//		           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});      
    }
    return ok;
  } //validar_menor_igual
  
/* validar_menor_igual_int_positivo: valida que la entrada sea un numero entero positivo menor o igual a otro y de no ser as� focaliza en el error */
  function validar_menor_igual_int_positivo(field,fieldname,value){
    var result = validar_int_positivo(field,fieldname);
    if ((result) && (field.value <= value)) return (true);
    else {
    	modalB.show("important", "Error",  "Ingrese un n\u00FAmero menor o igual a " + value + " en " + fieldname,
    			[
    			 {
    				 text: "Aceptar", 
    				 cerrar: true, 
    				 claseCss: "hierarchy_1"
    			 	}
    			 ]);
//      alert("Ingrese un n�mero mayor a " + value + " en " + fieldname);
//	  Dialog.alert(field, "Ingrese un n�mero menor o igual a " + value + " en " + fieldname, 
//		           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:300, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});
//	  field.focus();
      return (false);
    }
  } //validar_mayor_igual_int_positivo  

/*validar_entre: valida que la entrada sea un numero mayor a otro y focaliza en el error */
  function validar_entre(field,fieldname,mayor,menor){
    var result = validar_float(field,fieldname);
    if ((result) && (field.value > mayor) && (field.value < menor)) return (true);
    else {
    	modalB.show("important", "Error", "Ingrese un n\u00FAmero entre " + menor + " y " + mayor + " en " + fieldname,
    			[
    			 {
    				 text: "Aceptar", 
    				 cerrar: true, 
    				 claseCss: "hierarchy_1"
    			 	}
    			 ]);
//      alert("Ingrese un n�mero entre " + menor + " y " + mayor + " en " + fieldname);
//	  Dialog.alert(field, "Ingrese un n�mero entre " + menor + " y " + mayor + " en " + fieldname, 
//		           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});      
      return (false);
    }
  } //validar_entre
  
/*validar_float_entre: valida que la entrada sea un numero float y que caiga dentro de un rango cerrado. Luego focaliza en el error */
  function validar_float_entre(field,fieldname,menor,mayor){
    result = validar_float(field,fieldname);
    if (result) {
      result= (field.value >= menor) && (field.value <= mayor);
      if (!result) {
        	modalB.show("important", "Error", "Ingrese un n\u00FAmero entre " + menor + " y " + mayor + " en " + fieldname,
        			[
        			 {
        				 text: "Aceptar", 
        				 cerrar: true, 
        				 claseCss: "hierarchy_1"
        			 	}
        			 ]);
//	      alert("Ingrese un n�mero entre " + menor + " y " + mayor + " en " + fieldname);
//		  Dialog.alert(field, "Ingrese un n\u00FAmero entre " + menor + " y " + mayor + " en " + fieldname, 
//			           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			           					   width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		    	       					   okLabel: "Aceptar"});  
//    	  field.focus();
      } //if
    } //if
    return result;
  } //validar_float_entre
  
  /*validar_float_entre_abierto: valida que la entrada sea un numero float mayor a otro y focaliza en el error */
  function validar_float_entre_abierto(field,fieldname,menor,mayor){
    result = validar_float(field,fieldname);
    if (result) {
      result = (field.value > menor) && (field.value < mayor);
      if (!result) {
      	modalB.show("important", "Error", "Ingrese un n\u00FAmero entre " + menor + " y " + mayor + " en " + fieldname,
    			[
    			 {
    				 text: "Aceptar", 
    				 cerrar: true, 
    				 claseCss: "hierarchy_1"
    			 	}
    			 ]);
//	      alert("Ingrese un n�mero entre " + menor + " y " + mayor + " en " + fieldname);
//		  Dialog.alert(field, "Ingrese un n�mero entre " + menor + " y " + mayor + " en " + fieldname, 
//			           {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			           					   width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		    	       					   okLabel: "Aceptar"});  
//    	  field.focus();
      } //if
    } //if
    return result;
  } //validar_float_entre_abierto
  
  
 /* validar_int_positivo_entre: valida que la entrada sea un numero entero positivo entre los n�meros enteros positivos menor y mayor */
  function validar_int_positivo_entre(field,fieldname,menor,mayor){
    var result = validar_int_positivo(field,fieldname);
    var value = parseInt(field.value);
    if ((result) && (value >= menor) && (value <= mayor)) return (true);
    else {
    	modalB.show("important", "Error", "Ingrese un n\u00FAmero entre " + menor + " y " + mayor + " en " + "m\u00F3dulos",
    			[
    			 {
    				 text: "Aceptar", 
    				 cerrar: true, 
    				 claseCss: "hierarchy_1"
    			 	}
    			 ]);
//      alert("Ingrese un n�mero entre " + menor + " y " + mayor + " en " + fieldname);
//		Dialog.alert(field, "Ingrese un n�mero entre " + menor + " y " + mayor + " en " + fieldname, 
//		             {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			        					 width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		    	       					 okLabel: "Aceptar"});  
      
//	  field.focus();
      return (false);
    }
  } //validar_int_positivo_entre

  /**
   * Retorna los a�os que hay entre las fechas
   */
  function get_anios_entre_fechas(fecha1, fecha2) {
		//Obtiene la cantidad de a�os entre las 2 fechas
		var anios = fecha1.getFullYear() - fecha2.getFullYear();
		//Si todavia no cumplio los a�os, entonces le resta el 1 a la cantidad de a�os
		if ((fecha1.getMonth() < fecha2.getMonth()) || 
				((fecha1.getMonth() == fecha2.getMonth()) && (fecha1.getDate() < fecha2.getDate()))) {
			anios = anios - 1;
		}
		return anios;
  }

  /*get_now_date: Retorna la fecha actual y setea horas, minutos, segundos y milisegundos en 0*/
  function get_now_date() {
    var now = loadFechaActual();//Fecha Actual
    //Setea en 0 la hora, minutos y segundos de la fecha
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  } //get_now_date
  
  /*date_to_string: Retorna el string de la fecha segun el formato que recibe*/
  function date_to_string(date, format) {
  	var result = '';
  	if (format == 'dd/mm/yyyy') {
  		//Sumo 1 porque sino me retorna el mes incorrecto
  		var mes = date.getMonth() + 1;
  		result = date.getDate().toString().leftPad(2,'0') 
  				+ '/' + mes.toString().leftPad(2,'0')
  				+ '/' + date.getFullYear();
  	}
  	if (format == 'mm/yyyy') {
  		//Sumo 1 porque sino me retorna el mes incorrecto
  		var mes = date.getMonth() + 1;
  		result = mes + '/' + date.getFullYear();
  	}
    return result;
  } //date_to_string
  
  /*parse_date: Crea un Date con el string que recibe como parametro. El formato del strind debe ser dd?mm?yyyy*/
  function parse_date(string_fecha) {
    var mMonth = string_fecha.substr(3,2);
    var mDay   = string_fecha.substr(0,2);
    var mYear  = string_fecha.substr(6,4);
    //Resta 1 al mes, porque sino se crea mal la fecha
    var date = new Date(mYear, mMonth-1, mDay);
    return date;
  } //parse_date

  /*validar_fecha_igual: Retorna TRUE si las fechas son iguales*/
  function validar_fecha_igual(fecha1, fecha2){
    var diff = fecha1.getTime() - fecha2.getTime();
    return (diff == 0);
  }

  /*validar_fecha_limite_superior: Valida que la fecha no supere en cantidad de dias a la fecha referencia*/
  function validar_fecha_limite_superior(fecha, referencia, dias){
    var diff = fecha.getTime() - referencia.getTime();
    var diff_dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    return diff_dias <= dias;
  } //validar_fecha_limite_superior

  /*validar_fecha_limite_inferior: Valida que la fecha no sea inferior en cantidad de dias a la fecha referencia*/
  function validar_fecha_limite_inferior(fecha, referencia, dias){
    var diff = fecha.getTime() - referencia.getTime();
    var diff_dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    return diff_dias >= -dias;
  } //validar_fecha_limite_inferior

  /* validar_fecha_menor_actual: valida que la fecha no sea menor a la fecha actual*/
  function validar_fecha_menor_actual(string_fecha){
    var ok = validar_fecha_limite_inferior(parse_date(string_fecha), get_now_date(), 0);
    if (!ok) {
//		alert("La fecha no puede ser anterior a la fecha actual");
//		Dialog.alert(null, "La fecha no puede ser anterior a la fecha actual", 
//		            {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			           					width:310, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		    	       					okLabel: "Aceptar"});  
    	alert("La fecha no puede ser anterior a la fecha actual");
    }
    return ok;
  } //validar_fecha_menor_actual

  /* validar_fecha_menor_actual_focus: valida que la fecha recibida como par�metro no sea menor a la fecha actual 
  y setea el foco en dicha fecha*/
  function validar_fecha_menor_actual_focus(fieldFecha, fieldNameFecha){
    var ok = validar_fecha_limite_inferior(parse_date(fieldFecha.value), get_now_date(), 0);
    if (!ok) {
//		alert("La fecha no puede ser anterior a la fecha actual");
//		Dialog.alert(fieldFecha, "La " + fieldNameFecha + " no puede ser anterior a la fecha actual", 
//		            {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			           					width:310, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		    	       					okLabel: "Aceptar"});  
    	alert("La " + fieldNameFecha + " no puede ser anterior a la fecha actual");
    }
    return ok;
  } //validar_fecha_menor_actual_focus
  
  /* validar_fecha_mayor_actual_focus: valida que la fecha recibida como par�metro no sea mayor a la fecha actual 
  y setea el foco en dicha fecha*/
  function validar_fecha_mayor_actual_focus(fieldFecha, fieldNameFecha){
    var ok = validar_fecha_limite_superior(parse_date(fieldFecha.value), get_now_date(), 0);
    if (!ok) {
		alert("La fecha no puede ser anterior a la fecha actual");
//		Dialog.alert(fieldFecha, "La " + fieldNameFecha + " no puede ser posterior a la fecha actual", 
//		            {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			           					width:310, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		    	       					okLabel: "Aceptar"});  
    }
    return ok;
  } //validar_fecha_mayor_actual_focus
  
  /* validar_fecha_inferior: valida que la "fecha" recibida no sea inferior a la "fecha_limite_inf".*/
  function validar_fecha_inferior(str_fecha_limite_inf, str_fecha) {
    var ok = validar_fecha_limite_inferior(parse_date(str_fecha), parse_date(str_fecha_limite_inf), 0);
    return ok;
  } //validar_fecha_inferior
  

  /* validar_fecha_menor: valida que la fecha desde no supere a la fecha hasta */
  function validar_fecha_menor(fechaDesde,fechaHasta){
	  var texto = "La fecha desde no puede superar la fecha hasta";
	  return validar_fecha_menor_con_mensaje(fechaDesde,fechaHasta,texto);
  } //validar_fecha_menor
  
  function validar_fecha_menor_con_mensaje(fechaDesde,fechaHasta,mensaje){
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
		  alert(mensaje);
		   //alert("La fecha desde no puede superar la fecha hasta");
//		  Dialog.alert(null, mensaje, {
//			  windowParameters : {
//				  title : "Error",
//				  className : "theme1",
//				  errorImage : basepath + "images/error.gif",
//				  width : 310,
//				  height : 100,
//				  resizable : false,
//				  minimizable : false,
//				  maximizable : false
//			  },
//			  okLabel : "Aceptar"
		  return false;
//		  });
	  } else {
		  return true;
	  }  
  }

  /*
	 * validar_fecha: valida que una fecha est� entre ant d�as hacia atr�s y pos
	 * d�as hacia adelante
	 */
  function validar_fecha(fechaOri,fechaNew,ant,pos){
    var mMonth = fechaNew.substr(3,2);
    var mDay   = fechaNew.substr(0,2);
    var mYear  = fechaNew.substr(6,4);
    var strSeperator = '/';
    var vDateValueCheck = mMonth+strSeperator+mDay+strSeperator+mYear;
    var dateOri = new Date(fechaOri.substr(3,2)+'/'+fechaOri.substr(0,2)+'/'+fechaOri.substr(6,4));
    var dateNew = new Date(vDateValueCheck);

    var diff = dateNew.getTime() - dateOri.getTime();
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > pos) {
      alert("La fecha no debe superar " + pos + " d\u00EDas de la fecha indicada");
//		Dialog.alert(null, "La fecha no debe superar " + pos + " d�as de la fecha indicada", 
//		            {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			           					width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		    	       					okLabel: "Aceptar"}); 
      return (false);
    }
    else if (days < ant) {
//      alert("La fecha no debe ser " + ant + " d�as menor a la fecha indicada");
//		Dialog.alert(null, "La fecha no debe ser " + ant + " d�as menor a la fecha indicada", 
//		            {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			           					width:280, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		    	       					okLabel: "Aceptar"}); 
      return (false);
    }
    else return (true);
  } //validar_fecha

  /* validar_formato_fecha: valida que el formato de la fecha sea v�lida */
  function validar_formato_fecha(field, fieldname){
	var checkstr = "0123456789";
	var DateField = field;
	var Datevalue = "";
	var DateTemp = "";
	var seperator = "/";
	var day;
	var month;
	var year;
	var leap = 0;
	var err = 0;
	var i;
    err = 0;
    DateValue = $jqfp(DateField).val();
    /* Delete all chars except 0..9 */
    for (i = 0; i < DateValue.length; i++) {
	  if (checkstr.indexOf(DateValue.substr(i,1)) >= 0) {
	     DateTemp = DateTemp + DateValue.substr(i,1);
	  }
    }
    DateValue = DateTemp;
    /* Always change date to 8 digits - string*/
    /* if year is entered as 2-digit / always assume 20xx */
    if (DateValue.length == 6) {
      DateValue = DateValue.substr(0,4) + '20' + DateValue.substr(4,2); 
    }
    if (DateValue.length != 8) {
      err = 19;
    }
    if (DateValue.length < 8) {
      err = 19;
    }
    if (err == 0) {
	    /* year is wrong if year = 0000 */
	    year = DateValue.substr(4,4);
	    if (year == 0) {
	      err = 20;
	    }
	    /* Validation of month*/
	    month = DateValue.substr(2,2);
	    if ((month < 1) || (month > 12)) {
	      err = 21;
	    }
	    /* Validation of day*/
	    day = DateValue.substr(0,2);
	    if (day < 1) {
	     err = 22;
	    }
    }
    /* Validation leap-year / february / day */
    if ((year % 4 == 0) || (year % 100 == 0) || (year % 400 == 0)) {
      leap = 1;
    }
    if ((month == 2) && (leap == 1) && (day > 29)) {
      err = 23;
    }
    if ((month == 2) && (leap != 1) && (day > 28)) {
      err = 24;
    }
    /* Validation of other months */
    if ((day > 31) && ((month == "01") || (month == "03") || (month == "05") || (month == "07") || (month == "08") || (month == "10") || (month == "12"))) {
      err = 25;
    }
    if ((day > 30) && ((month == "04") || (month == "06") || (month == "09") || (month == "11"))) {
      err = 26;
    }
    /* if 00 ist entered, no error, deleting the entry */
    if ((day == 0) && (month == 0) && (year == 00)) {
       err = 0; day = ""; month = ""; year = ""; seperator = "";
    }
    /* if no error, write the completed date to Input-Field (e.g. 13.12.2001) */
    if (err == 0) {
      DateField.value = day + seperator + month + seperator + year;
 	  return (true);
    }
    /* Error-message if err != 0 */
    else {
//	  alert ("Ingrese una fecha v�lida en " + fieldname);
//	  Dialog.alert(DateField, "Ingrese una fecha v�lida en " + fieldname, 
//				  {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//			      					  width:260, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		    	       				  okLabel: "Aceptar"}); 
	  alert("Ingrese una fecha v�lida en " + fieldname);
	  
//      DateField.select();
//	  DateField.focus();
      return (false);
    }
  } //validar_formato_fecha


/* validar_nulo: valida que se haya ingresado algo */
  function validar_nulo_observacion_prima() {
	  //if ( $jqfp("#puntosPrima").val() != 0 && ($jqfp("#observacion").val() == undefined || $jqfp("#observacion").val() == "" )) {
	  if ($jqfp("#observacion").val() == undefined || $jqfp("#observacion").val() == "" ) {
		  modalB.show("important", "Error", "Debe ingresar un valor en Observaciones para el cambio comisionario.<br>",
				  [{
					  text: "Aceptar",
					  cerrar: true,
					  claseCss: "hierarchy_1"
				  }]);
		  return false;
	  } else {
		  return true;
	  }
  }
  function validar_valor_dto_prima() {
	  var LIMITE_SUP_DTO_PRIMA = isProductorOrganizador ? 15 : 100;
	  var LIMITE_INF_DTO_PRIMA = isProductorOrganizador ? -20 : -100;
	  if ($jqfp("#puntosPrima").val() < LIMITE_INF_DTO_PRIMA || $jqfp("#puntosPrima").val() > LIMITE_SUP_DTO_PRIMA ) {
		  modalB.show("important", "Error", "El valor del cambio comisionario no es válido.<br>",
				  [{
					  text: "Aceptar",
					  cerrar: true,
					  claseCss: "hierarchy_1"
				  }]);
		  return false;
	  } else {
		  return true;
	  }
  }
  
  function validar_nulo_observacion_buen_resultado() {
	  //if ( $jqfp("#codigoBuenResultado").val() != 0 && ($jqfp("#observacion").val() == undefined || $jqfp("#observacion").val() == "" )) {
	  if ($jqfp("#observacion").val() == undefined || $jqfp("#observacion").val() == "" ) {
		  modalB.show("important", "Error", "Debe ingresar un valor en Observaciones para el cambio de buen resultado.",
				  [{
					  text: "Aceptar",
					  cerrar: true,
					  claseCss: "hierarchy_1"
				  }]);
		  return false;
	  } else {
		  return true;
	  }
  }
  
  function validar_nulo_observacion_fuera_de_norma() {
	  if ($jqfp("#planCobertura option:selected").text()[0] === '*' && ($jqfp("#observacion").val() == undefined || $jqfp("#observacion").val() == "")) {
		  modalB.show("important", "Error", "Debe ingresar un valor en Observaciones para seleccionar un plan fuera de norma",
				  [{
					  text: "Aceptar",
					  cerrar: true,
					  claseCss: "hierarchy_1"
				  }]);
		  return false;
	  } else {
		  return true;
	  }
  }
  function validar_nulo(field, fieldname){
    return validar_valor_nulo(field, fieldname, '');
  } //validar_nulo

/* validar_valor_nulo: valida que lo que se haya ingresado sea distinto del valor nulo que recibe como parametro */
  function validar_valor_nulo(field, fieldname, nullvalue){
  	var ok = validar_valor_nulo_focus(field, fieldname, nullvalue, field);
/*    if (!ok){
      field.focus();
    }
*/    return ok;
  } //validar_valor_nulo

/* validar_valor_nulo_focus: valida que lo que se haya ingresado sea distinto del valor nulo que recibe como parametro
 y setea el foco en el field indicado*/
  function validar_valor_nulo_focus(field, fieldname, nullvalue, fieldfocus){
	  if ($jqfp) {
		  var valueF ;
		  
		  if ($jqfp(field).prop("tagName") == "SELECT") {
			 valueF = $jqfp(field).find(":selected").val();
		  }else{
			  valueF = $jqfp(field).val();
		  }
		  if ((typeof valueF == "undefined") || (valueF == nullvalue)) {
			 modalB.show("important", "Error", "Debe ingresar un valor en " + fieldname, 
						[{
							 text: "Aceptar", 
							 cerrar: true, 
							 claseCss: "hierarchy_1"
						 }]);
			  $jqfp("#"+field.id).focus();
		      return false;
		  } else return true;
	  } else {
		  if (field.value.trim() == nullvalue) {
//			  alert("Debe ingresar un valor en " + fieldname);
			  modalB.show("important", "Error", "Debe ingresar un valor en " + fieldname, 
						[{
							 text: "Aceptar", 
							 cerrar: true, 
							 claseCss: "hierarchy_1"
						 }]);
			  $jqfp("#"+field.id).focus();
		      return false;
		  } else return true;
	  }
  } //validar_valor_nulo_focus
  
/* validar_valor_nulo_no_focus: valida que lo que se haya ingresado sea distinto del valor nulo que recibe como par�metro. No realiza focus */
  function validar_valor_nulo_no_focus(field, fieldname, nullvalue){
	  if ($jqfp) {
		  var valueF ;
		  
		  if ($jqfp(field).prop("tagName") == "SELECT") {
			 valueF = $jqfp(field).find(":selected").val();
		  }else{
			  valueF = $jqfp(field).val();
		  }
	    if ((typeof valueF == "undefined") || (valueF == nullvalue)) {
	    	//Caso especial: Que no se haya confirmado la ubicacion
			  if(fieldname == 'latitud'){
				  modalB.show("important", "Error", "Debe confirmar la ubicaci&oacuten ", 
							[{
								 text: "Aceptar", 
								 cerrar: true, 
								 claseCss: "hierarchy_1"
							 }]);
				   return false;
			  }else{
				  modalB.show("important", "Error", "Debe ingresar un valor en " + fieldname, 
							[{
								 text: "Aceptar", 
								 cerrar: true, 
								 claseCss: "hierarchy_1"
							 }]);
				  return false;
			  }     
	    }
	    else return(true);
	  } else {
	    if (field.value.trim() == nullvalue){
	    	alert("Debe ingresar un valor en " + fieldname);      
	      return(false);
	    }
	    else return(true);
	  }
  } //validar_valor_nulo_no_focus

/* validar_length: valida que la entrada tenga cierto tama�o */
  function validar_length(field, fieldname, length){
    if (field.value.length != length){
	  alert("Debe ingresar " + length + " caracteres en "+ fieldname);
//      field.focus();
      return(false);
    }
    else return(true);
  }

/*combo_include_value: Verifica si el combo incluye como opcion el valor que recibe como parametro*/
	function combo_include_value(combo, valor) {
	    var i = 0;
	    var includes = false;
	    //Recorre el combo verificando si existe el valor
	    while ((i < combo.options.length) && (!includes)) {
	    	includes = (combo.options[i].value.trim() == valor.trim());
			i++;
	    }
	    return includes;
	}

/* locate: posiciona un combo box dado un valor */
  function locate(lista,valor){
	var i = 0;
	if (lista.options) {
		while ((i < lista.options.length) && (valor != lista.options[i].value)){
		      i++;
		    } //while
		lista.selectedIndex = (i < lista.options.length) ? i : 0;
	}
    
  }

/*get_combo_value: retorna el value del item seleccionado en el combo*/
  function get_combo_value(combo) {
    return combo.options[combo.selectedIndex].value;
  }

/*get_combo_text: retorna el text del item seleccionado en el combo*/
  function get_combo_text(combo) {
    return combo.options[combo.selectedIndex].text;
  }

/* locate_combo: posiciona un combo box dado con el valor de un field */
  function locate_combo(combo,input){
    locate(combo,input.value);
  }

/* locate_combo_detalle: posiciona un combo box dado con el valor de un field y setea el detalle en otro input */
  function locate_combo_detalle(combo,input,detalle){
    locate_combo(combo,input);
    detalle.value = combo.options[combo.selectedIndex].text;
  }
  
/* set_input_combo: setea un input cuando cambia un combo */
  function set_input_combo(combo,input){
    input.value = combo.options[combo.selectedIndex].value;
  }

/* set_input_combo_detalle: setea un input cuando cambia un combo y el detalle en otro*/
  function set_input_combo_detalle(combo,input,detalle){
    input.value = combo.options[combo.selectedIndex].value;
    detalle.value = combo.options[combo.selectedIndex].text;
  }


/* browser_name: retorna el nombre del browser */
  function browser_name(){
  	var useragent = navigator.userAgent;
	var bName = (useragent.indexOf('Opera') > -1) ? 'Opera' : navigator.appName;
	var pos = useragent.indexOf('MSIE');
	if (pos > -1) {
		bVer = useragent.substring(pos + 5);
		var pos = bVer.indexOf(';');
		var bVer = bVer.substring(0,pos);
	}
	var pos = useragent.indexOf('Opera');
	if (pos > -1)	{
		bVer = useragent.substring(pos + 6);
		var pos = bVer.indexOf(' ');
		var bVer = bVer.substring(0, pos);
	}
	if (bName == "Netscape") {
		var bVer = useragent.substring(8);
		var pos = bVer.indexOf(' ');
		var bVer = bVer.substring(0, pos);
	}
	if (bName == "Netscape" && parseInt(navigator.appVersion) >= 5) {
		var pos = useragent.lastIndexOf('/');
		var bVer = useragent.substring(pos + 1);
	}
	return(bName);
  }

/* browser_version: retorna la versi�n del browser */
  function browser_version(){
  	var useragent = navigator.userAgent;
	var bName = (useragent.indexOf('Opera') > -1) ? 'Opera' : navigator.appName;
	var pos = useragent.indexOf('MSIE');
	if (pos > -1) {
		bVer = useragent.substring(pos + 5);
		var pos = bVer.indexOf(';');
		var bVer = bVer.substring(0,pos);
	}
	var pos = useragent.indexOf('Opera');
	if (pos > -1)	{
		bVer = useragent.substring(pos + 6);
		var pos = bVer.indexOf(' ');
		var bVer = bVer.substring(0, pos);
	}
	if (bName == "Netscape") {
		var bVer = useragent.substring(8);
		var pos = bVer.indexOf(' ');
		var bVer = bVer.substring(0, pos);
	}
	if (bName == "Netscape" && parseInt(navigator.appVersion) >= 5) {
		var pos = useragent.lastIndexOf('/');
		var bVer = navigator.appVersion; //useragent.substring(pos + 1);
	}
	return(bVer);
  }

/*is_IE: retorna true si el browser es Internet Explorer (Cualquiera de sus versiones)*/
  function is_IE() {
	var nombre = browser_name().toUpperCase();
	var ok = (nombre.indexOf("EXPLORER") > 0); 
	return ok;
  } //is_IE

/* browser_valido */
  function browser_valido(){
	var nombre = browser_name().toUpperCase();
	var version = browser_version();
	if ((nombre.indexOf("EXPLORER") > 0) && ((version * 1) < 5.0))
		document.location="BrowserInvalido.html";
	if ((nombre == "NETSCAPE") && ((version * 1) < 5.0))
		document.location="BrowserInvalido.html";
	if ((nombre.indexOf("EXPLORER") > 0) && ((version * 1) < 5.5)){
		document.location="BrowserInvalido.html";
	}
  }

/* imprimir: abre un p�gina lista para imprimir */
  function imprimir (url){
    window.open(url,'','width=750,height=550,status=no,scrollbars=0,resizable=no,top=0,left=0');
  }

/* textarea_maxlength: limita la longitud de un textarea*/
  function textarea_maxlength(field, maxlimit) {
    if (field.value.length > maxlimit){
      field.value = field.value.substring(0, maxlimit);
    }
  }
  
/* uncheckOthers: deschequea todos los checks excepto el correspondiente al check index*/  
  function uncheckOthers(formcheckbox, inputCheck) {
	for (var i = 0; (i < formcheckbox.length); i++) {
		if (inputCheck != formcheckbox[i]) {
			formcheckbox[i].checked = false;
			} //if
	} //for	
  } //uncheckOthers
  
  function alertErrorMessage(mesagge, windowWidth) {
//		Dialog.alert(null, message, 
//                    {windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		        					    width:windowWidth, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					    okLabel: "Aceptar"});  
	  alert(message);
  } //alertErrorMessage
  
  
	/* setSizeContainer: se utiliza para darle al contendor (elemento "div") del listado el tama�o (width y height)
			de la ventana (browser). Adem�s como al cargarse la p�gina se ejecuta la instrucci�n 
			"window.onresize = setSizeListContainer;" cuando se cambia de tama�o la ventana el contenedor se ajusta 
			a la misma.
	*/
	//Constantes
	var SCROLL_HEIGHT = 16;
	function setSizeContainer(table, container, leftContainer, offsetContainerHeight) {
		container.style.overflow = "auto";
		container.style.position = "absolute";
		if (is_IE()) {
		    container.style.width = parseInt(document.body.clientWidth) - ((3 * SCROLL_HEIGHT) / 2);
		    container.style.height = parseInt(document.body.clientHeight) - offsetContainerHeight;
		} //if
		else {
			container.style.width = window.innerWidth - (SCROLL_HEIGHT * 2);
			container.style.height = window.innerHeight - (offsetContainerHeight + SCROLL_HEIGHT);
		} //else
		container.style.left = leftContainer;
		table.style.height = parseInt(container.style.height) + SCROLL_HEIGHT;
		table.width = container.style.width;
	} //setSizeListContainer
	
	function setHeightContainer(table, container, leftContainer, offsetContainerHeight) {
		container.style.overflow = "auto";
		if (is_IE()) {
		    container.style.height = parseInt(document.body.clientHeight) - offsetContainerHeight;
		} else {
			container.style.height = window.innerHeight - (offsetContainerHeight + SCROLL_HEIGHT);
		}
		container.style.left = leftContainer;
		table.style.height = parseInt(container.style.height) + SCROLL_HEIGHT;
		table.width = container.style.width;
	}
	
//	Responsive2017 - BORRAR INI	
//	/*
//		Muestra la barra de progreso miestras se ejecuta una acci�n
//	*/
//	function showLoadingBar(showLoadingBar) {
//		if (showLoadingBar) {
//			Dialog.info("Procesando...",
//						{windowParameters: {title: "", className: "theme1_info", informationImage: basepath+"images/loadinfo_indicator.gif",
//						width:150, height:50, closable:false, resizable:false, minimizable:false, maximizable:false}, okLabel:""});
//		}//if
//		//var elemento = document.getElementsByClassName('sub'); 
//		//if (elemento.style == "block") {
//		//	alert("hola");
//		//	elemento.style = "none";
//		//}
//	} //showLoadingBar
//	Responsive2017 - BORRAR FIN	

	/*Retorna TRUE si la plataforma en la que corre el navegador es WinCE*/
		function isNavigatorPlatformWinCE() {
			return 'WinCE'.equalsIgnoreCase(navigator.platform);
		} //isNavigatorPlatformWinCE
	
	/*Retorna TRUE si la plataforma en la que corre el navegador es Win32*/
		function isNavigatorPlatformWin32() {
			return 'Win32'.equalsIgnoreCase(navigator.platform);
		} //isNavigatorPlatformWin32
		
	/*
	 open_modal_window: abre una ventana modal mostrando el mensaje recibido como 
	 par�metro.
	 */	
	function open_modal_window(modal_window, title, width, height, type) {
		if ((typeof $jqfp == "undefined") || (typeof Dialog != "undefined")) {
			var mensaje = '';
			try {
				mensaje = typeof modal_window == "string" ? modal_window : modal_window.innerHTML;
				if (typeof mensaje == "undefined"){
					mensaje = '<p style="color:#000000; font-size: 12px;"> Error, verifique los datos </p>';
				}
			} catch (e) {
				mensaje = '<p style="color:#000000; font-size: 12px;"> Error, verifique los datos! </p>';
			}
			var win = Dialog.openDialog(mensaje, 
				    {windowParameters: {title: title, 
										className: "theme1", 
    									width: width, height: height, 
    									resizable: false, 
		    							minimizable: false, 
		    							maximizable: false}});
			win.setOpacity(1);
		} else {
			modalB.show((type ? type : "warning"), title, modal_window,
						[{ text: "Aceptar", 
						   cerrar: true, 
						   claseCss: "hierarchy_1" }]);
		}
	} //open_modal_window
	
	/*
	 open_creating_report_window: abre una ventana modal informando al usuario
	 que su solicitud ya ha sido procesada.
	 */
	function open_creating_report_window() {
//		var message = '<table align="center" id="error-table" class="row" cellpadding="2" cellspacing="2" height="100%">';
//		message += '<tr height="90%" ><td width="10%" align="center" style="vertical-align: middle;">';
//		message += '<img src="' + basepath + 'images/interface/advertencia.gif"></td>';
//		message += '<td id="mensaje-error" class="tdw" style="vertical-align: middle;">Su solicitud ya ha sido procesada.<br>Espere miestras se genera el reporte.</td></tr>';
//		message += '<tr height="10%"><td align="center" colspan="2">';
//		message += '<input type="button" class="buttons" style="margin-bottom: 10px;" value="Aceptar" onclick="javascript: Dialog.closeInfo();" /></td></tr></table>';
//		Dialog.openDialog(message, 
//						    {windowParameters: {title: "Advertencia", 
//			    								className: "theme1", 
//				    							width: 250, height: 100, 
//				    							resizable: false, 
//				    							minimizable: false, 
//				    							maximizable: false}});
		modalB.show("Advertencia", "Advertencia", "Su solicitud ya ha sido procesada.<br>Espere miestras se genera el reporte.",
		[
			 {
				 text: "Aceptar", 
				 cerrar: true, 
				 claseCss: "hierarchy_1", 
			 	},
			 ]);
	} //open_creating_report_window

	function close_modal_window_key_esc(value) {
		var key = value.keyCode;
		var esc = 27;
		if (key == esc) {
			Dialog.closeInfo();
		}
	}

	function checkReportServlet() {
	    var url = basepath + "checkReportPrint.do";
	    return sendRedirect(url, null, "Get", false);
	} //checkReportServlet
	
	function sendRedirect(url, params, method, async) {
	    if (window.XMLHttpRequest) {
	        req = new XMLHttpRequest();
	    }
	    else if (window.ActiveXObject) {
	        req = new ActiveXObject("Microsoft.XMLHTTP");
	    }
	    req.open(method, url, async);
	    //req.onreadystatechange = callback;
	    /* @lvalenti -----FIX PARA DETECTAR PETICIONES AJAX -----*/
		req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	    req.send(params);
	    var responseReportServletOk = req.responseXML;
	    var root = responseReportServletOk.documentElement;
	    var responseNodes = root.getElementsByTagName("response");
	    return responseNodes[0].firstChild.nodeValue;
	} //sendRedirect
	
	//addOption2Select: agrega una nueva option al select con los valores recibidos
	function addOption2Combo(combo, label, value) {
		var no = new Option();
		no.value = value;
		no.text = label;
		combo.options[combo.options.length] = no;		
	} //addOption2Combo
	
	/* is_email_valido: valida que la cadena ingresada se corresponda con formato v�lido de direcci�n de mail */
	function is_email_valido(field,fieldname) {
		var regExPattern = /^[_A-Za-z0-9-]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*(\.[A-Za-z]{2,})$/;
		var mail;
		if ($jqfp) {
			mail = $jqfp(field).val();
		}else {
			mal = field.value;
		}
	    var ok = true;
	    if (!mail.match(regExPattern)) {
	    	ok = false;
//	 	   	Dialog.alert(field, "Ingrese una direcci�n de e-mail v�lida en " + fieldname, 
//	 	   				{windowParameters: {title: "Error", className: "theme1", errorImage: basepath+"images/error.gif",
//		           					   width:260, height:100, resizable:false, minimizable:false, maximizable:false}, 
//		           					   okLabel: "Aceptar"});
	    	alert("Ingrese una direcci\u00F3n de e-mail v\u00E1lida en " + fieldname);
	    	field.focus();
	 	}
	    return ok;
	} //is_email_valido

	/**
	 * Inicializa todos los campos obligatorios para que en el evento "blur" se ejecute la funcion "resaltar_campo_obligatorio_nulo".
	 * Y adem�s, si el campo obligatorio no tiene cargado ning�n valor o el valor 0, se resalta el campo con color de fondo amarillo.
	 */
	function initialize_campos_obligatorios_nulos() {
		var elements = document.getElementsByClassName('campoObligatorio');
		for ( var i = 0; i < elements.length; i++) {
			initialize_campo_obligatorio_nulo(elements[i]);
		}
	} //resaltar_campos_obligatorios_nulos
	function initialize_campo_obligatorio_nulo(campo) {
		//Event.observe(campo, 'change', resaltar_campo_obligatorio_nulo);
		//resaltar_campo_nulo(campo);
	} //initialize_campo_obligatorio_nulo
	
	/**
	 * Si el campo obligatorio no tiene cargado ning�n valor o tiene seteado el valor 0, 
	 * se resalta el campo con color de fondo amarillo.
	 * @param event
	 */
	function resaltar_campo_obligatorio_nulo(event) {
		var campo = Event.element(event);
		resaltar_campo_nulo(campo);
	} //resaltar_dato_obligatorio_nulo

	/**
	 * Si el campo obligatorio no tiene cargado ning�n valor o tiene seteado el valor nulo recibido como par�metro, 
	 * se resalta el campo con el color de fondo amarillo. 
	 * Salvo si el tipo de documento es pasaporte.
	 * @param campo
	 */
	function resaltar_campo_nulo(campo) {
		if (campo && (''.equalsIgnoreCase(campo.value.trim()) || 
			(isNumeric(campo.value) && (parseInt(campo.value.trim()) == 0)))) {
			Element.removeClassName(campo, 'grayBackgroundColor');
			Element.addClassName(campo, 'yelowBackgroundColor');
		} else {
			Element.removeClassName(campo, 'yelowBackgroundColor');
			Element.addClassName(campo, 'grayBackgroundColor');
		}
	}

	/**
	 * Retorna true si el valor recibido como par�metro es num�rico.
	 * @param input
	 * @returns {Boolean}
	 */
	function isNumeric(value) {
	    return ((value - 0) == value) && (value.length > 0);
	}

	function pageWidth()
	{
		return window.innerWidth != null ? window.innerWidth : document.documentElement && document.documentElement.clientWidth ? document.documentElement.clientWidth : document.body != null ? document.body.clientWidth : null;
	}

	function pageHeight()
	{
		return window.innerHeight != null? window.innerHeight : document.documentElement && document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body != null? document.body.clientHeight : null;
	}

	function posLeft()
	{
		return ((window.screenX) ? window.screenX : window.screenLeft);
	}

	function posTop()
	{
		return ((window.screenY) ? window.screenY + 50 : window.screenTop);
	}

	/**
	 * Elimina el item del arreglo "array" que se encuentra en la posici�n "arrayIndex"
	 * @param array
	 * @param arrayIndex
	 */
	function removeByIndex(array,arrayIndex){ 
		array.splice(arrayIndex,1); 
	}

	var RAMO_AUTOMOTOR = 4;
	var RAMO_MOTOVEHICULO = 44;
	var RAMO_GRANIZO = 10;
	var RAMO_ACCIDENTES_PERSONALES = 12;
	var RAMO_COMBINADO_FAMILIAR = 24;
	var RAMO_INTEGRAL_COMERCIO = 25;
	var RAMO_ART = 80;
	
	function is_ramo_denuncia_mars(ramo) {
		return !is_ramo_automotor_motovehiculo(ramo)
				&& !is_ramo_combinado_familiar(ramo)
				&& !is_ramo_integral_comercio(ramo)
				&& !is_ramo_art(ramo)
				&& !is_ramo_granizo(ramo)
				&& !is_ramo_accidentes_personales(ramo);
	}
	
	function is_ramo_combinado_familiar(ramo) {
		return (RAMO_COMBINADO_FAMILIAR == ramo);
	}
	
	function is_ramo_integral_comercio(ramo) {
		return (RAMO_INTEGRAL_COMERCIO == ramo);
	}
	
	function is_ramo_art(ramo) {
		return (RAMO_ART == ramo);
	}
	
	function is_ramo_automotor_motovehiculo(ramo) {
		return is_ramo_automotor(ramo) || (RAMO_MOTOVEHICULO == ramo);
	}

	function is_ramo_automotor(ramo) {
		return (RAMO_AUTOMOTOR == ramo);
	}

	function is_ramo_granizo(ramo) {
		return (RAMO_GRANIZO == ramo);
	}
	
	function is_ramo_accidentes_personales(ramo) {
		return (RAMO_ACCIDENTES_PERSONALES == ramo);
	}

	var ajaxHelper = {
			/**
			 * Obtiene el objeto para realizar la llamada ajax seg�n el navegador
			 */
			getHttpReq: function() {
				var http_request = new XMLHttpRequest();
				try {
					// Opera 8.0+, Firefox, Chrome, Safari
					http_request = new XMLHttpRequest();
					
				} catch (e) {
					// Internet Explorer Browsers
					try {
						http_request = new ActiveXObject("Msxml2.XMLHTTP");
					} catch (e) {
						try {
							http_request = new ActiveXObject("Microsoft.XMLHTTP");
						} catch (e) {
							// Something went wrong
							return false;
						}
					}
				}
				return http_request;
			}
	};	
	
	function loadFechaActual() {
		 var req = ajaxHelper.getHttpReq(),
			url = basepath + "loadFechaActual.do";
		req.open("GET", url, false); //false => sincr�nico
		/* @lvalenti -----FIX PARA DETECTAR PETICIONES AJAX -----*/
		req.setRequestHeader("X-Requested-With", "XMLHttpRequest");
		req.send();

		// Procesar respuesta
		var fechaJSON = null;
		if (req.responseText) {
			try {
				fechaJSON = JSON.parse(req.responseText);
			} catch (e) {
				if (console) {
					console.info("No se pudo parsear la respuesta.");
				};
			};
		};
		if (fechaJSON) {
			msg = fechaJSON.mensaje;
			if (fechaJSON.valido == true ) {
				var fecha = parse_date(fechaJSON.fecha);
				fecha.setHours(fechaJSON.hora, fechaJSON.minutos, fechaJSON.segundos);
				return fecha;
			}
		}
	}
	
	function mostrar_busqueda_marca_modelo()
    {
        var url = basepath + 'StrutsJsfServlet?beanName=buscarVehiculoCotizacionBean&method=init';
        url += '&cdMarca=' + document.getElementById('codigoMarcaInput').value;
        url += '&cdFieldCdMarca=' + 'codigoMarcaInput';
        url += '&cdFieldAnio=' + 'anio';
        url += '&cdFieldCdModelo=' + 'codigoModeloInput';

        xWidthActualWindow = pageWidth();
        xHeightActualWindow = pageHeight();
        xLeftActualWindow = posLeft();
        xTopActualWindow = posTop();
        
        xWidth = (xWidthActualWindow * 80 / 100);
        xHeight = (xHeightActualWindow * 80 / 100);
        xLeft = ((xWidthActualWindow * 10 / 100) + xLeftActualWindow);
        xTop = ((xHeightActualWindow * 10 / 100) + xTopActualWindow);

        xParams = "width=" + xWidth + ", height=" + xHeight + ", left=" + xLeft + ", top=" + xTop + ", menubar=no, resizable=yes, scrollbars=yes, status=no, titlebar=no, toolbar=no, modal=yes";
        window.open(url, "buscarVehiculoCotizacion", xParams);
    }
	
	//JQuery
	var jqUiDialog = {
			showConfirm: function(titulo, txtMsj, funcAceptar, funcCancelar) {
				var divC = $jqfp('<div id="dialogConfirm"><p> '+ txtMsj +' </p></div>');
				//Dialogo
				divC.dialog({
					title: titulo,
					resizable: false,
					//draggable: false,
					height: "auto",
					width: 320,
					modal: true,
					dialogClass: 'dialogConfirm',
					buttons: {
						Aceptar: function() {
							if (funcAceptar) {
								funcAceptar();
							}
							$jqfp( this ).dialog( "close" );
						},
						Cancelar: function() {
							if (funcCancelar) {
								funcCancelar();
							}
							$jqfp( this ).dialog( "close" );
						}
					}
				});
			},
			showAlert: function(titulo, txtMsj, funcAceptar) {
				var divC = $jqfp('<div id="dialogConfirm"><p>'+ txtMsj +'</p></div>');
				//Dialogo
				divC.dialog({
					title: titulo,
					resizable: false,
					//draggable: false,
					height: "auto",
					width: 320,
					modal: true,
					dialogClass: 'dialogConfirm',
					buttons: {
						Aceptar: function() {
							if (funcAceptar) {
								funcAceptar();
							}
							$jqfp( this ).dialog( "close" );
						}
					}
				});
			}
	};
	
	function mostrarArchivoSistema(nombreArchivo, contentType) {
		window.location = basepath + 'mostrarArchivoSistema.do?nombreArchivo=' + nombreArchivo + '&contentType=' + contentType;
	} //mostrarArchivoSistema
	
	/**
	 * Returns a random number between min (inclusive) and max (exclusive)
	 */
	function getRandomArbitrary(min, max) {
	    return Math.random() * (max - min) + min;
	}

	function registrarActividadProductor(idMenu,tituloMenu){
		var 
			url = basepath + 'registrarActividadProductor.do?idMenu=' + idMenu + '&tituloMenu=' +tituloMenu;		
	    return sendRedirect(url, null, "Post", true);
	    /*		sendRedirect(url, params, method, async)*/
	} 
	
 
	