// Datos de ejemplo
let currentUser = null;
let files = [];
let categories = [
    { id: 1, name: 'Ordenanzas Municipales', color: '#3498db', count: 0 },
    { id: 2, name: 'Decretos', color: '#e74c3c', count: 0 },
    { id: 3, name: 'Resoluciones', color: '#2ecc71', count: 0 },
    { id: 4, name: 'Actas de Sesiones', color: '#f39c12', count: 0 }
];
let selectedFiles = [];
let currentCategoryFilter = 'all';
let currentEditingFile = null;
let currentSearchTerm = '';

// Claves para localStorage
const STORAGE_KEYS = {
    FILES: 'gacetas_municipales_files',
    CATEGORIES: 'gacetas_municipales_categories',
    USER: 'gacetas_municipales_user'
};

// Elementos del DOM
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const userActions = document.getElementById('userActions');
const uploadSection = document.getElementById('uploadSection');
const publicAccessInfo = document.getElementById('publicAccessInfo');
const categoryManagerBtn = document.getElementById('categoryManagerBtn');
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadBtn = document.getElementById('uploadBtn');
const selectedFilesContainer = document.getElementById('selectedFiles');
const fileListPreview = document.getElementById('fileListPreview');
const fileCategorySelect = document.getElementById('fileCategory');
const fileList = document.getElementById('fileList');
const categoriesFilters = document.getElementById('categoriesFilters');
const categoryModal = document.getElementById('categoryModal');
const closeCategoryModal = document.getElementById('closeCategoryModal');
const categoryList = document.getElementById('categoryList');
const newCategoryName = document.getElementById('newCategoryName');
const newCategoryColor = document.getElementById('newCategoryColor');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const descriptionModal = document.getElementById('descriptionModal');
const closeDescription = document.getElementById('closeDescription');
const descriptionTitle = document.getElementById('descriptionTitle');
const descriptionText = document.getElementById('descriptionText');
const descriptionEditor = document.getElementById('descriptionEditor');
const editDescriptionBtn = document.getElementById('editDescriptionBtn');
const cancelEdit = document.getElementById('cancelEdit');
const saveDescription = document.getElementById('saveDescription');
const descriptionActions = document.getElementById('descriptionActions');
const editActions = document.getElementById('editActions');
const previewModal = document.getElementById('previewModal');
const closePreview = document.getElementById('closePreview');
const previewTitle = document.getElementById('previewTitle');
const previewContainer = document.getElementById('previewContainer');
const downloadPreviewBtn = document.getElementById('downloadPreviewBtn');
const sharePreviewBtn = document.getElementById('sharePreviewBtn');
const searchInput = document.getElementById('searchInput');
const searchResultsInfo = document.getElementById('searchResultsInfo');
const searchResultsText = document.getElementById('searchResultsText');
const clearSearch = document.getElementById('clearSearch');
const noResults = document.getElementById('noResults');
const toast = document.getElementById('toast');
const dataManagement = document.getElementById('dataManagement');
const exportDataBtn = document.getElementById('exportDataBtn');
const importDataBtn = document.getElementById('importDataBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const importDataInput = document.getElementById('importDataInput');

// ===== FUNCIONES DE ALMACENAMIENTO PERSISTENTE =====

// Guardar archivos en localStorage
function saveFilesToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files));
        return true;
    } catch (error) {
        console.error('Error al guardar archivos:', error);
        showToast('Error al guardar los archivos', true);
        return false;
    }
}

// Cargar archivos desde localStorage
function loadFilesFromStorage() {
    try {
        const savedFiles = localStorage.getItem(STORAGE_KEYS.FILES);
        if (savedFiles) {
            files = JSON.parse(savedFiles);
            return true;
        }
    } catch (error) {
        console.error('Error al cargar archivos:', error);
    }
    return false;
}

// Guardar categorías en localStorage
function saveCategoriesToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        return true;
    } catch (error) {
        console.error('Error al guardar categorías:', error);
        showToast('Error al guardar las categorías', true);
        return false;
    }
}

