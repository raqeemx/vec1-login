/**
 * ========================================
 * 🚀 Enhanced Features - الميزات المتقدمة
 * ========================================
 * 
 * يحتوي على:
 * 1. نظام تسجيل الموقع الجغرافي GPS
 * 2. نظام ألبوم الصور المحسّن
 * 3. قائمة القائمين بالتقييم
 * 4. إصلاحات تصدير Excel
 * 5. إدارة المستودعات المحسّنة
 */

// ===== GPS Location System =====
window.NFGeolocation = (function() {
    'use strict';
    
    let currentPosition = null;
    let watchId = null;
    
    // Get current GPS location
    function getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('الجهاز لا يدعم GPS'));
                return;
            }
            
            const options = {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            };
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    currentPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };
                    resolve(currentPosition);
                },
                (error) => {
                    let message = 'خطأ في تحديد الموقع';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            message = 'تم رفض إذن الوصول للموقع';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            message = 'معلومات الموقع غير متاحة';
                            break;
                        case error.TIMEOUT:
                            message = 'انتهى وقت طلب الموقع';
                            break;
                    }
                    reject(new Error(message));
                },
                options
            );
        });
    }
    
    // Start watching location
    function startWatching(callback) {
        if (!navigator.geolocation) return null;
        
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                currentPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };
                if (callback) callback(currentPosition);
            },
            (error) => console.warn('Watch position error:', error),
            { enableHighAccuracy: true }
        );
        
        return watchId;
    }
    
    // Stop watching
    function stopWatching() {
        if (watchId && navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
    }
    
    // Generate Google Maps URL
    function generateMapsUrl(lat, lng) {
        if (!lat || !lng) return '';
        return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    
    // Generate Maps link HTML
    function generateMapsLink(lat, lng, text = 'فتح الخريطة') {
        const url = generateMapsUrl(lat, lng);
        if (!url) return '-';
        return `<a href="${url}" target="_blank" class="gps-link" style="color: #667eea; text-decoration: none;">
            <i class="fas fa-map-marker-alt"></i> ${text}
        </a>`;
    }
    
    // Create location input UI
    function createLocationInput(currentLat = '', currentLng = '') {
        return `
            <div class="gps-input-container">
                <div class="form-row">
                    <div class="form-group">
                        <label><i class="fas fa-map-marker-alt" style="margin-left: 5px;"></i>خط العرض (Latitude)</label>
                        <input type="text" class="form-input" id="gpsLatitude" value="${currentLat}" placeholder="مثال: 24.7136" readonly>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-map-marker-alt" style="margin-left: 5px;"></i>خط الطول (Longitude)</label>
                        <input type="text" class="form-input" id="gpsLongitude" value="${currentLng}" placeholder="مثال: 46.6753" readonly>
                    </div>
                </div>
                <div class="gps-actions" style="display: flex; gap: 10px; margin-top: 10px;">
                    <button type="button" class="btn btn-info btn-sm" onclick="NFGeolocation.captureLocation()">
                        <i class="fas fa-crosshairs"></i> التقاط الموقع تلقائياً
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" onclick="NFGeolocation.clearLocation()">
                        <i class="fas fa-times"></i> مسح
                    </button>
                    <span id="gpsStatus" class="gps-status" style="display: none;"></span>
                </div>
                ${currentLat && currentLng ? `
                    <div style="margin-top: 10px;">
                        <a href="${generateMapsUrl(currentLat, currentLng)}" target="_blank" class="btn btn-success btn-sm">
                            <i class="fas fa-external-link-alt"></i> فتح في الخريطة
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Capture current location and update inputs
    async function captureLocation() {
        const statusEl = document.getElementById('gpsStatus');
        const latInput = document.getElementById('gpsLatitude');
        const lngInput = document.getElementById('gpsLongitude');
        
        if (statusEl) {
            statusEl.style.display = 'inline';
            statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تحديد الموقع...';
            statusEl.style.color = '#f59e0b';
        }
        
        try {
            const position = await getCurrentLocation();
            
            if (latInput) latInput.value = position.latitude.toFixed(6);
            if (lngInput) lngInput.value = position.longitude.toFixed(6);
            
            if (statusEl) {
                statusEl.innerHTML = '<i class="fas fa-check-circle"></i> تم تحديد الموقع بنجاح';
                statusEl.style.color = '#10b981';
                setTimeout(() => { statusEl.style.display = 'none'; }, 3000);
            }
            
            if (window.showNotification) {
                showNotification('تم التقاط الموقع الجغرافي بنجاح', 'success');
            }
            
            return position;
        } catch (error) {
            if (statusEl) {
                statusEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
                statusEl.style.color = '#ef4444';
            }
            
            if (window.showNotification) {
                showNotification(error.message, 'error');
            }
            
            return null;
        }
    }
    
    // Clear location inputs
    function clearLocation() {
        const latInput = document.getElementById('gpsLatitude');
        const lngInput = document.getElementById('gpsLongitude');
        
        if (latInput) latInput.value = '';
        if (lngInput) lngInput.value = '';
    }
    
    console.log('📍 NFGeolocation initialized');
    
    return {
        getCurrentLocation,
        startWatching,
        stopWatching,
        generateMapsUrl,
        generateMapsLink,
        createLocationInput,
        captureLocation,
        clearLocation,
        get currentPosition() { return currentPosition; }
    };
})();


// ===== Enhanced Photo Album System =====
window.NFPhotoAlbum = (function() {
    'use strict';
    
    // Upload images to Firebase Storage
    async function uploadImages(vehicleId, files) {
        if (!window.storage || !window.currentUser) {
            console.warn('Firebase Storage not available');
            return [];
        }
        
        const uploadedUrls = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = `${Date.now()}_${i}_${file.name}`;
            const path = `users/${currentUser.uid}/vehicles/${vehicleId}/${fileName}`;
            
            try {
                const ref = storage.ref(path);
                const snapshot = await ref.put(file);
                const url = await snapshot.ref.getDownloadURL();
                uploadedUrls.push(url);
            } catch (error) {
                console.error('Upload error:', error);
            }
        }
        
        return uploadedUrls;
    }
    
    // Delete image from Firebase Storage
    async function deleteImage(imageUrl) {
        if (!window.storage) return false;
        
        try {
            const ref = storage.refFromURL(imageUrl);
            await ref.delete();
            return true;
        } catch (error) {
            console.error('Delete image error:', error);
            return false;
        }
    }
    
    // Generate album page URL
    function generateAlbumUrl(vehicleId) {
        const baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
        return `${baseUrl}/album.html?id=${vehicleId}`;
    }
    
    // Create album page HTML
    function createAlbumPageHTML(vehicle) {
        if (!vehicle || !vehicle.images || vehicle.images.length === 0) {
            return `
                <div class="album-empty">
                    <i class="fas fa-images"></i>
                    <h3>لا توجد صور</h3>
                    <p>لم يتم رفع أي صور لهذه المركبة</p>
                </div>
            `;
        }
        
        return `
            <div class="album-container">
                <div class="album-header">
                    <h2><i class="fas fa-images"></i> ألبوم صور المركبة</h2>
                    <p>${vehicle.make} ${vehicle.model} ${vehicle.year} - ${vehicle.contractNo}</p>
                </div>
                <div class="album-grid">
                    ${vehicle.images.map((img, index) => `
                        <div class="album-item" onclick="NFPhotoAlbum.openLightbox('${img}')">
                            <img src="${img}" alt="صورة ${index + 1}" loading="lazy">
                            <div class="album-item-overlay">
                                <i class="fas fa-search-plus"></i>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="album-info">
                    <p><strong>عدد الصور:</strong> ${vehicle.images.length}</p>
                    <p><strong>تاريخ التحديث:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
                </div>
            </div>
        `;
    }
    
    // Open image in lightbox
    function openLightbox(imageUrl) {
        if (window.openLightbox) {
            window.openLightbox(imageUrl);
        } else {
            window.open(imageUrl, '_blank');
        }
    }
    
    console.log('📷 NFPhotoAlbum initialized');
    
    return {
        uploadImages,
        deleteImage,
        generateAlbumUrl,
        createAlbumPageHTML,
        openLightbox
    };
})();


// ===== Evaluators Management System =====
window.NFEvaluators = (function() {
    'use strict';
    
    const DEFAULT_EVALUATORS = [
        { id: 'eval1', name: 'محمد أحمد', employeeId: 'EMP001', phone: '0501234567' },
        { id: 'eval2', name: 'أحمد علي', employeeId: 'EMP002', phone: '0509876543' },
        { id: 'eval3', name: 'خالد محمد', employeeId: 'EMP003', phone: '0551122334' }
    ];
    
    // Get evaluators list
    async function getEvaluators() {
        if (!window.currentUser || !window.db) return DEFAULT_EVALUATORS;
        
        try {
            const snapshot = await db.collection('users')
                .doc(currentUser.uid)
                .collection('evaluators')
                .orderBy('name')
                .get();
            
            if (snapshot.empty) {
                // Initialize with defaults
                for (const evaluator of DEFAULT_EVALUATORS) {
                    await db.collection('users')
                        .doc(currentUser.uid)
                        .collection('evaluators')
                        .doc(evaluator.id)
                        .set(evaluator);
                }
                return DEFAULT_EVALUATORS;
            }
            
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error fetching evaluators:', error);
            return DEFAULT_EVALUATORS;
        }
    }
    
    // Add new evaluator
    async function addEvaluator(evaluator) {
        if (!window.currentUser || !window.db) return null;
        
        try {
            const docRef = await db.collection('users')
                .doc(currentUser.uid)
                .collection('evaluators')
                .add({
                    ...evaluator,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            return docRef.id;
        } catch (error) {
            console.error('Error adding evaluator:', error);
            return null;
        }
    }
    
    // Delete evaluator
    async function deleteEvaluator(evaluatorId) {
        if (!window.currentUser || !window.db) return false;
        
        try {
            await db.collection('users')
                .doc(currentUser.uid)
                .collection('evaluators')
                .doc(evaluatorId)
                .delete();
            
            return true;
        } catch (error) {
            console.error('Error deleting evaluator:', error);
            return false;
        }
    }
    
    // Create evaluator selector HTML
    function createEvaluatorSelector(selectedId = '') {
        return `
            <select class="form-input" id="evaluatorSelect">
                <option value="">-- اختر القائم بالتقييم --</option>
                <option value="new">➕ إضافة قائم جديد...</option>
            </select>
        `;
    }
    
    // Populate evaluator selector
    async function populateEvaluatorSelector(selectId = 'evaluatorSelect', selectedValue = '') {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const evaluators = await getEvaluators();
        
        // Keep the first two options (placeholder and "add new")
        select.innerHTML = `
            <option value="">-- اختر القائم بالتقييم --</option>
            ${evaluators.map(e => `
                <option value="${e.id}" data-name="${e.name}" data-employee-id="${e.employeeId}" ${selectedValue === e.id ? 'selected' : ''}>
                    ${e.name} (${e.employeeId})
                </option>
            `).join('')}
            <option value="new">➕ إضافة قائم جديد...</option>
        `;
        
        // Add change handler
        select.addEventListener('change', function() {
            if (this.value === 'new') {
                showAddEvaluatorModal();
                this.value = '';
            }
        });
    }
    
    // Show add evaluator modal
    function showAddEvaluatorModal() {
        const modalHTML = `
            <div class="modal show" id="evaluatorModal" onclick="if(event.target===this)this.remove()">
                <div class="modal-content" style="max-width: 450px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> إضافة قائم بالتقييم</h3>
                        <button class="btn-close" onclick="document.getElementById('evaluatorModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>الاسم الكامل *</label>
                            <input type="text" class="form-input" id="evalName" required placeholder="مثال: محمد أحمد">
                        </div>
                        <div class="form-group">
                            <label>الرقم الوظيفي *</label>
                            <input type="text" class="form-input" id="evalEmployeeId" required placeholder="مثال: EMP001">
                        </div>
                        <div class="form-group">
                            <label>رقم الجوال</label>
                            <input type="tel" class="form-input" id="evalPhone" placeholder="مثال: 0501234567">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="document.getElementById('evaluatorModal').remove()">إلغاء</button>
                        <button class="btn btn-primary" onclick="NFEvaluators.saveEvaluator()">
                            <i class="fas fa-save"></i> حفظ
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Save new evaluator
    async function saveEvaluator() {
        const name = document.getElementById('evalName')?.value.trim();
        const employeeId = document.getElementById('evalEmployeeId')?.value.trim();
        const phone = document.getElementById('evalPhone')?.value.trim();
        
        if (!name || !employeeId) {
            if (window.showNotification) {
                showNotification('يرجى ملء الحقول المطلوبة', 'warning');
            }
            return;
        }
        
        const result = await addEvaluator({ name, employeeId, phone });
        
        if (result) {
            if (window.showNotification) {
                showNotification('تم إضافة القائم بالتقييم بنجاح', 'success');
            }
            document.getElementById('evaluatorModal')?.remove();
            await populateEvaluatorSelector('evaluatorSelect');
        } else {
            if (window.showNotification) {
                showNotification('حدث خطأ أثناء الإضافة', 'error');
            }
        }
    }
    
    console.log('👤 NFEvaluators initialized');
    
    return {
        getEvaluators,
        addEvaluator,
        deleteEvaluator,
        createEvaluatorSelector,
        populateEvaluatorSelector,
        showAddEvaluatorModal,
        saveEvaluator
    };
})();


// ===== Enhanced Warehouse Management =====
window.NFWarehouseEnhanced = (function() {
    'use strict';
    
    // Add warehouse with manager field
    async function addWarehouse(warehouse) {
        if (!window.currentUser || !window.db) return null;
        
        try {
            const docRef = await db.collection('users')
                .doc(currentUser.uid)
                .collection('warehouses')
                .add({
                    name: warehouse.name,
                    location: warehouse.location,
                    capacity: warehouse.capacity || 50,
                    manager: warehouse.manager || '',
                    managerPhone: warehouse.managerPhone || '',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            
            if (window.NFActivity) {
                NFActivity.log('WAREHOUSE_TRANSFER', { 
                    warehouse: warehouse.name, 
                    action: 'إضافة مستودع',
                    manager: warehouse.manager
                });
            }
            
            return docRef.id;
        } catch (error) {
            console.error('Error adding warehouse:', error);
            return null;
        }
    }
    
    // Delete warehouse
    async function deleteWarehouse(warehouseId) {
        if (!window.currentUser || !window.db) return false;
        
        try {
            // First check if any vehicles are in this warehouse
            const vehiclesSnapshot = await db.collection('users')
                .doc(currentUser.uid)
                .collection('vehicles')
                .where('warehouse', '==', warehouseId)
                .get();
            
            if (!vehiclesSnapshot.empty) {
                if (window.showNotification) {
                    showNotification(`لا يمكن حذف المستودع - يوجد ${vehiclesSnapshot.size} مركبة مرتبطة به`, 'warning');
                }
                return false;
            }
            
            await db.collection('users')
                .doc(currentUser.uid)
                .collection('warehouses')
                .doc(warehouseId)
                .delete();
            
            if (window.NFActivity) {
                NFActivity.log('WAREHOUSE_TRANSFER', { 
                    warehouseId, 
                    action: 'حذف مستودع'
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error deleting warehouse:', error);
            return false;
        }
    }
    
    // Show enhanced add warehouse modal
    function showAddModal() {
        const modalHTML = `
            <div class="modal show" id="warehouseModal" onclick="if(event.target===this)this.remove()">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3><i class="fas fa-warehouse"></i> إضافة مستودع جديد</h3>
                        <button class="btn-close" onclick="document.getElementById('warehouseModal').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>اسم المستودع *</label>
                            <input type="text" class="form-input" id="whName" required placeholder="مثال: المستودع الشمالي">
                        </div>
                        <div class="form-group">
                            <label>الموقع *</label>
                            <input type="text" class="form-input" id="whLocation" required placeholder="مثال: الرياض">
                        </div>
                        <div class="form-group">
                            <label>السعة (عدد المركبات)</label>
                            <input type="number" class="form-input" id="whCapacity" value="50" min="1">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-user-tie" style="margin-left: 5px;"></i>المسؤول عن المستودع</label>
                            <input type="text" class="form-input" id="whManager" placeholder="اسم المسؤول">
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-phone" style="margin-left: 5px;"></i>هاتف المسؤول</label>
                            <input type="tel" class="form-input" id="whManagerPhone" placeholder="مثال: 0501234567">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="document.getElementById('warehouseModal').remove()">إلغاء</button>
                        <button class="btn btn-primary" onclick="NFWarehouseEnhanced.saveWarehouse()">
                            <i class="fas fa-save"></i> حفظ
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Save warehouse from modal
    async function saveWarehouse() {
        const name = document.getElementById('whName')?.value.trim();
        const location = document.getElementById('whLocation')?.value.trim();
        const capacity = parseInt(document.getElementById('whCapacity')?.value) || 50;
        const manager = document.getElementById('whManager')?.value.trim();
        const managerPhone = document.getElementById('whManagerPhone')?.value.trim();
        
        if (!name || !location) {
            if (window.showNotification) {
                showNotification('يرجى ملء جميع الحقول المطلوبة', 'warning');
            }
            return;
        }
        
        const result = await addWarehouse({ name, location, capacity, manager, managerPhone });
        
        if (result) {
            if (window.showNotification) {
                showNotification('تم إضافة المستودع بنجاح', 'success');
            }
            document.getElementById('warehouseModal')?.remove();
            
            // Refresh warehouse page
            if (typeof loadWarehousePage === 'function') {
                loadWarehousePage();
            }
        } else {
            if (window.showNotification) {
                showNotification('حدث خطأ أثناء الإضافة', 'error');
            }
        }
    }
    
    // Confirm delete warehouse
    function confirmDeleteWarehouse(warehouseId, warehouseName) {
        const modalHTML = `
            <div class="modal show" id="deleteWarehouseModal" onclick="if(event.target===this)this.remove()">
                <div class="confirm-dialog">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                    <h4>تأكيد حذف المستودع</h4>
                    <p>هل أنت متأكد من حذف مستودع "${warehouseName}"؟</p>
                    <p style="color: #64748b; font-size: 0.9rem;">لا يمكن حذف المستودع إذا كانت هناك مركبات مرتبطة به.</p>
                    <div class="confirm-dialog-buttons">
                        <button class="btn btn-outline" onclick="document.getElementById('deleteWarehouseModal').remove()">
                            <i class="fas fa-times"></i> إلغاء
                        </button>
                        <button class="btn btn-danger" onclick="NFWarehouseEnhanced.executeDelete('${warehouseId}')">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Execute delete
    async function executeDelete(warehouseId) {
        document.getElementById('deleteWarehouseModal')?.remove();
        
        const result = await deleteWarehouse(warehouseId);
        
        if (result) {
            if (window.showNotification) {
                showNotification('تم حذف المستودع بنجاح', 'success');
            }
            
            // Refresh warehouse page
            if (typeof loadWarehousePage === 'function') {
                loadWarehousePage();
            }
        }
    }
    
    // Create enhanced warehouse page HTML
    function createWarehousePageHTML(warehouses, vehicleStats) {
        const totalVehicles = Object.values(vehicleStats).reduce((a, b) => a + b, 0);
        
        return `
            <div class="nf-warehouse-page">
                <div class="nf-warehouse-header">
                    <h2><i class="fas fa-warehouse"></i> إدارة المستودعات</h2>
                    <button class="btn btn-primary" onclick="NFWarehouseEnhanced.showAddModal()">
                        <i class="fas fa-plus"></i> إضافة مستودع
                    </button>
                </div>
                
                <div class="nf-warehouse-stats">
                    <div class="nf-wh-stat-card">
                        <i class="fas fa-warehouse"></i>
                        <div class="nf-wh-stat-value">${warehouses.length}</div>
                        <div class="nf-wh-stat-label">المستودعات</div>
                    </div>
                    <div class="nf-wh-stat-card">
                        <i class="fas fa-car"></i>
                        <div class="nf-wh-stat-value">${totalVehicles}</div>
                        <div class="nf-wh-stat-label">المركبات</div>
                    </div>
                    <div class="nf-wh-stat-card">
                        <i class="fas fa-question-circle"></i>
                        <div class="nf-wh-stat-value">${vehicleStats.unassigned || 0}</div>
                        <div class="nf-wh-stat-label">غير مخصصة</div>
                    </div>
                </div>
                
                <div class="nf-warehouse-grid">
                    ${warehouses.map(wh => {
                        const count = vehicleStats[wh.id] || 0;
                        const percentage = wh.capacity > 0 ? Math.round((count / wh.capacity) * 100) : 0;
                        const statusClass = percentage >= 90 ? 'full' : percentage >= 70 ? 'warning' : 'ok';
                        
                        return `
                            <div class="nf-warehouse-card">
                                <div class="nf-wh-card-header">
                                    <h3>${wh.name}</h3>
                                    <span class="nf-wh-location">
                                        <i class="fas fa-map-marker-alt"></i> ${wh.location}
                                    </span>
                                </div>
                                
                                ${wh.manager ? `
                                    <div class="nf-wh-manager" style="padding: 10px 15px; background: #f8fafc; border-radius: 8px; margin-bottom: 15px;">
                                        <div style="display: flex; align-items: center; gap: 8px; color: #64748b;">
                                            <i class="fas fa-user-tie"></i>
                                            <span><strong>المسؤول:</strong> ${wh.manager}</span>
                                        </div>
                                        ${wh.managerPhone ? `
                                            <div style="display: flex; align-items: center; gap: 8px; color: #64748b; margin-top: 5px;">
                                                <i class="fas fa-phone"></i>
                                                <a href="tel:${wh.managerPhone}" style="color: var(--primary);">${wh.managerPhone}</a>
                                            </div>
                                        ` : ''}
                                    </div>
                                ` : ''}
                                
                                <div class="nf-wh-card-body">
                                    <div class="nf-wh-capacity">
                                        <div class="nf-wh-capacity-bar">
                                            <div class="nf-wh-capacity-fill ${statusClass}" style="width: ${percentage}%"></div>
                                        </div>
                                        <div class="nf-wh-capacity-text">
                                            <span>${count} / ${wh.capacity}</span>
                                            <span>${percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="nf-wh-card-footer" style="display: flex; gap: 8px;">
                                    <button class="btn btn-outline btn-sm" onclick="filterByWarehouse('${wh.id}')">
                                        <i class="fas fa-car"></i> عرض المركبات
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="NFWarehouseEnhanced.confirmDeleteWarehouse('${wh.id}', '${wh.name}')" style="background: #fee2e2; color: #991b1b;">
                                        <i class="fas fa-trash"></i> حذف
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    console.log('🏭 NFWarehouseEnhanced initialized');
    
    return {
        addWarehouse,
        deleteWarehouse,
        showAddModal,
        saveWarehouse,
        confirmDeleteWarehouse,
        executeDelete,
        createWarehousePageHTML
    };
})();


// ===== Enhanced Excel Export =====
window.NFExcelExport = (function() {
    'use strict';
    
    // Export with GPS links and photo album links
    function exportAllToExcel(vehicles) {
        if (!vehicles || vehicles.length === 0) {
            if (window.showNotification) {
                showNotification('لا توجد مركبات للتصدير', 'warning');
            }
            return;
        }
        
        if (typeof XLSX === 'undefined') {
            if (window.showNotification) {
                showNotification('مكتبة Excel غير متاحة', 'error');
            }
            return;
        }
        
        try {
            const wb = XLSX.utils.book_new();
            
            // Summary sheet
            const totalValue = vehicles.reduce((sum, v) => sum + (parseFloat(v.marketValue) || 0), 0);
            const summaryData = [
                ['تقرير المركبات المستردة'],
                [`تاريخ التقرير: ${new Date().toLocaleString('ar-SA')}`],
                [`إجمالي المركبات: ${vehicles.length}`],
                [`إجمالي القيمة: ${totalValue.toLocaleString()} ر.س`],
                [''],
                ['💡 ملاحظات مهمة:'],
                ['- عمود "Open Map" يحتوي على روابط لفتح موقع المركبة في خرائط Google'],
                ['- عمود "Photos Album" يحتوي على روابط لعرض صور المركبة'],
                ['- اضغط على الروابط لفتحها في المتصفح']
            ];
            
            const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(wb, summarySheet, 'ملخص');
            
            // Headers for main sheet
            const headers = [
                'رقم العقد', 'اسم العميل', 'الصانع', 'الموديل', 'السنة', 
                'VIN', 'رقم اللوحة', 'عداد المسافات', 'اللون', 'نوع الوقود',
                'القيمة السوقية', 'التقييم', 'التوصية', 'حالة التشغيل', 
                'المستودع', 'تاريخ الاسترداد', 'موقع الاسترداد',
                'القائم بالتقييم', 'ملاحظات',
                'Open Map', 'Photos Album'
            ];
            
            // Helper functions
            function getFuelText(type) {
                const types = { 'petrol': 'بنزين', 'diesel': 'ديزل', 'hybrid': 'هجين', 'electric': 'كهربائي' };
                return types[type] || '-';
            }
            
            function getRatingText(rating) {
                const ratings = { 'excellent': 'ممتاز', 'good': 'جيد', 'fair': 'مقبول', 'poor': 'ضعيف' };
                return ratings[rating] || '-';
            }
            
            function getRecommendationText(rec) {
                const recs = { 'sell_as_is': 'البيع كما هي', 'repair_sell': 'إصلاح ثم بيع', 'auction': 'مزاد', 'scrap': 'تخريد' };
                return recs[rec] || '-';
            }
            
            function getOperationStatusText(status) {
                const statuses = { 'working': 'تعمل', 'not_working': 'لا تعمل', 'needs_maintenance': 'تحتاج صيانة' };
                return statuses[status] || '-';
            }
            
            // Data rows
            const data = vehicles.map(v => {
                // Generate Google Maps URL
                let mapsUrl = '';
                if (v.gpsLatitude && v.gpsLongitude) {
                    mapsUrl = `https://www.google.com/maps?q=${v.gpsLatitude},${v.gpsLongitude}`;
                }
                
                // Generate album URL
                const albumUrl = v.images && v.images.length > 0 ? 
                    (v.images[0] || '') : '';
                
                return [
                    v.contractNo || '',
                    v.customerName || '',
                    v.make || '',
                    v.model || '',
                    v.year || '',
                    v.vin || '',
                    v.plateNo || '',
                    v.odometer || '',
                    v.color || '',
                    getFuelText(v.fuelType),
                    v.marketValue || '',
                    getRatingText(v.overallRating),
                    getRecommendationText(v.recommendation),
                    getOperationStatusText(v.operationStatus),
                    v.warehouseName || '',
                    v.recoveryDate || '',
                    v.recoveryLocation || '',
                    v.evaluatorName || '',
                    v.notes || '',
                    mapsUrl,
                    albumUrl
                ];
            });
            
            const vehiclesSheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
            
            // Set column widths
            vehiclesSheet['!cols'] = [
                { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 8 },
                { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
                { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 18 },
                { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 25 },
                { wch: 50 }, { wch: 50 }
            ];
            
            // Add hyperlinks for Maps and Photos columns
            vehicles.forEach((v, index) => {
                const rowNum = index + 2; // +2 because row 1 is headers
                
                // Maps link - Column T (index 19)
                if (v.gpsLatitude && v.gpsLongitude) {
                    const mapsUrl = `https://www.google.com/maps?q=${v.gpsLatitude},${v.gpsLongitude}`;
                    const cellRef = XLSX.utils.encode_cell({ r: rowNum, c: 19 });
                    if (vehiclesSheet[cellRef]) {
                        vehiclesSheet[cellRef].l = { Target: mapsUrl, Tooltip: 'انقر لفتح الموقع في الخرائط' };
                    }
                }
                
                // Photo link - Column U (index 20)
                if (v.images && v.images.length > 0 && v.images[0]) {
                    const cellRef = XLSX.utils.encode_cell({ r: rowNum, c: 20 });
                    if (vehiclesSheet[cellRef]) {
                        vehiclesSheet[cellRef].l = { Target: v.images[0], Tooltip: 'انقر لعرض الصور' };
                    }
                }
            });
            
            XLSX.utils.book_append_sheet(wb, vehiclesSheet, 'المركبات');
            
            // Log activity
            if (window.NFActivity) {
                NFActivity.log('EXPORT_EXCEL', { count: vehicles.length });
            }
            
            const date = new Date().toISOString().split('T')[0];
            XLSX.writeFile(wb, `Vehicles_Export_${date}.xlsx`);
            
            if (window.showNotification) {
                showNotification(`تم تصدير ${vehicles.length} مركبة بنجاح! 📊`, 'success');
            }
            
            return true;
        } catch (error) {
            console.error('Export Error:', error);
            if (window.showNotification) {
                showNotification('حدث خطأ أثناء التصدير: ' + error.message, 'error');
            }
            return false;
        }
    }
    
    console.log('📊 NFExcelExport initialized');
    
    return {
        exportAllToExcel
    };
})();


// ===== Initialize Enhanced Features =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Enhanced Features loaded successfully');
});
