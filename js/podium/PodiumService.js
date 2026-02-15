export class PodiumService {

  constructor(){
    this.key = "quiz_podium";
  }

  getPlayers(){
    return JSON.parse(localStorage.getItem(this.key)) || [];
  }

 savePlayer(player){
  const players = this.getPlayers();

  // Buscar jugador existente
  const existing = players.find(p => p.username === player.username);
  if(existing){
    // Actualizamos todos los campos
    existing.points = player.points ?? existing.points;
    existing.level = player.level ?? existing.level;
    existing.lives = player.lives ?? existing.lives;
    existing.correct = player.correct ?? existing.correct;
    existing.incorrect = player.incorrect ?? existing.incorrect;
  } else {
    // Nuevo jugador
    players.push(player);
  }

  // Ordenar por puntos
  players.sort((a,b) => b.points - a.points);

  // Guardar top 3
  const top3 = players.slice(0,3);
  localStorage.setItem(this.key, JSON.stringify(top3));
}


  getTopPlayers(){
    return this.getPlayers();
  }

}
