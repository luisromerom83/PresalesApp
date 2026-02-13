let currentConfig = {
    directory: null,
    user: null,
    opportunities: [],
    notes: {},
    materials: {},
    responsibles: [], // Global list of responsibles
    crmUrlTemplate: '',
    currentFavoritesFilter: false,
    currentSearchQuery: '',
    accountCategories: ['Anchor Account', 'Key Account', 'Partner', 'Tactical Account'],
    accounts: {},
    favorites: [],
    dataStructure: [],
    accountUrlTemplate: '',
    collapsedAccounts: new Set(),
    calendarDate: new Date(), // State for the calendar view
    calendarView: 'month', // State for the calendar view (day, work-week, full-week, month)
    sidebarFilters: [
        { id: 'stages', label: 'by Stages', mode: 'selection', field: 'Stage' },
        { id: 'classification', label: 'By Classification', mode: 'selection', field: 'accountCategory' },
        {
            id: 'licensing', label: 'By Licensing Model', mode: 'logic', field: 'Annual Subscription', rules: [
                { label: 'Perpetual', matchType: 'AND', conditions: [{ operator: 'eq', value: '0', type: 'numeric' }] },
                { label: 'Subscription', matchType: 'AND', conditions: [{ operator: 'gt', value: '0', type: 'numeric' }] }
            ]
        }
    ],
    activeFilters: {}, // { filterId: value/ruleLabel }
    expandedFilters: new Set(), // Track open submenus (empty by default means all collapsed)
    expandedManagerFilterId: null // Track which filter is expanded in the settings manager
};

let activeOppId = null;
let pendingNewDir = null;

console.log("Renderer: Inicializando script...");

// DOM Elements
const elements = {
    directoryScreen: document.getElementById('directory-screen'),
    formScreen: document.getElementById('form-screen'),
    mainScreen: document.getElementById('main-screen'),
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

    activitiesModal: document.getElementById('activities-modal'),
    closeActivitiesModalBtn: document.getElementById('close-activities-modal-btn'),
    activitiesModalTitle: document.getElementById('activities-modal-title'),
    activitiesOppInfoPoc: document.getElementById('activities-opp-info-poc'),
    activitiesOppInfoRfp: document.getElementById('activities-opp-info-rfp'),
    activitiesOppInfoDemo: document.getElementById('activities-opp-info-demo'),

    pocsListBody: document.getElementById('pocs-list-body'),
    addPocRowBtn: document.getElementById('add-poc-row-btn'),

    rfpUrl: document.getElementById('rfp-url'),
    rfpActivitiesBody: document.getElementById('rfp-activities-body'),
    addRfpActivityBtn: document.getElementById('add-rfp-activity-btn'),
    saveRfpBtn: document.getElementById('save-rfp-btn'),

    demoDesc: document.getElementById('demo-desc'),
    demoUrl: document.getElementById('demo-url'),
    demoActivitiesBody: document.getElementById('demo-activities-body'),
    addDemoActivityBtn: document.getElementById('add-demo-activity-btn'),
    saveDemoBtn: document.getElementById('save-demo-btn'),

    pocDetailModal: document.getElementById('poc-detail-modal'),
    pocDetailTitle: document.getElementById('poc-detail-title'),
    closePocDetailModalBtn: document.getElementById('close-poc-detail-modal-btn'),
    pocObjective: document.getElementById('poc-objective'),
    pocUseCase: document.getElementById('poc-use-case'),
    pocScopeContainer: document.getElementById('poc-scope-container'),
    pocResourcesContainer: document.getElementById('poc-resources-container'),
    pocTimelineBody: document.getElementById('poc-timeline-body'),
    addPocTimelineBtn: document.getElementById('add-poc-timeline-btn'),
    pocStakeholdersContainer: document.getElementById('poc-stakeholders-container'),
    pocSquadContainer: document.getElementById('poc-squad-container'),
    pocAssumptions: document.getElementById('poc-assumptions'),
    pocFinancials: document.getElementById('poc-financials'),
    pocUrlAcceptance: document.getElementById('poc-url-acceptance'),
    pocUrlContent: document.getElementById('poc-url-content'),
    savePocDetailBtn: document.getElementById('save-poc-detail-btn'),

    yesMigrateBtn: document.getElementById('yes-migrate-btn'),
    noMigrateBtn: document.getElementById('no-migrate-btn'),
    successToast: document.getElementById('success-toast'),

    saveSettingsBtn: document.getElementById('save-settings-btn'),
    settingsPathDisplay: document.getElementById('settings-path-display'),
    stagesSubmenu: document.getElementById('stages-submenu'),
    allOppsBtn: document.getElementById('all-opps-btn'),
    favoritesNavBtn: document.getElementById('favorites-nav-btn'),
    changeDirBtn: document.getElementById('change-dir-btn'),
    crmUrlInput: document.getElementById('crm-url-template'),
    themeSelect: document.getElementById('theme-select'),
    historyWeek: document.getElementById('history-week'),
    historyMonth: document.getElementById('history-month'),
    historyYear: document.getElementById('history-year'),
    classificationSubmenu: document.getElementById('classification-submenu'),
    licensingSubmenu: document.getElementById('licensing-submenu'),
    oppSearchInput: document.getElementById('opp-search-input'),
    structureBody: document.getElementById('structure-body'),
    addStructureRowBtn: document.getElementById('add-structure-row-btn'),
    saveStructureBtn: document.getElementById('save-structure-btn'),
    resetStructureBtn: document.getElementById('reset-structure-btn'),

    // Attack Plan Elements
    attackPlanModal: document.getElementById('attack-plan-modal'),
    attackPlanModalTitle: document.getElementById('attack-plan-modal-title'),
    closeAttackPlanModalBtn: document.getElementById('close-attack-plan-modal-btn'),
    attackPlanLicensesContainer: document.getElementById('attack-plan-licenses-container'),
    addAttackLicenseBtn: document.getElementById('add-attack-license-btn'),
    attackPlanActivitiesBody: document.getElementById('attack-plan-activities-body'),
    addAttackActivityBtn: document.getElementById('add-attack-activity-btn'),
    attackPlanStrategy: document.getElementById('attack-plan-strategy'),
    saveAttackPlanBtn: document.getElementById('save-attack-plan-btn'),
    attackPlanTimelineChart: document.getElementById('attack-plan-timeline-chart'),
    // Account Contacts Elements
    accountContactsModal: document.getElementById('account-contacts-modal'),
    accountContactsModalTitle: document.getElementById('account-contacts-modal-title'),
    closeAccountContactsModalBtn: document.getElementById('close-account-contacts-modal-btn'),
    accountContactsBody: document.getElementById('account-contacts-body'),
    addAccountContactBtn: document.getElementById('add-account-contact-btn'),
    saveAccountContactsBtn: document.getElementById('save-account-contacts-btn'),
    // Global Views Elements
    globalContactsBody: document.getElementById('global-contacts-body'),
    globalContactsSearchInput: document.getElementById('contacts-search-input'),
    accountsWithPlanList: document.getElementById('accounts-with-plan-list'),
    helpBtn: document.getElementById('help-btn'),

    oppTableHead: document.getElementById('opp-table-head'),
    detailsModal: document.getElementById('details-modal'),
    detailsContent: document.getElementById('details-content'),
    detailsModalTitle: document.getElementById('details-modal-title'),
    closeDetailsBtn: document.getElementById('close-details-btn'),
    accountUrlInput: document.getElementById('account-url-template'),
    appVersion: document.getElementById('app-version'),
    updateBadge: document.getElementById('update-badge'),
    updateModal: document.getElementById('update-modal'),
    confirmUpdateBtn: document.getElementById('confirm-update-btn'),
    cancelUpdateBtn: document.getElementById('cancel-update-btn'),
    closeUpdateModalBtn: document.getElementById('close-update-modal-btn'),
    updateMessage: document.getElementById('update-message'),
    calendarGrid: document.getElementById('calendar-grid'),
    currentMonthDisplay: document.getElementById('current-month-display'),
    prevMonthBtn: document.getElementById('prev-month-btn'),
    nextMonthBtn: document.getElementById('next-month-btn'),
    responsiblesList: document.getElementById('responsibles-list'),
    oppDescription: document.getElementById('opp-description'),
    saveOppDescriptionBtn: document.getElementById('save-opp-description-btn'),

    // Front Office Settings
    foApiUrlInput: document.getElementById('fo-api-url'),
    foApiTokenInput: document.getElementById('fo-api-token'),
    foApiTemplateInput: document.getElementById('fo-api-template'),
    foApiHolderInput: document.getElementById('fo-api-holder'),
    generateFoTicketBtn: document.getElementById('generate-fo-ticket-btn'),
    viewFoTicketBtn: document.getElementById('view-fo-ticket-btn'),
    ticketViewModal: document.getElementById('ticket-view-modal'),
    ticketViewTitle: document.getElementById('ticket-view-title'),
    ticketViewUrl: document.getElementById('ticket-view-url'),
    ticketIframe: document.getElementById('ticket-iframe'),
    downloadDocxBtn: document.getElementById('download-docx-btn'),
    closeTicketViewBtn: document.getElementById('close-ticket-view-btn'),

    // Redesigned Header Info
    headerDisplayName: document.getElementById('header-display-name'),
    headerDisplayCompany: document.getElementById('header-display-company'),

    // Settings Tabs
    classificationManagerList: document.getElementById('classification-manager-list'),
    newClassificationInput: document.getElementById('new-classification-input'),
    addClassificationBtn: document.getElementById('add-classification-btn'),

    // Sidebar Filter Elements
    dynamicFiltersContainer: document.getElementById('dynamic-filters-container'),
    sidebarFiltersManagerList: document.getElementById('sidebar-filters-manager-list'),
    addSidebarFilterBtn: document.getElementById('add-sidebar-filter-btn')
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
    const navBtn = document.querySelector(`[data-target="${viewId}"]`);
    if (navBtn) navBtn.classList.add('active');
}

// Window Controls Logic

// Keyboard Shortcuts
window.goToOpportunity = (oppId) => {
    currentConfig.activeFilters = {};
    currentConfig.currentFavoritesFilter = false;
    currentConfig.currentSearchQuery = oppId.toLowerCase();
    elements.oppSearchInput.value = oppId;

    renderOpportunities();
    renderDynamicFilters();
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
    if (e.key === 'F5') {
        location.reload();
    }
});

