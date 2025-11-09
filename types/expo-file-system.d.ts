declare module 'expo-file-system' {
    export const documentDirectory: string;
    export const cacheDirectory: string;

    export enum EncodingType {
        UTF8 = 'utf8',
        Base64 = 'base64',
    }

    export function readAsStringAsync(
        fileUri: string,
        options?: { encoding?: EncodingType }
    ): Promise<string>;

    export function writeAsStringAsync(
        fileUri: string,
        contents: string,
        options?: { encoding?: EncodingType }
    ): Promise<void>;

    export function deleteAsync(fileUri: string, options?: { idempotent?: boolean }): Promise<void>;

    export function getInfoAsync(fileUri: string, options?: { size?: boolean; md5?: boolean; exists?: boolean }): Promise<any>;

    export function copyAsync(options: { from: string; to: string }): Promise<void>;

    export function moveAsync(options: { from: string; to: string }): Promise<void>;

    export function downloadAsync(uri: string, fileUri: string): Promise<{ uri: string; status: number; headers: any; md5?: string }>;
}
