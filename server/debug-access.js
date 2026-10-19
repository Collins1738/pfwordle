function canRevealDebugAnswer(mode, nodeEnv = process.env.NODE_ENV) {
  return nodeEnv !== "production" || mode !== "daily";
}

module.exports = { canRevealDebugAnswer };
