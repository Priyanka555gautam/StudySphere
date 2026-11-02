// StudySphere authentication & learning API backend.

const http = require("node:http");
const crypto = require("node:crypto");
const { Server } = require("socket.io");

const { loadEnv } = require("./env");
loadEnv();

const {
  createUser, findUserByEmail, findUserById, toPublicUser, updateUserPassword, updateUserClass, updateUserAvatar, getTopTeachers,

  createPasswordReset, findValidPasswordReset, markPasswordResetUsed,
  invalidateUserPasswordResets,

  createFocusSession, getFocusHistorySince, getFocusAllTime, getFocusDistinctDates,

  createSubject, getSubjectsForUser, getSubjectById, deleteSubject, updateSubjectProgress,

  createTask, getTasksForUserByDate, getTaskById, setTaskCompleted, deleteTask,
  getCompletedTasksCount, getTaskCountsSince,

  createCourse, updateCourseRow, getAllCourses, getCoursesByTeacher, getCourseById,
  createLesson, getLessonsForCourse, getLessonById, replaceLessonsForCourse, deleteCourse,

  createEnrollment, getEnrollment, getEnrollmentsForStudent, getEnrollmentsForCourse,
  getEnrollmentCountForCourse, getEnrollmentsForTeacher,

  upsertSubmission, getSubmission, getSubmissionById, getSubmissionsForCourseStudent,
  getSubmissionsForCourse, evaluateSubmission,

  upsertLessonTask, getLessonTaskByLesson, getLessonTasksForCourse, deleteLessonTask,

  setLessonCompleted, getLessonCompletionsForCourseStudent, getLessonCompletionDistinctDates,

  createPost, getAllPosts, getPostById, getUserPosts, updatePost, deletePost, addPostComment, getPostComments, toggleSavePost, getSavedPosts,
  toggleFollowTeacher, isFollowingTeacher, getTeacherFollowersCount, getCoursesFromFollowedTeachers,
  sendFriendRequest, respondFriendRequest, getFriendshipStatus, getFriendRequestsForUser, getFriendsForUser, getSuggestedFriendsForUser,
  getOrCreateDirectConversation, getConversationsForUser, isConversationParticipant, isGroupMember, createMessage, getMessagesForConversation,
  createChatGroup, getAllAvailableGroups, getGroupMembers, addGroupMember, leaveGroup, requestToJoinGroup, getPendingGroupJoinRequests, respondGroupJoinRequest,
} = require("./db");
const { hashPassword, verifyPassword, sign, verify } = require("./auth");
const { sendMail } = require("./mailer");

const PORT = Number(process.env.PORT || 4000);

const CORS_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const CORS_ORIGIN = CORS_ORIGINS[0];

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me-in-production";
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN || 60 * 60 * 24 * 7); // 7 days
const PASSWORD_RESET_EXPIRES_IN_MS = 30 * 60 * 1000; // 30 minutes

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_FROM = process.env.SMTP_FROM || (SMTP_USER ? `StudySphere <${SMTP_USER}>` : "");

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM = process.env.RESEND_FROM || "StudySphere <onboarding@resend.dev>";
const COOKIE_SECURE = process.env.COOKIE_SECURE === "true";
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || (COOKIE_SECURE ? "None" : "Lax");
const COOKIE_NAME = "ss_token";

const MAX_BODY_BYTES = 1024 * 1024; // 1MB
const MAX_UPLOAD_BODY_BYTES = 15 * 1024 * 1024; // 15MB — stays under MongoDB's hard 16MB per-document limit

/* =====================================================
   HELPERS
===================================================== */

function readBody(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error("Payload too large"), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (chunks.length === 0) return resolve({});

      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("Invalid JSON body"), { statusCode: 400 }));
      }
    });

    req.on("error", reject);
  });
}

function parseCookies(req) {
  const header = req.headers.cookie;
  const cookies = {};
  if (!header) return cookies;

  for (const pair of header.split(";")) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;
    const key = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }

  return cookies;
}

function setAuthCookie(res, token) {
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${JWT_EXPIRES_IN}`,
    `SameSite=${COOKIE_SAMESITE}`,
  ];

  if (COOKIE_SECURE || COOKIE_SAMESITE === "None") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function clearAuthCookie(res) {
  const parts = [
    `${COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
    `SameSite=${COOKIE_SAMESITE}`,
  ];

  if (COOKIE_SECURE || COOKIE_SAMESITE === "None") parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function sendJson(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(payload);
}

function applyCors(req, res) {
  const requestOrigin = req.headers.origin;
  const allowedOrigin =
    requestOrigin && CORS_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : CORS_ORIGIN;

  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function getCurrentUser(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const payload = verify(token, JWT_SECRET);
  if (!payload || !payload.sub) return null;

  const row = await findUserById(payload.sub);
  return row ? toPublicUser(row) : null;
}

function requireAuth(handler) {
  return async (req, res, params) => {
    const user = await getCurrentUser(req);
    if (!user) return sendJson(res, 401, { message: "Not authenticated." });
    req.user = user;
    return handler(req, res, params);
  };
}

function requireRole(role, handler) {
  return requireAuth(async (req, res, params) => {
    if (req.user.role !== role) {
      return sendJson(res, 403, { message: `Only ${role}s can do that.` });
    }
    return handler(req, res, params);
  });
}

/* =====================================================
   DATE HELPERS
===================================================== */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function isValidDateStr(value) {
  return typeof value === "string" && DATE_RE.test(value);
}

function daysAgoStr(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function addDaysStr(dateStr, n) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function computeStreak(distinctDates) {
  const dateSet = new Set(distinctDates);
  const today = todayStr();

  // If today has NO lesson completion, active streak is 0 (resets until a lesson is completed today)
  if (!dateSet.has(today)) {
    return 0;
  }

  let streak = 0;
  let cursor = today;

  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDaysStr(cursor, -1);
  }

  return streak;
}

function computeMaxStreak(distinctDates) {
  if (!distinctDates || !distinctDates.length) return 0;
  const sortedDates = Array.from(new Set(distinctDates)).sort();
  let maxStreak = 0;
  let currentRun = 0;
  let prevDate = null;

  for (const dateStr of sortedDates) {
    if (!prevDate) {
      currentRun = 1;
    } else {
      const expectedNext = addDaysStr(prevDate, 1);
      if (dateStr === expectedNext) {
        currentRun += 1;
      } else {
        currentRun = 1;
      }
    }
    if (currentRun > maxStreak) {
      maxStreak = currentRun;
    }
    prevDate = dateStr;
  }

  return maxStreak;
}

/* =====================================================
   VALIDATION
===================================================== */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup(body) {
  const errors = {};

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = body.role === "teacher" ? "teacher" : body.role === "student" ? "student" : null;

  if (name.length < 2) errors.name = "Name must be at least 2 characters.";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address.";
  if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (!role) errors.role = "Role must be 'student' or 'teacher'.";

  return { errors, values: { name, email, password, role } };
}

/* =====================================================
   ROUTE HANDLERS: AUTH
===================================================== */

async function handleSignup(req, res) {
  const body = await readBody(req);
  const { errors, values } = validateSignup(body);

  if (Object.keys(errors).length > 0) {
    return sendJson(res, 422, { message: "Validation failed", errors });
  }

  const { name, email, password, role } = values;

  const studentClass =
    typeof body.studentClass === "string"
      ? body.studentClass.trim().slice(0, 200)
      : typeof body.class === "string"
      ? body.class.trim().slice(0, 200)
      : null;
  const expertise = typeof body.expertise === "string" ? body.expertise.trim().slice(0, 200) : null;
  const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 1000) : null;

  if (await findUserByEmail(email)) {
    return sendJson(res, 409, {
      message: "An account with that email already exists.",
      errors: { email: "Email already in use." },
    });
  }

  const { hash, salt } = hashPassword(password);
  const id = crypto.randomUUID();

  await createUser({
    id,
    name,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    role,
    studentClass,
    expertise,
    bio,
  });

  const token = sign({ sub: id }, JWT_SECRET, JWT_EXPIRES_IN);
  setAuthCookie(res, token);

  const user = toPublicUser(await findUserById(id));
  return sendJson(res, 201, { user });
}

async function handleLogin(req, res) {
  const body = await readBody(req);

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return sendJson(res, 422, { message: "Email and password are required." });
  }

  const row = await findUserByEmail(email);

  const invalidCreds = () => sendJson(res, 401, { message: "Invalid email or password." });

  if (!row) return invalidCreds();

  const valid = verifyPassword(password, row.password_hash, row.password_salt);
  if (!valid) return invalidCreds();

  const token = sign({ sub: row.id }, JWT_SECRET, JWT_EXPIRES_IN);
  setAuthCookie(res, token);

  return sendJson(res, 200, { user: toPublicUser(row) });
}

