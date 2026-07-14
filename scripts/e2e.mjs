import { spawn } from "node:child_process";

const preview = spawn("npm run preview -- --port 4173", {
  shell: true,
  stdio: "inherit"
});

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`Server did not start at ${url}`);
}

function runPlaywright() {
  return new Promise((resolve) => {
    const child = spawn("npx playwright test --reporter=list --workers=1", {
      shell: true,
      stdio: "inherit",
      env: {
        ...process.env,
        PLAYWRIGHT_EXTERNAL_SERVER: "1"
      }
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

try {
  await waitForServer("http://127.0.0.1:4173", 20000);
  const code = await runPlaywright();
  preview.kill();
  process.exit(code);
} catch (error) {
  preview.kill();
  console.error(error);
  process.exit(1);
}
