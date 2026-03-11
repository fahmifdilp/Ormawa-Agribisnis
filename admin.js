const ROLE_OPTIONS = ["masyarakat", "mitra", "ormawa"];
const TEST_OPTIONS = ["pretest", "posttest"];

const adminState = {
  client: null,
  rows: [],
  questions: [],
  isReady: false
};

document.addEventListener("DOMContentLoaded", async () => {
  bindAdminEvents();
  await initAdminClient();
  if (!adminState.isReady) return;
  await restoreSession();
});

function bindAdminEvents() {
  document.getElementById("admin-login-form").addEventListener("submit", onAdminLogin);
  document.getElementById("admin-logout-btn").addEventListener("click", onAdminLogout);
  document.getElementById("admin-refresh-btn").addEventListener("click", async () => {
    await loadRows();
    renderAdminTable();
  });
  document.getElementById("admin-export-btn").addEventListener("click", onExportCsv);
  document.getElementById("admin-filter-role").addEventListener("change", renderAdminTable);
  document.getElementById("admin-filter-test").addEventListener("change", renderAdminTable);
  document.getElementById("admin-filter-name").addEventListener("input", renderAdminTable);
  document.getElementById("question-role-filter").addEventListener("change", renderQuestionTable);
  document.getElementById("question-refresh-btn").addEventListener("click", async () => {
    await loadQuestions();
    renderQuestionTable();
  });
  document.getElementById("question-add-btn").addEventListener("click", onAddQuestion);

  const tableBody = document.getElementById("admin-report-body");
  tableBody.addEventListener("click", onTableAction);
  tableBody.addEventListener("input", onTableInput);

  const questionBody = document.getElementById("question-body");
  questionBody.addEventListener("click", onQuestionAction);
}

async function initAdminClient() {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey || !window.supabase || !window.supabase.createClient) {
    setAdminModeNote(
      "Mode data: Supabase belum aktif. Isi file supabase-config.js terlebih dahulu.",
      true
    );
    toggleLoginAvailability(false);
    return;
  }

  try {
    adminState.client = window.supabase.createClient(config.url, config.anonKey);
    const { error } = await adminState.client.from("quiz_results").select("id").limit(1);
    if (error) throw error;

    adminState.isReady = true;
    setAdminModeNote("Mode data: Supabase aktif. Login admin diperlukan.", false);
    adminState.client.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        showLoggedOutState();
      }
    });
  } catch (error) {
    setAdminModeNote(`Mode data: gagal konek Supabase (${error.message}).`, true);
    toggleLoginAvailability(false);
  }
}

function toggleLoginAvailability(available) {
  const loginBtn = document.getElementById("admin-login-btn");
  loginBtn.disabled = !available;
}

async function restoreSession() {
  const { data, error } = await adminState.client.auth.getSession();
  if (error || !data.session) {
    showLoggedOutState();
    return;
  }

  await activateAdminSession(data.session);
}

