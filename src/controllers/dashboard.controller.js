import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId

    const totalViews = await Video.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                }
            }
        }
    ])
    if(!totalViews){
        throw new ApiError(500, "Unable to get total views. Please try again later.");
    }

    const totalSubscribers = await Subscription.countDocuments({channel: channelId})
    if(!totalSubscribers){
        throw new ApiError(500, "Unable to get total subscribers. Please try again later.");
    }

    const totalVideos = await Video.countDocuments({channel: channelId})
    if(!totalVideos){
        throw new ApiError(500, "Unable to get total videos. Please try again later.");
    }

    const totalLikes = await Like.countDocuments({channel: channelId})
    if(!totalLikes){
        throw new ApiError(500, "Unable to get total likes. Please try again later.");
    }

    const response = new ApiResponse(
        200,
        {
            totalViews: totalViews[0].totalViews,
            totalSubscribers,
            totalVideos,
            totalLikes
        },
        "Channel stats fetched successfully."
    )

    return res.status(200).json(response);
})

// Get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId

    const videos = await Video.find({channel: channelId})
    if(!videos){
        throw new ApiError(500, "Unable to get videos. Please try again later.");
    }

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully."));
})

export {
    getChannelStats, 
    getChannelVideos
}