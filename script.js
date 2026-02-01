// Local storage key for applications
const STORAGE_KEY = 'applications';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOADS_FOLDER = 'uploads/';

// Initialize applications array
let applications = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// File preview functionality
function setupFilePreviews() {
    const resumeInput = document.getElementById('resume');
    const coverLetterInput = document.getElementById('coverLetter');
    const additionalDocsInput = document.getElementById('additionalDocs');
    
    if (resumeInput) {
        resumeInput.addEventListener('change', function(e) {
            previewFile(this, 'resumePreview');
        });
    }
    
    if (coverLetterInput) {
        coverLetterInput.addEventListener('change', function(e) {
            previewFile(this, 'coverLetterPreview');
        });
    }
    
    if (additionalDocsInput) {
        additionalDocsInput.addEventListener('change', function(e) {
            previewMultipleFiles(this, 'additionalDocsPreview');
        });
    }
}

function previewFile(input, previewId) {
    const preview = document.getElementById(previewId);
    preview.innerHTML = '';
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        if (file.size > MAX_FILE_SIZE) {
            showError(`File "${file.name}" exceeds 5MB limit`);
            input.value = '';
            return;
        }
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-preview-item';
        fileItem.innerHTML = `
            <i class="${getFileIcon(file.name)}"></i>
            <span>${file.name} (${formatFileSize(file.size)})</span>
        `;
        preview.appendChild(fileItem);
    }
}

function previewMultipleFiles(input, previewId) {
    const preview = document.getElementById(previewId);
    preview.innerHTML = '';
    
    if (input.files && input.files.length > 0) {
        const files = Array.from(input.files);
        
        // Limit to 3 files
        if (files.length > 3) {
            showError('Maximum 3 additional files allowed');
            input.value = '';
            return;
        }
        
        files.forEach(file => {
            if (file.size > MAX_FILE_SIZE) {
                showError(`File "${file.name}" exceeds 5MB limit`);
                return;
            }
            
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item';
            fileItem.innerHTML = `
                <i class="${getFileIcon(file.name)}"></i>
                <span>${file.name} (${formatFileSize(file.size)})</span>
            `;
            preview.appendChild(fileItem);
        });
    }
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'fas fa-file-pdf';
    if (['doc', 'docx'].includes(ext)) return 'fas fa-file-word';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'fas fa-file-image';
    if (ext === 'txt') return 'fas fa-file-alt';
    return 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Application Form Submission - UPDATED WITH FILE HANDLING
if (document.getElementById('applicationForm')) {
    const form = document.getElementById('applicationForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    
    setupFilePreviews();
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            // Get form data
            const formData = {
                id: Date.now().toString(),
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                position: document.getElementById('position').value,
                message: document.getElementById('message').value,
                status: 'pending',
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                documents: []
            };
            
            // Handle file uploads
            const files = await processFileUploads();
            formData.documents = files;
            
            // Add to applications array
            applications.push(formData);
            
            // Save to local storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
            
            // Show success message
            showSuccess('Application submitted successfully!');
            
            // Reset form
            form.reset();
            document.querySelectorAll('.file-preview').forEach(preview => {
                preview.innerHTML = '';
            });
            
        } catch (error) {
            showError(error.message);
        }
    });
    
    async function processFileUploads() {
        const files = [];
        
        // Process resume
        const resumeInput = document.getElementById('resume');
        if (resumeInput.files[0]) {
            const resumeFile = await readFileAsDataURL(resumeInput.files[0]);
            files.push({
                name: resumeInput.files[0].name,
                type: resumeInput.files[0].type,
                size: resumeInput.files[0].size,
                data: resumeFile,
                category: 'resume'
            });
        }
        
        // Process cover letter
        const coverLetterInput = document.getElementById('coverLetter');
        if (coverLetterInput.files[0]) {
            const coverLetterFile = await readFileAsDataURL(coverLetterInput.files[0]);
            files.push({
                name: coverLetterInput.files[0].name,
                type: coverLetterInput.files[0].type,
                size: coverLetterInput.files[0].size,
                data: coverLetterFile,
                category: 'coverLetter'
            });
        }
        
        // Process additional docs
        const additionalDocsInput = document.getElementById('additionalDocs');
        if (additionalDocsInput.files.length > 0) {
            for (let i = 0; i < additionalDocsInput.files.length; i++) {
                const file = additionalDocsInput.files[i];
                const fileData = await readFileAsDataURL(file);
                files.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: fileData,
                    category: 'additional'
                });
            }
        }
        
        return files;
    }
    
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Error reading file'));
            reader.readAsDataURL(file);
        });
    }
}

