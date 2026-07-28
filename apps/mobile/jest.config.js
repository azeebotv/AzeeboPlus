module.exports = {
  moduleFileExtensions: ["js", "json", "ts", "tsx"],
  testRegex: ".*\\.(spec|test)\\.tsx?$",
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  passWithNoTests: true,
  roots: ["<rootDir>/src", "<rootDir>/app"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
};
