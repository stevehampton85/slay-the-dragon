const API_URL = 'https://script.google.com/macros/s/AKfycbyxmH9dekYrG372MDCf-IY14stnHSmnYujphCxBqgUrvOeHUWqjCo_Oa45L1_-eTPEF/exec';

// --- SAVE DATA / STATE MANAGEMENT ---
// 1. Load gems from local storage, or default to 0 if it's the first time
let currentGems = parseInt(localStorage.getItem('dragonGems')) || 0;

// 2. Create or load an anonymous User ID for accountability linking
let userId = localStorage.getItem('dragonUserId');
if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('dragonUserId', userId);
}

// Setup PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(err => console.error(err)));
}

document.addEventListener('DOMContentLoaded', () => {
    // Update the UI immediately with your saved gems
    document.getElementById('total-gems').innerText = currentGems;
    fetchTasks();
});

async function fetchTasks() {
    const taskList = document.getElementById('task-list');
    const loading = document.getElementById('loading');

    try {
        const response = await fetch(API_URL);
        const json = await response.json();
        
        loading.style.display = 'none';

        if (json.result === 'success') {
            renderTasks(json.data);
        } else {
            taskList.innerHTML = `<li style="color:red;">Error loading quests.</li>`;
        }
    } catch (error) {
        loading.style.display = 'none';
        taskList.innerHTML = `<li style="color:red;">Network Error.</li>`;
    }
}

function renderTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = ''; 

    const activeTasks = tasks.filter(task => task.Status === 'Pending');

    if (activeTasks.length === 0) {
        taskList.innerHTML = `<li class="quest-card" style="text-align:center; color:var(--sparx-green);">All Quests Cleared!</li>`;
        return;
    }

    activeTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'quest-card';
        
        li.innerHTML = `
            <div class="quest-title">${task.TaskName}</div>
            <div class="quest-details">${task.Description}</div>
            <button class="btn-complete" onclick="completeTask(${task.TaskID}, ${task.Points}, this)">
                Collect ${task.Points} Gems
            </button>
        `;
        taskList.appendChild(li);
    });
}

async function completeTask(taskId, points, buttonElement) {
    // 1. Update Score & SAVE IT to the browser
    currentGems += points;
    document.getElementById('total-gems').innerText = currentGems;
    localStorage.setItem('dragonGems', currentGems); // <--- This prevents the reset!

    // 2. UI Disabling
    buttonElement.innerText = "CLEARED";
    buttonElement.disabled = true;
    const card = buttonElement.closest('.quest-card');
    card.style.opacity = '0.5';
    
    // 3. Make Sparx flash green
    const sparx = document.getElementById('sparx-sprite');
    sparx.style.backgroundColor = "var(--sparx-green)";
    sparx.style.boxShadow = "0 0 30px 15px var(--sparx-green)";
    setTimeout(() => {
        sparx.style.backgroundColor = "var(--sparx-yellow)";
        sparx.style.boxShadow = "0 0 15px 5px var(--sparx-yellow)";
    }, 1500);

    // 4. Background Database Post (Sending your UserID too)
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ task_id: taskId, user_id: userId }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
    } catch (error) {
        console.error("Database sync failed", error);
    }
}
