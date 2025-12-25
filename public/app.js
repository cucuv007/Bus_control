// DOM Elements
const uploadBtn = document.getElementById('uploadBtn');
const refreshBtn = document.getElementById('refreshBtn');
const approveBtn = document.getElementById('approveBtn');
const statusEl = document.getElementById('status');
const theadRow = document.getElementById('theadRow');
const tbody = document.getElementById('tbody');
const meta = document.getElementById('meta');

// Timer elements
const timerContainer = document.getElementById('timerContainer');
const timerDisplay = document.getElementById('timerDisplay');
const timerPrevTime = document.getElementById('timerPrevTime');
const timerNextTime = document.getElementById('timerNextTime');
const timerHatAdi = document.getElementById('timerHatAdi');
const timerPlaka = document.getElementById('timerPlaka');
const timerTarife = document.getElementById('timerTarife');
const timerHareket = document.getElementById('timerHareket');
const timerDurum = document.getElementById('timerDurum');
const closeTimerBtn = document.getElementById('closeTimerBtn');
const dynamicTrackingCheckbox = document.getElementById('dynamicTrackingCheckbox');
const reopenTimerIcon = document.getElementById('reopenTimerIcon');

// Boş/Dolu elements
const bosDoluContainer = document.getElementById('bosDoluContainer');
const bosDoluCheckbox = document.getElementById('bosDoluCheckbox');
const closeBosDoluBtn = document.getElementById('closeBosDoluBtn');
const bosDoluList = document.getElementById('bosDoluList');

// Scroll buttons
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const scrollToTimerRowBtn = document.getElementById('scrollToTimerRowBtn');

// Approval modal elements
const approvalModal = document.getElementById('approvalModal');
const closeApprovalModal = document.getElementById('closeApprovalModal');
const approvalHat = document.getElementById('approvalHat');
const approvalTarife = document.getElementById('approvalTarife');
const approvalTime = document.getElementById('approvalTime');
const approvalModalTitle = document.getElementById('approvalModalTitle');
const approvalQuestion = document.getElementById('approvalQuestion');
const cancelApprovalBtn = document.getElementById('cancelApprovalBtn');
const confirmApprovalBtn = document.getElementById('confirmApprovalBtn');

// Mode switch - now controlled by user's Görev from session
const modeSwitch = document.getElementById('modeSwitch');
let currentMode = 'depolama'; // Will be set from session

// Get current mode from user session
function getCurrentModeFromSession() {
  const userSession = localStorage.getItem('userSession');
  if (userSession) {
    const session = JSON.parse(userSession);
    if (session.gorev === 'Operasyon') {
      return 'operasyon';
    } else if (session.gorev === 'Depolama') {
      return 'depolama';
    }
  }
  return 'depolama'; // Default
}

// Set initial mode from session
currentMode = getCurrentModeFromSession();
console.log('🎯 Kullanıcı görevine göre mod ayarlandı:', currentMode);

// Modal elements
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const confirmUploadBtn = document.getElementById('confirmUploadBtn');

// Step elements
const step1 = document.getElementById('step1');
const step2Auto = document.getElementById('step2Auto');
const step2Manual = document.getElementById('step2Manual');
const step3 = document.getElementById('step3');

const methodAutoBtn = document.getElementById('methodAutoBtn');
const methodManualBtn = document.getElementById('methodManualBtn');
const methodStatus = document.getElementById('methodStatus');

const listFilesBtn = document.getElementById('listFilesBtn');
const listStatus = document.getElementById('listStatus');
const filesList = document.getElementById('filesList');
const selectStatus = document.getElementById('selectStatus');
const uploadStatus = document.getElementById('uploadStatus');
const fileSearchInput = document.getElementById('fileSearchInput');
const selectAllCheckbox = document.getElementById('selectAllCheckbox');

const manualFileInput = document.getElementById('manualFileInput');
const manualStatus = document.getElementById('manualStatus');
const uploadTypeHatBtn = document.getElementById('uploadTypeHatBtn');
const uploadTypePlakaBtn = document.getElementById('uploadTypePlakaBtn');
const uploadTypeDepolamaBtn = document.getElementById('uploadTypeDepolamaBtn');
const manualFileInputGroup = document.getElementById('manualFileInputGroup');
const manualFileLabel = document.getElementById('manualFileLabel');
const manualFileHint = document.getElementById('manualFileHint');

// Table & Movement selection
const tableSelection = document.getElementById('tableSelection');
const tableSelect = document.getElementById('tableSelect');
const hareketSelect = document.getElementById('hareketSelect');

// Depolama filter elements
const depolamaCheckboxList = document.getElementById('depolamaCheckboxList');
const selectAllDepolama = document.getElementById('selectAllDepolama');
const applyDepolamaFilter = document.getElementById('applyDepolamaFilter');

// Hat selection elements
const hatSelectionContainer = document.getElementById('hatSelectionContainer');
const hatCheckboxList = document.getElementById('hatCheckboxList');
const selectAllHats = document.getElementById('selectAllHats');
const applyHatSelection = document.getElementById('applyHatSelection');
const refreshHatsBtn = document.getElementById('refreshHatsBtn');
const setDangerTimeBtn = document.getElementById('setDangerTime');
const dangerTimeInput = document.getElementById('dangerTimeInput');

// VTS elements
const runVtsUpdateBtn = document.getElementById('runVtsUpdateBtn');
const vtsStatus = document.getElementById('vtsStatus');

// State variables
let selectedFiles = [];
let currentTable = null;
let currentHareket = null;
let dangerTimesCache = {}; // Cache for danger times
let isLoading = false;
let allFiles = [];
let uploadMethod = null;
let uploadType = null; // 'hat' or 'plaka'
let timerInterval = null;
let lastBusTime = null;
let selectedDepolamaTables = []; // Seçilen depolama tabloları
let filteredHats = []; // Depolama'dan gelen hat listesi
let availableHats = []; // Mevcut tüm hatlar (dropdown'daki)
let selectedHats = []; // Timer takibi için seçilen hatlar
let currentTimerRow = null; // Timer'da gösterilen satır verisi
let currentBusList = []; // Aynı saatteki tüm otobüsler
let currentBusIndex = 0; // Slide index
let slideInterval = null; // Slide timer
let highlightedRows = []; // Vurgulanan satırlar (çoklu otobüs için)
let timerClosedManually = false; // Timer kullanıcı tarafından manuel kapatıldı mı?
let highlightTimeout = null; // Renklendirme timeout'u (2 saniye için)
let isManualHighlight = false; // Scroll butonu ile manuel renklendirme yapıldı mı?
let isClosingTimer = false; // Timer kapatılıyor mu? (debounce için)
let pendingApprovalData = null; // Onay bekleyen satır verisi
let tableRefreshInterval = null; // Tablo otomatik yenileme interval'i
let selectedHatsForTracking = []; // Timer için seçili hatlar (yenileme için)
let selectedHareketForTracking = null; // Timer için seçili hareket tipi (yenileme için)
let aciklamaCache = {}; // Açıklama kontrolü cache'i
let showOnlyArizali = false; // Sadece arızalı göster filtresi
let showOnlyDegisen = false; // Değişen araçları göster filtresi

// ==================== EVENT LISTENERS ====================
uploadBtn.addEventListener('click', openUploadModal);
refreshBtn.addEventListener('click', handleRefresh);

// Add User Modal
const addUserBtn = document.getElementById('addUserBtn');
const addUserModal = document.getElementById('addUserModal');
const cancelAddUser = document.getElementById('cancelAddUser');
const confirmAddUser = document.getElementById('confirmAddUser');
const addUserStatus = document.getElementById('addUserStatus');

// Mode buttons
const addUserModeBtn = document.getElementById('addUserModeBtn');
const updateUserModeBtn = document.getElementById('updateUserModeBtn');
const deleteUserModeBtn = document.getElementById('deleteUserModeBtn');
const listUserModeBtn = document.getElementById('listUserModeBtn');

// Filter and dropdowns
const filterGorev = document.getElementById('filterGorev');
const existingUserSelect = document.getElementById('existingUserSelect');
const existingUserDropdown = document.getElementById('existingUserDropdown');
const userListContainer = document.getElementById('userListContainer');
const addUserFormContainer = document.getElementById('addUserFormContainer');

let currentUserMode = 'add'; // 'add', 'update', 'delete', 'list'

// Mode button event listeners
if (addUserModeBtn) addUserModeBtn.addEventListener('click', () => setUserMode('add'));
if (updateUserModeBtn) updateUserModeBtn.addEventListener('click', () => setUserMode('update'));
if (deleteUserModeBtn) deleteUserModeBtn.addEventListener('click', () => setUserMode('delete'));
if (listUserModeBtn) listUserModeBtn.addEventListener('click', () => setUserMode('list'));

// Filter görev değiştiğinde
if (filterGorev) {
  filterGorev.addEventListener('change', async () => {
    if (currentUserMode === 'list') {
      await loadUserList();
    } else if (currentUserMode === 'update' || currentUserMode === 'delete') {
      await loadUserDropdown();
    }
  });
}

// Mevcut kullanıcı seçildiğinde
if (existingUserSelect) {
  existingUserSelect.addEventListener('change', () => {
    const username = existingUserSelect.value;
    if (username && currentUserMode === 'update') {
      // Kullanıcı adını input'a doldur
      document.getElementById('newUsername').value = username;
      document.getElementById('newUsername').disabled = true;
    }
  });
}

// Add User butonu için event listener sadece Admin için eklenecek
// Admin olmayanlar için code.html'de onclick ile şifre değiştirme atanıyor
if (addUserBtn) {
  // Session kontrolü yap
  const userSession = localStorage.getItem('userSession');
  if (userSession) {
    const session = JSON.parse(userSession);
    // Sadece Admin ise Kullanıcı Ekle modalını aç
    if (session.gorev === 'Admin') {
      addUserBtn.addEventListener('click', openAddUserModal);
    }
  }
}
if (cancelAddUser) {
  cancelAddUser.addEventListener('click', closeAddUserModal);
}
if (confirmAddUser) {
  confirmAddUser.addEventListener('click', handleUserAction);
}

// Change Password Modal
const changePasswordModal = document.getElementById('changePasswordModal');
const cancelChangePassword = document.getElementById('cancelChangePassword');
const confirmChangePassword = document.getElementById('confirmChangePassword');
const changePasswordStatus = document.getElementById('changePasswordStatus');

if (cancelChangePassword) {
  cancelChangePassword.addEventListener('click', closeChangePasswordModal);
}
if (confirmChangePassword) {
  confirmChangePassword.addEventListener('click', handleChangePassword);
}

// Açıklama Modal
const aciklamaModal = document.getElementById('aciklamaModal');
const cancelAciklama = document.getElementById('cancelAciklama');
const confirmAciklama = document.getElementById('confirmAciklama');
const aciklamaStatus = document.getElementById('aciklamaStatus');
const aciklamaEkleFromPopup = document.getElementById('aciklamaEkleFromPopup');
const aracDegistirFromPopup = document.getElementById('aracDegistirFromPopup');

let selectedRowForAciklama = null;

if (cancelAciklama) {
  cancelAciklama.addEventListener('click', closeAciklamaModal);
}
if (confirmAciklama) {
  confirmAciklama.addEventListener('click', handleAddAciklama);
}
// Popup içindeki Açıklama Ekle butonu - Inline formu göster/gizle
if (aciklamaEkleFromPopup) {
  aciklamaEkleFromPopup.addEventListener('click', () => {
    const inlineForm = document.getElementById('aciklamaFormInline');
    const aciklamaTextInline = document.getElementById('aciklamaTextInline');
    
    if (inlineForm.style.display === 'none') {
      // Arızalı formunu kapat (mutual exclusion)
      const arizaliForm = document.getElementById('arizaliAciklamaForm');
      const confirmBtn = document.getElementById('confirmApprovalBtn');
      const approvalQuestion = document.getElementById('approvalQuestion');
      if (arizaliForm) arizaliForm.style.display = 'none';
      if (confirmBtn && currentMode === 'operasyon') {
        confirmBtn.innerHTML = '⚠️ Arızalı Olarak Işaretle';
        confirmBtn.style.background = '#e74c3c';
      }
      if (approvalQuestion && currentMode === 'operasyon') {
        approvalQuestion.textContent = '⚠️ Arızalı Olarak İşaretle butonuna basarak arıza kaydı ekleyebilirsiniz.';
      }
      
      // Araç Değiştir formunu kapat
      const aracDegistirForm = document.getElementById('aracDegistirFormInline');
      const aracDegistirBtn = document.getElementById('aracDegistirFromPopup');
      if (aracDegistirForm) aracDegistirForm.style.display = 'none';
      if (aracDegistirBtn) {
        aracDegistirBtn.textContent = '🚗 Araç Değiştir';
        aracDegistirBtn.style.background = 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)';
      }
      
      // Formu göster
      inlineForm.style.display = 'block';
      aciklamaEkleFromPopup.textContent = '❌ Açıklama Formunu Kapat';
      aciklamaEkleFromPopup.style.background = '#95a5a6';
      aciklamaTextInline.value = '';
      document.getElementById('aciklamaStatusInline').style.display = 'none';
    } else {
      // Formu gizle
      inlineForm.style.display = 'none';
      aciklamaEkleFromPopup.textContent = '📝 Açıklama Ekle';
      aciklamaEkleFromPopup.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  });
}

// Popup içindeki Araç Değiştir butonu - Inline formu göster/gizle
if (aracDegistirFromPopup) {
  aracDegistirFromPopup.addEventListener('click', () => {
    const inlineForm = document.getElementById('aracDegistirFormInline');
    const yeniPlakaInput = document.getElementById('yeniPlakaInput');
    const aracDegistirAciklama = document.getElementById('aracDegistirAciklama');
    
    if (inlineForm.style.display === 'none') {
      // Arızalı formunu kapat (mutual exclusion)
      const arizaliForm = document.getElementById('arizaliAciklamaForm');
      const confirmBtn = document.getElementById('confirmApprovalBtn');
      const approvalQuestion = document.getElementById('approvalQuestion');
      if (arizaliForm) arizaliForm.style.display = 'none';
      if (confirmBtn && currentMode === 'operasyon') {
        confirmBtn.innerHTML = '⚠️ Arızalı Olarak Işaretle';
        confirmBtn.style.background = '#e74c3c';
      }
      if (approvalQuestion && currentMode === 'operasyon') {
        approvalQuestion.textContent = '⚠️ Arızalı Olarak İşaretle butonuna basarak arıza kaydı ekleyebilirsiniz.';
      }
      
      // Açıklama Ekle formunu kapat
      const aciklamaForm = document.getElementById('aciklamaFormInline');
      const aciklamaBtn = document.getElementById('aciklamaEkleFromPopup');
      if (aciklamaForm) aciklamaForm.style.display = 'none';
      if (aciklamaBtn) {
        aciklamaBtn.textContent = '📝 Açıklama Ekle';
        aciklamaBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
      
      // Formu göster
      inlineForm.style.display = 'block';
      aracDegistirFromPopup.textContent = '❌ Formu Kapat';
      aracDegistirFromPopup.style.background = '#95a5a6';
      yeniPlakaInput.value = '';
      aracDegistirAciklama.value = '';
      document.getElementById('aracDegistirStatus').style.display = 'none';
    } else {
      // Formu gizle
      inlineForm.style.display = 'none';
      aracDegistirFromPopup.textContent = '🚗 Araç Değiştir';
      aracDegistirFromPopup.style.background = 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)';
    }
  });
}

// Inline Açıklama Ekle butonu
const confirmAciklamaInline = document.getElementById('confirmAciklamaInline');
if (confirmAciklamaInline) {
  confirmAciklamaInline.addEventListener('click', handleAddAciklamaInline);
}

// Inline Araç Değiştir butonu
const confirmAracDegistir = document.getElementById('confirmAracDegistir');
if (confirmAracDegistir) {
  confirmAracDegistir.addEventListener('click', handleAracDegistir);
}

// Açıklama İnceleme Modal
const inceleAciklamaBtn = document.getElementById('inceleAciklamaBtn');
const aciklamaInceleModal = document.getElementById('aciklamaInceleModal');
const closeAciklamaInceleModal = document.getElementById('closeAciklamaInceleModal');
const closeAciklamaInceleBtn = document.getElementById('closeAciklamaInceleBtn');
const exportAciklamaExcel = document.getElementById('exportAciklamaExcel');
const gorevSelectCombo = document.getElementById('gorevSelectCombo');
const sistemiGuncelleBtn = document.getElementById('sistemiGuncelleBtn');

if (inceleAciklamaBtn) {
  inceleAciklamaBtn.addEventListener('click', openAciklamaInceleModal);
}
if (closeAciklamaInceleModal) {
  closeAciklamaInceleModal.addEventListener('click', closeAciklamaInceleModalFunc);
}
if (closeAciklamaInceleBtn) {
  closeAciklamaInceleBtn.addEventListener('click', closeAciklamaInceleModalFunc);
}
if (exportAciklamaExcel) {
  exportAciklamaExcel.addEventListener('click', exportAciklamaToExcel);
}
if (gorevSelectCombo) {
  gorevSelectCombo.addEventListener('change', () => loadAciklamaData());
}
if (sistemiGuncelleBtn) {
  sistemiGuncelleBtn.addEventListener('click', handleSistemiGuncelle);
}

// Satır Açıklama Modal
const rowAciklamaModal = document.getElementById('rowAciklamaModal');
const closeRowAciklamaModal = document.getElementById('closeRowAciklamaModal');
const closeRowAciklamaBtn = document.getElementById('closeRowAciklamaBtn');

if (closeRowAciklamaModal) {
  closeRowAciklamaModal.addEventListener('click', closeRowAciklamaModalFunc);
}
if (closeRowAciklamaBtn) {
  closeRowAciklamaBtn.addEventListener('click', closeRowAciklamaModalFunc);
}

// Arızalı Filtresi Checkbox
// Arızalı Araçlar Filtresi Checkbox
const arizaliFilterCheckbox = document.getElementById('arizaliFilterCheckbox');
if (arizaliFilterCheckbox) {
  // Checkbox change event'i
  arizaliFilterCheckbox.addEventListener('change', (e) => {
    console.log('🔧 Checkbox change event başladı');
    e.stopPropagation();
    showOnlyArizali = e.target.checked;
    console.log('🔧 Arızalı filtresi:', showOnlyArizali ? 'Aktif' : 'Pasif');
    console.log('🔧 Timer container display:', timerContainer.style.display);
    applyTableFilter();
    console.log('🔧 Checkbox change event bitti, timer display:', timerContainer.style.display);
  });
  
  // Checkbox'a tıklandığında event propagation'ı durdur
  arizaliFilterCheckbox.addEventListener('click', (e) => {
    console.log('🔧 Checkbox click event');
    e.stopPropagation();
  });
  
  // Label'a tıklandığında da durdur
  const filterLabel = arizaliFilterCheckbox.closest('label');
  if (filterLabel) {
    filterLabel.addEventListener('click', (e) => {
      console.log('🔧 Label click event');
      e.stopPropagation();
    });
  }
}

// Değişen Araçlar Filtresi Checkbox
const degişenFilterCheckbox = document.getElementById('degişenFilterCheckbox');
if (degişenFilterCheckbox) {
  // Checkbox change event'i
  degişenFilterCheckbox.addEventListener('change', (e) => {
    console.log('💬 Değişen checkbox change event başladı');
    console.log('💬 e.target.checked:', e.target.checked);
    console.log('💬 degişenFilterCheckbox.checked (before):', degişenFilterCheckbox.checked);
    e.stopPropagation();
    showOnlyDegisen = e.target.checked;
    console.log('💬 showOnlyDegisen değeri:', showOnlyDegisen);
    console.log('💬 Timer container display:', timerContainer.style.display);
    applyTableFilter();
    console.log('💬 degişenFilterCheckbox.checked (after filter):', degişenFilterCheckbox.checked);
    console.log('💬 Değişen checkbox change event bitti, timer display:', timerContainer.style.display);
    
    // 100ms sonra tekrar kontrol et
    setTimeout(() => {
      console.log('💬 100ms sonra checkbox durumu:', degişenFilterCheckbox.checked);
      console.log('💬 100ms sonra showOnlyDegisen:', showOnlyDegisen);
    }, 100);
  });
  
  // Checkbox'a tıklandığında event propagation'ı durdur
  degişenFilterCheckbox.addEventListener('click', (e) => {
    console.log('💬 Değişen checkbox click event');
    console.log('💬 Click - checked:', degişenFilterCheckbox.checked);
    e.stopPropagation();
  });
  
  // Label'a tıklandığında da durdur
  const filterLabel = degişenFilterCheckbox.closest('label');
  if (filterLabel) {
    filterLabel.addEventListener('click', (e) => {
      console.log('💬 Değişen label click event');
      e.stopPropagation();
    });
  }
}

// Boş/Dolu checkbox event listener
if (bosDoluCheckbox) {
  bosDoluCheckbox.addEventListener('change', (e) => {
    e.stopPropagation();
    if (e.target.checked) {
      // Checkbox seçildi, boş araçları bul ve göster
      findAndShowBosAraclar();
    } else {
      // Checkbox kaldırıldı, popup'ı kapat
      closeBosDoluPopup();
    }
  });
  
  bosDoluCheckbox.addEventListener('click', (e) => {
    e.stopPropagation();
  });
}

// Boş/Dolu popup kapatma butonu
if (closeBosDoluBtn) {
  closeBosDoluBtn.addEventListener('click', () => {
    closeBosDoluPopup();
    if (bosDoluCheckbox) bosDoluCheckbox.checked = false;
  });
}

// Tabloyu filtreleme fonksiyonu (timer yenileme kullanmadan)
function applyTableFilter() {
  const allRows = tbody.querySelectorAll('tr');
  const headerCells = theadRow.querySelectorAll('th');
  const headers = Array.from(headerCells).map(th => th.textContent.trim());
  const plakaIndex = headers.indexOf('Plaka');
  
  allRows.forEach(row => {
    let shouldShow = true;
    
    // Arızalı filtresi kontrolü
    if (showOnlyArizali) {
      const cells = row.querySelectorAll('td');
      let hasDurum = false;
      
      cells.forEach(cell => {
        const text = cell.textContent || '';
        if (text.toLowerCase().includes('arızalı')) {
          hasDurum = true;
        }
      });
      
      if (!hasDurum) {
        shouldShow = false;
      }
    }
    
    // Değişen araçlar filtresi kontrolü
    if (showOnlyDegisen && shouldShow) {
      const cells = row.querySelectorAll('td');
      let isDegisen = false;
      
      // Plaka sütununu kontrol et
      if (plakaIndex !== -1 && cells[plakaIndex]) {
        const plakaCell = cells[plakaIndex];
        const cellStyle = window.getComputedStyle(plakaCell);
        const cellColor = cellStyle.color;
        
        // Sadece kırmızı renk kontrolü: rgb(231, 76, 60)
        const isRed = cellColor === 'rgb(231, 76, 60)';
        
        console.log('🔍 Değişen kontrol:', {
          plaka: plakaCell.textContent,
          color: cellColor,
          isRed
        });
        
        if (isRed) {
          isDegisen = true;
        }
      }
      
      if (!isDegisen) {
        shouldShow = false;
      }
    }
    
    // Satırı göster veya gizle
    row.style.display = shouldShow ? '' : 'none';
  });
}

closeModal.addEventListener('click', closeUploadModal);
cancelBtn.addEventListener('click', closeUploadModal);

// Logout button
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

// Approval modal listeners
closeApprovalModal.addEventListener('click', closeApprovalConfirmation);
cancelApprovalBtn.addEventListener('click', closeApprovalConfirmation);
confirmApprovalBtn.addEventListener('click', handleRowApproval);

// Mode switch listener - DISABLED: Mode is now controlled by user's Görev
// modeSwitch.addEventListener('change', function() {
//   currentMode = this.checked ? 'operasyon' : 'depolama';
//   console.log('🔄 Mod değişti:', currentMode);
// });

// Global close timer handler (HTML onclick için)
window.handleCloseTimer = function(e) {
  // Debounce: Eğer zaten kapatılıyorsa, tekrar çağrıyı engelle
  if (isClosingTimer) {
    console.log('⚠️ Timer zaten kapatılıyor, işlem atlandı');
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
    return false;
  }
  
  isClosingTimer = true;
  console.log('🔒 Timer kapatılıyor...');
  
  if (e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
  
  closeTimer();
  
  // 300ms sonra flag'ı sıfırla (daha hızlı yeni kapatma izni)
  setTimeout(() => {
    isClosingTimer = false;
    console.log('✅ Timer kapatılma işlemi tamamlandı');
  }, 300);
  
  return false;
};

methodAutoBtn.addEventListener('click', () => selectMethod('auto'));
methodManualBtn.addEventListener('click', () => selectMethod('manual'));

uploadTypeHatBtn.addEventListener('click', () => selectUploadType('hat'));
uploadTypePlakaBtn.addEventListener('click', () => selectUploadType('plaka'));
uploadTypeDepolamaBtn.addEventListener('click', () => selectUploadType('depolama'));

if (listFilesBtn) {
  listFilesBtn.addEventListener('click', handleListFiles);
}
if (confirmUploadBtn) {
  confirmUploadBtn.addEventListener('click', handleUpload);
}
if (tableSelect) {
  tableSelect.addEventListener('change', handleTableSelect);
}
if (hareketSelect) {
  hareketSelect.addEventListener('change', handleHareketChange);
}

if (selectAllDepolama) {
  selectAllDepolama.addEventListener('change', handleSelectAllDepolama);
}
if (applyDepolamaFilter) {
  applyDepolamaFilter.addEventListener('click', handleApplyDepolamaFilter);
}

if (selectAllHats) {
  selectAllHats.addEventListener('change', handleSelectAllHats);
}
if (applyHatSelection) {
  applyHatSelection.addEventListener('click', handleApplyHatSelection);
}
if (setDangerTimeBtn) {
  setDangerTimeBtn.addEventListener('click', handleSetDangerTime);
}

// VTS Update button
if (runVtsUpdateBtn) {
  runVtsUpdateBtn.addEventListener('click', handleRunVtsUpdate);
}

// Auto-format time input (MM:SS) with auto-complete for 2-digit input
if (dangerTimeInput) {
  dangerTimeInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/[^0-9]/g, ''); // Sadece rakam
    
    if (value.length >= 2) {
      value = value.substring(0, 2) + ':' + value.substring(2, 4);
    }
    
    e.target.value = value.substring(0, 5); // Max 5 karakter (MM:SS)
  });
  
  // Blur event: Eğer sadece 2 hane girilmişse otomatik :00 ekle
  dangerTimeInput.addEventListener('blur', function(e) {
    let value = e.target.value.trim();
    
    // Eğer sadece 2 rakam girilmişse (35 gibi), :00 ekle
    if (/^\d{2}$/.test(value)) {
      e.target.value = value + ':00';
    }
    // Eğer boşsa, default 00:00 yap
    else if (value === '') {
      e.target.value = '00:00';
    }
  });
  
  dangerTimeInput.addEventListener('keypress', function(e) {
    // Sadece rakam girişine izin ver
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab') {
      e.preventDefault();
    }
  });
  
  // Admin-only access control
  const userSession = localStorage.getItem('userSession');
  if (userSession) {
    const session = JSON.parse(userSession);
    if (session.gorev !== 'Admin') {
      dangerTimeInput.disabled = true;
      dangerTimeInput.style.opacity = '0.5';
      dangerTimeInput.style.cursor = 'not-allowed';
      if (setDangerTimeBtn) {
        setDangerTimeBtn.disabled = true;
        setDangerTimeBtn.style.opacity = '0.5';
        setDangerTimeBtn.style.cursor = 'not-allowed';
      }
    }
  }
}

// refreshHatsBtn başlangıçta gizli olabilir, kontrol et
if (refreshHatsBtn) {
  // Depolama ve Admin kullanıcıları için aktif
  const userSession = localStorage.getItem('userSession');
  if (userSession) {
    const session = JSON.parse(userSession);
    if (session.gorev === 'Depolama' || session.gorev === 'Admin') {
      refreshHatsBtn.addEventListener('click', handleRefreshHats);
      // Başlangıçta pasif yap, Tümünü Seç işaretlendiğinde aktif olacak
      refreshHatsBtn.disabled = true;
      refreshHatsBtn.style.opacity = '0.5';
      refreshHatsBtn.style.cursor = 'not-allowed';
      refreshHatsBtn.title = 'Hatları yenilemek için önce "Tümünü Seç" işaretleyin';
    } else {
      refreshHatsBtn.disabled = true;
      refreshHatsBtn.style.opacity = '0.5';
      refreshHatsBtn.style.cursor = 'not-allowed';
      refreshHatsBtn.title = 'Bu özellik sadece Depolama ve Admin kullanıcıları için aktiftir';
    }
  }
}

// Hatları Yenile butonu durum kontrolü
function updateRefreshHatsButtonState() {
  if (!refreshHatsBtn) return;
  
  const userSession = localStorage.getItem('userSession');
  if (!userSession) return;
  
  const session = JSON.parse(userSession);
  
  // Sadece Depolama kullanıcıları için kontrol yap (Admin her zaman aktif)
  if (session.gorev === 'Depolama') {
    const checkboxes = document.querySelectorAll('.hat-checkbox');
    const checkedCount = document.querySelectorAll('.hat-checkbox:checked').length;
    
    // Sadece "Tümünü Seç" işaretliyse aktif
    if (selectAllHats && selectAllHats.checked && checkedCount === checkboxes.length && checkboxes.length > 0) {
      refreshHatsBtn.disabled = false;
      refreshHatsBtn.style.opacity = '1';
      refreshHatsBtn.style.cursor = 'pointer';
      refreshHatsBtn.title = 'Hatları yenile';
      console.log('✅ Hatları Yenile butonu aktif - Tümü seçili');
    } else {
      refreshHatsBtn.disabled = true;
      refreshHatsBtn.style.opacity = '0.5';
      refreshHatsBtn.style.cursor = 'not-allowed';
      refreshHatsBtn.title = 'Hatları yenilemek için önce "Tümünü Seç" işaretleyin';
      console.log('❌ Hatları Yenile butonu pasif - Tümü seçili değil');
    }
  } else if (session.gorev === 'Admin') {
    // Admin için her zaman aktif
    refreshHatsBtn.disabled = false;
    refreshHatsBtn.style.opacity = '1';
    refreshHatsBtn.style.cursor = 'pointer';
    refreshHatsBtn.title = 'Hatları yenile';
  }
}

// Dinamik takip checkbox'ı değiştiğinde
if (dynamicTrackingCheckbox) {
  dynamicTrackingCheckbox.addEventListener('change', (e) => {
    console.log('🔄 Dinamik takip checkbox değişti:', {
      checked: e.target.checked,
      currentTimerRow: currentTimerRow
    });
    
    if (e.target.checked && currentTimerRow) {
      console.log('✅ Checkbox seçili ve currentTimerRow var, scrollToTimerRow çağrılıyor...');
      // Checkbox seçildiğinde, mevcut timer satırını hemen bul ve scroll et
      scrollToTimerRow(currentTimerRow);
    } else if (e.target.checked && !currentTimerRow) {
      console.warn('⚠️ Checkbox seçili ama currentTimerRow null!');
    } else if (!e.target.checked) {
      console.log('❌ Checkbox kaldırıldı, vurgular temizleniyor...');
      // Checkbox kaldırıldığında vurguyu temizle
      const rows = tbody.querySelectorAll('tr');
      rows.forEach(r => r.style.backgroundColor = '');
    }
  });
}

manualFileInput.addEventListener('change', handleManualFileSelect);

// Scroll butonları
if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

