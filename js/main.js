// 1. التخزين المحلي المطور واسترجاع مصفوفة البيانات الأساسية
let tasks = JSON.parse(localStorage.getItem('taskflow_pro_v2_tasks')) || [
    { id: 1, title: "Design Application UI", description: "Build professional modern layouts", priority: "High", dueDate: "2026-06-15", status: "todo" },
    { id: 2, title: "Integrate Charts API", description: "Inject Chart.js into analytics card", priority: "Medium", dueDate: "2026-06-05", status: "inprogress" },
    { id: 3, title: "Final Deliverable Docs", description: "Write overview documentations", priority: "Low", dueDate: "2026-06-20", status: "done" }
];

let myChartInstance = null;

document.addEventListener("DOMContentLoaded", () => {
    // التعديل 2: تحميل بيانات المستخدم الشخصية فور فتح الصفحة
    loadSettings();

    // تطبيق الثيم المخزن مسبقاً
    const savedTheme = localStorage.getItem('taskflow_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (savedTheme === 'dark') {
        document.getElementById("darkModeToggle").innerHTML = `<i class="fa-solid fa-sun"></i> Light Mode`;
    }

    renderTasks();
    updateDashboard();
    buildCalendar();
});

// ================= 2. استرجاع وتعبئة بيانات الإعدادات =================
function loadSettings() {
    const savedName = localStorage.getItem("profileName") || "Razan Ali";
    const savedEmail = localStorage.getItem("profileEmail") || "razan@taskflow.com";

    const nameInput = document.getElementById("profileName");
    const emailInput = document.getElementById("profileEmail");
    const avatar = document.getElementById("userAvatar");

    if (nameInput) nameInput.value = savedName;
    if (emailInput) emailInput.value = savedEmail;
    if (avatar) avatar.innerText = savedName.trim().charAt(0).toUpperCase();
}

function saveSettings() {
    const newName = document.getElementById("profileName").value;
    const newEmail = document.getElementById("profileEmail").value;

    if (newName.trim() === "" || newEmail.trim() === "") {
        alert("Name and Email fields cannot be empty!");
        return;
    }

    // التعديل 2: حفظ الاسم والبريد الإلكتروني بشكل دائم في الـ LocalStorage
    localStorage.setItem("profileName", newName);
    localStorage.setItem("profileEmail", newEmail);

    document.getElementById("userAvatar").innerText = newName.trim().charAt(0).toUpperCase();
    alert("Profile settings saved successfully!");
}

// ================= 3. نظام التنقل والتحكم بالصفحات SPA =================
function showView(viewId) {
    document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
    document.getElementById(viewId).classList.add("active");

    document.querySelectorAll(".menu li").forEach(li => li.classList.remove("active-menu"));
    const targetLi = document.querySelector(`.menu li[onclick="showView('${viewId}')"]`);
    if (targetLi) targetLi.classList.add("active-menu");

    if (viewId === 'dashboard') {
        updateDashboard();
    }
}

// ================= 4. نظام الـ Drag & Drop السحب والإفلات بالماوس =================
function allowDrop(ev) { ev.preventDefault(); }
function drag(ev, id) { ev.dataTransfer.setData("text/plain", id); }
function drop(ev, targetStatus) {
    ev.preventDefault();
    const id = ev.dataTransfer.getData("text/plain");
    tasks = tasks.map(task => {
        if (task.id == id) task.status = targetStatus;
        return task;
    });
    saveToLocalStorage(); renderTasks(); updateDashboard();
}

// ================= 5. التحكم بالـ Modal وإدخال البيانات المعززة =================
function openModal(isEdit = false, taskId = null) {
    const modal = document.getElementById("taskModal");
    modal.style.display = "flex";

    if (isEdit && taskId) {
        document.getElementById("modalTitle").innerText = "Edit Task";
        document.getElementById("saveTaskBtn").innerText = "Update Task";
        const task = tasks.find(t => t.id == taskId);
        if (task) {
            document.getElementById("editTaskId").value = task.id;
            document.getElementById("taskInput").value = task.title;
            document.getElementById("descInput").value = task.description;
            document.getElementById("priorityInput").value = task.priority;
            document.getElementById("dateInput").value = task.dueDate;
            document.getElementById("statusInput").value = task.status;
        }
    } else {
        document.getElementById("modalTitle").innerText = "Add New Task";
        document.getElementById("saveTaskBtn").innerText = "Save Task";
        document.getElementById("editTaskId").value = "";
        clearModalFields();
    }
}

