let currentConfig = {
    directory: null,
    user: null,
    opportunities: [],
    notes: {},
    materials: {},
    responsibles: [], // Global list of responsibles
    crmUrlTemplate: '',
    currentStageFilter: null,
    currentAccountFilter: null,
    currentSearchQuery: '',
    accounts: {},
    dataStructure: [],
    accountUrlTemplate: '',
    collapsedAccounts: new Set()
};

let activeOppId = null;
let pendingNewDir = null;

console.log("Renderer: Inicializando script...");

// DOM Elements
const elements = {
    directoryScreen: document.getElementById('directory-screen'),
    formScreen: document.getElementById('form-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    migrationModal: document.getElementById('migration-modal'),
    materialsModal: document.getElementById('materials-modal'),
    notesModal: document.getElementById('notes-modal'),

    selectDirBtn: document.getElementById('select-dir-btn'),
    continueBtn: document.getElementById('continue-btn'),
    selectedPath: document.getElementById('selected-path'),
    userForm: document.getElementById('user-form'),
    backToDirBtn: document.getElementById('back-to-dir-btn'),
    csvInput: document.getElementById('csv-input'),
    oppListBody: document.getElementById('opp-list-body'),

    closeModalBtn: document.getElementById('close-modal-btn'),
    addNoteBtn: document.getElementById('add-note-btn'),
    newNoteInput: document.getElementById('new-note-input'),
    notesList: document.getElementById('notes-list'),

    pocsModal: document.getElementById('pocs-modal'),
    closePocsModalBtn: document.getElementById('close-pocs-modal-btn'),
    pocsModalOppInfo: document.getElementById('pocs-modal-opp-info'),
    addPocRowBtn: document.getElementById('add-poc-row-btn'),
    pocsListBody: document.getElementById('pocs-list-body'),

    pocDetailModal: document.getElementById('poc-detail-modal'),
    pocDetailTitle: document.getElementById('poc-detail-title'),
    closePocDetailModalBtn: document.getElementById('close-poc-detail-modal-btn'),
    pocDesc: document.getElementById('poc-desc'),
    pocStart: document.getElementById('poc-start'),
    pocOwner: document.getElementById('poc-owner'),
    pocUrlAcceptance: document.getElementById('poc-url-acceptance'),
    pocUrlContent: document.getElementById('poc-url-content'),
    savePocDetailBtn: document.getElementById('save-poc-detail-btn'),

    rfpModal: document.getElementById('rfp-modal'),
    closeRfpModalBtn: document.getElementById('close-rfp-modal-btn'),
    rfpUrl: document.getElementById('rfp-url'),
    rfpActivitiesBody: document.getElementById('rfp-activities-body'),
    addRfpActivityBtn: document.getElementById('add-rfp-activity-btn'),
    saveRfpBtn: document.getElementById('save-rfp-btn'),

    demoModal: document.getElementById('demo-modal'),
    closeDemoModalBtn: document.getElementById('close-demo-modal-btn'),
    demoDesc: document.getElementById('demo-desc'),
    demoUrl: document.getElementById('demo-url'),
    demoActivitiesBody: document.getElementById('demo-activities-body'),
    addDemoActivityBtn: document.getElementById('add-demo-activity-btn'),
    saveDemoBtn: document.getElementById('save-demo-btn'),
    // PoC Detail Activities
    pocActivitiesBody: document.getElementById('poc-activities-body'),
    addPocActivityBtn: document.getElementById('add-poc-activity-btn'),
    // Responsibles List
    responsiblesList: document.getElementById('responsibles-list'),

    detailsPocsBtn: document.getElementById('details-pocs-btn'),
    detailsRfpBtn: document.getElementById('details-rfp-btn'),
    detailsDemosBtn: document.getElementById('details-demos-btn'),

    yesMigrateBtn: document.getElementById('yes-migrate-btn'),
    noMigrateBtn: document.getElementById('no-migrate-btn'),
    successToast: document.getElementById('success-toast'),

    saveSettingsBtn: document.getElementById('save-settings-btn'),
    settingsPathDisplay: document.getElementById('settings-path-display'),
    stagesSubmenu: document.getElementById('stages-submenu'),
    allOppsBtn: document.getElementById('all-opps-btn'),
    changeDirBtn: document.getElementById('change-dir-btn'),
    crmUrlInput: document.getElementById('crm-url-template'),
    themeSelect: document.getElementById('theme-select'),
    historyWeek: document.getElementById('history-week'),
    historyMonth: document.getElementById('history-month'),
    historyYear: document.getElementById('history-year'),
    classificationSubmenu: document.getElementById('classification-submenu'),
    oppSearchInput: document.getElementById('opp-search-input'),
    structureBody: document.getElementById('structure-body'),
    addStructureRowBtn: document.getElementById('add-structure-row-btn'),
    saveStructureBtn: document.getElementById('save-structure-btn'),
    resetStructureBtn: document.getElementById('reset-structure-btn'),
    oppTableHead: document.getElementById('opp-table-head'),
    detailsModal: document.getElementById('details-modal'),
    detailsContent: document.getElementById('details-content'),
    detailsModalTitle: document.getElementById('details-modal-title'),
    closeDetailsBtn: document.getElementById('close-details-btn'),
    accountUrlInput: document.getElementById('account-url-template')
};

// Navigation
function showScreen(screenId) {
    console.log(`Renderer: Cambiando a pantalla ${screenId}`);
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(viewId).classList.add('active');
    document.querySelector(`[data-target="${viewId}"]`).classList.add('active');
}

// Window Controls Logic

// Keyboard Shortcuts
window.goToOpportunity = (oppId) => {
    currentConfig.currentStageFilter = null;
    currentConfig.currentAccountFilter = null;
    currentConfig.currentSearchQuery = oppId.toLowerCase();
    elements.oppSearchInput.value = oppId;

    renderOpportunities();
    updateStageSubmenu();
    updateClassificationSubmenu();
    showView('opp-list-view');
};

document.addEventListener('keydown', (e) => {
    // Ctrl+F -> Search
    if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        elements.oppSearchInput.focus();
        elements.oppSearchInput.select();
    }
    // Ctrl+H -> History
    if (e.ctrlKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        showView('notes-history-view');
        renderGlobalNotesHistory();
    }
    // Ctrl+T -> To-Do
    if (e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        showView('todo-view');
    }
    // F5 -> Refresh
    if (e.key === 'F5') {
        location.reload();
    }
});

// Sidebar Toggles
document.getElementById('stages-toggle').addEventListener('click', () => {
    const submenu = document.getElementById('stages-submenu');
    const toggle = document.getElementById('stages-toggle');
    submenu.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed');
});

document.getElementById('classification-toggle').addEventListener('click', () => {
    const submenu = document.getElementById('classification-submenu');
    const toggle = document.getElementById('classification-toggle');
    submenu.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed');
});

