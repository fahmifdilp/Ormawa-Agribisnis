const STORAGE_KEY = "banjir_quiz_results_v1";

const DEFAULT_QUIZ_BANK = {
  masyarakat: {
    label: "Masyarakat",
    pretest: [
      {
        question: "Saat hujan deras dan debit air naik, tindakan awal yang paling tepat adalah...",
        options: [
          "Menunggu sampai air masuk rumah",
          "Memantau informasi resmi dan menyiapkan evakuasi keluarga",
          "Memindahkan kendaraan saja, lalu tidur kembali",
          "Membuang sampah ke selokan agar air cepat turun"
        ],
        answer: 1
      },
      {
        question: "Perilaku paling tepat untuk mencegah saluran tersumbat adalah...",
        options: [
          "Membuang sampah organik ke got",
          "Membuang sampah pada tempatnya dan kerja bakti rutin",
          "Menutup saluran dengan papan",
          "Membakar sampah di pinggir sungai"
        ],
        answer: 1
      },
      {
        question: "Fungsi utama lubang biopori adalah...",
        options: [
          "Mempercepat aliran limbah ke sungai",
          "Menampung air minum rumah tangga",
          "Meningkatkan daya resap tanah terhadap air hujan",
          "Menggantikan seluruh saluran drainase"
        ],
        answer: 2
      },
      {
        question: "Jika banjir mulai mengancam, warga sebaiknya berkoordinasi dengan...",
        options: [
          "Akun media sosial anonim",
          "RT/RW, BPBD, dan posko setempat",
          "Pedagang kaki lima",
          "Kelompok game online"
        ],
        answer: 1
      },
      {
        question: "Isi tas siaga banjir yang paling prioritas adalah...",
        options: [
          "Perhiasan dan koleksi foto",
          "Dokumen penting, obat, air minum, dan senter",
          "Peralatan musik",
          "Alat masak besar"
        ],
        answer: 1
      }
    ],
    posttest: []
  },
  mitra: {
    label: "Mitra UMKM Lidi",
    pretest: [
      {
        question: "Untuk mengurangi kerugian banjir, bahan baku lidi sebaiknya disimpan...",
        options: [
          "Di lantai dasar tanpa alas",
          "Di area lebih tinggi dengan rak tahan lembap",
          "Di luar ruangan tanpa penutup",
          "Di dekat saluran air terbuka"
        ],
        answer: 1
      },
      {
        question: "Data penjualan UMKM yang aman saat bencana sebaiknya...",
        options: [
          "Hanya ditulis pada satu buku",
          "Dibackup digital dan disalin berkala",
          "Disimpan dalam plastik tanpa salinan",
          "Tidak perlu dicatat"
        ],
        answer: 1
      },
      {
        question: "Saat bengkel produksi tergenang, tindakan awal paling tepat adalah...",
        options: [
          "Tetap menyalakan mesin agar cepat selesai",
          "Memutus aliran listrik dan mengamankan pekerja",
          "Mengabaikan ketinggian air",
          "Menyuruh semua orang berenang di lokasi"
        ],
        answer: 1
      },
      {
        question: "Kemasan produk yang disarankan saat musim hujan adalah...",
        options: [
          "Tanpa pelindung tambahan",
          "Kemasan tahan lembap dan berlapis",
          "Kertas tipis satu lapis",
          "Kemasan bekas terbuka"
        ],
        answer: 1
      },
      {
        question: "Komunikasi ke pelanggan saat banjir paling baik melalui...",
        options: [
          "Informasi status pesanan lewat kanal resmi UMKM",
          "Tidak memberi kabar apapun",
          "Menghapus semua kontak",
          "Menyebarkan janji palsu"
        ],
        answer: 0
      }
    ],
    posttest: []
  },
  ormawa: {
    label: "Ormawa",
    pretest: [
      {
        question: "Pendekatan awal ormawa ke masyarakat terdampak sebaiknya...",
        options: [
          "Langsung memberi instruksi tanpa dialog",
          "Mendengar kebutuhan warga dan membangun kepercayaan",
          "Hanya fokus dokumentasi",
          "Mengutamakan kegiatan seremonial"
        ],
        answer: 1
      },
      {
        question: "Data dasar yang penting dikumpulkan ormawa adalah...",
        options: [
          "Preferensi hiburan warga",
          "Peta risiko, kelompok rentan, dan kebutuhan mendesak",
          "Konten viral media sosial",
          "Daftar belanja pribadi relawan"
        ],
        answer: 1
      },
      {
        question: "Komunikasi risiko banjir yang baik dilakukan dengan...",
        options: [
          "Bahasa jelas dan menyesuaikan konteks lokal",
          "Istilah teknis tanpa penjelasan",
          "Informasi menakutkan tanpa solusi",
          "Pesan yang saling bertentangan"
        ],
        answer: 0
      },
      {
        question: "Dalam pelaksanaan program, ormawa sebaiknya...",
        options: [
          "Bekerja terpisah dari RT/RW",
          "Berkolaborasi dengan aparat dan tokoh lokal",
          "Mengabaikan adat setempat",
          "Menentukan keputusan sepihak"
        ],
        answer: 1
      },
      {
        question: "Tujuan utama edukasi banjir oleh ormawa adalah...",
        options: [
          "Meningkatkan ketergantungan warga",
          "Meningkatkan kapasitas warga agar siap dan tangguh",
          "Hanya mencari publikasi",
          "Mengurangi partisipasi masyarakat"
        ],
        answer: 1
      }
    ],
    posttest: []
  }
};

