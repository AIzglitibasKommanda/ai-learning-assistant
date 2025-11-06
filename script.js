// ======= Global Data =======
let summarizedText = "";
let moodData = JSON.parse(localStorage.getItem("moodData") || "[]");
let scoreData = JSON.parse(localStorage.getItem("scoreData") || "[]");
let chart;

// ======= Theme Toggle =======
const themeBtn = document.getElementById("themeToggle");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  themeBtn.innerText = document.body.classList.contains("light-mode") ? "🌙 Dark Mode" : "☀️ Light Mode";
});

// ======= Language Switcher =======
const translations = {
  lv: {
    title: "AI Learning Assistant",
    summarizerTitle: "AI Teksta Kopsavilkums",
    summarizeBtn: "Īss kopsavilkums",
    summaryPlaceholder: "Ievadi tekstu šeit...",
    quickQuizTitle: "Ātrais tests",
    quizPlaceholder: "Ģenerē kopsavilkumu, lai izveidotu dinamisko viktorīnu.",
    moodTitle: "Noskaņas reģistrācija",
    moodPriecigs: "Priecīgs 😄",
    moodNeitrals: "Neitrāls 😐",
    moodSkumjs: "Skumjš 😢",
    moodResult: "Tava noskaņa šodien: ",
    progressTitle: "Progresu diagramma",
    timeframeLabel: "Izvēlies laika periodu:",
    timeframeHourly: "Stundu",
    timeframeDaily: "Dienu",
    timeframeWeekly: "Nedēļu",
    timeframeMonthly: "Mēnesi",
  },
  en: {
    title: "AI Learning Assistant",
    summarizerTitle: "AI Text Summary",
    summarizeBtn: "Summarize",
    summaryPlaceholder: "Enter text here...",
    quickQuizTitle: "Quick Quiz",
    quizPlaceholder: "Generate a summary to create a dynamic quiz.",
    moodTitle: "Mood Tracker",
    moodPriecigs: "Happy 😄",
    moodNeutrals: "Neutral 😐",
    moodSkumjs: "Sad 😢",
    moodResult: "Your mood today: ",
    progressTitle: "Progress Chart",
    timeframeLabel: "Select time period:",
    timeframeHourly: "Hourly",
    timeframeDaily: "Daily",
    timeframeWeekly: "Weekly",
    timeframeMonthly: "Monthly",
  }
};


let currentLang = "lv";

function updateLanguage(lang) {
  currentLang = lang;
  const t = translations[lang];

  document.querySelector("header h1").innerText = t.title;

  // Summarizer
  document.getElementById("summarizerTitle").innerText = t.summarizerTitle;
  document.getElementById("summarizeBtn").innerText = t.summarizeBtn;
  document.getElementById("inputText").placeholder = t.summaryPlaceholder;

  // Quick Quiz
  document.getElementById("quizTitle").innerText = t.quickQuizTitle;

  const quizContent = document.getElementById("quizContent");
  // Only change placeholder text if no quiz is generated
  if (!quizContent.innerHTML.trim() || quizContent.innerHTML.includes(translations["lv"].quizPlaceholder) || quizContent.innerHTML.includes(translations["en"].quizPlaceholder)) {
    quizContent.innerHTML = t.quizPlaceholder;
  }

  // Mood tracker
  document.querySelector("#mood-tracker h2").innerText = t.moodTitle;
  const moodButtons = document.querySelectorAll(".moods button");
  moodButtons[0].innerText = t.moodPriecigs;
  moodButtons[1].innerText = t.moodNeitrals;
  moodButtons[2].innerText = t.moodSkumjs;
  const moodResultEl = document.getElementById("moodResult");
  if (moodResultEl.innerText.includes(translations["lv"].moodResult) || moodResultEl.innerText.includes(translations["en"].moodResult)) {
    moodResultEl.innerText = t.moodResult + (moodData[moodData.length - 1]?.value || "");
  }

  // Progress chart
  document.querySelector("#progress h2").innerText = t.progressTitle;
  document.querySelector("#progress label").innerText = t.timeframeLabel;
  const timeframe = document.getElementById("timeframe");
  timeframe.options[0].text = t.timeframeHourly;
  timeframe.options[1].text = t.timeframeDaily;
  timeframe.options[2].text = t.timeframeWeekly;
  timeframe.options[3].text = t.timeframeMonthly;
}


