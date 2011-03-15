dojo.provide("webgui.pac.DndSourceable");

dojo.require("dojo.dnd.Source");
// make the presentation container tag a DnD source with
// a new not displayed "dropbox" div to collect the dropped items
webgui.pac.DndSourceable = function(agent,opt){
	// first we set the dnd.Source options
	var dndOptions = {};
	// then we mixin the opt
	dojo.safeMixin(dndOptions,opt);	

	//finally add the DnD capability
	agent.dndSource = new dojo.dnd.Source(agent.domId,dndOptions);
	dojo.connect(agent.dndSource,"onDrop",function(source,nodes,copy,target){
		console.log(nodes);
	});
	return agent;
};