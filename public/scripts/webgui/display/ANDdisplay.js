dojo.provide("webgui.display.ANDdisplay");
dojo.require("webgui.pac.Controller");
dojo.require("webgui.pac.Abstraction");
dojo.require("webgui.pac.Presentation");
//Stores
dojo.require("dojo.data.ItemFileWriteStore");
//Grid Presentatons
dojo.require("dojox.grid.DataGrid");

dojo.declare("ANDAbstraction", webgui.pac.Abstraction, {	
	  constructor: function(args) {
		var key = 'key';
		var storedata = {identifier: key, items: []}
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
			console.log("AndAbstraction subscription called with:");
			msgbus.subscribe(subscription.topic, parameterHandler);
		};

		msgbus.subscribe("/request/subscribe", subscribeToTopic);

		//parameter hiding and showing
		function addViewParameter(item) {
			viewParameters[item.parameter] = true;
		}
		function hideViewParameter(item) {
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

dojo.declare("GridPresentation", webgui.pac.Presentation, {
	  constructor: function() {
		var grid = new dojox.grid.DataGrid(this.configuration, document.createElement('div'));
		// append the new grid to the container div:
		dojo.byId(this.divId + "Container").appendChild(grid.domNode);
	  
		// Call startup, in order to render the grid:
		grid.startup();

		//to scroll to the bottom row of the grid
		this.scrollToGridBottom = function() {
		  grid.scrollToRow(grid.rowCount);
		};

		/*for managing grid layout on the fly*/
		this.setGridStructure = function(structure) {
			grid.setStructure(structure);
		};

		this.setGridStore = function(store) {
			grid.setStore(store);
		};
	  }
});


dojo.declare("ANDController", webgui.pac.Controller,{
	divId: "ANDTable", //defaultId
	constructor: function() {
		console.log("creating new AND abtsraction");
		var dataAbstraction = new ANDAbstraction();
		//ANDpresentation
		console.log("creating new AND presentation");
		new GridPresentation({
		"divId": this.divId,
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
	}
});
dojo.declare("webgui.display.ANDdisplay",null,{
	constructor: function(){
		console.log("[ANDdisplay] initializing components..");
		var controller = new ANDController();
	}
});