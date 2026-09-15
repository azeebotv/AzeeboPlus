module.exports = {
  moduleFileExtensions: ["js", "json", "ts", "tsx"],
  testRegex: ".*\\.(spec|test)\\.tsx?$",
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  testEnvironment: "node",
  passWithNoTests: true,
  roots: ["<rootDir>/src"],
};
