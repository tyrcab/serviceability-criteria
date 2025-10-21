let data = {};
let trains = [];
const cache = {};

const trainDocs = {
  "comeng.json": "Document Number: A9718 Version:1.0 Published: 02/08/2022",
  "siemens.json": "Document Number: A9720 Version:1.0 Published: 02/08/2022",
  "Xtrapolis.json": "Document Number: A9719 Version:1.0 Published: 02/08/2022",
  "hcmt.json": "Document Number: A9721 Version:2.0 Published: 22/02/2024"
};

// 🟦 CATEGORY DEFINITIONS (with bold headings)
const categoryDefinitions = {
  "C": `
    <h3>Critical (C) Faults:</h3>
    <p>Critical faults booked during a safety preparation must not enter service. 
    Critical faults booked in running must be removed from service as soon as possible, 
    detraining passengers at the first available station, with the train shunting at a stabling siding 
    as directed by the Train Controller Metrol if safe to do so.</p>
  `,
  "MNT": `
    <h3>Maintenance (MNT) Faults:</h3>
    <p>A Maintenance fault will be reviewed via the FMP system within 24 hours of submission. 
    Maintenance faults will be prioritised, attended and rectified if possible or 
    the FMP system annotated to reflect when the fault will be rectified.</p>
  `,
  "RIR": `
    <h3>Rectified in Running (RIR):</h3>
    <p>Fault rectified in running. TMM/FWN(s) to be removed by Driver. 
    Will be reviewed via the FMP system.</p>
  `,
  "S": `
    <h3>Serious (S) Faults:</h3>
    <p>When a Serious fault is identified, the train may enter and/or remain in revenue service, 
    but will be removed from service as soon as reasonably practical, 
    but not later than the end of scheduled services for that day (including those after 00:00).</p>
    <ul>
      <li><strong>PRTY:</strong> Higher priority to be removed from service than other serious faults.</li>
      <li><strong>RETN:</strong> After the defective leading cab arrives at its current destination, 
      the train will not be driven from that cab again in revenue service until the fault is rectified.</li>
      <li><strong>ENDR:</strong> May be driven in revenue service from the current non-defective cab 
      as far as the Metro network allows. The defective cab must not be driven from in revenue service.</li>
    </ul>
  `,
  "S-PRTY": `
    <h3>Serious Priority (S-PRTY):</h3>
    <p>Given a higher priority to be removed from service than other serious faults.</p>
  `,
  "S-RETN": `
    <h3>Serious Return Run (S-RETN):</h3>
    <p>After the defective leading cab arrives at its current destination, 
    the train will not be driven from that cab again in revenue service until the fault is rectified.</p>
  `,
  "S-ENDR": `
    <h3>Serious End Run (S-ENDR):</h3>
    <p>May be driven in revenue service from the current non–defective cab 
    as far as the Metro network allows. The defective cab must not be driven from in revenue service.</p>
  `
};

document.addEventListener("DOMContentLoaded", () => {
  const trainSelect = document.getElementById("trainType");
  const equipmentSelect = document.getElementById("equipmentFault");
  const faultSelect = document.getElementById("faultCondition");
  const resultBox = document.getElementById("resultBox");
  const resultCondition = document.getElementById("resultCondition");
  const resultCategory = document.getElementById("resultCategory");
  const docInfo = document.getElementById("docInfo");
  const definitionsBox = document.getElementById("definitionsBox");

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

  // 🟦 Train selection
  trainSelect.addEventListener("change", async () => {
    const jsonFile = trainSelect.value;
    docInfo.textContent = trainDocs[jsonFile] || "";
    docInfo.style.display = jsonFile ? "block" : "none";

    equipmentSelect.innerHTML = '<option value="">Select Equipment Fault</option>';
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    faultSelect.disabled = true;
    resultBox.style.display = "none";
    definitionsBox.style.display = "none";

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

  // 🟦 Equipment selection
  equipmentSelect.addEventListener("change", () => {
    const equipment = equipmentSelect.value;
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    resultBox.style.display = "none";
    definitionsBox.style.display = "none";

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

  // 🟦 Fault selection (show result + definitions)
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

        const categoryInfo = categoryMap[catKey] || { text: selectedFault.category || "Unknown", color: "black" };
        resultCategory.textContent = categoryInfo.text;

        // Animate and color result
        resultCategory.classList.remove("pulse");
        void resultCategory.offsetWidth;
        resultCategory.classList.add("pulse");

        resultBox.classList.remove("critical-bg", "serious-bg", "maintenance-bg", "default-bg");
        if (catKey === "C") resultBox.classList.add("critical-bg");
        else if (catKey.startsWith("S")) resultBox.classList.add("serious-bg");
        else if (catKey === "MNT" || catKey === "RIR") resultBox.classList.add("maintenance-bg");
        else resultBox.classList.add("default-bg");

        resultBox.style.display = "block";

        // 🟨 Show definitions with formatted headings
        definitionsBox.innerHTML = categoryDefinitions[catKey] || "<p>No definition available for this category.</p>";
        definitionsBox.style.display = "block";
      }
    }
  });
});
