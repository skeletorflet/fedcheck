/*********************/
/*version 1.83*/
/*********************/

var com_jquery = jQuery.noConflict();
var viewportWidth;
var scroll_top;

function showHideSearchBar(){
	// Hide Header on on scroll down
	var didScroll = false;
	var lastScrollTop = 0;
	var delta = 5;
	var $searchcontainer = com_jquery("#searchcontainer"),
		$container__page_nav = com_jquery("#page-wrapper .container__page_nav"),
		lastScrollTop = 0,
		vww = com_jquery(window).width();
	
	var navbarHeight = $searchcontainer.outerHeight();

	com_jquery(window).scroll(function(event){
	    didScroll = true;
	});
	
	com_jquery(window).resize(function(e){
		vww = com_jquery(window).width();
	});

	setInterval(function() {
	    if (didScroll && vww < 768) {
	        hasScrolled();
	        didScroll = false;
	    }else if(vww > 768){
	    	$searchcontainer.show();
	    }
	}, 250);

	function hasScrolled() {
	    var st = com_jquery(this).scrollTop();
	    
	    if(Math.abs(lastScrollTop - st) <= delta)
	        return;
	    
	    if (st > lastScrollTop && st > navbarHeight){
	    	$searchcontainer.slideUp(100);
	    	if ($container__page_nav.length) {
	       		$container__page_nav.slideUp(100);
	       }
	    } else {
	        // Scroll Up
	        if(st + com_jquery(window).height() < com_jquery(document).height()) {
	        	$searchcontainer.slideDown(100);
	        	if ($container__page_nav.length) {
		       		$container__page_nav.slideDown(100);
		        }
	        }
	    }
	    
	    lastScrollTop = st;
	}
}

com_jquery.fn.paginateTable = function (cantRows){
	this.each(function(index,element){
		var $table = com_jquery(this);
		$table.after('<div id="navPaginateTable" class="paginateNavTable"><ul class="pagination"></ul></div>');
		var $navPaginate = com_jquery("#navPaginateTable");
	    var rowsShown = cantRows;
	    var rowsTotal = $table.find('tbody tr').length;
	    var numPages = rowsTotal/rowsShown;

	    for(i = 0;i < numPages;i++) {
	        var pageNum = i + 1;
	        $navPaginate.find(".pagination").append('<li><a href="#" rel="'+i+'">'+pageNum+'</a></li>');
	    }
	    $table.find('tbody tr').each(function(i,e){ com_jquery(e).hide(); })
	    $table.find('tbody tr').slice(0, rowsShown).show();
	    $navPaginate.find(".pagination a").first().parent().addClass('active');
	    $navPaginate.find('.pagination a').on('click', function(){
	    	var $link = com_jquery(this);
	        $link.parent().siblings().removeClass('active');
	        $link.parent().addClass('active');
	        var currPage = $link.attr('rel');
	        var startItem = currPage * rowsShown;
	        var endItem = startItem + rowsShown;
	        $table.find('tbody tr').css('opacity','0.0').hide().slice(startItem, endItem).
	        css('display','table-row').animate({opacity:1}, 300);
	    });
	});
}






