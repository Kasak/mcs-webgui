dojo.provide("webgui.comm.CometProxy");
//Cometd for CometProxy
dojo.require("dojox.cometd");
dojo.require("dojox.cometd.longPollTransport");
// our message bus
dojo.require("webgui.msgbus");
/**
 * Refactor, currently this class'es code is called by a subscription bus, bu it might not be the best idea ...
 */
dojo.declare("webgui.comm.CometProxy",null,{
	cometdUrl: "http://127.0.0.1:8086/cometd", //default url for cometd
	initCometd: function(){
		var io = dojox.cometd;
		console.log("[ConnectionManager] connecting to " + this.cometdUrl);
		io.init(this.cometdUrl);
		//TODO add connection check
		this.listenCometd();
	},
	listenCometd: function(){
		var io = dojox.cometd;		
		var publishToInnerBus = function(message) {
			//console.log("[ConnectionManager] received " + JSON.stringify(message));
			webgui.msgbus.publish(message.channel,[message.data]);
		};
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
		webgui.msgbus.subscribe("/request/subscribe",subscribeToCometdTopic);
	},
	constructor: function(args){
		dojo.safeMixin(this.args);
		this.initCometd();
	}
});