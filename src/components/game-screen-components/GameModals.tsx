import React from "react";

import { useTranslation } from "@/src/hooks";

import Endgame from "../end-game/EndGame";
import AppSettings from "../app-settings/AppSettings";
import Modal from "../modal/Modal";
import GameSummary from "../game-summary/GameSummary";
import Hint from "../hint/Hint";

type GameModalsProps = {
  modals: {
    exit: boolean;
    settings: boolean;
    hint: boolean;
    summary: boolean;
    correctAnswers: number;
  };
  onClose: {
    toggleExitModal: () => void;
    toggleSettingsModal: () => void;
    toggleHintModal: () => void;
    closeSummaryModal: () => void;
  };
  onExit: () => void;
  onRestart: () => void;
  currentHint?: string;
};
const GameModals: React.FC<GameModalsProps> = ({
  modals,
  onClose,
  onExit,
  onRestart,
  currentHint,
}) => {
  const t = useTranslation();

  return (
    <>
      <Modal
        isVisible={modals.exit}
        headerTitle={t.game_end}
        onClose={onClose.toggleExitModal}
        renderComponent={
          <Endgame
            onPressExit={onExit}
            onPressContinue={onClose.toggleExitModal}
            title={t.game_ending_confirmation}
            continueBtnText={t.game_continue}
            closeBtnText={t.common_ending}
          />
        }
      />

      <Modal
        isVisible={modals.settings}
        headerTitle={t.common_parameters}
        onClose={onClose.toggleSettingsModal}
        renderComponent={<AppSettings />}
      />

      <Modal
        isVisible={modals.hint}
        headerTitle={t.common_hint}
        onClose={onClose.toggleHintModal}
        renderComponent={
          <Hint
            onPressContinue={onClose.toggleHintModal}
            currentHint={currentHint}
          />
        }
      />

      <Modal
        isVisible={modals.summary}
        headerTitle={t.game_your_result}
        onClose={onClose.closeSummaryModal}
        renderComponent={
          <GameSummary
            score={modals.correctAnswers}
            onRestartBtnPress={onRestart}
            onCloseSummary={onClose.closeSummaryModal}
          />
        }
      />
    </>
  );
};

export default GameModals;
