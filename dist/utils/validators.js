"use strict";
// // src/utils/validators.ts
// import { z } from 'zod';
// import { isValidPhoneNumber } from 'libphonenumber-js';
// import { ObjectId } from 'mongodb';
// /**
//  * Core Schemas
//  */
// export const objectIdSchema = z.string().refine(
//   val => ObjectId.isValid(val) && new ObjectId(val).toString() === val,
//   { message: 'Invalid ObjectId' }
// );
// export const emailSchema = z.string().email();
// export const passwordSchema = z.string().min(8).max(100);
// /**
//  * Phone Number Validation
//  */
// export const phoneSchema = z.string().refine(
//   val => isValidPhoneNumber(val),
//   { message: 'Invalid phone number' }
// );
// /**
//  * Date Validation
//  */
// export const dateSchema = z.union([
//   z.string().datetime(),
//   z.date(),
//   z.string().refine(val => !isNaN(Date.parse(val)))
// ]);
// /**
//  * Pagination Validator
//  */
// export const paginationSchema = z.object({
//   page: z.number().int().positive().default(1),
//   limit: z.number().int().positive().max(100).default(10),
// });
// /**
//  * File Upload Validator
//  */
// export const fileSchema = z.object({
//   fieldname: z.string(),
//   originalname: z.string(),
//   mimetype: z.string(),
//   buffer: z.instanceof(Buffer),
//   size: z.number().positive(),
// });
// /**
//  * Request Validators
//  */
// export const validateRequest = <T extends z.ZodTypeAny>(schema: T) => {
//   return (req: any, res: any, next: any) => {
//     try {
//       const result = schema.parse({
//         body: req.body,
//         query: req.query,
//         params: req.params,
//       });
//       req.validated = result;
//       next();
//     } catch (err) {
//       if (err instanceof z.ZodError) {
//         return res.status(400).json({
//           errors: err.errors.map(e => ({
//             path: e.path.join('.'),
//             message: e.message,
//           })),
//         });
//       }
//       next(err);
//     }
//   };
// };
// /**
//  * Commonly Used Validators
//  */
// export const authSchemas = {
//   register: z.object({
//     email: emailSchema,
//     password: passwordSchema,
//     name: z.string().min(2),
//     phone: phoneSchema.optional(),
//   }),
//   login: z.object({
//     email: emailSchema,
//     password: z.string().min(1, 'Password is required'),
//   }),
//   resetPassword: z.object({
//     token: z.string().min(1),
//     newPassword: passwordSchema,
//   }),
// };
// /**
//  * Utility Validators
//  */
// export const parseObjectId = (id: string | ObjectId): ObjectId => {
//   const result = objectIdSchema.safeParse(id);
//   if (!result.success) {
//     throw new Error('Invalid ObjectId');
//   }
//   return new ObjectId(id);
// };
