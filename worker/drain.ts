export async function drainAndExit(
  tick: () => Promise<boolean>,
  close: () => Promise<void>,
) {
  let processed = 0;
  try {
    while (await tick()) processed++;
    return processed;
  } finally {
    await close();
  }
}