function closeModal() {
    document.getElementById("taskModal").style.display = "none";
    clearModalFields();
}

function clearModalFields() {
    document.getElementById("taskInput").value = "";
    document.getElementById("descInput").value = "";
    document.getElementById("priorityInput").value = "High";
    document.getElementById("dateInput").value = "";
    document.getElementById("statusInput").value = "todo";
}

// ================= 6. الإضافة والتعديل والتحقق من التواريخ (CRUD) =================
function saveTask() {
    const id = document.getElementById("editTaskId").value;
    const title = document.getElementById("taskInput").value.trim();
    const description = document.getElementById("descInput").value.trim();
    const priority = document.getElementById("priorityInput").value;
    const dueDate = document.getElementById("dateInput").value;
    const status = document.getElementById("statusInput").value;

    if (title === "" || dueDate === "") {
        alert("Please enter both a title and a due date!");
        return;
    }

    // التعديل 1: منع إضافة أو تعديل مهمة بتواريخ منتهية وقديمة
    // التحقق من التاريخ عند إضافة مهمة أو تغيير تاريخ مهمة موجودة
const today = new Date().toISOString().split('T')[0];

const existingTask = id ? tasks.find(t => t.id == id) : null;

const dateChanged = existingTask && existingTask.dueDate !== dueDate;

if (
    dueDate < today &&
    status !== 'done' &&
    (!existingTask || dateChanged)
) {
    alert("Due date cannot be in the past!");
    return;
}

    if (id) {
        // التعديل 4: إطلاق رسالة تأكيد عند تعديل المهمة بنجاح
        tasks = tasks.map(t => t.id == id ? { ...t, title, description, priority, dueDate, status } : t);
        alert("Task updated successfully!");
    } else {
        const newTask = { id: Date.now(), title, description, priority, dueDate, status };
        tasks.push(newTask);
    }

    saveToLocalStorage();
    renderTasks();
    updateDashboard();
    closeModal();
}