// Cargar categorías desde localStorage
function loadCategoriesFromStorage() {
    try {
        const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (savedCategories) {
            categories = JSON.parse(savedCategories);
            return true;
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
    return false;
}

// Guardar usuario en localStorage
function saveUserToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
        return true;
    } catch (error) {
        console.error('Error al guardar usuario:', error);
        return false;
    }
}

// Cargar usuario desde localStorage
function loadUserFromStorage() {
    try {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            return true;
        }
    } catch (error) {
        console.error('Error al cargar usuario:', error);
    }
    return false;
}

// ===== FUNCIONES PRINCIPALES =====

// Función para mostrar notificaciones
function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = 'toast' + (isError ? ' error' : '') + ' show';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Función para formatear el tamaño del archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función para determinar el tipo de archivo
function getFileType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    return extension;
}

// Función para obtener la clase CSS para la portada
function getCoverClass(fileType) {
    const coverClasses = {
        pdf: "pdf-cover",
        doc: "doc-cover",
        docx: "doc-cover",
        jpg: "image-cover",
        jpeg: "image-cover",
        png: "image-cover",
        gif: "image-cover"
    };
    return coverClasses[fileType] || "doc-cover";
}

// Función para obtener el icono de portada
function getCoverIcon(fileType) {
    const coverIcons = {
        pdf: "fas fa-file-pdf",
        doc: "fas fa-file-word",
        docx: "fas fa-file-word",
        jpg: "fas fa-file-image",
        jpeg: "fas fa-file-image",
        png: "fas fa-file-image",
        gif: "fas fa-file-image"
    };
    return coverIcons[fileType] || "fas fa-file";
}

// Actualizar interfaz según el usuario
function updateUIForUser() {
    if (currentUser && currentUser.role === 'admin') {
        userActions.innerHTML = `
            <div class="user-info">
                <span>${currentUser.name}</span>
                <span class="user-role admin">Administrador</span>
                <button class="logout-btn" id="logoutBtn">
                    <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
            </div>
        `;
        uploadSection.style.display = 'block';
        categoryManagerBtn.style.display = 'block';
        publicAccessInfo.style.display = 'none';
        dataManagement.style.display = 'block';
        loginModal.style.display = 'none';

        // Agregar event listener al botón de cerrar sesión
        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        userActions.innerHTML = `
            <button class="btn btn-secondary" id="adminLoginBtn">
                <i class="fas fa-user-shield"></i> Acceso Admin
            </button>
        `;
        uploadSection.style.display = 'none';
        categoryManagerBtn.style.display = 'none';
        publicAccessInfo.style.display = 'block';
        dataManagement.style.display = 'none';

        document.getElementById('adminLoginBtn').addEventListener('click', () => {
            loginModal.style.display = 'flex';
        });
    }
}

// Función de login
function login(username, password) {
    if (username === 'admin' && password === 'admin123') {
        currentUser = {
            username: 'admin',
            name: 'Administrador',
            role: 'admin'
        };
        saveUserToStorage();
        updateUIForUser();
        loadFiles();
        showToast('Bienvenido, modo administrador activado');
        return true;
    } else {
        showToast('Credenciales incorrectas', true);
        return false;
    }
}

// Función de logout
function logout() {
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.USER);
    updateUIForUser();
    loadFiles();
    showToast('Sesión cerrada correctamente');
}

// Verificar sesión existente
function checkExistingSession() {
    loadUserFromStorage();
    loadCategoriesFromStorage();
    loadFilesFromStorage();
    updateUIForUser();
    loadFiles();
}

// Cargar archivos
function loadFiles() {
    renderFiles(files);
    renderCategoryFilters();
    populateCategorySelectors();
}

// Función de búsqueda
function searchFiles(searchTerm) {
    currentSearchTerm = searchTerm.toLowerCase().trim();
    
    if (currentSearchTerm === '') {
        searchResultsInfo.style.display = 'none';
        renderFiles(files);
        renderCategoryFilters();
        return;
    }

    let filteredFiles = files.filter(file => {
        const searchInName = file.name.toLowerCase().includes(currentSearchTerm);
        const searchInDescription = file.description.toLowerCase().includes(currentSearchTerm);
        const fileCategory = categories.find(cat => cat.id === file.categoryId);
        const searchInCategory = fileCategory ? fileCategory.name.toLowerCase().includes(currentSearchTerm) : false;
        
        return searchInName || searchInDescription || searchInCategory;
    });

    searchResultsInfo.style.display = 'block';
    searchResultsText.textContent = `Se encontraron ${filteredFiles.length} resultado(s) para "${searchTerm}"`;
    
    renderFiles(filteredFiles);
    renderCategoryFiltersForSearch(filteredFiles);
}