if (scrollToTimerRowBtn) {
  scrollToTimerRowBtn.addEventListener('click', () => {
    // Toggle mantığı: Eğer zaten vurgulanmışsa temizle, değilse vurgula
    if (highlightedRows.length > 0 && isManualHighlight) {
      // Manuel vurgular zaten var, kaldır
      highlightedRows.forEach(row => {
        if (row && row.style) row.style.backgroundColor = '';
      });
      highlightedRows = [];
      isManualHighlight = false; // Manuel vurgu kaldırıldı
      console.log('❌ Manuel vurgu kaldırıldı');
      return;
    }
    
    // Timer vurguları varsa onları temizle
    if (highlightedRows.length > 0 && !isManualHighlight) {
      highlightedRows.forEach(row => {
        if (row && row.style) row.style.backgroundColor = '';
      });
      highlightedRows = [];
    }
    
    isManualHighlight = true; // Manuel vurgu başlatıldı
    console.log('✅ Manuel vurgu aktif edildi');
    
    // Timer satırına git ve renklendir
    if (currentTimerRow) {
      // Tek otobüs varsa - kalan süreyi hesapla
      const remainingSeconds = currentTimerRow.remainingSeconds || 0;
      const highlightColor = remainingSeconds <= 120 ? '#ffcccc' : '#fff3cd'; // Kırmızı veya sarı
      
      const rows = tbody.querySelectorAll('tr');
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = row.querySelectorAll('td');
        let matchesTarife = false;
        let matchesHareket = false;
        
        cells.forEach(cell => {
          const text = cell.textContent.trim();
          if (text === currentTimerRow.tarifeSaati || text === currentTimerRow.tarifeSaati.substring(0, 5)) {
            matchesTarife = true;
          }
          if (text === currentTimerRow.hareket) {
            matchesHareket = true;
          }
        });
        
        if (matchesTarife && matchesHareket) {
          row.style.backgroundColor = highlightColor;
          highlightedRows.push(row);
          row.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
          break;
        }
      }
      
    } else if (currentBusList && currentBusList.length > 0) {
      // Çoklu otobüs varsa - ilk otobüsün kalan süresine göre renk seç
      const firstBus = currentBusList[0];
      const remainingSeconds = firstBus.remainingSeconds || 0;
      const highlightColor = remainingSeconds <= 120 ? '#ffcccc' : '#d4edda'; // Kırmızı veya yeşil
      
      const rows = tbody.querySelectorAll('tr');
      
      console.log(`🎯 Çoklu otobüs renklendirme: ${currentBusList.length} otobüs`);
      
      currentBusList.forEach((bus, busIndex) => {
        console.log(`  🚌 ${busIndex + 1}. otobüs: ${bus.tableName || bus.hatAdi} - ${bus.tarifeSaati} - ${bus.hareket}`);
        
        let foundForThisBus = false;
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const cells = row.querySelectorAll('td');
          
          let matchesHatAdi = false;
          let matchesTarife = false;
          let matchesHareket = false;
          let matchesTarifeSaati = false;
          
          cells.forEach(cell => {
            const text = cell.textContent.trim();
            // Hat Adı kontrolü - tableName veya hatAdi veya _Hat kolonuyla eşleşebilir
            if (text === bus.tableName || text === bus.hatAdi || text === bus._Hat) {
              matchesHatAdi = true;
            }
            if (text === bus.tarife) matchesTarife = true;
            if (text === bus.hareket) matchesHareket = true;
            if (text === bus.tarifeSaati || text === bus.tarifeSaati.substring(0, 5)) {
              matchesTarifeSaati = true;
            }
          });
          
          // Hat adı, tarife saati ve hareket ile eşleşme kontrolü
          if (matchesHatAdi && matchesHareket && matchesTarifeSaati) {
            row.style.backgroundColor = highlightColor;
            highlightedRows.push(row);
            foundForThisBus = true;
            console.log(`    ✅ Satır ${i + 1} renklendi`);
            
            // İlk eşleşen satıra scroll et
            if (highlightedRows.length === 1) {
              row.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }
            break; // Bu otobüs için ilk eşleşeni bulduk, bir sonraki otobüse geç
          }
        }
        
        if (!foundForThisBus) {
          console.log(`    ❌ Satır bulunamadı`);
        }
      });
      
      console.log(`✅ Toplam ${highlightedRows.length} satır renklendi`);
      
    } else {
      // Timer verisi yoksa en yukarı çık
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

// Search and Select All
fileSearchInput.addEventListener('input', handleFileSearch);
selectAllCheckbox.addEventListener('change', handleSelectAll);

// Close modal when clicking outside
uploadModal.addEventListener('click', (e) => {
  if (e.target === uploadModal) {
    closeUploadModal();
  }
});

// ==================== MODAL FUNCTIONS ====================
function openUploadModal() {
  uploadModal.style.display = 'flex';
  resetModal();
}

function closeUploadModal() {
  uploadModal.style.display = 'none';
  resetModal();
}

function resetModal() {
  selectedFiles = [];
  uploadMethod = null;
  uploadType = null;
  
  step1.style.display = 'block';
  step2Auto.style.display = 'none';
  step2Manual.style.display = 'none';
  step3.style.display = 'none';
  confirmUploadBtn.style.display = 'none';
  manualFileInputGroup.style.display = 'none';
  
  methodStatus.style.display = 'none';
  listStatus.style.display = 'none';
  selectStatus.style.display = 'none';
  uploadStatus.style.display = 'none';
  manualStatus.style.display = 'none';
  
  filesList.innerHTML = '';
  manualFileInput.value = '';
}

function selectMethod(method) {
  uploadMethod = method;
  uploadType = null; // Reset upload type
  step1.style.display = 'none';
  
  if (method === 'auto') {
    step2Auto.style.display = 'block';
  } else {
    step2Manual.style.display = 'block';
    manualFileInputGroup.style.display = 'none'; // Önce gizle, tip seçilince göster
  }
}

function selectUploadType(type) {
  uploadType = type;
  manualFileInputGroup.style.display = 'block';
  
  if (type === 'hat') {
    manualFileLabel.textContent = '📋 Hat Excel Dosyası Seçin:';
    manualFileHint.textContent = 'Format: XX_TABLENAME_YYYY_MM_DD.xlsx (örn: 05_AC05_2025_11_08.xlsx)';
  } else if (type === 'plaka') {
    manualFileLabel.textContent = '🚗 Plaka Excel Dosyası Seçin:';
    manualFileHint.textContent = 'PAZARTESİ, SALI, ÇARŞAMBA... sayfaları içermeli (ROTASYON hariç)';
  } else if (type === 'depolama') {
    manualFileLabel.textContent = '📦 Depolama Excel Dosyası Seçin:';
    manualFileHint.textContent = 'A sütunu: Hat_Adi (örn: TK36), D sütunu: Depolama (örn: OTOGAR)';
  }
  
  // Reset file input
  manualFileInput.value = '';
  manualStatus.style.display = 'none';
  confirmUploadBtn.style.display = 'none';
}

// ==================== FILE OPERATIONS ====================
async function handleListFiles() {
  listStatus.innerHTML = '⏳ Dosyalar yükleniyor...';
  listStatus.style.display = 'block';
  listFilesBtn.disabled = true;
  
  try {
    const res = await fetch('/api/scrape-drive-folder');
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || 'Dosyalar alınamadı');
    }
    
    if (!result.success || result.files.length === 0) {
      throw new Error(result.message || 'Dosya bulunamadı. Lütfen manuel yöntemi kullanın.');
    }
    
    allFiles = result.files;
    
    // Dosyaları listele
    renderFilesList();
    
    listStatus.innerHTML = `✅ ${allFiles.length} dosya bulundu`;
    step3.style.display = 'block';
    
  } catch (err) {
    console.error('List files error:', err);
    listStatus.innerHTML = `❌ Hata: ${err.message}`;
  } finally {
    listFilesBtn.disabled = false;
  }
}

function handleManualFileSelect(e) {
  const file = e.target.files[0];
  
  if (!file) {
    manualStatus.style.display = 'none';
    confirmUploadBtn.style.display = 'none';
    return;
  }
  
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    manualStatus.innerHTML = '❌ Hata: Sadece Excel dosyaları (.xlsx, .xls) kabul edilir';
    manualStatus.style.display = 'block';
    confirmUploadBtn.style.display = 'none';
    return;
  }
  
  selectedFiles = [{
    name: file.name,
    file: file,
    isManual: true
  }];
  
  manualStatus.innerHTML = `✅ ${file.name} seçildi`;
  manualStatus.style.display = 'block';
  confirmUploadBtn.style.display = 'block';
}

// ==================== FILE LIST RENDER & FILTER ====================
function renderFilesList(filterText = '') {
  filesList.innerHTML = '';
  // selectedFiles'ı sıfırlamıyoruz - seçimleri koruyoruz!
  
  const filteredFiles = filterText 
    ? allFiles.filter(f => f.name.toLowerCase().includes(filterText.toLowerCase()))
    : allFiles;
  
  filteredFiles.forEach(file => {
    const label = document.createElement('label');
    label.className = 'file-checkbox';
    label.dataset.fileId = file.id;
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = file.id;
    checkbox.dataset.name = file.name;
    checkbox.className = 'file-item-checkbox';
    
    // Eğer bu dosya daha önce seçildiyse, checkbox'ı işaretle
    const isSelected = selectedFiles.some(f => f.id === file.id);
    checkbox.checked = isSelected;
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        // Eğer zaten seçili değilse ekle
        if (!selectedFiles.some(f => f.id === file.id)) {
          selectedFiles.push({
            id: file.id,
            name: file.name
          });
        }
      } else {
        selectedFiles = selectedFiles.filter(f => f.id !== file.id);
      }
      
      updateSelectionStatus();
      updateSelectAllCheckbox();
    });
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(file.name));
    filesList.appendChild(label);
  });
  
  updateSelectionStatus();
}

function handleFileSearch(e) {
  const searchText = e.target.value;
  renderFilesList(searchText);
}

function handleSelectAll(e) {
  const checkboxes = document.querySelectorAll('.file-item-checkbox');
  const isChecked = e.target.checked;
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
    const fileId = checkbox.value;
    const fileName = checkbox.dataset.name;
    
    if (isChecked) {
      // Eğer zaten seçili değilse ekle
      if (!selectedFiles.some(f => f.id === fileId)) {
        selectedFiles.push({
          id: fileId,
          name: fileName
        });
      }
    } else {
      // Sadece görünen dosyaları seçimden kaldır
      selectedFiles = selectedFiles.filter(f => f.id !== fileId);
    }
  });
  
  updateSelectionStatus();
}

function updateSelectAllCheckbox() {
  const checkboxes = document.querySelectorAll('.file-item-checkbox');
  const checkedCount = document.querySelectorAll('.file-item-checkbox:checked').length;
  
  if (checkboxes.length === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCount === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCount === checkboxes.length) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

function updateSelectionStatus() {
  if (selectedFiles.length > 0) {
    selectStatus.innerHTML = `✅ ${selectedFiles.length} dosya seçildi`;
    selectStatus.style.display = 'block';
    confirmUploadBtn.style.display = 'block';
  } else {
    selectStatus.style.display = 'none';
    confirmUploadBtn.style.display = 'none';
  }
}

function updateUploadProgress(current, total, currentFileName = '') {
  const progressContainer = document.getElementById('uploadProgressContainer');
  const progressText = document.getElementById('uploadProgressText');
  const progressPercent = document.getElementById('uploadProgressPercent');
  const progressBar = document.getElementById('uploadProgressBar');
  const currentFileEl = document.getElementById('uploadCurrentFile');
  
  // Yüzdelik hesapla
  const percentage = Math.round((current / total) * 100);
  
  // Göstergeleri güncelle
  progressContainer.style.display = 'block';
  progressText.textContent = `${current} / ${total} dosya yüklendi`;
  progressPercent.textContent = `${percentage}%`;
  progressBar.style.width = `${percentage}%`;
  progressBar.textContent = `${percentage}%`;
  
  // Mevcut dosya adını göster
  if (currentFileName) {
    currentFileEl.textContent = `📤 ${currentFileName}`;
    currentFileEl.style.display = 'block';
  } else {
    currentFileEl.style.display = 'none';
  }
}

async function handleUpload() {
  if (selectedFiles.length === 0) {
    uploadStatus.innerHTML = '❌ Hata: Dosya seçiniz';
    uploadStatus.style.display = 'block';
    return;
  }
  
  // Kullanıcı bilgilerini al
  const userSession = localStorage.getItem('userSession');
  let currentGorev = 'User';
  if (userSession) {
    const session = JSON.parse(userSession);
    currentGorev = session.gorev;
  }

  // Admin için zaman kısıtlaması yok, direkt işleme devam et
  if (currentGorev !== 'Admin') {
    // Zaman kısıtlaması kontrolü (sadece Admin olmayan kullanıcılar için)
    const timeCheckRes = await fetch('/api/check-time-restriction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'yukleme',
        gorev: currentGorev
      })
    });

    const timeCheckData = await timeCheckRes.json();
    console.log('⏰ Yükleme zaman kontrolü sonucu:', timeCheckData);

    if (!timeCheckData.allowed) {
      const finishDisplay = timeCheckData.finishDisplay || timeCheckData.finishTime;
      uploadStatus.innerHTML = `⏸️ Yükleme İşlemi Şu Anda Yapılamaz<br><br>` +
                               `${timeCheckData.reason}<br><br>` +
                               `⏰ Şu anki saat: ${timeCheckData.currentTime}<br>` +
                               `🚫 Yasak saatler: ${timeCheckData.startTime} - ${finishDisplay}<br><br>` +
                               `Bu işlemi ${finishDisplay} sonrasında yapabilirsiniz.`;
      uploadStatus.style.display = 'block';
      uploadStatus.style.color = '#e74c3c';
      return;
    }

    console.log('✅ Yükleme zaman kontrolü geçildi');
  } else {
    console.log('👑 Admin kullanıcısı - zaman kısıtlaması olmadan yükleme yapılıyor');
  }
  
  confirmUploadBtn.disabled = true;
  uploadStatus.style.display = 'none';
  
  const totalFiles = selectedFiles.length;
  let completedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  // İlk progress göster
  updateUploadProgress(0, totalFiles);
  
  for (const file of selectedFiles) {
    try {
      console.log(`\n📤 UPLOADING: ${file.name}`);
      
      // Mevcut dosya yüklenmeye başladı
      updateUploadProgress(completedCount, totalFiles, file.name);
      
      let fileData;
      
      if (file.isManual) {
        console.log('📂 Reading manual file...');
        // Manuel dosya - FileReader ile base64'e dönüştür
        fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            console.log(`✅ File read, size: ${base64.length} chars`);
            resolve(base64);
          };
          reader.onerror = (err) => {
            console.error('❌ FileReader error:', err);
            reject(new Error('Dosya okunamadı'));
          };
          reader.readAsDataURL(file.file);
        });
      } else {
        console.log('☁️ Downloading from Drive...');
        // Drive dosyası - indir
        const downloadRes = await fetch('/api/download-from-drive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: file.id })
        });
        
        const downloadResult = await downloadRes.json();
        console.log('Download response:', downloadResult);
        
        if (!downloadRes.ok) {
          throw new Error(downloadResult.error);
        }
        
        fileData = downloadResult.data;
      }
      
      console.log('📨 Sending to process API...');
      console.log('File name:', file.name);
      console.log('Data length:', fileData.length);
      console.log('Upload type:', uploadType);
      
      // Excel'i işle - uploadType'a göre farklı endpoint
      let apiEndpoint = '/api/process-excel'; // default: hat
      if (uploadType === 'plaka') {
        apiEndpoint = '/api/process-plaka-excel';
      } else if (uploadType === 'depolama') {
        apiEndpoint = '/api/process-depolama-excel';
      }
      console.log('API Endpoint:', apiEndpoint);
      
      const processRes = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: fileData
        })
      });
      
      console.log('Process response status:', processRes.status);
      
      const processResult = await processRes.json();
      console.log('Process result:', processResult);
      
      if (!processRes.ok) {
        console.error('❌ Process failed:', processResult);
        throw new Error(processResult.error || 'İşleme hatası');
      }
      
      console.log(`✅ ${file.name} başarıyla yüklendi`);
      successCount++;
      completedCount++;
      
      // Progress güncelle
      updateUploadProgress(completedCount, totalFiles);
      
    } catch (err) {
      console.error(`❌ ${file.name} yüklenemedi:`, err);
      console.error('Error details:', err.message, err.stack);
      errors.push(`${file.name}: ${err.message}`);
      errorCount++;
      completedCount++;
      
      // Progress güncelle (hatalı da olsa tamamlandı sayılır)
      updateUploadProgress(completedCount, totalFiles);
    }
  }
  
  // Progress bar'ı gizle
  document.getElementById('uploadProgressContainer').style.display = 'none';
  
  // Özet mesajı göster
  let message = `✅ ${successCount} dosya başarıyla yüklendi`;
  if (errorCount > 0) {
    message += `<br>❌ ${errorCount} dosya hata aldı:<br>`;
    message += errors.map(e => `• ${e}`).join('<br>');
  }
  
  uploadStatus.innerHTML = message;
  uploadStatus.style.display = 'block';
  confirmUploadBtn.disabled = false;
  
  // Başarılı yüklemeler varsa tabloları yenile
  if (successCount > 0) {
    setTimeout(() => {
      closeUploadModal();
      handleRefresh();
    }, 3000);
  }
}

// ==================== ROW APPROVAL FUNCTIONS ====================
function openApprovalConfirmation(rowData, tableName) {
  // Gerekli alanları kontrol et
  if (!rowData.Hat_Adi || !rowData.Tarife || !rowData.Tarife_Saati) {
    alert('❌ Bu satır için gerekli bilgiler eksik (Hat_Adi, Tarife, Tarife_Saati)');
    return;
  }
  
  // Session'dan güncel modu al
  currentMode = getCurrentModeFromSession();
  
  // Veriyi sakla
  pendingApprovalData = {
    tableName,
    hatAdi: rowData.Hat_Adi,
    calismaZamani: rowData.Çalışma_Zamanı || '',
    tarife: rowData.Tarife,
    tarifeSaati: rowData.Tarife_Saati,
    hareket: rowData.Hareket || '',
    mode: currentMode,
    rowData: rowData // Tüm satır verisini sakla
  };
  
  console.log('🔍 Onay için seçilen satır (Mod: ' + currentMode + '):', pendingApprovalData);
  
  // Modal içeriğini doldur
  approvalHat.textContent = rowData.Hat_Adi;
  document.getElementById('approvalCalismaZamani').textContent = rowData.Çalışma_Zamanı || rowData.Calisma_Zamani || '-';
  approvalTarife.textContent = rowData.Tarife;
  approvalTime.textContent = rowData.Tarife_Saati;
  document.getElementById('approvalPlaka').textContent = rowData.Plaka || '-';
  
  // Modal başlığı ve soruyu moda göre değiştir
  const arizaliAciklamaForm = document.getElementById('arizaliAciklamaForm');
  
  if (currentMode === 'operasyon') {
    // Eğer zaten Arızalı ise, kaldırma sorusu sor
    const currentDurum = rowData.Durum || '';
    const isAlreadyFaulty = currentDurum.toLowerCase().includes('arızalı');
    
    if (isAlreadyFaulty) {
      approvalModalTitle.textContent = '✅ Arıza Kaydını Kaldır';
      approvalQuestion.textContent = 'Otobüs zaten arızalı. Arızalı bilgisini kaldırmak istiyor musunuz?';
      confirmApprovalBtn.style.background = '#27ae60';
      confirmApprovalBtn.innerHTML = '✅ Arızalı Bilgisini Kaldır';
      // Flag ekle: Kaldırma işlemi
      pendingApprovalData.removeArizali = true;
      // Açıklama formunu gizle (kaldırma için açıklama gerekmez)
      if (arizaliAciklamaForm) arizaliAciklamaForm.style.display = 'none';
    } else {
      approvalModalTitle.textContent = '⚠️ Arıza Kaydı';
      approvalQuestion.textContent = '⚠️ Arızalı Olarak İşaretle butonuna basarak arıza kaydı ekleyebilirsiniz.';
      confirmApprovalBtn.style.background = '#e74c3c';
      confirmApprovalBtn.innerHTML = '⚠️ Arızalı Olarak Işaretle';
      pendingApprovalData.removeArizali = false;
      // Açıklama formunu başlangıçta gizli tut (butona basınca açılacak)
      if (arizaliAciklamaForm) arizaliAciklamaForm.style.display = 'none';
      // Açıklama alanını temizle
      const arizaliAciklamaText = document.getElementById('arizaliAciklamaText');
      if (arizaliAciklamaText) arizaliAciklamaText.value = '';
    }
  } else {
    approvalModalTitle.textContent = '🚌 Çıkış Onayı';
    approvalQuestion.textContent = 'Bu çıkışı onaylamak istiyor musunuz?';
    confirmApprovalBtn.style.background = '#27ae60';
    confirmApprovalBtn.innerHTML = '✅ Onayla';
    // Depolama modunda arızalı formu gizle
    if (arizaliAciklamaForm) arizaliAciklamaForm.style.display = 'none';
  }
  
  // Açıklama Ekle ve Araç Değiştir butonlarını göster/gizle (sadece Operasyon ve Depolama için)
  const aciklamaBtn = document.getElementById('aciklamaEkleFromPopup');
  const aracDegistirBtn = document.getElementById('aracDegistirFromPopup');
  const userSession = localStorage.getItem('userSession');
  if (userSession) {
    const session = JSON.parse(userSession);
    if (session.gorev === 'Operasyon' || session.gorev === 'Depolama') {
      aciklamaBtn.style.display = 'inline-block';
      aracDegistirBtn.style.display = 'inline-block';
    } else {
      aciklamaBtn.style.display = 'none';
      aracDegistirBtn.style.display = 'none';
    }
  } else {
    aciklamaBtn.style.display = 'none';
    aracDegistirBtn.style.display = 'none';
  }
  
  // Modal'ı aç
  approvalModal.style.display = 'flex';
}

function closeApprovalConfirmation() {
  approvalModal.style.display = 'none';
  pendingApprovalData = null;
  
  // Inline formları sıfırla
  const aciklamaInlineForm = document.getElementById('aciklamaFormInline');
  const aracDegistirInlineForm = document.getElementById('aracDegistirFormInline');
  const arizaliAciklamaForm = document.getElementById('arizaliAciklamaForm');
  const aciklamaBtn = document.getElementById('aciklamaEkleFromPopup');
  const aracDegistirBtn = document.getElementById('aracDegistirFromPopup');
  
  if (aciklamaInlineForm) {
    aciklamaInlineForm.style.display = 'none';
  }
  if (aracDegistirInlineForm) {
    aracDegistirInlineForm.style.display = 'none';
  }
  if (arizaliAciklamaForm) {
    arizaliAciklamaForm.style.display = 'none';
    const arizaliAciklamaText = document.getElementById('arizaliAciklamaText');
    if (arizaliAciklamaText) arizaliAciklamaText.value = '';
  }
  if (aciklamaBtn) {
    aciklamaBtn.textContent = '📝 Açıklama Ekle';
    aciklamaBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
  if (aracDegistirBtn) {
    aracDegistirBtn.textContent = '🚗 Araç Değiştir';
    aracDegistirBtn.style.background = 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)';
  }
}

async function handleRowApproval() {
  if (!pendingApprovalData) {
    return;
  }
  
  // Operasyon modunda arızalı işaretleme için önce form açılmalı
  if (currentMode === 'operasyon' && !pendingApprovalData.removeArizali) {
    const arizaliAciklamaForm = document.getElementById('arizaliAciklamaForm');
    const arizaliAciklamaText = document.getElementById('arizaliAciklamaText');
    
    // Eğer form gizliyse, önce formu aç ve işlemi durdur
    if (arizaliAciklamaForm && arizaliAciklamaForm.style.display === 'none') {
      // Diğer formları kapat (mutual exclusion)
      const aciklamaForm = document.getElementById('aciklamaFormInline');
      const aracDegistirForm = document.getElementById('aracDegistirFormInline');
      const aciklamaBtn = document.getElementById('aciklamaEkleFromPopup');
      const aracDegistirBtn = document.getElementById('aracDegistirFromPopup');
      
      if (aciklamaForm) aciklamaForm.style.display = 'none';
      if (aciklamaBtn) {
        aciklamaBtn.textContent = '📝 Açıklama Ekle';
        aciklamaBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
      
      if (aracDegistirForm) aracDegistirForm.style.display = 'none';
      if (aracDegistirBtn) {
        aracDegistirBtn.textContent = '🚗 Araç Değiştir';
        aracDegistirBtn.style.background = 'linear-gradient(135deg, #e67e22 0%, #d35400 100%)';
      }
      
      // Arızalı formunu aç
      arizaliAciklamaForm.style.display = 'block';
      approvalQuestion.textContent = 'Arıza detaylarını açıklayın:';
      confirmApprovalBtn.innerHTML = '✅ Kaydet ve İşaretle';
      if (arizaliAciklamaText) arizaliAciklamaText.focus();
      return;
    }
    
    // Form açıksa, açıklama kontrolü yap
    const aciklama = arizaliAciklamaText ? arizaliAciklamaText.value.trim() : '';
    
    if (!aciklama) {
      alert('⚠️ Arıza açıklaması zorunludur!');
      if (arizaliAciklamaText) arizaliAciklamaText.focus();
      return;
    }
    
    // Açıklamayı pendingApprovalData'ya ekle
    pendingApprovalData.aciklama = aciklama;
  }
  
  confirmApprovalBtn.disabled = true;
  confirmApprovalBtn.textContent = '⏳ İşleniyor...';
  
  try {
    if (currentMode === 'operasyon') {
      // Operasyon modu: Durum sütununa "Arızalı" yaz veya kaldır
      const isRemoving = pendingApprovalData.removeArizali;
      
      const res = await fetch('/api/mark-faulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pendingApprovalData,
          clearFaulty: isRemoving // Arızalı bilgisini kaldırma flag'i
        })
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || (isRemoving ? 'Arıza kaldırma hatası' : 'Arıza kaydı hatası'));
      }
      
      console.log(isRemoving ? '✅ Arızalı bilgisi kaldırıldı:' : '✅ Arızalı olarak işaretlendi:', result);
      
      // Eğer arızalı işaretleme yapıldıysa açıklamayı da kaydet
      if (!isRemoving && pendingApprovalData.aciklama) {
        await saveArizaliAciklama(pendingApprovalData);
      }
      
      // Eğer arızalı kaldırma yapıldıysa Operasyon_Açıklama tablosundan da sil
      if (isRemoving) {
        await removeArizaliAciklama(pendingApprovalData);
      }
      
      // Veriyi sakla (modal kapatılmadan önce)
      const savedData = { ...pendingApprovalData };
      
      // Modal'ı kapat
      closeApprovalConfirmation();
      
      // Satırı tabloda hızlıca güncelle
      updateRowStatus(savedData, isRemoving ? null : 'Arızalı');
      
      alert(isRemoving ? '✅ Arızalı bilgisi kaldırıldı!' : '✅ Arızalı olarak işaretlendi ve açıklama kaydedildi!');
      
    } else {
      // Depolama modu: Onaylanan sütununa saat yaz
      const res = await fetch('/api/approve-row', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingApprovalData)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Onaylama hatası');
      }
      
      console.log('✅ Satır onaylandı:', result);
      
      // Veriyi sakla (modal kapatılmadan önce)
      const savedData = { ...pendingApprovalData };
      
      // Modal'ı kapat
      closeApprovalConfirmation();
      
      // Satırı tabloda hızlıca güncelle (yenileme yapmadan)
      updateRowInTable(savedData, result.approvalTime);
      
      alert(`✅ Onaylandı!\nSaat: ${result.approvalTime}`);
    }
    
  } catch (err) {
    console.error('İşlem hatası:', err);
    alert(`❌ Hata: ${err.message}`);
  } finally {
    confirmApprovalBtn.disabled = false;
    if (currentMode === 'operasyon') {
      confirmApprovalBtn.textContent = '⚠️ Arızalı Olarak Işaretle';
    } else {
      confirmApprovalBtn.textContent = '✅ Onayla';
    }
  }
}

function updateRowInTable(rowData, approvalTime) {
  // Tablodaki tüm satırları kontrol et ve eşleşeni bul
  const rows = tbody.querySelectorAll('tr');
  const headers = Array.from(theadRow.querySelectorAll('th')).map(th => th.textContent);
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    let isMatch = true;
    
    // Satırın verilerini oku
    const rowValues = {};
    cells.forEach((cell, index) => {
      rowValues[headers[index]] = cell.textContent;
    });
    
    // Eşleşme kontrolü (Hat, Tarife, Tarife_Saati, Çalışma_Zamanı, Hareket)
    if (rowData.hatAdi && rowValues['Hat_Adi'] !== rowData.hatAdi && rowValues['Hat'] !== rowData.hatAdi) {
      isMatch = false;
    }
    if (rowData.tarife && rowValues['Tarife'] !== rowData.tarife) {
      isMatch = false;
    }
    if (rowData.tarifeSaati && rowValues['Tarife_Saati'] !== rowData.tarifeSaati) {
      isMatch = false;
    }
    if (rowData.calismaZamani && rowValues['Çalışma_Zamanı'] !== rowData.calismaZamani) {
      isMatch = false;
    }
    if (rowData.hareket && rowValues['Hareket'] !== rowData.hareket) {
      isMatch = false;
    }
    
    // Eşleşen satırı bulduk
    if (isMatch) {
      // "Onaylanan" sütununu bul ve güncelle
      const onaylananIndex = headers.indexOf('Onaylanan');
      if (onaylananIndex !== -1 && cells[onaylananIndex]) {
        cells[onaylananIndex].textContent = approvalTime;
        
        // Sadece Onaylanan hücresinin font rengini değiştir
        const tarifeSaati = rowData.tarifeSaati;
        const fontColor = getApprovalFontColor(approvalTime, tarifeSaati);
        cells[onaylananIndex].style.color = fontColor;
        cells[onaylananIndex].style.fontWeight = 'bold';
        
        console.log('✅ Satır tabloda güncellendi:', approvalTime);
      }
    }
  });
}

function updateRowStatus(rowData, status) {
  // Tablodaki tüm satırları kontrol et ve eşleşeni bul
  const rows = tbody.querySelectorAll('tr');
  const headers = Array.from(theadRow.querySelectorAll('th')).map(th => th.textContent);
  
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    let isMatch = true;
    
    // Satırın verilerini oku
    const rowValues = {};
    cells.forEach((cell, index) => {
      rowValues[headers[index]] = cell.textContent;
    });
    
    // Eşleşme kontrolü
    if (rowData.hatAdi && rowValues['Hat_Adi'] !== rowData.hatAdi && rowValues['Hat'] !== rowData.hatAdi) {
      isMatch = false;
    }
    if (rowData.tarife && rowValues['Tarife'] !== rowData.tarife) {
      isMatch = false;
    }
    if (rowData.tarifeSaati && rowValues['Tarife_Saati'] !== rowData.tarifeSaati) {
      isMatch = false;
    }
    if (rowData.calismaZamani && rowValues['Çalışma_Zamanı'] !== rowData.calismaZamani) {
      isMatch = false;
    }
    if (rowData.hareket && rowValues['Hareket'] !== rowData.hareket) {
      isMatch = false;
    }
    
    // Eşleşen satırı bulduk
    if (isMatch) {
      // "Durum" sütununu bul ve güncelle
      const durumIndex = headers.indexOf('Durum');
      if (durumIndex !== -1 && cells[durumIndex]) {
        cells[durumIndex].textContent = status || '';
        if (status) {
          cells[durumIndex].style.color = '#e74c3c';
          cells[durumIndex].style.fontWeight = 'bold';
        } else {
          cells[durumIndex].style.color = '';
          cells[durumIndex].style.fontWeight = '';
        }
        
        console.log('✅ Durum sütunu güncellendi:', status || '(temizlendi)');
        
        // Global selectedRowForAciklama'yı da güncelle (bir sonraki tıklamada doğru veriyi görmek için)
        if (selectedRowForAciklama && 
            selectedRowForAciklama.Hat_Adi === rowData.hatAdi &&
            selectedRowForAciklama.Tarife === rowData.tarife &&
            selectedRowForAciklama.Tarife_Saati === rowData.tarifeSaati) {
          selectedRowForAciklama.Durum = status || '';
          console.log('✅ selectedRowForAciklama.Durum güncellendi:', status || '(temizlendi)');
        }
      }
    }
  });
}

