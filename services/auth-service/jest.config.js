module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\.spec\.ts$",
  transform: {
    "^.+\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  passWithNoTests: true,
  moduleNameMapper: {
    "^bcrypt$": "<rootDir>/__mocks__/bcrypt.mock.ts",
  },
};