async function handleLogout(req, res) {
  clearAuthCookie(res);
  return sendJson(res, 200, { message: "Logged out." });
}

async function handleMe(req, res) {
  const user = await getCurrentUser(req);
  if (!user) return sendJson(res, 401, { message: "Not authenticated." });

  if (req.method === "PATCH" || req.method === "PUT") {
    const body = await readBody(req, MAX_UPLOAD_BODY_BYTES);
    if (typeof body.studentClass === "string" || typeof body.class === "string") {
      const newClass = typeof body.studentClass === "string" ? body.studentClass.trim() : body.class.trim();
      await updateUserClass(user.id, newClass);
      user.studentClass = newClass;
    }
    if (typeof body.avatar === "string") {
      const newAvatar = body.avatar.trim();
      await updateUserAvatar(user.id, newAvatar);
      user.avatar = newAvatar;
    }
  }

  return sendJson(res, 200, { user });
}

async function handleTopTeachers(req, res) {
  const teachers = await getTopTeachers();
  return sendJson(res, 200, { teachers });
}

/* =====================================================
   PASSWORD RESETS
===================================================== */

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function passwordResetEmailHtml(user, resetUrl) {
  return `
    <div style="font-family: -apple-system, Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111827;">Reset your StudySphere password</h2>
      <p style="color: #374151; line-height: 1.6;">
        We got a request to reset the password for this account (${escapeHtml(user.email)}). This link expires in 30 minutes.
      </p>
      <p style="margin: 28px 0;">
        <a href="${resetUrl}" style="background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">
          Reset password
        </a>
      </p>
    </div>
  `;
}

async function sendPasswordResetEmail(user, resetUrl) {
  const subject = "Reset your StudySphere password";
  const html = passwordResetEmailHtml(user, resetUrl);

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    try {
      await sendMail({
        host: SMTP_HOST,
        port: SMTP_PORT,
        user: SMTP_USER,
        pass: SMTP_PASS,
        from: SMTP_FROM,
        to: user.email,
        subject,
        html,
      });
      return true;
    } catch (err) {
      console.error(`[password reset] SMTP send failed: ${err.message}`);
      return false;
    }
  }
  return false;
}

