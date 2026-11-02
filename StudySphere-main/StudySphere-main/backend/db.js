// Persistence layer for StudySphere auth & learning data.
// Supports both MongoDB Atlas (when MONGODB_URI is configured) and Node's built-in sqlite.

const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const {
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
} = require("./db_mongo");

const DB_PATH = path.join(__dirname, "studysphere.db");
const db = new DatabaseSync(DB_PATH);

// Initialize SQLite Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('student', 'teacher')),
    student_class TEXT,
    expertise     TEXT,
    bio           TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

try {
  db.exec(`ALTER TABLE users ADD COLUMN student_class TEXT;`);
} catch (e) {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE users ADD COLUMN avatar TEXT;`);
} catch (e) {
  // Column already exists
}

db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used_at    TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets (user_id);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS focus_sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    date       TEXT NOT NULL,
    seconds    INTEGER NOT NULL CHECK (seconds > 0),
    mode       TEXT NOT NULL DEFAULT 'timer',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date ON focus_sessions (user_id, date);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS subjects (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    icon         TEXT NOT NULL DEFAULT '📘',
    topics_count INTEGER NOT NULL DEFAULT 0,
    progress_pct INTEGER NOT NULL DEFAULT 0,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects (user_id);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    subject_id    TEXT REFERENCES subjects (id) ON DELETE SET NULL,
    title         TEXT NOT NULL,
    duration_min  INTEGER NOT NULL DEFAULT 30,
    priority      TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    date          TEXT NOT NULL,
    completed     INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks (user_id, date);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS courses (
    id          TEXT PRIMARY KEY,
    teacher_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    category    TEXT,
    level       TEXT,
    description TEXT,
    thumbnail   TEXT,
    instructor  TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses (teacher_id);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS lessons (
    id          TEXT PRIMARY KEY,
    course_id   TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    video_id    TEXT,
    duration    TEXT
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons (course_id, position);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS enrollments (
    id          TEXT PRIMARY KEY,
    course_id   TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    student_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    enrolled_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (course_id, student_id)
  );
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments (course_id);
  CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments (student_id);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id            TEXT PRIMARY KEY,
    lesson_id     TEXT NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    course_id     TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    student_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    file_name     TEXT NOT NULL,
    file_data     TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected')),
    remark        TEXT,
    submitted_at  TEXT NOT NULL DEFAULT (datetime('now')),
    evaluated_at  TEXT,
    UNIQUE (lesson_id, student_id)
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_submissions_course_student ON submissions (course_id, student_id);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS lesson_tasks (
    id           TEXT PRIMARY KEY,
    lesson_id    TEXT NOT NULL UNIQUE REFERENCES lessons (id) ON DELETE CASCADE,
    course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    teacher_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    title        TEXT NOT NULL,
    instructions TEXT,
    file_name    TEXT,
    file_data    TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_lesson_tasks_course ON lesson_tasks (course_id);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS lesson_completions (
    id           TEXT PRIMARY KEY,
    lesson_id    TEXT NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
    course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    student_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    completed_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (lesson_id, student_id)
  );
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_lesson_completions_course_student ON lesson_completions (course_id, student_id);`);

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id          TEXT PRIMARY KEY,
    author_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content     TEXT NOT NULL DEFAULT '',
    media_url   TEXT,
    media_type  TEXT CHECK (media_type IN ('image', 'video')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_posts_author ON posts (author_id);

  CREATE TABLE IF NOT EXISTS post_comments (
    id          TEXT PRIMARY KEY,
    post_id     TEXT NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments (post_id);

  CREATE TABLE IF NOT EXISTS saved_posts (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    post_id     TEXT NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    saved_at    TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (user_id, post_id)
  );

  CREATE TABLE IF NOT EXISTS teacher_follows (
    id          TEXT PRIMARY KEY,
    student_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    teacher_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (student_id, teacher_id)
  );

  CREATE TABLE IF NOT EXISTS friend_requests (
    id          TEXT PRIMARY KEY,
    sender_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL CHECK (type IN ('direct', 'group')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS conversation_participants (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at       TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (conversation_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content         TEXT NOT NULL DEFAULT '',
    type            TEXT NOT NULL DEFAULT 'TEXT' CHECK (type IN ('TEXT', 'POST_SHARE', 'COURSE_SHARE')),
    metadata        TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conversation_id);

  CREATE TABLE IF NOT EXISTS chat_groups (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL UNIQUE REFERENCES conversations (id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    icon            TEXT NOT NULL DEFAULT '',
    admin_id        TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS group_join_requests (
    id          TEXT PRIMARY KEY,
    group_id    TEXT NOT NULL REFERENCES chat_groups (id) ON DELETE CASCADE,
    user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// MongoDB Atlas initialization check
let mongoActive = false;
if (process.env.MONGODB_URI) {
  initMongo(process.env.MONGODB_URI).then((active) => {
    mongoActive = active;
  });
}

function isMongo() {
  return mongoActive && Boolean(process.env.MONGODB_URI);
}

/* =====================================================
   USER QUERIES
===================================================== */

const insertUserStmt = db.prepare(`
  INSERT INTO users (id, name, email, password_hash, password_salt, role, student_class, expertise, bio)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const findByEmailStmt = db.prepare(`
  SELECT * FROM users WHERE email = ? COLLATE NOCASE
`);

const findByIdStmt = db.prepare(`
  SELECT * FROM users WHERE id = ?
`);

const updateUserClassStmt = db.prepare(`
  UPDATE users SET student_class = ? WHERE id = ?
`);

async function createUser({ id, name, email, passwordHash, passwordSalt, role, studentClass, expertise, bio }) {
  if (isMongo()) {
    await UserMongo.create({
      id,
      name,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      password_salt: passwordSalt,
      role,
      student_class: studentClass ?? null,
      expertise: expertise ?? null,
      bio: bio ?? null,
    });
    return;
  }
  insertUserStmt.run(id, name, email, passwordHash, passwordSalt, role, studentClass ?? null, expertise ?? null, bio ?? null);
}

async function findUserByEmail(email) {
  if (isMongo()) {
    const doc = await UserMongo.findOne({ email: email.toLowerCase() }).lean();
    return doc || null;
  }
  return findByEmailStmt.get(email) ?? null;
}

async function findUserById(id) {
  if (isMongo()) {
    const doc = await UserMongo.findOne({ id }).lean();
    return doc || null;
  }
  return findByIdStmt.get(id) ?? null;
}

const updateUserAvatarStmt = db.prepare(`
  UPDATE users SET avatar = ? WHERE id = ?
`);

async function updateUserAvatar(userId, avatar) {
  if (isMongo()) {
    await UserMongo.updateOne({ id: userId }, { avatar });
    return;
  }
  updateUserAvatarStmt.run(avatar, userId);
}

function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar ?? null,
    studentClass: row.student_class ?? row.studentClass ?? null,
    expertise: row.expertise ?? null,
    bio: row.bio ?? null,
    createdAt: row.created_at || row.createdAt,
  };
}

const teachersStmt = db.prepare(`
  SELECT id, name, email, avatar, expertise, bio, created_at FROM users WHERE role = 'teacher'
`);

async function getTopTeachers() {
  let teachers = [];
  if (isMongo()) {
    teachers = await UserMongo.find({ role: "teacher" }).lean();
  } else {
    teachers = teachersStmt.all();
  }

  const result = [];
  for (const t of teachers) {
    const courses = await getCoursesByTeacher(t.id);
    let totalStudents = 0;
    for (const c of courses) {
      const count = await getEnrollmentCountForCourse(c.id);
      totalStudents += count;
    }
    result.push({
      id: t.id,
      name: t.name,
      email: t.email,
      avatar: t.avatar || null,
      expertise: t.expertise || "Teacher",
      bio: t.bio || "",
      coursesCount: courses.length,
      totalStudents,
    });
  }

  result.sort((a, b) => b.totalStudents - a.totalStudents || b.coursesCount - a.coursesCount);
  return result;
}

const updatePasswordStmt = db.prepare(`
  UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?
`);

async function updateUserPassword(userId, passwordHash, passwordSalt) {
  if (isMongo()) {
    await UserMongo.updateOne({ id: userId }, { password_hash: passwordHash, password_salt: passwordSalt });
    return;
  }
  updatePasswordStmt.run(passwordHash, passwordSalt, userId);
}

async function updateUserClass(userId, studentClass) {
  if (isMongo()) {
    await UserMongo.updateOne({ id: userId }, { student_class: studentClass });
    return;
  }
  updateUserClassStmt.run(studentClass, userId);
}

/* =====================================================
   PASSWORD RESET QUERIES
===================================================== */

const insertPasswordResetStmt = db.prepare(`
  INSERT INTO password_resets (id, user_id, token_hash, expires_at)
  VALUES (?, ?, ?, ?)
`);

const findValidPasswordResetStmt = db.prepare(`
  SELECT * FROM password_resets
  WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')
`);

const markPasswordResetUsedStmt = db.prepare(`
  UPDATE password_resets SET used_at = datetime('now') WHERE id = ?
`);

const invalidateUserPasswordResetsStmt = db.prepare(`
  UPDATE password_resets SET used_at = datetime('now')
  WHERE user_id = ? AND used_at IS NULL
`);

async function createPasswordReset({ id, userId, tokenHash, expiresAt }) {
  if (isMongo()) {
    await PasswordResetMongo.create({ id, user_id: userId, token_hash: tokenHash, expires_at: expiresAt });
    return;
  }
  insertPasswordResetStmt.run(id, userId, tokenHash, expiresAt);
}

async function findValidPasswordReset(tokenHash) {
  if (isMongo()) {
    const doc = await PasswordResetMongo.findOne({
      token_hash: tokenHash,
      used_at: null,
      expires_at: { $gt: new Date().toISOString() },
    }).lean();
    return doc || null;
  }
  return findValidPasswordResetStmt.get(tokenHash) ?? null;
}

async function markPasswordResetUsed(id) {
  if (isMongo()) {
    await PasswordResetMongo.updateOne({ id }, { used_at: new Date().toISOString() });
    return;
  }
  markPasswordResetUsedStmt.run(id);
}

async function invalidateUserPasswordResets(userId) {
  if (isMongo()) {
    await PasswordResetMongo.updateMany({ user_id: userId, used_at: null }, { used_at: new Date().toISOString() });
    return;
  }
  invalidateUserPasswordResetsStmt.run(userId);
}

/* =====================================================
   FOCUS SESSIONS QUERIES
===================================================== */

const insertFocusSessionStmt = db.prepare(`
  INSERT INTO focus_sessions (id, user_id, date, seconds, mode)
  VALUES (?, ?, ?, ?, ?)
`);

const focusSessionsForUserSinceStmt = db.prepare(`
  SELECT date, SUM(seconds) AS seconds, COUNT(*) AS sessions
  FROM focus_sessions
  WHERE user_id = ? AND date >= ?
  GROUP BY date
  ORDER BY date ASC
`);

const focusAllTimeForUserStmt = db.prepare(`
  SELECT COALESCE(SUM(seconds), 0) AS seconds, COUNT(*) AS sessions
  FROM focus_sessions
  WHERE user_id = ?
`);

const focusDistinctDatesForUserStmt = db.prepare(`
  SELECT DISTINCT date FROM focus_sessions WHERE user_id = ? ORDER BY date DESC
`);

async function createFocusSession({ id, userId, date, seconds, mode }) {
  if (isMongo()) {
    await FocusSessionMongo.create({ id, user_id: userId, date, seconds, mode: mode ?? "timer" });
    return;
  }
  insertFocusSessionStmt.run(id, userId, date, seconds, mode ?? "timer");
}

async function getFocusHistorySince(userId, sinceDate) {
  if (isMongo()) {
    const docs = await FocusSessionMongo.aggregate([
      { $match: { user_id: userId, date: { $gte: sinceDate } } },
      { $group: { _id: "$date", seconds: { $sum: "$seconds" }, sessions: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return docs.map((d) => ({ date: d._id, seconds: d.seconds, sessions: d.sessions }));
  }
  return focusSessionsForUserSinceStmt.all(userId, sinceDate);
}

async function getFocusAllTime(userId) {
  if (isMongo()) {
    const docs = await FocusSessionMongo.aggregate([
      { $match: { user_id: userId } },
      { $group: { _id: null, seconds: { $sum: "$seconds" }, sessions: { $sum: 1 } } },
    ]);
    if (docs.length === 0) return { seconds: 0, sessions: 0 };
    return { seconds: docs[0].seconds, sessions: docs[0].sessions };
  }
  return focusAllTimeForUserStmt.get(userId);
}

async function getFocusDistinctDates(userId) {
  if (isMongo()) {
    const dates = await FocusSessionMongo.distinct("date", { user_id: userId });
    return dates.sort().reverse();
  }
  return focusDistinctDatesForUserStmt.all(userId).map((r) => r.date);
}

/* =====================================================
   SUBJECTS QUERIES
===================================================== */

const insertSubjectStmt = db.prepare(`
  INSERT INTO subjects (id, user_id, name, icon, topics_count, progress_pct)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const subjectsForUserStmt = db.prepare(`
  SELECT * FROM subjects WHERE user_id = ? ORDER BY created_at ASC
`);

const subjectByIdStmt = db.prepare(`
  SELECT * FROM subjects WHERE id = ? AND user_id = ?
`);

const deleteSubjectStmt = db.prepare(`
  DELETE FROM subjects WHERE id = ? AND user_id = ?
`);

const updateSubjectProgressStmt = db.prepare(`
  UPDATE subjects SET progress_pct = ? WHERE id = ? AND user_id = ?
`);

async function createSubject({ id, userId, name, icon, topicsCount, progressPct }) {
  if (isMongo()) {
    await SubjectMongo.create({ id, user_id: userId, name, icon: icon ?? "📘", topics_count: topicsCount ?? 0, progress_pct: progressPct ?? 0 });
    return;
  }
  insertSubjectStmt.run(id, userId, name, icon ?? "📘", topicsCount ?? 0, progressPct ?? 0);
}

async function getSubjectsForUser(userId) {
  if (isMongo()) {
    return await SubjectMongo.find({ user_id: userId }).sort({ created_at: 1 }).lean();
  }
  return subjectsForUserStmt.all(userId);
}

async function getSubjectById(id, userId) {
  if (isMongo()) {
    const doc = await SubjectMongo.findOne({ id, user_id: userId }).lean();
    return doc || null;
  }
  return subjectByIdStmt.get(id, userId) ?? null;
}

async function deleteSubject(id, userId) {
  if (isMongo()) {
    const res = await SubjectMongo.deleteOne({ id, user_id: userId });
    return res.deletedCount > 0;
  }
  return deleteSubjectStmt.run(id, userId).changes > 0;
}

async function updateSubjectProgress(id, userId, progressPct) {
  if (isMongo()) {
    await SubjectMongo.updateOne({ id, user_id: userId }, { progress_pct: progressPct });
    return;
  }
  updateSubjectProgressStmt.run(progressPct, id, userId);
}

/* =====================================================
   TASKS QUERIES
===================================================== */

const insertTaskStmt = db.prepare(`
  INSERT INTO tasks (id, user_id, subject_id, title, duration_min, priority, date, completed)
  VALUES (?, ?, ?, ?, ?, ?, ?, 0)
`);

const tasksForUserByDateStmt = db.prepare(`
  SELECT * FROM tasks WHERE user_id = ? AND date = ? ORDER BY created_at ASC
`);

const taskByIdStmt = db.prepare(`
  SELECT * FROM tasks WHERE id = ? AND user_id = ?
`);

const setTaskCompletedStmt = db.prepare(`
  UPDATE tasks SET completed = ? WHERE id = ? AND user_id = ?
`);

const deleteTaskStmt = db.prepare(`
  DELETE FROM tasks WHERE id = ? AND user_id = ?
`);

const completedTasksCountForUserStmt = db.prepare(`
  SELECT COUNT(*) AS count FROM tasks WHERE user_id = ? AND completed = 1
`);

const taskCountsSinceStmt = db.prepare(`
  SELECT date, SUM(completed) AS completed, COUNT(*) AS total
  FROM tasks
  WHERE user_id = ? AND date >= ?
  GROUP BY date
`);

async function createTask({ id, userId, subjectId, title, durationMin, priority, date }) {
  if (isMongo()) {
    await TaskMongo.create({
      id,
      user_id: userId,
      subject_id: subjectId ?? null,
      title,
      duration_min: durationMin ?? 30,
      priority: priority ?? "medium",
      date,
      completed: 0,
    });
    return;
  }
  insertTaskStmt.run(id, userId, subjectId ?? null, title, durationMin ?? 30, priority ?? "medium", date);
}

async function getTasksForUserByDate(userId, date) {
  if (isMongo()) {
    return await TaskMongo.find({ user_id: userId, date }).sort({ created_at: 1 }).lean();
  }
  return tasksForUserByDateStmt.all(userId, date);
}

async function getTaskById(id, userId) {
  if (isMongo()) {
    const doc = await TaskMongo.findOne({ id, user_id: userId }).lean();
    return doc || null;
  }
  return taskByIdStmt.get(id, userId) ?? null;
}

async function setTaskCompleted(id, userId, completed) {
  if (isMongo()) {
    const res = await TaskMongo.updateOne({ id, user_id: userId }, { completed: completed ? 1 : 0 });
    return res.modifiedCount > 0;
  }
  return setTaskCompletedStmt.run(completed ? 1 : 0, id, userId).changes > 0;
}

async function deleteTask(id, userId) {
  if (isMongo()) {
    const res = await TaskMongo.deleteOne({ id, user_id: userId });
    return res.deletedCount > 0;
  }
  return deleteTaskStmt.run(id, userId).changes > 0;
}

async function getCompletedTasksCount(userId) {
  if (isMongo()) {
    return await TaskMongo.countDocuments({ user_id: userId, completed: 1 });
  }
  return completedTasksCountForUserStmt.get(userId).count;
}

async function getTaskCountsSince(userId, sinceDate) {
  if (isMongo()) {
    const docs = await TaskMongo.aggregate([
      { $match: { user_id: userId, date: { $gte: sinceDate } } },
      { $group: { _id: "$date", completed: { $sum: "$completed" }, total: { $sum: 1 } } },
    ]);
    return docs.map((d) => ({ date: d._id, completed: d.completed, total: d.total }));
  }
  return taskCountsSinceStmt.all(userId, sinceDate);
}

/* =====================================================
   COURSE + LESSON QUERIES
===================================================== */

const insertCourseStmt = db.prepare(`
  INSERT INTO courses (id, teacher_id, title, category, level, description, thumbnail, instructor)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateCourseStmt = db.prepare(`
  UPDATE courses SET title = ?, category = ?, level = ?, description = ?, thumbnail = ?
  WHERE id = ? AND teacher_id = ?
`);

const allCoursesStmt = db.prepare(`
  SELECT * FROM courses ORDER BY created_at DESC
`);

const coursesByTeacherStmt = db.prepare(`
  SELECT * FROM courses WHERE teacher_id = ? ORDER BY created_at DESC
`);

const courseByIdStmt = db.prepare(`
  SELECT * FROM courses WHERE id = ?
`);

const insertLessonStmt = db.prepare(`
  INSERT INTO lessons (id, course_id, position, title, description, video_id, duration)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const lessonsForCourseStmt = db.prepare(`
  SELECT * FROM lessons WHERE course_id = ? ORDER BY position ASC
`);

const lessonByIdStmt = db.prepare(`
  SELECT * FROM lessons WHERE id = ? AND course_id = ?
`);

const deleteLessonsForCourseStmt = db.prepare(`
  DELETE FROM lessons WHERE course_id = ?
`);

const deleteLessonByIdStmt = db.prepare(`
  DELETE FROM lessons WHERE id = ? AND course_id = ?
`);

const updateLessonRowStmt = db.prepare(`
  UPDATE lessons SET position = ?, title = ?, description = ?, video_id = ?, duration = ?
  WHERE id = ? AND course_id = ?
`);

const deleteCourseStmt = db.prepare(`
  DELETE FROM courses WHERE id = ? AND teacher_id = ?
`);

async function createCourse({ id, teacherId, title, category, level, description, thumbnail, instructor }) {
  if (isMongo()) {
    await CourseMongo.create({
      id,
      teacher_id: teacherId,
      title,
      category: category ?? null,
      level: level ?? null,
      description: description ?? null,
      thumbnail: thumbnail ?? null,
      instructor: instructor ?? null,
    });
    return;
  }
  insertCourseStmt.run(id, teacherId, title, category ?? null, level ?? null, description ?? null, thumbnail ?? null, instructor ?? null);
}

async function updateCourseRow(id, teacherId, { title, category, level, description, thumbnail }) {
  if (isMongo()) {
    const res = await CourseMongo.updateOne(
      { id, teacher_id: teacherId },
      { title, category: category ?? null, level: level ?? null, description: description ?? null, thumbnail: thumbnail ?? null }
    );
    return res.modifiedCount > 0;
  }
  return updateCourseStmt.run(title, category ?? null, level ?? null, description ?? null, thumbnail ?? null, id, teacherId).changes > 0;
}

async function getAllCourses() {
  if (isMongo()) {
    return await CourseMongo.find().sort({ created_at: -1 }).lean();
  }
  return allCoursesStmt.all();
}

async function getCoursesByTeacher(teacherId) {
  if (isMongo()) {
    return await CourseMongo.find({ teacher_id: teacherId }).sort({ created_at: -1 }).lean();
  }
  return coursesByTeacherStmt.all(teacherId);
}

async function getCourseById(id) {
  if (isMongo()) {
    const doc = await CourseMongo.findOne({ id }).lean();
    return doc || null;
  }
  return courseByIdStmt.get(id) ?? null;
}

async function createLesson({ id, courseId, position, title, description, videoId, duration }) {
  if (isMongo()) {
    await LessonMongo.create({
      id,
      course_id: courseId,
      position,
      title,
      description: description ?? null,
      video_id: videoId ?? null,
      duration: duration ?? null,
    });
    return;
  }
  insertLessonStmt.run(id, courseId, position, title, description ?? null, videoId ?? null, duration ?? null);
}

async function getLessonsForCourse(courseId) {
  if (isMongo()) {
    return await LessonMongo.find({ course_id: courseId }).sort({ position: 1 }).lean();
  }
  return lessonsForCourseStmt.all(courseId);
}

async function getLessonById(id, courseId) {
  if (isMongo()) {
    const doc = await LessonMongo.findOne({ id, course_id: courseId }).lean();
    return doc || null;
  }
  return lessonByIdStmt.get(id, courseId) ?? null;
}

async function replaceLessonsForCourse(courseId, lessons) {
  const existingLessons = await getLessonsForCourse(courseId);
  const existingIds = new Set(existingLessons.map((l) => l.id));
  const keepIds = new Set();

  for (let index = 0; index < lessons.length; index++) {
    const lesson = lessons[index];
    const id = lesson.id && existingIds.has(lesson.id) ? lesson.id : crypto.randomUUID();
    keepIds.add(id);

    if (existingIds.has(id)) {
      if (isMongo()) {
        await LessonMongo.updateOne(
          { id, course_id: courseId },
          { position: index, title: lesson.title, description: lesson.description ?? null, video_id: lesson.videoId ?? null, duration: lesson.duration ?? null }
        );
      } else {
        updateLessonRowStmt.run(index, lesson.title, lesson.description ?? null, lesson.videoId ?? null, lesson.duration ?? null, id, courseId);
      }
    } else {
      if (isMongo()) {
        await LessonMongo.create({
          id,
          course_id: courseId,
          position: index,
          title: lesson.title,
          description: lesson.description ?? null,
          video_id: lesson.videoId ?? null,
          duration: lesson.duration ?? null,
        });
      } else {
        insertLessonStmt.run(id, courseId, index, lesson.title, lesson.description ?? null, lesson.videoId ?? null, lesson.duration ?? null);
      }
    }
  }

  for (const existingId of existingIds) {
    if (!keepIds.has(existingId)) {
      if (isMongo()) {
        await LessonMongo.deleteOne({ id: existingId, course_id: courseId });
      } else {
        deleteLessonByIdStmt.run(existingId, courseId);
      }
    }
  }
}

async function deleteCourse(id, teacherId) {
  if (isMongo()) {
    const res = await CourseMongo.deleteOne({ id, teacher_id: teacherId });
    if (res.deletedCount > 0) {
      await LessonMongo.deleteMany({ course_id: id });
      await LessonTaskMongo.deleteMany({ course_id: id });
      await EnrollmentMongo.deleteMany({ course_id: id });
      await SubmissionMongo.deleteMany({ course_id: id });
      await LessonCompletionMongo.deleteMany({ course_id: id });
      return true;
    }
    return false;
  }
  return deleteCourseStmt.run(id, teacherId).changes > 0;
}

/* =====================================================
   ENROLLMENT QUERIES
===================================================== */

const insertEnrollmentStmt = db.prepare(`
  INSERT OR IGNORE INTO enrollments (id, course_id, student_id)
  VALUES (?, ?, ?)
`);

const enrollmentStmt = db.prepare(`
  SELECT * FROM enrollments WHERE course_id = ? AND student_id = ?
`);

const enrollmentsForStudentStmt = db.prepare(`
  SELECT * FROM enrollments WHERE student_id = ? ORDER BY enrolled_at DESC
`);

const enrollmentsForCourseStmt = db.prepare(`
  SELECT e.*, u.name AS student_name, u.email AS student_email, u.student_class AS student_class
  FROM enrollments e
  JOIN users u ON u.id = e.student_id
  WHERE e.course_id = ?
  ORDER BY e.enrolled_at DESC
`);

const enrollmentCountForCourseStmt = db.prepare(`
  SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ?
`);

const enrollmentsForTeacherStmt = db.prepare(`
  SELECT e.*, u.name AS student_name, u.email AS student_email, u.student_class AS student_class,
         c.title AS course_title, c.id AS course_id
  FROM enrollments e
  JOIN users u ON u.id = e.student_id
  JOIN courses c ON c.id = e.course_id
  WHERE c.teacher_id = ?
  ORDER BY e.enrolled_at DESC
`);

async function createEnrollment({ id, courseId, studentId }) {
  if (isMongo()) {
    await EnrollmentMongo.updateOne({ course_id: courseId, student_id: studentId }, { $setOnInsert: { id } }, { upsert: true });
    return;
  }
  insertEnrollmentStmt.run(id, courseId, studentId);
}

async function getEnrollment(courseId, studentId) {
  if (isMongo()) {
    const doc = await EnrollmentMongo.findOne({ course_id: courseId, student_id: studentId }).lean();
    return doc || null;
  }
  return enrollmentStmt.get(courseId, studentId) ?? null;
}

async function getEnrollmentsForStudent(studentId) {
  if (isMongo()) {
    return await EnrollmentMongo.find({ student_id: studentId }).sort({ enrolled_at: -1 }).lean();
  }
  return enrollmentsForStudentStmt.all(studentId);
}

async function getEnrollmentsForCourse(courseId) {
  if (isMongo()) {
    const enrollments = await EnrollmentMongo.find({ course_id: courseId }).sort({ enrolled_at: -1 }).lean();
    const result = [];
    for (const e of enrollments) {
      const user = await UserMongo.findOne({ id: e.student_id }).lean();
      result.push({
        ...e,
        student_name: user?.name || "Student",
        student_email: user?.email || "",
        student_class: user?.student_class || null,
      });
    }
    return result;
  }
  return enrollmentsForCourseStmt.all(courseId);
}

async function getEnrollmentCountForCourse(courseId) {
  if (isMongo()) {
    return await EnrollmentMongo.countDocuments({ course_id: courseId });
  }
  return enrollmentCountForCourseStmt.get(courseId).count;
}

async function getEnrollmentsForTeacher(teacherId) {
  if (isMongo()) {
    const teacherCourses = await CourseMongo.find({ teacher_id: teacherId }).lean();
    const courseIds = teacherCourses.map((c) => c.id);
    const courseMap = new Map(teacherCourses.map((c) => [c.id, c.title]));

    const enrollments = await EnrollmentMongo.find({ course_id: { $in: courseIds } }).sort({ enrolled_at: -1 }).lean();

    const result = [];
    for (const e of enrollments) {
      const user = await UserMongo.findOne({ id: e.student_id }).lean();
      result.push({
        ...e,
        student_name: user?.name || "Student",
        student_email: user?.email || "",
        student_class: user?.student_class || null,
        course_title: courseMap.get(e.course_id) || "Course",
      });
    }
    return result;
  }
  return enrollmentsForTeacherStmt.all(teacherId);
}

/* =====================================================
   SUBMISSION QUERIES
===================================================== */

const insertSubmissionStmt = db.prepare(`
  INSERT INTO submissions (id, lesson_id, course_id, student_id, file_name, file_data, status, remark, submitted_at, evaluated_at)
  VALUES (?, ?, ?, ?, ?, ?, 'submitted', NULL, datetime('now'), NULL)
  ON CONFLICT (lesson_id, student_id) DO UPDATE SET
    file_name = excluded.file_name,
    file_data = excluded.file_data,
    status = 'submitted',
    remark = NULL,
    submitted_at = datetime('now'),
    evaluated_at = NULL
`);

const submissionStmt = db.prepare(`
  SELECT * FROM submissions WHERE lesson_id = ? AND student_id = ?
`);

const submissionByIdStmt = db.prepare(`
  SELECT * FROM submissions WHERE id = ?
`);

const submissionsForCourseStudentStmt = db.prepare(`
  SELECT * FROM submissions WHERE course_id = ? AND student_id = ?
`);

const submissionsForCourseStmt = db.prepare(`
  SELECT s.*, u.name AS student_name, u.email AS student_email, u.student_class AS student_class,
         l.title AS lesson_title, l.position AS lesson_position
  FROM submissions s
  JOIN users u ON u.id = s.student_id
  JOIN lessons l ON l.id = s.lesson_id
  WHERE s.course_id = ?
  ORDER BY s.submitted_at DESC
`);

const evaluateSubmissionStmt = db.prepare(`
  UPDATE submissions SET status = ?, remark = ?, evaluated_at = datetime('now')
  WHERE id = ?
`);

async function upsertSubmission({ id, lessonId, courseId, studentId, fileName, fileData }) {
  if (isMongo()) {
    await SubmissionMongo.updateOne(
      { lesson_id: lessonId, student_id: studentId },
      {
        $set: {
          course_id: courseId,
          file_name: fileName,
          file_data: fileData,
          status: "submitted",
          remark: null,
          submitted_at: new Date().toISOString(),
          evaluated_at: null,
        },
        $setOnInsert: { id },
      },
      { upsert: true }
    );
    const doc = await SubmissionMongo.findOne({ lesson_id: lessonId, student_id: studentId }).lean();
    return doc;
  }
  insertSubmissionStmt.run(id, lessonId, courseId, studentId, fileName, fileData);
  return submissionStmt.get(lessonId, studentId);
}

async function getSubmission(lessonId, studentId) {
  if (isMongo()) {
    const doc = await SubmissionMongo.findOne({ lesson_id: lessonId, student_id: studentId }).lean();
    return doc || null;
  }
  return submissionStmt.get(lessonId, studentId) ?? null;
}

async function getSubmissionById(id) {
  if (isMongo()) {
    const doc = await SubmissionMongo.findOne({ id }).lean();
    return doc || null;
  }
  return submissionByIdStmt.get(id) ?? null;
}

async function getSubmissionsForCourseStudent(courseId, studentId) {
  if (isMongo()) {
    return await SubmissionMongo.find({ course_id: courseId, student_id: studentId }).lean();
  }
  return submissionsForCourseStudentStmt.all(courseId, studentId);
}

async function getSubmissionsForCourse(courseId) {
  if (isMongo()) {
    const submissions = await SubmissionMongo.find({ course_id: courseId }).sort({ submitted_at: -1 }).lean();
    const result = [];
    for (const s of submissions) {
      const user = await UserMongo.findOne({ id: s.student_id }).lean();
      const lesson = await LessonMongo.findOne({ id: s.lesson_id }).lean();
      result.push({
        ...s,
        student_name: user?.name || "Student",
        student_email: user?.email || "",
        student_class: user?.student_class || null,
        lesson_title: lesson?.title || "Lesson",
        lesson_position: lesson?.position ?? 0,
      });
    }
    return result;
  }
  return submissionsForCourseStmt.all(courseId);
}

async function evaluateSubmission(id, status, remark) {
  if (isMongo()) {
    const res = await SubmissionMongo.updateOne({ id }, { status, remark: remark ?? null, evaluated_at: new Date().toISOString() });
    return res.modifiedCount > 0;
  }
  return evaluateSubmissionStmt.run(status, remark ?? null, id).changes > 0;
}

/* =====================================================
   LESSON TASK QUERIES
===================================================== */

const upsertLessonTaskStmt = db.prepare(`
  INSERT INTO lesson_tasks (id, lesson_id, course_id, teacher_id, title, instructions, file_name, file_data, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT (lesson_id) DO UPDATE SET
    title = excluded.title,
    instructions = excluded.instructions,
    file_name = COALESCE(excluded.file_name, lesson_tasks.file_name),
    file_data = COALESCE(excluded.file_data, lesson_tasks.file_data),
    updated_at = datetime('now')
`);

const lessonTaskByLessonStmt = db.prepare(`
  SELECT * FROM lesson_tasks WHERE lesson_id = ?
`);

const lessonTasksForCourseStmt = db.prepare(`
  SELECT * FROM lesson_tasks WHERE course_id = ?
`);

const deleteLessonTaskStmt = db.prepare(`
  DELETE FROM lesson_tasks WHERE lesson_id = ? AND course_id = ? AND teacher_id = ?
`);

async function upsertLessonTask({ id, lessonId, courseId, teacherId, title, instructions, fileName, fileData }) {
  if (isMongo()) {
    const updateFields = {
      course_id: courseId,
      teacher_id: teacherId,
      title,
      instructions: instructions ?? "",
      updated_at: new Date().toISOString(),
    };
    if (fileName) updateFields.file_name = fileName;
    if (fileData) updateFields.file_data = fileData;

    await LessonTaskMongo.updateOne({ lesson_id: lessonId }, { $set: updateFields, $setOnInsert: { id } }, { upsert: true });
    const doc = await LessonTaskMongo.findOne({ lesson_id: lessonId }).lean();
    return doc;
  }
  upsertLessonTaskStmt.run(id, lessonId, courseId, teacherId, title, instructions ?? null, fileName ?? null, fileData ?? null);
  return lessonTaskByLessonStmt.get(lessonId);
}

async function getLessonTaskByLesson(lessonId) {
  if (isMongo()) {
    const doc = await LessonTaskMongo.findOne({ lesson_id: lessonId }).lean();
    return doc || null;
  }
  return lessonTaskByLessonStmt.get(lessonId) ?? null;
}

async function getLessonTasksForCourse(courseId) {
  if (isMongo()) {
    return await LessonTaskMongo.find({ course_id: courseId }).lean();
  }
  return lessonTasksForCourseStmt.all(courseId);
}

async function deleteLessonTask(lessonId, courseId, teacherId) {
  if (isMongo()) {
    const res = await LessonTaskMongo.deleteOne({ lesson_id: lessonId, course_id: courseId, teacher_id: teacherId });
    return res.deletedCount > 0;
  }
  return deleteLessonTaskStmt.run(lessonId, courseId, teacherId).changes > 0;
}

/* =====================================================
   LESSON COMPLETION QUERIES
===================================================== */

const insertLessonCompletionStmt = db.prepare(`
  INSERT OR IGNORE INTO lesson_completions (id, lesson_id, course_id, student_id)
  VALUES (?, ?, ?, ?)
`);

const deleteLessonCompletionStmt = db.prepare(`
  DELETE FROM lesson_completions WHERE lesson_id = ? AND student_id = ?
`);

const lessonCompletionsForCourseStudentStmt = db.prepare(`
  SELECT * FROM lesson_completions WHERE course_id = ? AND student_id = ?
`);

async function setLessonCompleted(lessonId, courseId, studentId, completed) {
  if (isMongo()) {
    if (completed) {
      await LessonCompletionMongo.updateOne(
        { lesson_id: lessonId, student_id: studentId },
        { $setOnInsert: { id: crypto.randomUUID(), course_id: courseId } },
        { upsert: true }
      );
    } else {
      await LessonCompletionMongo.deleteOne({ lesson_id: lessonId, student_id: studentId });
    }
    return;
  }

  if (completed) {
    insertLessonCompletionStmt.run(crypto.randomUUID(), lessonId, courseId, studentId);
  } else {
    deleteLessonCompletionStmt.run(lessonId, studentId);
  }
}

async function getLessonCompletionsForCourseStudent(courseId, studentId) {
  if (isMongo()) {
    return await LessonCompletionMongo.find({ course_id: courseId, student_id: studentId }).lean();
  }
  return lessonCompletionsForCourseStudentStmt.all(courseId, studentId);
}

const lessonCompletionDistinctDatesStmt = db.prepare(`
  SELECT DISTINCT substr(completed_at, 1, 10) as date FROM lesson_completions WHERE student_id = ? ORDER BY date ASC
`);

async function getLessonCompletionDistinctDates(studentId) {
  if (isMongo()) {
    const list = await LessonCompletionMongo.find({ student_id: studentId }).lean();
    const dates = list.map((c) => String(c.completed_at || "").slice(0, 10)).filter(Boolean);
    return Array.from(new Set(dates)).sort();
  }
  const rows = lessonCompletionDistinctDatesStmt.all(studentId);
  return rows.map((r) => r.date).filter(Boolean);
}

module.exports = {
  db,
  createUser,
  findUserByEmail,
  findUserById,
  toPublicUser,
  updateUserPassword,
  updateUserClass,
  updateUserAvatar,
  getTopTeachers,

  createPasswordReset,
  findValidPasswordReset,
  markPasswordResetUsed,
  invalidateUserPasswordResets,

  createFocusSession,
  getFocusHistorySince,
  getFocusAllTime,
  getFocusDistinctDates,

  createSubject,
  getSubjectsForUser,
  getSubjectById,
  deleteSubject,
  updateSubjectProgress,

  createTask,
  getTasksForUserByDate,
  getTaskById,
  setTaskCompleted,
  deleteTask,
  getCompletedTasksCount,
  getTaskCountsSince,

  createCourse,
  updateCourseRow,
  getAllCourses,
  getCoursesByTeacher,
  getCourseById,
  createLesson,
  getLessonsForCourse,
  getLessonById,
  replaceLessonsForCourse,
  deleteCourse,

  createEnrollment,
  getEnrollment,
  getEnrollmentsForStudent,
  getEnrollmentsForCourse,
  getEnrollmentCountForCourse,
  getEnrollmentsForTeacher,

  upsertSubmission,
  getSubmission,
  getSubmissionById,
  getSubmissionsForCourseStudent,
  getSubmissionsForCourse,
  evaluateSubmission,

  upsertLessonTask,
  getLessonTaskByLesson,
  getLessonTasksForCourse,
  deleteLessonTask,

  setLessonCompleted,
  getLessonCompletionsForCourseStudent,
  getLessonCompletionDistinctDates,
};

/* =====================================================
   COMMUNITY / POSTS & COMMENTS
===================================================== */
async function createPost({ authorId, content, mediaUrl, mediaType }) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  if (isMongo()) {
    const post = await PostMongo.create({
      id,
      author_id: authorId,
      content: content || "",
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      created_at: createdAt,
    });
    return post.toObject();
  }
  const stmt = db.prepare(`
    INSERT INTO posts (id, author_id, content, media_url, media_type, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, authorId, content || "", mediaUrl || null, mediaType || null, createdAt);
  return { id, author_id: authorId, content: content || "", media_url: mediaUrl || null, media_type: mediaType || null, created_at: createdAt };
}

async function getAllPosts(currentUserId = null) {
  if (isMongo()) {
    const posts = await PostMongo.find().sort({ created_at: -1 }).lean();
    const result = [];
    for (const p of posts) {
      const authorDoc = await UserMongo.findOne({ id: p.author_id }).lean();
      const commentsCount = await PostCommentMongo.countDocuments({ post_id: p.id });
      let isSaved = false;
      if (currentUserId) {
        const savedDoc = await SavedPostMongo.findOne({ user_id: currentUserId, post_id: p.id });
        isSaved = Boolean(savedDoc);
      }
      result.push({
        ...p,
        author: authorDoc ? toPublicUser(authorDoc) : null,
        commentsCount,
        isSaved,
      });
    }
    return result;
  }

  const rows = db.prepare(`
    SELECT p.*,
      u.name as author_name, u.avatar as author_avatar, u.role as author_role, u.expertise as author_expertise,
      (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as commentsCount,
      EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) as isSaved
    FROM posts p
    JOIN users u ON p.author_id = u.id
    ORDER BY p.created_at DESC
  `).all(currentUserId || "");

  return rows.map((r) => ({
    id: r.id,
    author_id: r.author_id,
    content: r.content,
    media_url: r.media_url,
    media_type: r.media_type,
    created_at: r.created_at,
    author: {
      id: r.author_id,
      name: r.author_name,
      avatar: r.author_avatar,
      role: r.author_role,
      expertise: r.author_expertise,
    },
    commentsCount: Number(r.commentsCount || 0),
    isSaved: Boolean(r.isSaved),
  }));
}

async function getPostById(postId, currentUserId = null) {
  if (isMongo()) {
    const p = await PostMongo.findOne({ id: postId }).lean();
    if (!p) return null;
    const authorDoc = await UserMongo.findOne({ id: p.author_id }).lean();
    const commentsCount = await PostCommentMongo.countDocuments({ post_id: p.id });
    let isSaved = false;
    if (currentUserId) {
      const savedDoc = await SavedPostMongo.findOne({ user_id: currentUserId, post_id: p.id });
      isSaved = Boolean(savedDoc);
    }
    return {
      ...p,
      author: authorDoc ? toPublicUser(authorDoc) : null,
      commentsCount,
      isSaved,
    };
  }

  const r = db.prepare(`
    SELECT p.*,
      u.name as author_name, u.avatar as author_avatar, u.role as author_role, u.expertise as author_expertise,
      (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as commentsCount,
      EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) as isSaved
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.id = ?
  `).get(currentUserId || "", postId);

  if (!r) return null;
  return {
    id: r.id,
    author_id: r.author_id,
    content: r.content,
    media_url: r.media_url,
    media_type: r.media_type,
    created_at: r.created_at,
    author: {
      id: r.author_id,
      name: r.author_name,
      avatar: r.author_avatar,
      role: r.author_role,
      expertise: r.author_expertise,
    },
    commentsCount: Number(r.commentsCount || 0),
    isSaved: Boolean(r.isSaved),
  };
}

async function addPostComment({ postId, userId, content }) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  if (isMongo()) {
    await PostCommentMongo.create({
      id,
      post_id: postId,
      user_id: userId,
      content,
      created_at: createdAt,
    });
  } else {
    db.prepare(`
      INSERT INTO post_comments (id, post_id, user_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, postId, userId, content, createdAt);
  }
  const user = await findUserById(userId);
  return {
    id,
    post_id: postId,
    user_id: userId,
    content,
    created_at: createdAt,
    user: user ? toPublicUser(user) : null,
  };
}

async function getPostComments(postId) {
  if (isMongo()) {
    const comments = await PostCommentMongo.find({ post_id: postId }).sort({ created_at: 1 }).lean();
    const result = [];
    for (const c of comments) {
      const u = await UserMongo.findOne({ id: c.user_id }).lean();
      result.push({
        ...c,
        user: u ? toPublicUser(u) : null,
      });
    }
    return result;
  }
  const rows = db.prepare(`
    SELECT pc.*, u.name as user_name, u.avatar as user_avatar, u.role as user_role
    FROM post_comments pc
    JOIN users u ON pc.user_id = u.id
    WHERE pc.post_id = ?
    ORDER BY pc.created_at ASC
  `).all(postId);
  return rows.map((r) => ({
    id: r.id,
    post_id: r.post_id,
    user_id: r.user_id,
    content: r.content,
    created_at: r.created_at,
    user: {
      id: r.user_id,
      name: r.user_name,
      avatar: r.user_avatar,
      role: r.user_role,
    },
  }));
}

async function toggleSavePost(userId, postId) {
  if (isMongo()) {
    const existing = await SavedPostMongo.findOne({ user_id: userId, post_id: postId });
    if (existing) {
      await SavedPostMongo.deleteOne({ user_id: userId, post_id: postId });
      return { isSaved: false };
    } else {
      await SavedPostMongo.create({ id: crypto.randomUUID(), user_id: userId, post_id: postId });
      return { isSaved: true };
    }
  }
  const existing = db.prepare(`SELECT id FROM saved_posts WHERE user_id = ? AND post_id = ?`).get(userId, postId);
  if (existing) {
    db.prepare(`DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?`).run(userId, postId);
    return { isSaved: false };
  } else {
    db.prepare(`INSERT INTO saved_posts (id, user_id, post_id) VALUES (?, ?, ?)`).run(crypto.randomUUID(), userId, postId);
    return { isSaved: true };
  }
}

async function getSavedPosts(userId) {
  if (isMongo()) {
    const saved = await SavedPostMongo.find({ user_id: userId }).lean();
    const postIds = saved.map((s) => s.post_id);
    const result = [];
    for (const pid of postIds) {
      const p = await getPostById(pid, userId);
      if (p) result.push(p);
    }
    return result;
  }
  const rows = db.prepare(`
    SELECT post_id FROM saved_posts WHERE user_id = ? ORDER BY saved_at DESC
  `).all(userId);
  const result = [];
  for (const r of rows) {
    const p = await getPostById(r.post_id, userId);
    if (p) result.push(p);
  }
  return result;
}

async function getUserPosts(userId) {
  if (isMongo()) {
    const posts = await PostMongo.find({ author_id: userId }).sort({ created_at: -1 }).lean();
    const result = [];
    for (const p of posts) {
      const authorDoc = await UserMongo.findOne({ id: p.author_id }).lean();
      const commentsCount = await PostCommentMongo.countDocuments({ post_id: p.id });
      let isSaved = false;
      if (userId) {
        const savedDoc = await SavedPostMongo.findOne({ user_id: userId, post_id: p.id });
        isSaved = Boolean(savedDoc);
      }
      result.push({
        ...p,
        author: authorDoc ? toPublicUser(authorDoc) : null,
        commentsCount,
        isSaved,
      });
    }
    return result;
  }

  const rows = db.prepare(`
    SELECT p.*,
      u.name as author_name, u.avatar as author_avatar, u.role as author_role, u.expertise as author_expertise,
      (SELECT COUNT(*) FROM post_comments pc WHERE pc.post_id = p.id) as commentsCount,
      EXISTS(SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?) as isSaved
    FROM posts p
    JOIN users u ON p.author_id = u.id
    WHERE p.author_id = ?
    ORDER BY p.created_at DESC
  `).all(userId || "", userId || "");

  return rows.map((r) => ({
    id: r.id,
    author_id: r.author_id,
    content: r.content,
    media_url: r.media_url,
    media_type: r.media_type,
    created_at: r.created_at,
    author: {
      id: r.author_id,
      name: r.author_name,
      avatar: r.author_avatar,
      role: r.author_role,
      expertise: r.author_expertise,
    },
    commentsCount: Number(r.commentsCount || 0),
    isSaved: Boolean(r.isSaved),
  }));
}

async function updatePost({ id, authorId, content, mediaUrl, mediaType }) {
  if (isMongo()) {
    const post = await PostMongo.findOne({ id, author_id: authorId });
    if (!post) return null;
    if (content !== undefined) post.content = content || "";
    if (mediaUrl !== undefined) post.media_url = mediaUrl || null;
    if (mediaType !== undefined) post.media_type = mediaType || null;
    await post.save();
    return getPostById(id, authorId);
  }

  const post = db.prepare(`SELECT * FROM posts WHERE id = ? AND author_id = ?`).get(id, authorId);
  if (!post) return null;

  const newContent = content !== undefined ? content : post.content;
  const newMediaUrl = mediaUrl !== undefined ? mediaUrl : post.media_url;
  const newMediaType = mediaType !== undefined ? mediaType : post.media_type;

  db.prepare(`
    UPDATE posts
    SET content = ?, media_url = ?, media_type = ?
    WHERE id = ? AND author_id = ?
  `).run(newContent, newMediaUrl, newMediaType, id, authorId);

  return getPostById(id, authorId);
}

async function deletePost({ id, authorId }) {
  if (isMongo()) {
    const post = await PostMongo.findOne({ id, author_id: authorId });
    if (!post) return false;
    await PostMongo.deleteOne({ id });
    await PostCommentMongo.deleteMany({ post_id: id });
    await SavedPostMongo.deleteMany({ post_id: id });
    return true;
  }

  const post = db.prepare(`SELECT * FROM posts WHERE id = ? AND author_id = ?`).get(id, authorId);
  if (!post) return false;

  db.prepare(`DELETE FROM posts WHERE id = ? AND author_id = ?`).run(id, authorId);
  db.prepare(`DELETE FROM post_comments WHERE post_id = ?`).run(id);
  db.prepare(`DELETE FROM saved_posts WHERE post_id = ?`).run(id);
  return true;
}

/* =====================================================
   TEACHER FOLLOWS
===================================================== */
async function toggleFollowTeacher(studentId, teacherId) {
  const teacher = await findUserById(teacherId);
  if (!teacher || teacher.role !== "teacher") {
    throw new Error("Target user is not a teacher");
  }
  const student = await findUserById(studentId);
  if (student && student.role === "teacher") {
    throw new Error("Teachers cannot follow teachers");
  }

  if (isMongo()) {
    const existing = await TeacherFollowMongo.findOne({ student_id: studentId, teacher_id: teacherId });
    if (existing) {
      await TeacherFollowMongo.deleteOne({ student_id: studentId, teacher_id: teacherId });
      const followersCount = await TeacherFollowMongo.countDocuments({ teacher_id: teacherId });
      return { isFollowing: false, followersCount };
    } else {
      await TeacherFollowMongo.create({ id: crypto.randomUUID(), student_id: studentId, teacher_id: teacherId });
      const followersCount = await TeacherFollowMongo.countDocuments({ teacher_id: teacherId });
      return { isFollowing: true, followersCount };
    }
  }

  const existing = db.prepare(`SELECT id FROM teacher_follows WHERE student_id = ? AND teacher_id = ?`).get(studentId, teacherId);
  if (existing) {
    db.prepare(`DELETE FROM teacher_follows WHERE student_id = ? AND teacher_id = ?`).run(studentId, teacherId);
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM teacher_follows WHERE teacher_id = ?`).get(teacherId);
    return { isFollowing: false, followersCount: Number(countRow?.count || 0) };
  } else {
    db.prepare(`INSERT INTO teacher_follows (id, student_id, teacher_id) VALUES (?, ?, ?)`).run(crypto.randomUUID(), studentId, teacherId);
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM teacher_follows WHERE teacher_id = ?`).get(teacherId);
    return { isFollowing: true, followersCount: Number(countRow?.count || 0) };
  }
}

async function isFollowingTeacher(studentId, teacherId) {
  if (!studentId) return false;
  if (isMongo()) {
    const doc = await TeacherFollowMongo.findOne({ student_id: studentId, teacher_id: teacherId });
    return Boolean(doc);
  }
  const row = db.prepare(`SELECT id FROM teacher_follows WHERE student_id = ? AND teacher_id = ?`).get(studentId, teacherId);
  return Boolean(row);
}

async function getTeacherFollowersCount(teacherId) {
  if (isMongo()) {
    return await TeacherFollowMongo.countDocuments({ teacher_id: teacherId });
  }
  const row = db.prepare(`SELECT COUNT(*) as count FROM teacher_follows WHERE teacher_id = ?`).get(teacherId);
  return Number(row?.count || 0);
}

async function getCoursesFromFollowedTeachers(studentId) {
  if (isMongo()) {
    const follows = await TeacherFollowMongo.find({ student_id: studentId }).lean();
    const teacherIds = follows.map((f) => f.teacher_id);
    if (teacherIds.length === 0) return [];
    const courses = await CourseMongo.find({ teacher_id: { $in: teacherIds } }).sort({ created_at: -1 }).lean();
    const result = [];
    for (const c of courses) {
      const teacher = await UserMongo.findOne({ id: c.teacher_id }).lean();
      const lessons = await LessonMongo.find({ course_id: c.id }).lean();
      const enrolled = await EnrollmentMongo.findOne({ course_id: c.id, student_id: studentId });
      result.push({
        ...c,
        instructor: teacher ? teacher.name : c.instructor,
        teacherAvatar: teacher ? teacher.avatar : null,
        lessonsCount: lessons.length,
        isEnrolled: Boolean(enrolled),
      });
    }
    return result;
  }

  const rows = db.prepare(`
    SELECT c.*, u.name as teacher_name, u.avatar as teacher_avatar,
      (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) as lessonsCount,
      EXISTS(SELECT 1 FROM enrollments e WHERE e.course_id = c.id AND e.student_id = ?) as isEnrolled
    FROM courses c
    JOIN teacher_follows tf ON c.teacher_id = tf.teacher_id
    JOIN users u ON c.teacher_id = u.id
    WHERE tf.student_id = ?
    ORDER BY c.created_at DESC
  `).all(studentId, studentId);

  return rows.map((r) => ({
    id: r.id,
    teacher_id: r.teacher_id,
    title: r.title,
    category: r.category,
    level: r.level,
    description: r.description,
    thumbnail: r.thumbnail,
    instructor: r.teacher_name || r.instructor,
    teacherAvatar: r.teacher_avatar,
    created_at: r.created_at,
    lessonsCount: Number(r.lessonsCount || 0),
    isEnrolled: Boolean(r.isEnrolled),
  }));
}

/* =====================================================
   FRIEND REQUESTS (STUDENT TO STUDENT / GENERAL USER FRIENDS)
===================================================== */
async function sendFriendRequest(senderId, receiverId) {
  if (senderId === receiverId) {
    throw new Error("Cannot send friend request to yourself");
  }
  const sender = await findUserById(senderId);
  const receiver = await findUserById(receiverId);

  if (!sender || !receiver) {
    throw new Error("User not found");
  }

  if (sender.role === "student" && receiver.role === "teacher") {
    throw new Error("Use Teacher Follow to connect with teachers");
  }

  const existingStatus = await getFriendshipStatus(senderId, receiverId);
  if (existingStatus !== "none") {
    throw new Error(`Friend request already ${existingStatus}`);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  if (isMongo()) {
    await FriendRequestMongo.create({
      id,
      sender_id: senderId,
      receiver_id: receiverId,
      status: "pending",
      created_at: now,
      updated_at: now,
    });
  } else {
    db.prepare(`
      INSERT INTO friend_requests (id, sender_id, receiver_id, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).run(id, senderId, receiverId, now, now);
  }

  return { id, sender_id: senderId, receiver_id: receiverId, status: "pending", created_at: now };
}

async function getFriendshipStatus(user1Id, user2Id) {
  if (isMongo()) {
    const req = await FriendRequestMongo.findOne({
      $or: [
        { sender_id: user1Id, receiver_id: user2Id },
        { sender_id: user2Id, receiver_id: user1Id },
      ],
    }).lean();
    if (!req) return "none";
    if (req.status === "accepted") return "accepted";
    if (req.status === "pending") {
      return req.sender_id === user1Id ? "pending_sent" : "pending_received";
    }
    return "none";
  }

  const row = db.prepare(`
    SELECT * FROM friend_requests
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
  `).get(user1Id, user2Id, user2Id, user1Id);

  if (!row) return "none";
  if (row.status === "accepted") return "accepted";
  if (row.status === "pending") {
    return row.sender_id === user1Id ? "pending_sent" : "pending_received";
  }
  return "none";
}

async function respondFriendRequest(requestId, receiverId, status) {
  if (!["accepted", "rejected"].includes(status)) {
    throw new Error("Invalid status");
  }
  const now = new Date().toISOString();

  let reqDoc = null;
  if (isMongo()) {
    reqDoc = await FriendRequestMongo.findOne({ id: requestId, receiver_id: receiverId, status: "pending" });
    if (!reqDoc) throw new Error("Friend request not found");
    reqDoc.status = status;
    reqDoc.updated_at = now;
    await reqDoc.save();
  } else {
    reqDoc = db.prepare(`SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'`).get(requestId, receiverId);
    if (!reqDoc) throw new Error("Friend request not found");
    db.prepare(`UPDATE friend_requests SET status = ?, updated_at = ? WHERE id = ?`).run(status, now, requestId);
  }

  if (status === "accepted") {
    await getOrCreateDirectConversation(reqDoc.sender_id, reqDoc.receiver_id);
  }

  return { id: requestId, status };
}

async function getFriendRequestsForUser(userId) {
  if (isMongo()) {
    const incoming = await FriendRequestMongo.find({ receiver_id: userId, status: "pending" }).lean();
    const result = [];
    for (const req of incoming) {
      const sender = await UserMongo.findOne({ id: req.sender_id }).lean();
      result.push({
        ...req,
        sender: sender ? toPublicUser(sender) : null,
      });
    }
    return result;
  }

  const rows = db.prepare(`
    SELECT fr.*, u.name as sender_name, u.avatar as sender_avatar, u.role as sender_role
    FROM friend_requests fr
    JOIN users u ON fr.sender_id = u.id
    WHERE fr.receiver_id = ? AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
  `).all(userId);

  return rows.map((r) => ({
    id: r.id,
    sender_id: r.sender_id,
    receiver_id: r.receiver_id,
    status: r.status,
    created_at: r.created_at,
    sender: {
      id: r.sender_id,
      name: r.sender_name,
      avatar: r.sender_avatar,
      role: r.sender_role,
    },
  }));
}

async function getFriendsForUser(userId) {
  if (isMongo()) {
    const reqs = await FriendRequestMongo.find({
      $or: [
        { sender_id: userId, status: "accepted" },
        { receiver_id: userId, status: "accepted" },
      ],
    }).lean();

    const friendIds = reqs.map((r) => (r.sender_id === userId ? r.receiver_id : r.sender_id));
    const friends = await UserMongo.find({ id: { $in: friendIds } }).lean();
    return friends.map(toPublicUser);
  }

  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.avatar, u.student_class, u.expertise, u.bio
    FROM friend_requests fr
    JOIN users u ON (CASE WHEN fr.sender_id = ? THEN fr.receiver_id ELSE fr.sender_id END) = u.id
    WHERE (fr.sender_id = ? OR fr.receiver_id = ?) AND fr.status = 'accepted'
  `).all(userId, userId, userId);

  return rows;
}

async function getSuggestedFriendsForUser(userId) {
  if (isMongo()) {
    const existingReqs = await FriendRequestMongo.find({
      $or: [{ sender_id: userId }, { receiver_id: userId }],
    }).lean();
    const excludeIds = new Set([userId, ...existingReqs.map((r) => (r.sender_id === userId ? r.receiver_id : r.sender_id))]);

    const candidates = await UserMongo.find({
      id: { $nin: Array.from(excludeIds) },
      role: "student",
    })
      .limit(10)
      .lean();

    return candidates.map(toPublicUser);
  }

  const rows = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.avatar, u.student_class, u.expertise, u.bio
    FROM users u
    WHERE u.role = 'student'
      AND u.id != ?
      AND u.id NOT IN (
        SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
        FROM friend_requests
        WHERE sender_id = ? OR receiver_id = ?
      )
    LIMIT 10
  `).all(userId, userId, userId, userId);

  return rows;
}

/* =====================================================
   CONVERSATIONS & MESSAGING & GROUPS
===================================================== */
async function getOrCreateDirectConversation(user1Id, user2Id) {
  if (isMongo()) {
    const user1Convs = await ConversationParticipantMongo.find({ user_id: user1Id }).lean();
    const convIds1 = user1Convs.map((c) => c.conversation_id);
    const directConvs = await ConversationMongo.find({ id: { $in: convIds1 }, type: "direct" }).lean();
    for (const dc of directConvs) {
      const otherPart = await ConversationParticipantMongo.findOne({ conversation_id: dc.id, user_id: user2Id });
      if (otherPart) return dc.id;
    }
    const convId = crypto.randomUUID();
    await ConversationMongo.create({ id: convId, type: "direct" });
    await ConversationParticipantMongo.create({ id: crypto.randomUUID(), conversation_id: convId, user_id: user1Id });
    await ConversationParticipantMongo.create({ id: crypto.randomUUID(), conversation_id: convId, user_id: user2Id });
    return convId;
  }

  const row = db.prepare(`
    SELECT cp1.conversation_id
    FROM conversation_participants cp1
    JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
    JOIN conversations c ON cp1.conversation_id = c.id
    WHERE cp1.user_id = ? AND cp2.user_id = ? AND c.type = 'direct'
  `).get(user1Id, user2Id);

  if (row) return row.conversation_id;

  const convId = crypto.randomUUID();
  db.prepare(`INSERT INTO conversations (id, type) VALUES (?, 'direct')`).run(convId);
  db.prepare(`INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?)`).run(crypto.randomUUID(), convId, user1Id);
  db.prepare(`INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?)`).run(crypto.randomUUID(), convId, user2Id);
  return convId;
}

async function getConversationsForUser(userId) {
  if (isMongo()) {
    const parts = await ConversationParticipantMongo.find({ user_id: userId }).lean();
    const convIds = parts.map((p) => p.conversation_id);
    const convs = await ConversationMongo.find({ id: { $in: convIds } }).lean();

    const result = [];
    for (const c of convs) {
      const lastMsg = await MessageMongo.findOne({ conversation_id: c.id }).sort({ created_at: -1 }).lean();
      if (c.type === "direct") {
        const otherPart = await ConversationParticipantMongo.findOne({ conversation_id: c.id, user_id: { $ne: userId } }).lean();
        const otherUser = otherPart ? await UserMongo.findOne({ id: otherPart.user_id }).lean() : null;
        result.push({
          id: c.id,
          type: "direct",
          title: otherUser ? otherUser.name : "Chat",
          targetUser: otherUser ? toPublicUser(otherUser) : null,
          lastMessage: lastMsg || null,
          created_at: c.created_at,
        });
      } else {
        const group = await ChatGroupMongo.findOne({ conversation_id: c.id }).lean();
        result.push({
          id: c.id,
          type: "group",
          title: group ? group.name : "Group",
          group: group || null,
          lastMessage: lastMsg || null,
          created_at: c.created_at,
        });
      }
    }
    return result;
  }

  const parts = db.prepare(`
    SELECT c.id, c.type, c.created_at
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE cp.user_id = ?
    ORDER BY c.created_at DESC
  `).all(userId);

  const result = [];
  for (const c of parts) {
    const lastMsg = db.prepare(`
      SELECT m.*, u.name as sender_name FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC LIMIT 1
    `).get(c.id);

    if (c.type === "direct") {
      const otherUser = db.prepare(`
        SELECT u.id, u.name, u.email, u.role, u.avatar, u.student_class, u.expertise, u.bio
        FROM conversation_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.conversation_id = ? AND cp.user_id != ?
      `).get(c.id, userId);

      result.push({
        id: c.id,
        type: "direct",
        title: otherUser ? otherUser.name : "Chat",
        targetUser: otherUser || null,
        lastMessage: lastMsg || null,
        created_at: c.created_at,
      });
    } else {
      const group = db.prepare(`SELECT * FROM chat_groups WHERE conversation_id = ?`).get(c.id);
      result.push({
        id: c.id,
        type: "group",
        title: group ? group.name : "Group",
        group: group || null,
        lastMessage: lastMsg || null,
        created_at: c.created_at,
      });
    }
  }

  return result;
}

async function createMessage({ conversationId, senderId, content, type = "TEXT", metadata = null }) {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const metadataStr = typeof metadata === "object" && metadata !== null ? JSON.stringify(metadata) : metadata;

  if (isMongo()) {
    const msg = await MessageMongo.create({
      id,
      conversation_id: conversationId,
      sender_id: senderId,
      content: content || "",
      type,
      metadata: metadataStr,
      created_at: createdAt,
    });
    const sender = await UserMongo.findOne({ id: senderId }).lean();
    return {
      ...msg.toObject(),
      sender: sender ? toPublicUser(sender) : null,
    };
  }

  db.prepare(`
    INSERT INTO messages (id, conversation_id, sender_id, content, type, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, conversationId, senderId, content || "", type, metadataStr, createdAt);

  const sender = await findUserById(senderId);
  return {
    id,
    conversation_id: conversationId,
    sender_id: senderId,
    content: content || "",
    type,
    metadata: metadataStr,
    created_at: createdAt,
    sender: sender ? toPublicUser(sender) : null,
  };
}

async function isConversationParticipant(conversationId, userId) {
  if (!conversationId || !userId) return false;
  if (isMongo()) {
    const part = await ConversationParticipantMongo.findOne({ conversation_id: conversationId, user_id: userId }).lean();
    return Boolean(part);
  }
  const row = db.prepare(`
    SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?
  `).get(conversationId, userId);
  return Boolean(row);
}

async function isGroupMember(groupId, userId) {
  if (!groupId || !userId) return false;
  if (isMongo()) {
    const group = await ChatGroupMongo.findOne({ id: groupId }).lean();
    if (!group) return false;
    return isConversationParticipant(group.conversation_id, userId);
  }
  const group = db.prepare(`SELECT conversation_id FROM chat_groups WHERE id = ?`).get(groupId);
  if (!group) return false;
  return isConversationParticipant(group.conversation_id, userId);
}

async function getMessagesForConversation(conversationId) {
  if (isMongo()) {
    const messages = await MessageMongo.find({ conversation_id: conversationId }).sort({ created_at: 1 }).lean();
    const result = [];
    for (const m of messages) {
      const sender = await UserMongo.findOne({ id: m.sender_id }).lean();
      result.push({
        ...m,
        sender: sender ? toPublicUser(sender) : null,
      });
    }
    return result;
  }

  const rows = db.prepare(`
    SELECT m.*, u.name as sender_name, u.avatar as sender_avatar, u.role as sender_role
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ?
    ORDER BY m.created_at ASC
  `).all(conversationId);

  return rows.map((r) => ({
    id: r.id,
    conversation_id: r.conversation_id,
    sender_id: r.sender_id,
    content: r.content,
    type: r.type,
    metadata: r.metadata,
    created_at: r.created_at,
    sender: {
      id: r.sender_id,
      name: r.sender_name,
      avatar: r.sender_avatar,
      role: r.sender_role,
    },
  }));
}

async function createChatGroup({ adminId, name, description = "", icon = "", initialMemberIds = [] }) {
  const convId = crypto.randomUUID();
  const groupId = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  if (isMongo()) {
    await ConversationMongo.create({ id: convId, type: "group", created_at: createdAt });
    await ChatGroupMongo.create({
      id: groupId,
      conversation_id: convId,
      name,
      description,
      icon,
      admin_id: adminId,
      created_at: createdAt,
    });
    const allMembers = Array.from(new Set([adminId, ...initialMemberIds]));
    for (const memId of allMembers) {
      await ConversationParticipantMongo.create({ id: crypto.randomUUID(), conversation_id: convId, user_id: memId });
    }
    return { id: groupId, conversation_id: convId, name, description, icon, admin_id: adminId, created_at: createdAt };
  }

  db.prepare(`INSERT INTO conversations (id, type, created_at) VALUES (?, 'group', ?)`).run(convId, createdAt);
  db.prepare(`
    INSERT INTO chat_groups (id, conversation_id, name, description, icon, admin_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(groupId, convId, name, description, icon, adminId, createdAt);

  const allMembers = Array.from(new Set([adminId, ...initialMemberIds]));
  for (const memId of allMembers) {
    db.prepare(`INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?)`).run(crypto.randomUUID(), convId, memId);
  }

  return { id: groupId, conversation_id: convId, name, description, icon, admin_id: adminId, created_at: createdAt };
}

async function getGroupMembers(groupId) {
  if (isMongo()) {
    const group = await ChatGroupMongo.findOne({ id: groupId }).lean();
    if (!group) throw new Error("Group not found");
    const parts = await ConversationParticipantMongo.find({ conversation_id: group.conversation_id }).lean();
    const members = [];
    for (const p of parts) {
      const u = await UserMongo.findOne({ id: p.user_id }).lean();
      if (u) members.push(toPublicUser(u));
    }
    return members;
  }

  const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId);
  if (!group) throw new Error("Group not found");
  const rows = db.prepare(`
    SELECT u.* FROM conversation_participants cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.conversation_id = ?
    ORDER BY cp.joined_at ASC
  `).all(group.conversation_id);
  return rows.map((r) => toPublicUser(r));
}

async function addGroupMember({ groupId, adminId, memberId }) {
  if (isMongo()) {
    const group = await ChatGroupMongo.findOne({ id: groupId }).lean();
    if (!group) throw new Error("Group not found");
    if (group.admin_id !== adminId) throw new Error("Only the group admin can add members.");

    const newMember = await UserMongo.findOne({ id: memberId }).lean();
    if (!newMember) throw new Error("User not found.");

    const existing = await ConversationParticipantMongo.findOne({ conversation_id: group.conversation_id, user_id: memberId });
    if (existing) throw new Error("This person is already in the group.");

    await ConversationParticipantMongo.create({ id: crypto.randomUUID(), conversation_id: group.conversation_id, user_id: memberId });
    return toPublicUser(newMember);
  }

  const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId);
  if (!group) throw new Error("Group not found");
  if (group.admin_id !== adminId) throw new Error("Only the group admin can add members.");

  const newMember = db.prepare(`SELECT * FROM users WHERE id = ?`).get(memberId);
  if (!newMember) throw new Error("User not found.");

  const existing = db.prepare(`
    SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?
  `).get(group.conversation_id, memberId);
  if (existing) throw new Error("This person is already in the group.");

  db.prepare(`INSERT INTO conversation_participants (id, conversation_id, user_id) VALUES (?, ?, ?)`)
    .run(crypto.randomUUID(), group.conversation_id, memberId);

  return toPublicUser(newMember);
}

async function leaveGroup(groupId, userId) {
  if (isMongo()) {
    const group = await ChatGroupMongo.findOne({ id: groupId }).lean();
    if (!group) throw new Error("Group not found");

    const membership = await ConversationParticipantMongo.findOne({ conversation_id: group.conversation_id, user_id: userId });
    if (!membership) throw new Error("You are not a member of this group.");

    await ConversationParticipantMongo.deleteOne({ conversation_id: group.conversation_id, user_id: userId });

    const remaining = await ConversationParticipantMongo.find({ conversation_id: group.conversation_id }).lean();

    if (remaining.length === 0) {
      await ChatGroupMongo.deleteOne({ id: groupId });
      await ConversationMongo.deleteOne({ id: group.conversation_id });
      await GroupJoinRequestMongo.deleteMany({ group_id: groupId });
      await MessageMongo.deleteMany({ conversation_id: group.conversation_id });
      return { left: true, groupDeleted: true, newAdminId: null };
    }

    let newAdminId = group.admin_id;
    if (group.admin_id === userId) {
      newAdminId = remaining[0].user_id;
      await ChatGroupMongo.updateOne({ id: groupId }, { admin_id: newAdminId });
    }

    return { left: true, groupDeleted: false, newAdminId: newAdminId !== group.admin_id ? newAdminId : null };
  }

  const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId);
  if (!group) throw new Error("Group not found");

  const membership = db.prepare(`
    SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?
  `).get(group.conversation_id, userId);
  if (!membership) throw new Error("You are not a member of this group.");

  db.prepare(`DELETE FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`)
    .run(group.conversation_id, userId);

  const remaining = db.prepare(`
    SELECT user_id FROM conversation_participants WHERE conversation_id = ? ORDER BY joined_at ASC
  `).all(group.conversation_id);

  if (remaining.length === 0) {
    // Cascading foreign keys clean up chat_groups, messages, and group_join_requests rows tied to this conversation.
    db.prepare(`DELETE FROM conversations WHERE id = ?`).run(group.conversation_id);
    return { left: true, groupDeleted: true, newAdminId: null };
  }

  let newAdminId = group.admin_id;
  if (group.admin_id === userId) {
    newAdminId = remaining[0].user_id;
    db.prepare(`UPDATE chat_groups SET admin_id = ? WHERE id = ?`).run(newAdminId, groupId);
  }

  return { left: true, groupDeleted: false, newAdminId: newAdminId !== group.admin_id ? newAdminId : null };
}

async function getAllAvailableGroups(userId) {
  if (isMongo()) {
    const groups = await ChatGroupMongo.find().lean();
    const result = [];
    for (const g of groups) {
      const isMember = Boolean(await ConversationParticipantMongo.findOne({ conversation_id: g.conversation_id, user_id: userId }));
      const pendingReq = await GroupJoinRequestMongo.findOne({ group_id: g.id, user_id: userId, status: "pending" });
      const memberCount = await ConversationParticipantMongo.countDocuments({ conversation_id: g.conversation_id });
      const adminUser = await UserMongo.findOne({ id: g.admin_id }).lean();
      result.push({
        ...g,
        isMember,
        isPending: Boolean(pendingReq),
        memberCount,
        admin: adminUser ? toPublicUser(adminUser) : null,
      });
    }
    return result;
  }

  const groups = db.prepare(`
    SELECT g.*, u.name as admin_name, u.avatar as admin_avatar,
      EXISTS(SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = g.conversation_id AND cp.user_id = ?) as isMember,
      EXISTS(SELECT 1 FROM group_join_requests gjr WHERE gjr.group_id = g.id AND gjr.user_id = ? AND gjr.status = 'pending') as isPending,
      (SELECT COUNT(*) FROM conversation_participants cp2 WHERE cp2.conversation_id = g.conversation_id) as memberCount
    FROM chat_groups g
    JOIN users u ON g.admin_id = u.id
    ORDER BY g.created_at DESC
  `).all(userId, userId);

  return groups.map((g) => ({
    ...g,
    isMember: Boolean(g.isMember),
    isPending: Boolean(g.isPending),
    memberCount: Number(g.memberCount || 0),
    admin: {
      id: g.admin_id,
      name: g.admin_name,
      avatar: g.admin_avatar,
    },
  }));
}

async function requestToJoinGroup(groupId, userId) {
  if (isMongo()) {
    const group = await ChatGroupMongo.findOne({ id: groupId }).lean();
    if (!group) throw new Error("Group not found");
    const isMember = Boolean(await ConversationParticipantMongo.findOne({ conversation_id: group.conversation_id, user_id: userId }));
    if (isMember) throw new Error("Already a member of this group");
    const existing = await GroupJoinRequestMongo.findOne({ group_id: groupId, user_id: userId, status: "pending" });
    if (existing) return existing;
    const req = await GroupJoinRequestMongo.create({
      id: crypto.randomUUID(),
      group_id: groupId,
      user_id: userId,
      status: "pending",
    });
    return req.toObject();
  }

  const group = db.prepare(`SELECT * FROM chat_groups WHERE id = ?`).get(groupId);
  if (!group) throw new Error("Group not found");
  const isMember = db.prepare(`SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?`).get(group.conversation_id, userId);
  if (isMember) throw new Error("Already a member of this group");
  const existing = db.prepare(`SELECT * FROM group_join_requests WHERE group_id = ? AND user_id = ? AND status = 'pending'`).get(groupId, userId);
  if (existing) return existing;

  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO group_join_requests (id, group_id, user_id, status) VALUES (?, ?, ?, 'pending')`).run(id, groupId, userId);
  return { id, group_id: groupId, user_id: userId, status: "pending" };
}

async function getPendingGroupJoinRequests(adminId) {
  if (isMongo()) {
    const adminGroups = await ChatGroupMongo.find({ admin_id: adminId }).lean();
    const groupIds = adminGroups.map((g) => g.id);
    const requests = await GroupJoinRequestMongo.find({ group_id: { $in: groupIds }, status: "pending" }).lean();

    const result = [];
    for (const r of requests) {
      const user = await UserMongo.findOne({ id: r.user_id }).lean();
      const group = adminGroups.find((g) => g.id === r.group_id);
      result.push({
        ...r,
        user: user ? toPublicUser(user) : null,
        groupName: group ? group.name : "",
      });
    }
    return result;
  }

  const rows = db.prepare(`
    SELECT gjr.*, u.name as user_name, u.avatar as user_avatar, u.role as user_role, g.name as group_name
    FROM group_join_requests gjr
    JOIN chat_groups g ON gjr.group_id = g.id
    JOIN users u ON gjr.user_id = u.id
    WHERE g.admin_id = ? AND gjr.status = 'pending'
    ORDER BY gjr.created_at DESC
  `).all(adminId);

  return rows.map((r) => ({
    id: r.id,
    group_id: r.group_id,
    user_id: r.user_id,
    status: r.status,
    created_at: r.created_at,
    groupName: r.group_name,
    user: {
      id: r.user_id,
      name: r.user_name,
      avatar: r.user_avatar,
      role: r.user_role,
    },
  }));
}

async function respondGroupJoinRequest(requestId, adminId, status) {
  if (!["approved", "rejected"].includes(status)) {
    throw new Error("Invalid status");
  }

  if (isMongo()) {
    const reqDoc = await GroupJoinRequestMongo.findOne({ id: requestId, status: "pending" });
    if (!reqDoc) throw new Error("Request not found");
    const group = await ChatGroupMongo.findOne({ id: reqDoc.group_id, admin_id: adminId }).lean();
    if (!group) throw new Error("Not authorized as group admin");

    reqDoc.status = status;
    await reqDoc.save();

    if (status === "approved") {
      await ConversationParticipantMongo.updateOne(
        { conversation_id: group.conversation_id, user_id: reqDoc.user_id },
        { $setOnInsert: { id: crypto.randomUUID() } },
        { upsert: true }
      );
    }
    return { id: requestId, status };
  }

  const reqDoc = db.prepare(`
    SELECT gjr.*, g.conversation_id, g.admin_id
    FROM group_join_requests gjr
    JOIN chat_groups g ON gjr.group_id = g.id
    WHERE gjr.id = ? AND gjr.status = 'pending'
  `).get(requestId);

  if (!reqDoc) throw new Error("Request not found");
  if (reqDoc.admin_id !== adminId) throw new Error("Not authorized as group admin");

  db.prepare(`UPDATE group_join_requests SET status = ? WHERE id = ?`).run(status, requestId);

  if (status === "approved") {
    db.prepare(`
      INSERT OR IGNORE INTO conversation_participants (id, conversation_id, user_id)
      VALUES (?, ?, ?)
    `).run(crypto.randomUUID(), reqDoc.conversation_id, reqDoc.user_id);
  }

  return { id: requestId, status };
}

module.exports = {
  db,
  createUser,
  findUserByEmail,
  findUserById,
  toPublicUser,
  updateUserPassword,
  updateUserClass,
  updateUserAvatar,
  getTopTeachers,

  createPasswordReset,
  findValidPasswordReset,
  markPasswordResetUsed,
  invalidateUserPasswordResets,

  createFocusSession,
  getFocusHistorySince,
  getFocusAllTime,
  getFocusDistinctDates,

  createSubject,
  getSubjectsForUser,
  getSubjectById,
  deleteSubject,
  updateSubjectProgress,

  createTask,
  getTasksForUserByDate,
  getTaskById,
  setTaskCompleted,
  deleteTask,
  getCompletedTasksCount,
  getTaskCountsSince,

  createCourse,
  updateCourseRow,
  getAllCourses,
  getCoursesByTeacher,
  getCourseById,
  createLesson,
  getLessonsForCourse,
  getLessonById,
  replaceLessonsForCourse,
  deleteCourse,

  createEnrollment,
  getEnrollment,
  getEnrollmentsForStudent,
  getEnrollmentsForCourse,
  getEnrollmentCountForCourse,
  getEnrollmentsForTeacher,

  upsertSubmission,
  getSubmission,
  getSubmissionById,
  getSubmissionsForCourseStudent,
  getSubmissionsForCourse,
  evaluateSubmission,

  upsertLessonTask,
  getLessonTaskByLesson,
  getLessonTasksForCourse,
  deleteLessonTask,

  setLessonCompleted,
  getLessonCompletionsForCourseStudent,
  getLessonCompletionDistinctDates,

  // Community / Posts
  createPost,
  getAllPosts,
  getPostById,
  getUserPosts,
  updatePost,
  deletePost,
  addPostComment,
  getPostComments,
  toggleSavePost,
  getSavedPosts,

  // Teacher Follows
  toggleFollowTeacher,
  isFollowingTeacher,
  getTeacherFollowersCount,
  getCoursesFromFollowedTeachers,

  // Friends
  sendFriendRequest,
  respondFriendRequest,
  getFriendshipStatus,
  getFriendRequestsForUser,
  getFriendsForUser,
  getSuggestedFriendsForUser,

  // Conversations & Messaging & Groups
  getOrCreateDirectConversation,
  getConversationsForUser,
  isConversationParticipant,
  isGroupMember,
  createMessage,
  getMessagesForConversation,
  createChatGroup,
  getAllAvailableGroups,
  getGroupMembers,
  addGroupMember,
  leaveGroup,
  requestToJoinGroup,
  getPendingGroupJoinRequests,
  respondGroupJoinRequest,
};
