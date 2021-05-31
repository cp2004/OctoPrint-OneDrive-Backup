module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: ["standard", "plugin:react/recommended", "plugin:react-hooks/recommended"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module"
  },
  rules: {
    quotes: ["warn", "double"],
    "react/prop-types": 0
  }
}
