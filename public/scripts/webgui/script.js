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

dojo.require("dijit.form.CheckBox");

var msgbus = dojo.require("webgui.msgbus");

/**
 * Basic object template for having mixing ability
 */
dojo.declare("MixinObject", null, {
	  constructor: function(args){
		dojo.safeMixin(this, args);
	  }
});

/**
 * Refactor, currently this class'es code is called by a subscription bus, bu it might not be the best idea ...
 */
function CometListener() {
	var io = dojox.cometd;
	//Refactor the following to CometProxy !!!
    var publishToInnerBus = function(message) {
		//console.log("[ConnectionManager] received " + JSON.stringify(message));
		msgbus.publish(message.channel,[message.data]);
    };
	/*
	dojo.forEach(topics, function(topic, i) {
		var handle = io.subscribe(topic, publishToInnerBus);
		handle.addCallback(function(){
			console.log("[ConnectionManager] subscription to "+ handle.args[0] + " established");
		});
	});
	*/
	
	/**
	*  CometListener listenes internal dojo channel "request/subscribe" for topics.
	*  If a topic is requested, this function is called, which in turn subscribes to the requested topic on cometd message-bus.
	*  @param subscription The  subscription message
	*/
	var subscribeToCometdTopic = function(subscription) {
		var handle = io.subscribe(subscription.topic, publishToInnerBus);
		handle.addCallback(function(){
			console.log("[ConnectionManager] subscription to "+ handle.args[0] + " established");
		});
    };
    
    msgbus.subscribe("/request/subscribe",subscribeToCometdTopic);   
}


dojo.declare("DataAbstraction", MixinObject, {
	getStore: function() {
		return this.parameterStore.getStore();
	}
});

dojo.declare("GridPresentation", MixinObject, {
	  constructor: function() {
		var grid = new dojox.grid.DataGrid(this.configuration, document.createElement('div'));
 
		// append the new grid to the container div:
		dojo.byId(this.divId + "Container").appendChild(grid.domNode);
	  
		// Call startup, in order to render the grid:
		grid.startup();
		
		/*for managing grid layout on the fly*/
		this.setGridStructure = function(structure) {
			grid.setStructure(structure);
		};

		this.setGridStore = function(store) {
			grid.setStore(store);
		};
            console.log(grid);
            //grid.escapeHTMLInData = false;
	  }
});


dojo.declare("ParameterStore", MixinObject, {
	constructor: function(args){
		var storedata = {identifier: this.key, items: []};
		var store = new dojo.data.ItemFileWriteStore({data:storedata});
				
		this.getStore = function(){
			return store;
		};
	}
});

/*AND display */

dojo.declare("ANDParameterStore", ParameterStore, {
	key: 'key',
	constructor: function() {
		var viewParameters = {};
		var store = this.getStore();		
		function parameterHandler (parameter) {
			//console.log("[ANDParameterStore] received " + JSON.stringify(parameter));
                        //console.log(viewParameters[parameter.Name]);
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
                }
                msgbus.subscribe("/viewparams/show", addViewParameter);
                msgbus.subscribe("/viewparams/hide", hideViewParameter);
	}
});

dojo.declare("ANDDataAbstraction", DataAbstraction, {
	  constructor: function(args) {
		this.parameterStore = new ANDParameterStore();
	  }
});

