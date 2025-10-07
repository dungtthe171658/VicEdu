import express, {Application} from "express";
import {applyMiddleware} from "../middlewares"
import {config} from "../config"
import {logger} from "../utils";
import {AuthRoute} from "../routes";

// --- Setup router
const setupRouter = (app: Application) => {
    AuthRoute(app)
};

const startServe = async () => {
    const app: Application = express();
    applyMiddleware(app)
    setupRouter(app)

    const server = app.listen(config.serverPort);
    logger.info(`Server started as ${config.node_env} at http://localhost:${config.serverPort}`);
    // await WebSocketService.InitWebSocket({server})
};

export const ApiService = {
    startServe
};