async function handleForgotPassword(req, res) {
  const body = await readBody(req);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !EMAIL_RE.test(email)) {
    return sendJson(res, 422, { message: "Enter a valid email address." });
  }

  const genericResponse = () =>
    sendJson(res, 200, {
      message: "If an account with that email exists, we sent a password reset link.",
    });

  const user = await findUserByEmail(email);
  if (!user) return genericResponse();

  await invalidateUserPasswordResets(user.id);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRES_IN_MS).toISOString();

  await createPasswordReset({
    id: crypto.randomUUID(),
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const resetUrl = `${CORS_ORIGIN}/reset-password?token=${rawToken}`;
  const sentRealEmail = await sendPasswordResetEmail(user, resetUrl);

  const responseBody = {
    message: "If an account with that email exists, we sent a password reset link.",
  };
  if (!sentRealEmail) {
    responseBody.devResetUrl = resetUrl;
  }

  return sendJson(res, 200, responseBody);
}

async function handleResetPassword(req, res) {
  const body = await readBody(req);
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!token) return sendJson(res, 422, { message: "Reset token is required." });
  if (newPassword.length < 8) {
    return sendJson(res, 422, { message: "Password must be at least 8 characters." });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const reset = await findValidPasswordReset(tokenHash);

  if (!reset) {
    return sendJson(res, 400, { message: "This password reset link is invalid or has expired." });
  }

  const user = await findUserById(reset.user_id);
  if (!user) return sendJson(res, 404, { message: "User not found." });

  const { hash, salt } = hashPassword(newPassword);
  await updateUserPassword(user.id, hash, salt);
  await markPasswordResetUsed(reset.id);

  return sendJson(res, 200, { message: "Your password has been updated. You can now log in." });
}

/* =====================================================
   FOCUS SESSIONS
===================================================== */

async function handleCreateFocusSession(req, res) {
  const body = await readBody(req);
  const seconds = typeof body.seconds === "number" ? Math.floor(body.seconds) : 0;
  const mode = typeof body.mode === "string" && body.mode ? body.mode.trim().slice(0, 30) : "timer";
  const date = isValidDateStr(body.date) ? body.date : todayStr();

  if (seconds <= 0) return sendJson(res, 422, { message: "Seconds must be greater than 0." });

  const id = crypto.randomUUID();
  await createFocusSession({ id, userId: req.user.id, date, seconds, mode });

  return sendJson(res, 201, { session: { id, date, seconds, mode } });
}

async function handleFocusStats(req, res) {
  const thirtyDaysAgo = daysAgoStr(30);
  const [historyRows, allTime, distinctCompletionDates] = await Promise.all([
    getFocusHistorySince(req.user.id, thirtyDaysAgo),
    getFocusAllTime(req.user.id),
    getLessonCompletionDistinctDates(req.user.id),
  ]);

  const historyMap = new Map(historyRows.map((r) => [r.date, { seconds: r.seconds, sessions: r.sessions }]));

  let todaySeconds = 0;
  let todaySessions = 0;
  let weekSeconds = 0;
  let weekSessions = 0;

  const sevenDaysAgo = daysAgoStr(6);
  for (const [date, data] of historyMap.entries()) {
    if (date === todayStr()) {
      todaySeconds = data.seconds;
      todaySessions = data.sessions;
    }
    if (date >= sevenDaysAgo) {
      weekSeconds += data.seconds;
      weekSessions += data.sessions;
    }
  }

  const chart30 = [];
  for (let i = 29; i >= 0; i -= 1) {
    const d = daysAgoStr(i);
    const data = historyMap.get(d) || { seconds: 0, sessions: 0 };
    chart30.push({ date: d, seconds: data.seconds, minutes: Math.round(data.seconds / 60) });
  }

  const currentStreak = computeStreak(distinctCompletionDates);
  const maxStreakDays = Math.max(currentStreak, computeMaxStreak(distinctCompletionDates));

  return sendJson(res, 200, {
    today: { seconds: todaySeconds, minutes: Math.round(todaySeconds / 60), sessions: todaySessions },
    thisWeek: { seconds: weekSeconds, minutes: Math.round(weekSeconds / 60), sessions: weekSessions },
    allTime: { seconds: allTime.seconds, minutes: Math.round(allTime.seconds / 60), sessions: allTime.sessions },
    streakDays: currentStreak,
    maxStreakDays,
    history30Days: chart30,
  });
}

/* =====================================================
   ORGANIZE: SUBJECTS
===================================================== */

async function handleListSubjects(req, res) {
  const subjects = await getSubjectsForUser(req.user.id);
  return sendJson(res, 200, { subjects });
}

async function handleCreateSubject(req, res) {
  const body = await readBody(req);
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim().slice(0, 10) : "📘";
  const topicsCount = typeof body.topicsCount === "number" ? Math.max(0, body.topicsCount) : 0;
  const progressPct = typeof body.progressPct === "number" ? Math.min(100, Math.max(0, body.progressPct)) : 0;

  if (!name) return sendJson(res, 422, { message: "Subject name is required." });

  const id = crypto.randomUUID();
  await createSubject({ id, userId: req.user.id, name, icon, topicsCount, progressPct });

  return sendJson(res, 201, { subject: { id, name, icon, topicsCount, progressPct } });
}

async function handleDeleteSubject(req, res, params) {
  const deleted = await deleteSubject(params.id, req.user.id);
  if (!deleted) return sendJson(res, 404, { message: "Subject not found." });
  return sendJson(res, 200, { message: "Subject deleted." });
}

/* =====================================================
   ORGANIZE: TASKS
===================================================== */

async function handleListTasks(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const queryDate = url.searchParams.get("date");
  const date = isValidDateStr(queryDate) ? queryDate : todayStr();

  const tasks = await getTasksForUserByDate(req.user.id, date);
  return sendJson(res, 200, { date, tasks });
}

async function handleCreateTask(req, res) {
  const body = await readBody(req);
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  const subjectId = typeof body.subjectId === "string" && body.subjectId ? body.subjectId : null;
  const durationMin = typeof body.durationMin === "number" ? Math.max(5, Math.min(480, body.durationMin)) : 30;
  const priority = ["high", "medium", "low"].includes(body.priority) ? body.priority : "medium";
  const date = isValidDateStr(body.date) ? body.date : todayStr();

  if (!title) return sendJson(res, 422, { message: "Task title is required." });

  if (subjectId) {
    const subject = await getSubjectById(subjectId, req.user.id);
    if (!subject) return sendJson(res, 422, { message: "Invalid subject." });
  }

  const id = crypto.randomUUID();
  await createTask({ id, userId: req.user.id, subjectId, title, durationMin, priority, date });

  return sendJson(res, 201, { task: { id, subjectId, title, durationMin, priority, date, completed: false } });
}

async function handleUpdateTask(req, res, params) {
  const body = await readBody(req);
  const completed = body.completed === true;

  const updated = await setTaskCompleted(params.id, req.user.id, completed);
  if (!updated) return sendJson(res, 404, { message: "Task not found." });

  return sendJson(res, 200, { message: "Task updated." });
}

async function handleDeleteTask(req, res, params) {
  const deleted = await deleteTask(params.id, req.user.id);
  if (!deleted) return sendJson(res, 404, { message: "Task not found." });
  return sendJson(res, 200, { message: "Task deleted." });
}

async function handleOrganizeSummary(req, res) {
  const thirtyDaysAgo = daysAgoStr(30);
  const [totalCompleted, counts30] = await Promise.all([
    getCompletedTasksCount(req.user.id),
    getTaskCountsSince(req.user.id, thirtyDaysAgo),
  ]);

  const countsMap = new Map(counts30.map((c) => [c.date, { completed: c.completed, total: c.total }]));
  const history30Days = [];

  for (let i = 29; i >= 0; i -= 1) {
    const d = daysAgoStr(i);
    const data = countsMap.get(d) || { completed: 0, total: 0 };
    history30Days.push({ date: d, completed: data.completed, total: data.total });
  }

  return sendJson(res, 200, { totalCompletedTasks: totalCompleted, history30Days });
}

/* =====================================================
   COURSES + LESSONS
===================================================== */

function toPublicTaskSummary(task) {
  if (!task) return null;
  return {
    id: task.id,
    lessonId: task.lesson_id,
    courseId: task.course_id,
    title: task.title,
    instructions: task.instructions ?? "",
    hasFile: Boolean(task.file_data),
    fileName: task.file_name ?? null,
    updatedAt: task.updated_at || task.created_at,
  };
}

function toPublicLesson(lesson, taskByLessonId) {
  return {
    id: lesson.id,
    position: lesson.position,
    title: lesson.title,
    description: lesson.description ?? "",
    videoId: lesson.video_id ?? "",
    duration: lesson.duration ?? "",
    task: taskByLessonId ? toPublicTaskSummary(taskByLessonId.get(lesson.id) || null) : null,
  };
}

function toPublicCourse(course, lessons, extra = {}, taskByLessonId = null) {
  return {
    id: course.id,
    teacherId: course.teacher_id,
    title: course.title,
    category: course.category ?? "",
    level: course.level ?? "",
    description: course.description ?? "",
    thumbnail: course.thumbnail ?? "",
    instructor: course.instructor ?? "StudySphere Teacher",
    createdAt: course.created_at,
    lessons: lessons.map((lesson) => toPublicLesson(lesson, taskByLessonId)),
    ...extra,
  };
}

async function taskMapForCourse(courseId) {
  const tasks = await getLessonTasksForCourse(courseId);
  return new Map(tasks.map((t) => [t.lesson_id, t]));
}

function validateLessonsInput(rawLessons) {
  if (!Array.isArray(rawLessons) || rawLessons.length === 0) {
    return { error: "At least one lesson is required." };
  }

  const lessons = [];
  for (let i = 0; i < rawLessons.length; i += 1) {
    const raw = rawLessons[i] || {};
    const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 160) : "";
    const videoId = typeof raw.videoId === "string" ? raw.videoId.trim() : "";
    const duration = typeof raw.duration === "string" ? raw.duration.trim().slice(0, 40) : "";
    const description = typeof raw.description === "string" ? raw.description.trim().slice(0, 2000) : "";
    const id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : undefined;

    if (!title || !videoId || !duration) {
      return { error: `Lesson ${i + 1} needs a title, a valid video, and a duration.` };
    }

    lessons.push({ id, title, description, videoId, duration });
  }

  return { lessons };
}

async function handleCreateCourse(req, res) {
  const body = await readBody(req, MAX_UPLOAD_BODY_BYTES);

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  const category = typeof body.category === "string" ? body.category.trim().slice(0, 60) : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 4000) : "";
  const level = typeof body.level === "string" && body.level.trim() ? body.level.trim() : "Beginner";
  const thumbnail = typeof body.thumbnail === "string" ? body.thumbnail : "";

  if (!title) return sendJson(res, 422, { message: "Course title is required." });
  if (!category) return sendJson(res, 422, { message: "Course category is required." });
  if (!description) return sendJson(res, 422, { message: "Course description is required." });
  if (!thumbnail) return sendJson(res, 422, { message: "Course thumbnail is required." });

  const { lessons, error } = validateLessonsInput(body.lessons);
  if (error) return sendJson(res, 422, { message: error });

  const id = crypto.randomUUID();
  await createCourse({
    id,
    teacherId: req.user.id,
    title,
    category,
    level,
    description,
    thumbnail,
    instructor: req.user.name,
  });
  await replaceLessonsForCourse(id, lessons);

  const savedLessons = await getLessonsForCourse(id);

  if (Array.isArray(body.lessons)) {
    for (let i = 0; i < savedLessons.length; i++) {
      const raw = body.lessons[i];
      const savedL = savedLessons[i];
      if (raw && raw.task && raw.task.title && savedL) {
        await upsertLessonTask({
          id: crypto.randomUUID(),
          lessonId: savedL.id,
          courseId: id,
          teacherId: req.user.id,
          title: raw.task.title,
          instructions: raw.task.instructions || "",
          fileName: raw.task.fileName || null,
          fileData: raw.task.fileData || null,
        });
      }
    }
  }

  const course = await getCourseById(id);
  const tasksByLesson = await taskMapForCourse(id);

  return sendJson(res, 201, { course: toPublicCourse(course, savedLessons, { enrolledCount: 0 }, tasksByLesson) });
}

