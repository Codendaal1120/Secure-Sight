/** TCP utility class */
const { createServer } = require('node:net');
const { once } = require('node:events');
const logger = require('../modules/loggingModule').getLogger('tcpModule');

/**
 * Creates a TCP server listening on the target port with a callback. Returns the port the server is listening on. 
 * @param {Number} _targetPort - Port to start listening on
 * @param {Function} _callback - _callback when server recieves data
 * @see https://nodejs.org/api/net.html#netcreateserveroptions-connectionlistener
 */
async function createLocalServer(_targetPort, _callback){
    const server = createServer(async (socket) => {
      server.close();
      try
      {
        _callback(socket);
      }catch(err){
        console.error(err.message);
      }
      
    });

    let tryCount = 0;
  
    while (true) {
      tryCount++;
      if (!_targetPort){
        targetPort = 10000 + Math.round(Math.random() * 30000);
      }      

      if (tryCount == 10){
        throw new Error('Unable to create local server');
      }
  
      try {
        server.listen(_targetPort);
        await once(server, 'listening');
        return server.address().port;
      } catch(e) {
        logger.log('error', `could not listen on port ${_targetPort}, will retry on a different port : ${e.message}`);
      }
    }
}

module.exports.createLocalServer = createLocalServer;