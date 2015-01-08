/**
 * NDTjs - a JavaScript library for Flash-based NDT Tests
 * 
 * https://github.com/collina/ndt_js
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/* globals NDTjs */

"use strict"; // http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/

if (typeof NDTjs === 'undefined') {

	var NDTjs = function(config) {
		this.current_mlab = this.mlab_find_server();
		this.build_config(config);
		this.client = this.build_client();
		this.check_loaded();
	}

}
NDTjs.prototype = {
	version: "151",
	config: null,
	client: null,
	ready: false,
	semaphore: false,
	current_state: undefined,
	mlab_ns_url: 'https://mlab-ns.appspot.com/ndt',
	current_mlab: undefined,
	/**
	 * build_config - Set NDT object's variables. 
	 * 
	 * @param {Object} Configuration of client
	 * @private
	 */
	build_config: function(config) {
        config = config || {};
        var defaults = {
            swf_url: 'ndt.swf',
            namespace: 'ndtjs',
            path: null,
            debug: false,
            timeout: 10, // number of seconds to wait before concluding there was an error
            onready: null,
            onerror: null
        };
        var key;
        for (key in defaults) {
            if (defaults.hasOwnProperty(key)) {
                if (!config.hasOwnProperty(key)) {
                    config[key] = defaults[key];
                }
            }
        }        
        this.config = config;	
        return true;
	},
	/**
	 * build_client 
	 * 
	 * Build the HTML and append NDT flash client to DOM body.
	 * 
	 * @return {DOM Object} Client's DOM object.
	 * @private
	 */
	build_client: function() {
        function id(name) {
            return "NDTjs_" + name ;
        }
        function div(visible) {
            var d = document.createElement('div');
            document.body.appendChild(d);
            d.id = id("div");
            if (!visible) {
                // setting display:none causes the .swf to not render at all
                d.style.position = "relative";
                d.style.position = "absolute";
                d.style.top = "-2000px";
                d.style.left = "-2000px";
                d.style.height = '1px';
                d.style.width = '1px';
            }
            return d;
        }
        // the callback functions that javascript provides to flash must be globally accessible

        var swfContainer = div(false);
        var swfName = id(this.config.namespace);
        
		/*
			Initially used SwfStore code, but ran into issues with IE; temporary 
			revert to original include, but leaving absent code here for the time being:
			
			var flashvars = "namespace=" + this.config.namespace + "&amp;" +
            (this.config.path ? "LSOPath=" + this.config.path + '&amp;' : '') +
            "LSOName=" + this.config.namespace;
             '	<param value="' + this.config.swf_url + '" name="movie">' +
             '	<param value="' + flashvars + '" name="FlashVars">' +
             '	<param value="always" name="allowScriptAccess">' +
		*/
		swfContainer.innerHTML ='<object width="483" height="387" id="' + swfName + 
			'" data="' + this.config.swf_url + '" type="application/x-shockwave-flash">' +
			'<param name="FlashVars" value="BadRuntimeAction=warn-limit">';
        return document[swfName] || window[swfName];
	},
	/**
	 * status 
	 * 
	 * Simple abstracted layer to retrieve M-Lab test state, see documentation for
	 * diversity of possible results and their meaning.
	 * 
	 * @return {string} NDT test status 
	 */
	status: function(){
		if (this.ready === true && typeof this.client.get_status === 'function') {
			return this.client.get_status();
		}
		return false;
	},
	/**
	 * start_test
	 * 
	 * Attempt to run the Flash client's NDT test and then monitor its results
	 * as through the `status` function. Triggers the callbacks when encountered.
	 * Structure: {'onchange': function, 'oncompletion': function, 'onerror': function};
	 * 
	 * @param {Object} JSON Structure of callbacks
	 * @return {bool} Javascript attempted to trigger test.
	 */
	start_test: function(callbacks) {
		callbacks = callbacks || {'onchange': undefined, 'oncompletion': undefined, 'onerror': undefined};
		
		if (this.ready === true && typeof this.client.run_test === 'function' && this.semaphore === false) {
			this.semaphore = true;
			this.interval_id = undefined;
			
            this.set_host(this.current_mlab.fqdn);
			this.client.run_test();
			this.test_running = false;
			
			this.interval_id = setInterval(
								(function(self) { 
									 return function() { 
									 	var reported_state = self.status(),
									 		error_message = self.client.get_errmsg();
									 	
										if (self.current_state != reported_state) {
											if (callbacks['onchange'] !== undefined) {
													console.log(reported_state);
													callbacks['onchange'](reported_state);
											}
											// NDT Can Take A While To Reset
											if (reported_state != 'allTestsCompleted') {
												self.test_running = true;
											}
											self.current_state = reported_state;
										}
										if (reported_state == 'allTestsCompleted' && self.semaphore == true && self.test_running == true) {			
											self.semaphore = false;
											self.interval_id = clearInterval(self.interval_id);
											
											if (callbacks['oncompletion'] !== undefined) {
												callbacks['oncompletion']();
											}
											return true;
										}

										if ( !(error_message == 'Test in progress.' || error_message == 'All tests completed OK.' || error_message == 'Test not run.') ) {
											if (callbacks['onerror'] !== undefined) {
												callbacks['onerror'](error_message);
											}
										}
									 }
									})(this),
									100
								);
			return true;
		}
		return false;
	},
	/**
	 * check_loaded - Is the NDT flash client properly loaded?
	 * 
	 * Will fire off a recurrent function to check to the availability of the 
	 * flash object, then attempts runs a callback function if provided to the 
	 * NDT object's constructor
	 * 
	 * @private
	 */
	check_loaded: function() {
		 this.interval_id = setInterval(
			 (function(self) {
				 return function() {
					if (typeof self.client != 'undefined' && typeof self.client.get_status === 'function') {			
						clearInterval(self.interval_id);
						self.ready = true;
						if (typeof self.config.onready === 'function') {
							self.config.onready();
						}
					}
				 }
			 })(this),
			 100
		 );
	},
	/**
	 * get_host - Simple abstracted layer to retrieve M-Lab site selected for test.
	 * 
	 * @return {string} FQDN of Measurement Lab server 
	 */
	get_host: function() {
		if (this.ready === true) {
			return this.client.get_host();
		}
		return false;
	},
	/**
	 * set_host - Simple abstracted layer to retrieve M-Lab site selected for test.
	 *
	 * @param {string} FQDN of Measurement Lab server
	 */
    set_host: function(hostname) {
        if (this.ready === true) {
            return this.client.set_host(hostname);
        }
        return false;
    },
	/**
	 * get_results
	 * 
	 * Provides a layer of abstraction between the flash client and JS functionalities.
	 * The flash client makes web100 variables available through this method, as well as
	 * processed results. We offer both and include shortcuts for core measurements.
	 * 
	 * @param {string} type of result to retrieve from the NDT client
	 * @return {string} result of the NDT test, otherwise returns false.
	 */
	get_result: function(result_name) {
		if (this.ready == true && result_name) {
		
			if (result_name == 'download') {
				return this.get_result('ServerToClientSpeed');
			} 
			if (result_name == 'upload') {
				return this.get_result('ClientToServerSpeed');
			} 
			if (result_name == 'rtt') {
				return this.get_result('MinRTT')
			} 
			else {
				return this.client.getNDTvar(result_name);
			}
		}		
		else {
			return false;
		}		
	},
  	ndt_get_var: function(ndt_var) {
		return this.client.getNDTvar(ndt_var);
	},
	/**
	 * mlab_find_server
	 * 
	 * Performs a synchronous AJAX request to M-Lab NS in order to determine the
	 * closest Measurement Lab server.
	 * 
	 * @param {none} 
	 * @return {Object} JSON of the M-Lab server information: (city, url, ip, site, fqdn)
	 */
	mlab_find_server: function() {
		var request;

		if (window.XMLHttpRequest) {
			request = new XMLHttpRequest();
		} else if (window.ActiveXObject) { // IE 8 and older
			request = new ActiveXObject("Microsoft.XMLHTTP");
		}

		request.open('GET', this.mlab_ns_url, false);
		request.send(null);
				
		if (request.status === 200) {
			try {
				this.current_mlab = JSON.parse(request.responseText);
				return this.current_mlab;
			} catch (e) {
				console.error("Could not parse response: " + e.toString());
			}
		}
		else {
			console.error("While retrieving server list encounter HTTP Error Code " + request.status);
		}
		
		return false;				
	}
}

