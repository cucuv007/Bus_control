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
const closeTimerBtn = document.getElementById('closeTimerBtn');
const dynamicTrackingCheckbox = document.getElementById('dynamicTrackingCheckbox');
const reopenTimerIcon = document.getElementById('reopenTimerIcon');

// Scroll buttons
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
const scrollToTimerRowBtn = document.getElementById('scrollToTimerRowBtn');

// Approval modal elements
const approvalModal = document.getElementById('approvalModal');
const closeApprovalModal = document.getElementById('closeApprovalModal');
const approvalHat = document.getElementById('approvalHat');
const approvalTarife = document.getElementById('approvalTarife');
const approvalTime = document.getElementById('approvalTime');
const cancelApprovalBtn = document.getElementById('cancelApprovalBtn');
const confirmApprovalBtn = document.getElementById('confirmApprovalBtn');

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

// State variables
let selectedFiles = [];
let currentTable = null;
let currentHareket = null;
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

// ==================== EVENT LISTENERS ====================
uploadBtn.addEventListener('click', openUploadModal);
refreshBtn.addEventListener('click', handleRefresh);
approveBtn.addEventListener('click', handleApproval);
closeModal.addEventListener('click', closeUploadModal);
cancelBtn.addEventListener('click', closeUploadModal);

// Approval modal listeners
closeApprovalModal.addEventListener('click', closeApprovalConfirmation);
cancelApprovalBtn.addEventListener('click', closeApprovalConfirmation);
confirmApprovalBtn.addEventListener('click', handleRowApproval);

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

listFilesBtn.addEventListener('click', handleListFiles);
confirmUploadBtn.addEventListener('click', handleUpload);
tableSelect.addEventListener('change', handleTableSelect);
hareketSelect.addEventListener('change', handleHareketChange);

selectAllDepolama.addEventListener('change', handleSelectAllDepolama);
applyDepolamaFilter.addEventListener('click', handleApplyDepolamaFilter);

selectAllHats.addEventListener('change', handleSelectAllHats);
applyHatSelection.addEventListener('click', handleApplyHatSelection);

// Dinamik takip checkbox'ı değiştiğinde
dynamicTrackingCheckbox.addEventListener('change', (e) => {
  if (e.target.checked && currentTimerRow) {
    // Checkbox seçildiğinde, mevcut timer satırını hemen bul ve scroll et
    scrollToTimerRow(currentTimerRow);
  } else if (!e.target.checked) {
    // Checkbox kaldırıldığında vurguyu temizle
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(r => r.style.backgroundColor = '');
  }
});

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
  
  // Veriyi sakla
  pendingApprovalData = {
    tableName,
    hatAdi: rowData.Hat_Adi,
    calismaZamani: rowData.Çalışma_Zamanı || '',
    tarife: rowData.Tarife,
    tarifeSaati: rowData.Tarife_Saati
  };
  
  // Modal içeriğini doldur
  approvalHat.textContent = rowData.Hat_Adi;
  approvalTarife.textContent = rowData.Tarife;
  approvalTime.textContent = rowData.Tarife_Saati;
  
  // Modal'ı aç
  approvalModal.style.display = 'flex';
}

function closeApprovalConfirmation() {
  approvalModal.style.display = 'none';
  pendingApprovalData = null;
}

