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

// DOM Elements
const navBtns = document.querySelectorAll('.nav-btn');
const styleOptionsContainer = document.getElementById('style-options');
const currentFunctionTitle = document.getElementById('current-function-title');
const currentFunctionDesc = document.getElementById('current-function-desc');
const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Initialize
function init() {
    updateStyles();
    setupEventListeners();
}

function clearChat() {
    chatHistory = [];
    chatArea.innerHTML = `
        <div class="welcome-message">
            <i class="fa-solid fa-sparkles"></i>
            <p>Hello! I'm Nexus, your AI Assistant. Select a function and enter your prompt below.</p>
        </div>
    `;
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
                clearChat();
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
            clearChat();
        });
    });

    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
}

function addMessage(text, isUser = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-msg' : 'ai-msg'}`;
    
    if (isUser) {
        msgDiv.textContent = text;
    } else {
        // Parse markdown using marked.js
        msgDiv.innerHTML = marked.parse(text);
    }
    
    chatArea.appendChild(msgDiv);
    chatArea.scrollTop = chatArea.scrollHeight;
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
        <span>Was this helpful?</span>
        <button class="feedback-btn yes" data-helpful="true"><i class="fa-solid fa-thumbs-up"></i> Yes</button>
        <button class="feedback-btn no" data-helpful="false"><i class="fa-solid fa-thumbs-down"></i> No</button>
    `;
    
    msgDiv.appendChild(feedbackBox);
    
    const btns = feedbackBox.querySelectorAll('.feedback-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const isHelpful = btn.dataset.helpful === 'true';
            
            // UI feedback
            feedbackBox.innerHTML = `<span><i class="fa-solid fa-check" style="color: #10b981;"></i> Thanks for your feedback!</span>`;
            
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
    const text = userInput.value.trim();
    if (!text) return;

    // Remove welcome message if it exists
    const welcome = document.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    userInput.value = '';
    addMessage(text, true);
    const loader = addLoadingIndicator();

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                function: currentFunction,
                style: currentStyle,
                input: text,
                history: chatHistory
            })
        });

        const data = await response.json();
        loader.remove();

        if (response.ok) {
            chatHistory.push({ role: 'user', text: text });
            chatHistory.push({ role: 'model', text: data.response });
            const aiMsgDiv = addMessage(data.response, false);
            addFeedbackUI(aiMsgDiv, data.response, text);
        } else {
            addMessage(`Error: ${data.error}`, false);
        }
    } catch (err) {
        loader.remove();
        addMessage(`Connection error: ${err.message}`, false);
    }
}

// Start
init();
