/* ==========================================================
   FARHANG EXAM ENGINE v2.3 - Fixed & Fallback Engine
   دبستان فرهنگ - موتور آزمون با پشتیبانی ارقام فارسی و تست خودکار
   ========================================================== */

const EXAMS_STORE_KEY = "farhang_exams_list";
const SESSIONS_STORE_KEY = "farhang_live_sessions";
const RETAKE_PERMISSIONS_KEY = "farhang_retake_permits";

// --- تبدیل ارقام فارسی به انگلیسی ---
function normalizePin(inputPin) {
  if (!inputPin) return "";
  const persianNumbers = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  let englishPin = String(inputPin).trim();
  for (let i = 0; i < 10; i++) {
    englishPin = englishPin.replace(persianNumbers[i], i);
  }
  return englishPin.replace(/\D/g, ""); // فقط ارقام
}

// --- 1. مدیریت آزمون‌ها (Exams CRUD) ---

function getAllExams() {
  try {
    let exams = JSON.parse(localStorage.getItem(EXAMS_STORE_KEY));
    if (!exams || !Array.isArray(exams) || exams.length === 0) {
      // ایجاد آزمون پیش‌فرض اضطراری برای جلوگیری از خطای "یافت نشد"
      const fallbackExam = {
        id: "ex_default_test",
        pin: "12345",
        title: "آزمون تستی اضطراری پایه ۶ دبستان فرهنگ",
        grade: 6,
        category: "جامع",
        difficulty: "استاندارد",
        duration: 15,
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
  if (config.category && config.category !== "") {
    pool = pool.filter(q => q.category === config.category);
  }
  if (config.difficulty && config.difficulty !== "") {
    pool = pool.filter(q => q.difficulty === config.difficulty);
  }

  if (config.shuffle) {
    pool = [...pool].sort(() => Math.random() - 0.5);
  }

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
  if (!exam.startTime || !exam.endTime) return { valid: true };

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = exam.startTime.split(':').map(Number);
  const [endH, endM] = exam.endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (currentMinutes < startMinutes) {
    return { valid: false, reason: `آزمون هنوز شروع نشده است. زمان آغاز: ${exam.startTime}` };
  }

  if (currentMinutes > endMinutes) {
    return { valid: false, reason: `مهلت این آزمون به پایان رسیده است. زمان پایان: ${exam.endTime}` };
  }

  return { valid: true };
}


// --- 2. مدیریت نشست‌های زنده و امنیت ---

function getLiveSessions() {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_STORE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveLiveSessions(sessions) {
  localStorage.setItem(SESSIONS_STORE_KEY, JSON.stringify(sessions));
}

function getRetakeMap() {
  try {
    return JSON.parse(localStorage.getItem(RETAKE_PERMISSIONS_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveRetakeMap(map) {
  localStorage.setItem(RETAKE_PERMISSIONS_KEY, JSON.stringify(map));
}

function checkStudentAccess(studentId, examPin) {
  const sessions = getLiveSessions();
  const permits = getRetakeMap();
  const sessionKey = `${studentId}_${examPin}`;

  const current = sessions.find(s => s.studentId === studentId && normalizePin(s.pin) === normalizePin(examPin));

  if (!current) {
    return { allowed: true };
  }

  if (current.status === "finished") {
    return { allowed: false, reason: "شما این آزمون را قبلاً با موفقیت به پایان رسانده‌اید." };
  }

  if (current.status === "left" || current.status === "suspicious") {
    if (permits[sessionKey] === true) {
      return { allowed: true, isResume: true };
    }
    return {
      allowed: false,
      reason: "نشست شما به دلیل خروج از آزمون بسته شد. برای ورود مجدد نیاز به تایید مستقیم سرپرست در لایو مانیتور دارید."
    };
  }

  return { allowed: true };
}

function registerStudentSession(student) {
  let sessions = getLiveSessions();
  const sessionKey = `${student.studentId}_${student.pin}`;
  
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

  const permits = getRetakeMap();
  if (permits[sessionKey]) {
    delete permits[sessionKey];
    saveRetakeMap(permits);
  }
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
    s.lastLeaveTime = new Date().toLocaleTimeString('fa-IR');
    saveLiveSessions(sessions);
  }
}

function completeStudentSession(studentId, examPin) {
  let sessions = getLiveSessions();
  const s = sessions.find(item => item.studentId === studentId && normalizePin(item.pin) === normalizePin(examPin));
  if (s) {
    s.status = "finished";
    s.progress = 100;
    s.finishTime = new Date().toLocaleTimeString('fa-IR');
    saveLiveSessions(sessions);
  }
}

function grantTeacherRetake(studentId, pin) {
  const map = getRetakeMap();
  map[`${studentId}_${pin}`] = true;
  saveRetakeMap(map);

  let sessions = getLiveSessions();
  const s = sessions.find(item => item.studentId === studentId && normalizePin(item.pin) === normalizePin(pin));
  if (s) {
    s.status = "online";
    saveLiveSessions(sessions);
  }
}
