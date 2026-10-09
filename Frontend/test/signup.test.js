const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const appSource = readFileSync(
  path.join(__dirname, "../js/app.js"),
  "utf8"
);

function createSignupHarness({ signup, password = "correct-password" }) {
  let submitHandler;
  let onboardingAttached = false;
  let signupCalls = 0;
  const appRoot = { innerHTML: "" };
  const signupError = { textContent: "", style: { display: "none" } };
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
      updateUser() {}
    },
    State: { user: null },
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
    appRoot,
    signupError,
    get onboardingAttached() {
      return context.onboardingAttached;
    },
    get signupCalls() {
      return signupCalls;
    },
    setConfirmPassword(value) {
      values["signup-password-confirm"].value = value;
    },
    async submit() {
      await submitHandler({ preventDefault() {} });
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
