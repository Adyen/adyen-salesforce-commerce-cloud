const fs = require("fs");
const path = require("path");

let foundIssues = false;

function checkFile(filePath) {
  const lines = fs.readFileSync(filePath, "utf8").split("\n");

  let inCall = false;
  let callLines = [];
  let startLineNum = 0;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    if (
      !inCall &&
      (line.includes("AdyenLogs.error_log(") || line.includes("AdyenLogs.fatal_log("))
    ) {
      inCall = true;
      callLines = [line];
      startLineNum = lineNum;
    } else if (inCall) {
      callLines.push(line);
    }

    if (inCall && line.includes(")")) {
      const fullCall = callLines.join(" ").replace(/\s+/g, " ");
      const regex = /AdyenLogs\.(error_log|fatal_log)\s*\(([^)]*)\)/;
      const match = fullCall.match(regex);

      if (match) {
        const args = match[2];
        const argCount = args.split(",").length;

        if (argCount < 2) {
          const preview = fullCall.slice(0, 120).trim() + (fullCall.length > 120 ? "..." : "");
          console.log(
            `⚠️  ${filePath}:${startLineNum} - Less than 2 arguments in AdyenLogs.${match[1]}:\n   → ${preview}`
          );
          foundIssues = true;
        }
      }

      inCall = false;
      callLines = [];
    }
  });
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (
      entry.isFile() &&
      fullPath.endsWith(".js") &&
      path.basename(fullPath) !== path.basename(__filename)
    ) {
      checkFile(fullPath);
    }
  }
}

walkDir("src");

if (foundIssues) {
  process.exit(1);
} else {
  process.exit(0);
}
