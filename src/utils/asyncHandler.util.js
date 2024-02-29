export const asyncHandler = (requestHandler) => {
    return async(req, res, next) => {
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((error) => {
                console.log(error);
                res.status(error.code || 500).json({success:false, message: error.message})
            });
    }
}