/*
	dateTimePickerOptions

	Le pone las mismas opciones a todos los datetimepicker de bootstrap
	Estructura:
	<div class="form-group">
	    <label for="" class="chiquita">Label</label>
	    <div class="input-group date datetimepicker" id="datetimepicker1">
	        <input type="text" class="form-control">
	        <a href="" class="input-group-addon">
	            <i class="fa fa-calendar"></i>
	        </a>
	    </div>
	</div>
	Aclaración: El datetimepicker ademas de tener la clase "datetimepicker", tiene que tener un id unico
*/
function dateTimePickerOptions(){
	com_jquery(".container-fluid").on("click", ".datetimepicker .input-group-addon", function(e){
		e.preventDefault();
	});

	com_jquery(".container-fluid").on("mousedown", ".datetimepicker .input-group-addon", function(e){
		if (!com_jquery(this).parent().data('DateTimePicker')) {
			dateTimePickerOptions();
		}
	});
	com_jquery(".container-fluid").on("mousedown", ".datetimepicker input", function(e){
		if (!com_jquery(this).parent().data('DateTimePicker')) {
			dateTimePickerOptions();
		}
	});

	com_jquery(".datetimepicker").not(".conhora, .horasola, .sindefault").each(function(){

	    com_jquery(this).datetimepicker({
	        keepOpen: false,
	        widgetPositioning: {
	        	horizontal: 'auto',
	        	vertical: 'auto'
	        },
	        debug: false,
	        showTodayButton: true,
	        format: 'DD/MM/YYYY',
	        locale: 'es',
	        icons: {
	        	close: 'fa fa-check'
	        },
	        showClose: true,
	        ignoreReadonly: false,
	        tooltips: {
	            today: 'Hoy',
	            clear: 'Limpiar selección',
	            close: 'Aplicar',
	            selectMonth: 'Seleccionar mes',
	            selectTime: 'Seleccionar hora',
	            prevMonth: 'Mes previo',
	            nextMonth: 'Mes siguiente',
	            selectYear: 'Seleccionar Año',
	            prevYear: 'Año previo',
	            nextYear: 'Año siguiente',
	            selectDecade: 'Seleccionar década',
	            prevDecade: 'Década previa',
	            nextDecade: 'Década siguiente',
	            prevCentury: 'Siglo previo',
	            nextCentury: 'Siglo siguiente',
	            incrementHour: 'Incrementar hora',
	            pickHour: 'Seleccionar hora',
	            decrementHour:'Decrementar hora',
	            incrementMinute: 'Incrementar minuto',
	            pickMinute: 'Seleccionar minuto',
	            decrementMinute:'Decrementar minuto',
	            incrementSecond: 'Incrementar segundo',
	            pickSecond: 'Seleccionar segundo',
	            decrementSecond:'Decrementar segundo',
	        }
	    });
	});
	com_jquery(".datetimepicker.conhora").each(function(){
	    com_jquery(this).datetimepicker({
	        keepOpen: false,
	        debug: false,
	        showClose: true,
	        ignoreReadonly: false,
	        showTodayButton: true,
	        format: 'DD-MM-YYYY HH:mm:ss',
	        locale: 'es',
	      	icons: {
	        	close: 'fa fa-check'
	        },
	        tooltips: {
	            today: 'Hoy',
	            clear: 'Limpiar selección',
	            close: 'Aplicar',
	            selectMonth: 'Seleccionar mes',
	            selectTime: 'Seleccionar hora',
	            prevMonth: 'Mes previo',
	            nextMonth: 'Mes siguiente',
	            selectYear: 'Seleccionar Año',
	            prevYear: 'Año previo',
	            nextYear: 'Año siguiente',
	            selectDecade: 'Seleccionar década',
	            prevDecade: 'Década previa',
	            nextDecade: 'Década siguiente',
	            prevCentury: 'Siglo previo',
	            nextCentury: 'Siglo siguiente',
	            incrementHour: 'Incrementar hora',
	            pickHour: 'Seleccionar hora',
	            decrementHour:'Decrementar hora',
	            incrementMinute: 'Incrementar minuto',
	            pickMinute: 'Seleccionar minuto',
	            decrementMinute:'Decrementar minuto',
	            incrementSecond: 'Incrementar segundo',
	            pickSecond: 'Seleccionar segundo',
	            decrementSecond:'Decrementar segundo',
	        }
	    });
	});
	com_jquery(".datetimepicker.horasola").each(function(){
	    com_jquery(this).datetimepicker({
	        keepOpen: false,
	        debug: false,
	        showClose: true,
	        ignoreReadonly: false,
	        showTodayButton: true,
	        format: 'HH:mm',
	        locale: 'es',
	        icons: {
	        	close: 'fa fa-check'
	        },
	        tooltips: {
	            today: 'Hoy',
	            clear: 'Limpiar selección',
	            close: 'Aplicar',
	            selectMonth: 'Seleccionar mes',
	            selectTime: 'Seleccionar hora',
	            prevMonth: 'Mes previo',
	            nextMonth: 'Mes siguiente',
	            selectYear: 'Seleccionar Año',
	            prevYear: 'Año previo',
	            nextYear: 'Año siguiente',
	            selectDecade: 'Seleccionar década',
	            prevDecade: 'Década previa',
	            nextDecade: 'Década siguiente',
	            prevCentury: 'Siglo previo',
	            nextCentury: 'Siglo siguiente',
	            incrementHour: 'Incrementar hora',
	            pickHour: 'Seleccionar hora',
	            decrementHour:'Decrementar hora',
	            incrementMinute: 'Incrementar minuto',
	            pickMinute: 'Seleccionar minuto',
	            decrementMinute:'Decrementar minuto',
	            incrementSecond: 'Incrementar segundo',
	            pickSecond: 'Seleccionar segundo',
	            decrementSecond:'Decrementar segundo',
	        }
	    });
	});



}
/*
	fixDatePickerOnClik:
	Funcion para ocultar la barra de búsqueda cuando se despliega el menu
*/
/*
	Localscroll:
	Funcion para anclas y animar el scroll.
	Ej:
	yo tengo un a:
	<a href="#mielemento" class="linklocal" topmenos="85">Este link va a donde empieza #mielemento</a>

	Y lo animo llamando con jquery:
	com_jquery(".localink").localscroll();
	
	El atributo topmenos es un entero que hay que pasarle en caso de que se le quiera restar offset al elemento
	(esto es para los casos que el scroll tapa el comienzo de, en este caso, el elemento con id "mielemento")
*/
com_jquery.fn.localscroll = function(menosOffset){
	return this.each(function(i,e){
		var $localink = com_jquery(this);
		var menostop = $localink.attr("topmenos");
		
		if(menostop == null || menostop == undefined){
			$localink.on("click",function(e){
				e.preventDefault();
				com_jquery('html, body').stop().animate({
				    scrollTop: com_jquery( com_jquery(this).attr('href') ).offset().top
				}, 500);
			});

		}else{
			$localink.on("click",function(e){
				e.preventDefault();
				com_jquery('html, body').stop().animate({
				    scrollTop: com_jquery( com_jquery(this).attr('href') ).offset().top-menostop
				}, 500);
			});
					}
	});
}
/*
	itemnavigato es una funcion que sirve para crear un navegador interno que funciona con anclas y con la funcion de arriba (localscroll)
	
	para que funcione hay que agregar un div en el html: <div class="navigato"></div>

	Y agregar el siguiente js:

	com_jquery(".navigato").innerNavigato(".accordion_table");

	donde: navigato es el div vacio y ".accordion_table" son los elementos que contará para formar el navador. Ej:
	Si quiero que por cara accordion_table me genere un link scrolleable y tengo 10 elemento con clase accordion_table,
	eso me va crear un navegador con 10 items scrolleables que funcionan como ancla

*/
com_jquery.fn.innerNavigato = function(itemsAnavegar, iniciarTrue){
	return this.each(function(i,e){
		var $itemnavigato = com_jquery(this),
			$items = com_jquery(itemsAnavegar),
			$anclas = com_jquery("#page-wrapper").find($items),
			heightFirstItem = $anclas.eq(0).parents(".row").siblings(".row").height(),
			cant = $anclas.length,
			$target = null,
			texto = "",
			isVisible = iniciarTrue;
			$btncollapse = null,
			vwidth = com_jquery(window).width(),
			topNavHeight = com_jquery("#topNav").outerHeight(),
			pageintnavHeight =  com_jquery(".container__page_nav").length ? com_jquery(".container__page_nav").outerHeight() : 0,
			totalHeightArestar = topNavHeight + pageintnavHeight + heightFirstItem,
			checkTocado = false;

			
	    var lastId, item, menuItems, scrollItems;
	    
	    var btn = "<li class='liNavigato'>"+
	                "<button id='toggleNavigato' class='calltoaction' data-toggle='toolttip' data-placement='bottom' title='Mostrar/ocultar navegador de cotizacion'>"+
	                	"<i class='fa fa-flag'></i>"+
	                "</button>"+
	              "</li>";
	    com_jquery(btn).appendTo("ul.page__nav");
	    var $tglNavigato = com_jquery("#toggleNavigato");
	    $tglNavigato.tooltip();
	    
	    if(isVisible){
	    	$itemnavigato.fadeIn("fast").addClass("visible").removeClass("invisible");
	    	$tglNavigato.addClass("isVisible");
	    	
	    }else{
	    	$itemnavigato.fadeOut("fast").addClass("invisible").removeClass("visible");
	    	$tglNavigato.removeClass("isVisible");
	    }
	    com_jquery("body").on("click","#toggleNavigato",function(e){
	    	e.preventDefault();
	    	com_jquery("#page-wrapper").toggleClass("navigatoMode");
	    	e.stopPropagation();
	    	checkTocado = !checkTocado;
		  	// cerrar todos los collapse cuando se desactiva el menu --ojo rompe el srcoll spy
	    	$tglNavigato.toggleClass("isVisible");
	    	$itemnavigato.slideToggle(400);	    	
		  	// if(!$tglNavigato.hasClass("isVisible")){
		  	// 	buscarAcordeones(true);
		  	// }		
	    	$itemnavigato.toggleClass("visible invisible");

    	   	if (checkTocado) {

    			resetAndRemove();
    			buscarAcordeones(true);
    			dibujarCollapse();
    			//wrappear();
    			checkIfCollapseResponsiveness();

    			
    				
    			saberCurrentwhenscroll();
    			
    	   	}else{
    	   		buscarAcordeones(false);
    	   	}
	    });
	    function resetAndRemove(){
	    	$itemnavigato.empty();
	    }
	    function buscarAcordeones(abrirAccord){
			$anclas.each(function(ind, elm){
				var $el = com_jquery(elm);
				var height = $el.outerHeight()+100;
				var textoCompleto, res;
				$el.addClass("navigatoIt");
				if($el.children("span.nombreParaItemNavigato").length){
					textoCompleto = $el.children("span.nombreParaItemNavigato").text();
					res = textoCompleto.split(" ");
					texto = res[0];
				}else{
					textoCompleto = $el.text();
					res = textoCompleto.split(" ");
					texto = res[0];
				}
				
				var data_target = $el.attr("data-target");
				$target = com_jquery(data_target);

				if (abrirAccord) {
					$target.addClass("in");
					//$el.addClass("abierto");
					$el.children("i").addClass("chevronRotado");
					$target.css("min-height","300px");
					dibujar(data_target,height);
				}


			});
		}
		function dibujarCollapse(){
			var btn = "<button id='collapseNavigato'><i class='fa fa-flag'></i></button>"

			$itemnavigato.prepend(btn);
			$btncollapse = $itemnavigato.find("#collapseNavigato");
			$btncollapse.on("click",function(e){
				e.preventDefault();
				com_jquery($itemnavigato.find("a")).slideToggle(400, function(){
					setTimeout(function(){
						$itemnavigato.toggleClass("nv_colapsado");
						checkIfCollapse();
					},400);
				});
			});
			//console.log(vwidth)
			checkIfCollapse();
		}
		function checkIfCollapseResponsiveness(){
			if (vwidth < 768) {
				$itemnavigato.addClass("nv_colapsado");
			}else{ $itemnavigato.removeClass("nv_colapsado"); }
		}
		function checkIfCollapse(){
			if( $itemnavigato.hasClass("nv_colapsado")){
				$btncollapse.addClass("nv_btnCerrado");
			}else{ $btncollapse.removeClass("nv_btnCerrado"); }
		}

		function dibujar(datatarget, heightOfElement){

			var a = "<a href='"+datatarget+"' class='nv_link' data-toggle='tooltip' data-placement='left' title='"+texto+"' topmenos='"+heightOfElement+"'><i class='fa fa-circle'></i></a>";  
			$itemnavigato.append(a);
			
		   	menuItems = $itemnavigato.find("a.nv_link");

		   	menuItems.tooltip();
		   	eventoClick(menuItems);
			
			menuItems.localscroll();

			// para saber cual de los acordeones esta en pantalla tomo los objetos
		   	scrollItems = menuItems.map(function(){
	         item = com_jquery(com_jquery(this).attr("href"));
	         if (item.length) { /*console.log(item);*/ return item; }
	     	});

		}
		function wrappear(){
			$itemnavigato.contents().not("button").wrapAll("<div class='nv_containerlinks'></div>");
		}

		function eventoClick($a){
			$a.on("click",function(e){
				var $el = com_jquery(this);
				$el.localscroll();
				$el.addClass("nv_active");
				$el.siblings("a").removeClass("nv_active");
				var ta = $el.attr("href"),
		    		t = ta.substring(1),
		    		$t = com_jquery(ta),
					$s = $t.siblings(".accordion_table");
		    	$t.siblings(".accordion_table").children("i").addClass("chevronRotado");
				var stringtarg = $el.attr("href");


				/* descomentar para que cuando se cllickea en el punto se abra el collapse */
				$s.removeClass("cerrado");
				com_jquery(stringtarg).collapse("show");
				
			});
		}
		function saberCurrentwhenscroll(){
			// Get container scroll position
			if(vwidth < 768){totalHeightArestar /= 2; }
		   var fromTop = com_jquery(document).scrollTop()+totalHeightArestar;
		   // Get id of current scroll item
		   var cur = scrollItems.map(function(i,e){
		   		var $contain = com_jquery(e);
		   		var itemTop = $contain.offset().top+10;
			    if ((itemTop) < fromTop){
			      // console.log("-///////-");
		   		  // console.log(com_jquery(this)[0].id+" " + "itemtop: "+itemTop);
			      // console.log("-");
			      // console.log(com_jquery(this)[0].id+" " + "fromtoop: "+fromTop);
			      // console.log("--");
			      return this;
			    }
		   });
		   // Get the id of the current element
		   cur = cur[cur.length-1];
		   var id = cur && cur.length ? cur[0].id : "";
		   // Set - remove active class
		   if (lastId !== id) {
		       lastId = id;
		       // Set/remove active class
		       menuItems
		         .removeClass("nv_active")
		         .filter("[href='#"+id+"']").addClass("nv_active");
		   }            
		}

	   	com_jquery(window).scroll(function(){
	   		if (checkTocado) {
				saberCurrentwhenscroll();
	   		}
		});
		com_jquery(window).resize(function(){
			vwidth = com_jquery(window).width();
			if (checkTocado) {
				checkIfCollapseResponsiveness();
			}
		});


		

	});
}

