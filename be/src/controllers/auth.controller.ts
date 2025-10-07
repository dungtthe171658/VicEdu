import {
    ActiveStatus,
    AuthStatus,
    ErrorCode,
    HttpStatus,
    OtpType,
    TokenType,
    UserStatus,
    Utils,
} from "../utils";
import {OtpCodeModel, User} from "../models";
import {Op} from "sequelize";
import {OTPController} from "./otp.controller";

export class AuthController {
    public static async getVerifyForgotPassword(email: string) {
        const user = await this.getValidUserByEmail(email);
        await OTPController.sendOtp(OtpType.FORGOT_PASSWORD, email.trim().toLowerCase());
        const plain = user.get({plain: true});
        const {password_hash, ...rest_user} = plain;
        return rest_user;
    }

    public static async finishForgotPassword(data: any) {
        const user = await this.getValidUserByEmail(data.email);
        const key = ["code", "forgot_password", "email", data.email.trim().toLowerCase()].join("-");

        const otpRecord = await OtpCodeModel.findOne({
            where: {key, status: "CONFIRMED"},
        });
        if (!otpRecord) throw ErrorCode.OTP_NOT_VERIFIED;

        await OTPController.deleteOtpByKey(key);

        const newHash = await Utils.hashPassword(data.password);
        const [affected] = await User.update(
            {password_hash: newHash},
            {where: {id: user.id}}
        );
        if (affected === 0) throw ErrorCode.UPDATE_ZERO_ROW;

        return {status: HttpStatus.ACCEPTED};
    }

    public static async getValidUserByEmail(email: string) {
        const user = await User.findOne({where: {email}});
        if (!user) throw ErrorCode.USER_NOT_FOUND;
        return user;
    }

    public static async verifyEmail(user_id: any, email: string, code: string) {
        const user = await User.findOne({where: {manager_id: user_id}});
        if (user?.email) throw ErrorCode.USER_EMAIL_VERIFIED;

        const _user = await User.findOne({where: {email}});
        if (_user) throw ErrorCode.EMAIL_EXIST;

        // verify code
        await OTPController.verify_otp(OtpType.VERIFY_EMAIL, email.trim().toLowerCase(), code);

        if (!_user) {
            await User.update({email}, {where: {manager_id: user_id}});
        } else {
            // await AuthPrisma.merge_user(email, user?.username);
        }

        const userInfo = await User.findOne({where: {manager_id: user_id}});
        const timestamp = Date.now();
        const auth_token = Utils.getUserToken({
            userId: String(userInfo?.id),
            timestamp,
            type: TokenType.LOGIN,
        });

        return {
            token: auth_token,
            user_info: userInfo?.get({plain: true}),
            expiredAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        };
    }

    public static async getVerifyCode(email: string) {
        const user = await User.findOne({where: {email}});
        if (user) throw ErrorCode.EMAIL_ACTIVATED;
        await OTPController.sendOtp(OtpType.VERIFY_EMAIL, email.trim().toLowerCase());
        return true;
    }

    public static async generateTokenAndInfo(user_id: any) {
        const timestamp = Date.now();
        return Utils.getUserToken({userId: user_id, timestamp, type: TokenType.LOGIN});
    }

    public static async changePassword(user_id: any, password: string, new_password: string) {
        const user_auth = await User.findOne({where: {manager_id: user_id}});
        if (!user_auth) throw ErrorCode.USER_NOT_FOUND;

        if (!password) throw ErrorCode.PASSWORD_IS_INVALID;
        if (!user_auth.password_hash) throw ErrorCode.PASSWORD_IS_INVALID;

        const isValidPw = await Utils.comparePassword(password, user_auth.password_hash);
        if (!isValidPw) throw ErrorCode.PASSWORD_IS_INVALID;

        const newHash = await Utils.hashPassword(new_password);
        await User.update({password_hash: newHash}, {where: {manager_id: user_id}});

        return {status: true, message: "Change password success"};
    }

