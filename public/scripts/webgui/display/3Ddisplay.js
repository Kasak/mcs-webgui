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
        var satRotation = dojo.byId("satteliteRotation");

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
        item.CartesianCoordinates = (y) + " " + z + " " + x;

        //set rotation, maybe not the best place to do it ?
        item.RotationQuaternion = " 0 0 1 " + (radLongitude);

        return item;
    }
}