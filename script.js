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

// ======= Summarizer =======
const summarizeBtn = document.getElementById("summarizeBtn");
summarizeBtn.addEventListener("click", () => {
  const text = document.getElementById("inputText").value;
  if (!text) { alert("Ievadi tekstu!"); return; }

  const sentences = text.split(/[.?!]\s+/).filter(s => s.trim().length > 0);
  summarizedText = sentences.slice(0, Math.min(5, sentences.length)).join(". ") + ".";
  document.getElementById("summary").innerText = summarizedText;

  // Generate quiz
  fetchQuiz(summarizedText);
});

// ======= Quiz Generator =======
function generateQuiz(summary) {
  const sentences = summary.split(/[.?!]\s+/).filter(s => s);
  const questions = sentences.slice(0, 5).map((s, idx) => {
    const wordMatch = s.match(/\b(\w+)\b/);
    const answer = wordMatch ? wordMatch[0] : "_____";
    return {
      id: idx + 1,
      type: "fill",
      question: s.replace(answer, "_____"),
      choices: [],
      answer: answer
    };
  });

  // Shuffle questions
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  return questions;
}

function fetchQuiz(summary) {
  const container = document.getElementById("quizContent");
  container.innerHTML = "<p>🕒 Generating quiz...</p>";

  try {
    const data = { questions: generateQuiz(summary) };
    renderQuiz(data.questions);
  } catch (e) {
    container.innerHTML = `<p>❌ Failed: ${e.message}</p>`;
  }
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
      <input type="text" id="answer${idx}" placeholder="Your answer"/>
      <button onclick="checkAnswer('${q.answer}', ${idx})">Check</button>
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

  // Save score (1 point per correct answer)
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
    document.getElementById("moodResult").innerText = `Tava noskaņa šodien: ${mood}`;
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
      { label: 'Rezultāts (%)', data: scores, borderColor: '#00d2ff', backgroundColor: 'rgba(0,210,255,0.2)', tension: 0.4, yAxisID: 'y' },
      { label: 'Noskaņa', data: moods, type: 'bar', backgroundColor: 'rgba(58,123,213,0.4)', yAxisID: 'y1' }
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
        y: { type: 'linear', position: 'left', title: { display: true, text: 'Score %' } },
        y1: { type: 'linear', position: 'right', title: { display: true, text: 'Mood' }, ticks: { display: false } }
      }
    }
  };

  if (chart) chart.destroy();
  chart = new Chart(ctx, config);
}

// ======= Initialize =======
updateChart();
