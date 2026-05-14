/* ==========================================
   Yousef Malak Ibrahim - AI Chatbot Widget
   ========================================== */

(function() {
    let API_BASE = window.CHATBOT_API_URL || '';
    
    // Relative API path since frontend is served by backend in production
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        API_BASE = 'http://localhost:3001/api/chat';
    } else {
        API_BASE = '/api/chat';
    }
    
    // Auto-detect GitHub Codespaces environments
    if (window.location.hostname.includes('github.dev')) {
        API_BASE = `https://${window.location.hostname.replace('-8080', '-3001')}/api/chat`;
    }

    const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);

    // State
    let isOpen = false;
    let isTyping = false;

    // Create stylesheet
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = window.CHATBOT_CSS_URL || '/chatbot/chatbot-widget.css';
    document.head.appendChild(styleLink);

    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'chatbot-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-robot"></i>';
    toggleBtn.title = 'Chat with AI Assistant';
    toggleBtn.addEventListener('click', toggleChat);
    document.body.appendChild(toggleBtn);

    // Create container
    const container = document.createElement('div');
    container.className = 'chatbot-container';
    container.innerHTML = `
        <div class="chatbot-header">
            <div class="chatbot-avatar"><i class="fas fa-brain"></i></div>
            <div class="chatbot-header-info">
                <h4>Yousef's AI Assistant</h4>
                <p>Ask about my experience, skills & projects</p>
            </div>
            <div class="chatbot-status">
                <span class="chatbot-status-dot"></span>
                Online
            </div>
            <button class="chatbot-close" title="Close"><i class="fas fa-times"></i></button>
        </div>
        <div class="chatbot-messages" id="chatMessages">
            <div class="chatbot-welcome">
                <span class="chatbot-welcome-icon">🤖</span>
                <h4>Hello! I'm Yousef's AI Assistant</h4>
                <p>I can answer questions about my CV, experience, projects, and skills.</p>
            </div>
        </div>
        <div class="chatbot-quick-actions" id="quickActions">
            <button class="chatbot-quick-action" data-msg="Tell me about your experience at Wider">Experience</button>
            <button class="chatbot-quick-action" data-msg="What are your top projects?">Projects</button>
            <button class="chatbot-quick-action" data-msg="What skills do you have?">Skills</button>
            <button class="chatbot-quick-action" data-msg="What is your education background?">Education</button>
            <button class="chatbot-quick-action" data-msg="What languages do you speak?">Languages</button>
            <button class="chatbot-quick-action" data-msg="Tell me about the Sadeed project">Sadeed</button>
        </div>
        <div class="chatbot-input">
            <input type="text" id="chatInput" placeholder="Ask me anything..." autocomplete="off">
            <button class="chatbot-send-btn" id="chatSend" title="Send">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;
    document.body.appendChild(container);

    // Elements
    const messagesEl = container.querySelector('#chatMessages');
    const inputEl = container.querySelector('#chatInput');
    const sendBtn = container.querySelector('#chatSend');
    const closeBtn = container.querySelector('.chatbot-close');
    const quickActions = container.querySelector('#quickActions');

    // Event listeners
    closeBtn.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', sendMessage);
    inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    quickActions.addEventListener('click', (e) => {
        const btn = e.target.closest('.chatbot-quick-action');
        if (btn) {
            inputEl.value = btn.dataset.msg;
            sendMessage();
        }
    });

    function toggleChat() {
        isOpen = !isOpen;
        container.classList.toggle('active', isOpen);
        toggleBtn.classList.toggle('active', isOpen);
        if (isOpen) {
            setTimeout(() => inputEl.focus(), 300);
        }
    }

    async function sendMessage() {
        const message = inputEl.value.trim();
        if (!message || isTyping) return;

        inputEl.value = '';
        addMessage(message, 'user');

        // Show typing indicator
        isTyping = true;
        showTyping();

        try {
            const response = await fetch(`${API_BASE}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, sessionId }),
            });

            if (!response.ok) throw new Error('API error');
            const data = await response.json();

            removeTyping();
            addMessage(data.response, 'bot', data.sources);
        } catch (error) {
            removeTyping();
            addMessage('Sorry, I encountered an error. Please make sure the backend is running and your OpenRouter API key is configured.', 'bot');
        } finally {
            isTyping = false;
        }
    }

    function addMessage(text, type, sources) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}`;

        const avatar = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

        let html = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-bubble">${formatMessage(text)}</div>
        `;

        if (sources && sources.length > 0) {
            html += `<div class="message-sources">Sources: ${sources.join(', ')}</div>`;
        }

        msgDiv.innerHTML = html;
        messagesEl.appendChild(msgDiv);
        scrollToBottom();
    }

    function showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar"><i class="fas fa-robot"></i></div>
            <div class="message-typing">
                <span></span><span></span><span></span>
            </div>
        `;
        messagesEl.appendChild(typingDiv);
        scrollToBottom();
    }

    function removeTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) typing.remove();
    }

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function formatMessage(text) {
        // Convert markdown-like syntax to HTML
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background:rgba(108,99,255,0.15);padding:2px 6px;border-radius:4px;font-size:0.85em;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    // Expose toggle function globally
    window.toggleChatbot = toggleChat;
})();