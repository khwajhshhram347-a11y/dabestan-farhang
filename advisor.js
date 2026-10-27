// advisor.js — دبستان فرهنگ
// خروجی: متن تحلیل + برنامه 7 روزه بر اساس عملکرد
// ورودی‌ها: results = {totalQ, correct, wrong, blank} و metrics = خروجی scoring.js

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function buildAdvisor(results, metrics) {
  const totalQ = Number(results?.totalQ ?? 0);
  const correct = Number(results?.correct ?? 0);
  const wrong = Number(results?.wrong ?? 0);
  const blank = Number(results?.blank ?? 0);

  const answered = correct + wrong;
  const accuracy = answered > 0 ? (correct / answered) * 100 : 0;

  // درصد با نمره منفی از scoring.js می‌آید
  const percent = Number(metrics?.percent ?? 0);

  // شاخص‌های تحلیلی
  const riskIndex = answered > 0 ? (wrong / answered) * 100 : 0;     // ریسک پاسخ غلط
  const blankRate = totalQ > 0 ? (blank / totalQ) * 100 : 0;         // نرخ سفید گذاشتن
  const attemptRate = totalQ > 0 ? (answered / totalQ) * 100 : 0;    // نرخ تلاش

  // ارزیابی سطح
  let levelTag = "متوسط";
  if (percent >= 65 && accuracy >= 75) levelTag = "قوی";
  if (percent < 45 || accuracy < 60) levelTag = "نیازمند تقویت";

  // توصیه‌های هوشمند آزمون تیزهوشان
  const tips = [];

  if (blankRate >= 20) {
    tips.push("نرخ «سفید» بالا است؛ مدیریت زمان و تکنیک رد کردنِ موقت سؤال‌های وقت‌گیر را تمرین کن.");
  } else {
    tips.push("نرخ «سفید» قابل قبول است؛ تمرکز را روی کاهش غلط‌ها بگذار تا تراز بهتر جهش کند.");
  }

  if (riskIndex >= 35) {
    tips.push("نرخ پاسخ‌های غلط بالاست؛ در آزمون‌های با نمره منفی ۳-۱ اگر بین گزینه‌ها شک شدید داری، حتماً سفید بگذار و شانسی نزن.");
  } else {
    tips.push("ریسک‌پذیری کنترل‌شده و منطقی است؛ می‌توانی با تسلط بیشتر روی مباحث، تعداد پاسخ‌های درست را افزایش دهی.");
  }

  if (accuracy < 70) {
    tips.push("دقت پاسخ‌گویی پایین‌تر از حد تیزهوشان است؛ حل آهسته و تحلیل تمام گزینه‌ها پیش از علامت زدن ضروری است.");
  } else {
    tips.push("دقت محاسباتی عالی است؛ با حفظ همین تمرکز، روی تکنیک‌های مدیریت زمان کار کن.");
  }

  // تحلیل دوگانه استانی (سیستان و بلوچستان) و کشوری
  const country = metrics?.country || {};
  const province = metrics?.province || {};

  const dual = {
    countryText:
      `در رقابت کشوری (جامعه ۱۲۰ هزار نفری)، تراز شما ${country.taraz} و رتبه تقریبی شما ${country.rank} ثبت شده است. این عملکرد در سطح «${levelTag}» ارزیابی می‌شود. با توجه به قانون نمره منفی ۳-۱، کلید طلایی پیشرفت در سطح کشوری حذف کامل اشتباهات محاسباتی ساده است.`,
    provinceText:
      `در سطح استان سیستان و بلوچستان (جامعه ۸۵۰۰ نفری)، تراز شما ${province.taraz} و رتبه تخمینی شما ${province.rank} است. تحلیل آماری نشان می‌دهد که تبدیل تنها ۲ تا ۳ پاسخ غلط به پاسخ درست یا سفید، رتبه استانی شما را با جهشی چشمگیر ارتقا خواهد داد.`
  };

  // برنامه راهبردی ۷ روزه
  const plan = [
    { day: "روز ۱", title: "کالبدشکافی اشتباهات", tasks: [
      "تمام سؤال‌های غلط و نزده را علامت بزن و علت را بنویس (بی‌دقتی، کمبود وقت یا بلد نبودن فرمول).",
      "نکات کلیدی تست‌ها را در دفترچه خودآموز ثبت کن."
    ]},
    { day: "روز ۲", title: "تمرین ضد نمره منفی", tasks: [
      "۲۰ سؤال تستی زمان‌دار با اعمال قانون منفی ۳-۱ حل کن.",
      "سؤالاتی که کوچک‌ترین شکی داری را عمداً علامت نزن تا یاد بگیری سفید بگذاری."
    ]},
    { day: "روز ۳", title: "سرعت و مهارت", tasks: [
      "دو پکیج ۱۰ سؤالی را با زمان فشرده حل کن.",
      "هدف: ثبت رکورد زمانی بدون افت دقت (حداقل دقت بالای ۷۵٪)."
    ]},
    { day: "روز ۴", title: "هوش و استعداد تحلیلی", tasks: [
      "۳۰ تست استاندارد هوش تصویری و منطقی کار کن.",
      "تست‌ها را بر اساس میزان سختی دسته‌بندی کن."
    ]},
    { day: "روز ۵", title: "تثبیت نقاط ضعف", tasks: [
      "مباحثی که در آزمون بیشترین اشتباه را داشتی بازخوانی کن.",
      "از همان مباحث ۱۵ تست آموزشی بدون گرفتن زمان حل کن."
    ]},
    { day: "روز ۶", title: "شبیه‌ساز کوچک", tasks: [
      "یک آزمون شبیه‌ساز ۲۰ سؤالی در شرایط دقیق و سکوت کامل خانه اجرا کن.",
      "بلافاصله کارنامه خود را محاسبه و تحلیل کن."
    ]},
    { day: "روز ۷", title: "جمع‌بندی و بازیابی", tasks: [
      "مرور سریع تمام نکات یادداشت‌شده در طول هفته.",
      "تنظیم ذهنیت مثبت برای ورود پرقدرت به آزمون بعدی."
    ]}
  ];

  return {
    percent,
    accuracy: Number(accuracy.toFixed(1)),
    attemptRate: Number(attemptRate.toFixed(1)),
    blankRate: Number(blankRate.toFixed(1)),
    riskIndex: Number(riskIndex.toFixed(1)),
    levelTag,
    tips,
    dual,
    plan
  };
}
