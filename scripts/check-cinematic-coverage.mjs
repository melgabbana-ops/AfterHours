import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const sourceRoot = path.join(root, "src");
const sourceFiles = [];
const stylesheetFiles = [];

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) { await collect(fullPath); continue; }
    if (!entry.isFile()) continue;
    if (/\.tsx?$/.test(entry.name)) sourceFiles.push(fullPath);
    if (/\.css$/i.test(entry.name)) stylesheetFiles.push(fullPath);
  }
}

await collect(sourceRoot);
if (stylesheetFiles.length === 0) throw new Error("No CSS files found under src/");
const styles = (await Promise.all(stylesheetFiles.map((file) => readFile(file, "utf8")))).join("\n");
const cssClasses = new Set([...styles.matchAll(/\.([_a-zA-Z][\w-]*)/g)].map((match) => match[1]));
const missing = new Map();

function reportMissing(file, className) {
  const relative = path.relative(root, file);
  if (!missing.has(relative)) missing.set(relative, new Set());
  missing.get(relative).add(className);
}

function inspectClassExpression(file, expression) {
  const literalParts = [];
  const dynamicPrefixes = [];
  function collect(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      literalParts.push(node.text);
      return;
    }
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
      collect(node.expression);
      return;
    }
    if (ts.isConditionalExpression(node)) {
      collect(node.whenTrue);
      collect(node.whenFalse);
      return;
    }
    if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.kind;
      if (operator === ts.SyntaxKind.PlusToken) {
        if (ts.isStringLiteral(node.left) && !ts.isStringLiteral(node.right) && !ts.isNoSubstitutionTemplateLiteral(node.right)) {
          const match = node.left.text.match(/(?:^|\s)([A-Za-z_][\w-]*-)$/);
          if (match) {
            literalParts.push(node.left.text.slice(0, node.left.text.length - match[1].length));
            dynamicPrefixes.push(match[1]);
          } else collect(node.left);
        } else collect(node.left);
        collect(node.right);
      } else if (operator === ts.SyntaxKind.AmpersandAmpersandToken || operator === ts.SyntaxKind.BarBarToken || operator === ts.SyntaxKind.QuestionQuestionToken) {
        collect(node.right);
      }
      return;
    }
    if (ts.isTemplateExpression(node)) {
      const head = node.head.text;
      const match = head.match(/(?:^|\s)([A-Za-z_][\w-]*-)$/);
      if (match) {
        literalParts.push(head.slice(0, head.length - match[1].length));
        dynamicPrefixes.push(match[1]);
      } else literalParts.push(head);
      for (const span of node.templateSpans) {
        literalParts.push(span.literal.text);
        dynamicPrefixes.push(...span.literal.text.split(/\s+/).filter((token) => token.endsWith("-")));
      }
      return;
    }
    if (ts.isCallExpression(node)) {
      for (const argument of node.arguments) collect(argument);
    }
  }
  collect(expression);

  for (const part of literalParts) {
    for (const className of part.split(/[\s,]+/).filter(Boolean)) {
      if (!cssClasses.has(className)) reportMissing(file, className);
    }
  }
  for (const prefix of dynamicPrefixes) {
    if (![...cssClasses].some((selectorClass) => selectorClass.startsWith(prefix))) {
      reportMissing(file, prefix + "<dynamic>");
    }
  }
}

for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  const scriptKind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
  function visit(node) {
    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && node.name.text === "className" && node.initializer) {
      if (ts.isStringLiteral(node.initializer)) {
        inspectClassExpression(file, node.initializer);
      } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        inspectClassExpression(file, node.initializer.expression);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(parsed);
}

if (missing.size) {
  for (const [file, classes] of missing) console.error(file + ": " + [...classes].join(", "));
  console.error("Cinematic style coverage failed. Add styles or remove obsolete class names.");
  process.exit(1);
}
console.log("Cinematic style coverage passed: " + sourceFiles.length + " source files and " + stylesheetFiles.length + " stylesheets scanned using the TypeScript JSX parser.");
