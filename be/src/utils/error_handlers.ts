import {ErrorCode, logger} from "./index"
import {NextFunction, Request, Response} from "express"

export * from './utils'
export * from './math-utils'

function getErrorStr(errCode: number): string {
    return ErrorCode[errCode]
}

function routeResError(res: Response, errData: { error_code?: string, error_msg?: string }, httpStatus = 400) {
    res.status(httpStatus).json(errData)
}

function routeResSuccess(res: Response, data?: any) {
    if (data) res.json({
        error_code: "OK",
        data,
    })
    else res.status(204).json({
        error_code: "OK",
    })
}

function routeHandleErr(res: Response, e: any, httpStatus = 400) {
    let data: any = {}
    if (typeof e !== 'number') {
        // logger.error("routeHandleErr", e);
        if (e.code) {
            data = {error_code: e.code, error_msg: e.sqlMessage}
        } else if (e.error_code) {
            data = {error_code: getErrorStr(e.error_code), data: e.data}
        } else {
            data = {error_code: getErrorStr(ErrorCode.UNKNOWN_ERROR), error_msg: e.message}
        }
    } else {
        data = {error_code: getErrorStr(e)}
    }
    routeResError(res, data, httpStatus)
}

const hpr = (middleware: (req: Request, res: Response, next?: NextFunction) => any) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await middleware(req, res, next)
        } catch (error: any) {
            if (Object.values(ErrorCode).includes(error)) {
                // logger.error('AppError ', error)
                return routeResError(res, {error_code: getErrorStr(error)}, 400)
            }
            logger.error('HPR ERROR', error)
            routeHandleErr(res, error)
        }
    }
const partnerHpr = (middleware: (req: Request, res: Response, next?: NextFunction) => any) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await middleware(req, res, next)
        } catch (error: any) {
            if (Object.values(ErrorCode).includes(error)) {
                logger.error('partnerHpr ERROR ', error)
                res.status(400).json({status: "fail", error_code: error, message: getErrorStr(error)})
            } else {
                logger.error('partnerHpr ERROR', error)
                routeHandleErr(res, error)
            }
        }
    }

function routePartnerResSuccess(res: Response, data?: any) {
    if (data) res.json({
        status: "success", error_code: 2000, message: "SUCCESS", data: data
    })
    else res.json({
        status: "success", error_code: 2000, message: "SUCCESS"
    })
}

export class ErrorMessage {
    private error_code: ErrorCode;
    private error_msg: string;
    constructor(_error_code: ErrorCode, _message: string) {
        this.error_code = _error_code;
        this.error_msg = _message;
    }
}

function routeResMetadataSuccess(res: Response, data?: any) {
    res.json(data)
}

export {
    getErrorStr,
    routeResError,
    routeResSuccess,
    routeHandleErr,
    hpr,
    partnerHpr,
    routePartnerResSuccess,
    routeResMetadataSuccess,
}