// Renderizar archivos
function renderFiles(filesToRender) {
    if (filesToRender.length === 0) {
        fileList.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    fileList.innerHTML = filesToRender.map(file => {
        const fileCategory = categories.find(cat => cat.id === file.categoryId) || 
                           { name: 'Sin categoría', color: '#95a5a6' };
        
        let fileName = file.name;
        let fileDescription = file.description || 'No hay descripción disponible';
        
        if (currentSearchTerm) {
            const regex = new RegExp(`(${currentSearchTerm})`, 'gi');
            fileName = fileName.replace(regex, '<mark>$1</mark>');
            fileDescription = fileDescription.replace(regex, '<mark>$1</mark>');
        }
        
        return `
        <div class="file-card" data-id="${file.id}">
            <div class="file-preview">
                <div class="cover-preview ${file.coverColor}">
                    <i class="cover-icon ${getCoverIcon(file.type)}"></i>
                    <div class="cover-title">${file.name.substring(0, 20)}${file.name.length > 20 ? '...' : ''}</div>
                    <div class="cover-subtitle">${file.type.toUpperCase()}</div>
                </div>
            </div>
            <div class="file-info">
                <div class="file-category-badge" style="background: ${fileCategory.color}">
                    ${fileCategory.name}
                </div>
                <div class="file-name">${fileName}</div>
                <div class="file-meta">
                    <span>${file.type.toUpperCase()}</span>
                    <span>${file.size}</span>
                </div>
                <div class="file-actions">
                    <button class="view-description" title="Ver descripción" data-id="${file.id}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="preview" title="Vista previa" data-id="${file.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="download" title="Descargar" data-id="${file.id}">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="share" title="Compartir" data-id="${file.id}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    ${currentUser && currentUser.role === 'admin' ? `
                        <button class="delete" title="Eliminar" data-id="${file.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
        `;
    }).join('');

    addFileEventListeners();
}

// Agregar event listeners a los botones de archivos
function addFileEventListeners() {
    document.querySelectorAll('.view-description').forEach(button => {
        button.addEventListener('click', (e) => {
            const fileId = e.currentTarget.getAttribute('data-id');
            showDescription(fileId);
        });
    });

    document.querySelectorAll('.preview').forEach(button => {
        button.addEventListener('click', (e) => {
            const fileId = e.currentTarget.getAttribute('data-id');
            previewFile(fileId);
        });
    });

    document.querySelectorAll('.download').forEach(button => {
        button.addEventListener('click', (e) => {
            const fileId = e.currentTarget.getAttribute('data-id');
            downloadFile(fileId);
        });
    });

    document.querySelectorAll('.share').forEach(button => {
        button.addEventListener('click', (e) => {
            const fileId = e.currentTarget.getAttribute('data-id');
            shareFile(fileId);
        });
    });

    if (currentUser && currentUser.role === 'admin') {
        document.querySelectorAll('.delete').forEach(button => {
            button.addEventListener('click', (e) => {
                const fileId = e.currentTarget.getAttribute('data-id');
                deleteFile(fileId);
            });
        });
    }
}

// Mostrar descripción
function showDescription(fileId) {
    const file = files.find(f => f.id == fileId);
    if (!file) return;

    currentEditingFile = file;
    descriptionTitle.textContent = `Descripción: ${file.name}`;
    
    let description = file.description || 'No hay descripción disponible para este documento.';
    if (currentSearchTerm) {
        const regex = new RegExp(`(${currentSearchTerm})`, 'gi');
        description = description.replace(regex, '<mark>$1</mark>');
    }
    
    descriptionText.innerHTML = description;
    descriptionEditor.value = file.description || '';
    
    if (currentUser && currentUser.role === 'admin') {
        descriptionActions.style.display = 'block';
        editActions.style.display = 'none';
        descriptionText.style.display = 'block';
        descriptionEditor.style.display = 'none';
    } else {
        descriptionActions.style.display = 'none';
        editActions.style.display = 'none';
        descriptionText.style.display = 'block';
        descriptionEditor.style.display = 'none';
    }
    
    descriptionModal.style.display = 'flex';
}

// Editar descripción
function enableDescriptionEdit() {
    descriptionText.style.display = 'none';
    descriptionEditor.style.display = 'block';
    descriptionActions.style.display = 'none';
    editActions.style.display = 'flex';
    descriptionEditor.focus();
}

// Guardar descripción
function saveDescriptionChanges() {
    if (!currentEditingFile) return;
    
    currentEditingFile.description = descriptionEditor.value;
    
    let description = currentEditingFile.description || 'No hay descripción disponible para este documento.';
    if (currentSearchTerm) {
        const regex = new RegExp(`(${currentSearchTerm})`, 'gi');
        description = description.replace(regex, '<mark>$1</mark>');
    }
    
    descriptionText.innerHTML = description;
    
    descriptionText.style.display = 'block';
    descriptionEditor.style.display = 'none';
    descriptionActions.style.display = 'block';
    editActions.style.display = 'none';
    
    saveFilesToStorage();
    
    showToast('Descripción guardada correctamente');
    renderFiles(files);
}

// Cancelar edición de descripción
function cancelDescriptionEdit() {
    descriptionText.style.display = 'block';
    descriptionEditor.style.display = 'none';
    descriptionActions.style.display = 'block';
    editActions.style.display = 'none';
    descriptionEditor.value = currentEditingFile.description || '';
}

// Vista previa de archivo
function previewFile(fileId) {
    const file = files.find(f => f.id == fileId);
    if (!file) return;

    previewTitle.textContent = `Vista Previa: ${file.name}`;
    previewContainer.innerHTML = '';

    if (file.type === 'pdf') {
        const iframe = document.createElement('iframe');
        iframe.src = file.content;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        previewContainer.appendChild(iframe);
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(file.type)) {
        const img = document.createElement('img');
        img.src = file.content;
        img.alt = file.name;
        previewContainer.appendChild(img);
    } else {
        previewContainer.innerHTML = `
            <div class="preview-message">
                <i class="fas fa-file ${getCoverIcon(file.type)}" style="font-size: 4rem; color: #3498db; margin-bottom: 1rem;"></i>
                <h3>${file.name}</h3>
                <p>Vista previa no disponible para este tipo de archivo.</p>
                <p>Utilice la función de descarga para ver el contenido completo.</p>
            </div>
        `;
    }

    downloadPreviewBtn.onclick = () => downloadFile(fileId);
    sharePreviewBtn.onclick = () => shareFile(fileId);

    previewModal.style.display = 'flex';
}

// Descargar archivo
function downloadFile(fileId) {
    const file = files.find(f => f.id == fileId);
    if (!file) return;

    if (file.content && file.content.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = file.content;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        showToast(`El archivo "${file.name}" está guardado en el sistema`, false);
    }
    
    showToast(`Descargando: ${file.name}`);
}

// Compartir archivo
function shareFile(fileId) {
    const file = files.find(f => f.id == fileId);
    if (!file) return;

    if (navigator.share) {
        navigator.share({
            title: file.name,
            text: `Compartiendo el documento: ${file.name}`,
            url: window.location.href
        })
        .then(() => showToast('Documento compartido exitosamente'))
        .catch(() => showToast('Error al compartir el documento', true));
    } else {
        const shareUrl = prompt(
            `Compartir "${file.name}"\n\nComparta esta página o el nombre del documento para que otros usuarios puedan buscarlo en el sistema.`,
            file.name
        );
        
        if (shareUrl) {
            navigator.clipboard.writeText(file.name)
                .then(() => showToast('Nombre del documento copiado al portapapeles'))
                .catch(() => showToast('Información lista para compartir'));
        }
    }
}

// Eliminar archivo
function deleteFile(fileId) {
    const file = files.find(f => f.id == fileId);
    if (!file) return;

    if (!confirm(`¿Está seguro de que desea eliminar "${file.name}"?`)) {
        return;
    }

    files = files.filter(f => f.id != fileId);
    
    saveFilesToStorage();
    
    if (currentSearchTerm) {
        searchFiles(currentSearchTerm);
    } else {
        renderFiles(files);
        renderCategoryFilters();
    }
    
    showToast(`Documento "${file.name}" eliminado correctamente`);
}

// Renderizar filtros de categorías
function renderCategoryFilters() {
    const totalFiles = files.length;
    
    categoriesFilters.innerHTML = `
        <div class="category-filter ${currentCategoryFilter === 'all' ? 'active' : ''}" data-category="all">
            <i class="fas fa-layer-group"></i>
            <span>Todos los Documentos</span>
            <span class="count">${totalFiles}</span>
        </div>
        ${categories.map(category => {
            const count = files.filter(file => file.categoryId === category.id).length;
            return `
                <div class="category-filter ${currentCategoryFilter === category.id.toString() ? 'active' : ''}" 
                     data-category="${category.id}">
                    <i class="fas fa-folder" style="color: ${category.color}"></i>
                    <span>${category.name}</span>
                    <span class="count">${count}</span>
                </div>
            `;
        }).join('')}
    `;

    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', () => {
            const categoryId = filter.getAttribute('data-category');
            currentCategoryFilter = categoryId;
            
            let filteredFiles = files;
            if (categoryId !== 'all') {
                filteredFiles = files.filter(file => file.categoryId === parseInt(categoryId));
            }
            
            if (currentSearchTerm) {
                filteredFiles = filteredFiles.filter(file => {
                    const searchInName = file.name.toLowerCase().includes(currentSearchTerm);
                    const searchInDescription = file.description.toLowerCase().includes(currentSearchTerm);
                    const fileCategory = categories.find(cat => cat.id === file.categoryId);
                    const searchInCategory = fileCategory ? fileCategory.name.toLowerCase().includes(currentSearchTerm) : false;
                    
                    return searchInName || searchInDescription || searchInCategory;
                });
            }
            
            renderFiles(filteredFiles);
            renderCategoryFilters();
        });
    });
}

// Renderizar filtros de categorías para búsqueda
function renderCategoryFiltersForSearch(filteredFiles) {
    const totalFiles = filteredFiles.length;
    
    categoriesFilters.innerHTML = `
        <div class="category-filter ${currentCategoryFilter === 'all' ? 'active' : ''}" data-category="all">
            <i class="fas fa-layer-group"></i>
            <span>Todos los Documentos</span>
            <span class="count">${totalFiles}</span>
        </div>
        ${categories.map(category => {
            const count = filteredFiles.filter(file => file.categoryId === category.id).length;
            if (count === 0) return '';
            
            return `
                <div class="category-filter ${currentCategoryFilter === category.id.toString() ? 'active' : ''}" 
                     data-category="${category.id}">
                    <i class="fas fa-folder" style="color: ${category.color}"></i>
                    <span>${category.name}</span>
                    <span class="count">${count}</span>
                </div>
            `;
        }).join('')}
    `;

    document.querySelectorAll('.category-filter').forEach(filter => {
        filter.addEventListener('click', () => {
            const categoryId = filter.getAttribute('data-category');
            currentCategoryFilter = categoryId;
            
            let categoryFilteredFiles = files;
            if (categoryId !== 'all') {
                categoryFilteredFiles = files.filter(file => file.categoryId === parseInt(categoryId));
            }
            
            const finalFilteredFiles = categoryFilteredFiles.filter(file => {
                const searchInName = file.name.toLowerCase().includes(currentSearchTerm);
                const searchInDescription = file.description.toLowerCase().includes(currentSearchTerm);
                const fileCategory = categories.find(cat => cat.id === file.categoryId);
                const searchInCategory = fileCategory ? fileCategory.name.toLowerCase().includes(currentSearchTerm) : false;
                
                return searchInName || searchInDescription || searchInCategory;
            });
            
            renderFiles(finalFilteredFiles);
            renderCategoryFiltersForSearch(finalFilteredFiles);
        });
    });
}

// Llenar selectores de categoría
function populateCategorySelectors() {
    fileCategorySelect.innerHTML = categories.map(category => `
        <option value="${category.id}">${category.name}</option>
    `).join('');
}

// Mostrar archivos seleccionados
function renderSelectedFiles() {
    if (selectedFiles.length === 0) {
        selectedFilesContainer.classList.remove('active');
        fileListPreview.innerHTML = '';
        return;
    }
    
    selectedFilesContainer.classList.add('active');
    fileListPreview.innerHTML = selectedFiles.map(file => `
        <div class="file-item">
            <div class="file-item-name">${file.name}</div>
            <div class="file-item-size">${formatFileSize(file.size)}</div>
        </div>
    `).join('');
}

// Manejar selección de archivos
function handleFileSelection(files) {
    selectedFiles = Array.from(files);
    renderSelectedFiles();
}

// Subir archivos
function uploadFiles() {
    if (selectedFiles.length === 0) {
        showToast('Por favor seleccione al menos un archivo', true);
        return;
    }

    const selectedCategoryId = parseInt(fileCategorySelect.value);
    const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

    if (!selectedCategory) {
        showToast('Por favor seleccione una categoría válida', true);
        return;
    }

    for (const file of selectedFiles) {
        const fileType = getFileType(file.name);
        const fileUrl = URL.createObjectURL(file);
        
        const newFile = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: fileType,
            size: formatFileSize(file.size),
            date: new Date().toLocaleDateString(),
            description: `Documento ${fileType.toUpperCase()} subido el ${new Date().toLocaleDateString()}.`,
            coverColor: getCoverClass(fileType),
            categoryId: selectedCategory.id,
            category: selectedCategory.name,
            content: fileUrl
        };

        files.unshift(newFile);
    }

    saveFilesToStorage();

    if (currentSearchTerm) {
        searchFiles(currentSearchTerm);
    } else {
        renderFiles(files);
        renderCategoryFilters();
    }
    
    selectedFiles = [];
    fileInput.value = '';
    renderSelectedFiles();
    
    showToast(`Se han subido ${selectedFiles.length} archivo(s) correctamente`);
}

// Gestión de categorías
function renderCategoryManager() {
    categoryList.innerHTML = categories.map(category => {
        const count = files.filter(file => file.categoryId === category.id).length;
        return `
            <div class="category-item">
                <div class="category-item-info">
                    <div class="category-color" style="background: ${category.color}"></div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-count">${count} documentos</div>
                </div>
                <div class="category-actions">
                    <button class="category-action-btn edit-category" data-id="${category.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="category-action-btn delete-category" data-id="${category.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.edit-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryId = parseInt(e.currentTarget.getAttribute('data-id'));
            editCategory(categoryId);
        });
    });

    document.querySelectorAll('.delete-category').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const categoryId = parseInt(e.currentTarget.getAttribute('data-id'));
            deleteCategory(categoryId);
        });
    });
}