function getApprovalFontColor(onaylananTime, tarifeSaati) {
  if (!onaylananTime || !tarifeSaati) {
    return 'black';
  }
  
  // Saatleri dakikaya çevir (saniyeyi göz ardı et)
  const timeToMinutes = (timeStr) => {
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };
  
  const onaylananMinutes = timeToMinutes(onaylananTime);
  const tarifeMinutes = timeToMinutes(tarifeSaati);
  
  if (onaylananMinutes === tarifeMinutes) {
    return 'green'; // Yeşil - Tam zamanında
  } else if (onaylananMinutes < tarifeMinutes) {
    return 'orange'; // Sarı/Turuncu - Erken
  } else {
    return 'red'; // Kırmızı - Geç
  }
}

function getApprovalColor(onaylananTime, tarifeSaati) {
  if (!onaylananTime || !tarifeSaati) {
    return 'transparent';
  }
  
  // Saatleri dakikaya çevir (saniyeyi göz ardı et)
  const timeToMinutes = (timeStr) => {
    const parts = timeStr.split(':');
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  };
  
  const onaylananMinutes = timeToMinutes(onaylananTime);
  const tarifeMinutes = timeToMinutes(tarifeSaati);
  
  if (onaylananMinutes === tarifeMinutes) {
    return '#d4edda'; // Yeşil - Tam zamanında
  } else if (onaylananMinutes < tarifeMinutes) {
    return '#fff3cd'; // Sarı - Erken
  } else {
    return '#f8d7da'; // Kırmızı - Geç
  }
}

// ==================== TABLE FUNCTIONS ====================
async function handleRefresh() {
  if (isLoading) return;
  
  isLoading = true;
  statusEl.textContent = 'Tablolar yükleniyor...';
  refreshBtn.disabled = true;
  
  try {
    const res = await fetch('/api/list-tables');
    
    if (!res.ok) {
      throw new Error('Tablolar alınamadı');
    }
    
    const result = await res.json();
    let tables = result.tables || [];
    
    // Sistem tablolarını filtrele (hat olmayan tablolar)
    const systemTables = [
      'Depolama_Açıklama',
      'Operasyon_Açıklama',
      'Saat',
      'Kullanıcı_Verileri',
      'Kullanıcılar',
      'Takip'
    ];
    
    tables = tables.filter(table => !systemTables.includes(table));
    console.log('🗂️ Sistem tabloları filtrelendi, kalan tablolar:', tables);
    
    if (tables.length === 0) {
      statusEl.innerHTML = '<span class="small">Henüz tablo yok. Yükle butonuna tıklayarak dosya yükleyiniz.</span>';
      if (tableSelection) tableSelection.style.display = 'none';
      theadRow.innerHTML = "<th>Boş</th>";
      tbody.innerHTML = '<tr><td class="small">Kayıt yok.</td></tr>';
      return;
    }
    
    // Tabloları dropdown'a ekle
    if (tableSelect) {
      tableSelect.innerHTML = '<option value="">-- Tablo Seçin --</option>';
      tables.forEach(table => {
        const option = document.createElement('option');
        option.value = table;
        option.textContent = table;
        tableSelect.appendChild(option);
      });
    }
    
    // Mevcut hatları kaydet
    availableHats = tables;
    
    // Hat Seçimi bölümünü başlangıçta gizle (Depolama filtresi uygulanınca gösterilecek)
    if (hatSelectionContainer) {
      hatSelectionContainer.style.display = 'none';
    }
    
    if (tableSelection) tableSelection.style.display = 'block';
    if (hareketSelect) hareketSelect.value = '';
    
    // Depolama checkbox listesini oluştur
    renderDepolamaCheckboxes();
    
    statusEl.textContent = `${tables.length} tablo bulundu. Lütfen Depolama filtresi uygulayın.`;
    theadRow.innerHTML = "<th>Depolama Filtresi Uygulayın</th>";
    tbody.innerHTML = '<tr><td class="small">Depolama filtresi seçip uygulayın</td></tr>';
    
  } catch (err) {
    console.error('Refresh error:', err);
    statusEl.innerHTML = `<span class="error">Hata: ${err.message}</span>`;
  } finally {
    isLoading = false;
    refreshBtn.disabled = false;
  }
}

async function handleTableSelect() {
  const selectedOption = tableSelect.options[tableSelect.selectedIndex];
  
  if (!selectedOption.value) {
    currentTable = null;
    statusEl.textContent = 'Tablo seçiniz';
    theadRow.innerHTML = "<th>Tablo Seçiniz</th>";
    tbody.innerHTML = '<tr><td class="small">Tablo seçiniz</td></tr>';
    closeTimer();
    return;
  }
  
  currentTable = selectedOption.value;
  loadTableData();
}

function handleHareketChange() {
  currentHareket = hareketSelect.value || null;
  
  // Eğer çoklu hat seçimi aktifse, yeniden yükle
  if (selectedHats.length > 0) {
    handleApplyHatSelection();
  } else if (currentTable) {
    // Tek hat seçiliyse normal yükle
    loadTableData();
  }
  
  // Timer aktifse yeniden başlat (yeni hareket filtresi ile)
  if (timerInterval) {
    if (selectedHats.length > 0) {
      // Çoklu hat timer zaten handleApplyHatSelection içinde başlatılıyor
    } else if (currentTable) {
      // Tek hat timer'ı yeniden başlat
      startTimer(currentTable, currentHareket);
    }
  }
}

async function loadTableData() {
  if (!currentTable) return;
  
  statusEl.textContent = `${currentTable} tablosu yükleniyor...`;
  
  try {
    const res = await fetch('/api/get-table-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: currentTable,
        hareket: currentHareket
      })
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error);
    }
    
    const data = result.data || [];
    
    if (data.length === 0) {
      statusEl.innerHTML = `<span class="small">${currentTable} tablosu boş.</span>`;
      theadRow.innerHTML = "<th>Boş</th>";
      tbody.innerHTML = '<tr><td class="small">Kayıt yok.</td></tr>';
      closeTimer();
      return;
    }
    
    // Tablo başlıklarını oluştur (_IsYeniPlaka ve id'yi gizle)
    const firstRow = data[0];
    const allKeys = Object.keys(firstRow);
    
    // _IsYeniPlaka sütununu gizle
    const isYeniPlakaIndex = allKeys.indexOf('_IsYeniPlaka');
    if (isYeniPlakaIndex > -1) {
      allKeys.splice(isYeniPlakaIndex, 1);
    }
    
    // id sütununu gizle
    const idIndex = allKeys.indexOf('id');
    if (idIndex > -1) {
      allKeys.splice(idIndex, 1);
    }
    
    theadRow.innerHTML = '';
    allKeys.forEach(k => {
      const th = document.createElement('th');
      th.textContent = k;
      theadRow.appendChild(th);
    });
    
    // Açıklama ikonu için başlık ekle
    const thAciklama = document.createElement('th');
    thAciklama.style.textAlign = 'center';
    thAciklama.style.width = '80px';
    thAciklama.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
        <span>💬</span>
        <input type="checkbox" id="refreshAllAciklamaCheckbox" title="Tüm satırların açıklama ikonlarını yenile" style="cursor: pointer; width: 16px; height: 16px;">
      </div>
    `;
    theadRow.appendChild(thAciklama);
    
    // ⚡ Cache'i önceden doldur (tablo oluşturmadan önce)
    statusEl.textContent = 'Açıklamalar kontrol ediliyor...';
    const cachePromises = data.map(async row => {
      const cacheKey = `${row.Hat_Adi}|${row.Tarife}|${row.Tarife_Saati}`;
      if (!aciklamaCache.hasOwnProperty(cacheKey)) {
        const hasAciklama = await checkRowHasAciklama(row);
        aciklamaCache[cacheKey] = hasAciklama;
      }
    });
    await Promise.all(cachePromises);
    
    // Tablo verilerini oluştur
    tbody.innerHTML = '';
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.dataset.rowData = JSON.stringify(row);
      allKeys.forEach(k => {
        const td = document.createElement('td');
        const value = row[k];
        td.textContent = value !== null && value !== undefined ? value : '';
        
        // Plaka sütunu: Yeni_Plaka'dan geliyorsa kırmızı yap
        if (k === 'Plaka' && row._IsYeniPlaka) {
          td.style.color = '#e74c3c';
          td.style.fontWeight = 'bold';
        }
        
        // "Durum" sütunu ve "Arızalı" varsa kırmızı yap
        if (k === 'Durum' && value && value.toString().toLowerCase().includes('arızalı')) {
          td.style.color = '#e74c3c';
          td.style.fontWeight = 'bold';
        }
        
        tr.appendChild(td);
      });
      
      // Açıklama ikonu sütunu ekle (mesaj + refresh)
      const tdAciklama = document.createElement('td');
      tdAciklama.style.textAlign = 'center';
      tdAciklama.style.fontSize = '18px';
      tdAciklama.className = 'aciklama-icon-cell';
      tdAciklama.dataset.hatAdi = row.Hat_Adi || '';
      tdAciklama.dataset.tarife = row.Tarife || '';
      tdAciklama.dataset.tarifeSaati = row.Tarife_Saati || '';
      
      const cacheKey = `${row.Hat_Adi}|${row.Tarife}|${row.Tarife_Saati}`;
      const hasAciklama = aciklamaCache[cacheKey];
      
      if (hasAciklama) {
        // Mesaj ikonu göster
        const messageIcon = document.createElement('span');
        messageIcon.className = 'message-icon';
        messageIcon.textContent = '💬';
        messageIcon.style.cursor = 'pointer';
        messageIcon.title = 'Açıklama mesajlarını görüntüle';
        messageIcon.onclick = (e) => {
          e.stopPropagation();
          openRowAciklamaModal(row);
        };
        tdAciklama.appendChild(messageIcon);
      } else {
        // Refresh ikonu göster (mesaj yoksa)
        const refreshIcon = document.createElement('span');
        refreshIcon.textContent = '🔄';
        refreshIcon.style.cursor = 'pointer';
        refreshIcon.style.fontSize = '14px';
        refreshIcon.style.opacity = '0.6';
        refreshIcon.title = 'Bu satırın mesaj durumunu kontrol et';
        refreshIcon.onclick = async (e) => {
          e.stopPropagation();
          refreshIcon.style.opacity = '0.3';
          
          const hasAciklama = await checkRowHasAciklama(row);
          const cacheKey = `${row.Hat_Adi}|${row.Tarife}|${row.Tarife_Saati}`;
          aciklamaCache[cacheKey] = hasAciklama;
          
          if (hasAciklama) {
            // Refresh ikonunu kaldır, mesaj ikonu ekle
            tdAciklama.innerHTML = '';
            const messageIcon = document.createElement('span');
            messageIcon.className = 'message-icon';
            messageIcon.textContent = '💬';
            messageIcon.style.cursor = 'pointer';
            messageIcon.title = 'Açıklama mesajlarını görüntüle';
            messageIcon.onclick = (e) => {
              e.stopPropagation();
              openRowAciklamaModal(row);
            };
            tdAciklama.appendChild(messageIcon);
          } else {
            refreshIcon.style.opacity = '0.6';
          }
        };
        tdAciklama.appendChild(refreshIcon);
      }
      
      tr.appendChild(tdAciklama);
      
      // Satıra tıklanınca onay popup'ı aç (sadece Operasyon ve Depolama için)
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        const session = JSON.parse(userSession);
        
        // Sadece Operasyon veya Depolama ise tıklanabilir yap
        if (session.gorev === 'Operasyon' || session.gorev === 'Depolama') {
          tr.style.cursor = 'pointer';
          tr.addEventListener('click', (e) => {
            // Satırı seç ve vurgula
            document.querySelectorAll('#tbody tr').forEach(tr => {
              tr.style.backgroundColor = '';
            });
            tr.style.backgroundColor = '#e3f2fd';
            selectedRowForAciklama = row;
            
            // Popup'ı aç (mod otomatik session'dan alınacak)
            openApprovalConfirmation(row, currentTable);
          });
        } else {
          // Diğer kullanıcılar için sadece görüntüleme (hover efekti)
          tr.style.cursor = 'default';
          tr.addEventListener('mouseenter', () => {
            tr.style.backgroundColor = '#f5f5f5';
          });
          tr.addEventListener('mouseleave', () => {
            tr.style.backgroundColor = '';
          });
        }
      }
      
      // Eğer "Onaylanan" sütunu varsa sadece o hücrenin font rengini değiştir
      if (row.Onaylanan && row.Tarife_Saati) {
        const onaylananIndex = allKeys.indexOf('Onaylanan');
        if (onaylananIndex !== -1) {
          const onaylananCell = tr.children[onaylananIndex];
          const fontColor = getApprovalFontColor(row.Onaylanan, row.Tarife_Saati);
          onaylananCell.style.color = fontColor;
          onaylananCell.style.fontWeight = 'bold';
        }
      }
      
      tbody.appendChild(tr);
    });
    
    // Checkbox event listener ekle (tüm satırları yenile)
    const refreshAllCheckbox = document.getElementById('refreshAllAciklamaCheckbox');
    if (refreshAllCheckbox) {
      refreshAllCheckbox.addEventListener('change', async function() {
        if (this.checked) {
          // Checkbox'ı pasif yap
          this.disabled = true;
          
          const rows = tbody.querySelectorAll('tr');
          let processed = 0;
          
          for (const row of rows) {
            const iconCell = row.querySelector('.aciklama-icon-cell');
            if (!iconCell) continue;
            
            const hatAdi = iconCell.dataset.hatAdi;
            const tarife = iconCell.dataset.tarife;
            const tarifeSaati = iconCell.dataset.tarifeSaati;
            
            if (!hatAdi || !tarife || !tarifeSaati) continue;
            
            // API'den açıklama kontrolü
            const rowData = { Hat_Adi: hatAdi, Tarife: tarife, Tarife_Saati: tarifeSaati };
            const hasAciklama = await checkRowHasAciklama(rowData);
            const cacheKey = `${hatAdi}|${tarife}|${tarifeSaati}`;
            aciklamaCache[cacheKey] = hasAciklama;
            
            // İkonu güncelle
            const currentIcon = iconCell.querySelector('span');
            if (currentIcon) {
              if (hasAciklama) {
                // Refresh ikonunu kaldır, mesaj ikonu ekle
                iconCell.innerHTML = '';
                const messageIcon = document.createElement('span');
                messageIcon.className = 'message-icon';
                messageIcon.textContent = '💬';
                messageIcon.style.cursor = 'pointer';
                messageIcon.title = 'Açıklama mesajlarını görüntüle';
                messageIcon.onclick = (e) => {
                  e.stopPropagation();
                  const tr = iconCell.closest('tr');
                  const rowDataStr = tr.dataset.rowData;
                  if (rowDataStr) {
                    const fullRowData = JSON.parse(rowDataStr);
                    openRowAciklamaModal(fullRowData);
                  } else {
                    // Fallback: Key alanları kullan
                    openRowAciklamaModal({
                      Hat_Adi: hatAdi,
                      Tarife: tarife,
                      Tarife_Saati: tarifeSaati
                    });
                  }
                };
                iconCell.appendChild(messageIcon);
              }
              // Mesaj yoksa refresh ikonu zaten var, değiştirme
            }
            
            processed++;
          }
          
          // İşlem bitti: checkbox'ı aktif yap ve işareti kaldır
          this.checked = false;
          this.disabled = false;
          alert(`✅ ${processed} satırın açıklama ikonu yenilendi!`);
        }
      }); // addEventListener kapandı
    } // if (refreshAllCheckbox) kapandı
    
    let filterMsg = currentHareket ? ` (${currentHareket})` : '';
    statusEl.innerHTML = `Başarılı: ${data.length} kayıt alındı${filterMsg} <span id="reopenTimerIcon" class="reopen-timer-icon" title="Timerı Tekrar Aç">⏱️</span>`;
    meta.textContent = `Tablo: ${currentTable} | Toplam sütun: ${allKeys.length}`;
    
    // Kronometre ikonunu referans al
    const reopenIcon = document.getElementById('reopenTimerIcon');
    if (reopenIcon) {
      // Event listener'ın birden fazla kez eklenmesini engelle
      const iconClone = reopenIcon.cloneNode(true);
      reopenIcon.parentNode.replaceChild(iconClone, reopenIcon);
      iconClone.addEventListener('click', () => {
        if (iconClone.style.opacity !== '0.3') {
          timerClosedManually = false;
          startTimer(currentTable, currentHareket);
        }
      });
    }
    
    // Timer'ı başlat (sadece manuel kapatılmadıysa)
    if (!timerClosedManually) {
      startTimer(currentTable, currentHareket);
    } else {
      updateReopenTimerIcon();
    }
    
  } catch (err) {
    console.error('Get table data error:', err);
    statusEl.innerHTML = `<span class="error">Hata: ${err.message}</span>`;
    closeTimer();
  }
}

// ==================== TIMER FUNCTIONS ====================
function startTimer(tableName, hareket) {
  timerClosedManually = false; // Timer açılıyor, flagı sıfırla
  updateReopenTimerIcon(); // İkonu pasif yap
  updateScrollButtons(); // Scroll butonlarını güncelle
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  lastBusTime = null;
  
  timerInterval = setInterval(() => {
    updateTimer(tableName, hareket);
  }, 3000); // 3 saniyede bir güncelle (bandwidth tasarrufu)
  
  updateTimer(tableName, hareket);
}

async function updateTimer(tableName, hareket) {
  // Manuel kapatıldıysa çık
  if (timerClosedManually) {
    return;
  }
  
  try {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;
    
    const res = await fetch('/api/get-next-bus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        tableName: tableName,
        currentTime: currentTime,
        hareket: hareket
      })
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      closeTimer();
      return;
    }
    
    if (result.success && result.nextBusList && result.nextBusList.length > 0) {
      const busList = result.nextBusList;
      console.log('🚌 Timer güncelleme: Araç sayısı =', busList.length);
      
      const currentBus = busList[currentBusIndex % busList.length];
      const { hatAdi, plaka, tarife, tarifeSaati, hareket: busHareket, calismaZamani, remainingSeconds } = currentBus;
      
      if (lastBusTime !== tarifeSaati) {
        lastBusTime = tarifeSaati;
        currentBusList = busList;
        currentBusIndex = 0;
        
        // Slide mekanizması: birden fazla otobüs varsa başlat
        if (busList.length > 1) {
          startSlideShow();
        } else {
          stopSlideShow();
        }
        
        // Manuel kapatıldıysa timer'ı gösterme
        if (!timerClosedManually) {
          timerContainer.style.display = 'block';
        }
      }
      
      // Birden fazla araç varsa liste göster, tek araç varsa normal görünüm
      console.log('🔍 Araç sayısı kontrolü:', busList.length, '> 1 =', busList.length > 1);
      if (busList.length > 1) {
        console.log('✅ Çoklu araç modu - showMultipleBusesList çağrılıyor');
        showMultipleBusesList(busList, remainingSeconds);
      } else {
        console.log('✅ Tek araç modu - showSingleBusInfo çağrılıyor');
        showSingleBusInfo(currentBus);
      }
      
      // Timer bilgilerini güncelle (slide'daki mevcut otobüs - eski yapı ile uyumluluk için)
      timerHatAdi.textContent = currentBus.hatAdi || '-';
      timerPlaka.textContent = currentBus.plaka || '-';
      timerTarife.textContent = currentBus.tarife || '-';
      timerHareket.textContent = currentBus.hareket || '-';
      
      // Durum bilgisini güncelle
      const durumValue = currentBus.durum || '';
      if (durumValue && durumValue.trim() !== '') {
        timerDurum.textContent = durumValue;
        timerDurum.style.color = '#e74c3c';
        timerDurum.style.fontWeight = 'bold';
      } else {
        timerDurum.textContent = 'Normal';
        timerDurum.style.color = '#2c3e50';
        timerDurum.style.fontWeight = 'normal';
      }
      
      // Önceki ve sonraki saatleri getir
      await updatePrevNextTimes(tableName, tarifeSaati, currentBus.hareket, currentBus.calismaZamani);
      
      // Dinamik takip ve renk kodlama
      if (busList.length > 1) {
        // Çoklu otobüs: yeşil (>2dk) veya kırmızı (<2dk) highlight
        highlightMultipleBuses(busList, remainingSeconds);
      } else {
        // Tek otobüs: normal sarı highlight
        scrollToTimerRow(currentBus);
      }
      
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      
      // Kalan süre altındaki hat adını güncelle
      const timerCurrentHatName = document.getElementById('timerCurrentHatName');
      if (timerCurrentHatName) {
        timerCurrentHatName.textContent = currentBus.hatAdi || '-';
      }
      
      // 2 dakikadan az kaldıysa kırmızı warning
      if (remainingSeconds <= 120 && remainingSeconds > 0) {
        timerDisplay.classList.add('timer-warning');
      } else {
        timerDisplay.classList.remove('timer-warning');
      }
      
      if (remainingSeconds <= 0) {
        lastBusTime = null;
        currentTimerRow = null;
        currentBusList = [];
        stopSlideShow();
      }
    } else {
      closeTimer();
    }
  } catch (err) {
    console.error('Timer update error:', err);
  }
}

let slideResumeTimeout = null;

function handleBusItemClick(bus) {
  console.log('👆 Araç seçildi, slider 5 saniye durduruluyor:', bus);
  
  // currentTimerRow'u güncelle (dinamik takip için)
  currentTimerRow = bus;
  
  // Slider'ı durdur
  stopSlideShow();
  
  // Mevcut resume timeout varsa iptal et
  if (slideResumeTimeout) {
    clearTimeout(slideResumeTimeout);
    slideResumeTimeout = null;
  }
  
  // Tıklanan otobüsün index'ini bul ve currentBusIndex'i güncelle
  const busIndex = currentBusList.findIndex(b => 
    b.hatAdi === bus.hatAdi && 
    b.tarifeSaati === bus.tarifeSaati && 
    b.hareket === bus.hareket
  );
  if (busIndex !== -1) {
    currentBusIndex = busIndex;
    console.log('🎯 currentBusIndex güncellendi:', currentBusIndex);
  }
  
  // Timer bilgilerini güncelle
  timerHatAdi.textContent = bus.hatAdi || '-';
  timerPlaka.textContent = bus.plaka || '-';
  timerTarife.textContent = bus.tarife || '-';
  timerHareket.textContent = bus.hareket || '-';
  
  // Durum bilgisini güncelle
  const durumValue = bus.durum || '';
  if (durumValue && durumValue.trim() !== '') {
    timerDurum.textContent = durumValue;
    timerDurum.style.color = '#e74c3c';
    timerDurum.style.fontWeight = 'bold';
  } else {
    timerDurum.textContent = 'Normal';
    timerDurum.style.color = '#2c3e50';
    timerDurum.style.fontWeight = 'normal';
  }
  
  // Kalan süre altındaki hat adını güncelle
  const timerCurrentHatName = document.getElementById('timerCurrentHatName');
  if (timerCurrentHatName) {
    timerCurrentHatName.textContent = bus.hatAdi || '-';
  }
  
  // Önceki ve sonraki saatleri güncelle
  updatePrevNextTimes(bus.tableName || currentTable, bus.tarifeSaati, bus.hareket, bus.calismaZamani);
  
  // 5 saniye sonra slider'ı yeniden başlat
  slideResumeTimeout = setTimeout(() => {
    console.log('▶️ 5 saniye geçti, slider yeniden başlatılıyor');
    if (currentBusList.length > 1) {
      startSlideShow();
    }
  }, 5000);
}

function showSingleBusInfo(bus) {
  const singleBusInfo = document.getElementById('timerSingleBusInfo');
  const multipleBusList = document.getElementById('timerMultipleBusList');
  
  if (singleBusInfo && multipleBusList) {
    singleBusInfo.style.display = 'block';
    multipleBusList.style.display = 'none';
  }
}

function showMultipleBusesList(busList, currentRemainingSeconds) {
  console.log('🚌 showMultipleBusesList çağrıldı, araç sayısı:', busList.length);
  
  const singleBusInfo = document.getElementById('timerSingleBusInfo');
  const multipleBusList = document.getElementById('timerMultipleBusList');
  
  console.log('📋 HTML elementleri:', { singleBusInfo, multipleBusList });
  
  if (!singleBusInfo || !multipleBusList) {
    console.error('❌ Timer HTML elementleri bulunamadı!');
    return;
  }
  
  // Tek araç görünümünü gizle, liste görünümünü göster
  singleBusInfo.style.display = 'none';
  multipleBusList.style.display = 'block';
  
  console.log('✅ Liste görünümü aktif edildi');
  
  // Liste içeriğini oluştur
  multipleBusList.innerHTML = '';
  
  busList.forEach((bus, index) => {
    const busItem = document.createElement('div');
    busItem.className = 'timer-bus-item';
    busItem.style.cursor = 'pointer';
    
    const hatAdi = bus.hatAdi || '-';
    const plaka = bus.plaka || '-';
    const tarife = bus.tarife || '-';
    const hareket = bus.hareket || '-';
    const durum = bus.durum || '';
    
    // Arızalı durumunda kırmızı arka plan + beyaz yazı
    if (durum && durum.toLowerCase().includes('arızalı')) {
      busItem.style.backgroundColor = '#e74c3c';
      busItem.style.color = '#ffffff';
      busItem.style.fontWeight = 'bold';
    } else {
      // 2 dakikadan az kalan araçları kırmızı, fazla olanları yeşil yap
      if (bus.remainingSeconds <= 120) {
        busItem.classList.add('warning');
      } else {
        busItem.classList.add('safe');
      }
    }
    
    // Durum bilgisini ekle
    const durumText = durum ? ` - <strong>${durum}</strong>` : '';
    busItem.innerHTML = `${hatAdi} - ${plaka} - ${tarife} - ${hareket}${durumText}`;
    
    // Tıklanma olayı ekle
    busItem.addEventListener('click', () => {
      console.log('👆 Çoklu araç listesinden seçildi:', bus);
      handleBusItemClick(bus);
    });
    
    console.log(`  ➡️ ${index + 1}. ${hatAdi} - ${plaka} - ${tarife} - ${hareket} - Durum: ${durum || 'Normal'} (${bus.remainingSeconds}s)`);
    
    multipleBusList.appendChild(busItem);
  });
  
  console.log(`✅ ${busList.length} araç listesi oluşturuldu`);
}

function closeTimer() {
  console.log('🗑️ closeTimer() çağrıldı');
  console.trace('closeTimer stack trace:'); // Kim çağırdı?
  
  // ÖNCE display:none yap - kullanıcıya hemen geri bildirim
  if (timerContainer) {
    timerContainer.style.display = 'none';
  }
  
  // State flag'lerini HEMEN sıfırla (yeniden açılmayı engelle)
  timerClosedManually = true;
  lastBusTime = null;
  currentTimerRow = null;
  currentBusList = [];
  currentBusIndex = 0;
  selectedHatsForTracking = []; // Takip edilen hatları temizle
  selectedHareketForTracking = null; // Takip edilen hareket tipini temizle
  
  // TÜM interval'ları ve timeout'ları agresif bir şekilde temizle
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('  ✔️ timerInterval temizlendi');
  }
  
  if (tableRefreshInterval) {
    clearInterval(tableRefreshInterval);
    tableRefreshInterval = null;
    console.log('  ✔️ tableRefreshInterval temizlendi');
  }
  
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
    console.log('  ✔️ slideInterval temizlendi');
  }
  
  if (highlightTimeout) {
    clearTimeout(highlightTimeout);
    highlightTimeout = null;
    console.log('  ✔️ highlightTimeout temizlendi');
  }
  
  // stopSlideShow'u çağır (ek güvenlik)
  stopSlideShow();
  
  // Vurguları temizle (sadece timer vurguları)
  if (!isManualHighlight) {
    clearAllHighlights();
  }
  
  // UI güncellemelerini hemen yap
  updateReopenTimerIcon();
  updateScrollButtons();
  
  console.log('✅ closeTimer() tamamlandı');
}

function startSlideShow() {
  stopSlideShow(); // Önce mevcut slide'ı durdur
  
  slideInterval = setInterval(() => {
    if (currentBusList.length <= 1) {
      stopSlideShow();
      return;
    }
    
    currentBusIndex = (currentBusIndex + 1) % currentBusList.length;
    const currentBus = currentBusList[currentBusIndex];
    
    // Timer bilgilerini güncelle
    timerHatAdi.textContent = currentBus.hatAdi || '-';
    timerPlaka.textContent = currentBus.plaka || '-';
    timerTarife.textContent = currentBus.tarife || '-';
    timerHareket.textContent = currentBus.hareket || '-';
    
    // Önceki/sonraki saatleri güncelle
    updatePrevNextTimes(currentBus.tableName, currentBus.tarifeSaati, currentBus.hareket, currentBus.calismaZamani);
  }, 5000); // 5 saniyede bir değişir
}

function stopSlideShow() {
  if (slideInterval) {
    clearInterval(slideInterval);
    slideInterval = null;
  }
}

function highlightMultipleBuses(busList, remainingSeconds) {
  // Manuel vurgu aktifse timer vurgularını yapma
  if (isManualHighlight) {
    return;
  }
  
  // Önce tüm vurguları temizle
  clearAllHighlights();
  
  // Dinamik takip kapalıysa çık
  if (!dynamicTrackingCheckbox.checked) {
    return;
  }
  
  console.log('🎨 highlightMultipleBuses çağrıldı:', {
    busCount: busList.length,
    remainingSeconds
  });
  
  const rows = tbody.querySelectorAll('tr');
  const headerCells = theadRow.querySelectorAll('th');
  const headers = Array.from(headerCells).map(th => th.textContent.trim());
  
  const hatAdiIndex = headers.indexOf('Hat_Adi');
  const tarifeIndex = headers.indexOf('Tarife');
  const tarifeSaatiIndex = headers.indexOf('Tarife_Saati');
  const hareketIndex = headers.indexOf('Hareket');
  
  let firstMatchFound = false;
  
  // Her otobüsü tabloda bul ve vurgula
  busList.forEach(bus => {
    // Her otobüs için kalan süresine göre renk belirle
    const busRemainingSeconds = bus.remainingSeconds || 0;
    const highlightColor = busRemainingSeconds <= 120 ? '#ffcccc' : '#d4edda'; // Kırmızı veya yeşil
    
    console.log('🔍 Aranan otobüs:', {
      hatAdi: bus.hatAdi,
      tarife: bus.tarife,
      tarifeSaati: bus.tarifeSaati,
      hareket: bus.hareket,
      remainingSeconds: busRemainingSeconds,
      color: highlightColor
    });
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');
      
      if (cells.length === 0) continue;
      
      // Sütun indekslerini kullanarak eşleştir
      const hatAdiCell = hatAdiIndex >= 0 ? cells[hatAdiIndex]?.textContent.trim() : '';
      const tarifeCell = tarifeIndex >= 0 ? cells[tarifeIndex]?.textContent.trim() : '';
      const tarifeSaatiCell = tarifeSaatiIndex >= 0 ? cells[tarifeSaatiIndex]?.textContent.trim() : '';
      const hareketCell = hareketIndex >= 0 ? cells[hareketIndex]?.textContent.trim() : '';
      
      const hatAdiMatch = !bus.hatAdi || hatAdiCell === bus.hatAdi;
      const tarifeMatch = !bus.tarife || tarifeCell === bus.tarife;
      const tarifeSaatiMatch = tarifeSaatiCell === bus.tarifeSaati || tarifeSaatiCell === bus.tarifeSaati?.substring(0, 5);
      const hareketMatch = !bus.hareket || hareketCell === bus.hareket;
      
      // Hat adı, tarife saati ve hareket ile eşleşme kontrolü
      if (hatAdiMatch && tarifeSaatiMatch && hareketMatch) {
        row.style.backgroundColor = highlightColor;
        highlightedRows.push(row);
        
        console.log('✅ Satır vurgulandı:', {
          rowIndex: i,
          hatAdi: hatAdiCell,
          tarife: tarifeCell,
          tarifeSaati: tarifeSaatiCell,
          hareket: hareketCell,
          color: highlightColor
        });
        
        // İlk eşleşen satıra scroll et (sadece bir kez)
        if (!firstMatchFound) {
          firstMatchFound = true;
          row.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
        
        // break kaldırıldı - aynı otobüsün tüm satırlarını bul
      }
    }
  });
  
  console.log(`🎨 Toplam ${highlightedRows.length} satır vurgulandı`);
}

function clearAllHighlights() {
  highlightedRows.forEach(row => {
    if (row && row.style) row.style.backgroundColor = '';
  });
  highlightedRows = []; // Array'i temizle
}

function updateReopenTimerIcon() {
  const icon = document.getElementById('reopenTimerIcon');
  if (!icon) return;
  
  const hasData = tbody.querySelectorAll('tr').length > 0 && 
                  tbody.querySelector('tr td')?.textContent !== 'Henüz veri yok.';
  
  if (timerClosedManually && hasData) {
    // Timer kapatıldı ve veri var - ikonu aktif et
    icon.style.opacity = '1';
    icon.style.cursor = 'pointer';
    icon.title = 'Timer\'ı Tekrar Aç';
  } else {
    // Timer açık veya veri yok - ikonu pasif et
    icon.style.opacity = '0.3';
    icon.style.cursor = 'not-allowed';
    icon.title = timerClosedManually ? 'Veri yok' : 'Timer zaten açık';
  }
}

function updateScrollButtons() {
  // Scroll butonları her zaman görünür kalacak
  // Timer aktif olduğunda timer satırına scroll, değilse sayfanın başına scroll yapar
}

// ==================== DEPOLAMA FILTER FUNCTIONS ====================
function renderDepolamaCheckboxes() {
  const depolamaTables = [
    'AKSU', 'MEYDAN', 'VARSAK ALTIAYAK', 'OTOGAR', 'VARSAK AKTARMA', 
    'ÜNSAL', 'SARISU', 'GÜRSU', 'ORGANİZE SANAYİ', 'TRT KAMPI', 
    'VARSAK', 'GÜZELOBA', 'KURŞUNLU ŞELALESİ', 'TERMİNAL', 
    'AKDENİZ ÜNİVERSİTESİ', 'KEPEZ KAYMAKAMLIĞI', 'VARSAK BELEDİYE', 
    'DEEPO AVM', 'ŞEHİR HASTANESİ', 'ANTOBÜS'
  ];
  
  // Kullanıcı bazlı depolama erişim kontrolü
  const userSession = localStorage.getItem('userSession');
  let allowedDepolamalar = depolamaTables; // Varsayılan: Tümü
  
  if (userSession) {
    const session = JSON.parse(userSession);
    const username = session.username; // Kullanıcı_Verileri tablosundaki "Kullanıcı" sütunu
    
    console.log('🔍 Kullanıcı adı:', username);
    console.log('🔍 Kullanıcı tipi:', typeof username);
    console.log('🔍 Kullanıcı uzunluğu:', username ? username.length : 0);
    
    // Kullanıcı adına göre izin verilen depolamalar
    const depolamaAccess = {
      'Aksu Depolama': ['AKSU'],
      'Meydan Depolama': ['MEYDAN'],
      'Otogar Depolama': ['OTOGAR'],
      'Sarısu Depolama': ['SARISU', 'GÜRSU'],
      'Ünsal Depolama': ['ÜNSAL'],
      'Varsak Aktarma Depolama': ['VARSAK AKTARMA'],
      'Varsak Altıayak Depolama': ['VARSAK ALTIAYAK']
    };
    
    console.log('🔍 Erişim kontrolü:', depolamaAccess[username] ? 'Bulundu' : 'Bulunamadı');
    
    // Eğer kullanıcı adı depolama erişim listesinde varsa
    if (depolamaAccess[username]) {
      allowedDepolamalar = depolamaAccess[username];
      console.log(`🔒 Depolama kısıtlaması aktif: ${username} → ${allowedDepolamalar.join(', ')}`);
    } else {
      console.log(`✅ Tüm depolamalara erişim: ${username}`);
    }
  }
  
  depolamaCheckboxList.innerHTML = '';
  
  // Seçimleri sıfırla
  selectedDepolamaTables = [];
  selectAllDepolama.checked = false;
  selectAllDepolama.indeterminate = false;
  
  depolamaTables.forEach(tableName => {
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.marginBottom = '5px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = tableName;
    checkbox.className = 'depolama-checkbox';
    checkbox.style.marginRight = '8px';
    
    // Erişim kontrolü: Eğer izinli depolamalar listesinde değilse disable et
    if (!allowedDepolamalar.includes(tableName)) {
      checkbox.disabled = true;
      label.style.opacity = '0.4';
      label.style.cursor = 'not-allowed';
      label.title = 'Bu depolamaya erişim yetkiniz yok';
    }
    
    checkbox.addEventListener('change', updateSelectAllDepolama);
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(tableName));
    depolamaCheckboxList.appendChild(label);
  });
}

function handleSelectAllDepolama(e) {
  const checkboxes = document.querySelectorAll('.depolama-checkbox');
  const isChecked = e.target.checked;
  
  checkboxes.forEach(checkbox => {
    // Sadece aktif (disabled olmayan) checkbox'ları seç/kaldır
    if (!checkbox.disabled) {
      checkbox.checked = isChecked;
    }
  });
  
  // Eğer tümü seç kaldırıldıysa, seçili olanları da temizle
  if (!isChecked) {
    selectedDepolamaTables = [];
  }
}

function updateSelectAllDepolama() {
  const checkboxes = document.querySelectorAll('.depolama-checkbox:not(:disabled)');
  const checkedCheckboxes = document.querySelectorAll('.depolama-checkbox:not(:disabled):checked');
  const checkedCount = checkedCheckboxes.length;
  
  if (checkboxes.length === 0) {
    selectAllDepolama.checked = false;
    selectAllDepolama.indeterminate = false;
  } else if (checkedCount === 0) {
    selectAllDepolama.checked = false;
    selectAllDepolama.indeterminate = false;
  } else if (checkedCount === checkboxes.length) {
    selectAllDepolama.checked = true;
    selectAllDepolama.indeterminate = false;
  } else {
    selectAllDepolama.checked = false;
    selectAllDepolama.indeterminate = true;
  }
}

async function handleApplyDepolamaFilter() {
  const checkboxes = document.querySelectorAll('.depolama-checkbox:checked');
  selectedDepolamaTables = Array.from(checkboxes).map(cb => cb.value);
  
  // Timer'ı kapat (filtre değiştiği için)
  closeTimer();
  
  if (selectedDepolamaTables.length === 0) {
    // Depolama filtresi yok, Hat Seçimi'ni gizle
    filteredHats = [];
    statusEl.textContent = 'Depolama filtresi kaldırıldı. Lütfen depolama seçin.';
    
    // Hat seçimi bölümünü gizle
    if (hatSelectionContainer) {
      hatSelectionContainer.style.display = 'none';
    }
    
    theadRow.innerHTML = "<th>Depolama Filtresi Uygulayın</th>";
    tbody.innerHTML = '<tr><td class="small">Depolama filtresi seçip uygulayın</td></tr>';
    return;
  }
  
  console.log('📦 Seçilen depolama tabloları:', selectedDepolamaTables);
  
  statusEl.textContent = `${selectedDepolamaTables.join(', ')} depolama(lar)ından hatlar yükleniyor...`;
  applyDepolamaFilter.disabled = true;
  
  try {
    const res = await fetch('/api/get-depolama-hats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        depolamaTables: selectedDepolamaTables
      })
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || 'Hatlar alınamadı');
    }
    
    filteredHats = result.hats || [];
    
    console.log('✅ Bulunan hatlar:', filteredHats);
    
    if (filteredHats.length === 0) {
      statusEl.innerHTML = '<span class="small">⚠️ Seçilen depolama tablolarında hat bulunamadı.</span>';
      tableSelect.innerHTML = '<option value="">-- Hat Bulunamadı --</option>';
      return;
    }
    
    statusEl.textContent = `✅ ${filteredHats.length} hat bulundu: ${filteredHats.join(', ')}`;
    
    // Filtrelenmiş tabloları yükle
    await loadFilteredTables();
    
    // Hat seçimlerini sıfırla (depolama değiştiği için)
    selectedHats = [];
    selectAllHats.checked = false;
    
  } catch (err) {
    console.error('Depolama filter error:', err);
    statusEl.innerHTML = `<span class="error">❌ Hata: ${err.message}</span>`;
  } finally {
    applyDepolamaFilter.disabled = false;
  }
}

async function loadFilteredTables() {
  try {
    const res = await fetch('/api/list-tables');
    
    if (!res.ok) {
      throw new Error('Tablolar alınamadı');
    }
    
    const result = await res.json();
    let allTables = result.tables || []; // Tüm gerçek tablolar
    
    // Sistem tablolarını filtrele (hat olmayan tablolar)
    const systemTables = [
      'Depolama_Açıklama',
      'Operasyon_Açıklama',
      'Saat',
      'Kullanıcı_Verileri',
      'Kullanıcılar',
      'Takip'
    ];
    
    allTables = allTables.filter(table => !systemTables.includes(table));
    console.log('🗂️ Sistem tabloları filtrelendi, kalan tablolar:', allTables);
    
    let tables = allTables;
    
    // Depolama filtresi varsa, sadece hem filteredHats'ta hem de gerçek tablolarda olan hatları göster
    if (filteredHats.length > 0) {
      tables = allTables.filter(table => filteredHats.includes(table));
      console.log('🔍 Filtreleme sonucu:');
      console.log('  - Depolamadan gelen hatlar:', filteredHats);
      console.log('  - Gerçek tablolar:', allTables);
      console.log('  - Kesişim (gösterilecek):', tables);
    }
    
    if (tables.length === 0) {
      statusEl.innerHTML = '<span class="small">Filtreye uygun tablo bulunamadı.</span>';
      tableSelect.innerHTML = '<option value="">-- Tablo Bulunamadı --</option>';
      theadRow.innerHTML = "<th>Boş</th>";
      tbody.innerHTML = '<tr><td class="small">Kayıt yok.</td></tr>';
      
      // Hat seçimi bölümünü temizle ve gizle
      availableHats = [];
      hatCheckboxList.innerHTML = '';
      hatSelectionContainer.style.display = 'none';
      selectedHats = [];
      if (selectAllHats) selectAllHats.checked = false;
      
      closeTimer();
      return;
    }
    
    // Tabloları dropdown'a ekle
    if (tableSelect) {
      tableSelect.innerHTML = '<option value="">-- Tablo Seçin --</option>';
      tables.forEach(table => {
        const option = document.createElement('option');
        option.value = table;
        option.textContent = table;
        tableSelect.appendChild(option);
      });
    }
    
    statusEl.textContent = `${tables.length} tablo listeleniyor (${filteredHats.length > 0 ? 'Filtrelenmiş' : 'Tümü'}).`;
    theadRow.innerHTML = "<th>Tablo Seçiniz</th>";
    tbody.innerHTML = '<tr><td class="small">Tablo seçiniz</td></tr>';
    
    // Mevcut hatları kaydet
    availableHats = tables;
    console.log('🎯 Hat Seçimi için oluşturulan hatlar:', availableHats);
    
    // Sadece depolama filtresi uygulandıysa Hat Seçimi bölümünü göster
    if (filteredHats.length > 0) {
      console.log('✅ Depolama filtresi aktif, Hat Seçimi gösteriliyor');
      renderHatCheckboxes();
    } else {
      console.log('❌ Depolama filtresi yok, Hat Seçimi gizleniyor');
      hatSelectionContainer.style.display = 'none';
    }
    
  } catch (err) {
    console.error('Load filtered tables error:', err);
    statusEl.innerHTML = `<span class="error">Hata: ${err.message}</span>`;
  }
}

// ==================== HAT SELECTION FUNCTIONS ====================
async function renderHatCheckboxes() {
  if (availableHats.length === 0) {
    hatSelectionContainer.style.display = 'none';
    return;
  }
  
  // Depolama filtresi varsa, sadece o hatları göster
  let hatsToShow = availableHats;
  if (filteredHats.length > 0) {
    hatsToShow = availableHats.filter(hat => filteredHats.includes(hat));
    console.log('🔍 Hat Seçimi filtrelendi:');
    console.log('  - Tüm hatlar:', availableHats);
    console.log('  - Depolamadan gelenler:', filteredHats);
    console.log('  - Gösterilecekler:', hatsToShow);
  }
  
  if (hatsToShow.length === 0) {
    hatSelectionContainer.style.display = 'none';
    return;
  }
  
  hatSelectionContainer.style.display = 'block';
  hatCheckboxList.innerHTML = '';
  
  // Seçimleri sıfırla
  selectedHats = [];
  selectAllHats.checked = false;
  selectAllHats.indeterminate = false;
  
  // Fetch danger times
  await fetchDangerTimes();
  
  hatsToShow.forEach(hatName => {
    const label = document.createElement('label');
    label.style.display = 'flex';
    label.style.justifyContent = 'space-between';
    label.style.alignItems = 'center';
    label.style.marginBottom = '5px';
    label.style.padding = '4px';
    label.style.borderRadius = '3px';
    label.style.transition = 'background 0.2s';
    
    const leftDiv = document.createElement('div');
    leftDiv.style.display = 'flex';
    leftDiv.style.alignItems = 'center';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = hatName;
    checkbox.className = 'hat-checkbox';
    checkbox.style.marginRight = '8px';
    
    checkbox.addEventListener('change', updateSelectAllHats);
    
    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(document.createTextNode(hatName));
    
    label.appendChild(leftDiv);
    
    // Add danger time display
    const dangerTime = dangerTimesCache[hatName];
    if (dangerTime && dangerTime !== '00:00:00') {
      // Extract MM:SS from HH:MM:SS (skip first 3 chars: 00:)
      const timeDisplay = dangerTime.substring(3, 8);
      const timeSpan = document.createElement('span');
      timeSpan.textContent = timeDisplay;
      timeSpan.style.marginLeft = 'auto';
      timeSpan.style.fontWeight = 'bold';
      timeSpan.style.color = '#e74c3c';
      timeSpan.style.fontSize = '0.9em';
      timeSpan.style.padding = '2px 8px';
      timeSpan.style.background = '#ffe6e6';
      timeSpan.style.borderRadius = '3px';
      label.appendChild(timeSpan);
    }
    
    // Hover effect
    label.addEventListener('mouseenter', () => {
      label.style.background = '#e8f4f8';
    });
    label.addEventListener('mouseleave', () => {
      label.style.background = 'transparent';
    });
    
    hatCheckboxList.appendChild(label);
  });
}

// Fetch danger times from database
async function fetchDangerTimes() {
  try {
    const response = await fetch('/api/get-danger-times');
    
    if (!response.ok) {
      console.warn('Takip times yüklenemedi, HTTP:', response.status);
      return;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('Takip times API hatası:', result.error);
      return;
    }
    
    // API'den gelen data zaten map formatında
    dangerTimesCache = result.data || {};
    
    console.log('✅ Takip times loaded:', Object.keys(dangerTimesCache).length, 'records');
  } catch (error) {
    console.error('Takip times fetch error:', error);
    console.warn('Takip tablosu erişilemedi - zamanlar gösterilmeyecek');
  }
}

// Handle Set Time button click
async function handleSetDangerTime() {
  const timeValue = dangerTimeInput.value.trim();
  
  if (!timeValue) {
    alert('Lütfen bir zaman girin (örn: 35:00 = 35 dakika)');
    return;
  }
  
  // Validate time format MM:SS (dakika:saniye)
  const timePattern = /^([0-5]?[0-9]):([0-5][0-9])$/;
  if (!timePattern.test(timeValue)) {
    alert('Geçersiz zaman formatı! Lütfen MM:SS formatında girin (örn: 35:00 = 35 dakika)');
    return;
  }
  
  // Kullanıcı MM:SS (dakika:saniye) giriyor
  // PostgreSQL için HH:MM:SS formatına çevir: 00:MM:SS
  const [minutes, seconds] = timeValue.split(':');
  const formattedTime = `00:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  
  const checkboxes = document.querySelectorAll('.hat-checkbox:checked');
  const selectedHatNames = Array.from(checkboxes).map(cb => cb.value);
  
  if (selectedHatNames.length === 0) {
    alert('Lütfen en az bir hat seçin');
    return;
  }
  
  try {
    setDangerTimeBtn.disabled = true;
    setDangerTimeBtn.textContent = '⏳ Güncelleniyor...';
    
    // Use API endpoint instead of direct Supabase call
    const response = await fetch('/api/update-danger-time', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        hatNames: selectedHatNames,
        uyariTime: formattedTime
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Güncelleme başarısız');
    }
    
    // Update cache with HH:MM:SS format
    selectedHatNames.forEach(hatName => {
      dangerTimesCache[hatName] = formattedTime;
    });
    
    alert(`✅ ${result.count} hat için uyarı zamanı güncellendi: ${timeValue} (${minutes} dakika ${seconds} saniye)`);
    
    // Re-render to show new times
    await renderHatCheckboxes();
    
    // Re-check previously selected hats
    selectedHatNames.forEach(hatName => {
      const checkbox = document.querySelector(`.hat-checkbox[value="${hatName}"]`);
      if (checkbox) checkbox.checked = true;
    });
    
    // Clear input to default
    dangerTimeInput.value = '00:00';
    
  } catch (error) {
    console.error('Set danger time error:', error);
    alert('❌ Güncelleme hatası: ' + error.message);
  } finally {
    setDangerTimeBtn.disabled = false;
    setDangerTimeBtn.textContent = '⚙️ Set Time';
  }
}

