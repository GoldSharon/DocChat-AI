document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const uploadStatus = document.getElementById('uploadStatus');
    const processBtn = document.getElementById('processBtn');
    const processStatus = document.getElementById('processStatus');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatMessages = document.getElementById('chatMessages');
    const clearChatBtn = document.getElementById('clearChat');

    // Selected files store
    let selectedFiles = [];

    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        updateFileList();
    });

    // Update file list display
    function updateFileList() {
        fileList.innerHTML = '';
        selectedFiles = Array.from(fileInput.files);
        
        if (selectedFiles.length === 0) {
            return;
        }
        
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // Determine file icon based on extension
            const extension = file.name.split('.').pop().toLowerCase();
            let iconClass = 'fa-file';
            
            if (['pdf'].includes(extension)) {
                iconClass = 'fa-file-pdf';
            } else if (['doc', 'docx'].includes(extension)) {
                iconClass = 'fa-file-word';
            } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
                iconClass = 'fa-file-excel';
            } else if (['txt', 'md'].includes(extension)) {
                iconClass = 'fa-file-alt';
            }
            
            fileItem.innerHTML = `
                <i class="fas ${iconClass}"></i>
                <span class="file-name" title="${file.name}">${file.name}</span>
                <i class="fas fa-times remove-file" data-index="${index}"></i>
            `;
            
            fileList.appendChild(fileItem);
        });
        
        // Add remove file functionality
        document.querySelectorAll('.remove-file').forEach(btn => {
            btn.addEventListener('click', function() {
                // Since we can't modify the FileList directly, we reset the input
                // and manually add back all files except the one to remove
                fileInput.value = '';
                selectedFiles.splice(parseInt(btn.dataset.index), 1);
                
                if (selectedFiles.length > 0) {
                    // Create a new DataTransfer object to build a new FileList
                    const dataTransfer = new DataTransfer();
                    selectedFiles.forEach(file => dataTransfer.items.add(file));
                    fileInput.files = dataTransfer.files;
                }
                
                updateFileList();
            });
        });
    }

    // Upload files
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (fileInput.files.length === 0) {
            showStatus(uploadStatus, 'Please select at least one file', 'error');
            return;
        }
        
        const formData = new FormData();
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('files', fileInput.files[i]);
        }
        
        try {
            showStatus(uploadStatus, 'Uploading files...', 'info');
            
            const response = await fetch('/upload/', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showStatus(uploadStatus, data.message || 'Files uploaded successfully!', 'success');
                // Reset file input after successful upload
                fileInput.value = '';
                updateFileList();
            } else {
                showStatus(uploadStatus, data.error || 'Upload failed', 'error');
            }
        } catch (error) {
            showStatus(uploadStatus, 'Error uploading files: ' + error.message, 'error');
        }
    });

    // Process documents
    processBtn.addEventListener('click', async function() {
        try {
            showStatus(processStatus, 'Processing documents... This may take a while', 'info');
            
            const response = await fetch('/process/', {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showStatus(processStatus, data.message || 'Documents processed successfully!', 'success');
                // Add a system message about successful processing
                addBotMessage('Your documents have been processed! You can now ask questions about them.');
            } else {
                showStatus(processStatus, data.error || 'Processing failed', 'error');
            }
        } catch (error) {
            showStatus(processStatus, 'Error processing documents: ' + error.message, 'error');
        }
    });

    // Auto-resize textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Send message function
    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        addUserMessage(message);
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot-message';
        typingIndicator.id = 'typingIndicator';
        typingIndicator.innerHTML = `
            <i class="fas fa-robot bot-icon"></i>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Send to server
        fetch('/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            const indicator = document.getElementById('typingIndicator');
            if (indicator) {
                indicator.remove();
            }
            
            if (data.error) {
                addBotMessage(data.error);
            } else {
                addBotMessage(data.response);
            }
        })
        .catch(error => {
            const indicator = document.getElementById('typingIndicator');
            if (indicator) {
                indicator.remove();
            }
            addBotMessage('Error connecting to the server. Please try again later.');
        });
    }

    // Send message on button click or Enter key
    sendBtn.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keydown', function(e) {
        // Send on Enter without Shift
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Clear chat
    clearChatBtn.addEventListener('click', function() {
        chatMessages.innerHTML = '';
        // Add welcome message
        addBotMessage('Hello! I\'m your document assistant. Upload and process your documents, then ask me anything about them.');
    });

    // Helper function to add user message
    function addUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message user-message';
        messageElement.innerHTML = `
            <div class="message-content">${formatMessageText(text)}</div>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Helper function to add bot message
    function addBotMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message bot-message';
        messageElement.innerHTML = `
            <i class="fas fa-robot bot-icon"></i>
            <div class="message-content">${formatMessageText(text)}</div>
        `;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Helper function to format message text (handle code blocks, line breaks)
    function formatMessageText(text) {
        // Handling basic markdown-style code blocks
        if (text.includes("```")) {
            let formattedText = '';
            const blocks = text.split(/```(?:\w+)?/);
            
            for (let i = 0; i < blocks.length; i++) {
                if (i % 2 === 0) {
                    // Regular text - handle line breaks and escape HTML
                    formattedText += `<p>${escapeHtml(blocks[i]).replace(/\n/g, '<br>')}</p>`;
                } else {
                    // Code block
                    formattedText += `<pre><code>${escapeHtml(blocks[i])}</code></pre>`;
                }
            }
            return formattedText;
        } else {
            // Regular text with line breaks
            return `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
        }
    }

    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Helper function to show status messages
    function showStatus(element, message, type) {
        element.innerHTML = '';
        const statusElement = document.createElement('div');
        statusElement.className = `status-message ${type}`;
        statusElement.textContent = message;
        element.appendChild(statusElement);
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusElement.style.opacity = '0';
                setTimeout(() => {
                    if (element.contains(statusElement)) {
                        element.removeChild(statusElement);
                    }
                }, 300);
            }, 5000);
        }
    }

    // Enable drag and drop file uploads
    const dropZone = document.querySelector('.file-input-wrapper');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.querySelector('label').classList.add('highlight');
    }
    
    function unhighlight() {
        dropZone.querySelector('label').classList.remove('highlight');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        // Update file input with dropped files
        if (files.length > 0) {
            fileInput.files = files;
            updateFileList();
        }
    }

    // Add highlight style for drag and drop
    const style = document.createElement('style');
    style.textContent = `
        input[type="file"] + label.highlight {
            border-color: var(--primary-color);
            background-color: rgba(59, 130, 246, 0.05);
            transform: scale(1.02);
        }
    `;
    document.head.appendChild(style);
    
    // Add animation for processing state
    function addProcessingAnimation() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-border {
                0% { border-color: var(--primary-color); }
                50% { border-color: var(--secondary-color); }
                100% { border-color: var(--primary-color); }
            }
            
            .processing {
                animation: pulse-border 2s infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Init function
    function init() {
        // Add processing animation styles
        addProcessingAnimation();
        
        // Focus the input on initial load
        setTimeout(() => {
            userInput.focus();
        }, 500);
        
        // Add event listener for window resize to adjust UI as needed
        window.addEventListener('resize', handleResize);
        
        // Initial resize handling
        handleResize();
        
        // Check if files exist in session
        checkExistingFiles();
    }
    
    // Handle window resize
    function handleResize() {
        // On mobile, adjust the height of the chat container
        if (window.innerWidth <= 768) {
            const header = document.querySelector('header');
            const sidebar = document.querySelector('.sidebar');
            const footer = document.querySelector('footer');
            const chatSection = document.querySelector('.chat-section');
            
            const availableHeight = window.innerHeight - 
                                    header.offsetHeight - 
                                    sidebar.offsetHeight -
                                    footer.offsetHeight - 
                                    40; // padding
            
            chatSection.style.height = `${Math.max(400, availableHeight)}px`;
        } else {
            // On desktop, use default sizing
            document.querySelector('.chat-section').style.height = '';
        }
    }
    
    // Check if there are existing files stored in session
    function checkExistingFiles() {
        fetch('/check-files/', {
            method: 'GET'
        })
        .then(response => response.json())
        .then(data => {
            if (data.hasFiles) {
                // Notify user that there are existing files
                showStatus(uploadStatus, 'You have files already uploaded. You can proceed to processing.', 'info');
            }
            
            if (data.isProcessed) {
                // Notify user that files are already processed
                showStatus(processStatus, 'Your documents are already processed. You can start chatting!', 'success');
                addBotMessage('Your documents have been processed! You can now ask questions about them.');
            }
        })
        .catch(error => {
            console.error('Error checking existing files:', error);
        });
    }
    
    // Initialize the app
    init();
});