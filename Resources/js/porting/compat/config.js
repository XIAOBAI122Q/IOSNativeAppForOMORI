const ROOT_PATH = ".";

window.platform = "android";
window.process = {
    env: {},
    mainModule: {
        filename: `${ROOT_PATH}/OMORI.exe`
    }
};

window.process.env = {
    ROOT_PATH: ROOT_PATH,
    LOCALAPPDATA: `${ROOT_PATH}/appdata`
};

