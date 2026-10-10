const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const appSource = readFileSync(
  path.join(__dirname, "../js/app.js"),
  "utf8"
);

function createSignupHarness({
  signup,
  login = async () => { throw new Error("Unexpected login"); },
  password = "correct-password"
}) {
  let submitHandler;
  let recoveryHandler;
  let onboardingAttached = false;
  let signupCalls = 0;
  let loginCalls = 0;
  const appRoot = { innerHTML: "" };
  const signupError = { textContent: "", style: { display: "none" } };
  const recoveryButton = {
    hidden: true,
    disabled: false,
    textContent: "",
    addEventListener(event, handler) {
      if (event === "click") recoveryHandler = handler;
    },
    click() {
      return recoveryHandler?.({ preventDefault() {} });
    }
  };
  const form = {
    addEventListener(event, handler) {
      if (event === "submit") submitHandler = handler;
    }
  };
  const values = {
    "signup-name": { value: "New User" },
    "signup-email": { value: "new@example.com" },
    "signup-password": { value: password },
    "signup-password-confirm": { value: password }
  };
  const document = {
    addEventListener() {},
    getElementById(id) {
      if (id === "form-sign-up") return form;
      if (id === "signup-error") return signupError;
      if (id === "btn-signup-recover-account") return recoveryButton;
      if (id === "app-root") return appRoot;
      return values[id] || null;
    },
    querySelectorAll() {
      return [];
    }
  };
  const context = {
    API: {
      async signup(...args) {
        signupCalls += 1;
        return signup(...args);
      },
      async login(...args) {
        loginCalls += 1;
        return login(...args);
      },
      updateUser() {},
      getSettings: () => ({ tempUnit: "celsius", notificationsEnabled: true }),
      getCachedAccountSetup: () => null,
      getActiveRoomId: () => null,
      getRooms: () => []
    },
    State: { user: null, rooms: [] },
    Chatbot: { setAccount() {}, clearHistory() {} },
    Views: { renderOnboarding: () => "setup-mode" },
    Utils: {},
    document,
    console
  };

  vm.runInNewContext(appSource, context);
  vm.runInContext("App.initGoogleAuthSDK = () => {}", context);
  vm.runInContext("App.stopAirflowSimulation = () => {}", context);
  vm.runInContext(
    "App.attachOnboardingEvents = () => { globalThis.onboardingAttached = true; }",
    context
  );
  context.onboardingAttached = false;
  context.State.getActiveRoom = () => null;
  vm.runInContext("App.attachAuthEvents()", context);

  return {
    context,
    appRoot,
    signupError,
    recoveryButton,
    get onboardingAttached() {
      return context.onboardingAttached;
    },
    get signupCalls() {
      return signupCalls;
    },
    get loginCalls() {
      return loginCalls;
    },
    setConfirmPassword(value) {
      values["signup-password-confirm"].value = value;
    },
    async submit() {
      await submitHandler({ preventDefault() {} });
    },
    async recover() {
      await recoveryButton.click();
    },
    state: context.State
  };
}

test("successful signup keeps the new-user onboarding state and opens Setup Mode", async () => {
  const harness = createSignupHarness({
    signup: async () => ({
      id: 7,
      name: "New User",
      email: "new@example.com",
      isOnboarded: false
    })
  });

  await harness.submit();

  assert.equal(harness.state.user.isOnboarded, false);
  assert.equal(harness.appRoot.innerHTML, "setup-mode");
  assert.equal(harness.onboardingAttached, true);
  assert.equal(harness.signupError.style.display, "none");
});

test("password mismatch is shown inline without calling the API", async () => {
  const harness = createSignupHarness({
    signup: async () => {
      throw new Error("Signup should not be called for mismatched passwords");
    }
  });

  harness.setConfirmPassword("different-password");
  await harness.submit();

  assert.equal(harness.signupCalls, 0);
  assert.equal(harness.signupError.textContent, "Passwords do not match.");
  assert.equal(harness.signupError.style.display, "block");
});

test("registration API errors are shown inline", async () => {
  const harness = createSignupHarness({
    signup: async () => {
      throw new Error("An account with this email already exists");
    }
  });

  await harness.submit();

  assert.equal(
    harness.signupError.textContent,
    "An account with this email already exists"
  );
  assert.equal(harness.signupError.style.display, "block");
});

test("an uncertain signup offers explicit sign-in recovery without retrying registration", async () => {
  const harness = createSignupHarness({
    signup: async () => {
      const error = new Error(
        "We could not confirm whether your account was created because the server connection was lost."
      );
      error.accountOutcomeUnknown = true;
      throw error;
    },
    login: async (email, password) => {
      assert.equal(email, "new@example.com");
      assert.equal(password, "correct-password");
      return {
        id: 8,
        name: "New User",
        email,
        isOnboarded: false
      };
    }
  });
  vm.runInContext(
    "App.renderCurrentApplicationState = () => { globalThis.recoveryApplicationRendered = true; }",
    harness.context
  );

  await harness.submit();

  assert.equal(harness.signupCalls, 1);
  assert.equal(harness.loginCalls, 0);
  assert.equal(harness.recoveryButton.hidden, false);

  await harness.recover();

  assert.equal(harness.signupCalls, 1);
  assert.equal(harness.loginCalls, 1);
  assert.equal(harness.state.user.id, 8);
  assert.equal(harness.context.recoveryApplicationRendered, true);
});
