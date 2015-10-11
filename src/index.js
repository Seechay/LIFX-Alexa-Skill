/**************************************\
                Config
\**************************************/
var APP_ID = 'amzn1.echo-sdk-ams.app.xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'; //replace with your amazon app ID
var appToken = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; //replace with your LIFX app token
var dimString = ["dim", "lower", "decrease", "down"]; //strings to dim the lights as setup in the utterances
var brightString = ["bright", "brighten", "increase", "raise", "up"]; //strings to brighten the lights as setup in the utterances
var enableFeedback = true; //whether or not you want Alexa to tell you she changed the lights


/**************************************\
                Globals
\**************************************/
var https = require('https');
var querystring = require('querystring');
var brightness = 0.00;
var addProcess = false;
var AlexaSkill = require('./AlexaSkill');
var urlPrefix = '/v1/lights/';
var intentEnum = {
    BRIGHTNESS: 0,
    POWER: 1,
    COLOR: 2,
    SCENE: 3
};
var currentIntent = intentEnum.BRIGHTNESS;


/**
 * LIFX is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var LIFX = function() {
    AlexaSkill.call(this, APP_ID);
};
// Extend AlexaSkill
LIFX.prototype = Object.create(AlexaSkill.prototype);
LIFX.prototype.constructor = LIFX;
LIFX.prototype.eventHandlers.onSessionStarted = function(sessionStartedRequest, session) {
    console.log("LIFX onSessionStarted requestId: " + sessionStartedRequest.requestId + ", sessionId: " + session.sessionId);
    // any session init logic would go here
};
LIFX.prototype.eventHandlers.onLaunch = function(launchRequest, session, response) {
    console.log("LIFX onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    var launchText = "How would you like to control your lights?";
    response.ask(launchText);
};
LIFX.prototype.eventHandlers.onSessionEnded = function(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId + ", sessionId: " + session.sessionId);
    // any session cleanup logic would go here
};
LIFX.prototype.intentHandlers = {
    AdjustBrightness: function(intent, session, response) {
        currentIntent = intentEnum.BRIGHTNESS;
        generateRequest(intent, session, response);
    },
    AdjustPower: function(intent, session, response) {
        currentIntent = intentEnum.POWER;
        generateRequest(intent, session, response);
    },
    AdjustColor: function(intent, session, response) {
        currentIntent = intentEnum.COLOR;
        generateRequest(intent, session, response);
    },
    AdjustScene: function(intent, session, response) {
        currentIntent = intentEnum.SCENE;
        generateRequest(intent, session, response);
    }
};
//Prepares the request to be sent to the LIFX server
function generateRequest(intent, session, response) {
    var intentName = String(intent.name).toLowerCase();
    var url = "";
	var selector = "/";
    var methodType = "";
    var bodyString = "";
    var speechOutput = "An error has occured.";
	var selectorFirstSlot = intent.slots.SelectorFirst;
	var selectorSecondSlot = intent.slots.SelectorSecond;
	var numSelectors = 0;
	if (selectorFirstSlot && selectorFirstSlot.value)
	{
		numSelectors = 1;
		selector = selector + 'label:' + selectorFirstSlot.value.capitalize();
		if (selectorSecondSlot && selectorSecondSlot.value)
		{
			selector = selector + ',label:' + selectorSecondSlot.value.capitalize();
			numSelectors = 2;
		}
	}
	else
	{
		selector = selector + 'all';
	}
	console.log("Selector: " + selector);
    switch (currentIntent) {

        case intentEnum.BRIGHTNESS:
            {
                url = urlPrefix + selector + '/state';
                methodType = 'PUT';
                var brightnessSlot = intent.slots.Brightness;
                var adjustmentSlot = intent.slots.Adjustment;
                var brightnessValue = 0.5;

                if (brightnessSlot && brightnessSlot.value) { //if utterance contains a specified value
                    brightnessValue = brightnessSlot.value / 100.0;
                    speechOutput = "I have set the brightness to " + (brightnessValue * 100) + " percent.";
                }
                if (adjustmentSlot && adjustmentSlot.value) { //if utterance contains a dim/brighten request
                    addProcess = true;
                    parseBrightness(intent, response, urlPrefix+selector); //gets current brightness to dim/brighten with a shift
                }
                bodyString = JSON.stringify({
                    "brightness": + brightnessValue
                });
                break;
            }
        case intentEnum.POWER:
            {
                var powerSlot = intent.slots.State
                if (powerSlot && powerSlot.value) { //if utterance contains an on/off request
                    url = urlPrefix + selector + '/state';
                    methodType = 'PUT';
                    var state = String(powerSlot.value).toLowerCase();
                    bodyString = JSON.stringify({
                        "power": state
                    });
					if(numSelectors == 1){
					speechOutput = "I have turned " + String(selectorFirstSlot.value) + " " + state + ".";
					}
					else if(numSelectors == 2){
					speechOutput = "I have turned " + String(selectorFirstSlot.value) + " and " + String(selectorSecondSlot.value) + " " + state + ".";
					}
					else{                    
					speechOutput = "I have turned the lights " + state + ".";
					}
					}
					else { //if no specific request, toggle the lights
                    url = urlPrefix + '/all' + '/toggle';
                    methodType = 'POST';
                    bodyString = JSON.stringify({});
                    speechOutput = "I have toggled the lights.";
                }
                break;
            }
        case intentEnum.COLOR:
            {
                url = urlPrefix + selector + '/state';
                methodType = 'PUT';
                var color = String(intent.slots.Color.value).toLowerCase();
                bodyString = JSON.stringify({
                    "color": color
                });
                speechOutput = "I have set color to " + color + ".";
                break;
            }
        case intentEnum.SCENE: 
            {
				addProcess = true;
				parseScenes(intent,response);
                break;
            }
        default:
            {
                speechOutput = "That was not a valid command, please try again.";
            }
    }
    if (!addProcess) { //no additional processing required (ie no brightness shift nor scene selection)
        sendRequest(url, methodType, bodyString, speechOutput, response); //send generated request to LIFX server
    }
}

function sendRequest(url, methodType, bodyString, speechOutput, response) {
    var post_options = {
        host: 'api.lifx.com',
        port: '443',
        path: url,
        method: methodType,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyString),
            Authorization: 'Bearer ' + appToken
        }
    };
    // Set up the request
    var post_req = https.request(post_options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            if (enableFeedback) response.tell(speechOutput);
        });
    });
    post_req.on('error', function(e) {});
    // post the data
    post_req.write(bodyString);
    post_req.end();
}

function parseBrightness(intent, response, url) {
    var post_options = {
        host: 'api.lifx.com',
        port: '443',
        path: url,
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + appToken
        }
    };
    var text = "";
    var req = https.request(post_options, function(res) {
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
            text += chunk;
        });

        res.on('end', function() {
            //text = text.substring(1,text.length-1);
            var obj = JSON.parse(text);
            var bright = obj[0].brightness;
            var newurl = url + '/state';
            var methodType = 'PUT';
            var adjustmentSlot = intent.slots.Adjustment;
            var brightnessValue = 0.5;
            if (dimString.indexOf(String(adjustmentSlot.value).toLowerCase()) > -1) { //if dim command recognized
                if (bright >= 0.1) { //lower the brightness by 10%
                    brightnessValue = bright - 0.1;
                    speechOutput = "I have lowered the brightness by ten percent.";
                } else { //brightness too low, setting to 1%
                    brightnessValue = 0.01;
                    speechOutput = "I have set the brightness to one percent.";
                }
            }
            if (brightString.indexOf(String(adjustmentSlot.value).toLowerCase()) > -1) { //if brighten command recognized
                if (bright <= 1.0) { //raise brightness by 10%
                    brightnessValue = bright + 0.1;
                    speechOutput = "I have raised the brightness by ten percent.";
                } else { //brightness too high, setting to 100%
                    brightnessValue = 1.0;
                    speechOutput = "I have set the brightness to one hundred percent.";
                }

            }
            bodyString = JSON.stringify({
                "brightness": + brightnessValue
            });
            sendRequest(newurl, methodType, bodyString, speechOutput, response); //send generated request to LIFX server
        });
    });

    req.on('error', function(err) {});

    req.end();

}

function parseScenes(intent, response) {
    var post_options = {
        host: 'api.lifx.com',
        port: '443',
        path: '/v1/scenes',
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + appToken
        }
    };
	var sceneName = String(intent.slots.Scene.value).toLowerCase();
    var text = "";
    var req = https.request(post_options, function(res) {
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
            text += chunk;
        });

        res.on('end', function() {
			console.log(sceneName);
            var obj = JSON.parse(text);
			var scene = obj[0].uuid;
			for(i = 0; i < Object.keys(obj).length;i++)
			{
				if(sceneName.indexOf(obj[i].name.toLowerCase()) > -1)
				{
					scene = obj[i].uuid;
					break;
				}
			}
            var url = '/v1/scenes/scene_id:' + scene + '/activate';
            var methodType = 'PUT';
            bodyString = JSON.stringify({            
            });
			speechOutput = "I have set the scene to " + sceneName + ".";
            sendRequest(url, methodType, bodyString, speechOutput, response); //send generated request to LIFX server
        });
    });

    req.on('error', function(err) {});

    req.end();

}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
// Create the handler that responds to the Alexa Request.
exports.handler = function(event, context) {
    // Create an instance of the LIFX Skill.
    var skill = new LIFX();
    skill.execute(event, context);
};