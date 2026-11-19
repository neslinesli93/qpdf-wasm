const assert = require("assert");
const path = require("path");
const fs = require("fs/promises");
const Module = require("../");

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

  // qpdf recovers damaged files inside catch blocks in libqpdf
  it("should repair a file whose offsets are wrong", async function () {
    // Six bytes after the header move every object away from where the
    // cross-reference table says it is, so qpdf has to rebuild the table.
    const pdf = await fs.readFile(path.join(__dirname, "assets/sample.pdf"));
    const header = /\r\n|\r|\n/.exec(pdf.toString("latin1"));
    const end = header.index + header[0].length;
    await fs.writeFile(
      path.join(__dirname, "out/shifted.pdf"),
      Buffer.concat([pdf.subarray(0, end), Buffer.from("%junk\n"), pdf.subarray(end)])
    );
    const errors = [];
    const exitStatus = await callMain(["out/shifted.pdf", "out/repaired.pdf"], {
      printErr: (line) => errors.push(line),
    });
    // 3: the file was written, with warnings
    assert.equal(exitStatus, 3, errors.join("\n"));
    assert.ok(
      errors.some((line) => line.includes("file is damaged")),
      errors.join("\n")
    );
  });

  // libjpeg's errors reach qpdf through longjmp, in a function that also catches exceptions
  it("should report a broken JPEG without crashing", async function () {
    await fs.writeFile(path.join(__dirname, "out/broken-jpeg.pdf"), pdfWithBrokenJpeg());
    const lines = [];
    const exitStatus = await callMain(["--check", "out/broken-jpeg.pdf"], {
      print: (line) => lines.push(line),
      printErr: (line) => lines.push(line),
    });
    assert.notEqual(exitStatus, 0);
    assert.ok(
      lines.some((line) => line.includes("Not a JPEG file")),
      lines.join("\n")
    );
  });

  it("should run many times in one instance when the stack is restored", async function () {
    this.timeout(60000);
    const mod = await Module({ print: () => {} });
    const stack = mod.stackSave();
    // Each call leaves its arguments on the 64 KB stack: without stackRestore,
    // one instance runs out of stack long before the end of this loop.
    for (let i = 0; i < 2000; i++) {
      assert.equal(mod.callMain(["--version"]), 0);
      mod.stackRestore(stack);
    }
    assert.equal(mod.stackSave(), stack);
  });
});

async function callMain(args, options) {
  const mod = await Module(options);
  const working = "/working";
  mod.FS.mkdir(working);
  mod.FS.mount(mod.NODEFS, { root: __dirname }, working);
  mod.FS.chdir(working);
  return mod.callMain(args);
}

// A one-page PDF whose only image says it's a JPEG but isn't.
function pdfWithBrokenJpeg() {
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>",
    [
      "<< /Type /XObject /Subtype /Image /Width 8 /Height 8 /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /DCTDecode",
      "not a jpeg",
    ],
    ["<<", "q 100 0 0 100 0 0 cm /Im1 Do Q"],
  ];
  let pdf = "%PDF-1.7\n";
  const offsets = objects.map((object, i) => {
    const offset = pdf.length;
    const [dict, data] = Array.isArray(object) ? object : [object];
    pdf += `${i + 1} 0 obj\n`;
    pdf +=
      data === undefined
        ? `${dict}\n`
        : `${dict} /Length ${data.length} >>\nstream\n${data}\nendstream\n`;
    pdf += "endobj\n";
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}