async function handleUpdateCourse(req, res, params) {
  const existing = await getCourseById(params.id);
  if (!existing || existing.teacher_id !== req.user.id) {
    return sendJson(res, 404, { message: "Course not found." });
  }

  const body = await readBody(req, MAX_UPLOAD_BODY_BYTES);

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : existing.title;
  const category = typeof body.category === "string" ? body.category.trim().slice(0, 60) : existing.category;
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 4000) : existing.description;
  const level = typeof body.level === "string" && body.level.trim() ? body.level.trim() : existing.level;
  const thumbnail = typeof body.thumbnail === "string" && body.thumbnail ? body.thumbnail : existing.thumbnail;

  if (!title) return sendJson(res, 422, { message: "Course title is required." });

  await updateCourseRow(params.id, req.user.id, { title, category, level, description, thumbnail });

  if (body.lessons) {
    const { lessons, error } = validateLessonsInput(body.lessons);
    if (error) return sendJson(res, 422, { message: error });
    await replaceLessonsForCourse(params.id, lessons);
  }

  const course = await getCourseById(params.id);
  const lessons = await getLessonsForCourse(params.id);
  const count = await getEnrollmentCountForCourse(params.id);
  const tasksByLesson = await taskMapForCourse(params.id);

  return sendJson(res, 200, {
    course: toPublicCourse(course, lessons, { enrolledCount: count }, tasksByLesson),
  });
}

async function handleListCourses(req, res) {
  const all = await getAllCourses();
  const courses = [];
  for (const course of all) {
    const lessons = await getLessonsForCourse(course.id);
    const count = await getEnrollmentCountForCourse(course.id);
    const tasksByLesson = await taskMapForCourse(course.id);
    courses.push(toPublicCourse(course, lessons, { enrolledCount: count }, tasksByLesson));
  }
  return sendJson(res, 200, { courses });
}

async function handleGetCourse(req, res, params) {
  const course = await getCourseById(params.id);
  if (!course) return sendJson(res, 404, { message: "Course not found." });

  const lessons = await getLessonsForCourse(params.id);
  const count = await getEnrollmentCountForCourse(params.id);
  const extra = { enrolledCount: count };

  const currentUser = await getCurrentUser(req);
  if (currentUser?.role === "student") {
    const enrollment = await getEnrollment(course.id, currentUser.id);
    extra.enrolled = !!enrollment;
  }

  const tasksByLesson = await taskMapForCourse(params.id);
  return sendJson(res, 200, { course: toPublicCourse(course, lessons, extra, tasksByLesson) });
}

async function handleDeleteCourse(req, res, params) {
  const existing = await getCourseById(params.id);
  if (!existing || existing.teacher_id !== req.user.id) {
    return sendJson(res, 404, { message: "Course not found." });
  }

  await deleteCourse(params.id, req.user.id);
  return sendJson(res, 200, { message: "Course deleted." });
}

async function handleTeacherCourses(req, res) {
  const list = await getCoursesByTeacher(req.user.id);
  const courses = [];
  for (const course of list) {
    const lessons = await getLessonsForCourse(course.id);
    const count = await getEnrollmentCountForCourse(course.id);
    const tasksByLesson = await taskMapForCourse(course.id);
    courses.push(toPublicCourse(course, lessons, { enrolledCount: count }, tasksByLesson));
  }
  return sendJson(res, 200, { courses });
}

/* =====================================================
   ENROLLMENT
===================================================== */

async function handleEnroll(req, res, params) {
  const course = await getCourseById(params.id);
  if (!course) return sendJson(res, 404, { message: "Course not found." });

  const existing = await getEnrollment(course.id, req.user.id);
  if (!existing) {
    await createEnrollment({ id: crypto.randomUUID(), courseId: course.id, studentId: req.user.id });
  }

  const count = await getEnrollmentCountForCourse(course.id);
  return sendJson(res, 201, { message: "Enrolled.", enrolledCount: count });
}

function buildLessonProgress(lessons, submissions, completions) {
  const byLessonId = new Map(submissions.map((s) => [s.lesson_id, s]));
  const completedLessonIds = new Set((completions || []).map((c) => c.lesson_id));

  let prevSubmitted = true;

  return lessons.map((lesson, idx) => {
    const submission = byLessonId.get(lesson.id) || null;
    const hasSubmitted = Boolean(submission);

    // Lesson 0 is unlocked. Subsequent lessons are locked if previous lesson's task was not submitted.
    const isLocked = idx > 0 && !prevSubmitted;
    prevSubmitted = hasSubmitted;

    return {
      lessonId: lesson.id,
      locked: isLocked,
      completed: completedLessonIds.has(lesson.id),
      status: submission ? submission.status : "pending",
      remark: submission?.remark ?? null,
      fileName: submission?.file_name ?? null,
      submittedAt: submission?.submitted_at ?? null,
      evaluatedAt: submission?.evaluated_at ?? null,
    };
  });
}

function computeProgressPct(lessons, completions) {
  if (!lessons.length) return 0;
  const completedLessonIds = new Set((completions || []).map((c) => c.lesson_id));
  const validLessonIds = new Set(lessons.map((l) => l.id));
  let completedCount = 0;
  for (const id of completedLessonIds) {
    if (validLessonIds.has(id)) completedCount += 1;
  }
  return Math.round((completedCount / lessons.length) * 100);
}

async function handleStudentCourses(req, res) {
  const enrollments = await getEnrollmentsForStudent(req.user.id);

  const courses = [];
  for (const enrollment of enrollments) {
    const course = await getCourseById(enrollment.course_id);
    if (!course) continue;
    const lessons = await getLessonsForCourse(course.id);
    const submissions = await getSubmissionsForCourseStudent(course.id, req.user.id);
    const completions = await getLessonCompletionsForCourseStudent(course.id, req.user.id);
    const progress = buildLessonProgress(lessons, submissions, completions);
    const tasksByLesson = await taskMapForCourse(course.id);

    courses.push(
      toPublicCourse(course, lessons, {
        enrolledAt: enrollment.enrolled_at,
        progressPct: computeProgressPct(lessons, completions),
        lessonProgress: progress,
      }, tasksByLesson)
    );
  }

  return sendJson(res, 200, { courses });
}

async function handleStudentCourseDetail(req, res, params) {
  const course = await getCourseById(params.id);
  if (!course) return sendJson(res, 404, { message: "Course not found." });

  const enrollment = await getEnrollment(course.id, req.user.id);
  if (!enrollment) return sendJson(res, 403, { message: "You're not enrolled in this course." });

  const lessons = await getLessonsForCourse(course.id);
  const submissions = await getSubmissionsForCourseStudent(course.id, req.user.id);
  const completions = await getLessonCompletionsForCourseStudent(course.id, req.user.id);
  const progress = buildLessonProgress(lessons, submissions, completions);
  const tasksByLesson = await taskMapForCourse(course.id);

  return sendJson(res, 200, {
    course: toPublicCourse(course, lessons, {
      enrolledAt: enrollment.enrolled_at,
      progressPct: computeProgressPct(lessons, completions),
      lessonProgress: progress,
    }, tasksByLesson),
  });
}

