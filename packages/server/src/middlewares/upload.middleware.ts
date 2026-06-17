import { fileFilter, storage } from "@config/storage.config";
import multer from "multer";

export const upload_key = "file";

export const upload = multer({ storage, fileFilter });