// Token extraction function - VTS penceresinden otomatik token al
async function extractTokenFromVTS(vtsWindow) {
  return new Promise((resolve, reject) => {
    // VTS penceresine mesaj dinleyicisi ekle
    const messageHandler = (event) => {
      // Güvenlik: Sadece VTS domain'inden gelen mesajları kabul et
      if (event.origin !== 'https://vts.kentkart.com.tr') {
        return;
      }
      
      if (event.data && event.data.type === 'VTS_TOKEN') {
        window.removeEventListener('message', messageHandler);
        resolve(event.data.token);
      }
    };
    
    window.addEventListener('message', messageHandler);
    
    // VTS penceresine script inject et (bookmarklet benzeri)
    const injectionScript = `
      (function() {
        try {
          // Token'ı tüm olası yerlerden topla
          const token = localStorage.getItem('access_token') || 
                       localStorage.getItem('token') ||
                       localStorage.getItem('vts_token') ||
                       sessionStorage.getItem('access_token') ||
                       sessionStorage.getItem('token');
          
          if (token) {
            // Parent window'a token'ı gönder
            window.opener.postMessage({
              type: 'VTS_TOKEN',
              token: token
            }, '*');
            
            // Başarı mesajı göster
            const successDiv = document.createElement('div');
            successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #27ae60; color: white; padding: 20px; border-radius: 10px; z-index: 999999; font-family: Arial; box-shadow: 0 4px 6px rgba(0,0,0,0.3);';
            successDiv.innerHTML = '✅ Token başarıyla alındı!<br>Ana pencereye dönebilirsiniz.';
            document.body.appendChild(successDiv);
            
            setTimeout(() => {
              successDiv.remove();
            }, 3000);
          } else {
            throw new Error('Token bulunamadı');
          }
        } catch (error) {
          window.opener.postMessage({
            type: 'VTS_TOKEN_ERROR',
            error: error.message
          }, '*');
        }
      })();
    `;
    
    // Script'i VTS penceresinde çalıştır
    try {
      // VTS penceresine injection kodu gönder (console.log ile)
      // NOT: CORS nedeniyle direkt inject edemiyoruz
      // Alternatif: Kullanıcıya bookmarklet ver
      
      // 5 saniye timeout
      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        
        // Token hala gelmedi, manuel bookmarklet yöntemi
        reject(new Error('Token otomatik alınamadı - bookmarklet kullanılacak'));
      }, 5000);
      
      // Kullanıcıya VTS penceresinde console'da script çalıştırmasını söyle
      // AMA bu otomatik olmalı - o yüzden başka yöntem deneyelim
      
    } catch (error) {
      window.removeEventListener('message', messageHandler);
      reject(error);
    }
  });
}