// Sidebar Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        if (target === 'opp-list-view' && btn.id === 'all-opps-btn') {
            currentConfig.currentStageFilter = null;
            currentConfig.currentAccountFilter = null;
            renderOpportunities();
            updateStageSubmenu();
            updateClassificationSubmenu();
        }
        if (target === 'notes-history-view') {
            renderGlobalNotesHistory();
        }
        if (target === 'settings-view') {
            renderStructureEditor();
        }
        showView(target);
    });
});

// Search Logic
elements.oppSearchInput.addEventListener('input', (e) => {
    currentConfig.currentSearchQuery = e.target.value.toLowerCase().trim();
    renderOpportunities();
});

function updateStageSubmenu() {
    elements.stagesSubmenu.innerHTML = '';
    const stages = [...new Set(currentConfig.opportunities.map(o => o['Stage']).filter(Boolean))].sort();

    stages.forEach(stage => {
        const btn = document.createElement('button');
        btn.className = `submenu-btn ${currentConfig.currentStageFilter === stage ? 'active' : ''}`;
        btn.textContent = stage;
        btn.onclick = () => {
            currentConfig.currentStageFilter = stage;
            currentConfig.currentAccountFilter = null; // Clear classification filter
            renderOpportunities();
            updateStageSubmenu();
            updateClassificationSubmenu();
            showView('opp-list-view');

            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            elements.allOppsBtn.classList.add('active');
        };
        elements.stagesSubmenu.appendChild(btn);
    });
}

function updateClassificationSubmenu() {
    elements.classificationSubmenu.innerHTML = '';
    const classes = ['Anchor Account', 'Key Account', 'Partner', 'Tactical Account'];

    classes.forEach(cls => {
        const btn = document.createElement('button');
        btn.className = `submenu-btn ${currentConfig.currentAccountFilter === cls ? 'active' : ''}`;
        btn.textContent = cls;
        btn.onclick = () => {
            currentConfig.currentAccountFilter = cls;
            currentConfig.currentStageFilter = null; // Clear stage filter
            renderOpportunities();
            updateStageSubmenu();
            updateClassificationSubmenu();
            showView('opp-list-view');

            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            elements.allOppsBtn.classList.add('active');
        };
        elements.classificationSubmenu.appendChild(btn);
    });
}

// App Initialization
async function init() {
    try {
        const settings = await window.electronAPI.getSettings();
        if (settings && settings.lastDirectory) {
            currentConfig.directory = settings.lastDirectory;
            currentConfig.crmUrlTemplate = settings.crmUrlTemplate || '';
            currentConfig.accountUrlTemplate = settings.accountUrlTemplate || '';
            const theme = settings.theme || 'auto';
            if (elements.crmUrlInput) elements.crmUrlInput.value = currentConfig.crmUrlTemplate;
            if (elements.accountUrlInput) elements.accountUrlInput.value = currentConfig.accountUrlTemplate;
            elements.settingsPathDisplay.textContent = currentConfig.directory;
            elements.themeSelect.value = theme;
            applyTheme(theme);

            currentConfig.responsibles = settings.responsibles || [];
            updateResponsiblesList();

            const loaded = await loadAllData(settings.lastDirectory);
            if (loaded && currentConfig.user) {
                updateSidebarInfo();
                updateStageSubmenu();
                updateClassificationSubmenu();
                // Initialize collapsed accounts (all collapsed by default)
                currentConfig.collapsedAccounts = new Set();
                currentConfig.opportunities.forEach(opp => {
                    const accId = opp['Account ID'];
                    if (accId) currentConfig.collapsedAccounts.add(accId);
                });

                renderOpportunities();
                renderStructureEditor();
                showScreen('dashboard-screen');
            } else if (loaded) {
                showScreen('form-screen');
            }
        }
    } catch (error) {
        console.error("Renderer: Error en init:", error);
    }
}

async function loadAllData(dir) {
    try {
        const userData = await window.electronAPI.loadFile(dir, 'config.json');
        currentConfig.user = userData || {};

        // Sync templates from config.json if they exist
        if (userData) {
            if (userData.crmUrlTemplate) currentConfig.crmUrlTemplate = userData.crmUrlTemplate;
            if (userData.accountUrlTemplate) currentConfig.accountUrlTemplate = userData.accountUrlTemplate;
            if (elements.crmUrlInput) elements.crmUrlInput.value = currentConfig.crmUrlTemplate;
            if (elements.accountUrlInput) elements.accountUrlInput.value = currentConfig.accountUrlTemplate;
        }

        const opps = await window.electronAPI.loadFile(dir, 'opportunities.json');
        currentConfig.opportunities = opps || [];

        const notes = await window.electronAPI.loadFile(dir, 'notes.json');
        currentConfig.notes = notes || {};

        const materials = await window.electronAPI.loadFile(dir, 'materials.json');
        currentConfig.materials = materials || {};

        const accounts = await window.electronAPI.loadFile(dir, 'accounts.json');
        currentConfig.accounts = accounts || {};

        const structure = await window.electronAPI.loadFile(dir, 'structure.json');
        if (structure) {
            currentConfig.dataStructure = structure;
        } else {
            // Default structure with visibility
            currentConfig.dataStructure = [
                { header: "Account Name", dummy: "Ejemplo Cuenta", visible: true },
                { header: "Account ID", dummy: "ACC-456", visible: true },
                { header: "Opportunity Name", dummy: "Mi Gran Oportunidad", visible: true },
                { header: "Sales Organization", dummy: "LATAM", visible: false },
                { header: "Lead Solution Architect", dummy: "Juan Perez", visible: false },
                { header: "Opportunity ID", dummy: "OPP-123", visible: true },
                { header: "Amount Currency", dummy: "USD", visible: false },
                { header: "Amount", dummy: "50000", visible: true },
                { header: "Close Date", dummy: "2026-12-31", visible: false },
                { header: "Stage", dummy: "Qualified", visible: true },
                { header: "Created Date", dummy: "2026-02-05", visible: false },
                { header: "Sales Bookings Currency", dummy: "USD", visible: false },
                { header: "Sales Bookings", dummy: "50000", visible: false },
                { header: "Primary Contact", dummy: "Maria Gomez", visible: false },
                { header: "Industry", dummy: "Finance", visible: false }
            ];
        }

        return true;
    } catch (e) {
        console.warn("Renderer: Error cargando archivos:", e);
        return true;
    }
}

// Directory Selection
elements.selectDirBtn.addEventListener('click', async () => {
    const dir = await window.electronAPI.selectDirectory();
    if (dir) handleNewDirectory(dir);
});

elements.changeDirBtn.addEventListener('click', async () => {
    const dir = await window.electronAPI.selectDirectory();
    if (dir && dir !== currentConfig.directory) {
        pendingNewDir = dir;
        elements.migrationModal.classList.remove('hidden');
    }
});

