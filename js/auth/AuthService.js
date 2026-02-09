function normalize(s){
  return (s || "")
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll(" ", "")
    .replaceAll("á","a").replaceAll("é","e").replaceAll("í","i").replaceAll("ó","o").replaceAll("ú","u")
    .replaceAll("ñ","n");
}

// Hash ligero (no seguridad real, solo evita texto plano)
function simpleHash(str){
  let h = 2166136261;
  for(let i=0;i<str.length;i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

export class AuthService {
  constructor(storage, toast, avatarService){
    this.storage = storage;
    this.toast = toast;
    this.avatarService = avatarService;
  }

  register({ usernameRaw, pass, initialRaw }){
    const username = normalize(usernameRaw);
    const initial = (initialRaw || "").trim().slice(0,1).toUpperCase();

    if(username.length < 3) return { ok:false, msg:"El usuario debe tener al menos 3 caracteres." };
    if((pass||"").length < 4) return { ok:false, msg:"La contraseña debe tener al menos 4 caracteres." };
    if(!initial) return { ok:false, msg:"Escribe una inicial para tu avatar." };

    const users = this.storage.loadUsers();
    if(users[username]) return { ok:false, msg:"Ese usuario ya existe. Prueba otro." };

    users[username] = {
      username,
      passHash: simpleHash(pass),
      avatar: {
        face: this.avatarService.selectedFace,
        color: this.avatarService.selectedColor,
        initial
      },
      progress: { level: 1, points: 0 }
    };
    this.storage.saveUsers(users);

    return { ok:true, msg:"Cuenta creada. Ahora inicia sesión.", username };
  }

  login({ usernameRaw, pass }){
    const username = normalize(usernameRaw);
    const users = this.storage.loadUsers();
    const u = users[username];

    if(!u) return { ok:false, msg:"Usuario no encontrado." };
    if(u.passHash !== simpleHash(pass||"")) return { ok:false, msg:"Contraseña incorrecta." };

    this.storage.saveSession({ username });
    return { ok:true, msg:"Sesión iniciada.", user: u };
  }

  logout(){
    this.storage.clearSession();
    return { ok:true, msg:"Sesión cerrada." };
  }

  tryRestoreSession(){
    const session = this.storage.loadSession();
    if(!session?.username) return { ok:false };

    const users = this.storage.loadUsers();
    const u = users[session.username];
    if(!u) return { ok:false };

    return { ok:true, user: u };
  }
}
