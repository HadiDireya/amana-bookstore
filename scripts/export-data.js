/* eslint-disable @typescript-eslint/no-require-imports, @next/next/no-assign-module-variable */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

function loadTsModule(entryPath) {
  const source = fs.readFileSync(entryPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019,
      esModuleInterop: true,
      resolveJsonModule: true,
      isolatedModules: false,
      removeComments: true,
    },
    fileName: path.basename(entryPath),
  }).outputText;

  const module = { exports: {} };
  const context = vm.createContext({
    module,
    exports: module.exports,
    require: createRequire(entryPath),
    __dirname: path.dirname(entryPath),
    __filename: entryPath,
    console,
    process,
    Buffer,
    setTimeout,
    clearTimeout,
  });

  new vm.Script(transpiled, { filename: entryPath }).runInContext(context);
  return module.exports;
}

function createRequire(entryPath) {
  const resolvedDir = path.dirname(entryPath);
  return (specifier) => {
    if (specifier.startsWith('.')) {
      const fullPath = path.resolve(resolvedDir, specifier);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          const indexTs = path.join(fullPath, 'index.ts');
          if (fs.existsSync(indexTs)) {
            return loadTsModule(indexTs);
          }
        } else {
          return require(fullPath);
        }
      }
      if (fs.existsSync(`${fullPath}.js`)) {
        return require(`${fullPath}.js`);
      }
      if (fs.existsSync(`${fullPath}.json`)) {
        return require(`${fullPath}.json`);
      }
      if (fs.existsSync(`${fullPath}.ts`)) {
        return loadTsModule(`${fullPath}.ts`);
      }
      const indexTs = path.join(fullPath, 'index.ts');
      if (fs.existsSync(indexTs)) {
        return loadTsModule(indexTs);
      }
    }
    if (specifier.endsWith('.ts')) {
      return loadTsModule(path.resolve(resolvedDir, specifier));
    }
    return require(specifier);
  };
}

const datasets = [
  { name: 'books', source: 'src/app/data/books.ts', exportKey: 'books' },
  { name: 'reviews', source: 'src/app/data/reviews.ts', exportKey: 'reviews' },
  { name: 'cart', source: 'src/app/data/cart.ts', exportKey: 'initialCart' },
];

const outDir = path.resolve('data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const { name, source, exportKey } of datasets) {
  const absoluteSource = path.resolve(source);
  const exportsObject = loadTsModule(absoluteSource);
  if (!Object.prototype.hasOwnProperty.call(exportsObject, exportKey)) {
    throw new Error(`Export "${exportKey}" not found in ${source}`);
  }
  const data = exportsObject[exportKey];
  const targetPath = path.join(outDir, `${name}.json`);
  fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Wrote ${targetPath}`);
}