async function handleNewDirectory(dir) {
    currentConfig.directory = dir;
    elements.settingsPathDisplay.textContent = dir;
    await window.electronAPI.saveSettings({
        lastDirectory: dir,
        crmUrlTemplate: currentConfig.crmUrlTemplate,
        accountUrlTemplate: currentConfig.accountUrlTemplate,
        theme: elements.themeSelect.value
    });

    elements.selectedPath.textContent = dir;
    elements.selectedPath.style.display = 'block';
    elements.continueBtn.classList.remove('hidden');

    await loadAllData(dir);
    if (currentConfig.user) fillUserForm(currentConfig.user);
}

// Migration
elements.yesMigrateBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.migrateFiles(currentConfig.directory, pendingNewDir);
    if (result.success) showToast(`Migrados ${result.count} archivos`);
    finalizeDirChange();
});

elements.noMigrateBtn.addEventListener('click', finalizeDirChange);

async function finalizeDirChange() {
    currentConfig.directory = pendingNewDir;
    elements.settingsPathDisplay.textContent = pendingNewDir;
    await window.electronAPI.saveSettings({
        lastDirectory: pendingNewDir,
        crmUrlTemplate: currentConfig.crmUrlTemplate,
        accountUrlTemplate: currentConfig.accountUrlTemplate
    });
    elements.migrationModal.classList.add('hidden');

    const loaded = await loadAllData(pendingNewDir);
    if (loaded && currentConfig.user) {
        updateSidebarInfo();
        renderOpportunities();
        showScreen('dashboard-screen');
        showView('opp-list-view');
    } else {
        showScreen('form-screen');
    }
}

// Settings Saving
elements.saveSettingsBtn.addEventListener('click', async () => {
    currentConfig.crmUrlTemplate = elements.crmUrlInput.value.trim();
    currentConfig.accountUrlTemplate = elements.accountUrlInput.value.trim();
    const theme = elements.themeSelect.value;
    applyTheme(theme);
    await window.electronAPI.saveSettings({
        lastDirectory: currentConfig.directory,
        crmUrlTemplate: currentConfig.crmUrlTemplate,
        accountUrlTemplate: currentConfig.accountUrlTemplate,
        theme: theme
    });
    renderOpportunities();
    showToast('Ajustes guardados');
});

function applyTheme(theme) {
    if (theme === 'auto') {
        document.body.removeAttribute('data-theme');
    } else {
        document.body.setAttribute('data-theme', theme);
    }
}

// Sample CSV Download
function downloadSampleCSV() {
    const headers = currentConfig.dataStructure.map(s => s.header);
    const exampleValue = currentConfig.dataStructure.map(s => s.dummy);

    const csvContent = [
        headers.join(","),
        exampleValue.map(v => `"${v}"`).join(",")
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_opportunities.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Descargando plantilla...');
}

const downloadSampleBtn = document.getElementById('download-sample-btn');
if (downloadSampleBtn) {
    downloadSampleBtn.addEventListener('click', downloadSampleCSV);
}

// Navigation Helpers
elements.continueBtn.addEventListener('click', () => showScreen('form-screen'));
elements.backToDirBtn.addEventListener('click', () => showScreen('directory-screen'));

elements.closeDetailsBtn.addEventListener('click', () => {
    elements.detailsModal.classList.add('hidden');
});

// User Form
elements.userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        company: document.getElementById('company').value,
        crmUrlTemplate: elements.crmUrlInput?.value || '',
        accountUrlTemplate: elements.accountUrlInput?.value || '',
        updatedAt: new Date().toISOString()
    };
    await window.electronAPI.saveFile(currentConfig.directory, 'config.json', userData);
    currentConfig.user = userData;
    currentConfig.crmUrlTemplate = userData.crmUrlTemplate;
    currentConfig.accountUrlTemplate = userData.accountUrlTemplate;
    updateSidebarInfo();
    renderOpportunities();
    showScreen('dashboard-screen');
});

function fillUserForm(data) {
    document.getElementById('name').value = data.name || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('company').value = data.company || '';
    if (elements.crmUrlInput) elements.crmUrlInput.value = data.crmUrlTemplate || '';
    if (elements.accountUrlInput) elements.accountUrlInput.value = data.accountUrlTemplate || '';
}

function updateSidebarInfo() {
    document.getElementById('display-name').textContent = currentConfig.user.name;
    document.getElementById('display-company').textContent = currentConfig.user.company;
}

// CRM Link Helper
function getOpportunityUrl(opp) {
    if (!currentConfig.crmUrlTemplate) return null;
    return applyTemplate(currentConfig.crmUrlTemplate, opp);
}

function getAccountUrl(opp) {
    if (!currentConfig.accountUrlTemplate) return null;
    return applyTemplate(currentConfig.accountUrlTemplate, opp);
}

function applyTemplate(template, opp) {
    let url = template;
    Object.keys(opp).forEach(key => {
        // Safe regex escape for the key and case-insensitive matching
        const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\{${safeKey}\\}`, 'gi');
        url = url.replace(regex, opp[key]);
    });
    return url;
}

function applyFormula(template, opp) {
    let result = template;
    currentConfig.dataStructure.forEach(item => {
        const key = item.header;
        const val = opp[key] || '';
        const formatted = formatValue(val, item.type, opp);

        // Safe regex escape for the key and case-insensitive matching
        const safeKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\{${safeKey}\\}`, 'gi');
        result = result.replace(regex, formatted);
    });
    return result;
}

function createLinkIfPossible(text, opp, type = 'opportunity') {
    const url = type === 'account' ? getAccountUrl(opp) : getOpportunityUrl(opp);
    if (url) {
        return `<a href="#" class="dynamic-link" onclick="handleExternalLink(event, '${url}')">${text}</a>`;
    }
    return text;
}

window.handleExternalLink = (e, url) => {
    e.preventDefault();
    window.electronAPI.openExternalUrl(url);
};

// CSV Logic
elements.csvInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await window.electronAPI.copyFileToDir(file.path, currentConfig.directory);
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const newData = results.data;
                newData.forEach(newItem => {
                    const oppId = newItem['Opportunity ID'];
                    if (!oppId) return;

                    const existingIndex = currentConfig.opportunities.findIndex(o => o['Opportunity ID'] === oppId);
                    if (existingIndex > -1) {
                        currentConfig.opportunities[existingIndex] = {
                            ...currentConfig.opportunities[existingIndex],
                            ...newItem
                        };
                    } else {
                        currentConfig.opportunities.push(newItem);
                    }
                });

                await window.electronAPI.saveFile(currentConfig.directory, 'opportunities.json', currentConfig.opportunities);
                updateStageSubmenu();
                renderOpportunities();
                showToast('CSV importado (ISO-8859-1)');
            }
        });
    };
    reader.readAsText(file, "ISO-8859-1");
});




