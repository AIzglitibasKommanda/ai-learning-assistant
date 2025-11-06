// ======= Global Data =======
let summarizedText = "";
let moodData = [];
let scoreData = [];

// ======= Theme Toggle =======
const themeBtn = document.getElementById("themeToggle");
themeBtn.addEventListener("click", ()=>{
  document.body.classList.toggle("light-mode");
  if(document.body.classList.contains("light-mode")) {
    themeBtn.innerText = "🌙 Dark Mode";
  } else {
    themeBtn.innerText = "☀️ Light Mode";
  }
});

// ======= Summarizer =======
document.getElementById("summarizeBtn").addEventListener("click", () => {
  const text = document.getElementById('inputText').value;
  if(!text){ alert("Ievadi tekstu!"); return; }
  const sentences = text.split('.');
  summarizedText = sentences.slice(0, Math.min(3,sentences.length)).join('. ') + '.';
  document.getElementById('summary').innerText = summarizedText;
  generateQuiz();
});

// ======= Quiz =======
function generateQuiz() {
  if(!summarizedText) return;
  const sentences = summarizedText.split(". ").filter(s=>s.length>5);
  const container = document.getElementById("quizContent");
  container.innerHTML = "";

  sentences.forEach((sentence, idx)=>{
    const words = sentence.split(" ");
    const keywordIndex = Math.floor(words.length/2);
    const answer = words[keywordIndex].replace(/[.,]/g,""); // clean punctuation
    const questionText = sentence.replace(words[keywordIndex],"_____");

    const qDiv = document.createElement("div");
    qDiv.classList.add("quiz-question");
    qDiv.innerHTML = `
      <p><strong>Q${idx+1}:</strong> ${questionText}?</p>
      <input type="text" id="answer${idx}" placeholder="Tava atbilde" />
      <button onclick="checkDynamicAnswer('${answer}', ${idx})">Pārbaudīt</button>
      <p id="result${idx}" class="result"></p>
      <hr>
    `;
    container.appendChild(qDiv);
  });
}

function checkDynamicAnswer(correct, idx) {
  const inputEl = document.getElementById(`answer${idx}`);
  const userAns = inputEl.value.trim();
  const resultEl = document.getElementById(`result${idx}`);
  let score = 0;
  if(userAns.toLowerCase() === correct.toLowerCase()) {
    resultEl.innerText = "✅ Pareizi!";
    resultEl.style.color = "#00ff99";
    score = 1;
  } else {
    resultEl.innerText = `❌ Nepareizi! Pareizā atbilde: ${correct}`;
    resultEl.style.color = "#ff4d4d";
  }
  inputEl.disabled = true;
  inputEl.nextElementSibling.disabled = true;

  saveScore(score);
}

// ======= Mood Tracker =======
document.querySelectorAll(".moods button").forEach(btn => {
  btn.addEventListener("click", ()=>{
    const mood = btn.dataset.mood;
    const now = new Date();
    moodData.push({ time: now, value: mood });
    document.getElementById("moodResult").innerText = `Tava noskaņa šodien: ${mood}`;
    updateChart();
  });
});

function saveScore(score){
  const now = new Date();
  scoreData.push({ time: now, value: score*100 }); // scale 0-100%
  updateChart();
}

// ======= Chart.js =======
let chart;
function updateChart(){
  const ctx = document.getElementById("progressChart").getContext("2d");
  const labels = scoreData.map(d => d.time.toLocaleTimeString());
  const scores = scoreData.map(d => d.value);
  const moods = moodData.map((d,i)=>i+1);

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
      responsive:true,
      interaction:{mode:'index', intersect:false},
      stacked:false,
      scales:{
        y:{ type:'linear', position:'left', title:{display:true,text:'Score %'} },
        y1:{ type:'linear', position:'right', title:{display:true,text:'Mood'}, ticks:{display:false}}
      }
    }
  };

  if(chart) chart.destroy();
  chart = new Chart(ctx, config);
}

updateChart();
