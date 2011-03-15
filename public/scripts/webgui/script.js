//For HTML and some presentations
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.TabContainer");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.CheckBox");

var msgbus = dojo.require("webgui.msgbus");
dojo.require("webgui.assembly.Assembler");

/*initialisations*/
dojo.addOnLoad(function() {
	var assembler = new webgui.assembly.Assembler();
	assembler.loadAssembly(); // TODO maybe better to call this from within Assembler??
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
		param.Type = "Parameter";
		param.Timestamp = new Date().getTime();
		console.log("sending " + JSON.stringify(param));
		webgui.msgbus.publish("/parameter/live", [param]);
	}, 2000);
}