function deleteTask(id) {
    if (confirm("Are you sure you want to delete this task permanently?")) {
        tasks = tasks.filter(task => task.id !== id);
        saveToLocalStorage(); renderTasks(); updateDashboard();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('taskflow_pro_v2_tasks', JSON.stringify(tasks));
}

// ================= 7. معالجة لوحة كانبان والـ Empty State المطور =================
function renderTasks(filteredTasks = null) {
    const todoHolder = document.querySelector("#col-todo .tasks-holder");
    const progressHolder = document.querySelector("#col-inprogress .tasks-holder");
    const doneHolder = document.querySelector("#col-done .tasks-holder");

    if (!todoHolder || !progressHolder || !doneHolder) return;

    todoHolder.innerHTML = ""; progressHolder.innerHTML = ""; doneHolder.innerHTML = "";

    const tasksToDisplay = filteredTasks || tasks;
    let todoCount = 0, progressCount = 0, doneCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    tasksToDisplay.forEach(task => {
        const isOverdue = (task.dueDate < todayStr && task.status !== 'done') ? 'overdue' : '';

        const taskCard = document.createElement("div");
        taskCard.className = `task-card ${isOverdue}`;
        taskCard.setAttribute("draggable", "true");
        taskCard.setAttribute("ondragstart", `drag(event, ${task.id})`);

        taskCard.innerHTML = `
            <h4>${task.title}</h4>
            <p>${task.description || 'No description provided'}</p>
            <div class="task-meta">
                <span class="badge ${task.priority}">${task.priority}</span>
                <span style="color:var(--text-muted); font-weight:500;"><i class="fa-regular fa-calendar"></i> ${task.dueDate}</span>
                <div style="display:flex; gap:8px;">
                    <i class="fa-solid fa-pen" onclick="openModal(true, ${task.id})" style="cursor:pointer; color:#3b82f6;"></i>
                    <i class="fa-solid fa-trash" onclick="deleteTask(${task.id})" style="cursor:pointer; color:#ef4444;"></i>
                </div>
            </div>
        `;

        if (task.status === "todo") { todoHolder.appendChild(taskCard); todoCount++; }
        else if (task.status === "inprogress") { progressHolder.appendChild(taskCard); progressCount++; }
        else if (task.status === "done") { doneHolder.appendChild(taskCard); doneCount++; }
    });

    document.getElementById("todo-count").innerText = `(${todoCount})`;
    document.getElementById("inprogress-count").innerText = `(${progressCount})`;
    document.getElementById("done-count").innerText = `(${doneCount})`;

    // التعديل 3: استدعاء الـ Empty State المطور بالأيقونات الجمالية
    checkEmptyState(todoHolder);
    checkEmptyState(progressHolder);
    checkEmptyState(doneHolder);
}

function checkEmptyState(holder) {
    if (holder.children.length === 0) {
        holder.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <p>No tasks available</p>
            </div>`;
    }
}

function filterTasks() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const filtered = tasks.filter(t => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
    renderTasks(filtered);
}

// ================= 8. إحصائيات الدشبورد وحقن الأنشطة الأخيرة =================
function updateDashboard() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === "done").length;
    const progress = tasks.filter(t => t.status === "inprogress").length;
    const pending = tasks.filter(t => t.status === "todo").length;

    document.getElementById("totalCount").innerText = total;
    document.getElementById("completedCount").innerText = completed;
    document.getElementById("progressCount").innerText = progress;
    document.getElementById("pendingCount").innerText = pending;

    // التعديل 6: بناء وحقن قائمة الأنشطة الأخيرة (Recent Activities) ديناميكياً
    const recentTasksList = document.getElementById("recentTasksList");
    if (recentTasksList) {
        recentTasksList.innerHTML = "";
        // جلب آخر 3 مهام مضافة في المصفوفة وعكسها ليظهر الأحدث أولاً
        const recent = tasks.slice(-3).reverse();

        if (recent.length === 0) {
            recentTasksList.innerHTML = `<li style="font-size:12px; color:var(--text-muted); font-style:italic;">No recent activities</li>`;
        } else {
            recent.forEach(t => {
                let statusIcon = t.status === 'done' ? '✔' : '⏳';
                recentTasksList.innerHTML += `<li class="recent-item"><span>${statusIcon}</span> <strong>${t.title}</strong></li>`;
            });
        }
    }

    // بناء كائن الـ Chart.js الشهير
    const ctx = document.getElementById('taskChart');
    if (!ctx) return;

    if (myChartInstance) { myChartInstance.destroy(); }

    myChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Pending', 'In Progress', 'Completed'],
            datasets: [{
                label: 'Tasks Status Metric',
                data: [pending, progress, completed],
                backgroundColor: ['#64748b', '#3b82f6', '#22c55e'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

// ================= 9. بناء التقويم التلقائي =================
function buildCalendar() {
    const daysContainer = document.getElementById("calendarDays");
    const monthYearText = document.getElementById("calendarMonthYear");
    if (!daysContainer) return;

    daysContainer.innerHTML = "";
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearText.innerText = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement("div");
        daysContainer.appendChild(emptyDiv);
    }

    for (let i = 1; i <= totalDaysInMonth; i++) {
        const dayDiv = document.createElement("div");
        dayDiv.className = "calendar-day";
        dayDiv.innerText = i;
        if (i === today.getDate()) { dayDiv.classList.add("current"); }
        daysContainer.appendChild(dayDiv);
    }
}

// ================= 10. تفعيل الوضع الليلي وحفظ التفضيلات =================
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    let targetTheme = 'light';

    if (currentTheme === 'light') {
        targetTheme = 'dark';
        document.getElementById("darkModeToggle").innerHTML = `<i class="fa-solid fa-sun"></i> Light Mode`;
    } else {
        document.getElementById("darkModeToggle").innerHTML = `<i class="fa-solid fa-moon"></i> Dark Mode`;
    }

    document.documentElement.setAttribute('data-theme', targetTheme);
    localStorage.setItem('taskflow_theme', targetTheme);
    updateDashboard();
}