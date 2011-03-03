//For Chart Views
dojo.require("dojox.charting.widget.Chart2D");
dojo.require("dojox.charting.widget.Legend");
dojo.require("dojox.charting.action2d.Magnify");
dojo.require("dojox.charting.action2d.Tooltip");

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
