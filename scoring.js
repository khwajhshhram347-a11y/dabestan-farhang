// scoring.js

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function erf(x) {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

function normalCDF(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }

function calcTizhooshanMetrics({ totalQ, correct, wrong, blank }) {
    // فرمول 3-1
    const raw = (3 * correct) - (1 * wrong);
    const maxRaw = 3 * totalQ;
    const percent = (raw / maxRaw) * 100;

    // جامعه آماری: کشوری (120k) و استانی (8.5k)
    // میانگین‌ها فرضی و منطقی برای تیزهوشان
    const country = { participants: 120000, mean: 48, std: 18 };
    const province = { participants: 8500, mean: 50, std: 17 };

    const zCountry = (percent - country.mean) / country.std;
    const zProvince = (percent - province.mean) / province.std;

    return {
        percent: percent.toFixed(1),
        country: { 
            taraz: Math.round(5000 + 1000 * zCountry), 
            rank: Math.ceil((1 - normalCDF(zCountry)) * country.participants) 
        },
        province: { 
            taraz: Math.round(5000 + 1000 * zProvince), 
            rank: Math.ceil((1 - normalCDF(zProvince)) * province.participants) 
        }
    };
}
