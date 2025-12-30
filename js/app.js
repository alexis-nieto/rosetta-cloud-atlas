function cloudMatrix() {
    return {
        loading: true,
        rawData: [],
        search: '',
        selectedTier: '',
        selectedDomain: '',
        hiddenColumns: [],
        showAllTiers: false,
        showAllDomains: false,
        tierKey: 'Tier', domainKey: 'Domain', categoryKey: 'Category',

        async init() {
            try {
                const res = await fetch('data.csv');
                const text = await res.text();
                const result = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: h => h.trim() });
                if (result.data.length > 0) {
                    const keys = Object.keys(result.data[0]);
                    this.tierKey = keys.find(k => k.match(/tier/i)) || 'Tier';
                    this.domainKey = keys.find(k => k.match(/domain/i)) || 'Domain';
                    this.categoryKey = keys.find(k => k.match(/category/i)) || 'Category';
                }
                this.rawData = result.data.map((row, index) => ({ ...row, id: index }));
                this.loading = false;
            } catch (e) { console.error(e); }
        },

        get providerColumns() {
            if (this.rawData.length === 0) return [];
            const meta = [this.tierKey, this.domainKey, this.categoryKey, 'id'];
            return Object.keys(this.rawData[0]).filter(k => !meta.includes(k)).sort((a, b) => a.localeCompare(b));
        },

        get uniqueTiers() { return [...new Set(this.rawData.map(r => r[this.tierKey]).filter(Boolean))].sort(); },

        get uniqueDomains() {
            let data = this.rawData;
            if (this.selectedTier) data = data.filter(r => r[this.tierKey] === this.selectedTier);
            return [...new Set(data.map(r => r[this.domainKey]).filter(Boolean))].sort();
        },

        get visibleColumnCount() { return this.providerColumns.filter(c => !this.hiddenColumns.includes(c)).length; },

        get filteredRows() {
            return this.rawData.filter(row => {
                const s = this.search.toLowerCase();
                const matchesSearch = Object.values(row).some(v => String(v).toLowerCase().includes(s));
                const matchesTier = !this.selectedTier || row[this.tierKey] === this.selectedTier;
                const matchesDomain = !this.selectedDomain || row[this.domainKey] === this.selectedDomain;
                return matchesSearch && matchesTier && matchesDomain;
            });
        },

        toggleColumn(col) {
            this.hiddenColumns.includes(col) ? this.hiddenColumns = this.hiddenColumns.filter(c => c !== col) : this.hiddenColumns.push(col);
        },

        resetAll() {
            this.search = ''; this.selectedTier = ''; this.selectedDomain = '';
            this.hiddenColumns = [];
        }
    }
}