// Sidebar Oportunidades Group Toggle
const toggleBtn = document.getElementById('toggle-opp-group');
const oppSubmenu = document.getElementById('opp-group-submenu');
if (toggleBtn && oppSubmenu) {
    toggleBtn.onclick = () => {
        oppSubmenu.classList.toggle('collapsed');
        toggleBtn.classList.toggle('collapsed');
    };
}

// Sidebar Microsoft Group Toggle
const toggleMsBtn = document.getElementById('toggle-ms-group');
const msSubmenu = document.getElementById('ms-group-submenu');
if (toggleMsBtn && msSubmenu) {
    toggleMsBtn.onclick = () => {
        msSubmenu.classList.toggle('collapsed');
        toggleMsBtn.classList.toggle('collapsed');
    };
}


// Sidebar Navigation
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;

    const target = btn.getAttribute('data-target');

    // UI Visual State
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (target === 'opp-list-view') {
        currentConfig.activeFilters = {};
        currentConfig.currentFavoritesFilter = (btn.id === 'favorites-nav-btn');
        renderOpportunities();
        renderDynamicFilters();
    }
    if (target === 'notes-history-view') {
        renderGlobalNotesHistory();
    }
    if (target === 'activity-calendar-view') {
        renderActivityCalendar();
    }
    if (target === 'global-contacts-view') {
        renderGlobalContacts();
    }
    if (target === 'accounts-with-plan-view') {
        renderAccountsWithPlan();
    }
    if (target === 'settings-view') {
        renderStructureEditor();
        renderSidebarFilterManager();
    }
    showView(target);
});

// Search Logic
elements.oppSearchInput.addEventListener('input', (e) => {
    currentConfig.currentSearchQuery = e.target.value.toLowerCase().trim();
    renderOpportunities();
});

// Calendar Navigation
document.querySelectorAll('.calendar-view-switcher .view-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.calendar-view-switcher .view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentConfig.calendarView = btn.getAttribute('data-view');
        renderActivityCalendar();
    };
});

elements.prevMonthBtn.onclick = () => {
    const view = currentConfig.calendarView;
    if (view === 'month') {
        currentConfig.calendarDate.setMonth(currentConfig.calendarDate.getMonth() - 1);
    } else if (view === 'full-week' || view === 'work-week') {
        currentConfig.calendarDate.setDate(currentConfig.calendarDate.getDate() - 7);
    } else if (view === 'day') {
        currentConfig.calendarDate.setDate(currentConfig.calendarDate.getDate() - 1);
    }
    renderActivityCalendar();
};

elements.nextMonthBtn.onclick = () => {
    const view = currentConfig.calendarView;
    if (view === 'month') {
        currentConfig.calendarDate.setMonth(currentConfig.calendarDate.getMonth() + 1);
    } else if (view === 'full-week' || view === 'work-week') {
        currentConfig.calendarDate.setDate(currentConfig.calendarDate.getDate() + 7);
    } else if (view === 'day') {
        currentConfig.calendarDate.setDate(currentConfig.calendarDate.getDate() + 1);
    }
    renderActivityCalendar();
};

elements.helpBtn.onclick = () => {
    window.open('help.html', 'Manual de Ayuda', 'width=1000,height=800');
};


// Tab Switching for Activities Modal
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        const modal = elements.activitiesModal;

        // Update buttons
        modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update content
        modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        modal.querySelector(`#${targetTab}`).classList.add('active');

        // Initial render for the tab
        if (targetTab === 'tab-pocs') renderPocsList();
        if (targetTab === 'tab-rfp') renderRfpTab();
        if (targetTab === 'tab-demo') renderDemoTab();
    });
});

elements.closeActivitiesModalBtn.onclick = () => elements.activitiesModal.classList.add('hidden');


function renderDynamicFilters() {
    elements.dynamicFiltersContainer.innerHTML = '';

    currentConfig.sidebarFilters.forEach(filter => {
        // Collapsed by default: isExpanded is only true if explicitly in expandedFilters
        const isExpanded = currentConfig.expandedFilters.has(filter.id);

        const groupLabel = document.createElement('div');
        groupLabel.className = `nav-group-label ${isExpanded ? '' : 'collapsed'}`;
        groupLabel.id = `toggle-${filter.id}`;
        groupLabel.innerHTML = `<span>${filter.label}</span><span class="toggle-icon">▾</span>`;

        const submenu = document.createElement('div');
        submenu.id = `submenu-${filter.id}`;
        submenu.className = `submenu ${isExpanded ? '' : 'collapsed'}`;

        groupLabel.onclick = () => {
            const wasExpanded = isExpanded;

            // Clear all expanded filters for accordion behavior
            currentConfig.expandedFilters.clear();

            // If it wasn't expanded, expand only this one
            if (!wasExpanded) {
                currentConfig.expandedFilters.add(filter.id);
            }

            renderDynamicFilters();
        };

        // Determine options (buttons)
        let options = [];
        if (filter.mode === 'selection') {
            if (filter.field === 'accountCategory') {
                options = currentConfig.accountCategories.map(c => ({ label: c, value: c }));
            } else {
                const vals = [...new Set(currentConfig.opportunities.map(o => o[filter.field]).filter(Boolean))].sort();
                options = vals.map(v => ({ label: v, value: v }));
            }
        } else {
            options = filter.rules.map(r => ({ label: r.label, value: r.label }));
        }

        options.forEach(opt => {
            const btn = document.createElement('button');
            const isActive = currentConfig.activeFilters[filter.id] === opt.value;
            btn.className = `submenu-btn ${isActive ? 'active' : ''}`;
            btn.textContent = opt.label;
            btn.onclick = () => {
                // To maintain previous behavior: only ONE group can be active at a time.
                // If the user wants to keep a filter, it toggles.
                const wasActive = isActive;
                currentConfig.activeFilters = {};

                if (!wasActive) {
                    currentConfig.activeFilters[filter.id] = opt.value;
                }

                currentConfig.currentFavoritesFilter = false;
                renderOpportunities();
                renderDynamicFilters();
                showView('opp-list-view');
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                elements.allOppsBtn.classList.add('active');
            };
            submenu.appendChild(btn);
        });

        elements.dynamicFiltersContainer.appendChild(groupLabel);
        elements.dynamicFiltersContainer.appendChild(submenu);
    });
}

// Settings Tab Logic
document.querySelectorAll('.settings-tab-btn').forEach(btn => {
    btn.onclick = () => {
        const targetTab = btn.getAttribute('data-tab');
        document.querySelectorAll('.settings-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');

        if (targetTab === 'settings-classifications') renderClassificationManager();
    };
});

function renderClassificationManager() {
    elements.classificationManagerList.innerHTML = '';
    currentConfig.accountCategories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-item';
        div.innerHTML = `
            <span>${cat}</span>
            <button class="delete-cat-btn" onclick="deleteAccountCategory('${cat}')">Eliminar</button>
        `;
        elements.classificationManagerList.appendChild(div);
    });
}

elements.addClassificationBtn.onclick = () => {
    const val = elements.newClassificationInput.value.trim();
    if (val && !currentConfig.accountCategories.includes(val)) {
        currentConfig.accountCategories.push(val);
        elements.newClassificationInput.value = '';
        renderClassificationManager();
        showToast('Categoría añadida');
    }
};

window.deleteAccountCategory = (cat) => {
    currentConfig.accountCategories = currentConfig.accountCategories.filter(c => c !== cat);
    renderClassificationManager();
    showToast('Categoría eliminada');
};

