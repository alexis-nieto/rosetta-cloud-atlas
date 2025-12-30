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
        modalOpen: false,
        selectedService: { name: '', provider: '', url: null },
        providers: {},

        async init() {
            try {
                const res = await fetch('data.yaml');
                const text = await res.text();
                const hierarchy = jsyaml.load(text);

                this.providers = hierarchy.config.providers;
                const data = hierarchy.data;

                // Flatten hierarchy into rows for the table
                const rows = [];
                data.forEach(tier => {
                    tier.domains.forEach(domain => {
                        domain.categories.forEach(cat => {
                            const row = {
                                'Tier': tier.name,
                                'Domain': domain.name,
                                'Category': cat.name,
                                'id': cat.id
                            };

                            Object.entries(cat.services).forEach(([key, value]) => {
                                if (this.providers[key]) {
                                    const providerName = this.providers[key].name;
                                    // Handle both string and object formats
                                    if (typeof value === 'object') {
                                        row[providerName] = value.name;
                                        row[providerName + '_url'] = value.url;
                                    } else {
                                        row[providerName] = value;
                                    }
                                }
                            });

                            rows.push(row);
                        });
                    });
                });

                this.rawData = rows.map((row, index) => ({ ...row, id: index }));

                // Set default keys
                this.tierKey = 'Tier';
                this.domainKey = 'Domain';
                this.categoryKey = 'Category';

                this.loading = false;
            } catch (e) { console.error(e); }
        },

        get providerColumns() {
            if (this.rawData.length === 0) return [];
            const meta = [this.tierKey, this.domainKey, this.categoryKey, 'id'];
            // Filter out _url columns from the display columns
            return Object.keys(this.rawData[0])
                .filter(k => !meta.includes(k) && !k.endsWith('_url'))
                .sort((a, b) => a.localeCompare(b));
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

        openServiceModal(provider, row) {
            const serviceName = row[provider];
            if (!serviceName || serviceName === '-') return;

            // Find the provider key based on the display name
            // This is a bit reverse lookup, but since we flattened it using display names, we need to map back or store keys.
            // A better way would be to store the provider key in the selectedService.
            const providerKey = Object.keys(this.providers).find(key => this.providers[key].name === provider);

            this.selectedService = {
                name: serviceName,
                provider: provider, // Display Name
                providerKey: providerKey, // Config Key
                url: row[provider + '_url'] || null
            };
            this.modalOpen = true;
        },

        searchWeb(engine) {
            const query = encodeURIComponent(`${this.selectedService.name} ${this.selectedService.provider}`);
            const engines = {
                google: `https://www.google.com/search?q=${query}`,
                ddg: `https://duckduckgo.com/?q=${query}`,
                bing: `https://www.bing.com/search?q=${query}`,
                brave: `https://search.brave.com/search?q=${query}`,
                qwant: `https://www.qwant.com/?q=${query}`
            };
            window.open(engines[engine], '_blank');
        },

        searchNativeDocs() {
            const key = this.selectedService.providerKey;
            const service = this.selectedService.name;

            if (key && this.providers[key] && this.providers[key].searchUrl) {
                window.open(`${this.providers[key].searchUrl}${encodeURIComponent(service)}`, '_blank');
            }
        }
    }
}
