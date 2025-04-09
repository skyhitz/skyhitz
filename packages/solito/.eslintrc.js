module.exports = {
  root: true,
  // This tells ESLint to load the config from the package
  extends: ['next', 'prettier'],
  settings: {
    next: {
      rootDir: ["apps/*/"],
    },
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
  overrides: [
    // Only use Next.js babel parser for Next.js app files
    {
      files: ['apps/next/**/*.{js,jsx,ts,tsx}'],
      parser: "@babel/eslint-parser",
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["next/babel"],
        },
      },
    },
    // Use standard parser for Expo files
    {
      files: ['apps/expo/**/*.{js,jsx,ts,tsx}'],
      parser: "@babel/eslint-parser",
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["babel-preset-expo"],
        },
      },
    },
  ],
}
