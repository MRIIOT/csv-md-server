import fs from 'fs-extra';
import path from 'path';

export async function ensureDirectoryExists(dirPath) {
  await fs.ensureDir(dirPath);
}

export async function getFileStats(filePath) {
  return await fs.stat(filePath);
}

export async function readFileContent(filePath) {
  return await fs.readFile(filePath, 'utf-8');
}

export async function writeFileContent(filePath, content) {
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function deleteFile(filePath) {
  await fs.remove(filePath);
}

export function getFileName(filePath) {
  return path.basename(filePath);
}

export function getFileExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}