/*
	la funcion fixMe hace que el header de la tabla se duplique para que éste se pegue al top cuando se scrollea
*/
;(function($) {
   com_jquery.fn.fixMe = function(selector, tableOffsetTop) {
      return this.each(function() {
         var $this = com_jquery(this),
            $t_fixed,
            $top___nav = com_jquery("#topNav"),
            $top___cont = com_jquery("#page-wrapper .table"),
            top__navheight = $top___nav.height(),
            $ulpagenav = com_jquery("ul.page__nav"),
            ulheight = $ulpagenav.height();

         function init() {
            $this.wrap('<div class="cont__tab_header_fixed" />');
            $t_fixed = $this.clone();
            $t_fixed.addClass("tabla__fixeada_ok");
            $t_fixed.attr("id",($this.attr("id")+"-fi"));
            $t_fixed.find("tbody").remove().end().addClass("fixedtable").insertBefore($this);
            if( $top___nav.length  && $ulpagenav.length ){
            	//console.log("existen los dos ")
            	$t_fixed.css("top",top__navheight + ulheight);
            }else if( $top___nav.length ){
            	//console.log("existen topnav")
            	$t_fixed.css("top",top__navheight );
            }
            fixWidth();
            resizeFixed();
         }
         function resizeFixed() {
            $t_fixed.find("th").each(function(index,elm) {
               com_jquery(this).width($this.find("th").eq(index).width());
               //console.log("ORIGINAL index "+ index + ": " + $this.find("th").eq(index).outerWidth()+"px" + " --- " + "REPLICA index "+ index + ": " +com_jquery(this).width());
            });
         }
         function scrollFixed() {
            var offset = com_jquery(this).scrollTop(),
            //tableOffsetTop = $this.offset().top,
            tableOffsetBottom = tableOffsetTop + $this.height() - $this.find("thead").height();
            // console.log(offset + " offset");
            // console.log(tableOffsetTop + " table offset top");
            // console.log(tableOffsetBottom + " table offset bottom");

            if(offset < tableOffsetTop || offset > tableOffsetBottom)
               $t_fixed.hide();
            else if(offset >= tableOffsetTop && offset <= tableOffsetBottom && $t_fixed.is(":hidden"))
               $t_fixed.show();
         }
         
         function fixWidth() {
        	 com_jquery($t_fixed).width(com_jquery($this).width());
         }
         com_jquery(window).resize(function(){
         	resizeFixed();
         	init();
         	offtopcontainer =  $top___cont.offset().top;
         	top__navheight = $top___nav.height();
         	ulheight = $ulpagenav.height();
         	
         });
         com_jquery(selector).scroll(function(){
         	scrollFixed();
         });
         init();
      });
   };
})(jQuery);

