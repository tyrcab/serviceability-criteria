let data = {};
let trains = [];
const cache = {}; // Cache for loaded train JSONs

document.addEventListener("DOMContentLoaded", () => {
  const trainSelect = document.getElementById("trainType");
  const equipmentSelect = document.getElementById("equipmentFault");
  const faultSelect = document.getElementById("faultCondition");
  const resultBox = document.getElementById("resultBox");
  const resultCondition = document.getElementById("resultCondition");
  const resultCategory = document.getElementById("resultCategory");

  const categoryMap = {
    "C": { text: "C - Critical", class: "critical-bg" },
    "MNT": { text: "MNT - Maintenance", class: "maintenance-bg" },
    "RIR": { text: "RIR - Rectified in Running", class: "maintenance-bg" },
    "S": { text: "S - Serious", class: "serious-bg" },
    "S-ENDR": { text: "S-ENDR - Serious End Run", class: "serious-bg" },
    "S-PRTY": { text: "S-PRTY - Serious Priority", class: "serious-bg" },
    "S-RETN": { text: "S-RETN - Serious Return Run", class: "serious-bg" }
  };

  const loadTrains = async () => {
    try {
      const response = await fetch(`trains.json?t=${Date.now()}`);
      trains = await response.json();
      trains.forEach(train => {
        const option = document.createElement("option");
        option.value = train.file;
        option.textContent = train.name;
        trainSelect.appendChild(option);
      });
    } catch (err) {
      console.error("Error loading trains.json:", err);
    }
  };

  const loadTrainData = async (jsonFile) => {
    if (!jsonFile) return {};
    if (cache[jsonFile]) return cache[jsonFile];
    try {
      const response = await fetch(`${jsonFile}?t=${Date.now()}`);
      const json = await response.json();
      cache[jsonFile] = json;
      return json;
    } catch (err) {
      console.error(`Error loading ${jsonFile}:`, err);
      return {};
    }
  };

  loadTrains();

  trainSelect.addEventListener("change", async () => {
    const jsonFile = trainSelect.value;
    equipmentSelect.innerHTML = '<option value="">Select Equipment Fault</option>';
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    faultSelect.disabled = true;
    resultBox.style.display = "none";

    if (!jsonFile) {
      equipmentSelect.disabled = true;
      return;
    }

    data = await loadTrainData(jsonFile);

    Object.keys(data || {}).forEach(eq => {
      const option = document.createElement("option");
      option.value = eq;
      option.textContent = eq;
      equipmentSelect.appendChild(option);
    });

    equipmentSelect.disabled = !Object.keys(data).length;
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

    if (!equipment || !fault || !data[equipment]) return;

    const selectedFault = data[equipment].find(f => f.condition === fault);
    if (!selectedFault) return;

    resultCondition.textContent = selectedFault.condition;

    const catKey = selectedFault.category
      ? selectedFault.category.replace(/[^\x20-\x7E]/g, "").trim().toUpperCase()
      : "";

    const categoryInfo = categoryMap[catKey] || { text: selectedFault.category || "Unknown", class: "default-bg" };

    resultCategory.textContent = categoryInfo.text;

    // Trigger pulse animation
    resultCategory.classList.remove("pulse");
    void resultCategory.offsetWidth;
    resultCategory.classList.add("pulse");

    // Reset all background classes
    resultBox.className = "result-box"; // remove previous classes
    resultBox.classList.add(categoryInfo.class);

    // Set text color explicitly
    if (categoryInfo.class === "critical-bg" || categoryInfo.class === "serious-bg") {
      resultBox.style.color = "#000";
    } else {
      resultBox.style.color = "#111";
    }

    resultBox.style.display = "block";
  });

  // TERMS OF SERVICE MODAL
  const tosLink = document.getElementById("tosLink");
  const tosModal = document.getElementById("tosModal");
  const tosClose = tosModal.querySelector(".close");

  tosLink.addEventListener("click", (e) => {
    e.preventDefault();
    tosModal.classList.add("show");
  });

  tosClose.addEventListener("click", () => {
    tosModal.classList.remove("show");
  });

  tosModal.addEventListener("click", (e) => {
    if (e.target === tosModal) tosModal.classList.remove("show");
  });
});