// Data Structure Logic
function renderStructureEditor() {
    elements.structureBody.innerHTML = '';
    currentConfig.dataStructure.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" value="${item.header}" class="struct-header" data-index="${index}"></td>
            <td><input type="text" value="${item.dummy}" class="struct-dummy" data-index="${index}"></td>
            <td>
                <select class="struct-type" data-index="${index}" onchange="currentConfig.dataStructure[${index}].type = this.value; renderStructureEditor();">
                    <option value="string" ${item.type === 'string' ? 'selected' : ''}>Texto</option>
                    <option value="number" ${item.type === 'number' ? 'selected' : ''}>Número</option>
                    <option value="currency" ${item.type === 'currency' ? 'selected' : ''}>Moneda</option>
                    <option value="bool" ${item.type === 'bool' ? 'selected' : ''}>Booleano</option>
                    <option value="formula" ${item.type === 'formula' ? 'selected' : ''}>Fórmula</option>
                </select>
            </td>
            <td>
                ${item.type === 'formula' ?
                `<input type="text" value="${item.formula || ''}" class="struct-formula" placeholder="{Var1} {Var2}" data-index="${index}" onchange="currentConfig.dataStructure[${index}].formula = this.value">` :
                ''}
            </td>
            <td style="text-align: center;"><input type="checkbox" class="struct-visible" ${item.visible ? 'checked' : ''} data-index="${index}" onchange="currentConfig.dataStructure[${index}].visible = this.checked"></td>
            <td style="text-align: right;"><button class="delete-row-btn" data-index="${index}">&times;</button></td>
        `;
        elements.structureBody.appendChild(tr);
    });

    // Add delete listeners
    elements.structureBody.querySelectorAll('.delete-row-btn').forEach(btn => {
        btn.onclick = () => {
            const index = parseInt(btn.dataset.index);
            currentConfig.dataStructure.splice(index, 1);
            renderStructureEditor();
        };
    });
}

elements.addStructureRowBtn.addEventListener('click', () => {
    currentConfig.dataStructure.push({ header: '', dummy: '', visible: true });
    renderStructureEditor();
});

elements.saveStructureBtn.addEventListener('click', async () => {
    const headers = document.querySelectorAll('.struct-header');
    const dummies = document.querySelectorAll('.struct-dummy');
    const types = document.querySelectorAll('.struct-type');
    const formulas = document.querySelectorAll('.struct-formula');
    const visibilities = document.querySelectorAll('.struct-visible');

    const newStructure = [];
    headers.forEach((h, i) => {
        if (h.value.trim()) {
            const rowIdx = h.getAttribute('data-index');
            // Find formula input for this index if it exists
            const formulaInput = Array.from(formulas).find(f => f.getAttribute('data-index') === rowIdx);

            newStructure.push({
                header: h.value.trim(),
                dummy: dummies[i].value.trim(),
                type: types[i].value,
                formula: formulaInput ? formulaInput.value.trim() : '',
                visible: visibilities[i].checked
            });
        }
    });

    currentConfig.dataStructure = newStructure;
    await window.electronAPI.saveFile(currentConfig.directory, 'structure.json', newStructure);
    showToast('Estructura de datos guardada');
    renderOpportunities();
});

const STANDARD_STRUCTURE = [
    { header: "Account Name", dummy: "Ejemplo Cuenta", visible: true, type: 'string' },
    { header: "Account ID", dummy: "ACC-456", visible: true, type: 'string' },
    { header: "Opportunity Name", dummy: "Mi Gran Oportunidad", visible: true, type: 'string' },
    { header: "Sales Organization", dummy: "LATAM", visible: false, type: 'string' },
    { header: "Lead Solution Architect", dummy: "Juan Perez", visible: false, type: 'string' },
    { header: "Opportunity ID", dummy: "OPP-123", visible: true, type: 'string' },
    { header: "Amount Currency", dummy: "USD", visible: false, type: 'string' },
    { header: "Amount", dummy: "50000", visible: true, type: 'currency' },
    { header: "Close Date", dummy: "2026-12-31", visible: false, type: 'string' },
    { header: "Stage", dummy: "Qualified", visible: true, type: 'string' },
    { header: "Created Date", dummy: "2026-02-05", visible: false, type: 'string' },
    { header: "Sales Bookings Currency", dummy: "USD", visible: false, type: 'string' },
    { header: "Sales Bookings", dummy: "50000", visible: false, type: 'currency' },
    { header: "Primary Contact", dummy: "Maria Gomez", visible: false, type: 'string' },
    { header: "Industry", dummy: "Finance", visible: false, type: 'string' }
];

function formatValue(value, type, opp) {
    if (value === null || value === undefined || value === '—') return '—';

    // Clean string values for number conversion
    const cleanValue = String(value).replace(/[$,]/g, '');
    const num = parseFloat(cleanValue);

    if (type === 'number' && !isNaN(num)) {
        return new Intl.NumberFormat('es-MX').format(num);
    }

    if (type === 'currency' && !isNaN(num)) {
        const formatted = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(num);

        const currency = opp['Amount Currency'] || opp['Sales Bookings Currency'] || 'USD';
        return `${formatted} ${currency}`;
    }

    if (type === 'bool') {
        const val = String(value).toLowerCase().trim();
        if (val === 'true' || val === '1' || val === 'sí' || val === 'si' || val === 's' || val === 'yes' || val === 'y') {
            return 'SÍ';
        }
        return 'NO';
    }

    if (type === 'formula') {
        // Find the full structure item to get the formula template
        const structItem = currentConfig.dataStructure.find(s => s.header === value || s.formula);
        // In formula mode, the "value" passed might be the header or empty, 
        // but we actually need the template from the config.
        // We resolve it in the rendering loops instead for better accuracy.
        return value;
    }

    return value;
}

elements.resetStructureBtn.addEventListener('click', async () => {
    if (confirm('¿Estás seguro de que deseas restablecer la estructura a los 15 campos estándar? Se perderán tus cambios personalizados no guardados.')) {
        currentConfig.dataStructure = JSON.parse(JSON.stringify(STANDARD_STRUCTURE));
        renderStructureEditor();
        showToast('Estructura estándar aplicada (pulsa Guardar para confirmar)');
    }
});

function renderGlobalNotesHistory() {
    elements.historyWeek.innerHTML = '';
    elements.historyMonth.innerHTML = '';
    elements.historyYear.innerHTML = '';

    const allItems = [];

    // Collect Notes
    for (const oppId in currentConfig.notes) {
        const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
        const name = opp ? opp['Opportunity Name'] : 'Oportunidad Desconocida';
        const account = opp ? opp['Account Name'] : 'Sin Cuenta';

        currentConfig.notes[oppId].forEach(note => {
            allItems.push({
                ...note,
                type: 'note',
                oppId,
                oppName: name,
                accountName: account
            });
        });
    }

    // Collect Activities
    for (const oppId in currentConfig.materials) {
        const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
        const name = opp ? opp['Opportunity Name'] : 'Oportunidad Desconocida';
        const account = opp ? opp['Account Name'] : 'Sin Cuenta';
        const mat = currentConfig.materials[oppId];

        // PoC Activities
        if (mat.pocs) {
            mat.pocs.forEach(poc => {
                if (poc.activities) {
                    poc.activities.forEach(act => {
                        allItems.push({
                            text: `${act.activity} (Resp: ${act.responsible}) - ${act.comments}`,
                            date: act.date,
                            type: 'poc',
                            oppId,
                            oppName: name,
                            accountName: account
                        });
                    });
                }
            });
        }

        // RFP Activities
        if (mat.rfp && mat.rfp.activities) {
            mat.rfp.activities.forEach(act => {
                allItems.push({
                    text: `${act.activity} (Resp: ${act.responsible}) - ${act.comments}`,
                    date: act.date,
                    type: 'rfp',
                    oppId,
                    oppName: name,
                    accountName: account
                });
            });
        }

        // Demo Activities
        if (mat.demo && mat.demo.activities) {
            mat.demo.activities.forEach(act => {
                allItems.push({
                    text: `${act.activity} (Resp: ${act.responsible}) - ${act.comments}`,
                    date: act.date,
                    type: 'demo',
                    oppId,
                    oppName: name,
                    accountName: account
                });
            });
        }
    }

    // Sort descending
    allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    const now = new Date();
    const msWeek = 7 * 24 * 60 * 60 * 1000;
    const msMonth = 30 * 24 * 60 * 60 * 1000;
    const msYear = 365 * 24 * 60 * 60 * 1000;

    const getTypeLabel = (type) => {
        switch (type) {
            case 'note': return { label: 'Nota', class: 'badge-note' };
            case 'poc': return { label: 'PoC', class: 'badge-poc' };
            case 'rfp': return { label: 'RFP', class: 'badge-rfp' };
            case 'demo': return { label: 'Demo', class: 'badge-demo' };
            default: return { label: 'Item', class: 'badge-note' };
        }
    };

    allItems.forEach(item => {
        const itemDate = new Date(item.date);
        const diff = now - itemDate;
        const typeInfo = getTypeLabel(item.type);

        const card = document.createElement('div');
        card.className = 'history-card card';
        card.innerHTML = `
            <div class="history-card-header">
                <strong class="opp-link" onclick="goToOpportunity('${item.oppId}')">${item.oppName}</strong>
                <span class="sub-text">${item.accountName}</span>
            </div>
            <div class="history-card-body">
                <span class="note-type-badge ${typeInfo.class}">${typeInfo.label}</span>
                <p style="margin-top: 0.5rem;">${item.text}</p>
            </div>
            <div class="history-card-footer">
                <span class="note-stage-badge">${item.stage || ''}</span>
                <span class="sub-text">${itemDate.toLocaleDateString()}</span>
            </div>
        `;

        if (diff < msWeek) {
            elements.historyWeek.appendChild(card);
        } else if (diff < msMonth) {
            elements.historyMonth.appendChild(card);
        } else if (diff < msYear) {
            elements.historyYear.appendChild(card);
        }
    });

    if (!elements.historyWeek.children.length) elements.historyWeek.innerHTML = '<p class="sub-text" style="padding: 1rem;">No hay actividad esta semana.</p>';
    if (!elements.historyMonth.children.length) elements.historyMonth.innerHTML = '<p class="sub-text" style="padding: 1rem;">No hay actividad este mes.</p>';
    if (!elements.historyYear.children.length) elements.historyYear.innerHTML = '<p class="sub-text" style="padding: 1rem;">No hay actividad este año.</p>';
}

function renderOpportunities() {
    elements.oppListBody.innerHTML = '';
    elements.oppTableHead.innerHTML = '';

    const visibleCols = currentConfig.dataStructure.filter(s => s.visible);

    // 1. Render Table Head
    const headTr = document.createElement('tr');
    visibleCols.forEach((col, index) => {
        const th = document.createElement('th');
        th.textContent = col.header;
        th.draggable = true;
        th.dataset.index = index;

        // Drag events
        th.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', index);
            th.classList.add('dragging');
        };
        th.ondragend = () => th.classList.remove('dragging');
        th.ondragover = (e) => {
            e.preventDefault();
            th.classList.add('drag-over');
        };
        th.ondragleave = () => th.classList.remove('drag-over');
        th.ondrop = async (e) => {
            e.preventDefault();
            th.classList.remove('drag-over');
            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
            const toIndex = index;

            if (fromIndex !== toIndex) {
                // Reorder in currentConfig.dataStructure
                const visibleHeaders = visibleCols.map(c => c.header);
                const fromHeader = visibleHeaders[fromIndex];
                const toHeader = visibleHeaders[toIndex];

                const fullFromIdx = currentConfig.dataStructure.findIndex(s => s.header === fromHeader);
                const fullToIdx = currentConfig.dataStructure.findIndex(s => s.header === toHeader);

                const [moved] = currentConfig.dataStructure.splice(fullFromIdx, 1);
                currentConfig.dataStructure.splice(fullToIdx, 0, moved);

                await window.electronAPI.saveFile(currentConfig.directory, 'structure.json', currentConfig.dataStructure);
                renderOpportunities();
                showToast('Orden de columnas actualizado');
            }
        };

        headTr.appendChild(th);
    });
    const actionsTh = document.createElement('th');
    actionsTh.textContent = 'Acciones';
    headTr.appendChild(actionsTh);
    elements.oppTableHead.appendChild(headTr);

    let filteredOpps = currentConfig.opportunities;

    // Phase 1: Sidebar Filters
    if (currentConfig.currentStageFilter) {
        filteredOpps = filteredOpps.filter(o => o['Stage'] === currentConfig.currentStageFilter);
    } else if (currentConfig.currentAccountFilter) {
        filteredOpps = filteredOpps.filter(o => {
            const accId = o['Account ID'];
            return currentConfig.accounts[accId] && currentConfig.accounts[accId].category === currentConfig.currentAccountFilter;
        });
    }

    // Phase 2: Search Filter
    if (currentConfig.currentSearchQuery) {
        filteredOpps = filteredOpps.filter(o => {
            const name = (o['Opportunity Name'] || '').toLowerCase();
            const account = (o['Account Name'] || '').toLowerCase();
            const id = (o['Opportunity ID'] || '').toLowerCase();
            const q = currentConfig.currentSearchQuery;
            return name.includes(q) || account.includes(q) || id.includes(q);
        });
    }

    let title = 'Oportunidades';
    if (currentConfig.currentStageFilter) title = `Oportunidades: ${currentConfig.currentStageFilter}`;
    else if (currentConfig.currentAccountFilter) title = `Cuentas: ${currentConfig.currentAccountFilter}`;

    const titleEl = document.querySelector('#opp-list-view h2');
    if (titleEl) titleEl.textContent = title;

    // Group filtered opportunities by Account ID
    const groups = filteredOpps.reduce((acc, opp) => {
        const accountId = opp['Account ID'] || 'Sin Account ID';
        if (!acc[accountId]) acc[accountId] = [];
        acc[accountId].push(opp);
        return acc;
    }, {});

    Object.keys(groups).forEach(accountId => {
        const group = groups[accountId];
        const accountName = group[0]['Account Name'] || 'Sin Nombre de Cuenta';

        // Render Account Header Row
        const headerTr = document.createElement('tr');
        headerTr.className = `account-header ${currentConfig.collapsedAccounts.has(accountId) ? 'collapsed' : ''}`;

        const currentCategory = currentConfig.accounts[accountId]?.category || '';
        const options = ['', 'Anchor Account', 'Key Account', 'Partner', 'Tactical Account'];

        headerTr.innerHTML = `
            <td colspan="${visibleCols.length + 1}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="display: flex; align-items: center;">
                        <span class="toggle-icon">▾</span>
                        🏢 ${accountName} <span class="sub-text" style="margin-left: 0.5rem;">(${accountId})</span>
                    </span>
                    <select class="account-category-select" data-account-id="${accountId}" onclick="event.stopPropagation()">
                        <option value="" disabled ${!currentCategory ? 'selected' : ''}>Categorizar cuenta...</option>
                        ${options.filter(o => o).map(opt => `<option value="${opt}" ${currentCategory === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>
                </div>
            </td>
        `;

        // Toggle Account Collapse
        headerTr.onclick = () => {
            if (currentConfig.collapsedAccounts.has(accountId)) {
                currentConfig.collapsedAccounts.delete(accountId);
            } else {
                currentConfig.collapsedAccounts.add(accountId);
            }
            renderOpportunities();
        };

        const select = headerTr.querySelector('select');
        select.onchange = async (e) => {
            const newCategory = e.target.value;
            currentConfig.accounts[accountId] = {
                category: newCategory,
                lastUpdated: new Date().toISOString()
            };
            await window.electronAPI.saveFile(currentConfig.directory, 'accounts.json', currentConfig.accounts);
            showToast(`Cuenta ${accountId} marcada como ${newCategory}`);
            renderOpportunities();
        };

        elements.oppListBody.appendChild(headerTr);

        // Render each opportunity in the group if not collapsed
        if (!currentConfig.collapsedAccounts.has(accountId)) {
            group.forEach(opp => {
                const tr = document.createElement('tr');
                tr.className = 'clickable';
                const oppId = opp['Opportunity ID'];

                // Open details on row click
                tr.onclick = () => openDetails(oppId);

                // Build columns dynamically
                let colsHtml = '';
                visibleCols.forEach(col => {
                    let cellValue = opp[col.header] || '';

                    // Formula Logic
                    if (col.type === 'formula' && col.formula) {
                        cellValue = applyFormula(col.formula, opp);
                    }

                    const formatted = formatValue(cellValue, col.type, opp);

                    // Specific logic for certain columns
                    if (col.header === 'Opportunity ID') {
                        colsHtml += `<td style="padding-left: 2rem;">• ${formatted}</td>`;
                    } else if (col.header === 'Opportunity Name') {
                        colsHtml += `<td>${formatted || 'Sin Nombre'}</td>`;
                    } else {
                        colsHtml += `<td>${formatted}</td>`;
                    }
                });

                tr.innerHTML = `
                ${colsHtml}
                <td>
                    <div style="display: flex; gap: 0.5rem;" onclick="event.stopPropagation()">
                        <button class="primary-btn small" onclick="openNotes('${oppId}')">Notas</button>
                        <button class="secondary-btn small" onclick="openPocs('${oppId}')">PoCs</button>
                        <button class="secondary-btn small" onclick="openRfp('${oppId}')">RFPs</button>
                        <button class="secondary-btn small" onclick="openDemo('${oppId}')">Demos</button>
                    </div>
                </td>
            `;
                elements.oppListBody.appendChild(tr);
            });
        }
    });
}

