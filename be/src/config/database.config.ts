import { Sequelize } from 'sequelize';
import { config } from './config';
import { logger } from '../utils';

export const sequelize = new Sequelize(
    config.database_name!,
    config.database_user!,
    config.database_password!,
    {
        host: config.database_host!,
        dialect: 'mysql',
        logging: false,
        timezone: '+07:00',
    }
);

export const connectDB = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Connected with MySQL database successfully!');
    } catch (error) {
        logger.error('Unable to connect with MySQL database:', error);
        process.exit(1);
    }
};

export const syncDB = async (force = false) => {
    try {
        await sequelize.sync({ force });
        logger.info('All models synced successfully!');
    } catch (error) {
        logger.error('Failed to sync models:', error);
    }
};
