dojo.provide("webgui.display.ANDdisplay");
dojo.require("webgui.pac.Controller");
dojo.require("webgui.pac.Abstraction");
dojo.require("webgui.pac.GridPresentation");
dojo.require("webgui.pac.DndTargetable");

dojo.require("dojo.data.ItemFileWriteStore");

dojo.declare("ANDAbstraction", webgui.pac.Abstraction, {	
	  constructor: function(args) {
		var key = 'key';
		var storedata = {identifier: key, items: []};
		var store = new dojo.data.ItemFileWriteStore({data:storedata});
		var viewParameters = [];
		this.getStore = function(){
			return store;
		};
		function parameterHandler (parameter) {
			/* console.log("[ANDParameterStore] received " + JSON.stringify(parameter)); */
			
			// TODO refactor this filtering using the controller
			if(!viewParameters[parameter.Name] || viewParameters[parameter.Name] === false)
				return;
				
			parameter.key = parameter.Name;
			//AND display store logic
			store.fetch({query: {key:parameter.Name},
				onBegin: function(size, request){
					if(size == 0){
						store.newItem(parameter);
					}
				},    
				onItem: function(item){				
					store.setValue(item,"Name",parameter.Name);
					store.setValue(item,"Value",parameter.Value);
					store.setValue(item,"Type",parameter.Type);
					store.setValue(item,"Timestamp",parameter.Timestamp);
				},
				onError: function(er) {
					console.err(er);
				}    
			});
		}
		
		var subscribeToTopic = function(subscription) {
			msgbus.subscribe(subscription.topic, parameterHandler);
		};

		msgbus.subscribe("/request/subscribe", subscribeToTopic);

		//parameter hiding and showing
		function addViewParameter(item) {
			console.log("AND display addViewParameter for ");
			viewParameters[item.parameter] = true;
		}
		function hideViewParameter(item) {
		console.log("AND display hideViewParameter for ");
            viewParameters[item.parameter] = false;
            store.fetch({query: {key:item.parameter},
				onItem: function(item){
					store.deleteItem(item);
				},
				onError: function(er) {
					console.err(er);
				}
			});
		};
		msgbus.subscribe("/viewparams/show", addViewParameter);
        msgbus.subscribe("/viewparams/hide", hideViewParameter);
	  }
});

dojo.declare("ANDController", webgui.pac.Controller,{
	divId: "ANDTable", //defaultId
	constructor: function() {
		var dataAbstraction = new ANDAbstraction();
		var presentation = new webgui.pac.GridPresentation({
		"domId": this.divId+"Container",
		"configuration": {
			"id": this.divId,
			"store": dataAbstraction.getStore(),
			"clientSort": true,
			//"updateDelay": 1000,
			"structure": [
				{"field": 'Name', "name": 'Name', width: '200px'},
				{"field": 'Value', "name": 'Value', width: '200px'},
				{"field": 'Unit', "name": 'Unit', width: '100px'},
				{"field": 'Type', "name": 'Type', width: '100px'},
				{"field": 'Timestamp', "name": 'Timestamp', width: '100px'},
			]
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
	}
});
dojo.declare("webgui.display.ANDdisplay",null,{
	constructor: function(){
		console.log("[ANDdisplay] initializing components..");
		var controller = new ANDController();		
	}
});