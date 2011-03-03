dojo.provide("webgui.assembly.Assembler");
dojo.require("webgui.msgbus");
dojo.require("webgui.comm.CometProxy");

dojo.require("webgui.display.ANDdisplay");

dojo.declare("webgui.assembly.Assembler",null,{
	loadAssembly: function(){
		// TODO load from a config file??
		dojo.parser.parse();
		dojo.byId('loaderInner').innerHTML += " done.";
		setTimeout(function hideLoader(){
		var loader = dojo.byId('loader');
		dojo.fadeOut({node: loader,
				duration:500,
				onEnd: function(){
					loader.style.display = "none";
				}
		}).play();
		}, 250);
		
		//comet proxy TODO: add generic comm proxy class
		
		new webgui.comm.CometProxy({cometdUrl: "http://127.0.0.1:8086/cometd"});
		//new ParameterGenerator();
		//initialize Agents...
		new webgui.display.ANDdisplay();
		//new SCDController({divId: "SCDTable"});
		//new GraphController();
		//new X3DController();
		//new StatesController();
		//for handling all parameters
		new ParameterController();
		
		//define channels what should be listened to
		// TODO these should really go into each controller
		webgui.msgbus.publish("/request/subscribe",[{"topic":"/parameter/live"}]);
		webgui.msgbus.publish("/request/subscribe",[{"topic":"/parameter/logs"}]);
		var logOutput = function logOutput(param) {
			console.log(param);
		}
		webgui.msgbus.subscribe("/parameter/logs", logOutput);
	},

});