// question-bank.js
// مدیریت بانک سوالات چندپایه دبستان فرهنگ

const QUESTION_BANK_KEY = "farhangQuestionBank";

function getQuestionBank() {
  try {
    return JSON.parse(localStorage.getItem(QUESTION_BANK_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveQuestionBank(bank) {
  localStorage.setItem(QUESTION_BANK_KEY, JSON.stringify(bank));
}

function generateQuestionId() {
  return "q_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
}

function addQuestion(questionData) {
  const bank = getQuestionBank();

  const question = {
    id: generateQuestionId(),
    grade: Number(questionData.grade),
    category: questionData.category,
    difficulty: questionData.difficulty,
    question: questionData.question,
    choices: [
      questionData.choiceA,
      questionData.choiceB,
      questionData.choiceC,
      questionData.choiceD
    ],
    answer: questionData.answer,
    tags: questionData.tags || "",
    createdAt: new Date().toISOString()
  };

  bank.push(question);
  saveQuestionBank(bank);
  return question;
}

function updateQuestion(id, newData) {
  const bank = getQuestionBank();
  const index = bank.findIndex(q => q.id === id);

  if (index === -1) return false;

  bank[index] = {
    ...bank[index],
    grade: Number(newData.grade),
    category: newData.category,
    difficulty: newData.difficulty,
    question: newData.question,
    choices: [
      newData.choiceA,
      newData.choiceB,
      newData.choiceC,
      newData.choiceD
    ],
    answer: newData.answer,
    tags: newData.tags || ""
  };

  saveQuestionBank(bank);
  return true;
}

function deleteQuestion(id) {
  const bank = getQuestionBank();
  const newBank = bank.filter(q => q.id !== id);
  saveQuestionBank(newBank);
  return true;
}

function getQuestionsByGrade(grade) {
  const bank = getQuestionBank();
  return bank.filter(q => Number(q.grade) === Number(grade));
}

function getQuestionsByFilters({ grade, category, difficulty }) {
  const bank = getQuestionBank();
  return bank.filter(q => {
    const gradeOk = grade ? Number(q.grade) === Number(grade) : true;
    const categoryOk = category ? q.category === category : true;
    const difficultyOk = difficulty ? q.difficulty === difficulty : true;
    return gradeOk && categoryOk && difficultyOk;
  });
}

function seedSampleQuestions() {
  const bank = getQuestionBank();
  if (bank.length > 0) return;

  const samples = [
    {
      grade: 6,
      category: "ریاضی",
      difficulty: "medium",
      question: "حاصل 3/4 + 1/2 کدام است؟",
      choiceA: "5/4",
      choiceB: "4/6",
      choiceC: "3/8",
      choiceD: "7/8",
      answer: "A",
      tags: "کسر"
    },
    {
      grade: 6,
      category: "علوم",
      difficulty: "easy",
      question: "کدام مورد جزو حالت‌های ماده است؟",
      choiceA: "نور",
      choiceB: "جامد",
      choiceC: "صدا",
      choiceD: "انرژی",
      answer: "B",
      tags: "ماده"
    },
    {
      grade: 3,
      category: "فارسی",
      difficulty: "easy",
      question: "کدام کلمه از نظر املایی درست است؟",
      choiceA: "مسول",
      choiceB: "مسئول",
      choiceC: "مصول",
      choiceD: "مسوول",
      answer: "B",
      tags: "املاء"
    }
  ];

  const formatted = samples.map(item => ({
    id: generateQuestionId(),
    grade: item.grade,
    category: item.category,
    difficulty: item.difficulty,
    question: item.question,
    choices: [item.choiceA, item.choiceB, item.choiceC, item.choiceD],
    answer: item.answer,
    tags: item.tags,
    createdAt: new Date().toISOString()
  }));

  saveQuestionBank(formatted);
}
