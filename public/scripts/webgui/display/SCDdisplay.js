dojo.declare("SCDParameterStore", ParameterStore, {
	key: 'Timestamp',
	parameterHandler: {}, 
	constructor: function() {
		var viewParameters = {};
		var store = this.getStore();		
		//for removing from store TODO refactor
		var counter = 0;
		var limit = 40;
		
		this.parameterHandler = function(parameter) {
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
                //TODO not a good idea to update the view constantly
		dojo.connect(store, "newItem", this, "updateViewCallback");
		
		//subscribe to internal topics dynamically, when they are added to the subscription lists
                /*
		var subscribeToTopic = function(subscription) {
			//console.log(this.updateViewCallback);
			msgbus.subscribe("/parameter/live", this, "parameterHandler");
			dojo.connect(this, "parameterHandler", this, "updateViewCallback");
		};

		msgbus.subscribe("/request/subscribe", subscribeToTopic);
		*/
		//TODO Make upper code work !
		msgbus.subscribe("/parameter/live", this.parameterHandler);

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

dojo.declare("SCDDataAbstraction", DataAbstraction, {
	  constructor: function(args) {
		this.parameterStore = new SCDParameterStore({"updateViewCallback": this.updateViewCallback});
	  }
});

dojo.declare("SCDController", MixinObject, {
	divId: "SCDTable", //defaultId
	columnLimit: 5, //maximum number of parameters shown, based on order recieved
	constructor: function() {
		var gridStructure = [
				{"field": "Timestamp", "name": "Timestamp", "width": "100px"}
		];
		
		var scdPresentation =  new GridPresentation({
		"divId": this.divId,
		"configuration": {
			"id": this.divId,
			//"store": dataAbstraction.getStore(),
			"clientSort": true,
			"structure": gridStructure,
			"updateDelay": 1000
		}});
		
		/**
		* function for updating tabel columns if new parameters are added.
		* It is connected to the parameterStore parameterHandler function
		* @param parameter The object coming from the subscribed channel
		*/
               //TODO maybe THIS should also store the info and update only at a set interval !!!
		var updateViewCallback = function(parameter) {
			//look if, the column already exists
			var nameExists = false;
			dojo.forEach(gridStructure, function(entry, i){
				if(entry.name == parameter.Name) {
					nameExists = true;
				}
			});
			//if it doesn't, add it.
			if(!nameExists && gridStructure.length <= 5) {
				gridStructure.push({"field": parameter.Name + "Value", "name": parameter.Name, "width":  "120px"});
				scdPresentation.setGridStructure(gridStructure);
			}
                        //scroll to the bottom of the list
                        scdPresentation.scrollToGridBottom()

		};

                var removeFromViewCallback = function(parameter) {
                    gridStructure.splice(gridStructure.indexOf(parameter.Name),1);
                    scdPresentation.setGridStructure(gridStructure);
                }
                //TODO, this should be done with connect like updateViewCallback
                msgbus.subscribe("/viewparams/hide", removeFromViewCallback);

		var dataAbstraction = new SCDDataAbstraction({"updateViewCallback": updateViewCallback});
		
		scdPresentation.setGridStore(dataAbstraction.getStore());
	}
});