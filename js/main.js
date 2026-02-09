import { StorageService } from "./core/StorageService.js";
import { Toast } from "./core/Toast.js";
import { AvatarService } from "./auth/AvatarService.js";
import { AuthService } from "./auth/AuthService.js";
import { QuestionBank } from "./quiz/QuestionBank.js";
import { QuizEngine } from "./quiz/QuizEngine.js";
import { UIController } from "./ui/UIController.js";

const storage = new StorageService();
const toast = new Toast(document.querySelector("#toast"));

const avatarService = new AvatarService({
  faces: ["🙂","😎","🤓","🧠","🧩","🧮","🌱","🚀"],
  colors: ["#1E85CA","#5EB04A","#81C55E","#FEBE29","#E37624","#9B59B6","#FF6FAE","#00C2A8"]
});

const auth = new AuthService(storage, toast, avatarService);
const bank = new QuestionBank();
const quiz = new QuizEngine(storage, toast, bank);
const ui = new UIController({ toast, auth, quiz, avatarService });

ui.init();
