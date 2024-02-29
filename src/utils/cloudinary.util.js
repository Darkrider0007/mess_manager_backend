import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import { extractPublicId } from "cloudinary-build-url"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/////////////////////////
// Uploads an image file
/////////////////////////

const uploadImageOnCloudinary = async (imageLocalPath) => {
    try {
      if(!imageLocalPath){
        throw new Error('Please upload an image');
      }

      const result = await cloudinary.uploader.upload(
        imageLocalPath,{
            resource_type: "auto",
        });

        fs.unlinkSync(imageLocalPath);          

        return result;
    } catch (error) {
      fs.unlinkSync(imageLocalPath);
      console.log("Error while uploading image to cloudinary: ", error);
      return null;
    }
};


////////////////////////////
// Deletes an image file //
//////////////////////////

const deleteImageFromCloudinary = async (url, resourceType = "image") => {
  try {
    if(!url){
      throw new Error('Please provide a valid image url');
    }

    const publicId = extractPublicId(url);
    const result = await cloudinary.uploader.destroy(publicId,{
        resource_type: resourceType,        
    });

    return result;
  } catch (error) {
    console.log("Error while deleting image from cloudinary: ", error);
    return null;
  }
};

export {uploadImageOnCloudinary, deleteImageFromCloudinary};