function evaluateRule(itemValue, rule) {
    let val = itemValue;
    let target = rule.value;

    if (rule.type === 'numeric') {
        // Handle values with commas as decimal separators (e.g. "1.234,56" or "50,25")
        const sanitize = (v) => {
            let s = String(v || '0').replace(/[^-0-9,.]/g, '');
            // If both comma and dot exist, assume comma is decimal if it's after the dot
            if (s.includes(',') && s.includes('.')) {
                if (s.indexOf(',') > s.indexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
                else s = s.replace(/,/g, '');
            } else if (s.includes(',')) {
                s = s.replace(',', '.');
            }
            return parseFloat(s) || 0;
        };
        val = sanitize(val);
        target = sanitize(target);
    }
    else if (rule.type === 'boolean') {
        val = (val === true || val === 'true' || val === 'Yes' || val === 1);
        target = (target === true || target === 'true' || target === 'Yes' || target === 1);
    } else if (rule.type === 'text') {
        val = String(val || '').toLowerCase();
        target = String(target || '').toLowerCase();
    }

    switch (rule.operator) {
        case 'eq':
            if (rule.type === 'numeric') return val === target;
            return String(val) === String(target);
        case 'neq':
            if (rule.type === 'numeric') return val !== target;
            return String(val) !== String(target);
        case 'gt': return val > target;
        case 'gte': return val >= target;
        case 'lt': return val < target;
        case 'lte': return val <= target;
        case 'contains': return String(val || '').toLowerCase().includes(String(target || '').toLowerCase());
        default: return false;
    }
}

function evaluateRuleGroup(opp, group, defaultField) {
    if (!group.conditions || group.conditions.length === 0) return true;

    if (group.matchType === 'OR') {
        return group.conditions.some(cond => {
            const val = opp[cond.field || defaultField];
            return evaluateRule(val, cond);
        });
    } else {
        // AND
        return group.conditions.every(cond => {
            const val = opp[cond.field || defaultField];
            return evaluateRule(val, cond);
        });
    }
}

function renderSidebarFilterManager() {
    elements.sidebarFiltersManagerList.innerHTML = '';

    currentConfig.sidebarFilters.forEach((filter, fIdx) => {
        const isExpanded = currentConfig.expandedManagerFilterId === filter.id;
        const card = document.createElement('div');
        card.className = `filter-manager-card ${isExpanded ? 'expanded' : 'collapsed'}`;

        let fieldsHtml = currentConfig.dataStructure.map(s =>
            `<option value="${s.header}" ${filter.field === s.header ? 'selected' : ''}>${s.header}</option>`
        ).join('');
        fieldsHtml = `<option value="accountCategory" ${filter.field === 'accountCategory' ? 'selected' : ''}>[Categoría de Cuenta]</option>` + fieldsHtml;

        card.innerHTML = `
            <div class="filter-manager-header">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <span class="toggle-icon" style="transform: rotate(${isExpanded ? '0' : '-90'}deg)">▼</span>
                    <strong>${filter.label || 'Nuevo Grupo'}</strong>
                    <span style="font-size: 0.8rem; opacity: 0.6;">(${filter.mode === 'logic' ? 'Lógica' : 'Selección'}: ${filter.field})</span>
                </div>
                <button class="delete-cat-btn" onclick="event.stopPropagation(); deleteSidebarFilter(${fIdx})">Eliminar</button>
            </div>
            
            <div class="filter-manager-body" style="display: ${isExpanded ? 'block' : 'none'};">
                <div class="form-group">
                    <label>Etiqueta en Sidebar</label>
                    <input type="text" class="form-input" value="${filter.label}" 
                        onchange="updateFilterProp(${fIdx}, 'label', this.value)">
                </div>

                <div class="form-group" style="margin-top: 1rem;">
                    <label>Modo de Filtrado</label>
                    <select class="form-input" onchange="updateFilterProp(${fIdx}, 'mode', this.value); renderSidebarFilterManager();">
                        <option value="selection" ${filter.mode === 'selection' ? 'selected' : ''}>Selección (Valores Únicos)</option>
                        <option value="logic" ${filter.mode === 'logic' ? 'selected' : ''}>Lógica (Reglas Manuales)</option>
                    </select>
                </div>
                
                <div class="form-group" style="margin-top: 1rem;">
                    <label>Variable / Columna Base</label>
                    <select class="form-input" onchange="updateFilterProp(${fIdx}, 'field', this.value)">
                        ${fieldsHtml}
                    </select>
                </div>

                ${filter.mode === 'logic' ? `
                    <div class="logic-rules-container" style="margin-top: 1.5rem; border-top: 1px solid var(--glass-border); padding-top: 1rem;">
                        <label style="font-weight: bold; margin-bottom: 0.5rem; display: block;">Botones y Reglas</label>
                        <div id="rules-list-${fIdx}"></div>
                        <button class="secondary-btn small" style="margin-top: 0.5rem;" onclick="addLogicRule(${fIdx})">+ Añadir Botón</button>
                    </div>
                ` : ''}
            </div>
        `;

        const header = card.querySelector('.filter-manager-header');
        header.onclick = () => {
            currentConfig.expandedManagerFilterId = isExpanded ? null : filter.id;
            renderSidebarFilterManager();
        };

        elements.sidebarFiltersManagerList.appendChild(card);

        if (filter.mode === 'logic') {
            const rulesList = document.getElementById(`rules-list-${fIdx}`);
            (filter.rules || []).forEach((rule, rIdx) => {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'filter-rule-group-card';
                groupDiv.innerHTML = `
                    <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                        <input type="text" class="form-input" placeholder="Etiqueta del Botón" value="${rule.label}" 
                            onchange="updateRuleGroupProp(${fIdx}, ${rIdx}, 'label', this.value)" style="font-weight: bold;">
                        <select class="form-input" onchange="updateRuleGroupProp(${fIdx}, ${rIdx}, 'matchType', this.value)" style="width: auto;">
                            <option value="AND" ${rule.matchType === 'AND' ? 'selected' : ''}>Y (AND)</option>
                            <option value="OR" ${rule.matchType === 'OR' ? 'selected' : ''}>O (OR)</option>
                        </select>
                        <button class="delete-cat-btn" onclick="deleteRuleGroup(${fIdx}, ${rIdx})">×</button>
                    </div>
                    <div class="conditions-container" id="conditions-${fIdx}-${rIdx}"></div>
                    <button class="secondary-btn small" onclick="addCondition(${fIdx}, ${rIdx})">+ Condición</button>
                `;
                rulesList.appendChild(groupDiv);

                const conditionsContainer = document.getElementById(`conditions-${fIdx}-${rIdx}`);
                (rule.conditions || []).forEach((cond, cIdx) => {
                    const condDiv = document.createElement('div');
                    condDiv.className = 'filter-rule-item condition-item';

                    let colOptions = currentConfig.dataStructure.map(s =>
                        `<option value="${s.header}" ${cond.field === s.header ? 'selected' : ''}>${s.header}</option>`
                    ).join('');
                    colOptions = `<option value="" ${!cond.field ? 'selected' : ''}>[Default: ${filter.field}]</option>` + colOptions;

                    condDiv.innerHTML = `
                        <select class="form-input" onchange="updateConditionProp(${fIdx}, ${rIdx}, ${cIdx}, 'field', this.value)">
                            ${colOptions}
                        </select>
                        <select class="form-input" onchange="updateConditionProp(${fIdx}, ${rIdx}, ${cIdx}, 'type', this.value)">
                            <option value="text" ${cond.type === 'text' ? 'selected' : ''}>Texto</option>
                            <option value="numeric" ${cond.type === 'numeric' ? 'selected' : ''}>Numérico</option>
                            <option value="boolean" ${cond.type === 'boolean' ? 'selected' : ''}>Bool</option>
                        </select>
                        <select class="form-input" onchange="updateConditionProp(${fIdx}, ${rIdx}, ${cIdx}, 'operator', this.value)">
                            <option value="eq" ${cond.operator === 'eq' ? 'selected' : ''}>==</option>
                            <option value="neq" ${cond.operator === 'neq' ? 'selected' : ''}>!=</option>
                            <option value="gt" ${cond.operator === 'gt' ? 'selected' : ''}>></option>
                            <option value="gte" ${cond.operator === 'gte' ? 'selected' : ''}>>=</option>
                            <option value="lt" ${cond.operator === 'lt' ? 'selected' : ''}><</option>
                            <option value="lte" ${cond.operator === 'lte' ? 'selected' : ''}><=</option>
                            <option value="contains" ${cond.operator === 'contains' ? 'selected' : ''}>Contiene</option>
                        </select>
                        <input type="text" class="form-input" placeholder="Valor" value="${cond.value}" 
                            onchange="updateConditionProp(${fIdx}, ${rIdx}, ${cIdx}, 'value', this.value)">
                        <button class="delete-cat-btn" onclick="deleteCondition(${fIdx}, ${rIdx}, ${cIdx})">×</button>
                    `;
                    conditionsContainer.appendChild(condDiv);
                });
            });
        }
    });
}

window.updateFilterProp = (fIdx, prop, val) => {
    currentConfig.sidebarFilters[fIdx][prop] = val;
    if (prop === 'mode' && val === 'logic' && (!currentConfig.sidebarFilters[fIdx].rules || currentConfig.sidebarFilters[fIdx].rules.length === 0)) {
        currentConfig.sidebarFilters[fIdx].rules = [{ label: 'Nuevo Botón', matchType: 'AND', conditions: [{ operator: 'eq', value: '', type: 'text' }] }];
    }
    autoSaveSidebarFilters();
};

window.updateRuleGroupProp = (fIdx, rIdx, prop, val) => {
    currentConfig.sidebarFilters[fIdx].rules[rIdx][prop] = val;
    autoSaveSidebarFilters();
};

window.updateConditionProp = (fIdx, rIdx, cIdx, prop, val) => {
    currentConfig.sidebarFilters[fIdx].rules[rIdx].conditions[cIdx][prop] = val;
    autoSaveSidebarFilters();
};

window.deleteSidebarFilter = (fIdx) => {
    const filterId = currentConfig.sidebarFilters[fIdx].id;
    if (currentConfig.expandedManagerFilterId === filterId) {
        currentConfig.expandedManagerFilterId = null;
    }
    currentConfig.sidebarFilters.splice(fIdx, 1);
    renderSidebarFilterManager();
    autoSaveSidebarFilters();
};

window.deleteRuleGroup = (fIdx, rIdx) => {
    currentConfig.sidebarFilters[fIdx].rules.splice(rIdx, 1);
    renderSidebarFilterManager();
    autoSaveSidebarFilters();
};

window.addLogicRule = (fIdx) => {
    if (!currentConfig.sidebarFilters[fIdx].rules) currentConfig.sidebarFilters[fIdx].rules = [];
    currentConfig.sidebarFilters[fIdx].rules.push({ label: 'Nuevo Botón', matchType: 'AND', conditions: [{ operator: 'eq', value: '', type: 'text' }] });
    renderSidebarFilterManager();
    autoSaveSidebarFilters();
};

window.addCondition = (fIdx, rIdx) => {
    if (!currentConfig.sidebarFilters[fIdx].rules[rIdx].conditions) currentConfig.sidebarFilters[fIdx].rules[rIdx].conditions = [];
    currentConfig.sidebarFilters[fIdx].rules[rIdx].conditions.push({ operator: 'eq', value: '', type: 'text' });
    renderSidebarFilterManager();
    autoSaveSidebarFilters();
};

window.deleteCondition = (fIdx, rIdx, cIdx) => {
    currentConfig.sidebarFilters[fIdx].rules[rIdx].conditions.splice(cIdx, 1);
    renderSidebarFilterManager();
    autoSaveSidebarFilters();
};

elements.addSidebarFilterBtn.onclick = () => {
    const newId = 'filter-' + Date.now();
    currentConfig.sidebarFilters.push({ id: newId, label: 'Nuevo Grupo', mode: 'selection', field: 'Stage' });
    currentConfig.expandedManagerFilterId = newId; // Auto-expand the new filter
    renderSidebarFilterManager();
    autoSaveSidebarFilters();
};

async function autoSaveSidebarFilters() {
    await window.electronAPI.saveSettings({
        lastDirectory: currentConfig.directory,
        crmUrlTemplate: currentConfig.crmUrlTemplate,
        accountUrlTemplate: currentConfig.accountUrlTemplate,
        theme: elements.themeSelect.value,
        accountCategories: currentConfig.accountCategories,
        sidebarFilters: currentConfig.sidebarFilters,
        responsibles: currentConfig.responsibles
    });
}

// App Initialization
async function init() {
    // Version Display
    try {
        const version = await window.electronAPI.getAppVersion();
        if (elements.appVersion) elements.appVersion.textContent = `v${version}`;
    } catch (e) {
        console.error("Error fetching version:", e);
    }

    // Auto-update notifications
    if (window.electronAPI.onUpdateAvailable) {
        window.electronAPI.onUpdateAvailable((info) => {
            elements.updateBadge.classList.remove('hidden');
            elements.updateBadge.title = `Nueva versión v${info.version} disponible`;
            elements.updateBadge.onclick = () => {
                elements.updateMessage.textContent = `Hay una nueva versión disponible (v${info.version}). ¿Deseas descargarla ahora?`;
                elements.confirmUpdateBtn.classList.remove('hidden');
                elements.confirmUpdateBtn.textContent = "Descargar";
                elements.confirmUpdateBtn.onclick = () => {
                    window.electronAPI.downloadUpdate();
                    elements.confirmUpdateBtn.textContent = "Iniciando...";
                    elements.confirmUpdateBtn.disabled = true;
                };
                elements.updateModal.classList.remove('hidden');
            };
        });
    }

    if (window.electronAPI.onUpdateProgress) {
        window.electronAPI.onUpdateProgress((progress) => {
            elements.updateMessage.textContent = `Descargando: ${Math.round(progress.percent)}% (${(progress.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s)`;
            elements.confirmUpdateBtn.textContent = "Descargando...";
            elements.confirmUpdateBtn.disabled = true;
        });
    }

    if (window.electronAPI.onUpdateDownloaded) {
        window.electronAPI.onUpdateDownloaded(() => {
            elements.updateBadge.classList.add('downloaded');
            elements.updateBadge.title = "Actualización descargada y lista para instalar";

            const showInstallPrompt = () => {
                elements.updateMessage.textContent = "La actualización ya se descargó. ¿Deseas reiniciar la aplicación para instalar?";
                elements.confirmUpdateBtn.classList.remove('hidden');
                elements.confirmUpdateBtn.disabled = false;
                elements.confirmUpdateBtn.textContent = "Reiniciar e Instalar";
                elements.confirmUpdateBtn.onclick = () => {
                    window.electronAPI.installUpdate();
                };
                elements.updateModal.classList.remove('hidden');
            };

            elements.updateBadge.onclick = showInstallPrompt;

            // If the modal is currently showing the download progress, update it to the install prompt
            if (!elements.updateModal.classList.contains('hidden')) {
                showInstallPrompt();
            }
            showToast('Actualización lista para instalar');
        });
    }

    if (window.electronAPI.onUpdateError) {
        window.electronAPI.onUpdateError((err) => {
            console.error("Update error:", err);
            showToast(`Error al actualizar: ${err}`);
            elements.updateModal.classList.add('hidden');
            elements.confirmUpdateBtn.disabled = false;
            elements.confirmUpdateBtn.textContent = "Reintentar";
        });
    }

    elements.closeUpdateModalBtn.onclick = () => elements.updateModal.classList.add('hidden');
    elements.cancelUpdateBtn.onclick = () => elements.updateModal.classList.add('hidden');

    try {
        const settings = await window.electronAPI.getSettings();
        if (settings) {
            currentConfig.crmUrlTemplate = settings.crmUrlTemplate || '';
            currentConfig.accountUrlTemplate = settings.accountUrlTemplate || '';
            const theme = settings.theme || 'auto';
            if (elements.crmUrlInput) elements.crmUrlInput.value = currentConfig.crmUrlTemplate;
            if (elements.accountUrlInput) elements.accountUrlInput.value = currentConfig.accountUrlTemplate;
            if (elements.foApiUrlInput) elements.foApiUrlInput.value = settings.foApiUrl || '';
            if (elements.foApiTokenInput) elements.foApiTokenInput.value = settings.foApiToken || '';
            if (elements.foApiTemplateInput) elements.foApiTemplateInput.value = settings.foApiTemplate || '';
            if (elements.foApiHolderInput) elements.foApiHolderInput.value = settings.foApiHolder || '';
            elements.themeSelect.value = theme;
            applyTheme(theme);

            currentConfig.responsibles = settings.responsibles || [];
            currentConfig.accountCategories = settings.accountCategories || ['Anchor Account', 'Key Account', 'Partner', 'Tactical Account'];
            if (settings.sidebarFilters) currentConfig.sidebarFilters = settings.sidebarFilters;
            updateResponsiblesList();

            if (settings.lastDirectory) {
                currentConfig.directory = settings.lastDirectory;
                elements.settingsPathDisplay.textContent = currentConfig.directory;

                // Check if directory actually exists and has data
                const dirStatus = await window.electronAPI.checkDirectory(settings.lastDirectory);
                if (!dirStatus.exists || dirStatus.empty) {
                    console.warn("Renderer: Directorio no válido o vacío, redirigiendo a configuración.");
                    showScreen('directory-screen');
                    return;
                }

                const loaded = await loadAllData(settings.lastDirectory);
                if (loaded && currentConfig.user) {
                    updateHeaderInfo();
                    renderDynamicFilters();
                    // Initialize collapsed accounts (all collapsed by default)
                    currentConfig.collapsedAccounts = new Set();
                    currentConfig.opportunities.forEach(opp => {
                        const accId = opp['Account ID'];
                        if (accId) currentConfig.collapsedAccounts.add(accId);
                    });

                    renderOpportunities();
                    renderStructureEditor();
                    showScreen('main-screen');
                } else {
                    showScreen('form-screen');
                }
            } else {
                // No directory in settings, first boot
                showScreen('directory-screen');
            }
        } else {
            // No settings at all, first boot
            showScreen('directory-screen');
        }
    } catch (error) {
        console.error("Renderer Init Error:", error);
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

        const favorites = await window.electronAPI.loadFile(dir, 'favorites.json');
        currentConfig.favorites = favorites || [];

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
        updateHeaderInfo();
        renderOpportunities();
        showScreen('main-screen');
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
        theme: theme,
        accountCategories: currentConfig.accountCategories,
        sidebarFilters: currentConfig.sidebarFilters,
        responsibles: currentConfig.responsibles,
        foApiUrl: elements.foApiUrlInput.value.trim(),
        foApiToken: elements.foApiTokenInput.value.trim(),
        foApiTemplate: elements.foApiTemplateInput.value.trim(),
        foApiHolder: elements.foApiHolderInput.value.trim()
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

    // Switch logo based on theme
    const logos = document.querySelectorAll('.theme-logo');
    const isLight = theme === 'light';
    logos.forEach(img => {
        img.src = isLight ? 'assets/logo-light.svg' : 'assets/logo.svg';
    });
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
    updateHeaderInfo();
    renderOpportunities();
    showScreen('main-screen');
});

function fillUserForm(data) {
    document.getElementById('name').value = data.name || '';
    document.getElementById('email').value = data.email || '';
    document.getElementById('company').value = data.company || '';
    if (elements.crmUrlInput) elements.crmUrlInput.value = data.crmUrlTemplate || '';
    if (elements.accountUrlInput) elements.accountUrlInput.value = data.accountUrlTemplate || '';
}

function updateHeaderInfo() {
    if (elements.headerDisplayName) elements.headerDisplayName.textContent = currentConfig.user.name;
    if (elements.headerDisplayCompany) elements.headerDisplayCompany.textContent = currentConfig.user.company;
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
            <td>
                <div style="display: flex; gap: 0.2rem; align-items: center;">
                    <button class="order-btn small" onclick="moveStructureItem(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Subir">↑</button>
                    <button class="order-btn small" onclick="moveStructureItem(${index}, 1)" ${index === currentConfig.dataStructure.length - 1 ? 'disabled' : ''} title="Bajar">↓</button>
                    <input type="text" value="${item.header}" class="struct-header" data-index="${index}" style="margin-left: 0.5rem;">
                </div>
            </td>
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

window.moveStructureItem = async (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentConfig.dataStructure.length) return;

    // Swap items
    const item = currentConfig.dataStructure.splice(index, 1)[0];
    currentConfig.dataStructure.splice(newIndex, 0, item);

    renderStructureEditor();

    // Auto-save structure
    if (currentConfig.directory) {
        await window.electronAPI.saveFile(currentConfig.directory, 'structure.json', currentConfig.dataStructure);
        showToast('Orden guardado');
    }
};

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
        const stage = opp ? opp['Stage'] : '';
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
                            accountName: account,
                            stage: stage
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
                    accountName: account,
                    stage: stage
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
                    accountName: account,
                    stage: stage
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
                <span class="sub-text">${item.accountName || ''}</span>
            </div>
            <div class="history-card-body">
                <span class="note-type-badge ${typeInfo.class}">${typeInfo.label}</span>
                <p style="margin-top: 0.5rem;">${item.text || item.activity || ''}</p>
                <p class="sub-text" style="font-size: 0.8rem;">${item.comments || ''}</p>
            </div>
            <div class="history-card-footer">
                <span class="note-stage-badge">${item.stage || ''}</span>
                <span class="sub-text">${formatToDDMMYYYY(item.date)}</span>
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

    // Phase 1: Dynamic Sidebar Filters
    if (currentConfig.currentFavoritesFilter) {
        filteredOpps = filteredOpps.filter(o => currentConfig.favorites.includes(o['Opportunity ID']));
    } else {
        // Apply all active dynamic filters
        Object.keys(currentConfig.activeFilters).forEach(filterId => {
            const filter = currentConfig.sidebarFilters.find(f => f.id === filterId);
            if (!filter) return;

            const activeVal = currentConfig.activeFilters[filterId];

            filteredOpps = filteredOpps.filter(o => {
                if (filter.mode === 'selection') {
                    if (filter.field === 'accountCategory') {
                        const accId = o['Account ID'];
                        return currentConfig.accounts[accId] && currentConfig.accounts[accId].category === activeVal;
                    } else {
                        return o[filter.field] === activeVal;
                    }
                } else {
                    // Logic Mode: activeVal is the label of the rule group
                    const ruleGroup = filter.rules.find(r => r.label === activeVal);
                    if (!ruleGroup) return true;
                    return evaluateRuleGroup(o, ruleGroup, filter.field);
                }
            });
        });
    }

    // Phase 2: Search Filter
    if (currentConfig.currentSearchQuery) {
        filteredOpps = filteredOpps.filter(o => {
            const name = (o['Opportunity Name'] || '').toLowerCase();
            const account = (o['Account Name'] || '').toLowerCase();
            const id = (o['Opportunity ID'] || '').toLowerCase();
            const accId = (o['Account ID'] || '').toLowerCase();
            const q = currentConfig.currentSearchQuery;
            return name.includes(q) || account.includes(q) || id.includes(q) || accId.includes(q);
        });
    }


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
        const options = ['', ...currentConfig.accountCategories];

        const hasAttackPlan = !!(currentConfig.accounts[accountId]?.attackPlan);
        headerTr.innerHTML = `
            <td colspan="${visibleCols.length + 1}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="display: flex; align-items: center;">
                        <span class="toggle-icon">▾</span>
                        🏢 ${accountName} <span class="sub-text" style="margin-left: 0.5rem;">(${accountId})</span>
                        <button class="attack-plan-btn ${hasAttackPlan ? 'active' : ''}" onclick="event.stopPropagation(); openAttackPlan('${accountId}')" title="Plan de Ataque de Cuenta">🎯</button>
                        <button class="account-contacts-btn" onclick="event.stopPropagation(); openAccountContacts('${accountId}')" title="Contactos de la Cuenta">👥</button>
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
                    <div style="display: flex; gap: 0.5rem; align-items: center;" onclick="event.stopPropagation()">
                        <button class="favorite-btn ${currentConfig.favorites.includes(oppId) ? 'active' : ''}" onclick="toggleFavorite('${oppId}')" title="Marcar como favorito">
                            ${currentConfig.favorites.includes(oppId) ? '★' : '☆'}
                        </button>
                        <button class="primary-btn small" onclick="openNotes('${oppId}')">Notas</button>
                        <button class="secondary-btn small" onclick="openActivities('${oppId}')">Actividades</button>
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

    // Load opportunity description from materials
    const materials = currentConfig.materials[oppId] || {};
    elements.oppDescription.value = materials.description || '';

    elements.detailsModal.classList.remove('hidden');
};

// Save Opportunity Description
elements.saveOppDescriptionBtn.onclick = async () => {
    if (!activeOppId) return;

    if (!currentConfig.materials[activeOppId]) {
        currentConfig.materials[activeOppId] = {
            pocs: [],
            rfp: { url: '', activities: [] },
            demo: { desc: '', url: '', activities: [] }
        };
    }

    currentConfig.materials[activeOppId].description = elements.oppDescription.value.trim();

    await window.electronAPI.saveFile(currentConfig.directory, 'materials.json', currentConfig.materials);
    showToast('Explicación guardada correctamente');
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
        history.forEach((note, index) => {
            const div = document.createElement('div');
            div.className = 'note-item';
            div.id = `note-item-${index}`;
            const stageBadge = note.stage ? `<span class="note-stage-badge">${note.stage}</span>` : '';

            div.innerHTML = `
                <div class="note-meta">
                    <div>
                        <span class="note-date">${new Date(note.date).toLocaleString()}</span>
                        ${stageBadge}
                    </div>
                    <div class="note-actions">
                        <button class="edit-note-btn" onclick="editNote(${index})">Editar</button>
                        <button class="delete-note-btn" onclick="deleteNote(${index})">Borrar</button>
                    </div>
                </div>
                <div class="note-content" id="note-content-${index}">${note.text}</div>
            `;
            elements.notesList.appendChild(div);
        });
    }
    elements.notesList.scrollTop = elements.notesList.scrollHeight;
}

window.editNote = (index) => {
    const history = currentConfig.notes[activeOppId];
    if (!history || !history[index]) return;

    const noteItem = document.getElementById(`note-item-${index}`);
    const noteContent = document.getElementById(`note-content-${index}`);
    const originalText = history[index].text;

    noteContent.innerHTML = `
        <div class="note-edit-container">
            <textarea class="note-edit-textarea" id="edit-textarea-${index}">${originalText}</textarea>
            <div class="note-edit-actions">
                <button class="secondary-btn small" onclick="renderNotes()">Cancelar</button>
                <button class="primary-btn small" onclick="saveEditedNote(${index})">Guardar</button>
            </div>
        </div>
    `;

    // Hide actions while editing
    noteItem.querySelector('.note-actions').style.display = 'none';
};

window.saveEditedNote = async (index) => {
    const history = currentConfig.notes[activeOppId];
    if (!history || !history[index]) return;

    const newText = document.getElementById(`edit-textarea-${index}`).value.trim();
    if (!newText) return;

    history[index].text = newText;
    history[index].updatedAt = new Date().toISOString();

    await window.electronAPI.saveFile(currentConfig.directory, 'notes.json', currentConfig.notes);
    showToast('Nota actualizada');
    renderNotes();
};

window.deleteNote = async (index) => {
    const history = currentConfig.notes[activeOppId];
    if (!history || !history[index]) return;

    if (confirm('¿Estás seguro de que deseas eliminar esta nota?')) {
        history.splice(index, 1);
        if (history.length === 0) delete currentConfig.notes[activeOppId];

        await window.electronAPI.saveFile(currentConfig.directory, 'notes.json', currentConfig.notes);
        showToast('Nota eliminada');
        renderNotes();
    }
};

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

// Consolidated Activities Modal
window.openActivities = (oppId, initialTab = 'tab-pocs') => {
    activeOppId = oppId;
    const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
    if (!opp) return;

    elements.activitiesModalTitle.textContent = `Actividades: ${opp['Opportunity Name'] || oppId}`;

    // Set active tab
    elements.activitiesModal.querySelectorAll('.tab-btn').forEach(b => {
        if (b.getAttribute('data-tab') === initialTab) b.classList.add('active');
        else b.classList.remove('active');
    });
    elements.activitiesModal.querySelectorAll('.tab-content').forEach(c => {
        if (c.id === initialTab) c.classList.add('active');
        else c.classList.remove('active');
    });

    // Render based on initial tab
    if (initialTab === 'tab-pocs') openPocs(oppId);
    else if (initialTab === 'tab-rfp') openRfp(oppId);
    else if (initialTab === 'tab-demo') openDemo(oppId);

    elements.activitiesModal.classList.remove('hidden');
};

// PoCs Logic
let activePocIndex = null;

window.openPocs = (oppId) => {
    activeOppId = oppId;
    const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
    if (!opp) return;

    elements.activitiesOppInfoPoc.textContent = `${opp['Opportunity Name']} (${oppId})`;
    renderPocsList();
};

window.toggleFavorite = async (oppId) => {
    const index = currentConfig.favorites.indexOf(oppId);
    if (index > -1) {
        currentConfig.favorites.splice(index, 1);
        showToast('Eliminado de favoritos');
    } else {
        currentConfig.favorites.push(oppId);
        showToast('Agregado a favoritos ⭐');
    }
    await window.electronAPI.saveFile(currentConfig.directory, 'favorites.json', currentConfig.favorites);
    renderOpportunities();
};

function renderPocsList() {
    elements.pocsListBody.innerHTML = '';
    const mat = currentConfig.materials[activeOppId] || {};
    const pocs = mat.pocs || [];

    pocs.forEach((poc, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${poc.objective || 'Sin objetivo'}</td>
            <td>${poc.timeline && poc.timeline[0] ? poc.timeline[0].date : '-'}</td>
            <td>${poc.stakeholders && poc.stakeholders[0] ? poc.stakeholders[0].name : '-'}</td>
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
    let poc = mat.pocs[index];

    // Migration logic for old PoC data format
    if (poc.description && !poc.objective) {
        poc = {
            ...poc,
            objective: poc.description,
            timeline: [
                { activity: 'Inicio PoC', date: poc.startDate || '', comments: '' },
                ...(poc.activities || []).map(a => ({ activity: a.activity, date: a.date ? a.date.split('T')[0] : '', comments: a.comments }))
            ],
            stakeholders: [{ name: poc.clientResponsible || '', role: 'Principal' }],
            scope: [],
            resources: [],
            squad: [],
            useCase: '',
            assumptions: '',
            financials: ''
        };
        // Update the reference so it stays migrated in session
        mat.pocs[index] = poc;
    }

    elements.pocDetailTitle.textContent = "Editar Prueba de Concepto";
    elements.pocObjective.value = poc.objective || '';
    elements.pocUseCase.value = poc.useCase || '';
    elements.pocAssumptions.value = poc.assumptions || '';
    elements.pocFinancials.value = poc.financials || '';
    elements.pocUrlAcceptance.value = poc.acceptanceUrl || '';
    elements.pocUrlContent.value = poc.contentUrl || '';

    // Trigger previews
    initUrlField(elements.pocUrlAcceptance);
    initUrlField(elements.pocUrlContent);

    renderPocSimpleList(elements.pocScopeContainer, poc.scope || [], 'scope');
    renderPocSimpleList(elements.pocResourcesContainer, poc.resources || [], 'resources');
    renderPocObjectList(elements.pocStakeholdersContainer, poc.stakeholders || [], 'stakeholders');
    renderPocObjectList(elements.pocSquadContainer, poc.squad || [], 'squad');
    renderPocTimeline(poc.timeline || []);

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
    elements.pocObjective.value = '';
    elements.pocUseCase.value = '';
    elements.pocAssumptions.value = '';
    elements.pocFinancials.value = '';
    elements.pocUrlAcceptance.value = '';
    elements.pocUrlContent.value = '';

    // Reset previews
    document.getElementById('poc-url-acceptance').classList.remove('hidden');
    document.getElementById('poc-url-acceptance-preview').classList.add('hidden');
    document.getElementById('poc-url-content').classList.remove('hidden');
    document.getElementById('poc-url-content-preview').classList.add('hidden');

    renderPocSimpleList(elements.pocScopeContainer, [], 'scope');
    renderPocSimpleList(elements.pocResourcesContainer, [], 'resources');
    renderPocObjectList(elements.pocStakeholdersContainer, [], 'stakeholders');
    renderPocObjectList(elements.pocSquadContainer, [], 'squad');
    renderPocTimeline([]);

    elements.pocDetailModal.classList.remove('hidden');
};

elements.savePocDetailBtn.onclick = async () => {
    const scope = Array.from(elements.pocScopeContainer.querySelectorAll('input')).map(i => i.value).filter(v => v);
    const resources = Array.from(elements.pocResourcesContainer.querySelectorAll('input')).map(i => i.value).filter(v => v);

    const stakeholders = Array.from(elements.pocStakeholdersContainer.querySelectorAll('.list-item-row')).map(row => ({
        name: row.querySelector('.name-input').value,
        role: row.querySelector('.role-input').value
    })).filter(s => s.name);

    const squad = Array.from(elements.pocSquadContainer.querySelectorAll('.list-item-row')).map(row => {
        const name = row.querySelector('.name-input').value;
        if (name) saveResponsible(name);
        return {
            name: name,
            role: row.querySelector('.role-input').value
        };
    }).filter(s => s.name);

    const timeline = Array.from(elements.pocTimelineBody.querySelectorAll('tr')).map(tr => ({
        activity: tr.querySelector('.act').value,
        date: tr.querySelector('.date').value,
        comments: tr.querySelector('.comm').value
    })).filter(t => t.activity);

    const pocData = {
        objective: elements.pocObjective.value,
        useCase: elements.pocUseCase.value,
        scope,
        resources,
        stakeholders,
        squad,
        timeline,
        assumptions: elements.pocAssumptions.value,
        financials: elements.pocFinancials.value,
        acceptanceUrl: elements.pocUrlAcceptance.value,
        contentUrl: elements.pocUrlContent.value
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

function renderPocSimpleList(container, items, type) {
    container.innerHTML = '';
    const renderItems = items.length > 0 ? items : [''];
    renderItems.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'list-item-row';
        row.innerHTML = `
            <input type="text" value="${item}" placeholder="Agregar item...">
            <button type="button" class="remove-item-btn" onclick="removePocListItem(this, '${type}')">&times;</button>
        `;
        container.appendChild(row);
    });
}

function renderPocObjectList(container, items, type) {
    container.innerHTML = '';
    const renderItems = items.length > 0 ? items : [{ name: '', role: '' }];
    renderItems.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'list-item-row';
        const datalist = type === 'squad' ? 'list="responsibles-list"' : '';
        row.innerHTML = `
            <input type="text" class="name-input" value="${item.name || ''}" placeholder="Nombre" ${datalist}>
            <input type="text" class="role-input" value="${item.role || ''}" placeholder="Responsabilidad">
            <button type="button" class="remove-item-btn" onclick="removePocListItem(this, '${type}')">&times;</button>
        `;
        container.appendChild(row);
    });
}

function renderPocTimeline(timeline) {
    elements.pocTimelineBody.innerHTML = '';
    const renderItems = timeline.length > 0 ? timeline : [{ activity: '', date: '', comments: '' }];
    renderItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="activity-input act" value="${item.activity || ''}" placeholder="Milestone"></td>
            <td><input type="date" class="activity-input date" value="${item.date || ''}"></td>
            <td><input type="text" class="activity-input comm" value="${item.comments || ''}" placeholder="..."></td>
            <td><button type="button" class="remove-item-btn" onclick="this.closest('tr').remove()">&times;</button></td>
        `;
        elements.pocTimelineBody.appendChild(tr);
    });
}

