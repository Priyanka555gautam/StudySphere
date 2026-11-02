// MongoDB Atlas connection & Mongoose models for StudySphere backend.

const mongoose = require("mongoose");

let isConnected = false;

async function initMongo(uri) {
  if (isConnected || !uri) return isConnected;

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    isConnected = true;
    console.log("Connected to MongoDB Atlas database successfully.");
    return true;
  } catch (err) {
    console.error("MongoDB Atlas connection error:", err.message);
    isConnected = false;
    return false;
  }
}

// User Schema
const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password_hash: { type: String, required: true },
    password_salt: { type: String, required: true },
    role: { type: String, required: true, enum: ["student", "teacher"] },
    avatar: { type: String, default: null },
    student_class: { type: String, default: null },
    expertise: { type: String, default: null },
    bio: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Course Schema
const courseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    teacher_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    category: { type: String, default: "" },
    level: { type: String, default: "Beginner" },
    description: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    instructor: { type: String, default: "" },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Lesson Schema
const lessonSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    course_id: { type: String, required: true, index: true },
    position: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    video_id: { type: String, default: "" },
    duration: { type: String, default: "" },
  },
  { timestamps: true }
);

// LessonTask Schema
const lessonTaskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    lesson_id: { type: String, required: true, unique: true, index: true },
    course_id: { type: String, required: true, index: true },
    teacher_id: { type: String, required: true, index: true },
    title: { type: String, required: true },
    instructions: { type: String, default: "" },
    file_name: { type: String, default: null },
    file_data: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: null },
  },
  { timestamps: true }
);

// Enrollment Schema
const enrollmentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    course_id: { type: String, required: true, index: true },
    student_id: { type: String, required: true, index: true },
    enrolled_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

enrollmentSchema.index({ course_id: 1, student_id: 1 }, { unique: true });

// Submission Schema
const submissionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    lesson_id: { type: String, required: true, index: true },
    course_id: { type: String, required: true, index: true },
    student_id: { type: String, required: true, index: true },
    file_name: { type: String, required: true },
    file_data: { type: String, required: true },
    status: { type: String, required: true, enum: ["submitted", "approved", "rejected"], default: "submitted" },
    remark: { type: String, default: null },
    submitted_at: { type: String, default: () => new Date().toISOString() },
    evaluated_at: { type: String, default: null },
  },
  { timestamps: true }
);

submissionSchema.index({ lesson_id: 1, student_id: 1 }, { unique: true });

// LessonCompletion Schema
const lessonCompletionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    lesson_id: { type: String, required: true, index: true },
    course_id: { type: String, required: true, index: true },
    student_id: { type: String, required: true, index: true },
    completed_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

lessonCompletionSchema.index({ lesson_id: 1, student_id: 1 }, { unique: true });

// FocusSession Schema
const focusSessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    seconds: { type: Number, required: true },
    mode: { type: String, default: "timer" },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Subject Schema
const subjectSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    icon: { type: String, default: "📘" },
    topics_count: { type: Number, default: 0 },
    progress_pct: { type: Number, default: 0 },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Task Schema
const taskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    subject_id: { type: String, default: null },
    title: { type: String, required: true },
    duration_min: { type: Number, default: 30 },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    date: { type: String, required: true, index: true },
    completed: { type: Number, default: 0 },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// PasswordReset Schema
const passwordResetSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    token_hash: { type: String, required: true, unique: true },
    expires_at: { type: String, required: true },
    used_at: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

const UserMongo = mongoose.model("User", userSchema);
const CourseMongo = mongoose.model("Course", courseSchema);
const LessonMongo = mongoose.model("Lesson", lessonSchema);
const LessonTaskMongo = mongoose.model("LessonTask", lessonTaskSchema);
const EnrollmentMongo = mongoose.model("Enrollment", enrollmentSchema);
const SubmissionMongo = mongoose.model("Submission", submissionSchema);
const LessonCompletionMongo = mongoose.model("LessonCompletion", lessonCompletionSchema);
const FocusSessionMongo = mongoose.model("FocusSession", focusSessionSchema);
const SubjectMongo = mongoose.model("Subject", subjectSchema);
const TaskMongo = mongoose.model("Task", taskSchema);
const PasswordResetMongo = mongoose.model("PasswordReset", passwordResetSchema);

// Post Schema
const postSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    author_id: { type: String, required: true, index: true },
    content: { type: String, default: "" },
    media_url: { type: String, default: null },
    media_type: { type: String, enum: ["image", "video", null], default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Post Comment Schema
const postCommentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    post_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    content: { type: String, required: true },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Saved Post Schema
const savedPostSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    user_id: { type: String, required: true, index: true },
    post_id: { type: String, required: true, index: true },
    saved_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);
savedPostSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

// Teacher Follow Schema
const teacherFollowSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    student_id: { type: String, required: true, index: true },
    teacher_id: { type: String, required: true, index: true },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);
teacherFollowSchema.index({ student_id: 1, teacher_id: 1 }, { unique: true });

// Friend Request Schema
const friendRequestSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    sender_id: { type: String, required: true, index: true },
    receiver_id: { type: String, required: true, index: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Conversation Schema
const conversationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ["direct", "group"], required: true },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Conversation Participant Schema
const conversationParticipantSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    conversation_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    joined_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);
conversationParticipantSchema.index({ conversation_id: 1, user_id: 1 }, { unique: true });

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    conversation_id: { type: String, required: true, index: true },
    sender_id: { type: String, required: true, index: true },
    content: { type: String, default: "" },
    type: { type: String, enum: ["TEXT", "POST_SHARE", "COURSE_SHARE"], default: "TEXT" },
    metadata: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Chat Group Schema
const chatGroupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    conversation_id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    admin_id: { type: String, required: true, index: true },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

// Group Join Request Schema
const groupJoinRequestSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    group_id: { type: String, required: true, index: true },
    user_id: { type: String, required: true, index: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    created_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

const PostMongo = mongoose.model("Post", postSchema);
const PostCommentMongo = mongoose.model("PostComment", postCommentSchema);
const SavedPostMongo = mongoose.model("SavedPost", savedPostSchema);
const TeacherFollowMongo = mongoose.model("TeacherFollow", teacherFollowSchema);
const FriendRequestMongo = mongoose.model("FriendRequest", friendRequestSchema);
const ConversationMongo = mongoose.model("Conversation", conversationSchema);
const ConversationParticipantMongo = mongoose.model("ConversationParticipant", conversationParticipantSchema);
const MessageMongo = mongoose.model("Message", messageSchema);
const ChatGroupMongo = mongoose.model("ChatGroup", chatGroupSchema);
const GroupJoinRequestMongo = mongoose.model("GroupJoinRequest", groupJoinRequestSchema);

module.exports = {
  initMongo,
  UserMongo,
  CourseMongo,
  LessonMongo,
  LessonTaskMongo,
  EnrollmentMongo,
  SubmissionMongo,
  LessonCompletionMongo,
  FocusSessionMongo,
  SubjectMongo,
  TaskMongo,
  PasswordResetMongo,
  PostMongo,
  PostCommentMongo,
  SavedPostMongo,
  TeacherFollowMongo,
  FriendRequestMongo,
  ConversationMongo,
  ConversationParticipantMongo,
  MessageMongo,
  ChatGroupMongo,
  GroupJoinRequestMongo,
};

