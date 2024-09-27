import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
    deleteFromCloudinary,
    uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullname } = req.body;

    // check if any of the fields are empty
    if (
        username?.trim === "" ||
        email?.trim === "" ||
        password?.trim === "" ||
        fullname?.trim === ""
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
        throw new ApiError(409, "User with similar email already exists");
    }
    // check if username already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
        throw new ApiError(409, "User with similar username already exists");
    }

    // check if password is valid
    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    // check if avatar and cover image are uploaded
    let avatarLocalPath = null;
    let coverImageLocalPath = null;
    if (
        req.files &&
        Array.isArray(req.files.avatar) &&
        req.files.avatar.length > 0
    ) {
        // get path of avatar
        avatarLocalPath = req.files.avatar[0].path;
    }
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        // get path of cover image
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // upload on cloudinary (if they don't exist then null will be returned)
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // create new user
    const user = await User.create({
        email,
        password,
        fullname,
        username: username.toLowerCase(),
        avatar: avatar?.url,
        coverImage: coverImage?.url,
    });

    // check if user is created and remove password and refreshToken from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while creating the user. Please try again."
        );
    }

    // return response
    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User created successfully"));
});

// generate access token and refresh token
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating tokens. Please try again."
        );
    }
};

// Login a user
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }
    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken, // sending tokens again for mobile apps as they don't accept cookies
                },
                "User logged in successfully"
            )
        );
});

// Logout a user
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }, // remove refreshToken from user document
        },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request. Please login");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(
                401,
                "Refresh Token expired. Please login again"
            );
        }

        const options = { httpOnly: true, secure: true };

        const { accessToken, newRefreshToken } =
            await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "New Refresh Token generated successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
});

// change user password
const changeUserPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid current password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

// get current user
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        );
});

// update user details
const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullname, username, email } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { fullname, username }, // only these fields are allowed to be updated
        },
        { new: true }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"));
});

// update user avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar) {
        throw new ApiError(
            500,
            "Something went wrong while uploading avatar to cloudinary. Please try again."
        );
    }

    // const user = await User.findByIdAndUpdate(
    //     req.user?._id,
    //     {
    //         $set: { avatar: avatar.url }
    //     },
    //     { new: true }
    // ).select("-password -refreshToken");

    const user = await User.findById(req.user?._id).select(
        "-password -refreshToken"
    );

    await deleteFromCloudinary(user.avatar); // delete previous avatar image

    user.avatar = avatar.url;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

// update user cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage) {
        throw new ApiError(
            500,
            "Something went wrong while uploading cover image to cloudinary. Please try again."
        );
    }

    const user = await User.findById(req.user?._id).select(
        "-password -refreshToken"
    );

    await deleteFromCloudinary(user.coverImage); // delete previous cover image

    user.coverImage = coverImage.url;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});

// get channel profile details
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
        throw new ApiError(400, "Username is required");
    }

    const channel = await User.aggregate([
        {
            $match: { username: username.toLowerCase() },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                createdAt: 1, // account creation date
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "Channel profile fetched successfully"
            )
        );
});

// get watch history of user
const getWatchHistory = asyncHandler(async (req, res) => {
    // const watchHistory = await User.findById(req.user?._id).select("watchHistory").populate("watchHistory.video");

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner", // gets first element from owner array (could've also used owner[0])
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].getWatchHistory,
                "Watch history fetched successfully"
            )
        );
});

// delete user account
const deleteUserAccount = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (!user || user.email !== email || user.username !== username) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid password");
    }

    await deleteFromCloudinary(user.avatar);
    await deleteFromCloudinary(user.coverImage);

    const deletedUser = await User.findByIdAndDelete(user._id);
    if (!deletedUser) {
        throw new ApiError(
            500,
            "Something went wrong while deleting user account. Please try again"
        );
    }

    const options = { httpOnly: true, secure: true };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User account deleted successfully"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    deleteUserAccount,
};