async function handleCompleteLesson(req, res, params) {
  const course = await getCourseById(params.id);
  if (!course) return sendJson(res, 404, { message: "Course not found." });

  const enrollment = await getEnrollment(course.id, req.user.id);
  if (!enrollment) {
    return sendJson(res, 403, { message: "You're not enrolled in this course." });
  }

  const lesson = await getLessonById(params.lessonId, course.id);
  if (!lesson) return sendJson(res, 404, { message: "Lesson not found." });

  const body = await readBody(req);
  const completed = body.completed !== false;

  await setLessonCompleted(lesson.id, course.id, req.user.id, completed);

  const lessons = await getLessonsForCourse(course.id);
  const completions = await getLessonCompletionsForCourseStudent(course.id, req.user.id);

  return sendJson(res, 200, {
    completed,
    progressPct: computeProgressPct(lessons, completions),
  });
}

/* =====================================================
   LESSON TASKS
===================================================== */

async function handleSaveLessonTask(req, res, params) {
  const course = await getCourseById(params.id);
  if (!course || course.teacher_id !== req.user.id) {
    return sendJson(res, 404, { message: "Course not found." });
  }

  const lesson = await getLessonById(params.lessonId, course.id);
  if (!lesson) return sendJson(res, 404, { message: "Lesson not found." });

  const body = await readBody(req, MAX_UPLOAD_BODY_BYTES);
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 160) : "";
  const instructions = typeof body.instructions === "string" ? body.instructions.trim().slice(0, 4000) : "";
  const fileName = typeof body.fileName === "string" && body.fileName.trim() ? body.fileName.trim().slice(0, 200) : null;
  const fileData = typeof body.fileData === "string" && body.fileData ? body.fileData : null;

  if (!title) return sendJson(res, 422, { message: "Task title is required." });
  if (fileData && fileName && !fileName.toLowerCase().endsWith(".pdf")) {
    return sendJson(res, 422, { message: "The task attachment must be a PDF." });
  }

  const task = await upsertLessonTask({
    id: crypto.randomUUID(),
    lessonId: lesson.id,
    courseId: course.id,
    teacherId: req.user.id,
    title,
    instructions,
    fileName,
    fileData,
  });

  return sendJson(res, 200, { task: toPublicTaskSummary(task) });
}

async function handleDeleteLessonTask(req, res, params) {
  const course = await getCourseById(params.id);
  if (!course || course.teacher_id !== req.user.id) {
    return sendJson(res, 404, { message: "Course not found." });
  }

  await deleteLessonTask(params.lessonId, course.id, req.user.id);
  return sendJson(res, 200, { message: "Task removed." });
}

async function handleGetLessonTask(req, res, params) {
  const course = await getCourseById(params.id);
  if (!course) return sendJson(res, 404, { message: "Course not found." });

  const currentUser = await getCurrentUser(req);
  const isOwnerTeacher = currentUser?.role === "teacher" && course.teacher_id === currentUser.id;
  const isEnrolledStudent = currentUser?.role === "student" && !!(await getEnrollment(course.id, currentUser.id));

  if (!isOwnerTeacher && !isEnrolledStudent) {
    return sendJson(res, 403, { message: "You don't have access to this course's task." });
  }

  const task = await getLessonTaskByLesson(params.lessonId);
  if (!task) return sendJson(res, 404, { message: "No task set for this lesson yet." });

  return sendJson(res, 200, {
    task: {
      ...toPublicTaskSummary(task),
      fileData: task.file_data ?? null,
    },
  });
}

async function handleStudentTasks(req, res) {
  const enrollments = await getEnrollmentsForStudent(req.user.id);
  const items = [];

  for (const enrollment of enrollments) {
    const course = await getCourseById(enrollment.course_id);
    if (!course) continue;

    const lessons = await getLessonsForCourse(course.id);
    const tasksByLesson = await taskMapForCourse(course.id);
    const submissions = await getSubmissionsForCourseStudent(course.id, req.user.id);
    const submissionByLesson = new Map(submissions.map((s) => [s.lesson_id, s]));

    lessons.forEach((lesson, index) => {
      const task = tasksByLesson.get(lesson.id);
      if (!task) return;

      const submission = submissionByLesson.get(lesson.id) || null;

      items.push({
        courseId: course.id,
        courseTitle: course.title,
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        lessonPosition: index,
        task: toPublicTaskSummary(task),
        submissionStatus: submission ? submission.status : "pending",
        submissionFileName: submission?.file_name ?? null,
        remark: submission?.remark ?? null,
      });
    });
  }

  items.sort((a, b) => {
    const openA = a.submissionStatus === "pending" || a.submissionStatus === "rejected";
    const openB = b.submissionStatus === "pending" || b.submissionStatus === "rejected";
    if (openA !== openB) return openA ? -1 : 1;
    return 0;
  });

  return sendJson(res, 200, { tasks: items });
}

/* =====================================================
   SUBMISSIONS
===================================================== */

async function handleSubmitLessonTask(req, res, params) {
  const course = await getCourseById(params.id);
  if (!course) return sendJson(res, 404, { message: "Course not found." });

  const enrollment = await getEnrollment(course.id, req.user.id);
  if (!enrollment) {
    return sendJson(res, 403, { message: "You're not enrolled in this course." });
  }

  const lesson = await getLessonById(params.lessonId, course.id);
  if (!lesson) return sendJson(res, 404, { message: "Lesson not found." });

  const body = await readBody(req, MAX_UPLOAD_BODY_BYTES);
  const fileName = typeof body.fileName === "string" && body.fileName.trim() ? body.fileName.trim().slice(0, 200) : "submission.pdf";
  const fileData = typeof body.fileData === "string" ? body.fileData : "";

  if (!fileData) return sendJson(res, 422, { message: "A PDF file is required." });
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    return sendJson(res, 422, { message: "Only PDF files can be submitted for a lesson task." });
  }

  const submission = await upsertSubmission({
    id: crypto.randomUUID(),
    lessonId: lesson.id,
    courseId: course.id,
    studentId: req.user.id,
    fileName,
    fileData,
  });

  return sendJson(res, 201, {
    submission: {
      id: submission.id,
      lessonId: submission.lesson_id,
      status: submission.status,
      fileName: submission.file_name,
      submittedAt: submission.submitted_at,
    },
  });
}

/* =====================================================
   TEACHER: STUDENTS + EVALUATION
===================================================== */

async function handleTeacherStudents(req, res) {
  const roster = await getEnrollmentsForTeacher(req.user.id);
  const courses = await getCoursesByTeacher(req.user.id);

  const studentMap = new Map();

  for (const course of courses) {
    const lessons = await getLessonsForCourse(course.id);
    const lessonMap = new Map(lessons.map((l) => [l.id, l]));
    const submissions = await getSubmissionsForCourse(course.id);

    for (const sub of submissions) {
      const studentEnrollment = roster.find(
        (r) => r.student_id === sub.student_id && r.course_id === course.id
      );
      const studentName = studentEnrollment?.student_name || "Student";
      const studentEmail = studentEnrollment?.student_email || "";
      const studentClass = studentEnrollment?.student_class || "General";
      const lesson = lessonMap.get(sub.lesson_id);

      if (!studentMap.has(sub.student_id)) {
        studentMap.set(sub.student_id, {
          id: sub.student_id,
          name: studentName,
          email: studentEmail,
          studentClass,
          submissions: [],
        });
      }

      studentMap.get(sub.student_id).submissions.push({
        id: sub.id,
        courseId: course.id,
        courseTitle: course.title,
        lessonId: sub.lesson_id,
        lessonTitle: lesson ? lesson.title : "Lesson",
        status: sub.status,
        remark: sub.remark,
        fileName: sub.file_name,
        fileData: sub.file_data,
        submittedAt: sub.submitted_at,
      });
    }
  }

  // Also include enrolled students who might not have submitted any work yet
  for (const row of roster) {
    if (!studentMap.has(row.student_id)) {
      studentMap.set(row.student_id, {
        id: row.student_id,
        name: row.student_name,
        email: row.student_email,
        studentClass: row.student_class || "General",
        submissions: [],
      });
    }
  }

  return sendJson(res, 200, { students: Array.from(studentMap.values()) });
}

