/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Classwork {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  date: string; // YYYY-MM-DD
  semesterId: number; // 1 to 8
  subjectId: string;
  uploadedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  semesterId: number;
  createdAt: string;
}

export interface Semester {
  id: number;
  name: string;
  levelCode: string; // e.g., "LEVEL_01"
  description: string;
}