/*
	script para darle estilos a los checkbox
	todos los que tengan input con clase check-box con el siguiente formato
	<input type="checkbox" id="check1" name="check1" class="check-box" value="1">
    <label for="check1">
        Alarma
    </label>
*/

/*
 *  Funcion para cuando un a está dentro de un button y no redirecciona
 * */
function aInButton(){
	var $this = com_jquery(this),
		href = com_jquery(this).attr();
		location.replace(href);
	$
}

function customcheckbox(){
	com_jquery("input.check-box").each(function(){
		var $check = com_jquery(this);
		var $label = $check.next("label");

		function addClassChecked(){
			if ($check.is(':checked')) {
				$label.addClass("checked customcheck_checked");
			}else{ $label.removeClass("checked customcheck_checked"); }
				
			return $label.attr("class");
		}
		addClassChecked();
		$label.on("click",function(){
			if(!$check.attr("readonly")){
				$label.toggleClass("customcheck_checked");
			}
		});
	});
}

/*
	script para alerta para dejarlo fixed arriba cuando se scrollea
	se aplica a todas los elementos con clase .alerta_jerarquia_3.top_alerta
*/
function alertChangeWhenScroll(){
	var $alerta = com_jquery(".alerta_jerarquia_3.top_alerta");
	if(scroll_top > 400){
		$alerta.addClass("alert_fixed");
	}else{
		$alerta.removeClass("alert_fixed");
	}
}
/*
	script para toggle button

	Estructura: arranca deshabilitado
    <button class="toggle__button_material tg_off" data-toggle="tooltip" data-placement="top" title="Habilitar"></button>
    Estructura: arranca habilitado
    <button class="toggle__button_material tg_on" data-toggle="tooltip" data-placement="top" title="Deshabilitar"></button>

*/
function getValToggleButton(index){
	var $toggle__bmaterial = com_jquery(".toggle__button_material");
	var fval = null,
		findex = index;
	if ($toggle__bmaterial.length) {
		if(typeof index !== 'undefined'){
			fval = $toggle__bmaterial.eq(findex).attr("valor");
			return parseInt(fval);

		}else{
			$toggle__bmaterial.each(function(i,e){
				var $e = com_jquery(e),
					val = $e.attr("valor");
				fval = val;
				console.log("mbutton-"+" "+"index: "+i+" "+"valor: "+fval);
			});
		}

	}
}
function getValToggleButtonFromId(id){
	var $toggle__bmaterial = com_jquery("#"+id+".toggle__button_material");
	var fval = null;
	if ($toggle__bmaterial.length) {
		fval = $toggle__bmaterial.attr("valor");
		return parseInt(fval);
	}
}
function materialToggleButton(){
	var $toggle__button_material = com_jquery(".toggle__button_material");
	var prendido = false;
	$toggle__button_material.each(function(i,e){
		$tog = com_jquery(this);
		var valor = $tog.attr("valor");
		var val = null;
		$tog.attr("id","mb-"+i);
		if($tog.hasClass("tg_on")) {
			$tog.attr("valor", "1");
		}else if ($tog.hasClass("tg_off")){
			$tog.attr("valor", "0")
		}
		// se setea por defeco en apagado si no esta seteado nada
		if ( typeof valor !== 'undefined' ){
			val = valor;
			$tog.attr("valor", val);
			if( valor == 0){
				prendido = false;

			}else if( valor == 1){
				prendido = true;
			}
		}else{
			val = 0;
			$tog.attr("valor", val);
			prendido = false;
		}
		checkisPrendido();
		function checkisPrendido(){
			if (prendido) {
				//console.log(prendido);

				$tog.addClass("tg_on").removeClass("tg_off");
				$tog.attr("title","Deshabilitar");
			}else{
				//console.log(prendido);

				$tog.addClass("tg_off").removeClass("tg_on");
				$tog.attr("title","Habilitar");
			}
		}
		$tog.on("click",function(){
			com_jquery(this).toggleClass("tg_on tg_off");
			if (com_jquery(this).hasClass("tg_on")) {
				com_jquery(this).attr("valor", "1");
				com_jquery(this).attr("title","Deshabilitar")
								.tooltip('fixTitle')
			          			.tooltip('show');
			}
			if(com_jquery(this).hasClass("tg_off")){
				com_jquery(this).attr("valor", "0");
				com_jquery(this).attr("title","Habilitar")
								.tooltip('fixTitle')
					          	.tooltip('show');

			}
		});
	});
}
/*
  changeTabsIntoDropdown convierte todos los tabs con clase ul.nav-tabs.in__tabla
  en select cuando es responsive. Se llama en el ready
*/

