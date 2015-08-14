/**************************************\
                Config
\**************************************/
var APP_ID = 'amzn1.echo-sdk-ams.app.xxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'; //replace with your amazon app ID
var appToken = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'; //replace with your LIFX app token
var dimString = ["dim", "lower", "decrease"]; //strings to dim the lights as setup in the utterances
var brightString = ["bright", "brighten", "increase", "raise"]; //strings to brighten the lights as setup in the utterances
var enableFeedback = true; //whether or not you want Alexa to tell you she changed the lights


/**************************************\
                Globals
\**************************************/
var https = require('https');
var querystring = require('querystring');
var brightness = 0.00;
var brightShift = false;
var AlexaSkill = require('./AlexaSkill');
var urlPrefix = '/v1beta1/lights/all';
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
    var intentName = intent.name.toLowerCase();
    var url = "";
    var methodType = "";
    var bodyString = "";
    var speechOutput = "An error has occured.";

    switch (currentIntent) {

        case intentEnum.BRIGHTNESS:
            {
                url = urlPrefix + '/color';
                methodType = 'PUT';
                var brightnessSlot = intent.slots.Brightness;
                var adjustmentSlot = intent.slots.Adjustment;
                var brightnessValue = 0.5;

                if (brightnessSlot && brightnessSlot.value) { //if utterance contains a specified value
                    brightnessValue = brightnessSlot.value / 100.0;
                    speechOutput = "I have set the brightness to " + (brightnessValue * 100) + " percent.";
                }
                if (adjustmentSlot && adjustmentSlot.value) { //if utterance contains a dim/brighten request
                    brightShift = true;
                    parseBrightness(intent, response); //gets current brightness to dim/brighten with a shift
                }
                bodyString = JSON.stringify({
                    "color": "brightness:" + brightnessValue
                });
                break;
            }
        case intentEnum.POWER:
            {
                var powerSlot = intent.slots.State
                if (powerSlot && powerSlot.value) { //if utterance contains an on/off request
                    url = urlPrefix + '/power';
                    methodType = 'PUT';
                    var state = powerSlot.value.toLowerCase();
                    bodyString = JSON.stringify({
                        "state": state
                    });
                    speechOutput = "I have turned the lights " + state + ".";
                } else { //if no specific request, toggle the lights
                    url = urlPrefix + '/toggle';
                    methodType = 'POST';
                    bodyString = JSON.stringify({});
                    speechOutput = "I have toggled the lights.";
                }
                break;
            }
        case intentEnum.COLOR:
            {
                url = urlPrefix + '/color';
                methodType = 'PUT';
                var color = intent.slots.Color.value.toLowerCase();
                bodyString = JSON.stringify({
                    "color": color
                });
                speechOutput = "I have set color of the lights to " + color + ".";
                break;
            }
        case intentEnum.SCENE: //unimplemented
            {
                methodType = 'PUT';
                break;
            }
        default:
            {
                speechOutput = "That was not a valid command, please try again.";
            }
    }
    if (!brightShift) { //no dim/brighten shift requested
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

function parseBrightness(intent, response) {
    var post_options = {
        host: 'api.lifx.com',
        port: '443',
        path: '/v1beta1/lights/all',
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
            var url = urlPrefix + '/color';
            var methodType = 'PUT';
            var adjustmentSlot = intent.slots.Adjustment;
            var brightnessValue = 0.5;
            if (dimString.indexOf(adjustmentSlot.value.toLowerCase()) > -1) { //if dim command recognized
                if (bright >= 0.1) { //lower the brightness by 10%
                    brightnessValue = bright - 0.1;
                    speechOutput = "I have lowered the brightness by ten percent.";
                } else { //brightness too low, setting to 1%
                    brightnessValue = 0.01;
                    speechOutput = "I have set the brightness to one percent.";
                }
            }
            if (brightString.indexOf(adjustmentSlot.value.toLowerCase()) > -1) { //if brighten command recognized
                if (bright <= 1.0) { //raise brightness by 10%
                    brightnessValue = bright + 0.1;
                    speechOutput = "I have raised the brightness by ten percent.";
                } else { //brightness too high, setting to 100%
                    brightnessValue = 1.0;
                    speechOutput = "I have set the brightness to one hundred percent.";
                }

            }
            bodyString = JSON.stringify({
                "color": "brightness:" + brightnessValue
            });
            sendRequest(url, methodType, bodyString, speechOutput, response); //send generated request to LIFX server
        });
    });

    req.on('error', function(err) {});

    req.end();

}

// Create the handler that responds to the Alexa Request.
exports.handler = function(event, context) {
    // Create an instance of the LIFX Skill.
    var skill = new LIFX();
    skill.execute(event, context);
};