// Handle VTS Update button click - DESKTOP AUTOMATION
async function handleRunVtsUpdate() {
  try {
    runVtsUpdateBtn.disabled = true;
    runVtsUpdateBtn.innerHTML = '⏳ İşlem başlatılıyor...';
    vtsStatus.style.display = 'block';
    
    // Desktop'ta vts_auto_update.bat dosyası var mı kontrol et
    vtsStatus.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
        <strong>Desktop automation kontrol ediliyor...</strong><br>
        <small>vts_auto_update.bat dosyası aranıyor...</small>
      </div>
    `;
    
    // Desktop/Mobil algılama - User agent kontrolü
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isDesktop = !isMobile;
    
    if (isDesktop) {
      // DESKTOP - vts_auto_update.bat kullanılmalı
      vtsStatus.innerHTML = `
        <div style="background: linear-gradient(135deg, #27ae60, #2ecc71); padding: 25px; border-radius: 12px; text-align: center; color: white;">
          <div style="font-size: 64px; margin-bottom: 15px;">💻</div>
          <strong style="font-size: 20px;">DESKTOP OTOMASYON SİSTEMİ</strong><br><br>
          <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; margin: 15px 0; text-align: left;">
            <strong style="font-size: 16px;">📋 İŞLEM ADIMLARI:</strong><br><br>
            <ol style="text-align: left; margin: 10px 0 10px 20px; line-height: 2.2;">
              <li><strong>vts_auto_update.bat</strong> dosyasını bulun<br>
                  <small style="opacity: 0.8;">(Proje klasöründe olmalı)</small>
              </li>
              <li><strong>ÇİFT TIKLAYIN</strong> - Otomatik başlayacak<br>
                  <small style="opacity: 0.8;">Chrome açılacak, VTS'ye giriş yapın</small>
              </li>
              <li><strong>Token otomatik alınacak</strong><br>
                  <small style="opacity: 0.8;">14 hat işlenecek, sonuçlar gösterilecek</small>
              </li>
            </ol>
          </div>
          
          <div style="background: rgba(255,193,7,0.3); border-left: 4px solid #ffc107; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: left;">
            <strong>⚠️ ÖNEMLİ:</strong><br>
            • <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">vts_auto_update.bat</code> dosyası MUTLAKA proje klasöründe olmalı<br>
            • Python yüklü değilse otomatik yüklenecek<br>
            • Chrome WebDriver otomatik inecek<br>
          </div>
          
          <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-top: 15px;">
            <strong>🚀 NE OLACAK?</strong><br>
            1️⃣ Chrome açılacak → VTS'ye giriş yapın<br>
            2️⃣ Token cookie'den otomatik alınacak<br>
            3️⃣ 14 hat için VTS verileri çekilecek<br>
            4️⃣ Database güncellenecek<br>
            5️⃣ Tamamlandı mesajı gösterilecek
          </div>
          
          <div style="margin-top: 20px;">
            <button onclick="alert('📂 Proje klasöründe vts_auto_update.bat dosyasını bulun\\n\\n✅ ÇİFT TIKLAYIN\\n\\n🚀 Otomatik başlayacak!');" 
                    style="background: white; color: #27ae60; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px; margin: 5px;">
              📖 Detaylı Rehber
            </button>
            <button onclick="document.getElementById('vtsStatus').style.display='none'; document.getElementById('runVtsUpdateBtn').disabled=false; document.getElementById('runVtsUpdateBtn').innerHTML='🚍 VTS\\'den Onay Zamanlarını Getir';" 
                    style="background: rgba(255,255,255,0.3); color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 15px; margin: 5px;">
              ✖️ Kapat
            </button>
          </div>
        </div>
      `;
      
      runVtsUpdateBtn.disabled = false;
      runVtsUpdateBtn.innerHTML = '🚍 VTS\'den Onay Zamanlarını Getir';
      
      return;
    }
    
    // MOBİL CİHAZ - Bat dosyası yok
    vtsStatus.innerHTML = `
      <div style="background: linear-gradient(135deg, #e74c3c, #c0392b); padding: 25px; border-radius: 12px; text-align: center; color: white;">
        <div style="font-size: 64px; margin-bottom: 15px;">🚫</div>
        <strong style="font-size: 22px;">BU İŞLEM KULLANIMA İZNİNİZ YOK</strong><br><br>
        <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; margin-top: 15px; text-align: left;">
          <strong style="font-size: 16px;">⚠️ SADECE DESKTOP BİLGİSAYARDA KULLANILIR</strong><br><br>
          <p style="line-height: 1.8; margin: 10px 0;">
            ❌ Mobil cihazlarda çalışmaz<br>
            ❌ Tablet'te çalışmaz<br>
            ✅ <strong>Sadece Windows PC'de çalışır</strong>
          </p>
          <hr style="border: 1px solid rgba(255,255,255,0.3); margin: 15px 0;">
          <strong>💡 NASIL KULLANILIR?</strong><br><br>
          <ol style="text-align: left; margin: 10px 0 10px 20px; line-height: 2;">
            <li><strong>Desktop PC'ye geçin</strong></li>
            <li>Bu sayfayı Desktop'ta açın</li>
            <li><code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">vts_auto_update.bat</code> dosyası olmalı</li>
            <li>Bu butona basın - otomatik çalışacak</li>
          </ol>
        </div>
        <div style="margin-top: 20px;">
          <button onclick="document.getElementById('vtsStatus').style.display='none'; document.getElementById('runVtsUpdateBtn').disabled=false; document.getElementById('runVtsUpdateBtn').innerHTML='🚍 VTS\\'den Onay Zamanlarını Getir';" 
                  style="background: white; color: #e74c3c; border: none; padding: 12px 25px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px;">
            ✖️ Kapat
          </button>
        </div>
      </div>
    `;
    
    runVtsUpdateBtn.disabled = false;
    runVtsUpdateBtn.innerHTML = '🚍 VTS\'den Onay Zamanlarını Getir';
    
    return;
    
    vtsStatus.innerHTML = `
      <strong>🚀 VTS Token Alma - SUPER KOLAY!</strong><br><br>
      <div style="background: linear-gradient(135deg, #3498db, #2980b9); padding: 20px; border-radius: 10px; text-align: left; margin-bottom: 15px;">
        <strong style="font-size: 18px; color: #f1c40f;">📋 4 ADIM - 1 DAKİKA!</strong><br><br>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
          <strong style="color: #2ecc71;">1️⃣ VTS'YE GİRİŞ YAP</strong><br>
          <button onclick="window.open('https://vts.kentkart.com.tr', '_blank')" 
                  style="margin-top: 8px; background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
            🌐 VTS'yi Aç
          </button>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
          <strong style="color: #f39c12;">2️⃣ TOKEN'I KOPYALA</strong><br>
          VTS sayfasında:<br>
          • <strong>F12</strong> bas<br>
          • <strong>Application</strong> sekmesine git<br>
          • Sol menüden <strong>Local Storage → https://vts.kentkart.com.tr</strong><br>
          • <strong>access_token</strong> değerini kopyala (sağ tık → copy value)
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
          <strong style="color: #9b59b6;">3️⃣ CONSOLE'A GİT</strong><br>
          <small style="opacity: 0.8;">F12'de <strong>Console</strong> sekmesine geç</small>
        </div>
        
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 10px 0;">
          <strong style="color: #e74c3c;">4️⃣ KODU ÇALIŞTIR</strong><br>
          <small style="opacity: 0.8;">Aşağıdaki kod OTOMATIK KOPYALANDI! Console'a Ctrl+V yapıp Enter'a basın.<br>
          Açılan pencereye kopyaladığınız token'ı yapıştırın:</small><br><br>
          <textarea readonly onclick="this.select(); navigator.clipboard.writeText(this.value);" 
                    style="width: 100%; height: 60px; background: #000; color: #0f0; padding: 10px; border: 2px solid #27ae60; border-radius: 6px; font-family: monospace; font-size: 11px; margin-top: 8px;">${tokenExtractionCode}</textarea>
          <button onclick="navigator.clipboard.writeText(\`${tokenExtractionCode}\`); alert('✅ Kod kopyalandı! Şimdi VTS console\\'una Ctrl+V yapıp Enter\\'a basın.');" 
                  style="margin-top: 8px; background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
            📋 Tekrar Kopyala
          </button>
        </div>
      </div>
      
      <div style="background: rgba(39, 174, 96, 0.2); border-left: 4px solid #27ae60; padding: 15px; border-radius: 5px; margin-top: 15px;">
        <strong>💡 NE OLACAK?</strong><br>
        Kod çalıştığında token girmeniz istenecek. Token'ı yapıştırıp OK deyin.<br>
        Sonra otomatik olarak bu sayfaya dönülecek ve 14 hat işlenecek! ✨
      </div>
      
      <div style="margin-top: 15px;">
        <button onclick="document.getElementById('vtsStatus').style.display='none'; document.getElementById('runVtsUpdateBtn').disabled=false; document.getElementById('runVtsUpdateBtn').innerHTML='🚍 VTS\\'den Onay Zamanlarını Getir';" 
                style="background: #95a5a6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
          ↩️ İptal Et
        </button>
      </div>
    `;

    // URL'den token kontrol et (redirect sonrası)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('vtsToken');
    
    if (urlToken) {
      // Token URL'den geldi, temizle ve kullan
      window.history.replaceState({}, document.title, window.location.pathname);
      vtsStatus.innerHTML = '✅ Token başarıyla alındı! İşlem başlıyor...';
      return urlToken;
    }

    // URL'den token bekle
    const vtsToken = await new Promise((resolve, reject) => {
      // URL parametresini sürekli kontrol et
      const checkInterval = setInterval(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('vtsToken');
        
        if (token) {
          clearInterval(checkInterval);
          window.history.replaceState({}, document.title, window.location.pathname);
          resolve(token);
        }
      }, 1000);
      
      // 10 dakika timeout
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Token alma zaman aşımına uğradı'));
      }, 600000);
    });

    if (!vtsToken) {
      throw new Error('Token alınamadı');
    }

    // Token alındı, şimdi VTS script'ini direkt WEB'DEN çalıştır
    vtsStatus.innerHTML = `
      <strong>✅ Token Başarıyla Alındı!</strong><br><br>
      Token preview: ${vtsToken.substring(0, 30)}...<br><br>
      🚀 VTS geçişleri işleniyor...<br>
      <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
        <div id="vtsProgress" style="margin-bottom: 5px;">⏳ Script hazırlanıyor...</div>
        <div id="vtsProgressBar" style="width: 100%; height: 20px; background: rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden;">
          <div id="vtsProgressFill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71); transition: width 0.3s;"></div>
        </div>
      </div>
    `;

    
    // WEB-BASED EXECUTION: Script'i direkt browser'da çalıştır
    try {
      const progressDiv = document.getElementById('vtsProgress');
      const progressBar = document.getElementById('vtsProgressFill');
      
      progressDiv.textContent = '✅ Token alındı, işlem başlıyor...';
      progressBar.style.width = '30%';
      
      // Backend API'ye gönder (route processing için)
      progressDiv.textContent = '🚀 14 hat işleniyor...';
      
      // Script'i çalıştır (backend'de)
      const response = await fetch('/api/execute-vts-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          vtsToken
        })
      });
      
      progressBar.style.width = '60%';
      progressDiv.textContent = '⏳ Geçişler analiz ediliyor...';
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Script çalıştırılamadı');
      }
      
      progressBar.style.width = '100%';
      progressDiv.textContent = '✅ Tamamlandı!';
      
      // Başarılı sonuç göster
      vtsStatus.innerHTML = `
        <strong>✅ İŞLEM TAMAMLANDI!</strong><br><br>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; text-align: left;">
          <strong>📊 Sonuçlar:</strong><br>
          ${result.summary || 'Tüm hatlar işlendi'}<br><br>
          <strong>İşlenen Hatlar:</strong><br>
          SA65, SA64, 400, 521C, KC06, KF52, KL08, KL08G, KM61, SD20, SD20A, SM62, UC32, VS18<br><br>
          <small>Token: ${vtsToken.substring(0, 30)}...</small>
        </div>
      `;
      
      alert(`✅ VTS geçişleri başarıyla işlendi!\n\n${result.summary || '14 hat için tüm geçişler otomatik onaylandı.'}`);
      
      // Tabloyu yenile
      if (typeof refreshData === 'function') {
        setTimeout(() => refreshData(), 1000);
      }
      
    } catch (scriptError) {
      console.error('Web-based execution hatası:', scriptError);
      
      // FALLBACK: Desktop app instructions
      vtsStatus.innerHTML = `
        <strong>⚠️ Web Execution Başarısız</strong><br><br>
        <div style="background: rgba(255,200,0,0.2); padding: 15px; border-radius: 8px; margin: 10px 0;">
          <strong>Hata:</strong> ${scriptError.message}<br><br>
          Token başarıyla alındı ve kaydedildi.<br><br>
          
          <strong>Token:</strong><br>
          <small style="font-family: monospace; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 3px; display: inline-block; margin-top: 5px; word-break: break-all;">
            ${vtsToken}
          </small>
        </div>
        <br>
        <button id="copyTokenBtn" style="background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; margin-bottom: 10px;">
          📋 Token'ı Kopyala
        </button>
        <button id="retryBtn" style="background: #27ae60; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%;">
          🔄 Tekrar Dene
        </button>
      `;
      
      // Copy token button
      setTimeout(() => {
        const copyBtn = document.getElementById('copyTokenBtn');
        if (copyBtn) {
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(vtsToken);
            alert('✅ Token panoya kopyalandı!');
          };
        }
        
        const retryBtn = document.getElementById('retryBtn');
        if (retryBtn) {
          retryBtn.onclick = () => {
            handleRunVtsUpdate();
          };
        }
      }, 100);
    }

    console.log('✅ VTS token kaydedildi:', vtsToken.substring(0, 30) + '...');

  } catch (error) {
    console.error('VTS update error:', error);
    vtsStatus.innerHTML = `❌ Hata: ${error.message}`;
    alert('❌ VTS update hatası: ' + error.message);
  } finally {
    // VTS penceresini kapat (hala açıksa)
    if (vtsWindow && !vtsWindow.closed) {
      vtsWindow.close();
    }
    
    runVtsUpdateBtn.disabled = false;
    runVtsUpdateBtn.innerHTML = '🚍 VTS\'den Onay Zamanlarını Getir';
    
    // Hide status after 10 seconds
    setTimeout(() => {
      vtsStatus.style.display = 'none';
    }, 10000);
  }
}

function handleSelectAllHats(e) {
  const checkboxes = document.querySelectorAll('.hat-checkbox');
  const isChecked = e.target.checked;
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
  });
  
  // Eğer tümü seç kaldırıldıysa, seçili hatları da temizle
  if (!isChecked) {
    selectedHats = [];
  }
  
  // Hatları Yenile butonu kontrolü
  updateRefreshHatsButtonState();
}

function updateSelectAllHats() {
  const checkboxes = document.querySelectorAll('.hat-checkbox');
  const checkedCount = document.querySelectorAll('.hat-checkbox:checked').length;
  
  if (checkboxes.length === 0) {
    selectAllHats.checked = false;
    selectAllHats.indeterminate = false;
  } else if (checkedCount === 0) {
    selectAllHats.checked = false;
    selectAllHats.indeterminate = false;
  } else if (checkedCount === checkboxes.length) {
    selectAllHats.checked = true;
    selectAllHats.indeterminate = false;
  } else {
    selectAllHats.checked = false;
    selectAllHats.indeterminate = true;
  }
  
  // Hatları Yenile butonu kontrolü
  updateRefreshHatsButtonState();
}

async function handleApplyHatSelection() {
  const checkboxes = document.querySelectorAll('.hat-checkbox:checked');
  selectedHats = Array.from(checkboxes).map(cb => cb.value);
  
  if (selectedHats.length === 0) {
    statusEl.innerHTML = '<span class="small">⚠️ Lütfen en az 1 hat seçin.</span>';
    return;
  }
  
  console.log('🚌 Seçilen hatlar:', selectedHats);
  
  statusEl.textContent = `${selectedHats.length} hat yükleniyor...`;
  applyHatSelection.disabled = true;
  
  try {
    // Tüm seçili hatlardan verileri çek
    const allData = [];
    
    for (const tableName of selectedHats) {
      // Tablo adını temizle (boşlukları kaldır)
      const cleanTableName = tableName.trim();
      console.log(`📡 API çağrısı yapılıyor: /api/get-table-data → tableName: "${cleanTableName}"`);
      
      const res = await fetch('/api/get-table-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: cleanTableName,
          hareket: currentHareket
        })
      });
      
      console.log(`📡 API yanıt kodu: ${res.status} (${cleanTableName})`);
      
      if (!res.ok) {
        console.error(`❌ API hatası (${cleanTableName}): Status ${res.status}`);
        continue; // Bu hatta hata var, diğerine geç
      }
      
      const result = await res.json();
      console.log(`✅ API başarılı (${cleanTableName}):`, result);
      
      if (result.success && result.data) {
        // Her satıra kaynak hat bilgisini ekle
        result.data.forEach(row => {
          allData.push({
            ...row,
            _Hat: tableName // Hangi hattan geldiğini göster
          });
        });
      }
    }
    
    if (allData.length === 0) {
      statusEl.innerHTML = `<span class="small">⚠️ Seçilen hatlarda veri bulunamadı (Bugün: ${selectedHats[0] ? 'Çalışma zamanı filtresi uygulandı' : ''})</span>`;
      theadRow.innerHTML = "<th>Boş</th>";
      tbody.innerHTML = `<tr><td class="small">Seçilen hatlarda bugün için uygun veri yok.<br><small>Çalışma_Zamanı filtresi kontrol edilmelidir.</small></td></tr>`;
      applyHatSelection.disabled = false;
      return;
    }
    
    // Tarife_Saati'ne göre sırala (normalize edilmiş saatlerle)
    allData.sort((a, b) => {
      const timeA = normalizeSaat(a.Tarife_Saati || '');
      const timeB = normalizeSaat(b.Tarife_Saati || '');
      return timeA.localeCompare(timeB);
    });
    
    // Tablo başlıklarını oluştur (_Hat sütununu ilk sıraya koy, _IsYeniPlaka'yı gizle)
    const firstRow = allData[0];
    const allKeys = Object.keys(firstRow);
    
    // _Hat'ı başa al
    const hatIndex = allKeys.indexOf('_Hat');
    if (hatIndex > -1) {
      allKeys.splice(hatIndex, 1);
      allKeys.unshift('_Hat');
    }
    
    // _IsYeniPlaka'yı gizle (sadece renklendirme için kullanılacak)
    const isYeniPlakaIndex = allKeys.indexOf('_IsYeniPlaka');
    if (isYeniPlakaIndex > -1) {
      allKeys.splice(isYeniPlakaIndex, 1);
    }
    
    // id sütununu gizle
    const idIndex = allKeys.indexOf('id');
    if (idIndex > -1) {
      allKeys.splice(idIndex, 1);
    }
    
    theadRow.innerHTML = '';
    allKeys.forEach(k => {
      const th = document.createElement('th');
      th.textContent = k === '_Hat' ? 'Hat' : k;
      theadRow.appendChild(th);
    });
    
    // Açıklama ikonu için başlık ekle
    const thAciklama = document.createElement('th');
    thAciklama.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 5px;">
        <span>💬</span>
        <input type="checkbox" id="refreshAllAciklamaCheckbox2" title="Tüm satırların mesaj ikonlarını yenile" style="cursor: pointer;">
      </div>
    `;
    thAciklama.style.textAlign = 'center';
    thAciklama.style.width = '50px';
    theadRow.appendChild(thAciklama);
    
    // ⚡ Cache'i önceden doldur (tablo oluşturmadan önce)
    statusEl.textContent = 'Açıklamalar kontrol ediliyor...';
    const cachePromises = allData.map(async row => {
      const cacheKey = `${row.Hat_Adi}|${row.Tarife}|${row.Tarife_Saati}`;
      if (!aciklamaCache.hasOwnProperty(cacheKey)) {
        const hasAciklama = await checkRowHasAciklama(row);
        aciklamaCache[cacheKey] = hasAciklama;
      }
    });
    await Promise.all(cachePromises);
    
    // Tablo verilerini oluştur
    tbody.innerHTML = '';
    allData.forEach(row => {
      const tr = document.createElement('tr');
      tr.dataset.rowData = JSON.stringify(row);
      allKeys.forEach(k => {
        const td = document.createElement('td');
        const value = row[k];
        
        td.textContent = value !== null && value !== undefined ? value : '';
        
        // Plaka sütunu: Yeni_Plaka'dan geliyorsa kırmızı yap
        if (k === 'Plaka' && row._IsYeniPlaka) {
          td.style.color = '#e74c3c';
          td.style.fontWeight = 'bold';
        }
        
        // "Durum" sütunu ve "Arızalı" varsa kırmızı yap
        if (k === 'Durum' && value && value.toString().toLowerCase().includes('arızalı')) {
          td.style.color = '#e74c3c';
          td.style.fontWeight = 'bold';
        }
        
        tr.appendChild(td);
      });
      
      // Açıklama ikonu sütunu ekle
      const tdAciklama = document.createElement('td');
      tdAciklama.style.textAlign = 'center';
      tdAciklama.style.fontSize = '18px';
      tdAciklama.className = 'aciklama-icon-cell';
      tdAciklama.dataset.hatAdi = row.Hat_Adi || '';
      tdAciklama.dataset.tarife = row.Tarife || '';
      tdAciklama.dataset.tarifeSaati = row.Tarife_Saati || '';
      
      const cacheKey = `${row.Hat_Adi}|${row.Tarife}|${row.Tarife_Saati}`;
      const hasAciklama = aciklamaCache[cacheKey];
      
      if (hasAciklama) {
        // Mesaj ikonu göster
        const messageIcon = document.createElement('span');
        messageIcon.className = 'message-icon';
        messageIcon.textContent = '💬';
        messageIcon.style.cursor = 'pointer';
        messageIcon.title = 'Açıklama mesajlarını görüntüle';
        messageIcon.onclick = (e) => {
          e.stopPropagation();
          openRowAciklamaModal(row);
        };
        tdAciklama.appendChild(messageIcon);
      } else {
        // Refresh ikonu göster (mesaj yoksa)
        const refreshIcon = document.createElement('span');
        refreshIcon.textContent = '🔄';
        refreshIcon.style.cursor = 'pointer';
        refreshIcon.style.fontSize = '14px';
        refreshIcon.style.opacity = '0.6';
        refreshIcon.title = 'Bu satırın mesaj durumunu kontrol et';
        refreshIcon.onclick = async (e) => {
          e.stopPropagation();
          refreshIcon.style.opacity = '0.3';
          const hasAciklama = await checkRowHasAciklama(row);
          const cacheKey = `${row.Hat_Adi}|${row.Tarife}|${row.Tarife_Saati}`;
          aciklamaCache[cacheKey] = hasAciklama;
          
          if (hasAciklama) {
            // Refresh ikonunu kaldır, mesaj ikonu ekle
            tdAciklama.innerHTML = '';
            const messageIcon = document.createElement('span');
            messageIcon.className = 'message-icon';
            messageIcon.textContent = '💬';
            messageIcon.style.cursor = 'pointer';
            messageIcon.title = 'Açıklama mesajlarını görüntüle';
            messageIcon.onclick = (e) => {
              e.stopPropagation();
              openRowAciklamaModal(row);
            };
            tdAciklama.appendChild(messageIcon);
          } else {
            refreshIcon.style.opacity = '0.6';
          }
        };
        tdAciklama.appendChild(refreshIcon);
      }
      
      tr.appendChild(tdAciklama);
      
      // Satıra tıklanınca onay popup'ı aç (sadece Operasyon ve Depolama için)
      const originalTableName = row._Hat || selectedHats[0];
      
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        const session = JSON.parse(userSession);
        
        if (session.gorev === 'Operasyon' || session.gorev === 'Depolama') {
          tr.style.cursor = 'pointer';
          tr.addEventListener('click', () => {
            openApprovalConfirmation(row, originalTableName);
          });
        } else {
          tr.style.cursor = 'default';
          tr.addEventListener('mouseenter', () => {
            tr.style.backgroundColor = '#f5f5f5';
          });
          tr.addEventListener('mouseleave', () => {
            tr.style.backgroundColor = '';
          });
        }
      }
      
      // Eğer "Onaylanan" sütunu varsa sadece o hücrenin font rengini değiştir
      if (row.Onaylanan && row.Tarife_Saati) {
        const onaylananIndex = allKeys.indexOf('Onaylanan');
        if (onaylananIndex !== -1) {
          const onaylananCell = tr.children[onaylananIndex];
          const fontColor = getApprovalFontColor(row.Onaylanan, row.Tarife_Saati);
          onaylananCell.style.color = fontColor;
          onaylananCell.style.fontWeight = 'bold';
        }
      }
      
      tbody.appendChild(tr);
    });
    
    // Checkbox event listener ekle (tüm satırları yenile) - İkinci lokasyon
    const refreshAllCheckbox2 = document.getElementById('refreshAllAciklamaCheckbox2');
    if (refreshAllCheckbox2) {
      refreshAllCheckbox2.addEventListener('change', async function() {
        if (this.checked) {
          // Checkbox'ı pasif yap
          this.disabled = true;
          
          const rows = tbody.querySelectorAll('tr');
          let processed = 0;
          
          for (const row of rows) {
            const iconCell = row.querySelector('.aciklama-icon-cell');
            if (!iconCell) continue;
            
            const hatAdi = iconCell.dataset.hatAdi;
            const tarife = iconCell.dataset.tarife;
            const tarifeSaati = iconCell.dataset.tarifeSaati;
            
            if (!hatAdi || !tarife || !tarifeSaati) continue;
            
            // API'den açıklama kontrolü
            const rowData = { Hat_Adi: hatAdi, Tarife: tarife, Tarife_Saati: tarifeSaati };
            const hasAciklama = await checkRowHasAciklama(rowData);
            const cacheKey = `${hatAdi}|${tarife}|${tarifeSaati}`;
            aciklamaCache[cacheKey] = hasAciklama;
            
            // İkonu güncelle
            const currentIcon = iconCell.querySelector('span');
            if (currentIcon) {
              if (hasAciklama) {
                // Refresh ikonunu kaldır, mesaj ikonu ekle
                iconCell.innerHTML = '';
                const messageIcon = document.createElement('span');
                messageIcon.className = 'message-icon';
                messageIcon.textContent = '💬';
                messageIcon.style.cursor = 'pointer';
                messageIcon.title = 'Açıklama mesajlarını görüntüle';
                messageIcon.onclick = (e) => {
                  e.stopPropagation();
                  // rowData'yı DOM'dan yeniden oluştur
                  const tr = iconCell.closest('tr');
                  const cells = tr.querySelectorAll('td');
                  const headers = Array.from(theadRow.querySelectorAll('th')).map(th => th.textContent.trim());
                  const fullRowData = {};
                  cells.forEach((cell, i) => {
                    if (headers[i] && !headers[i].includes('💬')) {
                      fullRowData[headers[i]] = cell.textContent;
                    }
                  });
                  openRowAciklamaModal(fullRowData);
                };
                iconCell.appendChild(messageIcon);
              }
              // Mesaj yoksa refresh ikonu zaten var, değiştirme
            }
            
            processed++;
          }
          
          // İşlem bitti: checkbox'ı aktif yap ve işareti kaldır
          this.checked = false;
          this.disabled = false;
          alert(`✅ ${processed} satırın açıklama ikonu yenilendi!`);
        }
      });
    }
    
    let filterMsg = currentHareket ? ` (${currentHareket})` : '';
    statusEl.innerHTML = `✅ ${selectedHats.length} hattan ${allData.length} kayıt birleştirildi${filterMsg} <span id="reopenTimerIcon" class="reopen-timer-icon" title="Timer'ı Tekrar Aç">⏱️</span>`;
    meta.textContent = `Hatlar: ${selectedHats.join(', ')} | Toplam sütun: ${allKeys.length}`;
    
    // Kronometre ikonunu referans al
    const reopenIcon = document.getElementById('reopenTimerIcon');
    if (reopenIcon) {
      // Event listener'ın birden fazla kez eklenmesini engelle
      const iconClone = reopenIcon.cloneNode(true);
      reopenIcon.parentNode.replaceChild(iconClone, reopenIcon);
      iconClone.addEventListener('click', () => {
        if (iconClone.style.opacity !== '0.3') {
          timerClosedManually = false;
          startMultipleHatsTimer(selectedHats, currentHareket);
        }
      });
    }
    
    // Çoklu hat timer'ı başlat (sadece manuel kapatılmadıysa)
    if (!timerClosedManually) {
      await startMultipleHatsTimer(selectedHats, currentHareket);
    } else {
      updateReopenTimerIcon();
    }

    // SA65 VTS - Manuel script bilgisi göster
    if (selectedHats.includes('SA65')) {
      console.log('ℹ️ SA65 yüklendi. VTS otomatik onaylama için manuel script çalıştırın:');
      console.log('📂 python vts_history_scraper_v2.py');
      console.log('🔄 Script veritabanını güncelleyecek, ardından tabloyu yenileyin.');
    }
    
    // Arızalı filtresi aktifse uygula
    if (showOnlyArizali) {
      applyTableFilter();
    }
    
  } catch (err) {
    console.error('Hat selection error:', err);
    statusEl.innerHTML = `<span class="error">❌ Hata: ${err.message}</span>`;
  } finally {
    applyHatSelection.disabled = false;
  }
}

// ==================== TIMER FUNCTIONS ====================
async function startMultipleHatsTimer(hatList, hareket) {
  timerClosedManually = false; // Timer açılıyor, flagı sıfırla
  updateReopenTimerIcon(); // İkonu pasif yap
  updateScrollButtons(); // Scroll butonlarını güncelle
  
  // Seçili hatları ve hareketi sakla (yenileme için)
  selectedHatsForTracking = hatList;
  selectedHareketForTracking = hareket;
  
  // Tablo otomatik yenileme başlat (5 saniyede bir)
  if (tableRefreshInterval) {
    clearInterval(tableRefreshInterval);
  }
  
  tableRefreshInterval = setInterval(() => {
    refreshTableData(hatList, hareket);
  }, 10000); // 10 saniyede bir yenile (bandwidth tasarrufu)
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  lastBusTime = null;
  
  timerInterval = setInterval(() => {
    updateMultipleHatsTimer(hatList, hareket);
  }, 3000); // 3 saniyede bir güncelle (bandwidth tasarrufu)
  
  updateMultipleHatsTimer(hatList, hareket);
}

// Tablo verilerini sessizce yenile (kullanıcı etkileşimi olmadan)
async function refreshTableData(hatList, hareket) {
  try {
    const allData = [];
    
    for (const tableName of hatList) {
      const res = await fetch('/api/get-table-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: tableName,
          hareket: hareket
        })
      });
      
      if (!res.ok) continue;
      
      const result = await res.json();
      
      if (result.success && result.data) {
        result.data.forEach(row => {
          allData.push({
            ...row,
            _Hat: tableName
          });
        });
      }
    }
    
    if (allData.length === 0) return;
    
    // Tarife_Saati'ne göre sırala (normalize edilmiş saatlerle)
    allData.sort((a, b) => {
      const timeA = normalizeSaat(a.Tarife_Saati || '');
      const timeB = normalizeSaat(b.Tarife_Saati || '');
      return timeA.localeCompare(timeB);
    });
    
    // Sadece tbody'yi güncelle (başlıklar değişmesin)
    const firstRow = allData[0];
    const allKeys = Object.keys(firstRow);
    const hatIndex = allKeys.indexOf('_Hat');
    if (hatIndex > -1) {
      allKeys.splice(hatIndex, 1);
      allKeys.unshift('_Hat');
    }
    
    // _IsYeniPlaka sütununu gizle
    const isYeniPlakaIndex = allKeys.indexOf('_IsYeniPlaka');
    if (isYeniPlakaIndex > -1) {
      allKeys.splice(isYeniPlakaIndex, 1);
    }
    
    // id sütununu gizle
    const idIndex = allKeys.indexOf('id');
    if (idIndex > -1) {
      allKeys.splice(idIndex, 1);
    }
    
    // ⚡ Cache'i önceden doldur (tablo yenilemeden önce)
    const cachePromises = allData.map(async row => {
      const cacheKey = `${row.Hat_Adi}|${row.Tarife}|${row.Tarife_Saati}`;
      if (!aciklamaCache.hasOwnProperty(cacheKey)) {
        const hasAciklama = await checkRowHasAciklama(row);
        aciklamaCache[cacheKey] = hasAciklama;
      }
    });
    await Promise.all(cachePromises);
    
    tbody.innerHTML = '';
    allData.forEach(row => {
      const tr = document.createElement('tr');
      tr.dataset.rowData = JSON.stringify(row);
      allKeys.forEach(k => {
        const td = document.createElement('td');
        const value = row[k];
        td.textContent = value !== null && value !== undefined ? value : '';
        
        // Plaka sütunu: Yeni_Plaka'dan geliyorsa kırmızı yap
        if (k === 'Plaka' && row._IsYeniPlaka) {
          td.style.color = '#e74c3c';
          td.style.fontWeight = 'bold';
        }
        
        // "Durum" sütunu ve "Arızalı" varsa kırmızı yap
        if (k === 'Durum' && value && value.toString().toLowerCase().includes('arızalı')) {
          td.style.color = '#e74c3c';
          td.style.fontWeight = 'bold';
        }
        
        tr.appendChild(td);
      });
      
      // Açıklama ikonu sütunu ekle (cache kullan)
      const tdAciklama = document.createElement('td');
      tdAciklama.style.textAlign = 'center';
      tdAciklama.style.fontSize = '18px';
      tdAciklama.className = 'aciklama-icon-cell';
      tdAciklama.dataset.hatAdi = row.Hat_Adi || '';
      tdAciklama.dataset.tarife = row.Tarife || '';
      tdAciklama.dataset.tarifeSaati = row.Tarife_Saati || '';
      
      const cacheKey = `${row.Hat_Adi}|${row.Tarife}|${row.Tarife_Saati}`;
      const hasAciklama = aciklamaCache[cacheKey];
      
      if (hasAciklama) {
        // Mesaj ikonu göster
        const messageIcon = document.createElement('span');
        messageIcon.className = 'message-icon';
        messageIcon.textContent = '💬';
        messageIcon.style.cursor = 'pointer';
        messageIcon.title = 'Açıklama mesajlarını görüntüle';
        messageIcon.onclick = (e) => {
          e.stopPropagation();
          openRowAciklamaModal(row);
        };
        tdAciklama.appendChild(messageIcon);
      } else {
        // Refresh ikonu göster (mesaj yoksa)
        const refreshIcon = document.createElement('span');
        refreshIcon.textContent = '🔄';
        refreshIcon.style.cursor = 'pointer';
        refreshIcon.style.fontSize = '14px';
        refreshIcon.style.opacity = '0.6';
        refreshIcon.title = 'Bu satırın mesaj durumunu kontrol et';
        refreshIcon.onclick = async (e) => {
          e.stopPropagation();
          refreshIcon.style.opacity = '0.3';
          
          const hasAciklama = await checkRowHasAciklama(row);
          const cacheKey = `${row.Hat_Adi}|${row.Tarife}|${row.Tarife_Saati}`;
          aciklamaCache[cacheKey] = hasAciklama;
          
          if (hasAciklama) {
            // Refresh ikonunu kaldır, mesaj ikonu ekle
            tdAciklama.innerHTML = '';
            const messageIcon = document.createElement('span');
            messageIcon.className = 'message-icon';
            messageIcon.textContent = '💬';
            messageIcon.style.cursor = 'pointer';
            messageIcon.title = 'Açıklama mesajlarını görüntüle';
            messageIcon.onclick = (e) => {
              e.stopPropagation();
              openRowAciklamaModal(row);
            };
            tdAciklama.appendChild(messageIcon);
          } else {
            refreshIcon.style.opacity = '0.6';
          }
        };
        tdAciklama.appendChild(refreshIcon);
      }
      
      tr.appendChild(tdAciklama);
      
      // Satıra tıklanınca onay popup'ı aç (sadece Operasyon ve Depolama için)
      const originalTableName = row._Hat || hatList[0];
      
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        const session = JSON.parse(userSession);
        
        if (session.gorev === 'Operasyon' || session.gorev === 'Depolama') {
          tr.style.cursor = 'pointer';
          tr.addEventListener('click', () => {
            openApprovalConfirmation(row, originalTableName);
          });
        } else {
          tr.style.cursor = 'default';
          tr.addEventListener('mouseenter', () => {
            tr.style.backgroundColor = '#f5f5f5';
          });
          tr.addEventListener('mouseleave', () => {
            tr.style.backgroundColor = '';
          });
        }
      }
      
      // Eğer "Onaylanan" sütunu varsa sadece o hücrenin font rengini değiştir
      if (row.Onaylanan && row.Tarife_Saati) {
        const onaylananIndex = allKeys.indexOf('Onaylanan');
        if (onaylananIndex !== -1) {
          const onaylananCell = tr.children[onaylananIndex];
          const fontColor = getApprovalFontColor(row.Onaylanan, row.Tarife_Saati);
          onaylananCell.style.color = fontColor;
          onaylananCell.style.fontWeight = 'bold';
        }
      }
      
      tbody.appendChild(tr);
    });
    
    console.log(`♻️ Tablo otomatik yenilendi: ${allData.length} kayıt`);
    
    // Filtreleri uygula (eğer aktifse)
    if (showOnlyArizali || showOnlyDegisen) {
      applyTableFilter();
    }
    
  } catch (err) {
    console.error('⚠️ Tablo yenileme hatası:', err.message);
  }
}