function addCategory() {
    const name = newCategoryName.value.trim();
    const color = newCategoryColor.value;

    if (!name) {
        showToast('Por favor ingrese un nombre para la categoría', true);
        return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
        showToast('Ya existe una categoría con ese nombre', true);
        return;
    }

    const newCategory = {
        id: Date.now(),
        name: name,
        color: color,
        count: 0
    };

    categories.push(newCategory);
    renderCategoryManager();
    renderCategoryFilters();
    populateCategorySelectors();

    saveCategoriesToStorage();

    newCategoryName.value = '';
    newCategoryColor.value = '#3498db';

    showToast(`Categoría "${name}" agregada correctamente`);
}

function editCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const newName = prompt('Ingrese el nuevo nombre para la categoría:', category.name);
    if (newName && newName.trim() !== '') {
        category.name = newName.trim();
        renderCategoryManager();
        renderCategoryFilters();
        populateCategorySelectors();
        
        saveCategoriesToStorage();
        
        showToast('Categoría actualizada correctamente');
    }
}

function deleteCategory(categoryId) {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const filesInCategory = files.filter(file => file.categoryId === categoryId);
    
    if (filesInCategory.length > 0) {
        if (!confirm(`La categoría "${category.name}" tiene ${filesInCategory.length} documento(s). ¿Está seguro de que desea eliminarla?`)) {
            return;
        }
    } else {
        if (!confirm(`¿Está seguro de que desea eliminar la categoría "${category.name}"?`)) {
            return;
        }
    }

    categories = categories.filter(cat => cat.id !== categoryId);
    renderCategoryManager();
    renderCategoryFilters();
    populateCategorySelectors();

    saveCategoriesToStorage();

    if (currentCategoryFilter === categoryId.toString()) {
        currentCategoryFilter = 'all';
        renderFiles(files);
    }

    showToast(`Categoría "${category.name}" eliminada correctamente`);
}

