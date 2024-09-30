import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


//get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    if(!query || !userId || !isValidObjectId(userId)){
        throw new ApiError(400, "Please provide query and userId");
    }

    const videos = await Video.aggregate([
        {
            $match: {
                $or: [
                    { title: { $regex: query || "", $options: "i" }},
                    { description: {$regex: query || "", $options: "i" }}
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project:{
                thumbnail:1,
                videoFile:1,
                title:1,
                description:1,
                owner:{
                    fullName:1,
                    userName:1,
                    avatar:1
                }
            }
        },
        {
            $sort: {
                [sortBy || "createdAt"]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ])

    if(!videos){
        throw new ApiError(404, "No videos found");
    }

    return res.status(200).json(new ApiResponse(200, videos, "Videos retrieved successfully"))
})

const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    if(!title){
        throw new ApiError(400, "Please provide title.")
    }

    let videoLocalPath = null;
    if(req.files && Array.isArray(req.files.video) && req.files.video.length > 0){
        videoLocalPath = req.files.video[0].path;
    }
    if(!videoLocalPath) {
        throw new ApiError(400, "Please provide a video file.")
    }

    let thumbnailLocalPath = null;
    if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0){
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }
    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Please provide a thumbnail.")
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user._id,
    })

    const createdVideo = await Video.findById(video._id);
    if(!createdVideo){
        throw new ApiError(500, "Error creating video instance. Please try again")
    }

    return res.status(201).json(new ApiResponse(201, createdVideo, "Video uploaded successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        },
        { new: true }
    )
    if(!video){
        throw new ApiError(404, "Video with this id does not exist");
    }

    return res.status(200).json(new ApiResponse(200, video, "Video retrieved successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const { title, description } = req.body;

    let thumbnailLocalPath = null;
    if(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path;
    }

    if(!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "Please provide title, description or thumbnail to update")
    }

    const video = await Video.findById(videoId);
    if(thumbnailLocalPath){
        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if(newThumbnail) {
            await deleteFromCloudinary(video.thumbnail);
            video.thumbnail = newThumbnail.url;
        }
    }

    if(title){
        video.title = title;
    }
    if(description) {
        video.description = description;
    }

    await video.save();

    return res.status(200).json(new ApiResponse(200, "Video updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video with this id does not exist")
    }

    await deleteFromCloudinary(video.videoFile);
    await deleteFromCloudinary(video.thumbnail);

    const deletedVideo = await Video.findByIdAndDelete(videoId);
    if(!deletedVideo){
        throw new ApiError(500, "Error deleting video. Please try again")
    }

    return res.status(200).json(new ApiResponse(200, "Video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId || isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video with this id does not exist")
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res.status(200).json(new ApiResponse(200, "Publish status updated successfully"));
})

export {
    getAllVideos,
    uploadVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}