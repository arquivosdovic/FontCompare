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
    // Esconde os botões de ação para não aparecerem na imagem
    const actions = cardElement.querySelector('.card-actions');
    const removeBtn = cardElement.querySelector('.remove-btn');
    const saveBtn = cardElement.querySelector('.save-btn');

    if (actions) actions.style.opacity = '0'; // Esconde o container de ações
    if (removeBtn) removeBtn.style.display = 'none';
    if (saveBtn) saveBtn.style.display = 'none';

    try {
        const canvas = await html2canvas(cardElement, {
            scale: 2, // Renderiza em 2x para melhor qualidade
            useCORS: true, // Importante para fontes do Google
            backgroundColor: null // Garante transparência se o card não tiver BG
        });
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = `${fontLabel.replace(/\s+/g, '-')}-preview.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Erro ao salvar o cartão como imagem:", error);
        alert("Não foi possível salvar a imagem. Verifique o console para detalhes.");
    } finally {
        // Restaura a visibilidade dos botões
        if (actions) actions.style.opacity = '1'; 
        if (removeBtn) removeBtn.style.display = 'inline-block';
        if (saveBtn) saveBtn.style.display = 'inline-block';
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

// Cores e Tamanho
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
    
    // Adiciona os botões de ação e o texto
    card.innerHTML = `
        <span class="font-name">${label}</span>
        <div class="preview-text">${mainInput.value}</div>
        <div class="card-actions">
            <button class="save-btn" title="Salvar como Imagem">📷</button>
            <button class="remove-btn" title="Excluir Cartão">✕</button>
        </div>
    `;
    
    card.querySelector('.remove-btn').onclick = () => card.remove();
    card.querySelector('.save-btn').onclick = () => saveCardAsImage(card, label); // Evento para salvar

    cardContainer.appendChild(card);
    updateStyles(); // Aplica cores e estilos iniciais
}

mainInput.oninput = () => {
    document.querySelectorAll('.preview-text').forEach(p => p.textContent = mainInput.value);
};

document.getElementById('addGoogleFont').onclick = () => {
    const name = document.getElementById('googleFontSearch').value.trim();
    if (!name) return;

    // Lista ampliada de fontes que a maioria dos PCs/Macs já possui
    const systemFonts = [
        'Arial', 'Arial Black', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS', 
        'Times New Roman', 'Georgia', 'Garamond', 'Courier New', 'Brush Script MT',
        'Impact', 'Comic Sans MS'
    ];

    // Se a fonte digitada estiver na lista acima, cria o cartão direto
    // (compara ignorando maiúsculas/minúsculas para ser mais amigável)
    const isSystemFont = systemFonts.some(f => f.toLowerCase() === name.toLowerCase());

    if (isSystemFont) {
        createCard(name, name);
        document.getElementById('googleFontSearch').value = "";
        return;
    }

    // Se não for de sistema, tenta procurar no Google Fonts
    const urlName = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('+');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${urlName}&display=swap`;
    
    link.onload = () => {
        createCard(name, name);
        document.getElementById('googleFontSearch').value = "";
    };

    link.onerror = () => {
        alert(`Ops! A fonte "${name}" não foi encontrada no Google Fonts e não parece ser uma fonte de sistema padrão.`);
        link.remove();
    };

    document.head.appendChild(link);
};

fontUpload.onchange = async (e) => {
    for (const file of e.target.files) {
        const name = file.name.split('.')[0].replace(/\s+/g, '-');
        const font = new FontFace(name, await file.arrayBuffer());
        await font.load();
        document.fonts.add(font);
        createCard(file.name, name);
    }
    fontUpload.value = "";
};

window.onload = () => createCard("Roboto", "Roboto");