window.removePocListItem = (btn, type) => {
    btn.parentElement.remove();
};

document.querySelectorAll('.add-list-item').forEach(btn => {
    btn.onclick = () => {
        const type = btn.getAttribute('data-type');
        let container;
        if (type === 'scope') container = elements.pocScopeContainer;
        if (type === 'resources') container = elements.pocResourcesContainer;
        if (type === 'stakeholders') container = elements.pocStakeholdersContainer;
        if (type === 'squad') container = elements.pocSquadContainer;

        if (type === 'scope' || type === 'resources') {
            const row = document.createElement('div');
            row.className = 'list-item-row';
            row.innerHTML = `<input type="text" placeholder="Agregar item..."><button type="button" class="remove-item-btn" onclick="removePocListItem(this, '${type}')">&times;</button>`;
            container.appendChild(row);
        } else {
            const row = document.createElement('div');
            row.className = 'list-item-row';
            const datalist = type === 'squad' ? 'list="responsibles-list"' : '';
            row.innerHTML = `<input type="text" class="name-input" placeholder="Nombre" ${datalist}><input type="text" class="role-input" placeholder="Responsabilidad"><button type="button" class="remove-item-btn" onclick="removePocListItem(this, '${type}')">&times;</button>`;
            container.appendChild(row);
        }
    };
});

