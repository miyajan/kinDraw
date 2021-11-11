module.exports = {
  extends: ["@cybozu/eslint-config/presets/node-typescript-prettier"],
  env: {
    node: true,
    webextensions: true,
  },
  rules: {
    "node/no-unpublished-require": [
      "error",
      { allowModules: ["copy-webpack-plugin"] },
    ],
  },
};
