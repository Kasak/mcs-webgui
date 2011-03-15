dojo.provide("webgui.display.ParameterDisplay");
dojo.require("webgui.pac.Controller");
dojo.require("webgui.pac.Abstraction");
dojo.require("webgui.pac.Presentation");

dojo.require("webgui.pac.DndSourceable");

/**
 * No store currently required
 */
dojo.declare("ParameterAbstraction", webgui.pac.Abstraction, {
	
	put: function(name){
		var newParam = true;
		var ret = 0;
		dojo.forEach(this.parameterNames, function(parameterName, i) {
			if(parameterName == name) {
				newParam = false;
			}
		});
		if(newParam) {
			this.parameterNames.push(name);
			ret = null;
		};
		return ret;
	},
	get: function(){
		return this.parameterNames;
	},
	constructor: function() {
		this.parameterNames = []; 
	}
});

dojo.declare("ParameterPresentation", webgui.pac.Presentation, {
    constructor: function() {
    }
});

/**
 * Parameter selection screen controller
 */
dojo.declare("ParameterController", webgui.pac.Controller, {
    	divId: "parameters", //defaultId
	constructor: function(args) {
		var presentation = new ParameterPresentation({
			"domId":this.divId
		});
		// add DnD cabaility to the presentation
		presentation = webgui.pac.DndSourceable(presentation,{
			"copyOnly":true
		});
		var dataAbstraction = new ParameterAbstraction();
		
		function parameterHandler(parameter) {
			if(parameter.Type !== "Parameter")
				return;
			if(null == dataAbstraction.put(parameter.Name)){
				presentation.dndSource.insertNodes(false,[parameter.Name]);
			};
		}
		msgbus.subscribe("/parameter/live",parameterHandler);
	}
});
dojo.declare("webgui.display.ParameterDisplay",null,{
	constructor: function(args){
		var controller = new ParameterController(args);
	}
});
