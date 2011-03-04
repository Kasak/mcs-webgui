/*States display*/
dojo.provide("webgui.display.StateDisplay");
dojo.require("webgui.pac.Controller");
dojo.require("webgui.pac.Abstraction");
dojo.require("webgui.pac.GridPresentation");
//Stores
dojo.require("dojo.data.ItemFileWriteStore");

dojo.declare("StatesAbstraction", webgui.pac.Abstraction, {
	constructor: function(args) {
		var key = 'key';
		var storedata = {identifier: key, items: []};
		var store = new dojo.data.ItemFileWriteStore({data:storedata});
		this.getStore = function(){
			return store;
		};		
		function parameterHandler (parameter) {
			//console.log("[StateParameterStore] received " + JSON.stringify(parameter));

			if(parameter.Type !== "State") {
				return;
			}
			parameter.key = parameter.Name;
			parameter.State = '<div class="stateTable' +(parameter.Value == true ? "True" : "False") + '">' + parameter.Value + '</div>';

			//AND display store logic
			store.fetch({query: {key: parameter.Name},
				onBegin: function(size, request){
					if(size == 0){
						store.newItem(parameter);
					}
				},
				onItem: function(item){
					store.setValue(item,"Name",parameter["Name"]);
					store.setValue(item,"State",parameter["State"]);
					store.setValue(item,"Timestamp",parameter["Timestamp"]);
					store.setValue(item,"Description",parameter["Descripton"]);
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
	}
});

dojo.declare("StatesController", webgui.pac.Controller, {
	divId: "StatesTable", //defaultId
	constructor: function() {
		var dataAbstraction = new StatesAbstraction();
		new webgui.pac.GridPresentation({
		"divId": this.divId,
		"configuration": {
			"id": this.divId,
			"store": dataAbstraction.getStore(),
			"clientSort": true,
			//"updateDelay": 1000,
            "escapeHTMLInData": false,
			"structure": [
                {"field": 'Name', "name": 'Name', "width": '200px'},
				{"field": 'State', "name": 'State', "width": '100px'},
				{"field": 'Timestamp', "name": 'Timestamp', "width": '100px'},
                {"field": 'Description', "name": 'Description', "width": '200px'},
			]
		}});
	}
});
dojo.declare("webgui.display.StateDisplay",null,{
	constructor: function(){
		console.log("[StateDisplay] initializing components..");
		var controller = new StatesController();
	}
});