// Opportunity Details
window.openDetails = (oppId) => {
    activeOppId = oppId;
    const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
    if (!opp) return;

    elements.detailsModalTitle.textContent = `Detalles: ${opp['Opportunity Name'] || oppId}`;
    elements.detailsContent.innerHTML = '';

    // Sort keys alphabetically but prioritize Name/ID/Account
    const keys = Object.keys(opp).sort((a, b) => {
        const ua = a.toUpperCase();
        const ub = b.toUpperCase();
        if (ua === 'OPPORTUNITY NAME' || ua === 'OPPORTUNITY ID' || ua === 'ACCOUNT ID') return -1;
        if (ub === 'OPPORTUNITY NAME' || ub === 'OPPORTUNITY ID' || ub === 'ACCOUNT ID') return 1;
        return a.localeCompare(b);
    });

    keys.forEach(key => {
        const item = document.createElement('div');
        item.className = 'details-item';

        // Resolve type from dataStructure if available
        const configItem = currentConfig.dataStructure.find(s => s.header === key);
        const type = configItem ? configItem.type : 'string';

        let value = opp[key] || '—';
        let formattedValue = formatValue(value, type, opp);

        // Apply link logic in details modal (Case-insensitive matching)
        const upperKey = key.toUpperCase();
        if (upperKey === 'OPPORTUNITY ID' || upperKey === 'OPPORTUNITY NAME') {
            formattedValue = createLinkIfPossible(formattedValue, opp, 'opportunity');
        } else if (upperKey === 'ACCOUNT ID' || upperKey === 'ACCOUNT NAME') {
            formattedValue = createLinkIfPossible(formattedValue, opp, 'account');
        }

        item.innerHTML = `
            <span class="details-label">${key}</span>
            <span class="details-value">${formattedValue}</span>
        `;
        elements.detailsContent.appendChild(item);
    });

    // Setup materials buttons in modal (Removed - Buttons moved to table)

    elements.detailsModal.classList.remove('hidden');
};

