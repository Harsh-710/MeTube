import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// create a new tweet
const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if(!content) {
        throw new ApiError(400, "Content is required")
    }

    if(!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized")
    }

    const tweet = await Tweet.create({
        owner: req.user._id,
        content
    })

    if(!tweet) {
        throw new ApiError(500, "Failed to create tweet. Please try again");
    }

    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
})

// get user tweets
const getUserTweets = asyncHandler(async (req, res) => {
    const user = req.user;
    if(!user || !user._id){
        throw new ApiError(401, "Unauthorized");
    }

    // const tweets = await Tweet.find({ owner: user._id }).populate("owner").sort({ createdAt: -1 });

    const tweets = await Tweet.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(user._id) }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{
                    $project: {
                        username: 1,
                        fullname: 1,
                        avatar: 1,
                    }
                }]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $sort: { createdAt: -1 }
        }
    ])

    if(!tweets){
        throw new ApiError(500, "Failed to fetch tweets. Please try again");
    }

    return res.status(200).json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
})

// update tweet
const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body;

    if(!content){
        throw new ApiError(400, "Content is required");
    }

    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet ID");
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const tweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: req.user._id },
        { content },
        { new: true }
    )

    if (!tweet) {
        throw new ApiError(404, "Tweet not found or you're not authorized to update this tweet");
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
})

// delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet ID");
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const tweet = await Tweet.findOneAndDelete({ _id: tweetId, owner: req.user._id });

    if(!tweet){
        throw new ApiError(404, "Tweet not found or you're not authorized to delete this tweet");
    }

    return res.status(200).json(new ApiResponse(200, null, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}