// ======= Summarizer =======
const summarizeBtn = document.getElementById("summarizeBtn");
summarizeBtn.addEventListener("click", () => {
  const text = document.getElementById("inputText").value;
  if (!text) { 
    alert(currentLang === "lv" ? "Ievadi tekstu!" : "Please enter text!");
    return; 
  }

  const sentences = text.split(/[.?!]\s+/).filter(s => s.trim().length > 0);
  summarizedText = sentences.slice(0, Math.min(5, sentences.length)).join(". ") + ".";
  document.getElementById("summary").innerText = summarizedText;

  // Generate quiz
  fetchQuiz(summarizedText);
});

// ======= Improved Quiz Generator =======
function generateQuiz(summary, lang = currentLang) {
  const sentences = summary.split(/[.?!]\s+/).filter(s => s);
  
  const questions = sentences.slice(0, 5).map((s, idx) => {
    const words = s.match(/\b\w+\b/g) || [];
    const filtered = words.filter(w => !["es","tu","viņš","viņa","mēs","jūs","they","he","she","it","I","you","we"].includes(w.toLowerCase()));
    const answer = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : words[0];

    const questionText = s.replace(answer, "_____");

    let choices = [answer];
    const similarWords = words.filter(w => w !== answer);
    while (choices.length < Math.min(4, words.length)) {
      const pick = similarWords[Math.floor(Math.random() * similarWords.length)];
      if (!choices.includes(pick)) choices.push(pick);
    }

    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    return {
      id: idx + 1,
      type: choices.length > 1 ? "mcq" : "fill",
      question: questionText,
      choices: choices.length > 1 ? choices : [],
      answer: answer
    };
  });

  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions;
}

// ======= Render Quiz =======
function renderQuiz(questions) {
  const container = document.getElementById("quizContent");
  container.innerHTML = "";

  questions.forEach((q, idx) => {
    const qDiv = document.createElement("div");
    qDiv.classList.add("quiz-question");
    qDiv.innerHTML = `
      <p><strong>Q${idx + 1}:</strong> ${q.question}</p>
      <input type="text" id="answer${idx}" placeholder="${currentLang === 'lv' ? 'Tava atbilde' : 'Your answer'}"/>
      <button onclick="checkAnswer('${q.answer}', ${idx})">${currentLang === 'lv' ? 'Pārbaudīt' : 'Check'}</button>
      <p id="result${idx}" class="result"></p><hr>
    `;
    container.appendChild(qDiv);
  });
}

// ======= Check Answer =======
function checkAnswer(correct, idx) {
  const resultEl = document.getElementById(`result${idx}`);
  const inputEl = document.getElementById(`answer${idx}`);
  const userAns = inputEl.value.trim();
  inputEl.disabled = true;

  const ok = userAns.toLowerCase() === correct.toLowerCase();
  resultEl.innerText = ok ? "✅ Correct!" : `❌ Wrong! Correct: ${correct}`;

  const score = ok ? 1 : 0;
  scoreData.push({ time: new Date().toISOString(), value: score * 100 });
  localStorage.setItem("scoreData", JSON.stringify(scoreData));
  updateChart();
}

// ======= Mood Tracker =======
document.querySelectorAll(".moods button").forEach(btn => {
  btn.addEventListener("click", () => {
    const mood = btn.dataset.mood;
    const now = new Date().toISOString();
    moodData.push({ time: now, value: mood });
    localStorage.setItem("moodData", JSON.stringify(moodData));
    document.getElementById("moodResult").innerText = translations[currentLang].moodResult + mood;
    updateChart();
  });
});

// ======= Chart.js =======
function updateChart() {
  const ctx = document.getElementById("progressChart").getContext("2d");
  const labels = scoreData.map(d => new Date(d.time).toLocaleTimeString());
  const scores = scoreData.map(d => d.value);
  const moods = moodData.map((d, i) => i + 1);

  const chartData = {
    labels: labels,
    datasets: [
      { label: currentLang === 'lv' ? 'Rezultāts (%)' : 'Score (%)', data: scores, borderColor: '#00d2ff', backgroundColor: 'rgba(0,210,255,0.2)', tension: 0.4, yAxisID: 'y' },
      { label: currentLang === 'lv' ? 'Noskaņa' : 'Mood', data: moods, type: 'bar', backgroundColor: 'rgba(58,123,213,0.4)', yAxisID: 'y1' }
    ]
  };

  const config = {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      stacked: false,
      scales: {
        y: { type: 'linear', position: 'left', title: { display: true, text: currentLang === 'lv' ? 'Rezultāts %' : 'Score %' } },
        y1: { type: 'linear', position: 'right', title: { display: true, text: currentLang === 'lv' ? 'Noskaņa' : 'Mood' }, ticks: { display: false } }
      }
    }
  };

  if (chart) chart.destroy();
  chart = new Chart(ctx, config);
}

// ======= Initialize =======
updateChart();
updateLanguage(currentLang);


