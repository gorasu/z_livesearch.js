    (function( $ ){
/** Z-liveSearch v 0.0.1.9
*
* @toDo - действие на появление контейнера с текстом
* @toDo - настройку на то что бы скрывать или не скрывать данные
* @toDo - регулировать ширину внутреннего контейнера
*
***/
  var _ZLS_AJAX_ID = false; // Индикатор ajax запроса. Нужен для того что бы обрубать не выполнившиеся запросы
  $.fn.z_liveSearch = function(options) {
    var ZLS = new Object();
    ZLS.input = this;
    ZLS.insertMainContainer = 'zls_insertmaincontainer';
    ZLS.insertChildContainer = 'zls_insertchildcontainer';
   
    ZLS.options_default = {
       'clickerSelector':'[name="zls_livesearchclicker"]', // селектор элемента по которому происходит клик
       'clickerFunction':function(el,input,ZLS){}, // Фукнция которая вызывается после клика по элементу с селектором ZLS.clickerSelector, передается элемент по которому кликнули, Input к которому привязан плагин, и главная переменна плагина       
       'ajax':{'url':'','type':'POST'}, // Настройки для ajax параметр data не переопределяется
       'userDataConvertorFunction':false, // пользовательская фукнция для конфертирования данных возвращает строку, по умолчанию спользуется мтод ZLS.template 
       'templateString':false, // Строка шабон который заменятся после возврата jSon объекта
       'insertContainerClass':'', // Класс для контейнера в который попадают данные поиска
       'waitText':'Please wait...', // Текст для ожидания ответа на запрос
       'init':true, // Вызвать инициализацю плагина сразу
       'searchStart':function(input){}, // Функция когда поиск начинается
       'searchStop':function(input){}, // Фукнция которая вызывается после окончания поиска
       'hideSearchFieldByInnerClick':true, // Скрывать поле по щелчку внутри поля
       'hideSearchFieldByOutClick':true, // Скрывать поле по щелчку ВНЕ поля
       'dataSendName':false, // Имя параметра который передается, по умолчанию input.value
       'minValueLength':0 // Минимальное количество символов в фразе которое передается на сервер 0 - ограничения нет
    }
    ZLS.extend = function(object1,object2){
       return  $.extend(object1,object2);
    }
    ZLS.options = ZLS.extend(ZLS.options_default,options);
    

    if (ZLS.options.templateString == false) {
      ZLS.options.templateString =  '<a name="zls_livesearchclicker" href="%url%">%name%</a><br>';
    }
    
    
    ZLS.getData = function(){
        if(_ZLS_AJAX_ID){
	  _ZLS_AJAX_ID.abort();
	}
        ZLS.options.searchStart(ZLS.input);
	var value = $(ZLS.input).val();
        if (ZLS.options.dataSendName) {
	var  name = ZLS.options.dataSendName;
	}
	else {
	var name = $(ZLS.input).attr('name');
	}
	if (ZLS.options.minValueLength > 0) {
	   if(value.length < ZLS.options.minValueLength){
	    return false;
	   }
	}
	
        
        if(!$('#'+ZLS.insertMainContainer).length){ 
	$(ZLS.input).after('<div id="'+ZLS.insertMainContainer+'" style="position:relative; height:0px;z-index:6000;"><div id="'+ZLS.insertChildContainer+'" class="'+ZLS.options.insertContainerClass+'" style="position:absolute;display:none;"></div></div>');
	}
        $('#'+ZLS.insertChildContainer).show();
        $('#'+ZLS.insertChildContainer).html(ZLS.options.waitText);

	
	
        var dataSend = {};
        dataSend[name] =value;
        z_ajax = {'data':dataSend};
        z_ajax = ZLS.extend(z_ajax,ZLS.options.ajax);
        z_ajax.success = function(data){
            ZLS.dataInserter(data);
            
        }
        _ZLS_AJAX_ID = $.ajax(z_ajax);
        
        
        
    }
    /** dataInserter
    *
    * Вставляет найденые данные в определенный контейнер 
    *
    **/
    ZLS.dataInserter = function(data){
       var string = ZLS.dataConvertor(data);
       

	
    var container = $('#'+ZLS.insertChildContainer);
    $(container).html(string);
    $(ZLS.options.clickerSelector,container).click(function(){
        return ZLS.options.clickerFunction(this,ZLS.input,ZLS);
    });
    

      $(document).click(function(event)	{

                    var clicked = jQuery(event.target);
                    var is_find = $('#'+ZLS.insertMainContainer).find($(clicked));
		    if (ZLS.options.hideSearchFieldByInnerClick) {
		      is_find.length = 0;
		    }
		    var is_clicked = (clicked.is(ZLS.input));
		    //hideSearchFieldByOutClick
                    if(is_find.length == 0 && !(is_clicked)) {
                                   // $('[class="'+ZDD.options.newElementClass+'"]').remove();
                                  $('#'+ZLS.insertMainContainer).remove();
                                    
                    }   
        });
   
   

     ZLS.options.searchStop(ZLS.input);       
    
    }
   /** dataConvertor
   * Преобразует данные которые содержат результаты поиска,
   * если задана опция dataConvertor то на нее перекладывается задача коныертирования.
   *
   * Если в фукнцию передается объект то он должен иметь вид {0:{'replace_what':'replace_to'},1:{'replace_what':'replace_to'}}
   * Далее объект перебирается в цикле и в строке шаблоне ZLS.options.templateString происходят замены to->what
   *
   * Если в конвертор попадает строка то она же и возвращается
   **/ 
    ZLS.dataConvertor = function(data){
        var s_return = '';
        if (ZLS.options.userDataConvertorFunction != false) {
           s_return =  ZLS.options.userDataConvertorFunction(data);
        }
        else if (typeof data == 'object') {
            if (!data) {
                return '';
            }
            var dataCount = data.length;
            for (i = 0;  i< dataCount; i++) {
                s_return +=  ZLS.template(ZLS.options.templateString,data[i]);
            }
        }
        else {
            s_return =data;
        }
        return  s_return;
        
    }
    ZLS.template = function(templateString,obj_var){
        var to = new Array();
        var what = new Array();
        for (key in obj_var) {
            to.push(obj_var[key]);
            what.push('%'+key+'%');
        }
        templateString = ZLS.str_replace(what,to,templateString);
        return templateString;
    }
            // Replace all occurrences of the search string with the replacement string
	// 
	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   improved by: Gabriel Paderni
    ZLS.str_replace = function ( search, replace, subject ) {

	if(!(replace instanceof Array)){
		replace=new Array(replace);
		if(search instanceof Array){//If search	is an array and replace	is a string, then this replacement string is used for every value of search
			while(search.length>replace.length){
				replace[replace.length]=replace[0];
			}
		}
	}

	if(!(search instanceof Array))search=new Array(search);
	while(search.length>replace.length){//If replace	has fewer values than search , then an empty string is used for the rest of replacement values
		replace[replace.length]='';
	}

	if(subject instanceof Array){//If subject is an array, then the search and replace is performed with every entry of subject , and the return value is an array as well.
		for(k in subject){
			subject[k]=str_replace(search,replace,subject[k]);
		}
		return subject;
	}

	for(var k=0; k<search.length; k++){
		var i = subject.indexOf(search[k]);
		while(i>-1){
			subject = subject.replace(search[k], replace[k]);
			i = subject.indexOf(search[k],i);
		}
	}

	return subject;

}
    
    
    ZLS.init = function(){ 
        ZLS.getData();
    }
    if (ZLS.options.init) {
       ZLS.init();
    }
    return ZLS;
  };
})( jQuery );
