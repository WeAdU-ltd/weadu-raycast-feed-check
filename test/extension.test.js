"use strict";
// Tests for the shipped files of this extension: src/feed.js, src/feed.d.ts,
// src/check-feed.tsx (compiled with esbuild and rendered against a stub of
// @raycast/api and React), and package.json.
// Needs `npm ci` first (esbuild comes with @raycast/api).

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const Module = require("node:module");

const root = path.join(__dirname, "..");
const feed = require("../src/feed");

// ---- tiny stand-ins for React and @raycast/api --------------------------------

function host(name) {
  const component = function () { return null; };
  component.host = name;
  return component;
}

const raycast = {
  Form: Object.assign(host("Form"), { TextArea: host("Form.TextArea"), Description: host("Form.Description") }),
  List: Object.assign(host("List"), { Item: host("List.Item"), EmptyView: host("List.EmptyView") }),
  ActionPanel: host("ActionPanel"),
  Action: Object.assign(host("Action"), {
    SubmitForm: host("Action.SubmitForm"),
    CopyToClipboard: host("Action.CopyToClipboard"),
  }),
};

let hookState = [];
let hookIndex = 0;
let rerender = null;
const react = {
  useState(initial) {
    const i = hookIndex++;
    if (!(i in hookState)) hookState[i] = initial;
    return [hookState[i], function (next) { hookState[i] = next; rerender(); }];
  },
};
function jsx(type, props, key) { return { type: type, props: props || {}, key: key }; }
const jsxRuntime = { jsx: jsx, jsxs: jsx, Fragment: host("Fragment") };

function render(node) {
  if (node == null || node === false || node === true) return [];
  if (Array.isArray(node)) return node.flatMap(render);
  if (typeof node !== "object") return [];
  const type = node.type;
  if (typeof type === "function" && !type.host) return render(type(node.props));
  const out = { name: type.host, props: node.props, children: render(node.props.children) };
  if (node.props.actions) out.actions = render(node.props.actions);
  return [out];
}

function findAll(tree, name) {
  const out = [];
  (function walk(nodes) {
    for (const n of nodes) {
      if (n.name === name) out.push(n);
      walk(n.children || []);
      walk(n.actions || []);
    }
  })(tree);
  return out;
}

function loadCommand() {
  const esbuild = require("esbuild");
  const built = esbuild.buildSync({
    entryPoints: [path.join(root, "src", "check-feed.tsx")],
    bundle: true,
    format: "cjs",
    platform: "node",
    jsx: "automatic",
    external: ["@raycast/api", "react", "react/jsx-runtime"],
    write: false,
  });
  const code = built.outputFiles[0].text;
  const mod = new Module(path.join(root, "src", "check-feed.compiled.js"));
  mod.require = function (request) {
    if (request === "@raycast/api") return raycast;
    if (request === "react") return react;
    if (request === "react/jsx-runtime") return jsxRuntime;
    return require(request);
  };
  mod._compile(code, mod.id);
  return mod.exports.default;
}

function mount(Command) {
  hookState = [];
  const app = { tree: null };
  rerender = function () {
    hookIndex = 0;
    app.tree = render(jsx(Command, {}));
  };
  rerender();
  return app;
}

const validRow = [
  "id,title,description,link,image_link,availability,price,brand,gtin,condition",
  "1,Acme Cotton Shirt,A cotton shirt for everyday wear.,https://shop.example/p/1,https://shop.example/i/1.jpg,in_stock,29.00 EUR,Acme,4006381333931,new",
  "2,Hat,A cotton hat.,https://shop.example/p/2,,in_stock,0 EUR,Acme,4006381333932,new",
].join("\n");

// ---- tests ------------------------------------------------------------------

test("package.json has the fields the Raycast Store reads", function () {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  for (const key of ["name", "title", "description", "icon", "author", "license", "commands"]) assert.ok(pkg[key], key);
  assert.equal(pkg.license, "MIT");
  assert.ok(fs.existsSync(path.join(root, "assets", pkg.icon)), "icon is relative to assets/: " + pkg.icon);
  for (const command of pkg.commands) {
    assert.ok(fs.existsSync(path.join(root, "src", command.name + ".tsx")), command.name);
  }
  const png = fs.readFileSync(path.join(root, "assets", pkg.icon));
  assert.equal(png.readUInt32BE(16), 512, "icon width");
  assert.equal(png.readUInt32BE(20), 512, "icon height");
});