dojo.declare("ANDController", MixinObject, {
	divId: "ANDTable", //defaultId
	constructor: function() {
		var dataAbstraction = new ANDDataAbstraction();
		//ANDpresentation
		new GridPresentation({
		"divId": this.divId,
		"configuration": {
			"id": this.divId,
			"store": dataAbstraction.getStore(),
			"clientSort": true,
			"updateDelay": 1000,
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

/*SCD display */

dojo.declare("SCDParameterStore", ParameterStore, {
	key: 'Timestamp',
	parameterHandler: {}, 
	constructor: function() {
		var viewParameters = {};
		var store = this.getStore();		
		//for removing from store TODO refactor
		var counter = 0;
		var limit = 20;
		
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

/*Graph Display*/
//TODO store, abstraction, presentation
dojo.declare("GraphPresentation", MixinObject, {
    constructor: function() {
    }
});
//TODO: Refactor into parts, after parameter change boxes are done
dojo.declare("GraphController", MixinObject, {
        updateInterval: 1000, //update interval in milliseconds
	divId: "chartDiv", //defaultId
	constructor: function() {
		var chart = new dojox.charting.Chart2D(this.divId);

                //Add the plot area at an offset of 10 pixels from the top left
                
                //chart.plotArea = {height: 800, width: 800};

		chart.addPlot("default", {
			//type of chart
			type: "Lines",
			markers: true,
			lines: true,
			//areas: true,
			labelOffset: -30,
			shadows: {dx:2, dy:2, dw:2}
		});
		chart.addAxis("x");
		chart.addAxis("y", {vertical:true});

                chart.resize(800, 400);
		
		// connect browser resize to chart
		dojo.connect(dijit.byId("chartPane"), "resize", this, function(evt) {
			var dim = dijit.byId("chartPane")._contentBox;
			chart.resize(dim.w, dim.h);
		});
		
		
		new dojox.charting.action2d.Magnify(chart, "default");
		new dojox.charting.action2d.Tooltip(chart, "default");

                /*get the right plot of the series, also truncates the series for scrolling*/
                var historyLimit = 100; //the limit of datapoints TODO should be a mixinvariable, but then this function can't access this
                var getSeriesData = function(itemName) {
                    	var seriesExists = false;
			var seriesArrayData;
			dojo.forEach(chart.series, function(entry, key) {
				if(entry.name == itemName) {
					seriesExists = true;
					seriesArrayData = entry.data;
				}
			});
                        if(!seriesExists) {
                            return false;
                        }

                        if(seriesArrayData.length >= historyLimit) {
                            seriesArrayData.splice(0, seriesArrayData.length - historyLimit);
                        }

                        return seriesArrayData;
                }
		
		//to change chart as new items are added
		this.updateViewCallback = function(item) {

                        var seriesArrayData = getSeriesData(item.Name);
			if(seriesArrayData === false) {
				chart.addSeries(item.Name, [{"x":item["Timestamp"], "y":item[item["Name"] + "Value"]}]/*, {stroke: {color: "#FFFF00"}, fill: "#FFFF00"}*/);
			} else {
				seriesArrayData.push({"x":item["Timestamp"], "y":item[item["Name"] + "Value"]});
				chart.updateSeries(item.Name, seriesArrayData);
			}
		}

                var dataAbstraction = new SCDDataAbstraction({"updateViewCallback": this.updateViewCallback});	

                //update View at set interval
                var legend;
                var chartContainer = dojo.byId("ChartContainer");
                
                var updateView = function() {
                    chart.render();
                    //legend
                    if(legend) {
                        legend.destroy();
                    }
                    chartContainer.appendChild(dojo.create("div", {id: "legend"}));
                    legend = new dojox.charting.widget.Legend({chart:chart}, "legend");

                };

                setInterval(updateView, this.updateInterval);

                var removeFromView = function(remove) {
                    dojo.forEach(chart.series, function(entry, key) {
                        if(entry && entry.name == remove.parameter) {
                            chart.removeSeries(remove.parameter);
                        }
                    });
                }
                //TODO, this should be done with connect like updateViewCallback
                msgbus.subscribe("/viewparams/hide", removeFromView);

                // connect browser resize to chart
                dojo.connect(dijit.byId("chartPane"), "resize", this, function(evt){
                    var dim = dijit.byId("chartPane")._contentBox;
                            chart.resize(dim.w, dim.h);
                });
		
	}
});

/*3d Display*/

/**
 * Currently only keeps track of one sattelite
 * No store currently required
 */
dojo.declare("X3DDataAbstraction", MixinObject, {
	constructor: function() {
                var sattelite = {};

                /**
                 * privileged function to return the sattelite object for views
                 */
                this.getSattelite = function() {
                    return sattelite;
                }

                /**
                 * Updates sattelite position data any time some of its
                 * parameters arrive.
                 */
                var parameterHandler = function(parameter) {

                    switch(parameter.Name) {
                        case "Elevation":
                            sattelite.Elevation = parameter.Value;
                            break;
                        case "Longitude":
                            sattelite.Longitude = parameter.Value;
                            break;
                        case "Latitude":
                            sattelite.Latitude = parameter.Value;
                            break;
                    }

                };

                //listens to topics to all channels broadcast to currently
		var subscribeToTopic = function(subscription) {
			msgbus.subscribe(subscription.topic, parameterHandler);
		};

		msgbus.subscribe("/request/subscribe",subscribeToTopic);


	}
});

dojo.declare("X3DPresentation", MixinObject, {
    constructor: function() {
        var satTransform = dojo.byId("satteliteTransform");

        this.refreshView = function(coordinates) {
            dojo.attr(satTransform, "translation", coordinates);
        }
    }
});

//TODO make updateinterval a property for all controllers
/**
 * 3D-display controller
 */
dojo.declare("X3DController", MixinObject, {
        updateInterval: 100, //update interval in milliseconds
    	divId: "chartDiv", //defaultId
	constructor: function() {
            var converter = new CartesianConverter();
            var dataAbstraciton = new X3DDataAbstraction();
            var presentation = new X3DPresentation();

            var updateView = function() {
                presentation.refreshView(converter.convertItem(dataAbstraciton.getSattelite()));
            };

             setInterval(updateView, this.updateInterval);
	}
});

/**
 * Longitude-Latitude to Cartesian converter
 */
function CartesianConverter() {
    //constants
    var planetRadius = 6371; //km
    var radianConstant = Math.PI / 180; //conversion constant to radians

    /**
     * Converts an object into a string containing cartesian coordinates.
     * @param item an object with Longitude, Latitude and Elevation properties.
     * @return String containing x, y, z coordinates that are acceptable
     * for X3Dom Transfomation node's translation attribute.
     */
    this.convertItem = function(item) {

        //javascript trigonometric functions use radians, therefore convert
        var radLongitude = item.Longitude * radianConstant;
        var radLatitude = item.Latitude * radianConstant;
        //divided by 1000 as item elevation is in m.
        var elevation = planetRadius + (item.Elevation / 1000);

        //precalculation
        var sinFi = Math.sin(radLatitude);
        var cosFi = Math.cos(radLatitude);
        var sinLambda = Math.sin(radLongitude);
        var cosLambda = Math.cos(radLongitude);

        var x = elevation * cosFi * cosLambda;
        var y = elevation * cosFi * sinLambda;
        var z = elevation * sinFi;

        return (y) + " " + z + " " + x;
    }
}

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

dojo.declare("Assembler", MixinObject, {
   cometdUrl: "http://127.0.0.1:8086/cometd", //default url for cometd
   constructor: function() {

       function loadApplication() {
		var start = new Date().getTime();
		dojo.parser.parse(dojo.byId('container'));
		dojo.byId('loaderInner').innerHTML += " done.";
	}

	function removeLoadingScreen() {
	 setTimeout(function hideLoader(){
		var loader = dojo.byId('loader');
		dojo.fadeOut({node: loader,
				duration:500,
				onEnd: function(){
					loader.style.display = "none";
				}
		}).play();
		}, 250);
	}

	function initComet(url) {
	    var io = dojox.cometd;
		console.log("[ConnectionManager] connecting to " + url);
		io.init(url);
	}


	//initialize application javascript
	loadApplication();
	removeLoadingScreen();
	//initialize Cometd connection
	initComet(this.cometdUrl);
	//initialize comet channel listeners...

	new CometListener();
        //new ParameterGenerator();
	//initialize Agents...
	new ANDController({divId: "ANDTable"});
	new SCDController({divId: "SCDTable"});
	new GraphController();
        new X3DController();
        new StatesController();
        //for handling all parameters
        new ParameterController();

	//define channels what should be listened to
	msgbus.publish("/request/subscribe",[{"topic":"/parameter/live"}]);
        //msgbus.publish("/request/subscribe",[{"topic":"/parameter/logs"}]);

        function logOutput(param) {
            console.log(param);
        }
        msgbus.subscribe("/parameter/logs", logOutput);
   }
});

/*initialisations*/
dojo.addOnLoad(function() {
	new Assembler({cometdUrl: "http://127.0.0.1:8086/cometd"});
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