// Limpiar búsqueda
function clearSearchResults() {
    currentSearchTerm = '';
    searchInput.value = '';
    searchResultsInfo.style.display = 'none';
    renderFiles(files);
    renderCategoryFilters();
}

// Exportar datos
function exportData() {
    const dataToExport = {
        files: files,
        categories: categories,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `gacetas_municipales_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Datos exportados correctamente');
}

// Importar datos
function importData(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            if (!importedData.files || !importedData.categories) {
                throw new Error('Formato de archivo inválido');
            }
            
            if (confirm(`¿Está seguro de que desea importar los datos? Se reemplazarán ${files.length} archivos y ${categories.length} categorías existentes.`)) {
                files = importedData.files;
                categories = importedData.categories;
                
                saveFilesToStorage();
                saveCategoriesToStorage();
                
                loadFiles();
                showToast('Datos importados correctamente');
            }
        } catch (error) {
            console.error('Error al importar datos:', error);
            showToast('Error al importar los datos. El archivo puede estar corrupto.', true);
        }
    };
    
    reader.readAsText(file);
}

// Limpiar todos los datos
function clearAllData() {
    if (confirm('¿Está seguro de que desea eliminar TODOS los datos? Esta acción no se puede deshacer.')) {
        localStorage.removeItem(STORAGE_KEYS.FILES);
        localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
        
        files = [];
        categories = [
            { id: 1, name: 'Ordenanzas Municipales', color: '#3498db', count: 0 },
            { id: 2, name: 'Decretos', color: '#e74c3c', count: 0 },
            { id: 3, name: 'Resoluciones', color: '#2ecc71', count: 0 },
            { id: 4, name: 'Actas de Sesiones', color: '#f39c12', count: 0 }
        ];
        
        loadFiles();
        showToast('Todos los datos han sido eliminados');
    }
}

// ===== EVENT LISTENERS =====

document.addEventListener('DOMContentLoaded', () => {
    checkExistingSession();
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    login(username, password);
});

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary-color)';
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = '#bdc3c7';
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#bdc3c7';
    if (e.dataTransfer.files.length) {
        handleFileSelection(e.dataTransfer.files);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFileSelection(e.target.files);
    }
});

uploadBtn.addEventListener('click', uploadFiles);

categoryManagerBtn.addEventListener('click', () => {
    renderCategoryManager();
    categoryModal.style.display = 'flex';
});

closeCategoryModal.addEventListener('click', () => {
    categoryModal.style.display = 'none';
});

categoryModal.addEventListener('click', (e) => {
    if (e.target === categoryModal) {
        categoryModal.style.display = 'none';
    }
});

addCategoryBtn.addEventListener('click', addCategory);

loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
});

closeDescription.addEventListener('click', () => {
    descriptionModal.style.display = 'none';
});

descriptionModal.addEventListener('click', (e) => {
    if (e.target === descriptionModal) {
        descriptionModal.style.display = 'none';
    }
});

editDescriptionBtn.addEventListener('click', enableDescriptionEdit);
saveDescription.addEventListener('click', saveDescriptionChanges);
cancelEdit.addEventListener('click', cancelDescriptionEdit);

closePreview.addEventListener('click', () => {
    previewModal.style.display = 'none';
});

previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.style.display = 'none';
    }
});

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value;
    if (searchTerm.length >= 2 || searchTerm.length === 0) {
        searchFiles(searchTerm);
    }
});

clearSearch.addEventListener('click', clearSearchResults);

exportDataBtn.addEventListener('click', exportData);

importDataBtn.addEventListener('click', () => {
    importDataInput.click();
});

importDataInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        importData(e.target.files[0]);
        e.target.value = '';
    }
});

clearDataBtn.addEventListener('click', clearAllData);