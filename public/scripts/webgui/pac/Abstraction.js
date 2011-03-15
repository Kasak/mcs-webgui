dojo.provide("webgui.pac.Abstraction");

dojo.declare("webgui.pac.Abstraction",null,{
	put: function(){console.log("Function not implemented")}, // must be overridden 
	get: function(){console.log("Function not implemented")},	// must be overridden
	remove: function(){console.log("Function not implemented")},	// must be overridden
	constructor: function(args){
		dojo.safeMixin(this, args);
	}
});