dojo.provide("webgui.display.ParameterDisplay");
dojo.require("webgui.pac.Controller");
dojo.require("webgui.pac.Abstraction");
dojo.require("webgui.pac.Presentation");

/**
 * No store currently required
 */
dojo.declare("ParameterAbstraction", webgui.pac.Abstraction, {
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

dojo.declare("ParameterPresentation", webgui.pac.Presentation, {
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
dojo.declare("ParameterController", webgui.pac.Controller, {
    	divId: "parameters", //defaultId
	constructor: function() {
            var presentation = new ParameterPresentation();
            var dataAbstraciton = new ParameterAbstraction({"updateViewCallback": presentation.updateViewCallback});
	}
});
dojo.declare("webgui.display.ParameterDisplay",null,{
	constructor: function(){
		var controller = new ParameterController();
	}
});
