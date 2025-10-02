import { app, BrowserWindow } from "electron";
import path from "path";
import isDev from "electron-is-dev";
import { fileURLToPath } from "url";
import process from "process";

function createWindow() {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);

	// Create the main window but don't show it yet.
	const mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		show: false, // Don't show the main window initially
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
	});

	// Create a splash screen window
	const splash = new BrowserWindow({
		width: 500,
		height: 300,
		transparent: true,
		frame: false,
		alwaysOnTop: true,
	});

	splash.loadFile(path.join(__dirname, "splash.html"));

	// Load the React app in the main window.
	mainWindow.loadURL(
		isDev
			? "http://localhost:5173"
			: `file://${path.join(__dirname, "../dist/index.html")}`
	);

	// When the main window is ready to show, close the splash screen and show the main window.
	mainWindow.once("ready-to-show", () => {
		splash.destroy();
		mainWindow.show();
	});

	// Open the DevTools in development.
	if (isDev) {
		mainWindow.webContents.openDevTools({ mode: "detach" });
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});
