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
    "C": { text: "C - Critical", className: "critical-bg", color: "#000" },
    "S": { text: "S - Serious", className: "serious-bg", color: "#000" },
    "S-ENDR": { text: "S-ENDR - Serious End Run", className: "serious-bg", color: "#000" },
    "S-PRTY": { text: "S-PRTY - Serious Priority", className: "serious-bg", color: "#000" },
    "S-RETN": { text: "S-RETN - Serious Return Run", className: "serious-bg", color: "#000" },
    "MNT": { text: "MNT - Maintenance", className: "maintenance-bg", color: "#111" },
    "RIR": { text: "RIR - Rectified in Running", className: "maintenance-bg", color: "#111" }
  };

  // Load trains.json
  const loadTrains = async () => {
    try {
      const response = await fetch("trains.json?v=" + Date.now());
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

  // Load individual train JSON
  const loadTrainData = async (jsonFile) => {
    if (!jsonFile) return {};
    if (cache[jsonFile]) return cache[jsonFile]; // return cached
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

  // Handle train selection
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

  // Handle equipment selection
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

  // Handle fault selection and display result
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

        const categoryInfo = categoryMap[catKey] || { text: selectedFault.category || "Unknown", className: "default-bg", color: "#111" };

        resultCategory.textContent = categoryInfo.text;

        // Pulse animation
        resultCategory.classList.remove("pulse");
        void resultCategory.offsetWidth; // restart animation
        resultCategory.classList.add("pulse");

        // Update result box colors
        resultBox.className = "result-box " + categoryInfo.className;
        resultBox.style.color = categoryInfo.color;
        resultBox.style.display = "block";
      }
    }
  });

  // TERMS OF SERVICE MODAL
  const tosLink = document.getElementById("tosLink");
  const tosModal = document.getElementById("tosModal");
  const tosClose = tosModal.querySelector(".close");

  // Open modal
  tosLink.addEventListener("click", (e) => {
    e.preventDefault();
    tosModal.classList.add("show");
  });

  // Close modal when clicking ×
  tosClose.addEventListener("click", () => {
    tosModal.classList.remove("show");
  });

  // Close modal when clicking outside content
  tosModal.addEventListener("click", (e) => {
    if (e.target === tosModal) {
      tosModal.classList.remove("show");
    }
  });
});