async function handleTeacherCourseStudents(req, res, params) {
  const course = await getCourseById(params.id);
  if (!course || course.teacher_id !== req.user.id) {
    return sendJson(res, 404, { message: "Course not found." });
  }

  const lessons = await getLessonsForCourse(course.id);
  const enrollments = await getEnrollmentsForCourse(course.id);
  const allSubmissions = await getSubmissionsForCourse(course.id);
  const tasksByLesson = await taskMapForCourse(course.id);

  const students = [];
  for (const enrollment of enrollments) {
    const studentSubmissions = allSubmissions.filter((s) => s.student_id === enrollment.student_id);
    const completions = await getLessonCompletionsForCourseStudent(course.id, enrollment.student_id);
    const progress = buildLessonProgress(lessons, studentSubmissions, completions);

    students.push({
      enrollmentId: enrollment.id,
      studentId: enrollment.student_id,
      studentName: enrollment.student_name,
      studentEmail: enrollment.student_email,
      studentClass: enrollment.student_class || null,
      enrolledAt: enrollment.enrolled_at,
      progressPct: computeProgressPct(lessons, completions),
      lessons: lessons.map((lesson, index) => {
        const p = progress[index];
        const submission = studentSubmissions.find((s) => s.lesson_id === lesson.id) || null;
        return {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          completed: p.completed,
          status: p.status,
          remark: p.remark,
          hasTask: !!tasksByLesson.get(lesson.id),
          submissionId: submission?.id ?? null,
          fileName: submission?.file_name ?? null,
          fileData: submission?.file_data ?? null,
          submittedAt: submission?.submitted_at ?? null,
        };
      }),
    });
  }

  return sendJson(res, 200, { course: toPublicCourse(course, lessons, {}, tasksByLesson), students });
}

async function handleEvaluateSubmission(req, res, params) {
  const submission = await getSubmissionById(params.id);
  if (!submission) return sendJson(res, 404, { message: "Submission not found." });

  const course = await getCourseById(submission.course_id);
  if (!course || course.teacher_id !== req.user.id) {
    return sendJson(res, 404, { message: "Submission not found." });
  }

  const body = await readBody(req);
  const status = body.status === "approved" || body.status === "rejected" ? body.status : null;
  if (!status) return sendJson(res, 422, { message: "status must be 'approved' or 'rejected'." });

  const remark = typeof body.remark === "string" ? body.remark.trim().slice(0, 2000) : "";
  if (!remark) return sendJson(res, 422, { message: "A remark is required for the student." });

  await evaluateSubmission(submission.id, status, remark);
  return sendJson(res, 200, { message: "Submission evaluated." });
}

/* =====================================================
   COMMUNITY / POST HANDLERS
===================================================== */
async function handleListPosts(req, res) {
  const currentUser = await getCurrentUser(req);
  const posts = await getAllPosts(currentUser ? currentUser.id : null);
  return sendJson(res, 200, posts);
}

async function handleCreatePost(req, res) {
  const currentUser = await getCurrentUser(req);
  const body = await readBody(req, MAX_UPLOAD_BODY_BYTES);
  const { content, media_url, media_type } = body;

  if (!content && !media_url) {
    return sendJson(res, 422, { message: "Post must contain text content or media." });
  }

  const post = await createPost({
    authorId: currentUser.id,
    content: content || "",
    mediaUrl: media_url || null,
    mediaType: media_type || null,
  });

  const fullPost = await getPostById(post.id, currentUser.id);
  return sendJson(res, 201, fullPost);
}

async function handleGetPost(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const post = await getPostById(params.id, currentUser ? currentUser.id : null);
  if (!post) return sendJson(res, 404, { message: "Post not found." });
  return sendJson(res, 200, post);
}

async function handleAddPostComment(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const body = await readBody(req);
  const { content } = body;
  if (!content || !content.trim()) {
    return sendJson(res, 422, { message: "Comment content cannot be empty." });
  }
  const comment = await addPostComment({
    postId: params.id,
    userId: currentUser.id,
    content: content.trim(),
  });
  return sendJson(res, 201, comment);
}

async function handleGetPostComments(req, res, params) {
  const comments = await getPostComments(params.id);
  return sendJson(res, 200, comments);
}

async function handleToggleSavePost(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const result = await toggleSavePost(currentUser.id, params.id);
  return sendJson(res, 200, result);
}

async function handleListSavedPosts(req, res) {
  const currentUser = await getCurrentUser(req);
  const posts = await getSavedPosts(currentUser.id);
  return sendJson(res, 200, posts);
}

async function handleListMyPosts(req, res) {
  const currentUser = await getCurrentUser(req);
  const posts = await getUserPosts(currentUser.id);
  return sendJson(res, 200, posts);
}

async function handleUpdatePost(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const body = await readBody(req, MAX_UPLOAD_BODY_BYTES);
  const { content, media_url, media_type } = body;

  const updated = await updatePost({
    id: params.id,
    authorId: currentUser.id,
    content,
    mediaUrl: media_url,
    mediaType: media_type,
  });

  if (!updated) {
    return sendJson(res, 404, { message: "Post not found or unauthorized." });
  }

  return sendJson(res, 200, updated);
}

async function handleDeletePost(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const success = await deletePost({
    id: params.id,
    authorId: currentUser.id,
  });

  if (!success) {
    return sendJson(res, 404, { message: "Post not found or unauthorized." });
  }

  return sendJson(res, 200, { success: true, message: "Post deleted successfully." });
}

/* =====================================================
   TEACHER PROFILE & FOLLOW HANDLERS
===================================================== */
async function handleGetTeacherProfile(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const teacher = await findUserById(params.id);
  if (!teacher || teacher.role !== "teacher") {
    return sendJson(res, 404, { message: "Teacher not found." });
  }

  const followersCount = await getTeacherFollowersCount(params.id);
  const isFollowing = currentUser ? await isFollowingTeacher(currentUser.id, params.id) : false;
  const courses = await getCoursesByTeacher(params.id);

  return sendJson(res, 200, {
    teacher: toPublicUser(teacher),
    followersCount,
    isFollowing,
    courses,
  });
}

