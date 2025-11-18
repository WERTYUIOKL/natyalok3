import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = process.env.REDIS_PORT || 6379;

// Publisher and Subscriber are separate connections
export const publisher = new Redis(redisPort, redisHost);
export const subscriber = new Redis(redisPort, redisHost);

// Subscribe to a channel
export function subscribe(channel, handler) {
  subscriber.subscribe(channel, (err, count) => {
    if (err) {
      console.error("Failed to subscribe: %s", err.message);
    } else {
      console.log(`Subscribed to ${channel}.`);
    }
  });

  subscriber.on("message", (chan, message) => {
    if (chan === channel) {
      handler(message);
    }
  });
}

// Publish to a channel
export function publish(channel, message) {
  publisher.publish(channel, message);
}