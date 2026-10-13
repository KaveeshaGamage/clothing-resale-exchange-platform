module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "models/**/*.js",
    "routes/**/*.js",
    "!**/*.test.js"
  ],
  coverageDirectory: "coverage"
};
