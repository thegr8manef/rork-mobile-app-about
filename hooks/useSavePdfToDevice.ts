import useShowMessage from "@/hooks/useShowMessage";
import { savePdfToDevice } from "@/utils/savePdfToDevice";

export function useSavePdfToDevice() {
  const { showMessageError, showMessageSuccess } = useShowMessage();

  return (base64: string, filename: string, dialogTitle?: string) =>
    savePdfToDevice(base64, filename, {
      showMessageSuccess,
      showMessageError,
      dialogTitle,
    });
}
