//For HTML and some presentations
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.ContentPane");

//Grid Presentatons
dojo.require("dojox.grid.DataGrid");
//Stores
dojo.require("dojo.data.ItemFileWriteStore");

//Cometd for CometProxy
dojo.require("dojox.cometd");
dojo.require("dojox.cometd.longPollTransport");

//For Chart Views
dojo.require("dojox.charting.widget.Chart2D");
dojo.require("dojox.charting.widget.Legend");
dojo.require("dojox.charting.action2d.Magnify");
dojo.require("dojox.charting.action2d.Tooltip");
dojo.require("dojox.charting.themes.Shrooms");

dojo.declare("MixinObject", null, {
	  constructor: function(args){
		dojo.safeMixin(this, args);
	  }
});

function ConnectionManager(url){
    var io = dojox.cometd;
    console.log("[ConnectionManager] connecting to " + url);
    io.init(url);
    
	//Refactor the following to CometProxy !!!
    var publishToInnerBus = function(message){
		//console.log("[ConnectionManager] received " + JSON.stringify(message));
		dojo.publish(message.channel,[message.data]);
    };
    var subscribe = function(message){
		var h = io.subscribe(message.topic, publishToInnerBus);
		h.addCallback(function(){
			console.log("[ConnectionManager] subscription to "+ h.args[0] + " established");
		});
    };    
    
    dojo.subscribe("/request/subscribe", subscribe);
};


dojo.declare("DataAbstraction", MixinObject, {
	getStore: function() {
		return this.parameterStore.getStore();
	}
});

dojo.declare("GridPresentation", MixinObject, {
	  init: function() {
		var grid = new dojox.grid.DataGrid(this.configuration, document.createElement('div'));
 
		// append the new grid to the container div:
		dojo.byId(this.divId + "Container").appendChild(grid.domNode);
	  
		// Call startup, in order to render the grid:
		grid.startup();
	  }
});

/*
dojo.declare("ParameterStore", MixinObject, {
	key:'key',
	parHandler: {},
	constructor: function(args){
		this.getStore = function(){
			return this.store;
		};
		console.log("parHandler");
		console.log(this.parHandler);
		var storedata = {identifier: this.key, items: []};
		this.store = new dojo.data.ItemFileWriteStore({data:storedata});
		dojo.subscribe("/parameter/live",this.parHandler);
		//TODO: prolly have to refactor elsewhere, not really nice here
		//DOESN't work twice !
		dojo.publish("/request/subscribe",[{"topic":"/parameter/live"}]);	
	},
});

dojo.declare("ANDParameterStore", ParameterStore, {
	constructor: function(args) {
		var localStore = this.store;
		console.log(localStore);
		this.parHandler = function(parameter){
			parameter.key = parameter.Name;
			//AND display store logic
			
			//console.log(this.getStore());
			this.store.fetch({query: {key:parameter.Name},
				onBegin: function(size,request){
					if(size == 0){
						this.store.newItem(parameter);
					};
							
				},    
				onItem: function(item){
					this.store.setValue(item,"Name",parameter.Name);
					this.store.setValue(item,"Value",parameter.Value);
					this.store.setValue(item,"Type",parameter.Type);
					this.store.setValue(item,"Timestamp",parameter.Timestamp);
				},
				onError: function(er) {
					console.err(er);
				}    
			});
		}
	}
});
*/
function ANDParameterStore() {
	var storedata = {identifier: 'key', items: []};
    var store = new dojo.data.ItemFileWriteStore({data:storedata});
	
    this.getStore = function(){
		return store;
    };
	
    var parHandler = function(parameter){
		//console.log("[ANDParameterStore] received " + JSON.stringify(parameter));
		parameter.key = parameter.Name;

		//AND display store logic
		store.fetch({query: {key:parameter.Name},
			onBegin: function(size,request){
				if(size == 0){
					store.newItem(parameter);
				};
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
    };
	
    dojo.subscribe("/parameter/live",parHandler);
	//TODO: prolly have to refactor elsewhere, not really nice here
    dojo.publish("/request/subscribe",[{"topic":"/parameter/live"}]);
};

dojo.declare("ANDDataAbstraction", DataAbstraction, {
	  constructor: function(args) {
		this.parameterStore = new ANDParameterStore();
		//console.log(this.parameterStore);
	  }
});
/*
dojo.declare("ANDPresentation", GridPresentation, {
	  configuration: {
		"id": this.divId,
        "store": this.store,
        "clientSort": true,
		"structure": [
			{ "field": 'Name', "name": 'Name', width: '200px' },
			{ "field": 'Value', "name": 'Value', width: '200px' },
			{ "field": 'Unit', "name": 'Unit', width: '100px' },
			{ "field": 'Type', "name": 'Type', width: '100px' },
			{ "field": 'Timestamp', "name": 'Timestamp', width: '100px' },
		]
    }
});
*/

function ANDController() {
	this.divId = "ANDTable";
	var dataAbstraction = new ANDDataAbstraction();
	//presentation
	var andPresentation =  new GridPresentation({
	"divId": this.divId,
	"configuration": {
		"id": this.divId,
        "store": dataAbstraction.getStore(),
        "clientSort": true,
		"structure": [
			{ "field": 'Name', "name": 'Name', width: '200px' },
			{ "field": 'Value', "name": 'Value', width: '200px' },
			{ "field": 'Unit', "name": 'Unit', width: '100px' },
			{ "field": 'Type', "name": 'Type', width: '100px' },
			{ "field": 'Timestamp', "name": 'Timestamp', width: '100px' },
		]
    }});
	andPresentation.init();
};

function Assembler() {

	//initialize application javascript
	loadApplication();
	removeLoadingScreen();
	
	//initialize Cometd connection 
	//TODO: refactorto include CometProxies now already writes to inner bus
	new ConnectionManager("http://10.48.16.36:8086/cometd");
	
	//initialize Agents...
	new ANDController();
	
	function loadApplication() {
		var start = new Date().getTime();
		dojo.parser.parse(dojo.byId('container'));
		dojo.byId('loaderInner').innerHTML += " done.";
	}
	
	function removeLoadingScreen() {
	 setTimeout(function hideLoader(){
		var loader = dojo.byId('loader');
		dojo.fadeOut({ node: loader, 
				duration:500,
				onEnd: function(){
					loader.style.display = "none";
				}
		}).play();
		}, 250);
	}
	

};


dojo.addOnLoad(function() {
	new Assembler();
	
});