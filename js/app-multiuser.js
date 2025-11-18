// Sistema Multi-Usuario para Gacetas Municipales
let currentUser = null;
let files = [];
let categories = [];
let selectedFiles = [];
let currentCategoryFilter = 'all';
let currentEditingFile = null;
let currentSearchTerm = '';

// Elementos del DOM (los mismos)
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const userActions = document.getElementById('userActions');
// ... (todos los demás elementos)

// ===== SISTEMA DE SINCRONIZACIÓN EN TIEMPO REAL =====

// Inicializar la aplicación
async function initApp() {
    try {
        // Configurar autenticación anónima (todos pueden leer)
        await auth.signInAnonymously();
        
        // Cargar datos iniciales
        await loadCategories();
        await loadFiles();
        
        // Configurar listeners en tiempo real
        setupRealtimeListeners();
        
        // Verificar si hay un admin logueado
        checkAdminSession();
        
        showToast('Sistema cargado correctamente');
    } catch (error) {
        console.error('Error inicializando la app:', error);
        showToast('Error al cargar el sistema', true);
    }
}

// Cargar categorías desde Firestore
async function loadCategories() {
    try {
        const snapshot = await db.collection('categories')
            .orderBy('name')
            .get();
        
        categories = [];
        snapshot.forEach(doc => {
            categories.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Si no hay categorías, crear las predeterminadas
        if (categories.length === 0) {
            await createDefaultCategories();
        }
        
        populateCategorySelectors();
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Crear categorías predeterminadas
async function createDefaultCategories() {
    const defaultCategories = [
        { name: 'Ordenanzas Municipales', color: '#3498db', fileCount: 0, createdAt: new Date() },
        { name: 'Decretos', color: '#e74c3c', fileCount: 0, createdAt: new Date() },
        { name: 'Resoluciones', color: '#2ecc71', fileCount: 0, createdAt: new Date() },
        { name: 'Actas de Sesiones', color: '#f39c12', fileCount: 0, createdAt: new Date() }
    ];
    
    for (const category of defaultCategories) {
        await db.collection('categories').add(category);
    }
}

// Cargar archivos desde Firestore
async function loadFiles() {
    try {
        const snapshot = await db.collection('files')
            .orderBy('uploadDate', 'desc')
            .get();
        
        files = [];
        snapshot.forEach(doc => {
            files.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderFiles(files);
        renderCategoryFilters();
    } catch (error) {
        console.error('Error cargando archivos:', error);
    }
}

// Configurar listeners en tiempo real
function setupRealtimeListeners() {
    // Escuchar cambios en archivos
    db.collection('files')
        .orderBy('uploadDate', 'desc')
        .onSnapshot((snapshot) => {
            files = [];
            snapshot.forEach(doc => {
                files.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            if (currentSearchTerm) {
                searchFiles(currentSearchTerm);
            } else {
                renderFiles(files);
                renderCategoryFilters();
            }
        });
    
    // Escuchar cambios en categorías
    db.collection('categories')
        .orderBy('name')
        .onSnapshot((snapshot) => {
            categories = [];
            snapshot.forEach(doc => {
                categories.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            populateCategorySelectors();
            renderCategoryFilters();
        });
}

// ===== SISTEMA DE AUTENTICACIÓN MEJORADO =====

// Verificar sesión de admin
function checkAdminSession() {
    const savedAdmin = localStorage.getItem('gacetas_admin');
    if (savedAdmin) {
        currentUser = JSON.parse(savedAdmin);
        updateUIForUser();
    } else {
        updateUIForUser();
    }
}

// Función de login mejorada
async function login(username, password) {
    // Para demo - en producción usar Firebase Authentication
    if (username === 'admin' && password === 'admin123') {
        currentUser = {
            username: 'admin',
            name: 'Administrador',
            role: 'admin',
            loginTime: new Date()
        };
        
        // Guardar en localStorage
        localStorage.setItem('gacetas_admin', JSON.stringify(currentUser));
        
        updateUIForUser();
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
    localStorage.removeItem('gacetas_admin');
    updateUIForUser();
    showToast('Sesión de administrador cerrada');
}

// Actualizar interfaz para multi-usuario
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

        document.getElementById('logoutBtn').addEventListener('click', logout);
    } else {
        userActions.innerHTML = `
            <div class="user-info">
                <span>Usuario Público</span>
                <span class="user-role">Solo Lectura</span>
                <button class="btn btn-secondary" id="adminLoginBtn">
                    <i class="fas fa-user-shield"></i> Acceso Admin
                </button>
            </div>
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

// ===== SISTEMA DE SUBIDA DE ARCHIVOS MEJORADO =====

// Subir archivos a Firebase Storage
async function uploadFiles() {
    if (selectedFiles.length === 0) {
        showToast('Por favor seleccione al menos un archivo', true);
        return;
    }

    const selectedCategoryId = fileCategorySelect.value;
    if (!selectedCategoryId) {
        showToast('Por favor seleccione una categoría válida', true);
        return;
    }

    try {
        showToast('Subiendo archivos...');
        
        for (const file of selectedFiles) {
            await uploadSingleFile(file, selectedCategoryId);
        }
        
        // Limpiar selección
        selectedFiles = [];
        fileInput.value = '';
        renderSelectedFiles();
        
        showToast('Archivos subidos correctamente. Los cambios se verán en todos los dispositivos.');
    } catch (error) {
        console.error('Error subiendo archivos:', error);
        showToast('Error al subir los archivos: ' + error.message, true);
    }
}

// Subir un solo archivo
async function uploadSingleFile(file, categoryId) {
    // Crear referencia única para el archivo
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `files/${timestamp}_${file.name}`;
    
    // Subir a Firebase Storage
    const storageRef = firebase.storage().ref();
    const fileRef = storageRef.child(fileName);
    const uploadTask = fileRef.put(file);
    
    // Esperar a que se complete la subida
    await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
            (snapshot) => {
                // Progreso de subida (opcional)
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Progreso: ' + progress + '%');
            },
            (error) => {
                reject(error);
            },
            async () => {
                // Subida completada
                try {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    const fileType = getFileType(file.name);
                    
                    // Guardar metadata en Firestore
                    await db.collection('files').add({
                        name: file.name,
                        originalName: file.name,
                        type: fileType,
                        size: file.size,
                        formattedSize: formatFileSize(file.size),
                        description: `Documento ${fileType.toUpperCase()} subido el ${new Date().toLocaleDateString()}.`,
                        categoryId: categoryId,
                        downloadURL: downloadURL,
                        storagePath: fileName,
                        coverColor: getCoverClass(fileType),
                        uploadDate: new Date(),
                        uploadedBy: currentUser ? currentUser.name : 'Administrador',
                        viewCount: 0,
                        downloadCount: 0
                    });
                    
                    // Actualizar contador de categoría
                    await updateCategoryFileCount(categoryId, 1);
                    
                    resolve();
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

// Actualizar contador de archivos en categoría
async function updateCategoryFileCount(categoryId, change) {
    try {
        const categoryRef = db.collection('categories').doc(categoryId);
        const categoryDoc = await categoryRef.get();
        
        if (categoryDoc.exists) {
            const currentCount = categoryDoc.data().fileCount || 0;
            await categoryRef.update({
                fileCount: currentCount + change,
                updatedAt: new Date()
            });
        }
    } catch (error) {
        console.error('Error actualizando contador de categoría:', error);
    }
}

// ===== SISTEMA DE GESTIÓN DE ARCHIVOS MEJORADO =====

// Descargar archivo
async function downloadFile(fileId) {
    try {
        const fileDoc = await db.collection('files').doc(fileId).get();
        if (!fileDoc.exists) {
            showToast('Archivo no encontrado', true);
            return;
        }

        const file = { id: fileDoc.id, ...fileDoc.data() };
        
        // Incrementar contador de descargas
        await db.collection('files').doc(fileId).update({
            downloadCount: (file.downloadCount || 0) + 1,
            lastDownload: new Date()
        });

        // Descargar archivo
        const link = document.createElement('a');
        link.href = file.downloadURL;
        link.download = file.name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(`Descargando: ${file.name}`);
    } catch (error) {
        console.error('Error descargando archivo:', error);
        showToast('Error al descargar el archivo', true);
    }
}

// Vista previa de archivo
async function previewFile(fileId) {
    try {
        const fileDoc = await db.collection('files').doc(fileId).get();
        if (!fileDoc.exists) {
            showToast('Archivo no encontrado', true);
            return;
        }

        const file = { id: fileDoc.id, ...fileDoc.data() };
        
        // Incrementar contador de vistas
        await db.collection('files').doc(fileId).update({
            viewCount: (file.viewCount || 0) + 1
        });

        previewTitle.textContent = `Vista Previa: ${file.name}`;
        previewContainer.innerHTML = '';

        const fileType = getFileType(file.name);
        
        if (fileType === 'pdf') {
            const iframe = document.createElement('iframe');
            iframe.src = file.downloadURL;
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            previewContainer.appendChild(iframe);
        } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
            const img = document.createElement('img');
            img.src = file.downloadURL;
            img.alt = file.name;
            previewContainer.appendChild(img);
        } else {
            previewContainer.innerHTML = `
                <div class="preview-message">
                    <i class="fas fa-file ${getCoverIcon(fileType)}" style="font-size: 4rem; color: #3498db; margin-bottom: 1rem;"></i>
                    <h3>${file.name}</h3>
                    <p>Vista previa no disponible para este tipo de archivo.</p>
                    <p>Utilice la función de descarga para ver el contenido completo.</p>
                </div>
            `;
        }

        downloadPreviewBtn.onclick = () => downloadFile(fileId);
        sharePreviewBtn.onclick = () => shareFile(fileId);

        previewModal.style.display = 'flex';
    } catch (error) {
        console.error('Error en vista previa:', error);
        showToast('Error al cargar la vista previa', true);
    }
}

// Compartir archivo
async function shareFile(fileId) {
    try {
        const fileDoc = await db.collection('files').doc(fileId).get();
        if (!fileDoc.exists) {
            showToast('Archivo no encontrado', true);
            return;
        }

        const file = { id: fileDoc.id, ...fileDoc.data() };

        if (navigator.share) {
            navigator.share({
                title: file.name,
                text: `Compartiendo documento: ${file.name}`,
                url: file.downloadURL
            })
            .then(() => showToast('Documento compartido exitosamente'))
            .catch(() => showToast('Error al compartir el documento', true));
        } else {
            navigator.clipboard.writeText(file.downloadURL)
                .then(() => showToast('Enlace copiado al portapapeles'))
                .catch(() => {
                    prompt('Comparta este enlace:', file.downloadURL);
                    showToast('Enlace listo para compartir');
                });
        }
    } catch (error) {
        console.error('Error compartiendo archivo:', error);
        showToast('Error al compartir el archivo', true);
    }
}

// Eliminar archivo
async function deleteFile(fileId) {
    try {
        const fileDoc = await db.collection('files').doc(fileId).get();
        if (!fileDoc.exists) {
            showToast('Archivo no encontrado', true);
            return;
        }

        const file = { id: fileDoc.id, ...fileDoc.data() };

        if (!confirm(`¿Está seguro de que desea eliminar "${file.name}"?`)) {
            return;
        }

        // Eliminar de Firestore
        await db.collection('files').doc(fileId).delete();
        
        // Eliminar de Storage (opcional)
        try {
            const storageRef = firebase.storage().ref();
            await storageRef.child(file.storagePath).delete();
        } catch (storageError) {
            console.warn('No se pudo eliminar el archivo de storage:', storageError);
        }
        
        // Actualizar contador de categoría
        await updateCategoryFileCount(file.categoryId, -1);
        
        showToast(`Documento "${file.name}" eliminado correctamente`);
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        showToast('Error al eliminar el archivo', true);
    }
}

// ===== GESTIÓN DE CATEGORÍAS MEJORADA =====

// Agregar categoría
async function addCategory() {
    const name = newCategoryName.value.trim();
    const color = newCategoryColor.value;

    if (!name) {
        showToast('Por favor ingrese un nombre para la categoría', true);
        return;
    }

    try {
        // Verificar si ya existe
        const existingCategories = await db.collection('categories')
            .where('name', '==', name)
            .get();
            
        if (!existingCategories.empty) {
            showToast('Ya existe una categoría con ese nombre', true);
            return;
        }

        await db.collection('categories').add({
            name: name,
            color: color,
            fileCount: 0,
            createdAt: new Date(),
            createdBy: currentUser ? currentUser.name : 'Administrador'
        });

        newCategoryName.value = '';
        newCategoryColor.value = '#3498db';
        
        showToast(`Categoría "${name}" agregada correctamente`);
    } catch (error) {
        console.error('Error agregando categoría:', error);
        showToast('Error al agregar la categoría', true);
    }
}

// Renderizar gestor de categorías
async function renderCategoryManager() {
    try {
        const snapshot = await db.collection('categories')
            .orderBy('name')
            .get();
        
        categoryList.innerHTML = '';
        snapshot.forEach(doc => {
            const category = { id: doc.id, ...doc.data() };
            const count = category.fileCount || 0;
            
            categoryList.innerHTML += `
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
        });

        // Agregar event listeners
        document.querySelectorAll('.edit-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.getAttribute('data-id');
                editCategory(categoryId);
            });
        });

        document.querySelectorAll('.delete-category').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.getAttribute('data-id');
                deleteCategory(categoryId);
            });
        });
    } catch (error) {
        console.error('Error cargando categorías:', error);
        showToast('Error al cargar las categorías', true);
    }
}

