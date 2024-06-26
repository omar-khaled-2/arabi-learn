import { createClient } from "redis";

const redisClient = createClient({
    url:process.env.REDIS_URL!,
    
    
})

redisClient.on('error', err => console.log('Redis Client Error', err));

redisClient.on('connect', () => console.log('Redis Client Connected'));

export default redisClient