let quizBank = cloneQuizBank(DEFAULT_QUIZ_BANK);
syncPosttestWithPretest(quizBank);

const ROLE_ORDER = ["masyarakat", "mitra", "ormawa"];
const TEST_TYPES = ["pretest", "posttest"];

const state = {
  dbClient: null,
  useDatabase: false,
  results: []
};

document.addEventListener("DOMContentLoaded", async () => {
  initNavigation();
  initReportEvents();
  await initDataLayer();
  await loadQuestionBank();
  renderAllQuizPages();
  await refreshResults();
  renderReport();
});

function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn[data-target]");
  const pages = document.querySelectorAll(".page");

  navButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const target = button.dataset.target;

      navButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      pages.forEach((page) => {
        page.classList.toggle("active", page.id === `page-${target}`);
      });

      if (target === "laporan") {
        await refreshResults();
        renderReport();
      }
    });
  });
}

async function initDataLayer() {
  const config = getSupabaseConfig();

  if (!config.url || !config.anonKey || !window.supabase || !window.supabase.createClient) {
    setModeNote("Mode data: Lokal (localStorage). Isi konfigurasi Supabase untuk mode online.", true);
    state.useDatabase = false;
    return;
  }

  try {
    state.dbClient = window.supabase.createClient(config.url, config.anonKey);
    const { error } = await state.dbClient.from("quiz_results").select("id").limit(1);
    if (error) throw error;

    state.useDatabase = true;
    setModeNote("Mode data: Database Supabase aktif. Edit laporan dan soal melalui halaman Admin.", false);
  } catch (error) {
    state.dbClient = null;
    state.useDatabase = false;
    setModeNote(`Mode data: Lokal (localStorage). Supabase belum siap (${error.message}).`, true);
  }
}

async function loadQuestionBank() {
  quizBank = cloneQuizBank(DEFAULT_QUIZ_BANK);
  syncPosttestWithPretest(quizBank);

  if (!state.useDatabase || !state.dbClient) return;

  try {
    const { data, error } = await state.dbClient
      .from("quiz_questions")
      .select("role, question_text, options, answer_index, order_index, is_active")
      .eq("is_active", true)
      .order("role", { ascending: true })
      .order("order_index", { ascending: true });

    if (error) throw error;
    if (!Array.isArray(data) || !data.length) return;

    const grouped = {
      masyarakat: [],
      mitra: [],
      ormawa: []
    };

    data.forEach((row) => {
      const role = String(row.role || "");
      const questionText = String(row.question_text || "").trim();
      const answer = Number(row.answer_index);
      const options = Array.isArray(row.options)
        ? row.options.map((option) => String(option ?? "").trim())
        : [];

      if (!ROLE_ORDER.includes(role)) return;
      if (!questionText) return;
      if (options.length !== 4 || options.some((option) => !option)) return;
      if (!Number.isInteger(answer) || answer < 0 || answer > 3) return;

      grouped[role].push({
        question: questionText,
        options,
        answer
      });
    });

    ROLE_ORDER.forEach((role) => {
      if (grouped[role].length) {
        quizBank[role].pretest = grouped[role];
      }
    });

    syncPosttestWithPretest(quizBank);
  } catch (error) {
    const message = String(error.code) === "42P01"
      ? "tabel quiz_questions belum ada, jalankan ulang supabase/schema.sql"
      : error.message;
    setModeNote(
      `Mode data: Database aktif, tetapi soal masih default (${message}).`,
      true
    );
  }
}