// Editar categoría
async function editCategory(categoryId) {
    try {
        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        if (!categoryDoc.exists) return;

        const category = categoryDoc.data();
        const newName = prompt('Ingrese el nuevo nombre para la categoría:', category.name);
        
        if (newName && newName.trim() !== '') {
            await db.collection('categories').doc(categoryId).update({
                name: newName.trim(),
                updatedAt: new Date()
            });
            
            showToast('Categoría actualizada correctamente');
        }
    } catch (error) {
        console.error('Error editando categoría:', error);
        showToast('Error al actualizar la categoría', true);
    }
}

// Eliminar categoría
async function deleteCategory(categoryId) {
    try {
        const categoryDoc = await db.collection('categories').doc(categoryId).get();
        if (!categoryDoc.exists) return;

        const category = categoryDoc.data();
        
        // Verificar si tiene archivos
        const filesSnapshot = await db.collection('files')
            .where('categoryId', '==', categoryId)
            .get();
            
        if (!filesSnapshot.empty) {
            showToast('No se puede eliminar la categoría porque tiene archivos asociados', true);
            return;
        }

        if (!confirm(`¿Está seguro de que desea eliminar la categoría "${category.name}"?`)) {
            return;
        }

        await db.collection('categories').doc(categoryId).delete();
        showToast(`Categoría "${category.name}" eliminada correctamente`);
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        showToast('Error al eliminar la categoría', true);
    }
}