async function onAdminLogin(event) {
  event.preventDefault();
  clearLoginError();

  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;
  const button = document.getElementById("admin-login-btn");
  const defaultLabel = button.textContent;
  button.disabled = true;
  button.textContent = "Memproses...";

  try {
    const { data, error } = await adminState.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    await activateAdminSession(data.session);
  } catch (error) {
    showLoginError(`Login gagal: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = defaultLabel;
  }
}

async function activateAdminSession(session) {
  const role = await getMyRole(session.user.id);
  if (role !== "admin") {
    await adminState.client.auth.signOut();
    showLoginError("Akun ini bukan admin.");
    showLoggedOutState();
    return;
  }

  document.getElementById("admin-user-email").textContent = session.user.email || "-";
  document.getElementById("admin-login-card").hidden = true;
  document.getElementById("admin-panel").hidden = false;
  await loadRows();
  await loadQuestions();
  renderAdminTable();
  renderQuestionTable();
}

async function getMyRole(userId) {
  const { data, error } = await adminState.client
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) return "";
  return String(data.role || "");
}

async function onAdminLogout() {
  await adminState.client.auth.signOut();
  showLoggedOutState();
}

function showLoggedOutState() {
  adminState.rows = [];
  adminState.questions = [];
  document.getElementById("admin-login-card").hidden = false;
  document.getElementById("admin-panel").hidden = true;
  document.getElementById("admin-user-email").textContent = "-";
  document.getElementById("admin-login-form").reset();
  renderAdminTable();
  renderQuestionTable();
}

function clearLoginError() {
  const errorBox = document.getElementById("admin-login-error");
  errorBox.hidden = true;
  errorBox.textContent = "";
}

function showLoginError(message) {
  const errorBox = document.getElementById("admin-login-error");
  errorBox.hidden = false;
  errorBox.textContent = message;
}

function setAdminModeNote(message, warning) {
  const note = document.getElementById("admin-mode-note");
  if (!note) return;
  note.textContent = message;
  note.classList.toggle("warning", Boolean(warning));
}

async function loadRows() {
  const { data, error } = await adminState.client
    .from("quiz_results")
    .select("id, participant_name, role, test_type, correct_answers, total_questions, score_percent, submitted_at")
    .order("submitted_at", { ascending: false });

  if (error) {
    alert(`Gagal memuat data: ${error.message}`);
    return;
  }

  adminState.rows = (data || []).map((row) => ({
    id: String(row.id),
    participantName: String(row.participant_name),
    role: String(row.role),
    testType: String(row.test_type),
    correct: Number(row.correct_answers),
    total: Number(row.total_questions),
    score: Number(row.score_percent),
    submittedAt: String(row.submitted_at)
  }));
}

async function loadQuestions() {
  const { data, error } = await adminState.client
    .from("quiz_questions")
    .select("id, role, question_text, options, answer_index, order_index, is_active, created_at")
    .eq("is_active", true)
    .order("role", { ascending: true })
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (String(error.code) === "42P01") {
      alert("Tabel quiz_questions belum ada. Jalankan ulang file supabase/schema.sql.");
    } else {
      alert(`Gagal memuat soal: ${error.message}`);
    }
    return;
  }

  adminState.questions = (data || []).map((row) => ({
    id: String(row.id),
    role: String(row.role),
    questionText: String(row.question_text || ""),
    options: normalizeOptions(row.options),
    answerIndex: Number(row.answer_index),
    orderIndex: Number(row.order_index),
    isActive: Boolean(row.is_active)
  }));
}

function renderAdminTable() {
  const body = document.getElementById("admin-report-body");
  if (!body) return;
  body.innerHTML = "";

  const rows = getFilteredRows(adminState.rows);
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td colspan=\"8\">Belum ada data.</td>";
    body.appendChild(tr);
    return;
  }

  rows.forEach((item) => {
    const tr = document.createElement("tr");
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <td>${formatDate(item.submittedAt)}</td>
      <td><input type="text" class="admin-input edit-name" value="${escapeAttr(item.participantName)}"></td>
      <td>${buildRoleSelect(item.role)}</td>
      <td>${buildTestSelect(item.testType)}</td>
      <td><input type="number" min="0" class="admin-input edit-correct" value="${item.correct}"></td>
      <td><input type="number" min="1" class="admin-input edit-total" value="${item.total}"></td>
      <td class="score-cell">${Math.round(item.score)}%</td>
      <td class="action-cell">
        <button type="button" class="mini-btn save-row">Simpan</button>
        <button type="button" class="mini-btn danger delete-row">Hapus</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

function renderQuestionTable() {
  const body = document.getElementById("question-body");
  if (!body) return;
  body.innerHTML = "";

  const rows = getFilteredQuestions(adminState.questions);
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td colspan=\"9\">Belum ada soal.</td>";
    body.appendChild(tr);
    return;
  }

  rows.forEach((question) => {
    const tr = document.createElement("tr");
    tr.dataset.id = question.id;
    tr.innerHTML = `
      <td>${buildRoleSelect(question.role, "q-role")}</td>
      <td><input type="number" min="1" class="admin-input q-order" value="${question.orderIndex}"></td>
      <td><textarea class="admin-input q-text" rows="3">${escapeHtml(question.questionText)}</textarea></td>
      <td><input type="text" class="admin-input q-opt-0" value="${escapeAttr(question.options[0])}"></td>
      <td><input type="text" class="admin-input q-opt-1" value="${escapeAttr(question.options[1])}"></td>
      <td><input type="text" class="admin-input q-opt-2" value="${escapeAttr(question.options[2])}"></td>
      <td><input type="text" class="admin-input q-opt-3" value="${escapeAttr(question.options[3])}"></td>
      <td>${buildAnswerSelect(question.answerIndex)}</td>
      <td class="action-cell">
        <button type="button" class="mini-btn q-save">Simpan</button>
        <button type="button" class="mini-btn danger q-delete">Hapus</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

function getFilteredQuestions(rows) {
  const roleFilter = document.getElementById("question-role-filter").value;
  return rows.filter((row) => roleFilter === "all" || row.role === roleFilter);
}

function getFilteredRows(rows) {
  const roleFilter = document.getElementById("admin-filter-role").value;
  const testFilter = document.getElementById("admin-filter-test").value;
  const nameQuery = document.getElementById("admin-filter-name").value.trim().toLowerCase();

  return rows.filter((row) => {
    const roleMatch = roleFilter === "all" || row.role === roleFilter;
    const testMatch = testFilter === "all" || row.testType === testFilter;
    const nameMatch = !nameQuery || row.participantName.toLowerCase().includes(nameQuery);
    return roleMatch && testMatch && nameMatch;
  });
}

function onTableInput(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (!target.classList.contains("edit-correct") && !target.classList.contains("edit-total")) return;

  const row = target.closest("tr");
  if (!row) return;

  const correct = Number(row.querySelector(".edit-correct").value || 0);
  const total = Number(row.querySelector(".edit-total").value || 0);
  const score = calculateScore(correct, total);
  row.querySelector(".score-cell").textContent = `${score}%`;
}

async function onTableAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains("mini-btn")) return;

  const row = target.closest("tr");
  if (!row || !row.dataset.id) return;

  if (target.classList.contains("save-row")) {
    await saveRow(row);
  }

  if (target.classList.contains("delete-row")) {
    await deleteRow(row.dataset.id);
  }
}

async function onQuestionAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement) || !target.classList.contains("mini-btn")) return;

  const row = target.closest("tr");
  if (!row || !row.dataset.id) return;

  if (target.classList.contains("q-save")) {
    await saveQuestion(row);
    return;
  }

  if (target.classList.contains("q-delete")) {
    await deleteQuestion(row.dataset.id);
  }
}

