var CD_MONEDA_DOLAR = "2";
var hlp = {
		redirectTo: function(uri) {
			window.location.href = BASE_PATH + "/" + uri;
		},
		loadPoliza: function(idPoliza) {
			hlp.redirectTo("loadPoliza.do?id="+ idPoliza +"&back=true");
		},
		crearRow: function(cells, rowNum, idRow, rowClass) {
			var row = document.createElement("tr"), i,
				rClass = (rowNum % 2) ? 'even ' : 'odd ';
				rClass = rClass + rowClass;
			for (i = 0; i < cells.length; ++i) {
				row.appendChild(cells[i]);
			}
			row.id = idRow;
			row.className = rClass;
			return row;
		},
		crearRowHeader: function(cells, rowNum, idRow, rowClass) {
			var row = document.createElement("th"), i,
				rClass = (rowNum % 2) ? 'even ' : 'odd ';
				rClass = rClass + rowClass;
			for (i = 0; i < cells.length; ++i) {
				row.appendChild(cells[i]);
			}
			row.id = idRow;
			row.className = rClass;
			return row;
		},
		crearCell: function(cont, attrs, isHead) {
			var c = isHead ? document.createElement("th") : document.createElement("td");
			//Setea propiedades
			for (var prop in attrs) {
				if (attrs.hasOwnProperty(prop)) {
					c[prop] = attrs[prop];
				}
			}
			c.innerHTML = cont;
			return c;
		},
		toDate: function(dateStr) {
		    var parts = dateStr.split("/");
		    return new Date(parts[2], parts[1] - 1, parts[0]);
		},
		dateToStr: function(date) {
			var yyyy = date.getFullYear().toString(),
				mm = (date.getMonth()+1).toString(),
				dd = date.getDate().toString();
			return yyyy + "-" + mm + "-" + dd;
		},
		dateToStrDDMM: function(date) {
			var mm = (date.getMonth()+1).toString(),
				dd = date.getDate().toString();
			return dd + "/" + mm;
		},
		formatCurr: function(num) {
			num = num.toFixed(2);
		    var parts = num.toString().split(".");
		    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		    return parts.join(",");
		},
		getLabelSpan: function(text, styleClass, cuotaID, setClassTT) {
			styleClass = setClassTT ? (styleClass + " celdasColores ") : styleClass;
			return "<span id='lbl"+ cuotaID +"' class='label "+ styleClass +"'>" + text + "</span>";
		},
		getLabel: function(cuota, cuotaID, setClassTT) {
			var classSelected = (cuota.selected == true) ? "rcSelected" : "";
	    	var textoCuota = (cuota.tipoGarantiaCobertura !== "N") ? "G" : cuota.color;
	    	var classPrimerCuota = "";
			if (cuota.obligacionPagoPermitida) {
		    	if (cuota.primerCuota) {
		    		classPrimerCuota = " paddingLeft5 paddingRight5 ";
		    		textoCuota = textoCuota + '<font style="font-size: 9px;">1</font>';
		    	}
				switch(cuota.color) {
			    case "V":
			        return hlp.getLabelSpan(textoCuota, "label-success " + classSelected + classPrimerCuota, cuotaID, setClassTT);
			        break;
			    case "A":
			        return hlp.getLabelSpan(textoCuota, "label-warning " + classSelected + classPrimerCuota, cuotaID, setClassTT);
			        break;
			    case "R":
			        return hlp.getLabelSpan(textoCuota, "label-danger " + classSelected + classPrimerCuota, cuotaID, setClassTT);
			        break;
			    default:
			    	return hlp.getLabelSpan(textoCuota, "label-info " + classSelected + classPrimerCuota, cuotaID, setClassTT);
				}
			} else {
				return hlp.getLabelSpan(textoCuota, "label-default " + classSelected + classPrimerCuota, cuotaID, setClassTT);
			}
			
		},
		getCuotaID: function(cuota, separador) {
			//var fe = cuota.fechaVencimiento.split(' ').join('_').replace(/,/g, "");
			return cuota.ramo + separador + cuota.poliza + separador + cuota.certificado + separador + cuota.fechaVencimientoStr;
		},
		getTooltip: function(cuota, cuotaID, cuerpo, esSimple) {
			var cont = "";
			if (esSimple) {
				cont += "<div id='tooltip"+ cuotaID +"' style='display:none'>";
			} else {
				cont += "<div class='tooltip"+ cuotaID +"' style='display:none'>";
			}
			cont += 		cuerpo;
			cont +=		"</div>";
			
			return cont;
		},
		getTooltipCuerpo: function(cuota) {
			var cuotaID = hlp.getCuotaID(cuota, "-");
			var cont = "";
				cont +=		"<div class='qtip-subtitle'>";
				cont += 		hlp.getLabel(cuota, cuotaID, false);
				cont += 		" P\u00F3liza: ";
				cont +=			"<a href='#' onclick='hlp.loadPoliza(\""+ cuota.id +"\")'>"; 
				cont += 		cuota.id;
				cont +=			"</a>";
				cont += 		"<a style='cursor:pointer;float: right;margin-right: 10px;' class='closeQtip'><i class='fa fa-close'></i></a>";
			if (cuota.asegura2) {
				cont +=			"<img height='20' class='img-tipo-poliza' src='"+ basepath +"images/logo-a2.gif'>";
			}
			if (cuota.ms) {
				cont +=			"<img height='20' class='img-tipo-poliza' src='"+ basepath +"images/mas_simple_logo.png'>";
			}
				cont +=		"</div>";	
			if (cuota.primerCuota) {
				cont +=		"<div class='row' style='text-align: center'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'><strong>Primer cuota</strong></span>";
				cont +=			"</div>";
				cont +=		"</div>";
			}			
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'>Productor: </span>";
				cont +=				"<strong>" + cuota.codigoProductor + " - " + cuota.nombreProductor + "</strong>";
				cont +=			"</div>";
				cont +=		"</div>";
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'>Cliente: </span>";
				cont +=				"<strong>" + cuota.asegurado + "</strong>";
				cont +=			"</div>";
				cont +=		"</div>";
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'>Vencimiento: </span>" ;
				cont +=				"<strong>" + cuota.fechaVencimiento + "</strong>";
				cont +=			"</div>";
				cont +=		"</div>";
//				cont +=		"<div class='row'>";
//				cont +=			"<div class='col-md-12'>";
//				cont +=				"<span class='text-info'>P\u00F3liza: </span>";
//				cont +=				"<a href='#' onclick='hlp.loadPoliza(\""+ cuota.id +"\")'>"; 
//				cont += 			cuota.id;
//				cont +=				"</a>";
//				cont +=			"</div>";
//				cont +=		"</div>";
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'>Saldo: </span>";
				cont +=				"<strong>" + cuota.signoMoneda + " " + hlp.formatCurr(cuota.monto) + "</strong>";
				cont +=			"</div>";
				cont +=		"</div>";
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'>Estado: </span>";
				cont +=				"<strong>" + cuota.estado + "</strong>";
				cont +=			"</div>";
				cont +=		"</div>";
			if (cuota.pagoEnTramite) {
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'><strong>Tiene pagos en tr\u00E1mite</strong></span>";
//				cont +=				"<strong>" + cuota.signoMoneda + " " + hlp.formatCurr(cuota.pagoEnTramite) + "</strong>";
				cont +=			"</div>";
				cont +=		"</div>";
			}

			if (cuota.observacion1 && cuota.observacion1.trim() !== "" ) {
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'><strong>" + cuota.observacion1 + "</strong></span>";
				cont +=			"</div>";
				cont +=		"</div>";
			}

			if (cuota.observacion2 && cuota.observacion2.trim() !== "") {
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'><strong>" + cuota.observacion2 + "</strong></span>";
				cont +=			"</div>";
				cont +=		"</div>";
			}

			if (cuota.observacion3 && cuota.observacion3.trim() !== "") {
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12'>";
				cont +=				"<span class='text-info'><strong>" + cuota.observacion3 + "</strong></span>";
				cont +=			"</div>";
				cont +=		"</div>";
			}
			if (cuota.obligacionPagoPermitida) {
//				cont +=		"<div class='row'>";
//				cont +=			"<div class='col-md-12'>";
//				cont +=				"<label>";
//				cont +=					"A cobrar al cliente? ";
//				cont +=					"<input type='checkbox' id='chk"+ cuotaID +"' ";
//				if (cuota.aCobrarAseg) { cont += " checked='checked' "; }
//				cont +=					" onchange='ppal.chkACobrarAseg(\""+ cuotaID +"\")' class='marginTop0 marginLeft5'>";
//				cont +=				"</label>";
//				cont +=			"</div>";
//				cont +=		"</div>";
//				cont +=		"<div class='row' id='row-txa"+ cuotaID +"' style='display:none;'>";
//				cont +=			"<div class='col-md-12'>";
//				cont +=				"<textarea id='txa"+ cuotaID +"' maxlength='100' style='width:100%;background-color:#ffffff;'></textarea>";
//				cont +=			"</div>";
//				cont +=		"</div>";
				cont +=		"<div class='row'>";
				cont +=			"<div class='col-md-12 textRight'>";
				cont +=				"<span class='spn"+ cuotaID +" glyphicon glyphicon-refresh glyphicon-spin' style='display: none;'></span>";
				if (cuota.selected) {
					cont +=			"<a class='btn btn-primary btn-xs active disabled' role='button' disabled='disabled'>Pedido generado</a>";
				} else {
//					cont +=			"<a class='btn btn-default btn-xs' role='button' onclick='ppal.generarObligacion(\""+ cuotaID +"\"),ppal.showLoading(\""+ cuotaID +"\")'>Obligaci\u00f3n</a>";
					cont +=			"<a class='btn btn-default btn-xs cajaTrigger' data-id='" + cuotaID + "' role='button' onclick='cajota.obtenerOpcionesCuotasImpagas(this)'>Caja</a>";
				}
				cont +=			"</div>";
				cont +=		"</div>";
			}

			return cont;
		},
		initTooltip: function() {
			$jqfp(".celdasColores").each(function(){
				if ($jqfp(this)) {
					var celdaColor = $jqfp(this),
						cuotaId = celdaColor.prop("id").substr(3),
						cont;

					if ($jqfp("#tooltip" + cuotaId).length) {
						cont = $jqfp("#tooltip" + cuotaId);
					} else {
						cont = $jqfp(".tooltip" + cuotaId);
					}

					celdaColor.qtip({
						content: cont,
						show: {
							event: 'click',
							solo: true
						},
						hide: {
							target: $jqfp('.closeQtip'),
							event: 'click'
							//fixed: true,
							//delay: '300'
						},
						style: { 
							classes: 'qtip-blue qtip-shadow minWidth150'
						},
						position: {
							viewport: $jqfp("#listadoPanel"),
							adjust: {
								method: 'shift none'
							}
						}
					});
				}
			});
		},
		initExtraTooltip: function() {
			$jqfp('.tt img').each(function() {
		        $jqfp(this).qtip({
		            content: {
		                text: $jqfp(this).next('.tooltiptext')
		            },
		            style: 'estiloTooltipOriginal'
		        });
		    });
		},
		initSelect2Cobradores: function() {
			try {
				if ($jqfp("#selCobradores")) {
					$jqfp("#selCobradores").select2({
						tags:[],
						tokenSeparators: [",", " "],
						placeholder: "Ingrese los cobradores por los que desea filtrar"
					});
					$jqfp("#selCobradores").on("change", function(e) {
						$jqfp("#hdnCobradores").val($jqfp("#selCobradores").val());
				    });
				}
			} catch (e) {
				console.error(e);
			}
		},
		dibujarCuotaIndividual: function(arrayCuotas) {
			var cont = "", cuota = arrayCuotas[0],
				cuotaID = hlp.getCuotaID(cuota, "-"),
				cuerpo = hlp.getTooltipCuerpo(cuota);
			cont += hlp.getLabel(cuota, cuotaID, true) + hlp.getTooltip(cuota, cuotaID, cuerpo, true);
			return cont;
		},
		dibujarCuotasMultiples: function(arrayCuotas) {
			var i, len = arrayCuotas.length,
				cuotaParaId = arrayCuotas[0],
				cuotaID = hlp.getCuotaID(cuotaParaId, "-") + "-plus",
				cont = "", todosGenerados = true;

			for (i = 0; i < len; ++i) {
				if (i in arrayCuotas) {
					var cuota = arrayCuotas[i],
					cuerpo = hlp.getTooltipCuerpo(cuota);
					cont +=  hlp.getTooltip(cuota, cuotaID, cuerpo, false);
					todosGenerados = todosGenerados & cuota.selected;
				}
			}
			var rcSel = todosGenerados ? "rcSelected" : "",
				span = hlp.getLabelSpan("+", " label-primary celdasColores " + rcSel, cuotaID, true);

			return span + cont;
		},
		filtrarListado: function() {
			var nombres = JSON.parse(jsonNombreAsegurados),
				q = $jqfp("#txtFiltroAsegurados").val(),
				patt = new RegExp(q.toLowerCase());

			if (q.length === 0) {
				$jqfp("#tblCuotasImpagas > tbody > tr").show();
			} else {
				$jqfp("#tblCuotasImpagas > tbody > tr").hide();
				// Mostrar las que concuerden
				$jqfp.each(nombres, function(k, v) {
					if (patt.test(v.toLowerCase())) {
						$jqfp("#" + k).show();

						// Muestra tambien los miembros del grupo
						var clases = $jqfp("#" + k).attr('class').split(/\s+/);
						$jqfp.each(clases, function(i, cls){// Busca la clase del grupo
							if (cls.startsWith('grupo')) {
								$jqfp("." + cls).show();
							}
						});
					}
				});
			}
		},
		initFiltroAsegurados: function() {
			$jqfp("#txtFiltroAsegurados").on('keyup', function(e) {
				hlp.filtrarListado();
			});
		},
		getInputFiltroAsegurados: function() {
			return "<div style='position:relative'>" +
						"<input type='text' id='txtFiltroAsegurados' style='padding-right: 20px'/>" +
						"<a style='position: absolute; display: inline-block; top: 4px; right: 13px;' onclick='hlp.borrarFiltroAsegurados()'>x</a>" +
					"</div>";
		},
		borrarFiltroAsegurados: function(idGrupo) {
			$jqfp("#txtFiltroAsegurados").val("");
			$jqfp(".grupoActivo").removeClass('grupoActivo');
			$jqfp(".iconoGrupo").css('color', '');
			$jqfp(".iconoGrupo").attr('title', 'Ver miembros del grupo');
			hlp.filtrarListado();
		},
		go_asegurado: function(tipoAsegurado, matricula, esAsegurado) {
			window.location = BASE_PATH + '/editDatosAsegurado.do?back=true&tipoAsegurado=' + tipoAsegurado + '&matricula=' + matricula + '&esAsegurado=' + esAsegurado;
		},
		go_reporte_cuotas_impagas: function(matricula) {
			url ='StrutsJsfServlet?beanName=cuotasImpagasBean&method=getReporteCuotasImpagasByClienteGrupo&matricula=' + matricula ;
        	window.location = basepath + url;
		},
		showHideMiembrosGrupo: function(idGrupo) {
			if ($jqfp(".grupo-" + idGrupo).first().hasClass('grupoActivo')) {
				hlp.borrarFiltroAsegurados();
			} else {
				$jqfp("#tblCuotasImpagas > tbody > tr").hide();
				$jqfp(".grupo-" + idGrupo).show();
				$jqfp(".grupo-" + idGrupo).addClass('grupoActivo');
				$jqfp(".grupo-" + idGrupo + " .iconoGrupo").css('color', '#013ADF');
				$jqfp(".grupo-" + idGrupo + " .iconoGrupo").attr('title', 'Ver todos');
			}
		},
		openClosestDP: function(calLink) {
			try {
				$jqfp(calLink).prevAll("input.datepicker:first").datepicker("show");
			} catch (e) {
				$jqfp(".datepicker").datepicker({ 
			        changeMonth: true, 
			        changeYear: true,
			        dateFormat: "dd/mm/yy",
			    });
				$jqfp(calLink).prevAll("input.datepicker:first").datepicker("show");
			}
		},
		resaltadoFilaYColumna: function() {
			//Resaltado de fila y columna
			$jqfp("#tblCuotasImpagas").delegate('td','mouseover mouseleave', function(e) {
				if (e.type == 'mouseover') {
					if ($jqfp(this).parent().parent().get(0).tagName !== "thead") {
						$jqfp(this).parent().addClass("hover");
						$jqfp("col").eq($jqfp(this).index()).addClass("hover");
					}
				}
				else {
					$jqfp(this).parent().removeClass("hover");
					$jqfp("col").eq($jqfp(this).index()).removeClass("hover");
				}
			});
		}
};