function changeTabsIntoDropdown(){
	var $tabsContainer = com_jquery("ul.nav-tabs.in__tabla");
	viewportWidth = com_jquery(window).width();
	var xObjetivo = "";
	$tabsContainer.each(function(index,element){
		var $dropdown = com_jquery("<select></select>");
		$dropdown.attr("id","converttabSelect-" + index);
		var $el = com_jquery(this);
		$dropdown.insertAfter($el);
		
		var $childrens = $el.find("li > a").clone();
		$childrens.each(function(i,e){
			if( com_jquery(e).attr("data-url") != "" ) {
				destino = com_jquery(e).attr("data-url")
				xObjetivo = "data-url="+destino; 
				//bind onchange
				$dropdown.on("change", function(){
					var $el = com_jquery(this).children("option:selected");
					var xDestino = $el.attr("data-url");
					com_jquery("#"+$el.val()).load(xDestino);
				});
			} 
			var $e = com_jquery(e);
			var target = $e.attr("href").length ? $e.attr("href") : "";
			var sinhashtarget = target ? target.substr(1) : "";
			$e.removeAttr("data-toggle").removeAttr("href");
			
			var $newel = com_jquery('<option value='+sinhashtarget+' '+xObjetivo+'>'+ $e.text() + '</option>');
			$newel.appendTo($dropdown);
		});
		$dropdown.find("option").first().attr('selected', true);
		var $tabVisible = com_jquery("#"+$dropdown.find("option:selected").val());
		$tabVisible.addClass("in active");
		$tabVisible.siblings().removeClass("in active");

		$dropdown.children("option").on("click",function(){
			com_jquery(this).attr("selected",true);
			// $tabVisible = $dropdown.val();
			// $tabVisible.addClass("in active");
			// $tabVisible.siblings().hide().removeClass("in active");
			// console.log($tabVisible);
		});
		
		$dropdown.on("change",function(){
			$tabVisible = com_jquery("#"+com_jquery( this ).val());
			$tabVisible.addClass("in active");
			$tabVisible.siblings().removeClass("in active");
			console.log($tabVisible);
		});
	});
	
}
/*
	customRadioButton agrega el icono al radiobutton cuando cambia de estado
*/
function customRadioButton(){
	com_jquery("button.radio_custom").on("click",function(e){
		e.preventDefault();
		var $el = com_jquery(this);
		$el.addClass("rc_checked");
		$el.children("i").removeClass("oculto");
		$el.parent().siblings().children("button.radio_custom").removeClass("rc_checked");
		$el.parent().siblings().children("button.radio_custom").children("i").addClass("oculto");

	});
}
/*
	cambia de orden el formulario del login en responsive para que aparezca primero
*/
function cambiardeordenlogin(){
	var $textobienvenidos = com_jquery("div.textobienvenidos"),
		$containerform = com_jquery("div.container_form_login");
	viewportWidth = com_jquery(window).width();

	if( viewportWidth < 992){
		$textobienvenidos.insertAfter($containerform);
	}else{
		$containerform.insertAfter($textobienvenidos);

	}
}
function numberSpinner(){
	com_jquery(".number-spinner button").each(function(ind, elm){
		var $elm = com_jquery(this);
		$elm.on("click",function(){
			var btn = com_jquery(this),
			        input = btn.closest('.number-spinner').find('input'),
			        oldValue = input.val().trim();
			var minimo = input.attr('alt').split(":")[0];
			var maximo = input.attr('alt').split(":")[1];
			if (btn.attr('data-dir') == 'up') {
				if(parseFloat(oldValue) < parseFloat(maximo)){
			        oldValue++;
			        if (input.hasClass("comision")) {
			        	if (oldValue > comision_asegurado_nuevo) {
							com_jquery('#aseguradoNuevo').prop('checked', false);
							com_jquery('#aseguradoNuevo').removeClass("customcheck_checked");
						}
				        set_comision(input.val());
			        }
			    }
			} else {
			    if (parseFloat(oldValue) > parseFloat(minimo)) {
			        oldValue--;
			        if (input.hasClass("comision")) {
			        	set_comision(input.val());
			        }
			    }
			}

			input.val(oldValue);
		});

	});
}
/*
	tooltipInitialize inicializa los tooltip en el ready
	aquellos con clase tt_large_2 son mas anchos
	Ej:
	<a href="" data-toogle="tooltip" data-placemente="bottom" title="Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
	tempor incididunt ut labore et dolore magna aliqua."></a>
*/
function tooltipInitialize(){
	com_jquery('[data-toggle="tooltip"]').each(function(){
		if( com_jquery(this).hasClass("tt_large__2")) {
			//tooltip grande
			com_jquery(this).tooltip({
			template: '<div class="tooltip large_container_tt" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
			});
		} else {
			com_jquery(this).tooltip(); 
		}
	});
}
/*
	frontDenuncia tiene un par de funciones para denuncia
*/
function frontDenuncia(){
	var $radio = com_jquery(".accidente-transito").find(".radio-inline");
	var	$mapcontainer = com_jquery(".dialogMapaGeolocalizacion");

	com_jquery('[data-toggle="tooltip"]').each(function(){
		if( com_jquery(this).hasClass("tt_large__2")) {
			//tooltip grande
			com_jquery(this).tooltip({
			template: '<div class="tooltip large_container_tt" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
			});
		} else {
			com_jquery(this).tooltip(); 
		}
	});

	$mapcontainer.appendTo(com_jquery("#page-wrapper"));

	$radio.click(function(){
		com_jquery(this).addClass("active");
		com_jquery(this).siblings().removeClass("active");
	});
}
/*
	responsiveTables2 se ejecuta en el ready.
	Es un script para convertir las tablas en responsive y cambiar el formato
	el formato de tabla tiene que tener:
	<table class="mitabla">
		<thead>
			<tr>
				<th>Nombre th</th>
			</tr>
			<tr>
				<th>Nombre th</th>
			</tr>
			<tr>
				<th>Nombre th</th>
			</tr>
			<tr>
				<th>Nombre th</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>Nombre td</td>
			</tr>
			<tr>
				<td>Nombre th</td>
			</tr>
			<tr>
				<td>Nombre th</td>
			</tr>
			<tr>
				<td>Nombre th</td>
			</tr>
		</tbody>
	</table>

*/
function responsiveTables2(){
	var $table = com_jquery(".table.fedpat.table__responsive");
	var $tableHija = $table.find("table");
	if( $table.length ){
	$table.each(function(ind , elm){
		var $this_table = com_jquery(elm);
		var arrayText = [];
	   	$this_table.find("thead th").each(function(i, v) {
	       arrayText[i] = com_jquery(v).text();  
	       //console.log(arrayText);
	   	});
	    //now loop through table rows and apply headings to the td in each row
	   	$this_table.find("tbody tr").each(function(i, v) {
	       var myRow = com_jquery(v);
	       var index = i;

	       myRow.find('td').each(function(j,d) {
	       	
	           com_jquery(d).attr('data-th', arrayText[j]);
	       });
	   });
	});
	}
	if($tableHija.length){
		$tableHija.each(function(i,e){ 
			var $thisChildTable = com_jquery(e);
			var arrayTextCh = [];
			$thisChildTable.addClass("ChildResponsiveTable");
			$thisChildTable.parents("tr").addClass("trResponsibleT");

		   
			$thisChildTable.find("thead th").each(function(i, v) {
		       arrayTextCh[i] = com_jquery(v).text();  
		       //console.log(arrayTextCh);
		   	});
		    //now loop through table rows and apply headings to the td in each row
		   	$thisChildTable.find("tbody tr").each(function(i, v) {
		       var myRow = com_jquery(v);
		       var index = i;

		       myRow.find('td').each(function(j,d) {
		       	
		           com_jquery(d).attr('data-th', arrayTextCh[j]);
		       });
			});
	   });
	}
}
function iniciarLoading2(texto, icono, isAbierto){
	var iconoaMostrar = (typeof icono !== 'undefined' ) ? icono : "<div class='loader'></div>";
	var textoAmostrar = texto;
	var content = '<div id="load_ing2" class="loading">' +
        ' <div class="containerloading">' +
            iconoaMostrar +
            '<div class="text-center paddingporcentaje-top-bottom-1 color-blanco font-size-big">'+textoAmostrar+'</div>' +
        '</div>' +
    '</div>';
	com_jquery("body").prepend(content);
	var $loading = com_jquery("#load_ing2"); 
	$loading.show();
	
}
function pararLoading2(){
	var $loading = com_jquery("#load_ing2"); 
	$loading.remove();
}
function showLoadingBar2(showLoadingBar, texto, icono) {
	if (showLoadingBar) {
		iniciarLoading2(texto,icono);
	} else {
		pararLoading2();
	}
}
/* iniciarLoading, pararLoading y showLoadingBar son funciones para el loading general*/
function iniciarLoading(common){
	var icono = (common != true ) ? "<div class='loader'></div>" : "<div class='text-center'><i class='fa fa-calculator fa-5x loaderCotiza'></i></div>";
	var textoAmostrar = (common != true ) ? "Cargando..." : "Cotizando...";
	var content = '<div id="load_ing" class="loading">' +
        ' <div class="containerloading">' +
            icono +
            '<div class="text-center paddingporcentaje-top-bottom-1 color-blanco font-size-big">'+textoAmostrar+'</div>' +
        '</div>' +
    '</div>';
	com_jquery("body").prepend(content);
	var $loading = com_jquery("#load_ing"); 
	$loading.show();
}
function pararLoading(){
	var $loading = com_jquery("#load_ing"); 
	$loading.remove();
}
function showLoadingBar(showLoadingBar, common) {
	if (showLoadingBar) {
		iniciarLoading(common);
	} else {
		pararLoading();
	}
}
/* 
	toggleChevron es una funcion para los accordiones. Basicamente cambia el icono dependiendo si el accordion esta abierto o cerrado
	Se ejecuta en el ready
*/
function toggleChevron(e) {
    com_jquery(e.target)
        .prev('.panel-heading')
        .find("i.indicator")
        .toggleClass('fa-chevron-down fa-chevron-up');
}
/*
	observationPopover() es una funcion para los popover de bootstrap y se inicia en el ready
	Ej:
	<a href="#" data-toggle="popover" data-trigger="focus" data-placement="bottom" type="button" data-html="true" class="link_observacion" contenidoPopOver="<b>Emitida</b> por otro productor.">
	    <i class="fa fa-info-circle"></i>
	  </a>

	  En el attr contenidoPopOver se puede meter html

	Se ejecuta en el ready
*/
function observationPopover(){
	var $link_observacion = com_jquery(".link_observacion, .link_advertencia");

	$link_observacion.each(function(ind, obj){
		var $pop = com_jquery(obj);
		var contenidoPopOver = $pop.attr("contenidoPopOver");
		$pop.on("click",function(e){
			e.preventDefault();
		});
		$pop.popover({
			html: true,
			container: $pop.parent(),
		    content: function(){
		      return contenidoPopOver;
		    }
		});

	});
}

