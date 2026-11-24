import { Platform, NativeModules, NativeEventEmitter } from 'react-native';

export interface PipState {
  isActive: boolean;
  width: number;
  height: number;
}

let pipEmitter: NativeEventEmitter | null = null;

function getPipModule(): Record<string, unknown> | null {
  return NativeModules.PiPModule || null;
}

export async function isPipSupported(): Promise<boolean> {
  const mod = getPipModule();
  if (!mod) return false;
  try {
    return await (mod as { isPipSupported: () => Promise<boolean> }).isPipSupported();
  } catch {
    return false;
  }
}

export async function enterPipMode(width = 400, height = 225): Promise<boolean> {
  const mod = getPipModule();
  if (!mod) return false;
  try {
    await (mod as { enterPipMode: (w: number, h: number) => Promise<boolean> }).enterPipMode(
      width,
      height
    );
    return true;
  } catch {
    return false;
  }
}

export async function exitPipMode(): Promise<boolean> {
  const mod = getPipModule();
  if (!mod) return false;
  try {
    await (mod as { exitPipMode: () => Promise<boolean> }).exitPipMode();
    return true;
  } catch {
    return false;
  }
}

export function onPipStateChanged(callback: (state: PipState) => void): () => void {
  const mod = getPipModule();
  if (!mod || Platform.OS !== 'android') return () => {};
  if (!pipEmitter) pipEmitter = new NativeEventEmitter(NativeModules.PiPModule);
  const subscription = pipEmitter?.addListener('onPipStateChanged', callback);
  return () => {
    subscription?.remove();
  };
}
