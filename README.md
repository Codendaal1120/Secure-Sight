[![Node.js CI](https://github.com/Codendaal1120/Secure-Sight-development/actions/workflows/main.yml/badge.svg?branch=develop)](https://github.com/Codendaal1120/Secure-Sight-development/actions/workflows/main.yml)

# Secure Sight
Security system for managing surveillance cameras. This is a hobby project and not intended for commercial use. It will probably not be updated

# Cameras
 - each camera uses about xMB memory
- app 100mb
 - eurfy - 200mb
 - tp - 10mb

# event ranges
- There is a problem with the timezone, I first check by day, but if the range is converted to utc and occurs on the previous day, the schedule will miss

# Event Config
The event config has some hidden config in the database which is not exposed on the UI as it relates to the imprinting of the detections as an overlay on the recording. This feature does not work. I found that I could not accurately determine the timestamp of the stream when the data is received, this fluctuates, often with 2-4 seconds. Since I use different streams for the detections and the recording, this makes it hard to sync between the two.
"printPredictions"
"frameTimeOffset" - the amount of time in ms to add/remove from the timestamp of the stream chunk
"gifDelayOffset" - the amount of time in ms to add/remove to the start of the gif
"detectionOffset" - the amount of time in ms to add/remove to the detection 


-- grayscale from 66 - 70