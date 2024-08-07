module.exports = {
  transform: {
      "^.+\\.tsx?$": "ts-jest",
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  mapCoverage: true,
  testPathIgnorePatterns: ["/dist/", "/node_modules/"],
  setTimeout: 100000,
  logLevel: "verbose"
};