// Local storage key for applications (keep for backup/offline)
const STORAGE_KEY = 'applications';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Initialize applications array from localStorage as backup
let applications = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// API Base URL - change this to your Railway URL
const API_BASE_URL = 'https://lemonadecareers-production.up.railway.app';

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

// Application Form Submission - UPDATED TO SEND TO BACKEND
if (document.getElementById('applicationForm')) {
    const form = document.getElementById('applicationForm');
    
    // API Base URL - use relative URL since frontend and backend are on same domain
    const API_BASE_URL = ''; // Empty for same domain, or use full URL if needed
    
    setupFilePreviews();
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            // Create FormData object for file upload
            const formData = new FormData();
            
            // Add form fields (match your backend field names from server.js)
            formData.append('name', document.getElementById('fullName').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('phone', document.getElementById('phone').value);
            formData.append('position', document.getElementById('position').value);
            formData.append('cover_letter', document.getElementById('message').value);
            
            // Add files with correct field names for multer (from your server.js)
            const resumeInput = document.getElementById('resume');
            if (resumeInput.files[0]) {
                formData.append('resume', resumeInput.files[0]);
            }
            
            const coverLetterInput = document.getElementById('coverLetter');
            if (coverLetterInput.files[0]) {
                formData.append('cover_letter_file', coverLetterInput.files[0]);
            }
            
            const additionalDocsInput = document.getElementById('additionalDocs');
            if (additionalDocsInput.files.length > 0) {
                for (let i = 0; i < additionalDocsInput.files.length; i++) {
                    formData.append('additional_docs', additionalDocsInput.files[i]);
                }
            }
            
            // SEND TO BACKEND - THIS IS THE CRITICAL PART
            const response = await fetch('/api/applications', {
                method: 'POST',
                body: formData
                // Don't set Content-Type header - browser will set it with boundary
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to submit application');
            }
            
            const result = await response.json();
            
            // Optional: Save to localStorage as backup
            const backupData = {
                id: result.id,
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
                })
            };
            
            // Add to applications array and save to localStorage
            applications.push(backupData);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
            
            // Show success message
            showSuccess('Application submitted successfully!');
            
            // Reset form
            form.reset();
            document.querySelectorAll('.file-preview').forEach(preview => {
                preview.innerHTML = '';
            });
            
        } catch (error) {
            console.error('Submission error:', error);
            showError(error.message);
            
            // Fallback: Save locally if backend fails
            try {
                const fallbackData = {
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
                
                applications.push(fallbackData);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
                showSuccess('Application saved locally (offline mode)');
            } catch (fallbackError) {
                showError('Failed to save application');
            }
        }
    });
}
// Admin Dashboard Functionality - FETCH FROM BACKEND
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
    let applications = []; // Will be populated from backend
    
    // Load applications on page load
    loadApplicationsFromBackend();
    
    // Event Listeners
    if (searchInput) searchInput.addEventListener('input', filterApplications);
    if (statusFilter) statusFilter.addEventListener('change', filterApplications);
    if (positionFilter) positionFilter.addEventListener('change', filterApplications);
    if (refreshBtn) refreshBtn.addEventListener('click', loadApplicationsFromBackend);
    
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
    if (documentDownloadBtn) {
        documentDownloadBtn.addEventListener('click', downloadCurrentDocument);
    }
    
    // Load applications from backend
    async function loadApplicationsFromBackend() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications`);
            if (!response.ok) throw new Error('Failed to fetch applications');
            
            applications = await response.json();
            displayApplications(applications);
            updateStats();
        } catch (error) {
            console.error('Error loading applications:', error);
            // Fallback to localStorage
            applications = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
            displayApplications(applications);
            updateStats();
            showError('Using local backup - backend connection failed');
        }
    }
    
    // Display applications
    function displayApplications(apps) {
        if (!applicationsList) return;
        
        applicationsList.innerHTML = '';
        
        if (apps.length === 0) {
            applicationsList.innerHTML = `
                <div class="no-applications">
                    <i class="fas fa-inbox"></i>
                    <h3>No applications yet</h3>
                    <p>Applications submitted will appear here</p>
                </div>
            `;
            return;
        }
        
        apps.forEach(app => {
            const positionNames = {
                'developer': 'Software Developer',
                'designer': 'UI/UX Designer',
                'manager': 'Project Manager',
                'analyst': 'Business Analyst'
            };
            
            const applicationItem = document.createElement('div');
            applicationItem.className = 'application-item';
            applicationItem.setAttribute('data-id', app.id);
            
            const fileCount = app.files ? app.files.length : 0;
            
            applicationItem.innerHTML = `
                <div class="application-info">
                    <h3>${app.name}</h3>
                    <p>${positionNames[app.position] || app.position} • ${app.email}</p>
                    <p><small>Applied on: ${new Date(app.created_at).toLocaleDateString()} • ${fileCount} document${fileCount !== 1 ? 's' : ''}</small></p>
                </div>
                <div class="application-status status-${app.status || 'pending'}">
                    ${(app.status || 'pending').charAt(0).toUpperCase() + (app.status || 'pending').slice(1)}
                </div>
            `;
            
            applicationItem.addEventListener('click', () => showApplicationDetails(app.id));
            applicationsList.appendChild(applicationItem);
        });
        
        if (applicationsCount) {
            applicationsCount.textContent = `${apps.length} application${apps.length !== 1 ? 's' : ''}`;
        }
    }
    
    // Filter applications
    function filterApplications() {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        const statusValue = statusFilter ? statusFilter.value : 'all';
        const positionValue = positionFilter ? positionFilter.value : 'all';
        
        const filteredApplications = applications.filter(app => {
            const matchesSearch = (app.name || '').toLowerCase().includes(searchTerm) ||
                                  (app.email || '').toLowerCase().includes(searchTerm) ||
                                  (app.position || '').toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusValue === 'all' || (app.status || 'pending') === statusValue;
            const matchesPosition = positionValue === 'all' || app.position === positionValue;
            
            return matchesSearch && matchesStatus && matchesPosition;
        });
        
        displayApplications(filteredApplications);
    }
    
    // Add these functions to your admin dashboard section

    // Update application status
    async function updateApplicationStatus(id, newStatus) {
        try {
            const response = await fetch(`/api/applications/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus })
            });
            
            if (!response.ok) throw new Error('Failed to update status');
            
            const updatedApp = await response.json();
            showSuccess('Status updated successfully');
            loadApplicationsFromBackend(); // Reload the list
            return updatedApp;
        } catch (error) {
            console.error('Error updating status:', error);
            showError('Failed to update status');
        }
    }

    // Delete application
    async function deleteApplication(id) {
        if (!confirm('Are you sure you want to delete this application?')) return;
        
        try {
            const response = await fetch(`/api/applications/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete application');
            
            showSuccess('Application deleted successfully');
            loadApplicationsFromBackend(); // Reload the list
            applicationModal.style.display = 'none'; // Close modal if open
        } catch (error) {
            console.error('Error deleting application:', error);
            showError('Failed to delete application');
        }
    }
    
    // Show application details
    async function showApplicationDetails(id) {
        selectedApplicationId = id;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/applications/${id}`);
            if (!response.ok) throw new Error('Failed to fetch application details');
            
            const app = await response.json();
            
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
                        <p><strong>Full Name:</strong> ${app.name}</p>
                        <p><strong>Email:</strong> ${app.email}</p>
                        <p><strong>Phone:</strong> ${app.phone}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Application Details</h4>
                        <p><strong>Position:</strong> ${positionNames[app.position] || app.position}</p>
                        <p><strong>Status:</strong> <span class="application-status status-${app.status || 'pending'}">${(app.status || 'pending').charAt(0).toUpperCase() + (app.status || 'pending').slice(1)}</span></p>
                        <p><strong>Applied On:</strong> ${new Date(app.created_at).toLocaleString()}</p>
                    </div>
                    
                    ${app.files && app.files.length > 0 ? `
                    <div class="detail-group">
                        <h4>Submitted Documents (${app.files.length})</h4>
                        <div class="document-viewer" id="documentsContainer">
                            ${renderDocuments(app.files)}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${app.cover_letter ? `
                    <div class="detail-group">
                        <h4>Additional Message</h4>
                        <div class="message-box">
                            <p>${app.cover_letter}</p>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            
            // Add document event listeners
            setTimeout(() => {
                document.querySelectorAll('.document-btn.view').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const docId = e.target.closest('.document-item').dataset.docId;
                        const doc = app.files.find(f => f.id == docId);
                        if (doc) {
                            viewDocument(doc);
                        }
                    });
                });
                
                document.querySelectorAll('.document-btn.download').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const docId = e.target.closest('.document-item').dataset.docId;
                        const doc = app.files.find(f => f.id == docId);
                        if (doc) {
                            downloadDocument(doc);
                        }
                    });
                });
            }, 100);
            
            applicationModal.style.display = 'flex';
            
        } catch (error) {
            console.error('Error fetching application details:', error);
            showError('Failed to load application details');
        }
    }
    
    // Render documents list
    function renderDocuments(documents) {
        let html = '';
        documents.forEach(doc => {
            const fileExt = doc.file_name.split('.').pop().toLowerCase();
            let iconClass = 'generic';
            if (fileExt === 'pdf') iconClass = 'pdf';
            else if (['doc', 'docx'].includes(fileExt)) iconClass = 'doc';
            else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) iconClass = 'image';
            else if (fileExt === 'txt') iconClass = 'txt';
            
            html += `
                <div class="document-item" data-doc-id="${doc.id}">
                    <div class="document-info">
                        <div class="document-icon ${iconClass}">
                            <i class="${getFileIcon(doc.file_name)}"></i>
                        </div>
                        <div class="document-details">
                            <h4>${doc.file_name}</h4>
                            <p>${doc.category.replace('_', ' ')} • ${formatFileSize(doc.file_size)}</p>
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
        documentModalTitle.textContent = doc.file_name;
        
        documentViewer.innerHTML = '';
        
        const fileUrl = `${API_BASE_URL}/${doc.file_path}`;
        
        if (doc.file_type === 'application/pdf' || doc.file_name.toLowerCase().endsWith('.pdf')) {
            const iframe = document.createElement('iframe');
            iframe.className = 'document-iframe';
            iframe.src = fileUrl;
            documentViewer.appendChild(iframe);
        } else if (doc.file_type.startsWith('image/')) {
            const img = document.createElement('img');
            img.className = 'image-viewer';
            img.src = fileUrl;
            img.alt = doc.file_name;
            documentViewer.appendChild(img);
        } else {
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
        const fileUrl = `${API_BASE_URL}/${doc.file_path}`;
        window.open(fileUrl, '_blank');
    }
    
    // Download current document from modal
    function downloadCurrentDocument() {
        if (currentDocument) {
            downloadDocument(currentDocument);
        }
    }
    
    // Update statistics
    function updateStats() {
        if (!pendingCount || !reviewedCount || !totalCount) return;
        
        const pending = applications.filter(app => (app.status || 'pending') === 'pending').length;
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
        const msgEl = successMessage.querySelector('p');
        if (msgEl) msgEl.textContent = message;
        successMessage.style.display = 'flex';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 3000);
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        const msgEl = errorMessage.querySelector('p');
        if (msgEl) msgEl.textContent = message;
        errorMessage.style.display = 'flex';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application loaded, API URL:', API_BASE_URL);
});