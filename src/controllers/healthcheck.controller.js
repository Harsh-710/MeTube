import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// healthcheck response that simply returns the OK status as json with a message
const healthcheck = asyncHandler(async (req, res) => {
    try {
        return res.status(200).json(new ApiResponse(200, "OK", "Healthcheck is OK"));
    } catch (err) {
        throw new ApiError(500, "Healthcheck Error", err);
    }
})

export { healthcheck }