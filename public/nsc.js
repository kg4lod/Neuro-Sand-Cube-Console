var consoleActive=false;

// jquery init code
function InitTrialSetup()
{

    $("#trial_name").val("");
    $("#animal_number").val("");
    $("#trial_length").val("30");

    var newDate = new Date();
    //newDate.setTime(obj.time);
    var dateString = newDate.toISOString().substring(0,10);
    var timeString = newDate.toISOString().substring(11,16);
    $("#trial_date").val(dateString);
    $("#trial_time").val(timeString);
}

function StartTrial()
{
    // check if data is clean
    // for now just check trial length
    var trialLength = parseInt($("#trial_length").val());
    if (isNaN(trialLength) || trialLength < 1)
    {
	$("#errors").html("Please insert a valid trial length.");
	return false;
    }
    /*$("#trial_setup").hide();
    $("#trial_info_container").show();

    var obj = {};
    obj.trial_name = $("#trial_name").val();
    obj.animal_number = $("#animal_number").val();
    obj.trial_length = $("#trial_length").val();
    obj.trial_date = $("#trial_date").val();
    obj.trial_time = $("#trial_time").val();

    socket.emit('trial', obj);  */
    
    

}

function InitTrial()
{
    InitTrialSetup();
    $("#defaults_button").click(function() { InitTrialSetup(); } );
    //$("#start_trial_button").click(function() { StartTrial(); } );
    consoleActive=false;
}

function requestLogs()
{
    socket.emit('logs_request', {});
    socket.on('logs', function(data)
    {
	createLogList(data);

    });
}

function createLogList(logs)
{
    for (var log in logs)
    {
	var html = '<a href="' + getBaseURL() + 'log/' + log.toString() + '">' + logs[log] + '</a><br/>';
	$("#log_list").append(html);
    }

}

function InitLogs()
{
    consoleActive=false;
    requestLogs();
}

function InitConsole()
{
    consoleActive=true;
    $("#sortable").sortable();
    $("#sortable").disableSelection();
    $("#stats-table").hide();
    
    var availableIdTags = [
			   "restart_map",
			   "reset_counter",
			   "flush_water_reward",
			   "issue_reward"
			   ];
    var availableTargetTags = [
			       "level_restart",
			       "player_x",
			       "player_y",
			       "player_left_click",
			       "player_right_click",
			       "teleport",
			       "player_angle",
			       "distance_traveled",
			       "trial_start",
			       "correct_trial",
			       "incorrect_trial",
			       "reward_issued"
			       ];
    $("#id-tags").autocomplete(
    {
	source: availableIdTags
    }, function() 
    {
	setTimeout(function() 
		   {
		       var obj = { 
			   id: $("#id-tags").val(), target: $("#target-tags").val() 
		       };
		       $("#command").text(JSON.stringify(obj));
		   }, 50);});			
    $("#target-tags").autocomplete(
				   {
				       source: availableTargetTags
					   });
    setInterval(function() 
		{ 
		    var obj = { id: $("#id-tags").val(), target: $("#target-tags").val() };
		    $("#command").text(JSON.stringify(obj));
		}, 100);
		
	
    $("input[type=submit]").button().click(function( event ) 
					   {
					       event.preventDefault();
					       var obj = { id: $("#id-tags").val(), target: $("#target-tags").val() };
					       $("#command").text(JSON.stringify(obj));
					       socket.emit('command', obj);         
					   });
		
    $("#accordion").accordion(
			      {
				  heightStyle: "fill"
				      });
    //$("button").button();
    $("#tabs").tabs( { heightStyle: "content" });

    $("#stop_trial_button").click(function()
    {
	trial_time = -1;
	trial_active = false;
	socket.emit('stop_trial', {});
    });

    socket.emit('trial_progress_request', {});
}

function InitCommon()
{
    $("input[type=submit]").button();
    $("button").button();
}

$(function() {
	InitCommon();	
});
	



var consoleBuffer = new Array(30);
var consoleLength = 0;

