// ======================================================
// موتور آزمون — دبستان فرهنگ
// نسخه مقاوم: جست‌وجوی پین بدون خطای مقایسه
// ======================================================

const EXAMS_STORE_KEY = "farhang_exams_list";

// تبدیل ارقام فارسی/عربی به لاتین و پاک‌سازی فاصله‌ها
function normalizePin(value) {
  if (value === null || value === undefined) return "";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  const arabic  = "٠١٢٣٤٥٦٧٨٩";
  let out = "";
  const str = String(value).trim();
  for (const ch of str) {
    const p = persian.indexOf(ch);
    const a = arabic.indexOf(ch);
    if (p > -1) out += String(p);
    else if (a > -1) out += String(a);
    else out += ch;
  }
  return out.replace(/\s+/g, "");
}

function getAllExams() {
  try {
    const raw = localStorage.getItem(EXAMS_STORE_KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
  return createExam(config);
}

function createExam(config) {
  const selectedQuestions = pickQuestionsForExam(config);
  const newExam = {
    id: "ex_" + Date.now(),
    pin: generateExamPin(),
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
    createdAt: new Date().toLocaleTimeString("fa-IR") + " - " + new Date().toLocaleDateString("fa-IR")
  };

  const exams = getAllExams();
  exams.unshift(newExam);
  saveAllExams(exams);
  return newExam;
}

// جست‌وجوی مقاوم: بدون قید سخت‌گیرانه روی type و status
function getExamByPin(pin) {
  const target = normalizePin(pin);
  if (!target) return null;

  const exams = getAllExams();
  const found = exams.find(e => normalizePin(e.pin) === target);

  if (!found) return null;

  // فقط آزمون‌های بسته یا حذف‌شده رد می‌شوند
  const status = String(found.status || "active").trim().toLowerCase();
  if (status === "closed" || status === "archived" || status === "deleted") return null;

  return found;
}

function deleteExam(pin) {
  const target = normalizePin(pin);
  const exams = getAllExams().filter(e => normalizePin(e.pin) !== target);
  saveAllExams(exams);
}
