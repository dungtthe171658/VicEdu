import {Application, Request, Response, Router} from "express"
import {hpr, HttpStatus, logger, routeResSuccess, Utils,} from "../utils"
import Joi from "joi"
import {AuthController} from "../controllers";
import {checkAuth} from "../middlewares";

const login = async (req: Request, res: Response) => {
    const {account, password} = await Joi.object()
        .keys({
            account: Joi.string().required().min(1).max(50).trim().empty(''),
            password: Joi.string().required().custom(Utils.passwordMethod).min(8).max(50).trim().empty(''),
        })
        .validateAsync(req.body)
    routeResSuccess(res,await AuthController.login(account, password))
}

const initialRegister = async (req: Request, res: Response) => {
    const data = await Joi.object()
        .keys({
            username: Joi.string().required().min(1).max(50).trim().empty(''),
            name: Joi.string().required().min(1).max(100).empty(''),
            email: Joi.string().email().required().trim().empty(''),
            phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
        })
        .validateAsync(req.body);
    return routeResSuccess(res, await AuthController.initialRegister(data));
}

const verification = async (req: Request, res: Response) => {
    try {
        const data = await Joi.object()
            .keys({
                email: Joi.string().email().required().trim(),
                code: Joi.string().required().trim().empty(""),
                otp_type: Joi.string().required().trim().empty(""),
            })
            .validateAsync(req.body);

        return routeResSuccess(res, await AuthController.verification(data));
    } catch (error) {
        return res.status(HttpStatus.BAD_REQUEST);
    }
};

const finishRegister = async (req: Request, res: Response) => {
    const data = await Joi.object()
        .keys({
            data_user: Joi.object({
                name: Joi.string().required().min(1).max(100).trim().empty(''),
                email: Joi.string().email().required().trim().empty(''),
                username: Joi.string().required().min(1).max(50).trim().empty(''),
                phone_number: Joi.string().pattern(/^[0-9]{10,11}$/).required(),
            }).required(),
            password: Joi.string().custom(Utils.passwordMethod).required().trim().empty(''),
            confirm_password: Joi.string().valid(Joi.ref('password')).required()
        })
        .validateAsync(req.body);
    return routeResSuccess(res, await AuthController.finishRegister(data));
}


const getVerifyEmailCode = async (req: Request, res: Response) => {
    const {email} = await Joi.object()
        .keys({
            email: Joi.string().email().required().trim().empty(''),
        })
        .validateAsync(req.body);
    return routeResSuccess(res, await AuthController.getVerifyCode(email));
}


const change_password = async (req: Request, res: Response) => {
    const {password, new_password}: { password: string, new_password: string } = await Joi.object()
        .keys({
            password: Joi.string().custom(Utils.passwordMethod).required().trim().empty(''),
            new_password: Joi.string().custom(Utils.passwordMethod).required().trim().empty('').invalid(Joi.ref('password')),
        })
        .validateAsync(req.body)
    routeResSuccess(res, await AuthController.changePassword(res.locals.userId, password, new_password))
}

const getVerifyForgotPassword = async (req: Request, res: Response) => {
    const {email} = await Joi.object()
        .keys({
            email: Joi.string().email().required().trim().empty(''),
        })
        .validateAsync(req.body);
    return routeResSuccess(res,await AuthController.getVerifyForgotPassword(email))
}

const finishForgotPassword = async (req: Request, res: Response) => {
    const data = await Joi.object()
        .keys({
            email: Joi.string().email().required().trim().empty(''),
            password: Joi.string().custom(Utils.passwordMethod).required().trim().empty(''),
            confirm_password: Joi.string().valid(Joi.ref('password')).required()
        })
        .validateAsync(req.body);

    return routeResSuccess(res, await AuthController.finishForgotPassword(data));
}

const verify_email = async (req: Request, res: Response) => {
    const {email, code} = await Joi.object()
        .keys({
            email: Joi.string().email().required().trim().empty(''),
            code: Joi.string().required().trim().empty(''),
        })
        .validateAsync(req.body);
    return routeResSuccess(res, await AuthController.verifyEmail(res.locals.userId, email, code));
}

export const AuthRoute = (app: Application) => {
    const authRouter = Router()
    app.use("/auth", authRouter)

    authRouter.post("/login", hpr(login));
    authRouter.post("/verify-email", checkAuth, hpr(verify_email));
    authRouter.post("/get-verify-email-code", hpr(getVerifyEmailCode));

    authRouter.post("/initial-register", hpr(initialRegister));
    authRouter.post("/verification", hpr(verification));
    authRouter.post("/finish-register", hpr(finishRegister));

    authRouter.post("/get-verify-forgot-password", hpr(getVerifyForgotPassword));
    authRouter.post("/forgot-password", hpr(finishForgotPassword));
    authRouter.post("/change-password", checkAuth, hpr(change_password));

}
