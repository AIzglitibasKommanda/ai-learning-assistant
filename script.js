// ======= Global Data =======
let summarizedText = "";
let moodData = [];
let scoreData = [];
let chart;

// ======= Theme Toggle =======
const themeBtn = document.getElementById("themeToggle");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");
  if (document.body.classList.contains("light-mode")) {
    themeBtn.innerText = "🌙 Dark Mode";
  } else {
    themeBtn.innerText = "☀️ Light Mode";
  }
});

// ======= Summarizer =======
const summarizeBtn = document.getElementById("summarizeBtn");
summarizeBtn.addEventListener("click", () => {
  const text = document.getElementById("inputText").value;
  if (!text) {
    alert("Ievadi tekstu!");
    return;
  }
  // Simple summarization: first 3 sentences
  const sentences = text.split(".").filter(s => s.trim().length > 0);
  summarizedText = sentences.slice(0, Math.min(3, sentences.length)).join(". ") + ".";
  document.getElementById("summary").innerText = summarizedText;

  // Generate AI quiz from summary
  fetchAiQuiz(summarizedText);
});

// ======= AI-like Quiz Generator (Client-Side, No API) =======
function generateFakeQuiz(summary) {
  const sentences = summary.split(/[.?!]\s+/).filter(s => s);
  const questions = sentences.slice(0, 5).map((s, idx) => ({
    id: idx + 1,
    type: 'fill',
    question: s.replace(/\b(\w+)\b/, '_____'),
    choices: [],
    answer: s.match(/\b(\w+)\b/)[0]
  }));
  return questions;
}

function fetchAiQuiz(summary) {
  const container = document.getElementById("quizContent");
  container.innerHTML = "<p>🕒 Generating quiz...</p>";

  try {
    const data = { questions: generateFakeQuiz(summary) };
    renderAiQuiz(data.questions);
  } catch (e) {
    container.innerHTML = `<p>❌ Failed to generate quiz: ${e.message}</p>`;
  }
}

// Reuse your old renderAiQuiz function
function renderAiQuiz(questions) {
  const container = document.getElementById("quizContent");
  container.innerHTML = "";

  questions.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.classList.add('quiz-question');
    qDiv.innerHTML = `
      <p><strong>Q${idx + 1}:</strong> ${q.question}</p>
      <input type="text" id="answer${idx}" placeholder="Your answer"/>
      <button onclick="checkAiAnswer('${q.answer}', ${idx}, 'fill')">Check</button>
      <p id="result${idx}" class="result"></p><hr>`;
    container.appendChild(qDiv);
  });
}

function checkAiAnswer(correct, idx, type){
  const resultEl = document.getElementById(`result${idx}`);
  const inputEl = document.getElementById(`answer${idx}`);
  const userAns = inputEl.value.trim();
  inputEl.disabled = true;
  const ok = userAns.toLowerCase() === correct.toLowerCase();
  resultEl.innerText = ok ? "✅ Correct!" : `❌ Wrong! Correct: ${correct}`;
}

// Hook up button
document.getElementById("summarizeBtn").addEventListener("click", () => {
  const summaryInput = document.getElementById("tekstaKopsavilkums").value;
  if (!summaryInput.trim()) { alert("Enter text first!"); return; }
  fetchAiQuiz(summaryInput);
});

// ======= Mood Tracker =======
document.querySelectorAll(".moods button").forEach(btn => {
  btn.addEventListener("click", () => {
    const mood = btn.dataset.mood;
    const now = new Date();
    moodData.push({ time: now, value: mood });
    document.getElementById("moodResult").innerText = `Tava noskaņa šodien: ${mood}`;
    updateChart();
  });
});

// Save quiz score (0 or 100)
function saveScore(score) {
  const now = new Date();
  scoreData.push({ time: now, value: score * 100 });
  updateChart();
}

// ======= Chart.js =======
function updateChart() {
  const ctx = document.getElementById("progressChart").getContext("2d");
  const labels = scoreData.map(d => d.time.toLocaleTimeString());
  const scores = scoreData.map(d => d.value);
  const moods = moodData.map((d, i) => i + 1);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Rezultāts (%)',
        data: scores,
        borderColor: '#00d2ff',
        backgroundColor: 'rgba(0,210,255,0.2)',
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Noskaņa',
        data: moods,
        type: 'bar',
        backgroundColor: 'rgba(58,123,213,0.4)',
        yAxisID: 'y1'
      }
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

// Initialize empty chart
updateChart();



