dojo.provide("webgui.display.GRAPHdisplay");
dojo.require("webgui.pac.Controller");
dojo.require("webgui.pac.Abstraction");
dojo.require("webgui.pac.Presentation");

//For Chart Views
dojo.require("dojox.charting.widget.Chart2D");
dojo.require("dojox.charting.widget.Legend");
dojo.require("dojox.charting.action2d.Magnify");
dojo.require("dojox.charting.action2d.Tooltip");

//TODO store, abstraction, presentation
dojo.declare("GRAPHAbstraction", webgui.pac.Abstraction, {
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
		msgbus.subscribe("/parameter/live", parameterHandler);

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
//TODO: Refactor into parts, after parameter change boxes are done
dojo.declare("GRAPHController", webgui.pac.Controller, {
        updateInterval: 500, //update interval in milliseconds
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
		function updateViewCallback(item) {

            var seriesArrayData = getSeriesData(item.Name);
			if(seriesArrayData === false) {
				chart.addSeries(item.Name, [{"x":item["Timestamp"], "y":item[item["Name"] + "Value"]}]/*, {stroke: {color: "#FFFF00"}, fill: "#FFFF00"}*/);
			} else {
				seriesArrayData.push({"x":item["Timestamp"], "y":item[item["Name"] + "Value"]});
				chart.updateSeries(item.Name, seriesArrayData);
			}
		}
		var dataAbstraction = new GRAPHAbstraction({"updateViewCallback": updateViewCallback});
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
dojo.declare("webgui.display.GRAPHdisplay",null,{
	constructor: function(){
		var controller = new GRAPHController();
	}
});