async function handleRowApproval() {
  if (!pendingApprovalData) {
    return;
  }
  
  confirmApprovalBtn.disabled = true;
  confirmApprovalBtn.textContent = '⏳ Onaylanıyor...';
  
  try {
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
    
    // Modal'ı kapat
    closeApprovalConfirmation();
    
    // Tabloyu yenile
    const currentTableValue = tableSelect.value;
    const currentHareketValue = movementSelect.value;
    
    if (currentTableValue) {
      await handleTableSelect({ target: { value: currentTableValue } });
    }
    
    alert(`✅ Onaylandı!\nSaat: ${result.approvalTime}`);
    
  } catch (err) {
    console.error('Onaylama hatası:', err);
    alert(`❌ Hata: ${err.message}`);
  } finally {
    confirmApprovalBtn.disabled = false;
    confirmApprovalBtn.textContent = '✅ Onayla';
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
    const tables = result.tables || [];
    
    if (tables.length === 0) {
      statusEl.innerHTML = '<span class="small">Henüz tablo yok. Yükle butonuna tıklayarak dosya yükleyiniz.</span>';
      tableSelection.style.display = 'none';
      theadRow.innerHTML = "<th>Boş</th>";
      tbody.innerHTML = '<tr><td class="small">Kayıt yok.</td></tr>';
      return;
    }
    
    // Tabloları dropdown'a ekle
    tableSelect.innerHTML = '<option value="">-- Tablo Seçin --</option>';
    tables.forEach(table => {
      const option = document.createElement('option');
      option.value = table;
      option.textContent = table;
      tableSelect.appendChild(option);
    });
    
    // Mevcut hatları kaydet ve checkbox listesini oluştur
    availableHats = tables;
    renderHatCheckboxes();
    
    tableSelection.style.display = 'block';
    hareketSelect.value = '';
    
    // Depolama checkbox listesini oluştur
    renderDepolamaCheckboxes();
    
    statusEl.textContent = `${tables.length} tablo bulundu. Lütfen bir tablo seçiniz.`;
    theadRow.innerHTML = "<th>Tablo Seçiniz</th>";
    tbody.innerHTML = '<tr><td class="small">Tablo seçiniz</td></tr>';
    
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
    
    // Tablo başlıklarını oluştur
    const firstRow = data[0];
    const allKeys = Object.keys(firstRow);
    
    theadRow.innerHTML = '';
    allKeys.forEach(k => {
      const th = document.createElement('th');
      th.textContent = k;
      theadRow.appendChild(th);
    });
    
    // Tablo verilerini oluştur
    tbody.innerHTML = '';
    data.forEach(row => {
      const tr = document.createElement('tr');
      allKeys.forEach(k => {
        const td = document.createElement('td');
        const value = row[k];
        td.textContent = value !== null && value !== undefined ? value : '';
        tr.appendChild(td);
      });
      
      // Satıra tıklanınca onay popup'ı aç
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        openApprovalConfirmation(row, currentTable);
      });
      
      // Eğer "Onaylanan" sütunu varsa renk kodla
      if (row.Onaylanan && row.Tarife_Saati) {
        const approvedColor = getApprovalColor(row.Onaylanan, row.Tarife_Saati);
        tr.style.backgroundColor = approvedColor;
      }
      
      tbody.appendChild(tr);
    });
    
    let filterMsg = currentHareket ? ` (${currentHareket})` : '';
    statusEl.innerHTML = `Başarılı: ${data.length} kayıt alındı${filterMsg} <span id="reopenTimerIcon" class="reopen-timer-icon" title="Timer'ı Tekrar Aç">⏱️</span>`;
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
  }, 1000);
  
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
      
      // Timer bilgilerini güncelle (slide'daki mevcut otobüs)
      timerHatAdi.textContent = currentBus.hatAdi || '-';
      timerPlaka.textContent = currentBus.plaka || '-';
      timerTarife.textContent = currentBus.tarife || '-';
      timerHareket.textContent = currentBus.hareket || '-';
      
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

