const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;

/** Read single records from db */
async function getOneAsync(collectionName, filter, project) {

    var collection = await tryGetCollection(collectionName);
    if (!collection.success){
        return { success : false, error : collection.error };
    }

    try {              
        // cast object
        if (!project){
            project = {};
        }  

        let res = await collection.payload.findOne(filter, project);
        if (!res){
            return { success : false, error : "Not found", code : "NOT_FOUND" };    
        }

        return { success : true, payload : setObjectId(res) };
    } 
    catch (err) {
        return { success : false, error : err.message };
    }
}

async function tryGetCollection(collectionName){

    if (!collectionName){
        return { success : false, error : "Invalid collection name" };
    }

    // note to self, local connection was failing untill I changed the replicaSet host to the IP used in the connection
    const client = await MongoClient.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true })
        .catch(err => { return { success : false, error : err.message, stack : err.stack } });

    if (!client || client.error) {
        if (client.stack){
            console.error(client.stack);
        }
        if (client.error){
            return { success : false, error : "Could not create db client : " + client.error };
        }
        return { success : false, error : "Could not create db client" };
    }

    let db = client.db(process.env.dbName);
    let collection = db.collection(collectionName);

    return { success : true, payload : collection };
}

function setObjectId(obj){
    if (obj){
        obj.id = obj._id.toString();
        delete obj._id;        
    }  
    return obj;  
}

var toDbiD = function(inputId) {    
    try{
        return new mongo.ObjectID(inputId);    
    }
    catch(ex){
        return null; 
    }  
}


module.exports.getOneAsync = getOneAsync;