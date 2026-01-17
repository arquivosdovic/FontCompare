const cardContainer = document.getElementById('cardContainer');
const mainInput = document.getElementById('mainInput');
const fontUpload = document.getElementById('fontUpload');
const fgHex = document.getElementById('fgHex');
const bgHex = document.getElementById('bgHex');
const fontSize = document.getElementById('fontSize');
const sizeVal = document.getElementById('sizeVal');

let isBold = false, isItalic = false, isUnderline = false;
let textAlign = 'left';

// --- CONTROLES DE INTERFACE ---
document.getElementById('darkModeToggle').onclick = () => {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
};

document.getElementById('clearAll').onclick = () => {
    if(confirm("Deseja excluir todos os cartões?")) cardContainer.innerHTML = "";
};

// --- FUNÇÃO PARA SALVAR CARTÃO COMO IMAGEM ---
async function saveCardAsImage(cardElement, fontLabel) {
    const actions = cardElement.querySelector('.card-actions');
    if (actions) actions.style.opacity = '0'; 

    try {
        const canvas = await html2canvas(cardElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: null
        });
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `${fontLabel.replace(/\s+/g, '-')}-preview.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Erro ao salvar imagem:", error);
        alert("Erro ao salvar imagem. Verifique o console.");
    } finally {
        if (actions) actions.style.opacity = '1'; 
    }
}

// --- ATUALIZAÇÃO DE ESTILOS ---
function updateStyles() {
    const textColor = fgHex.value.startsWith('#') ? fgHex.value : '#' + fgHex.value;
    const backgroundColor = bgHex.value.startsWith('#') ? bgHex.value : '#' + bgHex.value;
    
    document.querySelectorAll('.card').forEach(card => {
        card.style.color = textColor;
        card.style.backgroundColor = backgroundColor;
        
        const textDiv = card.querySelector('.preview-text');
        textDiv.style.fontSize = fontSize.value + 'px';
        textDiv.style.fontWeight = isBold ? 'bold' : 'normal';
        textDiv.style.fontStyle = isItalic ? 'italic' : 'normal';
        textDiv.style.textDecoration = isUnderline ? 'underline' : 'none';
        textDiv.style.textAlign = textAlign;
    });
    sizeVal.textContent = fontSize.value;
}

// Eventos de Input
document.getElementById('fgColor').oninput = (e) => { fgHex.value = e.target.value.toUpperCase(); updateStyles(); };
fgHex.oninput = updateStyles;
document.getElementById('bgColor').oninput = (e) => { bgHex.value = e.target.value.toUpperCase(); updateStyles(); };
bgHex.oninput = updateStyles;
fontSize.oninput = updateStyles;

// Estilos B, I, U
document.getElementById('btnBold').onclick = (e) => { isBold = !isBold; e.target.classList.toggle('active'); updateStyles(); };
document.getElementById('btnItalic').onclick = (e) => { isItalic = !isItalic; e.target.classList.toggle('active'); updateStyles(); };
document.getElementById('btnUnderline').onclick = (e) => { isUnderline = !isUnderline; e.target.classList.toggle('active'); updateStyles(); };

// Alinhamento
document.querySelectorAll('.btn-align').forEach(btn => {
    btn.onclick = (e) => {
        document.querySelectorAll('.btn-align').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        textAlign = e.target.dataset.align;
        updateStyles();
    };
});

// --- CARTÕES E FONTES ---
function createCard(label, family) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.fontFamily = `"${family}", sans-serif`;
    
    card.innerHTML = `
        <span class="font-name">${label}</span>
        <div class="preview-text">${mainInput.value}</div>
        <div class="card-actions">
            <button class="save-btn" title="Salvar como Imagem">📷</button>
            <button class="remove-btn" title="Excluir Cartão">✕</button>
        </div>
    `;
    
    card.querySelector('.remove-btn').onclick = () => card.remove();
    card.querySelector('.save-btn').onclick = () => saveCardAsImage(card, label);

    cardContainer.appendChild(card);
    updateStyles();
}

mainInput.oninput = () => {
    document.querySelectorAll('.preview-text').forEach(p => p.textContent = mainInput.value);
};

// --- LOGICA DE ADIÇÃO DE FONTE (MELHORADA) ---
document.getElementById('addGoogleFont').onclick = () => {
    const rawInput = document.getElementById('googleFontSearch').value.trim();
    if (!rawInput) return;

    // Normalização Inteligente: "eb garamond" -> "EB Garamond" | "roboto" -> "Roboto"
    const formattedName = rawInput.split(' ').map(w => {
        if (w.length <= 2) return w.toUpperCase(); // Trata EB, PT, ST
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');

    const systemFonts = ['Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Impact', 'Comic Sans MS'];
    const isSystemFont = systemFonts.some(f => f.toLowerCase() === rawInput.toLowerCase());

    if (isSystemFont) {
        createCard(formattedName, formattedName);
        document.getElementById('googleFontSearch').value = "";
        return;
    }

    // Tenta carregar a fonte
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const urlName = formattedName.replace(/\s+/g, '+');
    link.href = `https://fonts.googleapis.com/css2?family=${urlName}:wght@400;700&display=swap`;
    
    link.onload = () => {
        createCard(formattedName, formattedName);
        document.getElementById('googleFontSearch').value = "";
    };

    link.onerror = () => {
        // Fallback: Tenta com o texto exatamente como o usuário digitou
        const fallbackLink = document.createElement('link');
        fallbackLink.rel = 'stylesheet';
        fallbackLink.href = `https://fonts.googleapis.com/css2?family=${rawInput.replace(/\s+/g, '+')}&display=swap`;

        fallbackLink.onload = () => {
            createCard(rawInput, rawInput);
            document.getElementById('googleFontSearch').value = "";
        };

        fallbackLink.onerror = () => {
            alert(`Não encontramos a fonte "${rawInput}". Verifique se o nome está correto.`);
            fallbackLink.remove();
        };
        document.head.appendChild(fallbackLink);
        link.remove();
    };

    document.head.appendChild(link);
};

fontUpload.onchange = async (e) => {
    for (const file of e.target.files) {
        const name = file.name.split('.')[0].replace(/\s+/g, '-');
        const font = new FontFace(name, await file.arrayBuffer());
        try {
            await font.load();
            document.fonts.add(font);
            createCard(file.name, name);
        } catch (err) {
            console.error("Erro ao carregar fonte local:", err);
        }
    }
    fontUpload.value = "";
};

window.onload = () => createCard("Roboto", "Roboto");
