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
    let testCamId;

    before(async () => {
        mongoServer = await createMongoServer();
    });
    
    after(async () => {
        await mongoServer.stop();
    });

    it('can create camera', async () => {

        const cam = {
            "name" : "test-camera",
            "url" : "rtsp://localhost:54/stream"            
        }

        const res = await chai.request(app).post('/api/cameras').send(cam);
        chai.expect(res.status).to.equal(200);
        chai.expect(res.body).to.have.property("id");

        testCamId = res.body.id;
    });


    it('can get cameras', async () => {
        const res = await chai.request(app).get('/api/cameras').send();
        chai.expect(res.status).to.equal(200);
    }); 

    it('can get single camera', async () => {
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