async function updateMultipleHatsTimer(hatList, hareket) {
  // Manuel kapatıldıysa çık
  if (timerClosedManually) {
    return;
  }
  
  try {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}:${seconds}`;
    
    let allBusesList = [];
    let minRemaining = Infinity;
    
    // Tüm seçili hatlardan otobüsleri topla
    for (const tableName of hatList) {
      const res = await fetch('/api/get-next-bus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tableName: tableName,
          currentTime: currentTime,
          hareket: hareket
        })
      });
      
      const result = await res.json();
      
      if (result.success && result.nextBusList) {
        // Her hattan gelen tüm otobüsleri ekle
        result.nextBusList.forEach(bus => {
          if (bus.remainingSeconds < minRemaining) {
            minRemaining = bus.remainingSeconds;
          }
          allBusesList.push(bus);
        });
      }
    }
    
    // En yakın zamandaki tüm otobüsleri filtrele
    let closestBuses = allBusesList.filter(bus => bus.remainingSeconds === minRemaining);
    
    // Arızalı filtresi aktifse sadece durumu "Arızalı" olanları göster
    console.log('🚌 Çoklu hat timer güncelleme: Araç sayısı =', closestBuses.length);
    
    if (closestBuses.length > 0) {
      const currentBus = closestBuses[currentBusIndex % closestBuses.length];
      const { tableName, hatAdi, plaka, tarife, tarifeSaati, hareket: busHareket, calismaZamani, remainingSeconds } = currentBus;
      
      if (lastBusTime !== tarifeSaati) {
        lastBusTime = tarifeSaati;
        currentBusList = closestBuses;
        currentBusIndex = 0;
        
        // Slide mekanizması
        if (closestBuses.length > 1) {
          startSlideShow();
        } else {
          stopSlideShow();
        }
        
        // Manuel kapatıldıysa timer'ı gösterme
        if (!timerClosedManually) {
          timerContainer.style.display = 'block';
        }
      }
      
      // Birden fazla araç varsa liste göster, tek araç varsa normal görünüm
      console.log('🔍 Çoklu hat - Araç sayısı kontrolü:', closestBuses.length, '> 1 =', closestBuses.length > 1);
      if (closestBuses.length > 1) {
        console.log('✅ Çoklu araç modu - showMultipleBusesList çağrılıyor');
        showMultipleBusesList(closestBuses, remainingSeconds);
      } else {
        console.log('✅ Tek araç modu - showSingleBusInfo çağrılıyor');
        showSingleBusInfo(currentBus);
      }
      
      // Timer bilgilerini güncelle (eski yapı ile uyumluluk için)
      timerHatAdi.textContent = currentBus.hatAdi || '-';
      timerPlaka.textContent = currentBus.plaka || '-';
      
      // Plaka rengini ayarla (_IsYeniPlaka varsa kırmızı)
      if (currentBus.isYeniPlaka) {
        timerPlaka.style.color = '#e74c3c';
        timerPlaka.style.fontWeight = 'bold';
      } else {
        timerPlaka.style.color = '#2c3e50';
        timerPlaka.style.fontWeight = 'normal';
      }
      
      timerTarife.textContent = currentBus.tarife || '-';
      timerHareket.textContent = currentBus.hareket || '-';
      
      // Durum bilgisini güncelle
      const durumValue = currentBus.durum || '';
      if (durumValue && durumValue.trim() !== '') {
        timerDurum.textContent = durumValue;
        timerDurum.style.color = '#e74c3c';
        timerDurum.style.fontWeight = 'bold';
      } else {
        timerDurum.textContent = 'Normal';
        timerDurum.style.color = '#2c3e50';
        timerDurum.style.fontWeight = 'normal';
      }
      
      // currentTimerRow'u güncelle (dinamik takip için)
      currentTimerRow = currentBus;
      
      // Önceki ve sonraki saatleri getir
      await updatePrevNextTimes(currentBus.tableName, currentBus.tarifeSaati, currentBus.hareket, currentBus.calismaZamani);
      
      // Dinamik takip ve renk kodlama
      if (closestBuses.length > 1) {
        highlightMultipleBuses(closestBuses, remainingSeconds);
      } else {
        scrollToTimerRow(currentBus);
      }
      
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      
      // Kalan süre altındaki hat adını güncelle
      const timerCurrentHatName = document.getElementById('timerCurrentHatName');
      if (timerCurrentHatName) {
        timerCurrentHatName.textContent = currentBus.hatAdi || '-';
      }
      
      // 2 dakikadan az kaldıysa kırmızı warning
      if (remainingSeconds <= 120 && remainingSeconds > 0) {
        timerDisplay.classList.add('timer-warning');
      } else {
        timerDisplay.classList.remove('timer-warning');
      }
      
      if (remainingSeconds <= 0) {
        lastBusTime = null;
        currentTimerRow = null;
        currentBusList = [];
        stopSlideShow();
      }
    } else {
      closeTimer();
    }
  } catch (err) {
    console.error('Multiple hats timer update error:', err);
  }
}

function scrollToTimerRow(busData) {
  console.log('📍 scrollToTimerRow çağrıldı:', { busData, checkboxChecked: dynamicTrackingCheckbox.checked });
  
  // Dinamik takip checkbox'ı seçili değilse çık
  if (!dynamicTrackingCheckbox.checked) {
    console.log('❌ Dinamik takip kapalı, scroll iptal edildi');
    return;
  }
  
  // Önce tüm vurguları temizle
  clearAllHighlights();
  
  try {
    const rows = tbody.querySelectorAll('tr');
    const headerCells = theadRow.querySelectorAll('th');
    const headers = Array.from(headerCells).map(th => th.textContent.trim());
    
    const hatAdiIndex = headers.indexOf('Hat_Adi');
    const tarifeIndex = headers.indexOf('Tarife');
    const tarifeSaatiIndex = headers.indexOf('Tarife_Saati');
    const hareketIndex = headers.indexOf('Hareket');
    
    console.log('🔍 Scrolling to timer row:', {
      busData,
      hatAdiIndex,
      tarifeIndex,
      tarifeSaatiIndex,
      hareketIndex,
      totalRows: rows.length
    });
    
    // Timer'daki otobüsü tabloda bul
    let foundRow = false;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');
      
      if (cells.length === 0) continue;
      
      // Hat_Adi, Tarife_Saati ve Hareket eşleşmesine bak
      const hatAdiCell = hatAdiIndex >= 0 ? cells[hatAdiIndex]?.textContent.trim() : '';
      const tarifeCell = tarifeIndex >= 0 ? cells[tarifeIndex]?.textContent.trim() : '';
      const tarifeSaatiCell = tarifeSaatiIndex >= 0 ? cells[tarifeSaatiIndex]?.textContent.trim() : '';
      const hareketCell = hareketIndex >= 0 ? cells[hareketIndex]?.textContent.trim() : '';
      
      const hatAdiMatch = !busData.hatAdi || hatAdiCell === busData.hatAdi;
      const tarifeMatch = !busData.tarife || tarifeCell === busData.tarife;
      const tarifeSaatiMatch = tarifeSaatiCell === busData.tarifeSaati || tarifeSaatiCell === busData.tarifeSaati?.substring(0, 5);
      const hareketMatch = !busData.hareket || hareketCell === busData.hareket;
      
      // Eşleşen satır bulundu
      if (hatAdiMatch && tarifeSaatiMatch && hareketMatch) {
        foundRow = true;
        
        // Kalan süreye göre renk seç
        const remainingSeconds = busData.remainingSeconds || 0;
        const highlightColor = remainingSeconds <= 120 ? '#ffcccc' : '#fff3cd'; // Kırmızı veya sarı
        
        row.style.backgroundColor = highlightColor;
        highlightedRows.push(row);
        
        console.log('✅ Satır bulundu ve vurgulandı:', {
          rowIndex: i,
          hatAdi: hatAdiCell,
          tarife: tarifeCell,
          tarifeSaati: tarifeSaatiCell,
          hareket: hareketCell,
          color: highlightColor
        });
        
        // Satırı görünür alana kaydır (en üste)
        row.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        
        break;
      }
    }
    
    if (!foundRow) {
      console.warn('⚠️ Satır bulunamadı! Aranan:', busData);
    }
  } catch (err) {
    console.error('Scroll to timer row error:', err);
  }
}

async function updatePrevNextTimes(tableName, currentTarifeSaati, hareket, calismaZamani) {
  try {
    console.log('📞 Calling get-prev-next-times API:');
    console.log('  tableName:', tableName);
    console.log('  currentTarifeSaati:', currentTarifeSaati);
    console.log('  hareket:', hareket);
    console.log('  calismaZamani:', calismaZamani);
    console.log('  type:', typeof currentTarifeSaati);

    const res = await fetch('/api/get-prev-next-times', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: tableName,
        currentTarifeSaati: currentTarifeSaati,
        hareket: hareket,
        calismaZamani: calismaZamani
      })
    });
    
    const result = await res.json();
    
    console.log('📥 Prev/Next Times Response:');
    console.log('  success:', result.success);
    console.log('  prevTime:', result.prevTime);
    console.log('  nextTime:', result.nextTime);
    console.log('🔍 Expected: prev should be < ' + currentTarifeSaati + ', next should be > ' + currentTarifeSaati);
    
    if (result.success) {
      // Önceki saat (sol taraf)
      if (result.prevTime) {
        timerPrevTime.textContent = result.prevTime.substring(0, 5); // HH:MM formatı
      } else {
        timerPrevTime.textContent = '--:--';
      }
      
      // Sonraki saat (sağ taraf)
      if (result.nextTime) {
        timerNextTime.textContent = result.nextTime.substring(0, 5); // HH:MM formatı
      } else {
        timerNextTime.textContent = '--:--';
      }
    }
  } catch (err) {
    console.error('Update prev/next times error:', err);
    timerPrevTime.textContent = '--:--';
    timerNextTime.textContent = '--:--';
  }
}

// ==================== APPROVAL FUNCTION ====================
// ==================== LOGOUT ====================
function handleLogout() {
  if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
    localStorage.removeItem('userSession');
    window.location.href = '/login';
  }
}

// ==================== ADD USER ====================
function setUserMode(mode) {
  currentUserMode = mode;
  
  // Buton renklerini güncelle
  const buttons = [addUserModeBtn, updateUserModeBtn, deleteUserModeBtn, listUserModeBtn];
  buttons.forEach(btn => {
    if (btn) btn.style.background = '#95a5a6';
  });
  
  // Aktif butonu vurgula
  const activeColors = {
    'add': '#27ae60',
    'update': '#3498db',
    'delete': '#e74c3c',
    'list': '#f39c12'
  };
  
  if (mode === 'add' && addUserModeBtn) addUserModeBtn.style.background = activeColors.add;
  if (mode === 'update' && updateUserModeBtn) updateUserModeBtn.style.background = activeColors.update;
  if (mode === 'delete' && deleteUserModeBtn) deleteUserModeBtn.style.background = activeColors.delete;
  if (mode === 'list' && listUserModeBtn) listUserModeBtn.style.background = activeColors.list;
  
  // UI'ı güncelle
  if (mode === 'list') {
    // Liste modu
    addUserFormContainer.style.display = 'none';
    existingUserDropdown.style.display = 'none';
    userListContainer.style.display = 'block';
    confirmAddUser.style.display = 'none';
    loadUserList();
  } else if (mode === 'add') {
    // Ekleme modu
    addUserFormContainer.style.display = 'block';
    existingUserDropdown.style.display = 'none';
    userListContainer.style.display = 'none';
    confirmAddUser.style.display = 'block';
    confirmAddUser.textContent = '✅ Kullanıcı Ekle';
    confirmAddUser.style.background = 'linear-gradient(135deg, #27ae60 0%, #229954 100%)';
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newGorev').value = '';
    document.getElementById('newUsername').disabled = false;
    document.getElementById('newPassword').disabled = false;
    document.getElementById('gorevGroup').style.display = 'block';
    addUserStatus.style.display = 'none';
  } else if (mode === 'update') {
    // Güncelleme modu
    addUserFormContainer.style.display = 'block';
    existingUserDropdown.style.display = 'block';
    userListContainer.style.display = 'none';
    confirmAddUser.style.display = 'block';
    confirmAddUser.textContent = '✏️ Görevi Güncelle';
    confirmAddUser.style.background = 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
    document.getElementById('newUsername').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newGorev').value = '';
    document.getElementById('newUsername').disabled = false;
    document.getElementById('newPassword').disabled = true;
    document.getElementById('gorevGroup').style.display = 'block';
    addUserStatus.style.display = 'none';
    loadUserDropdown();
  } else if (mode === 'delete') {
    // Silme modu
    addUserFormContainer.style.display = 'none';
    existingUserDropdown.style.display = 'block';
    userListContainer.style.display = 'none';
    confirmAddUser.style.display = 'block';
    confirmAddUser.textContent = '🗑️ Kullanıcıyı Sil';
    confirmAddUser.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    addUserStatus.style.display = 'none';
    loadUserDropdown();
  }
}

async function loadUserDropdown() {
  const gorevFilter = filterGorev.value;
  
  try {
    const res = await fetch(`/api/list-users?gorev=${encodeURIComponent(gorevFilter)}`);
    const data = await res.json();
    
    if (data.success) {
      existingUserSelect.innerHTML = '<option value="">-- Kullanıcı Seçin --</option>';
      data.users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.Kullanıcı;
        option.textContent = `${user.Kullanıcı} (${user.Görev})`;
        existingUserSelect.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Kullanıcı dropdown yükleme hatası:', err);
  }
}

async function loadUserList() {
  const gorevFilter = filterGorev.value;
  const userListContent = document.getElementById('userListContent');
  
  try {
    const res = await fetch(`/api/list-users?gorev=${encodeURIComponent(gorevFilter)}`);
    const data = await res.json();
    
    if (data.success) {
      if (data.users.length === 0) {
        userListContent.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Kullanıcı bulunamadı</p>';
      } else {
        let html = '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: #34495e; color: white;"><th style="padding: 10px; text-align: left;">Kullanıcı</th><th style="padding: 10px; text-align: left;">Görev</th></tr></thead>';
        html += '<tbody>';
        data.users.forEach((user, index) => {
          const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
          html += `<tr style="background: ${bgColor};"><td style="padding: 10px; border-bottom: 1px solid #ddd;">${user.Kullanıcı}</td><td style="padding: 10px; border-bottom: 1px solid #ddd;">${user.Görev}</td></tr>`;
        });
        html += '</tbody></table>';
        userListContent.innerHTML = html;
      }
    }
  } catch (err) {
    console.error('Kullanıcı listesi yükleme hatası:', err);
    userListContent.innerHTML = '<p style="text-align: center; color: #e74c3c; padding: 20px;">❌ Hata oluştu</p>';
  }
}

async function handleUserAction() {
  if (currentUserMode === 'add') {
    await handleAddUser();
  } else if (currentUserMode === 'update') {
    await handleUpdateUser();
  } else if (currentUserMode === 'delete') {
    await handleDeleteUser();
  }
}

function openAddUserModal() {
  currentUserMode = 'add';
  setUserMode('add');
  addUserModal.style.display = 'flex';
}

function closeAddUserModal() {
  addUserModal.style.display = 'none';
}

async function handleAddUser() {
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const gorev = document.getElementById('newGorev').value;
  
  // Validasyon
  if (!username || !password || !gorev) {
    addUserStatus.innerHTML = '<span class="error">❌ Tüm alanları doldurun</span>';
    addUserStatus.style.display = 'block';
    return;
  }
  
  confirmAddUser.disabled = true;
  const originalText = confirmAddUser.textContent;
  confirmAddUser.textContent = '⏳ Ekleniyor...';
  
  try {
    const res = await fetch('/api/add-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, gorev })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || 'Kullanıcı eklenemedi');
    }
    
    addUserStatus.innerHTML = '<span class="success">✅ Kullanıcı başarıyla eklendi!</span>';
    addUserStatus.style.display = 'block';
    
    setTimeout(() => {
      closeAddUserModal();
    }, 1500);
    
  } catch (err) {
    addUserStatus.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    addUserStatus.style.display = 'block';
  } finally {
    confirmAddUser.disabled = false;
    confirmAddUser.textContent = originalText;
  }
}

async function handleUpdateUser() {
  const username = existingUserSelect.value;
  const newGorev = document.getElementById('newGorev').value;
  
  if (!username) {
    addUserStatus.innerHTML = '<span class="error">❌ Kullanıcı seçin</span>';
    addUserStatus.style.display = 'block';
    return;
  }
  
  if (!newGorev) {
    addUserStatus.innerHTML = '<span class="error">❌ Yeni görev seçin</span>';
    addUserStatus.style.display = 'block';
    return;
  }
  
  confirmAddUser.disabled = true;
  const originalText = confirmAddUser.textContent;
  confirmAddUser.textContent = '⏳ Güncelleniyor...';
  
  try {
    const res = await fetch('/api/update-user-gorev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newGorev })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Görev güncellenemedi');
    }
    
    addUserStatus.innerHTML = '<span class="success">✅ Kullanıcı görevi başarıyla güncellendi!</span>';
    addUserStatus.style.display = 'block';
    
    console.log('✅ Kullanıcı görevi güncellendi:', data.logoutUsername || username);
    
    setTimeout(() => {
      closeAddUserModal();
    }, 1500);
    
  } catch (err) {
    addUserStatus.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    addUserStatus.style.display = 'block';
  } finally {
    confirmAddUser.disabled = false;
    confirmAddUser.textContent = originalText;
  }
}

async function handleDeleteUser() {
  const username = existingUserSelect.value;
  
  if (!username) {
    addUserStatus.innerHTML = '<span class="error">❌ Kullanıcı seçin</span>';
    addUserStatus.style.display = 'block';
    return;
  }
  
  if (!confirm(`"${username}" kullanıcısını silmek istediğinizden emin misiniz?`)) {
    return;
  }
  
  confirmAddUser.disabled = true;
  const originalText = confirmAddUser.textContent;
  confirmAddUser.textContent = '⏳ Siliniyor...';
  
  try {
    const res = await fetch('/api/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Kullanıcı silinemedi');
    }
    
    addUserStatus.innerHTML = '<span class="success">✅ Kullanıcı başarıyla silindi!</span>';
    addUserStatus.style.display = 'block';
    
    // Dropdown'u yenile
    await loadUserDropdown();
    
    setTimeout(() => {
      addUserStatus.style.display = 'none';
      existingUserSelect.value = '';
    }, 1500);
    
  } catch (err) {
    addUserStatus.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    addUserStatus.style.display = 'block';
  } finally {
    confirmAddUser.disabled = false;
    confirmAddUser.textContent = originalText;
  }
}

// ==================== CHANGE PASSWORD ====================
function openChangePasswordModal() {
  document.getElementById('changePasswordOld').value = '';
  document.getElementById('changePasswordNew').value = '';
  document.getElementById('changePasswordConfirm').value = '';
  changePasswordStatus.style.display = 'none';
  changePasswordModal.style.display = 'flex';
}

// Make it globally accessible for the onclick handler
window.openChangePasswordModal = openChangePasswordModal;

function closeChangePasswordModal() {
  changePasswordModal.style.display = 'none';
}

async function handleChangePassword() {
  const oldPassword = document.getElementById('changePasswordOld').value.trim();
  const newPassword = document.getElementById('changePasswordNew').value.trim();
  const confirmPassword = document.getElementById('changePasswordConfirm').value.trim();
  
  // Validasyon
  if (!oldPassword || !newPassword || !confirmPassword) {
    changePasswordStatus.innerHTML = '<span class="error">❌ Tüm alanları doldurun</span>';
    changePasswordStatus.style.display = 'block';
    return;
  }
  
  if (newPassword !== confirmPassword) {
    changePasswordStatus.innerHTML = '<span class="error">❌ Yeni şifreler eşleşmiyor</span>';
    changePasswordStatus.style.display = 'block';
    return;
  }
  
  if (newPassword.length < 4) {
    changePasswordStatus.innerHTML = '<span class="error">❌ Şifre en az 4 karakter olmalıdır</span>';
    changePasswordStatus.style.display = 'block';
    return;
  }
  
  // Get current user from session
  const userSession = localStorage.getItem('userSession');
  if (!userSession) {
    changePasswordStatus.innerHTML = '<span class="error">❌ Oturum bulunamadı</span>';
    changePasswordStatus.style.display = 'block';
    return;
  }
  
  const session = JSON.parse(userSession);
  
  confirmChangePassword.disabled = true;
  confirmChangePassword.textContent = '⏳ Değiştiriliyor...';
  
  try {
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username: session.username, 
        oldPassword: oldPassword,
        newPassword: newPassword 
      })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Şifre değiştirilemedi');
    }
    
    changePasswordStatus.innerHTML = '<span class="success">✅ Şifre başarıyla değiştirildi!</span>';
    changePasswordStatus.style.display = 'block';
    
    setTimeout(() => {
      closeChangePasswordModal();
    }, 1500);
    
  } catch (err) {
    changePasswordStatus.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    changePasswordStatus.style.display = 'block';
  } finally {
    confirmChangePassword.disabled = false;
    confirmChangePassword.textContent = '✅ Şifre Değiştir';
  }
}

// ==================== AÇIKLAMA EKLEME ====================

// Inline (popup içi) açıklama ekleme
async function handleAddAciklamaInline() {
  const aciklamaText = document.getElementById('aciklamaTextInline').value.trim();
  const statusEl = document.getElementById('aciklamaStatusInline');
  const confirmBtn = document.getElementById('confirmAciklamaInline');
  
  if (!aciklamaText) {
    statusEl.innerHTML = '<span style="color: #e74c3c;">❌ Açıklama giriniz</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  // pendingApprovalData'dan bilgileri al (popup açıldığında dolu)
  if (!pendingApprovalData || !pendingApprovalData.rowData) {
    statusEl.innerHTML = '<span style="color: #e74c3c;">❌ Satır bilgisi bulunamadı</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  const rowData = pendingApprovalData.rowData;
  
  // Session kontrolü - Operasyon mu Depolama mı?
  const userSession = localStorage.getItem('userSession');
  if (!userSession) {
    statusEl.innerHTML = '<span style="color: #e74c3c;">❌ Oturum bulunamadı</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  const session = JSON.parse(userSession);
  const gorev = session.gorev;
  
  if (gorev !== 'Operasyon' && gorev !== 'Depolama') {
    statusEl.innerHTML = '<span style="color: #e74c3c;">❌ Bu özellik sadece Operasyon ve Depolama kullanıcıları içindir</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  confirmBtn.disabled = true;
  confirmBtn.textContent = '⏳ Ekleniyor...';
  
  console.log('📦 Gönderilecek veri:', {
    Hat_Adi: rowData.Hat_Adi,
    Calisma_Zamani: rowData.Çalışma_Zamanı || rowData.Calisma_Zamani || null,
    Tarife: rowData.Tarife,
    Tarife_Saati: rowData.Tarife_Saati,
    Plaka: rowData.Plaka || null,
    Aciklama: aciklamaText,
    Endpoint: gorev === 'Operasyon' ? '/api/add-operasyon-aciklama' : '/api/add-depolama-aciklama'
  });
  
  try {
    // API endpoint belirle
    const endpoint = gorev === 'Operasyon' 
      ? '/api/add-operasyon-aciklama' 
      : '/api/add-depolama-aciklama';
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Hat_Adi: rowData.Hat_Adi,
        Calisma_Zamani: rowData.Çalışma_Zamanı || rowData.Calisma_Zamani || null,
        Tarife: rowData.Tarife,
        Tarife_Saati: rowData.Tarife_Saati,
        Plaka: rowData.Plaka || null,
        Aciklama: aciklamaText
      })
    });
    
    console.log('📤 API yanıtı:', response.status);
    const result = await response.json();
    console.log('📊 API result:', result);
    
    if (!response.ok) {
      throw new Error(result.error || 'Açıklama eklenemedi');
    }
    
    statusEl.innerHTML = '<span style="color: #27ae60;">✅ Açıklama başarıyla eklendi!</span>';
    statusEl.style.display = 'block';
    
    // Formu temizle ve butonu yeniden aktif et
    document.getElementById('aciklamaTextInline').value = '';
    confirmBtn.disabled = false;
    confirmBtn.textContent = '✅ Açıklama Ekle';
    
    // Açıklama formunu gizle
    document.getElementById('aciklamaFormInline').style.display = 'none';
    
    // ⚡ Cache'i temizle ve ilgili satırın açıklama ikonunu güncelle
    const cacheKey = `${rowData.Hat_Adi}|${rowData.Tarife}|${rowData.Tarife_Saati}`;
    delete aciklamaCache[cacheKey];
    await updateAciklamaIconsForRow(
      rowData.Hat_Adi,
      rowData.Tarife,
      rowData.Tarife_Saati
    );
    
    // 1.5 saniye sonra durum mesajını temizle
    setTimeout(() => {
      statusEl.style.display = 'none';
      statusEl.innerHTML = '';
    }, 1500);
    
  } catch (err) {
    statusEl.innerHTML = `<span style="color: #e74c3c;">❌ ${err.message}</span>`;
    statusEl.style.display = 'block';
    confirmBtn.disabled = false;
    confirmBtn.textContent = '✅ Açıklama Ekle';
  }
}

async function handleAracDegistir() {
  const yeniPlakaInput = document.getElementById('yeniPlakaInput').value.trim();
  const aciklamaText = document.getElementById('aracDegistirAciklama').value.trim();
  const statusEl = document.getElementById('aracDegistirStatus');
  const confirmBtn = document.getElementById('confirmAracDegistir');
  
  if (!yeniPlakaInput) {
    statusEl.innerHTML = '<span style="color: #e74c3c;">❌ Yeni plaka giriniz</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  if (!aciklamaText) {
    statusEl.innerHTML = '<span style="color: #e74c3c;">❌ Açıklama zorunludur</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  // pendingApprovalData'dan bilgileri al (popup açıldığında dolu)
  if (!pendingApprovalData || !pendingApprovalData.rowData) {
    statusEl.innerHTML = '<span style="color: #e74c3c;">❌ Satır bilgisi bulunamadı</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  const rowData = pendingApprovalData.rowData;
  
  // Session kontrolü
  const userSession = localStorage.getItem('userSession');
  if (!userSession) {
    statusEl.innerHTML = '<span style="color: #e74c3c;">❌ Oturum bulunamadı</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  const session = JSON.parse(userSession);
  const gorev = session.gorev;
  
  if (gorev !== 'Operasyon' && gorev !== 'Depolama') {
    statusEl.innerHTML = '<span style="color: #e74c3c;">❌ Bu özellik sadece Operasyon ve Depolama kullanıcıları içindir</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  confirmBtn.disabled = true;
  confirmBtn.textContent = '⏳ Güncelleniyor...';
  
  // pendingApprovalData'dan normalized değerleri al
  const hatAdi = pendingApprovalData.hatAdi || pendingApprovalData.tableName;
  const plaka = rowData.Plaka;
  const tarife = pendingApprovalData.tarife;
  const tarifeSaati = pendingApprovalData.tarifeSaati;
  const calismaZamani = pendingApprovalData.calismaZamani;
  
  console.log('🚗 Araç değiştirme isteği (rowData):', rowData);
  console.log('🚗 Araç değiştirme isteği (pendingApprovalData):', pendingApprovalData);
  console.log('🚗 Gönderilecek payload:', {
    Hat_Adi: hatAdi,
    Plaka: plaka,
    Tarife: tarife,
    Calisma_Zamani: calismaZamani,
    Tarife_Saati: tarifeSaati,
    Yeni_Plaka: yeniPlakaInput,
    Aciklama: aciklamaText.substring(0, 50) + '...'
  });
  
  try {
    const response = await fetch('/api/update-arac', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'user-session': JSON.stringify(session)
      },
      body: JSON.stringify({
        Hat_Adi: hatAdi,
        Plaka: plaka,
        Tarife: tarife,
        Calisma_Zamani: calismaZamani,
        Tarife_Saati: tarifeSaati,
        Yeni_Plaka: yeniPlakaInput,
        Aciklama: aciklamaText
      })
    });
    
    console.log('📤 API yanıtı:', response.status);
    const result = await response.json();
    console.log('📊 API result:', result);
    
    // Detayları parse et (eğer varsa)
    if (result.details) {
      console.log('📋 Detaylar:', result.details);
    }
    
    if (!response.ok) {
      console.error('❌ API Hatası:', result);
      
      // Hata mesajını kullanıcıya göster
      const errorMsg = result.error || 'Araç güncellenemedi';
      const detailMsg = result.debugInfo ? `\n\nDebug: ${JSON.stringify(result.debugInfo, null, 2)}` : '';
      
      throw new Error(errorMsg + detailMsg);
    }
    
    statusEl.innerHTML = '<span style="color: #27ae60;">✅ Araç başarıyla güncellendi!</span>';
    statusEl.style.display = 'block';
    
    // Formu temizle ve butonu yeniden aktif et
    document.getElementById('yeniPlakaInput').value = '';
    document.getElementById('aracDegistirAciklama').value = '';
    confirmBtn.disabled = false;
    confirmBtn.textContent = '🚗 Araç Değiştir';
    
    // Araç değiştir formunu gizle
    document.getElementById('aracDegistirFormInline').style.display = 'none';
    
    // ⚡ Cache'i temizle ve ilgili satırın açıklama ikonunu güncelle
    const cacheKey = `${hatAdi}|${tarife}|${tarifeSaati}`;
    delete aciklamaCache[cacheKey];
    await updateAciklamaIconsForRow(
      hatAdi,
      tarife,
      tarifeSaati
    );
    
    // 1.5 saniye sonra durum mesajını temizle
    setTimeout(() => {
      statusEl.style.display = 'none';
      statusEl.innerHTML = '';
    }, 1500);
    
  } catch (err) {
    statusEl.innerHTML = `<span style="color: #e74c3c;">❌ ${err.message}</span>`;
    statusEl.style.display = 'block';
    confirmBtn.disabled = false;
    confirmBtn.textContent = '🚗 Araç Değiştir';
  }
}

// Arızalı işaretleme için açıklama kaydetme fonksiyonu
async function saveArizaliAciklama(rowData) {
  try {
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      throw new Error('Oturum bilgisi bulunamadı');
    }
    
    const session = JSON.parse(userSession);
    const gorev = session.gorev;
    
    // Görev tipine göre tablo seç
    let aciklamaTable = '';
    if (gorev === 'Operasyon') {
      aciklamaTable = 'Operasyon_Açıklama';
    } else if (gorev === 'Depolama') {
      aciklamaTable = 'Depolama_Açıklama';
    } else {
      throw new Error('Geçersiz görev tipi');
    }
    
    // Açıklama formatı: "kullanıcı açıklaması (Arızalı)"
    const aciklamaWithTag = `${rowData.aciklama} (Arızalı)`;
    
    const payload = {
      Hat_Adi: rowData.tableName || rowData.Hat_Adi,
      Calisma_Zamani: rowData.rowData?.Çalışma_Zamanı || rowData.rowData?.Calisma_Zamani || '',
      Tarife: rowData.tarife,
      Tarife_Saati: rowData.tarifeSaati,
      Plaka: rowData.rowData?.Plaka || '',
      Aciklama: aciklamaWithTag
    };
    
    console.log('📝 Arızalı açıklaması kaydediliyor:', payload);
    
    const res = await fetch('/api/add-operasyon-aciklama', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || 'Açıklama kaydetme hatası');
    }
    
    console.log('✅ Arızalı açıklaması kaydedildi:', result);
    
    // İlgili satırın açıklama ikonunu güncelle
    await updateAciklamaIconsForRow(
      rowData.tableName || rowData.Hat_Adi,
      rowData.tarife,
      rowData.tarifeSaati
    );
    
  } catch (err) {
    console.error('❌ Açıklama kaydetme hatası:', err);
    // Hata sessizce loglansın, kullanıcıya ana işlem başarılı gösterildi
  }
}

// Arızalı kaldırma için Operasyon_Açıklama tablosundan silme fonksiyonu
async function removeArizaliAciklama(rowData) {
  try {
    const userSession = localStorage.getItem('userSession');
    if (!userSession) {
      console.warn('Oturum bilgisi bulunamadı');
      return;
    }
    
    const session = JSON.parse(userSession);
    const gorev = session.gorev;
    
    // Görev tipine göre tablo seç
    let aciklamaTable = '';
    if (gorev === 'Operasyon') {
      aciklamaTable = 'Operasyon_Açıklama';
    } else if (gorev === 'Depolama') {
      aciklamaTable = 'Depolama_Açıklama';
    } else {
      console.warn('Geçersiz görev tipi');
      return;
    }
    
    const hatAdi = rowData.tableName || rowData.Hat_Adi;
    const calismaZamani = rowData.rowData?.Çalışma_Zamanı || rowData.rowData?.Calisma_Zamani || '';
    const tarife = rowData.tarife;
    const tarifeSaati = rowData.tarifeSaati;
    const plaka = rowData.rowData?.Plaka || '';
    
    console.log('🗑️ Arızalı açıklaması siliniyor:', { table: aciklamaTable, hatAdi, calismaZamani, tarife, tarifeSaati, plaka });
    
    // get-row-aciklamalar API'sini kullanarak mevcut açıklamaları al
    const getRes = await fetch('/api/get-row-aciklamalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Hat_Adi: hatAdi,
        Tarife: tarife,
        Tarife_Saati: tarifeSaati
      })
    });
    
    if (!getRes.ok) {
      console.warn('Açıklama okuma hatası');
      return;
    }
    
    const result = await getRes.json();
    const aciklamalar = result.data || [];
    
    console.log('📋 Alınan açıklamalar:', aciklamalar);
    console.log('🔍 Açıklama tablosu:', aciklamaTable);
    
    // (Arızalı) içeren kayıtları filtrele
    const arizaliKayitlar = aciklamalar.filter(a => {
      const hasAciklama = a.Açıklama && a.Açıklama.includes('(Arızalı)');
      const correctSource = a._Kaynak === (gorev === 'Operasyon' ? 'Operasyon' : 'Depolama');
      console.log('  - Kayıt:', { id: a.id, Açıklama: a.Açıklama?.substring(0, 50), _Kaynak: a._Kaynak, hasAciklama, correctSource });
      return hasAciklama && correctSource;
    });
    
    if (arizaliKayitlar.length === 0) {
      console.log('Silinecek arızalı açıklama bulunamadı');
      return;
    }
    
    console.log(`${arizaliKayitlar.length} adet arızalı açıklama bulundu, siliniyor...`);
    
    // ID listesini topla
    const idsToDelete = arizaliKayitlar.map(k => k.id);
    
    // Backend API ile sil
    const deleteRes = await fetch('/api/delete-aciklama-by-ids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: aciklamaTable,
        ids: idsToDelete
      })
    });
    
    if (!deleteRes.ok) {
      console.warn('Silme işlemi başarısız');
      return;
    }
    
    const deleteResult = await deleteRes.json();
    console.log('✅ Arızalı açıklamaları silindi:', deleteResult);
    
    // İlgili satırın açıklama ikonunu güncelle
    await updateAciklamaIconsForRow(hatAdi, tarife, tarifeSaati);
    
  } catch (err) {
    console.error('❌ Açıklama silme hatası:', err);
  }
}

function openAciklamaModal() {
  // Satır bilgilerini modalda göster
  document.getElementById('aciklamaHatAdi').textContent = selectedRowForAciklama.Hat_Adi || '-';
  document.getElementById('aciklamaCalismaZamani').textContent = selectedRowForAciklama['Çalışma_Zamanı'] || '-';
  document.getElementById('aciklamaTarife').textContent = selectedRowForAciklama.Tarife || '-';
  document.getElementById('aciklamaTarifeSaati').textContent = selectedRowForAciklama.Tarife_Saati || '-';
  document.getElementById('aciklamaPlaka').textContent = selectedRowForAciklama.Plaka || '-';
  
  document.getElementById('aciklamaText').value = '';
  aciklamaStatus.style.display = 'none';
  aciklamaModal.style.display = 'flex';
}

function closeAciklamaModal() {
  aciklamaModal.style.display = 'none';
}

async function handleAddAciklama() {
  const aciklamaText = document.getElementById('aciklamaText').value.trim();
  
  if (!aciklamaText) {
    aciklamaStatus.innerHTML = '<span class="error">❌ Açıklama giriniz</span>';
    aciklamaStatus.style.display = 'block';
    return;
  }
  
  if (!selectedRowForAciklama) {
    aciklamaStatus.innerHTML = '<span class="error">❌ Satır bilgisi bulunamadı</span>';
    aciklamaStatus.style.display = 'block';
    return;
  }
  
  // Session'dan kullanıcı görevini al
  const userSession = localStorage.getItem('userSession');
  if (!userSession) {
    aciklamaStatus.innerHTML = '<span class="error">❌ Oturum bulunamadı</span>';
    aciklamaStatus.style.display = 'block';
    return;
  }
  
  const session = JSON.parse(userSession);
  const isOperasyon = session.gorev === 'Operasyon';
  const isDepolama = session.gorev === 'Depolama';
  
  if (!isOperasyon && !isDepolama) {
    aciklamaStatus.innerHTML = '<span class="error">❌ Bu işlem için yetkiniz yok</span>';
    aciklamaStatus.style.display = 'block';
    return;
  }
  
  confirmAciklama.disabled = true;
  confirmAciklama.textContent = '⏳ Ekleniyor...';
  
  try {
    const apiUrl = isOperasyon ? '/api/add-operasyon-aciklama' : '/api/add-depolama-aciklama';
    
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Hat_Adi: selectedRowForAciklama.Hat_Adi,
        Calisma_Zamani: selectedRowForAciklama['Çalışma_Zamanı'],
        Tarife: selectedRowForAciklama.Tarife,
        Tarife_Saati: selectedRowForAciklama.Tarife_Saati,
        Plaka: selectedRowForAciklama.Plaka,
        Aciklama: aciklamaText
      })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'Açıklama eklenemedi');
    }
    
    aciklamaStatus.innerHTML = '<span class="success">✅ Açıklama başarıyla eklendi!</span>';
    aciklamaStatus.style.display = 'block';
    
    setTimeout(() => {
      closeAciklamaModal();
      selectedRowForAciklama = null;
      // Seçili satırın stilini kaldır
      document.querySelectorAll('#tbody tr').forEach(tr => {
        tr.style.backgroundColor = '';
      });
    }, 1500);
    
  } catch (err) {
    aciklamaStatus.innerHTML = `<span class="error">❌ ${err.message}</span>`;
    aciklamaStatus.style.display = 'block';
  } finally {
    confirmAciklama.disabled = false;
    confirmAciklama.textContent = '✅ Açıklama Ekle';
  }
}

// ==================== APPROVAL ====================
async function handleApproval() {
  if (!currentTable) {
    statusEl.innerHTML = '<span class="error">❌ Hata: Önce bir tablo seçiniz</span>';
    return;
  }
  
  if (isLoading) return;
  
  isLoading = true;
  const originalText = statusEl.textContent;
  statusEl.textContent = 'Onaylama işlemi başlatılıyor...';
  approveBtn.disabled = true;
  refreshBtn.disabled = true;
  
  try {
    const res = await fetch('/api/approve-entry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableName: currentTable,
        hareket: currentHareket
      })
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || 'Onaylama başarısız');
    }
    
    statusEl.innerHTML = `<span style="color: #27ae60;">✅ ${result.message}</span>`;
    
    setTimeout(() => {
      loadTableData();
    }, 1500);
    
  } catch (err) {
    console.error('Approval error:', err);
    statusEl.innerHTML = `<span class="error">❌ Hata: ${err.message}</span>`;
    
    setTimeout(() => {
      statusEl.textContent = originalText;
    }, 3000);
  } finally {
    isLoading = false;
    approveBtn.disabled = false;
    refreshBtn.disabled = false;
  }
}

// ==================== HATLAR YENİLE İŞLEMİ ====================
async function handleRefreshHats() {
  try {
    // Seçili hatları kontrol et
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0 || (rows.length === 1 && rows[0].querySelector('td')?.textContent === 'Henüz veri yok.')) {
      alert('⚠️ Veri seçmediniz. Lütfen önce hatları seçip listeleyin.');
      return;
    }

    // Kullanıcı bilgilerini al
    const userSession = localStorage.getItem('userSession');
    let currentGorev = 'User';
    let currentUsername = 'Bilinmiyor';
    if (userSession) {
      const sessionData = JSON.parse(userSession);
      currentGorev = sessionData.gorev;
      currentUsername = sessionData.username;
    }

    // Admin için zaman kısıtlaması yok, direkt işleme devam et
    if (currentGorev !== 'Admin') {
      // Zaman kısıtlaması kontrolü (sadece Admin olmayan kullanıcılar için)
      const timeCheckRes = await fetch('/api/check-time-restriction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'hatlar-yenile',
          gorev: currentGorev
        })
      });

      const timeCheckData = await timeCheckRes.json();
      console.log('⏰ Zaman kontrolü sonucu:', timeCheckData);

      if (!timeCheckData.allowed) {
        alert(`⏸️ Hatları Yenile İşlemi Şu Anda Yapılamaz\n\n` +
              `${timeCheckData.reason}\n\n` +
              `⏰ Şu anki saat: ${timeCheckData.currentTime}\n` +
              `🚫 Yasak saatler: ${timeCheckData.startTime} - ${timeCheckData.finishTime}\n\n` +
              `Bu işlemi ${timeCheckData.finishTime} sonrasında yapabilirsiniz.`);
        return;
      }

      console.log('✅ Zaman kontrolü geçildi, hatları yenileme işlemi başlatılıyor');
    } else {
      console.log('👑 Admin kullanıcısı - zaman kısıtlaması olmadan işlem yapılıyor');
    }

    // Onay al
    const confirmMsg = '🔄 Hatları Yenile İşlemi\n\n' +
      'Bu işlem:\n' +
      '1. Mevcut listeyi Excel olarak kaydedecek\n' +
      '2. Ekran görüntüsü alacak\n' +
      '3. Kullanıcılara mail gönderecek\n' +
      '4. Onaylanan ve Durum sütunlarını temizleyecek\n\n' +
      'Devam etmek istiyor musunuz?';
    
    if (!confirm(confirmMsg)) {
      return;
    }

    refreshHatsBtn.disabled = true;
    refreshHatsBtn.textContent = '⏳ İşlem yapılıyor...';

    // 1. Tablodaki verileri topla
    const tableData = [];
    const headerCells = theadRow.querySelectorAll('th');
    const headers = Array.from(headerCells).map(th => th.textContent.trim());

    const hatAdiIndex = headers.indexOf('Hat_Adi');
    const tarifeIndex = headers.indexOf('Tarife');
    const tarifeSaatiIndex = headers.indexOf('Tarife_Saati');
    const calismaZamaniIndex = headers.indexOf('Çalışma_Zamanı');
    const hareketIndex = headers.indexOf('Hareket');
    const onaylananIndex = headers.indexOf('Onaylanan');
    const durumIndex = headers.indexOf('Durum');

    let hasOnaylananData = false;
    let hasDurumData = false;

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length > 0 && cells[0].textContent !== 'Henüz veri yok.') {
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[header] = cells[index]?.textContent.trim() || '';
        });
        tableData.push(rowData);
        
        // Onaylanan ve Durum sütunlarında veri var mı kontrol et
        if (onaylananIndex !== -1 && cells[onaylananIndex]?.textContent.trim()) {
          hasOnaylananData = true;
        }
        if (durumIndex !== -1 && cells[durumIndex]?.textContent.trim()) {
          hasDurumData = true;
        }
      }
    });

    console.log(`📊 ${tableData.length} satır toplanıyor...`);
    console.log(`✅ Onaylanan sütununda veri: ${hasOnaylananData}`);
    console.log(`✅ Durum sütununda veri: ${hasDurumData}`);

    // Onaylanan veya Durum sütununda hiç veri yoksa işlemi durdur
    if (!hasOnaylananData && !hasDurumData) {
      alert('ℹ️ Liste Güncel\n\n' +
            'Onaylanan veya Durum sütunlarında hiç veri bulunmuyor.\n' +
            'Yenileme işlemine gerek yok.');
      refreshHatsBtn.disabled = false;
      refreshHatsBtn.textContent = '🔄 Hatları Yenile';
      return;
    }

    // 2. Excel oluştur (XLSX kütüphanesi kullanarak)
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(tableData);
    XLSX.utils.book_append_sheet(wb, ws, 'Hat Listesi');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    
    // Büyük veriyi chunk'lara bölerek base64'e çevir (stack overflow önleme)
    const uint8Array = new Uint8Array(excelBuffer);
    let binaryString = '';
    const chunkSize = 8192; // 8KB chunk
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, chunk);
    }
    const excelBase64 = btoa(binaryString);

    console.log('✅ Excel oluşturuldu');

    // 3. Ekran görüntüsü al (html2canvas ile)
    console.log('📸 Ekran görüntüsü alınıyor...');
    
    // html2canvas yüklenmediyse yükle
    if (typeof html2canvas === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }

    // Tabloyu bul
    let targetElement = document.querySelector('.table-wrap');
    if (!targetElement) {
      targetElement = document.querySelector('table');
    }
    if (!targetElement) {
      throw new Error('Tablo bulunamadı, ekran görüntüsü alınamıyor');
    }

    console.log('🎯 Target element:', targetElement.tagName, 'Width:', targetElement.offsetWidth, 'Height:', targetElement.offsetHeight);

    const canvas = await html2canvas(targetElement, { 
      scale: 0.8,
      logging: false,
      backgroundColor: '#ffffff',
      useCORS: true,
      allowTaint: true
    });
    
    console.log('🖼️ Canvas oluşturuldu:', 'Width:', canvas.width, 'Height:', canvas.height);
    
    // JPEG formatında sıkıştır (daha küçük dosya boyutu)
    const screenshotDataUrl = canvas.toDataURL('image/jpeg', 0.7);
    console.log('📦 DataURL uzunluğu:', screenshotDataUrl.length, '(~' + Math.round(screenshotDataUrl.length / 1024) + ' KB)');
    
    const screenshotBase64 = screenshotDataUrl.split(',')[1];

    console.log(`✅ Ekran görüntüsü alındı (${screenshotBase64 ? Math.round(screenshotBase64.length / 1024) : 0} KB)`);

    if (!screenshotBase64 || screenshotBase64.length < 100) {
      console.error('❌ Screenshot base64 çok küçük veya boş!');
      console.error('DataURL:', screenshotDataUrl.substring(0, 100));
      throw new Error('Ekran görüntüsü oluşturulamadı (boş veya çok küçük)');
    }

    // 4. Kullanıcıları getir
    console.log('👥 Kullanıcılar getiriliyor...');
    const usersRes = await fetch('/api/get-users');
    const usersData = await usersRes.json();

    if (!usersData.success || !usersData.users || usersData.users.length === 0) {
      throw new Error('Kullanıcı bulunamadı. Lütfen Kullanıcılar tablosunu kontrol edin.');
    }

    console.log(`✅ ${usersData.users.length} kullanıcı bulundu`);

    // 5. Timestamp oluştur
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    // 6. Mail gönder
    console.log('📧 Mailler gönderiliyor...');
    const emailRes = await fetch('/api/send-refresh-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: usersData.users,
        excelData: excelBase64,
        screenshotData: screenshotBase64,
        timestamp,
        username: currentUsername
      })
    });

    const emailData = await emailRes.json();

    if (!emailData.success) {
      throw new Error('Mail gönderilemedi: ' + (emailData.message || 'Bilinmeyen hata'));
    }

    console.log('✅ Mailler gönderildi');

    // 7. Dosyaları ZIP olarak kaydet
    console.log('💾 Dosyalar ZIP olarak hazırlanıyor...');
    
    const zip = new JSZip();
    const folderName = `Hat_Yenileme_${timestamp}`;
    
    // Excel dosyasını ekle
    zip.file(`${folderName}/Hat_Listesi_${timestamp}.xlsx`, new Uint8Array(excelBuffer));
    
    // Screenshot'ı ekle (JPEG formatında)
    const screenshotBlob = await (await fetch(`data:image/jpeg;base64,${screenshotBase64}`)).blob();
    zip.file(`${folderName}/Ekran_Goruntusu_${timestamp}.jpg`, screenshotBlob);
    
    // ZIP'i oluştur ve indir
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipLink = document.createElement('a');
    zipLink.href = zipUrl;
    zipLink.download = `${folderName}.zip`;
    zipLink.click();
    URL.revokeObjectURL(zipUrl);

    console.log('✅ ZIP dosyası indirildi');

    // 8. Veritabanını temizle
    console.log('🧹 Onaylanan ve Durum sütunları temizleniyor...');
    
    // Sadece Hat sütunundaki benzersiz tablo isimlerini gönder
    const uniqueHatlar = [...new Set(tableData.map(row => row.Hat))].filter(Boolean);
    
    console.log(`📊 Temizlenecek tablo sayısı: ${uniqueHatlar.length}`);
    console.log(`📋 Tablolar:`, uniqueHatlar);

    const clearRes = await fetch('/api/clear-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hatlar: uniqueHatlar })
    });

    const clearResult = await clearRes.json();

    if (!clearResult.success) {
      throw new Error('Temizleme hatası: ' + clearResult.error);
    }

    console.log(`✅ ${clearResult.updatedCount} satır temizlendi`);
    
    // Kullanıcıya bilgilendirme göster
    if (clearResult.updatedCount > 0) {
      console.log(`🎉 Onaylanan ve Durum sütunları ${clearResult.updatedCount} satırdan temizlendi!`);
    }

    // 9. Seçili hatların Yeni_Plaka sütunlarını temizle (bugünün gün tablosunda)
    console.log('🧹 Seçili hatların Yeni_Plaka sütunları temizleniyor...');
    
    // Seçili hatları bul
    const selectedHatCheckboxes = document.querySelectorAll('.hat-checkbox:checked');
    const selectedHatlar = Array.from(selectedHatCheckboxes).map(cb => cb.value);
    
    if (selectedHatlar.length > 0) {
      console.log('🚌 Temizlenecek hatlar:', selectedHatlar);
      
      const clearPlakaRes = await fetch('/api/clear-yeni-plaka', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hatlar: selectedHatlar })
      });

      const clearPlakaResult = await clearPlakaRes.json();

      if (clearPlakaResult.success) {
        console.log(`✅ ${clearPlakaResult.clearedCount} satırın Yeni_Plaka sütunu temizlendi (${clearPlakaResult.tableName} tablosunda)`);
      } else {
        console.warn('⚠️ Yeni_Plaka temizleme hatası:', clearPlakaResult.message);
      }
    } else {
      console.log('ℹ️ Seçili hat yok, Yeni_Plaka temizleme atlanıyor');
    }

    // 10. Tabloyu yenile
    alert(`✅ İşlem Tamamlandı!\n\n` +
      `📧 ${usersData.users.length} kullanıcıya mail gönderildi\n` +
      `🧹 ${clearResult.updatedCount} satır temizlendi\n` +
      `💾 Dosyalar indirildi\n\n` +
      `Tablo yenileniyor...`);

    // Seçili hatları tekrar yükle
    const selectedHats = Array.from(document.querySelectorAll('.hat-checkbox:checked')).map(cb => cb.value);
    if (selectedHats.length > 0) {
      await handleApplyHatSelection();
    }

  } catch (err) {
    console.error('Hatları yenile hatası:', err);
    alert(`❌ Hata: ${err.message}`);
  } finally {
    refreshHatsBtn.disabled = false;
    refreshHatsBtn.textContent = '🔄 Hatları Yenile';
  }
}

// ==================== AÇIKLAMA İNCELEME ====================
let currentAciklamaData = []; // Excel export için

function openAciklamaInceleModal() {
  // Session kontrolü
  const userSession = localStorage.getItem('userSession');
  if (!userSession) {
    alert('⚠️ Oturum bulunamadı. Lütfen tekrar giriş yapın.');
    return;
  }
  
  const session = JSON.parse(userSession);
  const gorev = session.gorev;
  
  // Görev seçim div'ini her zaman göster
  const gorevSelectionDiv = document.getElementById('gorevSelectionDiv');
  const gorevCombo = document.getElementById('gorevSelectCombo');
  
  gorevSelectionDiv.style.display = 'block';
  gorevCombo.value = '';
  aciklamaInceleModal.style.display = 'flex';
  
  // Tablo boş
  document.getElementById('aciklamaTableBody').innerHTML = '<tr><td colspan="7" style="padding: 30px; text-align: center; color: #7f8c8d;">Lütfen yukarıdan bir seçim yapın</td></tr>';
}

function closeAciklamaInceleModalFunc() {
  aciklamaInceleModal.style.display = 'none';
  currentAciklamaData = [];
}

async function loadAciklamaData(gorevParam) {
  const statusEl = document.getElementById('aciklamaInceleStatus');
  const tableBody = document.getElementById('aciklamaTableBody');
  
  // Görev belirle
  let selectedGorev = gorevParam;
  if (!selectedGorev) {
    selectedGorev = document.getElementById('gorevSelectCombo').value;
  }
  
  console.log('🔍 loadAciklamaData çağrıldı:', { gorevParam, selectedGorev });
  
  if (!selectedGorev) {
    statusEl.innerHTML = '<span style="color: #e74c3c;">⚠️ Lütfen bir seçim yapın</span>';
    statusEl.style.display = 'block';
    return;
  }
  
  statusEl.innerHTML = '<span style="color: #3498db;">⏳ Yükleniyor...</span>';
  statusEl.style.display = 'block';
  tableBody.innerHTML = '<tr><td colspan="7" style="padding: 30px; text-align: center;">⏳ Veriler yükleniyor...</td></tr>';
  
  console.log('📤 API\'ye gönderilecek görev:', selectedGorev);
  
  try {
    // Yeni API endpoint kullan
    const response = await fetch('/api/get-aciklamalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gorev: selectedGorev
      })
    });
    
    const result = await response.json();
    
    console.log('📊 API Yanıtı:', result);
    
    if (!result.success) {
      throw new Error(result.error || 'Veri yüklenemedi');
    }
    
    const data = result.data || [];
    currentAciklamaData = data;
    
    // Başlık güncelle
    document.getElementById('aciklamaInceleTitle').textContent = `📝 ${selectedGorev} Açıklamaları (${data.length})`;
    
    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="padding: 30px; text-align: center; color: #7f8c8d;">Henüz açıklama eklenmemiş</td></tr>';
      statusEl.style.display = 'none';
      // Buton gizle
      if (sistemiGuncelleBtn) {
        sistemiGuncelleBtn.style.display = 'none';
      }
      return;
    }
    
    // Eski veri kontrolü - bugünden önceki tarihler var mı?
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let hasOldData = false;
    data.forEach(row => {
      if (row.Tarih) {
        const rowDate = new Date(row.Tarih);
        rowDate.setHours(0, 0, 0, 0);
        if (rowDate < today) {
          hasOldData = true;
        }
      }
    });
    
    // Eski veri varsa VE saat izin veriyorsa butonu göster
    if (sistemiGuncelleBtn) {
      if (hasOldData) {
        // Saat kontrolü yap - AutoReset için izin var mı?
        try {
          const userSession = localStorage.getItem('userSession');
          let currentGorev = 'User';
          if (userSession) {
            const session = JSON.parse(userSession);
            currentGorev = session.gorev;
          }
          
          const timeCheckRes = await fetch('/api/check-time-restriction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'auto-reset',
              gorev: currentGorev
            })
          });
          
          const timeCheckData = await timeCheckRes.json();
          
          if (timeCheckData.allowed) {
            // İzin var - butonu göster
            sistemiGuncelleBtn.style.display = 'inline-block';
            console.log('✅ Eski veri var ve saat izin veriyor - buton gösteriliyor');
          } else {
            // İzin yok - butonu gizle
            sistemiGuncelleBtn.style.display = 'none';
            console.log('🚫 Eski veri var ama saat izin vermiyor - buton gizleniyor');
            console.log('⏰ Sebep:', timeCheckData.reason);
          }
        } catch (err) {
          console.error('⏰ Saat kontrolü hatası:', err);
          // Hata durumunda butonu göster (güvenli taraf)
          sistemiGuncelleBtn.style.display = 'inline-block';
        }
      } else {
        sistemiGuncelleBtn.style.display = 'none';
      }
    }
    
    // Tabloyu doldur
    tableBody.innerHTML = '';
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #f0f0f0';
      
      // Tarih formatla (2025-11-26 14:30:45 formatında)
      let tarihStr = '-';
      if (row.Tarih) {
        const tarihObj = new Date(row.Tarih);
        const yil = tarihObj.getFullYear();
        const ay = String(tarihObj.getMonth() + 1).padStart(2, '0');
        const gun = String(tarihObj.getDate()).padStart(2, '0');
        const saat = String(tarihObj.getHours()).padStart(2, '0');
        const dakika = String(tarihObj.getMinutes()).padStart(2, '0');
        const saniye = String(tarihObj.getSeconds()).padStart(2, '0');
        tarihStr = `${gun}.${ay}.${yil} ${saat}:${dakika}:${saniye}`;
      }
      
      tr.innerHTML = `
        <td style="padding: 10px; white-space: nowrap;">${tarihStr}</td>
        <td style="padding: 10px;">${row.Hat_Adi || '-'}</td>
        <td style="padding: 10px;">${row['Çalışma_Zamanı'] || '-'}</td>
        <td style="padding: 10px;">${row.Tarife || '-'}</td>
        <td style="padding: 10px;">${row.Tarife_Saati || '-'}</td>
        <td style="padding: 10px;">${row.Plaka || '-'}</td>
        <td style="padding: 10px; max-width: 300px; word-wrap: break-word;">${row.Açıklama || '-'}</td>
      `;
      
      // Satıra tıklandığında ana tabloda o satıra git
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        console.log('🖱️ Açıklama satırına tıklandı!', row);
        scrollToRowInMainTable(row);
      });
      
      tableBody.appendChild(tr);
    });
    
    statusEl.innerHTML = `<span style="color: #27ae60;">✅ ${data.length} kayıt yüklendi</span>`;
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 2000);
    
  } catch (err) {
    console.error('Açıklama yükleme hatası:', err);
    statusEl.innerHTML = `<span style="color: #e74c3c;">❌ ${err.message}</span>`;
    tableBody.innerHTML = '<tr><td colspan="8" style="padding: 30px; text-align: center; color: #e74c3c;">Veri yüklenemedi</td></tr>';
  }
}

// ==================== SİSTEMİ GÜNCELLE VE MAİL GÖNDER ====================
async function handleSistemiGuncelle() {
  try {
    // Onay al
    const confirmMsg = '📧 Sistemi Güncelle ve Mail Gönder\n\n' +
      'Bu işlem:\n' +
      '1. Operasyon ve Depolama açıklamalarını Excel olarak kaydedecek\n' +
      '2. Tüm kullanıcılara mail gönderecek\n' +
      '3. Açıklama tablolarını tamamen temizleyecek\n\n' +
      'Devam etmek istiyor musunuz?';
    
    if (!confirm(confirmMsg)) {
      return;
    }

    sistemiGuncelleBtn.disabled = true;
    sistemiGuncelleBtn.textContent = '⏳ İşlem yapılıyor...';

    console.log('📊 Açıklama verileri toplanıyor...');

    // 1. Her iki tablodan veri çek
    const operasyonRes = await fetch('/api/get-aciklamalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gorev: 'Operasyon' })
    });
    const operasyonData = await operasyonRes.json();

    const depolamaRes = await fetch('/api/get-aciklamalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gorev: 'Depolama' })
    });
    const depolamaData = await depolamaRes.json();

    if (!operasyonData.success || !depolamaData.success) {
      throw new Error('Veriler yüklenemedi');
    }

    console.log(`✅ Operasyon: ${operasyonData.data.length} kayıt, Depolama: ${depolamaData.data.length} kayıt`);

    // 2. Excel dosyaları oluştur
    const createExcelData = (data) => {
      return data.map(row => {
        let tarihStr = '';
        if (row.Tarih) {
          const tarihObj = new Date(row.Tarih);
          const yil = tarihObj.getFullYear();
          const ay = String(tarihObj.getMonth() + 1).padStart(2, '0');
          const gun = String(tarihObj.getDate()).padStart(2, '0');
          const saat = String(tarihObj.getHours()).padStart(2, '0');
          const dakika = String(tarihObj.getMinutes()).padStart(2, '0');
          const saniye = String(tarihObj.getSeconds()).padStart(2, '0');
          tarihStr = `${gun}.${ay}.${yil} ${saat}:${dakika}:${saniye}`;
        }
        
        return {
          'Tarih': tarihStr,
          'Hat Adı': row.Hat_Adi || '',
          'Çalışma Zamanı': row['Çalışma_Zamanı'] || '',
          'Tarife': row.Tarife || '',
          'Tarife Saati': row.Tarife_Saati || '',
          'Plaka': row.Plaka || '',
          'Açıklama': row.Açıklama || ''
        };
      });
    };

    // Operasyon Excel
    const operasyonExcelData = createExcelData(operasyonData.data);
    const wsOp = XLSX.utils.json_to_sheet(operasyonExcelData);
    const wbOp = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbOp, wsOp, 'Operasyon Açıklamalar');
    const excelBufferOp = XLSX.write(wbOp, { bookType: 'xlsx', type: 'array' });
    
    // Depolama Excel
    const depolamaExcelData = createExcelData(depolamaData.data);
    const wsDep = XLSX.utils.json_to_sheet(depolamaExcelData);
    const wbDep = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbDep, wsDep, 'Depolama Açıklamalar');
    const excelBufferDep = XLSX.write(wbDep, { bookType: 'xlsx', type: 'array' });

    console.log('✅ Excel dosyaları oluşturuldu');

    // Base64'e çevir
    const toBase64 = (buffer) => {
      const uint8Array = new Uint8Array(buffer);
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, chunk);
      }
      return btoa(binaryString);
    };

    const operasyonBase64 = toBase64(excelBufferOp);
    const depolamaBase64 = toBase64(excelBufferDep);

    // 3. Kullanıcıları getir
    console.log('👥 Kullanıcılar getiriliyor...');
    const usersRes = await fetch('/api/get-users');
    const usersData = await usersRes.json();

    if (!usersData.success || !usersData.users || usersData.users.length === 0) {
      throw new Error('Kullanıcı bulunamadı');
    }

    console.log(`✅ ${usersData.users.length} kullanıcı bulundu`);

    // 4. Timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    // 5. Mail gönder - Her iki Excel dosyasını gönder
    console.log('📧 Mailler gönderiliyor...');
    const session = JSON.parse(localStorage.getItem('userSession') || '{}');
    
    try {
      const emailRes = await fetch('/api/send-aciklama-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: usersData.users,
          operasyonExcelData: operasyonBase64,
          depolamaExcelData: depolamaBase64,
          timestamp,
          username: session.username || 'Bilinmiyor'
        })
      });

      const emailData = await emailRes.json();

      if (!emailData.success) {
        console.warn('⚠️ Mail gönderilemedi:', emailData.message);
      } else {
        console.log('✅ Mailler gönderildi');
      }
    } catch (emailErr) {
      console.warn('⚠️ Mail gönderme hatası:', emailErr.message);
      // Mail hatası olsa bile devam et
    }

    // 6. Tabloları temizle
    console.log('🧹 Açıklama tabloları temizleniyor...');
    
    try {
      const clearRes = await fetch('/api/clear-aciklamalar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!clearRes.ok) {
        console.error('❌ Clear API yanıt hatası:', clearRes.status, clearRes.statusText);
        throw new Error(`API hatası: ${clearRes.status} ${clearRes.statusText}`);
      }

      const clearResult = await clearRes.json();

      if (!clearResult.success) {
        throw new Error('Tablolar temizlenemedi: ' + clearResult.error);
      }

      console.log('✅ Tablolar temizlendi');
    } catch (clearErr) {
      console.error('❌ Tablolar temizlenirken hata:', clearErr);
      throw new Error('Tablolar temizlenemedi: ' + clearErr.message);
    }

    // 7. ZIP dosyası oluştur ve indir
    console.log('💾 ZIP dosyası hazırlanıyor...');
    const zip = new JSZip();
    const folderName = `Aciklama_Yedekleme_${timestamp}`;
    
    zip.file(`${folderName}/Operasyon_Aciklamalar_${timestamp}.xlsx`, new Uint8Array(excelBufferOp));
    zip.file(`${folderName}/Depolama_Aciklamalar_${timestamp}.xlsx`, new Uint8Array(excelBufferDep));
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const zipLink = document.createElement('a');
    zipLink.href = zipUrl;
    zipLink.download = `${folderName}.zip`;
    zipLink.click();
    URL.revokeObjectURL(zipUrl);

    console.log('✅ ZIP dosyası indirildi');

    // 8. Başarı mesajı
    alert(`✅ İşlem Tamamlandı!\n\n` +
      `📧 ${usersData.users.length} kullanıcıya mail gönderildi\n` +
      `🧹 Operasyon ve Depolama açıklama tabloları temizlendi\n` +
      `💾 Yedek dosyalar indirildi\n\n` +
      `Modal yenileniyor...`);

    // 9. Modalı yenile ve butonu gizle
    closeAciklamaInceleModalFunc();
    openAciklamaInceleModal();
    
    // Buton artık görünmeyecek çünkü eski veri kalmadı
    if (sistemiGuncelleBtn) {
      sistemiGuncelleBtn.style.display = 'none';
    }

  } catch (err) {
    console.error('Sistemi güncelle hatası:', err);
    alert(`❌ Hata: ${err.message}`);
  } finally {
    sistemiGuncelleBtn.disabled = false;
    sistemiGuncelleBtn.textContent = '📧 Sistemi Güncelle ve Mail Gönder';
  }
}

function exportAciklamaToExcel() {
  if (!currentAciklamaData || currentAciklamaData.length === 0) {
    alert('⚠️ Dışa aktarılacak veri yok!');
    return;
  }
  
  try {
    // Excel için veri hazırla
    const excelData = currentAciklamaData.map(row => {
      // Tarih formatla
      let tarihStr = '';
      if (row.Tarih) {
        const tarihObj = new Date(row.Tarih);
        const yil = tarihObj.getFullYear();
        const ay = String(tarihObj.getMonth() + 1).padStart(2, '0');
        const gun = String(tarihObj.getDate()).padStart(2, '0');
        const saat = String(tarihObj.getHours()).padStart(2, '0');
        const dakika = String(tarihObj.getMinutes()).padStart(2, '0');
        const saniye = String(tarihObj.getSeconds()).padStart(2, '0');
        tarihStr = `${gun}.${ay}.${yil} ${saat}:${dakika}:${saniye}`;
      }
      
      return {
        'Tarih': tarihStr,
        'Hat Adı': row.Hat_Adi,
        'Çalışma Zamanı': row['Çalışma_Zamanı'],
        'Tarife': row.Tarife,
        'Tarife Saati': row.Tarife_Saati,
        'Plaka': row.Plaka,
        'Açıklama': row.Açıklama
      };
    });
    
    // Worksheet oluştur
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    // Sütun genişlikleri
    ws['!cols'] = [
      { wch: 20 },  // Tarih
      { wch: 15 },  // Hat Adı
      { wch: 15 },  // Çalışma Zamanı
      { wch: 10 },  // Tarife
      { wch: 12 },  // Tarife Saati
      { wch: 20 },  // Plaka
      { wch: 50 }   // Açıklama
    ];
    
    // Workbook oluştur
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Açıklamalar');
    
    // Dosya adı
    const userSession = localStorage.getItem('userSession');
    const session = JSON.parse(userSession);
    const gorev = session.gorev === 'Operasyon' || session.gorev === 'Depolama' 
      ? session.gorev 
      : document.getElementById('gorevSelectCombo').value;
    
    const fileName = `${gorev}_Aciklamalar_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // İndir
    XLSX.writeFile(wb, fileName);
    
    console.log('✅ Excel dosyası indirildi:', fileName);
    
  } catch (err) {
    console.error('Excel export hatası:', err);
    alert('❌ Excel dosyası oluşturulamadı: ' + err.message);
  }
}

