import mongoose, { Schema, Document } from "mongoose";

export type TargetType = "course" | "lesson";
export type EditStatus = "pending" | "approved" | "rejected" | "applied";

export interface IEditHistory extends Document {
  target_type: TargetType;
  target_id: mongoose.Types.ObjectId;
  submitted_by: mongoose.Types.ObjectId;
  submitted_role: "admin" | "teacher" | "system";
  status: EditStatus;
  before: Record<string, any>;
  after: Record<string, any>;
  changes: Record<string, { from: any; to: any }>;
  reason?: string;
  approved_by?: mongoose.Types.ObjectId | null;
  approved_at?: Date | null;
}

const editHistorySchema = new Schema<IEditHistory>(
  {
    target_type: { type: String, enum: ["course", "lesson"], required: true, index: true },
    target_id: { type: Schema.Types.ObjectId, required: true, index: true },
    submitted_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submitted_role: { type: String, enum: ["admin", "teacher", "system"], required: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "applied"], required: true, index: true },
    before: { type: Schema.Types.Mixed, default: {} },
    after: { type: Schema.Types.Mixed, default: {} },
    changes: { type: Schema.Types.Mixed, default: {} },
    reason: { type: String, default: undefined },
    approved_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
    approved_at: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "edit_histories",
  }
);

editHistorySchema.index({ target_type: 1, target_id: 1, created_at: -1 });

export default mongoose.model<IEditHistory>("EditHistory", editHistorySchema);

