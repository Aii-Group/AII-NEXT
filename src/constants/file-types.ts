/** 文件下载 Content-Type 匹配 */
export const FileTypes = {
  Image: 'image/*',
  Video: 'video/*',
  Audio: 'audio/*',
  Pdf: 'application/pdf',
  Text: 'text/*',
  Excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  Word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  Ppt: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
} as const;

export type FileType = (typeof FileTypes)[keyof typeof FileTypes];
