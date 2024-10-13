import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {title, description = ""} = req.body
    if(!title) {
        throw new ApiError(400, "Title is required");
    }

    if(!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await Playlist.create({
        title,
        description,
        owner: req.user._id
    })

    if(!playlist) {
        throw new ApiError(500, "Failed to create playlist. Please try again");
    }

    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const user = req.user;
    if(!user || !user._id){
        throw new ApiError(401, "Unauthorized");
    }

    const playlists = await Playlist.find({ owner: user._id }).sort({ createdAt: -1 });

    if(!playlists) {
        throw new ApiError(404, "No playlists found");
    }

    return res.status(200).json(new ApiResponse(200, playlists, "Playlists retrieved successfully"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if(!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await Playlist.findById(playlistId).populate("videos");

    if(!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist retrieved successfully"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    playlist.videos = playlist.videos.filter(v => v.toString() !== videoId);
    await playlist.save();

    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist successfully"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if(!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, owner: req.user._id });
    if(!playlist) {
        throw new ApiError(404, "Playlist not found or you're not authorized to delete this playlist");
    }

    return res.status(200).json(new ApiResponse(200, null, "Playlist deleted successfully"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    
    if(!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    if(!req.user || !req.user._id) {
        throw new ApiError(401, "Unauthorized");
    }

    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { name, description },
        { new: true }
    )

    if(!playlist) {
        throw new ApiError(404, "Playlist not found or you're not authorized to update this playlist");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}