import Toast from "react-native-toast-message";

type ShowToastParams = {
  type: "error" | "success" | "info";
  text1: string;
  text2?: string;
};

export const showToast = ({ type, text1, text2 }: ShowToastParams) => {
  Toast.show({ type, text1, text2 });
};
