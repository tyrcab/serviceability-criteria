let data = {};
let trains = [];
const cache = {};

// --- TRAIN DOCUMENT INFO ---
const trainDocs = {
  "comeng.json": "Document Number: A9718 Version:1.0 Published: 02/08/2022",
  "siemens.json": "Document Number: A9720 Version:1.0 Published: 02/08/2022",
  "Xtrapolis.json": "Document Number: A9719 Version:1.0 Published: 02/08/2022",
  "hcmt.json": "Document Number: A9721 Version:2.0 Published: 22/02/2024"
};

// --- SHARED PARAGRAPH FOR SERIOUS FAULTS ---
const seriousCommon = `
  <p>
    All Serious Faults expire when the train shunts and stables (with the exception of HCMT). 
    The train must not run in Revenue Service until the fault has been rectified or remarshalled.
  </p>
`;

// --- CATEGORY DEFINITIONS ---
const categoryDefinitions = {
  "C": `<h3>Critical (C) Faults:</h3><p>Critical faults booked during a safety preparation must not enter service. Critical faults booked in running must be removed from service as soon as possible, detraining passengers at the first available station, with the train shunting at a stabling siding as directed by the Train Controller Metrol if safe to do so.</p>`,
  "MNT": `<h3>Maintenance (MNT) Faults:</h3><p>A Maintenance fault will be reviewed via the FMP system within 24 hours of submission. Maintenance faults will be prioritised, attended and rectified if possible or the FMP system annotated to reflect when the fault will be rectified.</p>`,
  "RIR": `<h3>Rectified in Running (RIR):</h3><p>Fault rectified in running. TMM/FWN(s) to be removed by Driver. Will be reviewed via the FMP system.</p>`,
  "S": `<h3>Serious (S) Faults:</h3><p>When a Serious fault is identified, the train may enter and/or remain in revenue , but will be removed from  as soon as reasonably practical, but not later than the end of scheduled s for that day (including those after 00:00).</p>${seriousCommon}`,
  "S-PRTY": `<h3>Serious Priority (S-PRTY):</h3><p>Given a higher priority to be removed from  than other serious faults.</p>${seriousCommon}`,
  "S-RETN": `<h3>Serious Return Run (S-RETN):</h3><p>After the defective leading cab arrives at its current destination, the train will not be driven from that cab again in revenue  until the fault is rectified.</p>${seriousCommon}`,
  "S-ENDR": `<h3>Serious End Run (S-ENDR):</h3><p>May be driven in revenue  from the current non–defective cab as far as the Metro network allows. The defective cab must not be driven from in revenue .</p>${seriousCommon}`
};

