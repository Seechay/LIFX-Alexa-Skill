# LIFX-Alexa-Skill
An Alexa Skill created for the Amazon Echo that allows you to control your LIFX Lightbulbs

I saw a demo that [patsch] (http://j.mp/alexalifx) had created, but his way was unreleased (to the best of my knowledge.) So I decided to create my own. This is based off of the Alexa Skills kit examples that Amazon had released for JavaScript development. In order for this to work you need to simply replace the APP_ID in index.js with your own Amazon APP ID. Which you can get from the Application Id in your developer console. You also need to replace appToken in index.js with your own Token from [LIFX Cloud] (https://cloud.lifx.com). You can then go to settings and generate a Token specifically for this Alexa Skill, enabling my Skill to control your lights.

In addition to those two configurables, there are 3 other editable variables.
dimString: An array containing a list of strings associated with your "light dimming" utterance, you can add or subtract as many of these as you want, just keep at least one.
brightString: An array containing a list of strings associated with your "light brightening" utterance, you can add or subtract as many of these as you want, just keep at least one.
enableFeedback: A boolean that toggles whether or not Alexa will give you verbal feedback of your request.

Currently I do not have the Scene Intent setup, I'll get to that when I have more time.

To use my Skill, you can either host your own server, or use Amazon's Lambda server (which is what I do). Just create a new Alexa Skill and configure it to what you want. For my invocation name, I use "life ex." It works fairly well. Just copy and paste the IntentSchema and SampleUtterances into their respective field, then upload the index.js and AlexaSkill.js files to your preferred server.
