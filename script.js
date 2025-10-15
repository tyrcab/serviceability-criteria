let data = {};

document.addEventListener("DOMContentLoaded", () => {
  const trainSelect = document.getElementById("trainType");
  const equipmentSelect = document.getElementById("equipmentFault");
  const faultSelect = document.getElementById("faultCondition");
  const resultBox = document.getElementById("resultBox");
  const resultCondition = document.getElementById("resultCondition");
  const resultCategory = document.getElementById("resultCategory");

  // Map category codes to full text and color
  const categoryMap = {
    "C": { text: "C - Critical", color: "red" },
    "MNT": { text: "MNT - Maintenance", color: "black" },
    "RIR": { text: "RIR - Rectified in Running", color: "black" },
    "S": { text: "S - Serious", color: "orange" },
    "S-ENDR": { text: "S-ENDR - Serious End Run", color: "orange" },
    "S-PRTY": { text: "S-PRTY - Serious Priority", color: "orange" },
    "S-RETN": { text: "S-RETN - Serious Return Run", color: "orange" }
  };

  // Load JSON data
  fetch("data.json")
    .then(response => response.json())
    .then(json => {
      data = json;
      console.log("Data loaded:", data);
    })
    .catch(error => console.error("Error loading JSON:", error));

  // When Train Type changes
  trainSelect.addEventListener("change", () => {
    const trainType = trainSelect.value;
    equipmentSelect.innerHTML = '<option value="">Select Equipment Fault</option>';
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    faultSelect.disabled = true;
    resultBox.style.display = "none";

    if (trainType && data[trainType]) {
      Object.keys(data[trainType]).forEach(eq => {
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

  // When Equipment changes
  equipmentSelect.addEventListener("change", () => {
    const trainType = trainSelect.value;
    const equipment = equipmentSelect.value;
    faultSelect.innerHTML = '<option value="">Select Fault/Condition</option>';
    resultBox.style.display = "none";

    if (trainType && equipment && data[trainType][equipment]) {
      const faults = data[trainType][equipment];
      faults.forEach(fault => {
        const option = document.createElement("option");
        option.value = fault.condition;
        option.textContent = fault.condition;
        faultSelect.appendChild(option);
      });
      faultSelect.disabled = faults.length === 0;
    } else {
      faultSelect.disabled = true;
    }
  });

  // When Fault/Condition changes
  faultSelect.addEventListener("change", () => {
    const trainType = trainSelect.value;
    const equipment = equipmentSelect.value;
    const fault = faultSelect.value;

    if (trainType && equipment && fault) {
      const selectedFault = data[trainType][equipment].find(f => f.condition === fault);
      if (selectedFault) {
        resultCondition.textContent = selectedFault.condition;

        // Map category code to display text and color
        const categoryInfo = categoryMap[selectedFault.category] || { text: selectedFault.category, color: "black" };
        resultCategory.textContent = categoryInfo.text;
        resultCategory.style.color = categoryInfo.color;

        resultBox.style.display = "block";
      }
    }
  });
});