// Notes
window.openNotes = (oppId) => {
    activeOppId = oppId;
    const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
    if (!opp) return;
    document.getElementById('modal-opp-name').textContent = opp['Opportunity Name'];
    document.getElementById('modal-opp-id').innerHTML = createLinkIfPossible(oppId, opp);
    document.getElementById('modal-opp-account').textContent = opp['Account Name'];
    renderNotes();
    elements.notesModal.classList.remove('hidden');
};

function renderNotes() {
    elements.notesList.innerHTML = '';
    const history = currentConfig.notes[activeOppId] || [];
    if (history.length === 0) {
        elements.notesList.innerHTML = '<p class="sub-text">No hay notas registradas.</p>';
    } else {
        history.forEach(note => {
            const div = document.createElement('div');
            div.className = 'note-item';
            const stageBadge = note.stage ? `<span class="note-stage-badge">${note.stage}</span>` : '';
            div.innerHTML = `
                <div class="note-meta">
                    <span class="note-date">${new Date(note.date).toLocaleString()}</span>
                    ${stageBadge}
                </div>
                <div class="note-text">${note.text}</div>
            `;
            elements.notesList.appendChild(div);
        });
    }
    elements.notesList.scrollTop = elements.notesList.scrollHeight;
}

elements.addNoteBtn.addEventListener('click', async () => {
    const text = elements.newNoteInput.value.trim();
    if (!text) return;

    const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === activeOppId);
    const currentStage = opp ? opp['Stage'] : 'N/A';

    if (!currentConfig.notes[activeOppId]) currentConfig.notes[activeOppId] = [];
    currentConfig.notes[activeOppId].push({
        date: new Date().toISOString(),
        text,
        stage: currentStage
    });

    await window.electronAPI.saveFile(currentConfig.directory, 'notes.json', currentConfig.notes);
    elements.newNoteInput.value = '';
    renderNotes();
});


