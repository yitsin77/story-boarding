// Alert at the very start of the file to verify script is loading
console.log('%c StoryBoardApp Script Started', 'background: #4f46e5; color: white; padding: 4px; border-radius: 4px;');

document.addEventListener('DOMContentLoaded', function() {
    console.log('%c DOM Content Loaded Event Fired', 'background: #10b981; color: white; padding: 4px; border-radius: 4px;');
    // Main application state
    const app = {
        scenes: [],
        currentSceneId: null,
        projectTitle: "Untitled Project",
        lastSceneId: 0,
        previewCurrentIndex: 0,
        viewMode: 'grid' // 'grid' or 'list'
    };

    // DOM Elements
    const elements = {
        newProjectBtn: document.getElementById('new-project-btn'),
        newSceneBtn: document.getElementById('new-scene-btn'),
        emptyStateBtn: document.getElementById('empty-state-btn'),
        scenesContainer: document.getElementById('scenes-container'),
        emptyState: document.getElementById('empty-state'),
        scenesTimeline: document.getElementById('scenes-timeline'),
        importBtn: document.getElementById('import-btn'),
        exportBtn: document.getElementById('export-btn'),
        exportPdfBtn: document.getElementById('export-pdf-btn'),
        importFile: document.getElementById('import-file'),
        projectTitle: document.getElementById('project-title'),
        totalTime: document.getElementById('total-time'),
        previewBtn: document.getElementById('preview-btn'),
        previewModal: document.getElementById('preview-modal'),
        closeModal: document.querySelector('.close-modal'),
        prevSlide: document.getElementById('prev-slide'),
        nextSlide: document.getElementById('next-slide'),
        currentSlide: document.getElementById('current-slide'),
        totalSlides: document.getElementById('total-slides'),
        previewContainer: document.getElementById('preview-container'),
        gridViewBtn: document.getElementById('grid-view-btn'),
        listViewBtn: document.getElementById('list-view-btn'),
        editModalContainer: document.getElementById('edit-modal-container')
    };

    // Templates
    const templates = {
        sceneTemplate: document.getElementById('scene-template'),
        timelineSceneTemplate: document.getElementById('timeline-scene-template'),
        editModalTemplate: document.getElementById('edit-modal-template')
    };

    // Initialize the application
    function init() {
        try {
            console.log('Initializing StoryBoard App...');
            
            // Log all DOM elements to verify they're found
            console.log('DOM Elements check:');
            for (const [key, element] of Object.entries(elements)) {
                console.log(`${key}: ${element ? 'Found' : 'NOT FOUND!'}`);
                
                // Add fallback for critical buttons if they're missing
                if (!element && key === 'newSceneBtn') {
                    console.warn('Adding fallback New Card button');
                    const actionButtonsDiv = document.querySelector('.action-buttons');
                    if (actionButtonsDiv) {
                        const newBtn = document.createElement('button');
                        newBtn.id = 'new-scene-btn';
                        newBtn.className = 'primary-btn';
                        newBtn.innerHTML = '<i class="fas fa-plus"></i> New Card (Fallback)';
                        actionButtonsDiv.prepend(newBtn);
                        elements.newSceneBtn = newBtn;
                    }
                }
                
                if (!element && key === 'emptyStateBtn') {
                    console.warn('Adding fallback Empty State button');
                    const emptyStateContent = document.querySelector('.empty-state-content');
                    if (emptyStateContent) {
                        const newBtn = document.createElement('button');
                        newBtn.id = 'empty-state-btn';
                        newBtn.className = 'primary-btn';
                        newBtn.innerHTML = '<i class="fas fa-plus"></i> Create Card (Fallback)';
                        emptyStateContent.appendChild(newBtn);
                        elements.emptyStateBtn = newBtn;
                    }
                }
            }
            
            // Log all templates to verify they're found
            console.log('Templates check:');
            for (const [key, template] of Object.entries(templates)) {
                console.log(`${key}: ${template ? 'Found' : 'NOT FOUND!'}`);
                
                // Template fallbacks could be added here if needed
            }
            
            // Load from local storage if available
            loadFromLocalStorage();
            
            // Update UI based on initial state
            updateUI();
            
            // Attach event listeners
            attachEventListeners();
            
            // No duplicate event listeners
            
            console.log('StoryBoard App initialized successfully');
        } catch (error) {
            console.error('Error initializing app:', error);
            alert('There was a problem initializing the app. Please refresh the page and try again.');
        }
    }

    // Update UI based on app state
    function updateUI() {
        elements.projectTitle.value = app.projectTitle;
        
        // Calculate and update total time
        const totalSeconds = app.scenes.reduce((total, scene) => total + (scene.duration || 5), 0);
        let timeDisplay = '';
        
        if (totalSeconds < 60) {
            timeDisplay = `${totalSeconds}s`;
        } else {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            timeDisplay = `${minutes}m ${seconds}s`;
        }
        
        if (elements.totalTime) {
            elements.totalTime.textContent = timeDisplay;
        }
        
        // Show/hide empty state
        if (app.scenes.length === 0) {
            elements.emptyState.style.display = 'block';
            elements.scenesContainer.style.display = 'none';
        } else {
            elements.emptyState.style.display = 'none';
            elements.scenesContainer.style.display = 'grid';
            
            // Set view mode class
            elements.scenesContainer.className = app.viewMode === 'grid' ? 'scenes-container card-grid' : 'scenes-container list-view';
            
            // Update active view mode button
            elements.gridViewBtn.classList.toggle('active', app.viewMode === 'grid');
            elements.listViewBtn.classList.toggle('active', app.viewMode === 'list');
            
            // Render all scenes
            renderScenes();
            
            // Render timeline
            renderTimeline();
        }
    }

    // Render all scenes
    function renderScenes() {
        // Clear container
        elements.scenesContainer.innerHTML = '';
        
        // Add each scene
        app.scenes.forEach((scene, index) => {
            const sceneElement = createSceneCardElement(scene, index);
            elements.scenesContainer.appendChild(sceneElement);
        });
    }

    // Create a single scene card element
    function createSceneCardElement(scene, index) {
        // Clone the template
        const sceneElement = templates.sceneTemplate.content.cloneNode(true);
        const sceneCard = sceneElement.querySelector('.scene-card');
        
        // Set data attribute and scene number
        sceneCard.setAttribute('data-scene-id', scene.id);
        sceneCard.querySelector('.scene-number').textContent = `Scene ${index + 1}`;
        
        // Set content from scene data
        const titleInput = sceneCard.querySelector('.scene-title');
        const durationSpan = sceneCard.querySelector('.scene-duration span');
        const descriptionPreview = sceneCard.querySelector('.scene-description-preview');
        
        titleInput.value = scene.title || '';
        durationSpan.textContent = `${scene.duration || 5}s`;
        
        // Set description preview
        if (scene.visualDescription) {
            descriptionPreview.textContent = scene.visualDescription.length > 120 
                ? scene.visualDescription.substring(0, 120) + '...' 
                : scene.visualDescription;
        } else {
            descriptionPreview.textContent = 'No description yet. Click edit to add details.';
        }
        
        // Handle image if exists
        const imagePreview = sceneCard.querySelector('.scene-image');
        const uploadPlaceholder = sceneCard.querySelector('.upload-placeholder');
        
        if (scene.image) {
            imagePreview.src = scene.image;
            imagePreview.style.display = 'block';
            uploadPlaceholder.style.display = 'none';
        }
        
        // Attach event listeners to scene elements
        attachSceneCardEventListeners(sceneCard, scene.id);
        
        return sceneCard;
    }

    // Render timeline
    function renderTimeline() {
        // Clear container
        elements.scenesTimeline.innerHTML = '';
        
        // Add each scene to timeline
        app.scenes.forEach((scene, index) => {
            const timelineScene = createTimelineSceneElement(scene, index);
            elements.scenesTimeline.appendChild(timelineScene);
        });
    }

    // Create a single timeline scene element
    function createTimelineSceneElement(scene, index) {
        // Clone the template
        const timelineScene = templates.timelineSceneTemplate.content.cloneNode(true);
        const timelineSceneElement = timelineScene.querySelector('.timeline-scene');
        
        // Set data attribute
        timelineSceneElement.setAttribute('data-scene-id', scene.id);
        
        // Set content
        timelineSceneElement.querySelector('.timeline-scene-number').textContent = `Scene ${index + 1}`;
        timelineSceneElement.querySelector('.timeline-scene-duration').textContent = `${scene.duration || 5}s`;
        
        // Set image if exists
        const previewImg = timelineSceneElement.querySelector('img');
        if (scene.image) {
            previewImg.src = scene.image;
        } else {
            previewImg.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"%3E%3C/rect%3E%3Cline x1="7" y1="2" x2="7" y2="22"%3E%3C/line%3E%3Cline x1="17" y1="2" x2="17" y2="22"%3E%3C/line%3E%3Cline x1="2" y1="12" x2="22" y2="12"%3E%3C/line%3E%3C/svg%3E';
        }
        
        // Add click event listener
        timelineSceneElement.addEventListener('click', () => {
            scrollToScene(scene.id);
        });
        
        return timelineSceneElement;
    }
    
    // Attach event listeners to scene card elements
    function attachSceneCardEventListeners(sceneCard, sceneId) {
        // Title input
        const titleInput = sceneCard.querySelector('.scene-title');
        titleInput.addEventListener('input', (e) => {
            updateSceneProperty(sceneId, 'title', e.target.value);
            renderTimeline(); // Update timeline
        });
        
        // Get image elements
        const imagePreview = sceneCard.querySelector('.image-preview');
        const imageUpload = sceneCard.querySelector('.image-upload');
        
        // Make the image preview clickable to trigger file upload
        imagePreview.addEventListener('click', () => {
            imageUpload.click();
        });
        
        // Edit button
        const editBtn = sceneCard.querySelector('.edit-card-btn');
        editBtn.addEventListener('click', () => {
            openEditModal(sceneId);
        });
        
        // Image upload
        imageUpload.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imageData = event.target.result;
                    updateSceneProperty(sceneId, 'image', imageData);
                    
                    // Update image preview
                    const imagePreview = sceneCard.querySelector('.scene-image');
                    const uploadPlaceholder = sceneCard.querySelector('.upload-placeholder');
                    
                    imagePreview.src = imageData;
                    imagePreview.style.display = 'block';
                    uploadPlaceholder.style.display = 'none';
                    
                    // Update timeline
                    renderTimeline();
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
        
        // Delete button
        const deleteBtn = sceneCard.querySelector('.delete-scene-btn');
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this scene?')) {
                deleteScene(sceneId);
            }
        });
        
        // Move up button
        const moveUpBtn = sceneCard.querySelector('.move-up-btn');
        moveUpBtn.addEventListener('click', () => {
            moveScene(sceneId, 'up');
        });
        
        // Move down button
        const moveDownBtn = sceneCard.querySelector('.move-down-btn');
        moveDownBtn.addEventListener('click', () => {
            moveScene(sceneId, 'down');
        });
    }
    
    // Attach global event listeners
    function attachEventListeners() {
        // New project button
        if (elements.newProjectBtn) {
            elements.newProjectBtn.addEventListener('click', function(e) {
                console.log('New Project button clicked!');
                e.preventDefault();
                if (app.scenes.length > 0) {
                    if (confirm('Creating a new project will clear all current scenes. Continue?')) {
                        createNewProject();
                    }
                } else {
                    createNewProject();
                }
            });
        }
        
        // New scene button
        console.log('Setting up New Card button:', elements.newSceneBtn);
        if (!elements.newSceneBtn) {
            console.error('New Card button not found in the DOM!');
        } else {
            elements.newSceneBtn.addEventListener('click', function(e) {
                console.log('New Card button clicked!');
                e.preventDefault();
                createNewScene();
            });
        }
        
        // Empty state button
        console.log('Setting up Empty State button:', elements.emptyStateBtn);
        if (!elements.emptyStateBtn) {
            console.error('Empty State button not found in the DOM!');
        } else {
            elements.emptyStateBtn.addEventListener('click', function(e) {
                console.log('Empty State button clicked!');
                e.preventDefault();
                createNewScene();
            });
        }
        
        // Project title
        elements.projectTitle.addEventListener('input', (e) => {
            app.projectTitle = e.target.value;
            saveToLocalStorage();
        });
        
        // Import button
        elements.importBtn.addEventListener('click', () => {
            elements.importFile.click();
        });
        
        // Import file change
        elements.importFile.addEventListener('change', handleImport);
        
        // Export button
        elements.exportBtn.addEventListener('click', exportToJson);
        
        // Export PDF button
        elements.exportPdfBtn.addEventListener('click', exportToPdf);
        
        // Preview button
        elements.previewBtn.addEventListener('click', openPreview);
        
        // Close modal
        elements.closeModal.addEventListener('click', closePreview);
        
        // Preview navigation
        elements.prevSlide.addEventListener('click', () => navigatePreview('prev'));
        elements.nextSlide.addEventListener('click', () => navigatePreview('next'));
        
        // View mode buttons
        elements.gridViewBtn.addEventListener('click', () => {
            app.viewMode = 'grid';
            updateUI();
            saveToLocalStorage();
        });
        
        elements.listViewBtn.addEventListener('click', () => {
            app.viewMode = 'list';
            updateUI();
            saveToLocalStorage();
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === elements.previewModal) {
                closePreview();
            }
            
            // Close edit modal if it exists and clicked outside
            const editModal = document.querySelector('.edit-modal');
            if (editModal && e.target === editModal) {
                closeEditModal();
            }
        });

        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save (export to JSON)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                exportToJson();
            }
            
            // Ctrl/Cmd + P to preview
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                openPreview();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                if (elements.previewModal.style.display === 'block') {
                    closePreview();
                }
                
                const editModal = document.querySelector('.edit-modal');
                if (editModal && editModal.style.display === 'block') {
                    closeEditModal();
                }
            }
            
            // Left and right arrows for preview navigation
            if (elements.previewModal.style.display === 'block') {
                if (e.key === 'ArrowLeft') {
                    navigatePreview('prev');
                } else if (e.key === 'ArrowRight') {
                    navigatePreview('next');
                }
            }
        });
    }
    
    // Create a new project
    function createNewProject() {
        console.log('Creating new project...');
        try {
            // Reset app state
            app.scenes = [];
            app.lastSceneId = 0;
            app.projectTitle = "Untitled Project";
            app.previewCurrentIndex = 0;
            
            // Save and update UI
            saveToLocalStorage();
            updateUI();
            
            console.log('New project created');
        } catch (error) {
            console.error('Error creating new project:', error);
            alert('Error creating new project. Please try again.');
        }
    }
    
    // Create a new scene
    function createNewScene() {
        console.log('Creating new scene...');
        try {
            app.lastSceneId++;
            const newScene = {
                id: app.lastSceneId,
                title: `Scene ${app.scenes.length + 1}`,
                visualDescription: '',
                audioNarration: '',
                notes: '',
                duration: 5,
                image: null
            };
            
            app.scenes.push(newScene);
            saveToLocalStorage();
            updateUI();
            
            // Scroll to the new scene
            setTimeout(() => {
                scrollToScene(newScene.id);
            }, 100);
            
            console.log('New scene created with ID:', newScene.id);
        } catch (error) {
            console.error('Error creating new scene:', error);
            alert('Error creating new scene. Please try again.');
        }
    }
    
    // Delete a scene
    function deleteScene(sceneId) {
        const index = app.scenes.findIndex(scene => scene.id === sceneId);
        if (index !== -1) {
            app.scenes.splice(index, 1);
            saveToLocalStorage();
            updateUI();
        }
    }
    
    // Move a scene up or down
    function moveScene(sceneId, direction) {
        const index = app.scenes.findIndex(scene => scene.id === sceneId);
        if (index === -1) return;
        
        if (direction === 'up' && index > 0) {
            // Swap with previous scene
            [app.scenes[index], app.scenes[index - 1]] = [app.scenes[index - 1], app.scenes[index]];
            saveToLocalStorage();
            updateUI();
            scrollToScene(sceneId);
        } else if (direction === 'down' && index < app.scenes.length - 1) {
            // Swap with next scene
            [app.scenes[index], app.scenes[index + 1]] = [app.scenes[index + 1], app.scenes[index]];
            saveToLocalStorage();
            updateUI();
            scrollToScene(sceneId);
        }
    }
    
    // Scroll to a specific scene
    function scrollToScene(sceneId) {
        const sceneElement = document.querySelector(`.scene-card[data-scene-id="${sceneId}"]`);
        if (sceneElement) {
            sceneElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Highlight the scene briefly
            sceneElement.classList.add('highlight');
            setTimeout(() => {
                sceneElement.classList.remove('highlight');
            }, 1000);
        }
    }
    
    // Update a scene property
    function updateSceneProperty(sceneId, property, value) {
        const scene = app.scenes.find(scene => scene.id === sceneId);
        if (scene) {
            scene[property] = value;
            saveToLocalStorage();
        }
    }
    
    // Open edit modal for a scene
    function openEditModal(sceneId) {
        const scene = app.scenes.find(scene => scene.id === sceneId);
        if (!scene) return;
        
        // Clone the edit modal template
        const modalElement = templates.editModalTemplate.content.cloneNode(true);
        const modalContainer = modalElement.querySelector('.edit-modal');
        
        // Set values
        modalContainer.querySelector('.edit-scene-title').value = scene.title || '';
        modalContainer.querySelector('.edit-scene-duration').value = scene.duration || 5;
        modalContainer.querySelector('.edit-visual-description').value = scene.visualDescription || '';
        modalContainer.querySelector('.edit-audio-narration').value = scene.audioNarration || '';
        modalContainer.querySelector('.edit-scene-notes').value = scene.notes || '';
        
        // Clear previous modal if exists
        elements.editModalContainer.innerHTML = '';
        elements.editModalContainer.appendChild(modalContainer);
        
        // Show modal
        modalContainer.style.display = 'block';
        
        // Focus on title
        setTimeout(() => {
            modalContainer.querySelector('.edit-scene-title').focus();
        }, 100);
        
        // Close button event
        modalContainer.querySelector('.close-edit-modal').addEventListener('click', closeEditModal);
        
        // Cancel button event
        modalContainer.querySelector('.cancel-edit-btn').addEventListener('click', closeEditModal);
        
        // Save button event
        modalContainer.querySelector('.save-edit-btn').addEventListener('click', () => {
            saveEditChanges(sceneId);
        });
    }
    
    // Close edit modal
    function closeEditModal() {
        const editModal = document.querySelector('.edit-modal');
        if (editModal) {
            editModal.style.display = 'none';
        }
    }
    
    // Save changes from edit modal
    function saveEditChanges(sceneId) {
        const editModal = document.querySelector('.edit-modal');
        if (!editModal) return;
        
        const title = editModal.querySelector('.edit-scene-title').value;
        const duration = parseInt(editModal.querySelector('.edit-scene-duration').value) || 5;
        const visualDescription = editModal.querySelector('.edit-visual-description').value;
        const audioNarration = editModal.querySelector('.edit-audio-narration').value;
        const notes = editModal.querySelector('.edit-scene-notes').value;
        
        // Update scene properties
        updateSceneProperty(sceneId, 'title', title);
        updateSceneProperty(sceneId, 'duration', duration);
        updateSceneProperty(sceneId, 'visualDescription', visualDescription);
        updateSceneProperty(sceneId, 'audioNarration', audioNarration);
        updateSceneProperty(sceneId, 'notes', notes);
        
        // Update UI
        updateUI();
        
        // Close modal
        closeEditModal();
    }
    
    // Save to local storage
    function saveToLocalStorage() {
        const data = {
            projectTitle: app.projectTitle,
            scenes: app.scenes,
            lastSceneId: app.lastSceneId,
            viewMode: app.viewMode
        };
        localStorage.setItem('storyboardData', JSON.stringify(data));
    }
    
    // Load from local storage
    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('storyboardData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                app.projectTitle = data.projectTitle || "Untitled Project";
                app.scenes = data.scenes || [];
                app.lastSceneId = data.lastSceneId || 0;
                app.viewMode = data.viewMode || 'grid';
            } catch (error) {
                console.error('Error loading data from local storage:', error);
            }
        }
    }
    
    // Export to JSON
    function exportToJson() {
        const data = {
            projectTitle: app.projectTitle,
            scenes: app.scenes,
            exportDate: new Date().toISOString()
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${app.projectTitle.replace(/\s+/g, '_')}_storyboard.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // Import from JSON file
    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Validate imported data
                if (!importedData.scenes || !Array.isArray(importedData.scenes)) {
                    throw new Error('Invalid storyboard file: missing scenes array');
                }
                
                // Import data
                app.projectTitle = importedData.projectTitle || "Imported Project";
                app.scenes = importedData.scenes;
                
                // Find the highest scene ID to update lastSceneId
                app.lastSceneId = 0;
                importedData.scenes.forEach(scene => {
                    if (scene.id > app.lastSceneId) {
                        app.lastSceneId = scene.id;
                    }
                });
                
                saveToLocalStorage();
                updateUI();
                
                alert('Storyboard imported successfully!');
            } catch (error) {
                console.error('Error importing storyboard:', error);
                alert('Error importing storyboard. Please check the file format.');
            }
        };
        reader.readAsText(file);
        
        // Reset the input so the same file can be selected again
        event.target.value = '';
    }
    
    // Export to PDF
    function exportToPdf() {
        // Check if html2pdf is available
        if (typeof html2pdf === 'undefined') {
            alert('PDF export library not loaded. Please ensure you have an internet connection to load the html2pdf library.');
            return;
        }
        
        // Create a new document for PDF export
        const pdfContent = document.createElement('div');
        pdfContent.className = 'pdf-export';
        
        // Add project title
        const titleElement = document.createElement('h1');
        titleElement.textContent = app.projectTitle;
        pdfContent.appendChild(titleElement);
        
        // Add each scene
        app.scenes.forEach((scene, index) => {
            const sceneElement = document.createElement('div');
            sceneElement.className = 'pdf-scene';
            
            // Scene header
            const sceneHeader = document.createElement('div');
            sceneHeader.className = 'pdf-scene-header';
            sceneHeader.innerHTML = `<h2>Scene ${index + 1}: ${scene.title || 'Untitled'}</h2>
                                     <p>Duration: ${scene.duration || 5} seconds</p>`;
            sceneElement.appendChild(sceneHeader);
            
            // Scene content
            const sceneContent = document.createElement('div');
            sceneContent.className = 'pdf-scene-content';
            
            // Scene image
            if (scene.image) {
                const imageContainer = document.createElement('div');
                imageContainer.className = 'pdf-image-container';
                const image = document.createElement('img');
                image.src = scene.image;
                image.alt = `Scene ${index + 1} image`;
                imageContainer.appendChild(image);
                sceneContent.appendChild(imageContainer);
            }
            
            // Scene text content
            const textContent = document.createElement('div');
            textContent.className = 'pdf-text-content';
            
            if (scene.visualDescription) {
                const visualDesc = document.createElement('div');
                visualDesc.className = 'pdf-section';
                visualDesc.innerHTML = `<h3>Visual Description</h3><p>${scene.visualDescription}</p>`;
                textContent.appendChild(visualDesc);
            }
            
            if (scene.audioNarration) {
                const audioNarr = document.createElement('div');
                audioNarr.className = 'pdf-section';
                audioNarr.innerHTML = `<h3>Audio Narration</h3><p>${scene.audioNarration}</p>`;
                textContent.appendChild(audioNarr);
            }
            
            if (scene.notes) {
                const notes = document.createElement('div');
                notes.className = 'pdf-section';
                notes.innerHTML = `<h3>Notes</h3><p>${scene.notes}</p>`;
                textContent.appendChild(notes);
            }
            
            sceneContent.appendChild(textContent);
            sceneElement.appendChild(sceneContent);
            pdfContent.appendChild(sceneElement);
        });
        
        // Add PDF export styles
        const styleElement = document.createElement('style');
        styleElement.textContent = `
            .pdf-export {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #1e293b;
                padding: 20px;
            }
            .pdf-scene {
                page-break-inside: avoid;
                margin-bottom: 30px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
            }
            .pdf-scene-header {
                background-color: #f1f5f9;
                padding: 10px 15px;
                border-bottom: 1px solid #e2e8f0;
            }
            .pdf-scene-header h2 {
                margin: 0 0 5px 0;
                font-size: 18px;
            }
            .pdf-scene-header p {
                margin: 0;
                font-size: 14px;
                color: #64748b;
            }
            .pdf-scene-content {
                display: flex;
                padding: 15px;
            }
            .pdf-image-container {
                width: 30%;
                margin-right: 15px;
            }
            .pdf-image-container img {
                width: 100%;
                border-radius: 4px;
            }
            .pdf-text-content {
                flex: 1;
            }
            .pdf-section {
                margin-bottom: 15px;
            }
            .pdf-section h3 {
                margin: 0 0 5px 0;
                font-size: 16px;
                color: #4f46e5;
            }
            .pdf-section p {
                margin: 0;
                white-space: pre-wrap;
            }
            @media print {
                .pdf-scene {
                    page-break-inside: avoid;
                }
            }
        `;
        pdfContent.appendChild(styleElement);
        
        // Generate PDF
        const opt = {
            margin: 10,
            filename: `${app.projectTitle.replace(/\s+/g, '_')}_storyboard.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Temporarily add the content to the document
        document.body.appendChild(pdfContent);
        
        // Generate PDF
        html2pdf().set(opt).from(pdfContent).save().then(() => {
            // Remove the temporary element
            document.body.removeChild(pdfContent);
        }).catch(error => {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');
            document.body.removeChild(pdfContent);
        });
    }
    
    // Open preview modal
    function openPreview() {
        if (app.scenes.length === 0) {
            alert('No scenes to preview. Create at least one scene first.');
            return;
        }
        
        // Reset preview state
        app.previewCurrentIndex = 0;
        
        // Update preview content
        updatePreviewContent();
        
        // Show modal
        elements.previewModal.style.display = 'block';
    }
    
    // Close preview modal
    function closePreview() {
        elements.previewModal.style.display = 'none';
    }
    
    // Navigate preview slides
    function navigatePreview(direction) {
        if (direction === 'prev' && app.previewCurrentIndex > 0) {
            app.previewCurrentIndex--;
        } else if (direction === 'next' && app.previewCurrentIndex < app.scenes.length - 1) {
            app.previewCurrentIndex++;
        }
        
        updatePreviewContent();
    }
    
    // Update preview content
    function updatePreviewContent() {
        const scene = app.scenes[app.previewCurrentIndex];
        
        // Update slide counter
        elements.currentSlide.textContent = app.previewCurrentIndex + 1;
        elements.totalSlides.textContent = app.scenes.length;
        
        // Create preview content
        const previewContent = document.createElement('div');
        previewContent.className = 'preview-slide';
        
        // Scene title
        const titleElement = document.createElement('h3');
        titleElement.className = 'preview-title';
        titleElement.textContent = scene.title || `Scene ${app.previewCurrentIndex + 1}`;
        previewContent.appendChild(titleElement);
        
        // Scene duration
        const durationElement = document.createElement('div');
        durationElement.className = 'preview-duration';
        durationElement.textContent = `Duration: ${scene.duration || 5}s`;
        previewContent.appendChild(durationElement);
        
        // Scene content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'preview-content';
        
        // Scene image
        if (scene.image) {
            const imageElement = document.createElement('div');
            imageElement.className = 'preview-image';
            imageElement.innerHTML = `<img src="${scene.image}" alt="Preview image">`;
            contentContainer.appendChild(imageElement);
        } else {
            const placeholderElement = document.createElement('div');
            placeholderElement.className = 'preview-image-placeholder';
            placeholderElement.innerHTML = '<i class="fas fa-image"></i><p>No image</p>';
            contentContainer.appendChild(placeholderElement);
        }
        
        // Scene descriptions
        const descriptionsElement = document.createElement('div');
        descriptionsElement.className = 'preview-descriptions';
        
        if (scene.visualDescription) {
            const visualDescElement = document.createElement('div');
            visualDescElement.className = 'preview-section';
            visualDescElement.innerHTML = `<h4>Visual Description:</h4><p>${scene.visualDescription}</p>`;
            descriptionsElement.appendChild(visualDescElement);
        }
        
        if (scene.audioNarration) {
            const audioNarrElement = document.createElement('div');
            audioNarrElement.className = 'preview-section';
            audioNarrElement.innerHTML = `<h4>Audio Narration:</h4><p>${scene.audioNarration}</p>`;
            descriptionsElement.appendChild(audioNarrElement);
        }
        
        contentContainer.appendChild(descriptionsElement);
        previewContent.appendChild(contentContainer);
        
        // Clear previous content and add new
        elements.previewContainer.innerHTML = '';
        elements.previewContainer.appendChild(previewContent);
    }
    
    // Initialize the app
    init();
    
    // No fallback function needed
});