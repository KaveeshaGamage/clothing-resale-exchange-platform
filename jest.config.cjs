module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/src/**/*.test.jsx"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  moduleNameMapper: {
    "\\.(css|less|scss)$": "<rootDir>/test/styleMock.cjs"
  },
  setupFilesAfterEnv: ["<rootDir>/test/setup.cjs"],
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/main.jsx",
    "!src/**/*.test.jsx"
  ],
  coverageDirectory: "coverage"
};
