import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, TextInput, View } from "react-native";

import { useAppTheme, useAuth, useStyles, useTranslation } from "@/src/hooks";
import { logger } from "@/src/helpers/logger";

import GradientWrapper from "../gradient-wrapper/GradientWrapper";
import Modal from "../modal/Modal";
import { AppText } from "../text";

import { getStyles } from "./styles";

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 24;

type ConfirmNameModalProps = {
  isVisible: boolean;
  initialName: string | null;
  onSaved: () => void;
};

const ConfirmNameModal: React.FC<ConfirmNameModalProps> = ({
  isVisible,
  initialName,
  onSaved,
}) => {
  const t = useTranslation();
  const { colors } = useAppTheme();
  const styles = useStyles(getStyles);
  const { updateDisplayName } = useAuth();

  const [name, setName] = useState<string>(initialName ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setName(initialName ?? "");
    }
  }, [isVisible, initialName]);

  const trimmedLength = name.trim().length;
  const isValid =
    trimmedLength >= MIN_NAME_LENGTH && trimmedLength <= MAX_NAME_LENGTH;
  const showValidationError = name.length > 0 && !isValid;

  const handleSave = useCallback(async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);
    try {
      await updateDisplayName(name.trim());
      onSaved();
    } catch (err) {
      logger.warn("[ConfirmNameModal] save failed:", err);
    } finally {
      setIsSaving(false);
    }
  }, [isValid, isSaving, name, onSaved, updateDisplayName]);

  const isSaveDisabled = !isValid || isSaving;
  const savePressableStyle = isSaveDisabled
    ? styles.saveButtonDisabled
    : undefined;
  const saveAccessibilityState = { disabled: isSaveDisabled };
  const saveButtonContent = isSaving ? (
    <ActivityIndicator size="small" color={colors.bronzeDark} />
  ) : (
    <AppText fontFamily="script" type="headline">
      {t.name_modal_save}
    </AppText>
  );
  const validationContent = showValidationError ? (
    <AppText
      type="caption"
      fontFamily="sans"
      color={colors.dangerOnParchment}
      style={styles.validationText}
    >
      {t.name_validation_length}
    </AppText>
  ) : null;

  const renderComponent = (
    <View style={styles.confirmContainer}>
      <AppText
        type="subHeadline"
        fontFamily="serif"
        color={colors.onImage}
        style={styles.confirmCaption}
      >
        {t.name_modal_caption}
      </AppText>

      <TextInput
        value={name}
        onChangeText={setName}
        maxLength={MAX_NAME_LENGTH}
        autoFocus
        autoCorrect={false}
        autoCapitalize="words"
        placeholderTextColor={colors.bronzeMid}
        style={styles.nameInput}
        accessibilityLabel={t.name_modal_title}
        editable={!isSaving}
      />

      <View style={styles.validationRow}>{validationContent}</View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.name_modal_save}
        accessibilityState={saveAccessibilityState}
        onPress={handleSave}
        disabled={isSaveDisabled}
        style={savePressableStyle}
      >
        <GradientWrapper style={styles.saveScrollButton}>
          {saveButtonContent}
        </GradientWrapper>
      </Pressable>
    </View>
  );

  return (
    <Modal
      isVisible={isVisible}
      headerTitle={t.name_modal_title}
      renderComponent={renderComponent}
    />
  );
};

export default ConfirmNameModal;
