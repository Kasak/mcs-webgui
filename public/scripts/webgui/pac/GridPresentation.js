dojo.provide("webgui.pac.GridPresentation");
dojo.require("webgui.pac.Presentation");
dojo.require("dojox.grid.DataGrid");

dojo.declare("webgui.pac.GridPresentation", webgui.pac.Presentation, {
	constructor: function() {
		console.log(this.domId);
		var grid = new dojox.grid.DataGrid(this.configuration, document.createElement('div'));
		// append the new grid to the container div:
		dojo.byId(this.domId).appendChild(grid.domNode);
		
		console.log("starting up the grid ... ");
		// Call startup, in order to render the grid:
		grid.startup();
		console.log("grid started");
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