var idMap = {};   // map of NSC output ids to data for this id
var idList = [];  // list of id's for which a graph has been added

var data = [];
var totalPoints = 300;

function presentConsole(data)
{
	if (consoleLength >= 29)
	{
		consoleBuffer.shift();
	}
	else
	{
		++consoleLength;
	}
	consoleBuffer.push(data + "<br/>");
	$('#console').html(consoleBuffer); 
}

function presentStats(data)
{
	var content = ""; // could dynamically update only rows in the table, but its probably just as fast to regenerate
	
	for(var key in idMap)
	{ 
	   var obj = idMap[key].val;
	   var newDate = new Date();
	   newDate.setTime(obj.time);
	   dateString = newDate.toISOString().substring(11,23);
	   content += "<tr><td class=\"td\">" + key + "</td><td class=\"td\">"+ obj.count + "</td><td class=\"td\">" + dateString + "</td><td class=\"td\">" + obj.frame + "</td><td class=\"td\">" + obj.value + "</td></tr>";
   }
   $("#stats-table").show();
   $("#stats-table tbody").html(content);
   
}

function presentGraphs(data)
{
	for(var key in idMap)
   {
	   var obj = idMap[key].val;
	   if (idList.indexOf(key) == -1) // add a new graph
	   {
			idList.push(key);
			var d = [];
			for (var i = 0; i < idMap[key].history.length; ++i)
			{
				var v = idMap[key].history[i][1];
				var t = idMap[key].history[i][0];
				d.push([t, v]);
			}
			var res = [{ label: key,  data: d}];

			var newGraph = "<div id=\"" + key + "\" class=\"graph\"> </div>";
			
			$("#graphs").append(newGraph);
			
			function setup(key)
			{
				idMap[key].plot.getAxes().yaxis.ticks = 10;
				idMap[key].plot.getAxes().xaxis.ticks = 4;
				idMap[key].plot.setupGrid();
				setTimeout(setup, 10000, key);
			}
			function update(key)
			{
			
				var d = [];
				var max=-10000;
				for (var i = 0; i < idMap[key].history.length; ++i)
				{
					var v = idMap[key].history[i][1];
					var t = idMap[key].history[i][0];
					if (v > max)
						max = v;
					d.push([t, v]);
				}
				idMap[key].plot.getAxes().xaxis.ticks = 2;
				idMap[key].plot.setupGrid();
				var res = [{ label: key,  data: d}];
				idMap[key].plot.setData( res );
				idMap[key].plot.getOptions().yaxis.max = max;
		
				idMap[key].plot.draw();
	
				setTimeout(update, 100,key);
			}
			
			var options = {
				series: { shadowSize: 0 }, // drawing is faster without shadows
				yaxis: {},
				xaxis: { show: true, mode: "time", ticks: 2}
				
			};
			
			var plot = $.plot($("#graphs > div:last"),  res , options); // select the last added li - this is the newly added graph
			$( "#tabs").tabs("refresh");
			idMap[key].plot = plot;
			update(key);			
	   }	   
   }
}

function presentMap(data)
{
	if ("player_x" in idMap)
	{
		var lastIndex = idMap["player_x"].history.length-1;
		var prevX = idMap["player_x"].history[lastIndex][1];
		prevX = (prevX -450)/2;
		lastIndex = idMap["player_y"].history.length-1;
		var prevY = idMap["player_y"].history[lastIndex][1];
		prevY = 300 - (prevY - 280)/2 - 35;
		lastIndex = idMap["player_angle"].history.length-1;
		var prevAngle = idMap["player_angle"].history[lastIndex][1];
		document.getElementById("mouseSVG").setAttribute('x', prevY);
		document.getElementById("mouseSVG").setAttribute('y', prevX);
		document.getElementById("mouseSVG").setAttribute("transform", "rotate(" + (90+prevAngle) + " " + (prevY+15) + " " + (prevX+15) +")");
	}
}

function present(data)
{
	// could probably have observers here, but we won't have more than 3 or 4
	presentConsole(data);
	presentStats(data);
    presentGraphs(data);
	presentMap(data);
}

