export class AvatarService {
  constructor({ faces, colors }) {
    this.faces = faces;
    this.colors = colors;

    this.selectedFace = faces[2] ?? "🙂";
    this.selectedColor = colors[0] ?? "#1E85CA";
  }

  setFace(face) { this.selectedFace = face; }
  setColor(color) { this.selectedColor = color; }

  renderAvatar(el, { face, color, initial }) {
    el.style.background = `linear-gradient(135deg, ${color}, rgba(255,255,255,.10))`;
    el.style.borderColor = "rgba(255,255,255,.22)";
    el.innerHTML = `
      <div style="display:grid; gap:2px; place-items:center; width:100%; height:100%;">
        <div aria-hidden="true" style="font-size:18px; line-height:1;">${face}</div>
        <div aria-hidden="true" style="font-size:11px; font-weight:900; opacity:.95;">${(initial||"").toUpperCase()}</div>
      </div>
    `;
  }

  mountPickers({ faceContainer, colorContainer, onChange }) {
    faceContainer.innerHTML = "";
    this.faces.forEach((f) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "faceBtn" + (f === this.selectedFace ? " active" : "");
      b.textContent = f;
      b.addEventListener("click", () => {
        this.setFace(f);
        [...faceContainer.querySelectorAll(".faceBtn")].forEach(x => x.classList.remove("active"));
        b.classList.add("active");
        onChange?.();
      });
      faceContainer.appendChild(b);
    });

    colorContainer.innerHTML = "";
    this.colors.forEach((c) => {
      const s = document.createElement("div");
      s.className = "swatch" + (c === this.selectedColor ? " active" : "");
      s.style.background = c;
      s.addEventListener("click", () => {
        this.setColor(c);
        [...colorContainer.querySelectorAll(".swatch")].forEach(x => x.classList.remove("active"));
        s.classList.add("active");
        onChange?.();
      });
      colorContainer.appendChild(s);
    });
  }
}