/*
	setLabelsNew() es una función que etiqueta a los items del menú que son nuevos. se ejecuta en el ready
*/
function setLabelsNew(){
	var $side__nav = com_jquery("#side__nav");
	$side__nav.find("li.new").children("a").append("<span class='label label-warning marginpixeles-left-5px'>Nuevo</span>");
	//$side__nav.find("li.new").find(".itemmenu__title").append("<span class='label label-warning marginpixeles-left-5px'>Nuevo</span>");
	var $menu_produccion = com_jquery("#menu_produccion");
	$menu_produccion.find("li.new").children("a").append("<span class='label label-warning marginpixeles-left-5px'>Nuevo</span>");

}
/*
	setMarginTopToContent calcula el height del nav y se lo aplica como margen al #page-wrapper,
	o sea al contenedor del contenido. Se ejecuta en el ready
*/
function setMarginTopToContent(){
	var viewportWidth = com_jquery(window).width();
	var $pagewrapper = com_jquery("#page-wrapper");
	var topnavheight = com_jquery("#topNav").height();
	$pagewrapper.css("margin-top", topnavheight);

}
/*
	rotateAccordionTableIndicator cambia el indicador para los accordiones de los formularios con clase .accordion_table
	Se ejecuta en el ready
*/
function cerrarAccordion(accordion){
	var $accordion = $jqfp(accordion),
		$collapse = $jqfp($jqfp(accordion).attr("data-target"));
	
	$accordion.addClass("cerrado").removeClass("abierto");
	$collapse.removeClass("in");
}

