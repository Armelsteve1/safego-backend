// import { Injectable, BadRequestException } from '@nestjs/common';
// import {
//   S3Client,
//   PutObjectCommand,
//   ObjectCannedACL,
// } from '@aws-sdk/client-s3';
// import { v4 as uuid } from 'uuid';
// import * as path from 'path';
// import * as mime from 'mime-types';

// @Injectable()
// export class UploadService {
//   private s3: S3Client;
//   private bucketName: string;

//   constructor() {
//     this.bucketName = process.env.AWS_S3_BUCKET_NAME;

//     if (!this.bucketName) {
//       throw new Error('AWS_S3_BUCKET_NAME is not set in environment variables');
//     }

//     this.s3 = new S3Client({
//       region: process.env.AWS_REGION,
//       credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
//       },
//     });
//   }

//   /** ✅ Gère l’upload et retourne les URLs des fichiers */
//   async uploadFiles(files: Array<Express.Multer.File>): Promise<string[]> {
//     if (!files || files.length === 0) {
//       throw new BadRequestException('No files uploaded');
//     }

//     const urls: string[] = [];

//     for (const file of files) {
//       const fileExt = path.extname(file.originalname);
//       const contentType = mime.lookup(fileExt) || 'application/octet-stream';
//       const fileName = `vehicles/${uuid()}${fileExt}`;

//       const uploadParams = {
//         Bucket: this.bucketName,
//         Key: fileName,
//         Body: file.buffer,
//         ContentType: contentType,
//         ACL: ObjectCannedACL.public_read,
//       };

//       try {
//         await this.s3.send(new PutObjectCommand(uploadParams));
//         const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
//         urls.push(fileUrl);
//       } catch (error) {
//         console.error(`Failed to upload file ${file.originalname}: ${error}`);
//         throw new BadRequestException('File upload failed');
//       }
//     }

//     return urls;
//   }
// }
