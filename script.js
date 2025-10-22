/* script.js - LOGIC HỢP NHẤT HOÀN CHỈNH VÀ ĐÃ SỬA LỖI LỊCH HỌC */

// Lấy đường dẫn trang hiện tại để phân loại logic
const currentPage = window.location.pathname.split("/").pop();

// =======================================================
// 1. LOGIC CHUNG & KIỂM TRA ĐĂNG NHẬP
// =======================================================

function checkLogin() {
  const currentUser = localStorage.getItem("currentUser");
  const safePages = ["index.html", "login.html", "register.html", ""];

  if (!safePages.includes(currentPage) && !currentUser) {
    alert("Vui lòng đăng nhập để truy cập tính năng này.");
    window.location.href = "login.html";
  }
}
checkLogin();

window.logout = function () {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
};

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.onclick = window.logout;
  }
});

// =======================================================
// 2. LOGIC ĐĂNG NHẬP/ĐĂNG KÝ
// =======================================================

if (currentPage === "register.html") {
  window.register = function () {
    const user = document.getElementById("regUser").value.trim();
    const pass = document.getElementById("regPass").value;
    if (!user || !pass) {
      return alert("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu!");
    }
    const storageKey = "user_" + user;

    if (localStorage.getItem(storageKey)) {
      alert("Tài khoản đã tồn tại!");
    } else {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ username: user, password: pass })
      );
      alert("Đăng ký thành công! Bạn có thể đăng nhập.");
      window.location.href = "login.html";
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    const registerButton = document.querySelector(".register-box button");
    if (registerButton) {
      registerButton.onclick = window.register;
    }
  });
} else if (currentPage === "login.html") {
  window.login = function () {
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value;
    const storageKey = "user_" + user;
    const storedUserJson = localStorage.getItem(storageKey);

    if (!storedUserJson) {
      alert("Tài khoản không tồn tại!");
      return;
    }

    try {
      const storedUser = JSON.parse(storedUserJson);
      if (storedUser.password === pass) {
        localStorage.setItem("currentUser", user);
        alert("Đăng nhập thành công!");
        window.location.href = "index.html";
      } else {
        alert("Sai mật khẩu!");
      }
    } catch (error) {
      alert("Lỗi dữ liệu tài khoản!");
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const loginButton = document.querySelector(".login-box button");
    if (loginButton) {
      loginButton.onclick = window.login;
    }
  });
}

// =======================================================
// 3. LOGIC QUẢN LÝ DỮ LIỆU
// =======================================================

