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
const timerHatAdi = document.getElementById('timerHatAdi');
const timerPlaka = document.getElementById('timerPlaka');
const timerTarife = document.getElementById('timerTarife');
const timerHareket = document.getElementById('timerHareket');
const closeTimerBtn = document.getElementById('closeTimerBtn');

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

// Table & Movement selection
const tableSelection = document.getElementById('tableSelection');
const tableSelect = document.getElementById('tableSelect');
const hareketSelect = document.getElementById('hareketSelect');

// State variables
let selectedFiles = [];
let currentTable = null;
let currentHareket = null;
let isLoading = false;
let allFiles = [];
let uploadMethod = null;
let timerInterval = null;
let lastBusTime = null;

// ==================== EVENT LISTENERS ====================
uploadBtn.addEventListener('click', openUploadModal);
refreshBtn.addEventListener('click', handleRefresh);
approveBtn.addEventListener('click', handleApproval);
closeModal.addEventListener('click', closeUploadModal);
cancelBtn.addEventListener('click', closeUploadModal);
closeTimerBtn.addEventListener('click', closeTimer);

methodAutoBtn.addEventListener('click', () => selectMethod('auto'));
methodManualBtn.addEventListener('click', () => selectMethod('manual'));

listFilesBtn.addEventListener('click', handleListFiles);
confirmUploadBtn.addEventListener('click', handleUpload);
tableSelect.addEventListener('change', handleTableSelect);
hareketSelect.addEventListener('change', handleHareketChange);

manualFileInput.addEventListener('change', handleManualFileSelect);

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
  
  step1.style.display = 'block';
  step2Auto.style.display = 'none';
  step2Manual.style.display = 'none';
  step3.style.display = 'none';
  confirmUploadBtn.style.display = 'none';
  
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
  step1.style.display = 'none';
  
  if (method === 'auto') {
    step2Auto.style.display = 'block';
  } else {
    step2Manual.style.display = 'block';
  }
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
  selectedFiles = [];
  selectAllCheckbox.checked = false;
  
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
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedFiles.push({
          id: file.id,
          name: file.name
        });
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
  
  selectedFiles = [];
  
  checkboxes.forEach(checkbox => {
    checkbox.checked = isChecked;
    if (isChecked) {
      selectedFiles.push({
        id: checkbox.value,
        name: checkbox.dataset.name
      });
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

async function handleUpload() {
  if (selectedFiles.length === 0) {
    uploadStatus.innerHTML = '❌ Hata: Dosya seçiniz';
    uploadStatus.style.display = 'block';
    return;
  }
  
  confirmUploadBtn.disabled = true;
  uploadStatus.innerHTML = '⏳ Dosyalar yükleniyor...';
  uploadStatus.style.display = 'block';
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const file of selectedFiles) {
    try {
      console.log(`\n📤 UPLOADING: ${file.name}`);
      uploadStatus.innerHTML = `⏳ ${file.name} yükleniyor...`;
      
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
      
      console.log('📨 Sending to process-excel API...');
      console.log('File name:', file.name);
      console.log('Data length:', fileData.length);
      
      // Excel'i işle
      const processRes = await fetch('/api/process-excel', {
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
      uploadStatus.innerHTML = `✅ ${file.name} başarıyla yüklendi!`;
      successCount++;
      
    } catch (err) {
      console.error(`❌ ${file.name} yüklenemedi:`, err);
      console.error('Error details:', err.message, err.stack);
      errors.push(`${file.name}: ${err.message}`);
      errorCount++;
      uploadStatus.innerHTML = `❌ ${file.name}: ${err.message}`;
    }
  }
  
  let message = `✅ ${successCount} dosya yüklendi`;
  if (errorCount > 0) {
    message += `<br>❌ ${errorCount} dosya hata:<br>`;
    message += errors.map(e => `• ${e}`).join('<br>');
  }
  
  uploadStatus.innerHTML = message;
  confirmUploadBtn.disabled = false;
  
  // Başarılı yüklemeler varsa tabloları yenile
  if (successCount > 0) {
    setTimeout(() => {
      closeUploadModal();
      handleRefresh();
    }, 3000);
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
    
    tableSelection.style.display = 'block';
    hareketSelect.value = '';
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
  
  if (currentTable) {
    loadTableData();
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
      tbody.appendChild(tr);
    });
    
    let filterMsg = currentHareket ? ` (${currentHareket})` : '';
    statusEl.textContent = `Başarılı: ${data.length} kayıt alındı${filterMsg}`;
    meta.textContent = `Tablo: ${currentTable} | Toplam sütun: ${allKeys.length}`;
    
    // Timer'ı başlat
    startTimer(currentTable, currentHareket);
    
  } catch (err) {
    console.error('Get table data error:', err);
    statusEl.innerHTML = `<span class="error">Hata: ${err.message}</span>`;
    closeTimer();
  }
}

// ==================== TIMER FUNCTIONS ====================
function startTimer(tableName, hareket) {
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
    
    if (result.success && result.nextBus) {
      const { plaka, tarife, tarifeSaati, hareket, remainingSeconds } = result.nextBus;
      
      if (lastBusTime !== tarifeSaati) {
        lastBusTime = tarifeSaati;
        timerHatAdi.textContent = currentTable || '-';
        timerPlaka.textContent = plaka || '-';
        timerTarife.textContent = tarife || '-';
        timerHareket.textContent = hareket || '-';
        timerContainer.style.display = 'block';
      }
      
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      
      if (remainingSeconds <= 0) {
        lastBusTime = null;
      }
    } else {
      closeTimer();
    }
  } catch (err) {
    console.error('Timer update error:', err);
  }
}

function closeTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerContainer.style.display = 'none';
  lastBusTime = null;
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
