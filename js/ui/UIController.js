export class UIController {
  constructor({ toast, auth, quiz, avatarService }){
    this.toast = toast;
    this.auth = auth;
    this.quiz = quiz;
    this.avatarService = avatarService;

    // DOM
    this.$ = (s) => document.querySelector(s);

    this.el = {
      // header/hud
      userPill: this.$("#userPill"),
      hudAvatar: this.$("#hudAvatar"),
      hudName: this.$("#hudName"),
      hudMeta: this.$("#hudMeta"),

      btnOpenAuth: this.$("#btnOpenAuth"),
      btnLogout: this.$("#btnLogout"),
      btnReset: this.$("#btnReset"),
      btnRules: this.$("#btnRules"),

      // stats
      statLevel: this.$("#statLevel"),
      statPoints: this.$("#statPoints"),
      statLives: this.$("#statLives"),
      progressBar: this.$("#progressBar"),
      progressText: this.$("#progressText"),

      // question
      diffBadge: this.$("#diffBadge"),
      qCounter: this.$("#qCounter"),
      qPrompt: this.$("#qPrompt"),
      qBody: this.$("#qBody"),
      feedback: this.$("#feedback"),
      fbTitle: this.$("#fbTitle"),
      fbDesc: this.$("#fbDesc"),
      btnNext: this.$("#btnNext"),
      btnSkip: this.$("#btnSkip"),

      // auth overlay
      overlay: this.$("#authOverlay"),
      tabLogin: this.$("#tabLogin"),
      tabRegister: this.$("#tabRegister"),
      loginPane: this.$("#loginPane"),
      registerPane: this.$("#registerPane"),
      btnCloseAuth1: this.$("#btnCloseAuth1"),
      btnCloseAuth2: this.$("#btnCloseAuth2"),
      btnLogin: this.$("#btnLogin"),
      btnRegister: this.$("#btnRegister"),

      loginUser: this.$("#loginUser"),
      loginPass: this.$("#loginPass"),
      regUser: this.$("#regUser"),
      regPass: this.$("#regPass"),
      regInitial: this.$("#regInitial"),

      facePicker: this.$("#facePicker"),
      outfitPicker: this.$("#outfitPicker"),   // 👈 NUEVO
      colorPicker: this.$("#colorPicker"),


      rulesCard: this.$("#rulesCard")
    };

    this.lastQuestion = null;
    this.awaitingNext = false;
  }

  init(){
    this.bindEvents();
    this.mountAvatarPickers();
    this.restoreSessionIfAny();
    this.renderAll();
    this.el.rulesCard.classList.add("rulesHidden");
    this.el.btnRules.setAttribute("aria-expanded","false");
    // Arrancar con reglas ocultas y preguntas centradas
this.el.rulesCard.classList.add("rulesHidden");
this.el.rulesCard.style.display = "none";

const grid = document.querySelector("main.grid");
grid.style.gridTemplateColumns = "minmax(0, 760px)";
grid.style.justifyContent = "center";

this.el.btnRules.setAttribute("aria-expanded","false");

  }

  toggleRules(){
  const grid = document.querySelector("main.grid");

  const willHide = !this.el.rulesCard.classList.contains("rulesHidden");

  if(willHide){
    // Ocultar: quitar del layout (NO solo invisible)
    this.el.rulesCard.classList.add("rulesHidden");
    this.el.rulesCard.style.display = "none";

    // Centrar preguntas
    grid.style.gridTemplateColumns = "minmax(0, 760px)";
    grid.style.justifyContent = "center";
  } else {
    // Mostrar: volver al layout
    this.el.rulesCard.classList.remove("rulesHidden");
    this.el.rulesCard.style.display = "";

    // Regresar a 2 columnas
    grid.style.gridTemplateColumns = "";
    grid.style.justifyContent = "";
  }

  this.el.btnRules.setAttribute("aria-expanded", willHide ? "false" : "true");
}


bindEvents(){
  // auth open/close
  this.el.btnOpenAuth.addEventListener("click", () => this.openAuth());
  this.el.btnCloseAuth1.addEventListener("click", () => this.closeAuth());
  this.el.btnCloseAuth2.addEventListener("click", () => this.closeAuth());

  // ✅ SOLO ESTE PARA REGLAS
  this.el.btnRules.addEventListener("click", () => this.toggleRules());

  // tabs
  this.el.tabLogin.addEventListener("click", () => this.switchTab("login"));
  this.el.tabRegister.addEventListener("click", () => this.switchTab("register"));

  // actions
  this.el.btnLogin.addEventListener("click", () => this.handleLogin());
  this.el.btnRegister.addEventListener("click", () => this.handleRegister());

  this.el.btnLogout.addEventListener("click", () => this.handleLogout());
  this.el.btnReset.addEventListener("click", () => {
    if(!this.quiz.isLoggedIn()) return this.toast.show("Primero inicia sesión.");
    this.quiz.resetLevel();
    this.clearFeedback();
    this.renderAll();
  });

  // quiz nav
  this.el.btnNext.addEventListener("click", () => this.next());
  this.el.btnSkip.addEventListener("click", () => this.skip());
}

 mountAvatarPickers(){
  this.avatarService.mountPickers({
    faceContainer: this.el.facePicker,
    outfitContainer: this.el.outfitPicker, // 👈 NUEVO
    colorContainer: this.el.colorPicker
  });
}

  restoreSessionIfAny(){
    const r = this.auth.tryRestoreSession();
    if(r.ok){
      this.quiz.loadUser(r.user);
    }
  }

  openAuth(){
    this.el.overlay.classList.add("show");
    this.switchTab("login");
  }

  closeAuth(){
    this.el.overlay.classList.remove("show");
  }

  switchTab(mode){
    const login = (mode === "login");
    this.el.tabLogin.classList.toggle("active", login);
    this.el.tabRegister.classList.toggle("active", !login);
    this.el.loginPane.style.display = login ? "block" : "none";
    this.el.registerPane.style.display = login ? "none" : "block";
    this.el.tabLogin.setAttribute("aria-selected", login ? "true":"false");
    this.el.tabRegister.setAttribute("aria-selected", !login ? "true":"false");
  }

  handleRegister(){
    const res = this.auth.register({
      usernameRaw: this.el.regUser.value,
      pass: this.el.regPass.value,
      initialRaw: this.el.regInitial.value
    });

    this.toast.show(res.msg);
    if(res.ok){
      this.switchTab("login");
      this.el.loginUser.value = res.username;
      this.el.loginPass.value = "";
      this.el.regUser.value = "";
      this.el.regPass.value = "";
      this.el.regInitial.value = "";
    }
  }

  handleLogin(){
    const res = this.auth.login({
      usernameRaw: this.el.loginUser.value,
      pass: this.el.loginPass.value
    });

    this.toast.show(res.msg);
    if(!res.ok) return;

    this.quiz.loadUser(res.user);
    this.closeAuth();
    this.clearFeedback();
    this.renderAll();
  }

  handleLogout(){
    const res = this.auth.logout();
    this.quiz.logout();
    this.toast.show(res.msg);
    this.clearFeedback();
    this.renderAll();
  }

  renderAll(){
    this.renderHUD();
    this.renderQuestion();
  }

  renderHUD(){
    const logged = this.quiz.isLoggedIn();
    this.el.btnOpenAuth.style.display = logged ? "none" : "inline-block";
    this.el.btnLogout.style.display = logged ? "inline-block" : "none";
    this.el.userPill.style.display = logged ? "flex" : "none";

    if(!logged){
      this.el.statLevel.textContent = "—";
      this.el.statPoints.textContent = "—";
      this.el.statLives.textContent = "—";
      this.el.progressBar.style.width = "0%";
      this.el.progressText.textContent = "—";
      this.el.hudName.textContent = "Usuario";
      this.el.hudMeta.textContent = "—";
      this.el.hudAvatar.innerHTML = "";
      return;
    }

    const prog = this.quiz.getProgress();
    this.el.statLevel.textContent = `Nivel ${this.quiz.level}`;
    this.el.statPoints.textContent = `${this.quiz.points} pts`;
    this.el.statLives.textContent = "❤".repeat(this.quiz.lives);

    this.el.progressBar.style.width = `${prog.pct}%`;
    this.el.progressText.textContent = `${prog.done} / ${prog.total} preguntas del nivel completadas`;

    this.el.hudName.textContent = this.quiz.user.username;
    this.el.hudMeta.textContent = `Nivel ${this.quiz.level} • ${this.quiz.points} pts`;

    this.avatarService.renderAvatar(this.el.hudAvatar, this.quiz.user.avatar);
  }

  clearFeedback(){
    this.el.feedback.classList.remove("ok","bad","show");
    this.el.fbTitle.textContent = "—";
    this.el.fbDesc.textContent = "—";
  }

  setFeedback(kind, title, desc){
    this.el.feedback.classList.remove("ok","bad","show");
    this.el.feedback.classList.add("show", kind);
    this.el.fbTitle.textContent = title;
    this.el.fbDesc.textContent = desc;
  }

  renderQuestion(){
    this.el.btnNext.disabled = true;
    this.el.btnSkip.disabled = true;
    this.awaitingNext = false;
    this.lastQuestion = null;

    if(!this.quiz.isLoggedIn()){
      this.el.diffBadge.textContent = "—";
      this.el.diffBadge.className = "badge";
      this.el.qCounter.textContent = "—";
      this.el.qPrompt.textContent = "Inicia sesión para comenzar.";
      this.el.qBody.innerHTML = "";
      return;
    }

    // si completó nivel
    if(this.quiz.isLevelComplete()){
      if(this.quiz.canAdvance()){
        this.setFeedback("ok", "¡Nivel completado!", "Presiona “Siguiente” para pasar al próximo nivel.");
        this.el.qPrompt.textContent = "Has completado el nivel.";
        this.el.qBody.innerHTML = "";
        this.el.btnNext.disabled = false;
        return;
      }

      this.setFeedback("ok", "¡Juego completado!", "Terminaste todos los niveles. Reinicia nivel para practicar o mejorar puntaje.");
      this.el.qPrompt.textContent = "Fin del recorrido.";
      this.el.qBody.innerHTML = "";
      this.el.btnNext.disabled = true;
      return;
    }

    const q = this.quiz.getNextQuestion();
    if(!q){
      this.el.qPrompt.textContent = "Sin preguntas disponibles.";
      this.el.qBody.innerHTML = "";
      return;
    }

    this.lastQuestion = q;

    // badges
    this.el.diffBadge.textContent = q.diff;
    this.el.diffBadge.className = `badge ${q.diff === "Fácil" ? "easy" : q.diff === "Medio" ? "mid" : "hard"}`;

    const prog = this.quiz.getProgress();
    this.el.qCounter.textContent = `Pregunta ${prog.done + 1} de ${prog.total}`;

    this.el.qPrompt.textContent = q.prompt;
    this.el.qBody.innerHTML = "";

    if(q.type === "mcq"){
      const wrap = document.createElement("div");
      wrap.className = "choices";
      q.choices.forEach((c, idx) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice";
        btn.textContent = c;
        btn.addEventListener("click", () => this.answerMCQ(idx));
        wrap.appendChild(btn);
      });
      this.el.qBody.appendChild(wrap);
    }

    if(q.type === "input"){
      const row = document.createElement("div");
      row.className = "inputRow";

      const input = document.createElement("input");
      input.placeholder = q.placeholder || "Escribe tu respuesta";
      input.id = "freeInput";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn primary";
      btn.textContent = "Verificar";
      btn.addEventListener("click", () => this.answerInput(input.value));

      input.addEventListener("keydown", (e) => {
        if(e.key === "Enter"){
          e.preventDefault();
          btn.click();
        }
      });

      row.appendChild(input);
      row.appendChild(btn);
      this.el.qBody.appendChild(row);

      const hint = document.createElement("div");
      hint.className = "small muted";
      hint.textContent = "Tip: Ejemplos válidos: sen(x), ln|x|, x";
      this.el.qBody.appendChild(hint);
    }

    this.el.btnSkip.disabled = false;
  }

  answerMCQ(index){
  if(!this.lastQuestion) return;
  const res = this.quiz.submitAnswer(this.lastQuestion, { index });

  if(res.correct){
    this.setFeedback("ok", res.title, res.desc);

    // ✨ EFECTO SPARKLE EN EL AVATAR
    this.el.hudAvatar.classList.remove("sparkle");
    void this.el.hudAvatar.offsetWidth; // fuerza reflow para reiniciar animación
    this.el.hudAvatar.classList.add("sparkle");

  } else {
    this.setFeedback("bad", res.title, res.desc);
  }

  if(res.endedByLives){
    this.setFeedback("bad", "Te quedaste sin vidas", "Reinicia el nivel para intentarlo de nuevo y revisa las explicaciones.");
    this.el.btnNext.disabled = true;
    this.el.btnSkip.disabled = true;
    this.renderHUD();
    return;
  }

  this.awaitingNext = true;
  this.el.btnNext.disabled = false;
  this.el.btnSkip.disabled = true;
  this.renderHUD();
}


  answerInput(value){
    if(!this.lastQuestion) return;
    const res = this.quiz.submitAnswer(this.lastQuestion, { value });

   if(res.correct){
  this.setFeedback("ok", res.title, res.desc);

  this.el.hudAvatar.classList.remove("sparkle");
  void this.el.hudAvatar.offsetWidth;
  this.el.hudAvatar.classList.add("sparkle");

} else {
  this.setFeedback("bad", res.title, res.desc);
}

    if(res.endedByLives){
      this.setFeedback("bad", "Te quedaste sin vidas", "Reinicia el nivel para intentarlo de nuevo y revisa las explicaciones.");
      this.el.btnNext.disabled = true;
      this.el.btnSkip.disabled = true;
      this.renderHUD();
      return;
    }

    this.awaitingNext = true;
    this.el.btnNext.disabled = false;
    this.el.btnSkip.disabled = true;
    this.renderHUD();
  }

  skip(){
    if(!this.lastQuestion) return;
    const res = this.quiz.skipQuestion(this.lastQuestion);

    this.setFeedback("bad", res.title, res.desc);

    if(res.endedByLives){
      this.setFeedback("bad", "Te quedaste sin vidas", "Reinicia el nivel y reintenta con calma.");
      this.el.btnNext.disabled = true;
      this.el.btnSkip.disabled = true;
      this.renderHUD();
      return;
    }

    this.el.btnNext.disabled = false;
    this.el.btnSkip.disabled = true;
    this.renderHUD();
  }

  next(){
    // si terminó nivel y puede avanzar
    if(this.quiz.isLevelComplete()){
      if(this.quiz.canAdvance()){
        this.quiz.advanceLevel();
        this.clearFeedback();
        this.renderAll();
      }
      return;
    }

    // seguir con la siguiente pregunta
    this.clearFeedback();
    this.renderAll();
  }
}