elements.closeModalBtn.addEventListener('click', () => elements.notesModal.classList.add('hidden'));

// Materials
// PoCs Logic
let activePocIndex = null;

window.openPocs = (oppId) => {
    activeOppId = oppId;
    const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
    if (!opp) return;

    elements.pocsModalOppInfo.textContent = `${opp['Opportunity Name']} (${oppId})`;
    renderPocsList();
    elements.pocsModal.classList.remove('hidden');
};

function renderPocsList() {
    elements.pocsListBody.innerHTML = '';
    const mat = currentConfig.materials[activeOppId] || {};
    const pocs = mat.pocs || [];

    pocs.forEach((poc, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${poc.description || 'Sin descripción'}</td>
            <td>${poc.startDate || '-'}</td>
            <td>${poc.clientResponsible || '-'}</td>
            <td style="text-align: right;">
                <button class="text-btn" onclick="editPoc(${index})" style="color: var(--brand-orange);">Editar</button>
                <button class="text-btn" onclick="deletePoc(${index})" style="color: #ff4d4d; margin-left: 0.5rem;">Borrar</button>
            </td>
        `;
        elements.pocsListBody.appendChild(tr);
    });
}

window.editPoc = (index) => {
    activePocIndex = index;
    const mat = currentConfig.materials[activeOppId] || {};
    const poc = mat.pocs[index];

    elements.pocDetailTitle.textContent = "Editar Prueba de Concepto";
    elements.pocDesc.value = poc.description || '';
    elements.pocStart.value = poc.startDate || '';
    elements.pocOwner.value = poc.clientResponsible || '';
    elements.pocUrlAcceptance.value = poc.acceptanceUrl || '';
    elements.pocUrlContent.value = poc.contentUrl || '';

    // Trigger previews
    elements.pocUrlAcceptance.resetToPreview();
    elements.pocUrlContent.resetToPreview();

    renderPocActivities(poc.activities || []);

    elements.pocDetailModal.classList.remove('hidden');
};

window.deletePoc = async (index) => {
    if (!confirm('¿Seguro que deseas eliminar esta PoC?')) return;
    currentConfig.materials[activeOppId].pocs.splice(index, 1);
    await window.electronAPI.saveFile(currentConfig.directory, 'materials.json', currentConfig.materials);
    renderPocsList();
};

elements.addPocRowBtn.onclick = () => {
    activePocIndex = null;
    elements.pocDetailTitle.textContent = "Nueva Prueba de Concepto";
    elements.pocDesc.value = '';
    elements.pocStart.value = '';
    elements.pocOwner.value = '';
    elements.pocUrlAcceptance.value = '';
    elements.pocUrlContent.value = '';

    // Reset previews to input mode
    elements.pocUrlAcceptance.classList.remove('hidden');
    document.getElementById('poc-url-acceptance-preview').classList.add('hidden');
    elements.pocUrlContent.classList.remove('hidden');
    document.getElementById('poc-url-content-preview').classList.add('hidden');

    renderPocActivities([]);

    elements.pocDetailModal.classList.remove('hidden');
};

elements.savePocDetailBtn.onclick = async () => {
    const activities = [];
    elements.pocActivitiesBody.querySelectorAll('.activity-row-grid').forEach((grid, index) => {
        const resp = grid.querySelector('.resp').value;
        saveResponsible(resp);
        const pocs = currentConfig.materials[activeOppId]?.pocs || [];
        const existingAct = (activePocIndex !== null && pocs[activePocIndex]?.activities) ? pocs[activePocIndex].activities[index] : null;

        activities.push({
            activity: grid.querySelector('.act').value,
            responsible: resp,
            comments: grid.querySelector('.comm').value,
            date: existingAct?.date || new Date().toISOString()
        });
    });

    const pocData = {
        description: elements.pocDesc.value,
        startDate: elements.pocStart.value,
        clientResponsible: elements.pocOwner.value, // NOTE: Client responsible NOT saved to global list
        acceptanceUrl: elements.pocUrlAcceptance.value,
        contentUrl: elements.pocUrlContent.value,
        activities
    };

    if (!currentConfig.materials[activeOppId]) currentConfig.materials[activeOppId] = {};
    if (!currentConfig.materials[activeOppId].pocs) currentConfig.materials[activeOppId].pocs = [];

    if (activePocIndex !== null) {
        currentConfig.materials[activeOppId].pocs[activePocIndex] = pocData;
    } else {
        currentConfig.materials[activeOppId].pocs.push(pocData);
    }

    await window.electronAPI.saveFile(currentConfig.directory, 'materials.json', currentConfig.materials);
    showToast('PoC guardada');
    elements.pocDetailModal.classList.add('hidden');
    renderPocsList();
};

// RFPs/RFIs Logic
window.openRfp = (oppId) => {
    activeOppId = oppId;
    const mat = currentConfig.materials[oppId] || {};
    const rfp = mat.rfp || { url: '', activities: [] };

    elements.rfpUrl.value = rfp.url || '';
    renderRfpActivities(rfp.activities || []);

    // Trigger preview
    elements.rfpUrl.resetToPreview();

    elements.rfpModal.classList.remove('hidden');
};

function renderActivityInputs(activities, container, removeFnName) {
    container.innerHTML = '';
    activities.forEach((act, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="3">
                <div class="activity-row-grid">
                    <div class="activity-data-col">
                        <input type="text" class="activity-input act" placeholder="Actividad" value="${act.activity || ''}" data-index="${index}">
                        <input type="text" class="activity-input resp" placeholder="Responsable" list="responsibles-list" value="${act.responsible || ''}" data-index="${index}">
                    </div>
                    <textarea class="activity-input comm" placeholder="Comentarios..." rows="3" data-index="${index}">${act.comments || ''}</textarea>
                    <button class="delete-row-btn" style="margin-top: 0.5rem;" onclick="${removeFnName}(${index})">&times;</button>
                </div>
            </td>
        `;
        container.appendChild(tr);
    });
}

function renderRfpActivities(activities) {
    renderActivityInputs(activities, elements.rfpActivitiesBody, 'removeRfpActivity');
}