// ===== FUNCIONES AUXILIARES (se mantienen igual) =====

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

// Renderizar archivos (actualizado para datos de Firebase)
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
        
        const fileType = getFileType(file.name);
        const fileSize = file.formattedSize || formatFileSize(file.size);
        const viewCount = file.viewCount || 0;
        const downloadCount = file.downloadCount || 0;
        
        return `
        <div class="file-card" data-id="${file.id}">
            <div class="file-preview">
                <div class="cover-preview ${file.coverColor || getCoverClass(fileType)}">
                    <i class="cover-icon ${getCoverIcon(fileType)}"></i>
                    <div class="cover-title">${file.name.substring(0, 20)}${file.name.length > 20 ? '...' : ''}</div>
                    <div class="cover-subtitle">${fileType.toUpperCase()}</div>
                </div>
            </div>
            <div class="file-info">
                <div class="file-category-badge" style="background: ${fileCategory.color}">
                    ${fileCategory.name}
                </div>
                <div class="file-name">${fileName}</div>
                <div class="file-meta">
                    <span>${fileType.toUpperCase()}</span>
                    <span>${fileSize}</span>
                </div>
                <div class="file-stats">
                    <small><i class="fas fa-eye"></i> ${viewCount} vistas</small>
                    <small><i class="fas fa-download"></i> ${downloadCount} descargas</small>
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

// Las demás funciones (renderCategoryFilters, populateCategorySelectors, etc.) se mantienen similares
// Solo asegúrate de que usen los datos de 'categories' y 'files' actualizados

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', function() {
    initApp();
    setupEventListeners();
});

// Configurar event listeners (similar al anterior)
function setupEventListeners() {
    // Login form
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });

    // Upload area
    uploadArea.addEventListener('click', () => fileInput.click());
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

    // File input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelection(e.target.files);
        }
    });

    // Upload button
    uploadBtn.addEventListener('click', uploadFiles);

    // Category manager
    categoryManagerBtn.addEventListener('click', renderCategoryManager);

    // Close modals
    closeCategoryModal.addEventListener('click', () => categoryModal.style.display = 'none');
    categoryModal.addEventListener('click', (e) => {
        if (e.target === categoryModal) categoryModal.style.display = 'none';
    });

    // Add category
    addCategoryBtn.addEventListener('click', addCategory);

    // Login modal
    loginModal.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
    });

    // Description modal
    closeDescription.addEventListener('click', () => descriptionModal.style.display = 'none');
    descriptionModal.addEventListener('click', (e) => {
        if (e.target === descriptionModal) descriptionModal.style.display = 'none';
    });

    // Description actions
    editDescriptionBtn.addEventListener('click', enableDescriptionEdit);
    saveDescription.addEventListener('click', saveDescriptionChanges);
    cancelEdit.addEventListener('click', cancelDescriptionEdit);

    // Preview modal
    closePreview.addEventListener('click', () => previewModal.style.display = 'none');
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) previewModal.style.display = 'none';
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        if (searchTerm.length >= 2 || searchTerm.length === 0) {
            searchFiles(searchTerm);
        }
    });

    clearSearch.addEventListener('click', clearSearchResults);

    // Data management (opcional para multi-usuario)
    if (exportDataBtn) exportDataBtn.style.display = 'none';
    if (importDataBtn) importDataBtn.style.display = 'none';
    if (clearDataBtn) clearDataBtn.style.display = 'none';
}

// Búsqueda de archivos
async function searchFiles(searchTerm) {
    currentSearchTerm = searchTerm.toLowerCase().trim();
    
    if (currentSearchTerm === '') {
        searchResultsInfo.style.display = 'none';
        return;
    }

    const filteredFiles = files.filter(file => {
        const searchInName = file.name.toLowerCase().includes(currentSearchTerm);
        const searchInDescription = file.description.toLowerCase().includes(currentSearchTerm);
        const fileCategory = categories.find(cat => cat.id === file.categoryId);
        const searchInCategory = fileCategory ? fileCategory.name.toLowerCase().includes(currentSearchTerm) : false;
        
        return searchInName || searchInDescription || searchInCategory;
    });

    searchResultsInfo.style.display = 'block';
    searchResultsText.textContent = `Se encontraron ${filteredFiles.length} resultado(s) para "${searchTerm}"`;
    
    renderFiles(filteredFiles);
}

// Limpiar búsqueda
function clearSearchResults() {
    currentSearchTerm = '';
    searchInput.value = '';
    searchResultsInfo.style.display = 'none';
}