/**
 * Global functions
 */
// Append any error messages from Flash to the document as HTML comments
function appendErrors(msg) {
	var body = document.getElementsByTagName('body')[0];
	var err_msg = document.createComment('\nERROR: ' + msg);
	body.appendChild(err_msg);
}

// Append any debug messages from Flash to the document as HTML comments
function appendDebugOutput(msg) {
	if ( window.NDT.object.config.debug !== true ) {
		return;
	}
	var debug = document.getElementById('details');
	var err_msg = document.createElement('div');
	err_msg.innerHTML = '&raquo; ' + msg;
	debug.appendChild(err_msg);
}

// A callback for Flash when the environment is "warn-limit". "warn-limit"
// means that in addition to providing the user with a warning about their
// Flash runtime not being suitable to run the NDT Flash client, it will direct
// them to an M-Lab test server instead of a production node.
function getFallbackNDTServer() {
	var test_nodes = [
		'ndt.iupui.mlab1.nuq0t.measurement-lab.org',
		'ndt.iupui.mlab2.nuq0t.measurement-lab.org',
		'ndt.iupui.mlab4.nuq0t.measurement-lab.org',
	];
	var test_node = test_nodes[Math.floor(Math.random() * test_nodes.length)];
	d3.select('text.information').text('Mountain View_CA, US (nuq0t)');
	return test_node;
}
