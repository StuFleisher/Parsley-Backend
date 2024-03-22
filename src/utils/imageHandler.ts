import sharp from "sharp";
import { uploadMultiple } from "../api/s3";
import { createWorker } from 'tesseract.js';

type ResizedImages = {
  "sm": Buffer,
  "md": Buffer,
  "lg": Buffer,
};

class ImageHandler {

  /** Accepts an image buffer and a string basePath
   * Uploads multiple sizes of that image to S3 at the
   * given path (basePath-sm, basePath-md, basePath-lg)
  */
  static async uploadAllSizes(image: Buffer, basePath: string) {
    const resizedImages: ResizedImages = await this.getResized(image);
    const uploadParams = Object.keys(resizedImages)
      .map((key: "sm" | "md" | "lg") => (
        {
          buffer: resizedImages[key],
          path: `${basePath}-${key}`
        }
      ));
    await uploadMultiple(uploadParams);
  }

  /** Accepts an image buffer.  Converts that image to jpeg format and resizes it
   * into small, medium and large versions of the same image.
   */
  static async getResized(image: Buffer): Promise<ResizedImages> {

    const sm = await sharp(image).resize(100, 100).jpeg({ quality: 50 }).toBuffer();
    const md = await sharp(image).resize(600, 350).jpeg({ quality: 50 }).toBuffer();
    const lg = await sharp(image).resize(2000, 900).jpeg({ quality: 50 }).toBuffer();

    return { sm, md, lg };
  }

  static async getRecipeTextFromPhoto(image:Buffer){
    const worker = await createWorker('eng');
    const resp = await worker.recognize(image);
    console.log(resp.data.text);
    await worker.terminate();
    return resp.data.text;
  }

}

export default ImageHandler;