function closeTimer() {
  console.log('🗑️ closeTimer() çağrıldı');
  
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
  
  // TÜM interval'ları ve timeout'ları agresif bir şekilde temizle
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log('  ✔️ timerInterval temizlendi');
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
  }, 2000); // 2 saniyede bir değişir
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
  
  const highlightColor = remainingSeconds <= 120 ? '#ffcccc' : '#d4edda'; // Kırmızı veya yeşil
  const rows = tbody.querySelectorAll('tr');
  
  // Her otobüsü tabloda bul ve vurgula
  busList.forEach(bus => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');
      
      let matchesHatAdi = false;
      let matchesTarife = false;
      let matchesHareket = false;
      let matchesTarifeSaati = false;
      
      cells.forEach(cell => {
        const text = cell.textContent.trim();
        // Hat Adı kontrolü (tableName veya hatAdi)
        if (text === bus.tableName || text === bus.hatAdi) matchesHatAdi = true;
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
        
        // İlk eşleşen satıra scroll et
        if (highlightedRows.length === 1) {
          row.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          });
        }
        break;
      }
    }
  });
}

function clearAllHighlights() {
  highlightedRows.forEach(row => {
    if (row && row.style) row.style.backgroundColor = '';
  });
  // highlightedRows = []; // Array temizlenmedi - toggle için gerekli
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
    checkbox.checked = isChecked;
  });
  
  // Eğer tümü seç kaldırıldıysa, seçili olanları da temizle
  if (!isChecked) {
    selectedDepolamaTables = [];
  }
}

function updateSelectAllDepolama() {
  const checkboxes = document.querySelectorAll('.depolama-checkbox');
  const checkedCount = document.querySelectorAll('.depolama-checkbox:checked').length;
  
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
    // Depolama filtresi yok, tüm tabloları göster
    filteredHats = [];
    statusEl.textContent = 'Depolama filtresi kaldırıldı. Tüm tablolar gösteriliyor.';
    await loadFilteredTables();
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
      selectAllHats.checked = false;
      
      closeTimer();
      return;
    }
    
    // Tabloları dropdown'a ekle
    tableSelect.innerHTML = '<option value="">-- Tablo Seçin --</option>';
    tables.forEach(table => {
      const option = document.createElement('option');
      option.value = table;
      option.textContent = table;
      tableSelect.appendChild(option);
    });
    
    statusEl.textContent = `${tables.length} tablo listeleniyor (${filteredHats.length > 0 ? 'Filtrelenmiş' : 'Tümü'}).`;
    theadRow.innerHTML = "<th>Tablo Seçiniz</th>";
    tbody.innerHTML = '<tr><td class="small">Tablo seçiniz</td></tr>';
    
    // Mevcut hatları kaydet ve checkbox listesini oluştur
    availableHats = tables;
    console.log('🎯 Hat Seçimi için oluşturulan hatlar:', availableHats);
    renderHatCheckboxes();
    
  } catch (err) {
    console.error('Load filtered tables error:', err);
    statusEl.innerHTML = `<span class="error">Hata: ${err.message}</span>`;
  }
}

