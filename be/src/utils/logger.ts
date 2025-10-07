import {config} from '../config';
import colors from 'colors';
import tracer from 'tracer';

export const logger = tracer.colorConsole({
    filters: {
        trace: colors.magenta,
        debug: colors.cyan,
        info: colors.blue,
        warn: colors.yellow,
        error: [colors.red, colors.bold]
    },
    format: "{{timestamp}} <{{title}}> {{file}}:{{line}} ({{method}}) {{message}}",
    dateformat: "UTC:yyyy/mm/dd HH:MM:ss.l",
    level: config.logger.level
});

