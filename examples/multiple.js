function NDT_on_pageload() {

	var width = 500, 
		height = 500,
		twoPi = 2 * Math.PI;

	window.NDT = {
					'object': undefined,
					'meter': undefined,
					'arc': undefined,
					'state': undefined,
					'time_switched': undefined,
					'callbacks': {
										'onchange': NDT_on_change, 
										'oncompletion': NDT_on_completion, 
										'onerror': NDT_on_error,
										'onready':  NDT_initialize_application
									}
				 }
	window.NDT['object'] = new NDTjs({ 
							swf_url: '../ndt.swf',
							debug: true,
							onready: window.NDT['callbacks']['onready']
						});
	
	var svg = d3.select("body").append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	window.NDT['arc'] = d3.svg.arc()
					      .startAngle(0)
					      .endAngle(0)
					      .innerRadius(150)
					      .outerRadius(180);
	window.NDT['meter'] = svg.append("g")
							 .attr("id", "progress-meter");
	window.NDT['meter'].append("path").attr("class", "background").attr("d", window.NDT['arc'].endAngle(twoPi));
	window.NDT['meter'].append("path").attr("class", "foreground");
	window.NDT['meter'].append("text")
						.attr("text-anchor", "middle")
						.attr("dy", "0em")
						.attr("class", "information")
						.text("Loading Flash Elements...");
    
    
    var table = d3.select("#measurements").append("table");
    table.append("thead");
    table.append("tbody");
    
    d3.select("#measurements thead").append("tr")
        .selectAll("th")
        .data(['Time', 'Host', 'Download', 'Upload', 'MinRTT'])
        .enter()
        .append("th")
        .text(function(column) { return column; });
}
function NDT_initialize_application() {
	if (window.NDT['object'].current_mlab == undefined) {
		server_name = window.NDT['object'].get_host();
	}
	
	NDT_reset_meter();
	d3.select('text.status').text('Start Test');	
	d3.select('text.information').text(window.NDT['object'].current_mlab.city + ', ' + window.NDT['object'].current_mlab.country + ' (' + window.NDT['object'].current_mlab.site + ')');
	
	window.NDT['meter'].on("click", NDT_on_click);
	
	d3.selectAll("#progress-meter text").classed("ready", true)
	d3.selectAll("#progress-meter .foreground").classed("complete", false)
	d3.selectAll("#progress-meter").classed("progress-error", false)
}
function NDT_on_click() {
	window.NDT['object'].start_test(window.NDT['callbacks']);
}
function NDT_reset_meter() {
	d3.selectAll('#progress-meter text').remove();
	
	window.NDT['meter'].append("text")
						.attr("text-anchor", "middle")
						.attr("dy", "0em")
						.attr("class", "status");
	window.NDT['meter'].append("text")
						.attr("text-anchor", "middle")
						.attr("dy", "1.55em")
						.attr("class", "information")

	d3.select('#progress-meter').classed('progress-complete', false);
	d3.selectAll("#progress-meter text").classed("ready", true)
}

function NDT_on_change(returned_message) {
		var ndt_status_labels = {
									'notStarted': 'Preparing',
									'allTestsCompleted': 'Complete',
                                    'preparingInboundTest': 'Preparing Download',
                                    'preparingOutboundTest': 'Preparing Upload',
                                    'runningInboundTest': 'Measuring Download',
                                    'runningOutboundTest': 'Measuring Upload',
									'finishedInboundTest': 'Finished Download',
									'finishedOutboundTest': 'Finished Upload',
									'sendingMetaInformation': 'Sending to M-Lab...',
                                    'submittedMetaInformation': 'Measurement Sent!',
								}
		window.NDT['state'] = returned_message;
		window.NDT['time_switched'] = new Date().getTime();
		
		d3.select('text.status').text(ndt_status_labels[returned_message])
		d3.timer(NDT_on_progress);		
}
function NDT_on_progress() {
	var origin = 0,
		progress = 0,
		twoPi = 2 * Math.PI,
		current_message = window.NDT['state'],
		time_in_progress = new Date().getTime() - window.NDT['time_switched'];
	
	if (current_message == "runningInboundTest" || current_message == "runningOutboundTest") {
	
		if ((current_message == "runningOutboundTest" && window.NDT['object'].get_result('upload') != '0') || (current_message == "runningInboundTest" && window.NDT['object'].get_result('download') != '0')) {
			progress = twoPi * (time_in_progress/10000);
		}
		else {
			window.NDT['time_switched'] = new Date().getTime();
			progress = 0;
		}
		
		if (current_message == "runningOutboundTest") {
			progress = twoPi + -1 * progress					
			end_angle = window.NDT['arc'].endAngle(twoPi);
			start_angle = window.NDT['arc'].startAngle(progress);
		}
		else {
			end_angle = window.NDT['arc'].endAngle(progress);
			start_angle = window.NDT['arc'].startAngle(origin);
		}
	} 
	else if (current_message == "allTestsCompleted") {
			end_angle = window.NDT['arc'].endAngle(twoPi);
			start_angle = window.NDT['arc'].startAngle(origin);
	}
	else {
		end_angle = window.NDT['arc'].endAngle(origin);
		start_angle = window.NDT['arc'].startAngle(origin);	
	}
	d3.select('.foreground').attr("d", end_angle);
	d3.select('.foreground').attr("d", start_angle);
	
	if (current_message == 'allTestsCompleted') {
		return true;
	}
	
	return false;	
}
function NDT_on_completion() {
	var result_string,
		dy_offset = 1.55,
		results_of_interest = ['download', 'upload', 'MinRTT'];
	
    time_now_string = new Date().toString();
    
    new_row_data = [ time_now_string, window.NDT['object'].get_host()]

	results_of_interest.forEach(function(element, iteration) {
		result_string = Number(window.NDT['object'].get_result(element)).toFixed(2)
		if (element != 'MinRTT') {
			result_string += ' Mbps';
		}
		else {
			result_string += ' ms';
		}
		dy_current = dy_offset * (iteration + 1);
		window.NDT['meter'].append("text")
			.attr("class", "result_value")
			.attr("text-anchor", "left")
			.attr("dy", dy_current + "em")
			.attr("dx", ".5em")
			.attr('width', '400px')
			.text(result_string)
        
        new_row_data.push(result_string)

		window.NDT['meter'].append("text")
			.attr("class", "result_label")
			.attr("text-anchor", "right")
			.attr("dy", dy_current + "em")
			.attr("dx", "-5em")
			.attr('width', '400px')
			.text(element)
	});
	d3.selectAll("#progress-meter .foreground").classed("complete", true);
	d3.selectAll("#progress-meter text.status").attr("dy", "-50px");
	d3.selectAll("#progress-meter text.information").attr("dy", "-20px");
    
    new_row = d3.select("#measurements tbody").append("tr")
    new_row.selectAll("td")
                .data(new_row_data)
                .enter()
                .append("td")
                .text(function(d) { return d; })

    NDT_reset_meter();
    d3.select('text.status').text('Restarting Test');
	d3.select('text.information').text(window.NDT['object'].current_mlab.city + ', ' + window.NDT['object'].current_mlab.country + ' (' + window.NDT['object'].current_mlab.site + ')');
    d3.selectAll("#progress-meter .foreground").classed("complete", false);
    
	window.NDT['object'].start_test(window.NDT['callbacks']);

}
function NDT_on_error(error_message) {
	d3.timer.flush();
	d3.selectAll("#progress-meter").classed("progress-error", true)
	d3.select('text.status').text('Error!');
	d3.select('text.information').text(error_message.substring(0,60));
}
