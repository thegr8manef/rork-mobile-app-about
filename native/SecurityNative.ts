import { NativeModules } from "react-native";

type SecuritySignals = {
  debugger: boolean;
  integrityCompromised: boolean;
  instrumentation: boolean;
  hookFramework: boolean;
  emulator: boolean;
};

const { SecurityNative } = NativeModules;

export async function getSecuritySignals(): Promise<SecuritySignals> {
  const s = (await SecurityNative.getSecuritySignals()) as Partial<SecuritySignals>;

  // ✅ defaults (prevents crash if native returns missing keys)
  return {
    debugger: !!s.debugger,
    integrityCompromised: !!s.integrityCompromised,
    instrumentation: !!s.instrumentation,
    hookFramework: !!s.hookFramework,
    emulator: !!s.emulator,
  };
}

export type Signals = SecuritySignals; 