// ==================== FORCE LOGOUT CHECK ====================
// Admin bir kullanıcının görevini değiştirdiğinde, o kullanıcıyı otomatik logout yap
function startForceLogoutCheck() {
  // Her 30 saniyede bir kontrol et (bandwidth tasarrufu)
  setInterval(async () => {
    const userSession = localStorage.getItem('userSession');
    if (!userSession) return;
    
    try {
      const session = JSON.parse(userSession);
      const username = session.username;
      const currentGorev = session.gorev;
      
      // Veritabanından kullanıcının güncel görevini kontrol et
      const response = await fetch('/api/check-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        console.error('❌ Session kontrolü başarısız:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (!data.success || !data.sessionValid) {
        console.log('⚠️ Kullanıcı bulunamadı, logout yapılıyor');
        localStorage.removeItem('userSession');
        alert('Hesabınız sistemden silinmiş. Lütfen yöneticiniz ile iletişime geçin.');
        window.location.href = '/login';
        return;
      }
      
      // Görev değişmiş mi kontrol et
      if (data.user.Görev !== currentGorev) {
        console.log('⚠️ Görev değişikliği algılandı!', {
          old: currentGorev,
          new: data.user.Görev
        });
        
        // Session'ı temizle
        localStorage.removeItem('userSession');
        
        // Kullanıcıya bilgi ver
        alert(`Göreviniz "${currentGorev}" → "${data.user.Görev}" olarak değiştirildi.\n\nOturumunuz sonlandırıldı. Lütfen yeniden giriş yapın.`);
        
        // Login sayfasına yönlendir
        window.location.href = '/login';
      }
      
    } catch (err) {
      console.error('❌ Force logout kontrolü hatası:', err);
    }
  }, 5000); // 5 saniyede bir kontrol
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  // Otomatik güncelleme kontrolü (Operasyon ve Depolama için)
  checkAutoUpdateAciklamalar();
  
  // Force logout kontrolü başlat (her 3 saniyede bir kontrol)
  startForceLogoutCheck();
  
  handleRefresh();
});