test("feed.d.ts declares what feed.js exports", function () {
  const dts = fs.readFileSync(path.join(root, "src", "feed.d.ts"), "utf8");
  const declared = Array.from(dts.matchAll(/export function (\w+)/g)).map(function (m) { return m[1]; });
  for (const name of declared) assert.equal(typeof feed[name], "function", name);
});

test("shipped source makes no network call", function () {
  for (const file of ["feed.js", "check-feed.tsx"]) {
    const text = fs.readFileSync(path.join(root, "src", file), "utf8");
    for (const word of ["fetch(", "XMLHttpRequest", "WebSocket", "http.request", "https.request", "useFetch"]) {
      assert.equal(text.includes(word), false, file + ": " + word);
    }
  }
});

test("command shows a form, then a result list after submit", function () {
  const app = mount(loadCommand());
  const area = findAll(app.tree, "Form.TextArea")[0];
  assert.equal(area.props.id, "feed");
  assert.match(findAll(app.tree, "Form.Description")[0].props.text, /stays on this machine/);

  const submit = findAll(app.tree, "Action.SubmitForm")[0];
  submit.props.onSubmit({ feed: validRow });

  const items = findAll(app.tree, "List.Item");
  assert.equal(items.length, 2);
  assert.equal(items[0].props.title, "Acme Cotton Shirt");
  assert.equal(items[0].props.subtitle, "No finding");
  assert.equal(items[0].props.accessories[0].text, "0 errors, 0 warnings");
  assert.equal(items[1].props.title, "Hat");
  assert.equal(items[1].props.subtitle, "title_too_short, missing_image, price_not_positive, gtin_invalid");
  assert.equal(items[1].props.accessories[0].text, "3 errors, 1 warnings");

  const copy = findAll(items[1].actions, "Action.CopyToClipboard")[0];
  assert.match(copy.props.content, /^Hat\ntitle is under 15 characters\./);

  const reset = findAll(items[0].actions, "Action").find(function (a) { return a.props.title === "Check Another Feed"; });
  reset.props.onAction();
  assert.equal(findAll(app.tree, "Form.TextArea").length, 1, "back to the form");
});

test("command shows feed-level errors and an empty view", function () {
  const app = mount(loadCommand());
  findAll(app.tree, "Action.SubmitForm")[0].props.onSubmit({ feed: "hello" });
  const items = findAll(app.tree, "List.Item");
  assert.equal(items.length, 1);
  assert.equal(items[0].props.title, "Feed");
  assert.match(items[0].props.subtitle, /Paste a Google RSS or Atom feed/);

  const empty = mount(loadCommand());
  findAll(empty.tree, "Action.SubmitForm")[0].props.onSubmit({ feed: "id,title\n" });
  assert.equal(findAll(empty.tree, "List.Item")[0].props.subtitle, "No product was found in this text.");
});

test("Atom feed, tab-separated file, and XML entities", function () {
  const atom = '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0"><entry>'
    + "<g:id>A1</g:id><title>Acme T-shirt &amp; Cap set</title><summary>Two items.</summary>"
    + "<g:link>https://shop.example/a1</g:link><g:image_link>https://shop.example/a1.jpg</g:image_link>"
    + "<g:availability>in stock</g:availability><g:price>EUR 15.00</g:price><g:brand>Acme</g:brand>"
    + "<g:mpn>A1</g:mpn><g:condition>new</g:condition></entry></feed>";
  const report = feed.auditFeedText(atom);
  assert.equal(report.format, "atom");
  assert.equal(report.items[0].title, "Acme T-shirt & Cap set");
  assert.deepEqual(report.items[0].findings, []);

  const tsv = "id\ttitle\tprice\n7\tAcme Wool Socks Pack\t9.90 GBP";
  const tsvReport = feed.auditFeedText(tsv);
  assert.equal(tsvReport.format, "csv");
  assert.equal(tsvReport.items[0].title, "Acme Wool Socks Pack");
});

test("feeds over 500 products are truncated with a warning", function () {
  const rows = ["id,title"];
  for (let i = 1; i <= 501; i++) rows.push(i + ",Acme Cotton Shirt " + i);
  const report = feed.auditFeedText(rows.join("\n"));
  assert.equal(report.items.length, 500);
  assert.equal(report.truncated, true);
  assert.deepEqual(report.errors.map(function (e) { return e.code; }), ["truncated"]);
});
