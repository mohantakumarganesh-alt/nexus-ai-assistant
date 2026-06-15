const STYLES = {
    question: [
        { id: 'concise', label: 'Concise Answer' },
        { id: 'detailed', label: 'Detailed Explanation' },
        { id: 'eli5', label: 'Explain Like I\'m 5' }
    ],
    summarize: [
        { id: 'bullet', label: 'Bullet Points' },
        { id: 'sentence', label: 'One Sentence' },
        { id: 'executive', label: 'Executive Summary' }
    ],
    creative: [
        { id: 'story', label: 'Short Story' },
        { id: 'poem', label: 'Rhyming Poem' },
        { id: 'humorous', label: 'Humorous Take' }
    ]
};

const FUNCTION_DESCRIPTIONS = {
    question: "Ask any factual question and get an instant answer.",
    summarize: "Paste a long text or article to get a quick summary.",
    creative: "Provide a topic and let the AI generate creative content."
};

let currentFunction = 'question';
let currentStyle = 'concise';
let chatHistory = [];
let abortController = null;

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const styleOptionsContainer = document.getElementById('style-options');
const currentFunctionTitle = document.getElementById('current-function-title');
const currentFunctionDesc = document.getElementById('current-function-desc');
const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const clearChatBtn = document.getElementById('clear-chat-btn');
const exportChatBtn = document.getElementById('export-chat-btn');

// Initialize
function init() {
    updateStyles();
    setupEventListeners();
    loadHistory();
}

function saveHistory() {
    localStorage.setItem('nexus_chat_history', JSON.stringify(chatHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('nexus_chat_history');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Clear welcome message
                chatArea.innerHTML = '';
                chatHistory = parsed;
                // Re-render history
                chatHistory.forEach(msg => {
                    addMessage(msg.text, msg.role === 'user', true);
                });
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }
}

function clearChat() {
    if (abortController) {
        abortController.abort();
    }
    chatHistory = [];
    localStorage.removeItem('nexus_chat_history');
    chatArea.innerHTML = `
        <div class="welcome-message">
            <i class="fa-solid fa-sparkles"></i>
            <p>Hello! I'm Nexus, your AI Assistant. Select a function and enter your prompt below.</p>
        </div>
    `;
}

function exportChat() {
    if (chatHistory.length === 0) {
        alert("Your chat is empty! Say hello to Nexus AI first to start a conversation.");
        return;
    }
    
    let exportText = "Nexus AI - Chat Export\n=====================\n\n";
    chatHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'You' : 'Nexus AI';
        exportText += `[${role}]:\n${msg.text}\n\n---------------------\n\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_chat_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateStyles() {
    styleOptionsContainer.innerHTML = '';
    const styles = STYLES[currentFunction];
    
    styles.forEach((style, index) => {
        const btn = document.createElement('button');
        btn.className = `style-btn ${index === 0 ? 'active' : ''}`;
        btn.dataset.style = style.id;
        btn.textContent = style.label;
        
        btn.addEventListener('click', () => {
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (currentStyle !== style.id) {
                currentStyle = style.id;
            }
        });
        
        styleOptionsContainer.appendChild(btn);
    });
    
    currentStyle = styles[0].id;
}

function setupEventListeners() {
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentFunction === btn.dataset.func) return;
            
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentFunction = btn.dataset.func;
            currentFunctionTitle.textContent = btn.textContent.trim();
            currentFunctionDesc.textContent = FUNCTION_DESCRIPTIONS[currentFunction];
            
            updateStyles();
        });
    });

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // Auto-expand textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') {
            this.style.height = 'auto';
        }
    });
    
    clearChatBtn.addEventListener('click', clearChat);
    exportChatBtn.addEventListener('click', exportChat);
    
    // Voice Input Setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        let isRecording = false;
        
        micBtn.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
        
        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.add('recording');
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value += (userInput.value ? ' ' : '') + transcript;
            // trigger auto-resize
            userInput.dispatchEvent(new Event('input'));
        };
        
        recognition.onend = () => {
            isRecording = false;
            micBtn.classList.remove('recording');
        };
        
        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            isRecording = false;
            micBtn.classList.remove('recording');
        };
    } else {
        micBtn.style.display = 'none'; // Hide if not supported
    }
}

function copyTextToClipboard(text, btnElement, iconOnly = false) {
    navigator.clipboard.writeText(text).then(() => {
        const originalHtml = btnElement.innerHTML;
        btnElement.innerHTML = iconOnly ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
            btnElement.innerHTML = originalHtml;
        }, 2000);
    });
}

function addMessage(text, isUser = false, isHistoryLoad = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-msg' : 'ai-msg'}`;
    
    if (isUser) {
        msgDiv.innerText = text;
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'msg-actions';
        
        // Add Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-icon-btn';
        copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i>';
        copyBtn.title = "Copy Question";
        copyBtn.addEventListener('click', () => {
            copyTextToClipboard(text, copyBtn, true);
        });
        
        // Add Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'action-icon-btn';
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
        editBtn.title = "Edit & Resubmit";
        
        editBtn.addEventListener('click', () => {
            // Find all message divs (ignoring welcome and typing indicators)
            const allMessages = Array.from(chatArea.querySelectorAll('.message:not(.typing-indicator)'));
            const msgIndex = allMessages.indexOf(msgDiv);
            
            if (msgIndex !== -1) {
                // Remove this message and all subsequent messages from DOM
                for (let i = allMessages.length - 1; i >= msgIndex; i--) {
                    allMessages[i].remove();
                }
                
                // Remove from history and save
                chatHistory = chatHistory.slice(0, msgIndex);
                saveHistory();
                
                // Populate input box
                userInput.value = text;
                userInput.dispatchEvent(new Event('input')); // trigger auto-resize
                userInput.focus();
            }
        });
        
        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(editBtn);
        msgDiv.appendChild(actionsDiv);
        
    } else {
        // Parse markdown using marked.js
        msgDiv.innerHTML = marked.parse(text);
        
        // Apply highlight.js and add copy buttons to code blocks
        msgDiv.querySelectorAll('pre').forEach((pre) => {
            const codeBlock = pre.querySelector('code');
            if (codeBlock) {
                hljs.highlightElement(codeBlock);
                
                // Add copy button
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-block-btn';
                copyBtn.innerHTML = '<i class="fa-regular fa-copy"></i> Copy';
                copyBtn.addEventListener('click', () => {
                    copyTextToClipboard(codeBlock.innerText, copyBtn);
                });
                pre.appendChild(copyBtn);
            }
        });
    }
    
    chatArea.appendChild(msgDiv);
    if (!isHistoryLoad) {
        chatArea.scrollTop = chatArea.scrollHeight;
    }
    return msgDiv;
}

function addLoadingIndicator() {
    const loaderDiv = document.createElement('div');
    loaderDiv.className = 'message ai-msg typing-indicator';
    loaderDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    chatArea.appendChild(loaderDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
    return loaderDiv;
}

function addFeedbackUI(msgDiv, aiResponse, originalInput) {
    const feedbackBox = document.createElement('div');
    feedbackBox.className = 'feedback-box';
    feedbackBox.innerHTML = `
        <button class="feedback-btn copy"><i class="fa-regular fa-copy"></i> Copy</button>
        <span style="margin-left:auto;">Helpful?</span>
        <button class="feedback-btn yes" data-helpful="true"><i class="fa-solid fa-thumbs-up"></i></button>
        <button class="feedback-btn no" data-helpful="false"><i class="fa-solid fa-thumbs-down"></i></button>
    `;
    
    msgDiv.appendChild(feedbackBox);
    
    // Copy response
    const copyBtn = feedbackBox.querySelector('.copy');
    copyBtn.addEventListener('click', () => {
        copyTextToClipboard(aiResponse, copyBtn);
    });
    
    const btns = feedbackBox.querySelectorAll('.yes, .no');
    btns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const isHelpful = btn.dataset.helpful === 'true';
            
            // UI feedback
            btn.parentElement.innerHTML = `<span><i class="fa-solid fa-check" style="color: #10b981;"></i> Feedback recorded</span>`;
            
            // Send to backend
            try {
                await fetch('/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        helpful: isHelpful,
                        function: currentFunction,
                        style: currentStyle,
                        input: originalInput,
                        response: aiResponse
                    })
                });
            } catch (err) {
                console.error("Failed to submit feedback", err);
            }
        });
    });
}

