// by VienDesu! Poring Team 2023

function create_fps_button() {
    const FPSBtn = document.createElement("div");
    FPSBtn.className = "fps-button";
    FPSBtn.id = "buttonF2";
    document.body.appendChild(FPSBtn);

    FPSBtn.addEventListener("pointerdown", (event) => {
        event.stopImmediatePropagation();
        event.preventDefault();
        Graphics._switchFPSMeter();
    });
}

window.addEventListener('load', () => {
    create_fps_button();
});