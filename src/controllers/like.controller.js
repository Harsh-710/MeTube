import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//toggle like on video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const like = await Like.findOne({ owner: req.user._id, video: videoId });

    if(like){
        const deletedLike = await Like.findByIdAndDelete(like._id);
        if(!deletedLike){
            throw new ApiError(500, "Error removing like. Please try again");
        }
        return res.status(200).json(new ApiResponse(200, null, "Like removed successfully"));
    }

    const newLike = await Like.create({ video: videoId, owner: req.user._id });
    if(!newLike){
        throw new ApiError(500, "Error liking video. Please try again");
    }

    return res.status(201).json(new ApiResponse(201, newLike, "Video liked successfully"));
})

//toggle like on comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id");
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const like = await Like.findOne({ owner: req.user._id, comment: commentId });

    if(like){
        const deletedLike = await Like.findByIdAndDelete(like._id);
        if(!deletedLike){
            throw new ApiError(500, "Error removing like. Please try again");
        }
        return res.status(200).json(new ApiResponse(200, null, "Like removed successfully"));
    }

    const newLike = await Like.create({ owner: req.user._id, comment: commentId });
    if(!newLike){
        throw new ApiError(500, "Error liking comment. Please try again");
    }

    return res.status(201).json(new ApiResponse(201, newLike, "Comment liked successfully"));
})

//toggle like on tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id");
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const like = await Like.findOne({ owner: req.user._id, tweet: tweetId });

    if(like){
        const deletedLike = await Like.findByIdAndDelete(like._id);
        if(!deletedLike){
            throw new ApiError(500, "Error removing like. Please try again");
        }
        return res.status(200).json(new ApiResponse(200, null, "Like removed successfully"));
    }

    const newLike = await Like.create({ owner: req.user._id, tweet: tweetId });
    if(!newLike){
        throw new ApiError(500, "Error liking tweet. Please try again");
    }

    return res.status(201).json(new ApiResponse(201, newLike, "Tweet liked successfully"));
})

//get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    // const likedVideos = await Like.find({ owner: req.user._id, video: { $ne: null } }).populate("video");

    const likedVideos = await Like.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(req.user._id), video: { $ne: null } }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {
            $unwind: "$video"
        },
        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "videoOwner"
            }
        },
        {
            $unwind: "$videoOwner"
        },
        {
            $project: {
                title: "$video.title",
                description: "$video.description",
                videoFile: "$video.videoFile",
                thumbnail: "$video.thumbnail",
                duration: "$video.duration",
                views: "$video.views",
                isPublished: "$video.isPublished",
                videoOwner: {
                    fullname: "$videoOwner.fullname",
                    username: "$videoOwner.username",
                    avatar: "$videoOwner.avatar"
                }
            }
        }
    ])

    if(!likedVideos){
        throw new ApiError(500, "Error fetching liked videos. Please try again");
    }

    return res.status(200).json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}