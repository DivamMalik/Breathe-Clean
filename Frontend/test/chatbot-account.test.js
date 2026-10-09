const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const chatbotSource = readFileSync(path.join(__dirname, "../js/chatbot.js"), "utf8");

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

test("assistant cache is scoped to an account and cleared when switching accounts", () => {
  const localStorage = createStorage();
  const context = vm.createContext({
    localStorage,
    API: { getCurrentUser: () => ({ id: 1 }) }
  });
  vm.runInContext(chatbotSource, context);
  const chatbot = vm.runInContext("Chatbot", context);
  chatbot.init();
  chatbot.messages.push({ sender: "user", text: "private account detail" });
  chatbot.save();

  assert.ok(localStorage.getItem("breatheclean_chat_history:1"));
  assert.equal(localStorage.getItem("breatheclean_chat_history"), null);

  chatbot.setAccount(2);
  assert.equal(localStorage.getItem("breatheclean_chat_history:1"), null);
  assert.equal(chatbot.messages.some(message => message.text === "private account detail"), false);
});