async function saveRow(row) {
  const id = row.dataset.id;
  const participantName = row.querySelector(".edit-name").value.trim();
  const role = row.querySelector(".edit-role").value;
  const testType = row.querySelector(".edit-test").value;
  const correct = Number(row.querySelector(".edit-correct").value);
  const total = Number(row.querySelector(".edit-total").value);

  if (!participantName) {
    alert("Nama peserta tidak boleh kosong.");
    return;
  }
  if (!ROLE_OPTIONS.includes(role)) {
    alert("Peran tidak valid.");
    return;
  }
  if (!TEST_OPTIONS.includes(testType)) {
    alert("Tipe tes tidak valid.");
    return;
  }
  if (!Number.isFinite(correct) || !Number.isFinite(total) || correct < 0 || total <= 0 || correct > total) {
    alert("Nilai benar/total tidak valid.");
    return;
  }

  const score = calculateScore(correct, total);
  const buttons = row.querySelectorAll(".mini-btn");
  buttons.forEach((btn) => {
    btn.disabled = true;
  });

  const { error } = await adminState.client
    .from("quiz_results")
    .update({
      participant_name: participantName,
      role,
      test_type: testType,
      correct_answers: correct,
      total_questions: total,
      score_percent: score
    })
    .eq("id", id);

  if (error) {
    alert(`Gagal simpan: ${error.message}`);
    buttons.forEach((btn) => {
      btn.disabled = false;
    });
    return;
  }

  const idx = adminState.rows.findIndex((item) => item.id === id);
  if (idx >= 0) {
    adminState.rows[idx] = {
      ...adminState.rows[idx],
      participantName,
      role,
      testType,
      correct,
      total,
      score
    };
  }

  row.querySelector(".score-cell").textContent = `${score}%`;
  buttons.forEach((btn) => {
    btn.disabled = false;
  });
}

async function deleteRow(id) {
  const confirmed = confirm("Hapus data ini?");
  if (!confirmed) return;

  const { error } = await adminState.client.from("quiz_results").delete().eq("id", id);
  if (error) {
    alert(`Gagal hapus: ${error.message}`);
    return;
  }

  adminState.rows = adminState.rows.filter((item) => item.id !== id);
  renderAdminTable();
}

async function onAddQuestion() {
  const roleFilter = document.getElementById("question-role-filter").value;
  const role = ROLE_OPTIONS.includes(roleFilter) ? roleFilter : "masyarakat";
  const nextOrder = getNextOrderIndex(role);

  const payload = {
    role,
    question_text: "Pertanyaan baru",
    options: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
    answer_index: 0,
    order_index: nextOrder,
    is_active: true
  };

  const { error } = await adminState.client.from("quiz_questions").insert(payload);
  if (error) {
    alert(`Gagal menambah soal: ${error.message}`);
    return;
  }

  await loadQuestions();
  renderQuestionTable();
}

