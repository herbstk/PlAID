// Data structures
let protocol = [];
let currentStep = 0;
let plateScale = 1.0; // Scale factor for plate size

// DOM Elements
const fileInput = document.getElementById('csvFile');
const sourcePlate = document.getElementById('sourcePlate');
const targetPlate = document.getElementById('targetPlate');
const targetPlateHeading = document.getElementById('targetPlateHeading');
const sourcePlateName = document.getElementById('sourcePlateName');
const targetPlateName = document.getElementById('targetPlateName');
const infoSection = document.getElementsByClassName('info-section')[0];
const stepInfo = document.getElementById('stepInfo');
const prevStepBtn = document.getElementById('prevStep');
const nextStepBtn = document.getElementById('nextStep');
const stepCounter = document.getElementById('stepCounter');
const protocolTable = document.getElementById('protocolTable');
const tableContainer = document.getElementsByClassName('table-container')[0];
const plateChangeModal = document.getElementById('plateChangeModal');
const plateChangeMessage = document.getElementById('plateChangeMessage');
const confirmPlateChangeBtn = document.getElementById('confirmPlateChange');

// Event Listeners
fileInput.addEventListener('change', handleFileUpload);
prevStepBtn.addEventListener('click', () => navigateStep(-1));
nextStepBtn.addEventListener('click', () => navigateStep(1));
confirmPlateChangeBtn.addEventListener('click', confirmPlateChange);

// Add keyboard shortcuts for plate scaling
document.addEventListener('keydown', (e) => {
  if (e.key === '+' || e.key === '=') {
    plateScale = Math.min(plateScale + 0.02, 2.0);
    updatePlateScales();
  } else if (e.key === '-') {
    plateScale = Math.max(plateScale - 0.02, 0.5);
    updatePlateScales();
  }
});

function updatePlateScales() {
  sourcePlate.style.transform = `scale(${plateScale})`;
  targetPlate.style.transform = `scale(${plateScale})`;
    targetPlateHeading.style["margin-top"] = `${(plateScale*17)-17}rem`;
    infoSection.style["margin-top"] = `${(plateScale*17)-17}rem`;
}

// File handling
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const text = await file.text();
  const rows = text.split('\n').map(row => row.trim()).filter(row => row);
  
  // Skip header row and map CSV columns to expected format
  protocol = rows.slice(1).map(row => {
    const values = row.split(','); // Using comma delimiter
      // TODO: also handle optional additional information
      const addValues = null;
      if (values.length > 8) addValues = values.slice(8);
      // TODO map column header into dictionary keys for additional column, then those whould pop up by the exisitng infotext-update-logic
    return {
        source_plate_name: values[0], // SOURCEPLATEID
        source_plate_density: values[1], // SOURCEDENSITY
        source_plate_row: values[2], // SOURCECOLONYROW
        source_plate_column: values[3], // SOURCECOLONYCOLUMN
        target_plate_name: values[4], // TARGETPLATEID
        target_plate_density: values[5], // TARGETDENSITY
        target_plate_row: values[6], // TARGETCOLONYROW
        target_plate_column: values[7], // TARGETCOLONYCOLUMN
       // additional_infos = 
       
    };
  });

  initializeProtocol();
}

// Protocol initialization
function initializeProtocol() {
  if (protocol.length === 0) return;

  currentStep = 0;
  updateNavigationButtons();
  displayProtocolTable();
  showStep(currentStep);
}

// Navigation
function navigateStep(delta) {
  const nextStep = currentStep + delta;
  if (nextStep < 0 || nextStep >= protocol.length) return;

  const currentPlates = {
    source: protocol[currentStep].source_plate_name,
    target: protocol[currentStep].target_plate_name
  };

  const nextPlates = {
    source: protocol[nextStep].source_plate_name,
    target: protocol[nextStep].target_plate_name
  };

  if (currentPlates.source !== nextPlates.source || currentPlates.target !== nextPlates.target) {
    showPlateChangeModal(currentPlates, nextPlates, nextStep);
  } else {
    currentStep = nextStep;
    showStep(currentStep);
  }
}

// Plate change handling
function showPlateChangeModal(currentPlates, nextPlates, nextStep) {
  let changes = [];
  
  if (currentPlates.source !== nextPlates.source) {
    changes.push(`Source plate change: ${currentPlates.source} → ${nextPlates.source}`);
  }
  if (currentPlates.target !== nextPlates.target) {
    changes.push(`Target plate change: ${currentPlates.target} → ${nextPlates.target}`);
  }

  plateChangeMessage.textContent = changes.join('\n');
  plateChangeModal.classList.add('active');

  confirmPlateChangeBtn.onclick = () => {
    plateChangeModal.classList.remove('active');
    currentStep = nextStep;
    showStep(currentStep);
  };
}

function confirmPlateChange() {
  plateChangeModal.classList.remove('active');
}

