/* DPM Tech Group — website chat assistant
 * Talks to the Worker at POST /api/chat. Conversation is kept in memory only.
 */
(function () {
  'use strict';

  var GREETING = "Hi! I'm the DPM Tech Group assistant. Ask me about our architecture, cloud migration, DevOps or AI services.";
  var SUGGESTIONS = [
    'What services do you offer?',
    'Can you help migrate a mainframe app to AWS?',
    "What's David's background?"
  ];
  var history = [];           // [{ role, content }] sent to the API
  var busy = false;

  // ---------- build the widget ----------
  var root = document.createElement('div');
  root.className = 'chat';
  root.innerHTML =
    '<button class="chat-launcher" type="button" aria-expanded="false" aria-controls="chatPanel" aria-label="Open chat assistant">' +
      '<svg class="i-open" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="9" cy="10.5" r="1.2" fill="currentColor"/><circle cx="12" cy="10.5" r="1.2" fill="currentColor"/><circle cx="15" cy="10.5" r="1.2" fill="currentColor"/></svg>' +
      '<svg class="i-close" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' +
    '</button>' +
    '<section class="chat-panel" id="chatPanel" role="dialog" aria-label="DPM Tech Group assistant" hidden>' +
      '<header class="chat-head">' +
        '<div><strong>DPM <span>Tech</span> Group</strong><small>AI assistant &middot; usually instant</small></div>' +
        '<button class="chat-x" type="button" aria-label="Close chat">&times;</button>' +
      '</header>' +
      '<div class="chat-log" aria-live="polite"></div>' +
      '<div class="chat-suggest"></div>' +
      '<form class="chat-form">' +
        '<label class="sr-only" for="chatInput">Message</label>' +
        '<textarea id="chatInput" rows="1" maxlength="1000" placeholder="Type your question…" autocomplete="off"></textarea>' +
        '<button type="submit" aria-label="Send message">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor"/></svg>' +
        '</button>' +
      '</form>' +
      '<p class="chat-note">AI responses may be inaccurate. For proposals or pricing, email <a href="mailto:david.morris.it@gmail.com">david.morris.it@gmail.com</a>.</p>' +
    '</section>';
  document.body.appendChild(root);

  var launcher = root.querySelector('.chat-launcher');
  var panel = root.querySelector('.chat-panel');
  var log = root.querySelector('.chat-log');
  var suggest = root.querySelector('.chat-suggest');
  var form = root.querySelector('.chat-form');
  var input = root.querySelector('#chatInput');
  var sendBtn = form.querySelector('button');

  addBubble('assistant', GREETING);
  SUGGESTIONS.forEach(function (text) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.addEventListener('click', function () { send(text); });
    suggest.appendChild(b);
  });

  // ---------- open / close ----------
  function setOpen(open) {
    panel.hidden = !open;
    root.classList.toggle('open', open);
    launcher.setAttribute('aria-expanded', String(open));
    launcher.setAttribute('aria-label', open ? 'Close chat assistant' : 'Open chat assistant');
    if (open) input.focus(); else launcher.focus();
  }
  launcher.addEventListener('click', function () { setOpen(panel.hidden); });
  root.querySelector('.chat-x').addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden) setOpen(false);
  });

  // ---------- sending ----------
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    send(input.value);
  });
  input.addEventListener('keydown', function (e) {       // Enter sends, Shift+Enter = new line
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
  });
  input.addEventListener('input', autosize);

  function send(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    suggest.hidden = true;
    input.value = '';
    autosize();
    addBubble('user', text);
    history.push({ role: 'user', content: text });
    setBusy(true);
    var typing = addBubble('assistant', '', 'typing');

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-12) })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
          return data.reply;
        });
      })
      .then(function (reply) {
        typing.remove();
        addBubble('assistant', reply);
        history.push({ role: 'assistant', content: reply });
      })
      .catch(function (err) {
        typing.remove();
        history.pop();                       // let the visitor retry the same question
        addBubble('error', err.message || 'Network error. Please try again.');
      })
      .finally(function () { setBusy(false); input.focus(); });
  }

  // ---------- helpers ----------
  function addBubble(role, text, extra) {
    var div = document.createElement('div');
    div.className = 'msg msg-' + role + (extra ? ' ' + extra : '');
    if (extra === 'typing') {
      div.setAttribute('aria-label', 'Assistant is typing');
      div.innerHTML = '<span></span><span></span><span></span>';
    } else {
      div.textContent = text;              // textContent = no HTML injection
    }
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }
  function setBusy(b) { busy = b; sendBtn.disabled = b; }
  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
})();
