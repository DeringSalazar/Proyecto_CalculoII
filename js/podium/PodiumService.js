export class PodiumService {

  constructor(){
    this.key = "quiz_podium";
  }

  getPlayers(){
    return JSON.parse(localStorage.getItem(this.key)) || [];
  }

  savePlayer(player){
    const players = this.getPlayers();
    players.push(player);

    players.sort((a,b) => b.points - a.points);

    const top3 = players.slice(0,3);

    localStorage.setItem(this.key, JSON.stringify(top3));
  }

  getTopPlayers(){
    return this.getPlayers();
  }

}
