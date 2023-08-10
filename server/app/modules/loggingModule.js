const { createLogger, format, transports } = require('winston');
const loggers = {};
const fs = require("fs");

let currentLogFile;
if (!currentLogFile){
  currentLogFile = getDate() + '.log';
}

const fsFormat = format.combine(
  format.timestamp(),
  format.align(),
  format.printf(info => `${info.timestamp} : ${info.level} [${info.service}]${info.message}`)
);

const consoleFormat = format.combine(
  format.colorize(),
  format.timestamp(),
  format.align(),
  format.printf(info => `${info.timestamp} : ${info.level} [${info.service}]${info.message}`)
);

const options = {
  file: {
      level: 'info',
      filename: currentLogFile,
      handleExceptions: true,
      json: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      colorize: false,
      format : fsFormat
  },
  console: {
      level: 'debug',
      handleExceptions: true,
      json: false,
      colorize: true,
      format : consoleFormat
  },
};

/**
 * Get or create the logger for the service
 * @param {string} service - Service to fetch
 * @returns {Object} The logger
*/
function getLogger(service){

  if (!service){
    service = 'main';
  }

  if (loggers[service]){
    return loggers[service];
  }

  loggers[service] = createLogger({
    level: 'info',
    defaultMeta: { service: service },
    transports: [
      new transports.Console(options.console),
      new transports.File(options.file)
    ],
  });

  return loggers[service];
}

/**
 * Get the last n number of lines logged
 * @param {string} service - Service to fetch
 * @returns {Object} The logger
*/
function tryGetLogs(lines = 100) {    
  try{
    var logLines = [];
    var logContents = fs.readFileSync(currentLogFile, { encoding: 'utf8', flag: 'r' }).split('\n');
    for (let i = logContents.length - lines; i < logContents.length; i++) {
      if (logContents[i] && logContents[i].length > 0){
        logLines.push(logContents[i].replaceAll('\t', ' ').replaceAll('\r', ''));        
      }            
    }

    return { success : true, payload : logLines };
      
  }
  catch (err) {
      return { success : false, error : err.message };
  }
};

function getDate() {    
  var date = new Date(Date.now()).toLocaleString().split(',')[0]
  return date.replaceAll("/", '');
};

module.exports.getLogger = getLogger;
module.exports.tryGetLogs = tryGetLogs;