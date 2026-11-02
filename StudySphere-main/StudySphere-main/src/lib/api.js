// Thin fetch wrapper for talking to the StudySphere auth API.
// `credentials: "include"` is required on every call so the browser
// sends/receives the httpOnly session cookie set by the backend.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", body } = {}) {
  let res;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Can't reach the server. Is the backend running on " + API_BASE_URL + "?",
      0,
      null
    );
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No/invalid JSON body — fine for some responses.
  }

  if (!res.ok) {
    throw new ApiError(data?.message || "Something went wrong.", res.status, data);
  }

  return data;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data; // may contain field-level `errors`
  }
}

export const authApi = {
  signup: (payload) => request("/api/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  me: () => request("/api/auth/me"),
  updateProfile: (payload) => request("/api/auth/me", { method: "PATCH", body: payload }),
  forgotPassword: (payload) => request("/api/auth/forgot-password", { method: "POST", body: payload }),
  resetPassword: (payload) => request("/api/auth/reset-password", { method: "POST", body: payload }),
};

// Focus sessions: every logged session is stored per-user, per-day on the
// backend — stats (today/week/all-time/streak/day-by-day history) are
// computed from those real records, not hardcoded on a page.
export const focusApi = {
  logSession: (payload) => request("/api/focus/sessions", { method: "POST", body: payload }),
  stats: () => request("/api/focus/stats"),
};

// Organize: subjects + tasks are real per-user records the student
// creates, completes, and deletes — not fixed sample data.
export const organizeApi = {
  listSubjects: () => request("/api/organize/subjects"),
  createSubject: (payload) => request("/api/organize/subjects", { method: "POST", body: payload }),
  deleteSubject: (id) => request(`/api/organize/subjects/${id}`, { method: "DELETE" }),

  listTasks: (date) => request(`/api/organize/tasks${date ? `?date=${date}` : ""}`),
  createTask: (payload) => request("/api/organize/tasks", { method: "POST", body: payload }),
  setTaskCompleted: (id, completed) =>
    request(`/api/organize/tasks/${id}`, { method: "PATCH", body: { completed } }),
  deleteTask: (id) => request(`/api/organize/tasks/${id}`, { method: "DELETE" }),

  summary: () => request("/api/organize/summary"),
};

// Courses: created by a teacher (with lessons), browsed/enrolled by
// students, and backed by the real database — not localStorage.
export const courseApi = {
  list: () => request("/api/courses"),
  get: (id) => request(`/api/courses/${id}`),
  create: (payload) => request("/api/courses", { method: "POST", body: payload }),
  update: (id, payload) => request(`/api/courses/${id}`, { method: "PUT", body: payload }),
  delete: (id) => request(`/api/courses/${id}`, { method: "DELETE" }),
  enroll: (id) => request(`/api/courses/${id}/enroll`, { method: "POST" }),
  submitLessonTask: (courseId, lessonId, payload) =>
    request(`/api/courses/${courseId}/lessons/${lessonId}/submit`, { method: "POST", body: payload }),
  // Marking a lesson "done" is independent of the task/submission flow —
  // this is what drives the course progress bar.
  completeLesson: (courseId, lessonId, completed = true) =>
    request(`/api/courses/${courseId}/lessons/${lessonId}/complete`, { method: "POST", body: { completed } }),

  // Teacher-authored lesson task ("DPP"): a title/instructions and an
  // optional real PDF attachment, saved per lesson.
  saveLessonTask: (courseId, lessonId, payload) =>
    request(`/api/courses/${courseId}/lessons/${lessonId}/task`, { method: "PUT", body: payload }),
  deleteLessonTask: (courseId, lessonId) =>
    request(`/api/courses/${courseId}/lessons/${lessonId}/task`, { method: "DELETE" }),
  // Includes the actual PDF bytes (fileData) — only fetch this when the
  // file is actually about to be viewed/downloaded.
  getLessonTask: (courseId, lessonId) => request(`/api/courses/${courseId}/lessons/${lessonId}/task`),

  // Teacher's own courses + the "Students" section of the teacher dashboard.
  myCourses: () => request("/api/teacher/courses"),
  allStudents: () => request("/api/teacher/students"),
  courseStudents: (courseId) => request(`/api/teacher/courses/${courseId}/students`),
  evaluateSubmission: (submissionId, payload) =>
    request(`/api/submissions/${submissionId}/evaluate`, { method: "POST", body: payload }),

  // Student's enrolled courses, each with per-lesson lock/remark status.
  myEnrolledCourses: () => request("/api/student/courses"),
  myEnrolledCourse: (courseId) => request(`/api/student/courses/${courseId}`),
  // Every lesson task ("DPP") across every enrolled course, with this
  // student's own submission status — powers the dashboard Tasks section.
  studentTasks: () => request("/api/student/tasks"),

  // Top instructors across the platform
  topTeachers: () => request("/api/teachers/top"),
};

export const communityApi = {
  listPosts: () => request("/api/posts"),
  createPost: (payload) => request("/api/posts", { method: "POST", body: payload }),
  getPost: (id) => request(`/api/posts/${id}`),
  updatePost: (id, payload) => request(`/api/posts/${id}`, { method: "PUT", body: payload }),
  deletePost: (id) => request(`/api/posts/${id}`, { method: "DELETE" }),
  addComment: (id, payload) => request(`/api/posts/${id}/comments`, { method: "POST", body: payload }),
  getComments: (id) => request(`/api/posts/${id}/comments`),
  toggleSave: (id) => request(`/api/posts/${id}/save`, { method: "POST" }),
  savedPosts: () => request("/api/posts/saved"),
  myPosts: () => request("/api/posts/my-posts"),
};

export const teacherApi = {
  getProfile: (teacherId) => request(`/api/teachers/${teacherId}`),
  toggleFollow: (teacherId) => request(`/api/teachers/${teacherId}/follow`, { method: "POST" }),
  followedCourses: () => request("/api/student/followed-courses"),
};

export const friendApi = {
  sendRequest: (receiverId) => request("/api/friends/request", { method: "POST", body: { receiver_id: receiverId } }),
  respondRequest: (requestId, status) => request(`/api/friends/requests/${requestId}/respond`, { method: "POST", body: { status } }),
  getRequests: () => request("/api/friends/requests"),
  getFriends: () => request("/api/friends"),
  getStatus: (targetId) => request(`/api/friends/status/${targetId}`),
  getSuggestions: () => request("/api/friends/suggestions"),
};

export const messagingApi = {
  getConversations: () => request("/api/conversations"),
  createDirect: (targetUserId) => request("/api/conversations/direct", { method: "POST", body: { target_user_id: targetUserId } }),
  getMessages: (conversationId) => request(`/api/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, payload) => request(`/api/conversations/${conversationId}/messages`, { method: "POST", body: payload }),
  listGroups: () => request("/api/groups"),
  createGroup: (payload) => request("/api/groups", { method: "POST", body: payload }),
  joinGroup: (groupId) => request(`/api/groups/${groupId}/join`, { method: "POST" }),
  getPendingJoinRequests: () => request("/api/groups/join-requests"),
  respondJoinRequest: (requestId, status) => request(`/api/groups/join-requests/${requestId}/respond`, { method: "POST", body: { status } }),
  getGroupMembers: (groupId) => request(`/api/groups/${groupId}/members`),
  addGroupMember: (groupId, memberId) => request(`/api/groups/${groupId}/members`, { method: "POST", body: { member_id: memberId } }),
  leaveGroup: (groupId) => request(`/api/groups/${groupId}/leave`, { method: "POST" }),
};

/** Turns a base64 PDF payload into a same-tab-safe Blob URL and opens it.
 *  Browsers block navigating a new tab straight to a `data:` URL, so this
 *  is the one safe way to let someone view/download a submitted or
 *  assigned PDF. Caller should revoke the URL when done if reused often. */
export function openBase64Pdf(fileName, base64Data) {
  if (!base64Data) return;
  const byteChars = atob(base64Data);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i += 1) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    // Popup blocked — fall back to a download so the file isn't lost.
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || "document.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
