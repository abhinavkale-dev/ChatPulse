import {Redis} from "ioredis"
let redis:Redis

if(process.env.NODE_ENV === "production") {
    if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL)
    } else {
        throw new Error("REDIS_URL is not defined in production environment")
    }
}
else {
    redis = new Redis({
        host: "localhost",
        port: 6379
    })
}

export default redis
