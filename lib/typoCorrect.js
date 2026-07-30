/**
 * "Malvin AI" command corrector.
 * This is a deterministic fuzzy-matcher (Levenshtein distance), not a
 * language model - it's fast, free, and works offline, which is what a
 * command corrector actually needs.
 */

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Given a mistyped command and the list of real registered command names,
 * returns the closest match if it's within a reasonable edit-distance
 * threshold, otherwise null.
 */
function suggestCommand(input, knownCommands) {
  input = input.toLowerCase();
  let best = null;
  let bestDist = Infinity;

  for (const cmd of knownCommands) {
    if (cmd === input) return { exact: cmd };
    const dist = levenshtein(input, cmd);
    // scale threshold with word length so short commands aren't over-matched
    const threshold = cmd.length <= 4 ? 1 : cmd.length <= 7 ? 2 : 3;
    if (dist <= threshold && dist < bestDist) {
      bestDist = dist;
      best = cmd;
    }
  }

  if (best) return { suggestion: best, distance: bestDist };
  return null;
}

module.exports = { suggestCommand, levenshtein };