document.addEventListener("DOMContentLoaded", () => {
  // ==================== LỊCH HỌC (SCHEDULE.HTML) ====================
  if (currentPage === "schedule.html") {
    // KHAI BÁO BIẾN CỤC BỘ CHO TRANG SCHEDULE
    const scheduleModal = document.getElementById("scheduleModal");
    const addSubjectBtn = document.getElementById("addBtn");
    const scheduleBody = document.getElementById("scheduleBody");
    const weekSelect = document.getElementById("weekSelect");
    const saveBtn = document.getElementById("saveBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const modalTitle = document.getElementById("modalTitle");

    let currentWeek = 1;
    let editIndex = null;

    // ĐỊNH NGHĨA CÁC MỐC GIỜ ĐƠN GIẢN HÓA (1 TIẾNG/MỐC)
    const times = [];
       for (let h = 7; h <= 20; h++) {
         times.push(`${String(h).padStart(2, "0")}:00`);
         times.push(`${String(h).padStart(2, "0")}:30`)
    }
    // Thêm 21:00 để kết thúc
    times.push("21:00");

    function getSubjects(week) {
      const key = "subjects_schedule_week_" + week;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }

    function saveSubjects(week, subjects) {
      const key = "subjects_schedule_week_" + week;
      localStorage.setItem(key, JSON.stringify(subjects));
    }

    function openModal(isEdit = false) {
      if (scheduleModal) scheduleModal.style.display = "flex";
      if (modalTitle)
        modalTitle.textContent = isEdit ? "Sửa môn học" : "Thêm môn học";
      if (deleteBtn) deleteBtn.style.display = isEdit ? "inline-block" : "none";
    }

    function closeModal() {
      if (scheduleModal) scheduleModal.style.display = "none";
      if (document.getElementById("subjectName"))
        document.getElementById("subjectName").value = "";
      if (document.getElementById("subjectRoom"))
        document.getElementById("subjectRoom").value = "";
      if (document.getElementById("subjectDay"))
        document.getElementById("subjectDay").value = 2;
      // Đặt lại giá trị mặc định cho giờ
      if (document.getElementById("startTime"))
        document.getElementById("startTime").value = "07:00";
      if (document.getElementById("endTime"))
        document.getElementById("endTime").value = "08:00";
      if (document.getElementById("subjectColor"))
        document.getElementById("subjectColor").value = "#3b82f6";
      editIndex = null;
    }

    function renderSchedule() {
      if (!scheduleBody) return;
      const subjects = getSubjects(currentWeek);
      scheduleBody.innerHTML = "";
      const mergedCells = {}; // Dùng để theo dõi các ô đã bị gộp
      const days = [2, 3, 4, 5, 6, 7, 0]; // 0 là Chủ nhật
      const displaytimes = times.slice(0, -1); // Loại bỏ 21:00 cuối cùng để dùng làm mốc kết thúc

      displaytimes.forEach((time, rowIndex) => {
        const tr = scheduleBody.insertRow();
        tr.insertCell().textContent = time; // Cột giờ

        days.forEach((dayKey) => {
          const cellKey = `${dayKey}-${time}`;

          if (mergedCells[cellKey]) {
            return; // Bỏ qua nếu ô này đã bị gộp
          }

          const td = tr.insertCell();

          // Tìm môn học bắt đầu đúng vào giờ này
          const subject = subjects.find(
            (s) => parseInt(s.day) === dayKey && s.start === time
          );

          if (subject) {
            const startIndex = times.indexOf(subject.start);
            const endIndex = times.indexOf(subject.end);

            // Rowspan là số mốc 1 tiếng mà môn học chiếm
            const rowspan = endIndex - startIndex + 1;

            if (rowspan > 0) {
              td.rowSpan = rowspan;
              td.style.background = subject.color;
              td.style.color = "white";
              td.style.textAlign = "center";
              td.style.verticalAlign = "middle";
              td.style.borderRadius = "5px";
              td.style.cursor = "pointer";
              td.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
              td.innerHTML = `
                                <div style="font-weight:bold;font-size:15px">${subject.name}</div>
                                <div>${subject.room}</div>
                                <div>${subject.start} - ${subject.end}</div>
                            `;
              // Gán sự kiện mở modal chỉnh sửa
              td.onclick = () =>
                window.openEditModalSchedule(subjects.indexOf(subject));

              // Đánh dấu các ô bị gộp
              for (let i = 0; i < rowspan; i++) {
                const mergedTime = times[startIndex + i];
                mergedCells[`${dayKey}-${mergedTime}`] = true;
              }
            } else {
              // Xử lý trường hợp môn học có start/end không hợp lệ (ví dụ: start >= end)
              td.innerHTML = `<span style="color: red; font-size: 10px;">Lỗi giờ</span>`;
            }
          }
        });
      });
    }

    window.openEditModalSchedule = function (index) {
      const subjects = getSubjects(currentWeek);
      const s = subjects[index];
      editIndex = index;
      openModal(true);
      if (document.getElementById("subjectName"))
        document.getElementById("subjectName").value = s.name;
      if (document.getElementById("subjectRoom"))
        document.getElementById("subjectRoom").value = s.room;
      if (document.getElementById("subjectDay"))
        document.getElementById("subjectDay").value = s.day;
      if (document.getElementById("startTime"))
        document.getElementById("startTime").value = s.start;
      if (document.getElementById("endTime"))
        document.getElementById("endTime").value = s.end;
      if (document.getElementById("subjectColor"))
        document.getElementById("subjectColor").value = s.color;
    };

    // Gắn Sự kiện
    if (weekSelect) {
      for (let i = 1; i <= 15; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Tuần ${i}`;
        weekSelect.appendChild(option);
      }
      weekSelect.value = currentWeek;

      weekSelect.onchange = () => {
        currentWeek = parseInt(weekSelect.value);
        renderSchedule();
      };
    }

    if (addSubjectBtn)
      addSubjectBtn.onclick = () => {
        editIndex = null;
        closeModal();
        openModal(false);
      };
    if (cancelBtn) cancelBtn.onclick = closeModal;

    if (saveBtn)
      saveBtn.onclick = () => {
        const name = document.getElementById("subjectName").value;
        const room = document.getElementById("subjectRoom").value;
        const day = document.getElementById("subjectDay").value;
        const start = document.getElementById("startTime").value;
        const end = document.getElementById("endTime").value;
        const color = document.getElementById("subjectColor").value;

        if (!name || !room || !start || !end) {
          alert("Vui lòng nhập đầy đủ thông tin!");
          return;
        }

        // Kiểm tra giờ: Giờ bắt đầu và kết thúc phải là mốc giờ tròn (ví dụ: 07:00, 08:00)
        if (!times.includes(start) || !times.includes(end)) {
          alert(
            "Lỗi: Giờ bắt đầu và kết thúc phải là các mốc giờ tròn (ví dụ: 07:00, 08:00, ... 21:00)."
          );
          return;
        }
        if (times.indexOf(start) >= times.indexOf(end)) {
          alert("Lỗi: Giờ kết thúc phải lớn hơn Giờ bắt đầu.");
          return;
        }

        const subjects = getSubjects(currentWeek);
        if (editIndex !== null) {
          subjects[editIndex] = { name, room, day, start, end, color };
        } else {
          subjects.push({ name, room, day, start, end, color });
        }

        saveSubjects(currentWeek, subjects);
        closeModal();
        renderSchedule();
      };

    if (deleteBtn)
      deleteBtn.onclick = () => {
        if (!confirm("Bạn có chắc muốn xóa môn học này khỏi lịch?")) return;
        const subjects = getSubjects(currentWeek);
        subjects.splice(editIndex, 1);
        saveSubjects(currentWeek, subjects);
        closeModal();
        renderSchedule();
      };

    renderSchedule();
  } // End SCHEDULE.HTML

  // ==================== MÔN HỌC (SUBJECTS.HTML) ====================
  else if (currentPage === "subjects.html") {
    const subjectModal = document.getElementById("subjectModal");
    const addSubjectBtn = document.getElementById("addSubjectBtn");
    const subjectList = document.getElementById("subjectList");
    const weekSelect = document.getElementById("weekSelect");
    const saveBtn = document.getElementById("saveSubject");
    const deleteBtn = document.getElementById("deleteSubject");
    const cancelBtn = document.getElementById("cancelSubject");

    let currentWeek = 1;
    let editingIndex = -1;

    function getSubjects(week) {
      const key = "subjects_data_week_" + week;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }

    function saveSubjects(week, subjects) {
      const key = "subjects_data_week_" + week;
      localStorage.setItem(key, JSON.stringify(subjects));
    }

    function openModal(isEdit = false) {
      if (subjectModal) subjectModal.style.display = "flex";
      if (document.getElementById("modalTitle"))
        document.getElementById("modalTitle").textContent = isEdit
          ? "Sửa môn học"
          : "Thêm môn học";
      if (deleteBtn) deleteBtn.style.display = isEdit ? "inline-block" : "none";
    }

    function closeModal() {
      if (subjectModal) subjectModal.style.display = "none";
      if (document.getElementById("subjectName"))
        document.getElementById("subjectName").value = "";
      if (document.getElementById("subjectCode"))
        document.getElementById("subjectCode").value = "";
      if (document.getElementById("subjectCredits"))
        document.getElementById("subjectCredits").value = "";
      if (document.getElementById("subjectTeacher"))
        document.getElementById("subjectTeacher").value = "";
      if (document.getElementById("subjectDesc"))
        document.getElementById("subjectDesc").value = "";
      editingIndex = -1;
    }

    function renderSubjects() {
      if (!subjectList) return;
      const subjects = getSubjects(currentWeek);
      subjectList.innerHTML = "";
      if (subjects.length === 0) {
        subjectList.innerHTML =
          "<p>Chưa có môn học nào được thêm cho tuần này.</p>";
        return;
      }

      subjects.forEach((s, index) => {
        const card = document.createElement("div");
        card.className = "subject-card";
        card.innerHTML = `
                    <div class="card-buttons">
                        <button onclick="window.editSubject(${index})">✏️</button>
                        <button onclick="window.deleteSubject(${index})">🗑️</button>
                    </div>
                    <h3>${s.name}</h3>
                    <small>${s.code}</small>
                    <p><b>Số tín chỉ:</b> ${s.credits || "-"}</p>
                    <p><b>Giảng viên:</b> ${s.teacher || "Chưa có"}</p>
                    <p>${s.desc || ""}</p>
                `;
        subjectList.appendChild(card);
      });
    }

    window.editSubject = function (index) {
      const subjects = getSubjects(currentWeek);
      const s = subjects[index];
      editingIndex = index;
      openModal(true);
      if (document.getElementById("subjectName"))
        document.getElementById("subjectName").value = s.name;
      if (document.getElementById("subjectCode"))
        document.getElementById("subjectCode").value = s.code;
      if (document.getElementById("subjectCredits"))
        document.getElementById("subjectCredits").value = s.credits;
      if (document.getElementById("subjectTeacher"))
        document.getElementById("subjectTeacher").value = s.teacher;
      if (document.getElementById("subjectDesc"))
        document.getElementById("subjectDesc").value = s.desc;
    };

    window.deleteSubject = function (index) {
      if (confirm("Bạn có chắc muốn xóa môn học này không?")) {
        const subjects = getSubjects(currentWeek);
        subjects.splice(index, 1);
        saveSubjects(currentWeek, subjects);
        renderSubjects();
      }
    };

    // Gắn Sự kiện
    if (weekSelect) {
      for (let i = 1; i <= 15; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Tuần ${i}`;
        weekSelect.appendChild(option);
      }
      weekSelect.value = currentWeek;

      weekSelect.onchange = () => {
        currentWeek = parseInt(weekSelect.value);
        renderSubjects();
      };
    }

    if (addSubjectBtn)
      addSubjectBtn.onclick = () => {
        editingIndex = -1;
        closeModal();
        openModal(false);
      };
    if (cancelBtn) cancelBtn.onclick = closeModal;

    if (saveBtn)
      saveBtn.onclick = () => {
        const subject = {
          name: document.getElementById("subjectName").value.trim(),
          code: document.getElementById("subjectCode").value.trim(),
          credits: document.getElementById("subjectCredits").value.trim(),
          teacher: document.getElementById("subjectTeacher").value.trim(),
          desc: document.getElementById("subjectDesc").value.trim(),
        };

        if (!subject.name || !subject.code) {
          alert("Vui lòng nhập tên và mã môn học!");
          return;
        }

        const subjects = getSubjects(currentWeek);
        if (editingIndex >= 0) {
          subjects[editingIndex] = subject;
        } else {
          subjects.push(subject);
        }
        saveSubjects(currentWeek, subjects);
        closeModal();
        renderSubjects();
      };

    renderSubjects();
  } // End SUBJECTS.HTML

  // ==================== BÀI TẬP (ASSIGNMENTS.HTML) ====================
  else if (currentPage === "assignments.html") {
    const assignmentList = document.getElementById("assignmentList");
    const addBtn = document.getElementById("addBtn");
    const modal = document.getElementById("assignmentModal");
    const saveBtn = document.getElementById("saveBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const modalTitle = document.getElementById("modalTitle");

    let editIndex = null;

    function getAssignments() {
      const data = localStorage.getItem("assignments");
      const assignments = data ? JSON.parse(data) : [];
      return assignments.map((a) => ({
        ...a,
        isCompleted: a.isCompleted || false,
      }));
    }

    function saveAssignments(assignments) {
      localStorage.setItem("assignments", JSON.stringify(assignments));
    }

    function openModal(isEdit = false) {
      if (modal) modal.style.display = "flex";
      if (modalTitle)
        modalTitle.textContent = isEdit ? "Sửa bài tập" : "Thêm bài tập";
      if (deleteBtn) deleteBtn.style.display = isEdit ? "inline-block" : "none";
    }

    function closeModal() {
      if (modal) modal.style.display = "none";
      if (document.getElementById("title"))
        document.getElementById("title").value = "";
      if (document.getElementById("desc"))
        document.getElementById("desc").value = "";
      if (document.getElementById("subject"))
        document.getElementById("subject").value = "";
      if (document.getElementById("priority"))
        document.getElementById("priority").value = "medium";
      if (document.getElementById("dueDate"))
        document.getElementById("dueDate").value = "";
      editIndex = null;
    }

    function renderList() {
      if (!assignmentList) return;
      const data = getAssignments();
      assignmentList.innerHTML = "";

      if (data.length === 0) {
        assignmentList.innerHTML = "<p>Chưa có bài tập nào.</p>";
        return;
      }

      data.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "assignment-card";

        const isOverdue =
          new Date(item.dueDate) < new Date() && !item.isCompleted;
        const priorityText =
          item.priority === "high"
            ? "Cao"
            : item.priority === "medium"
            ? "Trung bình"
            : "Thấp";

        card.innerHTML = `
                    <div class="assignment-header">
                        <input type="checkbox" ${
                          item.isCompleted ? "checked" : ""
                        } onclick="window.toggleCompleteAssignment(${index})">
                        <h3 class="${
                          item.isCompleted ? "completed-text" : ""
                        }">${item.title}</h3>
                        <span class="priority priority-${
                          item.priority
                        }">${priorityText}</span>
                    </div>
                    <p class="desc">${item.desc || ""}</p>
                    <div class="tags">
                        <span class="tag subject">${item.subject}</span>
                    </div>
                    <div class="due-date ${isOverdue ? "overdue" : ""}">
                        📅 Hạn nộp: ${item.dueDate} ${
          isOverdue ? "(Quá hạn)" : ""
        }
                    </div>
                    <div class="actions">
                        <button class="icon-btn" onclick="window.openEditAssignment(${index})">✏️</button>
                        <button class="icon-btn" onclick="window.removeAssignment(${index})">🗑️</button>
                    </div>
                `;
        assignmentList.appendChild(card);
      });
    }

    window.openEditAssignment = function (index) {
      const data = getAssignments();
      const item = data[index];
      editIndex = index;
      openModal(true);

      if (document.getElementById("title"))
        document.getElementById("title").value = item.title;
      if (document.getElementById("desc"))
        document.getElementById("desc").value = item.desc;
      if (document.getElementById("subject"))
        document.getElementById("subject").value = item.subject;
      if (document.getElementById("priority"))
        document.getElementById("priority").value = item.priority;
      if (document.getElementById("dueDate"))
        document.getElementById("dueDate").value = item.dueDate;
    };

    window.removeAssignment = function (index) {
      if (confirm("Bạn có chắc muốn xóa bài tập này?")) {
        const data = getAssignments();
        data.splice(index, 1);
        saveAssignments(data);
        renderList();
      }
    };

    window.toggleCompleteAssignment = function (index) {
      const data = getAssignments();
      data[index].isCompleted = !data[index].isCompleted;
      saveAssignments(data);
      renderList();
    };

    // Gắn Sự kiện
    renderList();

    if (addBtn)
      addBtn.onclick = () => {
        editIndex = null;
        closeModal();
        openModal(false);
      };
    if (cancelBtn) cancelBtn.onclick = closeModal;

    if (saveBtn)
      saveBtn.onclick = () => {
        const title = document.getElementById("title").value.trim();
        const desc = document.getElementById("desc").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const priority = document.getElementById("priority").value;
        const dueDate = document.getElementById("dueDate").value;

        if (!title || !subject || !dueDate) {
          alert("Vui lòng nhập đầy đủ thông tin bắt buộc!");
          return;
        }

        const data = getAssignments();
        const newItem = {
          title,
          desc,
          subject,
          priority,
          dueDate,
          isCompleted: false,
        };

        if (editIndex !== null) {
          newItem.isCompleted = data[editIndex].isCompleted;
          data[editIndex] = newItem;
        } else {
          data.push(newItem);
        }

        saveAssignments(data);
        closeModal();
        renderList();
      };

    if (deleteBtn)
      deleteBtn.onclick = () => {
        if (editIndex !== null) window.removeAssignment(editIndex);
        closeModal();
      };
  } // End ASSIGNMENTS.HTML

  // ==================== KIỂM TRA (TESTS.HTML) ====================
  else if (currentPage === "tests.html") {
    const testModal = document.getElementById("testModal");
    const addTestBtn = document.getElementById("addTestBtn");
    const testList = document.getElementById("testList");
    const weekSelect = document.getElementById("weekSelect");
    const saveBtn = document.getElementById("saveTest");
    const deleteBtn = document.getElementById("deleteTest");
    const cancelBtn = document.getElementById("cancelTest");

    let currentWeek = 1;
    let editingIndex = -1;

    function getTests(week) {
      const key = "tests_data_week_" + week;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }

    function saveTests(week, tests) {
      const key = "tests_data_week_" + week;
      localStorage.setItem(key, JSON.stringify(tests));
    }

    function openModal(isEdit = false) {
      if (testModal) testModal.style.display = "flex";
      if (document.getElementById("modalTitle"))
        document.getElementById("modalTitle").textContent = isEdit
          ? "Sửa lịch kiểm tra"
          : "Thêm lịch kiểm tra";
      if (deleteBtn) deleteBtn.style.display = isEdit ? "inline-block" : "none";
    }

    function closeModal() {
      if (testModal) testModal.style.display = "none";
      if (document.getElementById("testName"))
        document.getElementById("testName").value = "";
      if (document.getElementById("testSubject"))
        document.getElementById("testSubject").value = "";
      if (document.getElementById("testDate"))
        document.getElementById("testDate").value = "";
      if (document.getElementById("testStart"))
        document.getElementById("testStart").value = "";
      if (document.getElementById("testEnd"))
        document.getElementById("testEnd").value = "";
      if (document.getElementById("testRoom"))
        document.getElementById("testRoom").value = "";
      if (document.getElementById("testNote"))
        document.getElementById("testNote").value = "";
      editingIndex = -1;
    }

    function renderTests() {
      if (!testList) return;
      const tests = getTests(currentWeek);
      testList.innerHTML = "";
      if (tests.length === 0) {
        testList.innerHTML =
          "<p>Chưa có lịch kiểm tra nào được thêm cho tuần này.</p>";
        return;
      }

      tests.forEach((t, index) => {
        const testDate = new Date(t.date);
        const isPast = testDate < new Date();
        const card = document.createElement("div");
        card.className = `test-card ${isPast ? "test-past" : ""}`;

        card.innerHTML = `
                    <div class="card-buttons">
                        <button onclick="window.editTest(${index})">✏️</button>
                        <button onclick="window.deleteTest(${index})">🗑️</button>
                    </div>
                    <h3>${t.name}</h3>
                    <small>${t.subject}</small>
                    <p>📅 ${t.date}</p>
                    <p>🕒 ${t.start} - ${t.end}</p>
                    <p>🏫 ${t.room}</p>
                    <p>${t.note || ""}</p>
                `;
        testList.appendChild(card);
      });
    }

    window.editTest = function (index) {
      const tests = getTests(currentWeek);
      const t = tests[index];
      editingIndex = index;
      openModal(true);
      if (document.getElementById("testName"))
        document.getElementById("testName").value = t.name;
      if (document.getElementById("testSubject"))
        document.getElementById("testSubject").value = t.subject;
      if (document.getElementById("testDate"))
        document.getElementById("testDate").value = t.date;
      if (document.getElementById("testStart"))
        document.getElementById("testStart").value = t.start;
      if (document.getElementById("testEnd"))
        document.getElementById("testEnd").value = t.end;
      if (document.getElementById("testRoom"))
        document.getElementById("testRoom").value = t.room;
      if (document.getElementById("testNote"))
        document.getElementById("testNote").value = t.note;
    };

    window.deleteTest = function (index) {
      if (confirm("Bạn có chắc muốn xóa lịch kiểm tra này không?")) {
        const tests = getTests(currentWeek);
        tests.splice(index, 1);
        saveTests(currentWeek, tests);
        renderTests();
      }
    };

    // Gắn Sự kiện
    if (weekSelect) {
      for (let i = 1; i <= 15; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Tuần ${i}`;
        weekSelect.appendChild(option);
      }
      weekSelect.value = currentWeek;

      weekSelect.onchange = () => {
        currentWeek = parseInt(weekSelect.value);
        renderTests();
      };
    }

    if (addTestBtn)
      addTestBtn.onclick = () => {
        editingIndex = -1;
        closeModal();
        openModal(false);
      };
    if (cancelBtn) cancelBtn.onclick = closeModal;

    if (saveBtn)
      saveBtn.onclick = () => {
        const test = {
          name: document.getElementById("testName").value.trim(),
          subject: document.getElementById("testSubject").value.trim(),
          date: document.getElementById("testDate").value.trim(),
          start: document.getElementById("testStart").value.trim(),
          end: document.getElementById("testEnd").value.trim(),
          room: document.getElementById("testRoom").value.trim(),
          note: document.getElementById("testNote").value.trim(),
        };

        if (
          !test.name ||
          !test.subject ||
          !test.date ||
          !test.start ||
          !test.end
        ) {
          alert("Vui lòng nhập đầy đủ thông tin!");
          return;
        }

        const tests = getTests(currentWeek);
        if (editingIndex >= 0) {
          tests[editingIndex] = test;
        } else {
          tests.push(test);
        }
        saveTests(currentWeek, tests);
        closeModal();
        renderTests();
      };

    if (deleteBtn)
      deleteBtn.onclick = () => {
        if (editingIndex >= 0) window.deleteTest(editingIndex);
        closeModal();
      };

    renderTests();
  } // End TESTS.HTML
}); // End DOMContentLoaded