async function saveQuestion(row) {
  const id = row.dataset.id;
  const role = row.querySelector(".q-role").value;
  const orderIndex = Number(row.querySelector(".q-order").value);
  const questionText = row.querySelector(".q-text").value.trim();
  const answerIndex = Number(row.querySelector(".q-answer").value);
  const options = [
    row.querySelector(".q-opt-0").value.trim(),
    row.querySelector(".q-opt-1").value.trim(),
    row.querySelector(".q-opt-2").value.trim(),
    row.querySelector(".q-opt-3").value.trim()
  ];

  if (!ROLE_OPTIONS.includes(role)) {
    alert("Peran soal tidak valid.");
    return;
  }
  if (!Number.isInteger(orderIndex) || orderIndex <= 0) {
    alert("Urutan soal harus angka lebih dari 0.");
    return;
  }
  if (!questionText) {
    alert("Pertanyaan tidak boleh kosong.");
    return;
  }
  if (options.some((option) => !option)) {
    alert("Semua opsi jawaban wajib diisi.");
    return;
  }
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
    alert("Jawaban benar tidak valid.");
    return;
  }

  const buttons = row.querySelectorAll(".mini-btn");
  buttons.forEach((button) => {
    button.disabled = true;
  });

  const { error } = await adminState.client
    .from("quiz_questions")
    .update({
      role,
      order_index: orderIndex,
      question_text: questionText,
      options,
      answer_index: answerIndex
    })
    .eq("id", id);

  if (error) {
    alert(`Gagal menyimpan soal: ${error.message}`);
    buttons.forEach((button) => {
      button.disabled = false;
    });
    return;
  }

  buttons.forEach((button) => {
    button.disabled = false;
  });
  await loadQuestions();
  renderQuestionTable();
}

async function deleteQuestion(id) {
  const confirmed = confirm("Hapus soal ini?");
  if (!confirmed) return;

  const { error } = await adminState.client.from("quiz_questions").delete().eq("id", id);
  if (error) {
    alert(`Gagal menghapus soal: ${error.message}`);
    return;
  }

  adminState.questions = adminState.questions.filter((item) => item.id !== id);
  renderQuestionTable();
}

function onExportCsv() {
  const rows = getFilteredRows(adminState.rows);
  if (!rows.length) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  const headers = ["Waktu", "Nama", "Peran", "Tipe Tes", "Benar", "Total", "Skor"];
  const lines = rows.map((item) => [
    formatDate(item.submittedAt),
    item.participantName,
    item.role,
    item.testType,
    String(item.correct),
    String(item.total),
    `${item.score}%`
  ]);

  const csv = [headers, ...lines]
    .map((line) => line.map(csvEscape).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `admin-laporan-kuis-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function buildRoleSelect(currentRole, customClass = "edit-role") {
  return `
    <select class="admin-input ${customClass}">
      ${ROLE_OPTIONS.map((role) => `<option value="${role}" ${role === currentRole ? "selected" : ""}>${capitalize(role)}</option>`).join("")}
    </select>
  `;
}

function buildTestSelect(currentType) {
  return `
    <select class="admin-input edit-test">
      ${TEST_OPTIONS.map((type) => `<option value="${type}" ${type === currentType ? "selected" : ""}>${capitalize(type)}</option>`).join("")}
    </select>
  `;
}

function buildAnswerSelect(currentAnswerIndex) {
  const options = ["A", "B", "C", "D"];
  return `
    <select class="admin-input q-answer">
      ${options.map((label, index) => `<option value="${index}" ${index === currentAnswerIndex ? "selected" : ""}>${label}</option>`).join("")}
    </select>
  `;
}

function getNextOrderIndex(role) {
  const current = adminState.questions
    .filter((item) => item.role === role)
    .map((item) => item.orderIndex);
  const max = current.length ? Math.max(...current) : 0;
  return max + 1;
}

function normalizeOptions(rawOptions) {
  const options = Array.isArray(rawOptions)
    ? rawOptions.map((option) => String(option ?? ""))
    : [];
  while (options.length < 4) {
    options.push("");
  }
  return options.slice(0, 4);
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

  if (invalid) return { url: "", anonKey: "" };
  return { url, anonKey };
}

function csvEscape(text) {
  const str = String(text ?? "");
  const escaped = str.replace(/"/g, "\"\"");
  return `"${escaped}"`;
}

function calculateScore(correct, total) {
  if (!total || total <= 0) return 0;
  return Math.round((correct / total) * 100);
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

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