elements.addRfpActivityBtn.onclick = () => {
    const mat = currentConfig.materials[activeOppId] || {};
    if (!mat.rfp) mat.rfp = { url: '', activities: [] };
    mat.rfp.activities.push({ activity: '', responsible: '', comments: '' });
    renderRfpActivities(mat.rfp.activities);
};

window.removeRfpActivity = (index) => {
    currentConfig.materials[activeOppId].rfp.activities.splice(index, 1);
    renderRfpActivities(currentConfig.materials[activeOppId].rfp.activities);
};

elements.saveRfpBtn.onclick = async () => {
    const activities = [];
    elements.rfpActivitiesBody.querySelectorAll('.activity-row-grid').forEach((grid, index) => {
        const resp = grid.querySelector('.resp').value;
        saveResponsible(resp);
        const existingRfp = currentConfig.materials[activeOppId]?.rfp || {};
        const existingAct = existingRfp.activities ? existingRfp.activities[index] : null;

        activities.push({
            activity: grid.querySelector('.act').value,
            responsible: resp,
            comments: grid.querySelector('.comm').value,
            date: existingAct?.date || new Date().toISOString()
        });
    });

    if (!currentConfig.materials[activeOppId]) currentConfig.materials[activeOppId] = {};
    currentConfig.materials[activeOppId].rfp = {
        url: elements.rfpUrl.value,
        activities
    };

    await window.electronAPI.saveFile(currentConfig.directory, 'materials.json', currentConfig.materials);
    showToast('RFP guardado');
    elements.rfpModal.classList.add('hidden');
};

// Demos Logic
window.openDemo = (oppId) => {
    activeOppId = oppId;
    const mat = currentConfig.materials[oppId] || {};
    const demo = mat.demo || { description: '', url: '', activities: [] };

    elements.demoDesc.value = demo.description || '';
    elements.demoUrl.value = demo.url || '';
    renderDemoActivities(demo.activities || []);

    // Trigger preview
    elements.demoUrl.resetToPreview();

    elements.demoModal.classList.remove('hidden');
};

function renderDemoActivities(activities) {
    renderActivityInputs(activities, elements.demoActivitiesBody, 'removeDemoActivity');
}

function renderPocActivities(activities) {
    renderActivityInputs(activities, elements.pocActivitiesBody, 'removePocActivity');
}

elements.addPocActivityBtn.onclick = () => {
    let pocs = currentConfig.materials[activeOppId].pocs;
    let poc = pocs[activePocIndex];
    if (!poc.activities) poc.activities = [];
    poc.activities.push({ activity: '', responsible: '', comments: '' });
    renderPocActivities(poc.activities);
};

window.removePocActivity = (index) => {
    let pocs = currentConfig.materials[activeOppId].pocs;
    let poc = pocs[activePocIndex];
    poc.activities.splice(index, 1);
    renderPocActivities(poc.activities);
};

elements.addDemoActivityBtn.onclick = () => {
    const mat = currentConfig.materials[activeOppId] || {};
    if (!mat.demo) mat.demo = { description: '', url: '', activities: [] };
    mat.demo.activities.push({ activity: '', responsible: '', comments: '' });
    renderDemoActivities(mat.demo.activities);
};

window.removeDemoActivity = (index) => {
    currentConfig.materials[activeOppId].demo.activities.splice(index, 1);
    renderDemoActivities(currentConfig.materials[activeOppId].demo.activities);
};

elements.saveDemoBtn.onclick = async () => {
    const activities = [];
    elements.demoActivitiesBody.querySelectorAll('.activity-row-grid').forEach((grid, index) => {
        const resp = grid.querySelector('.resp').value;
        saveResponsible(resp);
        const existingDemo = currentConfig.materials[activeOppId]?.demo || {};
        const existingAct = existingDemo.activities ? existingDemo.activities[index] : null;

        activities.push({
            activity: grid.querySelector('.act').value,
            responsible: resp,
            comments: grid.querySelector('.comm').value,
            date: existingAct?.date || new Date().toISOString()
        });
    });

    if (!currentConfig.materials[activeOppId]) currentConfig.materials[activeOppId] = {};
    currentConfig.materials[activeOppId].demo = {
        description: elements.demoDesc.value,
        url: elements.demoUrl.value,
        activities
    };

    await window.electronAPI.saveFile(currentConfig.directory, 'materials.json', currentConfig.materials);
    showToast('Demo guardada');
    elements.demoModal.classList.add('hidden');
};

// Close handlers
elements.closePocsModalBtn.onclick = () => elements.pocsModal.classList.add('hidden');
elements.closePocDetailModalBtn.onclick = () => elements.pocDetailModal.classList.add('hidden');
elements.closeRfpModalBtn.onclick = () => elements.rfpModal.classList.add('hidden');
elements.closeDemoModalBtn.onclick = () => elements.demoModal.classList.add('hidden');

// UI Helpers
function showToast(msg) {
    elements.successToast.textContent = msg;
    elements.successToast.classList.remove('hidden');
    setTimeout(() => elements.successToast.classList.add('hidden'), 3000);
}

function updateResponsiblesList() {
    elements.responsiblesList.innerHTML = '';
    currentConfig.responsibles.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        elements.responsiblesList.appendChild(opt);
    });
}

function saveResponsible(name) {
    if (!name) return;
    const trimmed = name.trim();
    if (trimmed && !currentConfig.responsibles.includes(trimmed)) {
        currentConfig.responsibles.push(trimmed);
        currentConfig.responsibles.sort();
        updateResponsiblesList();
        // Save to settings
        window.electronAPI.saveFile(currentConfig.directory, 'settings.json', {
            lastDirectory: currentConfig.directory,
            crmUrlTemplate: currentConfig.crmUrlTemplate,
            accountUrlTemplate: currentConfig.accountUrlTemplate,
            theme: elements.themeSelect.value,
            responsibles: currentConfig.responsibles
        });
    }
}

function initUrlField(inputId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(`${inputId}-preview`);
    if (!input || !preview) return;

    const link = preview.querySelector('.url-link');
    const editBtn = preview.querySelector('.edit-url-btn');

    const updatePreview = () => {
        const val = input.value.trim();
        if (val) {
            input.classList.add('hidden');
            preview.classList.remove('hidden');
            link.href = val.startsWith('http') ? val : `https://${val}`;
            link.textContent = val.length > 50 ? val.substring(0, 47) + '...' : val;
        } else {
            input.classList.remove('hidden');
            preview.classList.add('hidden');
        }
    };

    input.addEventListener('blur', updatePreview);

    editBtn.addEventListener('click', () => {
        preview.classList.add('hidden');
        input.classList.remove('hidden');
        input.focus();
    });

    // Helper to allow programmatic resets
    input.resetToPreview = updatePreview;
}

// Register all URL fields
initUrlField('poc-url-acceptance');
initUrlField('poc-url-content');
initUrlField('rfp-url');
initUrlField('demo-url');

init();
