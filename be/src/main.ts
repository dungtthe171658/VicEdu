'use strict'
import {ApiService} from "./services";
import {AES, logger, MathUtils,} from "./utils";
import {config, connectDB, syncDB} from "./config";

const main = async () => {
    logger.info("Running service:", config.service_name || 'api');
    switch (config.service_name) {
        default:
            await ApiService.startServe();
            break;
    }
}

(async () => {
    connectDB().then(() => main().catch(e => logger.error(e)))

    await syncDB(false); // force=false để không drop bảng
})();