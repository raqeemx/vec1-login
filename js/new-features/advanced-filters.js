/**
 * ========================================
 * 🔍 Advanced Filters - البحث والفلترة المتقدمة
 * ========================================
 * 
 * نظام بحث وفلترة متقدم للمركبات
 * 
 * ⚠️ لا يعدل أي JavaScript موجود - إضافة فقط!
 */

// ===== Namespace to avoid conflicts =====
window.NFFilters = (function() {
    'use strict';
    
    // ===== Default Options =====
    const DEFAULT_OPTIONS = {
        searchFields: ['customerName', 'make', 'model', 'vin', 'contractNo', 'plateNo'],
        debounceDelay: 300,
        saveToUrl: true,
        onFilter: null
    };
    
    // ===== Filter Manager Class =====
    class FilterManager {
        constructor(options = {}) {
            this.options = { ...DEFAULT_OPTIONS, ...options };
            this.filters = {};
            this.searchQuery = '';
            this.sortBy = 'createdAt';
            this.sortDir = 'desc';
            this.debounceTimer = null;
            
            // Load filters from URL
            if (this.options.saveToUrl) {
                this.loadFromUrl();
            }
        }
        
        // Set search query
        setSearch(query) {
            this.searchQuery = query.toLowerCase().trim();
            this.debouncedApply();
        }
        
        // Set a filter
        setFilter(key, value) {
            if (value === '' || value === null || value === undefined) {
                delete this.filters[key];
            } else {
                this.filters[key] = value;
            }
            this.debouncedApply();
        }
        
        // Set sort
        setSort(field, direction = 'desc') {
            this.sortBy = field;
            this.sortDir = direction;
            this.apply();
        }
        
        // Reset all filters
        reset() {
            this.filters = {};
            this.searchQuery = '';
            this.sortBy = 'createdAt';
            this.sortDir = 'desc';
            
            // Clear UI elements
            const searchInput = document.getElementById('nf-search-input');
            if (searchInput) searchInput.value = '';
            
            document.querySelectorAll('.nf-filter-select').forEach(select => {
                select.value = '';
            });
            
            this.apply();
        }
        
        // Debounced apply
        debouncedApply() {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.apply();
            }, this.options.debounceDelay);
        }
        
        // Apply filters
        apply() {
            if (this.options.saveToUrl) {
                this.saveToUrl();
            }
            
            if (this.options.onFilter) {
                this.options.onFilter(this.getFilteredData());
            }
            
            // Update active filters display
            this.updateActiveFiltersDisplay();
        }
        
        // Filter data
        getFilteredData(data = []) {
            let filtered = [...data];
            
            // Apply search
            if (this.searchQuery) {
                filtered = filtered.filter(item => {
                    return this.options.searchFields.some(field => {
                        const value = item[field];
                        return value && value.toString().toLowerCase().includes(this.searchQuery);
                    });
                });
            }
            
            // Apply filters
            Object.keys(this.filters).forEach(key => {
                const filterValue = this.filters[key];
                filtered = filtered.filter(item => {
                    return item[key] && item[key].toString() === filterValue.toString();
                });
            });
            
            // Apply sort
            filtered.sort((a, b) => {
                let aVal = a[this.sortBy];
                let bVal = b[this.sortBy];
                
                // Handle dates
                if (aVal && aVal.toDate) aVal = aVal.toDate();
                if (bVal && bVal.toDate) bVal = bVal.toDate();
                
                // Handle numbers
                if (typeof aVal === 'string' && !isNaN(aVal)) aVal = parseFloat(aVal);
                if (typeof bVal === 'string' && !isNaN(bVal)) bVal = parseFloat(bVal);
                
                let comparison = 0;
                if (aVal > bVal) comparison = 1;
                if (aVal < bVal) comparison = -1;
                
                return this.sortDir === 'desc' ? -comparison : comparison;
            });
            
            return filtered;
        }
        
        // Save to URL
        saveToUrl() {
            const params = new URLSearchParams();
            
            if (this.searchQuery) {
                params.set('q', this.searchQuery);
            }
            
            Object.keys(this.filters).forEach(key => {
                params.set(key, this.filters[key]);
            });
            
            if (this.sortBy !== 'createdAt') {
                params.set('sort', this.sortBy);
            }
            
            if (this.sortDir !== 'desc') {
                params.set('dir', this.sortDir);
            }
            
            const newUrl = params.toString() 
                ? `${window.location.pathname}?${params.toString()}`
                : window.location.pathname;
            
            history.replaceState(null, '', newUrl);
        }
        
        // Load from URL
        loadFromUrl() {
            const params = new URLSearchParams(window.location.search);
            
            if (params.has('q')) {
                this.searchQuery = params.get('q');
            }
            
            if (params.has('sort')) {
                this.sortBy = params.get('sort');
            }
            
            if (params.has('dir')) {
                this.sortDir = params.get('dir');
            }
            
            // Load all other params as filters
            params.forEach((value, key) => {
                if (!['q', 'sort', 'dir'].includes(key)) {
                    this.filters[key] = value;
                }
            });
        }
        
        // Update active filters display
        updateActiveFiltersDisplay() {
            const container = document.getElementById('nf-active-filters');
            if (!container) return;
            
            const tags = [];
            
            if (this.searchQuery) {
                tags.push({
                    label: `بحث: ${this.searchQuery}`,
                    key: 'search',
                    value: this.searchQuery
                });
            }
            
            Object.keys(this.filters).forEach(key => {
                tags.push({
                    label: `${this.getFilterLabel(key)}: ${this.filters[key]}`,
                    key: key,
                    value: this.filters[key]
                });
            });
            
            if (tags.length === 0) {
                container.innerHTML = '';
                container.style.display = 'none';
                return;
            }
            
            container.style.display = 'flex';
            container.innerHTML = tags.map(tag => `
                <span class="nf-filter-tag">
                    ${tag.label}
                    <button class="nf-filter-tag-remove" onclick="NFFilters.instance.removeFilter('${tag.key}')">
                        <i class="fas fa-times"></i>
                    </button>
                </span>
            `).join('');
        }
        
        // Remove single filter
        removeFilter(key) {
            if (key === 'search') {
                this.searchQuery = '';
                const searchInput = document.getElementById('nf-search-input');
                if (searchInput) searchInput.value = '';
            } else {
                delete this.filters[key];
                const select = document.querySelector(`.nf-filter-select[data-filter="${key}"]`);
                if (select) select.value = '';
            }
            this.apply();
        }
        
        // Get filter label
        getFilterLabel(key) {
            const labels = {
                make: 'الصانع',
                model: 'الموديل',
                year: 'السنة',
                overallRating: 'التقييم',
                fuelType: 'نوع الوقود',
                color: 'اللون'
            };
            return labels[key] || key;
        }
        
        // Get active filters count
        getActiveFiltersCount() {
            let count = Object.keys(this.filters).length;
            if (this.searchQuery) count++;
            return count;
        }
    }
    
    // ===== Create Filters UI =====
    function createFiltersUI(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;
        
        const manager = new FilterManager(options);
        NFFilters.instance = manager;
        
        container.innerHTML = `
            <div class="nf-filters-section">
                <!-- Search Box -->
                <div class="nf-search-box">
                    <i class="fas fa-search nf-search-icon"></i>
                    <input type="text" 
                           id="nf-search-input" 
                           class="nf-search-input" 
                           placeholder="ابحث عن مركبة... (الاسم، الصانع، الموديل، VIN)"
                           value="${manager.searchQuery}">
                    <button class="nf-search-clear" onclick="NFFilters.instance.setSearch('')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Filters Grid -->
                <div class="nf-filters-grid">
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">الصانع</label>
                        <select class="nf-filter-select" data-filter="make" id="nf-filter-make">
                            <option value="">الكل</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">الموديل</label>
                        <select class="nf-filter-select" data-filter="model" id="nf-filter-model">
                            <option value="">الكل</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">السنة</label>
                        <select class="nf-filter-select" data-filter="year" id="nf-filter-year">
                            <option value="">الكل</option>
                        </select>
                    </div>
                    
                    <div class="nf-filter-group">
                        <label class="nf-filter-label">التقييم</label>
                        <select class="nf-filter-select" data-filter="overallRating" id="nf-filter-rating">
                            <option value="">الكل</option>
                            <option value="excellent">ممتاز</option>
                            <option value="good">جيد</option>
                            <option value="fair">مقبول</option>
                            <option value="poor">ضعيف</option>
                        </select>
                    </div>
                </div>
                
                <!-- Filter Actions -->
                <div class="nf-filter-actions">
                    <div class="nf-results-count">
                        <i class="fas fa-car"></i>
                        <span>عرض <strong id="nf-results-count">0</strong> مركبة</span>
                    </div>
                    
                    <div class="nf-sort-options">
                        <span class="nf-sort-label">ترتيب حسب:</span>
                        <select class="nf-sort-select" id="nf-sort-select">
                            <option value="createdAt-desc">الأحدث أولاً</option>
                            <option value="createdAt-asc">الأقدم أولاً</option>
                            <option value="marketValue-desc">الأعلى قيمة</option>
                            <option value="marketValue-asc">الأقل قيمة</option>
                            <option value="year-desc">الأحدث موديل</option>
                            <option value="year-asc">الأقدم موديل</option>
                        </select>
                    </div>
                    
                    <button class="nf-btn-filter nf-btn-reset" onclick="NFFilters.instance.reset()">
                        <i class="fas fa-redo"></i>
                        إعادة تعيين
                    </button>
                </div>
                
                <!-- Active Filters -->
                <div class="nf-active-filters" id="nf-active-filters" style="display: none;"></div>
            </div>
        `;
        
        // Setup event listeners
        const searchInput = document.getElementById('nf-search-input');
        searchInput.addEventListener('input', (e) => {
            manager.setSearch(e.target.value);
        });
        
        document.querySelectorAll('.nf-filter-select').forEach(select => {
            const filterKey = select.dataset.filter;
            if (manager.filters[filterKey]) {
                select.value = manager.filters[filterKey];
            }
            select.addEventListener('change', (e) => {
                manager.setFilter(filterKey, e.target.value);
            });
        });
        
        const sortSelect = document.getElementById('nf-sort-select');
        sortSelect.value = `${manager.sortBy}-${manager.sortDir}`;
        sortSelect.addEventListener('change', (e) => {
            const [field, dir] = e.target.value.split('-');
            manager.setSort(field, dir);
        });
        
        return manager;
    }
    
    // ===== Populate Filter Options =====
    function populateFilterOptions(data) {
        const makes = [...new Set(data.map(v => v.make).filter(Boolean))].sort();
        const models = [...new Set(data.map(v => v.model).filter(Boolean))].sort();
        const years = [...new Set(data.map(v => v.year).filter(Boolean))].sort((a, b) => b - a);
        
        const makeSelect = document.getElementById('nf-filter-make');
        const modelSelect = document.getElementById('nf-filter-model');
        const yearSelect = document.getElementById('nf-filter-year');
        
        if (makeSelect) {
            makes.forEach(make => {
                const option = document.createElement('option');
                option.value = make;
                option.textContent = make;
                makeSelect.appendChild(option);
            });
        }
        
        if (modelSelect) {
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
        }
        
        if (yearSelect) {
            years.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
            });
        }
    }
    
    // ===== Update Results Count =====
    function updateResultsCount(count) {
        const el = document.getElementById('nf-results-count');
        if (el) el.textContent = count;
    }
    
    console.log('🔍 NFFilters initialized');
    
    // ===== Public API =====
    return {
        FilterManager: FilterManager,
        createFiltersUI: createFiltersUI,
        populateFilterOptions: populateFilterOptions,
        updateResultsCount: updateResultsCount,
        instance: null
    };
    
})();
