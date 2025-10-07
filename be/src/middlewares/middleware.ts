import {config} from "../config"
import {ErrorCode, HttpStatus, Permission, PermissionUtils, routeHandleErr, TokenType} from "../utils"
import {NextFunction, Request, Response, Router} from "express"
import bodyParser from "body-parser"
import compression from "compression"
import cors from "cors"
import helmet from "helmet"
import jwt from "jsonwebtoken"
import rateLimit from 'express-rate-limit'


export const checkAuth = async (req: Request, res: Response, next: NextFunction) => {
    let {authorization} = req.headers
    if (!authorization) {
        return routeHandleErr(res, ErrorCode.TOKEN_IS_INVALID, HttpStatus.UNAUTHORIZED)
    }
    authorization = authorization.replace('Bearer ', '');
    let jwtPayload: any
    try {
        jwtPayload = jwt.verify(authorization, config.jwtSecret)
        if (jwtPayload.type !== TokenType.LOGIN)
            throw ErrorCode.TOKEN_IS_INVALID
    } catch (e) {
        return routeHandleErr(res, ErrorCode.TOKEN_IS_INVALID, HttpStatus.UNAUTHORIZED)
    }
    const {userId, timestamp} = jwtPayload

    const newToken = jwt.sign({userId, timestamp}, config.jwtSecret, {expiresIn: "12h"})
    res.setHeader("token", newToken)
    res.locals.userId = userId
    next()
}

export const parseUser = async (req: Request, res: Response, next: NextFunction) => {
    let { authorization } = req.headers
    if (authorization) {
        authorization = authorization.replace('Bearer ', '');
        let jwtPayload: any
        try {
            jwtPayload = jwt.verify(authorization, config.jwtSecret)
            if (jwtPayload.type !== TokenType.LOGIN)
                throw ErrorCode.TOKEN_IS_INVALID
        } catch (e) {
            return routeHandleErr(res, ErrorCode.TOKEN_IS_INVALID, HttpStatus.UNAUTHORIZED)
        }
        const { userId, timestamp } = jwtPayload

        const newToken = jwt.sign({ userId, timestamp }, config.jwtSecret, { expiresIn: "12h" })
        res.setHeader("token", newToken)
        res.locals.userId = userId
        next()
    }
    else {
        next()
    }

}

// export const parseUserOptional = async (req: Request, res: Response, next: NextFunction) => {
//     const {userId} = res.locals
//     if (userId) {
//         const user: any = await UserModel.get(userId)
//         user.user_id = userId
//         res.locals.userInfo = user
//     }
//     next()
// }
//
// export const notInProd = async (req: Request, res: Response, next: NextFunction) => {
//     if (config.production) {
//         res.status(HttpStatus.NOT_FOUND).json({
//             status: HttpStatus.NOT_FOUND,
//             message: 'Not found'
//         })
//     } else {
//         next()
//     }
// }
//
// export const checkPermission = (requiredPermission: Permission) => {
//     return (req: Request, res: Response, next: NextFunction) => {
//         let {authorization} = req.headers
//         if (!authorization) {
//             return routeHandleErr(res, ErrorCode.TOKEN_IS_INVALID, HttpStatus.UNAUTHORIZED)
//         }
//         authorization = authorization.replace('Bearer ', '');
//         let jwtPayload: any
//         try {
//             jwtPayload = jwt.verify(authorization, config.jwtSecret)
//             if (jwtPayload.type !== TokenType.LOGIN)
//                 throw ErrorCode.TOKEN_IS_INVALID
//         } catch (e) {
//             return routeHandleErr(res, ErrorCode.TOKEN_IS_INVALID, HttpStatus.UNAUTHORIZED)
//         }
//         const {permissions} = jwtPayload;
//         if (!PermissionUtils.hasPermission(permissions, requiredPermission)) {
//             return routeHandleErr(res, ErrorCode.PERMISSION_DENIED, HttpStatus.FORBIDDEN)
//         }
//         next();
//     };
// }
//
export const applyMiddleware = (router: Router) => {
    // --- cors
    router.use(cors({
        credentials: true,
        origin: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["token"],
    }))
    // --- helmet
    router.use(helmet())
    // --- rate limit
    router.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 150, // limit each IP to 150 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many requests, please try again later.',
        statusCode: HttpStatus.TOO_MANY_REQUEST
    }))
    // --- body parser
    router.use(bodyParser.urlencoded({extended: true}))
    router.use(bodyParser.json())
    // --- compression
    router.use(compression())
}