function abrirAccordion(accordion){
	var $accordion = $jqfp(accordion),
		$collapse = $jqfp($jqfp(accordion).attr("data-target"));
	
	$accordion.addClass("abierto").removeClass("cerrado");
	$collapse.addClass("in");
}

function rotateAccordionTableIndicator(){
	com_jquery(".accordion_table").each(function(index, element){
		$thisacc = com_jquery(element);
		$target = com_jquery($thisacc.attr("data-target"));

		if($target.hasClass("in")){
			$thisacc.children("i").addClass("chevronRotado");
		}else{ $thisacc.children("i").removeClass("chevronRotado"); }
		com_jquery(element).on("click",function(){
			com_jquery(this).children("i").toggleClass("chevronRotado");
		})
	});
}
/*
	radiobuttonSearch es la funcion para  hacer andar el buscador del header
	(el desplegable que te permite filtrar la busqueda)
*/
function radiobuttonSearch(){
	var $searchbar_container = com_jquery("#searchcontainer");
	var $radiobutton_container = $searchbar_container.find(".radiobutton_container");
	var $inputsearch = $searchbar_container.find(".navbar-form").find("input.form-control");
	var widthinput = $inputsearch.width();
	$radiobutton_container.width(widthinput+24);
	$inputsearch.click(function(e){
		e.stopPropagation();
		$radiobutton_container.slideDown("fast");
	});
	com_jquery("input[type=radio][name=radiosBusquedaGral]").change(function(){

		switch(this.value) {
		    case 'asegurado':
		        $inputsearch.attr("placeholder","Ingrese asegurado..");
		        break;
		    case 'numero':
		        $inputsearch.attr("placeholder","Ingrese numero..");
		        break;
		    case 'patente':
		        $inputsearch.attr("placeholder","Ingrese patente..");
		        break;
		    default:
		    	$inputsearch.attr("placeholder","Ingrese una búsqueda..");
		        break;
		}

	});
	com_jquery("input#nombreAsegurado").on("keypress",function(e){
		var keyCode = e.keyCode || e.which;
		console.log(keyCode);
	    if(keyCode == 13 || keyCode == 18){
	    	showLoadingBar(true);
	    	if (!buscar_asegurado().call()){
	    		showLoadingBar(false);
	    	}
	    }
	});
	com_jquery('html').click(function() {
	    if($radiobutton_container.is(":visible")) {
	      $radiobutton_container.slideUp('medium', function() {
	        // Animation complete.
	      });
	    }
	 });
}
//chequea si se selecciono un productor
function isProductorSelected(){
	var productorNumero = com_jquery("#idproductor > strong").text();
	var productorParseado = parseInt(productorNumero);
	
	if(  !isNaN(productorParseado) && productorParseado !== 0  && productorParseado){
		//console.log("es distinto de 0");
		//console.log(productorNumero);
		return true;
	}else{
		return false;
	}
}

