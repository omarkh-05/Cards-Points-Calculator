 const KINGDOM_VALUES = {
        'latsh': -15, 'dinari': -10, 'banat': -25, 'sheikh': -75
    };

    const COMPLEX_OPTIONS = [
        { id: 'latsh', name: 'لطوش' },
        { id: 'dinari', name: 'ديناري' },
        { id: 'banat', name: 'بنات' },
        { id: 'sheikh', name: 'شيخ كبة' }
    ];

    const RANGE_LIMITS = {
        'latsh': { min: 0, max: 13, sum: 13 },
        'dinari': { min: 0, max: 13, sum: 13 },
        'banat': { min: 4, max: 8, sum: 8 },
        'sheikh': { min: 1, max: 2, sum: 2 },
        'trix': { min: 1, max: 4, sum: 10 },
        'tarneeb': { min: 0, max: 26, sum: 26 },
        'hand': { min: -60, max: 300, sum: 500 }
    };

    const INITIAL_KINGDOMS = {
        trix: [
            { id: 'latsh', name: 'لطوش (-15)', val: -15 },
            { id: 'dinari', name: 'ديناري (-10)', val: -10 },
            { id: 'banat', name: 'بنات (-25)', val: -25 },
            { id: 'sheikh', name: 'شيخ كبة (-75)', val: -75 },
            { id: 'trix', name: 'تركس (مركز)', val: 'rank' }
        ],
        complex: [
            { id: 'complex', name: 'كومبليكس', val: 'complex' },
            { id: 'trix', name: 'تركس (مركز)', val: 'rank' }
        ]
    };

    let gameState = {
        type: '', mode: 'normal', players: [], roundActive: false, availableKingdoms: []
    };

    function initGame(type, title) {
        gameState.type = type;
        gameState.players = [];
        gameState.roundActive = false;
        gameState.mode = (type === 'tarneeb') ? 'team' : 'normal';
        gameState.availableKingdoms = INITIAL_KINGDOMS[type] ? [...INITIAL_KINGDOMS[type]] : [];
        
        document.getElementById('current-game-title').innerText = title;
        document.getElementById('mode-selector').style.display = (type === 'tarneeb') ? 'none' : 'block';
        document.getElementById('tarneeb-cheat-btn').style.display = (type === 'tarneeb') ? 'block' : 'none';
        
        setMode(gameState.mode, true);
        setupKingdoms();
        renderPlayers();
        updateRoundButton();
        switchView('game');
    }

    function setupKingdoms() {
        const section = document.getElementById('kingdom-section');
        const select = document.getElementById('kingdom-select');
        if (gameState.type === 'trix' || gameState.type === 'complex') {
            section.style.display = 'block';
            if (gameState.availableKingdoms.length === 0) gameState.availableKingdoms = [...INITIAL_KINGDOMS[gameState.type]];
            select.innerHTML = '';
            gameState.availableKingdoms.forEach(k => {
                const opt = document.createElement('option');
                opt.value = k.id; opt.innerText = k.name; select.appendChild(opt);
            });
        } else {
            section.style.display = 'none';
        }
    }

    function toggleRound() {
        if (gameState.players.length === 0) {
            showSimpleModal("تنبيه", "يرجى إضافة لاعبين قبل بدء الجولة.");
            return;
        }
        gameState.roundActive = !gameState.roundActive;
        
        if (!gameState.roundActive) {
            const select = document.getElementById('kingdom-select');
            if (select && select.options.length > 0 && (gameState.type === 'trix' || gameState.type === 'complex')) {
                const selectedId = select.value;
                gameState.availableKingdoms = gameState.availableKingdoms.filter(k => k.id !== selectedId);
                
                if (gameState.availableKingdoms.length === 0) {
                    gameState.availableKingdoms = [...INITIAL_KINGDOMS[gameState.type]];
                    showSimpleModal("دورة جديدة", "انتهت الخيارات المتاحة، تم إعادة تحميل الممالك لدورة جديدة.");
                }
                setupKingdoms();
            }
            gameState.players.forEach(p => { p.usedComplexOptions = []; });
        }
        updateRoundButton();
        renderPlayers();
    }

    function updateRoundButton() {
        const btn = document.getElementById('btn-round-control');
        btn.innerText = gameState.roundActive ? "أنهِ الجولة 🏁" : "ابدأ الجولة 🚀";
        btn.className = gameState.roundActive ? "btn-main btn-end-round" : "btn-main btn-start";
    }

    function addPlayer() {
        const input = document.getElementById('player-input');
        const name = input.value.trim();
        if (!name) return;
        if (gameState.mode === 'normal' && gameState.players.length >= 4) return showSimpleModal("تنبيه", "أقصى عدد لاعبين هو 4.");
        if (gameState.mode === 'team' && gameState.players.length >= 2) return showSimpleModal("تنبيه", "أقصى عدد فرق هو 2.");
        gameState.players.push({ 
            id: Date.now(), 
            name, 
            score: 0, 
            history: [],
            usedComplexOptions: []
        });
        input.value = '';
        renderPlayers();
    }

    function renderPlayers() {
        const list = document.getElementById('players-list');
        list.innerHTML = '';
        const kingdomId = document.getElementById('kingdom-select')?.value;
        const isComplexKingdom = (gameState.type === 'complex' && kingdomId === 'complex');
        document.getElementById('bulk-action-container').style.display = (gameState.roundActive && !isComplexKingdom) ? 'block' : 'none';

        gameState.players.forEach(p => {
            const card = document.createElement('div');
            card.className = 'player-card';
            let historyHtml = p.history.length > 0 
                ? p.history.map(h => `<span class="history-badge ${h >= 0 ? 'positive' : 'negative'}">${h >= 0 ? '+' : ''}${h}</span>`).join('')
                : '<span class="empty-history">لا يوجد سجل</span>';

            let actionHtml = '';
            if (gameState.roundActive) {
                if (isComplexKingdom) {
                    const availableOptions = COMPLEX_OPTIONS.filter(opt => !p.usedComplexOptions.includes(opt.id));
                    if (availableOptions.length > 0) {
                        actionHtml = `
                            <div class="complex-controls" style="display:flex; flex-direction:column; gap:8px; background:rgba(0,0,0,0.2); padding:10px; border-radius:10px;">
                                <select id="k-select-${p.id}">
                                    ${availableOptions.map(opt => `<option value="${opt.id}">${opt.name}</option>`).join('')}
                                </select>
                                <div style="display:flex; gap:8px;">
                                    <input type="number" id="in-${p.id}" placeholder="العدد..." inputmode="numeric">
                                    <button class="btn-individual" onclick="addComplexScore(${p.id})">إضافة</button>
                                </div>
                            </div>`;
                    } else {
                        actionHtml = `<div style="text-align:center; padding:10px; font-size:0.85rem; color:var(--text-gray);">تم إنهاء جميع ممالك الكومبليكس لهذا اللاعب</div>`;
                    }
                } else {
                    let placeholder = "أدخل العدد...";
                    if (kingdomId === 'trix') placeholder = "الترتيب (1-4)";
                    if (gameState.type === 'tarneeb') placeholder = "النقاط (بحد أقصى 26)";
                    if (gameState.type === 'hand') placeholder = "النقاط (-60 إلى 300)";
                    actionHtml = `<input type="number" class="bulk-input" data-id="${p.id}" placeholder="${placeholder}" inputmode="numeric">`;
                }
            }

            card.innerHTML = `
                <div class="card-header"><span class="player-name-tag">${p.name}</span><span class="total-score">${p.score}</span></div>
                <div class="score-history">${historyHtml}</div>${actionHtml}`;
            list.appendChild(card);
        });
    }

    function addComplexScore(pid) {
        const input = document.getElementById(`in-${pid}`);
        const kSelect = document.getElementById(`k-select-${pid}`);
        if (!kSelect) return;
        const count = parseInt(input.value);
        const kType = kSelect.value;
        if (isNaN(count)) return;
        if (RANGE_LIMITS[kType] && count > RANGE_LIMITS[kType].max) {
            return showSimpleModal("خطأ", `الحد الأقصى لـ ${kSelect.options[kSelect.selectedIndex].text} هو ${RANGE_LIMITS[kType].max}`);
        }
        const player = gameState.players.find(x => x.id === pid);
        const change = count * KINGDOM_VALUES[kType];
        player.score += change; 
        player.history.push(change);
        player.usedComplexOptions.push(kType);
        input.value = ''; 
        renderPlayers();
    }

    function submitAllScores() {
        const inputs = document.querySelectorAll('.bulk-input');
        const kType = document.getElementById('kingdom-select')?.value;
        let totalInputSum = 0;
        const tempValues = [];

        for (let input of inputs) {
            const val = parseInt(input.value) || 0;
            totalInputSum += val;
            tempValues.push({ pid: parseFloat(input.getAttribute('data-id')), val: val });

            if (gameState.type === 'hand') {
                if (val > RANGE_LIMITS.hand.max || val < RANGE_LIMITS.hand.min) {
                    showSimpleModal("تنبيه", `نقاط الهاند يجب أن تكون بين ${RANGE_LIMITS.hand.min} و ${RANGE_LIMITS.hand.max}`);
                    return;
                }
            }
            if (kType === 'trix' && (val < 1 || val > 4) && input.value !== "") {
                showSimpleModal("تنبيه", "الترتيب في التركس يجب أن يكون بين 1 و 4.");
                return;
            }
        }

        const targetType = (gameState.type === 'hand') ? 'hand' : (kType === 'trix' ? 'trix' : kType);
        if (gameState.type === 'tarneeb') {
            if (totalInputSum > RANGE_LIMITS.tarneeb.sum) return showSimpleModal("تنبيه", "المجموع لا يمكن أن يتجاوز 26");
        } else if (RANGE_LIMITS[targetType]) {
            const limits = RANGE_LIMITS[targetType];
            if (totalInputSum > limits.sum) return showSimpleModal("تنبيه - المجموع مرتفع", `المجموع (${totalInputSum}) يتجاوز الحد (${limits.sum}).`);
            if (limits.min > 0 && totalInputSum < limits.min) return showSimpleModal("تنبيه - المجموع ناقص", `المجموع (${totalInputSum}) أقل من الحد (${limits.min}).`);
        }

        let anyAdded = false;
        for (let item of tempValues) {
            if (item.val === 0 && !['tarneeb', 'trix', 'hand'].includes(gameState.type) && !['trix'].includes(kType)) continue;
            const player = gameState.players.find(x => x.id === item.pid);
            let change = item.val;
            if (gameState.type === 'trix' || gameState.type === 'complex') {
                const kObj = INITIAL_KINGDOMS[gameState.type].find(k => k.id === kType);
                if (kObj && kObj.val === 'rank') {
                    const ranks = {1: 200, 2: 150, 3: 100, 4: 50};
                    change = ranks[item.val] || 0;
                } else if (kObj && typeof kObj.val === 'number') {
                    change = item.val * kObj.val;
                }
            }
            anyAdded = true;
            player.score += change; player.history.push(change);
        }
        if (anyAdded) { inputs.forEach(i => i.value = ''); renderPlayers(); }
    }

    function handleModeSwitch(newMode) {
        if (gameState.mode === newMode) return;
        
        const hasPlayers = gameState.players.length > 0;
        const hasInputText = document.getElementById('player-input').value.trim() !== "";
        
        if (hasPlayers || hasInputText) {
            const m = document.getElementById('modal');
            document.getElementById('modal-title').innerText = "تغيير وضع اللعب";
            document.getElementById('modal-body').innerText = "تغيير الوضع سيؤدي إلى حذف اللاعبين والنتائج الحالية. هل أنت متأكد؟";
            document.getElementById('modal-selection').innerHTML = '';
            document.getElementById('modal-btns').innerHTML = `
                <button onclick="closeModal()" style="flex:1; background:#444; border:none; color:white; border-radius:10px; padding:12px;">إلغاء</button>
                <button onclick="confirmModeSwitch('${newMode}')" style="flex:1; background:var(--primary-blue); color:white; border:none; border-radius:10px; padding:12px;">تأكيد التغيير</button>
            `;
            m.style.display = 'flex';
        } else {
            setMode(newMode);
        }
    }

    function confirmModeSwitch(newMode) {
        closeModal();
        document.getElementById('player-input').value = ""; // مسح الانبوت عند التغيير
        setMode(newMode);
    }

    function setMode(m, skip = false) {
        gameState.mode = m;
        if (!skip) {
            gameState.players = [];
            renderPlayers();
        }
        
        // تحديث الشكل البصري للأزرار
        document.getElementById('mode-normal').classList.toggle('active', m === 'normal');
        document.getElementById('mode-team').classList.toggle('active', m === 'team');
        
        // إعادة تهيئة الممالك إذا لزم الأمر
        if (gameState.type === 'trix' || gameState.type === 'complex') {
            setupKingdoms();
        }
    }

    function openTarneebCheatModal() {
        if (gameState.players.length === 0) return;
        const m = document.getElementById('modal');
        const selectionList = document.getElementById('modal-selection');
        document.getElementById('modal-title').innerText = "من الفريق الذي غش؟ 🕵️‍♂️";
        document.getElementById('modal-body').innerText = "سيتم خصم 5 نقاط من الفريق المختار.";
        document.getElementById('modal-btns').innerHTML = `<button onclick="closeModal()" class="btn-individual" style="flex:1; background:#444;">إلغاء</button>`;
        selectionList.innerHTML = '';
        gameState.players.forEach(p => {
            const btn = document.createElement('div'); btn.className = 'selection-btn'; btn.innerText = p.name;
            btn.onclick = () => { p.score -= 5; p.history.push(-5); closeModal(); renderPlayers(); };
            selectionList.appendChild(btn);
        });
        m.style.display = 'flex';
    }

    function switchView(v) {
        document.getElementById('home-view').classList.remove('active');
        document.getElementById('game-view').classList.remove('active');
        document.getElementById(v + '-view').classList.add('active');
    }

    function showSimpleModal(title, body) {
        closeModal();
        const m = document.getElementById('modal');
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerText = body;
        document.getElementById('modal-selection').innerHTML = '';
        document.getElementById('modal-btns').innerHTML = `<button onclick="closeModal()" class="btn-individual" style="flex:1">حسناً</button>`;
        m.style.display = 'flex';
    }

    function confirmExit() {
        const m = document.getElementById('modal');
        document.getElementById('modal-title').innerText = "تأكيد الخروج";
        document.getElementById('modal-body').innerText = "هل تريد العودة للرئيسية؟ سيتم حذف النقاط الحالية.";
        document.getElementById('modal-selection').innerHTML = '';
        document.getElementById('modal-btns').innerHTML = `<button onclick="closeModal()" style="flex:1; background:#444; border:none; color:white; border-radius:10px; padding:12px;">إلغاء</button><button onclick="actualExit()" style="flex:1; background:var(--danger-red); color:white; border:none; border-radius:10px; padding:12px;">خروج</button>`;
        m.style.display = 'flex';
    }

    function actualExit() { closeModal(); switchView('home'); }
    function closeModal() { document.getElementById('modal').style.display = 'none'; }
    function showWinner() { 
        if (!gameState.players.length) return;
        const s = [...gameState.players].sort((a,b) => b.score - a.score);
        showSimpleModal("المتصدر حالياً 🏆", `${s[0].name} برصيد ${s[0].score} نقطة.`);
    }
    function confirmEndGame() {
        const m = document.getElementById('modal');
        document.getElementById('modal-title').innerText = "إنهاء اللعبة";
        document.getElementById('modal-body').innerText = "هل انتهيتم؟ سيتم حذف النتائج.";
        document.getElementById('modal-btns').innerHTML = `<button onclick="closeModal()" style="flex:1; background:#444; border:none; color:white; border-radius:10px; padding:12px;">إلغاء</button><button onclick="actualExit()" style="flex:1; background:var(--danger-red); color:white; border:none; border-radius:10px; padding:12px;">إنهاء</button>`;
        m.style.display = 'flex';
    }