function setModeNote(message, warning) {
  const note = document.getElementById("storage-mode");
  if (!note) return;
  note.textContent = message;
  note.classList.toggle("warning", Boolean(warning));
}

function getSupabaseConfig() {
  const config = window.APP_CONFIG?.supabase ?? {};
  const url = String(config.url || "").trim();
  const anonKey = String(config.anonKey || "").trim();

  const invalid =
    !url ||
    !anonKey ||
    url.includes("YOUR_PROJECT") ||
    anonKey.includes("YOUR_ANON_KEY");

  if (invalid) {
    return { url: "", anonKey: "" };
  }

  return { url, anonKey };
}

function renderAllQuizPages() {
  ROLE_ORDER.forEach((roleKey) => {
    const container = document.getElementById(`quiz-${roleKey}`);
    if (!container) return;

    container.innerHTML = "";
    container.appendChild(buildTestSwitcher(roleKey));
  });
}

function buildTestSwitcher(roleKey) {
  const wrapper = document.createElement("div");
  wrapper.className = "test-switch-wrapper";

  const switchBar = document.createElement("div");
  switchBar.className = "test-switch";
  switchBar.setAttribute("role", "tablist");
  switchBar.setAttribute("aria-label", `Pilih tipe tes ${quizBank[roleKey].label}`);

  const panelWrap = document.createElement("div");
  panelWrap.className = "test-panels";

  TEST_TYPES.forEach((testType, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "test-switch-btn";
    button.dataset.testType = testType;
    button.textContent = capitalize(testType);
    button.classList.toggle("active", index === 0);
    button.setAttribute("aria-selected", index === 0 ? "true" : "false");
    switchBar.appendChild(button);

    const panel = document.createElement("div");
    panel.className = "test-panel";
    panel.dataset.testType = testType;
    panel.classList.toggle("active", index === 0);
    panel.appendChild(buildQuizCard(roleKey, testType));
    panelWrap.appendChild(panel);

    button.addEventListener("click", () => {
      switchBar.querySelectorAll(".test-switch-btn").forEach((btn) => {
        const isActive = btn === button;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      panelWrap.querySelectorAll(".test-panel").forEach((panelItem) => {
        panelItem.classList.toggle("active", panelItem.dataset.testType === testType);
      });
    });
  });

  wrapper.appendChild(switchBar);
  wrapper.appendChild(panelWrap);
  return wrapper;
}

function buildQuizCard(roleKey, testType) {
  const roleData = quizBank[roleKey];
  const questions = roleData[testType];
  const card = document.createElement("article");
  card.className = "quiz-card";

  const heading = document.createElement("h3");
  heading.textContent = `${capitalize(testType)} - ${roleData.label}`;
  card.appendChild(heading);

  if (testType === "posttest") {
    const note = document.createElement("p");
    note.className = "quiz-meta";
    note.textContent = "Soal posttest sama dengan pretest, dikerjakan pada waktu berbeda.";
    card.appendChild(note);
  }

  const form = document.createElement("form");
  form.dataset.role = roleKey;
  form.dataset.testType = testType;

  const nameLabel = document.createElement("label");
  nameLabel.setAttribute("for", `${roleKey}-${testType}-name`);
  nameLabel.textContent = "Nama Peserta";
  form.appendChild(nameLabel);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.id = `${roleKey}-${testType}-name`;
  nameInput.name = "participantName";
  nameInput.placeholder = "Masukkan nama";
  nameInput.required = true;
  form.appendChild(nameInput);

  questions.forEach((item, idx) => {
    const questionBlock = document.createElement("fieldset");
    questionBlock.className = "question-block";

    const legend = document.createElement("legend");
    legend.textContent = `${idx + 1}. ${item.question}`;
    questionBlock.appendChild(legend);

    item.options.forEach((option, optionIdx) => {
      const optionLabel = document.createElement("label");
      const input = document.createElement("input");
      const inputName = `${roleKey}-${testType}-q-${idx}`;
      input.type = "radio";
      input.name = inputName;
      input.value = String(optionIdx);

      optionLabel.appendChild(input);
      optionLabel.append(option);
      questionBlock.appendChild(optionLabel);
    });

    form.appendChild(questionBlock);
  });

  if (!questions.length) {
    const emptyNote = document.createElement("p");
    emptyNote.className = "quiz-meta";
    emptyNote.textContent = "Belum ada soal untuk peran ini. Hubungi admin untuk menambahkan soal.";
    form.appendChild(emptyNote);
  }

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = `Simpan ${capitalize(testType)}`;
  submitBtn.disabled = !questions.length;
  form.appendChild(submitBtn);

  const resultNote = document.createElement("div");
  resultNote.className = "result-note";
  resultNote.hidden = true;
  form.appendChild(resultNote);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleSubmitQuiz(form, questions, roleKey, testType, resultNote, submitBtn);
  });

  card.appendChild(form);
  return card;
}

