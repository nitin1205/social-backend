import mongoose from 'mongoose';
import Logger from 'bunyan';

import { config } from '@root/config';
import { redisConnection } from '@service/redis/redis.connection';

const log: Logger = config.createLogger('database');

export default () => {
  mongoose.set('strictQuery', false);
  const connect = () => {
    mongoose
      .connect(`${config.DATABASE_URL}`)
      .then(() => {
        log.info('Connected to mongodb');
        redisConnection.connect();
      })
      .catch((err) => {
        log.error(err);
        return process.exit(1);
      });
  };
  connect();
  mongoose.connection.on('disconnected', connect);
};