    public static async gen_auth_token(id: any) {
        const user = await User.findOne({where: {manager_id: id}});
        if (!user) throw ErrorCode.USER_NOT_FOUND;
        const timestamp = Date.now();
        return Utils.getUserToken({userId: id, timestamp, type: TokenType.LOGIN});
    }

    public static async initialRegister(data: any) {
        const check_email = await User.findOne({
            where: {
                email: data.email,
                status: {[Op.notIn]: [String(UserStatus.DEACTIVATED), String(UserStatus.PENDING)]},
            },
        });
        if (check_email) throw ErrorCode.EMAIL_EXIST;

        const check_username = await User.findOne({
            where: {
                username: data.username,
                status: {[Op.notIn]: [String(UserStatus.DEACTIVATED), String(UserStatus.PENDING)]},
            },
        });
        if (check_username) throw ErrorCode.USERNAME_EXIST;

        const check_phone = await User.findOne({
            where: {
                phone_number: data.phone_number,
                status: {[Op.notIn]: [String(UserStatus.DEACTIVATED), String(UserStatus.PENDING)]},
            },
        });
        if (check_phone) throw ErrorCode.MOBILE_EXIST;

        await OTPController.sendOtp(OtpType.VERIFY_EMAIL, data.email.trim().toLowerCase());

        const data_user = {
            username: data.username,
            name: data.name,
            email: data.email,
            phone_number: data.phone_number,
            role: "common",
        };
        return {status: HttpStatus.ACCEPTED, data_user};
    }

    public static async verification(data: any) {
        try {
            await OTPController.verify_otp(Number(data.otp_type), data.email.trim().toLowerCase(), data.code);
            return {status: HttpStatus.ACCEPTED};
        } catch (error) {
            return {status: HttpStatus.BAD_REQUEST};
        }
    }

    public static async finishRegister(payload: any) {
        const emailLower = payload.data_user.email.trim().toLowerCase();
        const key = ["code", "verify_email", "email", emailLower].join("-");

        const otpRecord = await OtpCodeModel.findOne({
            where: {key, status: "CONFIRMED"},
        });
        if (!otpRecord) throw ErrorCode.OTP_NOT_VERIFIED;

        const user = await User.create({
            username: payload.data_user.username,
            name: payload.data_user.name,
            email: emailLower,
            phone_number: payload.data_user.phone_number,
            password_hash: await Utils.hashPassword(payload.password),
            status: String(UserStatus.PENDING),
            role: "common",
        });
        if (!user) throw ErrorCode.USER_INVALID;

        await OtpCodeModel.destroy({where: {key}});

        return {status: HttpStatus.ACCEPTED};
    }

    public static async login(account: string, password: string) {
        const userInfo = await User.findOne({
            where: {
                [Op.or]: [
                    {email: account},
                    {phone_number: account},
                    {username: account},
                ],
            },
        });

        const statusNum = Number(userInfo?.status);
        if (
            !userInfo ||
            statusNum === UserStatus.DEACTIVATED ||
            statusNum === UserStatus.BANNED ||
            statusNum === UserStatus.PENDING
        ) {
            throw ErrorCode.USER_INVALID;
        }

        if (!password?.trim()) throw ErrorCode.PASSWORD_IS_INVALID;
        if (!userInfo.password_hash) throw ErrorCode.PASSWORD_IS_INVALID;

        const isValidPw = await Utils.comparePassword(password, userInfo.password_hash);
        if (!isValidPw) throw ErrorCode.WRONG_PASSWORD;

        const timestamp = Date.now();
        const auth_token = Utils.getUserToken({
            userId: String(userInfo.id),
            timestamp,
            type: TokenType.LOGIN,
        });

        const plain = userInfo.get({plain: true});
        const {password_hash, ...user_without_password} = plain;

        return {
            token: auth_token,
            user_info: user_without_password,
            expired_at: timestamp + 24 * 60 * 60 * 1000,
        };
    }
}
