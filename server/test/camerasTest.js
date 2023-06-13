var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = require('assert');
chai.use(chaiHttp);
const app = require('../../server');
const { doesNotMatch } = require('assert');
const { MongoMemoryServer } = require('mongodb-memory-server');
const req = require('express/lib/request');

chai.use(require('chai-like'))
chai.use(require('chai-things'))

process.env.NODE_ENV = 'test'

describe('Test /api/cameras', () => {

    let mongoServer;

    before(async () => {
        mongoServer = await createMongoServer();
    });
    
    after(async () => {
        await mongoServer.stop();
    });

    it('can get cameras', async () => {
        const res = await chai.request(app).get('/api/cameras').send();
        chai.expect(res.status).to.equal(200);
    }); 
});

async function createMongoServer(){
    var mongoServer = new MongoMemoryServer();
    let mongod = await MongoMemoryServer.create();
    process.env.DB_CONNECTION = mongod.getUri(); 
    return mongoServer;
}




