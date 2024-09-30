import {isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const comments = await Comment.find({video: videoId})
        .populate("owner")
        .sort({createdAt: -1})
        .skip((page - 1) * limit)
        .limit(limit)

    if(!comments){
        throw new ApiError(404, "No comments found");
    }

    return res.status(200).json(new ApiResponse(200, comments, "Comments retrieved successfully"));
})

// add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;

    if(!content || !videoId){
        throw new ApiError(400, "Please provide content and video id");
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const comment = await Comment.create({ content, owner: req.user._id, video: videoId });
    if(!comment){
        throw new ApiError(500, "Error adding comment. Please try again");
    }

    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
})

// update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { commentId } = req.params;

    if(!content){
        throw new ApiError(400, "Please provide content and video id");
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: { content }
        },
        { new: true }
    )
    if(!comment){
        throw new ApiError(500, "Error adding comment. Please try again");
    }

    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
})

// delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id");
    }

    if(!req.user || !req.user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if(!deletedComment){
        throw new ApiError(404, "Comment not found");
    }

    return res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment,
}