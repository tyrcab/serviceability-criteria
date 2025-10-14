let data = {}; // JSON data holder

fetch('data.json')
  .then(response => {
    if (!response.ok) throw new Error("Failed to load data.json");
    return response.json();
  })
  .then(json => {
    data = json;
    console.log("Data loaded successfully");
  })
  .catch(error => {
    console.error("Error loading JSON:", error);
    alert("Failed to load serviceability data.");
  });

const trainTypeSelect = document.getElementById("trainType");
const equipmentFaultSelect = document.getElementById("equipmentFault");
const faultConditionSelect = document.getElementById("faultCondition");
const resultBox = document.getElementById("resultBox");
const resultCondition = document.getElementById("resultCondition");
const resultCategory = document.getElementById("resultCategory");

trainTypeSelect.addEventListener("change", function() {
  const trainType = this.value;
  equipmentFaultSelect.innerHTML = '<option value="">Select Equipment Fault</option>';
  faultConditionSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
  faultConditionSelect.disabled = true;
  resultBox.style.display = "none";

  if (trainType && data[trainType]) {
    const faults = Object.keys(data[trainType]);
    faults.forEach(fault => {
      const opt = document.createElement("option");
      opt.value = fault;
      opt.textContent = fault;
      equipmentFaultSelect.appendChild(opt);
    });
    equipmentFaultSelect.disabled = false;
  } else {
    equipmentFaultSelect.disabled = true;
  }
});

equipmentFaultSelect.addEventListener("change", function() {
  const trainType = trainTypeSelect.value;
  const fault = this.value;
  faultConditionSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
  resultBox.style.display = "none";

  if (trainType && fault && data[trainType][fault]) {
    const conditions = data[trainType][fault];
    if (conditions.length > 0) {
      conditions.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.condition;
        opt.textContent = item.condition;
        faultConditionSelect.appendChild(opt);
      });
      faultConditionSelect.disabled = false;
    } else {
      // No fault/condition entries yet
      faultConditionSelect.disabled = true;
    }
  } else {
    faultConditionSelect.disabled = true;
  }
});

faultConditionSelect.addEventListener("change", function() {
  const trainType = trainTypeSelect.value;
  const fault = equipmentFaultSelect.value;
  const condition = this.value;

  if (trainType && fault && condition) {
    const found = data[trainType][fault].find(item => item.condition === condition);
    if (found) {
      resultCondition.textContent = found.condition;
      resultCategory.textContent = found.category;
      resultBox.style.display = "block";
    }
  } else {
    resultBox.style.display = "none";
  }
});
