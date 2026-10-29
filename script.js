(() => {
  "use strict";
  const STORAGE_KEY = "nova-demo-leads-v1";
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

  // Demo lead capture: browser-local only. No data is sent to a server.
  const leadForm = $("#leadForm");
  const feedback = $("#formFeedback");
  leadForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!leadForm.reportValidity()) return;
    const formData = new FormData(leadForm);
    const lead = {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      service: String(formData.get("service") || "").trim(),
      budget: String(formData.get("budget") || "").trim(),
      message: String(formData.get("message") || "").trim()
    };
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(current)) throw new Error("Invalid stored data");
      current.push(lead);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      feedback.textContent = "Thanks! Demo enquiry saved in this browser. No email was sent.";
      leadForm.reset();
    } catch (error) {
      feedback.textContent = "This browser could not save the demo enquiry. Check storage settings and try again.";
      console.error("Demo lead save failed:", error);
    }
  });

  // Developer utility: export browser-local demo leads as CSV.
  // Open the site with ?admin=1 to reveal the export control.
  const params = new URLSearchParams(window.location.search);
  if (params.get("admin") === "1") {
    const exportButton = document.createElement("button");
    exportButton.type = "button";
    exportButton.className = "button";
    exportButton.textContent = "Export demo leads (CSV)";
    exportButton.style.cssText = "position:fixed;left:12px;bottom:12px;z-index:50;background:#f0edff;color:#171125;font-size:11px";
    exportButton.addEventListener("click", () => {
      let leads;
      try { leads = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
      catch { leads = []; }
      if (!Array.isArray(leads) || leads.length === 0) {
        alert("No demo leads saved in this browser yet.");
        return;
      }
      const columns = ["createdAt", "name", "email", "service", "budget", "message"];
      const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const csv = [columns.join(","), ...leads.map(lead => columns.map(key => quote(lead[key])).join(","))].join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nova-demo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
    document.body.appendChild(exportButton);
  }

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
      return "Great place to start! Use the project enquiry form on this page to share your name, email, service, and a few details. This portfolio demo saves the enquiry only in your browser; it doesn't send it to a real team.";
    }
    if (/(ai|chatbot|artificial intelligence|automation)/.test(text)) {
      return "We can prototype practical AI experiences such as FAQ assistants, document search, and workflow automation. This particular chat is a scripted demo with no connected AI model, so it works without API costs.";
    }
    if (/(hello|hi|hey|good morning|good afternoon)/.test(text)) {
      return "Hey! 👋 Happy to help. Ask about services, project pricing, timelines, or how to get started.";
    }
    if (/(human|person|team|email|phone|address)/.test(text)) {
      return "This is a fictional portfolio studio, so no real team contact details are configured. Use the enquiry form to test the lead-capture flow, or customize the site with your real contact details before publishing.";
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