// --- MAIN SCRIPT ---
document.addEventListener("DOMContentLoaded", () => {
  const trainSelect = document.getElementById("trainType");
  const hcmtConditionSelect = document.getElementById("hcmtCondition");
  const equipmentSelect = document.getElementById("equipmentFault");
  const faultSelect = document.getElementById("faultCondition");
  const resultBox = document.getElementById("resultBox");
  const resultCondition = document.getElementById("resultCondition");
  const resultCategory = document.getElementById("resultCategory");
  const docInfo = document.getElementById("docInfo");
  const definitionsBox = document.getElementById("definitionsBox");
  const footerVersion = document.getElementById("appVersion");

  const baseURL = window.location.origin + window.location.pathname.replace(/index\.html$/, "");

  const categoryMap = {
    "C": { text: "C - Critical" },
    "MNT": { text: "MNT - Maintenance" },
    "RIR": { text: "RIR - Rectified in Running" },
    "S": { text: "S - Serious" },
    "S-ENDR": { text: "S-ENDR - Serious End Run" },
    "S-PRTY": { text: "S-PRTY - Serious Priority" },
    "S-RETN": { text: "S-RETN - Serious Return Run" }
  };

  // --- Fetch helper with offline fallback ---
  const fetchJSON = async (url) => {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch {
      const cacheMatch = await caches.match(url);
      if (cacheMatch) return await cacheMatch.json();
      return {};
    }
  };

  // --- Load trains ---
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

  // --- Train selection ---
  trainSelect.addEventListener("change", async () => {
    const jsonFile = trainSelect.value;
    docInfo.textContent = trainDocs[jsonFile] || "";
    docInfo.style.display = jsonFile ? "block" : "none";

    equipmentSelect.innerHTML = '<option value="">Select Equipment Fault</option>';
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    faultSelect.disabled = true;
    hcmtConditionSelect.style.display = "none";
    hcmtConditionSelect.innerHTML = '<option value="">Select Condition</option>';
    resultBox.style.display = "none";
    definitionsBox.style.display = "none";

    if (!jsonFile) {
      equipmentSelect.disabled = true;
      return;
    }

    data = await loadTrainData(jsonFile);

    if (jsonFile === "hcmt.json") {
      hcmtConditionSelect.style.display = "inline-block";
      ["Running", "Prep"].forEach(cond => {
        const option = document.createElement("option");
        option.value = cond;
        option.textContent = cond;
        hcmtConditionSelect.appendChild(option);
      });
      equipmentSelect.disabled = true;
    } else {
      hcmtConditionSelect.style.display = "none";
      Object.keys(data).forEach(eq => {
        const option = document.createElement("option");
        option.value = eq;
        option.textContent = eq;
        equipmentSelect.appendChild(option);
      });
      equipmentSelect.disabled = Object.keys(data).length === 0;
    }
  });

  // --- HCMT condition selection ---
  hcmtConditionSelect.addEventListener("change", () => {
    const condType = hcmtConditionSelect.value;
    equipmentSelect.innerHTML = '<option value="">Select Equipment Fault</option>';
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    resultBox.style.display = "none";
    definitionsBox.style.display = "none";

    if (!condType) {
      equipmentSelect.disabled = true;
      return;
    }

    Object.keys(data).forEach(eq => {
      const option = document.createElement("option");
      option.value = eq;
      option.textContent = eq;
      equipmentSelect.appendChild(option);
    });
    equipmentSelect.disabled = false;
  });

  // --- Equipment selection ---
  equipmentSelect.addEventListener("change", () => {
    const equipment = equipmentSelect.value;
    const hcmtCond = hcmtConditionSelect.value;
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    resultBox.style.display = "none";
    definitionsBox.style.display = "none";

    if (!equipment) {
      faultSelect.disabled = true;
      return;
    }

    let faultsArray = data[equipment];
    if (trainSelect.value === "hcmt.json" && hcmtCond) {
      faultsArray = data[equipment][hcmtCond] || [];
    }

    faultsArray.forEach(fault => {
      const option = document.createElement("option");
      option.value = fault.condition;
      option.textContent = fault.condition;
      faultSelect.appendChild(option);
    });

    faultSelect.disabled = faultsArray.length === 0;
  });

  // --- Fault selection ---
  faultSelect.addEventListener("change", () => {
    const equipment = equipmentSelect.value;
    const fault = faultSelect.value;
    const hcmtCond = hcmtConditionSelect.value;

    if (!equipment || !fault) return;

    let selectedFault;
    if (trainSelect.value === "hcmt.json" && hcmtCond) {
      selectedFault = (data[equipment][hcmtCond] || []).find(f => f.condition === fault);
    } else {
      selectedFault = (data[equipment] || []).find(f => f.condition === fault);
    }

    if (!selectedFault) return;

    resultCondition.textContent = selectedFault.condition;

    const catKey = selectedFault.category
      ? selectedFault.category.replace(/[^\x20-\x7E]/g, "").trim().toUpperCase()
      : "";

    const categoryInfo = categoryMap[catKey] || { text: selectedFault.category || "Unknown" };
    resultCategory.textContent = categoryInfo.text;

    // Animate & color
    resultCategory.classList.remove("pulse");
    void resultCategory.offsetWidth;
    resultCategory.classList.add("pulse");

    resultBox.classList.remove("critical-bg", "serious-bg", "maintenance-bg", "default-bg");
    if (catKey === "C") resultBox.classList.add("critical-bg");
    else if (catKey.startsWith("S")) resultBox.classList.add("serious-bg");
    else if (catKey === "MNT" || catKey === "RIR") resultBox.classList.add("maintenance-bg");
    else resultBox.classList.add("default-bg");

    resultBox.style.display = "block";
    definitionsBox.innerHTML = categoryDefinitions[catKey] || "<p>No definition available for this category.</p>";
    definitionsBox.style.display = "block";
  });

  // --- TERMS OF SERVICE MODAL ---
  const tosLink = document.getElementById("tosLink");
  const tosModal = document.getElementById("tosModal");
  const tosClose = tosModal ? tosModal.querySelector(".close") : null;

  if (tosLink && tosModal && tosClose) {
    tosLink.addEventListener("click", (e) => {
      e.preventDefault();
      tosModal.classList.add("show");
    });

    tosClose.addEventListener("click", () => tosModal.classList.remove("show"));
    tosModal.addEventListener("click", (e) => {
      if (e.target === tosModal) tosModal.classList.remove("show");
    });
  }

  // --- VERSION & UPDATE MODAL ---
  const updateModalId = "updateModal";

  const showUpdateModalIfPending = () => {
    if (!navigator.serviceWorker.waiting) return;
    if (document.getElementById(updateModalId)) return;

    const modal = document.createElement("div");
    modal.id = updateModalId;
    modal.style = `
      position: fixed;
      top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center;
      z-index:10000;
    `;
    const box = document.createElement("div");
    box.style = `
      background: #fff; padding: 20px; border-radius: 8px; text-align:center; max-width:300px;
    `;
    box.innerHTML = `
      <p>A new version of the app is available.</p>
      <button id="installUpdate" style="padding:8px 15px;margin-top:10px;">Install Update</button>
    `;
    modal.appendChild(box);
    document.body.appendChild(modal);

    document.getElementById("installUpdate").addEventListener("click", () => {
      if (navigator.serviceWorker.waiting) {
        navigator.serviceWorker.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      localStorage.removeItem("pendingUpdate");
      modal.remove();
      window.location.reload();
    });
  };

  const updateVersion = async () => {
    try {
      const versionData = await fetch(`${baseURL}version.json?t=${Date.now()}`).then(r => r.json());
      const currentVersion = versionData.version || "v1.0.0";
      const buildTime = versionData.buildTime || "";

      if (footerVersion) {
        const datePart = buildTime.split(",")[0]?.trim();
        const versionDisplay = datePart ? `Version: ${currentVersion} (${datePart})` : `Version: ${currentVersion}`;
        footerVersion.textContent = versionDisplay;
      }

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === "NEW_VERSION") {
            localStorage.setItem("pendingUpdate", "true");
            showUpdateModalIfPending();
          }
        });

        navigator.serviceWorker.controller.postMessage("checkForUpdate");

        if (localStorage.getItem("pendingUpdate") === "true") {
          showUpdateModalIfPending();
        }
      }
    } catch (err) {
      console.log("Failed to load version.json", err);
    }
  };

  updateVersion();
});
