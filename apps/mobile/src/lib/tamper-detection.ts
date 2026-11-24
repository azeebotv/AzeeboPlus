/** Jailbreak/Root & Tamper Detection — OWASP MASVS, TAA 53 */
import { Platform } from 'react-native';

export interface JailbreakCheck {
  name: string;
  detected: boolean;
  risk: 'low' | 'medium' | 'high';
  description: string;
}

export async function detectJailbreak(): Promise<JailbreakDetectionResult> {
  const checks: JailbreakCheck[] = [];
  if (Platform.OS === 'ios') {
    checks.push(...(await detectIOSJailbreak()));
  } else if (Platform.OS === 'android') {
    checks.push(...(await detectAndroidRoot()));
  }
  const detected = checks.some((c) => c.detected);
  const highRisk = checks.some((c) => c.detected && c.risk === 'high');
  return { jailbroken: detected, highRisk, checks, timestamp: new Date().toISOString() };
}

async function detectIOSJailbreak(): Promise<JailbreakCheck[]> {
  return [
    {
      name: 'Package Manager',
      detected: await nativeCheck('/Applications/Cydia.app'),
      risk: 'high',
      description: 'Jailbreak package manager detected',
    },
    {
      name: 'System Files',
      detected: (await nativeCheck('/bin/bash')) || (await nativeCheck('/etc/apt')),
      risk: 'medium',
      description: 'Suspicious system files found',
    },
    {
      name: 'Dynamic Instrumentation',
      detected: await nativeCheck('/usr/sbin/frida-server'),
      risk: 'high',
      description: 'Dynamic instrumentation tools detected',
    },
  ];
}

async function detectAndroidRoot(): Promise<JailbreakCheck[]> {
  return [
    {
      name: 'SU Binary',
      detected: (await nativeCheck('/system/bin/su')) || (await nativeCheck('/system/xbin/su')),
      risk: 'high',
      description: 'Root binary detected',
    },
    {
      name: 'Magisk',
      detected: await nativeCheck('/sbin/.magisk'),
      risk: 'high',
      description: 'Magisk root manager detected',
    },
    {
      name: 'Superuser App',
      detected: await nativeCheck('/system/app/Superuser.apk'),
      risk: 'high',
      description: 'Superuser app detected',
    },
  ];
}

export interface TamperCheck {
  name: string;
  tampered: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export async function detectTampering(): Promise<TamperDetectionResult> {
  const checks: TamperCheck[] = [
    {
      name: 'Code Signature',
      tampered: !(await nativeVerify('codeSignature')),
      severity: 'critical',
      description: 'Code signature verification failed',
    },
    {
      name: 'Debug Mode',
      tampered: __DEV__,
      severity: 'medium',
      description: 'Running in debug mode',
    },
    {
      name: 'Emulator',
      tampered: await nativeVerify('emulator'),
      severity: 'low',
      description: 'Running on emulator',
    },
    {
      name: 'Hooking Framework',
      tampered: await nativeVerify('hooking'),
      severity: 'critical',
      description: 'Dynamic hooking framework detected',
    },
  ];
  const tampered = checks.some((c) => c.tampered);
  const critical = checks.filter((c) => c.tampered && c.severity === 'critical');
  return {
    tampered,
    hasCritical: critical.length > 0,
    checks,
    timestamp: new Date().toISOString(),
  };
}

export interface JailbreakDetectionResult {
  jailbroken: boolean;
  highRisk: boolean;
  checks: JailbreakCheck[];
  timestamp: string;
}
export interface TamperDetectionResult {
  tampered: boolean;
  hasCritical: boolean;
  checks: TamperCheck[];
  timestamp: string;
}
export interface SecurityAction {
  action: 'allow' | 'warn' | 'block';
  reason: string;
  shouldReport: boolean;
  shouldClearSensitiveData: boolean;
}

async function nativeCheck(path: string): Promise<boolean> {
  try {
    const NM = require('react-native').NativeModules;
    return NM?.TamperDetection ? await NM.TamperDetection.checkFileExists(path) : false;
  } catch {
    return false;
  }
}

async function nativeVerify(check: string): Promise<boolean> {
  try {
    const NM = require('react-native').NativeModules;
    return NM?.TamperDetection ? await NM.TamperDetection[check]?.() : false;
  } catch {
    return false;
  }
}

export function handleSecurityDetection(
  jailbreak: JailbreakDetectionResult,
  tamper: TamperDetectionResult
): SecurityAction {
  if (tamper.hasCritical)
    return {
      action: 'block',
      reason: 'Critical tampering detected',
      shouldReport: true,
      shouldClearSensitiveData: true,
    };
  if (jailbreak.highRisk && tamper.tampered)
    return {
      action: 'block',
      reason: 'Jailbroken device with tampering',
      shouldReport: true,
      shouldClearSensitiveData: true,
    };
  if (jailbreak.jailbroken)
    return {
      action: 'warn',
      reason: 'Running on jailbroken/rooted device',
      shouldReport: true,
      shouldClearSensitiveData: false,
    };
  return {
    action: 'allow',
    reason: 'No security issues detected',
    shouldReport: false,
    shouldClearSensitiveData: false,
  };
}
