/*States display*/
dojo.declare("StatesParameterStore", ParameterStore, {
	key: "key",
        constructor: function() {
		var store = this.getStore();
		function parameterHandler (parameter) {
			//console.log("[StateParameterStore] received " + JSON.stringify(parameter));

                        if(parameter.Type !== "State") {
                            return;
                        }
                        //constant into main class properties
                        //console.log("[StateParameterStore] received " + JSON.stringify(parameter));

			parameter.key = parameter.Name;
                        parameter.State = '<div class="stateTable' +
                                (parameter.Value == true ? "True" : "False") +
                                '">' + parameter.Value + '</div>';

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

dojo.declare("StatesDataAbstraction", DataAbstraction, {
	  constructor: function(args) {
		this.parameterStore = new StatesParameterStore();
	  }
});

dojo.declare("StatesController", MixinObject, {
	divId: "StatesTable", //defaultId
	constructor: function() {
		var dataAbstraction = new StatesDataAbstraction();
		new GridPresentation({
		"divId": this.divId,
		"configuration": {
			"id": this.divId,
			"store": dataAbstraction.getStore(),
			"clientSort": true,
			"updateDelay": 1000,
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
