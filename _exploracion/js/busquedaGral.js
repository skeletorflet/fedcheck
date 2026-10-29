function ChangeBuscarPor(a) {
    //Cambia el action del input segun que se quiere buscar
    var inputBusqueda = document.getElementById('nombreAsegurado');

    inputBusqueda.removeEventListener("keypress",buscar_asegurado);
    inputBusqueda.addEventListener("keypress", 
            function(event){
        if(event.keyCode == 13)
            buscar_asegurado().call()
    }, false);

//  Event.observe(document.getElementById('nombreAsegurado'), 'keypress', function(event) {
//  if (event.keyCode == 13) {
//  buscar_asegurado(document.getElementById('BotonBuscar').title);

//  }
//  });
//  }
}

function CloseOptions() {
    var seve = document.getElementById("opcionesBusqueda").style.display;
    if (seve != 'none') {
        document.getElementById("opcionesBusqueda").style.display = 'none';
        setTimeout(function() {
            $('nombreAsegurado').focus();
        }, 0);
    }
}

function DisplayOptions() {
    var seve = document.getElementById("opcionesBusqueda").style.display;
    if (seve == 'none') {
//      Effect.SlideDown('opcionesBusqueda', {
//          duration : 0.3
//      });
        slideFiltro();
    }/*
            if( document.getElementById('nombreAsegurado').title != "noFirst" ) {
                ChangeBuscarPor("A");
                document.getElementById('nombreAsegurado').title == "noFirst";
            }*/
}

function buscar_asegurado(obj) {
    return function(obj){
        var radios = document.getElementsByName('radiosBusquedaGral'),busqueda,action;
        for (var i = 0, length = radios.length; i < length; i++) {
            if (radios[i].checked) {
                // do whatever you want with the checked radio
                busqueda = radios[i].value;
                // only one radio can be logically checked, don't check the rest
                break;
            }
        }
        switch (busqueda) {
        case "asegurado":
            action = "buscarAsegurado.do";
            break;
        case "numero":
            action = "buscarPolizaXNumero.do";
            break;
        case "patente":
            action = "buscarPolizaXPatente.do";
            break;
        default: 
        	action = "buscarAsegurado.do";
        	busqueda = "asegurado";
        }
        
        if (busqueda != "") {
            var nombreAseguradoElement = document.getElementById("nombreAsegurado");
            var nombre = nombreAseguradoElement.value;
            if (nombre == '' || nombre == 'Ingrese Asegurado') {
                //nombreAseguradoElement.value = 'Ingrese Asegurado';
                nombreAseguradoElement.style.border = '1px solid red';
                return false;
            } else {
                document.getElementById('indicator').style.display= '';
                if (busqueda === "numero") {
                    var arr = nombre.split("/");
                    if (arr.length > 1) {                        
                        window.location=basepath +action  + '?ramo=' + arr[0] + '&poliza=' + arr[1];
                    } else {
                        window.location=basepath+ action  + '?poliza=' + arr[0];
                    }
                } else {
                    window.location=basepath + action  + '?'+ busqueda +'=' + nombre;
                }
                return true;
            }
        } else {
            alert("Debe seleccionar uno de los m\u00E9todos de b\u00FAsqueda disponibles en el panel desplegable");
            document.getElementById('nombreAsegurado').value = "";
            return false;
        }
    }
}

function getFiltroSeleccionado() {
    var elements = document.getElementsByName('radiosBusquedaGral');
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].checked) {
            return elements[i].value;
        }
    }
}

function slideFiltro(){
    var minheight = 0;
    var maxheight = 82;
    var opacity = 1;
    var time = 300;
    var timer = null;
    var toggled = false;
    
    var slider = document.getElementById('opcionesBusqueda');
    slider.style.height = minheight + 'px';
    slider.style.overflow = 'hidden';
    slider.style.display = '';
    
    clearInterval(timer);
    var instanceheight = parseInt(slider.style.height);
    var instanceopacity = slider.style.opacity;
    var init = (new Date()).getTime();
    var height = (toggled = !toggled) ? maxheight: minheight;
    var disp = height - parseInt(slider.style.height);
    timer = setInterval(function() {
        var instance = (new Date()).getTime() - init;
        if(instance < time ) {
            var con = instance / time;
            var pos = Math.floor(disp * con);
            result = instanceheight + pos;
            slider.style.height =  result + 'px';
            if(toggled) {
                slider.style.opacity = opacity * con; //opacity
            }
//            document.getElementById('log').innerHTML = 'Current Height : <b>' + result + '</b><br /> Current Time : <b>' + instance + '</b>';
        }else {
            slider.style.height = height + 'px'; //safety side ^^
            slider.style.opacity = opacity;
            clearInterval(timer);
//            controler.value = toggled ? ' Slide Up ' :' Slide Down ';
//            document.getElementById('log').innerHTML = 'Current Height : <b>' + height + '</b><br /> Current Time : <b>' + time + '</b>';
        }
    },1);
}