async function handleSubmitQuiz(form, questions, roleKey, testType, resultNote, submitBtn) {
  if (!Array.isArray(questions) || !questions.length) {
    showResultNote(resultNote, "Belum ada soal untuk tes ini.", true);
    return;
  }

  const formData = new FormData(form);
  const participantName = String(formData.get("participantName") || "").trim();

  if (!participantName) {
    showResultNote(resultNote, "Nama peserta wajib diisi.", true);
    return;
  }

  const answers = [];
  for (let idx = 0; idx < questions.length; idx += 1) {
    const answerKey = `${roleKey}-${testType}-q-${idx}`;
    const value = formData.get(answerKey);
    if (value === null) {
      showResultNote(resultNote, "Semua pertanyaan harus dijawab.", true);
      return;
    }
    answers.push(Number(value));
  }

  let correct = 0;
  answers.forEach((answer, idx) => {
    if (answer === questions[idx].answer) correct += 1;
  });

  const total = questions.length;
  const score = calculateScore(correct, total);
  const payload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    participantName,
    role: roleKey,
    testType,
    correct,
    total,
    score,
    submittedAt: new Date().toISOString()
  };

  const defaultButtonText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Menyimpan...";

  try {
    await saveResult(payload);
    form.reset();
    showResultNote(
      resultNote,
      `Tersimpan. Skor ${score}% (${correct}/${total}) untuk ${participantName}.`,
      false
    );

    await refreshResults();
    renderReport();
  } catch (error) {
    showResultNote(resultNote, `Gagal menyimpan data (${error.message}).`, true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = defaultButtonText;
  }
}

