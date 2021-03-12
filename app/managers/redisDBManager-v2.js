const
    config = require('config'),
    redis = require('redis'),
    util = require('util');
;
const { resolve, parse } = require('path');
const NAME_DB_REDIS = "redis_db";
const ID_LIST_DB_REDIS = "redis_db_ids";
const redisUrl = `redis://127.0.0.1:${config.redis.port}`;

const client = redis.createClient(redisUrl);
client.on("error", function(error) {
    console.error(error);
  });
client.get = util.promisify(client.get);
client.del = util.promisify(client.del);
client.set = util.promisify(client.set);





module.exports = {
    /**
     * Get all records from memory DB
     * @return {Promise}
     */
    getAll: async function getAllFromDb() {
        // client.flushall()
        let idLists = await client.get(ID_LIST_DB_REDIS);
        if(idLists === undefined || idLists === null) return new Promise((resolve,reject)=>resolve([]));
        let  parsedIdLists = JSON.parse(idLists);
        let result = [];
        for(let item of parsedIdLists) {
            let name = await client.get(item);
            result.push({
                id: parseInt(item),
                name: name
            })
        } 
         return new Promise( (resolve, reject) =>  resolve(result));
    },
    /**
     * Get record by id from memory DB
     * @param id
     * @return {Promise}
     */
    getById: async function getIdFromDb(id) {
        let name = await client.get(id);
        let result ={};
        if(!!name) {
            result = {
                id: parseInt(id),
                name: name
            }
        }
        return  new Promise((resolve, reject)=> resolve(result))
    },
    /**
     * Add new record to memory DB
     * @param name
     * @return {Promise}
     */
    setNewId: async function setNewIdToDb(name) {
        let idLists = await client.get(ID_LIST_DB_REDIS);
        let parsedIdLists = [];
        let recordId = 0;
        if(idLists === undefined || idLists === null) {
            parsedIdLists = ['0'];                            
        } else {
            parsedIdLists = JSON.parse(idLists);
            recordId = parsedIdLists.length.toString();
            parsedIdLists.push(recordId);           
        }
        await client.set(ID_LIST_DB_REDIS,JSON.stringify(parsedIdLists));
        await client.set(recordId, name);
        return  new Promise((resolve, reject) => {
            resolve({
                id: parseInt(recordId),
                name: name
            })
        })
    },
    /**
     * Update record into memory DB
     * @param id
     * @param name
     * @return {Promise}
     */
    updateId: async function updateIdToDb(id,name) {
         let item = await client.set(id, name);

         return module.exports.getById(id) ;
    },
    

    /**
     * Remove record from memory DB
     * @param id
     * @return {Promise}
     */
    removeId: async function removeIdInDb(id) {
        let item = await client.get(id);
        let idLists = await client.get(ID_LIST_DB_REDIS);
        let parsedIdLists = JSON.parse(idLists);
        const positionToDletete = parsedIdLists.indexOf(id);
        parsedIdLists.splice(positionToDletete,1);
        await client.set(ID_LIST_DB_REDIS,JSON.stringify(parsedIdLists));
        return client.del(id,1);
    }
}