let data = {};
let trains = [];
const cache = {};

const trainDocs = {
  "comeng.json": "Document Number: A9718 Version:1.0 Published: 02/08/2022",
  "siemens.json": "Document Number: A9720 Version:1.0 Published: 02/08/2022",
  "xtrapolis.json": "Document Number: A9719 Version:1.0 Published: 02/08/2022",
  "hcmt.json": "Document Number: A9721 Version:2.0 Published: 22/02/2024"
};

document.addEventListener("DOMContentLoaded", () => {
  const trainSelect = document.getElementById("trainType");
  const equipmentSelect = document.getElementById("equipmentFault");
  const faultSelect = document.getElementById("faultCondition");
  const resultBox = document.getElementById("resultBox");
  const resultCondition = document.getElementById("resultCondition");
  const resultCategory = document.getElementById("resultCategory");
  const docInfo = document.getElementById("docInfo");

  const categoryMap = {
    "C": { text: "C - Critical", color: "black" },
    "MNT": { text: "MNT - Maintenance", color: "black" },
    "RIR": { text: "RIR - Rectified in Running", color: "black" },
    "S": { text: "S - Serious", color: "black" },
    "S-ENDR": { text: "S-ENDR - Serious End Run", color: "black" },
    "S-PRTY": { text: "S-PRTY - Serious Priority", color: "black" },
    "S-RETN": { text: "S-RETN - Serious Return Run", color: "black" }
  };

  const baseURL = window.location.origin + window.location.pathname.replace(/index\.html$/, "");

  const fetchJSON = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      const cacheMatch = await caches.match(url);
      if (cacheMatch) return await cacheMatch.json();
      return {};
    }
  };

  const loadTrains = async () => {
    trains = await fetchJSON(`${baseURL}trains.json`);
    trainSelect.innerHTML = '<option value="">Select Train Type</option>';
    trains.forEach(train => {
      const option = document.createElement("option");
      option.value = train.file;
      option.textContent = train.name;
      trainSelect.appendChild(option);
    });
  };

  const loadTrainData = async (jsonFile) => {
    if (!jsonFile) return {};
    const json = await fetchJSON(`${baseURL}${jsonFile}?t=${Date.now()}`);
    cache[jsonFile] = json;
    return json;
  };

  loadTrains();

  trainSelect.addEventListener("change", async () => {
    const jsonFile = trainSelect.value;

    // Show document info
    docInfo.textContent = trainDocs[jsonFile] || "";
    docInfo.style.display = jsonFile ? "block" : "none";

    equipmentSelect.innerHTML = '<option value="">Select Equipment Fault</option>';
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    faultSelect.disabled = true;
    resultBox.style.display = "none";

    if (!jsonFile) {
      equipmentSelect.disabled = true;
      return;
    }

    data = await loadTrainData(jsonFile);

    if (Object.keys(data).length > 0) {
      Object.keys(data).forEach(eq => {
        const option = document.createElement("option");
        option.value = eq;
        option.textContent = eq;
        equipmentSelect.appendChild(option);
      });
      equipmentSelect.disabled = false;
    } else {
      equipmentSelect.disabled = true;
    }
  });

  equipmentSelect.addEventListener("change", () => {
    const equipment = equipmentSelect.value;
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    resultBox.style.display = "none";

    if (equipment && data[equipment]) {
      data[equipment].forEach(fault => {
        const option = document.createElement("option");
        option.value = fault.condition;
        option.textContent = fault.condition;
        faultSelect.appendChild(option);
      });
      faultSelect.disabled = data[equipment].length === 0;
    } else {
      faultSelect.disabled = true;
    }
  });

  faultSelect.addEventListener("change", () => {
    const equipment = equipmentSelect.value;
    const fault = faultSelect.value;

    if (equipment && fault && data[equipment]) {
      const selectedFault = data[equipment].find(f => f.condition === fault);
      if (selectedFault) {
        resultCondition.textContent = selectedFault.condition;

        const catKey = selectedFault.category
          ? selectedFault.category.replace(/[^\x20-\x7E]/g, "").trim().toUpperCase()
          : "";

        const categoryInfo =
          categoryMap[catKey] || { text: selectedFault.category || "Unknown", color: "black" };

        resultCategory.textContent = categoryInfo.text;

        resultCategory.classList.remove("pulse");
        void resultCategory.offsetWidth;
        resultCategory.classList.add("pulse");

        resultBox.classList.remove("critical-bg", "serious-bg", "maintenance-bg", "default-bg");

        if (catKey === "C") resultBox.classList.add("critical-bg");
        else if (catKey.startsWith("S")) resultBox.classList.add("serious-bg");
        else if (catKey === "MNT" || catKey === "RIR") resultBox.classList.add("maintenance-bg");
        else resultBox.classList.add("default-bg");

        resultBox.style.display = "block";
      }
    }
  });

  const tosLink = document.getElementById("tosLink");
  const tosModal = document.getElementById("tosModal");
  const tosClose = tosModal.querySelector(".close");

  tosLink.addEventListener("click", (e) => { e.preventDefault(); tosModal.classList.add("show"); });
  tosClose.addEventListener("click", () => tosModal.classList.remove("show"));
  tosModal.addEventListener("click", (e) => { if (e.target === tosModal) tosModal.classList.remove("show"); });
});
