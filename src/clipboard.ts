import { execSync } from 'child_process';
import { platform } from 'os';

export function writeToClipboard(text: string): void {
  const osPlatform = platform();

  try {
    switch (osPlatform) {
      case 'win32':
        // Windows 使用 clip 命令
        execSync(`echo ${text} | clip`);
        break;
      case 'darwin':
        // macOS 使用 pbcopy
        execSync(`echo "${text}" | pbcopy`);
        break;
      case 'linux':
        // Linux 使用 xclip（需要先安装）
        execSync(`echo "${text}" | xclip -selection clipboard`);
        break;
      default:
        throw new Error('Unsupported OS platform');
    }
  } catch (error) {
    if (osPlatform === 'linux') {
      throw new Error('Linux requires xclip: sudo apt-get install xclip');
    }
    throw error;
  }
}