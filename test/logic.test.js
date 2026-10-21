"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const feed = require("../src/feed");

const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, "fixtures.json"), "utf8"));

function codes(findings) {
  return findings.map(function (row) { return row.code; }).sort();
}

test("feed item fixtures", function () {
  for (const row of fixtures.items) {
    const report = feed.auditItems([row.item]);
    assert.equal(report.items.length, 1, row.name);
    assert.deepEqual(codes(report.items[0].findings), row.codes.slice().sort(), row.name);
  }
});

test("title suggestions and duplicate ids", function () {
  for (const row of fixtures.titles) {
    assert.equal(feed.suggestTitle(row.item), row.suggested, row.name);
  }
  const long = "A".repeat(160);
  assert.equal(feed.suggestTitle({ title: long, brand: "" }).length, 150);
  const batch = feed.auditItems([
    fixtures.items[0].item,
    Object.assign({}, fixtures.items[0].item),
  ]);
  assert.deepEqual(codes(batch.items[1].findings), ["duplicate_id"]);
  const truncated = feed.auditItems([fixtures.items[0].item, fixtures.items[1].item], 1);
  assert.equal(truncated.truncated, true);
  assert.equal(truncated.items.length, 1);
  assert.ok(codes(truncated.errors).includes("truncated"));
});

test("rss, atom, and csv parsers", function () {
  const rss = [
    '<?xml version="1.0"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "<channel><item>",
    "<g:id>1</g:id>",
    "<g:title><![CDATA[Acme Cotton Shirt]]></g:title>",
    "<g:description>A cotton shirt for everyday wear.</g:description>",
    "<g:link>https://shop.example/p/1</g:link>",
    "<g:image_link>https://shop.example/i/1.jpg</g:image_link>",
    "<g:availability>in_stock</g:availability>",
    "<g:price>29.00 EUR</g:price>",
    "<g:brand>Acme</g:brand>",
    "<g:gtin>4006381333931</g:gtin>",
    "<g:condition>new</g:condition>",
    "</item></channel></rss>",
  ].join("");
  const parsed = feed.auditFeedText(rss);
  assert.equal(parsed.format, "rss");
  assert.deepEqual(codes(parsed.items[0].findings), []);

  const csv = [
    "id,title,description,link,image_link,availability,price,brand,gtin,condition",
    '"8","Blue cotton shirt, soft","Soft cotton shirt for everyday wear.","https://shop.example/p/8","https://shop.example/i/8.jpg","in stock","29.00 EUR","Acme","4006381333931","new"',
  ].join("\n");
  const csvReport = feed.auditFeedText(csv);
  assert.equal(csvReport.format, "csv");
  assert.equal(csvReport.items[0].title, "Blue cotton shirt, soft");
  assert.deepEqual(codes(csvReport.items[0].findings), []);
  assert.equal(feed.auditFeedText("hello").format, "unknown");
  assert.equal(feed.gtinIsValid("4006381333931"), true);
  assert.equal(feed.gtinIsValid("4006381333932"), false);
});
