const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  // Há .js compilados antigos ao lado dos .ts em src/ (o build de verdade sai em
  // dist/). Sem isto o Jest resolveria o .js obsoleto e testaria código morto.
  moduleFileExtensions: ["ts", "tsx", "js", "mjs", "cjs", "jsx", "json", "node"],
  transform: {
    ...tsJestTransformCfg,
  },
};