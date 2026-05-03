
function getISOWeek(dateString) {
    const [d, m, y] = dateString.split('/').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function renderWeeklyReturns() {
    const tbody = document.getElementById('weeklyReturnBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 1. Filter: Bewaar per week alleen de LAATSTE bekende dag
    const weeksMap = {};
    brokerData.forEach(entry => {
        const w = getISOWeek(entry.date);
        const y = entry.date.split('/')[2];
        const key = `${y}-W${w}`;
        weeksMap[key] = entry; 
    });

    const sortedWeekKeys = Object.keys(weeksMap).sort().reverse();

    // 2. Loop door de weken en bereken rendement t.o.v. vorige week
    sortedWeekKeys.forEach((key, index) => {
        if (index === sortedWeekKeys.length - 1) return; // Geen vergelijking mogelijk voor oudste week

        const current = weeksMap[key];
        const previous = weeksMap[sortedWeekKeys[index + 1]];
        const weekNum = key.split('-W')[1];

        const row = document.createElement('tr');
        let html = `<td style="font-weight: 800; color: var(--text-muted); font-size: 0.75rem;">W${weekNum}</td>`;

        const columns = [
            { c: current.degiro + current.bolero + current.saxo, p: previous.degiro + previous.bolero + previous.saxo },
            { c: current.degiro, p: previous.degiro },
            { c: current.bolero, p: previous.bolero },
            { c: current.saxo, p: previous.saxo }
        ];

        columns.forEach(m => {
    const diff = m.c - m.p;
    const perc = m.p !== 0 ? ((diff / m.p) * 100).toFixed(1) : 0;
    const isPos = diff >= 0;

    // De '+' en '-' zijn hier verwijderd. De kleur bepaalt de status.
    html += `
        <td>
            <span class="return-euro blur-target" style="color: ${isPos ? 'var(--success)' : 'var(--danger)'};">
                ${Math.round(Math.abs(diff))}
            </span>
            <span class="return-perc" style="color: var(--text-muted);">
                ${Math.abs(perc)}%
            </span>
        </td>`;
});

        row.innerHTML = html;
        tbody.appendChild(row);
    });
}

function renderWeeklyReturns() {
    const tbody = document.getElementById('weeklyReturnBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // We lopen van achteren naar voren (nieuwste data bovenaan)
    for (let i = brokerData.length - 1; i > 0; i--) {
        const current = brokerData[i];
        const previous = brokerData[i - 1];
        
        const row = document.createElement('tr');
        
        // Datum kolom
        let html = `<td style="font-weight: 600; font-size: 0.85rem;">${current.date}</td>`;
        
        // Bereken kolommen voor Totaal en de 3 brokers
        const metrics = [
            { cur: (current.degiro + current.bolero + current.saxo), prev: (previous.degiro + previous.bolero + previous.saxo) },
            { cur: current.degiro, prev: previous.degiro },
            { cur: current.bolero, prev: previous.bolero },
            { cur: current.saxo, prev: previous.saxo }
        ];

        metrics.forEach(m => {
            const diff = m.cur - m.prev;
            const perc = m.prev !== 0 ? ((diff / m.prev) * 100).toFixed(2) : 0;
            const color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
            const indicator = diff >= 0 ? '▲' : '▼';
            
            html += `
                <td>
                    <div style="color: ${color}; font-weight: 800; font-size: 0.9rem; display: flex; align-items: center; gap: 4px;">
                        <span>${indicator}</span>
                        <span class="blur-target">${formatEuro(Math.abs(diff))}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">
                        ${diff >= 0 ? '+' : ''}${perc}%
                    </div>
                </td>`;
        });

        row.innerHTML = html;
        tbody.appendChild(row);
    }
}


// Opent en sluit het menuutje
function toggleWidgetMenu() {
    const menu = document.getElementById('widgetMenu');
    const isOpen = menu.style.display !== 'none';
    if (!isOpen) renderWidgetSortList();
    menu.style.display = isOpen ? 'none' : 'block';
}

// Widget order management
const WIDGET_DEFS = [
    { id: 'growthChartContainer',      label: 'TOTAAL' },
    { id: 'pieChartContainer',         label: 'VERDELING' },
    { id: 'statsBlockContainer',       label: 'STATISTIEKEN' },
    { id: 'degiroChartContainer',      label: 'DEGIRO' },
    { id: 'boleroChartContainer',      label: 'BOLERO' },
    { id: 'saxoChartContainer',        label: 'SAXO' },
    { id: 'dailyReturnChartContainer', label: 'DAGRENDEMENT' },
    { id: 'cumulReturnChartContainer', label: 'GECUMULEERD %' },
    { id: 'heatmapContainer',          label: 'KALENDER' },
    { id: 'maandoverzichtContainer',   label: 'MAANDOVERZICHT' },
    { id: 'prestatiesBlockContainer',  label: 'PRESTATIES' },
    { id: 'weekoverzichtContainer',    label: 'WEEKOVERZICHT' },
    { id: 'doelBlockContainer',        label: 'DOEL' },

];
let widgetOrder   = JSON.parse(localStorage.getItem('v25_widget_order'))   || WIDGET_DEFS.map(w => w.id);
let widgetVisible = JSON.parse(localStorage.getItem('v25_widget_visible')) || {};

function saveWidgetState() {
    localStorage.setItem('v25_widget_order',   JSON.stringify(widgetOrder));
    localStorage.setItem('v25_widget_visible', JSON.stringify(widgetVisible));
}

function applyWidgetOrder() {
    const grid = document.querySelector('.charts-master-grid');
    if (!grid) return;
    widgetOrder.forEach(id => {
        const el = document.getElementById(id);
        if (el) grid.appendChild(el);
    });
    // Apply visibility
    widgetOrder.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const visible = widgetVisible[id] !== false;
        el.style.display = visible ? '' : 'none';
    });
    // PRESTATIES en DOEL: als ze aaneengesloten in de volgorde staan en beide zichtbaar zijn,
    // staan ze automatisch naast elkaar in het 3-koloms grid (elk 1 kolom).
    // Reset grid-column voor beide zodat andere span-klassen niet worden overschreven.
    const pEl = document.getElementById('prestatiesBlockContainer');
    const dEl = document.getElementById('doelBlockContainer');
    if (pEl) pEl.style.gridColumn = '';
    if (dEl) dEl.style.gridColumn = '';
}

function renderWidgetSortList() {
    const list = document.getElementById('widgetSortList');
    if (!list) return;
    list.innerHTML = '';
    let dragSrcIdx = null;

    widgetOrder.forEach((id, idx) => {
        const def = WIDGET_DEFS.find(w => w.id === id);
        if (!def) return;
        const visible = widgetVisible[id] !== false;

        const item = document.createElement('div');
        item.className = 'widget-drag-item';
        item.draggable = true;
        item.dataset.idx = idx;
        item.innerHTML = `
            <span class="drag-handle">☰</span>
            <input type="checkbox" ${visible ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;accent-color:var(--success);flex-shrink:0;" data-id="${id}">
            <span style="font-size:0.82rem;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;">${def.label}</span>
            <div class="widget-arrow-btns" style="flex-shrink:0;">
                <button class="widget-arrow-btn" data-move="-1" data-idx="${idx}" title="Omhoog">▲</button>
                <button class="widget-arrow-btn" data-move="1"  data-idx="${idx}" title="Omlaag">▼</button>
            </div>`;

        // Checkbox toggle
        item.querySelector('input').addEventListener('change', function() {
            widgetVisible[this.dataset.id] = this.checked;
            applyWidgetOrder();
            saveWidgetState();
        });

        // Arrow buttons
        item.querySelectorAll('.widget-arrow-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const i = parseInt(this.dataset.idx);
                const move = parseInt(this.dataset.move);
                const j = i + move;
                if (j < 0 || j >= widgetOrder.length) return;
                [widgetOrder[i], widgetOrder[j]] = [widgetOrder[j], widgetOrder[i]];
                applyWidgetOrder();
                saveWidgetState();
                renderWidgetSortList();
            });
        });

        // Drag events
        item.addEventListener('dragstart', e => {
            dragSrcIdx = idx;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => item.classList.add('dragging'), 0);
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            list.querySelectorAll('.widget-drag-item').forEach(i => i.classList.remove('drag-over'));
        });
        item.addEventListener('dragover', e => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            list.querySelectorAll('.widget-drag-item').forEach(i => i.classList.remove('drag-over'));
            item.classList.add('drag-over');
        });
        item.addEventListener('drop', e => {
            e.preventDefault();
            const toIdx = parseInt(item.dataset.idx);
            if (dragSrcIdx === null || dragSrcIdx === toIdx) return;
            const moved = widgetOrder.splice(dragSrcIdx, 1)[0];
            widgetOrder.splice(toIdx, 0, moved);
            dragSrcIdx = null;
            applyWidgetOrder();
            saveWidgetState();
            renderWidgetSortList();
        });

        list.appendChild(item);
    });
}

// Verbergt of toont de specifieke widget (legacy-compat)
function toggleWidget(containerId, isChecked) {
    widgetVisible[containerId] = isChecked;
    applyWidgetOrder();
    saveWidgetState();
}

// ── TIJDSFILTER VOOR LIJNGRAFIEKEN ──────────────────────────────────────────
const chartTimeFilter = { main: 'all', degiro: 'all', bolero: 'all', saxo: 'all', daily: 'all', cumul: 'all' };

function setTimeFilter(chartKey, range, btn) {
    chartTimeFilter[chartKey] = range;
    // Update active button styling
    const container = btn.closest('.time-filter-btns');
    if (container) {
        container.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active-time'));
    }
    btn.classList.add('active-time');
    applyTimeFilter(chartKey);
}

function getFilteredData(range) {
    if (!brokerData || brokerData.length === 0) return brokerData;
    const now = new Date();
    let cutoff = null;
    if (range === '1w') {
        cutoff = new Date(now); cutoff.setDate(now.getDate() - 7);
    } else if (range === '1m') {
        cutoff = new Date(now); cutoff.setMonth(now.getMonth() - 1);
    } else if (range === 'ytd') {
        cutoff = new Date(now.getFullYear(), 0, 1);
    }
    if (!cutoff) return brokerData;
    return brokerData.filter(d => {
        const [dd, mm, yyyy] = d.date.split('/').map(Number);
        return new Date(yyyy, mm - 1, dd) >= cutoff;
    });
}

function applyTimeFilter(chartKey) {
    const range = chartTimeFilter[chartKey];
    const filtered = getFilteredData(range);
    if (!filtered || filtered.length === 0) return;
    const labels = filtered.map(d => d.date);

    if (chartKey === 'main' && charts.main) {
        charts.main.data.labels = labels;
        charts.main.data.datasets[0].data = filtered.map(d => d.degiro + d.bolero + d.saxo);
        charts.main.update();
        // Benchmarks bijwerken op gefilterde data
        const anyBenchActive = BENCHMARKS.some(b => document.getElementById(b.id)?.checked);
        if (anyBenchActive) updateBenchmarks();
    } else if (['degiro','bolero','saxo'].includes(chartKey) && charts[chartKey]) {
        charts[chartKey].data.labels = labels;
        charts[chartKey].data.datasets[0].data = filtered.map(d => d[chartKey]);
        charts[chartKey].update();
    } else if (chartKey === 'daily' && charts.dailyReturn) {
        const drFiltered = filtered.length > 1 ? filtered : filtered;
        const drLabels = filtered.slice(1).map(d => d.date);
        charts.dailyReturn.data.labels = drLabels;
        charts.dailyReturn.data.datasets[0].data = filtered.slice(1).map((d,i) => d.degiro - filtered[i].degiro);
        charts.dailyReturn.data.datasets[1].data = filtered.slice(1).map((d,i) => d.bolero - filtered[i].bolero);
        charts.dailyReturn.data.datasets[2].data = filtered.slice(1).map((d,i) => d.saxo   - filtered[i].saxo);
        charts.dailyReturn.update();
    } else if (chartKey === 'cumul' && charts.cumulReturn && filtered.length > 0) {
        const base = filtered[0];
        charts.cumulReturn.data.labels = filtered.map(d => d.date);
        const getCumul = (broker) => filtered.map(d => base[broker] !== 0 ? ((d[broker] - base[broker]) / base[broker]) * 100 : 0);
        charts.cumulReturn.data.datasets[0].data = getCumul('degiro');
        charts.cumulReturn.data.datasets[1].data = getCumul('bolero');
        charts.cumulReturn.data.datasets[2].data = getCumul('saxo');
        charts.cumulReturn.update();
    }
}


    function openNav() {
        document.getElementById("mySidebar").style.width = "250px";
        document.getElementById("overlay").style.display = "block";
    }
    function closeNav() {
        document.getElementById("mySidebar").style.width = "0";
        document.getElementById("overlay").style.display = "none";
    }

    // ── SWIPE NAVIGATIE ──────────────────────────────────────────────────────
    const TABS = ['test-portfolio-page', 'data-page', 'aandelen-page', 'heatmap-page'];
    const TAB_NAV_ITEMS = () => document.querySelectorAll('.nav-item');

    function getActiveTabIndex() {
        return TABS.findIndex(id => document.getElementById(id)?.classList.contains('active'));
    }

    function switchToTabIndex(idx) {
        if (idx < 0 || idx >= TABS.length) return;
        const tabId = TABS[idx];
        // Vind het matching nav-item in de sidebar
        const navItems = document.querySelectorAll('#mySidebar .nav-item');
        switchTab(tabId, navItems[idx] || navItems[0]);
    }

    (function initSwipe() {
        let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
        const SWIPE_THRESHOLD = 60;   // min px horizontaal
        const SWIPE_MAX_Y     = 80;   // max px verticaal (voorkomen scroll-conflict)
        const SWIPE_MAX_TIME  = 400;  // max ms

        document.addEventListener('touchstart', e => {
            touchStartX    = e.touches[0].clientX;
            touchStartY    = e.touches[0].clientY;
            touchStartTime = Date.now();
        }, { passive: true });

        document.addEventListener('touchend', e => {
            const dx   = e.changedTouches[0].clientX - touchStartX;
            const dy   = e.changedTouches[0].clientY - touchStartY;
            const dt   = Date.now() - touchStartTime;
            const sidebar = document.getElementById('mySidebar');
            const isOpen  = parseInt(sidebar.style.width) > 0;

            // Niet triggeren als het een scroll of lange druk was
            if (Math.abs(dy) > SWIPE_MAX_Y || dt > SWIPE_MAX_TIME) return;
            if (Math.abs(dx) < SWIPE_THRESHOLD) return;

            if (dx > 0 && touchStartX < 30) {
                // Swipe rechts vanuit linkerrand → open menu
                openNav();
            } else if (dx < 0 && isOpen) {
                // Swipe links terwijl menu open → sluit menu
                closeNav();
            }
        }, { passive: true });
    })();
    function switchDataTab(tabId, btn) {
        document.querySelectorAll('#data-page .sub-tab-content').forEach(content => content.classList.remove('active'));
        document.querySelectorAll('#data-page .data-tab-btn').forEach(button => button.classList.remove('active'));
        document.getElementById(tabId).classList.add('active');
        btn.classList.add('active');
        if (tabId === 'aandelen-data-tab') renderAandelenData();
        if (tabId === 'crypto-data-tab')   renderCryptoData();
        if (tabId === 'td-cashflows-tab')  renderTdCashflowsTable();
        if (tabId === 'td-cash-tab')       renderTdCashTab();
    }
    Chart.register(ChartDataLabels);
    
    function applyChartTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor  = isDark ? '#ffffff' : '#8e9196';
        const gridColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        const axisColor  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)';
        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = axisColor;
        if (Chart.defaults.scale) {
            Chart.defaults.scale.grid.color  = gridColor;
            Chart.defaults.scale.border.color = axisColor;
        }
        Object.values(Chart.instances).forEach(c => { try { c.update(); } catch(e) {} });
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('v25_theme', next);
        document.getElementById('themeBtn').innerText = next === 'dark' ? '☀️' : '🌙';
        applyChartTheme();
    }
// DATA DATA
    let brokerData = JSON.parse(localStorage.getItem('v25_broker')) || [
        { date: '13/04/2026', degiro: 50850, bolero: 21769, saxo: 31720 },
        { date: '14/04/2026', degiro: 54090, bolero: 22466, saxo: 33644 },
        { date: '15/04/2026', degiro: 55400, bolero: 22728, saxo: 34302 },
        { date: '16/04/2026', degiro: 56000, bolero: 22674, saxo: 34174 },
        { date: '17/04/2026', degiro: 57170, bolero: 23099, saxo: 35012 },
        { date: '20/04/2026', degiro: 57544, bolero: 23164, saxo: 34928 },
        { date: '21/04/2026', degiro: 57093, bolero: 22844, saxo: 33539 },
        { date: '22/04/2026', degiro: 59130, bolero: 23293, saxo: 35346 },
        { date: '23/04/2026', degiro: 59420, bolero: 22963, saxo: 35893 },
        { date: '24/04/2026', degiro: 59205, bolero: 23917, saxo: 35820 },


        

    ];
    
    let cashData = JSON.parse(localStorage.getItem('v25_cash')) || [
        { date: '07/2023', broker: 'Degiro', type: 'Gestort', amount: 38512 },
        { date: '01/2021', broker: 'Bolero', type: 'Gestort', amount: 12570 },
        { date: '12/2024', broker: 'Saxo', type: 'Gestort', amount: 26300 }
    ];

    // Storting tracker: gedetailleerde transacties per broker met datum
    let stortingenData = JSON.parse(localStorage.getItem('v25_stortingen')) || [
        { date: '01/07/2023', broker: 'Degiro', type: 'Storting', amount: 38512 },
        { date: '01/01/2021', broker: 'Bolero', type: 'Storting', amount: 12570 },
        { date: '01/12/2024', broker: 'Saxo',   type: 'Storting', amount: 26300 }
    ];

    let charts = {};

    let _tpAutoRefreshInterval = null;

    // Controleer of markt mogelijk open is (EU + US: ma-vr 09:00–22:00 CET)
    function isMarktOpen() {
        const now = new Date();
        const day = now.getDay(); // 0=zo, 6=za
        if (day === 0 || day === 6) return false;
        const cet = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
        const h = cet.getHours(), m = cet.getMinutes();
        const mins = h * 60 + m;
        return mins >= 9 * 60 && mins < 22 * 60;
    }

    // Start slimme auto-refresh: 60s tijdens markturen, 15min daarbuiten
    function startTpAutoRefresh() {
        if (_tpAutoRefreshInterval) { clearInterval(_tpAutoRefreshInterval); _tpAutoRefreshInterval = null; }
        const delay = isMarktOpen() ? 60000 : 15 * 60000;
        _tpAutoRefreshInterval = setInterval(() => {
            initTestPortfolio(false); // false = geen cache-wipe bij automatische refresh
            startTpAutoRefresh();
        }, delay);
    }

    function switchTab(id, el) {
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        document.getElementById(id).classList.add('active');
        if (el) el.classList.add('active');
        const labels = { 'test-portfolio-page':'PORTFOLIO', 'data-page':'DATA', 'aandelen-page':'LIVE', 'heatmap-page':'HEATMAP' };
        const navLabel = document.querySelector('.nav span[style*="font-weight"]');
        if (navLabel) navLabel.textContent = labels[id] || '';
        closeNav();
        if (id === 'aandelen-page') loadMarktData(true);
        if (id === 'data-page') { initTestDataPage(); renderAandelenData(); renderCryptoData(); }
        if (id === 'heatmap-page') initHeatmapPage();

        // LIVE pagina: slimme auto-refresh; stop bij verlaten
        if (_apAutoRefreshInterval) { clearInterval(_apAutoRefreshInterval); _apAutoRefreshInterval = null; }

        // TEST pagina: slimme auto-refresh; stop bij verlaten
        if (_tpAutoRefreshInterval) { clearInterval(_tpAutoRefreshInterval); _tpAutoRefreshInterval = null; }
        if (id === 'test-portfolio-page') {
            initTestPortfolio();
            startTpAutoRefresh();
        }
    }


    function toggleBlur() { 
        document.querySelectorAll('.blur-target').forEach(e => e.classList.toggle('blur')); 
        for (let chartName in charts) {
            if (charts[chartName]) charts[chartName].update();
        }
        renderStatsTable();
        renderMaandoverzicht();
        renderWeekoverzicht();
    }
    function formatEuro(v) { return "€ " + (v || 0).toLocaleString('nl-NL', {minimumFractionDigits: 0}); }
    function addRow(type) {
    if(type === 'broker') {
        brokerData.push({date: '', degiro: 0, bolero: 0, saxo: 0});
    } else {
        // Standaard nieuwe rij in de algemene cashData lijst
        cashData.push({date: '', broker: 'Degiro', type: 'Gestort', amount: 0});
    }
    renderTables();
    }

    function saveData(silent = false) {
        localStorage.setItem('v25_broker', JSON.stringify(brokerData));
        localStorage.setItem('v25_cash', JSON.stringify(cashData));
        localStorage.setItem('v25_stortingen', JSON.stringify(stortingenData));
        updateDashboard();
        if (!silent) alert("Gegevens opgeslagen!");
    }

    function updateDashboard() {
        if (!document.getElementById('totalValue')) return; // guard: dashboard not in DOM
        calculateAndDisplayCAGR(); // Voeg dit hier toe
        // Voeg dit toe onderaan de bestaande updateDashboard() functie
renderWeeklyReturns();
    // 1. Dwing chronologische volgorde af voor de grafiek
    brokerData.sort((a, b) => {
        const dateA = a.date.split('/').reverse().join('');
        const dateB = b.date.split('/').reverse().join('');
        return dateA.localeCompare(dateB);
        });
        const last = brokerData[brokerData.length-1];
        const prev = brokerData[brokerData.length-2] || last;
        const total = last.degiro + last.bolero + last.saxo;
        const pTotal = prev.degiro + prev.bolero + prev.saxo;

        let cash = { Degiro: 0, Bolero: 0, Saxo: 0, Totaal: 0 };
        cashData.forEach(c => {
            const val = c.type === 'Gestort' ? c.amount : -c.amount;
            cash[c.broker] += val;
            cash.Totaal += val;
        });

        const profitTotal = total - cash.Totaal;
        const percTotal = cash.Totaal !== 0 ? ((profitTotal / cash.Totaal) * 100).toFixed(0) : 0;

        document.getElementById('totalValue').innerText = formatEuro(total);
        document.getElementById('netInleg').innerText = formatEuro(cash.Totaal);
        document.getElementById('profitEuro').innerText = formatEuro(profitTotal);
        document.getElementById('profitPerc').innerText = "(" + percTotal + "%)";
        document.getElementById('profitEuro').style.color = profitTotal >= 0 ? 'var(--success)' : 'var(--danger)';

        ['Degiro', 'Bolero', 'Saxo'].forEach(b => {
            const currentVal = last[b.toLowerCase()];
            const cashVal = cash[b];
            const pEuro = currentVal - cashVal;
            const pPerc = cashVal !== 0 ? ((pEuro / cashVal) * 100).toFixed(2) : 0;
            document.getElementById(`val${b}`).innerText = formatEuro(currentVal);
            document.getElementById(`cash${b}`).innerText = formatEuro(cashVal);
            document.getElementById(`prof${b}Euro`).innerText = formatEuro(pEuro);
            document.getElementById(`prof${b}Perc`).innerText = "(" + pPerc + "%)";
            document.getElementById(`prof${b}Euro`).style.color = pEuro >= 0 ? 'var(--success)' : 'var(--danger)';
        });

        const DAGEN = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
        const [ld, lm, ly] = last.date.split('/').map(Number);
        const dateObj = new Date(ly, lm - 1, ld);
        const dagNaam = DAGEN[dateObj.getDay()];
        const luEl = document.getElementById('lastUpdateVal');
        if (luEl) luEl.innerText = `${dagNaam} ${last.date}`;

        updateChange('totalChange', total, pTotal);
        updateChange('chgDegiro', last.degiro, prev.degiro);
        updateChange('chgBolero', last.bolero, prev.bolero);
        updateChange('chgSaxo', last.saxo, prev.saxo);
        checkATH();
        updateCharts();
        renderTables();
    }

    function updateChange(id, cur, prev) {
        const diff = cur - prev, perc = prev !== 0 ? ((diff / prev) * 100).toFixed(2) : 0;
        const el = document.getElementById(id);
        el.style.color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
        el.innerHTML = `<span>${diff >= 0 ? '▲' : '▼'}</span> <span class="blur-target">${formatEuro(Math.abs(diff))}</span> (${perc}%)`;
    }

    function renderTables() {
    // 1. BROKER TABEL (Onveranderd)
    const bt = document.getElementById('brokerTableBody'); 
    if (bt) {
        bt.innerHTML = '';
        brokerData.slice().reverse().forEach((r, reversedIndex) => {
            const i = brokerData.length - 1 - reversedIndex;
            bt.innerHTML += `<tr>
                <td><input type="text" value="${r.date}" onchange="brokerData[${i}].date=this.value"></td>
                <td><input type="number" value="${r.degiro}" onchange="brokerData[${i}].degiro=parseFloat(this.value)"></td>
                <td><input type="number" value="${r.bolero}" onchange="brokerData[${i}].bolero=parseFloat(this.value)"></td>
                <td><input type="number" value="${r.saxo}" onchange="brokerData[${i}].saxo=parseFloat(this.value)"></td>
                <td><button onclick="brokerData.splice(${i},1);renderTables()">✕</button></td>
            </tr>`;
        });
    }

    // 2. CASH INPUTS (Vult de 3 vakjes in de DATA tab)
    const getAmount = (b) => {
        const entry = cashData.find(item => item.broker === b);
        return entry ? entry.amount : 0;
    };

    if (document.getElementById('inputCashDegiro')) document.getElementById('inputCashDegiro').value = getAmount('Degiro');
    if (document.getElementById('inputCashBolero')) document.getElementById('inputCashBolero').value = getAmount('Bolero');
    if (document.getElementById('inputCashSaxo')) document.getElementById('inputCashSaxo').value = getAmount('Saxo');
    }

    // updateSingleCash: saves silently so no alert fires on input change
    function updateSingleCash(broker, value) {
        const amount = parseFloat(value) || 0;
        const index = cashData.findIndex(item => item.broker === broker);
        if (index !== -1) {
            cashData[index].amount = amount;
        } else {
            cashData.push({ date: 'Totaal', broker: broker, type: 'Gestort', amount: amount });
        }
        saveData(true); // silent = true, no alert
    }
    const brokerStartDates = {
    'Degiro': '2023-07-01',
    'Bolero': '2021-01-01',
    'Saxo': '2024-12-01'
};

function calculateAndDisplayCAGR() {
    const lastEntry = brokerData[brokerData.length - 1];
    if (!lastEntry) return;

    ['Degiro', 'Bolero', 'Saxo'].forEach(broker => {
        const currentVal = lastEntry[broker.toLowerCase()];
        const cashObj = cashData.find(c => c.broker === broker);
        const cashVal = cashObj ? cashObj.amount : 0;
        
        const startDate = new Date(brokerStartDates[broker]);
        const today = new Date();
        const years = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);

        const el = document.getElementById(`cagr${broker}`);
        if (!el) return;

        if (cashVal > 0 && currentVal > 0 && years > 0) {
            const cagr = (Math.pow((currentVal / cashVal), (1 / years)) - 1) * 100;
            el.innerText = cagr.toFixed(2) + "%";
            
            // Verwijder oude klassen en voeg de nieuwe toe voor de kleur
            el.classList.remove('cagr-positive', 'cagr-negative');
            el.classList.add(cagr >= 0 ? 'cagr-positive' : 'cagr-negative');
        }
    });
}


    function exportCSV(type) {
        let csv = '', filename = '';
        if(type === 'broker') {
            csv = 'Datum;Degiro;Bolero;Saxo\n' + brokerData.map(r => `${r.date};${r.degiro};${r.bolero};${r.saxo}`).join('\n');
            filename = 'portfolio_broker_data.csv';
        } else {
            csv = 'Datum;Broker;Type;Bedrag\n' + cashData.map(r => `${r.date};${r.broker};${r.type};${r.amount}`).join('\n');
            filename = 'portfolio_cash_data.csv';
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", filename);
        link.click();
    }

    function importCSV(input, type) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            const lines = e.target.result.split('\n');
            const result = [];
            for(let i = 1; i < lines.length; i++) {
                if(!lines[i]) continue;
                const cols = lines[i].split(';');
                if(type === 'broker') result.push({date: cols[0], degiro: parseFloat(cols[1]), bolero: parseFloat(cols[2]), saxo: parseFloat(cols[3])});
                else result.push({date: cols[0], broker: cols[1], type: cols[2], amount: parseFloat(cols[3])});
            }
            if(type === 'broker') brokerData = result; else cashData = result;
            renderTables();
            alert('CSV succesvol geïmporteerd!');
        };
        reader.readAsText(file);
    }

    // Exporteer alle data naar een JSON bestand voor iCloud/Backup
function exportMasterJSON() {
    const backupData = {
        broker: brokerData,
        cash: cashData,
        version: "2.5",
        exportDate: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "portfolio_backup_" + new Date().toLocaleDateString() + ".json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// Importeer een eerder gemaakte backup
function importMasterJSON(input) {
    const file = input.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (importedData.broker && importedData.cash) {
                brokerData = importedData.broker;
                cashData = importedData.cash;
                
                saveData(true); // Sla op in LocalStorage
                renderTables();
                updateDashboard();
                
                alert("Backup succesvol hersteld!");
            } else {
                alert("Ongeldig backup bestand.");
            }
        } catch (err) {
            alert("Er is een fout opgetreden bij het lezen van het bestand.");
        }
    };
    reader.readAsText(file);
}


    function updateCharts() {
        const labels = brokerData.map(d => d.date);
        // Apply time filters for each chart
        ['main','degiro','bolero','saxo','daily','cumul'].forEach(k => applyTimeFilter(k));
        // Benchmarks heruitlijnen op nieuwe portfolio data
        const anyBenchActive = BENCHMARKS.some(b => document.getElementById(b.id)?.checked);
        if (anyBenchActive) {
            BENCHMARKS.forEach(b => { if (benchCache[b.ticker]) delete benchCache[b.ticker]; });
            updateBenchmarks();
        }
        const last = brokerData[brokerData.length-1];
        charts.pie.data.datasets[0].data = [last.degiro, last.bolero, last.saxo];
        charts.pie.update();

        // Dagrendement: dagelijkse verandering per broker (t.o.v. vorige dag)
        if (charts.dailyReturn) {
            const drLabels = brokerData.slice(1).map(d => d.date);
            const degiroReturns = brokerData.slice(1).map((d, i) => d.degiro - brokerData[i].degiro);
            const boleroReturns = brokerData.slice(1).map((d, i) => d.bolero - brokerData[i].bolero);
            const saxoReturns   = brokerData.slice(1).map((d, i) => d.saxo   - brokerData[i].saxo);
            charts.dailyReturn.data.labels = drLabels;
            charts.dailyReturn.data.datasets[0].data = degiroReturns;
            charts.dailyReturn.data.datasets[1].data = boleroReturns;
            charts.dailyReturn.data.datasets[2].data = saxoReturns;
            charts.dailyReturn.update();
        }

        // Gecumuleerd rendement % per broker (t.o.v. eerste datapunt)
        if (charts.cumulReturn && brokerData.length > 0) {
            const base = brokerData[0];
            const crLabels = brokerData.map(d => d.date);
            const getCumul = (broker) => brokerData.map(d => base[broker] !== 0 ? ((d[broker] - base[broker]) / base[broker]) * 100 : 0);
            charts.cumulReturn.data.labels = crLabels;
            charts.cumulReturn.data.datasets[0].data = getCumul('degiro');
            charts.cumulReturn.data.datasets[1].data = getCumul('bolero');
            charts.cumulReturn.data.datasets[2].data = getCumul('saxo');
            charts.cumulReturn.update();
        }

        renderStatsTable();
        renderHeatmap();
        renderMaandoverzicht();
        renderWeekoverzicht();
        renderPrestaties();
        renderDoel();
    }

// ── PRESTATIES (vanaf 13/04/2026) ────────────────────────────────────────────
const PRESTATIES_START_DATE = '13/04/2026';

function parseDate_NL(str) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
}

function renderPrestaties() {
    if (!brokerData || brokerData.length === 0) return;
    const startTs = parseDate_NL(PRESTATIES_START_DATE).getTime();
    let startEntry = null;
    for (let i = 0; i < brokerData.length; i++) {
        const ts = parseDate_NL(brokerData[i].date).getTime();
        if (ts >= startTs) { startEntry = brokerData[i]; break; }
    }
    if (!startEntry) startEntry = brokerData[0];

    const latestEntry = brokerData[brokerData.length - 1];
    const startTotal  = startEntry.degiro + startEntry.bolero + startEntry.saxo;
    const latestTotal = latestEntry.degiro + latestEntry.bolero + latestEntry.saxo;
    const winstEuro   = latestTotal - startTotal;
    const winstPerc   = startTotal !== 0 ? (winstEuro / startTotal) * 100 : 0;
    const isBlurred   = document.querySelector('.blur-target')?.classList.contains('blur');
    const sign  = winstEuro >= 0 ? '+' : '';
    const color = winstEuro >= 0 ? 'var(--success)' : 'var(--danger)';

    const setEl = (id, val, style) => {
        const el = document.getElementById(id);
        if (el) { el.textContent = val; if (style) el.style.cssText += style; }
    };

    setEl('prest-euro', isBlurred ? '€ •••' : `${sign}${formatEuro(winstEuro)}`, `color:${color};`);
    setEl('prest-perc', `${sign}${winstPerc.toFixed(2)}%`, `color:${color};`);

    // ── STREAK: opeenvolgende dagen omhoog of omlaag ───────────────────────
    const startIdxStreak = brokerData.indexOf(startEntry);
    let streakDirection = 0; // 1 = omhoog, -1 = omlaag
    let streakDagen = 0;
    for (let i = brokerData.length - 1; i > Math.max(startIdxStreak, 0); i--) {
        const cur  = brokerData[i].degiro + brokerData[i].bolero + brokerData[i].saxo;
        const prev = brokerData[i-1].degiro + brokerData[i-1].bolero + brokerData[i-1].saxo;
        const dir  = cur > prev ? 1 : cur < prev ? -1 : 0;
        if (dir === 0) break;
        if (streakDirection === 0) streakDirection = dir;
        if (dir !== streakDirection) break;
        streakDagen++;
    }
    const streakEl = document.getElementById('prest-streak');
    if (streakEl) {
        if (streakDagen === 0) {
            streakEl.textContent = '–';
            streakEl.style.color = 'var(--text-muted)';
        } else {
            const arrow = streakDirection > 0 ? '↑' : '↓';
            const col   = streakDirection > 0 ? 'var(--success)' : 'var(--danger)';
            streakEl.innerHTML = `<span style="color:${col};font-weight:800;">${streakDagen} dag${streakDagen === 1 ? '' : 'en'} ${arrow}</span>`;
        }
    }

    // ── MOMENTUM: % verandering laatste 3 dagen ───────────────────────────
    const momEl = document.getElementById('prest-momentum');
    if (momEl) {
        if (brokerData.length >= 4) {
            const lastIdx = brokerData.length - 1;
            const refIdx  = Math.max(0, lastIdx - 3);
            const valNow  = brokerData[lastIdx].degiro + brokerData[lastIdx].bolero + brokerData[lastIdx].saxo;
            const valRef  = brokerData[refIdx].degiro  + brokerData[refIdx].bolero  + brokerData[refIdx].saxo;
            const momPct  = valRef !== 0 ? ((valNow - valRef) / valRef) * 100 : 0;
            const mSign   = momPct >= 0 ? '+' : '';
            const mCol    = momPct >= 0 ? 'var(--success)' : 'var(--danger)';
            momEl.innerHTML = `<span style="color:${mCol};font-weight:800;">${mSign}${momPct.toFixed(2)}%</span> <span style="color:var(--text-muted);font-size:0.72rem;">(3d)</span>`;
        } else {
            momEl.textContent = '–';
            momEl.style.color = 'var(--text-muted)';
        }
    }

    // ── VOLATILITEIT: standaarddeviatie van dagelijkse % returns ──────────
    const volReturns = [];
    const dagSchommelingen = [];
    for (let i = Math.max(brokerData.indexOf(startEntry), 1); i < brokerData.length; i++) {
        const cur  = brokerData[i].degiro + brokerData[i].bolero + brokerData[i].saxo;
        const prev = brokerData[i-1].degiro + brokerData[i-1].bolero + brokerData[i-1].saxo;
        if (prev !== 0) {
            volReturns.push(((cur - prev) / prev) * 100);
            dagSchommelingen.push(Math.abs(cur - prev));
        }
    }
    const volEl  = document.getElementById('prest-vol');
    const schEl  = document.getElementById('prest-schommeling');
    if (volEl) {
        if (volReturns.length >= 2) {
            const mean   = volReturns.reduce((a,b) => a+b, 0) / volReturns.length;
            const sqSum  = volReturns.reduce((a,b) => a + Math.pow(b - mean, 2), 0);
            const stdDev = Math.sqrt(sqSum / volReturns.length);
            volEl.textContent = `${stdDev.toFixed(2)}%`;
            volEl.style.color = 'var(--text-main)';
        } else {
            volEl.textContent = '–';
            volEl.style.color = 'var(--text-muted)';
        }
    }
    if (schEl) {
        if (dagSchommelingen.length > 0) {
            const avgSch = dagSchommelingen.reduce((a,b) => a+b, 0) / dagSchommelingen.length;
            schEl.textContent = isBlurred ? '€ •••' : formatEuro(avgSch);
            schEl.style.color = 'var(--text-main)';
        } else {
            schEl.textContent = '–';
            schEl.style.color = 'var(--text-muted)';
        }
    }

    // Benchmark vergelijking: ophalen via Yahoo Finance vanaf PRESTATIES_START_DATE
    const benchDefs = [
        { id: 'prest-sp',   ticker: '%5EGSPC' },
        { id: 'prest-msci', ticker: 'URTH'    },
        { id: 'prest-btc',  ticker: 'BTC-USD' },
    ];
    // Zet laadtekst
    benchDefs.forEach(b => {
        const el = document.getElementById(b.id);
        if (el) { el.textContent = '⏳'; el.style.color = 'var(--text-muted)'; el.style.fontSize = '0.75rem'; }
    });
    // Bereken startdatum en einddatum voor Yahoo Finance
    const startParts = PRESTATIES_START_DATE.split('/').map(Number);
    const startYF = new Date(startParts[2], startParts[1]-1, startParts[0]);
    const endYF   = new Date();
    // Één dag eerder voor period1 zodat we de slotkoers van de startdag mee krijgen
    const period1 = Math.floor((startYF.getTime() - 86400000) / 1000);
    const period2 = Math.floor(endYF.getTime() / 1000);

    benchDefs.forEach(async b => {
        const el = document.getElementById(b.id);
        if (!el) return;
        try {
            const url = `https://corsproxy.io/?url=${encodeURIComponent(`https://query2.finance.yahoo.com/v8/finance/chart/${b.ticker}?interval=1d&period1=${period1}&period2=${period2}`)}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error(r.status);
            const data = await r.json();
            const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
            if (!closes || closes.length < 2) throw new Error('geen data');
            // Eerste geldige slotkoers als referentie
            const bStart = closes.find(v => v != null);
            const bEnd   = [...closes].reverse().find(v => v != null);
            if (!bStart || !bEnd || bStart === 0) throw new Error('ongeldige waarden');
            const bPerc = ((bEnd - bStart) / Math.abs(bStart)) * 100;
            const diff  = winstPerc - bPerc;
            const bSign = bPerc  >= 0 ? '+' : '';
            const dSign = diff   >= 0 ? '+' : '';
            const dCol  = diff   >= 0 ? 'var(--success)' : 'var(--danger)';
            const dBullet = diff >= 0 ? '🟢' : '🔴';
            el.innerHTML = `<span style="font-weight:800;">${bSign}${bPerc.toFixed(2)}%</span> &nbsp;${dBullet}&nbsp;<span style="color:${dCol};font-weight:800;">${dSign}${diff.toFixed(2)}%</span> <span style="color:var(--text-muted);font-size:0.7rem;">vs bench</span>`;
        } catch {
            el.textContent = '– (geen data)';
            el.style.color = 'var(--text-muted)';
            el.style.fontSize = '0.75rem';
        }
    });

    const startIdx = brokerData.indexOf(startEntry);
    let bestDag = null, slechtDag = null, groeiDagen = 0, totalDagen = 0;
    for (let i = Math.max(startIdx, 1); i < brokerData.length; i++) {
        const cur  = brokerData[i];
        const prev = brokerData[i - 1];
        const diff = (cur.degiro + cur.bolero + cur.saxo) - (prev.degiro + prev.bolero + prev.saxo);
        totalDagen++;
        if (diff >= 0) groeiDagen++;
        if (bestDag === null || diff > bestDag.diff) bestDag = { diff, date: cur.date };
        if (slechtDag === null || diff < slechtDag.diff) slechtDag = { diff, date: cur.date };
    }
    const bestEl   = document.getElementById('prest-bestdag');
    const slechtEl = document.getElementById('prest-slechtdag');
    const groeiEl  = document.getElementById('prest-groeidagen');
    if (bestEl && bestDag)   bestEl.textContent   = isBlurred ? `+•••• (${bestDag.date})` : `+${formatEuro(bestDag.diff)} (${bestDag.date})`;
    if (slechtEl && slechtDag) slechtEl.textContent = isBlurred ? `-•••• (${slechtDag.date})` : `${formatEuro(slechtDag.diff)} (${slechtDag.date})`;
    if (groeiEl) groeiEl.textContent = `${groeiDagen} / ${totalDagen} dagen (${totalDagen > 0 ? Math.round(groeiDagen/totalDagen*100) : 0}%)`;
}

// ── DOEL ─────────────────────────────────────────────────────────────────────
function getDoelData() { const d = JSON.parse(localStorage.getItem('doel_data') || '{}'); if (!d.target) d.target = 1000000; return d; }
function saveDoelDataLS(data) { localStorage.setItem('doel_data', JSON.stringify(data)); }

function renderDoel() {
    const doel = getDoelData();
    const target   = doel.target || 1000000;
    const deadline = doel.deadline || null;
    if (!brokerData || brokerData.length === 0) return;
    const latestEntry = brokerData[brokerData.length - 1];
    const current = latestEntry.degiro + latestEntry.bolero + latestEntry.saxo;
    const isBlurred = document.querySelector('.blur-target')?.classList.contains('blur');
    const setEl  = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setHTML = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };

    if (!target) {
        setEl('doel-target',    'Niet ingesteld');
        setEl('doel-current',   isBlurred ? '€ •••' : formatEuro(current));
        setEl('doel-resterend', '–');
        setEl('doel-pct-label', '0%');
        const bar = document.getElementById('doel-progress-bar');
        if (bar) bar.style.width = '0%';
        setEl('doel-eta',      '–');
        setEl('doel-dagnodig', '–');
        return;
    }
    const resterend = target - current;
    const pct = Math.min(Math.max((current / target) * 100, 0), 100);
    const bar = document.getElementById('doel-progress-bar');
    if (bar) { bar.style.width = pct.toFixed(1) + '%'; bar.style.background = pct >= 100 ? 'var(--success)' : 'linear-gradient(90deg,var(--bolero),var(--success))'; }
    const pctLblEl = document.getElementById('doel-pct-label');
    if (pctLblEl) { pctLblEl.textContent = pct.toFixed(1) + '%'; pctLblEl.style.color = pct >= 100 ? 'var(--success)' : pct >= 50 ? 'var(--bolero)' : 'var(--text-main)'; }
    setEl('doel-target',  isBlurred ? '€ •••' : formatEuro(target));
    setEl('doel-current', isBlurred ? '€ •••' : formatEuro(current));
    if (resterend <= 0) setHTML('doel-resterend', '<span style="color:var(--success);font-weight:800;">🎉 Doel bereikt!</span>');
    else setEl('doel-resterend', isBlurred ? '€ •••' : formatEuro(resterend));

    if (deadline) {
        const deadlineDate = new Date(deadline);
        const today = new Date();
        const daysLeft = Math.max(0, Math.round((deadlineDate - today) / 86400000));
        const dateStr = deadlineDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
        setEl('doel-eta', `${dateStr} (${daysLeft} d.)`);
        setEl('doel-dagnodig', resterend > 0 && daysLeft > 0 ? (isBlurred ? '€ •••/dag' : `${formatEuro(Math.round(resterend / daysLeft))}/dag`) : resterend <= 0 ? '–' : 'Deadline verstreken');
    } else {
        const startIdx = Math.max(0, brokerData.length - 30);
        if (brokerData.length >= 2 && resterend > 0) {
            const oldVal = brokerData[startIdx].degiro + brokerData[startIdx].bolero + brokerData[startIdx].saxo;
            const avgPerDay = (brokerData.length - 1 - startIdx) > 0 ? (current - oldVal) / (brokerData.length - 1 - startIdx) : 0;
            if (avgPerDay > 0) {
                const daysNeeded = Math.ceil(resterend / avgPerDay);
                const eta = new Date(); eta.setDate(eta.getDate() + daysNeeded);
                setEl('doel-eta', eta.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) + ` (~${daysNeeded}d)`);
                setEl('doel-dagnodig', isBlurred ? '€ •••/dag' : `${formatEuro(Math.round(avgPerDay))}/dag (gem.)`);
            } else { setEl('doel-eta', 'Onvoldoende groei'); setEl('doel-dagnodig', '–'); }
        } else { setEl('doel-eta', '–'); setEl('doel-dagnodig', '–'); }
    }
}
function openDoelModal() {
    const doel = getDoelData();
    const inp = document.getElementById('doelInput'); if (inp) inp.value = doel.target || 1000000;
    const dat = document.getElementById('doelDatumInput'); if (dat) dat.value = doel.deadline || '';
    const modal = document.getElementById('doelModal'); if (modal) modal.style.display = 'flex';
}
function closeDoelModal() { const modal = document.getElementById('doelModal'); if (modal) modal.style.display = 'none'; }
function saveDoelModal() {
    const target   = parseFloat(document.getElementById('doelInput')?.value) || null;
    const deadline = document.getElementById('doelDatumInput')?.value || null;
    saveDoelDataLS({ target, deadline });
    closeDoelModal();
    renderDoel();
    renderTpDoel();
}

function renderWeeklyReturns() {
    const tbody = document.getElementById('weeklyReturnBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // We lopen van achteren naar voren door de data (nieuwste bovenaan)
    for (let i = brokerData.length - 1; i > 0; i--) {
        const current = brokerData[i];
        const previous = brokerData[i - 1];
        
        const row = document.createElement('tr');
        
        // Datum kolom

        let html = `<td>${current.date}</td>`;
        
        // Bereken kolommen voor Totaal en de 3 brokers
        const types = [
            { cur: (current.degiro + current.bolero + current.saxo), prev: (previous.degiro + previous.bolero + previous.saxo) },
            { cur: current.degiro, prev: previous.degiro },
            { cur: current.bolero, prev: previous.bolero },
            { cur: current.saxo, prev: previous.saxo }
        ];

        types.forEach(data => {
            const diff = data.cur - data.prev;
            const perc = data.prev !== 0 ? ((diff / data.prev) * 100).toFixed(0) : 0;
            const color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
            const symbol = diff >= 0 ? '+' : '';
            
            html += `
                <td>
                    <div style="color: ${color}; font-weight: bold;">
                        <span class="blur-target">${symbol}${formatEuro(diff)}</span>
                    </div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${symbol}${perc}%</div>
                </td>`;
        });

        row.innerHTML = html;
        tbody.appendChild(row);
    }
}

    function initCharts() {
    // Guard: only init dashboard charts when those canvas elements exist
    if (!document.getElementById('growthChart')) return;
    // 1. De instellingen voor alle lijngrafieken (inclusief de blur-logica)
    const lineOpt = { 
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: { 
            legend: { display: false }, 
            datalabels: { display: false },
            tooltip: {
    callbacks: {
        label: function(context) {
            // We halen de 'label' (brokernaam) hier weg
            const isBlurred = document.querySelector('.blur-target').classList.contains('blur');
            
            if (isBlurred) {
                return "€ •••••"; // Alleen de bolletjes tonen
            } else {
                return formatEuro(context.parsed.y); // Alleen het bedrag tonen
            }
        }
    }
    }
        }, 
    scales: {
    x: {
        ticks: {
            callback: function(val, index) {
                const total = this.chart.data.labels.length;
                if (index === 0 || index === total - 1) {
                    return this.getLabelForValue(val);
                }
                return '';
            },
            autoSkip: false,
            maxRotation: 0
        }
    },
    y: { 
    beginAtZero: false,
    afterTickToLabelConversion: function(scaleInstance) {
        // Haal alle berekende ticks op
        const ticks = scaleInstance.ticks;
        if (ticks.length > 2) {
            // Maak alle labels leeg, behalve de eerste (onderste) en de laatste (bovenste)
            for (let i = 1; i < ticks.length - 1; i++) {
                ticks[i].label = ""; 
            }
        }
    }
}
    }
    
    };

    // 2. De Hoofdgrafiek aanmaken (met benchmark datasets)
    const mainChartOpt = JSON.parse(JSON.stringify(lineOpt));
    // Override tooltip voor hoofd + benchmarks
    mainChartOpt.plugins.tooltip = {
        callbacks: {
            label: function(context) {
                const isBlurred = document.querySelector('.blur-target').classList.contains('blur');
                const dsLabel = context.dataset.label || '';
                if (context.datasetIndex === 0) {
                    return isBlurred ? '  € •••••' : '  ' + formatEuro(context.parsed.y);
                }
                // Benchmark: ook in €
                return isBlurred ? `  ${dsLabel}: € •••••` : `  ${dsLabel}: ` + formatEuro(context.parsed.y);
            },
            labelColor: function(context) {
                const colors = ['#6c757d','#e67e22','#8e44ad','#16a085','#c0392b','#2980b9'];
                return { borderColor: colors[context.datasetIndex] || '#999', backgroundColor: colors[context.datasetIndex] || '#999' };
            }
        }
    };
    mainChartOpt.plugins.legend = { display: false };
    charts.main = new Chart(document.getElementById('growthChart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                // Dataset 0: portfolio totaal
                { label: 'Portfolio', data: [], borderColor: '#6c757d', backgroundColor: '#6c757d15', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 3 },
                // Dataset 1: S&P 500 (% scaled)
                { label: 'S&P 500',    data: [], borderColor: '#e67e22', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2, borderDash: [5,3], hidden: true },
                // Dataset 2: MSCI World
                { label: 'MSCI World', data: [], borderColor: '#8e44ad', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2, borderDash: [5,3], hidden: true },
                // Dataset 3: Nasdaq 100
                { label: 'Nasdaq 100', data: [], borderColor: '#16a085', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2, borderDash: [5,3], hidden: true },
                // Dataset 4: Bitcoin
                { label: 'Bitcoin',    data: [], borderColor: '#c0392b', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2, borderDash: [5,3], hidden: true },
                // Dataset 5: BEL 20
                { label: 'BEL 20',     data: [], borderColor: '#2980b9', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, borderWidth: 2, borderDash: [5,3], hidden: true },
            ]
        },
        options: {
            ...mainChartOpt,
            scales: {
                x: {
                    ticks: {
                        callback: function(val, index) {
                            const total = this.chart.data.labels.length;
                            return (index === 0 || index === total - 1) ? this.getLabelForValue(val) : '';
                        },
                        autoSkip: false,
                        maxRotation: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    position: 'left',
                    afterTickToLabelConversion: function(s) {
                        if (s.ticks.length > 2) for (let i = 1; i < s.ticks.length - 1; i++) s.ticks[i].label = '';
                    }
                },
                yBench: {
                    beginAtZero: false,
                    position: 'right',
                    display: false, // Toon rechter-as alleen als benchmark actief is
                    grid: { drawOnChartArea: false },
                    ticks: { callback: v => v.toFixed(1) + '%' },
                    afterTickToLabelConversion: function(s) {
                        if (s.ticks.length > 2) for (let i = 1; i < s.ticks.length - 1; i++) s.ticks[i].label = '';
                    }
                }
            }
        }
    });

    // 3. De Broker-grafieken (Degiro, Bolero, Saxo) aanmaken
    ['degiro', 'bolero', 'saxo'].forEach(b => {
        const colors = { degiro: '#f1c40f', bolero: '#3498db', saxo: '#e74c3c' };
        charts[b] = new Chart(document.getElementById('chart' + b.charAt(0).toUpperCase() + b.slice(1)), { 
            type: 'line', 
            data: { labels: [], datasets: [{ label: b.charAt(0).toUpperCase() + b.slice(1), data: [], borderColor: colors[b], backgroundColor: colors[b]+'15', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 3 }] }, 
            options: lineOpt 
        });
    });

    // 5. De Dagrendement-grafiek (alle 3 brokers gecombineerd) aanmaken
    charts.dailyReturn = new Chart(document.getElementById('chartDailyReturn'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Degiro', data: [], borderColor: '#f1c40f', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 },
                { label: 'Bolero', data: [], borderColor: '#3498db', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 },
                { label: 'Saxo',   data: [], borderColor: '#e74c3c', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const isBlurred = document.querySelector('.blur-target').classList.contains('blur');
                            const label = context.dataset.label || '';
                            if (isBlurred) return label + ": € •••••";
                            const val = context.parsed.y;
                            return label + ": " + (val >= 0 ? '+' : '') + formatEuro(val);
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(val, index) {
                            const total = this.chart.data.labels.length;
                            if (index === 0 || index === total - 1) {
                                return this.getLabelForValue(val);
                            }
                            return '';
                        },
                        autoSkip: false,
                        maxRotation: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: {
                        color: function(context) {
                            if (context.tick.value === 0) return 'rgba(128,128,128,0.5)';
                            return 'rgba(128,128,128,0.08)';
                        },
                        lineWidth: function(context) {
                            if (context.tick.value === 0) return 2;
                            return 1;
                        }
                    },
                    afterTickToLabelConversion: function(scaleInstance) {
                        const ticks = scaleInstance.ticks;
                        if (ticks.length > 2) {
                            for (let i = 1; i < ticks.length - 1; i++) {
                                if (ticks[i].value !== 0) ticks[i].label = "";
                            }
                        }
                    }
                }
            }
        }
    });

    // 6. Gecumuleerd rendement % per broker
    charts.cumulReturn = new Chart(document.getElementById('chartCumulReturn'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'Degiro', data: [], borderColor: '#f1c40f', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 },
                { label: 'Bolero', data: [], borderColor: '#3498db', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 },
                { label: 'Saxo',   data: [], borderColor: '#e74c3c', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2.5 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const val = context.parsed.y;
                            return label + ': ' + (val >= 0 ? '+' : '') + val.toFixed(2) + '%';
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        callback: function(val, index) {
                            const total = this.chart.data.labels.length;
                            if (index === 0 || index === total - 1) return this.getLabelForValue(val);
                            return '';
                        },
                        autoSkip: false, maxRotation: 0
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(val) { return val.toFixed(1) + '%'; }
                    },
                    afterTickToLabelConversion: function(scaleInstance) {
                        const ticks = scaleInstance.ticks;
                        if (ticks.length > 2) {
                            for (let i = 1; i < ticks.length - 1; i++) ticks[i].label = '';
                        }
                    }
                }
            }
        }
    });

    // 4. De Taartdiagram (Distribution) aanmaken
    charts.pie = new Chart(document.getElementById('pieChart'), { 
        type: 'doughnut', 
        data: { labels: ['Degiro', 'Bolero', 'Saxo'], datasets: [{ data: [], backgroundColor: ['#f1c40f', '#3498db', '#e74c3c'], borderWeight: 0 }] }, 
        options: { 
            cutout: '70%', 
            maintainAspectRatio: false, 
            plugins: { 
    legend: { 
        display: true, 
        position: 'bottom',
        labels: { usePointStyle: true, font: { size: 12 } }
    },
    tooltip: {
        callbacks: {
            title: function(context) {
                // Toon brokernaam als title (buiten het label)
                return context[0]?.label || '';
            },
            label: function(context) {
                const isBlurred = document.querySelector('.blur-target').classList.contains('blur');
                if (isBlurred) return '  € •••••';
                return '  ' + formatEuro(context.parsed);
            }
        }
    },
    datalabels: { 
        display: true, 
        color: '#fff', 
        font: { weight: 'bold' }, 
        formatter: (v, c) => { 
            let s=0; c.chart.data.datasets[0].data.forEach(x=>s+=x); 
            return (v*100/s).toFixed(0)+"%"; 
        } 
    } 
}
        } 
    });
    }

    // ── STATISTIEKEN TABEL ──────────────────────────────────────────────────
    function renderStatsTable() {
        const tbody = document.getElementById('statsTableBody');
        if (!tbody || brokerData.length < 2) return;

        const brokers = ['degiro', 'bolero', 'saxo'];

        // Bereken dagrendementen per broker
        const dailyReturns = {};
        brokers.forEach(b => {
            dailyReturns[b] = brokerData.slice(1).map((d, i) => d[b] - brokerData[i][b]);
        });

        const stats = brokers.map(b => {
            const returns = dailyReturns[b];
            const best  = Math.max(...returns);
            const worst = Math.min(...returns);
            const bestIdx  = returns.indexOf(best);
            const worstIdx = returns.indexOf(worst);
            const bestDate  = brokerData[bestIdx + 1].date;
            const worstDate = brokerData[worstIdx + 1].date;
            const avg = returns.reduce((a, v) => a + v, 0) / returns.length;
            const variance = returns.reduce((a, v) => a + Math.pow(v - avg, 2), 0) / returns.length;
            const stdDev = Math.sqrt(variance);

            // Max drawdown
            let peak = brokerData[0][b], maxDD = 0;
            brokerData.forEach(d => {
                if (d[b] > peak) peak = d[b];
                const dd = peak > 0 ? ((d[b] - peak) / peak) * 100 : 0;
                if (dd < maxDD) maxDD = dd;
            });

            return { best, worst, bestDate, worstDate, avg, stdDev, maxDD };
        });

        const isBlurred = () => document.querySelector('.blur-target') && document.querySelector('.blur-target').classList.contains('blur');

        const fmt = (v) => isBlurred() ? '€ •••' : (v >= 0 ? '+' : '') + formatEuro(v);
        const fmtAvg = (v) => isBlurred() ? '€ •••' : (v >= 0 ? '+' : '') + formatEuro(v);

        const rows = [
            {
                label: 'Beste dag',
                vals: stats.map(s => ({
                    main: fmt(s.best),
                    sub: s.bestDate,
                    color: 'var(--success)'
                }))
            },
            {
                label: 'Slechtste dag',
                vals: stats.map(s => ({
                    main: fmt(s.worst),
                    sub: s.worstDate,
                    color: 'var(--danger)'
                }))
            },
            {
                label: 'Gem. dagrendement',
                vals: stats.map(s => ({
                    main: fmtAvg(s.avg),
                    sub: '',
                    color: s.avg >= 0 ? 'var(--success)' : 'var(--danger)'
                }))
            },
            {
                label: 'Max drawdown',
                vals: stats.map(s => ({
                    main: s.maxDD.toFixed(2) + '%',
                    sub: '',
                    color: 'var(--danger)'
                }))
            }
        ];

        tbody.innerHTML = rows.map(row => `
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:7px 2px;color:var(--text-muted);font-size:0.7rem;font-weight:600;">${row.label}</td>
                ${row.vals.map(v => `
                    <td style="padding:7px 2px;text-align:right;">
                        <span style="color:${v.color};font-weight:700;font-size:0.78rem;">${v.main}</span>
                        ${v.sub ? `<br><span style="color:var(--text-muted);font-size:0.62rem;">${v.sub}</span>` : ''}
                    </td>`).join('')}
            </tr>`).join('');
    }

    // ── HEATMAP KALENDER ────────────────────────────────────────────────────
    const HEATMAP_BROKERS = ['totaal', 'degiro', 'bolero', 'saxo'];
    const HEATMAP_LABELS  = { totaal: 'TOTAAL', degiro: 'DEGIRO', bolero: 'BOLERO', saxo: 'SAXO' };
    let heatmapBrokerIdx = 0;
    let heatmapYear = new Date().getFullYear();

    function cycleHeatmapBroker() {
        heatmapBrokerIdx = (heatmapBrokerIdx + 1) % HEATMAP_BROKERS.length;
        document.getElementById('heatmapBrokerBtn').innerText = HEATMAP_LABELS[HEATMAP_BROKERS[heatmapBrokerIdx]] + ' ▾';
        renderHeatmap();
    }

    function renderHeatmap() {
        const grid = document.getElementById('heatmapGrid');
        const yearLabel = document.getElementById('heatmapYearLabel');
        if (!grid || !yearLabel) return;
        yearLabel.innerText = heatmapYear;

        const broker = HEATMAP_BROKERS[heatmapBrokerIdx];

        const returnMap = {};
        for (let i = 1; i < brokerData.length; i++) {
            const cur  = brokerData[i];
            const prev = brokerData[i - 1];
            const [d, m, y] = cur.date.split('/');
            const key = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
            const val = broker === 'totaal'
                ? (cur.degiro + cur.bolero + cur.saxo) - (prev.degiro + prev.bolero + prev.saxo)
                : cur[broker] - prev[broker];
            returnMap[key] = val;
        }

        const allVals = Object.values(returnMap).filter(v => isFinite(v));
        const maxAbs = allVals.length > 0 ? Math.max(...allVals.map(Math.abs)) : 1;

        const MONTH_NL = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
        const DAY_NL   = ['Ma','Di','Wo','Do','Vr','Za','Zo'];

        let html = `<div style="display:flex;gap:12px;flex-wrap:wrap;">`;

        for (let month = 0; month < 12; month++) {
            const firstDay = new Date(heatmapYear, month, 1);
            const daysInMonth = new Date(heatmapYear, month + 1, 0).getDate();
            let startDow = (firstDay.getDay() + 6) % 7;

            html += `<div style="min-width:130px;">`;
            html += `<div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-bottom:4px;">${MONTH_NL[month]}</div>`;
            html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:2px;">`;
            DAY_NL.forEach(d => {
                html += `<div style="font-size:0.55rem;color:var(--text-muted);text-align:center;">${d}</div>`;
            });
            html += `</div>`;
            html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">`;

            for (let e = 0; e < startDow; e++) html += `<div></div>`;

            for (let day = 1; day <= daysInMonth; day++) {
                const mm = String(month + 1).padStart(2, '0');
                const dd = String(day).padStart(2, '0');
                const key = `${heatmapYear}-${mm}-${dd}`;
                const val = returnMap[key];

                let bg = 'var(--border-color)';
                let dataTooltip = `${dd}/${mm}/${heatmapYear}: geen data`;

                if (val !== undefined) {
                    const intensity = maxAbs > 0 ? Math.min(Math.abs(val) / maxAbs, 1) : 0;
                    const alpha = Math.round(55 + intensity * 200);
                    const alphaHex = alpha.toString(16).padStart(2, '0');
                    bg = val >= 0 ? `#2ecc71${alphaHex}` : `#e74c3c${alphaHex}`;
                    const sign = val >= 0 ? '+' : '';
                    const isBlurred = document.querySelector('.blur-target') && document.querySelector('.blur-target').classList.contains('blur');
                    const displayVal = isBlurred ? '€ •••' : `${sign}€${Math.round(val).toLocaleString('nl-NL')}`;
                    dataTooltip = `${dd}/${mm}/${heatmapYear}  ${displayVal}`;
                }

                html += `<div data-tip="${dataTooltip}" class="heatmap-cell" style="aspect-ratio:1;border-radius:2px;background:${bg};cursor:default;position:relative;"></div>`;
            }

            html += `</div></div>`;
        }

        html += `</div>`;
        grid.innerHTML = html;

        // Bind tooltip events op alle cellen
        grid.querySelectorAll('.heatmap-cell').forEach(cell => {
            cell.addEventListener('mouseenter', showHeatTip);
            cell.addEventListener('mousemove', moveHeatTip);
            cell.addEventListener('mouseleave', hideHeatTip);
            cell.addEventListener('touchstart', showHeatTipTouch, { passive: true });
        });
    }

    // Heatmap tooltip handlers
    function getOrCreateTip() {
        let tip = document.getElementById('heatTip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'heatTip';
            tip.style.cssText = 'position:fixed;pointer-events:none;background:var(--card-bg);color:var(--text-main);border:1px solid var(--border-color);border-radius:8px;padding:6px 12px;font-size:0.78rem;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;display:none;white-space:nowrap;';
            document.body.appendChild(tip);
        }
        return tip;
    }
    function showHeatTip(e) {
        const tip = getOrCreateTip();
        tip.innerText = e.currentTarget.dataset.tip;
        tip.style.display = 'block';
        positionTip(tip, e.clientX, e.clientY);
    }
    function moveHeatTip(e) {
        const tip = getOrCreateTip();
        positionTip(tip, e.clientX, e.clientY);
    }
    function hideHeatTip() {
        const tip = getOrCreateTip();
        tip.style.display = 'none';
    }
    function showHeatTipTouch(e) {
        const tip = getOrCreateTip();
        tip.innerText = e.currentTarget.dataset.tip;
        tip.style.display = 'block';
        const t = e.touches[0];
        positionTip(tip, t.clientX, t.clientY);
        setTimeout(() => { tip.style.display = 'none'; }, 2500);
    }
    function positionTip(tip, x, y) {
        const offset = 14;
        let left = x + offset;
        let top  = y + offset;
        if (left + 180 > window.innerWidth)  left = x - 180 - offset;
        if (top  + 50  > window.innerHeight) top  = y - 50  - offset;
        tip.style.left = left + 'px';
        tip.style.top  = top  + 'px';
    }

    // ── ATH RECORD INDICATOR ────────────────────────────────────────────────
    function checkATH() {
        if (brokerData.length < 2) return;
        const last = brokerData[brokerData.length - 1];
        const lastTotal = last.degiro + last.bolero + last.saxo;

        // Check per broker + totaal of huidige waarde het maximum is van alle vorige datapunten
        const allButLast = brokerData.slice(0, -1);
        const maxTotal  = Math.max(...allButLast.map(d => d.degiro + d.bolero + d.saxo));
        const maxDegiro = Math.max(...allButLast.map(d => d.degiro));
        const maxBolero = Math.max(...allButLast.map(d => d.bolero));
        const maxSaxo   = Math.max(...allButLast.map(d => d.saxo));

        const show = (id, isATH) => {
            const el = document.getElementById(id);
            if (el) el.classList.toggle('visible', isATH);
        };

        show('athTotal',  lastTotal    > maxTotal);
        show('athDegiro', last.degiro  > maxDegiro);
        show('athBolero', last.bolero  > maxBolero);
        show('athSaxo',   last.saxo    > maxSaxo);
    }

    // ── MAANDOVERZICHT TABEL ────────────────────────────────────────────────
    const MAAND_BROKERS = ['totaal', 'degiro', 'bolero', 'saxo'];
    const MAAND_LABELS  = { totaal: 'TOTAAL', degiro: 'DEGIRO', bolero: 'BOLERO', saxo: 'SAXO' };
    const MAAND_NL = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
    let maandBrokerIdx = 0;
    let maandYear = new Date().getFullYear();

    function cycleMaandBroker() {
        maandBrokerIdx = (maandBrokerIdx + 1) % MAAND_BROKERS.length;
        document.getElementById('maandBrokerBtn').innerText = MAAND_LABELS[MAAND_BROKERS[maandBrokerIdx]] + ' ▾';
        renderMaandoverzicht();
    }

    function renderMaandoverzicht() {
        const head = document.getElementById('maandTableHead');
        const body = document.getElementById('maandTableBody');
        const yearLbl = document.getElementById('maandYearLabel');
        if (!head || !body || !yearLbl) return;
        yearLbl.innerText = maandYear;

        const broker = MAAND_BROKERS[maandBrokerIdx];
        const isBlurred = document.querySelector('.blur-target') && document.querySelector('.blur-target').classList.contains('blur');

        // Bouw per maand: eerste en laatste datapunt in die maand
        const getVal = (entry) => broker === 'totaal'
            ? entry.degiro + entry.bolero + entry.saxo
            : entry[broker];

        // Groepeer data per jaar-maand
        const byMonth = {};
        brokerData.forEach(entry => {
            const parts = entry.date.split('/');
            if (parts.length < 3) return;
            const key = `${parts[2]}-${parts[1].padStart(2,'0')}`; // YYYY-MM
            if (!byMonth[key]) byMonth[key] = [];
            byMonth[key].push(entry);
        });

        // Bouw rijen per maand van het geselecteerde jaar
        const months = [];
        for (let m = 1; m <= 12; m++) {
            const key = `${maandYear}-${String(m).padStart(2,'0')}`;
            const entries = byMonth[key];
            if (!entries || entries.length === 0) {
                months.push({ month: m, start: null, end: null, diff: null, perc: null });
                continue;
            }
            // Vorige maand: pak het laatste datapunt
            const prevM = m === 1 ? 12 : m - 1;
            const prevY = m === 1 ? maandYear - 1 : maandYear;
            const prevKey = `${prevY}-${String(prevM).padStart(2,'0')}`;
            const prevEntries = byMonth[prevKey];

            const endVal = getVal(entries[entries.length - 1]);
            let startVal = null;
            if (prevEntries && prevEntries.length > 0) {
                startVal = getVal(prevEntries[prevEntries.length - 1]);
            } else {
                // Als geen vorige maand: neem eerste entry van deze maand als startpunt
                startVal = entries.length > 1 ? getVal(entries[0]) : null;
            }

            const diff = startVal !== null ? endVal - startVal : null;
            const perc = startVal !== null && startVal !== 0 ? ((endVal - startVal) / startVal) * 100 : null;
            months.push({ month: m, end: endVal, diff, perc });
        }

        // Jaarstotaal
        const validMonths = months.filter(m => m.diff !== null);
        const jaarDiff = validMonths.reduce((s, m) => s + m.diff, 0);
        const firstValidEnd = validMonths.length > 0 ? validMonths[0].end - validMonths[0].diff : null;
        const jaarPerc = firstValidEnd && firstValidEnd !== 0 ? (jaarDiff / firstValidEnd) * 100 : null;

        // Header
        head.innerHTML = `<tr>
            <th>Maand</th>
            <th>Rendement €</th>
            <th>Rendement %</th>
            <th>Eindwaarde</th>
        </tr>`;

        // Rijen
        body.innerHTML = months.map(m => {
            if (m.diff === null) {
                return `<tr>
                    <td>${MAAND_NL[m.month - 1]}</td>
                    <td colspan="3" style="color:var(--text-muted);font-size:0.75rem;">geen data</td>
                </tr>`;
            }
            const color = m.diff >= 0 ? 'var(--success)' : 'var(--danger)';
            const sign  = m.diff >= 0 ? '+' : '';
            const euroStr  = isBlurred ? '€ •••' : `${sign}${formatEuro(m.diff)}`;
            const percStr  = m.perc !== null ? `${sign}${m.perc.toFixed(2)}%` : '–';
            const eindStr  = isBlurred ? '€ •••' : formatEuro(m.end);
            return `<tr>
                <td>${MAAND_NL[m.month - 1]}</td>
                <td style="color:${color};font-weight:700;" class="maand-euro-cell">${euroStr}</td>
                <td style="color:${color};font-weight:700;">${percStr}</td>
                <td class="maand-euro-cell">${eindStr}</td>
            </tr>`;
        }).join('');

        // Totaalrij
        if (validMonths.length > 0) {
            const color = jaarDiff >= 0 ? 'var(--success)' : 'var(--danger)';
            const sign  = jaarDiff >= 0 ? '+' : '';
            body.innerHTML += `<tr class="maand-totaal">
                <td>Jaar ${maandYear}</td>
                <td style="color:${color};" class="maand-euro-cell">${isBlurred ? '€ •••' : sign + formatEuro(jaarDiff)}</td>
                <td style="color:${color};">${jaarPerc !== null ? sign + jaarPerc.toFixed(2) + '%' : '–'}</td>
                <td></td>
            </tr>`;
        }
    }

    // ── WEEKOVERZICHT TABEL ────────────────────────────────────────────────────
    const WEEK_BROKERS = ['totaal', 'degiro', 'bolero', 'saxo'];
    const WEEK_LABELS  = { totaal: 'TOTAAL', degiro: 'DEGIRO', bolero: 'BOLERO', saxo: 'SAXO' };
    let weekBrokerIdx = 0;
    let weekYear = new Date().getFullYear();

    function cycleWeekBroker() {
        weekBrokerIdx = (weekBrokerIdx + 1) % WEEK_BROKERS.length;
        document.getElementById('weekBrokerBtn').innerText = WEEK_LABELS[WEEK_BROKERS[weekBrokerIdx]] + ' ▾';
        renderWeekoverzicht();
    }

    function getISOWeekAndYear(dateStr) {
        const parts = dateStr.split('/');
        if (parts.length < 3) return null;
        const [d, m, y] = parts.map(Number);
        const date = new Date(y, m - 1, d);
        date.setHours(0, 0, 0, 0);
        const thursday = new Date(date);
        thursday.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(thursday.getFullYear(), 0, 4);
        const weekNum = 1 + Math.round(((thursday - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        return { week: weekNum, year: thursday.getFullYear() };
    }

    function renderWeekoverzicht() {
        const head = document.getElementById('weekTableHead');
        const body = document.getElementById('weekTableBody');
        const yearLbl = document.getElementById('weekYearLabel');
        if (!head || !body || !yearLbl) return;
        yearLbl.innerText = weekYear;

        const broker = WEEK_BROKERS[weekBrokerIdx];
        const isBlurred = document.querySelector('.blur-target') && document.querySelector('.blur-target').classList.contains('blur');

        const getVal = (entry) => broker === 'totaal'
            ? entry.degiro + entry.bolero + entry.saxo
            : entry[broker];

        // Groepeer per ISO-week (van het geselecteerde jaar of aangrenzend)
        const byWeek = {};
        brokerData.forEach(entry => {
            const wi = getISOWeekAndYear(entry.date);
            if (!wi) return;
            const key = `${wi.year}-W${String(wi.week).padStart(2,'0')}`;
            if (!byWeek[key]) byWeek[key] = [];
            byWeek[key].push(entry);
        });

        // Verzamel alle weeksleutels van het geselecteerde jaar (ISO-jaar)
        const allKeys = Object.keys(byWeek).filter(k => k.startsWith(`${weekYear}-W`)).sort();

        head.innerHTML = `<tr>
            <th style="text-align:left;padding:8px 10px;color:var(--text-muted);font-size:0.7rem;font-weight:700;text-transform:uppercase;border-bottom:2px solid var(--border-color);">Week</th>
            <th style="text-align:left;padding:8px 10px;color:var(--text-muted);font-size:0.7rem;font-weight:700;text-transform:uppercase;border-bottom:2px solid var(--border-color);">Periode</th>
            <th style="text-align:right;padding:8px 10px;color:var(--text-muted);font-size:0.7rem;font-weight:700;text-transform:uppercase;border-bottom:2px solid var(--border-color);">Rendement €</th>
            <th style="text-align:right;padding:8px 10px;color:var(--text-muted);font-size:0.7rem;font-weight:700;text-transform:uppercase;border-bottom:2px solid var(--border-color);">Rendement %</th>
            <th style="text-align:right;padding:8px 10px;color:var(--text-muted);font-size:0.7rem;font-weight:700;text-transform:uppercase;border-bottom:2px solid var(--border-color);">Eindwaarde</th>
        </tr>`;

        if (allKeys.length === 0) {
            body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.82rem;">Geen data voor ${weekYear}</td></tr>`;
            return;
        }

        // Sorteer omgekeerd zodat meest recente week bovenaan staat
        const sortedKeys = [...allKeys].reverse();
        let totalDiff = 0;
        let rows = [];

        sortedKeys.forEach((key, idx) => {
            const entries = byWeek[key];
            const weekNum = parseInt(key.split('-W')[1]);

            // Einddatum = laatste datapunt van de week
            const lastEntry = entries[entries.length - 1];
            const endVal = getVal(lastEntry);

            // Startwaarde = laatste datapunt van de vorige week (chronologisch voor deze week)
            const prevKey = allKeys[allKeys.indexOf(key) - 1]; // vorige week (sortering oplopend)
            let startVal = null;
            if (prevKey && byWeek[prevKey]) {
                const prevEntries = byWeek[prevKey];
                startVal = getVal(prevEntries[prevEntries.length - 1]);
            } else {
                // Geen vorige week in dit jaar: kijk of er een week vlak daarvoor is (vorig jaar)
                const allKeysSorted = Object.keys(byWeek).sort();
                const globalIdx = allKeysSorted.indexOf(key);
                if (globalIdx > 0) {
                    const prevGlobalKey = allKeysSorted[globalIdx - 1];
                    const prevEntries = byWeek[prevGlobalKey];
                    startVal = getVal(prevEntries[prevEntries.length - 1]);
                } else if (entries.length > 1) {
                    // Allereerste week ooit: gebruik het eerste datapunt van de week zelf
                    startVal = getVal(entries[0]);
                }
            }

            // Datumrange tonen
            const firstEntry = entries[0];
            const dateFmt = (e) => {
                const p = e.date.split('/');
                return `${p[0]}/${p[1]}`;
            };
            const periodeStr = firstEntry.date === lastEntry.date
                ? dateFmt(firstEntry)
                : `${dateFmt(firstEntry)} – ${dateFmt(lastEntry)}`;

            if (startVal === null) {
                rows.push(`<tr>
                    <td style="font-weight:700;color:var(--text-muted);font-size:0.75rem;padding:7px 10px;">W${weekNum}</td>
                    <td style="padding:7px 10px;color:var(--text-muted);font-size:0.75rem;">${periodeStr}</td>
                    <td colspan="3" style="padding:7px 10px;text-align:right;color:var(--text-muted);font-size:0.75rem;">geen vorige week</td>
                </tr>`);
                return;
            }

            const diff = endVal - startVal;
            const perc = startVal !== 0 ? ((diff / startVal) * 100) : null;
            totalDiff += diff;

            const color = diff >= 0 ? 'var(--success)' : 'var(--danger)';
            const sign  = diff >= 0 ? '+' : '';
            const euroStr = isBlurred ? '€ •••' : `${sign}${formatEuro(diff)}`;
            const percStr = perc !== null ? `${sign}${perc.toFixed(2)}%` : '–';
            const eindStr = isBlurred ? '€ •••' : formatEuro(endVal);

            rows.push(`<tr style="border-bottom:1px solid var(--border-color);">
                <td style="font-weight:700;color:var(--text-muted);font-size:0.75rem;padding:7px 10px;">W${weekNum}</td>
                <td style="padding:7px 10px;font-size:0.78rem;">${periodeStr}</td>
                <td style="text-align:right;padding:7px 10px;color:${color};font-weight:700;">${euroStr}</td>
                <td style="text-align:right;padding:7px 10px;color:${color};font-weight:700;">${percStr}</td>
                <td style="text-align:right;padding:7px 10px;">${eindStr}</td>
            </tr>`);
        });

        body.innerHTML = rows.join('');

        // Totaalrij
        const validRows = sortedKeys.filter(k => {
            const entries = byWeek[k];
            const allKeysSorted = Object.keys(byWeek).sort();
            const globalIdx = allKeysSorted.indexOf(k);
            return globalIdx > 0 || allKeys.indexOf(k) > 0;
        });
        if (validRows.length > 0) {
            const color = totalDiff >= 0 ? 'var(--success)' : 'var(--danger)';
            const sign  = totalDiff >= 0 ? '+' : '';
            body.innerHTML += `<tr style="font-weight:800;border-top:2px solid var(--border-color);">
                <td colspan="2" style="padding:7px 10px;color:var(--text-main);">Jaar ${weekYear}</td>
                <td style="text-align:right;padding:7px 10px;color:${color};">${isBlurred ? '€ •••' : sign + formatEuro(totalDiff)}</td>
                <td style="text-align:right;padding:7px 10px;color:var(--text-muted);">–</td>
                <td></td>
            </tr>`;
        }
    }

    // ── MARKT: LIVE DATA ────────────────────────────────────────────────────
    const FINNHUB_KEY = 'd4g9371r01qm5b34gb90d4g9371r01qm5b34gb9g';

    // Finnhub — primaire bron voor aandelen/ETFs (geen proxy, nauwkeurige dag%)
    async function fhQuote(symbol, _retry = true) {
        try {
            const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`);
            if (r.status === 429 && _retry) {
                // Rate-limited: wacht 600ms en probeer nog één keer
                await new Promise(res => setTimeout(res, 600));
                return fhQuote(symbol, false);
            }
            if (!r.ok) throw new Error(r.status);
            const d = await r.json();
            if (!d.c || d.c === 0) return null;
            const change = d.c - d.pc;
            // d.dp is Finnhub's official day change % — gebruik dit direct voor nauwkeurigheid
            const pct    = (d.dp != null && d.dp !== 0) ? d.dp : (d.pc ? (change / d.pc) * 100 : 0);
            return { price: d.c, change, pct, high: d.h, low: d.l, prevClose: d.pc, time: d.t ? new Date(d.t * 1000) : new Date(), source: 'finnhub' };
        } catch { return null; }
    }

    // Yahoo Finance via corsproxy.io — alleen nog voor marktdata-widgets (futures, indices)
    // Niet meer gebruikt voor portfolio-posities (te onnauwkeurig voor dagrendementen)
    async function yhQuote(ticker) {
        const bust = Math.floor(Date.now() / 60000); // verandert elke minuut
        const url = `https://corsproxy.io/?url=${encodeURIComponent('https://query2.finance.yahoo.com/v8/finance/chart/' + ticker + '?interval=1d&range=2d&_=' + bust)}`;
        try {
            const r = await fetch(url, { cache: 'no-store' });
            if (!r.ok) throw new Error(r.status);
            const data = await r.json();
            const meta = data?.chart?.result?.[0]?.meta;
            if (!meta || !meta.regularMarketPrice) return null;
            const price     = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
            const change    = price - prevClose;
            const pct       = prevClose ? (change / prevClose) * 100 : 0;
            return { price, change, pct, high: meta.regularMarketDayHigh, low: meta.regularMarketDayLow, time: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000) : new Date(), source: 'yahoo' };
        } catch { return null; }
    }

    // open.er-api.com — voor wisselkoersen (gratis, CORS ok, geen key)
    let _fxCache = null, _fxCacheTime = 0;
    async function fxRate(from, to) {
        try {
            if (_fxCache && _fxCache.base === from && Date.now() - _fxCacheTime < 300000) {
                const rate = _fxCache.rates[to];
                return rate ? { price: rate, pct: 0, prevRate: null, time: new Date(_fxCacheTime) } : null;
            }
            const r = await fetch(`https://open.er-api.com/v6/latest/${from}`);
            if (!r.ok) throw new Error(r.status);
            const data = await r.json();
            _fxCache = data; _fxCacheTime = Date.now();
            const rate = data.rates[to];
            if (!rate) return null;
            let pct = 0, prevRate = null;
            try {
                const prev = new Date(); prev.setDate(prev.getDate() - 1);
                while (prev.getDay() === 0 || prev.getDay() === 6) prev.setDate(prev.getDate() - 1);
                const prevStr = prev.toISOString().split('T')[0];
                const r2 = await fetch(`https://api.frankfurter.app/${prevStr}?from=${from}&to=${to}`);
                const d2 = await r2.json();
                prevRate = d2.rates?.[to] ?? null;
                if (prevRate) pct = ((rate - prevRate) / prevRate) * 100;
            } catch {}
            return { price: rate, pct, prevRate, time: new Date() };
        } catch { return null; }
    }

    // Binance public REST API — geen key nodig, CORS open
    async function binanceQuote(symbol) {
        try {
            const [ticker24, bookTicker] = await Promise.all([
                fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`).then(r => r.json()),
                fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`).then(r => r.json()),
            ]);
            if (!ticker24.lastPrice) return null;
            const price  = parseFloat(ticker24.lastPrice);
            const change = parseFloat(ticker24.priceChange);
            const pct    = parseFloat(ticker24.priceChangePercent);
            const high   = parseFloat(ticker24.highPrice);
            const low    = parseFloat(ticker24.lowPrice);
            return { price, change, pct, high, low, time: new Date() };
        } catch { return null; }
    }

    // Slim: probeer eerst Finnhub, dan Binance direct
    async function cryptoQuote(fhSym, binanceSym) {
        const fh = await fhQuote(fhSym);
        if (fh && fh.price > 0) return fh;
        return binanceQuote(binanceSym);
    }
    function fmtTime(date) {
        if (!date || isNaN(date)) return '–';
        return date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    }
    function fmtNum(v, dec = 2) {
        if (v == null || isNaN(v)) return '–';
        return v.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    function pctSpan(pct) {
        if (pct == null || isNaN(pct)) return '<span class="markt-neu">–</span>';
        const s = pct >= 0 ? '+' : '';
        const c = Math.abs(pct) < 0.005 ? 'markt-neu' : pct > 0 ? 'markt-pos' : 'markt-neg';
        return `<span class="${c}">${s}${fmtNum(pct)}%</span>`;
    }
    function chgSpan(chg, dec = 2) {
        if (chg == null || isNaN(chg)) return '<span class="markt-neu">–</span>';
        const s = chg >= 0 ? '+' : '';
        const c = chg === 0 ? 'markt-neu' : chg > 0 ? 'markt-pos' : 'markt-neg';
        return `<span class="${c}">${s}${fmtNum(chg, dec)}</span>`;
    }
    function errRow(label, sub, cols) {
        return `<tr><td><strong>${label}</strong><span class="markt-name-sub">${sub}</span></td><td colspan="${cols}" class="markt-err">Niet beschikbaar</td></tr>`;
    }
    function rowFx(label, sub, d) {
        if (!d) return errRow(label, sub, 2);
        return `<tr>
            <td><strong>${label}</strong><span class="markt-name-sub">${sub}</span></td>
            <td><strong>${fmtNum(d.price, 4)}</strong></td>
        </tr>`;
    }
    function rowQuote(label, sub, d, unit = '') {
        if (!d) return errRow(label, sub, 3);
        const u = unit ? `<span class="col-hide" style="color:var(--text-muted);font-size:0.7rem;"> ${unit}</span>` : '';
        return `<tr>
            <td><strong>${label}</strong><span class="markt-name-sub">${sub}</span></td>
            <td><strong>${fmtNum(d.price)}</strong>${u}</td>
            <td>${chgSpan(d.change)}</td>
            <td>${pctSpan(d.pct)}</td>
        </tr>`;
    }
    function rowCrypto(label, sub, d) {
        if (!d) return errRow(label, sub, 5);
        const dec = d.price < 1 ? 4 : d.price < 100 ? 3 : 2;
        return `<tr>
            <td><strong>${label}</strong><span class="markt-name-sub">${sub}</span></td>
            <td><strong>$${fmtNum(d.price, dec)}</strong></td>
            <td>${chgSpan(d.change, dec)}</td>
            <td>${pctSpan(d.pct)}</td>
            <td style="color:var(--success);font-size:0.8rem;">$${fmtNum(d.high ?? 0, dec)}</td>
            <td style="color:var(--danger);font-size:0.8rem;">$${fmtNum(d.low ?? 0, dec)}</td>
        </tr>`;
    }
    function setLoading(id, cols) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<tr><td colspan="${cols}" class="markt-loading">⏳ Laden…</td></tr>`;
    }

    let marktRefreshTimer = null;

    function setBlockDot(id, ok) {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = `markt-dot ${ok ? 'markt-dot-live' : 'markt-dot-stale'}`;
        el.title = ok ? 'Live' : 'Fout bij laden';
    }
    function resetBlockDots() {
        ['dot-vix','dot-fg','dot-fx','dot-idx','dot-com','dot-nrg','dot-cry'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.className = 'markt-dot markt-dot-loading'; el.title = 'Laden…'; }
        });
    }

    async function loadMarktData(manual = false) {
        if (manual) {
            document.getElementById('marktStatus').innerHTML =
                `<span class="markt-dot markt-dot-loading"></span> Ophalen…`;
        }
        resetBlockDots();
        setLoading('mb-fx', 4); setLoading('mb-idx', 4);
        setLoading('mb-com', 4); setLoading('mb-nrg', 4);
        setLoading('mb-cry', 6);

        // ── VIX + Fear & Greed (parallel) ────────────────────────────────────
        const [vixData, fgRaw, fgStockRaw] = await Promise.all([
            yhQuote('%5EVIX'),
            fetch('https://api.alternative.me/fng/?limit=2').then(r=>r.json()).catch(()=>null),
            // CNN Fear & Greed via corsproxy (public scrape)
            fetch(`https://corsproxy.io/?url=${encodeURIComponent('https://production.dataviz.cnn.io/index/fearandgreed/graphdata')}`)
                .then(r=>r.json()).catch(()=>null)
        ]);
        setBlockDot('dot-vix', !!vixData);
        setBlockDot('dot-fg', !!(fgRaw?.data?.[0] || fgStockRaw?.fear_and_greed));
        if (vixData) {
            const v = vixData.price;
            document.getElementById('vixValue').textContent = v.toFixed(0);
            const sign = vixData.change >= 0 ? '+' : '';
            document.getElementById('vixChange').innerHTML =
                `<span style="color:${vixData.change>=0?'var(--danger)':'var(--success)'}">${sign}${vixData.change.toFixed(2)} (${sign}${vixData.pct.toFixed(2)}%)</span>`;
            let label='NORMAAL', bg='#f1c40f22', col='#f1c40f', needle=30;
            if (v < 15)      { label='LAAG';     bg='#2ecc7122'; col='#2ecc71'; needle=10; }
            else if (v < 20) { label='NORMAAL';  bg='#f1c40f22'; col='#f1c40f'; needle=33; }
            else if (v < 30) { label='VERHOOGD'; bg='#e67e2222'; col='#e67e22'; needle=56; }
            else if (v < 40) { label='HOOG';     bg='#e74c3c22'; col='#e74c3c'; needle=76; }
            else             { label='EXTREEM';  bg='#c0392b33'; col='#c0392b'; needle=93; }
            const lb = document.getElementById('vixLabelBox');
            if (lb) { lb.textContent=label; lb.style.background=bg; lb.style.color=col; lb.style.border=`1px solid ${col}55`; }
            const n = document.getElementById('vixNeedle');
            if (n) n.style.left = needle + '%';
        }
        if (fgRaw?.data?.[0]) {
            const fg = fgRaw.data[0];
            const val = parseInt(fg.value);
            const col = val<=25?'#e74c3c':val<=45?'#e67e22':val<=55?'#f1c40f':val<=75?'#2ecc71':'#27ae60';
            const fgV=document.getElementById('fgValue'); if(fgV){fgV.textContent=val;fgV.style.color=col;}
            const fgC=document.getElementById('fgClassification'); if(fgC){fgC.textContent=fg.value_classification;fgC.style.color=col;}
            const fgN=document.getElementById('fgNeedle'); if(fgN) fgN.style.left=val+'%';
            if (fgRaw.data[1]) {
                const prev=parseInt(fgRaw.data[1].value), diff=val-prev;
                const fgY=document.getElementById('fgYesterday');
                if(fgY) fgY.textContent=`Gisteren: ${prev} (${diff>=0?'+':''}${diff})`;
            }
        }

        // CNN Stock Fear & Greed
        if (fgStockRaw?.fear_and_greed) {
            const fg = fgStockRaw.fear_and_greed;
            const val = Math.round(fg.score);
            const col = val<=25?'#e74c3c':val<=45?'#e67e22':val<=55?'#f1c40f':val<=75?'#2ecc71':'#27ae60';
            const cls = val<=25?'Extreme Fear':val<=45?'Fear':val<=55?'Neutral':val<=75?'Greed':'Extreme Greed';
            const fgSV=document.getElementById('fgStockValue'); if(fgSV){fgSV.textContent=val;fgSV.style.color=col;}
            const fgSC=document.getElementById('fgStockClass'); if(fgSC){fgSC.textContent=cls;fgSC.style.color=col;}
            const fgSN=document.getElementById('fgStockNeedle'); if(fgSN) fgSN.style.left=val+'%';
            if (fg.previous_close) {
                const prev=Math.round(fg.previous_close), diff=val-prev;
                const fgSP=document.getElementById('fgStockPrev');
                if(fgSP) fgSP.textContent=`Gisteren: ${prev} (${diff>=0?'+':''}${diff})`;
            }
        }

        // ── VALUTA ───────────────────────────────────────────────────────────
        const [eurusd, usdeur] = await Promise.all([fxRate('EUR','USD'), fxRate('USD','EUR')]);
        setBlockDot('dot-fx', eurusd !== null || usdeur !== null);
        document.getElementById('mb-fx').innerHTML = [
            rowFx('EUR/USD', 'Euro → US Dollar', eurusd),
            rowFx('USD/EUR', 'US Dollar → Euro', usdeur),
        ].join('');

        // ── CORE INDICES ─────────────────────────────────────────────────────
        const [sp, nq, rut] = await Promise.all([yhQuote('ES=F'), yhQuote('NQ=F'), yhQuote('RTY=F')]);
        setBlockDot('dot-idx', [sp,nq,rut].some(x=>x!==null));
        document.getElementById('mb-idx').innerHTML = [
            rowQuote('S&P 500',      'US Large Cap 500',  sp,  'USD'),
            rowQuote('Nasdaq 100',   'US Tech 100',       nq,  'USD'),
            rowQuote('Russell 2000', 'US Small Cap 2000', rut, 'USD'),
        ].join('');

        // ── COMMODITIES ──────────────────────────────────────────────────────
        const [gold, silver, copper, plat, pall] = await Promise.all([
            yhQuote('GC=F'), yhQuote('SI=F'), yhQuote('HG=F'), yhQuote('PL=F'), yhQuote('PA=F')
        ]);
        setBlockDot('dot-com', [gold,silver,copper,plat,pall].some(x=>x!==null));
        document.getElementById('mb-com').innerHTML = [
            rowQuote('Goud',      'Gold (GC=F)',      gold,   'USD/oz'),
            rowQuote('Zilver',    'Silver (SI=F)',    silver, 'USD/oz'),
            rowQuote('Koper',     'Copper (HG=F)',    copper, 'USD/lb'),
            rowQuote('Platinum',  'Platinum (PL=F)',  plat,   'USD/oz'),
            rowQuote('Palladium', 'Palladium (PA=F)', pall,   'USD/oz'),
        ].join('');

        // ── ENERGY ───────────────────────────────────────────────────────────
        const [brent, wti, gas, ttf] = await Promise.all([
            yhQuote('BZ=F'), yhQuote('CL=F'), yhQuote('NG=F'), yhQuote('TTF=F')
        ]);
        setBlockDot('dot-nrg', [brent,wti,gas,ttf].some(x=>x!==null));
        document.getElementById('mb-nrg').innerHTML = [
            rowQuote('Brent Oil', 'Brent Crude (BZ=F)', brent, 'USD/bbl'),
            rowQuote('Crude Oil', 'WTI Crude (CL=F)',   wti,   'USD/bbl'),
            rowQuote('Nat. Gas',  'Henry Hub (NG=F)',   gas,   'USD/MMBtu'),
            rowQuote('TTF Gas',   'EU Gas (TTF=F)',     ttf,   'EUR/MWh'),
        ].join('');

        // ── CRYPTO ───────────────────────────────────────────────────────────
        async function hypeQuote() {
            try {
                const [mids, meta] = await Promise.all([
                    fetch('https://api.hyperliquid.xyz/info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'allMids'})}).then(r=>r.json()),
                    fetch('https://api.hyperliquid.xyz/info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'metaAndAssetCtxs'})}).then(r=>r.json())
                ]);
                const price = parseFloat(mids['HYPE']); if (!price) return null;
                const assets = meta[0]?.universe??[], ctxs = meta[1]??[];
                const idx = assets.findIndex(a=>a.name==='HYPE');
                if (idx>=0 && ctxs[idx]) {
                    const ctx=ctxs[idx], prev=parseFloat(ctx.prevDayPx), change=price-prev, pct=prev?(change/prev)*100:0;
                    return {price,change,pct,high:parseFloat(ctx.dayHigh??price),low:parseFloat(ctx.dayLow??price),time:new Date()};
                }
                return {price,change:0,pct:0,high:price,low:price,time:new Date()};
            } catch { return null; }
        }

        // Dynamisch laden vanuit hmStocks (crypto type)
        const cryptoStocks = hmStocks.filter(s => s.type === 'crypto');
        const cryptoResults2 = await Promise.all(cryptoStocks.map(s => {
            const t = s.ticker;
            if (t === 'HYPE') return hypeQuote();
            if (t === 'TAO-USD') return binanceQuote('TAOUSDT');
            // Derive Binance pair: BTC-USD -> BTCUSDT
            const bn = t.replace(/-USD$/i,'') + 'USDT';
            return binanceQuote(bn).catch(() => yhQuote(t));
        }));
        const cryptoOk = cryptoResults2.some(x=>x!==null);
        setBlockDot('dot-cry', cryptoStocks.length === 0 || cryptoOk);
        document.getElementById('mb-cry').innerHTML = cryptoStocks.length === 0
            ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:16px;">Geen crypto geconfigureerd. Voeg toe via Data → Crypto.</td></tr>'
            : cryptoStocks.map((s,i) => {
                const sub = s.ticker.replace(/-USD$/i,'');
                return rowCrypto(s.name, sub, cryptoResults2[i]);
            }).join('');

        const now = new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
        const anyFailed = [sp,nq,gold,brent,eurusd].some(x=>x===null);
        document.getElementById('marktStatus').innerHTML =
            `<span class="markt-dot ${anyFailed?'markt-dot-stale':'markt-dot-live'}"></span> ${anyFailed?'Gedeeltelijk':'Live'} · ${now} · auto-refresh 30s`;
        if (marktRefreshTimer) clearTimeout(marktRefreshTimer);
        marktRefreshTimer = setTimeout(()=>{
            const tab=document.getElementById('aandelen-page');
            if(tab&&tab.classList.contains('active')) loadMarktData();
        }, 30000);
    }

    // ── BENCHMARK LIJNEN ────────────────────────────────────────────────────
    const BENCHMARKS = [
        { id: 'benchSP',     ticker: 'SPY',     label: 'S&P 500',    dsIdx: 1 },
        { id: 'benchMSCI',   ticker: 'URTH',    label: 'MSCI World',  dsIdx: 2 },
        { id: 'benchNASDAQ', ticker: 'QQQ',     label: 'Nasdaq 100',  dsIdx: 3 },
        { id: 'benchBTC',    ticker: 'BTC-USD', label: 'Bitcoin',     dsIdx: 4 },
        { id: 'benchBEL20',  ticker: '^BFX',     label: 'BEL 20',      dsIdx: 5 },
    ];

    const benchCache = {}; // ticker → array van sluitingskoersen

    // Haal dagelijkse sluitingskoersen op via Yahoo Finance (corsproxy)
    async function fetchBenchmarkHistory(ticker, fromDate) {
        if (benchCache[ticker]) return benchCache[ticker];
        try {
            // from als Unix timestamp
            const from = Math.floor(new Date(fromDate).getTime() / 1000) - 86400 * 5;
            const to   = Math.floor(Date.now() / 1000);
            const url  = `https://corsproxy.io/?url=${encodeURIComponent(
                `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&period1=${from}&period2=${to}`
            )}`;
            const r = await fetch(url);
            if (!r.ok) throw new Error(r.status);
            const data = await r.json();
            const result = data?.chart?.result?.[0];
            if (!result) return null;
            const timestamps = result.timestamps ?? result.timestamp ?? [];
            const closes     = result.indicators?.quote?.[0]?.close ?? [];
            // Bouw datum→koers map
            const map = {};
            timestamps.forEach((ts, i) => {
                if (closes[i] == null) return;
                const d = new Date(ts * 1000);
                const key = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
                map[key] = closes[i];
            });
            benchCache[ticker] = map;
            return map;
        } catch { return null; }
    }

    // Zet historische koersen om naar € t.o.v. portfolio startwaarde
    function alignBenchmark(priceMap, portfolioDates, portfolioValues) {
        if (!priceMap || portfolioDates.length === 0) return null;
        // Zoek de startprijs van de benchmark op de eerste portfoliodatum
        let basePrice = null;
        const basePortfolio = portfolioValues[0];
        const result = [];
        for (let i = 0; i < portfolioDates.length; i++) {
            const date = portfolioDates[i];
            let price = priceMap[date];
            if (price == null) {
                const [d, m, y] = date.split('/').map(Number);
                for (let offset = -3; offset <= 3; offset++) {
                    const try_ = new Date(y, m-1, d+offset);
                    const k = `${String(try_.getDate()).padStart(2,'0')}/${String(try_.getMonth()+1).padStart(2,'0')}/${try_.getFullYear()}`;
                    if (priceMap[k]) { price = priceMap[k]; break; }
                }
            }
            if (price == null) { result.push(null); continue; }
            if (basePrice === null) basePrice = price;
            // Schaal: als benchmark X% groeit, wat zou portfolio dan waard zijn?
            const benchPct = basePrice > 0 ? (price - basePrice) / basePrice : 0;
            result.push(basePortfolio * (1 + benchPct));
        }
        return basePrice !== null ? result : null;
    }

    async function updateBenchmarks() {
        if (!charts.main || brokerData.length === 0) return;
        const filtered = getFilteredData(chartTimeFilter['main']);
        const portfolioDates  = filtered.map(d => d.date);
        const portfolioValues = filtered.map(d => d.degiro + d.bolero + d.saxo);
        const [fd, fm, fy] = portfolioDates[0].split('/').map(Number);
        const fromDate = `${fy}-${String(fm).padStart(2,'0')}-${String(fd).padStart(2,'0')}`;

        let anyActive = false;
        for (const bench of BENCHMARKS) {
            const cb = document.getElementById(bench.id);
            const ds = charts.main.data.datasets[bench.dsIdx];
            if (!cb || !ds) continue;
            if (cb.checked) {
                anyActive = true;
                ds.hidden = false;
                const map = await fetchBenchmarkHistory(bench.ticker, fromDate);
                ds.data = alignBenchmark(map, portfolioDates, portfolioValues) ?? [];
            } else {
                ds.hidden = true;
                ds.data = [];
            }
        }
        // Rechter y-as verbergen (alles nu in €, zelfde schaal)
        charts.main.options.scales.yBench.display = false;
        charts.main.update();
    }

    // ── DATA PAGINA: AANDELEN & CRYPTO TABS ─────────────────────────────────
    function renderAandelenData() {
        const stockBody = document.getElementById('aandelenDataBody');
        const etfBody   = document.getElementById('etfDataBody');

        const stocks = hmStocks.filter(s => s.type === 'stock').sort((a,b)=>a.ticker.localeCompare(b.ticker));
        const etfs   = hmStocks.filter(s => s.type === 'etf').sort((a,b)=>a.ticker.localeCompare(b.ticker));

        const inputStyle = 'width:80px;border:1px solid var(--border-color);border-radius:6px;padding:4px 6px;font-size:0.78rem;background:var(--bg-color);color:var(--text-main);text-align:right;';

        const makeRows = (items) => items.map(s => `<tr style="border-bottom:1px solid var(--border-color);">
            <td style="padding:8px 6px;font-weight:700;font-family:monospace;">${s.ticker}</td>
            <td style="padding:8px 6px;">${s.name}</td>
            <td style="padding:8px 6px;text-align:center;">
                <select onchange="updateHmBroker('${s.ticker}',this.value)" style="border:1px solid var(--border-color);border-radius:6px;padding:3px 6px;font-size:0.78rem;background:var(--bg-color);color:var(--text-main);">
                    <option value="Degiro" ${(s.broker||'Degiro')==='Degiro'?'selected':''}>Degiro</option>
                    <option value="Bolero" ${(s.broker||'Degiro')==='Bolero'?'selected':''}>Bolero</option>
                    <option value="Saxo"   ${(s.broker||'Degiro')==='Saxo'?'selected':''}>Saxo</option>
                </select>
            </td>
            <td style="padding:8px 6px;text-align:center;">
                <select onchange="updateHmCurrency('${s.ticker}',this.value)" style="border:1px solid var(--border-color);border-radius:6px;padding:3px 6px;font-size:0.78rem;background:var(--bg-color);color:var(--text-main);">
                    <option value="USD" ${(s.currency||'USD')==='USD'?'selected':''}>USD</option>
                    <option value="EUR" ${(s.currency||'USD')==='EUR'?'selected':''}>EUR</option>
                </select>
            </td>
            <td style="padding:8px 6px;text-align:right;">
                <input type="number" step="0.0001" min="0" value="${s.gak ?? 0}" onchange="updateHmGak('${s.ticker}', this.value)" style="${inputStyle}">
            </td>
            <td style="padding:8px 6px;text-align:right;">
                <input type="number" step="0.0001" min="0" value="${s.aantal ?? 0}" onchange="updateHmAantal('${s.ticker}', this.value)" style="${inputStyle}">
            </td>
            <td style="padding:8px 6px;text-align:right;">
                <button onclick="removeHmStockData('${s.ticker}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.85rem;font-weight:700;">✕</button>
            </td>
        </tr>`).join('');

        const emptyRow = (msg) => `<tr><td colspan="7" style="padding:16px;color:var(--text-muted);text-align:center;">${msg}</td></tr>`;

        if (stockBody) stockBody.innerHTML = stocks.length ? makeRows(stocks) : emptyRow('Geen aandelen. Voeg er toe via + Toevoegen.');
        if (etfBody)   etfBody.innerHTML   = etfs.length   ? makeRows(etfs)   : emptyRow('Geen ETFs. Voeg er toe via + Toevoegen.');
    }

    function updateHmCurrency(ticker, currency) {
        const s = hmStocks.find(x => x.ticker === ticker);
        if (s) { s.currency = currency; saveHmStocks(); }
    }

    function updateHmBroker(ticker, broker) {
        const s = hmStocks.find(x => x.ticker === ticker);
        if (s) { s.broker = broker; saveHmStocks(); }
    }

    function updateHmGak(ticker, val) {
        const s = hmStocks.find(x => x.ticker === ticker);
        if (s) { s.gak = parseFloat(val) || 0; saveHmStocks(); }
    }

    function updateHmAantal(ticker, val) {
        const s = hmStocks.find(x => x.ticker === ticker);
        if (s) { s.aantal = parseFloat(val) || 0; saveHmStocks(); }
    }

    function updateHmManualPrice(ticker, val) {
        const s = hmStocks.find(x => x.ticker === ticker);
        if (s) { s.manualPrice = parseFloat(val) || 0; saveHmStocks(); }
    }

    function renderCryptoData() {
        const body = document.getElementById('cryptoDataBody');
        if (!body) return;
        const cryptos = hmStocks.filter(s => s.type === 'crypto');
        const inputStyle = 'width:100px;border:1px solid var(--border-color);border-radius:6px;padding:4px 6px;font-size:0.78rem;background:var(--bg-color);color:var(--text-main);text-align:right;';
        body.innerHTML = cryptos.length === 0
            ? `<tr><td colspan="4" style="padding:16px;color:var(--text-muted);text-align:center;">Geen crypto. Voeg toe via + Toevoegen.</td></tr>`
            : cryptos.map(s => `<tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:8px 6px;font-weight:700;">${s.ticker}</td>
                <td style="padding:8px 6px;">${s.name}</td>
                <td style="padding:8px 6px;text-align:right;">
                    <input type="number" step="0.00000001" min="0" value="${s.aantal ?? 0}" onchange="updateHmAantal('${s.ticker}', this.value)" style="${inputStyle}">
                </td>
                <td style="padding:8px 6px;text-align:right;">
                    <button onclick="removeHmStockData('${s.ticker}')" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:0.85rem;font-weight:700;">✕</button>
                </td>
            </tr>`).join('');
    }

    let _addSdMode = 'stock';
    function showAddStockData(mode) {
        _addSdMode = mode;
        const title = mode === 'crypto' ? 'Crypto toevoegen'
                    : mode === 'option' ? 'Optie toevoegen'
                    : 'Aandeel / ETF toevoegen';
        document.getElementById('addStockDataTitle').textContent = title;
        document.getElementById('addSdType').value = mode;
        document.getElementById('addSdTicker').value = '';
        document.getElementById('addSdName').value = '';
        document.getElementById('addStockDataModal').style.display = 'flex';
        document.getElementById('addSdTicker').focus();
    }
    function hideAddStockData() {
        document.getElementById('addStockDataModal').style.display = 'none';
    }
    async function confirmAddStockData() {
        const ticker = document.getElementById('addSdTicker').value.trim().toUpperCase();
        const name   = document.getElementById('addSdName').value.trim() || ticker;
        const type   = document.getElementById('addSdType').value;
        if (!ticker) return;
        if (hmStocks.find(s => s.ticker === ticker)) { alert(`${ticker} staat al in de lijst.`); return; }
        const newEntry = { ticker, name, type, gak: 0, aantal: 0, broker: 'Degiro', currency: type === 'option' ? 'EUR' : 'USD' };
        if (type === 'option') newEntry.manualPrice = 0;
        hmStocks.push(newEntry);
        saveHmStocks();
        hideAddStockData();
        renderAandelenData();
        renderCryptoData();
        renderHmGrid();
        // Fetch quote — niet voor opties (geen Yahoo ticker)
        if (type !== 'option') {
            const d = await yhQuote(ticker);
            if (d) { hmData[ticker] = d; renderHmGrid(); }
        }
    }
    function removeHmStockData(ticker) {
        if (!confirm(`${ticker} verwijderen?`)) return;
        hmStocks = hmStocks.filter(s => s.ticker !== ticker);
        delete hmData[ticker];
        saveHmStocks();
        renderAandelenData();
        renderCryptoData();
        renderHmGrid();
    }

    // ── HEATMAP PAGINA ──────────────────────────────────────────────────────
    // Echte posities pre-loaded: Bolero (3) + Degiro (24) + Saxo (15) = 42 posities
    // CleanSpark Call Jan'27 optie is overgeslagen (geen ticker te volgen via Yahoo)
    const DEFAULT_STOCKS = [
        // ── BOLERO ──────────────────────────────────────────────────────────
        {ticker:'NVDA',    name:'NVIDIA Corporation',           type:'stock', currency:'USD', broker:'Bolero', gak:14.67,  aantal:120},
        {ticker:'PYPL',    name:'PayPal Holdings',           type:'stock', currency:'USD', broker:'Bolero', gak:73.26,  aantal:29},
        {ticker:'BMNR',    name:'Bitmine Immersion Technologies',          type:'stock', currency:'USD', broker:'Bolero', gak:54.92,  aantal:66},

        // ── DEGIRO — aandelen ───────────────────────────────────────────────
        {ticker:'ABCL',    name:'AbCellera Biologics',        type:'stock', currency:'USD', broker:'Degiro', gak:3.59,   aantal:886},
        {ticker:'AMZN',    name:'Amazon.com',           type:'stock', currency:'USD', broker:'Degiro', gak:219.77, aantal:11},
        {ticker:'APLD',    name:'Applied Digital Corporation',  type:'stock', currency:'USD', broker:'Degiro', gak:4.19,   aantal:184},
        {ticker:'ACHR',    name:'Archer Aviation',  type:'stock', currency:'USD', broker:'Degiro', gak:9.50,   aantal:60},
        {ticker:'CRCL',    name:'Circle Internet Group',           type:'stock', currency:'USD', broker:'Degiro', gak:105.47, aantal:16},
        {ticker:'CRWV',    name:'CoreWeave',        type:'stock', currency:'USD', broker:'Degiro', gak:88.17,  aantal:31},
        {ticker:'CRDO',    name:'Credo Technology Group',            type:'stock', currency:'USD', broker:'Degiro', gak:118.16, aantal:21},
        {ticker:'IONQ',    name:'IonQ',             type:'stock', currency:'USD', broker:'Degiro', gak:27.43,  aantal:42},
        {ticker:'KEEL',    name:'Keel Infrastructure Corporation',             type:'stock', currency:'USD', broker:'Degiro', gak:1.98,   aantal:1730},
        {ticker:'LMND',    name:'Lemonade',         type:'stock', currency:'USD', broker:'Degiro', gak:32.50,  aantal:7},
        {ticker:'MRLN',    name:'Merlin',           type:'stock', currency:'USD', broker:'Degiro', gak:7.89,   aantal:299},
        {ticker:'MSFT',    name:'Microsoft Corporation',        type:'stock', currency:'USD', broker:'Degiro', gak:395.47, aantal:12},
        {ticker:'OUST',    name:'Ouster',           type:'stock', currency:'USD', broker:'Degiro', gak:24.60,  aantal:24},
        {ticker:'RR',      name:'Richtech Robotics',         type:'stock', currency:'USD', broker:'Degiro', gak:3.60,   aantal:162},
        {ticker:'SBET',    name:'SharpLink',        type:'stock', currency:'USD', broker:'Degiro', gak:21.26,  aantal:55},
        {ticker:'SOI.PA',  name:'Soitec SA',           type:'stock', currency:'EUR', broker:'Degiro', gak:64.16,  aantal:32},
        {ticker:'TOYO',    name:'Toyo Co',             type:'stock', currency:'USD', broker:'Degiro', gak:9.00,   aantal:66},
        {ticker:'UBER',    name:'Uber Technologies',             type:'stock', currency:'USD', broker:'Degiro', gak:79.32,  aantal:21},
        {ticker:'UAMY',    name:'United States Antimony Corporation',      type:'stock', currency:'USD', broker:'Degiro', gak:11.23,  aantal:85},
        // ── DEGIRO — ETFs ───────────────────────────────────────────────────
        {ticker:'2B76.DE', name:'iShares Automation & Robotics',  type:'etf',   currency:'EUR', broker:'Degiro', gak:14.14,  aantal:71},
        {ticker:'DAPP.MI', name:'VanEck Crypto & Blockchain Innovators',    type:'etf',   currency:'EUR', broker:'Degiro', gak:9.70,   aantal:492},
        {ticker:'REMX.MI', name:'VanEck Rare Earth and Strategic Metals',type:'etf',   currency:'EUR', broker:'Degiro', gak:8.11,   aantal:115},
        {ticker:'SMH.MI',  name:'VanEck Semiconductor ',      type:'etf',   currency:'EUR', broker:'Degiro', gak:28.42,  aantal:35},
        {ticker:'3HCL.L',  name:'WisdomTree Copper 3x Daily Leveraged',     type:'etf',   currency:'USD', broker:'Degiro', gak:16.50,  aantal:140},

        // ── SAXO — aandelen ─────────────────────────────────────────────────
        {ticker:'QBTS',    name:'D-Wave',           type:'stock', currency:'USD', broker:'Saxo',   gak:15.07,  aantal:50},
        {ticker:'IREN',    name:'IREN',             type:'stock', currency:'USD', broker:'Saxo',   gak:39.28,  aantal:301},
        {ticker:'JD',      name:'JD.com',           type:'stock', currency:'USD', broker:'Saxo',   gak:33.82,  aantal:29},
        {ticker:'CIFR',    name:'Cipher Digital Corporation',   type:'stock', currency:'USD', broker:'Saxo',   gak:14.66,  aantal:245},
        {ticker:'CLSK',    name:'CleanSpark',       type:'stock', currency:'USD', broker:'Saxo',   gak:13.17,  aantal:165},
        {ticker:'BKKT',    name:'Bakkt',            type:'stock', currency:'USD', broker:'Saxo',   gak:13.32,  aantal:169},
        {ticker:'SOFI',    name:'SoFi Technologies', type:'stock', currency:'USD', broker:'Saxo',   gak:20.52,  aantal:50},
        {ticker:'GOOGL',   name:'Alphabet',         type:'stock', currency:'USD', broker:'Saxo',   gak:163.20, aantal:28},
        {ticker:'SYM',     name:'Symbotic',         type:'stock', currency:'USD', broker:'Saxo',   gak:45.25,  aantal:9},
        {ticker:'RXRX',    name:'Recursion Pharmaceuticals',        type:'stock', currency:'USD', broker:'Saxo',   gak:5.73,   aantal:87},
        {ticker:'ABAT',    name:'American Battery Technology Company',      type:'stock', currency:'USD', broker:'Saxo',   gak:5.85,   aantal:113},
        {ticker:'XPEV',    name:'XPeng',            type:'stock', currency:'USD', broker:'Saxo',   gak:22.94,  aantal:36},
        {ticker:'CRM',     name:'Salesforce',       type:'stock', currency:'USD', broker:'Saxo',   gak:250.38, aantal:2},
        {ticker:'ZENA',    name:'Zenatech',         type:'stock', currency:'USD', broker:'Saxo',   gak:2.68,   aantal:115},
        // ── SAXO — ETFs ─────────────────────────────────────────────────────
        {ticker:'SGLD.MI', name:'Invesco Physical Gold',        type:'etf',   currency:'EUR', broker:'Saxo',   gak:295.07, aantal:3},

        // ── SAXO — opties (handmatige prijs, geen Yahoo ticker) ─────────────
        {ticker:'CLSK-2027C25', name:'CleanSpark Jan2027 25C', type:'option', currency:'EUR', broker:'Saxo', gak:482.15, aantal:1, manualPrice:120.58},

        // ── CRYPTO (placeholders — vul aantal aan via DATA → CRYPTO) ────────
       {ticker:'BTC-USD', name:'Bitcoin',          type:'crypto', currency:'USD', gak:0, aantal:0},
        {ticker:'ETH-USD', name:'Ethereum',         type:'crypto', currency:'USD', gak:0, aantal:0.42356231},
        {ticker:'SOL-USD', name:'Solana',           type:'crypto', currency:'USD', gak:0, aantal:0.00040417},
        {ticker:'AVAX-USD',name:'Avalanche',        type:'crypto', currency:'USD', gak:0, aantal:5.28471},
        {ticker:'AAVE-USD',name:'Aave',             type:'crypto', currency:'USD', gak:0, aantal:4.6809144},
        {ticker:'RNDR-USD',name:'Render',           type:'crypto', currency:'USD', gak:0, aantal:552.64445653},
        {ticker:'TAO-USD', name:'Bittensor',        type:'crypto', currency:'USD', gak:0, aantal:11.97492815},
        {ticker:'HYPE',    name:'Hyperliquid',      type:'crypto', currency:'USD', gak:0, aantal:59.32749854},
    ];

    // localStorage key v2: bevat broker/gak/aantal velden + echte posities
    let hmStocks = JSON.parse(localStorage.getItem('hm_stocks_v2') || 'null') || DEFAULT_STOCKS;
    // Zorg dat bestaande entries altijd een type, gak, aantal en broker hebben (default 0 / Degiro)
    hmStocks = hmStocks.map(s => ({ type: 'stock', gak: 0, aantal: 0, broker: 'Degiro', ...s }));
    hmStocks.forEach(s => {
        if (s.gak === undefined || s.gak === null) s.gak = 0;
        if (s.aantal === undefined || s.aantal === null) s.aantal = 0;
        if (!s.broker) s.broker = 'Degiro';
    });
    // Eenmalige migratie: verwijder MIGI en AMD uit bestaande localStorage data
    if (!localStorage.getItem('hm_stocks_migration_v40')) {
        const beforeCount = hmStocks.length;
        hmStocks = hmStocks.filter(s => s.ticker !== 'MIGI' && s.ticker !== 'AMD');
        if (hmStocks.length !== beforeCount) {
            localStorage.setItem('hm_stocks_v2', JSON.stringify(hmStocks));
        }
        localStorage.setItem('hm_stocks_migration_v40', '1');
    }
    let hmSortMode  = 'pct';
    let hmTabMode   = 'all';   // 'all' | 'stock' | 'etf'
    let hmCompact   = false;
    let hmData = {};
    let hmInitialized = false;

    function saveHmStocks() { localStorage.setItem('hm_stocks_v2', JSON.stringify(hmStocks)); }

    function setHmSort(mode, btn) {
        hmSortMode = mode;
        document.querySelectorAll('.hm-sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderHmGrid();
    }

    function pctColor(pct) {
        if (pct === null || isNaN(pct)) return { bg: 'var(--row-hover)', text: 'var(--text-muted)' };
        const abs = Math.min(Math.abs(pct), 8);
        const intensity = abs / 8;
        if (pct > 0) {
            const g = Math.round(120 + intensity * 80);
            return { bg: `rgba(46,${g},113,0.85)`, text: '#fff' };
        } else {
            const r = Math.round(160 + intensity * 75);
            return { bg: `rgba(${r},60,60,0.85)`, text: '#fff' };
        }
    }

    function renderHmGrid() {
        const grid = document.getElementById('hmGrid');
        if (!grid) return;

        // Filter op tab — opties uitsluiten (geen Yahoo ticker)
        let stocks = hmStocks.filter(s => {
            if (s.type === 'option') return false;
            if (hmTabMode === 'all')       return true;
            if (hmTabMode === 'crypto')    return s.type === 'crypto';
            if (hmTabMode === 'etf')       return s.type === 'etf';
            if (hmTabMode === 'stock_etf') return s.type === 'stock' || s.type === 'etf' || !s.type;
            return s.type === 'stock' || !s.type;
        });

        // Sorteer
        if (hmSortMode === 'pct') {
            stocks.sort((a, b) => {
                const pa = hmData[a.ticker]?.pct ?? -999;
                const pb = hmData[b.ticker]?.pct ?? -999;
                return pb - pa;
            });
        } else if (hmSortMode === 'name') {
            stocks.sort((a, b) => a.name.localeCompare(b.name));
        } else if (hmSortMode === 'value') {
            stocks.sort((a, b) => {
                const va = hmData[a.ticker]?.price ?? 0;
                const vb = hmData[b.ticker]?.price ?? 0;
                return vb - va;
            });
        }

        if (hmCompact) {
            // Compact view: kleine vakjes met alleen ticker
            grid.style.gridTemplateColumns = 'repeat(auto-fill,72px)';
            grid.style.justifyContent = 'start';
            grid.innerHTML = stocks.map(s => {
                const d = hmData[s.ticker];
                const pct = d?.pct ?? null;
                const { bg, text } = pctColor(pct);
                const sign = pct !== null && pct >= 0 ? '+' : '';
                const pctStr = pct !== null ? `${sign}${pct.toFixed(1)}%` : '–';
                const isLoading = !d;
                const displayTicker = s.type === 'crypto' ? s.ticker.replace(/-USD$/i,'') : s.ticker;
                return `<div class="hm-cell-compact ${isLoading?'loading':''}" style="background:${isLoading?'var(--row-hover)':bg};color:${isLoading?'var(--text-muted)':text};" title="${s.name}: ${pctStr}" onclick="void(0)">
                    <div style="font-size:0.62rem;font-weight:800;letter-spacing:0.02em;">${displayTicker}</div>
                    <div style="font-size:0.65rem;font-weight:700;margin-top:1px;">${pctStr}</div>
                </div>`;
            }).join('');
        } else {
            // Normale view
            grid.style.gridTemplateColumns = 'repeat(auto-fill,130px)';
            grid.style.justifyContent = 'start';
            grid.innerHTML = stocks.map(s => {
                const d = hmData[s.ticker];
                const isLoading = !d;
                const pct = d?.pct ?? null;
                const { bg, text } = pctColor(pct);
                const sign = pct !== null && pct >= 0 ? '+' : '';
                const pctStr = pct !== null ? `${sign}${pct.toFixed(2)}%` : '–';
                const currSymbol = (s.currency || 'USD') === 'EUR' ? '€' : '$';
                const priceStr = d?.price != null ? `${currSymbol}${d.price.toLocaleString('nl-NL', {minimumFractionDigits:2,maximumFractionDigits:2})}` : '';
                // Gebruik var(--row-hover) voor loading zodat het nooit transparant/kleurloos is
                const cellBg   = isLoading ? 'var(--row-hover)' : bg;
                const cellText = isLoading ? 'var(--text-muted)' : text;
                const displayTicker = s.type === 'crypto' ? s.ticker.replace(/-USD$/i,'') : s.ticker;
                return `<div class="hm-cell ${isLoading?'loading':''}" style="background:${cellBg};color:${cellText};align-items:center;justify-content:center;text-align:center;" data-ticker="${s.ticker}">
                    <span class="hm-del" onclick="removeHmStock('${s.ticker}',event)">✕</span>
                    <div style="width:100%;text-align:center;">
                        <div class="hm-ticker" style="text-align:center;">${displayTicker}</div>
                        <div class="hm-name" style="color:${cellText};text-align:center;">${s.name}</div>
                    </div>
                    <div style="width:100%;text-align:center;margin-top:auto;padding-top:4px;">
                        <div class="hm-pct" style="padding-top:0;text-align:center;">${pctStr}</div>
                        <div class="hm-price" style="color:${cellText};text-align:center;">${priceStr}</div>
                    </div>
                </div>`;
            }).join('');
        }

        // Status badge in header
        const total = hmStocks.filter(s => s.type !== 'option').length;
        const loaded = Object.keys(hmData).length;
        const hmStatusEl = document.getElementById('hmStatus');
        if (hmStatusEl && loaded > 0) {
            const now = new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
            const allLoaded = loaded >= total;
            hmStatusEl.innerHTML = `<span class="markt-dot ${allLoaded ? 'markt-dot-live' : 'markt-dot-loading'}"></span> ${allLoaded ? 'Live' : `Laden ${loaded}/${total}`} · ${now}`;
        }
    }

    function setHmTab(mode, btn) {
        hmTabMode = mode;
        document.querySelectorAll('.hm-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderHmGrid();
    }

    function toggleHmCompact() {
        hmCompact = !hmCompact;
        const btn = document.getElementById('hmCompactBtn');
        if (btn) btn.textContent = hmCompact ? '⊞ Normaal' : '⊟ Compact';
        renderHmGrid();
    }

    async function fetchHmQuotes() {
        const stocks = hmStocks.filter(s => s.type !== 'option');
        const chunks = [];
        for (let i = 0; i < stocks.length; i += 6) chunks.push(stocks.slice(i, i+6));

        for (const chunk of chunks) {
            await Promise.all(chunk.map(async s => {
                const ticker = s.ticker;
                if (ticker === 'HYPE') {
                    // Hyperliquid API
                    try {
                        const [mids, meta] = await Promise.all([
                            fetch('https://api.hyperliquid.xyz/info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'allMids'})}).then(r=>r.json()),
                            fetch('https://api.hyperliquid.xyz/info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'metaAndAssetCtxs'})}).then(r=>r.json())
                        ]);
                        const price = parseFloat(mids['HYPE']);
                        if (price) {
                            const assets = meta[0]?.universe??[], ctxs = meta[1]??[];
                            const idx = assets.findIndex(a=>a.name==='HYPE');
                            if (idx>=0 && ctxs[idx]) {
                                const ctx=ctxs[idx], prev=parseFloat(ctx.prevDayPx), change=price-prev, pct=prev?(change/prev)*100:0;
                                hmData['HYPE'] = {price, change, pct, high:parseFloat(ctx.dayHigh??price), low:parseFloat(ctx.dayLow??price)};
                            } else {
                                hmData['HYPE'] = {price, change:0, pct:0};
                            }
                        }
                    } catch {}
                } else if (ticker === 'TAO-USD') {
                    // TAO via Binance (Yahoo Finance geeft $0 terug)
                    const d = await binanceQuote('TAOUSDT');
                    if (d) hmData[ticker] = d;
                } else {
                    const d = await loadQuoteForPosition(s);
                    if (d) hmData[ticker] = d;
                }
            }));
            renderHmGrid();
        }
    }

    async function initHeatmapPage() {
        if (!hmInitialized) {
            hmInitialized = true;
            renderHmGrid(); // Toon loading state
        }
        await fetchHmQuotes();
    }

    async function refreshHeatmapPage() {
        hmData = {};
        renderHmGrid();
        await fetchHmQuotes();
    }

    function removeHmStock(ticker, event) {
        event.stopPropagation();
        if (!confirm(`${ticker} verwijderen uit de heatmap?`)) return;
        hmStocks = hmStocks.filter(s => s.ticker !== ticker);
        delete hmData[ticker];
        saveHmStocks();
        renderHmGrid();
    }

    function showAddStock() {
        const modal = document.getElementById('addStockModal');
        if (modal) { modal.style.display = 'flex'; document.getElementById('addStockTicker').focus(); }
    }
    function hideAddStock() {
        const modal = document.getElementById('addStockModal');
        if (modal) modal.style.display = 'none';
    }
    async function confirmAddStock() {
        const ticker = document.getElementById('addStockTicker').value.trim().toUpperCase();
        const name   = document.getElementById('addStockName').value.trim() || ticker;
        if (!ticker) return;
        if (hmStocks.find(s => s.ticker === ticker)) { alert(`${ticker} staat al in de lijst.`); return; }
        hmStocks.push({ ticker, name });
        saveHmStocks();
        hideAddStock();
        document.getElementById('addStockTicker').value = '';
        document.getElementById('addStockName').value = '';
        renderHmGrid();
        const d = await yhQuote(ticker);
        if (d) hmData[ticker] = d;
        renderHmGrid();
    }

    // ── KALENDER ─────────────────────────────────────────────────────────────
    const MAANDEN_NL = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];
    const EVENT_COLORS = { earnings:'#3498db', dividend:'#e74c3c', fed:'#8e44ad', macro:'#e67e22', custom:'#27ae60' };
    const EVENT_LABELS = { earnings:'Earnings', dividend:'Dividend', fed:'Fed/ECB', macro:'Macro' };

    let kalYear  = new Date().getFullYear();
    let kalMonth = new Date().getMonth(); // 0-based
    let kalEvents = JSON.parse(localStorage.getItem('kal_events') || '{}'); // key: 'YYYY-MM-DD' → [{type,title,ticker?,eps?,epsEst?,rev?}]
    let kalInitialized = false;

    // Vaste Fed/ECB en macro events 2025-2026
    const FIXED_EVENTS = {
        '2025-01-29': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2025-03-19': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2025-05-07': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2025-06-18': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2025-07-30': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2025-09-17': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2025-10-29': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2025-12-10': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2026-01-28': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2026-03-18': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2026-04-29': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2026-06-17': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2026-07-29': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2026-09-16': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2026-10-28': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2026-12-09': [{type:'fed',    title:'Fed rentebeslist (FOMC)'}],
        '2025-01-17': [{type:'macro',  title:'CPI VS (dec 2024)'}],
        '2025-02-12': [{type:'macro',  title:'CPI VS (jan 2025)'}],
        '2025-04-10': [{type:'macro',  title:'CPI VS (mrt 2025)'}],
        '2025-05-13': [{type:'macro',  title:'CPI VS (apr 2025)'}],
        '2025-06-11': [{type:'macro',  title:'CPI VS (mei 2025)'}],
        '2026-01-14': [{type:'macro',  title:'CPI VS (dec 2025)'}],
        '2026-02-11': [{type:'macro',  title:'CPI VS (jan 2026)'}],
        '2026-03-11': [{type:'macro',  title:'CPI VS (feb 2026)'}],
        '2026-04-10': [{type:'macro',  title:'CPI VS (mrt 2026)'}],
        '2026-05-13': [{type:'macro',  title:'CPI VS (apr 2026)'}],
    };

    function kalKey(y, m, d) {
        return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }

    function saveKalEvents() { localStorage.setItem('kal_events', JSON.stringify(kalEvents)); }

    function getAllEventsForKey(key) {
        const fixed   = FIXED_EVENTS[key] || [];
        const custom  = kalEvents[key]    || [];
        return [...fixed, ...custom];
    }

    // Haal earnings op via Finnhub voor alle heatmap tickers in de huidige maand
    async function fetchEarningsForMonth(year, month) {
        const from = `${year}-${String(month+1).padStart(2,'0')}-01`;
        const lastDay = new Date(year, month+1, 0).getDate();
        const to   = `${year}-${String(month+1).padStart(2,'0')}-${lastDay}`;
        try {
            const r = await fetch(`https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`);
            if (!r.ok) throw new Error(r.status);
            const data = await r.json();
            const myTickers = new Set(hmStocks.map(s => s.ticker.toUpperCase()));
            const result = {};
            (data.earningsCalendar || []).forEach(e => {
                const ticker = (e.symbol || '').toUpperCase();
                if (!myTickers.has(ticker)) return;
                const key = e.date;
                if (!result[key]) result[key] = [];
                const name = hmStocks.find(s => s.ticker.toUpperCase() === ticker)?.name || ticker;
                result[key].push({
                    type:   'earnings',
                    title:  name,
                    ticker: ticker,
                    eps:    e.epsActual != null ? e.epsActual : null,
                    epsEst: e.epsEstimate != null ? e.epsEstimate : null,
                    hour:   e.hour || '',
                });
            });
            return result;
        } catch { return {}; }
    }

    // Haal dividend op via Yahoo Finance (gratis, werkt voor alle aandelen)
    async function fetchDividendForMonth(year, month) {
        const myStocks = hmStocks.filter(s => s.type === 'stock' || s.type === 'etf');
        const from = new Date(year, month, 1);
        const to   = new Date(year, month + 1, 0);
        const fromTs = Math.floor(from.getTime() / 1000) - 86400;
        const toTs   = Math.floor(to.getTime()   / 1000) + 86400;
        const result = {};

        const chunks = [];
        for (let i = 0; i < myStocks.length; i += 5) chunks.push(myStocks.slice(i, i + 5));

        for (const chunk of chunks) {
            await Promise.all(chunk.map(async stock => {
                try {
                    const url = `https://corsproxy.io/?url=${encodeURIComponent(
                        `https://query2.finance.yahoo.com/v8/finance/chart/${stock.ticker}?interval=1d&period1=${fromTs}&period2=${toTs}&events=dividends`
                    )}`;
                    const r = await fetch(url);
                    if (!r.ok) return;
                    const data = await r.json();
                    const divs = data?.chart?.result?.[0]?.events?.dividends;
                    if (!divs) return;
                    Object.values(divs).forEach(d => {
                        const date = new Date(d.date * 1000);
                        // Alleen dividenden in de gevraagde maand
                        if (date.getMonth() !== month || date.getFullYear() !== year) return;
                        const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                        if (!result[key]) result[key] = [];
                        result[key].push({
                            type:     'dividend',
                            title:    stock.name,
                            ticker:   stock.ticker.toUpperCase(),
                            amount:   d.amount,
                            currency: stock.currency || 'USD',
                        });
                    });
                } catch {}
            }));
        }
        return result;
    }

    let kalEarningsCache = {}; // 'YYYY-MM' -> events object
    let kalDivCache      = {};

    async function refreshKalender() {
        const monthKey = `${kalYear}-${String(kalMonth+1).padStart(2,'0')}`;
        document.getElementById('kalStatus').textContent = '⏳ Earnings en dividenden ophalen…';
        const [earnings, dividends] = await Promise.all([
            fetchEarningsForMonth(kalYear, kalMonth),
            fetchDividendForMonth(kalYear, kalMonth),
        ]);
        kalEarningsCache[monthKey] = earnings;
        kalDivCache[monthKey]      = dividends;
        renderKalender();
        document.getElementById('kalStatus').textContent =
            `✓ Bijgewerkt · ${Object.values(earnings).flat().length} earnings · ${Object.values(dividends).flat().length} dividenden gevonden`;
    }

    async function initKalender() {
        if (kalInitialized) { renderKalender(); return; }
        kalInitialized = true;
        renderKalender();
        await refreshKalender();
    }

    function getMonthEvents() {
        const monthKey = `${kalYear}-${String(kalMonth+1).padStart(2,'0')}`;
        const earns = kalEarningsCache[monthKey] || {};
        const divs  = kalDivCache[monthKey]      || {};
        // Merge alles per dag
        const merged = {};
        const addAll = (obj) => Object.entries(obj).forEach(([k, evs]) => {
            if (!merged[k]) merged[k] = [];
            merged[k].push(...evs);
        });
        addAll(FIXED_EVENTS);
        addAll(earns);
        addAll(divs);
        addAll(kalEvents); // gebruikersevents
        return merged;
    }

    function renderKalender() {
        const label = document.getElementById('kalMonthLabel');
        if (label) label.textContent = `${MAANDEN_NL[kalMonth]} ${kalYear}`;
        const grid = document.getElementById('kalGrid');
        if (!grid) return;

        const allEvents = getMonthEvents();
        const today = new Date();
        const firstDay = new Date(kalYear, kalMonth, 1);
        const daysInMonth = new Date(kalYear, kalMonth+1, 0).getDate();
        const daysInPrevMonth = new Date(kalYear, kalMonth, 0).getDate();
        let startDow = (firstDay.getDay() + 6) % 7; // Ma=0

        let html = '';

        // Vorige maand opvulling
        for (let i = 0; i < startDow; i++) {
            const day = daysInPrevMonth - startDow + 1 + i;
            html += `<div class="kal-day other-month"><div class="kal-daynum">${day}</div></div>`;
        }

        // Huidige maand
        for (let d = 1; d <= daysInMonth; d++) {
            const key = kalKey(kalYear, kalMonth, d);
            const events = allEvents[key] || [];
            const dow = (new Date(kalYear, kalMonth, d).getDay() + 6) % 7;
            const isWeekend = dow >= 5;
            const isToday = d === today.getDate() && kalMonth === today.getMonth() && kalYear === today.getFullYear();

            let classes = 'kal-day';
            if (isWeekend) classes += ' weekend';
            if (isToday)   classes += ' today';
            if (events.length > 0) classes += ' has-events';

            const MAX_SHOW = 3;
            const shown = events.slice(0, MAX_SHOW);
            const more  = events.length - MAX_SHOW;

            const evHtml = shown.map(ev =>
                `<div class="kal-event ${ev.type}" onclick="event.stopPropagation();showKalDetail('${key}')">${ev.title}</div>`
            ).join('');

            html += `<div class="${classes}" onclick="showKalDetail('${key}')">
                <div class="kal-daynum">${d}</div>
                ${evHtml}
                ${more > 0 ? `<div class="kal-more">+${more} meer</div>` : ''}
            </div>`;
        }

        // Volgende maand opvulling
        const totalCells = startDow + daysInMonth;
        const remainder  = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let i = 1; i <= remainder; i++) {
            html += `<div class="kal-day other-month"><div class="kal-daynum">${i}</div></div>`;
        }

        grid.innerHTML = html;
    }

    function showKalDetail(key) {
        const allEvents = getMonthEvents();
        const events = allEvents[key] || [];
        const [y, m, d] = key.split('-').map(Number);
        const DAGEN = ['zondag','maandag','dinsdag','woensdag','donderdag','vrijdag','zaterdag'];
        const dateObj = new Date(y, m-1, d);
        document.getElementById('kalDetailDate').textContent =
            `${DAGEN[dateObj.getDay()]} ${d} ${MAANDEN_NL[m-1]} ${y}`;

        const panel = document.getElementById('kalDetail');
        const body  = document.getElementById('kalDetailBody');

        if (events.length === 0) {
            body.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">Geen events op deze dag.</p>`;
        } else {
            body.innerHTML = events.map(ev => {
                const col = EVENT_COLORS[ev.type] || '#999';
                let extra = '';
                if (ev.type === 'earnings') {
                    const timing = ev.hour === 'bmo' ? 'Voor opening' : ev.hour === 'amc' ? 'Na sluiting' : ev.hour ? ev.hour : '';
                    let epsHtml = '';
                    if (ev.epsEst != null) {
                        epsHtml = `EPS est: <strong>${ev.epsEst}</strong>`;
                        if (ev.eps != null) epsHtml += ` · Actual: <strong style="color:${ev.eps >= ev.epsEst ? 'var(--success)' : 'var(--danger)'};">${ev.eps}</strong>`;
                    }
                    extra = `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:3px;">
                        <span style="font-size:0.75rem;color:var(--text-muted);">${epsHtml}</span>
                        ${timing ? `<span style="font-size:0.72rem;font-weight:700;color:${col};background:${col}18;padding:2px 7px;border-radius:10px;">${timing}</span>` : ''}
                    </div>`;
                }
                if (ev.type === 'dividend') {
                    if (ev.amount) extra = `<div style="margin-top:3px;"><span style="font-size:0.75rem;color:var(--text-muted);">Dividend: <strong>${ev.amount} ${ev.currency||''}</strong> per aandeel</span></div>`;
                }
                return `<div class="kal-detail-event">
                    <div class="kal-detail-dot" style="background:${col};flex-shrink:0;"></div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;font-size:0.88rem;">${EVENT_LABELS[ev.type] || ev.type} — ${ev.title}</div>
                        ${extra}
                    </div>
                    ${ev.type === 'custom' ? `<button onclick="deleteKalEvent('${key}','${ev.title.replace(/'/g,"\\'")}')" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.85rem;flex-shrink:0;">✕</button>` : ''}
                </div>`;
            }).join('');
        }

        panel.style.display = 'block';
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function kalenderPrevMonth() {
        kalMonth--;
        if (kalMonth < 0) { kalMonth = 11; kalYear--; }
        renderKalender();
        // Lazy load events als nog niet gecached
        const mk = `${kalYear}-${String(kalMonth+1).padStart(2,'0')}`;
        if (!kalEarningsCache[mk]) refreshKalender();
    }
    function kalenderNextMonth() {
        kalMonth++;
        if (kalMonth > 11) { kalMonth = 0; kalYear++; }
        renderKalender();
        const mk = `${kalYear}-${String(kalMonth+1).padStart(2,'0')}`;
        if (!kalEarningsCache[mk]) refreshKalender();
    }
    function kalenderToday() {
        kalYear  = new Date().getFullYear();
        kalMonth = new Date().getMonth();
        renderKalender();
        const mk = `${kalYear}-${String(kalMonth+1).padStart(2,'0')}`;
        if (!kalEarningsCache[mk]) refreshKalender();
    }

    function showAddKalEvent() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('kalEvDate').value  = today;
        document.getElementById('kalEvTitle').value = '';
        document.getElementById('addKalModal').style.display = 'flex';
    }
    function hideAddKalEvent() {
        document.getElementById('addKalModal').style.display = 'none';
    }
    function confirmAddKalEvent() {
        const date  = document.getElementById('kalEvDate').value;
        const title = document.getElementById('kalEvTitle').value.trim();
        const type  = document.getElementById('kalEvType').value;
        if (!date || !title) return;
        if (!kalEvents[date]) kalEvents[date] = [];
        kalEvents[date].push({ type, title });
        saveKalEvents();
        hideAddKalEvent();
        renderKalender();
    }
    function deleteKalEvent(key, title) {
        if (!kalEvents[key]) return;
        kalEvents[key] = kalEvents[key].filter(e => e.title !== title);
        if (kalEvents[key].length === 0) delete kalEvents[key];
        saveKalEvents();
        renderKalender();
        showKalDetail(key);
    }

    function renderChartLegends() {
        const brokerColors = [
            { label: 'Degiro', color: '#f1c40f' },
            { label: 'Bolero', color: '#3498db' },
            { label: 'Saxo',   color: '#e74c3c' },
        ];
        ['dailyReturnLegend','cumulReturnLegend'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = brokerColors.map(b =>
                `<span style="display:inline-flex;align-items:center;gap:5px;font-size:0.72rem;font-weight:700;color:var(--text-main);">
                    <span style="display:inline-block;width:14px;height:3px;border-radius:2px;background:${b.color};"></span>${b.label}
                </span>`
            ).join('');
        });
    }

    window.onload = () => {
        const savedTheme = localStorage.getItem('v25_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeBtn').innerText = savedTheme === 'dark' ? '☀️' : '🌙';
        applyChartTheme();
        initCharts();
        renderChartLegends();
        updateDashboard();
        applyWidgetOrder();
        // TEST pagina is standaard actief — laad koersen en start auto-refresh
        initTestPortfolio();
        startTpAutoRefresh();
        // Hertoepassen na charts init zodat tick-kleuren kloppen
        setTimeout(applyChartTheme, 100);
    };


let cijferData = [];
let cijferFilter = 'all';
let cijferSort = 'date_asc';
let cijferSectorFilter = 'all';
let cijferInitialized = false;
let epsBarChartInstance = null;
const epsHistoryCache = {}; // ticker -> array of quarterly EPS entries
const consensusCache  = {}; // ticker -> recommendation data

function setCijferFilter(mode, btn) {
    cijferFilter = mode;
    document.querySelectorAll('.cijfer-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCijferGrid();
}

function setCijferSort(mode) {
    cijferSort = mode;
    renderCijferGrid();
}

function setCijferSectorFilter(sector) {
    cijferSectorFilter = sector;
    renderCijferGrid();
}

// Vul sector dropdown opties in op basis van actieve cijferData
function populateCijferSectorFilter() {
    const sel = document.getElementById('cijferSectorFilter');
    if (!sel) return;
    const sectors = new Set();
    cijferData.forEach(d => {
        const t = (d.ticker || '').toUpperCase();
        const sec = (typeof SECTOR_MAP !== 'undefined' && SECTOR_MAP[t]) || 'Onbekend';
        sectors.add(sec);
    });
    const current = sel.value;
    const sorted = [...sectors].sort();
    sel.innerHTML = '<option value="all">Alle sectoren</option>' + sorted.map(s => `<option value="${s}">${s}</option>`).join('');
    if ([...sectors, 'all'].includes(current)) sel.value = current;
}

// Bereken summary stats voor de header
function computeCijferSummary() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekOut  = new Date(today); weekOut.setDate(today.getDate() + 7);
    const weekStr  = weekOut.toISOString().split('T')[0];
    const monthOut = new Date(today); monthOut.setDate(today.getDate() + 30);
    const monthStr = monthOut.toISOString().split('T')[0];

    let thisWeek = 0, thisMonth = 0, todayCount = 0;
    let beats = 0, misses = 0;

    cijferData.forEach(d => {
        if (d.next?.date) {
            if (d.next.date === todayStr) todayCount++;
            if (d.next.date >= todayStr && d.next.date <= weekStr) thisWeek++;
            if (d.next.date >= todayStr && d.next.date <= monthStr) thisMonth++;
        }
        if (d.latest && d.latest.epsActual != null && d.latest.epsEstimate != null) {
            if (d.latest.epsActual >= d.latest.epsEstimate) beats++;
            else misses++;
        }
    });
    return { thisWeek, thisMonth, todayCount, beats, misses };
}

function renderCijferSummary() {
    const el = document.getElementById('cijferSummary');
    if (!el) return;
    if (!cijferData.length) { el.innerHTML = ''; return; }
    const s = computeCijferSummary();
    const totalReported = s.beats + s.misses;
    const beatPct = totalReported > 0 ? Math.round((s.beats / totalReported) * 100) : 0;

    el.innerHTML = `
        <div class="cijfer-summary-card" style="--cs-color: var(--danger);">
            <div class="cs-label">Vandaag</div>
            <div class="cs-value">${s.todayCount}</div>
            <div class="cs-sub">${s.todayCount === 1 ? 'rapport' : 'rapporten'}</div>
        </div>
        <div class="cijfer-summary-card" style="--cs-color: var(--bolero);">
            <div class="cs-label">Komende 7 dagen</div>
            <div class="cs-value">${s.thisWeek}</div>
            <div class="cs-sub">${s.thisWeek === 1 ? 'rapport' : 'rapporten'}</div>
        </div>
        <div class="cijfer-summary-card" style="--cs-color: #8e44ad;">
            <div class="cs-label">Komende 30 dagen</div>
            <div class="cs-value">${s.thisMonth}</div>
            <div class="cs-sub">${s.thisMonth === 1 ? 'rapport' : 'rapporten'}</div>
        </div>
        <div class="cijfer-summary-card" style="--cs-color: var(--success);">
            <div class="cs-label">Beat / Miss ratio</div>
            <div class="cs-value">${beatPct}%</div>
            <div class="cs-sub">${s.beats} beats · ${s.misses} misses</div>
        </div>
    `;
}

async function initCijferPage() {
    if (cijferInitialized) { renderCijferGrid(); return; }
    cijferInitialized = true;
    await loadCijferData(false);
}

// ── EPS TREND POPUP ────────────────────────────────────────────────────────
async function openEpsPopup(ticker, name) {
    const popup = document.getElementById('epsPopup');
    const titleEl = document.getElementById('epsPopupTitle');
    const subEl   = document.getElementById('epsPopupSub');
    const wrapEl  = document.getElementById('epsChartWrap');
    const conEl   = document.getElementById('epsConsensusBlock');
    if (!popup) return;
    titleEl.textContent = name;
    subEl.textContent   = ticker + ' — EPS trend (kwartalen)';
    wrapEl.innerHTML    = '<canvas id="epsBarChart"></canvas>';
    conEl.innerHTML     = '<span style="color:var(--text-muted);font-size:0.8rem;">⏳ Consensus laden…</span>';
    popup.style.display = 'flex';

    // Fetch EPS history via Finnhub earnings quality (past 8 quarters)
    let quarters = [];
    try {
        if (!epsHistoryCache[ticker]) {
            const r = await fetch(`https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&limit=8&token=${FINNHUB_KEY}`);
            if (r.ok) {
                const data = await r.json();
                epsHistoryCache[ticker] = (data || []).slice(0, 8).reverse();
            }
        }
        quarters = epsHistoryCache[ticker] || [];
    } catch {}

    // Draw bar chart
    if (quarters.length > 0) {
        const labels  = quarters.map(q => q.period || q.quarter || '');
        const actuals = quarters.map(q => q.actual != null ? q.actual : null);
        const ests    = quarters.map(q => q.estimate != null ? q.estimate : null);
        const barColors = actuals.map((a,i) => {
            if (a == null) return 'rgba(128,128,128,0.4)';
            const e = ests[i];
            return (e == null || a >= e) ? 'rgba(46,204,113,0.85)' : 'rgba(231,76,60,0.85)';
        });
        const ctx = document.getElementById('epsBarChart')?.getContext('2d');
        if (ctx) {
            if (epsBarChartInstance) { epsBarChartInstance.destroy(); epsBarChartInstance = null; }
            epsBarChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [
                        { label: 'Actueel', data: actuals, backgroundColor: barColors, borderRadius: 4 },
                        { label: 'Verwacht', data: ests, type: 'line', borderColor: 'rgba(52,152,219,0.8)', backgroundColor: 'transparent', pointRadius: 4, borderWidth: 2, tension: 0.3 }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'bottom', labels: { font: { size: 10 }, padding: 8, usePointStyle: true } }, datalabels: { display: false }, tooltip: { mode: 'index', intersect: false } },
                    scales: { y: { ticks: { callback: v => '$' + v.toFixed(2) } }, x: { ticks: { font: { size: 9 } } } }
                }
            });
        }
    } else {
        wrapEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-size:0.82rem;">Geen historische EPS data beschikbaar</div>';
    }

    // Fetch analyst consensus via Finnhub /stock/recommendation
    try {
        if (!consensusCache[ticker]) {
            const r = await fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${ticker}&token=${FINNHUB_KEY}`);
            if (r.ok) {
                const data = await r.json();
                consensusCache[ticker] = (data || [])[0] || null;
            }
        }
        const rec = consensusCache[ticker];
        if (rec) {
            const total = (rec.strongBuy||0) + (rec.buy||0) + (rec.hold||0) + (rec.sell||0) + (rec.strongSell||0);
            const buyPct  = total > 0 ? Math.round(((rec.strongBuy||0)+(rec.buy||0))/total*100) : 0;
            const holdPct = total > 0 ? Math.round((rec.hold||0)/total*100) : 0;
            const sellPct = 100 - buyPct - holdPct;
            conEl.innerHTML = `
                <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;">Analyst Consensus · ${rec.period || ''} · ${total} analisten</div>
                <div style="display:flex;gap:6px;margin-bottom:8px;">
                    <div style="flex:${buyPct};background:rgba(46,204,113,0.8);border-radius:4px;height:10px;" title="Buy ${buyPct}%"></div>
                    <div style="flex:${holdPct};background:rgba(241,196,15,0.8);border-radius:4px;height:10px;" title="Hold ${holdPct}%"></div>
                    <div style="flex:${Math.max(sellPct,0)};background:rgba(231,76,60,0.8);border-radius:4px;height:10px;" title="Sell ${sellPct}%"></div>
                </div>
                <div style="display:flex;gap:16px;font-size:0.72rem;font-weight:700;">
                    <span style="color:var(--success);">▲ Buy ${buyPct}%</span>
                    <span style="color:#f1c40f;">— Hold ${holdPct}%</span>
                    <span style="color:var(--danger);">▼ Sell ${Math.max(sellPct,0)}%</span>
                </div>
                <div style="display:flex;gap:10px;margin-top:8px;font-size:0.68rem;color:var(--text-muted);">
                    <span>Strong Buy: <b>${rec.strongBuy||0}</b></span>
                    <span>Buy: <b>${rec.buy||0}</b></span>
                    <span>Hold: <b>${rec.hold||0}</b></span>
                    <span>Sell: <b>${rec.sell||0}</b></span>
                    <span>Strong Sell: <b>${rec.strongSell||0}</b></span>
                </div>`;
        } else {
            conEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;">Geen consensus data beschikbaar</span>';
        }
    } catch {
        conEl.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;">Consensus niet beschikbaar</span>';
    }
}

function closeEpsPopup() {
    const popup = document.getElementById('epsPopup');
    if (popup) popup.style.display = 'none';
    if (epsBarChartInstance) { epsBarChartInstance.destroy(); epsBarChartInstance = null; }
}

// ── UPCOMING BLOK ─────────────────────────────────────────────────────────
function renderUpcomingBlock() {
    const block = document.getElementById('upcomingBlock');
    const list  = document.getElementById('upcomingList');
    if (!block || !list) return;

    const today = new Date();
    const fourWeeksOut = new Date(today); fourWeeksOut.setDate(today.getDate() + 28);
    const todayStr = today.toISOString().split('T')[0];
    const fourWStr = fourWeeksOut.toISOString().split('T')[0];

    const upcoming = cijferData
        .filter(d => d.next && d.next.date >= todayStr && d.next.date <= fourWStr)
        .sort((a,b) => a.next.date.localeCompare(b.next.date));

    if (upcoming.length === 0) { block.style.display = 'none'; return; }
    block.style.display = 'block';

    list.innerHTML = upcoming.map(d => {
        const dateObj = new Date(d.next.date + 'T00:00:00');
        const diffMs  = dateObj - today;
        const diffD   = Math.ceil(diffMs / 86400000);
        const countdownStr = diffD === 0 ? 'Vandaag' : diffD === 1 ? 'Morgen' : `over ${diffD} dagen`;
        const timingBadge = d.next.hour === 'bmo'
            ? `<span class="cijfer-badge bmo" style="font-size:0.6rem;padding:1px 6px;">Voor opening</span>`
            : d.next.hour === 'amc'
            ? `<span class="cijfer-badge amc" style="font-size:0.6rem;padding:1px 6px;">Na sluiting</span>`
            : '';
        const epsEstStr = d.next.epsEstimate != null ? `EPS est: <b>$${d.next.epsEstimate.toFixed(2)}</b>` : '';
        return `<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;background:var(--row-hover);">
            <div style="min-width:56px;text-align:center;">
                <div style="font-size:0.62rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;">${['zo','ma','di','wo','do','vr','za'][dateObj.getDay()]}</div>
                <div style="font-size:1.1rem;font-weight:800;line-height:1.1;">${dateObj.getDate()}</div>
                <div style="font-size:0.62rem;color:var(--text-muted);">${['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'][dateObj.getMonth()]}</div>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:800;font-size:0.88rem;">${d.name} <span style="font-size:0.68rem;font-weight:700;color:var(--text-muted);font-family:monospace;">${d.ticker}</span></div>
                <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px;">${epsEstStr}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:0.72rem;font-weight:700;color:var(--bolero);">${countdownStr}</div>
                ${timingBadge}
            </div>
        </div>`;
    }).join('');
}

// ── SURPRISE RANKING ──────────────────────────────────────────────────────
function renderSurpriseRanking() {
    const block = document.getElementById('surpriseRankingBlock');
    const inner = document.getElementById('surpriseRankingInner');
    if (!block || !inner) return;

    const beats = [], misses = [];
    cijferData.forEach(d => {
        if (!d.latest) return;
        const actual = d.latest.epsActual, est = d.latest.epsEstimate;
        if (actual == null || est == null) return;
        const diff = actual - est;
        const pct  = est !== 0 ? (diff / Math.abs(est)) * 100 : null;
        if (pct === null) return;
        const entry = { ticker: d.ticker, name: d.name, pct, diff };
        if (diff >= 0) beats.push(entry); else misses.push(entry);
    });

    beats.sort((a,b)  => b.pct - a.pct);
    misses.sort((a,b) => a.pct - b.pct);

    const maxPct = Math.max(...[...beats, ...misses].map(e => Math.abs(e.pct)), 1);

    const makeList = (items, isBeat) => {
        if (items.length === 0) return '<div style="color:var(--text-muted);font-size:0.8rem;">Geen data</div>';
        return items.slice(0, 6).map(e => {
            const barW = Math.min(Math.abs(e.pct) / maxPct * 100, 100);
            const sign = e.pct >= 0 ? '+' : '';
            const col  = isBeat ? 'var(--success)' : 'var(--danger)';
            const barCol = isBeat ? 'rgba(46,204,113,0.25)' : 'rgba(231,76,60,0.25)';
            return `<div style="margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:0.78rem;font-weight:700;">${e.name} <span style="font-size:0.65rem;color:var(--text-muted);font-family:monospace;">${e.ticker}</span></span>
                    <span style="font-size:0.78rem;font-weight:800;color:${col};">${sign}${e.pct.toFixed(1)}%</span>
                </div>
                <div style="height:6px;border-radius:3px;background:var(--border-color);overflow:hidden;">
                    <div style="height:100%;width:${barW}%;background:${col};border-radius:3px;transition:width 0.4s;"></div>
                </div>
            </div>`;
        }).join('');
    };

    if (beats.length === 0 && misses.length === 0) { block.style.display = 'none'; return; }
    block.style.display = 'block';

    inner.innerHTML = `
        <div>
            <div style="font-size:0.72rem;font-weight:800;text-transform:uppercase;color:var(--success);margin-bottom:10px;display:flex;align-items:center;gap:6px;">▲ Grootste Beats</div>
            ${makeList(beats, true)}
        </div>
        <div>
            <div style="font-size:0.72rem;font-weight:800;text-transform:uppercase;color:var(--danger);margin-bottom:10px;display:flex;align-items:center;gap:6px;">▼ Grootste Misses</div>
            ${makeList(misses, false)}
        </div>`;
}

// ── MAIN LOAD ─────────────────────────────────────────────────────────────
async function loadCijferData(manual = false) {
    const grid   = document.getElementById('cijferGrid');
    const status = document.getElementById('cijferStatus');
    if (status) status.textContent = '⏳ Ophalen…';
    if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">⏳ Cijfers laden…</div>`;

    const today = new Date();
    const fromD = new Date(today); fromD.setDate(fromD.getDate() - 180);
    const toD   = new Date(today); toD.setDate(toD.getDate() + 180);
    const fmt   = d => d.toISOString().split('T')[0];

    const stockTickers = hmStocks
        .filter(s => s.type === 'stock')
        .map(s => s.ticker.toUpperCase());

    if (stockTickers.length === 0) {
        if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">Geen aandelen in uw lijst.</div>`;
        return;
    }

    try {
        const r = await fetch(`https://finnhub.io/api/v1/calendar/earnings?from=${fmt(fromD)}&to=${fmt(toD)}&token=${FINNHUB_KEY}`);
        if (!r.ok) throw new Error(r.status);
        const data = await r.json();
        const mySet = new Set(stockTickers);

        const entries = (data.earningsCalendar || [])
            .filter(e => mySet.has((e.symbol||'').toUpperCase()))
            .sort((a, b) => b.date.localeCompare(a.date));

        const byTicker = {};
        entries.forEach(e => {
            const t = e.symbol.toUpperCase();
            if (!byTicker[t]) byTicker[t] = [];
            byTicker[t].push(e);
        });

        cijferData = stockTickers.map(ticker => {
            const stock    = hmStocks.find(s => s.ticker.toUpperCase() === ticker);
            const earns    = byTicker[ticker] || [];
            const reported = earns.filter(e => e.epsActual != null).sort((a,b)=>b.date.localeCompare(a.date));
            const upcoming = earns.filter(e => e.epsActual == null).sort((a,b)=>a.date.localeCompare(b.date));
            const latest   = reported[0] || null;
            const next     = upcoming[0] || null;
            // Attach all reported quarters for EPS history
            const allReported = reported;
            return { ticker, name: stock?.name || ticker, latest, next, allReported };
        }).sort((a,b) => {
            const aDate = a.latest?.date || a.next?.date || '0000';
            const bDate = b.latest?.date || b.next?.date || '0000';
            return bDate.localeCompare(aDate);
        });

        if (status) {
            const now = new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});
            status.textContent = `✓ Bijgewerkt · ${now}`;
        }
    } catch(e) {
        if (status) status.textContent = '⚠️ Fout bij ophalen';
        if (grid) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--danger);">Kon cijfers niet ophalen. Probeer opnieuw.</div>`;
        return;
    }

    populateCijferSectorFilter();
    renderCijferSummary();
    renderUpcomingBlock();
    renderSurpriseRanking();
    renderCijferGrid();
}

// Helper: parse YYYY-MM-DD date string
function parseEarningsDate(str) {
    if (!str) return null;
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
}

// Helper: surprise % voor sortering
function epsSurprisePct(d) {
    if (!d.latest || d.latest.epsActual == null || d.latest.epsEstimate == null) return null;
    const est = d.latest.epsEstimate;
    if (est === 0) return null;
    return ((d.latest.epsActual - est) / Math.abs(est)) * 100;
}

function renderCijferGrid() {
    const grid = document.getElementById('cijferGrid');
    if (!grid) return;

    let items = [...cijferData];
    if (cijferFilter === 'reported') items = items.filter(d => d.latest);
    if (cijferFilter === 'upcoming') items = items.filter(d => d.next);
    if (cijferSectorFilter !== 'all') {
        items = items.filter(d => {
            const t = (d.ticker || '').toUpperCase();
            const sec = (typeof SECTOR_MAP !== 'undefined' && SECTOR_MAP[t]) || 'Onbekend';
            return sec === cijferSectorFilter;
        });
    }

    // Sortering
    items.sort((a, b) => {
        if (cijferSort === 'ticker') return a.ticker.localeCompare(b.ticker);
        if (cijferSort === 'surprise_desc' || cijferSort === 'surprise_asc') {
            const sa = epsSurprisePct(a);
            const sb = epsSurprisePct(b);
            const va = sa == null ? -Infinity : sa;
            const vb = sb == null ? -Infinity : sb;
            return cijferSort === 'surprise_desc' ? vb - va : va - vb;
        }
        // Datum sortering
        const aDate = a.next?.date || a.latest?.date || '0000';
        const bDate = b.next?.date || b.latest?.date || '0000';
        if (cijferSort === 'date_desc') return bDate.localeCompare(aDate);
        // date_asc — toekomstige eerst, dan recent gerapporteerde
        const today = new Date().toISOString().split('T')[0];
        const aIsFuture = a.next && a.next.date >= today;
        const bIsFuture = b.next && b.next.date >= today;
        if (aIsFuture && !bIsFuture) return -1;
        if (!aIsFuture && bIsFuture) return 1;
        if (aIsFuture && bIsFuture) return aDate.localeCompare(bDate);
        return bDate.localeCompare(aDate);
    });

    if (items.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">Geen cijfers gevonden voor dit filter.</div>`;
        return;
    }

    const today = new Date(); today.setHours(0,0,0,0);

    grid.innerHTML = items.map(d => {
        const e = d.latest || d.next;
        const isReported = !!d.latest;
        const isUpcoming = !d.latest && !!d.next;
        const cardClass  = isReported ? 'reported' : isUpcoming ? 'upcoming' : 'no-data';

        if (!e) {
            return `<div class="cijfer-card no-data" onclick="openEpsPopup('${d.ticker}','${d.name.replace(/'/g,"\\'")}')">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div>
                        <div class="cijfer-ticker">${d.ticker}</div>
                        <div class="cijfer-name">${d.name}</div>
                    </div>
                </div>
                <div style="color:var(--text-muted);font-size:0.78rem;margin-top:10px;">Geen earnings data in dit bereik.</div>
            </div>`;
        }

        const fmtEps = v => v != null ? v.toFixed(2) : '–';
        const fmtRev = v => {
            if (v == null) return '–';
            if (v >= 1e9) return '$' + (v/1e9).toFixed(2) + 'B';
            if (v >= 1e6) return '$' + (v/1e6).toFixed(1) + 'M';
            return '$' + v.toLocaleString();
        };

        const dateStr = formatEarningsDate(e.date);
        const timingBadge = e.hour === 'bmo'
            ? `<span class="cijfer-badge bmo">Voor opening</span>`
            : e.hour === 'amc'
            ? `<span class="cijfer-badge amc">Na sluiting</span>`
            : '';

        // Mini EPS sparkline + beat/miss streak (laatste 4 kwartalen)
        let trendHtml = '';
        const hist = (d.allReported || []).slice(0, 4).reverse();
        if (hist.length >= 2) {
            const vals = hist.map(q => q.epsActual);
            const maxV = Math.max(...vals.map(Math.abs), 0.01);
            const bars = vals.map(v => {
                const h = Math.round(Math.min(Math.abs(v)/maxV * 24, 24));
                const col = v >= 0 ? '#2ecc71' : '#e74c3c';
                return `<div style="width:8px;height:${h}px;background:${col};border-radius:2px 2px 0 0;align-self:flex-end;opacity:0.85;"></div>`;
            }).join('');
            // Beat/miss streak dots
            const streakDots = hist.map(q => {
                if (q.epsActual == null || q.epsEstimate == null) {
                    return `<span style="width:8px;height:8px;border-radius:50%;background:var(--border-color);display:inline-block;" title="${q.date}: geen data"></span>`;
                }
                const beat = q.epsActual >= q.epsEstimate;
                const col = beat ? '#2ecc71' : '#e74c3c';
                const lbl = beat ? 'Beat' : 'Miss';
                return `<span style="width:8px;height:8px;border-radius:50%;background:${col};display:inline-block;" title="${q.date}: ${lbl}"></span>`;
            }).join('');
            trendHtml = `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:10px;padding-top:8px;border-top:1px solid var(--border-color);">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="font-size:0.6rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);">EPS ${hist.length}Q</div>
                    <div style="display:flex;gap:3px;align-items:flex-end;height:24px;">${bars}</div>
                </div>
                <div style="display:flex;gap:4px;align-items:center;" title="Laatste ${hist.length} kwartalen: groen = beat, rood = miss">
                    ${streakDots}
                </div>
            </div>`;
        }

        // ── AANKOMENDE CIJFERS — countdown + verwachting prominent ─────────
        if (isUpcoming) {
            const dateObj = parseEarningsDate(e.date);
            const diffD = Math.ceil((dateObj - today) / 86400000);
            const cdLabel = diffD === 0 ? 'vandaag'
                          : diffD === 1 ? 'morgen'
                          : diffD < 0   ? `${-diffD} dgn geleden`
                          : `${diffD} dgn`;
            const cdClass = diffD === 0 ? 'today' : diffD <= 7 && diffD > 0 ? 'soon' : '';
            const cdNum = diffD === 0 ? 'NU' : diffD === 1 ? '1' : diffD < 0 ? '!' : `${diffD}`;
            const cdSub = diffD === 0 ? 'vandaag' : diffD === 1 ? 'morgen' : diffD < 0 ? 'late' : 'dagen';

            // Last reported reference
            let lastRef = '';
            if (d.allReported && d.allReported.length > 0) {
                const last = d.allReported[0];
                const lDate = formatEarningsDate(last.date);
                const surprise = (last.epsActual != null && last.epsEstimate != null && last.epsEstimate !== 0)
                    ? ((last.epsActual - last.epsEstimate) / Math.abs(last.epsEstimate)) * 100
                    : null;
                const sBadge = surprise != null
                    ? `<span class="cijfer-surprise ${surprise >= 0 ? 'beat' : 'miss'}" style="font-size:0.62rem;padding:1px 6px;">${surprise >= 0 ? '▲' : '▼'} ${Math.abs(surprise).toFixed(1)}%</span>`
                    : '';
                lastRef = `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:6px;">Vorig kwartaal: ${lDate} ${sBadge}</div>`;
            }

            return `<div class="cijfer-card ${cardClass}" onclick="openEpsPopup('${d.ticker}','${d.name.replace(/'/g,"\\'")}')" title="Klik voor EPS trend & consensus">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                    <div style="min-width:0;flex:1;">
                        <div class="cijfer-ticker">${d.ticker}</div>
                        <div class="cijfer-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.name}</div>
                    </div>
                    <div class="cijfer-countdown ${cdClass}">
                        <span class="cd-num">${cdNum}</span>
                        <span class="cd-lbl">${cdSub}</span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-top:8px;font-size:0.78rem;color:var(--text-muted);">
                    📆 ${dateStr} ${timingBadge}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;border-top:1px solid var(--border-color);padding-top:10px;">
                    <div class="cijfer-metric-block">
                        <div class="cijfer-metric-label">EPS verwacht</div>
                        <div class="cijfer-metric-value">${fmtEps(e.epsEstimate)}</div>
                        <div class="cijfer-metric-sub">consensus</div>
                    </div>
                    <div class="cijfer-metric-block">
                        <div class="cijfer-metric-label">Omzet verwacht</div>
                        <div class="cijfer-metric-value">${fmtRev(e.revenueEstimate)}</div>
                    </div>
                </div>
                ${lastRef}
                ${trendHtml}
            </div>`;
        }

        // ── GERAPPORTEERDE CIJFERS — beat/miss banner prominent ────────────
        const epsActual = e.epsActual;
        const epsEst    = e.epsEstimate;
        const revActual = e.revenueActual;
        const revEst    = e.revenueEstimate;

        // Beat/miss banner
        let bannerHtml = '';
        if (epsActual != null && epsEst != null) {
            const diff = epsActual - epsEst;
            const pct = epsEst !== 0 ? (diff / Math.abs(epsEst)) * 100 : 0;
            const isBeat = diff >= 0;
            const sign = isBeat ? '+' : '';
            bannerHtml = `<div class="cijfer-banner ${isBeat ? 'beat' : 'miss'}">
                <div>
                    <div class="cb-label">${isBeat ? '▲ EPS BEAT' : '▼ EPS MISS'}</div>
                    <div style="font-size:0.7rem;opacity:0.75;margin-top:2px;">$${fmtEps(epsActual)} vs $${fmtEps(epsEst)}</div>
                </div>
                <div class="cb-value">${sign}${pct.toFixed(1)}%</div>
            </div>`;
        }

        // YoY EPS groei (huidige Q vs zelfde Q vorig jaar — 4 kwartalen terug in allReported)
        let yoyHtml = '';
        if (d.allReported && d.allReported.length >= 5 && epsActual != null) {
            // allReported is gesorteerd nieuwste eerst — index 0 = laatste, index 4 = 4 kwartalen geleden
            const yearAgo = d.allReported[4];
            if (yearAgo && yearAgo.epsActual != null && yearAgo.epsActual !== 0) {
                const yoyPct = ((epsActual - yearAgo.epsActual) / Math.abs(yearAgo.epsActual)) * 100;
                const sign = yoyPct >= 0 ? '+' : '';
                const col = yoyPct >= 0 ? 'var(--success)' : 'var(--danger)';
                yoyHtml = `<div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;font-size:0.7rem;color:var(--text-muted);">
                    <span>EPS YoY</span>
                    <span style="color:${col};font-weight:800;">${sign}${yoyPct.toFixed(1)}%</span>
                </div>`;
            }
        }

        // Revenue surprise badge
        let revBadge = '';
        if (revActual != null && revEst != null && revEst !== 0) {
            const diff = revActual - revEst;
            const pct = (diff / revEst) * 100;
            const isBeat = diff >= 0;
            revBadge = `<span class="cijfer-surprise ${isBeat ? 'beat' : 'miss'}" style="font-size:0.65rem;padding:1px 6px;">
                ${isBeat ? '▲' : '▼'} Rev ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%
            </span>`;
        }

        // Volgende rapport (als bekend)
        let nextHtml = '';
        if (d.next) {
            const nextDate = formatEarningsDate(d.next.date);
            const nextEps  = d.next.epsEstimate != null ? `$${d.next.epsEstimate.toFixed(2)}` : '–';
            nextHtml = `<div style="margin-top:10px;padding-top:8px;border-top:1px dashed var(--border-color);font-size:0.72rem;color:var(--text-muted);">
                📅 Volgend: <strong style="color:var(--bolero);">${nextDate}</strong> · EPS est: <strong>${nextEps}</strong>
            </div>`;
        }

        return `<div class="cijfer-card ${cardClass}" onclick="openEpsPopup('${d.ticker}','${d.name.replace(/'/g,"\\'")}')" title="Klik voor EPS trend & consensus">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                <div style="min-width:0;flex:1;">
                    <div class="cijfer-ticker">${d.ticker}</div>
                    <div class="cijfer-name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${d.name}</div>
                </div>
                <span style="font-size:0.62rem;font-weight:800;padding:3px 8px;border-radius:99px;background:rgba(46,204,113,0.15);color:var(--success);white-space:nowrap;">✓ Q-rapport</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:6px;font-size:0.75rem;color:var(--text-muted);">
                📆 ${dateStr} ${timingBadge}
            </div>
            ${bannerHtml}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:0.75rem;">
                <div>
                    <div class="cijfer-metric-label">Omzet actueel</div>
                    <div style="font-weight:800;font-size:0.95rem;">${fmtRev(revActual)}</div>
                    ${revBadge}
                </div>
                <div>
                    <div class="cijfer-metric-label">Omzet verwacht</div>
                    <div style="font-weight:600;font-size:0.85rem;color:var(--text-muted);">${fmtRev(revEst)}</div>
                </div>
            </div>
            ${yoyHtml}
            ${trendHtml}
            ${nextHtml}
        </div>`;
    }).join('');
}

function formatEarningsDate(dateStr) {
    if (!dateStr) return '–';
    const [y, m, d] = dateStr.split('-').map(Number);
    const maanden = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
    return `${d} ${maanden[m-1]} ${y}`;
}

// ════════════════════════════════════════════════════════════════════════════
// AANDELEN & CRYPTO PORTFOLIO PAGINA'S
// ════════════════════════════════════════════════════════════════════════════

// Cache voor sectoren (Finnhub fallback) — v2 key, oude 'Onbekend' cache wordt genegeerd
let _sectorCache = JSON.parse(localStorage.getItem('hm_sector_cache_v2') || '{}');
function saveSectorCache() { localStorage.setItem('hm_sector_cache_v2', JSON.stringify(_sectorCache)); }

// Vooraf gedefinieerde categorieën voor crypto's
const CRYPTO_CATEGORIES = {
    'BTC': 'Layer 1', 'BTC-USD': 'Layer 1',
    'ETH': 'Layer 1', 'ETH-USD': 'Layer 1',
    'SOL': 'Layer 1', 'SOL-USD': 'Layer 1',
    'AVAX': 'Layer 1', 'AVAX-USD': 'Layer 1',
    'BNB': 'Layer 1', 'BNB-USD': 'Layer 1',
    'ADA': 'Layer 1', 'ADA-USD': 'Layer 1',
    'AAVE': 'DeFi', 'AAVE-USD': 'DeFi',
    'UNI': 'DeFi', 'UNI-USD': 'DeFi',
    'HYPE': 'DeFi', 'HYPE-USD': 'DeFi',
    'RNDR': 'AI', 'RNDR-USD': 'AI',
    'TAO': 'AI', 'TAO-USD': 'AI',
    'FET': 'AI', 'FET-USD': 'AI',
    'LINK': 'Infrastructuur', 'LINK-USD': 'Infrastructuur',
    'DOT': 'Infrastructuur', 'DOT-USD': 'Infrastructuur',
};

function getCryptoCategory(ticker) {
    const t = (ticker || '').toUpperCase();
    return CRYPTO_CATEGORIES[t] || 'Andere';
}

// ── HARDCODED SECTOR MAP voor de portfolio tickers ─────────────────────────
// Gebaseerd op Yahoo Finance / GICS classificatie
const SECTOR_MAP = {
    // Technology
    'NVDA':'Technology','MSFT':'Technology','GOOGL':'Communicatie',
    'CRM':'Technology','CRDO':'Technology','SOI.PA':'Technology','OUST':'Technology',
    'IONQ':'Technology','QBTS':'Technology','APLD':'Technology','CRWV':'Technology',
    'IREN':'Technology',
    // Crypto / Mining
    'BMNR':'Crypto / Mining','SBET':'Crypto / Mining',
    'CIFR':'Crypto / Mining','CLSK':'Crypto / Mining','BKKT':'Crypto / Mining',
    'CRCL':'Crypto / Mining',
    // Financials / FinTech
    'PYPL':'FinTech','SOFI':'FinTech','LMND':'FinTech',
    // Healthcare / Biotech
    'ABCL':'Healthcare','MRLN':'Healthcare','RXRX':'Healthcare',
    // Consumer / Mobility
    'AMZN':'Consumer','UBER':'Consumer','JD':'Consumer','XPEV':'Consumer',
    // Industrials / Robotics
    'ACHR':'Industrials','SYM':'Industrials','RR':'Industrials','ZENA':'Industrials',
    // Energy / Materials
    'KEEL':'Energy / Materials','TOYO':'Energy / Materials',
    'UAMY':'Energy / Materials','ABAT':'Energy / Materials',
    // ETFs
    '2B76.DE':'ETF — Thema','DAPP.MI':'ETF — Thema','REMX.MI':'ETF — Thema',
    'SMH.MI':'ETF — Thema','3HCL.L':'ETF — Grondstof','SGLD.MI':'ETF — Grondstof',
};

// Sector ophalen: hardcoded map → cache → Finnhub fallback → 'Onbekend'
async function fetchSector(ticker, type) {
    if (type === 'option') return 'Opties';
    const t = (ticker || '').toUpperCase();
    if (SECTOR_MAP[t]) return SECTOR_MAP[t];
    if (_sectorCache[t] && _sectorCache[t] !== 'Onbekend') return _sectorCache[t];
    // Finnhub /stock/profile2 — werkt vooral voor US tickers
    try {
        const r = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(t)}&token=${FINNHUB_KEY}`);
        if (r.ok) {
            const d = await r.json();
            const sec = d?.finnhubIndustry || d?.gsubind || null;
            if (sec) {
                _sectorCache[t] = sec;
                saveSectorCache();
                return sec;
            }
        }
    } catch {}
    _sectorCache[t] = 'Onbekend';
    saveSectorCache();
    return 'Onbekend';
}

// EUR/USD wisselkoers cache (5 min)
let _usdEurCache = null, _usdEurTime = 0;
async function getUsdEurRate() {
    if (_usdEurCache && Date.now() - _usdEurTime < 300000) return _usdEurCache;
    try {
        const r = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await r.json();
        const rate = data?.rates?.EUR;
        if (rate) {
            _usdEurCache = rate;
            _usdEurTime = Date.now();
            return rate;
        }
    } catch {}
    return _usdEurCache || 0.92;
}

// Detecteer Europese beurs-ticker (heeft exchange-suffix: .PA, .DE, .MI, .L, enz.)
function isEuropeanTicker(ticker) {
    return /\.[A-Z]{1,4}$/.test(ticker);
}

// Algemene quote loader:
// - Europese tickers (.PA/.DE/.MI/.L) → Yahoo (source: 'yahoo', paarse bol)
// - Amerikaanse tickers → Finnhub (source: 'finnhub', groene bol)
async function loadQuoteForPosition(s) {
    if (s.type === 'crypto') {
        const sym = s.ticker.toUpperCase().replace(/-USD$/, '') + 'USDT';
        let q = await binanceQuote(sym).catch(() => null);
        if (!q) q = await fhQuote('BINANCE:' + sym).catch(() => null);
        return q;
    }
    // Europese ticker → Yahoo (nauwkeurigheid is hier beperkt maar er is geen alternatief)
    if (isEuropeanTicker(s.ticker)) {
        return await yhQuote(s.ticker).catch(() => null);
    }
    // Amerikaanse ticker → Finnhub (direct, nauwkeurige dag%)
    return await fhQuote(s.ticker).catch(() => null);
}

// Quote-cache: voorkomt herhaaldelijk ophalen bij snel refreshen (55s TTL)
const _quoteCache = new Map();
const QUOTE_CACHE_TTL = 55000;

async function loadQuoteCached(s) {
    const key = (s.ticker || '') + '|' + (s.type || '');
    const hit = _quoteCache.get(key);
    if (hit && Date.now() - hit.ts < QUOTE_CACHE_TTL) return hit.q;
    const q = await loadQuoteForPosition(s);
    if (q && q.price > 0) {
        _quoteCache.set(key, { q, ts: Date.now() });
        return q;
    }
    // Stale fallback: als verse fetch mislukt, gebruik verouderde cache zodat prijzen niet verdwijnen
    if (hit && hit.q && hit.q.price > 0) return hit.q;
    return q;
}

// Gebatcht laden: max 8 tegelijk, 50ms pauze tussen batches → sneller laden, vermijdt burst rate-limit
async function loadAllQuotesBatched(positions) {
    const BATCH = 8;
    const results = [];
    for (let i = 0; i < positions.length; i += BATCH) {
        const batch = positions.slice(i, i + BATCH);
        const batchResults = await Promise.all(batch.map(s => loadQuoteCached(s)));
        results.push(...batchResults);
        if (i + BATCH < positions.length) await new Promise(r => setTimeout(r, 50));
    }
    return results;
}

function fmtEuroAlt(v, dec = 2) {
    if (v == null || isNaN(v)) return '–';
    return '€ ' + v.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function plChip(pct, txt) {
    const c = pct == null || isNaN(pct) ? 'var(--text-muted)' : pct >= 0 ? 'var(--success)' : 'var(--danger)';
    const s = pct >= 0 ? '+' : '';
    return `<span style="color:${c};font-weight:800;">${s}${(txt ?? pct.toFixed(2) + '%')}</span>`;
}

function sectorColor(idx) {
    const palette = ['#3498db','#e67e22','#2ecc71','#9b59b6','#f1c40f','#e74c3c','#1abc9c','#34495e','#d35400','#16a085'];
    return palette[idx % palette.length];
}

// ── AANDELEN PORTFOLIO ──────────────────────────────────────────────────────
let _apBrokerFilter = 'all'; // 'all' | 'Bolero' | 'Degiro' | 'Saxo'

function setApBroker(broker, btn) {
    _apBrokerFilter = broker;
    document.querySelectorAll('#aandelen-portfolio-page .ap-broker-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    // Update accent kleur attribuut op de pagina
    const pg = document.getElementById('aandelen-portfolio-page');
    if (pg) {
        if (broker === 'all') pg.removeAttribute('data-broker');
        else pg.setAttribute('data-broker', broker);
    }
    // Hergebruik bestaande koersen als die al geladen zijn — geen nieuwe API-calls
    if (_apLastEnriched) {
        renderApFromEnriched(_apLastEnriched);
    } else {
        initAandelenPortfolio();
    }
}

// Rendert de LIVE pagina opnieuw op basis van al-geladen koersen — geen API-calls
function renderApFromEnriched(allEnriched) {
    const broker = _apBrokerFilter;
    const enriched = broker === 'all'
        ? allEnriched
        : allEnriched.filter(p => (p.broker || 'Degiro') === broker);

    const cashEur        = getCashForBroker(broker);
    const cashEl         = document.getElementById('ap-cash');
    if (cashEl) cashEl.textContent = fmtEuroAlt(cashEur);
    renderCashEditor();

    const positionsValue = enriched.reduce((a, x) => a + x.valueEur, 0);
    const totalCost      = enriched.reduce((a, x) => a + x.costEur,  0);
    const totalValue     = positionsValue + cashEur;
    const totalPL        = positionsValue - totalCost;
    const dayPL          = enriched.reduce((a, x) => a + x.dayPLEur, 0);

    document.getElementById('ap-totalValue').textContent = fmtEuroAlt(totalValue);
    const stortingEur = getStortingForBroker(broker);
    const cashLine = cashEur > 0 ? ` &nbsp;·&nbsp; Cash: ${fmtEuroAlt(cashEur)}` : '';
    document.getElementById('ap-totalCost').innerHTML = 'Gestort: ' + fmtEuroAlt(stortingEur) + cashLine;

    const tplEl = document.getElementById('ap-totalPL');
    tplEl.textContent = (totalPL >= 0 ? '+' : '') + fmtEuroAlt(totalPL);
    tplEl.style.color = totalPL >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('ap-totalPLPct').innerHTML = plChip(totalCost > 0 ? (totalPL / totalCost) * 100 : 0);
    const dplEl = document.getElementById('ap-dayPL');
    dplEl.textContent = (dayPL >= 0 ? '+' : '') + fmtEuroAlt(dayPL);
    dplEl.style.color = dayPL >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('ap-dayPLPct').innerHTML = plChip(positionsValue > 0 ? (dayPL / (positionsValue - dayPL)) * 100 : 0);

    const stockCnt = enriched.filter(x => x.type === 'stock').length;
    const etfCnt   = enriched.filter(x => x.type === 'etf').length;
    document.getElementById('ap-positions').textContent = `${enriched.length}`;
    document.getElementById('ap-positionsBreakdown').textContent = `${stockCnt} aandelen · ${etfCnt} ETFs`;

    const sortedByPct = [...enriched].filter(x => x.plPct != null).sort((a, b) => b.plPct - a.plPct);
    const renderTopList = (items, isBest) => {
        if (items.length === 0) return '<div class="ap-toplist-empty">Geen data</div>';
        return items.map((p, i) => {
            const col = isBest ? 'var(--success)' : 'var(--danger)';
            const sign = p.plPct >= 0 ? '+' : '';
            return `<div class="ap-toplist-row" title="${p.name}">
                <span class="ap-toplist-rank">${i + 1}.</span>
                <span class="ap-toplist-ticker">${p.ticker}</span>
                <span class="ap-toplist-eur blur-target">${p.plEur >= 0 ? '+' : ''}${fmtEuroAlt(p.plEur, 0)}</span>
                <span class="ap-toplist-pct" style="color:${col};">${sign}${p.plPct.toFixed(2)}%</span>
            </div>`;
        }).join('');
    };
    const bestEl  = document.getElementById('ap-bestList');
    const worstEl = document.getElementById('ap-worstList');
    if (bestEl)  bestEl.innerHTML  = renderTopList(sortedByPct.filter(x => x.plPct > 0).slice(0, 5), true);
    if (worstEl) worstEl.innerHTML = renderTopList(sortedByPct.filter(x => x.plPct < 0).slice(-5).reverse(), false);

    _apLastTotalValue = positionsValue;
    renderSectorPie(enriched, positionsValue);
    renderBySector('ap-bySector', enriched, positionsValue, false);
    renderAllPositions(enriched, positionsValue);
}

// Cash per broker — eigen state op AANDELEN pagina (los van DATA → CASH pagina)
// Default voorgevulde waarden (v2 key zodat oude lege state overschreven wordt)
let _apCash = JSON.parse(localStorage.getItem('ap_cash_v3') || 'null') || { Bolero: 21, Degiro: 5174, Saxo: 2106 };
function saveApCash() { localStorage.setItem('ap_cash_v3', JSON.stringify(_apCash)); }

function getCashForBroker(broker) {
    if (broker === 'all') {
        return (_apCash.Bolero || 0) + (_apCash.Degiro || 0) + (_apCash.Saxo || 0);
    }
    return _apCash[broker] || 0;
}

function setApCashFor(broker, val) {
    _apCash[broker] = parseFloat(val) || 0;
    saveApCash();
    initAandelenPortfolio();
}

// Netto gestort per broker vanuit TEST DATA (stortingen − opnames)
function getTdNetStorting(broker) {
    const brokers = broker === 'all' ? ['Bolero','Degiro','Saxo'] : [broker];
    return brokers.reduce((s, b) =>
        s + tdCashflows.filter(c => c.broker === b)
                       .reduce((a, c) => a + (c.type === 'storting' ? c.amountEur : -c.amountEur), 0)
    , 0);
}

// Storting per broker — leest uit cashData (DATA → STORTING pagina)
function getStortingForBroker(broker) {
    if (typeof cashData === 'undefined' || !Array.isArray(cashData)) return 0;
    if (broker === 'all') {
        return cashData.reduce((a, c) => a + (c.amount || 0), 0);
    }
    const entry = cashData.find(c => c.broker === broker);
    return entry ? (entry.amount || 0) : 0;
}

function brokerColorVar(broker) {
    if (broker === 'Bolero') return 'var(--bolero)';
    if (broker === 'Degiro') return 'var(--degiro)';
    if (broker === 'Saxo')   return 'var(--saxo)';
    return 'var(--total-gray)';
}

// Render cash editor in CASH card
function renderCashEditor() {
    const editor = document.getElementById('ap-cashEditor');
    const cashEl = document.getElementById('ap-cash');
    if (!editor) return;
    if (_apBrokerFilter === 'all') {
        // Show sum + 3 read-only broker rows (bewerken via broker tabs)
        if (cashEl) cashEl.style.display = '';
        editor.innerHTML = ['Bolero', 'Degiro', 'Saxo'].map(b => `
            <div class="ap-cash-row">
                <span class="ap-cash-broker" style="background:${brokerColorVar(b)};"></span>
                <span class="ap-cash-label">${b}</span>
                <span class="ap-cash-readonly blur-target">${fmtEuroAlt(_apCash[b] || 0)}</span>
            </div>
        `).join('');
    } else {
        // Hide static value, show inline editable big input as the prominent figure
        if (cashEl) cashEl.style.display = 'none';
        editor.innerHTML = `
            <div class="ap-cash-big-wrap">
                <span class="ap-cash-prefix">€</span>
                <input class="ap-cash-input-big blur-target" type="number" step="0.01" min="0" value="${_apCash[_apBrokerFilter] || 0}" onchange="setApCashFor('${_apBrokerFilter}', this.value)" placeholder="0,00">
            </div>
            <div class="ap-card-sub" style="margin-top:4px;">${_apBrokerFilter}</div>
        `;
    }
}

// State voor sortbare kolommen
let _apSortKey = 'valueEur';
let _apSortDir = 'desc'; // 'asc' | 'desc'

function setApSort(key) {
    if (_apSortKey === key) {
        _apSortDir = _apSortDir === 'asc' ? 'desc' : 'asc';
    } else {
        _apSortKey = key;
        _apSortDir = 'desc';
    }
    // Re-render zonder opnieuw quotes te halen
    if (_apLastEnriched && _apLastTotalValue != null) {
        if (_apPositionsView === 'sector') {
            renderBySector('ap-bySector', _apLastEnriched, _apLastTotalValue, false);
        } else {
            renderAllPositions(_apLastEnriched, _apLastTotalValue);
        }
    }
}

// View toggle: 'sector' (per sector groepering) of 'all' (alle posities in 1 tabel)
let _apPositionsView = 'sector';

function setApPositionsView(view, btn) {
    _apPositionsView = view;
    document.querySelectorAll('#aandelen-portfolio-page .ap-view-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('ap-positionsTitle').textContent = view === 'sector' ? 'POSITIES PER SECTOR' : 'ALLE POSITIES';
    document.getElementById('ap-bySector').style.display     = view === 'sector' ? '' : 'none';
    document.getElementById('ap-allPositions').style.display = view === 'all'    ? '' : 'none';
    if (_apLastEnriched && _apLastTotalValue != null) {
        if (view === 'sector') {
            renderBySector('ap-bySector', _apLastEnriched, _apLastTotalValue, false);
        } else {
            renderAllPositions(_apLastEnriched, _apLastTotalValue);
        }
    }
}

// Render alle posities in één tabel met % van portfolio kolom
function renderAllPositions(positions, totalValue, containerId, sortOpts) {
    containerId = containerId || 'ap-allPositions';
    const sk  = sortOpts ? sortOpts.key : _apSortKey;
    const sd  = sortOpts ? sortOpts.dir : _apSortDir;
    const sfn = sortOpts ? sortOpts.fn  : 'setApSort';
    const el = document.getElementById(containerId);
    if (!el) return;

    // Sorteren
    const sorted = [...positions];
    if (sk) {
        sorted.sort((a, b) => {
            let av = a[sk], bv = b[sk];
            if (sk === 'ticker' || sk === 'name' || sk === 'sector') {
                av = (av || '').toString().toLowerCase();
                bv = (bv || '').toString().toLowerCase();
                return sd === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            if (av == null) av = -Infinity;
            if (bv == null) bv = -Infinity;
            return sd === 'asc' ? av - bv : bv - av;
        });
    }

    const arrow = (k) => sk === k ? `<span class="ap-sort-arrow">${sd === 'asc' ? '▲' : '▼'}</span>` : '';
    const thBase = 'padding:6px;border-bottom:1px solid var(--border-color);';
    const mkTh = (key, label, align) => {
        const cls = `ap-sort-th${sk === key ? ' active' : ''}`;
        return `<th class="${cls}" onclick="${sfn}('${key}')" style="${thBase}${align ? 'text-align:'+align+';' : ''}">${label}${arrow(key)}</th>`;
    };

    let html = `<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <table class="ap-positions-table" style="width:100%;min-width:980px;border-collapse:collapse;font-size:0.8rem;table-layout:fixed;">
            <colgroup>
                <col style="width:78px;">
                <col style="min-width:140px;">
                <col style="width:110px;">
                <col style="width:70px;">
                <col style="width:80px;">
                <col style="width:115px;">
                <col style="width:80px;">
                <col style="width:115px;">
                <col style="width:80px;">
                <col style="width:75px;">
            </colgroup>
            <thead><tr style="text-align:left;color:var(--text-muted);font-size:0.65rem;">
                ${mkTh('ticker', 'TICKER', 'left')}
                ${mkTh('name', 'NAAM', 'left')}
                ${mkTh('sector', 'SECTOR', 'left')}
                ${mkTh('aantal', 'AANTAL', 'right')}
                ${mkTh('price', 'PRIJS', 'right')}
                ${mkTh('valueEur', 'WAARDE €', 'right')}
                <th style="${thBase}text-align:right;">% PORT.</th>
                ${mkTh('plEur', 'P/L €', 'right')}
                ${mkTh('plPct', 'P/L %', 'right')}
                ${mkTh('dayPLPct', 'DAG %', 'right')}
            </tr></thead>
            <tbody>`;

    sorted.forEach(p => {
        const noQ   = p.noQuote;
        const plCol = noQ || p.plPct == null ? 'var(--text-muted)' : p.plEur >= 0 ? 'var(--success)' : 'var(--danger)';
        const dpCol = p.dayPLPct == null ? 'var(--text-muted)' : p.dayPLPct >= 0 ? 'var(--success)' : 'var(--danger)';
        const cur = (p.currency || 'USD').toUpperCase();
        const curSym = cur === 'EUR' ? '€' : '$';
        const dec = p.price < 1 ? 4 : 2;
        const cellBase = 'padding:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        const portPct = totalValue > 0 && !noQ ? (p.valueEur / totalValue) * 100 : 0;
        const priceStr = noQ ? '<span style="color:var(--text-muted)">–</span>' : `${curSym}${p.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: dec })}`;
        const sourceCol = p.q?.source === 'yahoo' ? '#9b59b6' : p.q?.source === 'finnhub' ? 'var(--success)' : null;
        const sourceTitle = p.q?.source === 'yahoo' ? 'Koers via Yahoo Finance' : p.q?.source === 'finnhub' ? 'Koers via Finnhub' : '';
        const yahooTag = sourceCol && !p.noQuote
            ? `<span title="${sourceTitle}" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${sourceCol};margin-right:5px;vertical-align:middle;flex-shrink:0;"></span>`
            : '';

        html += `<tr style="border-bottom:1px solid var(--border-color);">
            <td style="${cellBase}font-weight:700;font-family:monospace;">${yahooTag}${p.ticker}</td>
            <td style="${cellBase}" title="${p.name}">${p.name}</td>
            <td style="${cellBase}color:var(--text-muted);" title="${p.sector}">${p.sector}</td>
            <td style="${cellBase}text-align:right;">${(p.aantal || 0).toLocaleString('nl-NL', { maximumFractionDigits: 8 })}</td>
            <td style="${cellBase}text-align:right;">${priceStr}</td>
            <td class="blur-target" style="${cellBase}text-align:right;font-weight:700;">${noQ ? '<span style="color:var(--text-muted)">–</span>' : fmtEuroAlt(p.valueEur)}</td>
            <td style="${cellBase}text-align:right;font-weight:700;">${noQ ? '–' : portPct.toFixed(2) + '%'}</td>
            <td class="blur-target" style="${cellBase}text-align:right;color:${plCol};font-weight:700;">${noQ ? '–' : (p.plEur >= 0 ? '+' : '') + fmtEuroAlt(p.plEur)}</td>
            <td style="${cellBase}text-align:right;color:${plCol};font-weight:800;">${p.plPct == null ? '–' : (p.plPct >= 0 ? '+' : '') + p.plPct.toFixed(2) + '%'}</td>
            <td style="${cellBase}text-align:right;color:${dpCol};font-weight:700;">${p.dayPLPct == null ? '–' : (p.dayPLPct >= 0 ? '+' : '') + p.dayPLPct.toFixed(2) + '%'}</td>
        </tr>`;
    });

    html += `</tbody></table></div>`;
    el.innerHTML = html;
}

let _apLastEnriched = null;
let _apLastTotalValue = null;

async function initAandelenPortfolio(force = false) {
    const status = document.getElementById('aandelenPfStatus');
    // Bij auto-refresh (force=true) de huidige status laten staan zodat groen niet
    // plots naar oranje springt. Alleen bij eerste lading "⏳ Laden…" tonen.
    if (status && !force) status.textContent = '⏳ Laden…';

    // Sync active state van broker tabs + accent attribuut
    document.querySelectorAll('#aandelen-portfolio-page .ap-broker-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.broker === _apBrokerFilter);
    });
    const pg = document.getElementById('aandelen-portfolio-page');
    if (pg) {
        if (_apBrokerFilter === 'all') pg.removeAttribute('data-broker');
        else pg.setAttribute('data-broker', _apBrokerFilter);
    }

    // Annuleer lopende retry-timers
    if (_apRetryTimeout) { clearTimeout(_apRetryTimeout); _apRetryTimeout = null; }
    // Cache NIET forceren wissen bij auto-refresh: de 55s TTL doet dit automatisch.
    // Entries die recent geladen zijn (bv. via retry) blijven zo onnodig intact.

    // Posities = stock + etf (alleen die met aantal > 0), gefilterd op gekozen broker
    let positions = hmStocks.filter(s => (s.type === 'stock' || s.type === 'etf') && (s.aantal || 0) > 0);
    if (_apBrokerFilter !== 'all') {
        positions = positions.filter(s => (s.broker || 'Degiro') === _apBrokerFilter);
    }

    // Cash van de gekozen broker (of totaal) + render editor
    const cashEur = getCashForBroker(_apBrokerFilter);
    const cashEl  = document.getElementById('ap-cash');
    if (cashEl) cashEl.textContent = fmtEuroAlt(cashEur);
    renderCashEditor();

    if (positions.length === 0) {
        const totalCard = document.getElementById('ap-totalValue');
        if (totalCard) totalCard.textContent = fmtEuroAlt(cashEur);
        document.getElementById('ap-totalCost').textContent = 'Gestort: ' + fmtEuroAlt(getStortingForBroker(_apBrokerFilter));
        ['ap-totalPL','ap-totalPLPct','ap-dayPL','ap-dayPLPct','ap-positions','ap-positionsBreakdown']
            .forEach(id => { const e = document.getElementById(id); if (e) e.textContent = '–'; });
        const emptyList = '<div class="ap-toplist-empty">Geen posities</div>';
        const bl = document.getElementById('ap-bestList');  if (bl) bl.innerHTML = emptyList;
        const wl = document.getElementById('ap-worstList'); if (wl) wl.innerHTML = emptyList;
        const emptyMsg = _apBrokerFilter === 'all'
            ? 'Geen posities. Voeg eerst aandelen + aantal toe in DATA → AANDELEN.'
            : `Geen posities bij ${_apBrokerFilter}. Wijzig broker via DATA → AANDELEN.`;
        if (_apSectorChart) { _apSectorChart.destroy(); _apSectorChart = null; }
        const lg = document.getElementById('ap-sectorLegend'); if (lg) lg.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;">${emptyMsg}</div>`;
        const bs = document.getElementById('ap-bySector');     if (bs) bs.innerHTML = '';
        if (status) status.textContent = '';
        return;
    }

    // Quotes gebatcht laden (5 tegelijk) — zelfde systeem als TEST pagina
    const usdEur = await getUsdEurRate();
    const quotes  = await loadAllQuotesBatched(positions);
    const enriched = await Promise.all(positions.map(async (s, i) => {
        const q       = quotes[i];
        const sector  = await fetchSector(s.ticker, s.type);
        const cur     = (q?.currency || s.currency || 'USD').toUpperCase();
        const fx      = cur === 'EUR' ? 1 : usdEur;
        const gakCur  = (s.currency || 'USD').toUpperCase();
        const gakFx   = gakCur === 'EUR' ? 1 : usdEur;
        const price     = q?.price ?? 0;
        const dayChange = q?.change ?? 0;
        const aantal    = s.aantal || 0;
        const noQuote   = !q || !q.price;
        const valueEur  = price * aantal * fx;
        const costEur   = (s.gak || 0) * aantal * gakFx;
        const plEur     = valueEur - costEur;
        const plPct     = costEur > 0 && !noQuote ? (plEur / costEur) * 100 : null;
        const dayPLEur  = dayChange * aantal * fx;
        const dayPLPct  = q?.pct ?? null;
        return { ...s, q, sector, price, noQuote, valueEur, costEur, plEur, plPct, dayPLEur, dayPLPct };
    }));

    // Posities totalen + cash
    const positionsValue = enriched.reduce((a,x) => a + x.valueEur, 0);
    const totalCost      = enriched.reduce((a,x) => a + x.costEur,  0);
    const totalValue     = positionsValue + cashEur;
    const totalPL        = positionsValue - totalCost;
    const totalPLPct     = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    const dayPL          = enriched.reduce((a,x) => a + x.dayPLEur, 0);
    const dayPLPct       = positionsValue > 0 ? (dayPL / (positionsValue - dayPL)) * 100 : 0;

    document.getElementById('ap-totalValue').textContent = fmtEuroAlt(totalValue);
    const stortingEur = getStortingForBroker(_apBrokerFilter);
    const cashLine = cashEur > 0 ? ` &nbsp;·&nbsp; Cash: ${fmtEuroAlt(cashEur)}` : '';
    document.getElementById('ap-totalCost').innerHTML  = 'Gestort: ' + fmtEuroAlt(stortingEur) + cashLine;

    const tplEl = document.getElementById('ap-totalPL');
    tplEl.textContent = (totalPL >= 0 ? '+' : '') + fmtEuroAlt(totalPL);
    tplEl.style.color = totalPL >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('ap-totalPLPct').innerHTML = plChip(totalPLPct);

    const dplEl = document.getElementById('ap-dayPL');
    dplEl.textContent = (dayPL >= 0 ? '+' : '') + fmtEuroAlt(dayPL);
    dplEl.style.color = dayPL >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('ap-dayPLPct').innerHTML = plChip(dayPLPct);

    const stockCnt = enriched.filter(x => x.type === 'stock').length;
    const etfCnt   = enriched.filter(x => x.type === 'etf').length;
    document.getElementById('ap-positions').textContent = `${enriched.length}`;
    document.getElementById('ap-positionsBreakdown').textContent = `${stockCnt} aandelen · ${etfCnt} ETFs`;

    // Top 5 beste / slechtste
    const sortedByPct = [...enriched].filter(x => x.plPct != null).sort((a,b) => b.plPct - a.plPct);
    const top5Best  = sortedByPct.filter(x => x.plPct > 0).slice(0, 5);
    const top5Worst = sortedByPct.filter(x => x.plPct < 0).slice(-5).reverse();

    const renderTopList = (items, isBest) => {
        if (items.length === 0) return '<div class="ap-toplist-empty">Geen data</div>';
        return items.map((p, i) => {
            const col = isBest ? 'var(--success)' : 'var(--danger)';
            const sign = p.plPct >= 0 ? '+' : '';
            const eurSign = p.plEur >= 0 ? '+' : '';
            return `<div class="ap-toplist-row" title="${p.name}">
                <span class="ap-toplist-rank">${i+1}.</span>
                <span class="ap-toplist-ticker">${p.ticker}</span>
                <span class="ap-toplist-eur blur-target">${eurSign}${fmtEuroAlt(p.plEur, 0)}</span>
                <span class="ap-toplist-pct" style="color:${col};">${sign}${p.plPct.toFixed(2)}%</span>
            </div>`;
        }).join('');
    };

    const bestEl  = document.getElementById('ap-bestList');
    const worstEl = document.getElementById('ap-worstList');
    if (bestEl)  bestEl.innerHTML  = renderTopList(top5Best,  true);
    if (worstEl) worstEl.innerHTML = renderTopList(top5Worst, false);

    _apLastEnriched   = enriched;
    _apLastTotalValue = positionsValue;

    renderSectorPie(enriched, positionsValue);
    renderBySector('ap-bySector', enriched, positionsValue, false);
    renderAllPositions(enriched, positionsValue);

    // Statusbol + automatisch opnieuw proberen voor mislukte koersen
    const loadedQuotes = enriched.filter(x => x.q?.price != null && x.q.price > 0);
    const allOk  = loadedQuotes.length === enriched.length && enriched.length > 0;
    const someOk = loadedQuotes.length > 0 && !allOk;
    const dotCol = allOk ? 'var(--success)' : someOk ? '#f39c12' : 'var(--danger)';
    const priceTimes = loadedQuotes.filter(x => x.q.time instanceof Date).map(x => x.q.time.getTime()).filter(t => isFinite(t) && t > 0);
    const latestTime = priceTimes.length > 0 ? new Date(Math.max(...priceTimes)) : new Date();
    const timeStr = latestTime.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const label = allOk ? `Koersen: ${timeStr}` : someOk ? `Koersen: ${timeStr} · niet volledig` : 'Koersen: niet geladen';
    if (status) status.innerHTML =
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotCol};margin-right:5px;vertical-align:middle;box-shadow:0 0 4px ${dotCol};"></span>${label}`;

    if (!allOk) scheduleApQuoteRetry(enriched, cashEur, usdEur, 1);
}

let _apRetryTimeout      = null;
let _apAutoRefreshInterval = null;

function startApAutoRefresh() {
    if (_apAutoRefreshInterval) { clearInterval(_apAutoRefreshInterval); _apAutoRefreshInterval = null; }
    const delay = isMarktOpen() ? 60000 : 15 * 60000;
    _apAutoRefreshInterval = setInterval(() => {
        initAandelenPortfolio(true);
        startApAutoRefresh();
    }, delay);
}

function scheduleApQuoteRetry(enriched, cashEur, usdEur, attempt) {
    if (_apRetryTimeout) clearTimeout(_apRetryTimeout);
    if (attempt > 6) return;
    const delay = Math.min(1500 * Math.pow(2, attempt - 1), 30000); // 1.5s → 3s → 6s → 12s → 24s → 30s
    _apRetryTimeout = setTimeout(() => retryFailedApQuotes(enriched, cashEur, usdEur, attempt), delay);
}

async function retryFailedApQuotes(enriched, cashEur, usdEur, attempt) {
    const status = document.getElementById('aandelenPfStatus');
    const failed = enriched.filter(x => x.noQuote);
    if (failed.length === 0) return;

    failed.forEach(x => _quoteCache.delete((x.ticker || '') + '|' + (x.type || '')));
    const retried = await loadAllQuotesBatched(failed);

    let anyNew = false;
    failed.forEach((pos, i) => {
        const q = retried[i];
        if (!q || !q.price) return;
        const idx    = enriched.indexOf(pos);
        if (idx === -1) return;
        const cur    = (q.currency || pos.currency || 'USD').toUpperCase();
        const fx     = cur === 'EUR' ? 1 : usdEur;
        const gakCur = (pos.currency || 'USD').toUpperCase();
        const gakFx  = gakCur === 'EUR' ? 1 : usdEur;
        const price    = q.price;
        const dayChange = q.change ?? 0;
        const valueEur = price * pos.aantal * fx;
        const costEur  = (pos.gak || 0) * pos.aantal * gakFx;
        const plEur    = valueEur - costEur;
        enriched[idx] = { ...pos, q, price, noQuote: false,
            valueEur, costEur, plEur,
            plPct:   costEur > 0 ? (plEur / costEur) * 100 : null,
            dayPLEur: dayChange * pos.aantal * fx,
            dayPLPct: q.pct ?? null };
        anyNew = true;
    });

    if (!anyNew) { scheduleApQuoteRetry(enriched, cashEur, usdEur, attempt + 1); return; }

    // Sla alle posities op en herrender via renderApFromEnriched (handelt broker-filter correct af)
    _apLastEnriched = enriched;
    renderApFromEnriched(enriched);

    const loadedQuotes = enriched.filter(x => x.q?.price != null && x.q.price > 0);
    const allOk  = loadedQuotes.length === enriched.length && enriched.length > 0;
    const someOk = loadedQuotes.length > 0 && !allOk;
    const dotCol = allOk ? 'var(--success)' : someOk ? '#f39c12' : 'var(--danger)';
    const priceTimes = loadedQuotes.filter(x => x.q.time instanceof Date).map(x => x.q.time.getTime()).filter(t => isFinite(t) && t > 0);
    const timeStr = (priceTimes.length > 0 ? new Date(Math.max(...priceTimes)) : new Date()).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const label = allOk ? `Koersen: ${timeStr}` : someOk ? `Koersen: ${timeStr} · niet volledig` : 'Koersen: niet geladen';
    if (status) status.innerHTML =
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotCol};margin-right:5px;vertical-align:middle;box-shadow:0 0 4px ${dotCol};"></span>${label}`;

    if (!allOk) scheduleApQuoteRetry(enriched, cashEur, usdEur, attempt + 1);
}

// ── CRYPTO PORTFOLIO ────────────────────────────────────────────────────────
// Cache voor historische crypto prijzen op 13/04/2026
let _cpHistCache = JSON.parse(localStorage.getItem('cp_hist_cache_v1') || '{}');
function saveCpHistCache() { localStorage.setItem('cp_hist_cache_v1', JSON.stringify(_cpHistCache)); }

// Haal close-prijs op de eerste dag ≥ startTs op (Yahoo Finance chart)
async function fetchHistoricalPrice(ticker, startTs) {
    const cacheKey = `${ticker}@${startTs}`;
    if (_cpHistCache[cacheKey] != null) return _cpHistCache[cacheKey];
    try {
        const period1 = Math.floor((startTs - 86400000) / 1000);
        const period2 = Math.floor((startTs + 14*86400000) / 1000); // 2 weken venster
        const url = `https://corsproxy.io/?url=${encodeURIComponent(`https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&period1=${period1}&period2=${period2}`)}`;
        const r = await fetch(url);
        if (!r.ok) throw new Error(r.status);
        const data = await r.json();
        const closes = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
        const startClose = closes?.find(v => v != null);
        if (startClose) {
            _cpHistCache[cacheKey] = startClose;
            saveCpHistCache();
            return startClose;
        }
    } catch {}
    return null;
}

async function initCryptoPortfolio(force = false) {
    const status = document.getElementById('cryptoPfStatus');
    if (status) status.textContent = '⏳ Laden…';

    const positions = hmStocks.filter(s => s.type === 'crypto' && (s.aantal || 0) > 0);

    if (positions.length === 0) {
        const totalCard = document.getElementById('cp-totalValue');
        if (totalCard) totalCard.textContent = '€ 0,00';
        ['cp-totalPL','cp-totalPLPct','cp-dayPL','cp-dayPLPct','cp-positions','cp-positionsBreakdown']
            .forEach(id => { const e = document.getElementById(id); if (e) e.textContent = '–'; });
        const emptyList = '<div class="ap-toplist-empty">Geen coins</div>';
        const bl = document.getElementById('cp-bestList');  if (bl) bl.innerHTML = emptyList;
        const wl = document.getElementById('cp-worstList'); if (wl) wl.innerHTML = emptyList;
        if (_cpSectorChart) { _cpSectorChart.destroy(); _cpSectorChart = null; }
        const lg = document.getElementById('cp-sectorLegend'); if (lg) lg.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Geen crypto posities. Voeg eerst crypto + aantal toe in DATA → CRYPTO.</div>';
        const bs = document.getElementById('cp-bySector');     if (bs) bs.innerHTML = '';
        if (status) status.textContent = '';
        return;
    }

    // Startdatum 13/04/2026 voor performance vergelijking
    const startTs = new Date(2026, 3, 13).getTime();

    const usdEur = await getUsdEurRate();
    const enriched = await Promise.all(positions.map(async s => {
        const q = await loadQuoteForPosition(s);
        const sector = getCryptoCategory(s.ticker);
        const fx = (s.currency || 'USD').toUpperCase() === 'EUR' ? 1 : usdEur;
        const price     = q?.price ?? 0;
        const dayChange = q?.change ?? 0;
        const aantal    = s.aantal || 0;
        const valueEur  = price * aantal * fx;

        // Historische prijs op 13/04/2026 → basis voor P/L
        const histPrice = await fetchHistoricalPrice(s.ticker, startTs);
        // costEur is hier waarde op 13/04 (niet GAK) zodat alle P/L vanaf die datum telt
        const costEur   = histPrice ? histPrice * aantal * fx : 0;
        const plEur     = histPrice ? valueEur - costEur : 0;
        const plPct     = (histPrice && histPrice > 0) ? ((price - histPrice) / histPrice) * 100 : null;
        const dayPLEur  = dayChange * aantal * fx;
        const dayPLPct  = q?.pct ?? null;
        // sinds-start velden = zelfde als plEur/plPct (voor consistency met top lists)
        const sinceStartPct = plPct;
        const sinceStartEur = plEur;

        return { ...s, q, sector, price, histPrice, valueEur, costEur, plEur, plPct, dayPLEur, dayPLPct, sinceStartPct, sinceStartEur };
    }));

    const totalValue = enriched.reduce((a,x) => a + x.valueEur, 0);
    const totalCost  = enriched.reduce((a,x) => a + x.costEur,  0);
    const totalPL    = totalValue - totalCost;
    const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    const dayPL      = enriched.reduce((a,x) => a + x.dayPLEur, 0);
    const dayPLPct   = totalValue > 0 ? (dayPL / (totalValue - dayPL)) * 100 : 0;

    document.getElementById('cp-totalValue').textContent = fmtEuroAlt(totalValue);

    const tplEl = document.getElementById('cp-totalPL');
    tplEl.textContent = (totalPL >= 0 ? '+' : '') + fmtEuroAlt(totalPL);
    tplEl.style.color = totalPL >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('cp-totalPLPct').innerHTML = plChip(totalPLPct);

    const dplEl = document.getElementById('cp-dayPL');
    dplEl.textContent = (dayPL >= 0 ? '+' : '') + fmtEuroAlt(dayPL);
    dplEl.style.color = dayPL >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('cp-dayPLPct').innerHTML = plChip(dayPLPct);

    document.getElementById('cp-positions').textContent = `${enriched.length}`;
    document.getElementById('cp-positionsBreakdown').textContent = enriched.length === 1 ? 'Coin' : 'Coins';

    // Top 3 beste/slechtste sinds 13/04 — gebruik sinceStartPct
    const sortedByStart = [...enriched]
        .filter(x => x.sinceStartPct != null)
        .sort((a,b) => b.sinceStartPct - a.sinceStartPct);
    const top3Best  = sortedByStart.filter(x => x.sinceStartPct > 0).slice(0, 3);
    const top3Worst = sortedByStart.filter(x => x.sinceStartPct < 0).slice(-3).reverse();

    const renderCpTop = (items, isBest) => {
        if (items.length === 0) return '<div class="ap-toplist-empty">Geen data</div>';
        return items.map((p, i) => {
            const col = isBest ? 'var(--success)' : 'var(--danger)';
            const sign = p.sinceStartPct >= 0 ? '+' : '';
            const eurSign = (p.sinceStartEur ?? 0) >= 0 ? '+' : '';
            const tickerShort = p.ticker.replace(/-USD$/i, '');
            return `<div class="ap-toplist-row" title="${p.name}">
                <span class="ap-toplist-rank">${i+1}.</span>
                <span class="ap-toplist-ticker">${tickerShort}</span>
                <span class="ap-toplist-eur blur-target">${p.sinceStartEur != null ? eurSign + fmtEuroAlt(p.sinceStartEur, 0) : '–'}</span>
                <span class="ap-toplist-pct" style="color:${col};">${sign}${p.sinceStartPct.toFixed(2)}%</span>
            </div>`;
        }).join('');
    };
    const bestEl  = document.getElementById('cp-bestList');
    const worstEl = document.getElementById('cp-worstList');
    if (bestEl)  bestEl.innerHTML  = renderCpTop(top3Best, true);
    if (worstEl) worstEl.innerHTML = renderCpTop(top3Worst, false);

    // Pie chart voor categorie-verdeling
    renderCryptoPie(enriched, totalValue);
    renderBySector('cp-bySector', enriched, totalValue, true);

    if (status) status.textContent = `✓ Bijgewerkt · ${new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}`;
}

// Crypto pie chart (apart om botsing met aandelen pie te vermijden)
let _cpSectorChart = null;
function renderCryptoPie(positions, totalValue) {
    const canvas = document.getElementById('cp-sectorPie');
    const legendEl = document.getElementById('cp-sectorLegend');
    if (!canvas || !legendEl) return;

    const bySector = {};
    positions.forEach(p => {
        if (!bySector[p.sector]) bySector[p.sector] = 0;
        bySector[p.sector] += p.valueEur;
    });
    const entries = Object.entries(bySector).sort((a,b) => b[1] - a[1]);

    if (entries.length === 0 || totalValue === 0) {
        if (_cpSectorChart) { _cpSectorChart.destroy(); _cpSectorChart = null; }
        legendEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Geen data</div>';
        return;
    }

    const labels = entries.map(([sec]) => sec);
    const values = entries.map(([, v]) => v);
    const colors = entries.map((_, i) => sectorColor(i));

    if (_cpSectorChart) _cpSectorChart.destroy();
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    _cpSectorChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: colors, borderColor: cardBg, borderWidth: 2, hoverOffset: 8 }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.parsed;
                            const pct = (v / totalValue) * 100;
                            return `${fmtEuroAlt(v)} (${pct.toFixed(1)}%)`;
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });

    legendEl.innerHTML = entries.map(([sec, val], i) => {
        const pct = (val / totalValue) * 100;
        return `<div class="ap-pie-legend-row" title="${sec}">
            <span class="ap-pie-dot" style="background:${colors[i]};"></span>
            <span class="ap-pie-name">${sec}</span>
            <span class="ap-pie-spacer"></span>
            <span class="ap-pie-val blur-target">${fmtEuroAlt(val, 0)}</span>
            <span class="ap-pie-pct">${pct.toFixed(1)}%</span>
        </div>`;
    }).join('');
}

// ── Render hulpfuncties ────────────────────────────────────────────────────
let _apSectorChart = null;

// Pie/doughnut chart voor sectorverdeling op AANDELEN pagina
function renderSectorPie(positions, totalValue) {
    const canvas = document.getElementById('ap-sectorPie');
    const legendEl = document.getElementById('ap-sectorLegend');
    if (!canvas || !legendEl) return;

    const bySector = {};
    positions.forEach(p => {
        if (!bySector[p.sector]) bySector[p.sector] = 0;
        bySector[p.sector] += p.valueEur;
    });
    const entries = Object.entries(bySector).sort((a,b) => b[1] - a[1]);

    if (entries.length === 0 || totalValue === 0) {
        if (_apSectorChart) { _apSectorChart.destroy(); _apSectorChart = null; }
        legendEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Geen data</div>';
        return;
    }

    const labels = entries.map(([sec]) => sec);
    const values = entries.map(([, v]) => v);
    const colors = entries.map((_, i) => sectorColor(i));

    if (_apSectorChart) _apSectorChart.destroy();
    // Resolve CSS var to actual color (Chart.js needs hex/rgb)
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    _apSectorChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: cardBg,
                borderWidth: 2,
                hoverOffset: 8,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.parsed;
                            const pct = (v / totalValue) * 100;
                            return `${fmtEuroAlt(v)} (${pct.toFixed(1)}%)`;
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });

    // Legenda: dot + naam | spacer | €waarde + %
    legendEl.innerHTML = entries.map(([sec, val], i) => {
        const pct = (val / totalValue) * 100;
        return `<div class="ap-pie-legend-row" title="${sec}">
            <span class="ap-pie-dot" style="background:${colors[i]};"></span>
            <span class="ap-pie-name">${sec}</span>
            <span class="ap-pie-spacer"></span>
            <span class="ap-pie-val blur-target">${fmtEuroAlt(val, 0)}</span>
            <span class="ap-pie-pct">${pct.toFixed(1)}%</span>
        </div>`;
    }).join('');
}

// Oude stacked bar variant — wordt nog gebruikt door CRYPTO pagina
function renderSectorBars(containerId, positions, totalValue) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const bySector = {};
    positions.forEach(p => {
        if (!bySector[p.sector]) bySector[p.sector] = 0;
        bySector[p.sector] += p.valueEur;
    });
    const entries = Object.entries(bySector).sort((a,b) => b[1] - a[1]);
    if (entries.length === 0 || totalValue === 0) {
        el.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Geen data</div>';
        return;
    }
    // Stacked bar
    let bar = '<div style="display:flex;width:100%;height:18px;border-radius:8px;overflow:hidden;background:var(--row-hover);margin-bottom:14px;">';
    entries.forEach(([sec, val], i) => {
        const pct = (val / totalValue) * 100;
        bar += `<div style="width:${pct}%;background:${sectorColor(i)};" title="${sec}: ${pct.toFixed(1)}%"></div>`;
    });
    bar += '</div>';

    let legend = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;">';
    entries.forEach(([sec, val], i) => {
        const pct = (val / totalValue) * 100;
        legend += `<div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;">
            <span style="width:10px;height:10px;background:${sectorColor(i)};border-radius:2px;flex-shrink:0;"></span>
            <span style="font-weight:600;flex:1;">${sec}</span>
            <span class="blur-target" style="color:var(--text-muted);font-size:0.75rem;">${fmtEuroAlt(val, 0)}</span>
            <span style="font-weight:700;min-width:40px;text-align:right;">${pct.toFixed(1)}%</span>
        </div>`;
    });
    legend += '</div>';
    el.innerHTML = bar + legend;
}

function renderBySector(containerId, positions, totalValue, isCrypto, sortOpts) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const bySector = {};
    positions.forEach(p => {
        if (!bySector[p.sector]) bySector[p.sector] = [];
        bySector[p.sector].push(p);
    });
    const sectors = Object.entries(bySector).sort((a,b) => {
        const sa = a[1].reduce((x,y) => x + y.valueEur, 0);
        const sb = b[1].reduce((x,y) => x + y.valueEur, 0);
        return sb - sa;
    });

    let html = '';
    sectors.forEach(([sec, pos], idx) => {
        const sectorVal = pos.reduce((a,p) => a + p.valueEur, 0);
        const sectorCost = pos.reduce((a,p) => a + p.costEur, 0);
        const sectorPL  = sectorVal - sectorCost;
        const sectorPct = sectorCost > 0 ? (sectorPL / sectorCost) * 100 : 0;
        const sectorShare = totalValue > 0 ? (sectorVal / totalValue) * 100 : 0;
        const plCol = sectorPL >= 0 ? 'var(--success)' : 'var(--danger)';
        const plSign = sectorPL >= 0 ? '+' : '';

        // Sortable kolomheaders (alleen voor aandelen, niet crypto)
        const sortKey = isCrypto ? null : (sortOpts ? sortOpts.key : _apSortKey);
        const sortDir = isCrypto ? null : (sortOpts ? sortOpts.dir : _apSortDir);
        const sortFn  = (sortOpts ? sortOpts.fn : null) || 'setApSort';
        const arrow = (k) => sortKey === k ? `<span class="ap-sort-arrow">${sortDir === 'asc' ? '▲' : '▼'}</span>` : '';
        const thBase = 'padding:4px 6px;border-bottom:1px solid var(--border-color);';
        const mkTh = (key, label, align) => {
            if (isCrypto) {
                return `<th style="${thBase}${align ? 'text-align:'+align+';' : ''}">${label}</th>`;
            }
            const cls = `ap-sort-th${sortKey === key ? ' active' : ''}`;
            return `<th class="${cls}" onclick="${sortFn}('${key}')" style="${thBase}${align ? 'text-align:'+align+';' : ''}">${label}${arrow(key)}</th>`;
        };

        // Sorteer posities binnen sector
        if (!isCrypto && sortKey) {
            pos.sort((a, b) => {
                let av = a[sortKey], bv = b[sortKey];
                if (sortKey === 'ticker' || sortKey === 'name') {
                    av = (av || '').toString().toLowerCase();
                    bv = (bv || '').toString().toLowerCase();
                    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
                }
                if (av == null) av = -Infinity;
                if (bv == null) bv = -Infinity;
                return sortDir === 'asc' ? av - bv : bv - av;
            });
        } else {
            pos.sort((a,b) => b.valueEur - a.valueEur);
        }

        const secCol = sectorColor(idx);
        html += `<div style="margin-bottom:18px;border-left:4px solid ${secCol};padding:8px 0 8px 14px;background:linear-gradient(90deg, ${secCol}11, transparent 35%);border-radius:0 8px 8px 0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                <div>
                    <div style="font-size:1.1rem;font-weight:800;color:${secCol};letter-spacing:-0.01em;">${sec}</div>
                    <div style="font-size:0.7rem;color:var(--text-muted);">${pos.length} ${pos.length === 1 ? 'positie' : 'posities'} · ${sectorShare.toFixed(1)}% van portfolio</div>
                </div>
                <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;justify-content:flex-end;">
                    <span class="blur-target" style="font-weight:800;font-size:0.95rem;">${fmtEuroAlt(sectorVal)}</span>
                    <span style="font-size:0.78rem;font-weight:700;color:${plCol};">${plSign}${fmtEuroAlt(sectorPL)} (${plSign}${sectorPct.toFixed(2)}%)</span>
                </div>
            </div>
            <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
                <table class="ap-positions-table" style="width:100%;min-width:880px;border-collapse:collapse;font-size:0.8rem;table-layout:fixed;">
                    <colgroup>
                        <col style="width:78px;">
                        <col style="min-width:140px;">
                        <col style="width:80px;">
                        <col style="width:90px;">
                        <col style="width:90px;">
                        <col style="width:115px;">
                        <col style="width:115px;">
                        <col style="width:90px;">
                        <col style="width:80px;">
                    </colgroup>
                    <thead><tr style="text-align:left;color:var(--text-muted);font-size:0.65rem;">
                        ${mkTh('ticker', 'TICKER', 'left')}
                        ${mkTh('name', 'NAAM', 'left')}
                        ${mkTh('aantal', 'AANTAL', 'right')}
                        ${mkTh('gak', isCrypto ? 'PRIJS 13/04' : 'GAK', 'right')}
                        ${mkTh('price', 'PRIJS', 'right')}
                        ${mkTh('valueEur', 'WAARDE €', 'right')}
                        ${mkTh('plEur', 'P/L €', 'right')}
                        ${mkTh('plPct', 'P/L %', 'right')}
                        ${mkTh('dayPLPct', 'DAG %', 'right')}
                    </tr></thead>
                    <tbody>`;
        pos.forEach(p => {
            const noQ   = p.noQuote;
            const plCol = noQ || p.plPct == null ? 'var(--text-muted)' : p.plEur >= 0 ? 'var(--success)' : 'var(--danger)';
            const dpCol = p.dayPLPct == null ? 'var(--text-muted)' : p.dayPLPct >= 0 ? 'var(--success)' : 'var(--danger)';
            const cur = (p.currency || 'USD').toUpperCase();
            const displayTicker = isCrypto ? p.ticker.replace(/-USD$/,'') : p.ticker;
            const dec = p.price < 1 ? 4 : 2;
            const curSym = cur === 'EUR' ? '€' : '$';
            const cellBase = 'padding:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            const priceStr = noQ ? '<span style="color:var(--text-muted)">–</span>' : `${curSym}${p.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: dec })}`;
            html += `<tr style="border-bottom:1px solid var(--border-color);">
                <td style="${cellBase}font-weight:700;font-family:monospace;">${displayTicker}</td>
                <td style="${cellBase}" title="${p.name}">${p.name}</td>
                <td style="${cellBase}text-align:right;">${(p.aantal || 0).toLocaleString('nl-NL', { maximumFractionDigits: 8 })}</td>
                <td style="${cellBase}text-align:right;color:var(--text-muted);">${curSym}${((isCrypto ? (p.histPrice ?? 0) : (p.gak || 0))).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: dec })}</td>
                <td style="${cellBase}text-align:right;">${priceStr}</td>
                <td class="blur-target" style="${cellBase}text-align:right;font-weight:700;">${noQ ? '<span style="color:var(--text-muted)">–</span>' : fmtEuroAlt(p.valueEur)}</td>
                <td class="blur-target" style="${cellBase}text-align:right;color:${plCol};font-weight:700;">${noQ ? '–' : (p.plEur >= 0 ? '+' : '') + fmtEuroAlt(p.plEur)}</td>
                <td style="${cellBase}text-align:right;color:${plCol};font-weight:800;">${p.plPct == null ? '–' : (p.plPct >= 0 ? '+' : '') + p.plPct.toFixed(2) + '%'}</td>
                <td style="${cellBase}text-align:right;color:${dpCol};font-weight:700;">${p.dayPLPct == null ? '–' : (p.dayPLPct >= 0 ? '+' : '') + p.dayPLPct.toFixed(2) + '%'}</td>
            </tr>`;
        });
        html += `</tbody></table></div></div>`;
    });
    el.innerHTML = html;
}

// ── TEST DATA PAGINA ─────────────────────────────────────────────────────────

const TD_TX_KEY = 'td_transactions_v1';
const TD_CF_KEY = 'td_cashflows_v1';

let tdTransactions = (() => { try { return JSON.parse(localStorage.getItem(TD_TX_KEY) || '[]'); } catch { return []; } })();
const TD_CF_DEFAULT = [
    {id:'cf001',date:'2023-07-18',type:'storting',broker:'Degiro',amountEur:200.00},
    {id:'cf002',date:'2023-08-04',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf003',date:'2023-08-25',type:'storting',broker:'Degiro',amountEur:1450.00},
    {id:'cf004',date:'2023-08-28',type:'storting',broker:'Degiro',amountEur:550.00},
    {id:'cf005',date:'2023-08-29',type:'storting',broker:'Degiro',amountEur:2200.00},
    {id:'cf006',date:'2023-09-04',type:'storting',broker:'Degiro',amountEur:3000.00},
    {id:'cf007',date:'2023-10-04',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf008',date:'2023-10-27',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf009',date:'2023-11-03',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf010',date:'2023-11-16',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf011',date:'2023-11-22',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf012',date:'2023-11-23',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf013',date:'2023-11-23',type:'storting',broker:'Degiro',amountEur:9000.00},
    {id:'cf014',date:'2023-12-06',type:'storting',broker:'Degiro',amountEur:2000.00},
    {id:'cf015',date:'2023-12-18',type:'storting',broker:'Degiro',amountEur:2000.00},
    {id:'cf016',date:'2024-01-02',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf017',date:'2024-01-19',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf018',date:'2024-02-05',type:'storting',broker:'Degiro',amountEur:1500.00},
    {id:'cf019',date:'2024-02-22',type:'storting',broker:'Degiro',amountEur:2000.00},
    {id:'cf020',date:'2024-03-06',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf021',date:'2024-04-02',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf022',date:'2024-06-25',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf023',date:'2024-09-02',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf024',date:'2024-10-02',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf025',date:'2024-10-04',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf026',date:'2024-11-04',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf027',date:'2024-11-14',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf028',date:'2024-11-22',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf029',date:'2024-11-22',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf030',date:'2024-11-28',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf031',date:'2024-12-19',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf032',date:'2025-01-02',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf033',date:'2025-01-09',type:'storting',broker:'Degiro',amountEur:1000.00},
    {id:'cf034',date:'2025-03-03',type:'storting',broker:'Degiro',amountEur:250.00},
    {id:'cf035',date:'2025-03-04',type:'storting',broker:'Degiro',amountEur:250.00},
    {id:'cf036',date:'2025-04-02',type:'storting',broker:'Degiro',amountEur:500.00},
    {id:'cf037',date:'2025-08-04',type:'storting',broker:'Degiro',amountEur:750.00},
    {id:'cf038',date:'2026-02-02',type:'opname',broker:'Degiro',amountEur:2055.97},
    {id:'cf039',date:'2026-02-05',type:'opname',broker:'Degiro',amountEur:2000.00},
    {id:'cf040',date:'2026-02-27',type:'opname',broker:'Degiro',amountEur:1081.79},
    {id:'cf041',date:'2021-01-15',type:'storting',broker:'Bolero',amountEur:1000.00},
    {id:'cf042',date:'2022-02-09',type:'storting',broker:'Bolero',amountEur:1000.00},
    {id:'cf043',date:'2022-02-19',type:'storting',broker:'Bolero',amountEur:50.00},
    {id:'cf044',date:'2022-06-07',type:'storting',broker:'Bolero',amountEur:500.00},
    {id:'cf045',date:'2022-06-16',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf046',date:'2022-08-24',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf047',date:'2022-08-31',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf048',date:'2022-09-16',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf049',date:'2022-10-21',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf050',date:'2022-10-29',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf051',date:'2022-11-03',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf052',date:'2022-12-02',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf053',date:'2022-12-13',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf054',date:'2022-12-16',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf055',date:'2023-02-08',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf056',date:'2023-02-23',type:'storting',broker:'Bolero',amountEur:2000.00},
    {id:'cf057',date:'2023-06-16',type:'storting',broker:'Bolero',amountEur:250.00},
    {id:'cf058',date:'2023-06-21',type:'storting',broker:'Bolero',amountEur:1000.00},
    {id:'cf059',date:'2023-07-01',type:'storting',broker:'Bolero',amountEur:800.00},
    {id:'cf060',date:'2023-07-12',type:'storting',broker:'Bolero',amountEur:1000.00},
    {id:'cf061',date:'2023-07-29',type:'storting',broker:'Bolero',amountEur:1000.00},
    {id:'cf062',date:'2024-11-25',type:'storting',broker:'Bolero',amountEur:10.00},
    {id:'cf063',date:'2025-09-04',type:'storting',broker:'Bolero',amountEur:50.00},
    {id:'cf064',date:'2021-04-29',type:'opname',broker:'Bolero',amountEur:136.31},
    {id:'cf065',date:'2021-05-05',type:'opname',broker:'Bolero',amountEur:160.73},
    {id:'cf066',date:'2021-05-07',type:'opname',broker:'Bolero',amountEur:0.70},
    {id:'cf067',date:'2021-05-10',type:'opname',broker:'Bolero',amountEur:128.23},
    {id:'cf068',date:'2023-08-07',type:'opname',broker:'Bolero',amountEur:1200.00},
    {id:'cf069',date:'2023-08-23',type:'opname',broker:'Bolero',amountEur:1450.00},
    {id:'cf070',date:'2023-08-24',type:'opname',broker:'Bolero',amountEur:570.00},
    {id:'cf071',date:'2023-08-25',type:'opname',broker:'Bolero',amountEur:1400.00},
    {id:'cf072',date:'2023-08-25',type:'opname',broker:'Bolero',amountEur:890.00},
    {id:'cf073',date:'2023-08-30',type:'opname',broker:'Bolero',amountEur:390.00},
    {id:'cf074',date:'2023-08-31',type:'opname',broker:'Bolero',amountEur:2500.00},
    {id:'cf075',date:'2023-08-31',type:'opname',broker:'Bolero',amountEur:670.00},
    {id:'cf076',date:'2023-09-05',type:'opname',broker:'Bolero',amountEur:980.00},
    {id:'cf077',date:'2024-12-18',type:'opname',broker:'Bolero',amountEur:2500.00},
    {id:'cf078',date:'2024-12-18',type:'opname',broker:'Bolero',amountEur:2700.00},
    {id:'cf079',date:'2025-03-03',type:'opname',broker:'Bolero',amountEur:1263.20},
    {id:'cf080',date:'2025-05-22',type:'opname',broker:'Bolero',amountEur:300.00},
    {id:'cf081',date:'2025-10-30',type:'opname',broker:'Bolero',amountEur:850.00},
    {id:'cf082',date:'2024-12-18',type:'storting',broker:'Saxo',amountEur:2500.00},
    {id:'cf083',date:'2024-12-19',type:'storting',broker:'Saxo',amountEur:2500.00},
    {id:'cf084',date:'2025-02-27',type:'storting',broker:'Saxo',amountEur:700.00},
    {id:'cf085',date:'2025-03-03',type:'storting',broker:'Saxo',amountEur:750.00},
    {id:'cf086',date:'2025-03-03',type:'storting',broker:'Saxo',amountEur:500.00},
    {id:'cf087',date:'2025-03-12',type:'storting',broker:'Saxo',amountEur:500.00},
    {id:'cf088',date:'2025-04-02',type:'storting',broker:'Saxo',amountEur:500.00},
    {id:'cf089',date:'2025-07-28',type:'storting',broker:'Saxo',amountEur:250.00},
    {id:'cf090',date:'2025-08-20',type:'storting',broker:'Saxo',amountEur:250.00},
    {id:'cf091',date:'2025-08-21',type:'storting',broker:'Saxo',amountEur:250.00},
    {id:'cf092',date:'2025-08-21',type:'storting',broker:'Saxo',amountEur:2000.00},
    {id:'cf093',date:'2025-08-29',type:'storting',broker:'Saxo',amountEur:1500.00},
    {id:'cf094',date:'2025-09-03',type:'storting',broker:'Saxo',amountEur:1000.00},
    {id:'cf095',date:'2025-09-12',type:'storting',broker:'Saxo',amountEur:1000.00},
    {id:'cf096',date:'2025-10-03',type:'storting',broker:'Saxo',amountEur:1000.00},
    {id:'cf097',date:'2025-10-30',type:'storting',broker:'Saxo',amountEur:850.00},
    {id:'cf098',date:'2025-11-03',type:'storting',broker:'Saxo',amountEur:750.00},
    {id:'cf099',date:'2025-11-14',type:'storting',broker:'Saxo',amountEur:500.00},
    {id:'cf100',date:'2025-12-01',type:'storting',broker:'Saxo',amountEur:1000.00},
    {id:'cf101',date:'2025-12-10',type:'storting',broker:'Saxo',amountEur:500.00},
    {id:'cf102',date:'2025-12-17',type:'storting',broker:'Saxo',amountEur:500.00},
    {id:'cf103',date:'2026-02-02',type:'storting',broker:'Saxo',amountEur:2000.00},
    {id:'cf104',date:'2026-02-06',type:'storting',broker:'Saxo',amountEur:2000.00},
    {id:'cf105',date:'2026-02-27',type:'storting',broker:'Saxo',amountEur:1000.00},
    {id:'cf106',date:'2026-03-02',type:'storting',broker:'Saxo',amountEur:2000.00},
].sort((a, b) => b.date.localeCompare(a.date));
let tdCashflows    = (() => { try { const s = localStorage.getItem(TD_CF_KEY); return s ? JSON.parse(s) : TD_CF_DEFAULT; } catch { return TD_CF_DEFAULT; } })();

function saveTdTx() { localStorage.setItem(TD_TX_KEY, JSON.stringify(tdTransactions)); }
function saveTdCf() { localStorage.setItem(TD_CF_KEY, JSON.stringify(tdCashflows)); }

function tdCalcTotals(qty, price, currency, costAmt, costCur, eurusd) {
    let priceEur, priceUsd;
    if (currency === 'EUR') {
        priceEur = price; priceUsd = price * eurusd;
    } else if (currency === 'USD') {
        priceUsd = price; priceEur = eurusd > 0 ? price / eurusd : price;
    } else {
        priceEur = price; priceUsd = price * eurusd; // andere valuta → treat as EUR
    }
    let costEur, costUsd;
    if (costCur === 'EUR') {
        costEur = costAmt; costUsd = costAmt * eurusd;
    } else {
        costUsd = costAmt; costEur = eurusd > 0 ? costAmt / eurusd : costAmt;
    }
    return {
        totalEur: qty * priceEur + costEur,
        totalUsd: qty * priceUsd + costUsd,
    };
}

function tdUpdatePreview() {
    const qty     = parseFloat(document.getElementById('td-quantity')?.value) || 0;
    const price   = parseFloat(document.getElementById('td-price')?.value) || 0;
    const cur     = document.getElementById('td-currency')?.value || 'USD';
    const costAmt = parseFloat(document.getElementById('td-cost')?.value) || 0;
    const costCur = document.getElementById('td-costCurrency')?.value || 'EUR';
    const eurusd  = parseFloat(document.getElementById('td-eurusd')?.value) || 0;
    const eurEl   = document.getElementById('td-preview-eur');
    const usdEl   = document.getElementById('td-preview-usd');
    if (!eurEl || !usdEl) return;
    if (qty <= 0 || price <= 0 || eurusd <= 0) { eurEl.textContent = '€ –'; usdEl.textContent = '$ –'; return; }
    const t = tdCalcTotals(qty, price, cur, costAmt, costCur, eurusd);
    const fmt = n => n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    eurEl.textContent = '€ ' + fmt(t.totalEur);
    usdEl.textContent = '$ ' + fmt(t.totalUsd);
}

async function tdFetchEurusd() {
    const dateVal = document.getElementById('td-date')?.value;
    const eurusdEl = document.getElementById('td-eurusd');
    if (!eurusdEl) return;
    if (!dateVal) { alert('Kies eerst een datum.'); return; }
    const origPlaceholder = eurusdEl.placeholder;
    eurusdEl.placeholder = '...';
    try {
        // Try exact date, fall back to 5 days prior (weekends/holidays)
        const d = new Date(dateVal); d.setDate(d.getDate() - 5);
        const from = d.toISOString().slice(0, 10);
        const series = await fetchPriceSeries('EURUSD=X', from, dateVal);
        const vals = Object.entries(series).filter(([k]) => k <= dateVal).sort((a,b) => a[0].localeCompare(b[0]));
        if (vals.length > 0) {
            eurusdEl.value = vals[vals.length - 1][1].toFixed(4);
            tdUpdatePreview();
        }
    } catch(e) { console.error('EURUSD fetch', e); }
    eurusdEl.placeholder = origPlaceholder;
}

function addTdTransaction() {
    const date     = document.getElementById('td-date').value;
    const type     = document.getElementById('td-type').value;
    const ticker   = document.getElementById('td-ticker').value.trim().toUpperCase();
    const currency = document.getElementById('td-currency').value;
    const quantity = parseFloat(document.getElementById('td-quantity').value);
    const price    = parseFloat(document.getElementById('td-price').value);
    const costAmt  = parseFloat(document.getElementById('td-cost').value) || 0;
    const costCur  = document.getElementById('td-costCurrency').value;
    const broker   = document.getElementById('td-broker').value;
    const eurusd   = parseFloat(document.getElementById('td-eurusd').value) || 1.05;

    if (!date || !ticker || isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
        alert('Vul alle verplichte velden in: datum, ticker, aantal en prijs.');
        return;
    }
    const totals = tdCalcTotals(quantity, price, currency, costAmt, costCur, eurusd);
    tdTransactions.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        date, type, ticker, tickerCurrency: currency,
        quantity, pricePerShare: price,
        costAmount: costAmt, costCurrency: costCur,
        broker, eurusdRate: eurusd,
        totalEur: totals.totalEur, totalUsd: totals.totalUsd,
    });
    tdTransactions.sort((a, b) => b.date.localeCompare(a.date));
    saveTdTx();
    renderTdTransactionsTable();
    // Clear variable fields, keep date/broker/currency/eurusd
    ['td-ticker','td-quantity','td-price','td-cost'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    tdUpdatePreview();
}

function deleteTdTransaction(id) {
    if (!confirm('Verwijder deze transactie?')) return;
    tdTransactions = tdTransactions.filter(t => t.id !== id);
    saveTdTx();
    renderTdTransactionsTable();
}

function addTdCashflow() {
    const date   = document.getElementById('cf-date').value;
    const type   = document.getElementById('cf-type').value;
    const broker = document.getElementById('cf-broker').value;
    const amount = parseFloat(document.getElementById('cf-amount').value);
    if (!date || isNaN(amount) || amount <= 0) { alert('Vul datum en bedrag in.'); return; }
    tdCashflows.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        date, type, broker, amountEur: amount,
    });
    tdCashflows.sort((a, b) => b.date.localeCompare(a.date));
    saveTdCf();
    renderTdCashflowsTable();
    document.getElementById('cf-amount').value = '';
}

function deleteTdCashflow(id) {
    if (!confirm('Verwijder deze cashflow?')) return;
    tdCashflows = tdCashflows.filter(c => c.id !== id);
    saveTdCf();
    renderTdCashflowsTable();
}

function renderTdTransactionsTable() {
    const body    = document.getElementById('td-tx-body');
    const emptyEl = document.getElementById('td-tx-empty');
    const tableEl = document.getElementById('td-tx-table');
    if (!body) return;
    const hasTx = tdTransactions.length > 0;
    if (emptyEl) emptyEl.style.display = hasTx ? 'none' : '';
    if (tableEl) tableEl.style.display = hasTx ? '' : 'none';
    if (!hasTx) return;
    const fmt = (n, dec = 2) => n.toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const brokerCol = { Bolero: 'var(--bolero)', Degiro: 'var(--degiro)', Saxo: 'var(--saxo)' };
    body.innerHTML = tdTransactions.map(tx => {
        const isBuy = tx.type === 'buy';
        const sign  = isBuy ? '−' : '+';
        const costStr = tx.costAmount > 0
            ? (tx.costCurrency === 'EUR' ? '€' : '$') + ' ' + fmt(tx.costAmount)
            : '–';
        const qty = tx.quantity;
        const qtyStr = Number.isInteger(qty) ? qty : fmt(qty, 6).replace(/\.?0+$/, '');
        return `<tr>
            <td>${tx.date}</td>
            <td><span class="td-badge ${isBuy ? 'td-badge-buy' : 'td-badge-sell'}">${isBuy ? 'Koop' : 'Verkoop'}</span></td>
            <td style="font-weight:700;">${tx.ticker}</td>
            <td style="color:var(--text-muted);">${tx.tickerCurrency}</td>
            <td style="text-align:right;">${qtyStr}</td>
            <td style="text-align:right;">${fmt(tx.pricePerShare, 4)}</td>
            <td style="text-align:right;color:var(--text-muted);">${costStr}</td>
            <td style="color:${brokerCol[tx.broker]||'inherit'};font-weight:700;">${tx.broker}</td>
            <td style="text-align:right;color:var(--text-muted);font-size:0.75rem;">${tx.eurusdRate?.toFixed(4) || '–'}</td>
            <td style="text-align:right;font-weight:700;">${sign}€ ${fmt(tx.totalEur)}</td>
            <td style="text-align:right;font-weight:700;">${sign}$ ${fmt(tx.totalUsd)}</td>
            <td><button class="td-del-btn" onclick="deleteTdTransaction('${tx.id}')">✕</button></td>
        </tr>`;
    }).join('');
}

function renderTdCashflowsTable() {
    const body    = document.getElementById('td-cf-body');
    const emptyEl = document.getElementById('td-cf-empty');
    const tableEl = document.getElementById('td-cf-table');
    if (!body) return;
    const hasCf = tdCashflows.length > 0;
    if (emptyEl) emptyEl.style.display = hasCf ? 'none' : '';
    if (tableEl) tableEl.style.display = hasCf ? '' : 'none';
    if (!hasCf) return;
    const fmt = n => n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const brokerCol = { Bolero: 'var(--bolero)', Degiro: 'var(--degiro)', Saxo: 'var(--saxo)' };
    body.innerHTML = tdCashflows.map(cf => {
        const isIn = cf.type === 'storting';
        return `<tr>
            <td>${cf.date}</td>
            <td><span class="td-badge ${isIn ? 'td-badge-in' : 'td-badge-out'}">${isIn ? 'Storting' : 'Opname'}</span></td>
            <td style="color:${brokerCol[cf.broker]||'inherit'};font-weight:700;">${cf.broker}</td>
            <td style="text-align:right;font-weight:700;">${isIn ? '+' : '−'}€ ${fmt(cf.amountEur)}</td>
            <td><button class="td-del-btn" onclick="deleteTdCashflow('${cf.id}')">✕</button></td>
        </tr>`;
    }).join('');
}

function switchTdTab(tab, btn) {
    document.querySelectorAll('.td-sub-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    // In newportfolio these tabs are managed by switchDataTab; guard against missing elements
    const txEl = document.getElementById('td-transactions-tab');
    const cfEl = document.getElementById('td-cashflows-tab');
    const caEl = document.getElementById('td-cash-tab');
    if (txEl) txEl.style.display = tab === 'transactions' ? '' : 'none';
    if (cfEl) cfEl.style.display = tab === 'cashflows'    ? '' : 'none';
    if (caEl) caEl.style.display = tab === 'cash'         ? '' : 'none';
    if (tab === 'cash') renderTdCashTab();
}

function renderTdCashTab() {
    const BROKERS = ['Bolero', 'Degiro', 'Saxo'];
    BROKERS.forEach(b => {
        const key = b.toLowerCase();
        const val = _apCash[b] || 0;
        const inp = document.getElementById(`td-cash-${key}`);
        const inf = document.getElementById(`td-cash-${key}-info`);
        if (inp) inp.value = val > 0 ? val : '';
        if (inf) {
            // Toon % van totaal cash
            const total = BROKERS.reduce((s, x) => s + (_apCash[x] || 0), 0);
            const pct   = total > 0 ? (val / total * 100).toFixed(1) : '0.0';
            inf.textContent = total > 0 ? `${pct}% van totaal cash` : 'Nog geen waarden ingevuld';
        }
    });
    const total = BROKERS.reduce((s, b) => s + (_apCash[b] || 0), 0);
    const el = document.getElementById('td-cash-totaal');
    if (el) el.textContent = fmtEuroAlt(total);
}

function saveTdCashInput(broker, val) {
    _apCash[broker] = parseFloat(val) || 0;
    saveApCash();
    // Info labels + totaal bijwerken
    renderTdCashTab();
    // TEST pagina ook verversen als die actief is
    if (document.getElementById('test-portfolio-page')?.classList.contains('active')) {
        initTestPortfolio();
    }
}

function tdIsTxTab() {
    return document.getElementById('td-transactions-tab')?.style.display !== 'none';
}

function parseCsvLine(line) {
    const result = []; let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
        else if (ch === ',' && !inQ) { result.push(cur); cur = ''; }
        else { cur += ch; }
    }
    result.push(cur);
    return result.map(v => v.trim());
}

function tdBuildCsv(headers, rows) {
    return [headers, ...rows].map(r => r.join(',')).join('\n');
}

function tdShowCsvPanel(mode) {
    const panel    = document.getElementById('td-csv-panel');
    const title    = document.getElementById('td-csv-title');
    const textarea = document.getElementById('td-csv-text');
    const btn      = document.getElementById('td-csv-action-btn');
    const isTx     = tdIsTxTab();

    if (mode === 'export') {
        title.textContent = isTx ? 'EXPORTEER TRANSACTIES — kopieer naar Excel' : 'EXPORTEER STORTINGEN & OPNAMES — kopieer naar Excel';
        if (isTx) {
            const rows = tdTransactions.map(tx => [
                tx.date, tx.type, tx.ticker, tx.tickerCurrency,
                tx.quantity, tx.pricePerShare, tx.costAmount, tx.costCurrency,
                tx.broker,
            ]);
            textarea.value = tdBuildCsv(
                ['Datum','Type','Ticker','Valuta','Aantal','Prijs/stuk','Kosten','KostenValuta','Broker'],
                rows
            );
        } else {
            const rows = tdCashflows.map(cf => [cf.date, cf.type, cf.broker, cf.amountEur]);
            textarea.value = tdBuildCsv(['Datum','Type','Broker','BedragEUR'], rows);
        }
        textarea.readOnly = true;
        btn.textContent = 'Kopieer';
        btn.onclick = () => {
            textarea.select();
            document.execCommand('copy');
            btn.textContent = '✓ Gekopieerd';
            setTimeout(() => { btn.textContent = 'Kopieer'; }, 2000);
        };
    } else {
        title.textContent = isTx ? 'IMPORTEER TRANSACTIES — plak CSV-tekst' : 'IMPORTEER STORTINGEN & OPNAMES — plak CSV-tekst';
        textarea.value = '';
        textarea.readOnly = false;
        textarea.placeholder = isTx
            ? 'Datum,Type,Ticker,Valuta,Aantal,Prijs/stuk,Kosten,KostenValuta,Broker\n2025-01-15,buy,AAPL,USD,10,220.5,2.5,EUR,Bolero'
            : 'Datum,Type,Broker,BedragEUR\n2025-01-01,storting,Bolero,10000';
        btn.textContent = 'Importeren';
        btn.onclick = () => tdImportCsv(textarea.value).catch(e => alert('Fout: ' + e.message));
    }

    panel.style.display = '';
    if (mode === 'import') textarea.focus();
}

function tdCloseCsvPanel() {
    document.getElementById('td-csv-panel').style.display = 'none';
}

async function tdImportCsv(text) {
    try {
        const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l);
        if (lines.length < 2) { alert('Geen data gevonden. Zorg voor een header + minstens 1 rij.'); return; }
        const headers = parseCsvLine(lines[0]);
        const get = (row, col) => row[headers.indexOf(col)] ?? '';

        if (headers.includes('Ticker')) {
            const parsed = lines.slice(1).map((line, i) => {
                const v = parseCsvLine(line);
                return {
                    id:             Date.now().toString(36) + i + Math.random().toString(36).slice(2),
                    date:           get(v, 'Datum'),
                    type:           get(v, 'Type'),
                    ticker:         get(v, 'Ticker').toUpperCase(),
                    tickerCurrency: get(v, 'Valuta')       || 'USD',
                    quantity:       parseFloat(get(v, 'Aantal'))     || 0,
                    pricePerShare:  parseFloat(get(v, 'Prijs/stuk')) || 0,
                    costAmount:     parseFloat(get(v, 'Kosten'))     || 0,
                    costCurrency:   get(v, 'KostenValuta') || 'EUR',
                    broker:         get(v, 'Broker')       || 'Degiro',
                };
            }).filter(t => t.date && t.ticker && t.quantity > 0);

            if (!confirm(`${parsed.length} transacties importeren? Dit vervangt de huidige transacties.`)) return;

            // EURUSD ophalen voor het volledige datumbereik
            const btn = document.getElementById('td-csv-action-btn');
            const origText = btn.textContent;
            btn.textContent = 'EUR/USD ophalen…';
            btn.disabled = true;

            const dates = parsed.map(t => t.date).sort();
            const eurusdSeries = await fetchPriceSeries('EURUSD=X', dates[0], dates[dates.length - 1]);

            // Dichtsbijzijnde koers opzoeken (weekends/feestdagen)
            const getEurusd = (date) => {
                if (eurusdSeries[date]) return eurusdSeries[date];
                // zoek dichtste voorafgaande datum
                const prior = Object.keys(eurusdSeries).filter(d => d <= date).sort();
                return prior.length ? eurusdSeries[prior[prior.length - 1]] : 1.05;
            };

            // Totalen berekenen per transactie
            const imported = parsed.map(t => {
                const eurusd  = getEurusd(t.date);
                const totals  = tdCalcTotals(t.quantity, t.pricePerShare, t.tickerCurrency, t.costAmount, t.costCurrency, eurusd);
                return { ...t, eurusdRate: eurusd, totalEur: totals.totalEur, totalUsd: totals.totalUsd };
            });

            btn.textContent = origText;
            btn.disabled = false;

            tdTransactions = imported.sort((a, b) => b.date.localeCompare(a.date));
            saveTdTx();
            renderTdTransactionsTable();
            switchTdTab('transactions', document.querySelector('#test-data-page .td-sub-tab'));
        } else if (headers.includes('BedragEUR')) {
            const imported = lines.slice(1).map((line, i) => {
                const v = parseCsvLine(line);
                return {
                    id:        Date.now().toString(36) + i + Math.random().toString(36).slice(2),
                    date:      get(v, 'Datum'),
                    type:      get(v, 'Type')   || 'storting',
                    broker:    get(v, 'Broker') || 'Degiro',
                    amountEur: parseFloat(get(v, 'BedragEUR')) || 0,
                };
            }).filter(c => c.date && c.amountEur > 0);
            if (!confirm(`${imported.length} stortingen/opnames importeren? Dit vervangt de huidige data.`)) return;
            tdCashflows = imported.sort((a, b) => b.date.localeCompare(a.date));
            saveTdCf();
            renderTdCashflowsTable();
            switchTdTab('cashflows', document.querySelectorAll('#test-data-page .td-sub-tab')[1]);
        } else {
            alert('Onbekend formaat. Verwacht kolom "Ticker" (transacties) of "BedragEUR" (stortingen).');
            return;
        }
        tdCloseCsvPanel();
    } catch(err) {
        alert('Fout bij importeren: ' + err.message);
    }
}

function initTestDataPage() {
    const today = new Date().toISOString().slice(0, 10);
    const dateEl   = document.getElementById('td-date');
    const cfDateEl = document.getElementById('cf-date');
    if (dateEl   && !dateEl.value)   dateEl.value   = today;
    if (cfDateEl && !cfDateEl.value) cfDateEl.value = today;
    ['td-quantity','td-price','td-currency','td-cost','td-costCurrency','td-eurusd'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', tdUpdatePreview);
    });
    renderTdTransactionsTable();
    renderTdCashflowsTable();
}

// ── TEST PORTFOLIO PAGINA ────────────────────────────────────────────────────

const PORTFOLIO_HISTORY_KEY   = 'portfolio_history_v1';
const PORTFOLIO_BACKFILL_KEY  = 'portfolio_hist_backfill_v1';
const PORTFOLIO_HISTORY_START = '2021-01-01'; // vroegste broker-startdatum
const BROKER_HISTORY_START = {
    all:    '2021-01-01',
    Bolero: '2021-01-01',
    Degiro: '2023-07-01',
    Saxo:   '2024-12-01',
};

function loadPortfolioHistory() {
    try { return JSON.parse(localStorage.getItem(PORTFOLIO_HISTORY_KEY) || '[]'); }
    catch { return []; }
}

function needsBackfill() {
    try {
        const cached = JSON.parse(localStorage.getItem(PORTFOLIO_BACKFILL_KEY) || 'null');
        if (!cached) return true;
        return Date.now() - cached.fetched > 24 * 60 * 60 * 1000; // eens per dag vernieuwen
    } catch { return true; }
}

// Haalt dagelijkse slotkoersen op van Yahoo Finance voor een tijdsbereik
async function fetchPriceSeries(ticker, startDate, endDate) {
    const p1 = Math.floor(new Date(startDate).getTime() / 1000);
    const p2 = Math.floor(new Date(endDate).getTime() / 1000) + 86400;
    const url = `https://corsproxy.io/?url=${encodeURIComponent(
        `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&period1=${p1}&period2=${p2}`
    )}`;
    try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(r.status);
        const data = await r.json();
        const result = data?.chart?.result?.[0];
        if (!result) return {};
        const timestamps = result.timestamp || [];
        const closes = result.indicators?.quote?.[0]?.close || [];
        const series = {};
        timestamps.forEach((ts, i) => {
            if (closes[i] != null) {
                const date = new Date(ts * 1000).toISOString().slice(0, 10);
                series[date] = closes[i];
            }
        });
        return series;
    } catch { return {}; }
}

async function buildTxBasedHistory() {
    if (tdTransactions.length === 0) return null;
    const today = new Date().toISOString().slice(0, 10);

    // Vroegste datum uit transacties én cashflows
    const allStartDates = [
        ...tdTransactions.map(t => t.date),
        ...tdCashflows.map(c => c.date),
    ].sort();
    const startDate = allStartDates[0];
    if (!startDate) return null;

    // Unieke tickers met hun valuta
    const tickerCurrency = {};
    tdTransactions.forEach(tx => { tickerCurrency[tx.ticker] = tx.tickerCurrency; });
    const tickers = Object.keys(tickerCurrency);

    // Prijsseries ophalen in parallel
    const [eurusdSeries, ...priceSeries] = await Promise.all([
        fetchPriceSeries('EURUSD=X', startDate, today),
        ...tickers.map(t => fetchPriceSeries(t, startDate, today)),
    ]);
    const seriesMap = {};
    tickers.forEach((t, i) => { seriesMap[t] = priceSeries[i]; });

    // Alle handelsdagen verzamelen (weekends uitsluiten — EURUSD=X heeft forex-data in het weekend)
    const allDatesSet = new Set(Object.keys(eurusdSeries));
    Object.values(seriesMap).forEach(s => Object.keys(s).forEach(d => allDatesSet.add(d)));
    const sortedDates = [...allDatesSet]
        .filter(d => d >= startDate && d <= today)
        .filter(d => { const dow = new Date(d).getDay(); return dow !== 0 && dow !== 6; }) // geen za/zo
        .sort();
    if (sortedDates.length === 0) return null;

    // Transacties en cashflows gesorteerd op datum (oplopend)
    const sortedTx = [...tdTransactions].sort((a, b) => a.date.localeCompare(b.date));
    const sortedCf = [...tdCashflows].sort((a, b) => a.date.localeCompare(b.date));

    // Lopende state: posities per broker + cash per broker
    const positions = { Bolero: {}, Degiro: {}, Saxo: {} };
    const cash = { Bolero: 0, Degiro: 0, Saxo: 0 };
    let txIdx = 0, cfIdx = 0;
    const lastPrices = {};
    let lastEurusd = 1.05;
    const history = [];

    for (const date of sortedDates) {
        // Cashflows toepassen t/m deze datum
        while (cfIdx < sortedCf.length && sortedCf[cfIdx].date <= date) {
            const cf = sortedCf[cfIdx++];
            const b  = cf.broker in cash ? cf.broker : 'Degiro';
            cash[b] += cf.type === 'storting' ? cf.amountEur : -cf.amountEur;
        }
        // Transacties toepassen t/m deze datum
        while (txIdx < sortedTx.length && sortedTx[txIdx].date <= date) {
            const tx = sortedTx[txIdx++];
            const b  = tx.broker in positions ? tx.broker : 'Degiro';
            if (!positions[b][tx.ticker]) positions[b][tx.ticker] = 0;
            if (tx.type === 'buy') {
                positions[b][tx.ticker] += tx.quantity;
                cash[b] -= tx.totalEur;
            } else {
                positions[b][tx.ticker] -= tx.quantity;
                cash[b] += tx.totalEur;
            }
        }

        // Meest recente koersen bijhouden
        const er = eurusdSeries[date];
        if (er != null) lastEurusd = er;
        tickers.forEach(t => { const p = seriesMap[t]?.[date]; if (p != null) lastPrices[t] = p; });

        // Portfoliowaarde per broker = aandelenwaarde + cash (alleen actieve brokers)
        const bv = {
            Bolero: date >= BROKER_HISTORY_START.Bolero ? cash.Bolero : null,
            Degiro: date >= BROKER_HISTORY_START.Degiro ? cash.Degiro : null,
            Saxo:   date >= BROKER_HISTORY_START.Saxo   ? cash.Saxo   : null,
        };
        ['Bolero','Degiro','Saxo'].forEach(b => {
            if (bv[b] == null) return;
            Object.entries(positions[b]).forEach(([ticker, qty]) => {
                if (qty <= 0) return;
                const price = lastPrices[ticker]; if (price == null) return;
                const cur   = tickerCurrency[ticker] || 'EUR';
                const priceEur = cur === 'USD' ? price / lastEurusd : price;
                bv[b] += qty * priceEur;
            });
        });

        const activeBrokers = ['Bolero','Degiro','Saxo'].filter(b => bv[b] != null);
        if (activeBrokers.length === 0) return;
        history.push({
            date,
            value:  activeBrokers.reduce((s, b) => s + bv[b], 0),
            bolero: bv.Bolero,
            degiro: bv.Degiro,
            saxo:   bv.Saxo,
        });
    }
    return history;
}

async function runPortfolioBackfill(force = false) {
    if (!force && !needsBackfill()) { renderPortfolioHistoryChart(); return; }

    const loadingEl = document.getElementById('tp-historyLoading');
    const canvas    = document.getElementById('tp-historyChart');
    const emptyEl   = document.getElementById('tp-historyEmpty');
    if (loadingEl) loadingEl.style.display = '';
    if (canvas)    canvas.style.display    = 'none';
    if (emptyEl)   emptyEl.style.display   = 'none';

    const today = new Date().toISOString().slice(0, 10);

    // Gebruik transactiedata als die beschikbaar is
    if (tdTransactions.length > 0) {
        const history = await buildTxBasedHistory();
        if (history && history.length > 0) {
            localStorage.setItem(PORTFOLIO_HISTORY_KEY,  JSON.stringify(history));
            localStorage.setItem(PORTFOLIO_BACKFILL_KEY, JSON.stringify({ fetched: Date.now() }));
            if (loadingEl) loadingEl.style.display = 'none';
            renderPortfolioHistoryChart();
            return;
        }
    }
    const positions = hmStocks.filter(s =>
        (s.type === 'stock' || s.type === 'etf') && (s.aantal || 0) > 0
    );

    // Haal EUR/USD historisch op (EURUSD=X geeft USD per EUR, dus 1/waarde = EUR per USD)
    const eurusdSeries = await fetchPriceSeries('EURUSD=X', PORTFOLIO_HISTORY_START, today);

    // Haal alle positie-prijsseries op in parallel
    const seriesMap = {};
    await Promise.all(positions.map(async s => {
        seriesMap[s.ticker] = await fetchPriceSeries(s.ticker, PORTFOLIO_HISTORY_START, today);
    }));

    // Verzamel alle handelsdagen
    const allDates = new Set(Object.keys(eurusdSeries));
    Object.values(seriesMap).forEach(s => Object.keys(s).forEach(d => allDates.add(d)));
    const sortedDates = [...allDates]
        .filter(d => d >= PORTFOLIO_HISTORY_START && d <= today)
        .sort();

    if (sortedDates.length === 0) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyEl)   emptyEl.style.display   = '';
        return;
    }

    // Reconstrueer dagelijkse portfoliowaarde (totaal + per broker)
    const brokerCash = { Bolero: _apCash.Bolero || 0, Degiro: _apCash.Degiro || 0, Saxo: _apCash.Saxo || 0 };
    const lastPrices = {};
    let lastEurusd = null;
    const history = [];

    sortedDates.forEach(date => {
        const er = eurusdSeries[date];
        if (er != null) lastEurusd = er;
        positions.forEach(s => {
            const p = seriesMap[s.ticker]?.[date];
            if (p != null) lastPrices[s.ticker] = p;
        });

        const brokerValues = {
            Bolero: date >= BROKER_HISTORY_START.Bolero ? brokerCash.Bolero : null,
            Degiro: date >= BROKER_HISTORY_START.Degiro ? brokerCash.Degiro : null,
            Saxo:   date >= BROKER_HISTORY_START.Saxo   ? brokerCash.Saxo   : null,
        };
        positions.forEach(s => {
            const price  = lastPrices[s.ticker];
            if (price == null) return;
            const broker = s.broker || 'Degiro';
            if (date < BROKER_HISTORY_START[broker]) return; // broker nog niet actief
            const cur = (s.currency || 'USD').toUpperCase();
            const fx  = cur === 'EUR' ? 1 : (lastEurusd ? 1 / lastEurusd : 0.92);
            brokerValues[broker] = (brokerValues[broker] || 0) + price * (s.aantal || 0) * fx;
        });

        const activeBrokers = ['Bolero','Degiro','Saxo'].filter(b => brokerValues[b] != null);
        if (activeBrokers.length === 0) return;
        history.push({
            date,
            value:  activeBrokers.reduce((s, b) => s + brokerValues[b], 0),
            bolero: brokerValues.Bolero,
            degiro: brokerValues.Degiro,
            saxo:   brokerValues.Saxo,
        });
    });

    localStorage.setItem(PORTFOLIO_HISTORY_KEY,  JSON.stringify(history));
    localStorage.setItem(PORTFOLIO_BACKFILL_KEY, JSON.stringify({ fetched: Date.now() }));

    if (loadingEl) loadingEl.style.display = 'none';
    renderPortfolioHistoryChart();
}

let _tpHistoryChart = null;

function renderPortfolioHistoryChart() {
    const canvas    = document.getElementById('tp-historyChart');
    const emptyEl   = document.getElementById('tp-historyEmpty');
    const loadingEl = document.getElementById('tp-historyLoading');
    if (!canvas) return;
    if (loadingEl) loadingEl.style.display = 'none';

    // Bepaal data key en kleur op basis van actieve broker tab
    const brokerKey = { all: 'value', Bolero: 'bolero', Degiro: 'degiro', Saxo: 'saxo' }[_tpBrokerFilter] || 'value';
    const colorVar  = { all: '--total-gray', Bolero: '--bolero', Degiro: '--degiro', Saxo: '--saxo' }[_tpBrokerFilter] || '--total-gray';
    const labelColor = Chart.defaults.color || '#8e9196';

    const history = getFilteredHistory(_tpTimeFilter).filter(h => h[brokerKey] != null);

    if (history.length === 0) {
        canvas.style.display = 'none';
        if (emptyEl) emptyEl.style.display = '';
        return;
    }
    canvas.style.display = '';
    if (emptyEl) emptyEl.style.display = 'none';

    // Rendement berekenen voor de geselecteerde periode
    const returnEl = document.getElementById('tp-periodReturn');
    if (returnEl) {
        const first = history[0][brokerKey];
        const last  = history[history.length - 1][brokerKey];
        if (first > 0) {
            const pct  = ((last - first) / first) * 100;
            const sign = pct >= 0 ? '+' : '';
            returnEl.textContent  = sign + pct.toFixed(2) + '%';
            returnEl.style.color  = pct >= 0 ? 'var(--success)' : 'var(--danger)';
        } else {
            returnEl.textContent = '';
        }
    }

    const labels = history.map(h => {
        const d = new Date(h.date);
        return d.toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' });
    });
    const values = history.map(h => h[brokerKey]);

    const resolvedLine = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim() || '#6c757d';

    if (_tpHistoryChart) { _tpHistoryChart.destroy(); _tpHistoryChart = null; }

    // Benchmark datasets — initieel leeg en verborgen
    const benchDatasets = TP_BENCHMARKS.map(b => ({
        label: b.label,
        data: [],
        borderColor: b.color,
        borderWidth: 1.8,
        borderDash: [4, 3],
        pointRadius: 0,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.3,
        hidden: true,
        spanGaps: true,
    }));

    _tpHistoryChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Portfolio',
                    data: values,
                    borderColor: resolvedLine,
                    borderWidth: 2.5,
                    pointRadius: history.length <= 30 ? 3 : 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: resolvedLine,
                    fill: true,
                    backgroundColor: (ctx) => {
                        const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
                        gradient.addColorStop(0, resolvedLine + '44');
                        gradient.addColorStop(1, resolvedLine + '00');
                        return gradient;
                    },
                    tension: 0.3,
                },
                ...benchDatasets,
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                datalabels: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.parsed.y;
                            if (v == null) return null;
                            return ' ' + ctx.dataset.label + ': ' + fmtEuroAlt(v);
                        },
                        title: (items) => history[items[0].dataIndex]?.date ?? '',
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: labelColor, font: { size: 10 }, maxTicksLimit: 8 }
                },
                y: {
                    grid: {
                        color: (ctx) => {
                            const len = ctx.scale.ticks.length;
                            return (ctx.index === 0 || ctx.index === len - 1)
                                ? 'rgba(128,128,128,0.12)' : 'transparent';
                        }
                    },
                    ticks: {
                        color: labelColor,
                        font: { size: 10 },
                        callback: (v) => '€' + Math.round(v).toLocaleString('nl-NL'),
                    },
                    afterTickToLabelConversion: (scale) => {
                        const ticks = scale.ticks;
                        for (let i = 1; i < ticks.length - 1; i++) ticks[i].label = '';
                    }
                }
            }
        }
    });

    // Herstel actieve benchmarks na herrendering
    const anyActive = TP_BENCHMARKS.some(b => document.getElementById(b.id)?.checked);
    if (anyActive) updateTpBenchmarks();
}

// TEST pagina — benchmark definities
const TP_BENCHMARKS = [
    { id: 'tp-benchSP',     ticker: 'SPY',     label: 'S&P 500',    color: '#e67e22' },
    { id: 'tp-benchMSCI',   ticker: 'URTH',    label: 'MSCI World', color: '#8e44ad' },
    { id: 'tp-benchNASDAQ', ticker: 'QQQ',     label: 'Nasdaq 100', color: '#16a085' },
    { id: 'tp-benchBTC',    ticker: 'BTC-USD', label: 'Bitcoin',    color: '#c0392b' },
    { id: 'tp-benchBEL20',  ticker: '^BFX',    label: 'BEL 20',     color: '#2980b9' },
];
let _tpBenchCache  = {};
let _tpTimeFilter  = 'ytd';

function getFilteredHistory(range, broker) {
    const start = BROKER_HISTORY_START[broker || _tpBrokerFilter] || PORTFOLIO_HISTORY_START;
    const history = loadPortfolioHistory().filter(h => h.date >= start);
    if (!history.length) return [];
    const now = new Date();
    let cutoff = null;
    if (range === '1w')       { cutoff = new Date(now); cutoff.setDate(now.getDate() - 7); }
    else if (range === '1m')  { cutoff = new Date(now); cutoff.setMonth(now.getMonth() - 1); }
    else if (range === 'ytd') { cutoff = new Date(now.getFullYear(), 0, 1); }
    else if (range === '1y')  { cutoff = new Date(now); cutoff.setFullYear(now.getFullYear() - 1); }
    else if (range === '2y')  { cutoff = new Date(now); cutoff.setFullYear(now.getFullYear() - 2); }
    if (!cutoff) return history;
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    // cutoff nooit vroeger dan broker-startdatum
    return history.filter(h => h.date >= (cutoffStr > start ? cutoffStr : start));
}

function setTpTimeFilter(range, btn) {
    _tpTimeFilter = range;
    btn.closest('.time-filter-btns').querySelectorAll('.time-btn').forEach(b => b.classList.remove('active-time'));
    btn.classList.add('active-time');
    _tpBenchCache = {}; // reset cache zodat benchmark opnieuw uitlijnt op nieuw startpunt
    renderPortfolioHistoryChart();
}

async function fetchTpBenchmarkSeries(ticker, fromDate) {
    const cacheKey = ticker + '@' + fromDate;
    if (_tpBenchCache[cacheKey]) return _tpBenchCache[cacheKey];
    const today = new Date().toISOString().slice(0, 10);
    const series = await fetchPriceSeries(ticker, fromDate, today);
    _tpBenchCache[cacheKey] = series;
    return series;
}

function alignTpBenchmark(priceMap, dates, portfolioValues) {
    if (!priceMap || !dates.length) return null;
    let basePrice = null;
    const basePortfolio = portfolioValues[0];
    const result = [];
    for (let i = 0; i < dates.length; i++) {
        let price = priceMap[dates[i]];
        if (price == null) {
            const d = new Date(dates[i]);
            for (let off = -3; off <= 3; off++) {
                const t = new Date(d); t.setDate(d.getDate() + off);
                const k = t.toISOString().slice(0, 10);
                if (priceMap[k] != null) { price = priceMap[k]; break; }
            }
        }
        if (price == null) { result.push(null); continue; }
        if (basePrice === null) basePrice = price;
        const pct = basePrice > 0 ? (price - basePrice) / basePrice : 0;
        result.push(basePortfolio * (1 + pct));
    }
    return basePrice !== null ? result : null;
}

async function updateTpBenchmarks() {
    if (!_tpHistoryChart) return;
    const brokerKey = { all: 'value', Bolero: 'bolero', Degiro: 'degiro', Saxo: 'saxo' }[_tpBrokerFilter] || 'value';
    const history = getFilteredHistory(_tpTimeFilter).filter(h => h[brokerKey] != null);
    if (!history.length) return;
    const dates    = history.map(h => h.date);
    const values   = history.map(h => h[brokerKey]);
    const fromDate = dates[0];

    for (let i = 0; i < TP_BENCHMARKS.length; i++) {
        const bench = TP_BENCHMARKS[i];
        const cb = document.getElementById(bench.id);
        const ds = _tpHistoryChart.data.datasets[i + 1];
        if (!cb || !ds) continue;
        if (cb.checked) {
            ds.hidden = false;
            const map = await fetchTpBenchmarkSeries(bench.ticker, fromDate);
            ds.data   = alignTpBenchmark(map, dates, values) ?? [];
        } else {
            ds.hidden = true;
            ds.data   = [];
        }
    }
    _tpHistoryChart.update();
}

// TEST pagina state
let _tpBrokerFilter  = 'all';
let _tpSortKey       = 'valueEur';
let _tpSortDir       = 'desc';
let _tpPositionsView = 'all';
let _tpLastEnriched  = null;
let _tpLastTotalValue = null;
let _tpRetryTimeout  = null;
let _tpIsFetching    = false;
let _tpSectorChart   = null;
let _tpBrokerChart   = null;

function renderTpBrokerPie(enriched, cashEur) {
    const canvas   = document.getElementById('tp-brokerPie');
    const legendEl = document.getElementById('tp-brokerPieLegend');
    if (!canvas || !legendEl) return;

    const BROKERS  = ['Bolero', 'Degiro', 'Saxo'];
    const COLORS   = { Bolero: 'var(--bolero)', Degiro: 'var(--degiro)', Saxo: 'var(--saxo)' };
    const COLORS_HEX = { Bolero: '#3498db', Degiro: '#f1c40f', Saxo: '#e74c3c' };

    // Positiewaarde per broker
    const brokerPos = { Bolero: 0, Degiro: 0, Saxo: 0 };
    enriched.forEach(p => {
        const b = p.broker || 'Degiro';
        if (brokerPos[b] !== undefined) brokerPos[b] += p.valueEur;
    });

    // Cash per broker — alleen bij TOTAAL filter (cashEur is dan de som)
    const brokerCash = {
        Bolero: _tpBrokerFilter === 'all' ? (_apCash.Bolero || 0) : (_tpBrokerFilter === 'Bolero' ? cashEur : 0),
        Degiro: _tpBrokerFilter === 'all' ? (_apCash.Degiro || 0) : (_tpBrokerFilter === 'Degiro' ? cashEur : 0),
        Saxo:   _tpBrokerFilter === 'all' ? (_apCash.Saxo   || 0) : (_tpBrokerFilter === 'Saxo'   ? cashEur : 0),
    };

    const entries = BROKERS
        .map(b => [b, brokerPos[b] + brokerCash[b]])
        .filter(([, v]) => v > 0);

    const total = entries.reduce((s, [, v]) => s + v, 0);

    if (entries.length === 0 || total === 0) {
        if (_tpBrokerChart) { _tpBrokerChart.destroy(); _tpBrokerChart = null; }
        legendEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Geen data</div>';
        return;
    }

    const labels = entries.map(([b]) => b);
    const values = entries.map(([, v]) => v);
    const colors = entries.map(([b]) => COLORS_HEX[b]);

    if (_tpBrokerChart) _tpBrokerChart.destroy();
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    _tpBrokerChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: cardBg,
                borderWidth: 2,
                hoverOffset: 8,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.parsed;
                            const pct = (v / total) * 100;
                            return `${fmtEuroAlt(v)} (${pct.toFixed(1)}%)`;
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });

    legendEl.innerHTML = entries.map(([b, val]) => {
        const pct = (val / total) * 100;
        return `<div class="ap-pie-legend-row">
            <span class="ap-pie-dot" style="background:${COLORS_HEX[b]};"></span>
            <span class="ap-pie-name">${b}</span>
            <span class="ap-pie-spacer"></span>
            <span class="ap-pie-val blur-target">${fmtEuroAlt(val, 0)}</span>
            <span class="ap-pie-pct">${pct.toFixed(1)}%</span>
        </div>`;
    }).join('');
}

// Rendert de TEST pagina opnieuw op basis van al-geladen koersen — geen API-calls
function renderTpFromEnriched(allEnriched) {
    const broker = _tpBrokerFilter;
    const enriched = broker === 'all'
        ? allEnriched
        : allEnriched.filter(p => (p.broker || 'Degiro') === broker);

    const cashEur        = getCashForBroker(broker);
    const cashEl         = document.getElementById('tp-cash');
    if (cashEl) cashEl.textContent = fmtEuroAlt(cashEur, 0);
    renderTpCashEditor();

    const positionsValue = enriched.reduce((a, x) => a + x.valueEur, 0);
    const totalCost      = enriched.reduce((a, x) => a + x.costEur,  0);
    const totalValue     = positionsValue + cashEur;
    const totalPL        = positionsValue - totalCost;
    const totalPLPct     = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    const dayPL          = enriched.reduce((a, x) => a + x.dayPLEur, 0);
    const dayPLPct       = positionsValue > 0 ? (dayPL / (positionsValue - dayPL)) * 100 : 0;

    document.getElementById('tp-totalValue').textContent = fmtEuroAlt(totalValue, 0);
    const stortingEur = tdCashflows.length > 0 ? getTdNetStorting(broker) : getStortingForBroker(broker);
    const cashLine = cashEur > 0 ? ` &nbsp;·&nbsp; Cash: ${fmtEuroAlt(cashEur, 0)}` : '';
    document.getElementById('tp-totalCost').innerHTML = 'Gestort: ' + fmtEuroAlt(stortingEur, 0) + cashLine;

    const tplEl = document.getElementById('tp-totalPL');
    tplEl.textContent = (totalPL >= 0 ? '+' : '') + fmtEuroAlt(totalPL, 0);
    tplEl.style.color = totalPL >= 0 ? 'var(--success)' : 'var(--danger)';

    const mkChip = (pct) => {
        if (pct == null || isNaN(pct)) return '<span class="tp-hero-pct-chip neu">–</span>';
        const cls = pct >= 0 ? 'pos' : 'neg';
        return `<span class="tp-hero-pct-chip ${cls}">${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%</span>`;
    };
    document.getElementById('tp-totalPLPct').innerHTML = mkChip(totalPLPct);
    const dplEl = document.getElementById('tp-dayPL');
    dplEl.textContent = (dayPL >= 0 ? '+' : '') + fmtEuroAlt(dayPL, 0);
    dplEl.style.color = dayPL >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('tp-dayPLPct').innerHTML = mkChip(dayPLPct);

    const stockCnt = enriched.filter(x => x.type === 'stock').length;
    const etfCnt   = enriched.filter(x => x.type === 'etf').length;
    document.getElementById('tp-positions').textContent = `${enriched.length}`;
    document.getElementById('tp-positionsBreakdown').textContent = `${stockCnt} aandelen · ${etfCnt} ETFs`;

    const sortedByPct = [...enriched].filter(x => x.plPct != null).sort((a, b) => b.plPct - a.plPct);
    const renderTopList = (items, isBest, useDay = false) => {
        if (items.length === 0) return '<div style="text-align:center;padding:12px;color:var(--text-muted);font-size:0.8rem;">Geen data</div>';
        return '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;">' +
            items.map(p => {
                const pct = useDay ? p.dayPLPct : p.plPct;
                const eur = useDay ? p.dayPLEur : p.plEur;
                const absPct = Math.abs(pct);
                const intensity = Math.min(absPct / 20, 1);
                const bgColor = pct > 0
                    ? `rgba(27,153,84,${0.55 + intensity * 0.35})`
                    : `rgba(192,57,43,${0.55 + intensity * 0.35})`;
                const displayTicker = p.ticker.replace(/-USD$/i, '');
                return `<div class="hm-cell-compact" style="background:${bgColor};color:#fff;" title="${p.name}">
                    <div style="font-size:0.58rem;font-weight:800;letter-spacing:0.02em;opacity:0.9;">${displayTicker}</div>
                    <div style="font-size:0.78rem;font-weight:800;">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</div>
                    <div class="blur-target" style="font-size:0.58rem;opacity:0.75;">${eur >= 0 ? '+' : ''}${fmtEuroAlt(eur, 0)}</div>
                </div>`;
            }).join('') +
            '</div>';
    };
    const sortedByDay = [...enriched].filter(x => x.dayPLPct != null).sort((a, b) => b.dayPLPct - a.dayPLPct);
    const dayBestEl  = document.getElementById('tp-dayBestList');
    const dayWorstEl = document.getElementById('tp-dayWorstList');
    if (dayBestEl)  dayBestEl.innerHTML  = renderTopList(sortedByDay.filter(x => x.dayPLPct > 0).slice(0, 5), true,  true);
    if (dayWorstEl) dayWorstEl.innerHTML = renderTopList(sortedByDay.filter(x => x.dayPLPct < 0).slice(-5).reverse(), false, true);
    const bestEl  = document.getElementById('tp-bestList');
    const worstEl = document.getElementById('tp-worstList');
    if (bestEl)  bestEl.innerHTML  = renderTopList(sortedByPct.filter(x => x.plPct > 0).slice(0, 5),  true);
    if (worstEl) worstEl.innerHTML = renderTopList(sortedByPct.filter(x => x.plPct < 0).slice(-5).reverse(), false);

    _tpLastTotalValue = positionsValue;

    const brokerPieWrap = document.getElementById('tp-brokerPieWrap');
    if (broker === 'all') {
        if (brokerPieWrap) brokerPieWrap.style.display = '';
        renderTpBrokerPie(allEnriched, getCashForBroker('all'));
    } else {
        if (brokerPieWrap) brokerPieWrap.style.display = 'none';
        if (_tpBrokerChart) { _tpBrokerChart.destroy(); _tpBrokerChart = null; }
    }
    renderTpSectorPie(enriched, positionsValue);
    const sortOpts = { key: _tpSortKey, dir: _tpSortDir, fn: 'setTpSort' };
    renderBySector('tp-bySector', enriched, positionsValue, false, sortOpts);
    renderAllPositions(enriched, positionsValue, 'tp-allPositions', sortOpts);
}

function setTpBroker(broker, btn) {
    _tpBrokerFilter = broker;
    document.querySelectorAll('#test-portfolio-page .ap-broker-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const pg = document.getElementById('test-portfolio-page');
    if (pg) {
        if (broker === 'all') pg.removeAttribute('data-broker');
        else pg.setAttribute('data-broker', broker);
    }
    const titleEl = document.getElementById('tp-chart-title');
    if (titleEl) {
        const labels = { all: 'PORTFOLIO VOORUITGANG', Bolero: 'BOLERO VOORUITGANG', Degiro: 'DEGIRO VOORUITGANG', Saxo: 'SAXO VOORUITGANG' };
        titleEl.textContent = labels[broker] || 'PORTFOLIO VOORUITGANG';
    }
    renderPortfolioHistoryChart();
    // Reset altijd naar 'Alle posities' bij tabwissel
    _tpPositionsView = 'all';
    document.querySelectorAll('#test-portfolio-page .ap-view-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.view === 'all');
    });
    document.getElementById('tp-bySector').style.display     = 'none';
    document.getElementById('tp-allPositions').style.display = '';
    // Hergebruik bestaande koersen als die al geladen zijn — geen nieuwe API-calls
    if (_tpLastEnriched) {
        renderTpFromEnriched(_tpLastEnriched);
    } else {
        initTestPortfolio();
    }
}

// ── TEST PAGE VIEW SWITCHER ───────────────────────────────────────────────────
function switchTpView(view, btn) {
    ['overzicht','periodeoverzicht'].forEach(v => {
        const el = document.getElementById(`tp-view-${v}`);
        if (el) el.style.display = v === view ? '' : 'none';
    });
    document.getElementById('tp-vernieuwen-btn').style.display = view === 'overzicht' ? '' : 'none';
    document.querySelectorAll('.tp-view-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    if (view === 'periodeoverzicht')  { renderTpHeatmap(); renderTpMaandoverzicht(); renderTpWeekoverzicht(); }
}

// ── TEST RENDEMENT KALENDER (dagelijkse returns heatmap) ──────────────────────
const TP_HEATMAP_BROKERS = ['all', 'Bolero', 'Degiro', 'Saxo'];
const TP_HEATMAP_LABELS  = { all:'TOTAAL', Bolero:'BOLERO', Degiro:'DEGIRO', Saxo:'SAXO' };
let tpHeatmapBrokerIdx = 0;
let tpHeatmapYear = new Date().getFullYear();

function cycleTpHeatmapBroker() {
    tpHeatmapBrokerIdx = (tpHeatmapBrokerIdx + 1) % TP_HEATMAP_BROKERS.length;
    const broker = TP_HEATMAP_BROKERS[tpHeatmapBrokerIdx];
    const btn = document.getElementById('tpHeatmapBrokerBtn');
    if (btn) btn.textContent = TP_HEATMAP_LABELS[broker] + ' ▾';
    renderTpHeatmap();
}

function renderTpHeatmap() {
    const grid      = document.getElementById('tpHeatmapGrid');
    const yearLabel = document.getElementById('tpHeatmapYearLabel');
    if (!grid || !yearLabel) return;
    yearLabel.textContent = tpHeatmapYear;

    const broker  = TP_HEATMAP_BROKERS[tpHeatmapBrokerIdx];
    const brokerKey = { all:'value', Bolero:'bolero', Degiro:'degiro', Saxo:'saxo' }[broker];

    // Bouw dagrendement map vanuit portfolio history (weekends overslaan)
    const isWeekday = d => { const dow = new Date(d).getDay(); return dow !== 0 && dow !== 6; };
    const history = loadPortfolioHistory().filter(h => h[brokerKey] != null && isWeekday(h.date));
    const returnMap = {};
    for (let i = 1; i < history.length; i++) {
        const cur  = history[i];
        const prev = history[i - 1];
        const val  = (cur[brokerKey] ?? 0) - (prev[brokerKey] ?? 0);
        returnMap[cur.date] = val;
    }

    const allVals = Object.values(returnMap).filter(v => isFinite(v) && v !== 0);
    const maxAbs  = allVals.length > 0 ? Math.max(...allVals.map(Math.abs)) : 1;

    const MONTH_NL = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
    const DAY_NL   = ['Ma','Di','Wo','Do','Vr','Za','Zo'];

    let html = `<div style="display:flex;gap:12px;flex-wrap:wrap;">`;
    for (let month = 0; month < 12; month++) {
        const firstDay    = new Date(tpHeatmapYear, month, 1);
        const daysInMonth = new Date(tpHeatmapYear, month + 1, 0).getDate();
        const startDow    = (firstDay.getDay() + 6) % 7; // Ma=0

        html += `<div style="min-width:130px;">`;
        html += `<div style="font-size:0.7rem;font-weight:700;color:var(--text-muted);margin-bottom:4px;">${MONTH_NL[month]}</div>`;
        html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-bottom:2px;">`;
        DAY_NL.forEach(d => {
            html += `<div style="font-size:0.55rem;color:var(--text-muted);text-align:center;">${d}</div>`;
        });
        html += `</div>`;
        html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">`;

        for (let e = 0; e < startDow; e++) html += `<div></div>`;

        for (let day = 1; day <= daysInMonth; day++) {
            const mm  = String(month + 1).padStart(2, '0');
            const dd  = String(day).padStart(2, '0');
            const key = `${tpHeatmapYear}-${mm}-${dd}`;
            const val = returnMap[key];

            let bg = 'var(--border-color)';
            let dataTooltip = `${dd}/${mm}/${tpHeatmapYear}: geen data`;

            if (val !== undefined) {
                const intensity = maxAbs > 0 ? Math.min(Math.abs(val) / maxAbs, 1) : 0;
                const alpha     = Math.round(55 + intensity * 200);
                const alphaHex  = alpha.toString(16).padStart(2, '0');
                bg = val >= 0 ? `#2ecc71${alphaHex}` : `#e74c3c${alphaHex}`;
                const sign = val >= 0 ? '+' : '';
                const isBlurred = document.querySelector('.blur-target')?.classList.contains('blur');
                const displayVal = isBlurred ? '€ •••' : `${sign}€${Math.round(val).toLocaleString('nl-NL')}`;
                dataTooltip = `${dd}/${mm}/${tpHeatmapYear}  ${displayVal}`;
            }

            html += `<div data-tip="${dataTooltip}" class="heatmap-cell" style="aspect-ratio:1;border-radius:2px;background:${bg};cursor:default;position:relative;"></div>`;
        }
        html += `</div></div>`;
    }
    html += `</div>`;
    grid.innerHTML = html;

    // Bind tooltip events — hergebruik bestaande handlers
    grid.querySelectorAll('.heatmap-cell').forEach(cell => {
        cell.addEventListener('mouseenter', showHeatTip);
        cell.addEventListener('mousemove',  moveHeatTip);
        cell.addEventListener('mouseleave', hideHeatTip);
        cell.addEventListener('touchstart', showHeatTipTouch, { passive: true });
    });
}

// ── TEST DOEL ─────────────────────────────────────────────────────────────────
function renderTpDoel() {
    const doel     = getDoelData();
    const target   = doel.target   || null;
    const deadline = doel.deadline || null;

    const isWeekday = d => { const dow = new Date(d).getDay(); return dow !== 0 && dow !== 6; };
    const hist = loadPortfolioHistory().filter(h => isWeekday(h.date) && h.value != null);
    if (hist.length === 0) return;

    const current   = hist[hist.length - 1].value;
    const isBlurred = document.querySelector('.blur-target')?.classList.contains('blur');
    const setEl   = (id, val)  => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML  = html; };

    if (!target) {
        setEl('tpDoel-target',    'Niet ingesteld');
        setEl('tpDoel-current',   isBlurred ? '€ •••' : formatEuro(current));
        setEl('tpDoel-resterend', '–');
        setEl('tpDoel-pct-label', '0%');
        const bar = document.getElementById('tpDoel-progress-bar');
        if (bar) bar.style.width = '0%';
        setEl('tpDoel-eta',      '–');
        setEl('tpDoel-dagnodig', '–');
        return;
    }

    const resterend = target - current;
    const pct = Math.min(Math.max((current / target) * 100, 0), 100);
    const bar = document.getElementById('tpDoel-progress-bar');
    if (bar) {
        bar.style.width      = pct.toFixed(1) + '%';
        bar.style.background = pct >= 100 ? 'var(--success)' : 'linear-gradient(90deg,var(--bolero),var(--success))';
    }
    const pctLbl = document.getElementById('tpDoel-pct-label');
    if (pctLbl) {
        pctLbl.textContent = pct.toFixed(1) + '%';
        pctLbl.style.color = pct >= 100 ? 'var(--success)' : pct >= 50 ? 'var(--bolero)' : 'var(--text-main)';
    }
    setEl('tpDoel-target',  isBlurred ? '€ •••' : formatEuro(target));
    setEl('tpDoel-current', isBlurred ? '€ •••' : formatEuro(current));
    if (resterend <= 0) setHTML('tpDoel-resterend', '<span style="color:var(--success);font-weight:800;">🎉 Doel bereikt!</span>');
    else setEl('tpDoel-resterend', isBlurred ? '€ •••' : formatEuro(resterend));

    if (deadline) {
        const deadlineDate = new Date(deadline);
        const today        = new Date();
        const daysLeft     = Math.max(0, Math.round((deadlineDate - today) / 86400000));
        const dateStr      = deadlineDate.toLocaleDateString('nl-NL', { day:'numeric', month:'short', year:'numeric' });
        setEl('tpDoel-eta', `${dateStr} (${daysLeft} d.)`);
        setEl('tpDoel-dagnodig', resterend > 0 && daysLeft > 0
            ? (isBlurred ? '€ •••/dag' : `${formatEuro(Math.round(resterend / daysLeft))}/dag`)
            : resterend <= 0 ? '–' : 'Deadline verstreken');
    } else {
        // ETA op basis van gemiddelde daggroei (laatste 30 handelsdagen)
        const startIdx = Math.max(0, hist.length - 30);
        if (hist.length >= 2 && resterend > 0) {
            const oldVal    = hist[startIdx].value;
            const days      = hist.length - 1 - startIdx;
            const avgPerDay = days > 0 ? (current - oldVal) / days : 0;
            if (avgPerDay > 0) {
                const daysNeeded = Math.ceil(resterend / avgPerDay);
                const eta = new Date(); eta.setDate(eta.getDate() + daysNeeded);
                setEl('tpDoel-eta', eta.toLocaleDateString('nl-NL', { day:'numeric', month:'short', year:'numeric' }) + ` (~${daysNeeded}d)`);
                setEl('tpDoel-dagnodig', isBlurred ? '€ •••/dag' : `${formatEuro(Math.round(avgPerDay))}/dag (gem.)`);
            } else {
                setEl('tpDoel-eta',      'Onvoldoende groei');
                setEl('tpDoel-dagnodig', '–');
            }
        } else {
            setEl('tpDoel-eta', '–'); setEl('tpDoel-dagnodig', '–');
        }
    }
}

// ── TEST MAANDOVERZICHT ───────────────────────────────────────────────────────
const TP_MAAND_BROKERS = ['all', 'Bolero', 'Degiro', 'Saxo'];
const TP_MAAND_LABELS  = { all:'TOTAAL', Bolero:'BOLERO', Degiro:'DEGIRO', Saxo:'SAXO' };
const TP_MAAND_NL = ['Jan','Feb','Mrt','Apr','Mei','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
let tpMaandBrokerIdx = 0;
let tpMaandYear = new Date().getFullYear();

function cycleTpMaandBroker() {
    tpMaandBrokerIdx = (tpMaandBrokerIdx + 1) % TP_MAAND_BROKERS.length;
    const broker = TP_MAAND_BROKERS[tpMaandBrokerIdx];
    const btn = document.getElementById('tpMaandBrokerBtn');
    if (btn) btn.textContent = TP_MAAND_LABELS[broker] + ' ▾';
    renderTpMaandoverzicht();
}

function renderTpMaandoverzicht() {
    const head    = document.getElementById('tpMaandTableHead');
    const body    = document.getElementById('tpMaandTableBody');
    const yearLbl = document.getElementById('tpMaandYearLabel');
    if (!head || !body || !yearLbl) return;
    yearLbl.textContent = tpMaandYear;

    const broker    = TP_MAAND_BROKERS[tpMaandBrokerIdx];
    const brokerKey = broker === 'all' ? 'value' : broker.toLowerCase();
    const isBlurred = document.querySelector('.blur-target')?.classList.contains('blur');

    const getVal = (entry) => entry[brokerKey] ?? null;

    // Groepeer portfolio history per YYYY-MM (history heeft 'YYYY-MM-DD' datums)
    const isWeekday = d => { const dow = new Date(d).getDay(); return dow !== 0 && dow !== 6; };
    const allHistory = loadPortfolioHistory()
        .filter(h => isWeekday(h.date) && getVal(h) != null);

    const byMonth = {};
    allHistory.forEach(entry => {
        const key = entry.date.slice(0, 7); // 'YYYY-MM'
        if (!byMonth[key]) byMonth[key] = [];
        byMonth[key].push(entry);
    });

    // Rijen per maand van het geselecteerde jaar
    const months = [];
    for (let m = 1; m <= 12; m++) {
        const key     = `${tpMaandYear}-${String(m).padStart(2,'0')}`;
        const entries = byMonth[key];
        if (!entries || entries.length === 0) {
            months.push({ month: m, start: null, end: null, diff: null, perc: null });
            continue;
        }
        const prevM   = m === 1 ? 12 : m - 1;
        const prevY   = m === 1 ? tpMaandYear - 1 : tpMaandYear;
        const prevKey = `${prevY}-${String(prevM).padStart(2,'0')}`;
        const prevEntries = byMonth[prevKey];

        const endVal = getVal(entries[entries.length - 1]);
        let startVal = null;
        if (prevEntries && prevEntries.length > 0) {
            startVal = getVal(prevEntries[prevEntries.length - 1]);
        } else {
            startVal = entries.length > 1 ? getVal(entries[0]) : null;
        }

        const diff = startVal !== null ? endVal - startVal : null;
        const perc = startVal !== null && startVal !== 0 ? ((endVal - startVal) / startVal) * 100 : null;
        months.push({ month: m, end: endVal, diff, perc });
    }

    // Jaarstotaal
    const validMonths  = months.filter(m => m.diff !== null);
    const jaarDiff     = validMonths.reduce((s, m) => s + m.diff, 0);
    const firstValidEnd = validMonths.length > 0 ? validMonths[0].end - validMonths[0].diff : null;
    const jaarPerc      = firstValidEnd && firstValidEnd !== 0 ? (jaarDiff / firstValidEnd) * 100 : null;

    head.innerHTML = `<tr>
        <th>Maand</th><th>Rendement €</th><th>Rendement %</th><th>Eindwaarde</th>
    </tr>`;

    body.innerHTML = months.map(m => {
        if (m.diff === null) {
            return `<tr><td>${TP_MAAND_NL[m.month-1]}</td>
                <td colspan="3" style="color:var(--text-muted);font-size:0.75rem;text-align:right;">geen data</td></tr>`;
        }
        const color   = m.diff >= 0 ? 'var(--success)' : 'var(--danger)';
        const sign    = m.diff >= 0 ? '+' : '';
        const euroStr = isBlurred ? '€ •••' : `${sign}${fmtEuroAlt(m.diff, 0)}`;
        const percStr = m.perc !== null ? `${sign}${m.perc.toFixed(2)}%` : '–';
        const eindStr = isBlurred ? '€ •••' : fmtEuroAlt(m.end, 0);
        return `<tr><td>${TP_MAAND_NL[m.month-1]}</td>
            <td style="color:${color};font-weight:700;">${euroStr}</td>
            <td style="color:${color};font-weight:700;">${percStr}</td>
            <td>${eindStr}</td></tr>`;
    }).join('');

    if (validMonths.length > 0) {
        const color = jaarDiff >= 0 ? 'var(--success)' : 'var(--danger)';
        const sign  = jaarDiff >= 0 ? '+' : '';
        body.innerHTML += `<tr class="maand-totaal">
            <td>Jaar ${tpMaandYear}</td>
            <td style="color:${color};">${isBlurred ? '€ •••' : sign + fmtEuroAlt(jaarDiff, 0)}</td>
            <td style="color:${color};">${jaarPerc !== null ? sign + jaarPerc.toFixed(2) + '%' : '–'}</td>
            <td></td></tr>`;
    }
}

// ── TEST WEEKOVERZICHT ────────────────────────────────────────────────────────
const TP_WEEK_BROKERS = ['all', 'Bolero', 'Degiro', 'Saxo'];
const TP_WEEK_LABELS  = { all:'TOTAAL', Bolero:'BOLERO', Degiro:'DEGIRO', Saxo:'SAXO' };
let tpWeekBrokerIdx = 0;
let tpWeekYear = new Date().getFullYear();

function cycleTpWeekBroker() {
    tpWeekBrokerIdx = (tpWeekBrokerIdx + 1) % TP_WEEK_BROKERS.length;
    const broker = TP_WEEK_BROKERS[tpWeekBrokerIdx];
    const btn = document.getElementById('tpWeekBrokerBtn');
    if (btn) btn.textContent = TP_WEEK_LABELS[broker] + ' ▾';
    renderTpWeekoverzicht();
}

// ISO week berekening voor YYYY-MM-DD format
function getTpISOWeekAndYear(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setHours(0, 0, 0, 0);
    const thursday = new Date(date);
    thursday.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(thursday.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((thursday - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return { week: weekNum, year: thursday.getFullYear() };
}

function renderTpWeekoverzicht() {
    const head    = document.getElementById('tpWeekTableHead');
    const body    = document.getElementById('tpWeekTableBody');
    const yearLbl = document.getElementById('tpWeekYearLabel');
    if (!head || !body || !yearLbl) return;
    yearLbl.textContent = tpWeekYear;

    const broker    = TP_WEEK_BROKERS[tpWeekBrokerIdx];
    const brokerKey = broker === 'all' ? 'value' : broker.toLowerCase();
    const isBlurred = document.querySelector('.blur-target')?.classList.contains('blur');

    const getVal = (entry) => entry[brokerKey] ?? null;

    const isWeekday = d => { const dow = new Date(d).getDay(); return dow !== 0 && dow !== 6; };
    const allHistory = loadPortfolioHistory()
        .filter(h => isWeekday(h.date) && getVal(h) != null);

    // Groepeer per ISO-week
    const byWeek = {};
    allHistory.forEach(entry => {
        const wi = getTpISOWeekAndYear(entry.date);
        const key = `${wi.year}-W${String(wi.week).padStart(2,'0')}`;
        if (!byWeek[key]) byWeek[key] = [];
        byWeek[key].push(entry);
    });

    const allKeysSorted = Object.keys(byWeek).sort();
    const yearKeys      = allKeysSorted.filter(k => k.startsWith(`${tpWeekYear}-W`));

    head.innerHTML = `<tr>
        <th>Week</th><th>Periode</th>
        <th style="text-align:right;">Rendement €</th>
        <th style="text-align:right;">Rendement %</th>
        <th style="text-align:right;">Eindwaarde</th>
    </tr>`;

    if (yearKeys.length === 0) {
        body.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">Geen data voor ${tpWeekYear}</td></tr>`;
        return;
    }

    const sortedKeys = [...yearKeys].reverse();
    let totalDiff = 0;
    const rows = [];

    sortedKeys.forEach(key => {
        const entries = byWeek[key];
        const weekNum = parseInt(key.split('-W')[1]);
        const lastEntry = entries[entries.length - 1];
        const endVal    = getVal(lastEntry);

        // Startwaarde = laatste punt van vorige week
        const globalIdx = allKeysSorted.indexOf(key);
        let startVal = null;
        if (allKeysSorted.indexOf(key) > 0) {
            const prevKey     = allKeysSorted[globalIdx - 1];
            const prevEntries = byWeek[prevKey];
            startVal = getVal(prevEntries[prevEntries.length - 1]);
        } else if (entries.length > 1) {
            startVal = getVal(entries[0]);
        }

        // Datumrange tonen: DD/MM
        const fmtDate = (iso) => { const [, m, d] = iso.split('-'); return `${d}/${m}`; };
        const firstEntry  = entries[0];
        const periodeStr  = firstEntry.date === lastEntry.date
            ? fmtDate(firstEntry.date)
            : `${fmtDate(firstEntry.date)} – ${fmtDate(lastEntry.date)}`;

        if (startVal === null) {
            rows.push(`<tr>
                <td style="font-weight:700;color:var(--text-muted);font-size:0.75rem;">W${weekNum}</td>
                <td style="font-size:0.78rem;">${periodeStr}</td>
                <td colspan="3" style="text-align:right;color:var(--text-muted);font-size:0.75rem;">geen vorige week</td>
            </tr>`);
            return;
        }

        const diff    = endVal - startVal;
        const perc    = startVal !== 0 ? (diff / startVal) * 100 : null;
        totalDiff += diff;
        const color   = diff >= 0 ? 'var(--success)' : 'var(--danger)';
        const sign    = diff >= 0 ? '+' : '';
        const euroStr = isBlurred ? '€ •••' : `${sign}${fmtEuroAlt(diff, 0)}`;
        const percStr = perc !== null ? `${sign}${perc.toFixed(2)}%` : '–';
        const eindStr = isBlurred ? '€ •••' : fmtEuroAlt(endVal, 0);

        rows.push(`<tr style="border-bottom:1px solid var(--border-color);">
            <td style="font-weight:700;color:var(--text-muted);font-size:0.75rem;">W${weekNum}</td>
            <td style="font-size:0.78rem;">${periodeStr}</td>
            <td style="text-align:right;color:${color};font-weight:700;">${euroStr}</td>
            <td style="text-align:right;color:${color};font-weight:700;">${percStr}</td>
            <td style="text-align:right;">${eindStr}</td>
        </tr>`);
    });

    body.innerHTML = rows.join('');

    // Totaalrij
    const hasRows = sortedKeys.some(k => allKeysSorted.indexOf(k) > 0 || yearKeys.indexOf(k) > 0);
    if (hasRows) {
        const color = totalDiff >= 0 ? 'var(--success)' : 'var(--danger)';
        const sign  = totalDiff >= 0 ? '+' : '';
        body.innerHTML += `<tr class="week-totaal">
            <td colspan="2">Jaar ${tpWeekYear}</td>
            <td style="text-align:right;color:${color};">${isBlurred ? '€ •••' : sign + fmtEuroAlt(totalDiff, 0)}</td>
            <td style="text-align:right;color:var(--text-muted);">–</td>
            <td></td>
        </tr>`;
    }
}

const _tpCollapsed = {};
function tpToggleList(id, hdr) {
    const el = document.getElementById(id);
    if (!el) return;
    _tpCollapsed[id] = !_tpCollapsed[id];
    const isCollapsed = _tpCollapsed[id];
    el.style.display = isCollapsed ? 'none' : '';
    hdr.classList.toggle('collapsed', isCollapsed);
    hdr.closest('.ap-card-toplist')?.classList.toggle('tp-card-collapsed', isCollapsed);
}

function renderTpCashEditor() {
    const editor    = document.getElementById('tp-cashEditor');
    const cashEl    = document.getElementById('tp-cash');
    const breakdown = document.getElementById('tp-cashBreakdown');
    if (!editor) return;
    if (_tpBrokerFilter === 'all') {
        // Totaal cash: waarde altijd zichtbaar, uitsplitsing per broker in breakdown (altijd zichtbaar op mobiel)
        if (cashEl) cashEl.style.display = '';
        if (breakdown) breakdown.innerHTML = ['Bolero','Degiro','Saxo']
            .map(b => `<span style="margin-right:8px;white-space:nowrap;">` +
                `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${brokerColorVar(b)};margin-right:2px;vertical-align:middle;"></span>` +
                `<span class="blur-target">${b} ${fmtEuroAlt(_apCash[b] || 0)}</span></span>`)
            .join('');
        editor.innerHTML = ''; // editor leeg laten (breakdown is zichtbaar)
    } else {
        // Broker-tab: alleen waarde tonen, geen input (voorkomt duplicate)
        if (cashEl) cashEl.style.display = '';
        if (breakdown) breakdown.innerHTML = '';
        editor.innerHTML = '';
    }
}

function setTpCashFor(broker, val) {
    _apCash[broker] = parseFloat(val) || 0;
    saveApCash();
    initTestPortfolio();
}

function setTpSort(key) {
    if (_tpSortKey === key) {
        _tpSortDir = _tpSortDir === 'asc' ? 'desc' : 'asc';
    } else {
        _tpSortKey = key;
        _tpSortDir = 'desc';
    }
    if (_tpLastEnriched && _tpLastTotalValue != null) {
        const sortOpts = { key: _tpSortKey, dir: _tpSortDir, fn: 'setTpSort' };
        if (_tpPositionsView === 'sector') {
            renderBySector('tp-bySector', _tpLastEnriched, _tpLastTotalValue, false, sortOpts);
        } else {
            renderAllPositions(_tpLastEnriched, _tpLastTotalValue, 'tp-allPositions', sortOpts);
        }
    }
}

function setTpPositionsView(view, btn) {
    _tpPositionsView = view;
    document.querySelectorAll('#test-portfolio-page .ap-view-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    document.getElementById('tp-positionsTitle').textContent = view === 'sector' ? 'POSITIES PER SECTOR' : 'ALLE POSITIES';
    document.getElementById('tp-bySector').style.display     = view === 'sector' ? '' : 'none';
    document.getElementById('tp-allPositions').style.display = view === 'all'    ? '' : 'none';
    if (_tpLastEnriched && _tpLastTotalValue != null) {
        const sortOpts = { key: _tpSortKey, dir: _tpSortDir, fn: 'setTpSort' };
        if (view === 'sector') {
            renderBySector('tp-bySector', _tpLastEnriched, _tpLastTotalValue, false, sortOpts);
        } else {
            renderAllPositions(_tpLastEnriched, _tpLastTotalValue, 'tp-allPositions', sortOpts);
        }
    }
}

function renderTpSectorPie(positions, totalValue) {
    const canvas   = document.getElementById('tp-sectorPie');
    const legendEl = document.getElementById('tp-sectorLegend');
    if (!canvas || !legendEl) return;

    const bySector = {};
    positions.forEach(p => {
        if (!bySector[p.sector]) bySector[p.sector] = 0;
        bySector[p.sector] += p.valueEur;
    });
    const entries = Object.entries(bySector).sort((a,b) => b[1] - a[1]);

    if (entries.length === 0 || totalValue === 0) {
        if (_tpSectorChart) { _tpSectorChart.destroy(); _tpSectorChart = null; }
        legendEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Geen data</div>';
        return;
    }

    const labels = entries.map(([sec]) => sec);
    const values = entries.map(([, v]) => v);
    const colors = entries.map((_, i) => sectorColor(i));

    if (_tpSectorChart) _tpSectorChart.destroy();
    const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg').trim() || '#fff';
    _tpSectorChart = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: cardBg,
                borderWidth: 2,
                hoverOffset: 8,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.parsed;
                            const pct = (v / totalValue) * 100;
                            return `${fmtEuroAlt(v)} (${pct.toFixed(1)}%)`;
                        }
                    }
                },
                datalabels: { display: false }
            }
        }
    });

    legendEl.innerHTML = entries.map(([sec, val], i) => {
        const pct = (val / totalValue) * 100;
        return `<div class="ap-pie-legend-row" title="${sec}">
            <span class="ap-pie-dot" style="background:${colors[i]};"></span>
            <span class="ap-pie-name">${sec}</span>
            <span class="ap-pie-spacer"></span>
            <span class="ap-pie-val blur-target">${fmtEuroAlt(val, 0)}</span>
            <span class="ap-pie-pct">${pct.toFixed(1)}%</span>
        </div>`;
    }).join('');
}

async function initTestPortfolio(force = false) {
    // Guard: sla over als er al een fetch loopt (tenzij manuele vernieuwing)
    if (_tpIsFetching && !force) return;
    if (_tpIsFetching && force) {
        // Manuele vernieuwing: wacht even zodat lopende fetch kan afronden
        await new Promise(r => setTimeout(r, 200));
    }
    _tpIsFetching = true;
    try {
    // Annuleer lopende retry-timers
    if (_tpRetryTimeout) { clearTimeout(_tpRetryTimeout); _tpRetryTimeout = null; }
    const status = document.getElementById('testPfStatus');
    // Toon laadstatus alleen bij manuele vernieuwing (niet bij achtergrond auto-refresh)
    if (force && status) status.textContent = '⏳ Laden…';
    // Bij expliciete vernieuwing: cache wissen zodat verse koersen worden opgehaald
    if (force) _quoteCache.clear();

    document.querySelectorAll('#test-portfolio-page .ap-broker-tab').forEach(b => {
        b.classList.toggle('active', b.dataset.broker === _tpBrokerFilter);
    });
    const pg = document.getElementById('test-portfolio-page');
    if (pg) {
        if (_tpBrokerFilter === 'all') pg.removeAttribute('data-broker');
        else pg.setAttribute('data-broker', _tpBrokerFilter);
    }

    let positions = hmStocks.filter(s => (s.type === 'stock' || s.type === 'etf') && (s.aantal || 0) > 0);
    if (_tpBrokerFilter !== 'all') {
        positions = positions.filter(s => (s.broker || 'Degiro') === _tpBrokerFilter);
    }

    const cashEur = getCashForBroker(_tpBrokerFilter);
    const cashEl  = document.getElementById('tp-cash');
    if (cashEl) cashEl.textContent = fmtEuroAlt(cashEur, 0);
    renderTpCashEditor();

    if (positions.length === 0) {
        const totalCard = document.getElementById('tp-totalValue');
        if (totalCard) totalCard.textContent = fmtEuroAlt(cashEur, 0);
        const stortingEmpty = tdCashflows.length > 0 ? getTdNetStorting(_tpBrokerFilter) : getStortingForBroker(_tpBrokerFilter);
        document.getElementById('tp-totalCost').textContent = 'Gestort: ' + fmtEuroAlt(stortingEmpty, 0);
        ['tp-totalPL','tp-totalPLPct','tp-dayPL','tp-dayPLPct','tp-positions','tp-positionsBreakdown']
            .forEach(id => { const e = document.getElementById(id); if (e) e.textContent = '–'; });
        const emptyList = '<div class="ap-toplist-empty">Geen posities</div>';
        const bl = document.getElementById('tp-bestList');  if (bl) bl.innerHTML = emptyList;
        const wl = document.getElementById('tp-worstList'); if (wl) wl.innerHTML = emptyList;
        if (_tpSectorChart) { _tpSectorChart.destroy(); _tpSectorChart = null; }
        if (_tpBrokerChart) { _tpBrokerChart.destroy(); _tpBrokerChart = null; }
        const lg = document.getElementById('tp-sectorLegend');
        if (lg) lg.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">Geen posities. Voeg eerst aandelen toe in DATA → AANDELEN.</div>';
        if (status) status.textContent = '';
        renderPortfolioHistoryChart();
        return;
    }

    const usdEur = await getUsdEurRate();
    // Quotes gebatcht laden (5 tegelijk, 80ms pauze) om Finnhub rate-limit te vermijden
    const quotes = await loadAllQuotesBatched(positions);
    const enriched = await Promise.all(positions.map(async (s, i) => {
        const q = quotes[i];
        const sector = await fetchSector(s.ticker, s.type);
        // q.currency heeft voorrang: als US-equivalent gebruikt wordt, is prijs altijd USD
        const cur = (q?.currency || s.currency || 'USD').toUpperCase();
        const fx = cur === 'EUR' ? 1 : usdEur;
        const price     = q?.price ?? 0;
        const dayChange = q?.change ?? 0;
        const aantal    = s.aantal || 0;
        const gak       = s.gak || 0;
        const noQuote       = !q || !q.price;
        const yahooFallback = !noQuote && q?.source === 'yahoo';
        // GAK staat opgeslagen in s.currency (originele aankoopvaluta)
        // Als q.currency afwijkt (US-equivalent gebruikt), apart omrekenen
        const gakCur = (s.currency || 'USD').toUpperCase();
        const gakFx  = gakCur === 'EUR' ? 1 : usdEur;
        const valueEur  = price * aantal * fx;
        const costEur   = gak   * aantal * gakFx;
        const plEur     = valueEur - costEur;
        const plPct     = costEur > 0 && !noQuote ? (plEur / costEur) * 100 : null;
        const dayPLEur  = dayChange * aantal * fx;
        const dayPLPct  = q?.pct ?? null;
        return { ...s, q, sector, price, noQuote, yahooFallback, valueEur, costEur, plEur, plPct, dayPLEur, dayPLPct };
    }));

    const positionsValue = enriched.reduce((a,x) => a + x.valueEur, 0);
    const totalCost      = enriched.reduce((a,x) => a + x.costEur,  0);
    const totalValue     = positionsValue + cashEur;
    const totalPL        = positionsValue - totalCost;
    const totalPLPct     = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    const dayPL          = enriched.reduce((a,x) => a + x.dayPLEur, 0);
    const dayPLPct       = positionsValue > 0 ? (dayPL / (positionsValue - dayPL)) * 100 : 0;

    document.getElementById('tp-totalValue').textContent = fmtEuroAlt(totalValue, 0);
    const stortingEur = tdCashflows.length > 0 ? getTdNetStorting(_tpBrokerFilter) : getStortingForBroker(_tpBrokerFilter);
    const cashLine = cashEur > 0 ? ` &nbsp;·&nbsp; Cash: ${fmtEuroAlt(cashEur, 0)}` : '';
    document.getElementById('tp-totalCost').innerHTML = 'Gestort: ' + fmtEuroAlt(stortingEur, 0) + cashLine;

    const tplEl = document.getElementById('tp-totalPL');
    tplEl.textContent = (totalPL >= 0 ? '+' : '') + fmtEuroAlt(totalPL, 0);
    tplEl.style.color = totalPL >= 0 ? 'var(--success)' : 'var(--danger)';
    const mkChip = (pct) => {
        if (pct == null || isNaN(pct)) return '<span class="tp-hero-pct-chip neu">–</span>';
        const cls = pct >= 0 ? 'pos' : 'neg';
        const s   = pct >= 0 ? '+' : '';
        return `<span class="tp-hero-pct-chip ${cls}">${s}${pct.toFixed(2)}%</span>`;
    };
    document.getElementById('tp-totalPLPct').innerHTML = mkChip(totalPLPct);

    const dplEl = document.getElementById('tp-dayPL');
    dplEl.textContent = (dayPL >= 0 ? '+' : '') + fmtEuroAlt(dayPL, 0);
    dplEl.style.color = dayPL >= 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('tp-dayPLPct').innerHTML = mkChip(dayPLPct);

    const stockCnt = enriched.filter(x => x.type === 'stock').length;
    const etfCnt   = enriched.filter(x => x.type === 'etf').length;
    document.getElementById('tp-positions').textContent = `${enriched.length}`;
    document.getElementById('tp-positionsBreakdown').textContent = `${stockCnt} aandelen · ${etfCnt} ETFs`;

    const sortedByPct = [...enriched].filter(x => x.plPct != null).sort((a,b) => b.plPct - a.plPct);
    const top5Best  = sortedByPct.filter(x => x.plPct > 0).slice(0, 5);
    const top5Worst = sortedByPct.filter(x => x.plPct < 0).slice(-5).reverse();

    const renderTopList = (items, isBest, useDay = false) => {
        if (items.length === 0) return '<div style="text-align:center;padding:12px;color:var(--text-muted);font-size:0.8rem;">Geen data</div>';
        return '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px;">' +
            items.map(p => {
                const pct = useDay ? p.dayPLPct : p.plPct;
                const eur = useDay ? p.dayPLEur : p.plEur;
                const absPct = Math.abs(pct);
                const intensity = Math.min(absPct / 20, 1);
                const bgColor = pct > 0
                    ? `rgba(27,153,84,${0.55 + intensity * 0.35})`
                    : `rgba(192,57,43,${0.55 + intensity * 0.35})`;
                const displayTicker = p.ticker.replace(/-USD$/i, '');
                return `<div class="hm-cell-compact" style="background:${bgColor};color:#fff;" title="${p.name}">
                    <div style="font-size:0.58rem;font-weight:800;letter-spacing:0.02em;opacity:0.9;">${displayTicker}</div>
                    <div style="font-size:0.78rem;font-weight:800;">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</div>
                    <div class="blur-target" style="font-size:0.58rem;opacity:0.75;">${eur >= 0 ? '+' : ''}${fmtEuroAlt(eur, 0)}</div>
                </div>`;
            }).join('') +
            '</div>';
    };

    // Vandaag winners/verliezers (geen opties)
    const sortedByDay   = [...enriched].filter(x => x.dayPLPct != null).sort((a,b) => b.dayPLPct - a.dayPLPct);
    const dayBest       = sortedByDay.filter(x => x.dayPLPct > 0).slice(0, 5);
    const dayWorst      = sortedByDay.filter(x => x.dayPLPct < 0).slice(-5).reverse();

    const dayBestEl  = document.getElementById('tp-dayBestList');
    const dayWorstEl = document.getElementById('tp-dayWorstList');
    if (dayBestEl)  dayBestEl.innerHTML  = renderTopList(dayBest,  true,  true);
    if (dayWorstEl) dayWorstEl.innerHTML = renderTopList(dayWorst, false, true);

    const bestEl  = document.getElementById('tp-bestList');
    const worstEl = document.getElementById('tp-worstList');
    if (bestEl)  bestEl.innerHTML  = renderTopList(top5Best,  true);
    if (worstEl) worstEl.innerHTML = renderTopList(top5Worst, false);

    _tpLastEnriched   = enriched;
    _tpLastTotalValue = positionsValue;

    // Broker pie alleen bij TOTAAL (bij broker-tab is het altijd 100%)
    const brokerPieWrap = document.getElementById('tp-brokerPieWrap');
    if (_tpBrokerFilter === 'all') {
        if (brokerPieWrap) brokerPieWrap.style.display = '';
        renderTpBrokerPie(enriched, cashEur);
    } else {
        if (brokerPieWrap) brokerPieWrap.style.display = 'none';
        if (_tpBrokerChart) { _tpBrokerChart.destroy(); _tpBrokerChart = null; }
    }
    renderTpSectorPie(enriched, positionsValue);
    const sortOpts = { key: _tpSortKey, dir: _tpSortDir, fn: 'setTpSort' };
    renderBySector('tp-bySector', enriched, positionsValue, false, sortOpts);
    renderAllPositions(enriched, positionsValue, 'tp-allPositions', sortOpts);

    // Startdatum + dagen + CAGR
    const brokerKey   = { all: 'value', Bolero: 'bolero', Degiro: 'degiro', Saxo: 'saxo' }[_tpBrokerFilter] || 'value';
    const startDateStr = BROKER_HISTORY_START[_tpBrokerFilter] || PORTFOLIO_HISTORY_START;
    const histAll     = loadPortfolioHistory().filter(h => h.date >= startDateStr && h[brokerKey] != null);
    const startEl = document.getElementById('tp-hero-start');
    if (startEl && histAll.length > 0) {
        startEl.style.display = '';
        const firstEntry = histAll[0];
        const startD     = new Date(firstEntry.date);
        const days       = Math.round((new Date() - startD) / 86400000);
        const [y, m]     = firstEntry.date.split('-');
        document.getElementById('tp-startDate').textContent = `${m}/${y}`;
        document.getElementById('tp-startDays').textContent = `${days.toLocaleString('nl-NL')} dagen`;
    } else {
        if (startEl) startEl.style.display = 'none';
    }

    // Backfill historische data (eens per dag automatisch, of bij 'all' filter)
    if (_tpBrokerFilter === 'all') await runPortfolioBackfill();

    // Meest recente koerstijd + aantal geladen quotes
    const livePositions = enriched;
    const loadedQuotes  = livePositions.filter(x => x.q?.price != null && x.q.price > 0);
    const priceTimes = loadedQuotes
        .filter(x => x.q.time instanceof Date)
        .map(x => x.q.time.getTime())
        .filter(t => isFinite(t) && t > 0);
    const latestPriceTime = priceTimes.length > 0 ? new Date(Math.max(...priceTimes)) : null;
    const timeStr = latestPriceTime
        ? latestPriceTime.toLocaleTimeString('nl-NL', {hour:'2-digit', minute:'2-digit'})
        : new Date().toLocaleTimeString('nl-NL', {hour:'2-digit', minute:'2-digit'});
    const allOk  = loadedQuotes.length === livePositions.length && livePositions.length > 0;
    const someOk = loadedQuotes.length > 0 && !allOk;
    const dotCol = allOk ? 'var(--success)' : someOk ? '#f39c12' : 'var(--danger)';
    const label  = allOk ? `Koersen: ${timeStr}` : someOk ? `Koersen: ${timeStr} · niet volledig` : 'Koersen: niet geladen';
    if (status) status.innerHTML =
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotCol};margin-right:5px;vertical-align:middle;box-shadow:0 0 4px ${dotCol};"></span>${label}`;

    // Automatisch opnieuw proberen voor mislukte koersen
    if (!allOk) scheduleQuoteRetry(enriched, cashEur, usdEur, 1);
    } finally {
        _tpIsFetching = false;
    }
}

function scheduleQuoteRetry(enriched, cashEur, usdEur, attempt) {
    if (_tpRetryTimeout) clearTimeout(_tpRetryTimeout);
    const maxAttempts = 6;
    if (attempt > maxAttempts) return;
    const delay = Math.min(1500 * Math.pow(2, attempt - 1), 30000); // 1.5s → 3s → 6s → 12s → 24s → 30s
    _tpRetryTimeout = setTimeout(() => retryFailedQuotes(enriched, cashEur, usdEur, attempt), delay);
}

async function retryFailedQuotes(enriched, cashEur, usdEur, attempt) {
    const failed = enriched.filter(x => x.noQuote);
    if (failed.length === 0) return;

    failed.forEach(x => _quoteCache.delete((x.ticker || '') + '|' + (x.type || '')));
    const retried = await loadAllQuotesBatched(failed);

    let anyNew = false;
    failed.forEach((pos, i) => {
        const q = retried[i];
        if (!q || !q.price) return;
        const idx    = enriched.indexOf(pos);
        if (idx === -1) return;
        const cur    = (q.currency || pos.currency || 'USD').toUpperCase();
        const fx     = cur === 'EUR' ? 1 : usdEur;
        const gakCur = (pos.currency || 'USD').toUpperCase();
        const gakFx  = gakCur === 'EUR' ? 1 : usdEur;
        const price     = q.price;
        const dayChange = q.change ?? 0;
        const valueEur  = price * pos.aantal * fx;
        const costEur   = (pos.gak || 0) * pos.aantal * gakFx;
        const plEur     = valueEur - costEur;
        enriched[idx] = { ...pos, q, price, noQuote: false,
            yahooFallback: q.source === 'yahoo',
            valueEur, costEur, plEur,
            plPct:    costEur > 0 ? (plEur / costEur) * 100 : null,
            dayPLEur: dayChange * pos.aantal * fx,
            dayPLPct: q.pct ?? null };
        anyNew = true;
    });

    if (!anyNew) { scheduleQuoteRetry(enriched, cashEur, usdEur, attempt + 1); return; }

    // Sla alle posities op en herrender via renderTpFromEnriched
    // (handelt broker-filtering correct af, ook als gebruiker op een brokertab staat)
    _tpLastEnriched = enriched;
    renderTpFromEnriched(enriched);

    // Status bijwerken
    const loadedQuotes = enriched.filter(x => x.q?.price != null && x.q.price > 0);
    const allOk  = loadedQuotes.length === enriched.length && enriched.length > 0;
    const someOk = loadedQuotes.length > 0 && !allOk;
    const dotCol = allOk ? 'var(--success)' : someOk ? '#f39c12' : 'var(--danger)';
    const priceTimes = loadedQuotes.filter(x => x.q.time instanceof Date).map(x => x.q.time.getTime()).filter(t => isFinite(t) && t > 0);
    const timeStr = (priceTimes.length > 0 ? new Date(Math.max(...priceTimes)) : new Date()).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    const label = allOk ? `Koersen: ${timeStr}` : someOk ? `Koersen: ${timeStr} · niet volledig` : 'Koersen: niet geladen';
    const status = document.getElementById('testPfStatus');
    if (status) status.innerHTML =
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotCol};margin-right:5px;vertical-align:middle;box-shadow:0 0 4px ${dotCol};"></span>${label}`;

    if (!allOk) scheduleQuoteRetry(enriched, cashEur, usdEur, attempt + 1);
}
