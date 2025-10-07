import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config';

export interface IUserAttributes {
    id?: number;
    manager_id?: string | null;
    name: string;
    username: string;
    email?: string | null;
    phone_number?: string | null;
    phone?: string | null;
    password_hash?: string | null;
    role: string | number;
    status: string | number;
    created_at?: Date;
    updated_at?: Date;
}

export type IUserCreationAttributes =
    Optional<IUserAttributes, 'id' | 'created_at' | 'updated_at' | 'manager_id' | 'phone' | 'phone_number' >;

export class User extends Model<IUserAttributes, IUserCreationAttributes> implements IUserAttributes {
    declare id: number;
    declare manager_id: string | null;
    declare name: string;
    declare username: string;
    declare email: string | null;
    declare phone_number: string | null;
    declare phone: string | null;              // alias (virtual)
    declare password_hash: string | null;
    declare role: string | number;
    declare status: string | number;
    declare readonly created_at: Date;
    declare readonly updated_at: Date;
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        manager_id: {
            // lưu dạng string để linh hoạt (nếu trước đây là _id của Mongo)
            type: DataTypes.STRING(64),
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: true,
            unique: true,
        },
        phone_number: {
            type: DataTypes.STRING(20),
            allowNull: true,
            unique: true,
        },
        // Alias để tương thích chỗ code nào vẫn đọc/ghi 'phone'
        phone: {
            // không tạo cột thật — map vào phone_number
            type: DataTypes.VIRTUAL,
            get(this: any) {
                return this.getDataValue('phone_number');
            },
            set(this: any, val: string) {
                this.setDataValue('phone_number', val);
            },
        },
        password_hash: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        role: {
            type: DataTypes.STRING(50), // đổi sang INTEGER nếu bạn dùng enum số
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(50), // đổi sang INTEGER nếu bạn dùng enum số
            allowNull: false,
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { unique: true, fields: ['username'] },
            { unique: true, fields: ['email'] },
            { unique: true, fields: ['phone_number'] },
            { fields: ['manager_id'] },
        ],
        hooks: {
            beforeValidate: (user: User) => {
                if (user.email) user.email = user.email.trim().toLowerCase();
                if (user.username) user.username = user.username.trim();
                if (user.phone_number) user.phone_number = user.phone_number.trim();
            },
        },
    }
);

