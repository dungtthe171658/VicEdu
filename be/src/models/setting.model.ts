import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
    key: string;
    value: string;
}

const SettingSchema = new Schema<ISetting>({
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
});

export const Setting = mongoose.model<ISetting>("Setting", SettingSchema);