var ppal = {
	/**
	 * Construye la tabla de vista por dia 
	 */
	construirTabla: function() {
		var tblH = $jqfp("#tblCuotasImpagas thead"), //tblH = $jqfp("#tblCuotasImpagasHeader thead")
			tblB = $jqfp("#tblCuotasImpagas tbody"),
			//colg = $jqfp("#tblCuotasImpagas colgroup"),
			ramo = $jqfp("#ramoCaucion"),
			titNombre = ramo.val() == 13 ? "Contratante " :  "Asegurado ",
			cantFechas = 0;
		//console.log(ramo.val());
		if (jsonGridCuotasImpagas && jsonFechas) {
			var fechas = JSON.parse(jsonFechas),
				nombres = JSON.parse(jsonNombreAsegurados),
				smsDeuda = JSON.parse(jsonAdheridoSMSDeuda),
				agRecaud = JSON.parse(jsonAgenteRecaudador),
				datos = JSON.parse(jsonGridCuotasImpagas),
				celdas = [];

			//******* Encabezado de la tabla *******
				celdas.push(hlp.crearCell(titNombre + hlp.getInputFiltroAsegurados(), {}));
				//Imprimir reporte de cuotas impagas por cliente/grupo
				celdas.push(hlp.crearCell("<span></span>", {}));
				//Agrupacion de matriculas
				celdas.push(hlp.crearCell("<span title='El asegurado est\u00E1 asociado a un grupo.'>GRP</span>", {}));
				//SMS deuda
				celdas.push(hlp.crearCell("<span title='El asegurado est\u00E1 adherido al servicio de aviso de vencimiento v\u00EDa SMS'>SMS</span>", {}));
				//Agente recaudador
				celdas.push(hlp.crearCell("<span title='El asegurado abona directamente por Agentes Recaudadores'>AR</span>", {}));

				//colg.append("<col/>");
				$jqfp.each(fechas, function(k, v) {
					//celdas.push(hlp.crearCell(hlp.dateToStrDDMM(hlp.toDate(k)), {}));
					var rojo = "";
					if (v.endsWith("*")) {
						v = v.substring(0, v.length - 1);
						rojo = "class='rojo'";
					}
	
					v = v.replaceAll(" ", "<br>");
					celdas.push(hlp.crearCell("<span "+ rojo +" >" + v + "</span>", {}));
					//colg.append("<col/>");
					cantFechas ++; 					//Cantidad de columnas de la tabla
				});
				var row = hlp.crearRowHeader(celdas, 1);
				tblH.append(row);
			//******* FIN Encabezado de la tabla *******

			// Datos
			var rowNum = 0;
			for (var prop in datos) {
				if (datos.hasOwnProperty(prop)) {
					switch(smsDeuda[prop]) {
				    case 'S':
				    	marcaSMSS ='<span class="fa fa-check" style="color:#2ecc71"></span>';
				        break;
				    case 'N':
				    	marcaSMSS ='<span class="fa fa-times" style="color:#e74c3c"></span>';
				        break;
				    case "ERR":
				    	marcaSMSS='<span class="fa fa-exclamation-triangle" style="color:#e74c3c" title="ERROR -Tel\u00E9fono inexistente-"></span>';
				        break;
				    default:
				    	marcaSMSS='<span class="fa fa-exclamation-triangle" style="color:#e74c3c" title="ERROR -Tel\u00E9fono inexistente-"></span>';
					}					
					var idGrupo = ppal.getIdGrupo(prop),
						marcaGRP = idGrupo ? '<span class="fa fa-users iconoGrupo" style="cursor: pointer;" title="Ver miembros del grupo" onclick="hlp.showHideMiembrosGrupo(\''+ idGrupo +'\')"></span>' : '',
						marcaSMS = marcaSMSS,
						marcaAR = agRecaud[prop] ? '<span class="fa fa-check" style="color:#2ecc71"></span>' : '<span class="fa fa-times" style="color:#e74c3c"></span>';
					//console.log(datos[prop]);
					celdas = [];
					//Nombre
					celdas.push(ppal.crearCellNombreAsegurado(nombres[prop], prop));
					//Imprimir reporte de cuotas impagas por cliente/grupo
					celdas.push(ppal.crearCellReporte(nombres[prop], prop));
					//Grupo de asegurados
					celdas.push(hlp.crearCell("<span id='grupoAseg"+ prop +"'>" + marcaGRP + "</span>", {}));
					//SMS deuda
					celdas.push(hlp.crearCell("<span id='smsDeuda"+ prop +"'>" + marcaSMS + "</span>", {}));
					//Agente recaudador
					celdas.push(hlp.crearCell("<span id='agRecaud"+ prop +"'>" + marcaAR + "</span>", {}));

					//Crea las celdas de cada row
					$jqfp.each(fechas, function(k, v) {
						if (datos[prop].hasOwnProperty(k)) {
							var cont = "";
							if (datos[prop][k].length == 1) {
								cont = hlp.dibujarCuotaIndividual(datos[prop][k]);
							}
							if (datos[prop][k].length > 1) {
								cont = hlp.dibujarCuotasMultiples(datos[prop][k]);
							}
							cel = hlp.crearCell(cont, {});
							celdas.push(cel);
						} else {
							celdas.push(hlp.crearCell("", {}));
						}
					});

					var rowClass = idGrupo ? "grupo-" + idGrupo : "";
					rowNum ++;
					var row = hlp.crearRow(celdas, rowNum, prop, rowClass);
					tblB.append(row);
				}
			}

			// Crea los tooltips
			hlp.initTooltip();

			hlp.initFiltroAsegurados();

			var ancho = ((cantFechas + 4) * 27 + 200) + "px";
			$jqfp("#tblCuotasImpagas").css("width", ancho).css("min-width", ancho);
			$jqfp("#tblCuotasImpagasCont").css("width", ancho).css("min-width", ancho);
			$jqfp("#tblCuotasImpagasHeader").css("width", ancho).css("min-width", ancho);
			
			$jqfp("#tblCuotasImpagas thead th").css("width", ancho).css("min-width", ancho);
			$jqfp("#tblCuotasImpagas tbody").css("width", ancho).css("min-width", ancho);
			
			$jqfp("#loaderTabla").hide();
		}
	},
	crearCellNombreAsegurado: function(texto, id) {
		var tipo = id.substring(0, 1),
			matricula = id.substring(1, id.lenght);
		return hlp.crearCell("<span title='MAT: " + matricula + " - " + texto + "' id='"+ id +"'><a href=\"javascript:hlp.go_asegurado('"+tipo+"', '"+ matricula +"', true)\">" + texto + "</a></span>", {});
	},
	crearCellReporte: function(texto, id) {
		var matricula = id.substring(1, id.lenght);
		return hlp.crearCell("<span><a href=\"javascript:hlp.go_reporte_cuotas_impagas('"+ matricula +"')\"> <img src='" + basepath + "images/imprimir_16_16.gif' alt='Reporte' title='Imprimir reporte de impagas por cliente/grupo' style='border: 0; vertical-align:top;'/> </a></span>", {}); 
	},
	showLoading: function(idCuota) {
		$jqfp(".spn"+ idCuota).show();
	},
	/**
	 * Setea el label corresp como generado y controla los del mismo tooltip para marcar el label padre
	 */
	setCompletedMultiple: function(id) {
		var classList = $jqfp("#lbl"+ id).parent().parent().attr('class').split(/\s+/),
			classPlus = null;

		//Obtiene la clase padre
		$jqfp.each(classList, function(index, item) {
			if (item.startsWith("tooltip") && item.endsWith("-plus")) {
				classPlus = item;
			}
		});

		//Si todas las cuotas dentro del tooltip est�n marcadas se marca tambi�n le label padre
		if ($jqfp("#lbl"+ id).parent().parent().hasClass(classPlus)){
			$jqfp("#lbl"+ id).parent().parent().addClass('pedidoGenerado');

			var todosGenerados = true;
			$jqfp.each($jqfp("." + classPlus), function(k, v){
				todosGenerados = todosGenerados & $jqfp(this).hasClass("pedidoGenerado");
			});

			if (todosGenerados) {
				$jqfp("#" + classPlus.replace("tooltip", "lbl")).addClass("rcSelected");
			}
		}
	},
	setCompleted: function(id) {
		if($jqfp("#pagoComplete").val() === "true"){
			$jqfp(".spn"+ id).hide();
			$jqfp(".btn"+ id).text("Pedido generado");
			$jqfp(".btn"+ id).prop("disabled", "disabled");
			$jqfp(".btn"+ id).addClass("disabled");
			$jqfp(".btn"+ id).prop("onclick", "");
			$jqfp("#lbl"+ id).addClass("rcSelected");
			$jqfp("#txa" + id).prop("disabled", "disabled");
	
			ppal.setCompletedMultiple(id);
		}
	},
	setCompletedCaja: function() {
		if($jqfp("#mostrarCajaComplete").val() === "true"){
			caja.dialog("close");
			//$jqfp("#cajaSpr").css("display", true);
			$jqfp("#moduloCajaLnk").show();
		}
	},
	generarObligacion: function(cuotaId) {
		var aPagar = $jqfp('#chk' + cuotaId).is(':checked'),
			observacion = $jqfp("#txa" + cuotaId).val();
		//console.log(observacion);
		genOblPagoInd(cuotaId, aPagar, observacion);
	},
	generarRegistroCaja: function(){
		var aPagar = $jqfp('#totalAPagar').html(),
			cuotaId = $jqfp('#cuotaImpagaSel').val(),
			tasaCambio = ($jqfp('#tasaCambioPagarCuota').val() ? parseFloat($jqfp('#tasaCambioPagarCuota').val()) : 0),
			descripcionCuota = $jqfp('#descripcionCuotaSel').val(),
			endosoCuota = $jqfp('#endosoCuotaSel').val();
		//console.log("A pagar: " + aPagar + "id : " + cuotaId + " - tasa cambio: " + tasaCambio + " - desc cuota: " + descripcionCuota);
		genRegCajaInd(cuotaId, aPagar, tasaCambio, descripcionCuota, endosoCuota);
	},
	//	chkACobrarAseg: function(cuotaId) {
	//		var aPagar = $jqfp("#chk" + cuotaId).is(':checked'),
	//			observacion = $jqfp("#txa" + cuotaId).val();
	//		if (aPagar && !$jqfp(".btn"+ cuotaId).hasClass('disabled')) {
	//			$jqfp("#row-txa" + cuotaId).show('slow');
	//		} else {
	//			$jqfp("#row-txa" + cuotaId).hide();
	//		}
	//		checkACobrarAseg(cuotaId, aPagar, observacion);
	//	},
	getIdGrupo: function(idAseg) {
		var gruposClientes = JSON.parse(jsonGruposClientes),
			res = null;
		$jqfp.each(gruposClientes, function(idGrupo, arrMiembros){
			if($jqfp.inArray(idAseg, arrMiembros) > -1) {
				return res = idGrupo;
			}
		});
		return res;
	},
	validarCuotaSel: function(){
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
};

function mostrarModuloCaja(){
	$jqfp.ajax({
		url: BASE_PATH + "/generarRemesaCaja/mostrarModuloCaja.do",
		dataType: "json",
		cache: false
	}).done(
		function(jsonResponse){
			$jqfp("#mostrarCajaComplete").val(jsonResponse);
			ppal.setCompletedCaja();
		}
	).fail(
		function(error){
			//console.log(error);
		}	
	);
}

var caja;
var cajota = {
		init: function() {
			cajota.initDialog();
			//Valido si existe algun registro en el carrito de caja
			mostrarModuloCaja();
		},
		initDialog: function() {
			$jqfp("#listadoPanel").append('<div class="hidden"><div id="cuotasImpagas"><div id="cuotasImpagasContenido"></div></div></div>');
			$jqfp(caja).dialog('destroy').remove();
			caja = $jqfp("#cuotasImpagas").dialog({
				autoOpen: false,
				modal: true,
				title: "Caja",
				height: "auto",
		        width: "60%",
		        appendTo: "#page-wrapper",
				buttons : {
					"Pagar" : function(data){
						//genRegCajaInd();
						if(ppal.validarCuotaSel()){
							ppal.generarRegistroCaja();
						}
					},
					"Cancelar" : function(){
						caja.dialog("close");
					}
				}
			});
		},
		obtenerOpcionesCuotasImpagas: function(btnCaja) {
			$jqfp("body").css("cursor", "progress");
			var idCuot = $jqfp(btnCaja).attr("data-id");
			$jqfp.ajax({
				url: BASE_PATH + "/generarRemesaCaja/obtenerOpcionesCuotasImpagas.do",
				dataType: "json",
				data: {
					cuotaId: idCuot
				}
			}).done(
				function(jsonResponse){
					$jqfp("body").css("cursor", "default");
					$jqfp(".qtip").hide();
					if (jsonResponse.codMsj == "S") {
						var source   = $jqfp("#self-plan-de-pago-template").html();
	        			var template = Handlebars.compile(source);
	        			var content  = template(jsonResponse);

	        			$jqfp("#cuotasImpagasContenido").empty();
	        			$jqfp("#cuotasImpagasContenido").html(content);
	        			$jqfp("#tasaCambioPagarCuota").inputmask("9999.99", { "placeholder": "*" });
	        			var cdMoneda = $jqfp("#cdMoneda").val();
	        			/*console.info(cdMoneda);
	        			console.info(CD_MONEDA_DOLAR);
	        			console.info(cdMoneda == CD_MONEDA_DOLAR);*/
		    			if (cdMoneda == CD_MONEDA_DOLAR) {
		    				$jqfp("#tasaCambioCont").removeClass("hidden");
		    			}

		    			caja.dialog('open');
	        			//.parent().position({ my: 'top', at: 'top', of: '#listadoPanel' });	        			
    				} else {
             			jqUiDialog.showAlert("No puede abonar", jsonResponse.textoMsj);
             		}
    			}
			).fail(
				function(jqXHR, textStatus, errorThrown){
					$jqfp(".qtip").hide();
			        jqUiDialog.showAlert("No puede abonar", jqXHR.responseText);
				}	
			);
		}
};


$jqfp.datepicker.setDefaults( $jqfp.datepicker.regional[ "es" ] );
$jqfp(document).ready(function(){
	if (ppal) {
		ppal.construirTabla();
	}
	hlp.initExtraTooltip();
	hlp.initSelect2Cobradores();
	//hlp.resaltadoFilaYColumna();
	$jqfp(".datepicker").datepicker({ 
        changeMonth: true, 
        changeYear: true,
        dateFormat: "dd/mm/yy",
    });

	/* Modulo caja */
	cajota.init();

	//Resaltado de fila y columna
	/*	$jqfp("#tblCuotasImpagas").delegate('td','mouseover mouseleave', function(e) {
			if (e.type == 'mouseover') {
				if ($jqfp(this).parent().parent().get(0).tagName !== "THEAD") {
					$jqfp(this).parent().addClass("hover");
					$jqfp("col").eq($jqfp(this).index()).addClass("hover");
				}
			}
			else {
				$jqfp(this).parent().removeClass("hover");
				$jqfp("col").eq($jqfp(this).index()).removeClass("hover");
			}
		});
	*/	
});