import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { ApiError } from "./ApiError.js";
dotenv.config();


(async function() {
    // Configuration
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    })
})();

// Function to upload a file to Cloudinary from local storage
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(localFilePath === null || localFilePath === undefined) {
            return null;
        }
        // upload file
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });

        // remove file from server after uploading
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        // remove file from server if not uploaded
        console.log("Error uploading file to Cloudinary: ", error);
        fs.unlinkSync(localFilePath)
        return null;
    }
}

// Function to extract public_id from the URL
const extractPublicIdFromUrl = (url) => {
    const urlParts = url.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1];    // e.g., 'sample_image.jpg'
    const fileName = fileNameWithExtension.split('.')[0];           // e.g., 'sample_image'
    return fileName;
};

// Function to delete an image from Cloudinary using its public URL
const deleteFromCloudinary = async (url) => {
    // we don't want to delete the default avatar and cover image
    if(url === "https://res.cloudinary.com/dkatvfrgz/image/upload/v1726828338/jlmnecggbhpsob4vnzh9.png" || url === "https://res.cloudinary.com/dkatvfrgz/image/upload/f_auto,q_auto/vodpns1kgfmy5fiwo2qw"){
        return { result: "ok" };
    }
    const publicId = extractPublicIdFromUrl(url);
    try {
        const response = await cloudinary.uploader.destroy(publicId);
        // console.log("File deleted successfully from Cloudinary:", response);
        return response;
    } catch (error) {
        throw new ApiError(500, "Error deleting file from Cloudinary: ", error);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
