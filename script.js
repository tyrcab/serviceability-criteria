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

  // 🧭 Automatically detect base path (local or GitHub Pages)
  const basePath = window.location.pathname.includes("serviceability-criteria")
    ? "/serviceability-criteria/"
    : "/";

  const categoryMap = {
    "C": { text: "C - Critical", color: "black" },
    "MNT": { text: "MNT - Maintenance", color: "black" },
    "RIR": { text: "RIR - Rectified in Running", color: "black" },
    "S": { text: "S - Serious", color: "black" },
    "S-ENDR": { text: "S-ENDR - Serious End Run", color: "black" },
    "S-PRTY": { text: "S-PRTY - Serious Priority", color: "black" },
    "S-RETN": { text: "S-RETN - Serious Return Run", color: "black" }
  };

  // 🔹 Load list of trains
  const loadTrains = async () => {
    try {
      const response = await fetch(`${basePath}trains.json`);
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

  // 🔹 Load individual train data
  const loadTrainData = async (jsonFile) => {
    if (!jsonFile) return {};
    try {
      const response = await fetch(`${basePath}${jsonFile}?t=${Date.now()}`);
      const json = await response.json();
      cache[jsonFile] = json;
      return json;
    } catch (err) {
      console.error(`Error loading ${jsonFile}:`, err);
      return {};
    }
  };

  // Initialize dropdown
  loadTrains();

  // 🔸 When train type changes
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

  // 🔸 When equipment fault changes
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

  // 🔸 When fault/condition changes
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

        // 🔔 Trigger pulse animation
        resultCategory.classList.remove("pulse");
        void resultCategory.offsetWidth; // restart animation
        resultCategory.classList.add("pulse");

        // 🎨 Apply background & text color
        resultBox.classList.remove("critical-bg", "serious-bg", "maintenance-bg", "default-bg");

        if (catKey === "C") {
          resultBox.classList.add("critical-bg");
          resultBox.style.color = "#000";
        } else if (catKey.startsWith("S")) {
          resultBox.classList.add("serious-bg");
          resultBox.style.color = "#000";
        } else if (catKey === "MNT" || catKey === "RIR") {
          resultBox.classList.add("maintenance-bg");
          resultBox.style.color = "#111";
        } else {
          resultBox.classList.add("default-bg");
          resultBox.style.color = "#111";
        }

        resultBox.style.display = "block";
      }
    }
  });

  // 🔹 TERMS OF SERVICE MODAL
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
    if (e.target === tosModal) {
      tosModal.classList.remove("show");
    }
  });
});