elements.addPocTimelineBtn.onclick = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="activity-input act" placeholder="Milestone"></td>
        <td><input type="date" class="activity-input date"></td>
        <td><input type="text" class="activity-input comm" placeholder="..."></td>
        <td><button type="button" class="remove-item-btn" onclick="this.closest('tr').remove()">&times;</button></td>
    `;
    elements.pocTimelineBody.appendChild(tr);
};

// Front Office Integration Logic
elements.generateFoTicketBtn.onclick = async () => {
    const settings = await window.electronAPI.getSettings();
    const baseUrl = settings.foApiUrl ? settings.foApiUrl.replace(/\/+$/, '') : '';
    // New endpoint for On Demand Document
    const apiUrl = `${baseUrl}/production/v7/onDemandDocument`;
    const apiToken = settings.foApiToken;

    const templatePath = settings.foApiTemplate;

    if (!baseUrl || !apiToken || !templatePath) {
        showToast('Error: Configura la Base URL, API KEY y Plantilla en Ajustes', 'error');
        return;
    }

    const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === activeOppId);
    if (!opp) return;

    if (!elements.pocObjective.value) {
        showToast('Error: El Objetivo de la PoC es obligatorio', 'error');
        return;
    }

    // Helper for Document Generation
    const generateDocument = async (outputType) => {
        const payload = {
            Steps: [{
                name: "Print",
                generate: {
                    template: templatePath,
                    channel: "Print",
                    generateType: "ContentAuthor",
                    outputType: outputType,
                    outputPath: "response://",
                    inputPaths: [{ name: "DataInput", path: "request://" }]
                }
            }],
            data: {
                PoC: [{
                    opportunityName: opp['Opportunity Name'] || activeOppId,
                    objective: elements.pocObjective.value,
                    useCase: elements.pocUseCase.value,
                    scope: Array.from(elements.pocScopeContainer.querySelectorAll('input')).map(i => i.value).filter(v => v),
                    resources: Array.from(elements.pocResourcesContainer.querySelectorAll('input')).map(i => i.value).filter(v => v),
                    stakeholders: Array.from(elements.pocStakeholdersContainer.querySelectorAll('.list-item-row')).map(row => ({
                        name: row.querySelector('.name-input').value,
                        role: row.querySelector('.role-input').value
                    })).filter(s => s.name),
                    squad: Array.from(elements.pocSquadContainer.querySelectorAll('.list-item-row')).map(row => ({
                        name: row.querySelector('.name-input').value,
                        role: row.querySelector('.role-input').value
                    })).filter(s => s.name),
                    timeline: Array.from(elements.pocTimelineBody.querySelectorAll('tr')).map(tr => ({
                        activity: tr.querySelector('.act').value,
                        date: tr.querySelector('.date').value,
                        comments: tr.querySelector('.comm').value
                    })).filter(t => t.activity),
                    assumptions: elements.pocAssumptions.value,
                    financials: elements.pocFinancials.value,
                    acceptanceUrl: elements.pocUrlAcceptance.value,
                    contentUrl: elements.pocUrlContent.value
                }]
            }
        };

        console.log(`Payload (${outputType}):`, JSON.stringify(payload, null, 2));

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiToken.startsWith('Bearer ') ? apiToken : `Bearer ${apiToken}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMsg = response.statusText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMsg = errorJson.title || errorJson.message || errorMsg;
            } catch (e) { }
            throw new Error(errorMsg);
        }
        return await response.blob();
    };

    try {
        elements.generateFoTicketBtn.disabled = true;
        elements.generateFoTicketBtn.textContent = 'Generando...';

        // 1. First, generate PDF for preview
        const pdfBlob = await generateDocument('PDF');
        showToast('Documento generado exitosamente');

        const pdfUrl = URL.createObjectURL(pdfBlob);

        elements.viewFoTicketBtn.classList.remove('hidden');
        elements.downloadDocxBtn.classList.remove('hidden');

        elements.viewFoTicketBtn.onclick = () => {
            elements.ticketIframe.src = pdfUrl;
            elements.ticketViewTitle.textContent = "Previsualización PDF";
            elements.ticketViewUrl.textContent = `PoC_${activeOppId}.pdf`;
            elements.ticketViewModal.classList.remove('hidden');
            elements.ticketIframe.classList.remove('hidden');
        };

        // 2. Logic for DOCX Download
        elements.downloadDocxBtn.onclick = async () => {
            try {
                elements.downloadDocxBtn.disabled = true;
                elements.downloadDocxBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando DOCX...';

                const docxBlob = await generateDocument('DOCX');
                const fileName = `PoC_${activeOppId}_${new Date().getTime()}.docx`;

                const url = window.URL.createObjectURL(docxBlob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                showToast('Descarga iniciada');
            } catch (error) {
                showToast('Error al generar DOCX: ' + error.message, 'error');
            } finally {
                elements.downloadDocxBtn.disabled = false;
                elements.downloadDocxBtn.innerHTML = '<i class="fas fa-file-word"></i> Descargar DOCX';
            }
        };

        // Automatic PDF Preview
        elements.viewFoTicketBtn.click();

    } catch (error) {
        console.error("FO API Error:", error);
        showToast(`Error: ${error.message}`, 'error');
    } finally {
        elements.generateFoTicketBtn.disabled = false;
        elements.generateFoTicketBtn.textContent = 'Generar Documento';
    }
};

