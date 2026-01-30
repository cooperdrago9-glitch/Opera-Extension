document.addEventListener("DOMContentLoaded", () => {

  /* ================== OPEN WEBSITES ================== */
  function openSite(url) {
    chrome.tabs.create({ url });
  }

  document.getElementById("gmailBtn").addEventListener("click", () => {
    openSite("https://mail.google.com");
  });

  document.getElementById("youtubeBtn").addEventListener("click", () => {
    openSite("https://www.youtube.com");
  });

  document.getElementById("zoomBtn").addEventListener("click", () => {
    openSite("https://zoom.us");
  });

  /* ================== LINKS / FOLDERS ================== */
  const foldersDiv = document.getElementById("folders");
  const linkInput = document.getElementById("linkInput");
  const folderInput = document.getElementById("folderInput");
  const addLinkBtn = document.getElementById("addLinkBtn");

  let links = {};

  chrome.storage.local.get("links", res => {
    links = res.links || {};
    renderLinks();
  });

  function saveLinks() {
    chrome.storage.local.set({ links });
  }

  function renderLinks() {
    foldersDiv.innerHTML = "";

    Object.keys(links).forEach(folder => {
      const wrapper = document.createElement("div");
      wrapper.className = "folder";

      const title = document.createElement("div");
      title.className = "folder-title";
      title.textContent = folder;
      title.addEventListener("click", () => {
        wrapper.classList.toggle("collapsed");
      });

      wrapper.appendChild(title);

      links[folder].forEach(url => {
        const link = document.createElement("div");
        link.className = "link";
        link.textContent = url;
        link.addEventListener("click", () => openSite(url));
        wrapper.appendChild(link);
      });

      foldersDiv.appendChild(wrapper);
    });
  }

  addLinkBtn.addEventListener("click", () => {
    const url = linkInput.value.trim();
    const folder = folderInput.value.trim() || "General";
    if (!url) return;

    links[folder] ??= [];
    links[folder].push(url);

    saveLinks();
    renderLinks();

    linkInput.value = "";
  });

  /* ================== CALENDAR / SCHEDULER ================== */
  const calendarDiv = document.getElementById("calendar");
  const dayLabel = document.getElementById("dayLabel");
  const prevDayBtn = document.getElementById("prevDay");
  const nextDayBtn = document.getElementById("nextDay");
  const resetDayBtn = document.getElementById("resetDay");

  let calendar = {};
  let dayOffset = 0;
  let selectedPreset = null;

  chrome.storage.local.get("calendar", res => {
    calendar = res.calendar || {};
    renderCalendar();
  });

  function saveCalendar() {
    chrome.storage.local.set({ calendar });
  }

  function getDayKey(offset = dayOffset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  }

  function eventColor(text) {
    if (!text) return "#000";
    if (text.includes("Meeting")) return "#e53935";
    if (text.includes("Focus")) return "#1e88e5";
    if (text.includes("Lunch") || text.includes("Break")) return "#2e7d32";
    return "#000";
  }

  /* ---------- PRESET BUTTONS ---------- */
  document.querySelectorAll(".preset").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedPreset = btn.textContent;

      document.querySelectorAll(".preset").forEach(b => {
        b.style.opacity = "0.5";
      });

      btn.style.opacity = "1";
    });
  });

  function renderCalendar() {
    calendarDiv.innerHTML = "";

    const key = getDayKey();
    calendar[key] ??= {};

    dayLabel.textContent = dayOffset === 0 ? "Today" : key;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (let h = 8; h <= 18; h++) {
      for (let m of [0, 30]) {
        const slot = `${h}:${m === 0 ? "00" : "30"}`;

        const row = document.createElement("div");
        row.className = "hour";

        const time = document.createElement("div");
        time.className = "time";
        time.textContent = slot;

        const event = document.createElement("div");
        event.className = "event";
        event.textContent = calendar[key][slot] || "";
        event.style.color = eventColor(event.textContent);

        const slotMinutes = h * 60 + m;
        if (dayOffset === 0 && nowMinutes >= slotMinutes && nowMinutes < slotMinutes + 30) {
          const line = document.createElement("div");
          line.className = "now-line";
          row.appendChild(line);
        }

        /* 🔥 FIXED CLICK HANDLER */
        row.addEventListener("click", () => {
          calendar[key] ??= {};

          let text = selectedPreset;

          if (!text) {
            text = prompt("Edit event:", calendar[key][slot] || "");
            if (text === null) return;
          }

          if (text === "") {
            delete calendar[key][slot];
          } else {
            calendar[key][slot] = text;
          }

          saveCalendar();
          renderCalendar();
        });

        row.appendChild(time);
        row.appendChild(event);
        calendarDiv.appendChild(row);
      }
    }
  }

  prevDayBtn.addEventListener("click", () => {
    dayOffset--;
    renderCalendar();
  });

  nextDayBtn.addEventListener("click", () => {
    dayOffset++;
    renderCalendar();
  });

  resetDayBtn.addEventListener("click", () => {
    calendar[getDayKey()] = {};
    saveCalendar();
    renderCalendar();
  });

});
