import { PodiumService } from "../podium/PodiumService.js";


export class UIController {
  constructor({ toast, auth, quiz, avatarService }){
    this.toast = toast;
    this.auth = auth;
    this.quiz = quiz;
    this.avatarService = avatarService;
    this.podiumService = new PodiumService();

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

    };

    this.lastQuestion = null;
    this.awaitingNext = false;
  }

  init(){
    this.bindEvents();
    this.mountAvatarPickers();
    this.restoreSessionIfAny();
    this.renderAll();
    this.el.btnRules.setAttribute("aria-expanded","false");

  }

  // Rules panel removed: modal handles rules display


bindEvents(){
  // auth open/close
  this.el.btnOpenAuth.addEventListener("click", () => this.openAuth());
  this.el.btnCloseAuth1.addEventListener("click", () => this.closeAuth());
  this.el.btnCloseAuth2.addEventListener("click", () => this.closeAuth());

  // Rules handled by modal; no local toggle listener

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

// Esto es para el podio gente 
createPodiumContainer(){
  if(!document.getElementById("podiumContainer")){
    const div = document.createElement("div");
    div.id = "podiumContainer";
    div.innerHTML = `
      <h2>🏆 Podio Global</h2>
      <div id="podiumList" class="podium-list"></div>
    `;
    document.body.appendChild(div);
  }
}

renderPodium(){
  this.createPodiumContainer();

  const list = document.getElementById("podiumList");
  list.innerHTML = "";

  const top = this.podiumService.getTopPlayers();

  top.forEach((player, index) => {
    const position = index + 1;

    let medal = "";
    if(position === 1) medal = "🥇";
    if(position === 2) medal = "🥈";
    if(position === 3) medal = "🥉";

    const item = document.createElement("div");
    item.className = "podium-item";
    item.innerHTML = `
      <h3>${medal} ${position}° Lugar</h3>
      <p>👤 ${player.username}</p>
      <p>⭐ ${player.points} pts</p>
    `;

    list.appendChild(item);
  });
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
    this.el.qPrompt.textContent = "Inicia sesión para comenzar.";
    this.el.qBody.innerHTML = "";
    return;
  }

  // 🟢 NIVEL COMPLETADO
  if(this.quiz.isLevelComplete()){

    // Puede avanzar de nivel
    if(this.quiz.canAdvance()){
      this.setFeedback("ok", "¡Nivel completado!", "Presiona “Siguiente” para avanzar.");
      this.el.btnNext.disabled = false;
      return;
    }

    // 🏆 JUEGO COMPLETADO TOTAL
    this.setFeedback("ok", "¡Juego completado!", "Terminaste todos los niveles.");

    // 🔥 Guardar en podio
    if(this.quiz.user){
      this.podiumService.savePlayer({
        username: this.quiz.user.username,
        points: this.quiz.points
      });
    }

    // 🔥 Mostrar podio
    this.renderPodium();

    this.el.btnNext.disabled = true;
    this.el.btnSkip.disabled = true;
    return;
  }

  // 🔵 Cargar siguiente pregunta
  const q = this.quiz.getNextQuestion();
  if(!q){
    this.el.qPrompt.textContent = "Sin preguntas disponibles.";
    this.el.qBody.innerHTML = "";
    return;
  }

  this.lastQuestion = q;
  this.el.qPrompt.textContent = q.prompt;
  this.el.qBody.innerHTML = "";

  // ===============================
  // MULTIPLE CHOICE
  // ===============================
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

  // ===============================
  // INPUT TYPE
  // ===============================
  if(q.type === "input"){
    const row = document.createElement("div");
    row.className = "inputRow";

    const input = document.createElement("input");
    input.id = "freeInput";
    input.placeholder = q.placeholder || "Escribe tu respuesta";

    const btn = document.createElement("button");
    btn.textContent = "Verificar";
    btn.className = "btn primary";

    btn.addEventListener("click", () => this.answerInput(input.value));

    row.appendChild(input);
    row.appendChild(btn);
    this.el.qBody.appendChild(row);
  }

  this.el.btnSkip.disabled = false;
}


  answerMCQ(index){
 if(!this.lastQuestion || this.awaitingNext) return;

  const res = this.quiz.submitAnswer(this.lastQuestion, { index });

  const choices = this.el.qBody.querySelectorAll(".choice");

  // 🔒 Bloquear opciones
  choices.forEach(btn => btn.disabled = true);

  if(res.correct){
    this.setFeedback("ok", res.title, res.desc);

    this.el.hudAvatar.classList.remove("sparkle");
    void this.el.hudAvatar.offsetWidth;
    this.el.hudAvatar.classList.add("sparkle");

  } else {
    this.setFeedback("bad", res.title, res.desc);

    // 🎯 Marcar la correcta
    const correctBtn = choices[this.lastQuestion.answerIndex];
    if(correctBtn){
      correctBtn.classList.add("correct-answer");
    }
  }

  if(res.endedByLives){

  this.setFeedback("bad", "Te quedaste sin vidas", "Juego terminado.");

  // 🔥 Guardar en podio
  if(this.quiz.user){
    this.podiumService.savePlayer({
      username: this.quiz.user.username,
      points: this.quiz.points
    });
  }

  // 🔥 Mostrar podio
  this.renderPodium();

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
  if(!this.lastQuestion || this.awaitingNext) return;

  const res = this.quiz.submitAnswer(this.lastQuestion, { value });

  const input = document.getElementById("freeInput");
  const btn = this.el.qBody.querySelector("button");

  // 🔒 Bloquear input y botón
  if(input) input.disabled = true;
  if(btn) btn.disabled = true;

  if(res.correct){

    this.setFeedback("ok", res.title, res.desc);

    // ✨ Animación avatar
    this.el.hudAvatar.classList.remove("sparkle");
    void this.el.hudAvatar.offsetWidth;
    this.el.hudAvatar.classList.add("sparkle");

  } else {

    this.setFeedback("bad", res.title, res.desc);
  }

  // 💀 Si se quedó sin vidas
  if(res.endedByLives){

    this.setFeedback("bad", "Te quedaste sin vidas", "Juego terminado.");

    // 🔥 Guardar en podio
    if(this.quiz.user){
      this.podiumService.savePlayer({
        username: this.quiz.user.username,
        points: this.quiz.points
      });
    }

    // 🔥 Mostrar podio
    this.renderPodium();

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

      // 🔥 Guardar en podio
      if(this.quiz.user){
        this.podiumService.savePlayer({
          username: this.quiz.user.username,
          points: this.quiz.points
        });
      }

      // 🔥 Mostrar podio
      this.renderPodium();

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
    this.clearFeedback();
    this.renderAll();
  }
}
