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
        showFilters: window.innerWidth > 768,
        isCategoryExpanded: true,
        tierKey: 'Tier', domainKey: 'Domain', categoryKey: 'Category',

        async init() {
            try {
                const res = await fetch('data.yaml');
                const text = await res.text();
                const hierarchy = jsyaml.load(text);

                // Flatten hierarchy into rows for the table
                const rows = [];
                hierarchy.forEach(tier => {
                    tier.domains.forEach(domain => {
                        domain.categories.forEach(cat => {
                            const row = {
                                'Tier': tier.name,
                                'Domain': domain.name,
                                'Category': cat.name,
                                'id': cat.id
                            };

                            // Map service keys (aws, azure, etc) to display names (AWS, Azure, etc)
                            // We use the keys from the config or hardcode the mapping since we are migrating
                            const providerMap = {
                                'aws': 'AWS',
                                'azure': 'Azure',
                                'gcp': 'Google Cloud',
                                'oracle': 'Oracle Cloud (OCI)',
                                'alibaba': 'Alibaba Cloud',
                                'tencent': 'Tencent Cloud',
                                'ibm': 'IBM Cloud'
                            };

                            Object.entries(cat.services).forEach(([key, value]) => {
                                if (providerMap[key]) {
                                    row[providerMap[key]] = value;
                                }
                            });

                            rows.push(row);
                        });
                    });
                });

                this.rawData = rows.map((row, index) => ({ ...row, id: index }));

                // Set default keys if not found (though our construction ensures they exist)
                this.tierKey = 'Tier';
                this.domainKey = 'Domain';
                this.categoryKey = 'Category';

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
        },

        highlight(text) {
            if (!this.search || !text) return text;
            const regex = new RegExp(`(${this.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            return text.toString().replace(regex, '<mark class="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-200 px-0.5 rounded-sm ring-1 ring-indigo-200 dark:ring-indigo-700/50">$1</mark>');
        },

        openDocSearch(provider, service) {
            if (!service || service === '-') return;

            // Map provider names to search URLs
            const searchUrls = {
                'AWS': 'https://docs.aws.amazon.com/search/doc-search.html?searchQuery=',
                'Azure': 'https://learn.microsoft.com/en-us/search/?terms=',
                'Google Cloud': 'https://cloud.google.com/search?q=',
                'Oracle Cloud (OCI)': 'https://docs.oracle.com/en/search.html?q=',
                'Alibaba Cloud': 'https://www.alibabacloud.com/help/en/search?k=',
                'Tencent Cloud': 'https://www.tencentcloud.com/search?q=',
                'IBM Cloud': 'https://cloud.ibm.com/docs/search?q='
            };

            const baseUrl = searchUrls[provider];
            if (baseUrl) {
                window.open(`${baseUrl}${encodeURIComponent(service)}`, '_blank');
            }
        }
    }
}
