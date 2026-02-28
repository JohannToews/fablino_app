import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import FablinoMascot from "@/components/FablinoMascot";

const labels: Record<string, { title: string; description: string; stay: string; leave: string }> = {
  de: { title: "Geschichte verlassen?", description: "Du bist noch nicht fertig mit Lesen!", stay: "Weiterlesen 📖", leave: "Verlassen" },
  fr: { title: "Quitter l'histoire ?", description: "Tu n'as pas encore fini de lire !", stay: "Continuer 📖", leave: "Quitter" },
  en: { title: "Leave the story?", description: "You haven't finished reading yet!", stay: "Keep reading 📖", leave: "Leave" },
  es: { title: "¿Salir de la historia?", description: "¡Aún no has terminado de leer!", stay: "Seguir leyendo 📖", leave: "Salir" },
  nl: { title: "Verhaal verlaten?", description: "Je bent nog niet klaar met lezen!", stay: "Verder lezen 📖", leave: "Verlaten" },
  it: { title: "Lasciare la storia?", description: "Non hai ancora finito di leggere!", stay: "Continua a leggere 📖", leave: "Esci" },
  bs: { title: "Napustiti priču?", description: "Još nisi završio/la čitanje!", stay: "Nastavi čitati 📖", leave: "Napusti" },
  pt: { title: "Sair da história?", description: "Ainda não acabaste de ler!", stay: "Continuar a ler 📖", leave: "Sair" },
  tr: { title: "Hikâyeden çık?", description: "Okumayı henüz bitirmedin!", stay: "Okumaya devam et 📖", leave: "Çık" },
  bg: { title: "Напускане на историята?", description: "Все още не си приключил/а с четенето!", stay: "Продължи да четеш 📖", leave: "Напусни" },
  ro: { title: "Părăsești povestea?", description: "Nu ai terminat de citit!", stay: "Continuă să citești 📖", leave: "Părăsește" },
  pl: { title: "Opuścić historię?", description: "Jeszcze nie skończyłeś/aś czytać!", stay: "Czytaj dalej 📖", leave: "Opuść" },
  lt: { title: "Palikti istoriją?", description: "Dar nebaigei skaityti!", stay: "Skaityti toliau 📖", leave: "Palikti" },
  hu: { title: "Elhagyod a történetet?", description: "Még nem fejezted be az olvasást!", stay: "Tovább olvasok 📖", leave: "Kilépés" },
  ca: { title: "Sortir de la història?", description: "Encara no has acabat de llegir!", stay: "Continuar llegint 📖", leave: "Sortir" },
  sl: { title: "Zapustiti zgodbo?", description: "Branja še nisi končal/a!", stay: "Nadaljuj z branjem 📖", leave: "Zapusti" },
  sk: { title: "Opustiť príbeh?", description: "Ešte si nedočítal/a!", stay: "Čítať ďalej 📖", leave: "Opustiť" },
  uk: { title: "Залишити історію?", description: "Ти ще не дочитав/ла!", stay: "Читати далі 📖", leave: "Залишити" },
  ru: { title: "Покинуть историю?", description: "Ты ещё не дочитал/а!", stay: "Читать дальше 📖", leave: "Покинуть" },
};

interface LeaveReadingDialogProps {
  open: boolean;
  language: string;
  onStay: () => void;
  onLeave: () => void;
}

const LeaveReadingDialog = ({ open, language, onStay, onLeave }: LeaveReadingDialogProps) => {
  const t = labels[language] || labels.de;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-xs rounded-2xl text-center">
        <div className="flex justify-center mb-2">
          <FablinoMascot src="/mascot/4_come_back.png" size="sm" />
        </div>
        <AlertDialogTitle className="text-lg">{t.title}</AlertDialogTitle>
        <AlertDialogDescription className="text-sm">{t.description}</AlertDialogDescription>
        <div className="flex flex-col gap-2 mt-3">
          <AlertDialogAction
            onClick={onStay}
            className="bg-[#E8863A] hover:bg-[#d4792f] text-white font-bold rounded-xl py-3 text-base"
          >
            {t.stay}
          </AlertDialogAction>
          <AlertDialogCancel
            onClick={onLeave}
            className="rounded-xl py-3 text-base font-medium"
          >
            {t.leave}
          </AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LeaveReadingDialog;