// Admin Dashboard Functionality - UPDATED WITH DOCUMENT VIEWING
if (document.getElementById('applicationsList')) {
    // DOM Elements
    const applicationsList = document.getElementById('applicationsList');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const positionFilter = document.getElementById('positionFilter');
    const refreshBtn = document.getElementById('refreshBtn');
    const applicationModal = document.getElementById('applicationModal');
    const modalBody = document.getElementById('modalBody');
    
    // Count elements
    const pendingCount = document.getElementById('pendingCount');
    const totalCount = document.getElementById('totalCount');
    const reviewedCount = document.getElementById('reviewedCount');
    const applicationsCount = document.getElementById('applicationsCount');
    
    // Document modal elements
    const documentModal = document.getElementById('documentModal');
    const documentModalTitle = document.getElementById('documentModalTitle');
    const documentViewer = document.getElementById('documentViewer');
    const documentDownloadBtn = document.getElementById('documentDownloadBtn');
    
    let selectedApplicationId = null;
    let currentDocument = null;
    
    // Load applications on page load
    loadApplications();
    updateStats();
    
    // Event Listeners
    searchInput.addEventListener('input', filterApplications);
    statusFilter.addEventListener('change', filterApplications);
    positionFilter.addEventListener('change', filterApplications);
    refreshBtn.addEventListener('click', () => {
        applications = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        loadApplications();
        updateStats();
    });
    
    // Close modals
    document.querySelectorAll('.close-modal, .close-document-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.closest('.close-modal')) {
                applicationModal.style.display = 'none';
            }
            if (e.target.closest('.close-document-modal')) {
                documentModal.style.display = 'none';
                currentDocument = null;
            }
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === applicationModal) {
            applicationModal.style.display = 'none';
        }
        if (e.target === documentModal) {
            documentModal.style.display = 'none';
            currentDocument = null;
        }
    });
    
    // Document download
    documentDownloadBtn.addEventListener('click', downloadCurrentDocument);
    
    // Load applications into the list
    function loadApplications() {
        applicationsList.innerHTML = '';
        
        if (applications.length === 0) {
            applicationsList.innerHTML = `
                <div class="no-applications">
                    <i class="fas fa-inbox"></i>
                    <h3>No applications yet</h3>
                    <p>Applications submitted will appear here</p>
                </div>
            `;
            return;
        }
        
        applications.forEach(app => {
            const positionNames = {
                'developer': 'Software Developer',
                'designer': 'UI/UX Designer',
                'manager': 'Project Manager',
                'analyst': 'Business Analyst'
            };
            
            const applicationItem = document.createElement('div');
            applicationItem.className = 'application-item';
            applicationItem.setAttribute('data-id', app.id);
            
            // Count documents
            const docCount = app.documents ? app.documents.length : 0;
            
            applicationItem.innerHTML = `
                <div class="application-info">
                    <h3>${app.fullName}</h3>
                    <p>${positionNames[app.position] || app.position} • ${app.email}</p>
                    <p><small>Applied on: ${app.date} • ${docCount} document${docCount !== 1 ? 's' : ''}</small></p>
                </div>
                <div class="application-status status-${app.status}">
                    ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </div>
            `;
            
            applicationItem.addEventListener('click', () => showApplicationDetails(app.id));
            applicationsList.appendChild(applicationItem);
        });
        
        applicationsCount.textContent = `${applications.length} application${applications.length !== 1 ? 's' : ''}`;
    }
    
    // Filter applications based on search and filters
    function filterApplications() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        const positionValue = positionFilter.value;
        
        const filteredApplications = applications.filter(app => {
            const matchesSearch = app.fullName.toLowerCase().includes(searchTerm) ||
                                  app.email.toLowerCase().includes(searchTerm) ||
                                  app.position.toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusValue === 'all' || app.status === statusValue;
            const matchesPosition = positionValue === 'all' || app.position === positionValue;
            
            return matchesSearch && matchesStatus && matchesPosition;
        });
        
        displayFilteredApplications(filteredApplications);
    }
    
    // Display filtered applications
    function displayFilteredApplications(filteredApps) {
        applicationsList.innerHTML = '';
        
        if (filteredApps.length === 0) {
            applicationsList.innerHTML = `
                <div class="no-applications">
                    <i class="fas fa-search"></i>
                    <h3>No applications found</h3>
                    <p>Try adjusting your search or filters</p>
                </div>
            `;
            return;
        }
        
        filteredApps.forEach(app => {
            const positionNames = {
                'developer': 'Software Developer',
                'designer': 'UI/UX Designer',
                'manager': 'Project Manager',
                'analyst': 'Business Analyst'
            };
            
            const docCount = app.documents ? app.documents.length : 0;
            
            const applicationItem = document.createElement('div');
            applicationItem.className = 'application-item';
            applicationItem.setAttribute('data-id', app.id);
            
            applicationItem.innerHTML = `
                <div class="application-info">
                    <h3>${app.fullName}</h3>
                    <p>${positionNames[app.position] || app.position} • ${app.email}</p>
                    <p><small>Applied on: ${app.date} • ${docCount} document${docCount !== 1 ? 's' : ''}</small></p>
                </div>
                <div class="application-status status-${app.status}">
                    ${app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                </div>
            `;
            
            applicationItem.addEventListener('click', () => showApplicationDetails(app.id));
            applicationsList.appendChild(applicationItem);
        });
    }
    
    // Show application details in modal - UPDATED WITH DOCUMENTS
    function showApplicationDetails(id) {
        selectedApplicationId = id;
        const app = applications.find(a => a.id === id);
        
        if (!app) return;
        
        const positionNames = {
            'developer': 'Software Developer',
            'designer': 'UI/UX Designer',
            'manager': 'Project Manager',
            'analyst': 'Business Analyst'
        };
        
        modalBody.innerHTML = `
            <div class="application-details">
                <div class="detail-group">
                    <h4>Personal Information</h4>
                    <p><strong>Full Name:</strong> ${app.fullName}</p>
                    <p><strong>Email:</strong> ${app.email}</p>
                    <p><strong>Phone:</strong> ${app.phone}</p>
                </div>
                
                <div class="detail-group">
                    <h4>Application Details</h4>
                    <p><strong>Position:</strong> ${positionNames[app.position] || app.position}</p>
                    <p><strong>Status:</strong> <span class="application-status status-${app.status}">${app.status.charAt(0).toUpperCase() + app.status.slice(1)}</span></p>
                    <p><strong>Applied On:</strong> ${app.date}</p>
                </div>
                
                ${app.documents && app.documents.length > 0 ? `
                <div class="detail-group">
                    <h4>Submitted Documents (${app.documents.length})</h4>
                    <div class="document-viewer" id="documentsContainer">
                        ${renderDocuments(app.documents)}
                    </div>
                </div>
                ` : `
                <div class="detail-group">
                    <h4>Submitted Documents</h4>
                    <div class="no-documents">
                        <i class="fas fa-folder-open"></i>
                        <p>No documents were submitted</p>
                    </div>
                </div>
                `}
                
                ${app.message ? `
                <div class="detail-group">
                    <h4>Additional Message</h4>
                    <div class="message-box">
                        <p>${app.message}</p>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        // Add event listeners to document buttons
        setTimeout(() => {
            document.querySelectorAll('.document-btn.view').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const docName = e.target.closest('.document-item').dataset.docName;
                    const doc = app.documents.find(d => d.name === docName);
                    if (doc) {
                        viewDocument(doc);
                    }
                });
            });
            
            document.querySelectorAll('.document-btn.download').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const docName = e.target.closest('.document-item').dataset.docName;
                    const doc = app.documents.find(d => d.name === docName);
                    if (doc) {
                        downloadDocument(doc);
                    }
                });
            });
        }, 100);
        
        // Update modal footer buttons
        const statusBtn = document.querySelector('.status-btn');
        const deleteBtn = document.querySelector('.delete-btn');
        
        statusBtn.textContent = app.status === 'pending' ? 
            'Mark as Reviewed' : 'Mark as Pending';
        statusBtn.className = `btn status-btn ${app.status === 'pending' ? 'reviewed' : 'pending'}`;
        statusBtn.innerHTML = app.status === 'pending' ? 
            '<i class="fas fa-check"></i> Mark as Reviewed' : 
            '<i class="fas fa-clock"></i> Mark as Pending';
        
        // Add event listeners to modal buttons
        statusBtn.onclick = () => updateApplicationStatus(id);
        deleteBtn.onclick = () => deleteApplication(id);
        
        applicationModal.style.display = 'flex';
    }
    
    // Render documents list
    function renderDocuments(documents) {
        let html = '';
        documents.forEach(doc => {
            const fileExt = doc.name.split('.').pop().toLowerCase();
            let iconClass = 'generic';
            if (fileExt === 'pdf') iconClass = 'pdf';
            else if (['doc', 'docx'].includes(fileExt)) iconClass = 'doc';
            else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) iconClass = 'image';
            else if (fileExt === 'txt') iconClass = 'txt';
            
            html += `
                <div class="document-item" data-doc-name="${doc.name}">
                    <div class="document-info">
                        <div class="document-icon ${iconClass}">
                            <i class="${getFileIcon(doc.name)}"></i>
                        </div>
                        <div class="document-details">
                            <h4>${doc.name}</h4>
                            <p>${doc.category === 'resume' ? 'Resume' : 
                                 doc.category === 'coverLetter' ? 'Cover Letter' : 'Additional Document'} • ${formatFileSize(doc.size)}</p>
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="document-btn view" title="View document">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="document-btn download" title="Download document">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            `;
        });
        return html;
    }
    
    // View document
    function viewDocument(doc) {
        currentDocument = doc;
        documentModalTitle.textContent = doc.name;
        
        // Clear previous content
        documentViewer.innerHTML = '';
        
        // Handle different file types
        if (doc.type === 'application/pdf' || doc.name.toLowerCase().endsWith('.pdf')) {
            // PDF viewer
            const iframe = document.createElement('iframe');
            iframe.className = 'document-iframe';
            iframe.src = doc.data;
            documentViewer.appendChild(iframe);
        } else if (doc.type.startsWith('image/')) {
            // Image viewer
            const img = document.createElement('img');
            img.className = 'image-viewer';
            img.src = doc.data;
            img.alt = doc.name;
            documentViewer.appendChild(img);
        } else if (doc.type === 'text/plain' || doc.name.toLowerCase().endsWith('.txt')) {
            // Text viewer
            const textContainer = document.createElement('div');
            textContainer.style.whiteSpace = 'pre-wrap';
            textContainer.style.fontFamily = 'monospace';
            textContainer.style.padding = '20px';
            textContainer.style.backgroundColor = '#f8f9fa';
            textContainer.style.borderRadius = '8px';
            
            // Decode base64 text
            try {
                const base64Data = doc.data.split(',')[1];
                const text = atob(base64Data);
                textContainer.textContent = text;
            } catch (error) {
                textContainer.textContent = 'Unable to display file content. Please download the file.';
            }
            documentViewer.appendChild(textContainer);
        } else {
            // Unsupported file type
            const message = document.createElement('div');
            message.className = 'no-documents';
            message.innerHTML = `
                <i class="fas fa-file"></i>
                <h3>Preview not available</h3>
                <p>This file type cannot be previewed in the browser.</p>
                <p>Please download the file to view it.</p>
            `;
            documentViewer.appendChild(message);
        }
        
        documentModal.style.display = 'block';
    }
    
    // Download document
    function downloadDocument(doc) {
        try {
            const link = document.createElement('a');
            link.href = doc.data;
            link.download = doc.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showSuccess(`Downloading ${doc.name}...`);
        } catch (error) {
            showError('Failed to download file. Please try again.');
        }
    }
    
    // Download current document from modal
    function downloadCurrentDocument() {
        if (currentDocument) {
            downloadDocument(currentDocument);
        }
    }
    
    // Update application status
    function updateApplicationStatus(id) {
        const appIndex = applications.findIndex(a => a.id === id);
        if (appIndex === -1) return;
        
        applications[appIndex].status = applications[appIndex].status === 'pending' ? 'reviewed' : 'pending';
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
        
        loadApplications();
        updateStats();
        showApplicationDetails(id);
    }
    
    // Delete application
    function deleteApplication(id) {
        if (confirm('Are you sure you want to delete this application?')) {
            applications = applications.filter(a => a.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
            
            loadApplications();
            updateStats();
            applicationModal.style.display = 'none';
            showSuccess('Application deleted successfully.');
        }
    }
    
    // Update statistics
    function updateStats() {
        const pending = applications.filter(app => app.status === 'pending').length;
        const reviewed = applications.filter(app => app.status === 'reviewed').length;
        const total = applications.length;
        
        pendingCount.textContent = pending;
        reviewedCount.textContent = reviewed;
        totalCount.textContent = total;
    }
}

// Utility functions
function showSuccess(message) {
    const successMessage = document.getElementById('successMessage');
    if (successMessage) {
        successMessage.querySelector('p').textContent = message;
        successMessage.style.display = 'flex';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.querySelector('p').textContent = message;
        errorMessage.style.display = 'flex';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any page-specific functionality
});