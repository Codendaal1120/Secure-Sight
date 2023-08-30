//const dataService = require("./dataService");
const logger = require('../modules/loggingModule').getLogger('notificationService');
const cache = require('../modules/cache');
const sgMail = require('@sendgrid/mail');
const eService = require('./eventsService');
const moment = require('moment');
const imgModule = require('../modules/imageModule');

let mailReady = false;


/** Setup service */
function setup(){	
	if (cache.config.notifications?.email?.providerApiKey){
		sgMail.setApiKey(cache.config.notifications.email.providerApiKey);
		mailReady = true;
	}
}

/**
 * Get all configured cameras from DB
 * @param {Object} _alert -Alert object
 * @return {Array} Cameras
 */
async function trySendAlert(_alert) {   

	if (!_alert){
		return { success : false, error : 'Invlaid alert specified' }; 
	}
		
    if (_alert.type == 'email'){
        return await sendEmailAltert(_alert);
    }

    return { success : false, error : `Unknown alert type :'${_alert.type}'` };    
};

/**
 * Send test notification to the UI 
 * @param {string} topic - Topic to broadcast to
 * @param {string} msg - MSG to send
 * @returns {object} - TryResult
 */
async function testUiMessage(topic, msg) {    
    try{        
        cache.services.ioSocket.sockets.emit(topic, msg);
        return { success : true };
    }
    catch (err) {
        return { success : false, error : err.message };
    }
};

async function sendEmailAltert(_alert){
	try{

		var tryGet = await eService.tryGetEvent(_alert.eventId);
		if (!tryGet.success){
			return tryGet;
		}

		var img = await imgModule.getImageDataFromFile('app/resources/logo.png');

		const msg = {
			to: _alert.recipient,
			from: cache.config.notifications.email.sender, 
			subject: `${tryGet.payload.cameraName} alert`,
			text: `Movement has was detected on ${moment(tryGet.payload.startedOn).local().format('LLL')}. To view this event click the following ${cache.config.uiAddress}/events?event=${tryGet.payload.id}`,
			html: generateEmailHtml(tryGet.payload, cache.config.uiAddress),
			attachments: [
				{
					filename: 'Secure-Sight.png',
					contentType: 'image/png',
					content_id: '1557',
					content: img.toBase64(),
					disposition: 'inline'
				}
			]
		};

		if (mailReady){
			await sgMail.send(msg);
			return { success : true }; 
		}
		
		return { success : false, error : !mailReady ? 'Mail service was not initialized' : 'Unknown error occured' }; 
		       
	}
	catch (error) {
		logger.log('error', error);
		return { success : false, error : error.message };
	}
    
}

function generateEmailHtml(_event, _uiUrl){
	return `<link rel="stylesheet" href="https://netdna.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.css">	
	<table style="width: 600px; border-collapse: collapse;">
			<tr>
					<th style="padding: 10px;">
						<img src="cid:1557" alt="Secure-Sight" />
					</th>
			</tr>
			<tr>
					<td style="height: 20px;"></td>
			</tr>
			<tr>       
					<td>Movement has was detected on <strong>${moment(_event.startedOn).local().format('LLL')}</strong>. To view this event click the following <a href="${_uiUrl}/events?event=${_event.id}">link</a>.</td>
			</tr>
			<tr>
					<td style="height: 20px;"></td>
			</tr>
			<tr>       
					<td>Regards</td>
			</tr>
			<tr>       
					<td>Secure-Sight</td>
			</tr>
	</table>`
}

module.exports.testUiMessage = testUiMessage;
module.exports.trySendAlert = trySendAlert;
module.exports.setup = setup;