function process(data)
{
	var objList = JSON.parse(data);
	var frame;
	var time;
	for (var i=objList.length -1; i >= 0; --i)
	{
		obj = objList[i];
		if (obj.id == "timestamp")
		{
			time = obj.value;
		}
		else if (obj.id == "frame")
		{
			frame = obj.value;
		}
		else
		{
			tmp = {};
			tmp.id = obj.id;
			tmp.count = obj.change_count;
			tmp.value = obj.value;
			tmp.time = time;
			tmp.frame= frame;
			if (!(obj.id in idMap)) // first time this ID is seen, create a new entry and history for it
			{
				idMap[obj.id] = {};
				idMap[obj.id].history = new Array();  		// we store the last N value, for graphing
				idMap[obj.id].history.push( [tmp.time,tmp.value]);
	
			}
			
			if (idMap[obj.id].history.length >= 1)
			{
				var lastIndex = idMap[obj.id].history.length-1;
				var prev = idMap[obj.id].history[lastIndex][1]; // get the value, the second item in the tupple

				// some hackery to handle graphing for 'events'
				// this might go away once NSC handles the events in a better way
				if (obj.id == "correct_trial" || obj.id == "incorrect_trial" || obj.id == "trial_start" || obj.id == "player_left_click" || obj.id == "player_right_click" 
					|| obj.id == "reward_issued" || obj.id == "teleport" || obj.id == "level_restart")
				{
					idMap[obj.id].history.push( [tmp.time,0]);
					idMap[obj.id].history.push( [tmp.time,1]);
					idMap[obj.id].history.push( [tmp.time,0]);
				}
				else if (Math.abs(prev - obj.value) >= 1)    // if it is not an event, only record a 'significant' change
					idMap[obj.id].history.push( [tmp.time,tmp.value]);
					
				while (idMap[obj.id].history.length >= totalPoints) // ensure our history is not greater than 'totalPoints'
				{
					idMap[obj.id].history.shift();
				}
			}
			idMap[obj.id].val = tmp;
		}
	}
}

function getBaseURL () {
   return location.protocol + "//" + location.hostname + 
      (location.port && ":" + location.port) + "/";
}
// streamed data from server
var url = getBaseURL();
var socket = io.connect(url);
	socket.on('nsc', function (data) {
		if (consoleActive)
		{
		    process(data);
		    present(data);		
		}
});

socket.on('trial_progress', function (data)
{
    if (consoleActive)
    {
	trial_active = data.trial_active;
	if (data.trial_active)
        {
	    setTrialTimer(data.trial_time);
	}
    }
});

// message from server indicating a connection with the VR
socket.on('connection', function (data) {
   $("#connection").html(data.connected? "Connected" : "Disconnected");
});

var trial_timer = null;
var trial_active = false;
var trial_time = null;  //ms to go
var trial_timer_interval = 1000;

function setTrialTimer(ms)
{
    trial_time = ms;
    if (trial_timer == null)
    {
	trial_timer = setTimeout(trialTimer, trial_timer_interval);
    }
    displayTrialProgress();
}

function trialTimer()
{

    trial_time -= trial_timer_interval;
    if (trial_time < 0)
	trial_time = 0;
    if (trial_active)
    {
	trial_timer = setTimeout(trialTimer, trial_timer_interval);
    }    
    else
    {
	clearTimeout(trial_timer);
	trial_timer = null;
    }
    displayTrialProgress();
}

function displayTrialProgress()
{

    var minutes =  Math.floor(trial_time/(60*1000));
    var seconds = Math.floor((trial_time % (60*1000)/1000));
    //minutes = minutes.toFixed(2);
    secondsStr = seconds.toString();
    if (secondsStr.length == 1)
	secondsStr = '0' + secondsStr;
    $("#trial_time").html(minutes.toString() + ":" + secondsStr);
    $("#trial_active").html("Trial in progress: " + trial_active.toString());
    if (!trial_active)
	$("#trial_time").html("0:00");
}

