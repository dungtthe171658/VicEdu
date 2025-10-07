import {DataTypes, Model, Optional} from "sequelize";
import {sequelize} from "../config";

export interface IOtpCodeAttrs {
    id?: number;
    key: string;
    code: string;                // mã OTP (6 chữ số)
    otp_type: string;            // 'VERIFY_EMAIL', 'FORGOT_PASSWORD'
    status: string;              // PENDING | CONFIRMED | EXPIRED
    attempts: number;            // số lần nhập sai
    max_attempts: number;        // giới hạn số lần
    expired_at: Date;            // thời điểm hết hạn
    metadata?: any | null;       // thêm thông tin phụ
    created_at?: Date;
    updated_at?: Date;
}

type OtpCreation = Optional<
    IOtpCodeAttrs,
    "id" | "status" | "attempts" | "max_attempts" | "metadata" | "created_at" | "updated_at"
>;

export class OtpCodeModel extends Model<IOtpCodeAttrs, OtpCreation> implements IOtpCodeAttrs {
    declare id: number;
    declare key: string;
    declare code: string;
    declare otp_type: string;
    declare status: string;
    declare attempts: number;
    declare max_attempts: number;
    declare expired_at: Date;
    declare metadata: any | null;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

OtpCodeModel.init(
    {
        id: {type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true},
        key: {type: DataTypes.STRING(255), allowNull: false, unique: true},
        code: {type: DataTypes.STRING(32), allowNull: false},
        otp_type: {type: DataTypes.STRING(32), allowNull: false},
        status: {type: DataTypes.STRING(16), allowNull: false, defaultValue: "PENDING"},
        attempts: {type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0},
        max_attempts: {type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 5},
        expired_at: {type: DataTypes.DATE, allowNull: false},
        metadata: {type: DataTypes.JSON, allowNull: true},
        created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
        updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW},
    },
    {
        sequelize,
        tableName: "otp_codes",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        indexes: [
            {unique: true, fields: ["key"]},
            {fields: ["otp_type"]},
            {fields: ["status"]},
            {fields: ["expired_at"]},
        ],
    }
);
