import { useLanguage } from "@/src/context/LanguageContext";

export const useTranslation = () => {
  const { t } = useLanguage();
  return t;
};
