import re
import os

file_path = r'c:\AntigravityDEV\Presales\renderer.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all function definitions
# function name(...)
# window.name = (...)
# const name = (...) =>
defs = set(re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', content))
defs.update(re.findall(r'window\.([a-zA-Z0-9_]+)\s*=', content))
defs.update(re.findall(r'(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>', content))

# Find all function calls
# name(...) - but avoid keywords and built-ins
calls = set(re.findall(r'([a-zA-Z0-9_]+)\s*\(', content))

# Common JS keywords and built-ins to ignore
ignore = {
    'if', 'for', 'while', 'switch', 'catch', 'parseInt', 'parseFloat', 'isNaN', 
    'fetch', 'alert', 'confirm', 'prompt', 'setTimeout', 'clearTimeout', 
    'setInterval', 'clearInterval', 'decodeURIComponent', 'encodeURIComponent',
    'String', 'Number', 'Date', 'Array', 'Object', 'JSON', 'RegExp', 'Map', 'Set',
    'Math', 'console', 'window', 'document', 'navigator', 'location', 'history',
    'Intl', 'URL', 'Blob', 'FileReader', 'Papa', 'showScreen', 'showView', 'initUrlField', 'saveMaterials',
    'showToast', 'saveResponsible', 'updateResponsiblesList', 'formatToDDMMYYYY', 'parseCustomDate',
    'updateStageSubmenu', 'goToOpportunity', 'applyTemplate', 'applyFormula', 'createLinkIfPossible',
    'updateHeaderInfo', 'renderOpportunities', 'loadAllData', 'handleNewDirectory', 'finalizeDirChange',
    'renderManagerView', 'autoSaveManager', 'openDocPath', 'applyTheme', 'downloadSampleCSV',
    'renderResources', 'openResourceModal', 'deleteResource', 'applyLanguage', 'getTranslation',
    'fillUserForm', 'getOpportunityUrl', 'getAccountUrl', 'processCsvImport', 'showCsvMappingModal',
    'renderStructureEditor', 'formatValue', 'populateMeddContacts', 'renderMeddItems', 'loadMeddpicc',
    'openDetails', 'renderAssessmentTab', 'renderAssessmentQuestions', 'updateAssessmentMaterialsFromUI',
    'renderAssessmentStructureEditor', 'renderNotes', 'openPocs', 'renderPocsList', 'renderPocSimpleList',
    'renderPocObjectList', 'renderPocTimeline', 'renderActivityCalendar', 'renderDayAgenda', 'renderDayCell',
    'getActivityForDay', 'openAttackPlan', 'renderAttackPlanLicenses', 'renderAttackPlanActivities',
    'renderAttackTimelineChart', 'insertAttackActivity', 'updateAttackActivity', 'renderAccountContacts',
    'renderGlobalContacts', 'openAccountContacts', 'renderGlobalNotesHistory', 'updateNotificationBadge',
    'updateMeddItem', 'removeMeddItem', 'editNote', 'saveEditedNote', 'deleteNote', 'editPoc', 'deletePoc',
    'removePocListItem', 'openRfp', 'renderRfpTab', 'renderRfpActivities', 'openDemo', 'renderDemoTab',
    'renderWalkthroughList', 'removeWalkthroughStep', 'renderDemoActivities', 'renderActivityInputs',
    'evaluateRuleGroup', 'evaluateRule', 'handleExternalLink', 'moveStructureItem', 'moveAttackActivity',
    'saveAttackPlan', 'saveAccountContacts', 'addAccountContact', 'deleteAccountContact', 'updateAccountContact',
    'addGlobalContact', 'deleteGlobalContact', 'updateGlobalContact', 'addAttackLicense', 'removeAttackLicense',
    'updateAttackLicense', 'addAttackActivity', 'removeAttackActivity', 'renderActivityInputs'
}

# Add defs to ignore
ignore.update(defs)

missing = [c for c in calls if c not in ignore and not c.startswith('_')]

print("Potential missing functions:")
for m in sorted(set(missing)):
    print(m)
