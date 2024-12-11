import path from "path";
import fs from "fs-extra";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

// Constants
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Function to run a command and handle errors
function runCommand(command, args) {
    const result = spawnSync(command, args, { stdio: "inherit" });

    if (result.status !== 0) {
        console.error(`${command} failed with code ${result.status}:`);
        if (result.stderr && result.stderr.length > 0) {
            console.error(result.stderr.toString());
        } else if (result.stdout && result.stdout.length > 0) {
            console.error(result.stdout.toString());
        }
        process.exit(1); // Exit immediately if the command fails
    }
    return result;
}

// Execute version-sync.js to ensure versions are synchronized
console.log("\nSyncing version with version-sync.js...");
runCommand("node", ["./bin/version-sync.js"]);

// Read package.json to get the version
const packageJson = fs.readJsonSync("package.json");
const packageVersion = packageJson.version;

// Clean build directory
console.log("Cleaning build directory");
fs.removeSync("build");

// Create necessary directories
console.log("Creating build directory");
fs.mkdirSync("build", { recursive: true });

// Copy assets
console.log("Copying assets");
const assets = ["CHANGELOG.md", "LICENSE", "manifest.json", "pack_icon.png", "README.md"];
assets.forEach((asset) => {
    fs.copyFileSync(asset, path.join("build", asset));
});

// Bundle penrose/node_modules to build/scripts/node_modules
console.log("Running esbuild for bundling");
runCommand("node", ["./bin/esbuild.js"]);

// Build project using TypeScript
console.log("Building the project");
const tsConfigPath = path.resolve("./tsconfig.json");
runCommand("node", ["./node_modules/typescript/bin/tsc", "-p", tsConfigPath]);

// Check if --server parameter is present
const isServerMode = process.argv.includes("--server");

if (!isServerMode) {
    console.log("Creating distribution archive file");

    const outputFileName = `Paradox-AntiCheat-v${packageVersion}.${process.argv.includes("--mcpack") ? "mcpack" : "zip"}`;
    const outputFilePath = path.resolve("build/build", outputFileName);

    // Delete existing archive if it exists
    if (fs.existsSync(outputFilePath)) {
        console.log(`Removing existing archive: ${outputFilePath}`);
        fs.unlinkSync(outputFilePath);
    }

    // Explicitly specify the archive format
    console.log("Creating zip archive...");
    runCommand("7z", ["a", `-tzip`, outputFilePath, "CHANGELOG.md", "LICENSE", "README.md", "manifest.json", "pack_icon.png", "scripts"], { cwd: "build" });

    console.log(`Archive created successfully: ${outputFilePath}`);
}

console.log("Build process completed successfully.");
