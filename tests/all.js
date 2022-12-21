const assert = require("assert");
const path = require("path");
const fs = require("fs/promises");
const Module = require("../dist/qpdf");

before(async function () {
  await fs.mkdir(path.join(__dirname, "out"), { recursive: true });
});

describe("all", function () {
  it("should remove pdf pages", async function () {
    const exitStatus = await callMain([
      "assets/sample.pdf",
      "--pages",
      ".",
      "1-2",
      "--",
      "out/removed.pdf",
    ]);
    assert.equal(exitStatus, 0);
  });

  // Ensure this doesn't call `process.exit`
  it("should exit properly on error", async function () {
    const exitStatus = await callMain(["unknown-subcommand"]);
    assert.equal(exitStatus, 2);
  });
});

async function callMain(args) {
  const mod = await Module();
  const working = "/working";
  mod.FS.mkdir(working);
  mod.FS.mount(mod.NODEFS, { root: __dirname }, working);
  mod.FS.chdir(working);
  return mod.callMain(args);
}
