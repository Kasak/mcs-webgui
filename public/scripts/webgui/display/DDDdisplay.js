/*3d Display*/
dojo.provide("webgui.display.DDDdisplay");
dojo.require("webgui.pac.Controller");
dojo.require("webgui.pac.Abstraction");
dojo.require("webgui.pac.Presentation");

/**
 * Currently only keeps track of one satellite
 * No store currently required
 */
dojo.declare("X3DDataAbstraction", webgui.pac.Abstraction, {
	constructor: function() {
		var satellite = {};

		/**
		 * privileged function to return the satellite object for views
		 */
		this.getsatellite = function() {
			return satellite;
		}

		/**
		 * Updates satellite position data any time some of its
		 * parameters arrive.
		 */
		var parameterHandler = function(parameter) {

			switch(parameter.Name) {
				case "Elevation":
					satellite.Elevation = parameter.Value;
					break;
				case "Longitude":
					satellite.Longitude = parameter.Value;
					break;
				case "Latitude":
					satellite.Latitude = parameter.Value;
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

dojo.declare("X3DPresentation", webgui.pac.Presentation, {
    constructor: function() {
        var satTransform = dojo.byId("satelliteTransform");
        var satRotation = dojo.byId("satelliteRotation");
        this.refreshView = function(item) {
            dojo.attr(satTransform, "translation", item.CartesianCoordinates);
            //dojo.attr(satRotation, "rotation", item.RotationQuaternion);
        }
    }
});

//TODO make updateinterval a property for all controllers
/**
 * 3D-display controller
 */
dojo.declare("X3DController", webgui.pac.Controller, {
        updateInterval: 100, //update interval in milliseconds
    	divId: "chartDiv", //defaultId
	constructor: function() {
            var converter = new CartesianConverter();
            var dataAbstraction = new X3DDataAbstraction();
            var presentation = new X3DPresentation();

            var updateView = function() {
                presentation.refreshView(converter.convertItem(dataAbstraction.getsatellite()));
            };

             setInterval(updateView, this.updateInterval);
	}
});

dojo.declare("webgui.display.DDDdisplay",null,{
	constructor: function(){
		var controller = new X3DController();
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
        item.CartesianCoordinates = (y) + " " + z + " " + x;

        //set rotation, maybe not the best place to do it ?
        item.RotationQuaternion = " 0 0 1 " + (radLongitude);

        return item;
    }
}