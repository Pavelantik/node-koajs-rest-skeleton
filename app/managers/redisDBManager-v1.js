const
    config = require('config'),
    redis = require('redis')
;
const { resolve } = require('path');
const NAME_DB_REDIS = "redis_db";

const util = require('util');

//const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
client.on("error", function(error) {
    console.error(error);
  });
client.get = util.promisify(client.get);
//client.lpush = util.promisify(client.lpush);
client.lindex = util.promisify(client.lindex);
client.llen = util.promisify(client.llen);
client.lrange = util.promisify(client.lrange);
client.lrem = util.promisify(client.lrem);
client.lset = util.promisify(client.lset);



module.exports = {
    /**
     * Get all records from memory DB
     * @return {Promise}
     */
    getAll: async function getAllFromDb() {
        console.log('in getall')
        const lengthRedisList = await client.llen(NAME_DB_REDIS);
        const jsonDbArray = await client.lrange(NAME_DB_REDIS, 0, lengthRedisList);
        const parsedDbArray = jsonDbArray.map((item)=> JSON.parse(item));
        return new Promise( (resolve, reject) => resolve(parsedDbArray));
    },
    /**
     * Get record by id from memory DB
     * @param id
     * @return {Promise}
     */
    getById: async function getIdFromDb(id) {
        const lengthRedisList = await client.llen(NAME_DB_REDIS);
        const jsonItem = await client.lindex(NAME_DB_REDIS,lengthRedisList-1-id);
        const parsedItem = JSON.parse(jsonItem);//jsonItem.map((tem)=> JSON.parse(item));
        return new Promise( (resolve, reject) => resolve(parsedItem));
    },
    /**
     * Add new record to memory DB
     * @param name
     * @return {Promise}
     */
    setNewId: async function setNewIdToDb(name) {
        let lengthRedisList = await client.llen(NAME_DB_REDIS);
        const newUserRecord = JSON.stringify({id: lengthRedisList, name: name});
        client.lpush(NAME_DB_REDIS,newUserRecord);
        return client.lindex(NAME_DB_REDIS,0);
    },
    /**
     * Update record into memory DB
     * @param id
     * @param name
     * @return {Promise}
     */
    updateId:  async function updateIdToDb(id,name) {
        let lengthRedisList = await client.llen(NAME_DB_REDIS);
        const jsonItem = await client.lindex(NAME_DB_REDIS,lengthRedisList-1-id);
        const parsedItem = JSON.parse(jsonItem);
        parsedItem.name = name;
        return client.lset(NAME_DB_REDIS,lengthRedisList-1-id, JSON.stringify(parsedItem));
        

    },
    

    /**
     * Remove record from memory DB
     * @param id
     * @return {Promise}
     */
    removeId: async function removeIdInDb(id) {
        const lengthRedisList = await client.llen(NAME_DB_REDIS);
        const itemToDelete = await client.lindex(NAME_DB_REDIS,lengthRedisList-1-id);
        client.lrem(NAME_DB_REDIS,1,itemToDelete);
        return new Promise ((res, rej) => resolve());
    }
}