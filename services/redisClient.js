// services/redisClient.js
import { createClient } from "redis";
import { publish } from "../utils/redisPubSub.js";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
await redisClient.connect();

// Small test counter for sessions or page hits
export async function incrementHomeVisits() {
  const count = await redisClient.incr("home_visit_count");
  return count;
}


export default redisClient;
