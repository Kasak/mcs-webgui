dojo.require("dojox.grid.DataGrid");
dojo.require("dojo.data.ItemFileWriteStore");


dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.ContentPane");


dojo.require("dijit.form.Button");
dojo.require("dijit.form.FilteringSelect");
//Cometd stuff
dojo.require("dojox.cometd");
dojo.require("dojox.cometd.longPollTransport");

/*charting*/
dojo.require("dojox.charting.widget.Chart2D");
dojo.require("dojox.charting.widget.Legend");
dojo.require("dojox.charting.action2d.Magnify");
dojo.require("dojox.charting.action2d.Tooltip");
dojo.require("dojox.charting.themes.Shrooms");
/* Custom objects */
function ConnectionManager(url){
    var io = dojox.cometd;
    console.log("[ConnectionManager] connecting to " + url);
    io.init(url);
    
    var publishToInnerBus = function(message){
	//console.log("[ConnectionManager] received " + JSON.stringify(message));
	dojo.publish(message.channel,[message.data]);
    };
    var subscribe = function(message){
	var h = io.subscribe(message.topic,publishToInnerBus);
		h.addCallback(function(){
			console.log("[ConnectionManager] subscription to "+ h.args[0] + " established");
		});
    };    
    
    dojo.subscribe("/request/subscribe",subscribe);    
};

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
				store.setValue(item, "Unit", parameter.Unit);
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

function SCDParameterStore() {
	var storedata = {identifier: 'Timestamp', items: []};
	var timestampStore = new dojo.data.ItemFileWriteStore({data:storedata});
	var layout = [
        { "field": 'Timestamp', "name": 'Timestamp', width: '200px' }
    ];
	
	this.getStore = function(){
		return timestampStore;
    };
	
	 // set the layout structure: 
      // create a new grid:
      var SCDGrid = new dojox.grid.DataGrid({
		  id: "SCDGrid",
          store: timestampStore,
          clientSort: true,
          structure: layout
      }, document.createElement('div'));
 
      // append the new grid to the container div:
      dojo.byId("tableSCDContainer").appendChild(SCDGrid.domNode);
	  
	  // Call startup, in order to render the grid:
      SCDGrid.startup();
    
	//for removing from timestampStore
	//TODO refactor
	var counter = 0;
	var limit = 5;
	
	var parHandler = function(parameter){
		//look if, the column already exists, if it does, add column
		var nameExists = false;
		dojo.forEach(layout, function(entry, i){
			if(entry.name == parameter.Name) {
				nameExists = true;
			}
		});
		
		if(!nameExists) {
			layout.push({ "field": parameter.Name + "Value", "name": parameter.Name});
			SCDGrid.setStructure(layout);
		}
		
		//init new timestamp store element, as we don't really require all parameter stuff
		var storeElem = {};
		storeElem[parameter.Name + "Value"] = parameter.Value;
		storeElem.Name = parameter.Name;
		storeElem.Timestamp = parameter.Timestamp;
		
		timestampStore.newItem(storeElem);
		
		/*refactor !!!*/
		/*
		counter++;
		if(counter > limit) {
			//getting the size of the store
			var size = function(size, request){
				//remove excess elements 
				timestampStore.fetch({count: (size - limit),
					onItem: function(item){
						timestampStore.deleteItem(item);
					}
				});
			};
			timestampStore.fetch({query: {}, onBegin: size, start: 0, count: 0});
		}
		*/
		/*refactor/*/
	}

    dojo.subscribe("/parameter/live",parHandler);
    //dojo.publish("/request/subscribe",[{"topic":"/parameter/live"}]);	
};

function ParameterView(id, store){
    dijit.byId(id).setStore(store);
};

function GraphView(id, store) {

	var chart = new dojox.charting.Chart2D(id);	
	chart.addPlot("default", {
        //type of chart
        type: "Lines",
        markers: true,
        lines: true,
        //areas: true,
        labelOffset: -30,
		shadows: { dx:2, dy:2, dw:2 }
	});
	chart.setTheme(dojox.charting.themes.Shrooms);
	chart.addAxis("x");
	chart.addAxis("y", { vertical:true });
	
	// connect browser resize to chart
    dojo.connect(dijit.byId("chartPane"), "resize", this, function(evt){
        var dim = dijit.byId("chartPane")._contentBox;
		chart.resize(dim.w, dim.h);
    });
	
	//this legend is created within an element with a "legend1" ID.
	//var legend = new dojox.charting.widget.Legend({chart: chart}, "chartLegend");
	
	new dojox.charting.action2d.Magnify(chart, "default");
	new dojox.charting.action2d.Tooltip(chart, "default");
	//chart.render();
	
	//to change chart as new items are added
	this.newItem = function(item) {
		var seriesExists = false;
		var seriesArrayData;
		dojo.forEach(chart.series, function(entry, key){
			if(entry.name == item.Name) {
				seriesExists = true;
				seriesArrayData = entry.data;
			}
		});

		if(!seriesExists) {
			chart.addSeries(item.Name, [{"x":item["Timestamp"], "y":item[item["Name"] + "Value"]}]);	
		} else {
			seriesArrayData.push({"x":item["Timestamp"], "y":item[item["Name"] + "Value"]});
			chart.updateSeries(item.Name, seriesArrayData);
		}
		chart.render();
		console.log(legend);
	}
	
	dojo.connect(store, "newItem", this, "newItem");
	
};

/*Loading screen stuff*/
function LoadApplication() {
	var start = new Date().getTime();
	dojo.parser.parse(dojo.byId('container'));
    dojo.byId('loaderInner').innerHTML += " done.";

    setTimeout(function hideLoader(){
	var loader = dojo.byId('loader');
	dojo.fadeOut({ node: loader, 
			duration:500,
			onEnd: function(){
			    loader.style.display = "none";
			}
	}).play();
    }, 250);
};

dojo.addOnLoad(function() {
	LoadApplication();
	//manage comet connection on the following url
	
	//new ParameterGenerator();
	var cm = new ConnectionManager("http://10.48.16.36:8086/cometd");
	
	//set up stores and views
	new ParameterView("tableAND", new ANDParameterStore().getStore());
	//actually does SCD screen initialization as well
	var SCDStore = new SCDParameterStore();
	//new GraphView("chartDiv", SCDStore.getStore());
	
});
// pass a function pointer

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
		param.Timestamp = new Date(); //.getTime()
		dojo.publish("/parameter/live", [param]);
	}, 2000);
}
