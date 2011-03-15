dojo.provide("webgui.display.SCDdisplay");
dojo.require("webgui.pac.Controller");
dojo.require("webgui.pac.Abstraction");
dojo.require("webgui.pac.GridPresentation");
dojo.require("webgui.pac.DndTargetable");

dojo.require("dojo.data.ItemFileWriteStore");

dojo.declare("SCDAbstraction", webgui.pac.Abstraction, {
	constructor: function() {
		var key = 'Timestamp';
		var storedata = {identifier: key, items: []};
		var store = new dojo.data.ItemFileWriteStore({data:storedata});
		var viewParameters = [];
		this.getStore = function(){
			return store;
		};		
		//for removing from store TODO refactor
		var counter = 0;
		var limit = 40;
		
		function parameterHandler(parameter) {
			//console.log("[ANDParameterStore] received " + JSON.stringify(parameter));
			if(!viewParameters[parameter.Name] || viewParameters[parameter.Name] === false)
				return;

			//init new timestamp store element, as we don't really require all parameter stuff
			var storeElem = {};
			storeElem[parameter.Name + "Value"] = parameter.Value;
			storeElem.Name = parameter.Name;
			storeElem.Timestamp = parameter.Timestamp;
			store.newItem(storeElem);
			
			/*refactor, prolly need to use queries and different sort of table !!!*/
			counter++;
			if(counter > limit) {
				//getting the size of the store
				var size = function(size, request){
					//remove excess elements 
					store.fetch({count: (size - limit),
						onItem: function(item){
							store.deleteItem(item);
						}
					});
				};
				store.fetch({query: {}, onBegin: size, start: 0, count: 0});
			}
			
			/*refactor/*/
		}
        
		var subscribeToTopic = function(subscription) {
			msgbus.subscribe(subscription.topic, parameterHandler);
		};

		msgbus.subscribe("/request/subscribe", subscribeToTopic);

		 //parameter hiding and showing
		function addViewParameter(item) {
			viewParameters[item.parameter] = true;
		}
		function hideViewParameter(item) {
			viewParameters[item.parameter] = false;
		}

		msgbus.subscribe("/viewparams/show", addViewParameter);
		msgbus.subscribe("/viewparams/hide", hideViewParameter);

	}
});

dojo.declare("SCDController", webgui.pac.Controller, {
	divId: "SCDTable", //defaultId
	//divId: "TelemetryTools",
	columnLimit: 5, //maximum number of parameters shown, based on order recieved
	constructor: function() {
		var dataAbstraction = new SCDAbstraction();		
		var presentation = new webgui.pac.GridPresentation({
		"domId": this.divId+"Container",
		"configuration": {
			"id": this.divId,
			"store": dataAbstraction.getStore(),
			"clientSort": true,
			"structure": [
				{"field": "Timestamp", "name": "Timestamp", width: '100px'}
			]
			//"updateDelay": 1000
		}});
		// add DnD capability to the presentation
		presentation = webgui.pac.DndTargetable(presentation,{
			"isSource":false,
			"creator":function creator(item,hint){
				console.log("item creator");
				console.log(item);
				console.log("hint: "+hint);
				var n = document.createElement("div");
				msgbus.publish("/viewparams/show",[{parameter:item}]);
				return {node: n, data: item};
			}
		});
		
		/**
		* function for updating tabel columns if new parameters are added.
		* It is connected to the parameterStore parameterHandler function
		* @param parameter The object coming from the subscribed channel
		*/
        //TODO maybe THIS should also store the info and update only at a set interval !!!
 		var updateViewCallback = function(item) {
			//look if, the column already exists
			
			var gridStructure = presentation.configuration.structure;
			var nameExists = false;
			dojo.forEach(gridStructure, function(entry, i){
				if(entry.name == item.parameter) {
					nameExists = true;
				}
			});
			
			//if it doesn't, add it.
			if(!nameExists && gridStructure.length <= 5) {
			
				gridStructure.push({"field": item.parameter + "Value", "name": item.parameter, "width":  "120px"});
				presentation.setGridStructure(gridStructure);
			}
			//scroll to the bottom of the list
			presentation.scrollToGridBottom();
		};

        var removeFromViewCallback = function(item) {
			var gridStructure = presentation.configuration.structure;
			gridStructure.splice(gridStructure.indexOf(item.parameter),1);
			presentation.setGridStructure(gridStructure);
		}
        //TODO, this should be done with connect like updateViewCallback
        webgui.msgbus.subscribe("/viewparams/hide", removeFromViewCallback);
		webgui.msgbus.subscribe("/viewparams/show",updateViewCallback); 


	}
});
dojo.declare("webgui.display.SCDdisplay",null,{
	constructor: function(){
		console.log("[SCDdisplay] initializing components..");
		var controller = new SCDController();
	}
});