function initReportEvents() {
  const roleFilter = document.getElementById("filter-role");
  const testFilter = document.getElementById("filter-test");
  const nameFilter = document.getElementById("filter-name");
  const exportBtn = document.getElementById("export-csv");

  roleFilter.addEventListener("change", renderReport);
  testFilter.addEventListener("change", renderReport);
  nameFilter.addEventListener("input", renderReport);

  exportBtn.addEventListener("click", () => {
    const filtered = getFilteredResults(state.results);
    if (!filtered.length) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const csv = buildCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `laporan-kuis-banjir-${stamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  });
}

async function refreshResults() {
  try {
    state.results = await getResults();
  } catch (error) {
    state.results = getLocalResults();
    state.useDatabase = false;
    state.dbClient = null;
    setModeNote(`Mode data: Lokal (localStorage). Gagal akses Supabase (${error.message}).`, true);
  }
}

async function getResults() {
  if (state.useDatabase && state.dbClient) {
    const { data, error } = await state.dbClient
      .from("quiz_results")
      .select("id, participant_name, role, test_type, correct_answers, total_questions, score_percent, submitted_at")
      .order("submitted_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbRowToResult);
  }

  return getLocalResults();
}

async function saveResult(result) {
  if (state.useDatabase && state.dbClient) {
    const { error } = await state.dbClient.from("quiz_results").insert(mapResultToDbRow(result));
    if (error) throw error;
    return;
  }

  const local = getLocalResults();
  local.push(result);
  saveLocalResults(local);
}

function renderReport() {
  const filtered = getFilteredResults(state.results);
  renderTopSummary(filtered);
  renderRoleSummary(state.results);
  renderReportTable(filtered);
}

function getFilteredResults(results) {
  const roleFilter = document.getElementById("filter-role").value;
  const testFilter = document.getElementById("filter-test").value;
  const nameQuery = document.getElementById("filter-name").value.trim().toLowerCase();

  return results.filter((item) => {
    const roleMatch = roleFilter === "all" || item.role === roleFilter;
    const testMatch = testFilter === "all" || item.testType === testFilter;
    const nameMatch = !nameQuery || item.participantName.toLowerCase().includes(nameQuery);
    return roleMatch && testMatch && nameMatch;
  });
}

function renderTopSummary(results) {
  const total = results.length;
  const uniqueParticipants = new Set(
    results.map((item) => `${item.participantName.toLowerCase()}::${item.role}`)
  ).size;
  const average = total
    ? (results.reduce((sum, item) => sum + item.score, 0) / total).toFixed(1)
    : "0.0";

  document.getElementById("stat-total").textContent = String(total);
  document.getElementById("stat-unique").textContent = String(uniqueParticipants);
  document.getElementById("stat-average").textContent = `${average}%`;
}

function renderRoleSummary(allResults) {
  const container = document.getElementById("role-summary");
  container.innerHTML = "";

  ROLE_ORDER.forEach((role) => {
    const roleLabel = quizBank[role].label;
    const pre = allResults.filter((item) => item.role === role && item.testType === "pretest");
    const post = allResults.filter((item) => item.role === role && item.testType === "posttest");

    const preAvg = averageScore(pre);
    const postAvg = averageScore(post);
    const delta = preAvg !== null && postAvg !== null ? (postAvg - preAvg).toFixed(1) : "-";

    const card = document.createElement("article");
    card.className = "role-card";
    card.innerHTML = `
      <h4>${roleLabel}</h4>
      <p>Rata-rata Pretest: <strong>${preAvg === null ? "-" : `${preAvg.toFixed(1)}%`}</strong></p>
      <p>Rata-rata Posttest: <strong>${postAvg === null ? "-" : `${postAvg.toFixed(1)}%`}</strong></p>
      <p>Peningkatan: <strong>${delta === "-" ? "-" : `${delta}%`}</strong></p>
      <p>Jumlah Data: <strong>${pre.length + post.length}</strong></p>
    `;
    container.appendChild(card);
  });
}

function renderReportTable(results) {
  const body = document.getElementById("report-body");
  body.innerHTML = "";

  const sorted = [...results].sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  if (!sorted.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="6">Belum ada data kuis.</td>`;
    body.appendChild(row);
    return;
  }

  sorted.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatDate(item.submittedAt)}</td>
      <td>${escapeHtml(item.participantName)}</td>
      <td>${quizBank[item.role].label}</td>
      <td><span class="pill ${item.testType}">${capitalize(item.testType)}</span></td>
      <td>${item.score}%</td>
      <td>${item.correct}/${item.total}</td>
    `;
    body.appendChild(row);
  });
}

function buildCsv(results) {
  const headers = [
    "Waktu",
    "Nama Peserta",
    "Peran",
    "Tipe Tes",
    "Skor",
    "Jawaban Benar",
    "Total Soal"
  ];

  const rows = results.map((item) => [
    formatDate(item.submittedAt),
    item.participantName,
    quizBank[item.role].label,
    capitalize(item.testType),
    `${item.score}%`,
    String(item.correct),
    String(item.total)
  ]);

  return [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");
}

function mapDbRowToResult(row) {
  return {
    id: String(row.id),
    participantName: String(row.participant_name),
    role: String(row.role),
    testType: String(row.test_type),
    correct: Number(row.correct_answers),
    total: Number(row.total_questions),
    score: Number(row.score_percent),
    submittedAt: String(row.submitted_at)
  };
}

function mapResultToDbRow(result) {
  return {
    participant_name: result.participantName,
    role: result.role,
    test_type: result.testType,
    correct_answers: result.correct,
    total_questions: result.total,
    score_percent: result.score,
    submitted_at: result.submittedAt
  };
}

function getLocalResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveLocalResults(results) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
}

function csvEscape(text) {
  const str = String(text ?? "");
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

function averageScore(items) {
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + item.score, 0);
  return total / items.length;
}

function calculateScore(correct, total) {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

function showResultNote(target, message, isError) {
  target.hidden = false;
  target.classList.toggle("error", isError);
  target.textContent = message;
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function syncPosttestWithPretest(bank) {
  Object.keys(bank).forEach((roleKey) => {
    const roleData = bank[roleKey];
    roleData.posttest = cloneQuestions(roleData.pretest);
  });
}

function cloneQuestions(questions) {
  return questions.map((item) => ({
    question: item.question,
    options: [...item.options],
    answer: item.answer
  }));
}

function cloneQuizBank(sourceBank) {
  const cloned = {};
  Object.keys(sourceBank).forEach((roleKey) => {
    const role = sourceBank[roleKey];
    cloned[roleKey] = {
      label: role.label,
      pretest: cloneQuestions(role.pretest),
      posttest: cloneQuestions(role.posttest || [])
    };
  });
  return cloned;
}