// Display functions
function showStep(stepIndex) {
  const step = protocol[stepIndex];
  if (!step) return;

  // Update plate names
  sourcePlateName.textContent = step.source_plate_name;
  targetPlateName.textContent = step.target_plate_name;

  // Clear previous highlights
  clearPlates();

  // Create and highlight wells
  createPlate(sourcePlate, step.source_plate_density);
  createPlate(targetPlate, step.target_plate_density);

  highlightWell(sourcePlate, step.source_plate_row, step.source_plate_column, step.source_plate_density);
  highlightWell(targetPlate, step.target_plate_row, step.target_plate_column, step.target_plate_density);

  // Update step information
  updateStepInfo(step);
  updateNavigationButtons();
  updateStepCounter();
  highlightCurrentStepInTable();
}

function createPlate(plateElement, density) {
  plateElement.innerHTML = '';
  plateElement.className = `plate format-${density}`;
  
  const rows = density === '384' ? 16 : 8;
  const cols = density === '384' ? 24 : 12;

  // Create column headers
  const headerRow = document.createElement('div');
  headerRow.className = 'plate-header';
  //headerRow.appendChild(document.createElement('div')); // Empty corner cell
  // Create placeholder corner cell to align with row header
  const header = document.createElement('div');
  header.className = 'col-header';
  header.textContent = ' ';
  headerRow.appendChild(header);
  for (let col = 1; col <= cols; col++) {
    const header = document.createElement('div');
    header.className = 'col-header';
    header.textContent = col;
    headerRow.appendChild(header);
  }
  plateElement.appendChild(headerRow);

  // Create rows with row headers and wells
  for (let row = 0; row < rows; row++) {
    const rowElement = document.createElement('div');
    rowElement.className = 'plate-row';
    
    // Add row header
    const rowHeader = document.createElement('div');
    rowHeader.className = 'row-header';
    rowHeader.textContent = String.fromCharCode(65 + row); // A, B, C, etc.
    rowElement.appendChild(rowHeader);

    // Add wells
    for (let col = 0; col < cols; col++) {
      const well = document.createElement('div');
      well.className = 'well';
      well.id = `well-${plateElement.id}-${String.fromCharCode(65 + row)}${col + 1}`;
      const wellLabel = document.createElement('span');
      wellLabel.className = 'well-label';
      wellLabel.textContent = `${String.fromCharCode(65 + row)}${col + 1}`;
      well.appendChild(wellLabel);
      rowElement.appendChild(well);
    }
    
    plateElement.appendChild(rowElement);
  }
}

function highlightWell(plateElement, row, col, density) {
  const wellId = `well-${plateElement.id}-${row}${col}`;
  const well = document.getElementById(wellId);
  if (well) {
    well.classList.add('highlighted');
  }
}

function clearPlates() {
  sourcePlate.innerHTML = '';
  targetPlate.innerHTML = '';
}

function updateStepInfo(step) {
  // Filter out standard columns to show only additional info
  const standardColumns = [
    'source_plate_name', 'source_plate_density', 'source_plate_row', 'source_plate_column',
    'target_plate_name', 'target_plate_density', 'target_plate_row', 'target_plate_column'
  ];

  const additionalInfo = Object.entries(step)
    .filter(([key]) => !standardColumns.includes(key))
    .map(([key, value]) => `${key}: ${value}`)
    .join('<br>');

  stepInfo.innerHTML = additionalInfo || 'No additional information available';
}

function updateNavigationButtons() {
  prevStepBtn.disabled = currentStep === 0;
  nextStepBtn.disabled = currentStep === protocol.length - 1;
}

function updateStepCounter() {
  stepCounter.textContent = `Step ${currentStep + 1} of ${protocol.length}`;
}

function displayProtocolTable() {
  const tbody = protocolTable.querySelector('tbody');
  tbody.innerHTML = '';

  protocol.forEach((step, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${step.source_plate_name}</td>
      <td>${step.source_plate_row}${step.source_plate_column}</td>
      <td>${step.target_plate_name}</td>
      <td>${step.target_plate_row}${step.target_plate_column}</td>
      <td>${getAdditionalInfo(step)}</td>
    `;
    tbody.appendChild(row);
  });
}

function getAdditionalInfo(step) {
  const standardColumns = [
    'source_plate_name', 'source_plate_density', 'source_plate_row', 'source_plate_column',
    'target_plate_name', 'target_plate_density', 'target_plate_row', 'target_plate_column'
  ];

  return Object.entries(step)
    .filter(([key]) => !standardColumns.includes(key))
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
}

function highlightCurrentStepInTable() {
  const rows = protocolTable.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
      if (index === currentStep) {
          row.classList.add('current-step');
          tableContainer.scrollTop = row.offsetTop-20;
      } else {
          row.classList.remove('current-step');
      }
    //row.classList.toggle('current-step', index === currentStep);
  });
}
