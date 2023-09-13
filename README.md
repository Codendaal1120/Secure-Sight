[![Node.js CI](https://github.com/Codendaal1120/Secure-Sight-development/actions/workflows/main.yml/badge.svg?branch=develop)](https://github.com/Codendaal1120/Secure-Sight-development/actions/workflows/main.yml)
# Secure Sight
Security system for managing surveillance cameras that can detect movement, identify humans and send an alert based on the captured information.
*This is a hobby project and not intended for commercial use. It will probably not be updated.* 

The system supports any camera with an RTSP stream and works by processing the stream with FFMPEG. Frames are analyzed using tensor flow (COCO-SSD) to identify humans. Once a detection has been made the clip is saved.

## Global config
The main configuration is stored in the MongoDB, in the **config** collection and has the following options:
- **cameraBufferSeconds**: The amount of seconds to buffer, this also affects the maximum recording time.
- **removeTempFiles**: *indicate if files created temporarily should be deleted*
- **event.silenceSeconds**: *after an event has been finished new detections will be silenced for period of time*
- **event.limitSeconds**:  *the number of seconds an event can last, after this time has passed the event will automatically be finished and saved*
- **event.idleEndSeconds**: *the number of seconds to wait before finishing and aggregating an event, if new detection occur before this time, the event will continue*
- **notifications.email.providerApiKey**: *the SendGrid API Key. See [Sendgrid](https://docs.sendgrid.com/ui/account-and-settings/api-keys) for more information*
- **notifications.email.sender**: *the sender email address, it has to be configured as a sender in SendGrid, see [sender-authentication](https://docs.sendgrid.com/glossary/sender-authentication) for more information*
- **notifications.email.recipient**: *the recipient email address where the alerts will be sent for each camera*

The event config has some hidden config in the database which is not exposed on the UI as it relates to the imprinting of the detections as an overlay on the recording. This feature does not work. I found that I could not accurately determine the timestamp of the stream when the data is received, this fluctuates, often with 2-4 seconds. Since I use different streams for the detections and the recording, this makes it hard to sync between the two.

- **event.printPredictions**:  *enable the imprinting function*
- **event.frameTimeOffset**: *the amount of time in ms to add/remove from the timestamp of the stream chunk*
- **event.gifDelayOffset**:  *the amount of time in ms to add/remove to the start of the gif*
- **event.detectionOffset**:  *the amount of time in ms to add/remove to the detection*

## Camera config
Camera configs are stored in the MongoDB, in the **cameras** collection.
Each camera has an array of schedules which dictate when the camera should be performing video analysis should be performed.