const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const appSource = readFileSync(path.join(__dirname, "../js/app.js"), "utf8");

function createLogoutHarness({ logoutShouldFail = false } = {}) {
  let modalContainerContent = "";
  let appRootContent = "";
  const elements = new Map();
  const toasts = [];

  function getOrCreateElement(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        listeners: {},
        style: {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); },
          toggle(c) {
            if (this.classes.has(c)) this.classes.delete(c);
            else this.classes.add(c);
          }
        },
        querySelectorAll() {
          return [];
        },
        querySelector() {
          return null;
        },
        contains() {
          return false;
        },
        closest() {
          return null;
        },
        addEventListener(event, handler) {
          this.listeners[event] = handler;
        },
        click(event = {}) {
          if (this.listeners.click) {
            return this.listeners.click({ target: this, ...event });
          }
        }
      });
    }
    return elements.get(id);
  }

  const modalContainer = {
    id: "modal-container",
    get innerHTML() {
      return modalContainerContent;
    },
    set innerHTML(val) {
      modalContainerContent = val;
    }
  };

  const appRoot = {
    id: "app-root",
    get innerHTML() {
      return appRootContent;
    },
    set innerHTML(val) {
      appRootContent = val;
    }
  };

  const doc = {
    getElementById(id) {
      if (id === "modal-container") return modalContainer;
      if (id === "app-root") return appRoot;
      return getOrCreateElement(id);
    },
    querySelectorAll(selector) {
      return [];
    },
    createElement(tag) {
      return getOrCreateElement(`created-${tag}`);
    },
    body: {
      appendChild() {}
    },
    addEventListener() {}
  };

  let logoutCalled = 0;
  let chatbotAccountCleared = false;

  const mockAPI = {
    async logout() {
      logoutCalled += 1;
      if (logoutShouldFail) {
        throw new Error("Backend connection refused");
      }
      return true;
    },
    getCurrentUser() {
      return mockState.user;
    },
    getRooms() {
      return mockState.rooms;
    },
    getActiveRoomId() {
      return mockState.activeRoomId;
    },
    getSettings() {
      return { tempUnit: "celsius", defaultMode: "AUTO" };
    },
    getCachedAccountSetup() {
      return null;
    },
    getGoogleClientId() {
      return null;
    },
    _storeUser() {}
  };

  const mockState = {
    user: { id: "usr_divam_01", name: "Divam", email: "divam@breatheclean.io" },
    rooms: [{ id: "room_1", name: "Living Room" }],
    activeRoomId: "room_1",
    activeView: "dashboard",
    getActiveRoom() {
      return this.rooms[0] || null;
    },
    setActiveView(v) {
      this.activeView = v;
    }
  };

  const mockChatbot = {
    setAccount(acc) {
      if (acc === null) chatbotAccountCleared = true;
    }
  };

  const mockViews = {
    renderSignOutModal() {
      return `<div id="signout-modal-backdrop"><button id="btn-confirm-signout">Sign out</button><button id="btn-cancel-signout">Cancel</button></div>`;
    },
    renderAuth(mode) {
      return `<div class="auth-page" data-mode="${mode}">Sign In Form</div>`;
    },
    renderSidebar() {
      return `<button id="btn-sign-out-trigger">Sign out</button>`;
    },
    renderHeader() {
      return `<header></header>`;
    },
    renderFloatingAssistantWidget() {
      return `<div id="floating-assistant-wrapper"></div>`;
    }
  };

  const mockUtils = {
    showToast(msg, type) {
      toasts.push({ msg, type });
    },
    escapeHtml(str) {
      return String(str || "");
    },
    icons: { logout: "<span>logout-icon</span>" }
  };

  const win = {
    location: { hash: "#dashboard" },
    addEventListener() {},
    setInterval() { return 1; }
  };

  const context = {
    window: win,
    document: doc,
    API: mockAPI,
    State: mockState,
    Chatbot: mockChatbot,
    Views: mockViews,
    Utils: mockUtils,
    console
  };

  vm.createContext(context);
  vm.runInContext(appSource, context);
  const App = vm.runInContext("App", context);

  return {
    App,
    context,
    doc,
    elements,
    modalContainer,
    appRoot,
    mockState,
    toasts,
    getLogoutCalled: () => logoutCalled,
    isChatbotCleared: () => chatbotAccountCleared
  };
}

test("sidebar sign-out button triggers sign-out modal", () => {
  const harness = createLogoutHarness();
  harness.App.attachGlobalShellEvents();

  const signOutBtn = harness.doc.getElementById("btn-sign-out-trigger");
  assert.equal(typeof signOutBtn.listeners.click, "function");

  signOutBtn.click();
  assert.match(harness.modalContainer.innerHTML, /Sign out/);
});

test("confirming sign-out clears user session and redirects to signin even if backend is offline", async () => {
  const harness = createLogoutHarness({ logoutShouldFail: true });
  harness.App.openSignOutModal();

  const confirmBtn = harness.doc.getElementById("btn-confirm-signout");
  assert.equal(typeof confirmBtn.listeners.click, "function");

  await confirmBtn.click();

  assert.equal(harness.getLogoutCalled(), 1);
  assert.equal(harness.isChatbotCleared(), true);
  assert.equal(harness.mockState.user, null);
  assert.equal(harness.mockState.rooms.length, 0);
  assert.equal(harness.mockState.activeRoomId, null);
  assert.equal(harness.modalContainer.innerHTML, "");
  assert.match(harness.appRoot.innerHTML, /Sign In Form/);
  assert.equal(harness.context.window.location.hash, "signin");
  assert.ok(harness.toasts.some(t => t.msg === "Signed out successfully"));
});

test("canceling sign-out closes modal without modifying session", () => {
  const harness = createLogoutHarness();
  harness.App.openSignOutModal();

  const cancelBtn = harness.doc.getElementById("btn-cancel-signout");
  assert.equal(typeof cancelBtn.listeners.click, "function");

  cancelBtn.click();

  assert.equal(harness.getLogoutCalled(), 0);
  assert.notEqual(harness.mockState.user, null);
  assert.equal(harness.modalContainer.innerHTML, "");
});

test("settings sign-out button triggers the confirmation modal", () => {
  const harness = createLogoutHarness();
  harness.App.attachSettingsEvents();

  const settingsSignOutBtn = harness.doc.getElementById("btn-settings-signout");
  assert.equal(typeof settingsSignOutBtn.listeners.click, "function");

  settingsSignOutBtn.click();
  assert.match(harness.modalContainer.innerHTML, /Sign out/);
});
