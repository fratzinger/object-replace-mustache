import replace from "./object-replace-mustache";
export * from "./types";

export default replace;

if (typeof module !== "undefined") {
  module.exports = Object.assign(replace, module.exports);
}