// ==================== HAT SELECTION FUNCTIONS ====================
function renderHatCheckboxes() {
  if (availableHats.length === 0) {
    hatSelectionContainer.style.display = 'none';
    return;
  }
  
  hatSelectionContainer.style.display = 'block';
  hatCheckboxList.innerHTML = '';
  
  // Seçimleri sıfırla
  selectedHats = [];
  selectAllHats.checked = false;
  selectAllHats.indeterminate = false;
  
  availableHats.forEach(hatName => {
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.marginBottom = '5px';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = hatName;
    checkbox.className = 'hat-checkbox';
    checkbox.style.marginRight = '8px';
    
    checkbox.addEventListener('change', updateSelectAllHats);
    
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(hatName));
    hatCheckboxList.appendChild(label);
  });
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
      console.log(`📡 API çağrısı yapılıyor: /api/get-table-data → tableName: "${tableName}"`);
      
      const res = await fetch('/api/get-table-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName: tableName,
          hareket: currentHareket
        })
      });
      
      console.log(`📡 API yanıt kodu: ${res.status} (${tableName})`);
      
      if (!res.ok) {
        console.error(`❌ API hatası (${tableName}): Status ${res.status}`);
        continue; // Bu hatta hata var, diğerine geç
      }
      
      const result = await res.json();
      console.log(`✅ API başarılı (${tableName}):`, result);
      
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
    
    // Tarife_Saati'ne göre sırala (küçükten büyüğe)
    allData.sort((a, b) => {
      const timeA = a.Tarife_Saati || '';
      const timeB = b.Tarife_Saati || '';
      return timeA.localeCompare(timeB);
    });
    
    console.log(`✅ Toplam ${allData.length} kayıt birleştirildi ve sıralandı`);
    
    // Tablo başlıklarını oluştur (_Hat sütununu ilk sıraya koy)
    const firstRow = allData[0];
    const allKeys = Object.keys(firstRow);
    
    // _Hat'ı başa al
    const hatIndex = allKeys.indexOf('_Hat');
    if (hatIndex > -1) {
      allKeys.splice(hatIndex, 1);
      allKeys.unshift('_Hat');
    }
    
    theadRow.innerHTML = '';
    allKeys.forEach(k => {
      const th = document.createElement('th');
      th.textContent = k === '_Hat' ? 'Hat' : k;
      theadRow.appendChild(th);
    });
    
    // Tablo verilerini oluştur
    tbody.innerHTML = '';
    allData.forEach(row => {
      const tr = document.createElement('tr');
      allKeys.forEach(k => {
        const td = document.createElement('td');
        const value = row[k];
        td.textContent = value !== null && value !== undefined ? value : '';
        tr.appendChild(td);
      });
      
      // Satıra tıklanınca onay popup'ı aç (orijinal tablo adını kullan)
      const originalTableName = row._Hat || selectedHats[0];
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => {
        openApprovalConfirmation(row, originalTableName);
      });
      
      // Eğer "Onaylanan" sütunu varsa renk kodla
      if (row.Onaylanan && row.Tarife_Saati) {
        const approvedColor = getApprovalColor(row.Onaylanan, row.Tarife_Saati);
        tr.style.backgroundColor = approvedColor;
      }
      
      tbody.appendChild(tr);
    });
    
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
  
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  lastBusTime = null;
  
  timerInterval = setInterval(() => {
    updateMultipleHatsTimer(hatList, hareket);
  }, 1000);
  
  updateMultipleHatsTimer(hatList, hareket);
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
    const closestBuses = allBusesList.filter(bus => bus.remainingSeconds === minRemaining);
    
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
      
      // Timer bilgilerini güncelle
      timerHatAdi.textContent = currentBus.hatAdi || '-';
      timerPlaka.textContent = currentBus.plaka || '-';
      timerTarife.textContent = currentBus.tarife || '-';
      timerHareket.textContent = currentBus.hareket || '-';
      
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
  // Dinamik takip checkbox'ı seçili değilse çık
  if (!dynamicTrackingCheckbox.checked) {
    return;
  }
  
  // Önce tüm vurguları temizle
  clearAllHighlights();
  
  try {
    const rows = tbody.querySelectorAll('tr');
    
    // Timer'daki otobüsü tabloda bul
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const cells = row.querySelectorAll('td');
      
      // Tarife_Saati ve Hareket sütunlarını kontrol et
      let matchesTarife = false;
      let matchesHareket = false;
      
      cells.forEach(cell => {
        const text = cell.textContent.trim();
        if (text === busData.tarifeSaati || text === busData.tarifeSaati.substring(0, 5)) {
          matchesTarife = true;
        }
        if (text === busData.hareket) {
          matchesHareket = true;
        }
      });
      
      // Eşleşen satır bulundu (tek otobüs - sarı highlight)
      if (matchesTarife && matchesHareket) {
        // Sarı vurgu (tek otobüs için)
        row.style.backgroundColor = '#fff3cd';
        highlightedRows.push(row);
        
        // Satırı görünür alana kaydır
        row.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        
        break;
      }
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

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  handleRefresh();
});
