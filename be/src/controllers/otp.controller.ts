import {AuthStatus, ErrorCode, OtpType} from "../utils";
import {OtpCodeModel} from "../models";

const OTP_TTL_MS = 5 * 60 * 1000;

export class OTPController {
    static async sendOtp(otpType: OtpType | string, emailLower: string, meta?: any) {
        const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
        const key = ["code", String(otpType).toLowerCase(), "email", emailLower].join("-");
        const expiredAt = new Date(Date.now() + OTP_TTL_MS);

        await OtpCodeModel.upsert({
            key,
            code,
            otp_type: String(otpType),
            status: "PENDING",
            attempts: 0,
            expired_at: expiredAt,
            metadata: meta ?? null,
            max_attempts: 5,
        });

        // await Mailer.send(emailLower, `Your OTP is ${code}`);

        return {key, code, expiredAt};
    }

    static async verify_otp(otpType: OtpType | number | string, emailLower: string, code: string) {
        const key = ["code", String(otpType).toLowerCase(), "email", emailLower].join("-");
        const rec = await OtpCodeModel.findOne({where: {key}});
        if (!rec) throw ErrorCode.OTP_NOT_FOUND;

        if (rec.status === "CONFIRMED") return true;
        if (rec.expired_at.getTime() < Date.now()) {
            await rec.update({status: "EXPIRED"});
            throw ErrorCode.OTP_EXPIRED;
        }
        if (rec.attempts >= rec.max_attempts) throw ErrorCode.OTP_TOO_MANY_ATTEMPTS;

        if (rec.code !== String(code)) {
            await rec.update({attempts: rec.attempts + 1});
            throw ErrorCode.OTP_INVALID_CODE;
        }

        await rec.update({status: "CONFIRMED"});
        return true;
    }

    static async deleteOtpByKey(key: string) {
        await OtpCodeModel.destroy({where: {key}});
    }
}