function preventDefaulted(evt) {
	evt.preventDefault();
}

function checkIfCanChangeProductor(){
	var $selectProductor = com_jquery("#MsM__nav li.selectProductor"),
		$sesionContainer = com_jquery("#sesionContainer"),
    	$cambiarProductor = $sesionContainer.find("#cambiarProductor");
	
	if($selectProductor.length){
		$cambiarProductor.show();
	}else{
		$cambiarProductor.hide();
	}
	
}

function indexarPaginacion(){
	var $pa =  com_jquery(".tablaPaginacionJsp"),
		$pa_links = $pa.find(".pagelinks"),
		$links = $pa_links.find("a"),
		total = $links.length - 1,
		newRegex = RegExp(',+', 'g');
	$links.each(function(i,e){
		var $e = com_jquery(e),
			index = i;
		$e.attr("link-index","linkPag-"+index);
	});		
	
//		$links.eq(0).addClass("primero");
//		$links.eq(1).addClass("anterior");
//		$links.eq(total).addClass("ultimo");
//		$links.eq(total-1).addClass("siguiente");
	
	$pa_links.html(com_jquery(".tablaPaginacionJsp .pagelinks").html().replace(newRegex,''))
	
	
}
jQuery(document).ready(function(){
		
	checkIfCanChangeProductor();
	//hideShowElementsOfNav();

	showHideSearchBar();
	//com_jquery("#supertabla").paginateTable(4);

	// lightbox con modal de bootstrap

	//com_jquery(".imageSlideModalContainer").bootstrapModalLightboxAdaptado(".wrapper-foto");

	// datetimepicker
	dateTimePickerOptions();

	// preventdefault para los .input-group-addon
	com_jquery(".input-group-addon").each(function(i,e){
		com_jquery(e).on("click",function(e){
			e.preventDefault();
		});
	});
	
	// preventDefault

	// custom checked
	customcheckbox();

	//localink
	com_jquery(".localink").localscroll();

	//popover ayuda listado de propuestas
	com_jquery("#link_wpopover").on("click",function(e){
		e.preventDefault();
	});
	com_jquery("#link_wpopover").popover({
	    html: true,
	    content: function(){
	      return com_jquery("#popover-content-refPropuestas").html();
	    }
	});

	//popover observacion
	observationPopover();

	//toggle
	materialToggleButton();

	// tooltip
	tooltipInitialize();

	changeTabsIntoDropdown();

	// prevent default para los btnes del modal (pop up)
	com_jquery("button.btnmodal").on("click",function(ev){
		ev.preventDefault();
	});

	// comportamiento de custom radio button
	customRadioButton();

	// deja fixed al header de la tabla cuando se scrollea dentro de la misma
	var tablaFixed = com_jquery(".table.fixedheader");
	if (tablaFixed.length > 0) {
		var tableOffsetTop = tablaFixed.offset().top;
		setTimeout(function(){
			com_jquery(".table.fixedheader").fixMe(window, tableOffsetTop);
		}, 100);
		
	}
	// var $tablafixRenovaciones = com_jquery("table.renovaCionesTabla");
	// if ($tablafixRenovaciones.length > 0) {
	// 	var tableOffsetTop = $tablafixRenovaciones.offset().top;
	// 	setTimeout(function(){
	// 		$tablafixRenovaciones.fixMe(window, tableOffsetTop);
	// 		$tablafixRenovaciones.addClass("fixedRenovacionesTabla");
	// 	}, 100);
		
	// }

	// en los formularios es el boton del mas y el menos
	numberSpinner();

	// cambia de lugar el texto y el form en responsive
	cambiardeordenlogin();

	// agregar clase active a los checkbox de accidente
	frontDenuncia();

	
	// ocultar barra scroll nativa

    //notificaciones slim scroll
    com_jquery('.inner-alert-dropdown').slimScroll({
        height: '250px',
        size: '5px',
        alwaysVisible: false,

    });
	responsiveTables2();
	// rotate chevron
	rotateAccordionTableIndicator();
	

	// tablas cuotas impagas
	var $indicatorbusqueda = com_jquery("#container_search").find("i");
	var $inputbusqueda = com_jquery("#container_search").find("#txtFiltroAsegurados");
	/*com_jquery(document).click(function(e) {
	  if ( com_jquery( e.currentTarget ).is( "#txtFiltroAsegurados" ) ) {
	    console.log("es el target");
	  }else{ console.log("no es el target"); }
	});*/

	// btn close
	com_jquery(".close_alerta").click(function(){
		com_jquery("div.alerta_jerarquia_3.top_alerta").fadeOut("slow");
	});
	// acordeones
	com_jquery('.acco__rdion').on('hidden.bs.collapse', toggleChevron);
	com_jquery('.acco__rdion').on('shown.bs.collapse', toggleChevron);
	// --
	
	setMarginTopToContent();
	setLabelsNew();
	radiobuttonSearch();

	 com_jquery(window).resize(function(){
	 	viewportWidth = com_jquery(window).width();
	 	setMarginTopToContent();
	 	radiobuttonSearch();
	 	cambiardeordenlogin();

	 });

	 com_jquery(window).scroll(function(){
	 	scroll_top = com_jquery(window).scrollTop();
	 	//console.log("scroll: "+ scroll_top);
	 	alertChangeWhenScroll();
	 });
	 
});