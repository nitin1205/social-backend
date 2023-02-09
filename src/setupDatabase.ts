import mongoose from 'mongoose';
import Logger from 'bunyan';

import { config } from './config';

const log: Logger = config.createLogger('database');

export default () => {
  mongoose.set('strictQuery', false);
  const connect = () => {
    mongoose
      .connect(`${config.DATABASE_URL}`)
      .then(() => {
        log.info('Connected to mongodb');
      })
      .catch((err) => {
        log.error(err);
        return process.exit(1);
      });
  };
  connect();
  mongoose.connection.on('disconnected', connect);
};
