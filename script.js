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
// Call this after you set summarizedText
async function fetchAiQuiz(summary) {
  try {
    const resp = await fetch('https://ai-learning-assistant-cnxf.vercel.app/api/generate-quiz
', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary })
    });
    if(!resp.ok){
      const txt = await resp.text();
      throw new Error('API error: ' + txt);
    }
    const data = await resp.json();
    renderAiQuiz(data.questions || []);
  } catch (e) {
    console.error(e);
    alert('Failed to generate quiz: ' + e.message);
  }
}

function renderAiQuiz(questions) {
  const container = document.getElementById("quizContent");
  container.innerHTML = "";
  questions.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.classList.add('quiz-question');
    if(q.type === 'fill') {
      qDiv.innerHTML = `
        <p><strong>Q${idx+1}:</strong> ${q.question}</p>
        <input type="text" id="answer${idx}" placeholder="Tava atbilde"/>
        <button onclick="checkAiAnswer('${escapeHtml(q.answer)}', ${idx}, 'fill')">Pārbaudīt</button>
        <p id="result${idx}" class="result"></p><hr>`;
    } else {
      const optionsHtml = (q.choices||[]).map(o=>`<label style="display:block; margin:6px 0;"><input type="radio" name="mcq${idx}" value="${escapeHtml(o)}"> ${escapeHtml(o)}</label>`).join('');
      qDiv.innerHTML = `
        <p><strong>Q${idx+1}:</strong> ${escapeHtml(q.question)}</p>
        ${optionsHtml}
        <button onclick="checkAiAnswer('${escapeHtml(q.answer)}', ${idx}, 'mcq')">Pārbaudīt</button>
        <p id="result${idx}" class="result"></p><hr>`;
    }
    container.appendChild(qDiv);
  });
}

function checkAiAnswer(correct, idx, type){
  const resultEl = document.getElementById(`result${idx}`);
  let userAns = "";
  if(type === 'fill') {
    const inputEl = document.getElementById(`answer${idx}`);
    userAns = inputEl.value.trim();
    inputEl.disabled = true;
  } else {
    const radios = document.getElementsByName(`mcq${idx}`);
    let sel=null;
    for(const r of radios) if(r.checked) { sel=r; break; }
    if(!sel) { resultEl.innerText = "Lūdzu izvēlies atbildi!"; return; }
    userAns = sel.value;
    radios.forEach(r => r.disabled = true);
  }
  const ok = userAns.toLowerCase() === correct.toLowerCase();
  resultEl.innerText = ok ? "✅ Pareizi!" : `❌ Nepareizi! Pareizā atbilde: ${correct}`;
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


