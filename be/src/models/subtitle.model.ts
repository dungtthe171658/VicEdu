import mongoose, { Schema, Document } from "mongoose";

export interface IBilingualCue {
  start: number;
  end: number;
  source: string; // original text (e.g. English)
  target: string; // translated text (e.g. Vietnamese)
}

export interface ISubtitle extends Document {
  lesson_id: mongoose.Types.ObjectId;
  en_vtt?: string;
  vi_vtt?: string;
  cues?: IBilingualCue[];
  created_at?: Date;
  updated_at?: Date;
}

const cueSchema = new Schema<IBilingualCue>(
  {
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    source: { type: String, default: "" },
    target: { type: String, default: "" },
  },
  { _id: false }
);

const subtitleSchema = new Schema<ISubtitle>(
  {
    lesson_id: { type: Schema.Types.ObjectId, ref: "Lesson", unique: true, index: true, required: true },
    en_vtt: { type: String },
    vi_vtt: { type: String },
    cues: [cueSchema],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "subtitles",
  }
);

export default mongoose.model<ISubtitle>("Subtitle", subtitleSchema);
