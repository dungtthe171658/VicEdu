import mongoose, { Schema, Document } from "mongoose";

export interface IWatchHistory extends Document {
  user_id: mongoose.Types.ObjectId;
  lesson_id: mongoose.Types.ObjectId;
  course_id: mongoose.Types.ObjectId;
  watch_progress: number; // 0-100
  completed_at?: Date | null;
  last_watched_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

const watchHistorySchema = new Schema<IWatchHistory>(
  {
    user_id: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true
    },
    lesson_id: { 
      type: Schema.Types.ObjectId, 
      ref: "Lesson", 
      required: true,
      index: true
    },
    course_id: { 
      type: Schema.Types.ObjectId, 
      ref: "Course", 
      required: true,
      index: true
    },
    watch_progress: { 
      type: Number, 
      default: 0, 
      min: 0, 
      max: 100 
    },
    completed_at: { 
      type: Date, 
      default: null 
    },
    last_watched_at: { 
      type: Date, 
      default: null 
    },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    collection: "watch_histories"
  }
);

// Unique index: mỗi user chỉ có 1 record cho mỗi lesson
watchHistorySchema.index({ user_id: 1, lesson_id: 1 }, { unique: true });

// Index để query nhanh theo user và ngày
watchHistorySchema.index({ user_id: 1, completed_at: 1 });
watchHistorySchema.index({ user_id: 1, created_at: 1 });

export default mongoose.model<IWatchHistory>("WatchHistory", watchHistorySchema);

