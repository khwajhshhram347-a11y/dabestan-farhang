/* ==========================================================
   FARHANG EXAM ENGINE - نسخه جامع نهایی
   دبستان فرهنگ - مدیریت آزمون‌ها و نشست‌های زنده
   ========================================================== */

const EXAMS_STORE_KEY = "farhang_exams_list";
const SESSIONS_STORE_KEY = "farhang_live_sessions";
const RETAKE_PERMISSIONS_KEY = "farhang_retake_permits";

function normalizePin(inputPin) {
  if (inputPin === null || inputPin === undefined) return "";
  let val = String(inputPin).trim();
  const digits = {
    '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
    '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'
  };
  val = val.replace(/[۰-۹٠-٩]/g, d => digits[d]);
  return val.toLowerCase();
}

function getAllExams() {
  try {
    let exams = JSON.parse(localStorage.getItem(EXAMS_STORE_KEY));
    if (!exams || !Array.isArray(exams) || exams.length === 0) {
      const fallbackExam = {
        id: "ex_default_test",
        pin: "12345",
        title: "آزمون تستی پیش‌فرض تیزهوشان",
        grade: 6,
        category: "جامع",
        difficulty: "استاندارد",
        duration: 30,
        startTime: "",
        endTime: "",
        questions: typeof getQuestionBank === "function" ? getQuestionBank().slice(0, 5) : [],
        questionCount: 5,
        status: "active",
        createdAt: "سیستم"
      };
      localStorage.setItem(EXAMS_STORE_KEY, JSON.stringify([fallbackExam]));
      return [fallbackExam];
    }
    return exams;
  } catch (e) {
    return [];
  }
}

function saveAllExams(exams) {
  localStorage.setItem(EXAMS_STORE_KEY, JSON.stringify(exams));
}

function generateExamPin() {
  return Math.floor(10000 + Math.random() * 90000).toString();
}

function createMultiExam(config) {
  const bank = typeof getQuestionBank === "function" ? getQuestionBank() : [];
  let pool = bank.filter(q => Number(q.grade) === Number(config.grade));
  if (config.category && config.category !== "") pool = pool.filter(q => q.category === config.category);
  if (config.difficulty && config.difficulty !== "") pool = pool.filter(q => q.difficulty === config.difficulty);
  if (config.shuffle) pool = [...pool].sort(() => Math.random() - 0.5);

  const selectedQuestions = pool.slice(0, Number(config.count));
  const pinCode = generateExamPin();

  const newExam = {
    id: "ex_" + Date.now(),
    pin: pinCode,
    title: config.title || `آزمون پایه ${config.grade} دبستان فرهنگ`,
    grade: Number(config.grade),
    category: config.category || "جامع",
    difficulty: config.difficulty || "استاندارد",
    duration: Number(config.duration) || 20,
    startTime: config.startTime || "",
    endTime: config.endTime || "",
    questions: selectedQuestions,
    questionCount: selectedQuestions.length,
    status: "active",
    createdAt: new Date().toLocaleTimeString('fa-IR') + ' - ' + new Date().toLocaleDateString('fa-IR')
  };

  const exams = getAllExams();
  exams.unshift(newExam);
  saveAllExams(exams);
  return newExam;
}

function getExamByPin(pin) {
  const cleanPin = normalizePin(pin);
  const exams = getAllExams();
  return exams.find(e => normalizePin(e.pin) === cleanPin && e.status === "active");
}

function deleteExamById(examId) {
  const exams = getAllExams().filter(e => e.id !== examId);
  saveAllExams(exams);
}

function validateExamTiming(exam) {
  return { valid: true };
}

function getLiveSessions() {
  try { return JSON.parse(localStorage.getItem(SESSIONS_STORE_KEY)) || []; } catch (e) { return []; }
}

function saveLiveSessions(sessions) {
  localStorage.setItem(SESSIONS_STORE_KEY, JSON.stringify(sessions));
}

function getRetakeMap() {
  try { return JSON.parse(localStorage.getItem(RETAKE_PERMISSIONS_KEY)) || {}; } catch (e) { return {}; }
}

function saveRetakeMap(map) {
  localStorage.setItem(RETAKE_PERMISSIONS_KEY, JSON.stringify(map));
}

function checkStudentAccess(studentId, examPin) {
  return { allowed: true };
}

function registerStudentSession(student) {
  let sessions = getLiveSessions();
  const idx = sessions.findIndex(s => s.studentId === student.studentId && normalizePin(s.pin) === normalizePin(student.pin));

  const sessionObj = {
    studentId: student.studentId,
    studentName: student.studentName,
    grade: student.grade,
    pin: normalizePin(student.pin),
    examTitle: student.examTitle,
    status: "online",
    progress: 0,
    warnings: 0,
    startTime: new Date().toLocaleTimeString('fa-IR'),
    lastPing: Date.now()
  };

  if (idx !== -1) {
    sessions[idx] = { ...sessions[idx], status: "online", lastPing: Date.now() };
  } else {
    sessions.push(sessionObj);
  }

  saveLiveSessions(sessions);
}

function updateStudentProgress(studentId, examPin, answeredCount, totalCount) {
  let sessions = getLiveSessions();
  const s = sessions.find(item => item.studentId === studentId && normalizePin(item.pin) === normalizePin(examPin));
  if (s) {
    s.progress = Math.round((answeredCount / totalCount) * 100);
    s.lastPing = Date.now();
    saveLiveSessions(sessions);
  }
}

function flagSuspiciousLeave(studentId, examPin) {
  let sessions = getLiveSessions();
  const s = sessions.find(item => item.studentId === studentId && normalizePin(item.pin) === normalizePin(examPin));
  if (s && s.status !== "finished") {
    s.status = "suspicious";
    s.warnings = (s.warnings || 0) + 1;
    saveLiveSessions(sessions);
  }
}

function completeStudentSession(studentId, examPin) {
  let sessions = getLiveSessions();
  const s = sessions.find(item => item.studentId === studentId && normalizePin(item.pin) === normalizePin(examPin));
  if (s) {
    s.status = "finished";
    s.progress = 100;
    saveLiveSessions(sessions);
  }
}

function grantTeacherRetake(studentId, pin) {
  let sessions = getLiveSessions();
  const s = sessions.find(item => item.studentId === studentId && normalizePin(item.pin) === normalizePin(pin));
  if (s) {
    s.status = "online";
    saveLiveSessions(sessions);
  }
}
