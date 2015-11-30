# LIFX-Alexa-Skill
An Alexa Skill created for the Amazon Echo that allows you to control your LIFX Lightbulbs

I saw a demo that [patsch] (http://j.mp/alexalifx) had created, but his way was unreleased (to the best of my knowledge.) So I decided to create my own. This is based off of the Alexa Skills kit examples that Amazon had released for JavaScript development. In order for this to work you need to simply replace the APP_ID in index.js with your own Amazon APP ID. Which you can get from the Application Id in your developer console. You also need to replace appToken in index.js with your own Token from [LIFX Cloud] (https://cloud.lifx.com). You can then go to settings and generate a Token specifically for this Alexa Skill, enabling my Skill to control your lights.

In addition to those two configurables, there are 3 other editable variables.
dimString: An array containing a list of strings associated with your "light dimming" utterance, you can add or subtract as many of these as you want, just keep at least one.
brightString: An array containing a list of strings associated with your "light brightening" utterance, you can add or subtract as many of these as you want, just keep at least one.
enableFeedback: A boolean that toggles whether or not Alexa will give you verbal feedback of your request.

To use my Skill, you can either host your own server, or use Amazon's Lambda server (which is what I do). Just create a new Alexa Skill and configure it to what you want. For my invocation name, I use "life ex." It works fairly well. Just copy and paste the IntentSchema and SampleUtterances into their respective field, then upload the index.js and AlexaSkill.js files to your preferred server.

# Update:
I've included the ability to utilize Scenes. The LIFX api requires the use of the scene's uuid in order to activate that particular scene. That's way to much to verbalize. Similar to the way I do the brightness shifting (dim,brighten) I added something to query your existing scenes and activate the scene that has the matching verbal utterance. 

I've also added selectors. Follow the utterances to use them. You can easily scale it to add more, if you wish. Just speak the name of the light (as you have it set in the LIFX App) and you can then control that light. 

One final adjustment. I'm now using both updated APIs/SDKs. You're going to have to add CustomSlots in order to use the new version. You can add them in the same location that you add your Utterances and IntentSchema (speaking of which, those are also updated. You should change those as well). Just follow my guidelines that I used. For lights, the names listed are the label that you have set the lights to in the LIFX App. Same goes for the scenes. Do not use two word scene names. I've noticed that sometimes Amazon adds hyphens to the name and it's just a bit more work to handle unexpected characters, so keep it simple. 

#Group Selectors:
I've added a way to utilize groups. In order to keep things simple, to add a group, all you need to do is add it to the LIST_OF_LIGHTS custom slot and then add it to the groupString[] defined in index.js

Additionally, you can now control up to 3 individual lights/groups, using any number of combination. For instance, "Alexa, tell Lifx to turn Fan {group}, Desk{Light} and Dresser{Light} off."
