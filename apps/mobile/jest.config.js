module.exports = {
  moduleFileExtensions: ["js", "json", "ts", "tsx"],
  testRegex: ".*\.(spec|e2e)\.ts$",
  transform: {
    "^.+\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  passWithNoTests: true,
  roots: ["<rootDir>/src", "<rootDir>/e2e"],
};
