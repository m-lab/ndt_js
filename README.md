DEPRECATION NOTICE
------
Please note that this repository is maintained here only for the sake of
history, and is not supported by M-Lab.  While the name of this repository would
lead you to believe that is a javascript-based NDT implementation, it is
actually only a javascript wrapper around the now deprecated Flash client.  All
future Web implementations should probably be using the more current
[Websocket javascript client](https://github.com/ndt-project/ndt/blob/master/HTML5-frontend/ndt-browser-client.js).

Network Diagnostic Test Web Framework 
====================
NDT (Network Diagnostic Tool) is a client/server program that provides
network configuration and performance testing to end-users' desktop,
laptop, and mobile platforms. For more information about NDT, please see:

https://code.google.com/p/ndt/

Partners within the Measurement Lab consortium have developed an NDT
client for browser-based testing of network conditions. While the latest
tested client is available within this repository as 'ndt.swf', the
source is available at: 

https://code.google.com/p/ndt/source/browse/#svn%2Ftrunk%2Fflash-client

Getting Started
---------------------
Clone this repository somewhere into the webroot of your Web server, then
browse to that location.  A few example implementations are available in the
examples/ directory.  To try any of the examples, simply replace the index.html
file in the root of this repository with a copy of the index.html files in any
of the example directories.  By default, index.html is simply a symbolic link
to the _single_ example, which provides a basic SVG image that is updated as
the test is being run to give the status of the currently running test, and
results when the test is done.

Method 1: Javascript Interaction 
---------------------
-   **status**: Simple abstracted layer to retrieve M-Lab test state.
    -   params: `none`
    -   returns: `string` NDT test status 

-   **start_test**: Attempt to run the Flash client's NDT test and then monitor its results as through the `status` function. Triggers the callbacks when encountered. 
    -   params: `Object` JSON Structure of callbacks; Structure: {'onchange': function, 'oncompletion': function, 'onerror': function}
    -   returns: `bool` Javascript attempted to trigger test.

-   **get_host**: Simple abstracted layer to retrieve M-Lab site selected for test.
    -   params: `none`
    -   returns: `string` FQDN of Measurement Lab server

-   **set_host**: Simple abstracted layer to set the M-Lab site to be used for testing.
    -   params: `string` FQDN of Measurement Lab server
    -   returns: `string` FQDN of Measurement Lab server

-   **get_results**: Provides a layer of abstraction between the flash client and JS functionalities. The flash client makes web100 variables available through this method, as well as processed results. We offer both and include shortcuts for core measurements.
    -   params: `string`type of result to retrieve from the NDT client.
    -   returns: `string` result of the NDT test, otherwise returns false.

-   **mlab_find_server**: Performs a synchronous AJAX request to M-Lab NS in order to determine the closest Measurement Lab server.
    -   params: `none`
    -   returns: `Object` JSON of the M-Lab server information: (city, url, ip, site, fqdn)

-   **build_client** *private*: Build the HTML and append NDT flash client to DOM body.
    -   params: `none`
    -   returns: `DOM Object`  Client's DOM object.

-   **check_loaded** *private*: Is the NDT flash client properly loaded? Will fire off a recurrent function to check to the availability of the flash object, then attempts runs a callback function if provided to the NDT object's constructor.
    -   params: `none`
    -   returns: `none`

Method 2: Flash Interaction 
---------------------

Alternatively, the Flash application allows interaction with external
code through Javscript, which can be used to control the NDT test. The
included Javascript in an implementation that calls in one way and does
not currently utilize ExternalFunction.

### External Calls

Function that calls a JS function through the ExternalInterface class if
it exists by the name specified in the parameter.

-   **allTestsCompleted**: Called to indicate that the NDT test has completed successfully without error. 
    -   arguments: `none`
    -   expects: `none`

-   **fatalErrorOccured**: Called to indicate that the NDT test has encountered a fatal error.
    -   arguments: `none`
    -   expects: `none`

-   **testStarted**: Called when the NDT test has initiated a test. 
    -   arguments:
        -   `test_type` - The test or submission initiated by the NDT client (string), 'ClientToServerThroughput', 'ServerToClientThroughput', 'Meta'.
    -   expects: `none`

-   **testCompleted**: Called when the NDT test has completed a test. 
    -   arguments:
        -   `test_type` - The test or submission completed by the NDT client (string).
        -   `test_failed` - Whether an error was encountered during the test (bool).
    -   expects: `none`

-   **appendErrors**: Called when the NDT test has encountered an error. 
    -   arguments:
        -   `error_message` - NDT test error message (string).
    -   expects: `none`

-   **appendDebugOutput**: Called when the NDT test has triggered a debugging event. 
    -   arguments:
        -   `debug_message` - NDT test debug message (string).
    -   expects: `none`

-   **resultsProcessed**: Called to indicate that the NDT test has parsed the measurements and produced results.
    -   arguments: `none`
    -   expects: `none`

-   **getNDTServer**: Specifics the Measurement Lab server that should be used to test against
    -   arguments: `none`
    -   expects: `server_hostname` *required* - FQDN for Measurement Lab server (string).

-   **getClientApplication**: Sets the client name of the NDT application (default: swf)
    -   arguments: `none`
    -   expects: `client_name` *required* - Name of client application (string).

-   **getNDTDescription**: Sets the text description of NDT displayed within the flash application's interface.
    -   arguments: `none` 
    -   expects: `client_description` *required* - Text of message to display (string).


### Callbacks

Functions that can be called through the Flash instance from Javascript
to start tests and access data, including diagnostic information and
processed results.

-   **run_test**: Initiates the NDT Test Suite.
    -   params: `none`
    -   returns: `none`

-   **get_status**: Returns the status of the NDT Test application.
    -   params: `none`
    -   returns: `string`: Current state of test.

-   **getDebugOutput**: Returns the debug logs of the NDT Test application.
    -   params: `none`
    -   returns: `string`: Messages kept in the debug log.

-   **get_diagnosis**: Returns the results logs of the NDT Test application.
    -   params: `none`
    -   returns: `string`: Results for NDT test (long result).

-   **get_errmsg**: Returns the error status of the NDT Test application.
    -   params: `none`
    -   returns: `string`: State information for NDT test, will return information even if the test in not in a defective state, such as "All tests completed OK."

-   **get_host**: Returns the FQDN of the Measurement Lab selected for testing.
    -   params: `none`
    -   returns: `string`: FQDN of M-Lab server.

-   **get_PcBuffSpdLimit**: 
    -   params: `none`
    -   returns: `string`:

-   **getNDTvar**: Returns NDT test data, including processed measurement results
    -   params: 
        -   `varName` *required* - NDT variable name (string).
    -   returns: `string`: Test result.
