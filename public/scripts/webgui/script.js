//For HTML and some presentations
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.CheckBox");

var msgbus = dojo.require("webgui.msgbus");
dojo.require("webgui.assembly.Assembler");

/**
 * Basic object template for having mixing ability
 */
dojo.declare("MixinObject", null, {
	  constructor: function(args){
		dojo.safeMixin(this, args);
	  }
});

/* dojo.declare("DataAbstraction", MixinObject, {
	getStore: function() {
		return this.parameterStore.getStore();
	}
}); */




/* dojo.declare("ParameterStore", MixinObject, {
	constructor: function(args){
		var storedata = {identifier: this.key, items: []};
		var store = new dojo.data.ItemFileWriteStore({data:storedata});
				
		this.getStore = function(){
			return store;
		};
	}
}); */

/*AND display */

/*SCD display */



/*Graph Display*/





/*Parameter selection Display*/

/**
 * No store currently required
 */
dojo.declare("ParameterAbstraction", MixinObject, {
	constructor: function() {

                //Wrapper object to get dojo.connect to work
                var parameters = {};
                parameters.parameterNames = new Array();
                parameters.addParameter = function(name) {
                        //console.log("abstraction addParameter called");
                        this.parameterNames.push(name);
                };

               dojo.connect(parameters, "addParameter", this, "updateViewCallback");

                function parameterHandler(parameter) {
                    if(parameter.Type !== "Parameter")
                        return;

                   var newParam = true;
                    dojo.forEach(parameters.parameterNames, function(parameterName, i) {
                            if(parameterName == parameter.Name) {
                                    newParam = false;
                            }
                    });
                    if(newParam) {
                       parameters.addParameter(parameter.Name);
                    }
                }


                //listens to topics to all channels broadcast to currently
		var subscribeToTopic = function(subscription) {
                   msgbus.subscribe(subscription.topic, parameterHandler);
		};

		msgbus.subscribe("/request/subscribe",subscribeToTopic);
	}
});

dojo.declare("ParameterPresentation", MixinObject, {
    constructor: function() {
        //parameter form div
        var parametersForm = dojo.byId('parameters');

        var selectAll = dijit.byId("selectAll");
        selectAll.onChange = function (parameter) {
            dojo.query('input', parametersForm).forEach(
              function(inputElem){
                if(inputElem.id != "selectAll") {
                    dijit.byId(inputElem.id).attr("value", parameter);
                }
              });
        }

        this.updateViewCallback = function(name) {
            if(!name) {
                return;
            }
            
            var checkBox = new dijit.form.CheckBox({
                name: name,
                value: name,
                checked: false,
                onChange: function(parameter) {
                    if(parameter) {
                        msgbus.publish("/viewparams/show",[{"parameter": checkBox.attr('name')}]);
                    } else {
                        msgbus.publish("/viewparams/hide",[{"parameter": checkBox.attr('name')}]);
                    }
                }
            }, name);

            var label = dojo.create("label", {
                "for" : name,
                innerHTML: name
            }, checkBox.domNode);

            parametersForm.appendChild(checkBox.domNode);
            parametersForm.appendChild(label);
            parametersForm.appendChild(dojo.create("br"));
        }
    }
});

/**
 * Parameter selection screen controller
 */
dojo.declare("ParameterController", MixinObject, {
    	divId: "parameters", //defaultId
	constructor: function() {
            var presentation = new ParameterPresentation();
            var dataAbstraciton = new ParameterAbstraction({"updateViewCallback": presentation.updateViewCallback});
	}
});

/*initialisations*/
dojo.addOnLoad(function() {
	var assembler = new webgui.assembly.Assembler();
	assembler.loadAssembly(); // TODO maybe better to call this from within Assembler??
});

//Test function for local parameter generation
function ParameterGenerator() {
	var names = ["par1","par2","par3", "par4"];
	var generateValue = function(limit) {
		return Math.floor(Math.random()*limit);
	};
	setInterval(function() {
		var param = {}
		param.Name = names[generateValue(names.length)];
		param.Value = generateValue(105);
		param.Type = "java.lang.String";
		param.Timestamp = new Date().getTime();
		msgbus.publish("/parameter/live", [param]);
	}, 500);
}