// Ticket View Modal Events & Message Passing
window.addEventListener("message", (event) => {
    if (!event.data) return;

    let eventData;
    try {
        eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch (e) {
        return; // Not our message
    }

    if (eventData.source === "InteractivePlusEditor") {
        if (eventData.type === "initialized") {
            // Register with the editor
            elements.ticketIframe.contentWindow.postMessage(JSON.stringify({
                source: "InteractivePlusEditor",
                type: "register"
            }), "*");
        }
        if (eventData.type === "closed") {
            elements.ticketViewModal.classList.add('hidden');
            elements.ticketIframe.src = 'about:blank';
            showToast(`Ticket ${eventData.ticketId || ''} cerrado`);
        }
    }
});

elements.closeTicketViewBtn.onclick = () => {
    elements.ticketViewModal.classList.add('hidden');
    elements.ticketIframe.src = 'about:blank';
};

// RFPs/RFIs Logic
window.openRfp = (oppId) => {
    activeOppId = oppId;
    const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
    if (opp) elements.activitiesOppInfoRfp.textContent = `${opp['Opportunity Name']} (${oppId})`;

    renderRfpTab();
};

function renderRfpTab() {
    const mat = currentConfig.materials[activeOppId] || {};
    const rfp = mat.rfp || { url: '', activities: [] };

    elements.rfpUrl.value = rfp.url || '';
    renderRfpActivities(rfp.activities || []);

    // Trigger preview
    initUrlField(elements.rfpUrl);
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
    elements.rfpActivitiesBody.querySelectorAll('.activity-row-grid').forEach(grid => {
        const resp = grid.querySelector('.resp').value;
        const manualDate = grid.querySelector('.date-input').value;
        saveResponsible(resp);
        activities.push({
            activity: grid.querySelector('.act').value,
            responsible: resp,
            comments: grid.querySelector('.comm').value,
            date: manualDate ? new Date(manualDate).toISOString() : new Date().toISOString()
        });
    });

    if (!currentConfig.materials[activeOppId]) currentConfig.materials[activeOppId] = {};
    currentConfig.materials[activeOppId].rfp = {
        url: elements.rfpUrl.value,
        activities
    };

    await window.electronAPI.saveFile(currentConfig.directory, 'materials.json', currentConfig.materials);
    showToast('RFP guardado');
};

// Demos Logic
window.openDemo = (oppId) => {
    activeOppId = oppId;
    const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
    if (opp) elements.activitiesOppInfoDemo.textContent = `${opp['Opportunity Name']} (${oppId})`;

    renderDemoTab();
};

function renderDemoTab() {
    const mat = currentConfig.materials[activeOppId] || {};
    const demo = mat.demo || { description: '', url: '', activities: [] };

    elements.demoDesc.value = demo.description || '';
    elements.demoUrl.value = demo.url || '';
    renderDemoActivities(demo.activities || []);

    // Trigger preview
    initUrlField(elements.demoUrl);
}

function renderDemoActivities(activities) {
    renderActivityInputs(activities, elements.demoActivitiesBody, 'removeDemoActivity');
}

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
    elements.demoActivitiesBody.querySelectorAll('.activity-row-grid').forEach(grid => {
        const resp = grid.querySelector('.resp').value;
        const manualDate = grid.querySelector('.date-input').value;
        saveResponsible(resp);
        activities.push({
            activity: grid.querySelector('.act').value,
            responsible: resp,
            comments: grid.querySelector('.comm').value,
            date: manualDate ? new Date(manualDate).toISOString() : new Date().toISOString()
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
};

// Helper for generic Activity Inputs
function renderActivityInputs(activities, container, removeFnName) {
    container.innerHTML = '';
    activities.forEach((act, index) => {
        const tr = document.createElement('tr');
        const actDate = act.date ? act.date.split('T')[0] : new Date().toISOString().split('T')[0];
        tr.innerHTML = `
            <td colspan="3">
                <div class="activity-row-grid">
                    <div class="activity-data-col">
                        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.2rem;">Fecha Límite:</div>
                        <input type="date" class="activity-input date-input" value="${actDate}" data-index="${index}" title="Fecha Límite" lang="es-MX">
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

// Deleted renderPocActivities as it's replaced by renderPocTimeline

elements.closePocDetailModalBtn.onclick = () => elements.pocDetailModal.classList.add('hidden');


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

function formatToDDMMYYYY(date) {
    if (!date) return 'Sin fecha';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

async function renderActivityCalendar() {
    const view = currentConfig.calendarView;
    const date = currentConfig.calendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    elements.calendarGrid.innerHTML = '';
    const headerGrid = document.querySelector('.calendar-header-grid');
    headerGrid.innerHTML = '';

    if (view === 'month') {
        elements.currentMonthDisplay.textContent = `${monthNames[month]} ${year}`;
        elements.calendarGrid.className = 'calendar-grid month-view';
        headerGrid.className = 'calendar-header-grid month-view';

        dayNames.forEach(d => {
            const div = document.createElement('div');
            div.textContent = d.substring(0, 3);
            headerGrid.appendChild(div);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            elements.calendarGrid.appendChild(empty);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            renderDayCell(year, month, d);
        }
    } else if (view === 'day') {
        elements.currentMonthDisplay.textContent = `${date.getDate()} ${monthNames[month]} ${year}`;
        elements.calendarGrid.className = 'calendar-grid day-view';
        headerGrid.className = 'calendar-header-grid day-view';

        const div = document.createElement('div');
        div.textContent = dayNames[date.getDay()];
        headerGrid.appendChild(div);

        renderDayCell(year, month, date.getDate());
    } else if (view === 'work-week' || view === 'full-week') {
        elements.calendarGrid.className = `calendar-grid week-view ${view}`;
        headerGrid.className = `calendar-header-grid week-view ${view}`;

        // Find Monday
        const currentDay = date.getDay();
        const diff = date.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);

        const daysToShow = view === 'work-week' ? 5 : 7;

        // Update title to show range
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + (daysToShow - 1));
        elements.currentMonthDisplay.textContent = `${monday.getDate()} ${monthNames[monday.getMonth()]} - ${sunday.getDate()} ${monthNames[sunday.getMonth()]} ${year}`;

        for (let i = 0; i < daysToShow; i++) {
            const current = new Date(monday);
            current.setDate(monday.getDate() + i);

            const div = document.createElement('div');
            div.textContent = dayNames[current.getDay()].substring(0, 3);
            headerGrid.appendChild(div);

            renderDayCell(current.getFullYear(), current.getMonth(), current.getDate());
        }
    }
}

function renderDayCell(year, month, day) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    const today = new Date();
    if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dayCell.classList.add('today');
    }

    dayCell.innerHTML = `<span class="day-number">${day}</span><div class="calendar-events"></div>`;
    const eventContainer = dayCell.querySelector('.calendar-events');

    const dayActivities = getActivityForDay(year, month, day);
    dayActivities.forEach(act => {
        const evBtn = document.createElement('div');
        evBtn.className = `calendar-event event-${act.type}`;
        evBtn.textContent = `${act.type.toUpperCase()}: ${act.activity}`;
        evBtn.title = `${act.oppName}\n${act.activity}\n${act.responsible}`;
        evBtn.onclick = (e) => {
            e.stopPropagation();
            goToOpportunity(act.oppId);
        };
        eventContainer.appendChild(evBtn);
    });

    elements.calendarGrid.appendChild(dayCell);
}

function getActivityForDay(year, month, day) {
    let dayActs = [];
    const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    for (const [oppId, material] of Object.entries(currentConfig.materials)) {
        const opp = currentConfig.opportunities.find(o => o['Opportunity ID'] === oppId);
        const oppName = opp ? opp['Opportunity Name'] : oppId;

        // PoC Activities
        if (material.pocs) {
            material.pocs.forEach(poc => {
                if (poc.activities) {
                    poc.activities.forEach(act => {
                        if (act.date && act.date.split('T')[0] === targetDateStr) {
                            dayActs.push({ ...act, type: 'poc', oppName, oppId });
                        }
                    });
                }
            });
        }
        // RFP Activities
        if (material.rfp && material.rfp.activities) {
            material.rfp.activities.forEach(act => {
                if (act.date && act.date.split('T')[0] === targetDateStr) {
                    dayActs.push({ ...act, type: 'rfp', oppName, oppId });
                }
            });
        }
        // Demo Activities
        if (material.demo && material.demo.activities) {
            material.demo.activities.forEach(act => {
                if (act.date && act.date.split('T')[0] === targetDateStr) {
                    dayActs.push({ ...act, type: 'demo', oppName, oppId });
                }
            });
        }
    }

    // Add Attack Plan Activities
    for (const [accountId, account] of Object.entries(currentConfig.accounts)) {
        if (account.attackPlan && account.attackPlan.activities) {
            const accName = currentConfig.opportunities.find(o => o['Account ID'] === accountId)?.['Account Name'] || accountId;
            account.attackPlan.activities.forEach(act => {
                const actDate = act.startDate || act.date;
                if (actDate && actDate === targetDateStr) {
                    dayActs.push({
                        activity: act.name,
                        responsible: 'Account Plan',
                        comments: act.comments,
                        type: 'attack',
                        oppName: accName,
                        oppId: null // It's at account level
                    });
                }
            });
        }
    }

    return dayActs;
}

// --- Account Attack Plan Management ---
let activeAccountId = null;
let currentAttackPlanData = { licenses: [], activities: [], strategy: '' };

window.openAttackPlan = (accountId) => {
    activeAccountId = accountId;
    const account = currentConfig.accounts[accountId] || {};
    const accountName = currentConfig.opportunities.find(o => o['Account ID'] === accountId)?.['Account Name'] || accountId;

    elements.attackPlanModalTitle.textContent = `Plan de Ataque: ${accountName}`;

    // Load existing data or initialize
    currentAttackPlanData = account.attackPlan ? JSON.parse(JSON.stringify(account.attackPlan)) : {
        licenses: [],
        activities: [],
        strategy: ''
    };

    renderAttackPlanLicenses();
    renderAttackPlanActivities();
    renderAttackTimelineChart();
    elements.attackPlanStrategy.value = currentAttackPlanData.strategy || '';

    elements.attackPlanModal.classList.remove('hidden');
};

function renderAttackPlanLicenses() {
    elements.attackPlanLicensesContainer.innerHTML = '';
    currentAttackPlanData.licenses.forEach((lic, idx) => {
        const div = document.createElement('div');
        div.className = 'list-item-row';
        div.innerHTML = `
            <input type="text" placeholder="Nombre de Licencia" value="${lic.name || ''}" onchange="updateAttackLicense(${idx}, 'name', this.value)">
            <input type="number" placeholder="Volumen" value="${lic.volume || ''}" onchange="updateAttackLicense(${idx}, 'volume', this.value)" style="max-width: 120px;">
            <button class="remove-item-btn" onclick="removeAttackLicense(${idx})">&times;</button>
        `;
        elements.attackPlanLicensesContainer.appendChild(div);
    });
}

window.updateAttackLicense = (idx, field, val) => {
    currentAttackPlanData.licenses[idx][field] = val;
};

window.removeAttackLicense = (idx) => {
    currentAttackPlanData.licenses.splice(idx, 1);
    renderAttackPlanLicenses();
};

elements.addAttackLicenseBtn.onclick = () => {
    currentAttackPlanData.licenses.push({ name: '', volume: '' });
    renderAttackPlanLicenses();
};

// --- Módulo de Actividades (Attack Plan / Timeline) ---
function renderAttackPlanActivities() {
    elements.attackPlanActivitiesBody.innerHTML = '';
    currentAttackPlanData.activities.forEach((act, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="activity-input" value="${act.name || ''}" onchange="updateAttackActivity(${idx}, 'name', this.value)" placeholder="Hito/Actividad"></td>
            <td><input type="date" class="activity-input" value="${act.startDate || act.date || ''}" onchange="updateAttackActivity(${idx}, 'startDate', this.value)"></td>
            <td><input type="date" class="activity-input" value="${act.endDate || ''}" onchange="updateAttackActivity(${idx}, 'endDate', this.value)"></td>
            <td><textarea class="activity-input" onchange="updateAttackActivity(${idx}, 'comments', this.value)" placeholder="Comentarios...">${act.comments || ''}</textarea></td>
            <td style="white-space: nowrap;">
                <button class="add-item-btn-inline" onclick="insertAttackActivity(${idx})" title="Insertar arriba">+</button>
                <button class="remove-item-btn" onclick="removeAttackActivity(${idx})" title="Eliminar">&times;</button>
            </td>
        `;
        elements.attackPlanActivitiesBody.appendChild(tr);
    });
}

function renderAttackTimelineChart() {
    if (!elements.attackPlanTimelineChart) return;
    elements.attackPlanTimelineChart.innerHTML = '';

    const activities = currentAttackPlanData.activities.filter(a => a.startDate);
    if (activities.length === 0) {
        elements.attackPlanTimelineChart.innerHTML = '<p class="sub-text">Define al menos una fecha de inicio para ver el timeline.</p>';
        return;
    }

    // Add central axis
    const axis = document.createElement('div');
    axis.className = 'timeline-axis';
    elements.attackPlanTimelineChart.appendChild(axis);

    // Sort by start date
    activities.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    const minDate = new Date(Math.min(...activities.map(a => new Date(a.startDate))));
    const maxDate = new Date(Math.max(...activities.map(a => new Date(a.endDate || a.startDate))));

    // Add small buffer to dates for better visualization
    const buffer = (maxDate - minDate) * 0.1 || 86400000; // 10% buffer or 1 day
    const chartStart = new Date(minDate.getTime() - buffer);
    const chartEnd = new Date(maxDate.getTime() + buffer);
    const totalDuration = chartEnd - chartStart;

    activities.forEach((act, idx) => {
        const start = new Date(act.startDate);
        const position = ((start - chartStart) / totalDuration) * 100;

        const verticalLevels = ['milestone-top-far', 'milestone-bottom-near', 'milestone-top-near', 'milestone-bottom-far'];
        const milestoneClass = verticalLevels[idx % 4];

        const milestone = document.createElement('div');
        milestone.className = `timeline-milestone ${milestoneClass}`;
        milestone.style.left = `${Math.min(Math.max(position, 5), 95)}%`;

        const safeDate = (ds) => ds ? new Date(ds.replace(/-/g, '/')).toLocaleDateString() : '';
        const startDateStr = safeDate(act.startDate);
        const endDateStr = safeDate(act.endDate);

        const displayDate = (act.endDate && act.startDate !== act.endDate)
            ? `${startDateStr} - ${endDateStr}`
            : startDateStr;

        milestone.innerHTML = `
            <div class="milestone-content">
                <div class="milestone-date">${displayDate}</div>
                <h5>${act.name || 'Hito'}</h5>
                <div class="milestone-desc">${act.comments || ''}</div>
            </div>
            <div class="milestone-dot" title="${act.name}: ${startDateStr}${endDateStr ? ' al ' + endDateStr : ''}"></div>
        `;

        elements.attackPlanTimelineChart.appendChild(milestone);
    });
}

window.updateAttackActivity = (idx, field, val) => {
    currentAttackPlanData.activities[idx][field] = val;
    renderAttackTimelineChart();
};

window.removeAttackActivity = (idx) => {
    currentAttackPlanData.activities.splice(idx, 1);
    renderAttackPlanActivities();
    renderAttackTimelineChart();
};

window.insertAttackActivity = (idx) => {
    currentAttackPlanData.activities.splice(idx, 0, { name: '', startDate: '', endDate: '', comments: '' });
    renderAttackPlanActivities();
    renderAttackTimelineChart();
};

elements.addAttackActivityBtn.onclick = () => {
    currentAttackPlanData.activities.push({ name: '', startDate: '', endDate: '', comments: '' });
    renderAttackPlanActivities();
    renderAttackTimelineChart();
};

elements.saveAttackPlanBtn.onclick = async () => {
    if (!activeAccountId) return;

    if (!currentConfig.accounts[activeAccountId]) {
        currentConfig.accounts[activeAccountId] = { category: '', lastUpdated: new Date().toISOString() };
    }

    currentAttackPlanData.strategy = elements.attackPlanStrategy.value;
    currentConfig.accounts[activeAccountId].attackPlan = currentAttackPlanData;

    await window.electronAPI.saveFile(currentConfig.directory, 'accounts.json', currentConfig.accounts);
    showToast('Plan de Ataque guardado correctamente');
    elements.attackPlanModal.classList.add('hidden');
    renderOpportunities();
};

elements.closeAttackPlanModalBtn.onclick = () => {
    elements.attackPlanModal.classList.add('hidden');
};

// --- Account Contacts Management ---
let currentContactsData = [];

window.openAccountContacts = (accountId) => {
    activeAccountId = accountId;
    const account = currentConfig.accounts[accountId] || {};
    const accountName = currentConfig.opportunities.find(o => o['Account ID'] === accountId)?.['Account Name'] || accountId;

    elements.accountContactsModalTitle.textContent = `Contactos: ${accountName}`;

    // Load existing data or initialize
    currentContactsData = account.contacts ? JSON.parse(JSON.stringify(account.contacts)) : [];

    renderAccountContacts();
    elements.accountContactsModal.classList.remove('hidden');
};

function renderAccountContacts() {
    elements.accountContactsBody.innerHTML = '';
    currentContactsData.forEach((contact, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="activity-input" value="${contact.name || ''}" onchange="updateAccountContact(${idx}, 'name', this.value)" placeholder="Nombre"></td>
            <td><input type="text" class="activity-input" value="${contact.position || ''}" onchange="updateAccountContact(${idx}, 'position', this.value)" placeholder="Posición"></td>
            <td><input type="email" class="activity-input" value="${contact.email || ''}" onchange="updateAccountContact(${idx}, 'email', this.value)" placeholder="Email"></td>
            <td><input type="text" class="activity-input" value="${contact.phone || ''}" onchange="updateAccountContact(${idx}, 'phone', this.value)" placeholder="Teléfono"></td>
            <td>
                <select class="activity-input" onchange="updateAccountContact(${idx}, 'influence', this.value)">
                    <option value="Bajo" ${contact.influence === 'Bajo' ? 'selected' : ''}>Bajo</option>
                    <option value="Medio" ${contact.influence === 'Medio' ? 'selected' : ''}>Medio</option>
                    <option value="Alto" ${contact.influence === 'Alto' ? 'selected' : ''}>Alto</option>
                    <option value="Crítico" ${contact.influence === 'Crítico' ? 'selected' : ''}>Crítico</option>
                </select>
            </td>
            <td><textarea class="activity-input" onchange="updateAccountContact(${idx}, 'notes', this.value)" placeholder="Notas...">${contact.notes || ''}</textarea></td>
            <td><button class="remove-item-btn" onclick="removeAccountContact(${idx})">&times;</button></td>
        `;
        elements.accountContactsBody.appendChild(tr);
    });
}

window.updateAccountContact = (idx, field, val) => {
    currentContactsData[idx][field] = val;
};

window.removeAccountContact = (idx) => {
    currentContactsData.splice(idx, 1);
    renderAccountContacts();
};

elements.addAccountContactBtn.onclick = () => {
    currentContactsData.push({ name: '', position: '', email: '', phone: '', influence: 'Medio', notes: '' });
    renderAccountContacts();
};

elements.saveAccountContactsBtn.onclick = async () => {
    if (!activeAccountId) return;

    if (!currentConfig.accounts[activeAccountId]) {
        currentConfig.accounts[activeAccountId] = { category: '', lastUpdated: new Date().toISOString() };
    }

    currentConfig.accounts[activeAccountId].contacts = currentContactsData;

    await window.electronAPI.saveFile(currentConfig.directory, 'accounts.json', currentConfig.accounts);
    showToast('Contactos guardados correctamente');
    elements.accountContactsModal.classList.add('hidden');
};

elements.closeAccountContactsModalBtn.onclick = () => {
    elements.accountContactsModal.classList.add('hidden');
};

function renderGlobalContacts() {
    elements.globalContactsBody.innerHTML = '';
    const query = elements.globalContactsSearchInput.value.toLowerCase().trim();

    let allContacts = [];
    for (const [accountId, account] of Object.entries(currentConfig.accounts)) {
        if (account.contacts && account.contacts.length > 0) {
            const accountName = currentConfig.opportunities.find(o => o['Account ID'] === accountId)?.['Account Name'] || accountId;
            account.contacts.forEach(contact => {
                allContacts.push({ ...contact, accountId, accountName });
            });
        }
    }

    // Filter
    if (query) {
        allContacts = allContacts.filter(c =>
            (c.name || '').toLowerCase().includes(query) ||
            (c.position || '').toLowerCase().includes(query) ||
            (c.email || '').toLowerCase().includes(query) ||
            (c.accountName || '').toLowerCase().includes(query)
        );
    }

    allContacts.forEach(contact => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${contact.name || ''}</td>
            <td>${contact.position || ''}</td>
            <td>${contact.email || ''}</td>
            <td>${contact.phone || ''}</td>
            <td><span class="badge badge-${(contact.influence || 'Medio').toLowerCase()}">${contact.influence || 'Medio'}</span></td>
            <td><strong>${contact.accountName}</strong></td>
            <td>${contact.notes || ''}</td>
        `;
        elements.globalContactsBody.appendChild(tr);
    });
}

elements.globalContactsSearchInput.addEventListener('input', renderGlobalContacts);

function renderAccountsWithPlan() {
    elements.accountsWithPlanList.innerHTML = '';

    const accountsWithPlan = Object.entries(currentConfig.accounts).filter(([id, acc]) => acc.attackPlan);

    if (accountsWithPlan.length === 0) {
        elements.accountsWithPlanList.innerHTML = '<p class="sub-text">No hay cuentas con plan de ataque definido.</p>';
        return;
    }

    accountsWithPlan.forEach(([accountId, account]) => {
        const accountName = currentConfig.opportunities.find(o => o['Account ID'] === accountId)?.['Account Name'] || accountId;
        const lastAct = account.attackPlan.activities && account.attackPlan.activities.length > 0 ?
            account.attackPlan.activities[account.attackPlan.activities.length - 1] : null;

        const card = document.createElement('div');
        card.className = 'card settings-card';
        card.style.margin = '0';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <h3 style="margin: 0;">🏢 ${accountName}</h3>
                <button class="primary-btn small" onclick="openAttackPlan('${accountId}')">Ver Plan</button>
            </div>
            <div class="sub-text" style="margin-bottom: 1rem;">
                <strong>Estrategia:</strong> ${account.attackPlan.strategy ? account.attackPlan.strategy.substring(0, 100) + '...' : 'Sin estrategia definida'}
            </div>
            ${lastAct ? `
                <div style="font-size: 0.8rem; border-top: 1px solid var(--glass-border); padding-top: 0.5rem;">
                    <strong>Última/Próxima Actividad:</strong> ${lastAct.name} (${lastAct.date})
                </div>
            ` : ''}
        `;
        elements.accountsWithPlanList.appendChild(card);
    });
}

initUrlField('poc-url-acceptance');
initUrlField('poc-url-content');
initUrlField('rfp-url');
initUrlField('demo-url');

init();