async function handleToggleFollowTeacher(req, res, params) {
  const currentUser = await getCurrentUser(req);
  if (currentUser.role === "teacher") {
    return sendJson(res, 403, { message: "Teachers cannot follow teachers." });
  }

  try {
    const result = await toggleFollowTeacher(currentUser.id, params.id);
    return sendJson(res, 200, result);
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}

async function handleFollowedTeachersCourses(req, res) {
  const currentUser = await getCurrentUser(req);
  const courses = await getCoursesFromFollowedTeachers(currentUser.id);
  return sendJson(res, 200, courses);
}

/* =====================================================
   FRIEND REQUESTS & FRIENDS HANDLERS
===================================================== */
async function handleSendFriendRequest(req, res) {
  const currentUser = await getCurrentUser(req);
  const body = await readBody(req);
  const { receiver_id } = body;

  if (!receiver_id) {
    return sendJson(res, 422, { message: "receiver_id is required." });
  }

  try {
    const result = await sendFriendRequest(currentUser.id, receiver_id);
    return sendJson(res, 201, result);
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}

async function handleRespondFriendRequest(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const body = await readBody(req);
  const { status } = body;

  if (!status || !["accepted", "rejected"].includes(status)) {
    return sendJson(res, 422, { message: "status must be 'accepted' or 'rejected'." });
  }

  try {
    const result = await respondFriendRequest(params.id, currentUser.id, status);
    return sendJson(res, 200, result);
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}

async function handleGetFriendRequests(req, res) {
  const currentUser = await getCurrentUser(req);
  const requests = await getFriendRequestsForUser(currentUser.id);
  return sendJson(res, 200, requests);
}

async function handleGetFriends(req, res) {
  const currentUser = await getCurrentUser(req);
  const friends = await getFriendsForUser(currentUser.id);
  return sendJson(res, 200, friends);
}

async function handleGetFriendshipStatus(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const status = await getFriendshipStatus(currentUser.id, params.targetId);
  return sendJson(res, 200, { status });
}

async function handleGetSuggestedFriends(req, res) {
  const currentUser = await getCurrentUser(req);
  const suggestions = await getSuggestedFriendsForUser(currentUser.id);
  return sendJson(res, 200, suggestions);
}

/* =====================================================
   CONVERSATIONS & MESSAGING & GROUPS HANDLERS
===================================================== */
async function handleGetConversations(req, res) {
  const currentUser = await getCurrentUser(req);
  const convs = await getConversationsForUser(currentUser.id);
  return sendJson(res, 200, convs);
}

async function handleCreateDirectConversation(req, res) {
  const currentUser = await getCurrentUser(req);
  const body = await readBody(req);
  const { target_user_id } = body;

  if (!target_user_id) {
    return sendJson(res, 422, { message: "target_user_id is required." });
  }

  const targetUser = await findUserById(target_user_id);
  if (!targetUser) return sendJson(res, 404, { message: "Target user not found." });

  const convId = await getOrCreateDirectConversation(currentUser.id, target_user_id);
  return sendJson(res, 200, { conversation_id: convId });
}

async function handleGetMessages(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const allowed = await isConversationParticipant(params.id, currentUser.id);
  if (!allowed) {
    return sendJson(res, 403, { message: "You're not a member of this conversation." });
  }
  const messages = await getMessagesForConversation(params.id);
  return sendJson(res, 200, messages);
}

async function handleSendMessage(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const allowed = await isConversationParticipant(params.id, currentUser.id);
  if (!allowed) {
    return sendJson(res, 403, { message: "You're not a member of this conversation." });
  }
  const body = await readBody(req);
  const { content, type, metadata } = body;

  const msg = await createMessage({
    conversationId: params.id,
    senderId: currentUser.id,
    content: content || "",
    type: type || "TEXT",
    metadata: metadata || null,
  });

  if (io) {
    io.to(params.id).emit("new_message", msg);
  }

  return sendJson(res, 201, msg);
}

async function handleListGroups(req, res) {
  const currentUser = await getCurrentUser(req);
  const groups = await getAllAvailableGroups(currentUser.id);
  return sendJson(res, 200, groups);
}

async function handleCreateGroup(req, res) {
  const currentUser = await getCurrentUser(req);
  const body = await readBody(req);
  const { name, description, icon, initial_member_ids } = body;

  if (!name || !name.trim()) {
    return sendJson(res, 422, { message: "Group name is required." });
  }

  const group = await createChatGroup({
    adminId: currentUser.id,
    name: name.trim(),
    description: description || "",
    icon: icon || "👥",
    initialMemberIds: Array.isArray(initial_member_ids) ? initial_member_ids : [],
  });

  return sendJson(res, 201, group);
}

async function handleRequestJoinGroup(req, res, params) {
  const currentUser = await getCurrentUser(req);
  try {
    const request = await requestToJoinGroup(params.id, currentUser.id);
    return sendJson(res, 201, request);
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}

async function handleGetPendingGroupJoinRequests(req, res) {
  const currentUser = await getCurrentUser(req);
  const requests = await getPendingGroupJoinRequests(currentUser.id);
  return sendJson(res, 200, requests);
}

async function handleRespondGroupJoinRequest(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const body = await readBody(req);
  const { status } = body;

  if (!status || !["approved", "rejected"].includes(status)) {
    return sendJson(res, 422, { message: "status must be 'approved' or 'rejected'." });
  }

  try {
    const result = await respondGroupJoinRequest(params.id, currentUser.id, status);
    return sendJson(res, 200, result);
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}

async function handleGetGroupMembers(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const allowed = await isGroupMember(params.id, currentUser.id);
  if (!allowed) {
    return sendJson(res, 403, { message: "You're not a member of this group." });
  }
  try {
    const members = await getGroupMembers(params.id);
    return sendJson(res, 200, members);
  } catch (err) {
    return sendJson(res, 404, { message: err.message });
  }
}

async function handleAddGroupMember(req, res, params) {
  const currentUser = await getCurrentUser(req);
  const body = await readBody(req);
  const { member_id } = body;

  if (!member_id) {
    return sendJson(res, 422, { message: "member_id is required." });
  }

  try {
    const member = await addGroupMember({ groupId: params.id, adminId: currentUser.id, memberId: member_id });
    return sendJson(res, 201, member);
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}

async function handleLeaveGroup(req, res, params) {
  const currentUser = await getCurrentUser(req);
  try {
    const result = await leaveGroup(params.id, currentUser.id);
    return sendJson(res, 200, result);
  } catch (err) {
    return sendJson(res, 400, { message: err.message });
  }
}

/* =====================================================
   ROUTER
===================================================== */

const routes = [
  { method: "POST", path: "/api/auth/signup", handler: handleSignup },
  { method: "POST", path: "/api/auth/login", handler: handleLogin },
  { method: "POST", path: "/api/auth/logout", handler: handleLogout },
  { method: "GET", path: "/api/auth/me", handler: handleMe },
  { method: "PATCH", path: "/api/auth/me", handler: handleMe },
  { method: "POST", path: "/api/auth/forgot-password", handler: handleForgotPassword },
  { method: "POST", path: "/api/auth/reset-password", handler: handleResetPassword },

  { method: "POST", path: "/api/focus/sessions", handler: requireAuth(handleCreateFocusSession) },
  { method: "GET", path: "/api/focus/stats", handler: requireAuth(handleFocusStats) },

  { method: "GET", path: "/api/organize/subjects", handler: requireAuth(handleListSubjects) },
  { method: "POST", path: "/api/organize/subjects", handler: requireAuth(handleCreateSubject) },
  { method: "DELETE", path: "/api/organize/subjects/:id", handler: requireAuth(handleDeleteSubject) },

  { method: "GET", path: "/api/organize/tasks", handler: requireAuth(handleListTasks) },
  { method: "POST", path: "/api/organize/tasks", handler: requireAuth(handleCreateTask) },
  { method: "PATCH", path: "/api/organize/tasks/:id", handler: requireAuth(handleUpdateTask) },
  { method: "DELETE", path: "/api/organize/tasks/:id", handler: requireAuth(handleDeleteTask) },

  { method: "GET", path: "/api/organize/summary", handler: requireAuth(handleOrganizeSummary) },

  { method: "GET", path: "/api/courses", handler: handleListCourses },
  { method: "POST", path: "/api/courses", handler: requireRole("teacher", handleCreateCourse) },
  { method: "GET", path: "/api/courses/:id", handler: handleGetCourse },
  { method: "PUT", path: "/api/courses/:id", handler: requireRole("teacher", handleUpdateCourse) },
  { method: "DELETE", path: "/api/courses/:id", handler: requireRole("teacher", handleDeleteCourse) },
  { method: "POST", path: "/api/courses/:id/enroll", handler: requireRole("student", handleEnroll) },
  { method: "POST", path: "/api/courses/:id/lessons/:lessonId/submit", handler: requireRole("student", handleSubmitLessonTask) },
  { method: "POST", path: "/api/courses/:id/lessons/:lessonId/complete", handler: requireRole("student", handleCompleteLesson) },

  { method: "PUT", path: "/api/courses/:id/lessons/:lessonId/task", handler: requireRole("teacher", handleSaveLessonTask) },
  { method: "DELETE", path: "/api/courses/:id/lessons/:lessonId/task", handler: requireRole("teacher", handleDeleteLessonTask) },
  { method: "GET", path: "/api/courses/:id/lessons/:lessonId/task", handler: handleGetLessonTask },

  { method: "GET", path: "/api/teacher/courses", handler: requireRole("teacher", handleTeacherCourses) },
  { method: "GET", path: "/api/teacher/students", handler: requireRole("teacher", handleTeacherStudents) },
  { method: "GET", path: "/api/teacher/courses/:id/students", handler: requireRole("teacher", handleTeacherCourseStudents) },
  { method: "POST", path: "/api/submissions/:id/evaluate", handler: requireRole("teacher", handleEvaluateSubmission) },

  { method: "GET", path: "/api/student/courses", handler: requireRole("student", handleStudentCourses) },
  { method: "GET", path: "/api/student/courses/:id", handler: requireRole("student", handleStudentCourseDetail) },
  { method: "GET", path: "/api/student/tasks", handler: requireRole("student", handleStudentTasks) },
  { method: "GET", path: "/api/teachers/top", handler: handleTopTeachers },

  // Community Posts
  { method: "GET", path: "/api/posts", handler: handleListPosts },
  { method: "POST", path: "/api/posts", handler: requireAuth(handleCreatePost) },
  { method: "GET", path: "/api/posts/saved", handler: requireAuth(handleListSavedPosts) },
  { method: "GET", path: "/api/posts/my-posts", handler: requireAuth(handleListMyPosts) },
  { method: "PUT", path: "/api/posts/:id", handler: requireAuth(handleUpdatePost) },
  { method: "DELETE", path: "/api/posts/:id", handler: requireAuth(handleDeletePost) },
  { method: "GET", path: "/api/posts/:id", handler: handleGetPost },
  { method: "POST", path: "/api/posts/:id/comments", handler: requireAuth(handleAddPostComment) },
  { method: "GET", path: "/api/posts/:id/comments", handler: handleGetPostComments },
  { method: "POST", path: "/api/posts/:id/save", handler: requireAuth(handleToggleSavePost) },

  // Teacher Profiles & Follows
  { method: "GET", path: "/api/teachers/:id", handler: handleGetTeacherProfile },
  { method: "POST", path: "/api/teachers/:id/follow", handler: requireRole("student", handleToggleFollowTeacher) },
  { method: "GET", path: "/api/student/followed-courses", handler: requireRole("student", handleFollowedTeachersCourses) },

  // Friends
  { method: "POST", path: "/api/friends/request", handler: requireAuth(handleSendFriendRequest) },
  { method: "POST", path: "/api/friends/requests/:id/respond", handler: requireAuth(handleRespondFriendRequest) },
  { method: "GET", path: "/api/friends/requests", handler: requireAuth(handleGetFriendRequests) },
  { method: "GET", path: "/api/friends/suggestions", handler: requireAuth(handleGetSuggestedFriends) },
  { method: "GET", path: "/api/friends", handler: requireAuth(handleGetFriends) },
  { method: "GET", path: "/api/friends/status/:targetId", handler: requireAuth(handleGetFriendshipStatus) },

  // Conversations & Messaging & Groups
  { method: "GET", path: "/api/conversations", handler: requireAuth(handleGetConversations) },
  { method: "POST", path: "/api/conversations/direct", handler: requireAuth(handleCreateDirectConversation) },
  { method: "GET", path: "/api/conversations/:id/messages", handler: requireAuth(handleGetMessages) },
  { method: "POST", path: "/api/conversations/:id/messages", handler: requireAuth(handleSendMessage) },
  { method: "GET", path: "/api/groups", handler: requireAuth(handleListGroups) },
  { method: "POST", path: "/api/groups", handler: requireAuth(handleCreateGroup) },
  { method: "POST", path: "/api/groups/:id/join", handler: requireAuth(handleRequestJoinGroup) },
  { method: "GET", path: "/api/groups/join-requests", handler: requireAuth(handleGetPendingGroupJoinRequests) },
  { method: "POST", path: "/api/groups/join-requests/:id/respond", handler: requireAuth(handleRespondGroupJoinRequest) },
  { method: "GET", path: "/api/groups/:id/members", handler: requireAuth(handleGetGroupMembers) },
  { method: "POST", path: "/api/groups/:id/members", handler: requireAuth(handleAddGroupMember) },
  { method: "POST", path: "/api/groups/:id/leave", handler: requireAuth(handleLeaveGroup) },
];

function matchRoute(method, pathname) {
  for (const route of routes) {
    if (route.method !== method) continue;

    const routeParts = route.path.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);
    if (routeParts.length !== pathParts.length) continue;

    const params = {};
    let matched = true;

    for (let i = 0; i < routeParts.length; i += 1) {
      const routePart = routeParts[i];
      const pathPart = pathParts[i];

      if (routePart.startsWith(":")) {
        params[routePart.slice(1)] = decodeURIComponent(pathPart);
      } else if (routePart !== pathPart) {
        matched = false;
        break;
      }
    }

    if (matched) return { route, params };
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/health") {
    return sendJson(res, 200, { status: "ok" });
  }

  const match = matchRoute(req.method, url.pathname);

  if (!match) {
    return sendJson(res, 404, { message: "Not found." });
  }

  try {
    await match.route.handler(req, res, match.params);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    if (statusCode === 500) {
      console.error(err);
    }
    sendJson(res, statusCode, { message: err.message || "Internal server error." });
  }
});

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS.length > 0 ? CORS_ORIGINS : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", async (socket) => {
  // Authenticate the socket using the same session cookie the REST API uses,
  // so we know which user this connection belongs to before trusting anything it asks to join.
  let socketUserId = null;
  try {
    const rawCookieHeader = socket.handshake.headers.cookie;
    if (rawCookieHeader) {
      const cookies = {};
      for (const pair of rawCookieHeader.split(";")) {
        const eqIndex = pair.indexOf("=");
        if (eqIndex === -1) continue;
        cookies[pair.slice(0, eqIndex).trim()] = decodeURIComponent(pair.slice(eqIndex + 1).trim());
      }
      const token = cookies[COOKIE_NAME];
      if (token) {
        const payload = verify(token, JWT_SECRET);
        if (payload && payload.sub) socketUserId = payload.sub;
      }
    }
  } catch (err) {
    socketUserId = null;
  }

  socket.on("join_conversation", async (conversationId) => {
    if (!conversationId || !socketUserId) return;
    const allowed = await isConversationParticipant(conversationId, socketUserId);
    if (allowed) socket.join(conversationId);
  });

  socket.on("leave_conversation", (conversationId) => {
    if (conversationId) socket.leave(conversationId);
  });

  socket.on("send_message", async (data) => {
    try {
      if (!socketUserId) throw new Error("Not authenticated.");
      const { conversationId, content, type, metadata } = data;
      const allowed = await isConversationParticipant(conversationId, socketUserId);
      if (!allowed) throw new Error("You're not a member of this conversation.");
      const msg = await createMessage({ conversationId, senderId: socketUserId, content, type, metadata });
      io.to(conversationId).emit("new_message", msg);
    } catch (err) {
      socket.emit("message_error", { message: err.message });
    }
  });
});

server.listen(PORT, () => {
  console.log(`StudySphere API listening on http://localhost:${PORT}`);
  console.log(`Allowing credentialed requests from ${CORS_ORIGIN}`);
});
