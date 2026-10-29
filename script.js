(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);

  // Mobile navigation
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");
  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
  navLinks.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }));

  $("#year").textContent = new Date().getFullYear();

  // ─── Enquiry form → Google Apps Script backend ────────────────────────
  const BACKEND_URL = "https://script.google.com/macros/s/AKfycbzHwd9TRqQAVbqOUzUWAYhg_-iP7zx-9gAHr2DEHsYf0F6_Xo3tUGlL9hWXZI2vqrzt/exec";
  const SUBMIT_TIMEOUT_MS = 20000;

  const leadForm = $("#leadForm");
  const feedback  = $("#formFeedback");
  const submitBtn = $("#submitBtn");
  const formTarget = $("#formTarget");

  // Generate a token matching ^[a-f0-9-]{20,80}$
  function generateToken() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID(); // e.g. "550e8400-e29b-41d4-a716-446655440000"
    }
    // Fallback: build a UUID-v4-shaped hex string
    const hex = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
    return [hex() + hex(), hex(), hex(), hex(), hex() + hex() + hex()].join("-");
  }

  let pendingToken = null;
  let timeoutId = null;

  function setSubmitting(busy) {
    submitBtn.disabled = busy;
    submitBtn.innerHTML = busy
      ? '<span class="spinner" aria-hidden="true"></span> Sending\u2026'
      : 'Send enquiry <span aria-hidden="true">\u2197</span>';
  }

  function showFeedback(text, isError) {
    feedback.textContent = text;
    feedback.style.color = isError ? "#ff9e9e" : "#a8f0cf";
  }

  function clearPending() {
    pendingToken = null;
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    setSubmitting(false);
  }

  // Listen for postMessage responses from the hidden iframe.
  //
  // Origin-validation tradeoff: Google Apps Script redirects the response
  // through varying Google origins (e.g. script.googleusercontent.com) and
  // the cross-origin redirect can break event.source === iframe.contentWindow
  // comparisons in some browsers.  A strict origin allow-list is equally
  // unreliable because the redirect target changes without notice.
  //
  // Security model used instead:
  //   1. event.data.type must be the exact string "portfolio-enquiry-result"
  //   2. event.data.token must match the random UUID we generated for this
  //      submission (36 hex+dash chars, known only to our JS and the backend)
  //   3. event.data.ok must be boolean, event.data.message must be string
  //
  // An attacker would need to guess the per-submission UUID AND post a
  // message with the correct type in the brief window while a submission
  // is pending.  This is the strongest practical validation supported by
  // the Apps Script redirect flow.
  window.addEventListener("message", function onBackendMessage(event) {
    // No pending submission — ignore all messages
    if (!pendingToken) return;

    var data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type !== "portfolio-enquiry-result") return;
    if (typeof data.token !== "string" || typeof data.ok !== "boolean" || typeof data.message !== "string") return;

    // Must match the currently pending submission
    if (data.token !== pendingToken) return;

    clearPending();

    if (data.ok) {
      showFeedback(data.message || "Thanks! Your enquiry has been sent.", false);
      leadForm.reset();
    } else {
      showFeedback(data.message || "The server could not process your enquiry. Please try again.", true);
    }
  });

  // Track the transient POST form so we can clean it up later
  var activePostForm = null;

  function cleanupPostForm() {
    if (activePostForm && activePostForm.parentNode) {
      activePostForm.remove();
    }
    activePostForm = null;
  }

  // Wrap clearPending to also clean up the transient form
  var _clearPending = clearPending;
  clearPending = function () {
    cleanupPostForm();
    _clearPending();
  };

  // Fallback: if the iframe loads the response but postMessage never
  // arrives (e.g. the backend HTML doesn't execute its script, or
  // the browser blocks it), treat the load as a probable success
  // after a short grace period for the postMessage to arrive.
  formTarget.addEventListener("load", function onIframeLoad() {
    if (!pendingToken) return;
    var tokenAtLoad = pendingToken;
    // Give postMessage 3 seconds to arrive after iframe load
    setTimeout(function () {
      if (pendingToken === tokenAtLoad) {
        clearPending();
        showFeedback("Your enquiry has been sent. We\u2019ll be in touch soon!", false);
        leadForm.reset();
      }
    }, 3000);
  });

  leadForm.addEventListener("submit", function onSubmit(event) {
    event.preventDefault();

    // Block duplicate submissions while one is in-flight
    if (pendingToken) return;

    if (!leadForm.reportValidity()) return;

    // Generate token and inject it
    var token = generateToken();
    pendingToken = token;

    // Build a real <form> POST to the hidden iframe.
    // We create a transient form so we don't modify the visible form's action/target.
    cleanupPostForm();
    var postForm = document.createElement("form");
    postForm.method = "POST";
    postForm.action = BACKEND_URL;
    postForm.target = "formTarget";
    postForm.style.display = "none";

    var fields = {
      name:    String(leadForm.elements.name.value    || "").trim(),
      email:   String(leadForm.elements.email.value   || "").trim(),
      service: String(leadForm.elements.service.value || "").trim(),
      budget:  String(leadForm.elements.budget.value  || "").trim(),
      message: String(leadForm.elements.message.value || "").trim(),
      token:   token,
      website: ""  // honeypot — must stay empty
    };

    for (var key in fields) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = fields[key];
      postForm.appendChild(input);
    }

    setSubmitting(true);
    feedback.textContent = "";
    showFeedback("", false);

    document.body.appendChild(postForm);
    activePostForm = postForm;
    postForm.submit();
    // Keep the form in the DOM until the iframe finishes loading.
    // Removing it immediately can cancel the navigation in some browsers.

    // Timeout: if we don't hear back, let the visitor retry
    timeoutId = setTimeout(function () {
      if (pendingToken === token) {
        clearPending();
        showFeedback("The request timed out. Please check your connection and try again.", true);
      }
    }, SUBMIT_TIMEOUT_MS);
  });

  // Scripted chatbot: deterministic responses, no API key and no external service.
  const launcher = $("#chatLauncher");
  const panel = $("#chatPanel");
  const closeButton = $("#chatClose");
  const chatMessages = $("#chatMessages");
  const chatForm = $("#chatForm");
  const chatInput = $("#chatInput");
  const quickPrompts = $("#quickPrompts");

  const openChat = () => {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    launcher.setAttribute("aria-expanded", "true");
    chatInput.focus();
  };
  const closeChat = () => {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  };
  launcher.addEventListener("click", () => panel.classList.contains("is-open") ? closeChat() : openChat());
  closeButton.addEventListener("click", closeChat);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && panel.classList.contains("is-open")) closeChat();
  });

  function addMessage(text, who) {
    const message = document.createElement("div");
    message.className = `message ${who === "user" ? "message-user" : "message-bot"}`;
    message.textContent = text;
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function answerFor(input) {
    const text = input.toLowerCase();
    if (/(price|pricing|cost|budget|how much|rate)/.test(text)) {
      return "Project pricing depends on the scope, features, and timeline. A focused landing page is different from a custom web app. Share your goals through the project enquiry form and the team can prepare a tailored estimate.";
    }
    if (/(service|services|what do you do|offer|website|web app|app development)/.test(text)) {
      return "NOVA focuses on three areas:\n\n• Business websites and landing pages\n• Custom web apps, dashboards, and integrations\n• Practical AI experiences such as document assistants and chat workflows\n\nWhich one sounds closest to your project?";
    }
    if (/(time|timeline|long|deadline|how soon)/.test(text)) {
      return "Timelines depend on scope. A focused landing page may take days, while a custom application needs more discovery, development, and testing. We agree on milestones before work begins.";
    }
    if (/(start|contact|book|meeting|hire|talk|project|quote|estimate)/.test(text)) {
      return "Great place to start! Use the project enquiry form on this page to share your name, email, service, and a few details. Your enquiry will be sent directly to the team.";
    }
    if (/(ai|chatbot|artificial intelligence|automation)/.test(text)) {
      return "We can prototype practical AI experiences such as FAQ assistants, document search, and workflow automation. This particular chat is a scripted demo with no connected AI model, so it works without API costs.";
    }
    if (/(hello|hi|hey|good morning|good afternoon)/.test(text)) {
      return "Hey! 👋 Happy to help. Ask about services, project pricing, timelines, or how to get started.";
    }
    if (/(human|person|team|email|phone|address)/.test(text)) {
      return "This is a portfolio studio. Use the enquiry form to get in touch, or reach out through the contact details configured by the site owner.";
    }
    return "I can help with questions about services, project pricing, timelines, AI integrations, or getting started. Try one of the quick prompts below, or tell me a little more about your project.";
  }

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    addMessage(trimmed, "user");
    chatInput.value = "";
    quickPrompts.hidden = true;
    // Brief delay makes the interaction feel conversational without network requests.
    window.setTimeout(() => addMessage(answerFor(trimmed), "bot"), 220);
  }

  chatForm.addEventListener("submit", event => {
    event.preventDefault();
    sendMessage(chatInput.value);
  });
  quickPrompts.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => sendMessage(button.dataset.prompt || button.textContent));
  });
})();
