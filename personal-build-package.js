const path = require("path");
const fs = require("fs-extra");
const { spawnSync } = require("child_process");

// Constants
const BUILD_DIR = "build";
const PERSONAL_DIR = "personal";
const TSC_ALIAS = path.join(__dirname, "node_modules", ".bin", process.platform === "win32" ? "tsc-alias.cmd" : "tsc-alias");

/**
 * Logs a message and exits the process with an error code.
 *
 * @param {string} message - The error message to log.
 */
function exitWithError(message) {
    console.error(message);
    process.exit(1);
}

/**
 * Ensures the build directory exists or exits the process with an error.
 *
 * @returns {string} - The path of the build directory.
 */
function ensureBuildDirectory() {
    if (!fs.existsSync(BUILD_DIR)) {
        exitWithError(`${BUILD_DIR} directory not found. Please run the main build script first.`);
    }
    return BUILD_DIR;
}

/**
 * Overlays files from a source directory into a destination directory,
 * excluding specified directories.
 *
 * @param {string} srcDir - The source directory.
 * @param {string} destDir - The destination directory.
 * @param {string[]} excludeDirs - Directories to exclude.
 */
function overlayFiles(srcDir, destDir, excludeDirs = ["scripts", "penrose"]) {
    console.log(`Overlaying files from ${srcDir} to ${destDir}...`);
    fs.copySync(srcDir, destDir, {
        overwrite: true,
        filter: (src) => !excludeDirs.some((dir) => src.includes(dir)),
    });
}

/**
 * Runs a command synchronously and handles errors gracefully.
 *
 * @param {string} command - The command to run.
 * @param {string[]} args - Arguments for the command.
 * @param {string} cwd - The working directory for the command.
 */
function runCommand(command, args, cwd = process.cwd()) {
    const result = spawnSync(command, args, { cwd, stdio: "pipe" });
    if (result.status !== 0) {
        const output = result.stderr?.toString() || result.stdout?.toString();
        exitWithError(`Error running command: ${command} ${args.join(" ")}\n${output}`);
    }
}

/**
 * Compiles TypeScript files using a given TypeScript configuration.
 *
 * @param {string} tsConfigPath - The path to the TypeScript configuration file.
 */
function compileTypeScript(tsConfigPath) {
    console.log(`Compiling TypeScript files using ${tsConfigPath}...`);
    runCommand("node", ["./node_modules/typescript/bin/tsc", "-p", tsConfigPath]);
}

/**
 * Resolves TypeScript paths using tsc-alias.
 *
 * @param {string} tsConfigPath - The path to the TypeScript configuration file.
 */
function resolvePaths(tsConfigPath) {
    console.log("Resolving paths with tsc-alias...");
    const args = ["--resolve-full-paths", "--project", tsConfigPath];
    if (process.platform === "win32") {
        runCommand("cmd.exe", ["/c", TSC_ALIAS, ...args]);
    } else {
        runCommand(TSC_ALIAS, args);
    }
}

/**
 * Updates a distribution archive with the latest files using 7z.
 *
 * @param {string} archiveType - The type of archive (zip or mcpack).
 * @param {string} buildDir - The build directory.
 */
function updateArchive(archiveType, buildDir) {
    console.log(`Updating ${archiveType} archive...`);
    const archiveName = `Paradox-AntiCheat-v${require("./package.json").version}.${archiveType}`;
    const archivePath = path.join(buildDir, archiveName);
    const excludePatterns = ["build", "tsconfig.json"];
    const filesToAdd = fs.readdirSync(buildDir).filter((file) => !excludePatterns.includes(file));

    const args = [
        "u",
        `-tzip`, // Use zip format for consistency
        archivePath,
        ...filesToAdd,
        `-x!${path.join(buildDir, "build")}`, // Exclude build directory itself
    ];

    console.log(`Running 7z with arguments: ${args.join(" ")}`);
    runCommand("7z", args, buildDir);
}

/**
 * Main function orchestrating the build process.
 */
function main() {
    const buildDir = ensureBuildDirectory();

    // Overlay files from personal directory
    overlayFiles(PERSONAL_DIR, buildDir);

    // Compile TypeScript
    const tsconfigPath = path.resolve(__dirname, PERSONAL_DIR, "tsconfig.json");
    compileTypeScript(tsconfigPath);

    // Organize output files
    console.log("Organizing compiled files...");
    fs.copySync(`${buildDir}/scripts/personal/scripts`, `${buildDir}/scripts`, { overwrite: true });
    fs.removeSync(`${buildDir}/scripts/personal`);
    fs.removeSync(`${buildDir}/scripts/penrose`);

    // Resolve paths with tsc-alias
    resolvePaths(tsconfigPath);

    console.log("Build process completed successfully.");

    // Handle optional server and archive updates
    if (!process.argv.includes("--server")) {
        const archiveType = process.argv.includes("--mcpack") ? "mcpack" : "zip";
        updateArchive(archiveType, buildDir);
    }
}

// Execute the script
main();