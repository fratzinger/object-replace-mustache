import orm from "./object-replace-mustache";
export * from "./types";

export default orm;

if (typeof module !== "undefined") {
    module.exports = Object.assign(orm, module.exports);
  }