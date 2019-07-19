const API_AI_TOKEN = '48d2fb11df574838ba7f9f25fcb75a0b';
const apiAiClient = require('apiai')(API_AI_TOKEN);

const FACEBOOK_ACCESS_TOKEN = 'EAAJ50L2SyPABAGtyurUNi4qz1uOQ5yyUnEYgl3BXvUBRzR0c28PUQoNwmZCZB0WezvONFCInvYtFMbZCdzmTTHZB4FzG4BccmznGVcu4pXL8XJtL1yj3wRxBc44rDuInbVeQio1bTfBrQH3uamJRVVLe2G9Sf5Op6aaeZBvzLwwZDZD';
const request = require('request');

const sendTextMessage = (senderId, text) => {
 request({
 url: 'https://graph.facebook.com/v2.6/me/messages',
 qs: { access_token: FACEBOOK_ACCESS_TOKEN },
 method: 'POST',
 json: {
 recipient: { id: senderId },
 message: { text },
 }
 });
};

module.exports = (event) => {
 const senderId = event.sender.id;
 const message = event.message.text;
 
 const apiaiSession = apiAiClient.textRequest(message, {sessionId: 'crowdbotics_bot'});apiaiSession.on('response', (response) => {
 const result = response.result.fulfillment.speech;
 
 sendTextMessage(senderId, result);
 });
 
 apiaiSession.on('error', error => console.log(error));
 apiaiSession.end();
};