async function handleSend() {
    // If currently loading, act as a Stop button
    if (abortController) {
        abortController.abort();
        return;
    }

    const text = userInput.value.trim();
    if (!text) return;

    // Remove welcome message if it exists
    const welcome = document.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    userInput.value = '';
    userInput.style.height = 'auto'; // reset height after send
    
    addMessage(text, true);
    const loader = addLoadingIndicator();
    
    // Setup for stop logic
    abortController = new AbortController();
    sendBtn.classList.add('stop');
    sendBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: currentFunction,
                style: currentStyle,
                input: text,
                history: chatHistory
            }),
            signal: abortController.signal
        });

        const data = await response.json();
        loader.remove();

        if (response.ok) {
            chatHistory.push({ role: 'user', text: text });
            chatHistory.push({ role: 'model', text: data.response });
            saveHistory();
            
            const aiMsgDiv = addMessage(data.response, false);
            
            // Add provider badge
            if (data.provider && data.provider !== 'None') {
                const providerBadge = document.createElement('div');
                providerBadge.className = 'provider-badge';
                providerBadge.innerHTML = `<i class="fa-solid fa-bolt"></i> Answered by ${data.provider}`;
                aiMsgDiv.appendChild(providerBadge);
            }
            
            addFeedbackUI(aiMsgDiv, data.response, text);
        } else {
            addMessage(`Error: ${data.error}`, false);
        }
    } catch (err) {
        loader.remove();
        if (err.name === 'AbortError') {
            addMessage(`*Generation stopped by user.*`, false);
        } else {
            addMessage(`Connection error: ${err.message}`, false);
        }
    } finally {
        // Reset button
        abortController = null;
        sendBtn.classList.remove('stop');
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
    }
}

// Start
init();