// ==================== OTOMATIK GÜNCELLEME KONTROLÜ ====================
async function checkAutoUpdateAciklamalar() {
  try {
    const userSession = localStorage.getItem('userSession');
    if (!userSession) return;
    
    const session = JSON.parse(userSession);
    
    // Sadece Operasyon veya Depolama kullanıcıları için
    if (session.gorev !== 'Operasyon' && session.gorev !== 'Depolama') {
      console.log('ℹ️ Kullanıcı Operasyon/Depolama değil, otomatik güncelleme atlanıyor');
      return;
    }
    
    console.log('🔍 Otomatik güncelleme kontrolü başlatılıyor...');
    console.log('👤 Kullanıcı Görevi:', session.gorev);
    
    // Saat tablosundan AutoReset kontrolü yap
    console.log('⏰ AutoReset saat aralığı kontrol ediliyor...');
    
    const timeCheckRes = await fetch('/api/check-time-restriction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'auto-reset',
        gorev: session.gorev
      })
    });

    const timeCheckData = await timeCheckRes.json();
    console.log('⏰ AutoReset zaman kontrolü sonucu:', timeCheckData);

    if (!timeCheckData.allowed) {
      console.log('⏸️ Otomatik güncelleme atlanıyor:', timeCheckData.reason);
      console.log(`⏰ Şu anki saat: ${timeCheckData.currentTime}`);
      console.log(`🚫 Yasak saatler: ${timeCheckData.startTime} - ${timeCheckData.finishTime}`);
      return;
    }

    console.log('✅ Zaman kontrolü geçildi, otomatik güncelleme yapılacak');
    
    const updateRes = await fetch('/api/auto-update-aciklamalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: session.username || 'Bilinmiyor'
      })
    });

    console.log('📨 API yanıt durumu:', updateRes.status, updateRes.statusText);
    
    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      console.error('❌ API hatası:', updateRes.status);
      console.error('📄 Hata detayı:', errorText);
      return;
    }
    
    const updateData = await updateRes.json();
    console.log('📊 API yanıt verisi:', updateData);
    
    if (updateData.updated) {
      console.log('✅ Otomatik güncelleme yapıldı!');
      console.log(`📧 ${updateData.emailCount} kullanıcıya mail gönderildi`);
      console.log(`📊 Operasyon: ${updateData.operasyonCount} kayıt`);
      console.log(`📊 Depolama: ${updateData.depolamaCount} kayıt`);
      console.log('🧹 Tablolar temizlendi');
      
      alert(`✅ Sistem Güncellendi!\n\n` +
            `Eski tarihli açıklama kayıtları temizlendi.\n\n` +
            `📊 Operasyon: ${updateData.operasyonCount} kayıt\n` +
            `📊 Depolama: ${updateData.depolamaCount} kayıt\n\n` +
            `📧 ${updateData.emailCount} kullanıcıya mail gönderildi.`);
    } else {
      console.log('ℹ️ Güncelleme gerekmedi');
      console.log('📝 Sebep:', updateData.message);
    }
    
  } catch (err) {
    console.error('❌ Otomatik güncelleme hatası:', err);
  }
}

// ==================== SATIR AÇIKLAMA MODAL ====================
function closeRowAciklamaModalFunc() {
  rowAciklamaModal.style.display = 'none';
}

// Ana tabloda belirtilen satıra scroll yap ve vurgula
function scrollToRowInMainTable(rowData) {
  console.log('📍 Ana tabloda satıra scroll yapılıyor:', rowData);
  
  // Önce tüm vurguları temizle
  clearAllHighlights();
  
  try {
    const rows = tbody.querySelectorAll('tr');
    const headerCells = theadRow.querySelectorAll('th');
    const headers = Array.from(headerCells).map(th => th.textContent.trim());
    
    const hatAdiIndex = headers.indexOf('Hat_Adi');
    const tarifeIndex = headers.indexOf('Tarife');
    const tarifeSaatiIndex = headers.indexOf('Tarife_Saati');
    const plakaIndex = headers.indexOf('Plaka');
    
    console.log('🔍 Satır arama parametreleri:', {
      rowData,
      hatAdiIndex,
      tarifeIndex,
      tarifeSaatiIndex,
      plakaIndex,
      totalRows: rows.length
    });
    
    // Tabloda eşleşen satırı bul
    let foundRow = false;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');
      
      if (cells.length === 0) continue;
      
      // Hücre değerlerini al
      const hatAdiCell = hatAdiIndex >= 0 ? cells[hatAdiIndex]?.textContent.trim() : '';
      const tarifeCell = tarifeIndex >= 0 ? cells[tarifeIndex]?.textContent.trim() : '';
      const tarifeSaatiCell = tarifeSaatiIndex >= 0 ? cells[tarifeSaatiIndex]?.textContent.trim() : '';
      const plakaCell = plakaIndex >= 0 ? cells[plakaIndex]?.textContent.trim() : '';
      
      // Eşleşme kontrolü
      const hatAdiMatch = hatAdiCell === rowData.Hat_Adi;
      const tarifeMatch = tarifeCell === rowData.Tarife;
      const tarifeSaatiMatch = tarifeSaatiCell === rowData.Tarife_Saati || tarifeSaatiCell === rowData.Tarife_Saati?.substring(0, 5);
      
      // Hat_Adi, Tarife ve Tarife_Saati eşleşmeli
      if (hatAdiMatch && tarifeMatch && tarifeSaatiMatch) {
        foundRow = true;
        
        // Satırı mavi ile vurgula
        row.style.backgroundColor = '#d4edff';
        highlightedRows.push(row);
        
        console.log('✅ Satır bulundu ve vurgulandı:', {
          rowIndex: i,
          hatAdi: hatAdiCell,
          tarife: tarifeCell,
          tarifeSaati: tarifeSaatiCell,
          plaka: plakaCell
        });
        
        // Satırı görünür alana kaydır (ortaya)
        row.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // 3 saniye sonra vurguyu kaldır
        setTimeout(() => {
          row.style.backgroundColor = '';
          const index = highlightedRows.indexOf(row);
          if (index > -1) {
            highlightedRows.splice(index, 1);
          }
        }, 3000);
        
        break;
      }
    }
    
    if (!foundRow) {
      console.warn('⚠️ Ana tabloda eşleşen satır bulunamadı');
      alert('Bu satır şu an tabloda görünmüyor. Farklı bir hat veya hareket seçimi yapılmış olabilir.');
    }
    
  } catch (err) {
    console.error('❌ Scroll hatası:', err);
  }
}

async function openRowAciklamaModal(rowData) {
  console.log('💬 Açıklama mesajları açılıyor:', rowData);
  
  // Satır bilgilerini göster
  const detailsDiv = document.getElementById('rowAciklamaDetails');
  detailsDiv.innerHTML = `
    <div><strong>Hat:</strong> ${rowData.Hat_Adi || '-'}</div>
    <div><strong>Tarife:</strong> ${rowData.Tarife || '-'}</div>
    <div><strong>Tarife Saati:</strong> ${rowData.Tarife_Saati || '-'}</div>
  `;
  
  // Modal'ı göster
  rowAciklamaModal.style.display = 'flex';
  
  // Tablo body'yi temizle ve yükleniyor göster
  const tbody = document.getElementById('rowAciklamaTableBody');
  tbody.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">Yükleniyor...</td></tr>';
  
  try {
    // API'den açıklamaları al
    const response = await fetch('/api/get-row-aciklamalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Hat_Adi: rowData.Hat_Adi,
        Tarife: rowData.Tarife,
        Tarife_Saati: rowData.Tarife_Saati
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Açıklamalar alınamadı');
    }
    
    if (!result.success || !result.data || result.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">Bu satır için açıklama bulunamadı.</td></tr>';
      return;
    }
    
    // Açıklamaları listele
    tbody.innerHTML = '';
    
    console.log('📋 Listelenen açıklama sayısı:', result.data.length);
    
    result.data.forEach((aciklama, index) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #e0e0e0';
      tr.style.cursor = 'pointer';
      tr.style.transition = 'background-color 0.2s';
      
      console.log(`📝 Açıklama ${index + 1} için event listener ekleniyor:`, aciklama);
      
      // Hover efekti
      tr.addEventListener('mouseenter', () => {
        tr.style.backgroundColor = '#f5f5f5';
      });
      tr.addEventListener('mouseleave', () => {
        tr.style.backgroundColor = '';
      });
      
      // Tıklandığında ana tabloda o satıra git
      tr.addEventListener('click', (e) => {
        console.log('🖱️ Açıklama satırına tıklandı!', e);
        console.log('📊 Açıklama verisi:', aciklama);
        console.log('📊 rowData:', rowData);
        
        const targetRow = {
          Hat_Adi: aciklama.Hat_Adi || rowData.Hat_Adi,
          Tarife: aciklama.Tarife || rowData.Tarife,
          Tarife_Saati: aciklama.Tarife_Saati || rowData.Tarife_Saati,
          Plaka: aciklama.Plaka
        };
        
        console.log('🎯 Hedef satır:', targetRow);
        
        scrollToRowInMainTable(targetRow);
        // Modal'ı kapat
        closeRowAciklamaModalFunc();
      });      // Tarih
      const tdTarih = document.createElement('td');
      tdTarih.style.padding = '10px';
      tdTarih.style.fontSize = '13px';
      const tarih = new Date(aciklama.Tarih);
      tdTarih.textContent = tarih.toLocaleString('tr-TR');
      tr.appendChild(tdTarih);
      
      // Kaynak
      const tdKaynak = document.createElement('td');
      tdKaynak.style.padding = '10px';
      tdKaynak.style.fontSize = '13px';
      tdKaynak.style.fontWeight = 'bold';
      tdKaynak.style.color = aciklama._Kaynak === 'Operasyon' ? '#3498db' : '#e67e22';
      tdKaynak.textContent = aciklama._Kaynak;
      tr.appendChild(tdKaynak);
      
      // Açıklama
      const tdAciklama = document.createElement('td');
      tdAciklama.style.padding = '10px';
      tdAciklama.style.fontSize = '13px';
      tdAciklama.textContent = aciklama.Açıklama || '-';
      tr.appendChild(tdAciklama);
      
      tbody.appendChild(tr);
    });
    
    console.log(`✅ ${result.data.length} açıklama gösterildi`);
    
  } catch (err) {
    console.error('Açıklama yükleme hatası:', err);
    tbody.innerHTML = `<tr><td colspan="3" style="padding: 20px; text-align: center; color: #e74c3c;">❌ Hata: ${err.message}</td></tr>`;
  }
}

// İlk yüklemede açıklama kontrolü (cache ile)
async function checkAndSetAciklamaIcon(cell, rowData) {
  const cacheKey = `${rowData.Hat_Adi}|${rowData.Tarife}|${rowData.Tarife_Saati}`;
  
  // Cache'de varsa direkt kullan
  if (aciklamaCache.hasOwnProperty(cacheKey)) {
    const hasAciklama = aciklamaCache[cacheKey];
    if (hasAciklama) {
      cell.textContent = '💬';
      cell.style.cursor = 'pointer';
      cell.title = 'Açıklama mesajlarını görüntüle';
    } else {
      cell.textContent = '';
      cell.style.cursor = 'default';
      cell.title = '';
    }
    return;
  }
  
  // Cache'de yoksa API'den al
  try {
    const response = await fetch('/api/get-row-aciklamalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Hat_Adi: rowData.Hat_Adi,
        Tarife: rowData.Tarife,
        Tarife_Saati: rowData.Tarife_Saati
      })
    });
    
    const result = await response.json();
    const hasAciklama = result.success && result.data && result.data.length > 0;
    
    // Cache'e kaydet
    aciklamaCache[cacheKey] = hasAciklama;
    
    if (hasAciklama) {
      cell.textContent = '💬';
      cell.style.cursor = 'pointer';
      cell.title = 'Açıklama mesajlarını görüntüle';
    } else {
      cell.textContent = '';
      cell.style.cursor = 'default';
      cell.title = '';
    }
  } catch (err) {
    console.error('Açıklama kontrolü hatası:', err);
    cell.textContent = '';
  }
}

// Sadece açıklama durumunu kontrol et (ikon değiştirme yapmadan)
async function checkRowHasAciklama(rowData) {
  try {
    const response = await fetch('/api/get-row-aciklamalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Hat_Adi: rowData.Hat_Adi,
        Tarife: rowData.Tarife,
        Tarife_Saati: rowData.Tarife_Saati
      })
    });
    
    const result = await response.json();
    return result.success && result.data && result.data.length > 0;
  } catch (err) {
    console.error('Açıklama kontrolü hatası:', err);
    return false;
  }
}

// Açıklama eklendiğinde sadece o satırın ikonunu güncelle
async function updateAciklamaIconsForRow(hatAdi, tarife, tarifeSaati) {
  const cacheKey = `${hatAdi}|${tarife}|${tarifeSaati}`;
  
  try {
    const response = await fetch('/api/get-row-aciklamalar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Hat_Adi: hatAdi,
        Tarife: tarife,
        Tarife_Saati: tarifeSaati
      })
    });
    
    const result = await response.json();
    const hasAciklama = result.success && result.data && result.data.length > 0;
    
    // Cache'i güncelle
    aciklamaCache[cacheKey] = hasAciklama;
    
    // ⚡ Tablodaki TÜM eşleşen satırların ikonlarını HEMEN güncelle (cross-device için)
    const allIconCells = document.querySelectorAll('.aciklama-icon-cell');
    allIconCells.forEach(cell => {
      if (cell.dataset.hatAdi === hatAdi && 
          cell.dataset.tarife === tarife && 
          cell.dataset.tarifeSaati === tarifeSaati) {
        if (hasAciklama) {
          // Refresh ikonunu kaldır, mesaj ikonu ekle
          cell.innerHTML = '';
          const messageIcon = document.createElement('span');
          messageIcon.className = 'message-icon';
          messageIcon.textContent = '💬';
          messageIcon.style.cursor = 'pointer';
          messageIcon.title = 'Açıklama mesajlarını görüntüle';
          messageIcon.onclick = (e) => {
            e.stopPropagation();
            // Row datasını TR elementinden al
            const tr = cell.closest('tr');
            const rowDataStr = tr.dataset.rowData;
            if (rowDataStr) {
              const rowData = JSON.parse(rowDataStr);
              openRowAciklamaModal(rowData);
            } else {
              // Fallback: En azından key alanları kullan
              openRowAciklamaModal({
                Hat_Adi: hatAdi,
                Tarife: tarife,
                Tarife_Saati: tarifeSaati
              });
            }
          };
          cell.appendChild(messageIcon);
        } else {
          // Mesaj yoksa refresh ikonu ekle
          cell.innerHTML = '';
          const refreshIcon = document.createElement('span');
          refreshIcon.textContent = '🔄';
          refreshIcon.style.cursor = 'pointer';
          refreshIcon.style.fontSize = '14px';
          refreshIcon.style.opacity = '0.6';
          refreshIcon.title = 'Bu satırın mesaj durumunu kontrol et';
          refreshIcon.onclick = async (e) => {
            e.stopPropagation();
            refreshIcon.style.opacity = '0.3';
            // Row data'yı TR elementinden al
            const tr = cell.closest('tr');
            const rowDataStr = tr.dataset.rowData;
            let rowData = null;
            if (rowDataStr) {
              rowData = JSON.parse(rowDataStr);
            } else {
              // Fallback: En azından key alanları kullan
              rowData = {
                Hat_Adi: hatAdi,
                Tarife: tarife,
                Tarife_Saati: tarifeSaati
              };
            }
            
            const hasAciklama = await checkRowHasAciklama(rowData);
            const cacheKey = `${hatAdi}|${tarife}|${tarifeSaati}`;
            aciklamaCache[cacheKey] = hasAciklama;
            
            if (hasAciklama) {
              // Refresh ikonunu kaldır, mesaj ikonu ekle
              cell.innerHTML = '';
              const messageIcon = document.createElement('span');
              messageIcon.className = 'message-icon';
              messageIcon.textContent = '💬';
              messageIcon.style.cursor = 'pointer';
              messageIcon.title = 'Açıklama mesajlarını görüntüle';
              messageIcon.onclick = (e) => {
                e.stopPropagation();
                openRowAciklamaModal(rowData);
              };
              cell.appendChild(messageIcon);
            } else {
              refreshIcon.style.opacity = '0.6';
            }
          };
          cell.appendChild(refreshIcon);
        }
      }
    });
    
    console.log(`💬 İkon güncellendi: ${hatAdi} ${tarife} ${tarifeSaati} - ${hasAciklama ? 'Var' : 'Yok'}`);
  } catch (err) {
    console.error('İkon güncelleme hatası:', err);
  }
}

// ==================== BOŞ/DOLU POPUP FONKSİYONLARI ====================

// Saat karşılaştırma fonksiyonu: 00:00:00 - 05:30:00 arası değerleri ertesi gün olarak oku
function normalizeSaat(saat) {
  if (!saat) return '00:00:00';
  
  const [hour, minute, second] = saat.split(':').map(s => parseInt(s));
  
  // 00:00:00 - 05:29:59 arası ise, 24 saat ekle (ertesi gün)
  if (hour >= 0 && hour < 5) {
    return `${(hour + 24).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  }
  
  // 05:30:00 ise tam 05:30 kontrolü
  if (hour === 5 && minute < 30) {
    return `${(hour + 24).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  }
  
  return saat;
}

function closeBosDoluPopup() {
  if (bosDoluContainer) {
    bosDoluContainer.style.display = 'none';
  }
  if (bosDoluList) {
    bosDoluList.innerHTML = '';
  }
  // Clear countdown interval
  if (bosAracCountdownInterval) {
    clearInterval(bosAracCountdownInterval);
    bosAracCountdownInterval = null;
  }
}

function findAndShowBosAraclar() {
  console.log('🔍 Boş araç arama başladı');
  
  // Tablodaki tüm verileri oku
  const rows = tbody.querySelectorAll('tr');
  const headers = Array.from(theadRow.querySelectorAll('th')).map(th => th.textContent.trim());
  
  console.log('📋 Başlıklar:', headers);
  
  // Veriyi diziye dönüştür
  const allData = [];
  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length > 0) {
      const rowData = {};
      cells.forEach((cell, index) => {
        const header = headers[index];
        rowData[header] = cell.textContent.trim();
      });
      allData.push(rowData);
    }
  });
  
  console.log('📊 Toplam satır:', allData.length);
  
  // Hat_Adi ve Tarife'ye göre grupla
  const grouped = {};
  allData.forEach(row => {
    const hatAdi = row.Hat_Adi || row._Hat || '';
    const tarife = row.Tarife || '';
    const tarifeSaati = row.Tarife_Saati || '';
    const hareket = row.Hareket || '';
    
    if (!hatAdi || !tarife || !tarifeSaati || !hareket) return;
    
    const key = `${hatAdi}|${tarife}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push({
      hatAdi,
      tarife,
      tarifeSaati,
      hareket,
      fullRow: row
    });
  });
  
  console.log('📦 Gruplandırılmış veriler:', grouped);
  
  // Boş araçları bul
  const bosAraclar = [];
  
  Object.keys(grouped).forEach(key => {
    const [hatAdi, tarife] = key.split('|');
    const rows = grouped[key];
    
    // Dönüş satırlarını bul
    const donusRows = rows.filter(r => r.hareket === 'Dönüş');
    
    donusRows.forEach(donusRow => {
      const donusSaati = donusRow.tarifeSaati;
      const donusSaatiNormalized = normalizeSaat(donusSaati);
      
      // Bu dönüşten ÖNCE (daha küçük saatte) kalkış var mı?
      // Normalize edilmiş saatleri karşılaştır
      const oncekiKalkis = rows.find(r => {
        if (r.hareket !== 'Kalkış') return false;
        const kalkisSaatiNormalized = normalizeSaat(r.tarifeSaati);
        return kalkisSaatiNormalized < donusSaatiNormalized;
      });
      
      if (!oncekiKalkis) {
        // Önceki kalkış yok, bu araç boş
        console.log(`✅ Boş araç bulundu: ${hatAdi} - ${tarife} - Dönüş ${donusSaati} (Normalized: ${donusSaatiNormalized})`);
        bosAraclar.push(donusRow);
      } else {
        console.log(`❌ Dolu araç: ${hatAdi} - ${tarife} - Dönüş ${donusSaati} (${donusSaatiNormalized}), Önceki Kalkış: ${oncekiKalkis.tarifeSaati} (${normalizeSaat(oncekiKalkis.tarifeSaati)})`);
      }
    });
  });
  
  console.log('🚌 Toplam boş araç:', bosAraclar.length);
  
  // Popup'ı doldur ve göster
  showBosDoluPopup(bosAraclar);
}

// Global countdown interval tracker
let bosAracCountdownInterval = null;

function showBosDoluPopup(bosAraclar) {
  if (!bosDoluList || !bosDoluContainer) return;
  
  // Clear previous countdown
  if (bosAracCountdownInterval) {
    clearInterval(bosAracCountdownInterval);
    bosAracCountdownInterval = null;
  }
  
  bosDoluList.innerHTML = '';
  
  if (bosAraclar.length === 0) {
    bosDoluList.innerHTML = '<p style="text-align: center; color: #95a5a6; padding: 20px;">Boş araç bulunamadı.</p>';
  } else {
    bosAraclar.forEach((arac, index) => {
      const item = document.createElement('div');
      item.className = 'bos-arac-item';
      item.dataset.hatAdi = arac.hatAdi;
      item.dataset.donusSaati = arac.tarifeSaati;
      item.dataset.index = index;
      item.style.cssText = 'padding: 12px; margin-bottom: 8px; background: #f8f9fa; border-left: 4px solid #3498db; border-radius: 6px; transition: all 0.3s ease;';
      item.innerHTML = `
        <div style="font-size: 14px; color: #2c3e50; margin-bottom: 4px;">
          <strong>${index + 1}. ${arac.hatAdi}</strong> - ${arac.tarife}
        </div>
        <div style="font-size: 12px; color: #7f8c8d; display: flex; justify-content: space-between; align-items: center;">
          <span>Dönüş: ${arac.tarifeSaati}</span>
          <span class="countdown-display" style="font-weight: bold; color: #27ae60;"></span>
        </div>
      `;
      bosDoluList.appendChild(item);
    });
    
    // Start countdown updates
    updateBosDoluCountdowns();
    bosAracCountdownInterval = setInterval(updateBosDoluCountdowns, 1000);
  }
  
  bosDoluContainer.style.display = 'block';
}

async function updateBosDoluCountdowns() {
  const items = document.querySelectorAll('.bos-arac-item');
  if (items.length === 0) return;
  
  const now = new Date();
  const currentTime = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  
  items.forEach(async (item) => {
    const donusSaatiStr = item.dataset.donusSaati;
    const hatAdi = item.dataset.hatAdi;
    const countdownDisplay = item.querySelector('.countdown-display');
    
    if (!donusSaatiStr || !countdownDisplay) return;
    
    // Parse dönüş saati (HH:MM:SS)
    const timeParts = donusSaatiStr.split(':');
    if (timeParts.length < 2) return;
    
    const donusHours = parseInt(timeParts[0]) || 0;
    const donusMinutes = parseInt(timeParts[1]) || 0;
    const donusSeconds = parseInt(timeParts[2]) || 0;
    const donusTimeInSeconds = donusHours * 3600 + donusMinutes * 60 + donusSeconds;
    
    // Geri sayım hesapla
    let diffSeconds = donusTimeInSeconds - currentTime;
    
    // Eğer mevcut saat >= dönüş saati ise geri sayım yapma
    if (diffSeconds <= 0) {
      countdownDisplay.textContent = '';
      item.style.borderLeft = '4px solid #3498db';
      item.style.background = '#f8f9fa';
      return;
    }
    
    // Geri sayımı göster
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    const seconds = diffSeconds % 60;
    const countdownText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    countdownDisplay.textContent = `⏱️ ${countdownText}`;
    
    // Takip tablosundan uyarı süresini kontrol et
    const uyariTime = dangerTimesCache[hatAdi];
    
    if (uyariTime && uyariTime !== '00:00:00') {
      // Uyarı süresini saniyeye çevir (format: HH:MM:SS, bizim için 00:MM:SS)
      const uyariParts = uyariTime.split(':');
      const uyariMinutes = parseInt(uyariParts[1]) || 0;
      const uyariSeconds = parseInt(uyariParts[2]) || 0;
      const uyariTotalSeconds = uyariMinutes * 60 + uyariSeconds;
      
      // Eğer geri sayım uyarı süresinin altına düştüyse kırmızı yap
      if (diffSeconds <= uyariTotalSeconds) {
        item.style.borderLeft = '4px solid #e74c3c';
        item.style.background = '#ffebee';
        countdownDisplay.style.color = '#e74c3c';
      } else {
        item.style.borderLeft = '4px solid #3498db';
        item.style.background = '#f8f9fa';
        countdownDisplay.style.color = '#27ae60';
      }
    }
  });
}

// ==================== VTS AUTO-POPULATE FUNCTIONS ====================

const VTS_CONFIG = {
  BASE_URL: 'https://vts.kentkart.com.tr/api/026/v1',
  TOKEN: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrZW50a2FydC5jb20iLCJzdWIiOjM1MTIsImF1ZCI6IjMiLCJleHAiOjE3NjU5NTA2NTQsIm5iZiI6MTc2NTc3Nzg1NCwiaWF0IjoxNzY1Nzc3ODU0LCJqdGkiOiIiLCJhdXRob3JpemVkQ2xpZW50SWRzIjpbImIzQTRrIiwiYjNBNFZUUyJdLCJleHQiOm51bGwsImlzU3VwZXJBZG1pbiI6MCwiaXAiOiIxMC4wLjQwLjgiLCJsb2dpbm1ldGhvZCI6bnVsbCwiYWNjcm9sZSI6bnVsbCwicm9sZSI6WyJ2dHNhZG1pbiJdLCJuZXRzIjpbeyJOSUQiOiIwMjYiLCJEIjoiMSIsIk5BTUUiOiJBTlRBTFlBIn1dLCJsYW5nIjoidHIiLCJ1c2VybmFtZSI6InVndXIueWlsbWF6Iiwic2lkIjo1MTEwNTgyfQ.Z37r5Lssp5Lbed8zf4QY3-Eccj8F0Ydg9rnTHfd7386p3AROgOAaj1VgAT9n-Zhi3TWWtVyWAS2HbA_xVgCB07HmHJ-o_MxrBQslEXRk-vaEJaefF0XtcqQwuZtTShevMFO8TdtkObAZPbYhdZ4a-t3GeIKxSVO25u0rzlaOuAAU5qCF4qFz1Hteqs5rkesdgpHkVYzqrG448Mo7PwpsLhj-pM0Fv81jptVEnYurkWFCenlJtUOHDO89GlhBwLKAGOIuseybkqm1QunsHzUVduaNAyzxioZauv25qinUY_5WA-MVVn2l5K9adqj42RWMSoPmecXV-3b7C9ohRnaq5A',
  DURAK: {
    adi: 'Sarısu Depolama Merkezi-1',
    enlem: 36.830802,
    boylam: 30.596277
  }
};

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function analyzeCrossingsLinear(tracks, plaka) {
  const gecisler = [];
  let previousDistance = null;
  let minDistance = null;
  let minDistanceTime = null;
  let isApproaching = false;
  let isLeaving = false;
  let crossed500m = false;

  for (const point of tracks) {
    if (!point.lat || !point.lon || point.lat === 0 || point.lon === 0) continue;

    const distance = haversineDistance(
      VTS_CONFIG.DURAK.enlem,
      VTS_CONFIG.DURAK.boylam,
      point.lat,
      point.lon
    );

    if (previousDistance === null) {
      previousDistance = distance;
      if (distance < 200) {
        minDistance = distance;
        minDistanceTime = point.date_time;
      }
      continue;
    }

    const distanceChange = distance - previousDistance;

    if (distanceChange < -5) {
      if (!isApproaching) {
        isApproaching = true;
        isLeaving = false;
        crossed500m = false;
      }
      if (minDistance === null || distance < minDistance) {
        minDistance = distance;
        minDistanceTime = point.date_time;
      }
    } else if (distanceChange > 5) {
      if (!isLeaving && isApproaching && minDistance !== null) {
        isLeaving = true;
        isApproaching = false;
      }

      if (isLeaving && minDistance !== null && !crossed500m && distance > 500 && minDistance < 500) {
        crossed500m = true;
        const timeStr = minDistanceTime.substring(0, 14);
        const hours = parseInt(timeStr.substring(8, 10));
        const minutes = parseInt(timeStr.substring(10, 12));
        const seconds = parseInt(timeStr.substring(12, 14));

        gecisler.push({
          plaka: plaka,
          gecis_zamani: `${hours}:${minutes}:${seconds}`,
          min_mesafe: Math.round(minDistance * 10) / 10
        });

        minDistance = null;
        minDistanceTime = null;
        isLeaving = false;
      }
    }

    previousDistance = distance;
  }

  return gecisler;
}

async function fetchAndProcessVTSData() {
  console.log('🔍 VTS işlem başlatıldı (backend proxy üzerinden)...');

  try {
    const vehiclesUrl = `${VTS_CONFIG.BASE_URL}/latestdevicedata/get?fields=bus_id,car_no,display_route_code&sort=bus_id|asc&dc=${Date.now()}`;
    const vehiclesResponse = await fetch('/api/vts-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: vehiclesUrl, token: VTS_CONFIG.TOKEN })
    });

    const vehiclesData = await vehiclesResponse.json();
    let vehicles = vehiclesData?.data?.data || vehiclesData?.data || [];
    const sa65Vehicles = vehicles.filter(v => v.display_route_code === 'SA65');

    console.log(`🚌 ${sa65Vehicles.length} SA65 aracı bulundu`);

    if (sa65Vehicles.length === 0) {
      alert('❌ SA65 araçları bulunamadı');
      return;
    }

    const now = new Date();
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0);

    const formatTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}${hours}${minutes}${seconds}`;
    };

    const allCrossings = [];

    for (const vehicle of sa65Vehicles) {
      const historyUrl = `${VTS_CONFIG.BASE_URL}/historicdevicedata/get?fields=date_time,lat,lon,speed,car_no,bus_id&filters=&sort=date_time|asc&bus_list=${vehicle.bus_id}&start_date_time=${formatTime(startTime)}&end_date_time=${formatTime(now)}&dc=${Date.now()}`;

      const historyResponse = await fetch('/api/vts-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: historyUrl, token: VTS_CONFIG.TOKEN })
      });

      const historyData = await historyResponse.json();
      let tracks = historyData?.data?.data || historyData?.data || [];

      const crossings = analyzeCrossingsLinear(tracks, vehicle.car_no);
      allCrossings.push(...crossings);

      console.log(`  ${vehicle.car_no}: ${crossings.length} geçiş`);
    }

    console.log(`✅ Toplam ${allCrossings.length} geçiş tespit edildi`);

    if (allCrossings.length === 0) {
      alert('⚠️ Bugün henüz geçiş tespit edilmedi');
      return;
    }

    const response = await fetch('/api/vts-process-crossings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ crossings: allCrossings, hat: 'SA65' })
    });

    const result = await response.json();

    if (result.success && result.updated > 0) {
      const detailsMsg = result.details
        ? result.details.map(d => `${d.plaka} - ${d.tarife_saati} → ${d.gerceklesen}`).join('\n')
        : '';
      alert(`✅ VTS Otomatik Onay\n\n${result.updated} satır otomatik onaylandı\n\nDetaylar:\n${detailsMsg}`);
    } else {
      alert('⚠️ Eşleşen tarife saati bulunamadı');
    }

  } catch (error) {
    console.error('❌ VTS işlem hatası:', error);
    alert('❌ VTS bağlantı hatası: ' + error.message);
  }
}
