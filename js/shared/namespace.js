// Single global namespace. Loaded before every other script.
// Using one global (instead of ES modules) so the app runs from a
// double-clicked index.html with no server and no build step.
window.Lab = window.Lab || {};
Lab.shared = Lab.shared || {};
Lab.moduleA = Lab.moduleA || {};
Lab.moduleB = Lab.moduleB || {};
Lab.moduleA.solvers = Lab.moduleA.solvers || {};
